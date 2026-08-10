# orders/packing_slip.py
"""
Generates a packing-slip PDF for an order.
Uses ReportLab for PDF rendering and python-barcode for Code 128 barcodes.
"""

import io
import barcode
from barcode.writer import ImageWriter
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, HRFlowable,
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT


# ── Helpers ──────────────────────────────────────────────────────────────────

def _barcode_image(data, width_mm=50, height_mm=12):
    """Return a ReportLab-compatible Image flowable for a Code128 barcode."""
    buf = io.BytesIO()
    code128 = barcode.get('code128', str(data), writer=ImageWriter())
    code128.write(buf, options={
        'module_width': 0.3,
        'module_height': height_mm,
        'font_size': 8,
        'text_distance': 2,
        'quiet_zone': 2,
    })
    buf.seek(0)
    img = Image(buf, width=width_mm * mm, height=(height_mm + 6) * mm)
    return img


def _resolve_item_sku(item):
    """Best-effort SKU resolution: SizeStock → ColorVariant → ProductVariant."""
    if item.color_variant and item.size:
        ss = item.color_variant.size_stocks.filter(size=item.size).first()
        if ss and ss.sku:
            return ss.sku
    if item.color_variant:
        return item.color_variant.sku
    if item.variant:
        return item.variant.sku
    return 'N/A'


# ── Main generator ───────────────────────────────────────────────────────────

def generate_packing_slip_pdf(order):
    """
    Return an in-memory bytes buffer containing the packing-slip PDF for *order*.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=15 * mm,
        rightMargin=15 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
    )

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        'StoreName', parent=styles['Heading1'],
        fontSize=22, leading=26, alignment=TA_LEFT,
        textColor=colors.HexColor('#111111'),
        spaceAfter=2 * mm,
    ))
    styles.add(ParagraphStyle(
        'SectionTitle', parent=styles['Heading2'],
        fontSize=12, leading=14, alignment=TA_LEFT,
        textColor=colors.HexColor('#333333'),
        spaceBefore=4 * mm, spaceAfter=2 * mm,
    ))
    styles.add(ParagraphStyle(
        'InfoText', parent=styles['Normal'],
        fontSize=10, leading=13, alignment=TA_LEFT,
        textColor=colors.HexColor('#444444'),
    ))
    styles.add(ParagraphStyle(
        'SmallRight', parent=styles['Normal'],
        fontSize=9, leading=11, alignment=TA_RIGHT,
        textColor=colors.HexColor('#666666'),
    ))

    elements = []

    # ── Header: Store name + Order barcode ──────────────────────────────────
    header_data = [
        [
            Paragraph('POGIEE', styles['StoreName']),
            _barcode_image(order.order_number, width_mm=55, height_mm=10),
        ]
    ]
    header_table = Table(header_data, colWidths=[110 * mm, 70 * mm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 2 * mm))

    # Subtitle
    elements.append(Paragraph('PACKING SLIP', ParagraphStyle(
        'PackingLabel', parent=styles['Normal'],
        fontSize=14, leading=16, alignment=TA_LEFT,
        textColor=colors.HexColor('#888888'),
        fontName='Helvetica-Bold',
        spaceAfter=4 * mm,
    )))

    elements.append(HRFlowable(
        width='100%', thickness=1, color=colors.HexColor('#e0e0e0'),
        spaceAfter=4 * mm,
    ))

    # ── Order info row ──────────────────────────────────────────────────────
    order_date = order.created_at.strftime('%d %b %Y, %I:%M %p') if order.created_at else ''
    info_data = [
        [
            Paragraph(f'<b>Order ID:</b> {order.order_number}', styles['InfoText']),
            Paragraph(f'<b>Date:</b> {order_date}', styles['SmallRight']),
        ],
        [
            Paragraph(f'<b>Status:</b> {order.get_status_display()}', styles['InfoText']),
            Paragraph(f'<b>Payment:</b> {order.get_payment_method_display()}', styles['SmallRight']),
        ],
    ]
    info_table = Table(info_data, colWidths=[110 * mm, 70 * mm])
    info_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 4 * mm))

    # ── Customer & Shipping ─────────────────────────────────────────────────
    elements.append(Paragraph('SHIP TO', styles['SectionTitle']))

    addr_parts = [order.shipping_name]
    if order.shipping_phone:
        addr_parts.append(f'📞 {order.shipping_phone}')
    if order.shipping_address_line1:
        addr_parts.append(order.shipping_address_line1)
    if order.shipping_address_line2:
        addr_parts.append(order.shipping_address_line2)
    city_state = ', '.join(filter(None, [
        order.shipping_city, order.shipping_state,
    ]))
    if order.shipping_pincode:
        city_state += f' - {order.shipping_pincode}'
    if city_state:
        addr_parts.append(city_state)

    elements.append(Paragraph('<br/>'.join(addr_parts), styles['InfoText']))
    elements.append(Spacer(1, 4 * mm))

    # ── Items table ─────────────────────────────────────────────────────────
    elements.append(Paragraph('ORDER ITEMS', styles['SectionTitle']))

    # Table header
    col_widths = [8 * mm, 52 * mm, 18 * mm, 30 * mm, 12 * mm, 34 * mm, 28 * mm]
    table_header = ['#', 'Product', 'Size', 'Color', 'Qty', 'SKU', 'Barcode']
    table_data = [table_header]

    items = list(order.items.select_related('product', 'color_variant', 'variant').all())
    for idx, item in enumerate(items, 1):
        sku = _resolve_item_sku(item)
        color_name = ''
        if item.color_variant:
            color_name = item.color_variant.color_name
        elif item.variant and item.variant.color:
            color_name = item.variant.color.name

        # Generate a small barcode for the SKU
        try:
            sku_barcode = _barcode_image(sku, width_mm=26, height_mm=8)
        except Exception:
            sku_barcode = Paragraph(sku, styles['InfoText'])

        table_data.append([
            str(idx),
            Paragraph(item.product.name if item.product else 'N/A', styles['InfoText']),
            item.size or '-',
            color_name or '-',
            str(item.quantity),
            Paragraph(f'<font size="8">{sku}</font>', styles['InfoText']),
            sku_barcode,
        ])

    items_table = Table(table_data, colWidths=col_widths, repeatRows=1)
    items_table.setStyle(TableStyle([
        # Header styling
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#111111')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        # Body styling
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TOPPADDING', (0, 1), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#dddddd')),
        # Alternating row colors
        *[('BACKGROUND', (0, i), (-1, i), colors.HexColor('#f9f9f9'))
          for i in range(2, len(table_data), 2)],
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 6 * mm))

    # ── Pricing summary ─────────────────────────────────────────────────────
    elements.append(HRFlowable(
        width='100%', thickness=0.5, color=colors.HexColor('#e0e0e0'),
        spaceAfter=3 * mm,
    ))

    summary_data = [
        ['Subtotal', f'₹{int(order.subtotal)}'],
        ['Shipping', f'₹{int(order.shipping_charge)}' if order.shipping_charge else 'Free'],
    ]
    if order.discount:
        summary_data.append(['Discount', f'-₹{int(order.discount)}'])
    summary_data.append(['TOTAL', f'₹{int(order.total)}'])

    summary_table = Table(summary_data, colWidths=[140 * mm, 40 * mm])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        # Bold the total row
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, -1), (-1, -1), 12),
        ('LINEABOVE', (0, -1), (-1, -1), 1, colors.HexColor('#111111')),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 10 * mm))

    # ── Footer ──────────────────────────────────────────────────────────────
    elements.append(HRFlowable(
        width='100%', thickness=0.5, color=colors.HexColor('#e0e0e0'),
        spaceAfter=3 * mm,
    ))
    elements.append(Paragraph(
        'Thank you for shopping with ClothWbF!',
        ParagraphStyle(
            'Footer', parent=styles['Normal'],
            fontSize=9, alignment=TA_CENTER,
            textColor=colors.HexColor('#999999'),
        ),
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer
