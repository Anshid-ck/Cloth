# reviews/views.py
from django.db import models
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Review
from .serializers import ReviewSerializer, ReviewCreateSerializer
from products.models import Product
from orders.models import Order, OrderItem

@api_view(['GET'])
@permission_classes([AllowAny])
def get_product_reviews(request, product_id):
    try:
        reviews = Review.objects.filter(
            product_id=product_id,
            is_approved=True
        ).order_by('-created_at')
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_can_review(request, product_id):
    """Check if user can review a product (must have delivered order)"""
    try:
        product = Product.objects.get(id=product_id)
        
        # Check if user has a delivered order for this product
        has_delivered = OrderItem.objects.filter(
            order__user=request.user,
            order__status='delivered',
            product=product
        ).exists()
        
        # Check if user already has a review
        existing_review = Review.objects.filter(
            product=product,
            user=request.user
        ).first()
        
        return Response({
            'can_review': has_delivered,
            'has_reviewed': existing_review is not None,
            'existing_review': ReviewSerializer(existing_review).data if existing_review else None
        })
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_review(request):
    """Create a new review - only for users with delivered orders"""
    try:
        product_id = request.data.get('product_id')
        
        if not product_id:
            return Response({'error': 'Product ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if user has a delivered order for this product
        has_delivered = OrderItem.objects.filter(
            order__user=request.user,
            order__status='delivered',
            product=product
        ).exists()
        
        if not has_delivered:
            return Response({
                'error': 'You can only review products that have been delivered to you'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Check if user already reviewed this product
        existing_review = Review.objects.filter(
            product=product,
            user=request.user
        ).first()
        
        if existing_review:
            return Response({
                'error': 'You have already reviewed this product. Please update your existing review.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = ReviewCreateSerializer(data=request.data)
        if serializer.is_valid():
            review = Review.objects.create(
                product=product,
                user=request.user,
                verified_purchase=True,  # Always true since we verified delivery
                is_approved=True,
                rating=serializer.validated_data.get('rating'),
                title=serializer.validated_data.get('title', ''),
                comment=serializer.validated_data.get('comment', '') or ''
            )
            
            # Update product rating
            update_product_rating(product)
            
            return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_review(request, review_id):
    """Update an existing review"""
    try:
        try:
            review = Review.objects.get(id=review_id, user=request.user)
        except Review.DoesNotExist:
            return Response({'error': 'Review not found or not yours'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = ReviewCreateSerializer(data=request.data)
        if serializer.is_valid():
            review.rating = serializer.validated_data.get('rating', review.rating)
            review.title = serializer.validated_data.get('title', review.title)
            review.comment = serializer.validated_data.get('comment', review.comment) or ''
            review.save()
            
            # Update product rating
            update_product_rating(review.product)
            
            return Response(ReviewSerializer(review).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_review(request, review_id):
    """Delete a review"""
    try:
        try:
            review = Review.objects.get(id=review_id, user=request.user)
        except Review.DoesNotExist:
            return Response({'error': 'Review not found or not yours'}, status=status.HTTP_404_NOT_FOUND)
        
        product = review.product
        review.delete()
        
        # Update product rating
        update_product_rating(product)
        
        return Response({'message': 'Review deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_helpful(request, review_id):
    try:
        review = Review.objects.get(id=review_id)
        review.helpful_count += 1
        review.save()
        serializer = ReviewSerializer(review)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def update_product_rating(product):
    """Helper function to update product rating and review count"""
    avg_rating = Review.objects.filter(product=product, is_approved=True).aggregate(
        avg=models.Avg('rating')
    )['avg']
    product.rating = avg_rating or 0
    product.reviews_count = Review.objects.filter(product=product, is_approved=True).count()
    product.save()