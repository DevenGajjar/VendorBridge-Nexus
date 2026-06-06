import os
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from app.repositories import purchase_order_repo, invoice_repo, vendor_repo

PDF_DIR = "generated_pdfs"
os.makedirs(PDF_DIR, exist_ok=True)

class PDFService:
    @staticmethod
    def generate_purchase_order_pdf(db: Session, po_id: uuid.UUID) -> str:
        po = purchase_order_repo.get(db, po_id)
        if not po:
            raise ValueError(f"Purchase Order with ID {po_id} not found.")

        vendor = vendor_repo.get(db, po.vendor_id)
        if not vendor:
            raise ValueError(f"Vendor associated with PO {po_id} not found.")

        file_path = os.path.join(PDF_DIR, f"PO_{po.po_number}.pdf")
        doc = SimpleDocTemplate(file_path, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor("#1A365D"),
            spaceAfter=12
        )
        meta_label_style = ParagraphStyle(
            'MetaLabel',
            parent=styles['Normal'],
            fontSize=10,
            fontName="Helvetica-Bold",
            textColor=colors.HexColor("#4A5568")
        )
        meta_val_style = ParagraphStyle(
            'MetaVal',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor("#2D3748")
        )
        section_title_style = ParagraphStyle(
            'SectionTitle',
            parent=styles['Heading2'],
            fontSize=12,
            fontName="Helvetica-Bold",
            textColor=colors.HexColor("#1A365D"),
            spaceAfter=6
        )

        elements = []

        # 1. Header Table
        header_data = [
            [
                Paragraph("VENDORBRIDGE NEXUS ERP", title_style),
                Paragraph("<b>PURCHASE ORDER</b>", ParagraphStyle('DocType', parent=styles['Heading3'], fontSize=16, textColor=colors.HexColor("#2B6CB0"), alignment=2))
            ]
        ]
        header_table = Table(header_data, colWidths=[300, 240])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ]))
        elements.append(header_table)
        elements.append(Spacer(1, 10))

        # 2. Metadata Block
        issue_date_str = po.created_at.strftime("%Y-%m-%d %H:%M") if po.created_at else datetime.utcnow().strftime("%Y-%m-%d")
        del_date_str = po.delivery_date.strftime("%Y-%m-%d") if po.delivery_date else "N/A"
        
        meta_data = [
            [
                Paragraph("PO Number:", meta_label_style), Paragraph(po.po_number, meta_val_style),
                Paragraph("Issue Date:", meta_label_style), Paragraph(issue_date_str, meta_val_style)
            ],
            [
                Paragraph("Status:", meta_label_style), Paragraph(po.status, meta_val_style),
                Paragraph("Delivery Date:", meta_label_style), Paragraph(del_date_str, meta_val_style)
            ]
        ]
        meta_table = Table(meta_data, colWidths=[90, 180, 90, 180])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F7FAFC")),
            ('PADDING', (0,0), (-1,-1), 6),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 15))

        # 3. Addresses Section
        addr_data = [
            [
                Paragraph("<b>Bill To:</b><br/>VendorBridge Corporate HQ<br/>100 Tech Park, Whitefield<br/>Bangalore, KA, 560066<br/>GSTIN: 29AAACV1234F1Z1", meta_val_style),
                Paragraph(f"<b>Vendor / Ship To:</b><br/>{vendor.name}<br/>{vendor.address or 'No Address'}<br/>Email: {vendor.email}<br/>Phone: {vendor.phone or 'N/A'}<br/>GSTIN: {vendor.gst_number}", meta_val_style)
            ]
        ]
        addr_table = Table(addr_data, colWidths=[270, 270])
        addr_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('PADDING', (0,0), (-1,-1), 8),
            ('BACKGROUND', (0,0), (0,0), colors.HexColor("#EDF2F7")),
            ('BACKGROUND', (1,0), (1,0), colors.HexColor("#EDF2F7")),
            ('BOX', (0,0), (0,0), 0.5, colors.HexColor("#CBD5E0")),
            ('BOX', (1,0), (1,0), 0.5, colors.HexColor("#CBD5E0")),
        ]))
        elements.append(addr_table)
        elements.append(Spacer(1, 15))

        # 4. Line Items Table
        elements.append(Paragraph("Line Items", section_title_style))
        
        table_header_style = ParagraphStyle('TableHeader', parent=styles['Normal'], fontSize=9, fontName="Helvetica-Bold", textColor=colors.white)
        table_cell_style = ParagraphStyle('TableCell', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor("#2D3748"))
        
        items_data = [
            [
                Paragraph("<b>S.No</b>", table_header_style),
                Paragraph("<b>Item Name</b>", table_header_style),
                Paragraph("<b>Qty</b>", table_header_style),
                Paragraph("<b>Unit Price (INR)</b>", table_header_style),
                Paragraph("<b>Total (INR)</b>", table_header_style)
            ]
        ]

        subtotal = 0.0
        for idx, item in enumerate(po.items, 1):
            qty = item.quantity or 0
            price = float(item.unit_price) or 0.0
            tot = float(item.total_price) or (qty * price)
            subtotal += tot
            
            items_data.append([
                Paragraph(str(idx), table_cell_style),
                Paragraph(item.item_name, table_cell_style),
                Paragraph(str(qty), table_cell_style),
                Paragraph(f"{price:,.2f}", table_cell_style),
                Paragraph(f"{tot:,.2f}", table_cell_style)
            ])

        # GST calculation: standard 18% (split CGST 9%, SGST 9%)
        cgst = subtotal * 0.09
        sgst = subtotal * 0.09
        grand_total = subtotal + cgst + sgst

        # Append Summary rows
        items_data.append(["", "", "", Paragraph("<b>Subtotal:</b>", table_cell_style), Paragraph(f"<b>{subtotal:,.2f}</b>", table_cell_style)])
        items_data.append(["", "", "", Paragraph("<b>CGST (9%):</b>", table_cell_style), Paragraph(f"{cgst:,.2f}", table_cell_style)])
        items_data.append(["", "", "", Paragraph("<b>SGST (9%):</b>", table_cell_style), Paragraph(f"{sgst:,.2f}", table_cell_style)])
        items_data.append(["", "", "", Paragraph("<b>Grand Total:</b>", ParagraphStyle('GrandStyle', parent=table_cell_style, fontName="Helvetica-Bold")), Paragraph(f"<b>{grand_total:,.2f}</b>", ParagraphStyle('GrandStyleVal', parent=table_cell_style, fontName="Helvetica-Bold"))])

        items_table = Table(items_data, colWidths=[40, 240, 50, 100, 110])
        items_table_style = [
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#2B6CB0")),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('GRID', (0,0), (-1,-5), 0.5, colors.HexColor("#E2E8F0")),  # Border for line items
            ('LINEBELOW', (3,-4), (4,-1), 1, colors.HexColor("#1A365D")),  # Line for summary
        ]
        
        # Zebra striping for lines
        for r_idx in range(1, len(po.items) + 1):
            if r_idx % 2 == 0:
                items_table_style.append(('BACKGROUND', (0, r_idx), (-1, r_idx), colors.HexColor("#F7FAFC")))
                
        items_table.setStyle(TableStyle(items_table_style))
        elements.append(items_table)
        elements.append(Spacer(1, 40))

        # 5. Signature Section
        sig_data = [
            [
                Paragraph("Prepared By:<br/><br/>______________________<br/>Procurement Executive", meta_val_style),
                Paragraph("Authorized Signatory:<br/><br/>______________________<br/>Procurement Manager", meta_val_style)
            ]
        ]
        sig_table = Table(sig_data, colWidths=[270, 270])
        sig_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
            ('ALIGN', (1,0), (1,0), 'RIGHT'),
        ]))
        elements.append(sig_table)

        # Build PDF
        doc.build(elements)
        return file_path

    @staticmethod
    def generate_invoice_pdf(db: Session, invoice_id: uuid.UUID) -> str:
        invoice = invoice_repo.get(db, invoice_id)
        if not invoice:
            raise ValueError(f"Invoice with ID {invoice_id} not found.")

        po = purchase_order_repo.get(db, invoice.purchase_order_id)
        if not po:
            raise ValueError(f"PO associated with invoice {invoice_id} not found.")

        vendor = vendor_repo.get(db, po.vendor_id)
        if not vendor:
            raise ValueError(f"Vendor associated with PO {po.id} not found.")

        file_path = os.path.join(PDF_DIR, f"INV_{invoice.invoice_number}.pdf")
        doc = SimpleDocTemplate(file_path, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor("#2C5282"),
            spaceAfter=12
        )
        meta_label_style = ParagraphStyle(
            'MetaLabel',
            parent=styles['Normal'],
            fontSize=10,
            fontName="Helvetica-Bold",
            textColor=colors.HexColor("#4A5568")
        )
        meta_val_style = ParagraphStyle(
            'MetaVal',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor("#2D3748")
        )
        section_title_style = ParagraphStyle(
            'SectionTitle',
            parent=styles['Heading2'],
            fontSize=12,
            fontName="Helvetica-Bold",
            textColor=colors.HexColor("#2C5282"),
            spaceAfter=6
        )

        elements = []

        # 1. Header Table
        header_data = [
            [
                Paragraph("<b>TAX INVOICE</b>", title_style),
                Paragraph(f"<b>{vendor.name}</b>", ParagraphStyle('VendorNameHeader', parent=styles['Heading3'], fontSize=16, textColor=colors.HexColor("#2D3748"), alignment=2))
            ]
        ]
        header_table = Table(header_data, colWidths=[270, 270])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ]))
        elements.append(header_table)
        elements.append(Spacer(1, 10))

        # 2. Metadata Block
        issue_date_str = invoice.created_at.strftime("%Y-%m-%d %H:%M") if invoice.created_at else datetime.utcnow().strftime("%Y-%m-%d")
        due_date_str = invoice.due_date.strftime("%Y-%m-%d") if invoice.due_date else "N/A"
        
        meta_data = [
            [
                Paragraph("Invoice Number:", meta_label_style), Paragraph(invoice.invoice_number, meta_val_style),
                Paragraph("Issue Date:", meta_label_style), Paragraph(issue_date_str, meta_val_style)
            ],
            [
                Paragraph("PO Reference:", meta_label_style), Paragraph(po.po_number, meta_val_style),
                Paragraph("Due Date:", meta_label_style), Paragraph(due_date_str, meta_val_style)
            ],
            [
                Paragraph("Status:", meta_label_style), Paragraph(invoice.status, meta_val_style),
                Paragraph("", meta_label_style), Paragraph("", meta_val_style)
            ]
        ]
        meta_table = Table(meta_data, colWidths=[90, 180, 90, 180])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F7FAFC")),
            ('PADDING', (0,0), (-1,-1), 6),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 15))

        # 3. Addresses Section
        addr_data = [
            [
                Paragraph(f"<b>Bill From / Remit To:</b><br/>{vendor.name}<br/>{vendor.address or 'No Address'}<br/>Email: {vendor.email}<br/>Phone: {vendor.phone or 'N/A'}<br/>GSTIN: {vendor.gst_number}", meta_val_style),
                Paragraph("<b>Bill To:</b><br/>VendorBridge Corporate HQ<br/>100 Tech Park, Whitefield<br/>Bangalore, KA, 560066<br/>GSTIN: 29AAACV1234F1Z1", meta_val_style)
            ]
        ]
        addr_table = Table(addr_data, colWidths=[270, 270])
        addr_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('PADDING', (0,0), (-1,-1), 8),
            ('BACKGROUND', (0,0), (0,0), colors.HexColor("#EDF2F7")),
            ('BACKGROUND', (1,0), (1,0), colors.HexColor("#EDF2F7")),
            ('BOX', (0,0), (0,0), 0.5, colors.HexColor("#CBD5E0")),
            ('BOX', (1,0), (1,0), 0.5, colors.HexColor("#CBD5E0")),
        ]))
        elements.append(addr_table)
        elements.append(Spacer(1, 15))

        # 4. Line Items Table
        elements.append(Paragraph("Billing details", section_title_style))
        
        table_header_style = ParagraphStyle('TableHeader', parent=styles['Normal'], fontSize=9, fontName="Helvetica-Bold", textColor=colors.white)
        table_cell_style = ParagraphStyle('TableCell', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor("#2D3748"))
        
        items_data = [
            [
                Paragraph("<b>S.No</b>", table_header_style),
                Paragraph("<b>Item Description</b>", table_header_style),
                Paragraph("<b>Qty</b>", table_header_style),
                Paragraph("<b>Unit Price (INR)</b>", table_header_style),
                Paragraph("<b>Total (INR)</b>", table_header_style)
            ]
        ]

        subtotal = 0.0
        for idx, item in enumerate(po.items, 1):
            qty = item.quantity or 0
            price = float(item.unit_price) or 0.0
            tot = float(item.total_price) or (qty * price)
            subtotal += tot
            
            items_data.append([
                Paragraph(str(idx), table_cell_style),
                Paragraph(item.item_name, table_cell_style),
                Paragraph(str(qty), table_cell_style),
                Paragraph(f"{price:,.2f}", table_cell_style),
                Paragraph(f"{tot:,.2f}", table_cell_style)
            ])

        cgst = subtotal * 0.09
        sgst = subtotal * 0.09
        grand_total = subtotal + cgst + sgst

        items_data.append(["", "", "", Paragraph("<b>Subtotal:</b>", table_cell_style), Paragraph(f"<b>{subtotal:,.2f}</b>", table_cell_style)])
        items_data.append(["", "", "", Paragraph("<b>CGST (9%):</b>", table_cell_style), Paragraph(f"{cgst:,.2f}", table_cell_style)])
        items_data.append(["", "", "", Paragraph("<b>SGST (9%):</b>", table_cell_style), Paragraph(f"{sgst:,.2f}", table_cell_style)])
        items_data.append(["", "", "", Paragraph("<b>Grand Total:</b>", ParagraphStyle('GrandStyle', parent=table_cell_style, fontName="Helvetica-Bold")), Paragraph(f"<b>{grand_total:,.2f}</b>", ParagraphStyle('GrandStyleVal', parent=table_cell_style, fontName="Helvetica-Bold"))])

        items_table = Table(items_data, colWidths=[40, 240, 50, 100, 110])
        items_table_style = [
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#2C5282")),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('GRID', (0,0), (-1,-5), 0.5, colors.HexColor("#E2E8F0")),
            ('LINEBELOW', (3,-4), (4,-1), 1, colors.HexColor("#1A365D")),
        ]
        
        for r_idx in range(1, len(po.items) + 1):
            if r_idx % 2 == 0:
                items_table_style.append(('BACKGROUND', (0, r_idx), (-1, r_idx), colors.HexColor("#F7FAFC")))
                
        items_table.setStyle(TableStyle(items_table_style))
        elements.append(items_table)
        elements.append(Spacer(1, 40))

        # 5. Footer Message / Signature
        footer_style = ParagraphStyle('FooterMsg', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor("#718096"), alignment=1)
        elements.append(Paragraph("Thank you for your business!<br/>For any payment queries, contact accounts@vendorbridge.com.", footer_style))
        
        doc.build(elements)
        return file_path
