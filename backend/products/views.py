# products/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
import cloudinary
import cloudinary.uploader
from .models import (
    Category, Product, ProductImage, ColorOption, SizeTemplate, 
    Banner, BottomStyle, CategoryCard,
    ColorVariant, VariantImage, SizeStock, MensHoodieGrid, JacketsGrid,
    PromotionalBanner, TshirtGrid, ShoesGrid, ShoesCard
)
from .serializers import (
    CategorySerializer, ProductListSerializer,
    ProductDetailSerializer, ProductCreateSerializer, ProductImageSerializer,
    ColorOptionSerializer, SizeTemplateSerializer,
    BannerSerializer, BottomStyleSerializer, CategoryCardSerializer,
    ColorVariantSerializer, ColorVariantCreateSerializer,
    VariantImageSerializer, SizeStockSerializer, MensHoodieGridSerializer, JacketsGridSerializer,
    PromotionalBannerSerializer, TshirtGridSerializer, ShoesGridSerializer, ShoesCardSerializer
)

class ProductPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'
    filterset_fields = ['category_type']
    
    def create(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_active=True)
    permission_classes = [AllowAny]
    pagination_class = ProductPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'category__category_type', 'brand', 'is_featured', 'is_new_arrival']
    search_fields = ['name', 'description', 'brand', 'category__name', 'category__category_type']
    ordering_fields = ['created_at', 'base_price', 'rating', 'reviews_count']
    ordering = ['-created_at']
    lookup_field = 'slug'


    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProductDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ProductCreateSerializer
        return ProductListSerializer

    def create(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        # Debug: Print request data and validation errors
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("=== PRODUCT CREATE VALIDATION ERRORS ===")
            print(f"Request Data: {request.data}")
            print(f"Errors: {serializer.errors}")
            print("=========================================")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        # Debug: Print update data
        print("=== PRODUCT UPDATE DEBUG ===")
        print(f"Request data: {request.data}")
        print(f"Updating product: {kwargs.get('slug')}")
        
        try:
            # Validate the data
            serializer = self.get_serializer(self.get_object(), data=request.data, partial=True)
            if not serializer.is_valid():
                print(f"ERROR: Validation failed: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            response = super().update(request, *args, **kwargs)
            print(f"✅ Product updated successfully")
            return response
        except Exception as e:
            print(f"ERROR: Exception during update: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        product = self.get_object()
        from .cloudinary_utils import extract_public_id_from_url, delete_image_from_cloudinary
        
        # 1. Delete all product images from Cloudinary (old system)
        for image in product.images.all():
            if image.image and 'cloudinary.com' in image.image:
                try:
                    public_id = extract_public_id_from_url(image.image)
                    if public_id:
                        delete_image_from_cloudinary(public_id)
                        print(f"✅ Deleted product image from Cloudinary: {public_id}")
                except Exception as e:
                    print(f"⚠️ Failed to delete product image: {str(e)}")
        
        # 2. Delete all ColorVariant images from Cloudinary (new system)
        for variant in product.color_variants.all():
            for image in variant.variant_images.all():
                if image.image and 'cloudinary.com' in image.image:
                    try:
                        public_id = extract_public_id_from_url(image.image)
                        if public_id:
                            delete_image_from_cloudinary(public_id)
                            print(f"✅ Deleted variant image from Cloudinary: {public_id}")
                    except Exception as e:
                        print(f"⚠️ Failed to delete variant image: {str(e)}")
        
        print(f"🗑️ Product '{product.name}' and all images deleted from Cloudinary")
        return super().destroy(request, *args, **kwargs)

@api_view(['GET'])
@permission_classes([AllowAny])
def search_products(request):
    query = request.query_params.get('q', '').strip()
    if not query or len(query) < 2:
        return Response({'error': 'Query too short'}, status=status.HTTP_400_BAD_REQUEST)
    
    products = Product.objects.filter(
        Q(name__icontains=query) | Q(description__icontains=query) | Q(brand__icontains=query),
        is_active=True
    )[:20]
    
    serializer = ProductListSerializer(products, many=True)
    return Response(serializer.data)

class ColorOptionViewSet(viewsets.ModelViewSet):
    queryset = ColorOption.objects.filter(is_active=True)
    serializer_class = ColorOptionSerializer
    permission_classes = [AllowAny]

class SizeTemplateViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]
    
    def list(self, request):
        templates = SizeTemplate.objects.all()
        serializer = SizeTemplateSerializer(templates, many=True)
        return Response(serializer.data)

class BannerViewSet(viewsets.ModelViewSet):
    """ViewSet for managing hero slides/banners with Cloudinary upload."""
    serializer_class = BannerSerializer
    permission_classes = [AllowAny]
    ordering = ['order']
    
    def get_queryset(self):
        # Admin can see all banners, public only sees active ones
        if self.request.user.is_staff:
            return Banner.objects.all().order_by('order')
        return Banner.objects.filter(is_active=True).order_by('order')
    
    def create(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            from .cloudinary_utils import upload_image_to_cloudinary
            
            # Handle image upload
            image_file = request.FILES.get('image')
            image_url = request.data.get('image', '')  # In case URL is passed directly
            
            if image_file:
                print(f"📤 Uploading banner image to Cloudinary...")
                result = upload_image_to_cloudinary(image_file, folder='banners')
                image_url = result['secure_url']
                print(f"✅ Banner image uploaded: {image_url}")
            
            # Create banner
            banner = Banner.objects.create(
                title=request.data.get('title', ''),
                subtitle=request.data.get('subtitle', ''),
                description=request.data.get('description', ''),
                image=image_url,
                link=request.data.get('link', ''),
                order=int(request.data.get('order', 0)),
                is_active=request.data.get('is_active', 'true').lower() in ['true', '1', 'yes']
            )
            
            return Response(BannerSerializer(banner).data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"❌ Error creating banner: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def update(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            from .cloudinary_utils import upload_image_to_cloudinary, extract_public_id_from_url, delete_image_from_cloudinary
            
            banner = self.get_object()
            image_file = request.FILES.get('image')
            
            # If new image uploaded, upload to Cloudinary and delete old one
            if image_file:
                # Delete old image from Cloudinary
                if banner.image and 'cloudinary.com' in banner.image:
                    try:
                        public_id = extract_public_id_from_url(banner.image)
                        if public_id:
                            delete_image_from_cloudinary(public_id)
                            print(f"✅ Deleted old banner image: {public_id}")
                    except Exception as e:
                        print(f"⚠️ Failed to delete old image: {str(e)}")
                
                # Upload new image
                print(f"📤 Uploading new banner image...")
                result = upload_image_to_cloudinary(image_file, folder='banners')
                banner.image = result['secure_url']
                print(f"✅ New banner image uploaded: {banner.image}")
            elif 'image' in request.data and isinstance(request.data['image'], str):
                # URL passed directly (no file upload)
                banner.image = request.data['image']
            
            # Update other fields
            if 'title' in request.data:
                banner.title = request.data['title']
            if 'subtitle' in request.data:
                banner.subtitle = request.data['subtitle']
            if 'description' in request.data:
                banner.description = request.data['description']
            if 'link' in request.data:
                banner.link = request.data['link']
            if 'order' in request.data:
                banner.order = int(request.data['order'])
            if 'is_active' in request.data:
                is_active_val = request.data['is_active']
                banner.is_active = is_active_val in [True, 'true', 'True', '1', 1]
            
            banner.save()
            return Response(BannerSerializer(banner).data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ Error updating banner: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def destroy(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        # Delete image from Cloudinary
        banner = self.get_object()
        if banner.image and 'cloudinary.com' in banner.image:
            from .cloudinary_utils import extract_public_id_from_url, delete_image_from_cloudinary
            try:
                public_id = extract_public_id_from_url(banner.image)
                if public_id:
                    delete_image_from_cloudinary(public_id)
                    print(f"✅ Deleted banner image from Cloudinary: {public_id}")
            except Exception as e:
                print(f"⚠️ Failed to delete banner image: {str(e)}")
        
        return super().destroy(request, *args, **kwargs)
    
class BottomStyleViewSet(viewsets.ModelViewSet):
    """ViewSet for managing bottom styles with Cloudinary image upload."""
    serializer_class = BottomStyleSerializer
    permission_classes = [AllowAny]
    ordering = ['order']
    
    def get_queryset(self):
        # Admin sees all, public only active items
        if self.request.user.is_staff:
            return BottomStyle.objects.all().order_by('order')
        return BottomStyle.objects.filter(is_active=True).order_by('order')
    
    def create(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            from .cloudinary_utils import upload_image_to_cloudinary
            
            image_file = request.FILES.get('image')
            image_url = request.data.get('image', '')
            
            if image_file:
                print(f"📤 Uploading bottom style image to Cloudinary...")
                result = upload_image_to_cloudinary(image_file, folder='bottom_styles')
                image_url = result['secure_url']
                print(f"✅ Image uploaded: {image_url}")
            
            # Parse is_active
            is_active_val = request.data.get('is_active', 'true')
            is_active = is_active_val in [True, 'true', 'True', '1', 1]
            
            bottom_style = BottomStyle.objects.create(
                title=request.data.get('title', ''),
                subtitle=request.data.get('subtitle', ''),
                image=image_url,
                link=request.data.get('link', ''),
                background_color=request.data.get('background_color', '#ffffff'),
                order=int(request.data.get('order', 0)),
                is_active=is_active
            )
            
            return Response(BottomStyleSerializer(bottom_style).data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"❌ Error creating bottom style: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def update(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            from .cloudinary_utils import upload_image_to_cloudinary, extract_public_id_from_url, delete_image_from_cloudinary
            
            bottom_style = self.get_object()
            image_file = request.FILES.get('image')
            
            if image_file:
                # Delete old image from Cloudinary
                if bottom_style.image and 'cloudinary.com' in bottom_style.image:
                    try:
                        public_id = extract_public_id_from_url(bottom_style.image)
                        if public_id:
                            delete_image_from_cloudinary(public_id)
                            print(f"✅ Deleted old bottom style image: {public_id}")
                    except Exception as e:
                        print(f"⚠️ Failed to delete old image: {str(e)}")
                
                # Upload new image
                print(f"📤 Uploading new bottom style image...")
                result = upload_image_to_cloudinary(image_file, folder='bottom_styles')
                bottom_style.image = result['secure_url']
                print(f"✅ New image uploaded: {bottom_style.image}")
            elif 'image' in request.data and isinstance(request.data['image'], str):
                bottom_style.image = request.data['image']
            
            # Update other fields
            if 'title' in request.data:
                bottom_style.title = request.data['title']
            if 'subtitle' in request.data:
                bottom_style.subtitle = request.data['subtitle']
            if 'link' in request.data:
                bottom_style.link = request.data['link']
            if 'order' in request.data:
                bottom_style.order = int(request.data['order'])
            if 'background_color' in request.data:
                bottom_style.background_color = request.data['background_color']
            if 'is_active' in request.data:
                is_active_val = request.data['is_active']
                bottom_style.is_active = is_active_val in [True, 'true', 'True', '1', 1]
            
            bottom_style.save()
            return Response(BottomStyleSerializer(bottom_style).data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ Error updating bottom style: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def destroy(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        bottom_style = self.get_object()
        if bottom_style.image and 'cloudinary.com' in bottom_style.image:
            from .cloudinary_utils import extract_public_id_from_url, delete_image_from_cloudinary
            try:
                public_id = extract_public_id_from_url(bottom_style.image)
                if public_id:
                    delete_image_from_cloudinary(public_id)
                    print(f"✅ Deleted bottom style image from Cloudinary: {public_id}")
            except Exception as e:
                print(f"⚠️ Failed to delete image: {str(e)}")
        
        return super().destroy(request, *args, **kwargs)

class CategoryCardViewSet(viewsets.ModelViewSet):
    """ViewSet for managing category cards with Cloudinary upload."""
    serializer_class = CategoryCardSerializer
    permission_classes = [AllowAny]
    ordering = ['order']
    
    def get_queryset(self):
        # Admin can see all cards, public only sees active ones
        if self.request.user.is_staff:
            return CategoryCard.objects.all().order_by('order')
        return CategoryCard.objects.filter(is_active=True).order_by('order')
    
    def create(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            image_file = request.FILES.get('image')
            image_url = None
            
            if image_file:
                # Upload to Cloudinary
                upload_result = cloudinary.uploader.upload(
                    image_file,
                    folder='category_cards',
                    resource_type='image'
                )
                image_url = upload_result.get('secure_url')
            
            # Handle is_active - can be string or boolean
            is_active_value = request.data.get('is_active', True)
            if isinstance(is_active_value, str):
                is_active = is_active_value.lower() == 'true'
            else:
                is_active = bool(is_active_value)
            
            # Get background color from palette selection
            background_color = request.data.get('background_color', '#f5ebe0')
            
            card = CategoryCard.objects.create(
                title=request.data.get('title', ''),
                subtitle=request.data.get('subtitle', ''),
                image=image_url or '',
                background_color=background_color,
                link=request.data.get('link', '/shop'),
                order=int(request.data.get('order', 0)),
                is_active=is_active
            )
            
            serializer = self.get_serializer(card)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            import traceback
            print(f"Error creating category card: {e}")
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        instance = self.get_object()
        
        try:
            image_file = request.FILES.get('image')
            
            if image_file:
                # Upload new image to Cloudinary
                upload_result = cloudinary.uploader.upload(
                    image_file,
                    folder='category_cards',
                    resource_type='image'
                )
                instance.image = upload_result.get('secure_url')
            elif 'image' in request.data and isinstance(request.data.get('image'), str):
                instance.image = request.data.get('image')
            
            # Update background color from palette selection
            if 'background_color' in request.data:
                bg_color = request.data.get('background_color')
                if bg_color:
                    instance.background_color = bg_color
            
            instance.title = request.data.get('title', instance.title)
            instance.subtitle = request.data.get('subtitle', instance.subtitle)
            instance.link = request.data.get('link', instance.link)
            instance.order = int(request.data.get('order', instance.order))
            
            is_active = request.data.get('is_active')
            if is_active is not None:
                instance.is_active = str(is_active).lower() == 'true'
            
            instance.save()
            
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class ProductImageViewSet(viewsets.ModelViewSet):
    """ViewSet for managing product images with Cloudinary upload support."""
    queryset = ProductImage.objects.all()
    serializer_class = ProductImageSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = ProductImage.objects.all()
        product_id = self.request.query_params.get('product', None)
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Create product image by manually uploading to Cloudinary."""
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Debug: Print request data
            print("=== IMAGE UPLOAD DEBUG ===")
            print(f"Request data: {request.data}")
            print(f"Request files: {request.FILES}")
            
            # Validate image file
            image_file = request.FILES.get('image')
            if not image_file:
                print("ERROR: No image file in request")
                return Response(
                    {'error': 'No image file provided'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get product ID to organize in Cloudinary
            product_id = request.data.get('product')
            if not product_id:
                return Response(
                    {'error': 'Product ID is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get product for folder organization
            try:
                product = Product.objects.get(id=product_id)
            except Product.DoesNotExist:
                return Response(
                    {'error': 'Product not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Validate and upload to Cloudinary manually
            from .cloudinary_utils import upload_image_to_cloudinary
            from django.core.exceptions import ValidationError as DjangoValidationError
            
            try:
                print(f"🔄 Uploading to Cloudinary...")
                cloudinary_result = upload_image_to_cloudinary(
                    image_file,
                    folder=f'products/{product.slug}'
                )
                print(f"✅ Cloudinary upload successful!")
                print(f"   URL: {cloudinary_result['secure_url']}")
            except DjangoValidationError as e:
                print(f"ERROR: Image validation failed: {str(e)}")
                return Response(
                    {'error': str(e)}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            except Exception as e:
                print(f"ERROR: Cloudinary upload failed: {str(e)}")
                return Response(
                    {'error': f'Cloudinary upload failed: {str(e)}'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Create ProductImage with the Cloudinary URL
            product_image = ProductImage.objects.create(
                product=product,
                image=cloudinary_result['secure_url'],  # Save Cloudinary URL directly
                alt_text=request.data.get('alt_text', product.name),
                is_primary=request.data.get('is_primary', 'false').lower() == 'true',
                order=int(request.data.get('order', 0))
            )
            
            print(f"✅ ProductImage created with Cloudinary URL in database")
            
            return Response(
                {
                    'id': product_image.id,
                    'product': product_image.product.id,
                    'image': cloudinary_result['secure_url'],
                    'image_url': cloudinary_result['secure_url'],
                    'alt_text': product_image.alt_text,
                    'is_primary': product_image.is_primary,
                    'order': product_image.order,
                    'cloudinary_public_id': cloudinary_result.get('public_id'),
                }, 
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            print(f"ERROR: Exception occurred: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Failed to create product image: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



    
    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def bulk_upload(self, request):
        """Upload multiple images for a product at once."""
        try:
            from .cloudinary_utils import upload_multiple_images
            
            product_id = request.data.get('product')
            if not product_id:
                return Response(
                    {'error': 'Product ID is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate that product exists
            try:
                product = Product.objects.get(id=product_id)
            except Product.DoesNotExist:
                return Response(
                    {'error': 'Product not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get all uploaded images
            image_files = request.FILES.getlist('images')
            if not image_files:
                return Response(
                    {'error': 'No image files provided'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Upload to Cloudinary
            results, errors = upload_multiple_images(
                image_files, 
                folder=f'products/{product.slug}'
            )
            
            # Create ProductImage instances for successful uploads
            created_images = []
            for idx, result in enumerate(results):
                product_image = ProductImage.objects.create(
                    product=product,
                    image=result['secure_url'],
                    alt_text=request.data.get('alt_text', product.name),
                    is_primary=(idx == 0 and not product.images.exists()),
                    order=product.images.count() + idx
                )
                created_images.append({
                    'id': product_image.id,
                    'image_url': product_image.image.url,
                    'cloudinary_public_id': result.get('public_id'),
                })
            
            response_data = {
                'success': len(created_images),
                'failed': len(errors),
                'images': created_images,
            }
            
            if errors:
                response_data['errors'] = errors
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Bulk upload failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def update(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        # Delete from Cloudinary before deleting from database
        instance = self.get_object()
        if instance.image and 'cloudinary.com' in instance.image:
            from .cloudinary_utils import extract_public_id_from_url, delete_image_from_cloudinary
            public_id = extract_public_id_from_url(instance.image)
            if public_id:
                try:
                    delete_image_from_cloudinary(public_id)
                    print(f"✅ Deleted image from Cloudinary: {public_id}")
                except Exception as e:
                    print(f"⚠️ Failed to delete from Cloudinary: {str(e)}")
        
        return super().destroy(request, *args, **kwargs)


# ============================================
# COLOR VARIANT SYSTEM VIEWSETS
# ============================================

class ColorVariantViewSet(viewsets.ModelViewSet):
    """ViewSet for managing color variants."""
    queryset = ColorVariant.objects.all()
    permission_classes = [AllowAny]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ColorVariantCreateSerializer
        return ColorVariantSerializer
    
    def get_queryset(self):
        queryset = ColorVariant.objects.all()
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset.prefetch_related('variant_images', 'size_stocks')
    
    def create(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        # Delete all variant images from Cloudinary before deleting variant
        variant = self.get_object()
        from .cloudinary_utils import extract_public_id_from_url, delete_image_from_cloudinary
        
        for image in variant.variant_images.all():
            if image.image and 'cloudinary.com' in image.image:
                try:
                    public_id = extract_public_id_from_url(image.image)
                    if public_id:
                        delete_image_from_cloudinary(public_id)
                        print(f"✅ Deleted variant image from Cloudinary: {public_id}")
                except Exception as e:
                    print(f"⚠️ Failed to delete variant image: {str(e)}")
        
        return super().destroy(request, *args, **kwargs)


class VariantImageViewSet(viewsets.ModelViewSet):
    """ViewSet for managing variant images with Cloudinary upload."""
    queryset = VariantImage.objects.all()
    serializer_class = VariantImageSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = VariantImage.objects.all()
        variant_id = self.request.query_params.get('variant')
        if variant_id:
            queryset = queryset.filter(variant_id=variant_id)
        return queryset
    
    def create(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        from .cloudinary_utils import upload_image_to_cloudinary
        
        variant_id = request.data.get('variant')
        image_file = request.FILES.get('image')
        
        if not variant_id:
            return Response({'error': 'Variant ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not image_file:
            return Response({'error': 'Image file is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Upload to Cloudinary
            print(f"📤 Uploading image for variant {variant_id}...")
            result = upload_image_to_cloudinary(image_file, folder='variant_images')
            print(f"✅ Cloudinary upload successful: {result['secure_url']}")
            
            # Convert is_primary from string to boolean
            is_primary_raw = request.data.get('is_primary', False)
            is_primary = is_primary_raw in [True, 'true', 'True', '1', 1]
            
            # Convert order to int
            order = int(request.data.get('order', 0))
            
            # Create VariantImage record
            variant_image = VariantImage.objects.create(
                variant_id=variant_id,
                image=result['secure_url'],
                alt_text=request.data.get('alt_text', ''),
                is_primary=is_primary,
                order=order
            )
            
            print(f"✅ VariantImage created: {variant_image.id}")
            return Response(VariantImageSerializer(variant_image).data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            import traceback
            print(f"❌ Error uploading variant image: {str(e)}")
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def destroy(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        # Delete from Cloudinary
        instance = self.get_object()
        if instance.image and 'cloudinary.com' in instance.image:
            from .cloudinary_utils import extract_public_id_from_url, delete_image_from_cloudinary
            public_id = extract_public_id_from_url(instance.image)
            if public_id:
                try:
                    delete_image_from_cloudinary(public_id)
                    print(f"✅ Deleted variant image from Cloudinary: {public_id}")
                except Exception as e:
                    print(f"⚠️ Failed to delete: {str(e)}")
        
        return super().destroy(request, *args, **kwargs)


class SizeStockViewSet(viewsets.ModelViewSet):
    """ViewSet for managing size stock per variant."""
    queryset = SizeStock.objects.all()
    serializer_class = SizeStockSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = SizeStock.objects.all()
        variant_id = self.request.query_params.get('variant')
        if variant_id:
            queryset = queryset.filter(variant_id=variant_id)
        return queryset
    
    def create(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def bulk_update(self, request):
        """Bulk update size stocks for a variant."""
        variant_id = request.data.get('variant_id')
        stocks = request.data.get('stocks', [])  # [{size: 'S', quantity: 10}, ...]
        
        if not variant_id:
            return Response({'error': 'Variant ID required'}, status=status.HTTP_400_BAD_REQUEST)
        
        updated = []
        for stock_data in stocks:
            size = stock_data.get('size')
            quantity = stock_data.get('quantity', 0)
            
            stock, created = SizeStock.objects.update_or_create(
                variant_id=variant_id,
                size=size,
                defaults={'quantity': quantity}
            )
            updated.append(SizeStockSerializer(stock).data)
        
        return Response({'updated': updated}, status=status.HTTP_200_OK)


class MensHoodieGridViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Men's Hoodies Grid section with Cloudinary upload."""
    serializer_class = MensHoodieGridSerializer
    permission_classes = [AllowAny]
    ordering = ['position']
    
    def get_queryset(self):
        # Admin sees all, public only active items
        if self.request.user.is_staff:
            return MensHoodieGrid.objects.all().order_by('position')
        return MensHoodieGrid.objects.filter(is_active=True).order_by('position')
    
    def create(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            from .cloudinary_utils import upload_image_to_cloudinary
            
            image_file = request.FILES.get('image')
            image_url = request.data.get('image', '')
            
            if image_file:
                print(f"📤 Uploading hoodie grid image to Cloudinary...")
                result = upload_image_to_cloudinary(image_file, folder='mens_hoodie_grid')
                image_url = result['secure_url']
                print(f"✅ Image uploaded: {image_url}")
            
            grid_item = MensHoodieGrid.objects.create(
                title=request.data.get('title', ''),
                image=image_url,
                link=request.data.get('link', ''),
                position=int(request.data.get('position', 1)),
                is_active=request.data.get('is_active', 'true').lower() in ['true', '1', 'yes']
            )
            
            return Response(MensHoodieGridSerializer(grid_item).data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"❌ Error creating grid item: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def update(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            from .cloudinary_utils import upload_image_to_cloudinary, extract_public_id_from_url, delete_image_from_cloudinary
            
            grid_item = self.get_object()
            image_file = request.FILES.get('image')
            
            if image_file:
                # Delete old image from Cloudinary
                if grid_item.image and 'cloudinary.com' in grid_item.image:
                    try:
                        public_id = extract_public_id_from_url(grid_item.image)
                        if public_id:
                            delete_image_from_cloudinary(public_id)
                            print(f"✅ Deleted old image: {public_id}")
                    except Exception as e:
                        print(f"⚠️ Failed to delete old image: {str(e)}")
                
                # Upload new image
                print(f"📤 Uploading new grid image...")
                result = upload_image_to_cloudinary(image_file, folder='mens_hoodie_grid')
                grid_item.image = result['secure_url']
                print(f"✅ New image uploaded: {grid_item.image}")
            elif 'image' in request.data and isinstance(request.data['image'], str):
                grid_item.image = request.data['image']
            
            if 'title' in request.data:
                grid_item.title = request.data['title']
            if 'link' in request.data:
                grid_item.link = request.data['link']
            if 'position' in request.data:
                grid_item.position = int(request.data['position'])
            if 'is_active' in request.data:
                is_active_val = request.data['is_active']
                grid_item.is_active = is_active_val in [True, 'true', 'True', '1', 1]
            
            grid_item.save()
            return Response(MensHoodieGridSerializer(grid_item).data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ Error updating grid item: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def destroy(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        grid_item = self.get_object()
        if grid_item.image and 'cloudinary.com' in grid_item.image:
            from .cloudinary_utils import extract_public_id_from_url, delete_image_from_cloudinary
            try:
                public_id = extract_public_id_from_url(grid_item.image)
                if public_id:
                    delete_image_from_cloudinary(public_id)
                    print(f"✅ Deleted grid image from Cloudinary: {public_id}")
            except Exception as e:
                print(f"⚠️ Failed to delete image: {str(e)}")
        
        return super().destroy(request, *args, **kwargs)


class JacketsGridViewSet(viewsets.ModelViewSet):
    queryset = JacketsGrid.objects.filter(is_active=True)
    serializer_class = JacketsGridSerializer
    permission_classes = [AllowAny]
    ordering = ['position']
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return JacketsGrid.objects.all().order_by('position')
        return JacketsGrid.objects.filter(is_active=True).order_by('position')
    
    def create(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            from .cloudinary_utils import upload_image_to_cloudinary
            
            image_url = ''
            if 'image' in request.FILES:
                image_file = request.FILES['image']
                result = upload_image_to_cloudinary(image_file, folder='jackets_grid')
                image_url = result['secure_url']
            
            is_active = request.data.get('is_active', True)
            if isinstance(is_active, str):
                is_active = is_active.lower() in ['true', '1']
            
            grid_item = JacketsGrid.objects.create(
                title=request.data.get('title', ''),
                subtitle=request.data.get('subtitle', ''),
                image=image_url,
                background_color=request.data.get('background_color', '#ffffff'),
                link=request.data.get('link', ''),
                position=int(request.data.get('position', 1)),
                is_active=is_active
            )
            
            return Response(JacketsGridSerializer(grid_item).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def update(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)
    
    def partial_update(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            from .cloudinary_utils import upload_image_to_cloudinary, extract_public_id_from_url, delete_image_from_cloudinary
            
            grid_item = self.get_object()
            
            if 'image' in request.FILES:
                image_file = request.FILES['image']
                
                # Delete old image from Cloudinary
                if grid_item.image and 'cloudinary.com' in grid_item.image:
                    try:
                        public_id = extract_public_id_from_url(grid_item.image)
                        if public_id:
                            delete_image_from_cloudinary(public_id)
                    except Exception as e:
                        print(f"Failed to delete old image: {e}")
                
                # Upload new image
                result = upload_image_to_cloudinary(image_file, folder='jackets_grid')
                grid_item.image = result['secure_url']
            elif 'image' in request.data and isinstance(request.data['image'], str):
                grid_item.image = request.data['image']
            
            if 'title' in request.data:
                grid_item.title = request.data['title']
            if 'subtitle' in request.data:
                grid_item.subtitle = request.data['subtitle']
            
            # Handle background_color - check for various key formats
            background_color = request.data.get('background_color')
            if background_color:
                print(f"📍 Received background_color: {background_color}")
                grid_item.background_color = background_color
            
            if 'link' in request.data:
                grid_item.link = request.data['link']
            if 'position' in request.data:
                grid_item.position = int(request.data['position'])
            if 'is_active' in request.data:
                is_active_val = request.data['is_active']
                grid_item.is_active = is_active_val in [True, 'true', 'True', '1', 1]
            
            print(f"📍 Saving grid_item with background_color: {grid_item.background_color}")
            grid_item.save()
            return Response(JacketsGridSerializer(grid_item).data, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def destroy(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        grid_item = self.get_object()
        if grid_item.image and 'cloudinary.com' in grid_item.image:
            from .cloudinary_utils import extract_public_id_from_url, delete_image_from_cloudinary
            try:
                public_id = extract_public_id_from_url(grid_item.image)
                if public_id:
                    delete_image_from_cloudinary(public_id)
            except Exception as e:
                print(f"Failed to delete image: {e}")
        
        return super().destroy(request, *args, **kwargs)


class PromotionalBannerViewSet(viewsets.ModelViewSet):
    """ViewSet for managing promotional banners with Cloudinary upload."""
    queryset = PromotionalBanner.objects.all()
    serializer_class = PromotionalBannerSerializer
    permission_classes = [AllowAny]
    ordering = ['order']
    
    def get_queryset(self):
        # Admin sees all banners, public only sees active ones
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return PromotionalBanner.objects.all().order_by('order')
        return PromotionalBanner.objects.filter(is_active=True).order_by('order')
    
    def create(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            from .cloudinary_utils import upload_image_to_cloudinary
            
            image_url = ''
            if 'image' in request.FILES:
                image_file = request.FILES['image']
                print(f"📤 Uploading promotional banner image to Cloudinary...")
                result = upload_image_to_cloudinary(image_file, folder='promotional_banners')
                image_url = result['secure_url']
                print(f"✅ Image uploaded: {image_url}")
            
            is_active = request.data.get('is_active', True)
            if isinstance(is_active, str):
                is_active = is_active.lower() in ['true', '1']
            
            banner = PromotionalBanner.objects.create(
                title=request.data.get('title', ''),
                subtitle=request.data.get('subtitle', ''),
                discount_text=request.data.get('discount_text', ''),
                description=request.data.get('description', ''),
                button_text=request.data.get('button_text', 'Shop Now'),
                button_link=request.data.get('button_link', '/shop'),
                image=image_url,
                background_color=request.data.get('background_color', '#f8f8f8'),
                order=int(request.data.get('order', 0)),
                is_active=is_active
            )
            
            return Response(PromotionalBannerSerializer(banner).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def update(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)
    
    def partial_update(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            from .cloudinary_utils import upload_image_to_cloudinary, extract_public_id_from_url, delete_image_from_cloudinary
            
            banner = self.get_object()
            
            if 'image' in request.FILES:
                image_file = request.FILES['image']
                
                # Delete old image from Cloudinary
                if banner.image and 'cloudinary.com' in banner.image:
                    try:
                        public_id = extract_public_id_from_url(banner.image)
                        if public_id:
                            delete_image_from_cloudinary(public_id)
                            print(f"✅ Deleted old banner image: {public_id}")
                    except Exception as e:
                        print(f"Failed to delete old image: {e}")
                
                # Upload new image
                print(f"📤 Uploading new banner image...")
                result = upload_image_to_cloudinary(image_file, folder='promotional_banners')
                banner.image = result['secure_url']
                print(f"✅ New image uploaded: {banner.image}")
            elif 'image' in request.data and isinstance(request.data['image'], str):
                banner.image = request.data['image']
            
            # Update other fields
            if 'title' in request.data:
                banner.title = request.data['title']
            if 'subtitle' in request.data:
                banner.subtitle = request.data['subtitle']
            if 'discount_text' in request.data:
                banner.discount_text = request.data['discount_text']
            if 'description' in request.data:
                banner.description = request.data['description']
            if 'button_text' in request.data:
                banner.button_text = request.data['button_text']
            if 'button_link' in request.data:
                banner.button_link = request.data['button_link']
            if 'background_color' in request.data:
                banner.background_color = request.data['background_color']
            if 'order' in request.data:
                banner.order = int(request.data['order'])
            if 'is_active' in request.data:
                is_active_val = request.data['is_active']
                banner.is_active = is_active_val in [True, 'true', 'True', '1', 1]
            
            banner.save()
            return Response(PromotionalBannerSerializer(banner).data, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def destroy(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        banner = self.get_object()
        if banner.image and 'cloudinary.com' in banner.image:
            from .cloudinary_utils import extract_public_id_from_url, delete_image_from_cloudinary
            try:
                public_id = extract_public_id_from_url(banner.image)
                if public_id:
                    delete_image_from_cloudinary(public_id)
                    print(f"✅ Deleted banner image from Cloudinary: {public_id}")
            except Exception as e:
                print(f"Failed to delete image: {e}")
        
        return super().destroy(request, *args, **kwargs)


class TshirtGridViewSet(viewsets.ModelViewSet):
    """ViewSet for managing T-shirt grid section with Cloudinary image upload."""
    serializer_class = TshirtGridSerializer
    permission_classes = [AllowAny]
    ordering = ['order']
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return TshirtGrid.objects.all().order_by('order')
        return TshirtGrid.objects.filter(is_active=True).order_by('order')
    
    def create(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            from .cloudinary_utils import upload_image_to_cloudinary
            
            image_file = request.FILES.get('image')
            image_url = request.data.get('image', '')
            
            if image_file:
                print(f"📤 Uploading T-shirt grid image to Cloudinary...")
                result = upload_image_to_cloudinary(image_file, folder='tshirt_grid')
                image_url = result['secure_url']
                print(f"✅ Image uploaded: {image_url}")
            
            is_active_val = request.data.get('is_active', 'true')
            is_active = is_active_val in [True, 'true', 'True', '1', 1]
            
            item = TshirtGrid.objects.create(
                title=request.data.get('title', ''),
                subtitle=request.data.get('subtitle', ''),
                image=image_url,
                link=request.data.get('link', '/shop?category=tshirts'),
                background_color=request.data.get('background_color', '#ffffff'),
                order=int(request.data.get('order', 0)),
                is_active=is_active
            )
            
            return Response(TshirtGridSerializer(item).data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"❌ Error creating T-shirt grid item: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def partial_update(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            from .cloudinary_utils import upload_image_to_cloudinary, extract_public_id_from_url, delete_image_from_cloudinary
            
            item = self.get_object()
            
            if 'image' in request.FILES:
                image_file = request.FILES['image']
                
                # Delete old image from Cloudinary
                if item.image and 'cloudinary.com' in item.image:
                    try:
                        public_id = extract_public_id_from_url(item.image)
                        if public_id:
                            delete_image_from_cloudinary(public_id)
                            print(f"✅ Deleted old T-shirt grid image: {public_id}")
                    except Exception as e:
                        print(f"Failed to delete old image: {e}")
                
                # Upload new image
                print(f"📤 Uploading new T-shirt grid image...")
                result = upload_image_to_cloudinary(image_file, folder='tshirt_grid')
                item.image = result['secure_url']
                print(f"✅ New image uploaded: {item.image}")
            elif 'image' in request.data and isinstance(request.data['image'], str):
                item.image = request.data['image']
            
            # Update other fields
            if 'title' in request.data:
                item.title = request.data['title']
            if 'subtitle' in request.data:
                item.subtitle = request.data['subtitle']
            if 'link' in request.data:
                item.link = request.data['link']
            if 'background_color' in request.data:
                item.background_color = request.data['background_color']
            if 'order' in request.data:
                item.order = int(request.data['order'])
            if 'is_active' in request.data:
                is_active_val = request.data['is_active']
                item.is_active = is_active_val in [True, 'true', 'True', '1', 1]
            
            item.save()
            return Response(TshirtGridSerializer(item).data, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def destroy(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        item = self.get_object()
        if item.image and 'cloudinary.com' in item.image:
            from .cloudinary_utils import extract_public_id_from_url, delete_image_from_cloudinary
            try:
                public_id = extract_public_id_from_url(item.image)
                if public_id:
                    delete_image_from_cloudinary(public_id)
                    print(f"✅ Deleted T-shirt grid image from Cloudinary: {public_id}")
            except Exception as e:
                print(f"Failed to delete image: {e}")
        
        return super().destroy(request, *args, **kwargs)


class ShoesGridViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Shoes grid section with Cloudinary image upload."""
    from rest_framework_simplejwt.authentication import JWTAuthentication
    
    serializer_class = ShoesGridSerializer
    permission_classes = [AllowAny]
    authentication_classes = [JWTAuthentication]
    ordering = ['order']
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return ShoesGrid.objects.all().order_by('order')
        return ShoesGrid.objects.filter(is_active=True).order_by('order')
    
    def create(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            from .cloudinary_utils import upload_image_to_cloudinary
            
            image_file = request.FILES.get('image')
            image_url = request.data.get('image', '')
            
            if image_file:
                print(f"📤 Uploading Shoes grid image to Cloudinary...")
                result = upload_image_to_cloudinary(image_file, folder='shoes_grid')
                image_url = result['secure_url']
                print(f"✅ Image uploaded: {image_url}")
            
            is_active_val = request.data.get('is_active', 'true')
            is_active = is_active_val in [True, 'true', 'True', '1', 1]
            
            item = ShoesGrid.objects.create(
                title=request.data.get('title', ''),
                image=image_url,
                link=request.data.get('link', '/shop?category=shoes'),
                background_color=request.data.get('background_color', '#e5e5e5'),
                order=int(request.data.get('order', 0)),
                is_active=is_active
            )
            
            return Response(ShoesGridSerializer(item).data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"❌ Error creating Shoes grid item: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def partial_update(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            from .cloudinary_utils import upload_image_to_cloudinary, extract_public_id_from_url, delete_image_from_cloudinary
            
            item = self.get_object()
            
            if 'image' in request.FILES:
                image_file = request.FILES['image']
                
                if item.image and 'cloudinary.com' in item.image:
                    try:
                        public_id = extract_public_id_from_url(item.image)
                        if public_id:
                            delete_image_from_cloudinary(public_id)
                            print(f"✅ Deleted old Shoes grid image: {public_id}")
                    except Exception as e:
                        print(f"Failed to delete old image: {e}")
                
                print(f"📤 Uploading new Shoes grid image...")
                result = upload_image_to_cloudinary(image_file, folder='shoes_grid')
                item.image = result['secure_url']
                print(f"✅ New image uploaded: {item.image}")
            elif 'image' in request.data and isinstance(request.data['image'], str):
                item.image = request.data['image']
            
            if 'title' in request.data:
                item.title = request.data['title']
            if 'link' in request.data:
                item.link = request.data['link']
            if 'background_color' in request.data:
                item.background_color = request.data['background_color']
            if 'order' in request.data:
                item.order = int(request.data['order'])
            if 'is_active' in request.data:
                is_active_val = request.data['is_active']
                item.is_active = is_active_val in [True, 'true', 'True', '1', 1]
            
            item.save()
            return Response(ShoesGridSerializer(item).data, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def destroy(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        item = self.get_object()
        if item.image and 'cloudinary.com' in item.image:
            from .cloudinary_utils import extract_public_id_from_url, delete_image_from_cloudinary
            try:
                public_id = extract_public_id_from_url(item.image)
                if public_id:
                    delete_image_from_cloudinary(public_id)
                    print(f"✅ Deleted Shoes grid image from Cloudinary: {public_id}")
            except Exception as e:
                print(f"Failed to delete image: {e}")
        
        return super().destroy(request, *args, **kwargs)


class ShoesCardViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Shoes Card section with Cloudinary image upload."""
    from rest_framework_simplejwt.authentication import JWTAuthentication
    
    serializer_class = ShoesCardSerializer
    permission_classes = [AllowAny]
    authentication_classes = [JWTAuthentication]
    ordering = ['order']
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return ShoesCard.objects.all().order_by('order')
        return ShoesCard.objects.filter(is_active=True).order_by('order')
    
    def create(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            from .cloudinary_utils import upload_image_to_cloudinary
            
            image_file = request.FILES.get('image')
            image_url = request.data.get('image', '')
            
            if image_file:
                print(f"📤 Uploading Shoes card image to Cloudinary...")
                result = upload_image_to_cloudinary(image_file, folder='shoes_cards')
                image_url = result['secure_url']
                print(f"✅ Image uploaded: {image_url}")
            
            is_active_val = request.data.get('is_active', 'true')
            is_active = is_active_val in [True, 'true', 'True', '1', 1]
            
            item = ShoesCard.objects.create(
                title=request.data.get('title', ''),
                subtitle=request.data.get('subtitle', ''),
                image=image_url,
                price=request.data.get('price', ''),
                link=request.data.get('link', '/shop?category=shoes'),
                background_color=request.data.get('background_color', '#ffffff'),
                order=int(request.data.get('order', 0)),
                is_active=is_active
            )
            
            return Response(ShoesCardSerializer(item).data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"❌ Error creating Shoes card item: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def partial_update(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            from .cloudinary_utils import upload_image_to_cloudinary, extract_public_id_from_url, delete_image_from_cloudinary
            
            item = self.get_object()
            
            if 'image' in request.FILES:
                image_file = request.FILES['image']
                
                if item.image and 'cloudinary.com' in item.image:
                    try:
                        public_id = extract_public_id_from_url(item.image)
                        if public_id:
                            delete_image_from_cloudinary(public_id)
                            print(f"✅ Deleted old Shoes card image: {public_id}")
                    except Exception as e:
                        print(f"Failed to delete old image: {e}")
                
                print(f"📤 Uploading new Shoes card image...")
                result = upload_image_to_cloudinary(image_file, folder='shoes_cards')
                item.image = result['secure_url']
                print(f"✅ New image uploaded: {item.image}")
            elif 'image' in request.data and isinstance(request.data['image'], str):
                item.image = request.data['image']
            
            if 'title' in request.data:
                item.title = request.data['title']
            if 'subtitle' in request.data:
                item.subtitle = request.data['subtitle']
            if 'price' in request.data:
                item.price = request.data['price']
            if 'link' in request.data:
                item.link = request.data['link']
            if 'background_color' in request.data:
                item.background_color = request.data['background_color']
            if 'order' in request.data:
                item.order = int(request.data['order'])
            if 'is_active' in request.data:
                is_active_val = request.data['is_active']
                item.is_active = is_active_val in [True, 'true', 'True', '1', 1]
            
            item.save()
            return Response(ShoesCardSerializer(item).data, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def destroy(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        item = self.get_object()
        if item.image and 'cloudinary.com' in item.image:
            from .cloudinary_utils import extract_public_id_from_url, delete_image_from_cloudinary
            try:
                public_id = extract_public_id_from_url(item.image)
                if public_id:
                    delete_image_from_cloudinary(public_id)
                    print(f"✅ Deleted Shoes card image from Cloudinary: {public_id}")
            except Exception as e:
                print(f"Failed to delete image: {e}")
        
        return super().destroy(request, *args, **kwargs)


# ============================================
# RELATED PRODUCTS RECOMMENDATION SYSTEM
# ============================================

class RelatedProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing admin-pinned related products.
    Provides CRUD for admin and a hybrid recommendation endpoint.
    """
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        from .models import RelatedProduct
        product_id = self.request.query_params.get('product')
        if product_id:
            return RelatedProduct.objects.filter(product_id=product_id, is_active=True)
        return RelatedProduct.objects.all()
    
    def get_serializer_class(self):
        from .serializers import RelatedProductSerializer
        return RelatedProductSerializer
    
    def create(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        from .models import RelatedProduct
        from .serializers import RelatedProductSerializer
        
        try:
            product_id = request.data.get('product')
            related_id = request.data.get('related')
            position = int(request.data.get('position', 0))
            
            # Prevent self-relation
            if str(product_id) == str(related_id):
                return Response({'error': 'A product cannot be related to itself'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if relation already exists
            if RelatedProduct.objects.filter(product_id=product_id, related_id=related_id).exists():
                return Response({'error': 'This relation already exists'}, status=status.HTTP_400_BAD_REQUEST)
            
            related_product = RelatedProduct.objects.create(
                product_id=product_id,
                related_id=related_id,
                position=position,
                is_active=True
            )
            
            return Response(RelatedProductSerializer(related_product).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_related_products(request, slug):
    """
    Hybrid related products API endpoint.
    
    Priority Logic:
    1. Admin-pinned products (highest priority) - max 4
    2. Also-bought products (collaborative filtering from orders) - max 4
    3. Same category products (content-based fallback) - fill remaining
    
    Filtering:
    - Only is_active=True products
    - Only products with total_stock > 0
    - Exclude current product
    - Max 8 products total
    """
    from .models import RelatedProduct
    from .serializers import RelatedProductCardSerializer
    from orders.models import OrderItem
    from django.db.models import Count
    
    MAX_PRODUCTS = 8
    
    try:
        # Get the current product
        product = Product.objects.get(slug=slug, is_active=True)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
    
    related_ids = set()
    final_products = []
    
    # 1. ADMIN-PINNED PRODUCTS (highest priority)
    admin_pinned = RelatedProduct.objects.filter(
        product=product,
        is_active=True,
        related__is_active=True,
        related__total_stock__gt=0
    ).select_related('related').order_by('position')[:4]
    
    for pinned in admin_pinned:
        if pinned.related.id not in related_ids:
            final_products.append(pinned.related)
            related_ids.add(pinned.related.id)
    
    # 2. ALSO-BOUGHT PRODUCTS (collaborative filtering)
    if len(final_products) < MAX_PRODUCTS:
        # Find orders that contain this product
        orders_with_product = OrderItem.objects.filter(
            product=product
        ).values_list('order_id', flat=True)
        
        if orders_with_product:
            # Find other products in those orders
            also_bought = OrderItem.objects.filter(
                order_id__in=orders_with_product
            ).exclude(
                product=product
            ).exclude(
                product_id__in=related_ids
            ).filter(
                product__is_active=True,
                product__total_stock__gt=0
            ).values('product').annotate(
                count=Count('product')
            ).order_by('-count')[:4]
            
            for item in also_bought:
                if len(final_products) >= MAX_PRODUCTS:
                    break
                try:
                    also_product = Product.objects.get(id=item['product'])
                    if also_product.id not in related_ids:
                        final_products.append(also_product)
                        related_ids.add(also_product.id)
                except Product.DoesNotExist:
                    continue
    
    # 3. SAME CATEGORY PRODUCTS (content-based fallback)
    if len(final_products) < MAX_PRODUCTS:
        remaining_slots = MAX_PRODUCTS - len(final_products)
        
        category_products = Product.objects.filter(
            category=product.category,
            is_active=True,
            total_stock__gt=0
        ).exclude(
            id=product.id
        ).exclude(
            id__in=related_ids
        ).order_by('-rating', '-created_at')[:remaining_slots]
        
        for cat_product in category_products:
            if len(final_products) >= MAX_PRODUCTS:
                break
            if cat_product.id not in related_ids:
                final_products.append(cat_product)
                related_ids.add(cat_product.id)
    
    # Serialize and return
    serializer = RelatedProductCardSerializer(final_products, many=True)
    
    return Response({
        'product_id': product.id,
        'product_name': product.name,
        'count': len(final_products),
        'results': serializer.data
    })
