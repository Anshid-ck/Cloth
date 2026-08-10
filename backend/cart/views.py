# cart/views.py
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Cart, CartItem
from products.models import Product, ProductVariant, ColorVariant, SizeStock
from .serializers import CartSerializer, CartItemSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cart(request):
    try:
        cart, created = Cart.objects.get_or_create(user=request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_cart(request):
    try:
        product_id = request.data.get('product_id')
        variant_id = request.data.get('variant_id')  # This is now ColorVariant ID
        size = request.data.get('size')  # Size selected by user
        quantity = int(request.data.get('quantity', 1))
        
        if not product_id:
            return Response({'error': 'product_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            product = Product.objects.get(id=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found or inactive'}, status=status.HTTP_404_NOT_FOUND)
        except ValueError:
            return Response({'error': 'Invalid product_id format'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Handle ColorVariant (new system)
        color_variant = None
        if variant_id:
            try:
                color_variant = ColorVariant.objects.get(id=variant_id, product=product)
            except ColorVariant.DoesNotExist:
                return Response({'error': 'Color variant not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Validate size stock if size is provided
            if size:
                try:
                    size_stock = SizeStock.objects.get(variant=color_variant, size=size)
                    if size_stock.quantity < quantity:
                        return Response({'error': f'Only {size_stock.quantity} items available'}, status=status.HTTP_400_BAD_REQUEST)
                except SizeStock.DoesNotExist:
                    return Response({'error': f'Size {size} not available for this variant'}, status=status.HTTP_400_BAD_REQUEST)
        
        cart, _ = Cart.objects.get_or_create(user=request.user)
        
        # Look for existing cart item with same product, color variant, and size
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            color_variant=color_variant,
            size=size,
            defaults={'quantity': quantity}
        )
        
        if not created:
            cart_item.quantity += quantity
            cart_item.save()
        
        cart.save()
        serializer = CartSerializer(cart)
        return Response({'message': 'Added to cart', 'cart': serializer.data}, status=status.HTTP_201_CREATED)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_cart_item(request, item_id):
    try:
        cart = Cart.objects.get(user=request.user)
        item = CartItem.objects.get(id=item_id, cart=cart)
        
        quantity = int(request.data.get('quantity', 1))
        if quantity <= 0:
            item.delete()
        else:
            item.quantity = quantity
            item.save()
        
        serializer = CartSerializer(cart)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_from_cart(request, item_id):
    try:
        CartItem.objects.get(id=item_id, cart__user=request.user).delete()
        cart = Cart.objects.get(user=request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def clear_cart(request):
    try:
        cart = Cart.objects.get(user=request.user)
        cart.items.all().delete()
        serializer = CartSerializer(cart)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)