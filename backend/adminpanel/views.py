# adminpanel/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Sum, Count, Avg, F, Q, DecimalField, ExpressionWrapper
from django.db.models.functions import TruncMonth, TruncWeek, TruncDate, Coalesce
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from orders.models import Order, OrderItem
from products.models import Product, Category
from users.models import CustomUser
from payments.models import Payment
from .serializers import AdminLoginSerializer, DashboardStatsSerializer, SalesReportSerializer

# ---------------------------------------------------------------------------
# Orders that have been paid / are actively fulfilling.
# Excludes: pending (unpaid), cancelled, refunded.
# ---------------------------------------------------------------------------
PAID_STATUSES = ['confirmed', 'processing', 'shipped', 'delivered']

def paid_orders_qs():
    """Return a queryset of orders that count as actual sales."""
    return Order.objects.filter(status__in=PAID_STATUSES)


@api_view(['POST'])
@permission_classes([])
def admin_login(request):
    """
    Admin-specific login via /auth/admin-login/
    Only allows users with role='admin' or is_staff=True
    """
    serializer = AdminLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']

        # Generate tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': 'admin' if user.is_staff else 'user',
                'profile_image': user.profile_image.url if user.profile_image else None,
            }
        }, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def dashboard_stats(request):
    """
    Get comprehensive dashboard statistics.

    Revenue / sales figures count ONLY orders with status in PAID_STATUSES
    (confirmed, processing, shipped, delivered).
    Pending, cancelled, and refunded orders are excluded from all monetary stats.
    """
    try:
        today = timezone.now().date()

        paid_qs = paid_orders_qs()

        # ---- Basic counts ------------------------------------------------
        total_users    = CustomUser.objects.count()
        total_products = Product.objects.count()

        # All orders ever placed (for operations view)
        total_orders_all = Order.objects.count()
        # Only paid/fulfilling orders (for sales metrics)
        paid_orders_count = paid_qs.count()

        pending_orders  = Order.objects.filter(status='pending').count()
        cancelled_orders = Order.objects.filter(status='cancelled').count()

        # ---- Revenue figures (paid orders only) --------------------------
        total_revenue = paid_qs.aggregate(
            rev=Coalesce(Sum('total'), Decimal('0'))
        )['rev']

        today_orders = paid_qs.filter(created_at__date=today).count()
        today_revenue = paid_qs.filter(created_at__date=today).aggregate(
            rev=Coalesce(Sum('total'), Decimal('0'))
        )['rev']

        avg_order_value = paid_qs.aggregate(
            avg=Coalesce(Avg('total'), Decimal('0'))
        )['avg']

        # ---- Week-over-week growth (paid orders) -------------------------
        this_week_start = today - timedelta(days=today.weekday())          # Monday
        last_week_start = this_week_start - timedelta(weeks=1)
        last_week_end   = this_week_start - timedelta(days=1)

        this_week_revenue = paid_qs.filter(
            created_at__date__gte=this_week_start
        ).aggregate(rev=Coalesce(Sum('total'), Decimal('0')))['rev']

        last_week_revenue = paid_qs.filter(
            created_at__date__gte=last_week_start,
            created_at__date__lte=last_week_end
        ).aggregate(rev=Coalesce(Sum('total'), Decimal('0')))['rev']

        if last_week_revenue and last_week_revenue > 0:
            week_growth = float(
                ((this_week_revenue - last_week_revenue) / last_week_revenue) * 100
            )
        elif this_week_revenue > 0:
            week_growth = 100.0
        else:
            week_growth = 0.0

        # ---- Inventory stats ---------------------------------------------
        total_stock  = Product.objects.aggregate(
            s=Coalesce(Sum('total_stock'), 0)
        )['s']
        out_of_stock = Product.objects.filter(total_stock__lte=0).count()
        low_stock    = Product.objects.filter(total_stock__gt=0, total_stock__lte=10).count()
        in_stock_count = total_products - out_of_stock

        # ---- Top selling products — from paid orders only ---------------
        # Count quantity sold (not just row count) and revenue
        top_products = []
        try:
            top_products_qs = (
                OrderItem.objects
                .filter(order__status__in=PAID_STATUSES)
                .values('product__id', 'product__name')
                .annotate(
                    units_sold=Coalesce(Sum('quantity'), 0),
                    revenue=Coalesce(
                        Sum(ExpressionWrapper(F('price') * F('quantity'),
                                             output_field=DecimalField())),
                        Decimal('0')
                    )
                )
                .filter(product__isnull=False)
                .order_by('-units_sold')[:10]
            )
            top_products = [
                {
                    'id':         item['product__id'],
                    'name':       item['product__name'],
                    'units_sold': item['units_sold'],
                    'revenue':    float(item['revenue']),
                }
                for item in top_products_qs
            ]
        except Exception:
            top_products = []

        # ---- Category sales — real revenue from paid order items --------
        category_sales = []
        try:
            cat_qs = (
                OrderItem.objects
                .filter(order__status__in=PAID_STATUSES, product__isnull=False)
                .values('product__category__name')
                .annotate(
                    units_sold=Coalesce(Sum('quantity'), 0),
                    revenue=Coalesce(
                        Sum(ExpressionWrapper(F('price') * F('quantity'),
                                             output_field=DecimalField())),
                        Decimal('0')
                    )
                )
                .filter(product__category__name__isnull=False)
                .order_by('-revenue')[:10]
            )
            total_cat_revenue = sum(float(c['revenue']) for c in cat_qs)
            category_sales = [
                {
                    'name':       c['product__category__name'],
                    'revenue':    float(c['revenue']),
                    'units_sold': c['units_sold'],
                    # percentage share of total paid revenue
                    'value': round(
                        (float(c['revenue']) / total_cat_revenue * 100)
                        if total_cat_revenue > 0 else 0,
                        1
                    ),
                }
                for c in cat_qs
            ]
        except Exception:
            category_sales = []

        # ---- Top categories by product count (for dashboard pie) --------
        top_categories = list(
            Category.objects.annotate(
                product_count=Count('products')
            ).values('name', 'product_count').order_by('-product_count')[:10]
        )

        # ---- Monthly revenue — last 6 months, paid orders only ----------
        six_months_ago = today - timedelta(days=180)
        monthly_revenue_qs = (
            paid_qs
            .filter(created_at__date__gte=six_months_ago)
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(
                revenue=Coalesce(Sum('total'), Decimal('0')),
                orders=Count('id')
            )
            .order_by('month')
        )
        monthly_revenue = [
            {
                'month':   item['month'].strftime('%b'),
                'revenue': float(item['revenue']),
                'orders':  item['orders'],
            }
            for item in monthly_revenue_qs
            if item.get('month')
        ]

        # ---- Inventory percentage for pie chart -------------------------
        # Use out_of_stock vs in_stock as ratio, not "sold" (approximation removed)
        out_pct  = round((out_of_stock / max(total_products, 1)) * 100) if total_products > 0 else 0
        in_pct   = 100 - out_pct

        stats = {
            # ---- Counts
            'total_users':      total_users,
            'total_products':   total_products,
            'total_orders':     total_orders_all,   # all ever placed
            'paid_orders':      paid_orders_count,  # confirmed/processing/shipped/delivered
            'pending_orders':   pending_orders,
            'cancelled_orders': cancelled_orders,

            # ---- Revenue (paid orders only)
            'total_revenue':    float(total_revenue),
            'today_revenue':    float(today_revenue),
            'today_orders':     today_orders,
            'avg_order_value':  float(avg_order_value),

            # ---- Week comparison
            'this_week_revenue': float(this_week_revenue),
            'last_week_revenue': float(last_week_revenue),
            'week_growth':       round(week_growth, 2),

            # ---- Inventory
            'total_stock':          total_stock,
            'out_of_stock':         out_of_stock,
            'low_stock':            low_stock,
            'in_stock_count':       in_stock_count,
            'sold_percentage':      out_pct,     # renamed to out_of_stock_percentage for clarity
            'available_percentage': in_pct,

            # ---- Analytics
            'top_products':    top_products,
            'category_sales':  category_sales,
            'top_categories':  top_categories,
            'monthly_revenue': monthly_revenue,
        }

        return Response(stats)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def sales_report(request):
    """
    Get sales report for specified period — PAID orders only.

    Query params:
        period: 'daily' (last 1 day), 'weekly' (last 7 days), 'monthly' (last 30 days)

    Returns list of { date, sales (revenue), count (order count) }
    """
    try:
        period = request.query_params.get('period', 'monthly')
        days_map = {'daily': 1, 'weekly': 7, 'monthly': 30}
        days = days_map.get(period, 30)

        start_date = timezone.now().date() - timedelta(days=days)

        paid_qs = paid_orders_qs().filter(created_at__date__gte=start_date)

        orders_by_date = (
            paid_qs
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(
                sales=Coalesce(Sum('total'), Decimal('0')),
                count=Count('id')
            )
            .order_by('date')
        )

        result = [
            {
                'date':  item['date'].strftime('%Y-%m-%d') if item['date'] else '',
                'sales': float(item['sales']),
                'count': item['count'],
            }
            for item in orders_by_date
        ]

        return Response(result)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_check(request):
    """Check if user is admin"""
    return Response({
        'is_admin': request.user.is_staff,
        'user': {
            'id':         request.user.id,
            'email':      request.user.email,
            'first_name': request.user.first_name,
        }
    })
