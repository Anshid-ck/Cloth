# payments/urls.py
from django.urls import path
from . import views

urlpatterns = [
    #payment endpoints
    path('create/', views.create_payment, name='create-payment'),
    path('confirm/', views.confirm_payment , name='confirm-payment'),
    path('order/<int:order_id>/', views.get_payment, name='get-payment'),
    
    #refund endpoints
    path('refund/request/', views.request_refund, name='request-refund'),
    path('refund/<int:refund_id>/', views.get_refund, name='get-refund'),
    
    # Webhook 
    path('webhook/stripe/', views.stripe_webhook, name='stripe-webhook'),
]