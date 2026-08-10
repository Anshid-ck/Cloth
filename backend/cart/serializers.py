# cart/serializers.py
from rest_framework import serializers
from .models import Cart, CartItem
from products.serializers import ProductListSerializer
from products.models import ProductVariant, ColorVariant

class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer()
    variant_details = serializers.SerializerMethodField()
    color_variant_details = serializers.SerializerMethodField()
    total_price = serializers.SerializerMethodField()
    
    class Meta:
        model = CartItem
        fields = ['id', 'product', 'variant', 'variant_details', 'color_variant', 'color_variant_details', 'size', 'quantity', 'total_price']
    
    def get_variant_details(self, obj):
        """Legacy ProductVariant details"""
        if obj.variant:
            return {
                'size': obj.variant.size,
                'color': obj.variant.color.name if obj.variant.color else None,
                'sku': obj.variant.sku
            }
        return None
    
    def get_color_variant_details(self, obj):
        """New ColorVariant details"""
        if obj.color_variant:
            return {
                'id': obj.color_variant.id,
                'color_name': obj.color_variant.color_name,
                'color_hex': obj.color_variant.color_hex,
                'sku': obj.color_variant.sku,
                'size': obj.size,  # Size is stored separately on CartItem
                'primary_image': obj.color_variant.primary_image
            }
        return None
    
    def get_total_price(self, obj):
        return str(obj.get_total_price())

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_price = serializers.SerializerMethodField()
    total_quantity = serializers.SerializerMethodField()
    
    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_price', 'total_quantity', 'updated_at']
    
    def get_total_price(self, obj):
        return str(obj.get_total_price())
    
    def get_total_quantity(self, obj):
        return obj.get_total_quantity()
