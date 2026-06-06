import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ClipboardList, Clock, DollarSign, ArrowRight } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Badge } from '@/components/shared/Badge';
import { useNavigate } from 'react-router-dom';

export default function VendorQuotations() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadQuotations() {
      try {
        const res = await apiFetch("/quotations?page=1&page_size=100");
        if (res && res.success && res.data?.items) {
          setQuotations(res.data.items);
        }
      } catch (err) {
        console.error("Failed to load quotations:", err);
      } finally {
        setLoading(false);
      }
    }
    loadQuotations();
  }, []);

  const filtered = quotations.filter(q => 
    q.quotation_number.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-[#94A3B8]">Loading your quotations...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">My Quotations</h1>
          <p className="text-sm text-[#94A3B8] mt-1">Track and manage your submitted bids and their statuses</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search quotations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1B2240] border border-transparent focus:border-[#4F46E5] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#64748B] outline-none transition-all focus:ring-2 focus:ring-[#4F46E5]/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-[#111827] border border-white/5 rounded-xl">
            <ClipboardList className="w-12 h-12 text-[#1B2240] mx-auto mb-4" />
            <p className="text-[#94A3B8]">No quotations found.</p>
          </div>
        ) : (
          filtered.map((q, i) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-[#111827] border border-white/5 rounded-xl p-6 hover:border-[#4F46E5]/30 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-[#4F46E5] bg-[#4F46E5]/10 px-2 py-0.5 rounded">{q.quotation_number}</span>
                    <Badge variant={
                      q.status === 'ACCEPTED' ? 'success' :
                      q.status === 'REJECTED' ? 'warning' : 'default'
                    }>
                      {q.status}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-[#4F46E5] transition-colors">
                    Bid for RFQ {q.rfq_id.slice(0, 8)}...
                  </h3>
                  <div className="flex items-center gap-6 mt-3 text-xs text-[#94A3B8]">
                    <span className="flex items-center gap-1.5 font-bold text-[#10B981]">
                      <DollarSign className="w-3.5 h-3.5" />
                      Total: ${q.total_amount.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Delivery: {q.delivery_days} days
                    </span>
                    <span>Submitted on {new Date(q.submitted_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/quotations/new?rfq_id=${q.rfq_id}`)}
                  className="flex items-center gap-1 px-3 py-2 bg-[#1B2240] rounded-lg text-xs text-[#94A3B8] hover:text-white hover:bg-[#4F46E5]/20 transition-all opacity-0 group-hover:opacity-100"
                >
                  View / Edit Bid
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
