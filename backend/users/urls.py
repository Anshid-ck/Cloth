# users/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

router = DefaultRouter()
router.register('addresses', views.UserAddressViewSet, basename='address')

urlpatterns = [
    # Authentication endpoints
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('admin-login/', views.admin_login, name='admin-login'),
    path('google-login/', views.google_login, name='google-login'),
    path('logout/', views.logout, name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Password management
    path('change-password/', views.change_password, name='change-password'),
    
    # User profile
    path('profile/', views.profile, name='profile'),
    
    # Admin Management
    path('admin/users/', views.get_all_users, name='get-all-users'),
    path('admin/users/<int:user_id>/', views.manage_user, name='manage-user'),
    
    #address management 
    path('', include(router.urls)),
]
