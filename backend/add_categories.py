import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from products.models import Category

categories = [
    {'name': 'Hoodies', 'slug': 'hoodies', 'category_type': 'hoodies'},
    {'name': 'T-Shirts', 'slug': 'tshirts', 'category_type': 'tshirts'},
    {'name': 'Shirts', 'slug': 'shirts', 'category_type': 'shirts'},
    {'name': 'Pants', 'slug': 'pants', 'category_type': 'pants'},
    {'name': 'Bottomwear', 'slug': 'bottomwear', 'category_type': 'bottomwear'},
    {'name': 'Accessories', 'slug': 'accessories', 'category_type': 'accessories'},
    {'name': 'Shoes', 'slug': 'shoes', 'category_type': 'shoes'},
]

for cat in categories:
    obj, created = Category.objects.get_or_create(
        slug=cat['slug'],
        defaults=cat
    )
    print('Created' if created else 'Exists', ':', obj.name)

print('\nAll categories:')
for c in Category.objects.all():
    print(f'  {c.id} | {c.name} | {c.slug} | {c.category_type}')