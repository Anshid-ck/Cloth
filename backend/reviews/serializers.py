# reviews/serializers.py
from rest_framework import serializers
from .models import Review, ReviewImage
from users.serializers import UserSerializer
from products.serializers import ProductListSerializer

class ReviewImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewImage
        fields = ['id', 'image']

class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.first_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    images = ReviewImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Review
        fields = [
            'id', 'rating', 'title', 'comment', 'user_name', 'user_email',
            'verified_purchase', 'helpful_count', 'created_at', 'images'
        ]

class ReviewCreateSerializer(serializers.ModelSerializer):
    comment = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Review
        fields = ['rating', 'title', 'comment']