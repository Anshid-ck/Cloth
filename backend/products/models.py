#  products/models.py
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.text import slugify

class Category(models.Model):
    CATEGORY_TYPES = (
        ('hoodies', 'Hoodies'),
        ('tshirts', 'T-Shirts'),
        ('shirts', 'Shirts'),
        ('bottomwear', 'Bottom Wear'),
        ('accessories', 'Accessories'),
        ('shoes', 'Shoes'),
    )
    
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    category_type = models.CharField(max_length=20, choices=CATEGORY_TYPES)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

class SizeTemplate(models.Model):
    CATEGORY_TYPES = (
        ('hoodies', 'Hoodies'),
        ('tshirts', 'T-Shirts'),
        ('shirts', 'Shirts'),
        ('bottomwear', 'Bottom Wear'),
        ('accessories', 'Accessories'),
        ('shoes', 'Shoes'),
    )
    
    category_type = models.CharField(max_length=20, choices=CATEGORY_TYPES, unique=True)
    sizes = models.JSONField(default=list)  # Example: ["XS", "S", "M", "L", "XL", "XXL"]
    
    class Meta:
        db_table = 'size_templates'

    def __str__(self):
        return f"{self.category_type} Sizes"

class ColorOption(models.Model):
    name = models.CharField(max_length=50, unique=True)
    hex_code = models.CharField(max_length=7)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'color_options'
        ordering = ['name']

    def __str__(self):
        return self.name

class Product(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    brand = models.CharField(max_length=100, blank=True)
    
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    discount_percentage = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    
    material = models.CharField(max_length=100, blank=True)
    care_instructions = models.TextField(blank=True)
    
    # Product Attributes for filtering
    FABRIC_CHOICES = [
        ('cotton', 'Cotton'),
        ('fleece', 'Fleece'),
        ('polyester', 'Polyester'),
        ('wool', 'Wool'),
        ('denim', 'Denim'),
        ('linen', 'Linen'),
        ('blend', 'Blend'),
    ]
    FIT_CHOICES = [
        ('regular', 'Regular'),
        ('slim', 'Slim Fit'),
        ('oversized', 'Oversized'),
        ('relaxed', 'Relaxed'),
    ]
    SLEEVE_CHOICES = [
        ('full', 'Full Sleeve'),
        ('half', 'Half Sleeve'),
        ('sleeveless', 'Sleeveless'),
    ]
    SEASON_CHOICES = [
        ('summer', 'Summer'),
        ('winter', 'Winter'),
        ('all', 'All Season'),
    ]
    
    fabric = models.CharField(max_length=20, choices=FABRIC_CHOICES, blank=True)
    fit = models.CharField(max_length=20, choices=FIT_CHOICES, blank=True)
    sleeve = models.CharField(max_length=20, choices=SLEEVE_CHOICES, blank=True)
    season = models.CharField(max_length=20, choices=SEASON_CHOICES, blank=True)
    
    total_stock = models.IntegerField(default=0)
    
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0, validators=[MinValueValidator(0), MaxValueValidator(5)])
    reviews_count = models.IntegerField(default=0)
    
    is_featured = models.BooleanField(default=False)
    is_new_arrival = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    background_color = models.CharField(max_length=7, default='#f5ebe0', blank=True)  # Card background color
    category_attributes = models.JSONField(default=dict, blank=True)  # Category-specific attributes (fit, material, collar, etc.)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'products'
        verbose_name_plural = 'Products'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['category']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        if self.discount_price:
            self.discount_percentage = int(((self.base_price - self.discount_price) / self.base_price) * 100)
        super().save(*args, **kwargs)

class ProductVariant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    sku = models.CharField(max_length=100, unique=True)
    size = models.CharField(max_length=50)
    color = models.ForeignKey(ColorOption, on_delete=models.SET_NULL, null=True)
    quantity = models.IntegerField(default=0)
    price_adjustment = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'product_variants'
        unique_together = ['sku', 'size', 'color']
        ordering = ['size', 'color']

    def __str__(self):
        return f"{self.product.name} - {self.size} {self.color}"

class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.URLField(max_length=500)  # Store Cloudinary URL directly
    alt_text = models.CharField(max_length=255, blank=True)
    is_primary = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'product_images'
        ordering = ['order']

    def __str__(self):
        return f"{self.product.name} - Image"


# ============================================
# COLOR VARIANT SYSTEM
# ============================================

class ColorVariant(models.Model):
    """
    Each color of a product is a variant.
    Each variant has its own images and size-based stock.
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='color_variants')
    
    # Custom color for this variant (not predefined)
    color_name = models.CharField(max_length=50)  # e.g., "Navy Blue", "Forest Green"
    color_hex = models.CharField(max_length=7, default='#000000')  # e.g., "#1E3A5F"
    
    sku = models.CharField(max_length=100, unique=True)
    price_adjustment = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # +/- from base price
    is_default = models.BooleanField(default=False)  # Show this variant by default
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'color_variants'
        ordering = ['-is_default', 'color_name']
        unique_together = ['product', 'color_name']

    def __str__(self):
        return f"{self.product.name} - {self.color_name}"
    
    @property
    def total_stock(self):
        return sum(stock.quantity for stock in self.size_stocks.all())
    
    @property
    def primary_image(self):
        img = self.variant_images.filter(is_primary=True).first()
        if not img:
            img = self.variant_images.first()
        return img.image if img else None


class VariantImage(models.Model):
    """
    Images for a specific color variant.
    Each variant can have multiple images.
    """
    variant = models.ForeignKey(ColorVariant, on_delete=models.CASCADE, related_name='variant_images')
    image = models.URLField(max_length=500)  # Cloudinary URL
    alt_text = models.CharField(max_length=255, blank=True)
    is_primary = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'variant_images'
        ordering = ['order']

    def __str__(self):
        return f"{self.variant.color_name} - Image {self.order}"


class SizeStock(models.Model):
    """
    Stock per size for a color variant.
    Sizes are predefined per category.
    Each size+color combo gets its own unique SKU.
    """
    variant = models.ForeignKey(ColorVariant, on_delete=models.CASCADE, related_name='size_stocks')
    size = models.CharField(max_length=10)  # S, M, L, XL, XXL
    sku = models.CharField(max_length=120, unique=True, blank=True)
    quantity = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'size_stocks'
        unique_together = ['variant', 'size']
        ordering = ['size']

    def __str__(self):
        return f"{self.variant.color_name} - Size {self.size} ({self.quantity}) [{self.sku}]"

    def save(self, *args, **kwargs):
        if not self.sku and self.variant_id:
            self.sku = f"{self.variant.sku}-{self.size}"
        super().save(*args, **kwargs)


class Banner(models.Model):
    title = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)  # Hero slide description
    image = models.URLField(max_length=500, blank=True)  # Cloudinary URL
    link = models.CharField(max_length=255, blank=True)  # Internal link like /shop
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'banners'
        ordering = ['order']

    def __str__(self):
        return self.title
    
class BottomStyle(models.Model):
    title = models.CharField(max_length=100)
    subtitle = models.CharField(max_length=200, blank=True, null=True)
    image = models.URLField(max_length=500, blank=True, null=True)  # Cloudinary URL
    link = models.CharField(max_length=200, blank=True, null=True)  # Internal link like /shop?category=pants
    background_color = models.CharField(max_length=7, default='#ffffff', blank=True)  # Hex color code
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'bottom_styles'
        ordering = ['order']
        
    def __str__(self):
        return self.title
    
class CategoryCard(models.Model):
    title = models.CharField(max_length=150)
    subtitle = models.CharField(max_length=250, blank=True)
    image = models.URLField(max_length=500, blank=True)  # Cloudinary URL
    background_color = models.CharField(max_length=7, default='#1a1a1a', blank=True)  # Hex color code
    link = models.CharField(max_length=255, blank=True)  # e.g. /shop?category=hoodies
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'category_cards'
        ordering = ['order']

    def __str__(self):
        return self.title


class MensHoodieGrid(models.Model):
    """
    Admin-manageable grid for Men's Hoodies section on homepage.
    Position 1: Large banner (spans 5 cols, 3 rows)
    Position 2-4: Single column cards (1 col, 2 rows each)
    Position 5: Wide card (2 cols, 2 rows)
    """
    POSITION_CHOICES = [
        (1, 'Main Banner (Large - Top)'),
        (2, 'Card 2 (Bottom Left)'),
        (3, 'Card 3 (Bottom Center-Left)'),
        (4, 'Card 4 (Bottom Center-Right)'),
        (5, 'Card 5 (Wide - Bottom Right)'),
    ]
    
    title = models.CharField(max_length=150)
    image = models.URLField(max_length=500, blank=True)  # Cloudinary URL
    link = models.CharField(max_length=255, blank=True)  # e.g., /shop?category=hoodies
    position = models.IntegerField(choices=POSITION_CHOICES, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'mens_hoodie_grid'
        ordering = ['position']
        verbose_name = "Men's Hoodie Grid Item"
        verbose_name_plural = "Men's Hoodie Grid Items"

    def __str__(self):
        return f"{self.get_position_display()} - {self.title}"


class JacketsGrid(models.Model):
    """
    Admin-manageable grid for Jackets section on homepage.
    Layout:
    Position 1: Large left card (full height, spans 6 rows)
    Position 2: Top middle card
    Position 3: Top right card
    Position 4: Bottom middle card
    Position 5: Bottom right card
    """
    POSITION_CHOICES = [
        (1, 'Large Left Card (Full Height)'),
        (2, 'Top Middle Card'),
        (3, 'Top Right Card'),
        (4, 'Bottom Middle Card'),
        (5, 'Bottom Right Card'),
    ]
    
    title = models.CharField(max_length=150)
    subtitle = models.CharField(max_length=250, blank=True)
    image = models.URLField(max_length=500, blank=True)  # Cloudinary URL
    background_color = models.CharField(max_length=7, default='#ffffff', blank=True)
    link = models.CharField(max_length=255, blank=True)  # e.g., /shop?category=jackets
    position = models.IntegerField(choices=POSITION_CHOICES, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'jackets_grid'
        ordering = ['position']
        verbose_name = "Jackets Grid Item"
        verbose_name_plural = "Jackets Grid Items"

    def __str__(self):
        return f"{self.get_position_display()} - {self.title}"


class PromotionalBanner(models.Model):
    """
    Admin-manageable promotional banner for homepage.
    Appears below the Jackets Grid section.
    Supports responsive design with customizable text and background.
    """
    title = models.CharField(max_length=200)  # Main heading e.g., "BLACK FRIDAY"
    subtitle = models.CharField(max_length=200, blank=True)  # Secondary text e.g., "BEST PRICES OF THE YEAR"
    discount_text = models.CharField(max_length=100, blank=True)  # e.g., "UP TO 70% OFF"
    description = models.TextField(blank=True)  # Additional description text
    button_text = models.CharField(max_length=50, default='Shop Now')
    button_link = models.CharField(max_length=255, default='/shop')
    image = models.URLField(max_length=500, blank=True)  # Cloudinary URL
    background_color = models.CharField(max_length=7, default='#f8f8f8', blank=True)  # Light white default
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'promotional_banners'
        ordering = ['order']
        verbose_name = "Promotional Banner"
        verbose_name_plural = "Promotional Banners"

    def __str__(self):
        return self.title


class TshirtGrid(models.Model):
    """
    Admin-manageable T-shirt grid section on homepage.
    Appears below the promotional banner.
    Supports background color for each item (default white).
    """
    title = models.CharField(max_length=150)
    subtitle = models.CharField(max_length=250, blank=True)
    image = models.URLField(max_length=500, blank=True)  # Cloudinary URL
    link = models.CharField(max_length=255, default='/shop?category=tshirts', blank=True)
    background_color = models.CharField(max_length=7, default='#ffffff', blank=True)  # Default white
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tshirt_grid'
        ordering = ['order']
        verbose_name = "T-Shirt Grid Item"
        verbose_name_plural = "T-Shirt Grid Items"

    def __str__(self):
        return self.title


class ShoesGrid(models.Model):
    """
    Admin-manageable Shoes section on homepage.
    Features banner-style header with image row.
    """
    title = models.CharField(max_length=150, blank=True, null=True)
    image = models.URLField(max_length=500, blank=True)  # Cloudinary URL
    link = models.CharField(max_length=255, default='/shop?category=shoes', blank=True)
    background_color = models.CharField(max_length=7, default='#e5e5e5', blank=True)  # Light gray default
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'shoes_grid'
        ordering = ['order']
        verbose_name = "Shoes Grid Item"
        verbose_name_plural = "Shoes Grid Items"

    def __str__(self):
        return self.title


class ShoesCard(models.Model):
    """
    Admin-manageable Shoes Card section on homepage.
    Displays trending shoes in a modern card layout below the Shoes Grid.
    """
    title = models.CharField(max_length=150)
    subtitle = models.CharField(max_length=250, blank=True)
    image = models.URLField(max_length=500, blank=True)  # Cloudinary URL
    price = models.CharField(max_length=50, blank=True)  # Display price like "₹1,999"
    link = models.CharField(max_length=255, default='/shop?category=shoes', blank=True)
    background_color = models.CharField(max_length=7, default='#ffffff', blank=True)
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'shoes_cards'
        ordering = ['order']
        verbose_name = "Shoes Card"
        verbose_name_plural = "Shoes Cards"

    def __str__(self):
        return self.title


class RelatedProduct(models.Model):
    """
    Admin-managed related product relationships.
    Allows admins to manually pin products as related to each other.
    """
    product = models.ForeignKey(
        Product, 
        on_delete=models.CASCADE, 
        related_name='related_products',
        help_text="The main product"
    )
    related = models.ForeignKey(
        Product, 
        on_delete=models.CASCADE, 
        related_name='related_to',
        help_text="The related product to recommend"
    )
    position = models.IntegerField(default=0, help_text="Order position (lower = higher priority)")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'related_products'
        unique_together = ['product', 'related']
        ordering = ['position', '-created_at']
        verbose_name = "Related Product"
        verbose_name_plural = "Related Products"
        indexes = [
            models.Index(fields=['product', 'is_active']),
        ]

    def __str__(self):
        return f"{self.product.name} → {self.related.name}"

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.product == self.related:
            raise ValidationError("A product cannot be related to itself.")
