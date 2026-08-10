# users/serializers.py
from rest_framework import serializers
from .models import CustomUser, UserAddress, UserSession

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone_number',
            'profile_image', 'role', 'is_verified', 'created_at', 'is_google_account', 'gender'
        ]
        read_only_fields = ['id', 'created_at', 'role']

class UserDetailSerializer(serializers.ModelSerializer):
    addresses = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone_number',
            'profile_image', 'role', 'is_verified', 'addresses', 'created_at', 'gender'
        ]
    
    def get_addresses(self, obj):
        addresses = obj.addresses.all()
        return UserAddressSerializer(addresses, many=True).data

class UserAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAddress
        fields = [
            'id', 'name', 'phone', 'address_line1', 'address_line2',
            'city', 'state', 'pincode', 'landmark', 'latitude', 'longitude', 'address_type',
            'is_default', 'created_at'
        ]