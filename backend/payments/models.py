# payments/models.py
from django.db import models
from django.utils import timezone
from orders.models import Order


class Payment(models.Model):
    STATUS_CHOICES = (
        ('created', 'Created'),
        ('attempted', 'Attempted'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
        ('requires_action', 'Requires Action'),
    )

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="payments"
    )

    # Stripe fields
    stripe_payment_intent_id = models.CharField(max_length=255, unique=True)
    stripe_payment_method_id = models.CharField(max_length=255, null=True, blank=True)
    stripe_client_secret = models.CharField(max_length=255)
    stripe_charge_id = models.CharField(max_length=255, null=True, blank=True)

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default="usd")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="created")
    
    # Payment details
    payment_method_type = models.CharField(max_length=50, default="card")
    receipt_email = models.EmailField(null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    failed_at = models.DateTimeField(null=True, blank=True)

    # Store error/response data
    metadata = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['stripe_payment_intent_id']),
             models.Index(fields=['order']),
            models.Index(fields=['status']),
        ]
        
    def mark_succeeded(self, charge_id, metadata=None):
        """Mark the payment as succeeded."""
        self.stripe_charge_id = charge_id
        self.status = "succeeded"
        self.paid_at = timezone.now()
        if metadata:
            self.metadata = metadata
        self.save()
        
    def mark_failed(self, error_message, error_data=None):
        """Mark the payment as failed."""
        self.status = "failed"
        self.error_message = error_message
        self.failed_at = timezone.now()
        if error_data:
            self.metadata = error_data
        self.save()
        
    def mark_requires_action(self):
        """Mark payment as requiring action (3D  Secure, etc)."""
        self.status = "requires_action"
        self.save()
        
    def __str__(self):
        return f"Payment {self.stripe_payment_intent_id} - {self.status}"

class Refund(models.Model):
    STATUS_CHOICES = (
        ('requested', 'Requested'),
        ('processing', 'Processing'),
        ('succeeded', 'Succeeded'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    )
    
    REASON_CHOICES = (
        ('duplicate', 'Duplicate'),
        ('fraudulent', 'Fraudulent'),
        ('requested_by_customer', 'Requested by Customer'),
        ('return', 'Return'),
        ('product_defect', 'Product Defect'),
        ('order_cancelled', 'Order Cancelled'),
        ('other', 'Other'),
    )

    payment = models.ForeignKey(
        Payment,
        on_delete=models.CASCADE,
        related_name="refunds"
    )

    stripe_refund_id = models.CharField(max_length=255, null=True, blank=True, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="requested")
    reason = models.CharField(max_length=50, choices=REASON_CHOICES)
    description = models.TextField(null=True, blank=True)
    
    metadata = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'refunds'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['stripe_refund_id']),
            models.Index(fields=['status']),
        ]
    
    def mark_processing(self):
        """Mark the refund as processing."""
        self.status = "processing"
        self.save()
    
    def mark_succeeded(self, refund_id, metadata=None):
        """Mark refund as successfully proccessed."""
        self.stripe_refund_id = refund_id
        self.status = "succeeded"
        self.completed_at = timezone.now()
        if metadata:
            self.metadata = metadata
        self.save()
        
    def mark_failed(self, error_message, error_data=None):
        """Mark refund as failed."""
        self.status = "failed"
        self.error_message = error_message
        if error_data:
            self.metadata = error_data
        self.save()
        
    def __str__(self):
        return f"Refund {self.stripe_refund_id} - {self.status}"