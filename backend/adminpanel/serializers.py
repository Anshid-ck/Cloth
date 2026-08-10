# backend/adminpanel/serializers.py
from rest_framework import serializers
from users.models import CustomUser
from orders.models import Order
from products.models import Product
from django.contrib.auth import authenticate

class AdminLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    
    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        
        try:
            user = CustomUser.objects.get(email=email)
            if not user.is_staff:
                raise serializers.ValidationError("Not authorized as admin")
            
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError("Invalid credentials")
            
            data['user'] = user
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("User not found")
        
        return data

class DashboardStatsSerializer(serializers.Serializer):
    total_users = serializers.IntegerField()
    total_products = serializers.IntegerField()
    total_orders = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    today_orders = serializers.IntegerField()
    today_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    pending_orders = serializers.IntegerField()
    avg_order_value = serializers.DecimalField(max_digits=10, decimal_places=2)

class SalesReportSerializer(serializers.Serializer):
    date = serializers.DateField()
    sales = serializers.DecimalField(max_digits=12, decimal_places=2)
    count = serializers.IntegerField()