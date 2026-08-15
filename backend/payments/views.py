import stripe
import logging
from decimal import Decimal
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from .models import Payment, Refund
from .serializers import (
    PaymentSerializer,
    PaymentCreateSerializer,
    PaymentConfirmSerializer,
    RefundSerializer,
    RefundRequestSerializer,
    PaymentIntentResponseSerializer,
)
from orders.models import Order, OrderTracking
# ✅ Import shared confirmation email helper from orders app
from orders.views import _send_order_confirmation_email

logger = logging.getLogger(__name__)
stripe.api_key = settings.STRIPE_SECRET_KEY


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payment(request):
    """
    Create a Stripe PaymentIntent for an order.
    Demo test cards:
    - 4242 4242 4242 4242 (Success)
    - 5555 5555 5555 4444 (Visa)
    - 4000 0000 0000 9995 (3D Secure Required)
    - 4000 0000 0000 0002 (Payment declined)
    - 4000 0025 0000 3155 (Card declined - Expired)
    """
    try:
        serializer = PaymentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order_id = serializer.validated_data['order_id']
        receipt_email = serializer.validated_data.get('receipt_email', request.user.email)

        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        existing_payment = Payment.objects.filter(
            order=order,
            status__in=['created', 'succeeded']
        ).first()

        if existing_payment and existing_payment.status == 'succeeded':
            return Response(
                {'error': 'Order already paid'},
                status=status.HTTP_400_BAD_REQUEST
            )

        intent = stripe.PaymentIntent.create(
            amount=int(order.total * 100),
            currency='inr',
            receipt_email=receipt_email,
            metadata={
                'order_id': order.id,
                'order_number': order.order_number,
                'user_id': request.user.id,
            },
            statement_descriptor_suffix='Order'
        )

        payment, created = Payment.objects.get_or_create(
            stripe_payment_intent_id=intent['id'],
            defaults={
                'order': order,
                'stripe_client_secret': intent['client_secret'],
                'amount': order.total,
                'currency': 'inr',
                'receipt_email': receipt_email,
                'status': 'created',
                'metadata': {'intent_created': True}
            }
        )

        logger.info(f"PaymentIntent created: {intent['id']} for order {order.order_number}")

        response_serializer = PaymentIntentResponseSerializer({
            'client_secret': intent['client_secret'],
            'payment_intent_id': intent['id'],
            'amount': order.total,
            'currency': 'inr',
            'status': intent['status']
        })

        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"Error creating payment: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_payment(request):
    """Confirm payment after client-side Stripe processing and send confirmation email."""
    try:
        serializer = PaymentConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payment_intent_id = serializer.validated_data['payment_intent_id']

        try:
            payment = Payment.objects.get(stripe_payment_intent_id=payment_intent_id)
        except Payment.DoesNotExist:
            return Response(
                {'error': 'Payment not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if payment.order.user != request.user:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )

        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        intent_status = intent.status

        if intent_status == 'succeeded':
            charge_id = intent.latest_charge
            payment.mark_succeeded(charge_id)
            _update_order_status(payment.order, 'confirmed', 'payment_confirmed')
 
            serializer = PaymentSerializer(payment)
            return Response(serializer.data)

        elif intent_status == 'requires_action':
            payment.mark_requires_action()
            return Response({
                'status': 'requires_action',
                'client_secret': payment.stripe_client_secret,
                'message': '3D Secure or additional authentication required'
            }, status=status.HTTP_200_OK)

        elif intent_status == 'requires_payment_method':
            return Response(
                {'error': 'Payment method required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        else:
            return Response(
                {'error': f'Unexpected payment status: {intent_status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    except Exception as e:
        logger.error(f"Error confirming payment: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_refund(request):
    """Request a refund for an order."""
    try:
        serializer = RefundRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order_id = serializer.validated_data['order_id']
        reason = serializer.validated_data['reason']
        description = serializer.validated_data.get('description', '')

        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        payment = Payment.objects.filter(order=order, status='succeeded').first()
        if not payment:
            return Response(
                {'error': 'No successful payment found for this order'},
                status=status.HTTP_400_BAD_REQUEST
            )

        existing_refund = Refund.objects.filter(
            payment=payment,
            status__in=['processing', 'succeeded']
        ).first()

        if existing_refund:
            return Response(
                {'error': 'Refund already in process for this order'},
                status=status.HTTP_400_BAD_REQUEST
            )

        refund = Refund.objects.create(
            payment=payment,
            amount=order.total,
            reason=reason,
            description=description,
            status='requested'
        )

        logger.info(f"Refund requested for order {order.order_number}: {refund.id}")
        serializer = RefundSerializer(refund)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"Error requesting refund: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_refund(request, refund_id):
    """Get refund details."""
    try:
        refund = Refund.objects.get(id=refund_id, payment__order__user=request.user)
        serializer = RefundSerializer(refund)
        return Response(serializer.data)
    except Refund.DoesNotExist:
        return Response(
            {'error': 'Refund not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_payment(request, order_id):
    """Get payment details for an order."""
    try:
        order = Order.objects.get(id=order_id, user=request.user)
        payment = Payment.objects.filter(order=order).first()

        if not payment:
            return Response(
                {'error': 'No payment found for this order'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = PaymentSerializer(payment)
        return Response(serializer.data)
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@csrf_exempt
def stripe_webhook(request):
    """Handle Stripe webhooks for payment confirmations and refunds."""
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')

    try:
        event = stripe.Webhook.construct_event(
            payload,
            sig_header,
            settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        logger.error(f"Invalid webhook payload: {str(e)}")
        return JsonResponse({'error': 'Invalid payload'}, status=400)
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid webhook signature: {str(e)}")
        return JsonResponse({'error': 'Invalid signature'}, status=400)

    if event['type'] == 'payment_intent.succeeded':
        _handle_payment_succeeded(event['data']['object'])
    elif event['type'] == 'payment_intent.payment_failed':
        _handle_payment_failed(event['data']['object'])
    elif event['type'] == 'charge.refunded':
        _handle_charge_refunded(event['data']['object'])
    elif event['type'] == 'charge.dispute.created':
        _handle_dispute_created(event['data']['object'])

    return JsonResponse({'status': 'success'})


# ─── Webhook handlers ─────────────────────────────────────────────────────────

def _handle_payment_succeeded(intent):
    """Called by Stripe webhook — also covers mobile/SDK flows that skip confirm_payment."""
    try:
        payment = Payment.objects.get(stripe_payment_intent_id=intent['id'])
        if payment.status != 'succeeded':
            charge_id = intent.get('latest_charge')
            payment.mark_succeeded(charge_id)
            _update_order_status(payment.order, 'confirmed', 'payment_confirmed')
            # ✅ Send confirmation email via webhook (safety net)
            _send_order_confirmation_email(payment.order)
    except Payment.DoesNotExist:
        logger.warning(f"Payment record not found for intent: {intent['id']}")


def _handle_payment_failed(intent):
    """Handle failed payment."""
    try:
        payment = Payment.objects.get(stripe_payment_intent_id=intent['id'])
        error_msg = intent.get('last_payment_error', {}).get('message', 'Payment failed')
        payment.mark_failed(error_msg, error_data=intent)
        
        # Update order payment status
        payment.order.payment_status = 'failed'
        payment.order.save()
        
        logger.error(f"Payment failed: {intent['id']} - {error_msg}")
    except Payment.DoesNotExist:
        logger.warning(f"Payment record not found for intent: {intent['id']}")


def _handle_charge_refunded(charge):
    """Handle refunded charge."""
    try:
        payment = Payment.objects.get(stripe_charge_id=charge['id'])
        refund = Refund.objects.filter(payment=payment, status='processing').first()
        if refund:
            refund_id = charge['refunds']['data'][0]['id'] if charge['refunds']['data'] else None
            refund.mark_succeeded(refund_id)
            logger.info(f"Refund succeeded: {refund_id}")
    except Payment.DoesNotExist:
        logger.warning(f"Payment record not found for charge: {charge['id']}")


def _handle_dispute_created(dispute):
    """Handle chargeback/dispute."""
    logger.warning(f"Dispute created for charge: {dispute['charge']}")


# ─── Order status helper ──────────────────────────────────────────────────────

def _update_order_status(order, new_status, tracking_status):
    """Update order status, payment_status, and add a tracking entry."""
    order.status = new_status
    order.payment_status = 'completed'
    order.payment_date = timezone.now()
    order.save()

    OrderTracking.objects.create(
        order=order,
        status=tracking_status,
        description='Payment confirmed successfully'
    )