from django.contrib import admin
from .models import (
    Category, Product, ProductImage, ColorOption, SizeTemplate, 
    Banner, BottomStyle, CategoryCard,
    ColorVariant, VariantImage, SizeStock, MensHoodieGrid, JacketsGrid,
    PromotionalBanner, TshirtGrid, ShoesGrid, ShoesCard, RelatedProduct
)

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'category_type', 'is_active')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'base_price', 'total_stock', 'is_active')
    list_filter = ('category', 'is_active', 'is_featured')
    search_fields = ('name', 'brand')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(ColorVariant)
class ColorVariantAdmin(admin.ModelAdmin):
    list_display = ('product', 'color_name', 'sku', 'is_default')
    list_filter = ('product',)

@admin.register(SizeStock)
class SizeStockAdmin(admin.ModelAdmin):
    list_display = ('variant', 'size', 'quantity')

@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ('title', 'order', 'is_active')

@admin.register(BottomStyle)
class BottomStyleAdmin(admin.ModelAdmin):
    list_display = ('title', 'order', 'is_active')

@admin.register(CategoryCard)
class CategoryCardAdmin(admin.ModelAdmin):
    list_display = ('title', 'order', 'is_active')

@admin.register(MensHoodieGrid)
class MensHoodieGridAdmin(admin.ModelAdmin):
    list_display = ('title', 'position', 'is_active')

@admin.register(JacketsGrid)
class JacketsGridAdmin(admin.ModelAdmin):
    list_display = ('title', 'position', 'is_active')

@admin.register(PromotionalBanner)
class PromotionalBannerAdmin(admin.ModelAdmin):
    list_display = ('title', 'order', 'is_active')

@admin.register(TshirtGrid)
class TshirtGridAdmin(admin.ModelAdmin):
    list_display = ('title', 'order', 'is_active')

@admin.register(ShoesGrid)
class ShoesGridAdmin(admin.ModelAdmin):
    list_display = ('title', 'order', 'is_active')

@admin.register(ShoesCard)
class ShoesCardAdmin(admin.ModelAdmin):
    list_display = ('title', 'order', 'is_active')

admin.site.register(ProductImage)
admin.site.register(ColorOption)
admin.site.register(SizeTemplate)
admin.site.register(VariantImage)
admin.site.register(RelatedProduct)
