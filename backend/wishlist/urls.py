#   wishlist/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.get_wishlist, name='get-wishlist'),
    path('add/<int:product_id>/', views.add_to_wishlist, name='add-wishlist'),
    path('remove/<int:product_id>/', views.remove_from_wishlist, name='remove-wishlist'),
]