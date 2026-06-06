import sys
import os
import uuid
import random
import time
from datetime import datetime, timedelta, timezone

# Add parent directory to path to enable imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from sqlalchemy.orm import Session
from sqlalchemy import select, delete
from faker import Faker

from app.database import engine, Base, SessionLocal
from app.core import security
from app.models import (
    Role, User, VendorCategory, Vendor, RFQ, RFQItem, RFQVendor,
    Quotation, QuotationItem, ApprovalRequest, PurchaseOrder,
    PurchaseOrderItem, Invoice, Notification, AuditLog
)

fake = Faker()

def clean_database(db: Session):
    print("Cleaning existing database records...")
    db.execute(delete(AuditLog))
    db.execute(delete(Notification))
    db.execute(delete(Invoice))
    db.execute(delete(PurchaseOrderItem))
    db.execute(delete(PurchaseOrder))
    db.execute(delete(ApprovalRequest))
    db.execute(delete(QuotationItem))
    db.execute(delete(Quotation))
    db.execute(delete(RFQVendor))
    db.execute(delete(RFQItem))
    db.execute(delete(RFQ))
    db.execute(delete(Vendor))
    db.execute(delete(VendorCategory))
    db.execute(delete(User))
    db.execute(delete(Role))
    db.commit()

def generate_gst() -> str:
    # GST format: 2 digits + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric
    letters = "".join(random.choices("ABCDEFGHIJKLMNOPQRSTUVWXYZ", k=5))
    digits = "".join(random.choices("0123456789", k=4))
    char1 = random.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
    char2 = random.choice("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ")
    char3 = random.choice("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ")
    state_code = f"{random.randint(10, 37):02d}"
    return f"{state_code}{letters}{digits}{char1}{char2}Z{char3}"

def main():
    print("Connecting to database and creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        clean_database(db)

        print("Seeding Roles...")
        roles_to_create = [
            Role(name="ADMIN", description="Administrator with full permissions"),
            Role(name="PROCUREMENT_OFFICER", description="Procurement Officer managing RFQs and Vendors"),
            Role(name="MANAGER", description="Manager approving quotations, RFQs, and POs"),
            Role(name="VENDOR", description="External vendor submission profile")
        ]
        db.add_all(roles_to_create)
        db.commit()

        # Fetch roles to retrieve their IDs
        roles = {r.name: r for r in db.scalars(select(Role)).all()}
        
        print("Seeding Users...")
        # 1 Admin, 3 Procurement Officers, 3 Managers, 3 Vendor Users = 10 Users
        users = []
        hashed_pwd = security.get_password_hash("password123")
        
        users.append(User(
            email="admin@vendorbridge.com",
            hashed_password=hashed_pwd,
            first_name="Alice",
            last_name="Smith",
            role_id=roles["ADMIN"].id
        ))
        
        for i in range(3):
            users.append(User(
                email=f"procurement{i+1}@vendorbridge.com",
                hashed_password=hashed_pwd,
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                role_id=roles["PROCUREMENT_OFFICER"].id
            ))
            users.append(User(
                email=f"manager{i+1}@vendorbridge.com",
                hashed_password=hashed_pwd,
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                role_id=roles["MANAGER"].id
            ))
            users.append(User(
                email=f"vendor_user{i+1}@vendorbridge.com",
                hashed_password=hashed_pwd,
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                role_id=roles["VENDOR"].id
            ))
            
        db.add_all(users)
        db.commit()
        
        # Reload users
        db_users = db.scalars(select(User)).all()
        procurement_users = [u for u in db_users if u.role.name == "PROCUREMENT_OFFICER"]
        manager_users = [u for u in db_users if u.role.name == "MANAGER"]
        vendor_users = [u for u in db_users if u.role.name == "VENDOR"]

        print("Seeding Vendor Categories...")
        categories = [
            VendorCategory(name="IT Hardware & Software", description="Laptops, servers, cloud licenses"),
            VendorCategory(name="Office Supplies", description="Stationery, furniture, and paper products"),
            VendorCategory(name="Logistics", description="Shipping, courier, and moving services"),
            VendorCategory(name="Raw Materials", description="Steel, plastics, chemicals, packaging")
        ]
        db.add_all(categories)
        db.commit()
        db_categories = db.scalars(select(VendorCategory)).all()

        print("Seeding Vendors...")
        # Seed 20 Vendors
        vendors = []
        for i in range(20):
            # Link first 3 vendors to the 3 vendor users
            user_id = vendor_users[i].id if i < len(vendor_users) else None
            code = f"VND-{1000 + i}"
            gst = generate_gst()
            
            vendors.append(Vendor(
                name=fake.company(),
                vendor_code=code,
                email=fake.company_email(),
                phone=fake.phone_number()[:50],
                address=fake.address(),
                gst_number=gst,
                rating=round(random.uniform(3.0, 5.0), 1),
                category_id=random.choice(db_categories).id,
                status="APPROVED" if i % 4 != 0 else "PENDING",
                user_id=user_id
            ))
        db.add_all(vendors)
        db.commit()
        db_vendors = db.scalars(select(Vendor)).all()

        print("Seeding RFQs and RFQ Items...")
        # 15 RFQs, 50 RFQ Items
        rfqs = []
        rfq_items = []
        
        for i in range(15):
            deadline_date = datetime.utcnow() + timedelta(days=random.randint(5, 30))
            rfq_num = f"RFQ-{time.strftime('%Y%m%d')}-{1000 + i}"
            
            rfq = RFQ(
                rfq_number=rfq_num,
                title=f"Procurement of {fake.bs().title()}",
                description=fake.paragraph(nb_sentences=3),
                deadline=deadline_date,
                status=random.choice(["DRAFT", "SENT", "CLOSED"]),
                created_by_id=random.choice(procurement_users).id
            )
            db.add(rfq)
            db.commit() # commit to get ID
            rfqs.append(rfq)

        # Distribute 50 RFQ Items across the 15 RFQs
        items_count = 0
        while items_count < 50:
            for r in rfqs:
                if items_count >= 50:
                    break
                item = RFQItem(
                    rfq_id=r.id,
                    item_name=fake.catch_phrase().split()[-1].title(),
                    description=fake.sentence(),
                    quantity=random.randint(5, 500),
                    target_price=round(random.uniform(10.0, 1000.0), 2)
                )
                db.add(item)
                rfq_items.append(item)
                items_count += 1
        db.commit()

        # Link random vendors to SENT or CLOSED RFQs (RFQ Vendors mapping)
        print("Mapping Vendors to RFQs...")
        for r in rfqs:
            if r.status in ["SENT", "CLOSED"]:
                # Assign exactly 5 vendors to ensure plenty of unique bid pairs
                assigned = random.sample(db_vendors, k=5)
                for v in assigned:
                    rfq_v = RFQVendor(rfq_id=r.id, vendor_id=v.id)
                    db.add(rfq_v)
        db.commit()

        print("Seeding Quotations and Quotation Items...")
        # Collect all valid (rfq, vendor_id) pairs from SENT/CLOSED RFQs
        valid_pairs = []
        stmt = select(RFQVendor)
        rfq_vendors = db.scalars(stmt).all()
        for rv in rfq_vendors:
            if rv.rfq.status in ["SENT", "CLOSED"]:
                valid_pairs.append((rv.rfq, rv.vendor_id))

        # Shuffle the combinations
        random.shuffle(valid_pairs)

        # Enforce exactly 30 quotations
        if len(valid_pairs) < 30:
            raise Exception(f"Not enough RFQ-Vendor pairs to generate 30 quotations. Got {len(valid_pairs)} pairs.")

        quotations = []
        for i in range(30):
            rfq, vendor_id = valid_pairs[i]
            qt_num = f"QT-{time.strftime('%Y%m%d')}-{1000 + i}"
            delivery = random.randint(3, 20)

            quotation = Quotation(
                quotation_number=qt_num,
                rfq_id=rfq.id,
                vendor_id=vendor_id,
                submitted_at=datetime.utcnow() - timedelta(days=random.randint(1, 4)),
                delivery_days=delivery,
                status="SUBMITTED",  # We will change status to ACCEPTED for PO generation later
                total_amount=0.0
            )
            db.add(quotation)
            db.commit()

            # Add quotation items
            tot = 0.0
            for item in rfq.items:
                bid_price = round(float(item.target_price) * random.uniform(0.85, 1.15), 2)
                item_tot = bid_price * item.quantity
                tot += item_tot

                q_item = QuotationItem(
                    quotation_id=quotation.id,
                    rfq_item_id=item.id,
                    unit_price=bid_price,
                    total_price=item_tot
                )
                db.add(q_item)

            quotation.total_amount = tot
            db.commit()
            quotations.append(quotation)

        print("Seeding Approval Requests...")
        # Seed 15 Approval Requests
        approval_requests = []
        for i in range(15):
            entity_type = random.choice(["RFQ", "QUOTATION"])
            entity_id = random.choice(rfqs).id if entity_type == "RFQ" else random.choice(quotations).id

            req = ApprovalRequest(
                entity_type=entity_type,
                entity_id=entity_id,
                requested_by_id=random.choice(procurement_users).id,
                assigned_approver_id=random.choice(manager_users).id,
                status=random.choice(["PENDING", "APPROVED", "REJECTED"]),
                comments=fake.sentence()
            )
            db.add(req)
            approval_requests.append(req)
        db.commit()

        print("Seeding Purchase Orders and PO Items...")
        # Seed 15 Purchase Orders
        # Select 15 quotations and force status to ACCEPTED
        for q in quotations[:15]:
            q.status = "ACCEPTED"
        db.commit()

        purchase_orders = []
        for i in range(15):
            quote = quotations[i]
            po_num = f"PO-{time.strftime('%Y%m%d')}-{1000 + i}"

            po = PurchaseOrder(
                po_number=po_num,
                quotation_id=quote.id,
                vendor_id=quote.vendor_id,
                status=random.choice(["ACCEPTED", "DELIVERED"]),
                total_amount=quote.total_amount,
                delivery_date=datetime.utcnow() + timedelta(days=quote.delivery_days),
                created_by_id=random.choice(procurement_users).id
            )
            db.add(po)
            db.commit()

            # Create PO items
            for q_item in quote.items:
                po_item = PurchaseOrderItem(
                    purchase_order_id=po.id,
                    item_name=q_item.rfq_item.item_name if q_item.rfq_item else "Item",
                    quantity=q_item.rfq_item.quantity if q_item.rfq_item else 10,
                    unit_price=q_item.unit_price,
                    total_price=q_item.total_price
                )
                db.add(po_item)
            db.commit()
            purchase_orders.append(po)

        print("Seeding Invoices...")
        # Seed 15 Invoices
        invoices = []
        for i in range(15):
            po = purchase_orders[i]
            inv_num = f"INV-{time.strftime('%Y%m%d')}-{1000 + i}"

            inv = Invoice(
                invoice_number=inv_num,
                purchase_order_id=po.id,
                total_amount=po.total_amount,
                due_date=datetime.utcnow() + timedelta(days=30),
                status=random.choice(["UNPAID", "PAID", "OVERDUE"])
            )
            db.add(inv)
            invoices.append(inv)
        db.commit()

        print("Seeding Notifications...")
        # Seed 20 Notifications
        for i in range(20):
            notif = Notification(
                user_id=random.choice(db_users).id,
                title=fake.sentence(nb_words=4),
                message=fake.sentence(nb_words=8),
                is_read=random.choice([True, False])
            )
            db.add(notif)
        db.commit()

        print("Seeding Audit Logs...")
        # Seed 50 Audit Logs
        actions = [
            ("Vendor", "Vendor Created"),
            ("RFQ", "RFQ Created"),
            ("Quotation", "Quotation Submitted"),
            ("ApprovalRequest", "Approval Requested"),
            ("ApprovalRequest", "Approval Approved"),
            ("ApprovalRequest", "Approval Rejected"),
            ("PurchaseOrder", "PO Generated"),
            ("Invoice", "Invoice Generated")
        ]

        entities_map = {
            "Vendor": [v.id for v in db_vendors],
            "RFQ": [r.id for r in rfqs],
            "Quotation": [q.id for q in quotations],
            "ApprovalRequest": [a.id for a in approval_requests],
            "PurchaseOrder": [p.id for p in purchase_orders],
            "Invoice": [inv.id for inv in invoices]
        }

        for i in range(50):
            ent_type, act = random.choice(actions)
            ent_id = random.choice(entities_map[ent_type]) if entities_map.get(ent_type) else uuid.uuid4()

            log = AuditLog(
                user_id=random.choice(db_users).id,
                entity_type=ent_type,
                entity_id=ent_id,
                action=act,
                old_value=fake.sentence() if random.choice([True, False]) else None,
                new_value=fake.sentence()
            )
            db.add(log)
        db.commit()

        print("Seeding completed successfully!")
        from sqlalchemy import func
        print(f"Roles: {db.scalar(select(func.count(Role.id)))}")
        print(f"Users: {db.scalar(select(func.count(User.id)))}")
        print(f"Vendors: {db.scalar(select(func.count(Vendor.id)))}")
        print(f"RFQs: {db.scalar(select(func.count(RFQ.id)))}")
        print(f"RFQ Items: {db.scalar(select(func.count(RFQItem.id)))}")
        print(f"Quotations: {db.scalar(select(func.count(Quotation.id)))}")
        print(f"Quotation Items: {db.scalar(select(func.count(QuotationItem.id)))}")
        print(f"Approvals: {db.scalar(select(func.count(ApprovalRequest.id)))}")
        print(f"POs: {db.scalar(select(func.count(PurchaseOrder.id)))}")
        print(f"Invoices: {db.scalar(select(func.count(Invoice.id)))}")
        print(f"Notifications: {db.scalar(select(func.count(Notification.id)))}")
        print(f"Audit Logs: {db.scalar(select(func.count(AuditLog.id)))}")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    main()
