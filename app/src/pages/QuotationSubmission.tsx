import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, ArrowLeft, Package, Clock, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function QuotationSubmission() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rfqId = searchParams.get('rfq_id');

  const [rfq, setRfq] = useState<any>(null);
  const [deliveryDays, setDeliveryDays] = useState<number>(7);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!rfqId) {
      setError("No RFQ ID provided.");
      setLoading(false);
      return;
    }

    async function loadRFQ() {
      try {
        const res = await apiFetch(`/rfqs/${rfqId}`);
        if (res && res.success && res.data) {
          setRfq(res.data);
          // Initialize quotation items from RFQ items
          setItems(res.data.items.map((item: any) => ({
            rfq_item_id: item.id,
            item_name: item.item_name,
            quantity: item.quantity,
            unit_price: item.target_price || 0
          })));
        } else {
          setError("Failed to load RFQ details.");
        }
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching RFQ.");
      } finally {
        setLoading(false);
      }
    }
    loadRFQ();
  }, [rfqId]);

  const handlePriceChange = (index: number, price: string) => {
    const newItems = [...items];
    newItems[index].unit_price = parseFloat(price) || 0;
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        rfq_id: rfqId,
        delivery_days: deliveryDays,
        items: items.map(item => ({
          rfq_item_id: item.rfq_item_id,
          unit_price: item.unit_price
        }))
      };

      const res = await apiFetch("/quotations", {
        method: 'POST',
        json: payload
      });

      if (res && res.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/rfq');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit quotation.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-[#94A3B8]">Loading RFQ details...</div>;
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Quotation Submitted!</h2>
        <p className="text-sm text-[#94A3B8]">Your bid has been sent to the procurement officer for review.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to RFQs
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Submit Quotation</h1>
        <p className="text-sm text-[#94A3B8] mt-1">Enter your best pricing and delivery terms for this request</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {rfq && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* RFQ Header Info */}
          <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-[10px] font-mono text-[#4F46E5] bg-[#4F46E5]/10 px-2 py-0.5 rounded uppercase tracking-wider">
                  {rfq.rfq_number}
                </span>
                <h2 className="text-lg font-semibold text-white mt-2">{rfq.title}</h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider mb-1">Deadline</p>
                <p className="text-sm text-white font-mono">{new Date(rfq.deadline).toLocaleDateString()}</p>
              </div>
            </div>
            <p className="text-sm text-[#94A3B8] leading-relaxed">{rfq.description}</p>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Items Table */}
            <div className="col-span-12 lg:col-span-8">
              <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-[#1B2240]">
                      <th className="py-3 px-4 text-xs font-medium text-[#94A3B8] uppercase">Item Details</th>
                      <th className="py-3 px-4 text-xs font-medium text-[#94A3B8] uppercase text-center">Qty</th>
                      <th className="py-3 px-4 text-xs font-medium text-[#94A3B8] uppercase text-right">Unit Price ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {items.map((item, index) => (
                      <tr key={item.rfq_item_id}>
                        <td className="py-4 px-4">
                          <p className="text-white font-medium text-sm">{item.item_name}</p>
                          <p className="text-xs text-[#64748B] mt-0.5">Line item {index + 1}</p>
                        </td>
                        <td className="py-4 px-4 text-center text-white font-mono">{item.quantity}</td>
                        <td className="py-4 px-4">
                          <input
                            type="number"
                            required
                            step="0.01"
                            min="0.01"
                            value={item.unit_price}
                            onChange={(e) => handlePriceChange(index, e.target.value)}
                            className="w-full bg-[#090C18] border border-white/10 rounded-lg px-3 py-2 text-right text-sm text-white focus:border-[#4F46E5] outline-none transition-all"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary & Terms */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Quotation Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                    <span>Subtotal</span>
                    <span className="text-white font-mono">${calculateTotal().toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                    <span>Processing Fee</span>
                    <span className="text-white font-mono">$0.00</span>
                  </div>
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-sm font-bold text-white">Total Bid</span>
                    <span className="text-lg font-bold text-[#10B981] font-mono">${calculateTotal().toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Delivery Terms</h3>
                <div>
                  <label className="block text-[10px] text-[#64748B] uppercase font-bold tracking-wider mb-2">
                    Estimated Delivery Days
                  </label>
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-[#4F46E5]" />
                    <input
                      type="number"
                      required
                      min={1}
                      max={180}
                      value={deliveryDays}
                      onChange={(e) => setDeliveryDays(parseInt(e.target.value) || 1)}
                      className="w-full bg-[#090C18] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#4F46E5] outline-none"
                    />
                    <span className="text-xs text-[#94A3B8]">Days</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-bold rounded-xl shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {submitting ? "Submitting Bid..." : "Submit Quotation"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
