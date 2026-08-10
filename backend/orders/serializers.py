# orders/serializers.py
import os
from rest_framework import serializers
from .models import Order, OrderItem, OrderTracking
from products.serializers import ProductListSerializer
from users.serializers import UserAddressSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.SerializerMethodField()
    variant_details = serializers.SerializerMethodField()
    color_variant_details = serializers.SerializerMethodField()
    item_sku = serializers.SerializerMethodField()
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product_name', 'product_image', 'variant', 'variant_details', 'color_variant', 'color_variant_details', 'size', 'quantity', 'price', 'total', 'item_sku']
    
    def get_product_image(self, obj):
        if not obj.product:
            return None

        def get_image_url(image_field):
            if not image_field:
                return None
            url = str(image_field)

            if url.startswith('http'):
                return url
            cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME','dayy6ryhw')
            return f'https://res.cloudinary.com/{cloud_name}/image/upload/{url}'
        
        if obj.color_variant:
            img = obj.color_variant.variant_images.filter(is_primary=True).first()
            if not img:
                img = obj.color_variant.variant_images.first()
            if img:
                return get_image_url(img.image)
        img = obj.product.images.filter(is_primary=True).first()
        if not img:
            img = obj.product.images.first()
        if img:
            return get_image_url(img.image)
        return None

    def get_variant_details(self, obj):
        if obj.variant:
            return {
                'size': obj.variant.size,
                'color': obj.variant.color.name if obj.variant.color else None,
                'sku': obj.variant.sku,
            }
        return None

    def get_color_variant_details(self, obj):
        if obj.color_variant:
            return {
                'color_name': obj.color_variant.color_name,
                'color_hex': obj.color_variant.color_hex,
                'sku': obj.color_variant.sku,
            }
        return None

    def get_item_sku(self, obj):
        """Resolve the per-size SKU: SizeStock → ColorVariant → ProductVariant."""
        if obj.color_variant and obj.size:
            size_stock = obj.color_variant.size_stocks.filter(size=obj.size).first()
            if size_stock and size_stock.sku:
                return size_stock.sku
        if obj.color_variant:
            return obj.color_variant.sku
        if obj.variant:
            return obj.variant.sku
        return None


class OrderTrackingSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderTracking
        fields = ['id', 'status', 'description', 'created_at']

class OrderListSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    # Flattened address fields for frontend compatibility
    shipping_address_line1 = serializers.CharField(read_only=True)
    shipping_address_line2 = serializers.CharField(read_only=True)
    shipping_city = serializers.CharField(read_only=True)
    shipping_state = serializers.CharField(read_only=True)
    shipping_pincode = serializers.CharField(read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'total', 'subtotal', 'shipping_charge', 
            'tax', 'discount', 'payment_status', 'user_email', 'created_at', 'items',
            'shipping_name', 'shipping_phone', 'shipping_email',
            'shipping_address_line1', 'shipping_address_line2', 'shipping_city',
            'shipping_state', 'shipping_pincode'
        ]

class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    tracking = OrderTrackingSerializer(many=True, read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'shipping_name', 'shipping_phone', 'shipping_email',
            'shipping_address_line1', 'shipping_address_line2', 'shipping_city',
            'shipping_state', 'shipping_pincode', 'subtotal', 'shipping_charge', 'tax', 'discount', 'total',
            'status', 'payment_status', 'payment_method', 'transaction_id',
            'tracking_number', 'notes', 'items', 'tracking', 'created_at'
        ]

class OrderCreateSerializer(serializers.Serializer):
    address_id = serializers.IntegerField()
    payment_method = serializers.CharField()