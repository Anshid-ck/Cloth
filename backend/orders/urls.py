# orders/urls.py
from django.urls import path
from . import views

# Wire the ViewSet actions directly instead of using a router registered on ''.
# A router on '' generates /<pk>/ and /<pk>.<format>/ patterns that swallow
# /<order_id>/cancel/, /<order_id>/track/, etc. before they can be matched.
order_list   = views.OrderViewSet.as_view({'get': 'list'})
order_detail = views.OrderViewSet.as_view({'get': 'retrieve', 'delete': 'destroy'})
my_orders    = views.OrderViewSet.as_view({'get': 'my_orders'})

urlpatterns = [
    # ViewSet endpoints — identical URLs to what the frontend already calls
    path('', order_list, name='order-list'),
    path('my-orders/', my_orders, name='order-my-orders'),
    path('<int:pk>/', order_detail, name='order-detail'),

    # Custom endpoints — these are now declared AFTER the exact-match paths above,
    # so Django finds 'my-orders/' before it tries '<int:pk>/' on that string.
    path('create/', views.create_order, name='create-order'),
    path('<int:order_id>/track/', views.track_order, name='track-order'),
    path('<int:order_id>/cancel/', views.cancel_order, name='cancel-order'),
    path('<int:order_id>/update-status/', views.update_order_status, name='update-order-status'),
    path('<int:order_id>/packing-slip/', views.packing_slip_pdf, name='packing-slip'),
]