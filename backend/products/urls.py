# products/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('categories', views.CategoryViewSet, basename='category')
router.register('products', views.ProductViewSet, basename='product')
router.register('product-images', views.ProductImageViewSet, basename='product-image')
router.register('colors', views.ColorOptionViewSet, basename='color')
router.register('sizes', views.SizeTemplateViewSet, basename='size')
router.register('banners', views.BannerViewSet, basename='banner')
router.register('bottom-styles', views.BottomStyleViewSet, basename='bottom-style')
router.register('category-cards', views.CategoryCardViewSet, basename='category-card')

# Color Variant System
router.register('color-variants', views.ColorVariantViewSet, basename='color-variant')
router.register('variant-images', views.VariantImageViewSet, basename='variant-image')
router.register('size-stocks', views.SizeStockViewSet, basename='size-stock')
router.register('mens-hoodie-grid', views.MensHoodieGridViewSet, basename='mens-hoodie-grid')
router.register('jackets-grid', views.JacketsGridViewSet, basename='jackets-grid')
router.register('promotional-banners', views.PromotionalBannerViewSet, basename='promotional-banner')
router.register('tshirt-grid', views.TshirtGridViewSet, basename='tshirt-grid')
router.register('shoes-grid', views.ShoesGridViewSet, basename='shoes-grid')
router.register('shoes-card', views.ShoesCardViewSet, basename='shoes-card')

# Related Products System
router.register('related-products', views.RelatedProductViewSet, basename='related-product')

urlpatterns = [
    path('', include(router.urls)),
    path('search/', views.search_products, name='search'),
    # Hybrid related products API endpoint
    path('products/<slug:slug>/related/', views.get_related_products, name='get-related-products'),
]
