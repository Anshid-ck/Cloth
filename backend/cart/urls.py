# cart/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.get_cart, name='get-cart'),
    path('add/', views.add_to_cart, name='add-to-cart'),
    path('update/<int:item_id>/', views.update_cart_item, name='update-cart'),
    path('remove/<int:item_id>/', views.remove_from_cart, name='remove-cart'),
    path('clear/', views.clear_cart, name='clear-cart'),
]