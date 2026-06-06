import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Plus, Star, Phone, Mail } from 'lucide-react';
import { vendorList } from '@/data/mockData';
import { Badge } from '@/components/shared/Badge';
import { apiFetch } from '@/lib/api';

export default function VendorManagement() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVendors() {
      setLoading(true);
      try {
        const res = await apiFetch("/vendors?page=1&page_size=100");
        if (res && res.success && res.data && res.data.items) {
          const items = res.data.items;
          const mappedVendors = items.map((v: any) => {
            const initials = v.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
            return {
              id: v.id,
              name: v.name,
              initials,
              contact: v.name,
              email: v.email,
              phone: v.phone || '+1 (555) 000-0000',
              category: v.category?.name || 'Raw Materials',
              status: v.status === 'APPROVED' ? 'Active' : 'Inactive',
              rating: v.rating || 4.0,
              spend: `$${(v.rating * 125000).toLocaleString()}`,
              gst: v.gst_number,
              yearEstablished: 2015,
              address: v.address || 'Corporate Park Sector 42',
              paymentTerms: 'Net 30',
              leadTime: '5-7 days',
              lastOrder: '2026-06-05',
            };
          });
          setVendors(mappedVendors);
          
          // Sync to shared list for other components if needed
          vendorList.length = 0;
          mappedVendors.forEach(v => vendorList.push(v));
        }
      } catch (err) {
        console.error("Failed to load vendors: ", err);
      } finally {
        setLoading(false);
      }
    }
    loadVendors();
  }, []);

  const categories = ['All', ...Array.from(new Set(vendors.map((v) => v.category)))];
  const statuses = ['All', 'Active', 'Inactive'];

  const filtered = vendors.filter((v) => {
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.contact.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'All' || v.category === categoryFilter;
    const matchStatus = statusFilter === 'All' || v.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  const selected = vendors.find((v) => v.id === selectedVendor);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Vendor Management</h1>
          <p className="text-sm text-[#94A3B8] mt-1">Manage your vendor relationships and performance</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/vendors/new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-medium rounded-lg shadow-glow-sm hover:shadow-glow transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Vendor
        </motion.button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1B2240] border border-transparent focus:border-[#4F46E5] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#64748B] outline-none transition-all focus:ring-2 focus:ring-[#4F46E5]/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#64748B]" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                categoryFilter === cat
                  ? 'bg-[#4F46E5] text-white'
                  : 'bg-[#1B2240] text-[#94A3B8] hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
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

      {/* Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Vendor List */}
        <div className={`${selectedVendor ? 'col-span-7' : 'col-span-12'}`}>
          <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[#1B2240]">
                  <th className="py-3 px-4 text-xs font-medium text-[#94A3B8] uppercase">Vendor</th>
                  <th className="py-3 px-4 text-xs font-medium text-[#94A3B8] uppercase">Category</th>
                  <th className="py-3 px-4 text-xs font-medium text-[#94A3B8] uppercase">Rating</th>
                  <th className="py-3 px-4 text-xs font-medium text-[#94A3B8] uppercase">Status</th>
                  <th className="py-3 px-4 text-xs font-medium text-[#94A3B8] uppercase text-right">Spend</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((vendor, i) => (
                  <motion.tr
                    key={vendor.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedVendor(vendor.id)}
                    className={`border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${
                      selectedVendor === vendor.id ? 'bg-[#4F46E5]/10 border-l-2 border-l-[#4F46E5]' : ''
                    }`}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1B2240] flex items-center justify-center text-xs font-bold text-[#94A3B8]">
                          {vendor.initials}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{vendor.name}</p>
                          <p className="text-xs text-[#64748B]">{vendor.contact}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-[#94A3B8]">{vendor.category}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
                        <span className="text-sm text-white">{vendor.rating}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={vendor.status === 'Active' ? 'success' : 'default'}>
                        {vendor.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-white">{vendor.spend}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vendor Detail Panel */}
        {selected && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="col-span-5 space-y-4"
          >
            <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-[#4F46E5]/20 flex items-center justify-center text-xl font-bold text-[#4F46E5]">
                  {selected.initials}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{selected.name}</h3>
                  <Badge variant={selected.status === 'Active' ? 'success' : 'default'}>
                    {selected.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1B2240] rounded-lg p-3">
                    <p className="text-[10px] text-[#64748B] uppercase tracking-wider mb-1">GST Number</p>
                    <p className="text-xs text-white font-mono">{selected.gst}</p>
                  </div>
                  <div className="bg-[#1B2240] rounded-lg p-3">
                    <p className="text-[10px] text-[#64748B] uppercase tracking-wider mb-1">Established</p>
                    <p className="text-xs text-white font-mono">{selected.yearEstablished}</p>
                  </div>
                </div>

                <div className="bg-[#1B2240] rounded-lg p-3">
                  <p className="text-[10px] text-[#64748B] uppercase tracking-wider mb-1">Address</p>
                  <p className="text-xs text-white">{selected.address}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1B2240] rounded-lg p-3">
                    <p className="text-[10px] text-[#64748B] uppercase tracking-wider mb-1">Payment Terms</p>
                    <p className="text-xs text-white">{selected.paymentTerms}</p>
                  </div>
                  <div className="bg-[#1B2240] rounded-lg p-3">
                    <p className="text-[10px] text-[#64748B] uppercase tracking-wider mb-1">Lead Time</p>
                    <p className="text-xs text-white">{selected.leadTime}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button className="flex items-center gap-2 px-3 py-2 bg-[#4F46E5]/20 rounded-lg text-xs text-[#4F46E5] hover:bg-[#4F46E5]/30 transition-colors">
                    <Mail className="w-3.5 h-3.5" />
                    Email
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 bg-[#10B981]/20 rounded-lg text-xs text-[#10B981] hover:bg-[#10B981]/30 transition-colors">
                    <Phone className="w-3.5 h-3.5" />
                    Call
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
