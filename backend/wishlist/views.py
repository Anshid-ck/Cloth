# wishlist/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Wishlist
from products.models import Product
from  .serializers import WishlistSerializer

# GET WISHLIST
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_wishlist(request):
    wishlist, created = Wishlist.objects.get_or_create(user=request.user)
    serializer = WishlistSerializer(wishlist)
    return Response(serializer.data)


# ADD PRODUCT TO WISHLIST
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_wishlist(request, product_id):
    wishlist, created = Wishlist.objects.get_or_create(user=request.user)
    product = get_object_or_404(Product, id=product_id)

    wishlist.products.add(product)
    wishlist.save()

    return Response({"message": "Product added to wishlist"})

# REMOVE PRODUCT FROM WISHLIST
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_from_wishlist(request, product_id):
    wishlist, created = Wishlist.objects.get_or_create(user=request.user)
    product = get_object_or_404(Product, id=product_id)

    wishlist.products.remove(product)
    wishlist.save()

    return Response({"message": "Product removed from wishlist"})