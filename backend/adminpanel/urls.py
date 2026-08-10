# backend/adminpanel/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.admin_login, name='admin_login'),
    path('check/', views.admin_check, name='admin_check'),
    path('dashboard-stats/', views.dashboard_stats, name='dashboard_stats'),
    path('sales-report/', views.sales_report, name='sales_report'),
]