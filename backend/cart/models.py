# cart/models.py
from django.db import models
from users.models import CustomUser
from products.models import Product, ProductVariant, ColorVariant
from django.core.validators import MinValueValidator

class Cart(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'carts'

    def __str__(self):
        return f"Cart - {self.user.email}"

    def get_total_price(self):
        return sum(item.get_total_price() for item in self.items.all())

    def get_total_quantity(self):
        return sum(item.quantity for item in self.items.all())

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    # Legacy variant system (keep for backwards compatibility)
    variant = models.ForeignKey(ProductVariant, on_delete=models.SET_NULL, null=True, blank=True)
    # New color variant system
    color_variant = models.ForeignKey(ColorVariant, on_delete=models.SET_NULL, null=True, blank=True)
    size = models.CharField(max_length=10, null=True, blank=True)  # S, M, L, XL, XXL
    quantity = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'cart_items'
        # Updated unique constraint to include size
        unique_together = ['cart', 'product', 'color_variant', 'size']

    def __str__(self):
        size_info = f" - {self.size}" if self.size else ""
        color_info = f" ({self.color_variant.color_name})" if self.color_variant else ""
        return f"{self.cart.user.email} - {self.product.name}{color_info}{size_info}"

    def get_total_price(self):
        price = self.product.discount_price or self.product.base_price
        # Use color variant price adjustment if available
        if self.color_variant:
            price += self.color_variant.price_adjustment
        elif self.variant:
            price += self.variant.price_adjustment
        return price * self.quantity
