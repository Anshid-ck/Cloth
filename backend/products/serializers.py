#  products/serializers.py
from rest_framework import serializers
from .models import (
    Category, Product, ProductVariant, ProductImage,
    ColorOption, SizeTemplate, Banner, BottomStyle, CategoryCard,
    ColorVariant, VariantImage, SizeStock, MensHoodieGrid, JacketsGrid,
    PromotionalBanner, TshirtGrid, ShoesGrid, ShoesCard, RelatedProduct
)

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'category_type', 'image', 'description']

class ColorOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ColorOption
        fields = ['id', 'name', 'hex_code']

class SizeTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SizeTemplate
        fields = ['id', 'category_type', 'sizes']

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'product', 'image', 'alt_text', 'is_primary', 'order']
        extra_kwargs = {
            'product': {'required': True},
            'image': {'required': True},
        }


class ProductVariantSerializer(serializers.ModelSerializer):
    color_name = serializers.CharField(source='color.name', read_only=True)
    
    class Meta:
        model = ProductVariant
        fields = ['id', 'sku', 'size', 'color', 'color_name', 'quantity', 'price_adjustment']


# ============================================
# COLOR VARIANT SYSTEM SERIALIZERS
# ============================================

class SizeStockSerializer(serializers.ModelSerializer):
    """Serializer for stock per size."""
    class Meta:
        model = SizeStock
        fields = ['id', 'variant', 'size', 'sku', 'quantity']
        extra_kwargs = {
            'variant': {'required': True},
        }


class VariantImageSerializer(serializers.ModelSerializer):
    """Serializer for images per color variant."""
    class Meta:
        model = VariantImage
        fields = ['id', 'variant', 'image', 'alt_text', 'is_primary', 'order']
        extra_kwargs = {
            'variant': {'required': False},  # Set in view
        }


class ColorVariantSerializer(serializers.ModelSerializer):
    """Serializer for color variants with images and stock."""
    variant_images = VariantImageSerializer(many=True, read_only=True)
    size_stocks = SizeStockSerializer(many=True, read_only=True)
    total_stock = serializers.IntegerField(read_only=True)
    primary_image = serializers.CharField(read_only=True)
    
    class Meta:
        model = ColorVariant
        fields = [
            'id', 'product', 'color_name', 'color_hex', 'sku',
            'price_adjustment', 'is_default', 'is_active',
            'variant_images', 'size_stocks', 'total_stock', 'primary_image'
        ]
        extra_kwargs = {
            'product': {'required': False},  # Set in view when creating
        }


class ColorVariantCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for creating color variants."""
    class Meta:
        model = ColorVariant
        fields = ['id', 'product', 'color_name', 'color_hex', 'sku', 'price_adjustment', 'is_default']

class ProductListSerializer(serializers.ModelSerializer):
    primary_image = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)  # Include all images for edit modal
    color_variants = ColorVariantSerializer(many=True, read_only=True)  # New variant system images
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'brand', 'base_price', 'discount_price',
            'discount_percentage', 'rating', 'reviews_count', 'primary_image',
            'is_featured', 'is_new_arrival', 'category', 'category_name', 'total_stock',
            'description', 'material', 'care_instructions', 'is_active', 'images',
            'color_variants', 'background_color', 'category_attributes'
        ]
    
    def get_primary_image(self, obj):
        """Return the primary image URL - checks color variants first, then legacy images."""
        # First, check color variants (new system)
        default_variant = obj.color_variants.filter(is_default=True).first()
        if not default_variant:
            default_variant = obj.color_variants.first()
        
        if default_variant:
            variant_image = default_variant.variant_images.filter(is_primary=True).first()
            if not variant_image:
                variant_image = default_variant.variant_images.first()
            if variant_image and variant_image.image:
                return variant_image.image
        
        # Fallback to legacy product images
        image = obj.images.filter(is_primary=True).first()
        if not image:
            image = obj.images.first()
        
        if image and image.image:
            return image.image
        
        # Return a placeholder if no image exists
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    color_variants = ColorVariantSerializer(many=True, read_only=True)  # New color variant system
    category_name = serializers.CharField(source='category.name', read_only=True)
    default_variant = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'brand', 'material',
            'care_instructions', 'base_price', 'discount_price',
            'discount_percentage', 'rating', 'reviews_count', 'total_stock',
            'is_featured', 'is_new_arrival', 'images', 'variants',
            'color_variants', 'default_variant',  # Color variant fields
            'fabric', 'fit', 'sleeve', 'season',  # Product attributes
            'category', 'category_name', 'created_at'
        ]
    
    def get_default_variant(self, obj):
        """Return the default color variant or first variant."""
        variant = obj.color_variants.filter(is_default=True).first()
        if not variant:
            variant = obj.color_variants.first()
        if variant:
            return ColorVariantSerializer(variant).data
        return None

class ProductCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating products."""
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'brand', 'material',
            'care_instructions', 'base_price', 'discount_price',
            'discount_percentage', 'total_stock', 'is_featured', 
            'is_new_arrival', 'is_active', 'category', 'background_color',
            'fabric', 'fit', 'sleeve', 'season', 'category_attributes'
        ]
        extra_kwargs = {
            'slug': {'required': False},  # Auto-generated if not provided
            'description': {'required': False,'allow_blank': True},  # Optional for updates
            'brand': {'required': False},
            'material': {'required': False,'allow_blank': True},
            'care_instructions': {'required': False,'allow_blank': True},
            'discount_price': {'required': False},
            'discount_percentage': {'required': False},
            'total_stock': {'required': False},
            'is_featured': {'required': False},
            'is_new_arrival': {'required': False},
            'is_active': {'required': False,},
            'fabric': {'required': False,'allow_blank': True},
            'fit': {'required': False,'allow_blank': True},
            'sleeve': {'required': False,'allow_blank': True},
            'season': {'required': False,'allow_blank': True},
        }
    
    def validate_slug(self, value):
        """Auto-generate unique slug if it already exists."""
        from django.utils.text import slugify
        
        if not value:
            return value
        
        # Check if this is an update (instance exists) and slug unchanged
        if self.instance and self.instance.slug == value:
            return value
        
        # Check if slug already exists
        if Product.objects.filter(slug=value).exists():
            # Generate a unique slug by appending a number
            base_slug = value
            counter = 2
            while Product.objects.filter(slug=value).exists():
                value = f"{base_slug}-{counter}"
                counter += 1
        
        return value
    
    def create(self, validated_data):
        """Auto-generate slug from name if not provided."""
        from django.utils.text import slugify
        
        if not validated_data.get('slug'):
            base_slug = slugify(validated_data['name'])
            slug = base_slug
            counter = 2
            while Product.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            validated_data['slug'] = slug
        
        return super().create(validated_data)

class BannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = ['id', 'title', 'subtitle', 'description', 'image', 'link', 'order', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
        
class BottomStyleSerializer(serializers.ModelSerializer):
    class Meta:
        model = BottomStyle
        fields = ['id', 'title', 'subtitle', 'image', 'link', 'background_color', 'order', 'is_active', 'created_at']
        read_only_fields = ['created_at']
        
class CategoryCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoryCard
        fields = ['id', 'title', 'subtitle', 'image', 'background_color', 'link', 'order', 'is_active', 'created_at']
        read_only_fields = ['created_at']


class MensHoodieGridSerializer(serializers.ModelSerializer):
    position_display = serializers.CharField(source='get_position_display', read_only=True)
    
    class Meta:
        model = MensHoodieGrid
        fields = ['id', 'title', 'image', 'link', 'position', 'position_display', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class JacketsGridSerializer(serializers.ModelSerializer):
    position_display = serializers.CharField(source='get_position_display', read_only=True)
    
    class Meta:
        model = JacketsGrid
        fields = ['id', 'title', 'subtitle', 'image', 'background_color', 'link', 'position', 'position_display', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class PromotionalBannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromotionalBanner
        fields = [
            'id', 'title', 'subtitle', 'discount_text', 'description',
            'button_text', 'button_link', 'image', 'background_color',
            'order', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class TshirtGridSerializer(serializers.ModelSerializer):
    class Meta:
        model = TshirtGrid
        fields = [
            'id', 'title', 'subtitle', 'image', 'link', 'background_color',
            'order', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ShoesGridSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShoesGrid
        fields = [
            'id', 'title', 'image', 'link', 'background_color',
            'order', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ShoesCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShoesCard
        fields = [
            'id', 'title', 'subtitle', 'image', 'price', 'link',
            'background_color', 'order', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


# ============================================
# RELATED PRODUCTS SERIALIZERS
# ============================================

class RelatedProductCardSerializer(serializers.ModelSerializer):
    """Lightweight serializer for related products display on PDP."""
    primary_image = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'brand', 'base_price', 'discount_price',
            'discount_percentage', 'primary_image', 'category_name',
            'background_color', 'rating', 'total_stock'
        ]
    
    def get_primary_image(self, obj):
        """Return the primary image URL."""
        default_variant = obj.color_variants.filter(is_default=True).first()
        if not default_variant:
            default_variant = obj.color_variants.first()
        
        if default_variant:
            variant_image = default_variant.variant_images.filter(is_primary=True).first()
            if not variant_image:
                variant_image = default_variant.variant_images.first()
            if variant_image and variant_image.image:
                return variant_image.image
        
        image = obj.images.filter(is_primary=True).first()
        if not image:
            image = obj.images.first()
        
        return image.image if image else None


class RelatedProductSerializer(serializers.ModelSerializer):
    """Serializer for admin-managed related product relationships."""
    related_product = RelatedProductCardSerializer(source='related', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    related_name = serializers.CharField(source='related.name', read_only=True)
    
    class Meta:
        model = RelatedProduct
        fields = [
            'id', 'product', 'related', 'product_name', 'related_name',
            'position', 'is_active', 'created_at', 'related_product'
        ]
        read_only_fields = ['created_at']
