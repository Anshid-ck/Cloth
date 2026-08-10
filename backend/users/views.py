# users/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone
from django.conf import settings
from google.auth.transport import requests as google_requests 
from google.oauth2.id_token import verify_oauth2_token
import secrets
import logging
import json
from django.db.models import Q

from .models import CustomUser, UserAddress, UserSession
from .serializers import UserSerializer, UserDetailSerializer, UserAddressSerializer

logger = logging.getLogger(__name__)

class UserAddressViewSet(viewsets.ModelViewSet):
    """CRUD for User Addresses"""
    serializer_class = UserAddressSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return UserAddress.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    Register new user - No email verification required
    User can login immediately after registration
    
    Expected fields:
    - first_name (required)
    - email (required)
    - password (required)
    - confirm_password (required)
    """
    try:
        data = request.data

        # Validation
        required_fields = ['first_name', 'email', 'password', 'confirm_password']
        for field in required_fields:
            if not data.get(field):
                return Response(
                    {'error': f'{field} is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Check if passwords match
        if data.get('password') != data.get('confirm_password'):
            return Response(
                {'error': 'Passwords do not match'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check password length
        if len(data.get('password', '')) < 8:
            return Response(
                {'error': 'Password must be at least 8 characters'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check email already exists
        if CustomUser.objects.filter(email=data.get('email')).exists():
            return Response(
                {'error': 'Email is already registered'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create user (no verification needed - auto verified)
        user = CustomUser.objects.create_user(
            email=data.get('email'),
            first_name=data.get('first_name'),
            password=data.get('password'),
            role='customer',
            is_verified=True  # Auto-verify on registration
        )

        serializer = UserSerializer(user)
        return Response(
            {
                'message': 'Registration successful! You can now login.',
                'user': serializer.data,
            },
            status=status.HTTP_201_CREATED
        )
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    User Login - Email and Password
    
    Expected fields:
    - email (required)
    - password (required)
    
    Returns: access token, refresh token, and user data
    """
    try:
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response(
                {'error': 'Email and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Authenticate using email
        user = CustomUser.objects.filter(email=email).first()
        
        if not user or not user.check_password(password):
            return Response(
                {'error': 'Invalid email or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if not user.is_active:
            return Response(
                {'error': 'Your account has been deactivated'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Create session
        ip_address = _get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        UserSession.objects.create(
            user=user,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        user.last_login = timezone.now()
        user.save()
        
        serializer = UserSerializer(user)
        
        return Response({
            'message': 'Login successful',
            'user': serializer.data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'is_admin': user.is_admin_user
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def admin_login(request):
    """
    Admin-specific login endpoint
    Only allows users with role='admin' or is_staff=True
    
    Expected fields:
    - email (required)
    - password (required)
    
    Returns: access token, refresh token, and user data (only for admin/staff users)
    """
    try:
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response(
                {'error': 'Email and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Authenticate using email
        user = CustomUser.objects.filter(email=email).first()
        
        if not user or not user.check_password(password):
            return Response(
                {'error': 'Invalid email or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check if user is admin or staff
        if not user.is_admin_user and user.role not in ['admin', 'staff']:
            return Response(
                {'error': 'Not authorized as admin'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not user.is_active:
            return Response(
                {'error': 'Your account has been deactivated'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Create session
        ip_address = _get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        UserSession.objects.create(
            user=user,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        user.last_login = timezone.now()
        user.save()
        
        serializer = UserSerializer(user)
        
        return Response({
            'message': 'Admin login successful',
            'user': serializer.data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'is_admin': True,
            'role': user.role
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Admin login error: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def google_login(request):
    try:
        token = request.data.get('token')
        
        if not token:
            return Response(
                {'error': 'Google token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify token
        idinfo = verify_oauth2_token(
            token,
            google_requests.Request(),
            settings.GOOGLE_OAUTH_CLIENT_ID
        )
        
        google_id = idinfo.get('sub')
        email = idinfo.get('email')
        first_name = idinfo.get('given_name', '')

        # Guard against incomplete token data
        if not google_id or not email:
            return Response(
                {'error': 'Invalid Google token: missing user info'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Handle existing email user safely
        user=CustomUser.objects.filter(email=email).first()
        created=False

        if not user:
            user=CustomUser.objects.create_user(
                email=email,
                google_id=google_id,
                first_name=first_name,
                is_google_account=True,
                is_verified=True,
                role='customer'

            )
            created=True
        elif not user.google_id:
            user.google_id=google_id
            user.is_google_account=True
            user.save()

        if not user.is_active:
            return Response(
                {'error':'Your account has been deactivated'},
                status=status.HTTP_403_FORBIDDEN
            )

        ip_address=_get_client_ip(request)
        user_agent=request.META.get('HTTP_USER_AGENT','')
        UserSession.objects.create(
            user=user,
            ip_address=ip_address,
            user_agent=user_agent
        )
        refresh=RefreshToken.for_user(user)
        user.last_login=timezone.now()
        user.save()

        serializer=UserSerializer(user)
        return Response({
            'message': 'Login successful',
            'user':serializer.data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'is_admin': user.is_admin_user,
            'is_new_user':created    
        }, status=status.HTTP_200_OK)
    except ValueError as e:
        return Response(
            {'error': 'Invalid or expired google token'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    except Exception as e:
        logger.error(f'Google login error:{str(e)}')
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )      

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """
    User Logout - Marks user session as inactive
    """
    try:
        session = UserSession.objects.filter(user=request.user, is_active=True).latest('login_at')
        session.is_active = False
        session.save()
        
        return Response(
            {'message': 'Logout successful'},
            status=status.HTTP_200_OK
        )
    except UserSession.DoesNotExist:
        return Response(
            {'message': 'Logout successful'},
            status=status.HTTP_200_OK
        )
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def profile(request):
    """
    Get or Update User Profile
    
    PUT allowed fields:
    - first_name
    - last_name
    - phone_number
    - profile_image
    - addresses (for checkout)
    """
    try:
        if request.method == 'GET':
            serializer = UserDetailSerializer(request.user)
            return Response(serializer.data)
        
        elif request.method == 'PUT':
            data = request.data
            user = request.user
            
            # Update allowed fields
            allowed_fields = ['first_name', 'last_name', 'phone_number', 'profile_image', 'gender']
            
            for field in allowed_fields:
                if field in data:
                    setattr(user, field, data[field])
            
            user.save()
            serializer = UserDetailSerializer(user)
            return Response(
                {'message': 'Profile updated successfully', 'user': serializer.data},
                status=status.HTTP_200_OK
            )
            
    except Exception as e:
        logger.error(f"Profile error: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    Change User Password
    
    Expected fields:
    - old_password (required)
    - new_password (required)
    - confirm_password (required)
    """
    try:
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        
        if not all([old_password, new_password, confirm_password]):
            return Response(
                {'error': 'All fields are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not user.check_password(old_password):
            return Response(
                {'error': 'Old password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_password != confirm_password:
            return Response(
                {'error': 'New passwords do not match'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(new_password) < 8:
            return Response(
                {'error': 'Password must be at least 8 characters'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(new_password)
        user.save()
        
        return Response(
            {'message': 'Password changed successfully'},
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        logger.error(f"Change password error: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_all_users(request):
    """
    Get all users (Admin only)
    """
    try:
        page = request.query_params.get('page', 1)
        search = request.query_params.get('search', '')
        
        users = CustomUser.objects.all().order_by('-created_at')
        
        if search:
            users = users.filter(
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        from django.core.paginator import Paginator
        paginator = Paginator(users, 20)
        page_obj = paginator.get_page(page)
        
        serializer = UserSerializer(page_obj.object_list, many=True)
        
        return Response({
            'users': serializer.data,
            'total': paginator.count,
            'pages': paginator.num_pages,
            'current_page': int(page)
        })
        
    except Exception as e:
        logger.error(f"Get users error: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def manage_user(request, user_id):
    """
    Get, update, or deactivate user (Admin only)
    """
    try:
        user = CustomUser.objects.get(id=user_id)
        
        if request.method == 'GET':
            serializer = UserDetailSerializer(user)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            action = request.data.get('action')
            
            if action == 'activate':
                user.is_active = True
            elif action == 'deactivate':
                user.is_active = False
            elif action == 'make_admin':
                user.role = 'admin'
            elif action == 'make_staff':
                user.role = 'staff'
            elif action == 'make_customer':
                user.role = 'customer'
            
            user.save()
            return Response(
                {'message': f'User {action} successfully'},
                status=status.HTTP_200_OK
            )
            
    except CustomUser.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Manage user error: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Helper Functions
def _get_client_ip(request):
    """Get client IP address"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip