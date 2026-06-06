import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

# Config from Env or Defaults
SMTP_HOST = os.getenv("SMTP_HOST", "localhost")
SMTP_PORT = int(os.getenv("SMTP_PORT", "1025"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_SENDER = os.getenv("SMTP_SENDER", "noreply@vendorbridge.com")

EMAILS_DIR = "sent_emails"
os.makedirs(EMAILS_DIR, exist_ok=True)

class EmailService:
    @staticmethod
    def send_email(
        recipient_email: str,
        subject: str,
        html_content: str,
        attachment_path: Optional[str] = None
    ) -> bool:
        """
        Sends an email using standard SMTP.
        If SMTP server is not running or connection fails, it writes the email to a local file.
        """
        # Create MIME message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = SMTP_SENDER
        msg["To"] = recipient_email

        # Attach html body
        msg.attach(MIMEText(html_content, "html"))

        # Attach file if provided
        if attachment_path and os.path.exists(attachment_path):
            filename = os.path.basename(attachment_path)
            try:
                with open(attachment_path, "rb") as f:
                    part = MIMEApplication(f.read(), Name=filename)
                part['Content-Disposition'] = f'attachment; filename="{filename}"'
                msg.attach(part)
            except Exception as e:
                logger.error(f"Failed to attach file {attachment_path}: {e}")

        # Local log save for hackathon verification and offline fallback
        safe_subject = "".join(c for c in subject if c.isalnum() or c in " _-")[:50]
        log_file = os.path.join(EMAILS_DIR, f"{recipient_email}_{safe_subject}.html")
        try:
            with open(log_file, "w", encoding="utf-8") as f:
                f.write(f"Subject: {subject}\nTo: {recipient_email}\nFrom: {SMTP_SENDER}\nAttachment: {attachment_path or 'None'}\n\n")
                f.write(html_content)
        except Exception as e:
            logger.error(f"Failed to write mock email to disk: {e}")

        # Attempt sending
        try:
            # Short timeout to prevent freezing the API request if SMTP is offline
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=3.0)
            if SMTP_USERNAME and SMTP_PASSWORD:
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.sendmail(SMTP_SENDER, [recipient_email], msg.as_string())
            server.quit()
            logger.info(f"Email sent successfully to {recipient_email} - Subject: {subject}")
            return True
        except Exception as e:
            logger.warning(f"SMTP send failed, falling back to local file. Reason: {e}")
            return False

    @staticmethod
    def send_rfq_invitation(
        recipient_email: str,
        vendor_name: str,
        rfq_number: str,
        rfq_title: str,
        deadline: str,
        items: List[str]
    ) -> bool:
        subject = f"Invitation to Bid: {rfq_number} - {rfq_title}"
        items_html = "".join(f"<li>{item}</li>" for item in items)
        html_content = f"""
        <html>
            <body>
                <h2>Hello {vendor_name},</h2>
                <p>You have been invited to submit a quotation for the following Request for Quotation (RFQ):</p>
                <p><strong>RFQ Number:</strong> {rfq_number}</p>
                <p><strong>RFQ Title:</strong> {rfq_title}</p>
                <p><strong>Submission Deadline:</strong> {deadline}</p>
                <h3>Required Items:</h3>
                <ul>
                    {items_html}
                </ul>
                <p>Please log in to the VendorBridge portal to submit your bid.</p>
                <p>Best regards,<br>VendorBridge Procurement Team</p>
            </body>
        </html>
        """
        return EmailService.send_email(recipient_email, subject, html_content)

    @staticmethod
    def send_approval_notification(
        recipient_email: str,
        user_name: str,
        entity_type: str,
        entity_number: str,
        status: str,
        comments: Optional[str] = None
    ) -> bool:
        subject = f"Approval Update: {entity_type} {entity_number} is {status}"
        html_content = f"""
        <html>
            <body>
                <h2>Hello {user_name},</h2>
                <p>An approval request requires your attention or has been updated:</p>
                <p><strong>Document Type:</strong> {entity_type}</p>
                <p><strong>Document Number:</strong> {entity_number}</p>
                <p><strong>Status:</strong> <span style="font-weight: bold; color: {'green' if status == 'APPROVED' else 'red' if status == 'REJECTED' else 'orange'}">{status}</span></p>
                <p><strong>Comments:</strong> {comments or 'No comments provided'}</p>
                <p>Best regards,<br>VendorBridge ERP</p>
            </body>
        </html>
        """
        return EmailService.send_email(recipient_email, subject, html_content)

    @staticmethod
    def send_purchase_order(
        recipient_email: str,
        vendor_name: str,
        po_number: str,
        total_amount: float,
        pdf_path: str
    ) -> bool:
        subject = f"Purchase Order: {po_number}"
        html_content = f"""
        <html>
            <body>
                <h2>Hello {vendor_name},</h2>
                <p>Please find attached the official Purchase Order <strong>{po_number}</strong>.</p>
                <p><strong>Total Value:</strong> INR {total_amount:,.2f}</p>
                <p>Please review and confirm receipt.</p>
                <p>Best regards,<br>VendorBridge Finance Team</p>
            </body>
        </html>
        """
        return EmailService.send_email(recipient_email, subject, html_content, attachment_path=pdf_path)

    @staticmethod
    def send_invoice_notification(
        recipient_email: str,
        invoice_number: str,
        po_number: str,
        total_amount: float,
        due_date: str,
        pdf_path: str
    ) -> bool:
        subject = f"Invoice Issued: {invoice_number}"
        html_content = f"""
        <html>
            <body>
                <h2>Hello,</h2>
                <p>Invoice <strong>{invoice_number}</strong> has been issued for Purchase Order <strong>{po_number}</strong>.</p>
                <p><strong>Total Amount Due:</strong> INR {total_amount:,.2f}</p>
                <p><strong>Due Date:</strong> {due_date}</p>
                <p>Please find the PDF copy attached.</p>
                <p>Best regards,<br>VendorBridge Billing System</p>
            </body>
        </html>
        """
        return EmailService.send_email(recipient_email, subject, html_content, attachment_path=pdf_path)
