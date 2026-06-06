import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, Mail, FileText, CheckCircle, AlertTriangle, Printer, X } from 'lucide-react';
import { invoiceData } from '@/data/mockData';
import { Badge } from '@/components/shared/Badge';
import { apiFetch } from '@/lib/api';

export default function InvoiceGeneration() {
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  
  // Invoice generation states
  const [showGenModal, setShowGenModal] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [selectedPoId, setSelectedPoId] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = currentUser?.role?.name || '';
  const isVendor = userRole === 'VENDOR';

  async function loadInvoices() {
    try {
      const res = await apiFetch("/invoices?page=1&page_size=100");
      if (res && res.success && res.data && res.data.items) {
        const itemsList = res.data.items;
        invoiceData.length = 0;
        itemsList.forEach((inv: any) => {
          const subtotal = inv.total_amount;
          const cgst = subtotal * 0.09;
          const sgst = subtotal * 0.09;
          const tax = cgst + sgst;
          const grandTotal = subtotal + tax;

          invoiceData.push({
            id: inv.invoice_number,
            dbId: inv.id,
            poId: inv.purchase_order_id, // we can store PO UUID
            vendor: inv.vendor_name || 'Acme Vendor',
            amount: subtotal,
            tax: tax,
            total: grandTotal,
            status: inv.status === 'PAID' ? 'Paid' : inv.status === 'SENT' ? 'Pending' : inv.status,
            date: inv.created_at ? inv.created_at.split('T')[0] : 'N/A',
            dueDate: inv.due_date ? inv.due_date.split('T')[0] : 'N/A',
            items: inv.items || []
          });
        });
        setLoaded(true);
      }
    } catch (err) {
      console.error("Failed to load invoices: ", err);
    }
  }

  async function loadPOs() {
    try {
      const res = await apiFetch("/purchase-orders?page=1&page_size=100");
      if (res && res.success && res.data && res.data.items) {
        // Allow POs that are SENT (Pending) or ACCEPTED (Approved)
        const eligiblePOs = res.data.items.filter((po: any) => 
          po.status === 'ACCEPTED' || po.status === 'SENT'
        );
        setPurchaseOrders(eligiblePOs);
        if (eligiblePOs.length > 0) {
          setSelectedPoId(eligiblePOs[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load POs: ", err);
    }
  }

  useEffect(() => {
    loadInvoices();
    loadPOs();
  }, []);

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoId || !dueDate) {
      setError("Please fill all required fields.");
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await apiFetch("/invoices", {
        method: 'POST',
        json: {
          purchase_order_id: selectedPoId,
          due_date: new Date(dueDate).toISOString()
        }
      });

      if (res && res.success) {
        setSuccess("Invoice generated successfully!");
        setShowGenModal(false);
        setDueDate('');
        await loadInvoices();
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate invoice.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await apiFetch("/notifications/send-by-email", {
        method: 'POST',
        json: {
          recipient_email: emailTo,
          title: emailSubject,
          message: emailBody
        }
      });
      setSuccess(`Email notification sent to ${emailTo}!`);
      setShowEmailModal(false);
    } catch (err: any) {
      setError(err.message || "Failed to send notification.");
    } finally {
      setActionLoading(false);
    }
  };

  const openEmailModal = () => {
    if (!selected) return;
    
    if (isVendor) {
      setEmailTo(''); // Vendor enters recipient manually
      setEmailSubject(`Invoice ${selected.id} - ${selected.vendor}`);
      setEmailBody(`Please find attached the invoice for your review and payment.`);
    } else {
      // PO Officer replies to vendor
      const vendorEmail = `accounts@${selected.vendor.toLowerCase().replace(/\s/g, '')}.com`;
      setEmailTo(vendorEmail);
      setEmailSubject(`RE: Invoice ${selected.id} - ${selected.vendor}`);
      setEmailBody(`Hi ${selected.vendor} team,\n\nI am writing regarding invoice ${selected.id}.\n\n`);
    }
    setShowEmailModal(true);
  };

  const filtered = invoiceData.filter((inv) =>
    inv.vendor.toLowerCase().includes(search.toLowerCase()) ||
    inv.id.toLowerCase().includes(search.toLowerCase())
  );

  const selected = invoiceData.find((inv) => inv.id === selectedInvoice);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Invoice Generation</h1>
          <p className="text-sm text-[#94A3B8] mt-1">Generate, preview, and manage vendor invoices</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowGenModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-medium rounded-lg shadow-glow-sm hover:shadow-glow transition-all"
        >
          <FileText className="w-4 h-4" />
          Generate Invoice
        </motion.button>
      </div>

      {success && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 text-green-500 text-sm rounded-lg">
          {success}
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Invoice List */}
        <div className={`${selectedInvoice ? 'col-span-5' : 'col-span-12'}`}>
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#1B2240] border border-transparent focus:border-[#4F46E5] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#64748B] outline-none transition-all focus:ring-2 focus:ring-[#4F46E5]/20"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filtered.map((inv, i) => (
              <motion.div
                key={inv.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedInvoice(inv.id)}
                className={`bg-[#111827] border rounded-xl p-5 cursor-pointer transition-all ${
                  selectedInvoice === inv.id ? 'border-[#4F46E5]/50 shadow-glow-sm' : 'border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-[#4F46E5]">{inv.id}</span>
                  <Badge variant={
                    inv.status === 'Paid' ? 'success' :
                    inv.status === 'Pending' ? 'warning' : 'danger'
                  }>
                    {inv.status}
                  </Badge>
                </div>
                <p className="text-sm text-white font-medium">{inv.vendor}</p>
                <p className="text-xs text-[#64748B] mt-1">PO ref: {inv.poId.slice(0, 8)}...</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-lg font-bold font-mono text-white">${inv.total.toLocaleString()}</span>
                  <span className="text-xs text-[#64748B]">{inv.date}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Invoice Preview */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="col-span-7"
            >
              <div className="bg-white rounded-xl p-8 text-[#1a1a2e] sticky top-6">
                {/* Invoice Header */}
                <div className="flex items-start justify-between mb-8 border-b border-gray-200 pb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                          <path d="M12 2L2 7l10 5 10-5-10-5z" />
                          <path d="M2 17l10 5 10-5" />
                        </svg>
                      </div>
                      <h2 className="text-lg font-bold text-[#1a1a2e]">VendorBridge</h2>
                    </div>
                    <p className="text-xs text-gray-500">VendorBridge Nexus ERP</p>
                    <p className="text-xs text-gray-500">2500 Commerce Way, Suite 400</p>
                    <p className="text-xs text-gray-500">Newark, NJ 07102</p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-xl font-bold text-[#1a1a2e]">INVOICE</h3>
                    <p className="text-sm font-mono text-[#4F46E5] mt-1">{selected.id}</p>
                    <p className="text-xs text-gray-500 mt-1">Date: {selected.date}</p>
                    <p className="text-xs text-gray-500">Due: {selected.dueDate}</p>
                  </div>
                </div>

                {/* Bill To */}
                <div className="mb-8">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Bill To</p>
                  <p className="text-sm font-semibold text-[#1a1a2e]">{selected.vendor}</p>
                  <p className="text-xs text-gray-500">GSTIN: 27AABCU9603R1ZX</p>
                </div>

                {/* Items Table */}
                <table className="w-full text-left text-sm mb-8">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="py-2 text-xs font-semibold text-gray-500 uppercase">Description</th>
                      <th className="py-2 text-xs font-semibold text-gray-500 uppercase text-right">Qty</th>
                      <th className="py-2 text-xs font-semibold text-gray-500 uppercase text-right">Rate</th>
                      <th className="py-2 text-xs font-semibold text-gray-500 uppercase text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 text-sm text-[#1a1a2e]">Procured supplies list (18% standard GST)</td>
                      <td className="py-3 text-sm text-right text-[#1a1a2e]">1</td>
                      <td className="py-3 text-sm text-right font-mono text-[#1a1a2e]">${selected.amount.toLocaleString()}</td>
                      <td className="py-3 text-sm text-right font-mono text-[#1a1a2e]">${selected.amount.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Totals */}
                <div className="border-t-2 border-gray-200 pt-4 mb-8">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-500">Subtotal</span>
                    <span className="text-sm font-mono text-[#1a1a2e]">${selected.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-500">Tax (18% GST)</span>
                    <span className="text-sm font-mono text-[#1a1a2e]">${selected.tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-200">
                    <span className="text-base font-bold text-[#1a1a2e]">Total</span>
                    <span className="text-xl font-bold font-mono text-[#4F46E5]">${selected.total.toLocaleString()}</span>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                    selected.status === 'Paid' ? 'bg-green-100 text-green-700' :
                    selected.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {selected.status === 'Paid' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    {selected.status}
                  </div>
                  <p className="text-[10px] text-gray-400">PO Ref: {selected.poId.slice(0, 8)}...</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-4 justify-end">
                <a
                  href={`http://localhost:8000/pdfs/INV_${selected.id}.pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#1B2240] rounded-lg text-sm text-[#94A3B8] hover:text-white transition-all"
                >
                  <Download className="w-4 h-4" />
                  PDF Download
                </a>
                <button
                  onClick={openEmailModal}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-medium rounded-lg transition-all"
                >
                  <Mail className="w-4 h-4" />
                  {isVendor ? 'Email Invoice' : 'Reply Vendor'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Generation Modal */}
      <AnimatePresence>
        {showGenModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0B0F19] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Generate Invoice</h3>
                <button
                  onClick={() => setShowGenModal(false)}
                  className="p-1 hover:bg-white/5 rounded-lg text-[#94A3B8] hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleGenerateInvoice} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-lg">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] uppercase mb-2">Select Approved PO</label>
                  {purchaseOrders.length > 0 ? (
                    <select
                      value={selectedPoId}
                      onChange={(e) => setSelectedPoId(e.target.value)}
                      className="w-full bg-[#161B30] border border-white/5 focus:border-[#4F46E5] rounded-lg px-4 py-2.5 text-xs text-white outline-none"
                    >
                      {purchaseOrders.map(po => (
                        <option key={po.id} value={po.id}>
                          {po.po_number} - {po.vendor_name} (${po.total_amount.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-xs text-red-400 italic">No approved POs available for invoicing. Make sure POs are approved by MANAGER.</div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] uppercase mb-2">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-[#161B30] border border-white/5 focus:border-[#4F46E5] rounded-lg px-4 py-2.5 text-xs text-white outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowGenModal(false)}
                    className="px-4 py-2 border border-white/10 rounded-lg text-xs text-[#94A3B8] hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || purchaseOrders.length === 0}
                    className="px-5 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold rounded-lg shadow-glow transition-all disabled:opacity-50"
                  >
                    {submitting ? "Generating..." : "Generate"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Email Modal */}
      <AnimatePresence>
        {showEmailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowEmailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#111827] border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                {isVendor ? 'Email Invoice' : 'Reply to Vendor'}
              </h3>
              <form onSubmit={handleSendEmail} className="space-y-4">
                <div>
                  <label className="block text-xs text-[#94A3B8] mb-1.5">Recipient Email</label>
                  <input
                    type="email"
                    required
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="Enter recipient email..."
                    className="w-full bg-[#090C18] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-[#4F46E5] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#94A3B8] mb-1.5">Subject</label>
                  <input
                    type="text"
                    required
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full bg-[#090C18] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-[#4F46E5] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#94A3B8] mb-1.5">Message</label>
                  <textarea
                    rows={4}
                    required
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full bg-[#090C18] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-[#4F46E5] transition-all resize-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(false)}
                    className="px-4 py-2 text-sm text-[#94A3B8] hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50"
                  >
                    {actionLoading ? 'Sending...' : 'Send Notification'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
