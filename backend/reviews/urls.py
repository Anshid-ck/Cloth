# reviews/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('product/<int:product_id>/', views.get_product_reviews, name='product-reviews'),
    path('can-review/<int:product_id>/', views.check_can_review, name='can-review'),
    path('create/', views.create_review, name='create-review'),
    path('update/<int:review_id>/', views.update_review, name='update-review'),
    path('delete/<int:review_id>/', views.delete_review, name='delete-review'),
    path('helpful/<int:review_id>/', views.mark_helpful, name='mark-helpful'),
]
