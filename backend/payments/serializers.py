# payments/serializers.py
from rest_framework import serializers
from .models import Payment, Refund
from orders.serializers import OrderDetailSerializer

class PaymentSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'order', 'order_number','stripe_payment_intent_id',
            'amount', 'currency', 'status', 'payment_method_type',
            'receipt_email','created_at', 'paid_at', 'error_message',
        ]
        read_only_fields = [
            'id', 
            'stripe_payment_intent_id',
            'stripe_client_secret', 
            'created_at', 
            'paid_at',
        ]

class PaymentCreateSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    receipt_email = serializers.EmailField(required=False)


class PaymentConfirmSerializer(serializers.Serializer):
    payment_intent_id = serializers.CharField()
    payment_method_id = serializers.CharField(required=False)


class RefundSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    payment_intent = serializers.CharField(
        source='payment.stripe_payment_intent_id',
        read_only=True
    )
    
    class Meta:
        model = Refund
        fields = [
            'id',
            'order',
            'order_number',
            'payment_intent',
            'amount',
            'status',
            'reason',
            'description',
            'created_at',
            'completed_at',
            'error_message',
        ]
        read_only_fields = [
            'id',
            'stripe_refund_id',
            'created_at',
            'completed_at',
        ]


class RefundRequestSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    reason = serializers.ChoiceField(
        choices=[
            'duplicate',
            'fraudulent',
            'requested_by_customer',
            'return',
            'product_defect',
            'order_cancelled',
            'other'
        ]
    )
    description = serializers.CharField(required=False, allow_blank=True)


class PaymentIntentResponseSerializer(serializers.Serializer):
    client_secret = serializers.CharField()
    payment_intent_id = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    currency = serializers.CharField()
    status = serializers.CharField()