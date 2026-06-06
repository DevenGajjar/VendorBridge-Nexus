import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Calendar, Users, Package, ArrowRight, X, Trash } from 'lucide-react';
import { rfqList } from '@/data/mockData';
import { Badge } from '@/components/shared/Badge';
import { apiFetch } from '@/lib/api';

export default function RFQManagement() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loaded, setLoaded] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isVendor = user?.role?.name === "VENDOR";

  // Creation modal states
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [vendorsList, setVendorsList] = useState<any[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [items, setItems] = useState<any[]>([
    { item_name: '', description: '', quantity: 1, target_price: 100 }
  ]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadRFQs() {
    try {
      const res = await apiFetch("/rfqs?page=1&page_size=100");
      if (res && res.success && res.data && res.data.items) {
        const itemsList = res.data.items;
        rfqList.length = 0;
        itemsList.forEach((r: any) => {
          rfqList.push({
            id: r.id,
            title: r.title,
            items: r.items?.length || 0,
            vendors: r.vendors_count || 0,
            status: r.status === 'DRAFT' ? 'Draft' : r.status === 'SENT' ? 'Open' : r.status === 'CLOSED' ? 'Closed' : r.status,
            deadline: r.deadline ? r.deadline.split('T')[0] : 'N/A',
            createdBy: 'Procurement Officer',
            createdDate: r.created_at ? r.created_at.split('T')[0] : 'N/A'
          });
        });
        setLoaded(true);
      }
    } catch (err) {
      console.error("Failed to load RFQs: ", err);
    }
  }

  async function loadVendors() {
    try {
      const res = await apiFetch("/vendors?page=1&page_size=100");
      if (res && res.success && res.data && res.data.items) {
        setVendorsList(res.data.items);
      }
    } catch (err) {
      console.error("Failed to load vendors: ", err);
    }
  }

  useEffect(() => {
    loadRFQs();
    loadVendors();
  }, []);

  const statuses = ['All', 'Draft', 'Open', 'Closed'];

  const filtered = rfqList.filter((rfq) => {
    const matchSearch = rfq.title.toLowerCase().includes(search.toLowerCase()) ||
      rfq.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || rfq.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const addItemRow = () => {
    setItems([...items, { item_name: '', description: '', quantity: 1, target_price: 100 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: string, val: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: val };
    setItems(newItems);
  };

  const toggleVendorSelection = (vId: string) => {
    if (selectedVendors.includes(vId)) {
      setSelectedVendors(selectedVendors.filter(id => id !== vId));
    } else {
      setSelectedVendors([...selectedVendors, vId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !deadline || items.some(item => !item.item_name)) {
      setError("Please fill all required fields and item names.");
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        title,
        description,
        deadline: new Date(deadline).toISOString(),
        assigned_vendors: selectedVendors,
        items: items.map(item => ({
          item_name: item.item_name,
          description: item.description || '',
          quantity: parseInt(item.quantity) || 1,
          target_price: parseFloat(item.target_price) || 0.0
        }))
      };

      const res = await apiFetch("/rfqs", {
        method: 'POST',
        json: payload
      });

      if (res && res.success) {
        // Automatically publish/send the RFQ to mock workflow continuity if needed
        const newRfqId = res.data.id;
        await apiFetch(`/rfqs/${newRfqId}`, {
          method: 'PUT',
          json: { status: 'SENT' }
        });

        setShowModal(false);
        setTitle('');
        setDescription('');
        setDeadline('');
        setSelectedVendors([]);
        setItems([{ item_name: '', description: '', quantity: 1, target_price: 100 }]);
        loadRFQs();
      }
    } catch (err: any) {
      setError(err.message || "Failed to create RFQ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">RFQ Management</h1>
          <p className="text-sm text-[#94A3B8] mt-1">Create and manage Request for Quotations</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-medium rounded-lg shadow-glow-sm hover:shadow-glow transition-all"
        >
          <Plus className="w-4 h-4" />
          Create RFQ
        </motion.button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search RFQs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1B2240] border border-transparent focus:border-[#4F46E5] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#64748B] outline-none transition-all focus:ring-2 focus:ring-[#4F46E5]/20"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s
                  ? 'bg-[#4F46E5] text-white'
                  : 'bg-[#1B2240] text-[#94A3B8] hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* RFQ Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filtered.map((rfq, i) => (
          <motion.div
            key={rfq.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => navigate(isVendor ? '/quotations/new?rfq_id=' + rfq.id : '/quotations?rfq_id=' + rfq.id)}
            className="bg-[#111827] border border-white/5 rounded-xl p-6 hover:border-[#4F46E5]/30 transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-mono text-[#4F46E5] bg-[#4F46E5]/20 px-2 py-0.5 rounded">{rfq.id}</span>
                  <Badge
                    variant={
                      rfq.status === 'Open' || rfq.status === 'SENT' ? 'success' :
                      rfq.status === 'Draft' ? 'default' : 'warning'
                    }
                  >
                    {rfq.status}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold text-white group-hover:text-[#4F46E5] transition-colors">
                  {rfq.title}
                </h3>
                <div className="flex items-center gap-6 mt-3 text-xs text-[#94A3B8]">
                  <span className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    {rfq.items} items
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {rfq.vendors} vendors invited
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Deadline: {rfq.deadline}
                  </span>
                  <span>Created by {rfq.createdBy}</span>
                </div>
              </div>
              <button
                className="flex items-center gap-1 px-3 py-2 bg-[#1B2240] rounded-lg text-xs text-[#94A3B8] hover:text-white hover:bg-[#4F46E5]/20 transition-all opacity-0 group-hover:opacity-100"
              >
                {isVendor ? 'Submit Quote' : 'Compare Quotes'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Creation Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0B0F19] border border-white/10 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-8"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <h3 className="text-lg font-bold text-white">Create Request for Quotation (RFQ)</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 hover:bg-white/5 rounded-lg text-[#94A3B8] hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-lg">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-[#94A3B8] uppercase mb-2">RFQ Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Q3 Medical Device & PPE Supplies"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-[#161B30] border border-white/5 focus:border-[#4F46E5] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#64748B] outline-none"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-[#94A3B8] uppercase mb-2">Description</label>
                    <textarea
                      placeholder="Brief details about required supplies..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full bg-[#161B30] border border-white/5 focus:border-[#4F46E5] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#64748B] outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#94A3B8] uppercase mb-2">Deadline *</label>
                    <input
                      type="datetime-local"
                      required
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full bg-[#161B30] border border-white/5 focus:border-[#4F46E5] rounded-lg px-4 py-2.5 text-sm text-white outline-none"
                    />
                  </div>
                </div>

                {/* Vendor Select Grid */}
                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] uppercase mb-2">Assign Vendors</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 bg-[#101424] rounded-lg border border-white/5">
                    {vendorsList.map((v) => (
                      <label
                        key={v.id}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all border text-xs ${
                          selectedVendors.includes(v.id)
                            ? 'bg-[#4F46E5]/20 border-[#4F46E5] text-white'
                            : 'bg-transparent border-transparent text-[#94A3B8] hover:text-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedVendors.includes(v.id)}
                          onChange={() => toggleVendorSelection(v.id)}
                          className="rounded border-white/10 text-[#4F46E5] focus:ring-0 focus:ring-offset-0 bg-[#161B30]"
                        />
                        <span className="truncate">{v.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Items Block */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-semibold text-[#94A3B8] uppercase">Line Items *</label>
                    <button
                      type="button"
                      onClick={addItemRow}
                      className="flex items-center gap-1 text-xs text-[#4F46E5] hover:text-[#6366F1] font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Item
                    </button>
                  </div>

                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div key={index} className="flex gap-2 items-start bg-[#101424] p-3 rounded-lg border border-white/5">
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            placeholder="Item Name *"
                            required
                            value={item.item_name}
                            onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                            className="w-full bg-[#161B30] border border-white/5 focus:border-[#4F46E5] rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#64748B] outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            className="w-full bg-[#161B30] border border-white/5 focus:border-[#4F46E5] rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#64748B] outline-none"
                          />
                        </div>
                        <div className="w-20">
                          <input
                            type="number"
                            placeholder="Qty"
                            required
                            min={1}
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="w-full bg-[#161B30] border border-white/5 focus:border-[#4F46E5] rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                          />
                        </div>
                        <div className="w-24">
                          <input
                            type="number"
                            placeholder="Target ($)"
                            required
                            min={0.1}
                            step="any"
                            value={item.target_price}
                            onChange={(e) => handleItemChange(index, 'target_price', e.target.value)}
                            className="w-full bg-[#161B30] border border-white/5 focus:border-[#4F46E5] rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                          />
                        </div>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(index)}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 rounded-lg transition-all"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-white/10 rounded-lg text-xs text-[#94A3B8] hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold rounded-lg shadow-glow-sm hover:shadow-glow transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit RFQ"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
