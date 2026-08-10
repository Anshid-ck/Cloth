# orders/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.http import HttpResponse
from django.utils import timezone
from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings
from decimal import Decimal
import traceback
import logging

from .models import Order, OrderItem, OrderTracking
from .serializers import OrderListSerializer, OrderDetailSerializer, OrderCreateSerializer, OrderTrackingSerializer
from cart.models import Cart, CartItem
from products.models import Product
from payments.models import Payment

logger = logging.getLogger(__name__)

PAYMENT_METHOD_MAP = {
    'card': 'credit_card',
    'stripe': 'credit_card',
    'credit_card': 'credit_card',
    'debit_card': 'debit_card',
    'cod': 'cod',
    'upi': 'upi',
    'wallet': 'wallet',
    'razorpay': 'razorpay',
}


class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderDetailSerializer

    def destroy(self, request, *args, **kwargs):
        order = self.get_object()
        
        # Do not allow deletion of Paid, Processing, Shipped, or Delivered orders.
        if order.payment_status == 'completed' or order.status in ['processing', 'shipped', 'delivered']:
            return Response(
                {'error': 'Cannot delete an order that is Paid, Processing, Shipped, or Delivered.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        return super().destroy(request, *args, **kwargs)

    def get_queryset(self):
        qs = Order.objects.all() if self.request.user.is_staff else self.request.user.orders.all()
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
            
        return qs.order_by('-created_at')

    def get_serializer_class(self):
        if self.action in ['list', 'my_orders']:
            return OrderListSerializer
        return OrderDetailSerializer

    @action(detail=False, methods=['get'], url_path='my-orders')
    def my_orders(self, request):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def create_order(request):
    try:
        cart, _ = Cart.objects.get_or_create(user=request.user)
        if not cart.items.exists():
            return Response(
                {'error': 'Your cart is empty. Please add items before placing an order.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        address_id = request.data.get('address_id')
        if not address_id:
            return Response(
                {'error': 'Please select a delivery address.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            address = request.user.addresses.get(id=address_id)
        except Exception:
            return Response(
                {'error': 'Selected address not found. Please choose a valid address.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        raw_payment = request.data.get('payment_method', 'cod')
        payment_method = PAYMENT_METHOD_MAP.get(raw_payment, 'cod')

        cart_items = list(cart.items.select_related(
            'product', 'color_variant', 'variant'
        ).all())

        subtotal = Decimal('0')
        for item in cart_items:
            try:
                subtotal += item.get_total_price()
            except Exception as e:
                logger.error(f"Price calculation error for item {item.id}: {e}")
                return Response(
                    {'error': f'Price error for {item.product.name}. Please refresh and try again.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        shipping_charge = Decimal('0') if subtotal >= Decimal('1000') else Decimal('100')
        tax = round(subtotal * Decimal('0.05'), 2)
        total = subtotal + shipping_charge + tax

        order = Order.objects.create(
            user=request.user,
            shipping_address=address,
            shipping_name=address.name,
            shipping_phone=address.phone,
            shipping_email=request.user.email,
            shipping_address_line1=address.address_line1,
            shipping_address_line2=address.address_line2,
            shipping_city=address.city,
            shipping_state=address.state,
            shipping_pincode=address.pincode,
            subtotal=subtotal,
            shipping_charge=shipping_charge,
            tax=tax,
            total=total,
            payment_method=payment_method,
            payment_status='pending',
            status='pending',
        )

        for cart_item in cart_items:
            item_total = cart_item.get_total_price()
            unit_price = item_total / cart_item.quantity
            OrderItem.objects.create(
                order=order,
                product=cart_item.product,
                variant=cart_item.variant,
                color_variant=cart_item.color_variant,
                size=cart_item.size,
                quantity=cart_item.quantity,
                price=unit_price,
                total=item_total,
            )

        OrderTracking.objects.create(
            order=order,
            status='order_placed',
            description='Your order has been placed successfully.',
        )

        cart.items.all().delete()

        logger.info(f"Order {order.order_number} created for {request.user.email}")

        # ✅ For COD orders, send confirmation email immediately since there's
        #    no payment step — the order is confirmed at creation time.
        if payment_method == 'cod':
            _send_order_confirmation_email(order)

        serializer = OrderDetailSerializer(order)
        return Response(
            {'message': 'Order placed successfully!', 'order': serializer.data},
            status=status.HTTP_201_CREATED,
        )

    except Exception as e:
        traceback.print_exc()
        logger.error(f"Order creation failed for {request.user.email}: {e}")
        return Response(
            {'error': f'Order creation failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def track_order(request, order_id):
    try:
        order = Order.objects.get(id=order_id)
        if order.user != request.user and not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        tracking = order.tracking.all().order_by('-created_at')
        serializer = OrderTrackingSerializer(tracking, many=True)
        return Response(serializer.data)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_order(request, order_id):
    try:
        order = Order.objects.get(
            id=request.user.orders.filter(id=order_id).values_list('id', flat=True).first() or 0
        )
    except Order.DoesNotExist:
        return Response({'error': 'Order not found or access denied'}, status=status.HTTP_404_NOT_FOUND)

    try:
        if not request.user.is_staff and order.user != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        if order.status in ['cancelled', 'delivered', 'shipped']:
            return Response(
                {'error': f'Cannot cancel an order that is already {order.status}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order.status = 'cancelled'
        order.save()

        OrderTracking.objects.create(
            order=order,
            status='cancelled',
            description='Order has been cancelled by the customer.',
        )

        serializer = OrderDetailSerializer(order)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─── Admin: update order status ───────────────────────────────────────────────

VALID_TRANSITIONS = {
    'pending':    ['confirmed', 'cancelled'],
    'confirmed':  ['processing', 'cancelled'],
    'processing': ['shipped', 'cancelled'],
    'shipped':    ['delivered'],
    'delivered':  [],
    'cancelled':  [],
    'refunded':   [],
}

TRACKING_DESCRIPTIONS = {
    'confirmed':  'Your order has been confirmed and is being prepared.',
    'processing': 'Your order is currently being processed.',
    'shipped':    'Your order has been shipped.',
    'delivered':  'Your order has been delivered successfully. Thank you for shopping with us!',
    'cancelled':  'Your order has been cancelled.',
}


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def update_order_status(request, order_id):
    """
    Admin-only: update order status and send status notification email.
    PATCH /api/orders/<order_id>/update-status/
    Body: { "status": "shipped", "tracking_number": "DL123456" }
    """
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get('status')
    if not new_status:
        return Response({'error': '"status" field is required'}, status=status.HTTP_400_BAD_REQUEST)

    allowed = VALID_TRANSITIONS.get(order.status, [])
    if new_status not in allowed:
        return Response(
            {'error': f'Cannot move order from "{order.status}" to "{new_status}". '
                      f'Allowed next statuses: {allowed or ["none"]}'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    tracking_number = request.data.get('tracking_number', '').strip()
    if tracking_number:
        order.tracking_number = tracking_number

    order.status = new_status
    order.save()

    description = TRACKING_DESCRIPTIONS.get(new_status, f'Order status updated to {new_status}.')
    if new_status == 'shipped' and order.tracking_number:
        description = f'Your order has been shipped. Tracking number: {order.tracking_number}.'

    OrderTracking.objects.create(
        order=order,
        status=new_status,
        description=description,
    )

    _send_status_email(order, new_status)

    serializer = OrderDetailSerializer(order)
    return Response(serializer.data)


# ─── Email helpers ────────────────────────────────────────────────────────────

def _send_order_confirmation_email(order):
    """
    Send order confirmation email after successful payment or COD placement.
    Imported and called by payments/views.py for card payments.
    """
    if not order.shipping_email:
        return

    items_lines = []
    for item in order.items.select_related('product').all():
        product_name = item.product.name if item.product else 'Product'
        items_lines.append(f"  • {product_name} x{item.quantity}  —  ₹{item.total}")
    items_text = "\n".join(items_lines) if items_lines else "  (No items)"

    payment_label = {
        'credit_card': 'Credit / Debit Card',
        'debit_card':  'Debit Card',
        'cod':         'Cash on Delivery',
        'upi':         'UPI',
        'wallet':      'Wallet',
        'razorpay':    'Razorpay',
    }.get(order.payment_method, order.payment_method.replace('_', ' ').title())

    body = (
        f"Hi {order.shipping_name},\n\n"
        f"Thank you for your order! We've received it and it's being processed.\n\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"  ORDER SUMMARY\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"  Order Number : {order.order_number}\n"
        f"  Date         : {order.created_at.strftime('%d %b %Y, %I:%M %p')}\n"
        f"  Payment      : {payment_label}\n\n"
        f"  ITEMS\n"
        f"{items_text}\n\n"
        f"  ─────────────────────────────\n"
        f"  Subtotal     : ₹{order.subtotal}\n"
        f"  Shipping     : ₹{order.shipping_charge}\n"
        f"  Tax (5%)     : ₹{order.tax}\n"
        + (f"  Discount     : -₹{order.discount}\n" if order.discount else "")
        + f"  TOTAL        : ₹{order.total}\n\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"  DELIVERY ADDRESS\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"  {order.shipping_name}\n"
        f"  {order.shipping_phone}\n"
    )

    if order.shipping_address_line1:
        body += f"  {order.shipping_address_line1}"
        if order.shipping_address_line2:
            body += f", {order.shipping_address_line2}"
        body += f"\n  {order.shipping_city}, {order.shipping_state} - {order.shipping_pincode}\n"

    body += (
        f"\nWe'll send you another email once your order is shipped.\n\n"
        f"If you have any questions, reply to this email or contact our support.\n\n"
        f"Thank you for shopping with us!\n"
    )

    try:
        send_mail(
            subject=f"Order Confirmed - {order.order_number}",
            message=body,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'anshid5121@gmail.com'),
            recipient_list=[order.shipping_email],
            fail_silently=False,
        )
        logger.info(f"Confirmation email sent → {order.shipping_email} ({order.order_number})")
    except Exception as e:
        logger.error(f"Failed to send confirmation email for {order.order_number}: {e}")


def _send_status_email(order, new_status):
    """Send order status update emails (shipped, delivered, cancelled, etc.)"""
    templates = {
        'confirmed': {
            'subject': f'Order Confirmed - {order.order_number}',
            'body': (
                f"Hi {order.shipping_name},\n\n"
                f"Great news! Your order {order.order_number} has been confirmed.\n\n"
                f"Order Total: ₹{order.total}\n\n"
                f"We'll notify you once your order is shipped.\n\n"
                f"Thank you for shopping with us!"
            ),
        },
        'shipped': {
            'subject': f'Order Shipped - {order.order_number}',
            'body': (
                f"Hi {order.shipping_name},\n\n"
                f"Your order {order.order_number} is on its way!\n\n"
                + (f"Tracking Number: {order.tracking_number}\n\n" if order.tracking_number else "")
                + "Estimated delivery in 3-5 business days.\n\nThank you for your patience!"
            ),
        },
        'delivered': {
            'subject': f'Order Delivered - {order.order_number}',
            'body': (
                f"Hi {order.shipping_name},\n\n"
                f"Your order {order.order_number} has been delivered successfully.\n\n"
                f"We hope you love your purchase! Contact us if you have any questions.\n\n"
                f"Thank you for shopping with us!"
            ),
        },
        'cancelled': {
            'subject': f'Order Cancelled - {order.order_number}',
            'body': (
                f"Hi {order.shipping_name},\n\n"
                f"Your order {order.order_number} has been cancelled.\n\n"
                f"If you paid online, a refund will be processed within 5-7 business days.\n\n"
                f"Contact our support team if you have any questions."
            ),
        },
    }

    template = templates.get(new_status)
    if not template or not order.shipping_email:
        return

    try:
        send_mail(
            subject=template['subject'],
            message=template['body'],
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'anshid5121@gmail.com'),
            recipient_list=[order.shipping_email],
            fail_silently=False,
        )
        logger.info(f"Status email sent to {order.shipping_email} — {order.order_number} → {new_status}")
    except Exception as e:
        logger.error(f"Failed to send status email for {order.order_number}: {e}")


# ─── Packing Slip PDF ─────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def packing_slip_pdf(request, order_id):
    """Generate and return a packing-slip PDF for an order."""
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    # Only staff or the order owner can download
    if order.user != request.user and not request.user.is_staff:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    from .packing_slip import generate_packing_slip_pdf
    pdf_buffer = generate_packing_slip_pdf(order)

    disposition = request.query_params.get('disposition', 'inline')
    content_disp = f'{disposition}; filename="packing-slip-{order.order_number}.pdf"'

    response = HttpResponse(pdf_buffer.read(), content_type='application/pdf')
    response['Content-Disposition'] = content_disp
    return response