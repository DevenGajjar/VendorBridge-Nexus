import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Eye, Truck, CheckCircle, Clock, Package } from 'lucide-react';
import { purchaseOrders } from '@/data/mockData';
import { Badge } from '@/components/shared/Badge';
import { apiFetch } from '@/lib/api';

const statusIcons: Record<string, React.ElementType> = {
  Approved: CheckCircle,
  Pending: Clock,
  Shipped: Truck,
  Delivered: Package,
  ACCEPTED: CheckCircle,
  SENT: Clock,
  DELIVERED: Package,
  CANCELLED: Package,
};

const statusColors: Record<string, string> = {
  Approved: '#3B82F6',
  Pending: '#F59E0B',
  Shipped: '#8B5CF6',
  Delivered: '#10B981',
  ACCEPTED: '#3B82F6',
  SENT: '#F59E0B',
  DELIVERED: '#10B981',
  CANCELLED: '#EF4444',
};

export default function PurchaseOrders() {
  const [search, setSearch] = useState('');
  const [selectedPO, setSelectedPO] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadPOs() {
      try {
        const res = await apiFetch("/purchase-orders?page=1&page_size=100");
        if (res && res.success && res.data && res.data.items) {
          const itemsList = res.data.items;
          purchaseOrders.length = 0;
          itemsList.forEach((po: any) => {
            purchaseOrders.push({
              id: po.po_number,
              dbId: po.id,
              vendor: po.vendor_name || 'Acme Vendor',
              amount: po.total_amount,
              status: po.status === 'ACCEPTED' ? 'Approved' : po.status === 'SENT' ? 'Pending' : po.status === 'DELIVERED' ? 'Delivered' : po.status,
              date: po.created_at ? po.created_at.split('T')[0] : 'N/A',
              items: po.items?.length || 0
            });
          });
          setLoaded(true);
        }
      } catch (err) {
        console.error("Failed to load POs: ", err);
      }
    }
    loadPOs();
  }, []);

  const filtered = purchaseOrders.filter((po) =>
    po.vendor.toLowerCase().includes(search.toLowerCase()) ||
    po.id.toLowerCase().includes(search.toLowerCase())
  );

  const selected = purchaseOrders.find((po) => po.id === selectedPO);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Purchase Orders</h1>
          <p className="text-sm text-[#94A3B8] mt-1">Track and manage purchase orders</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* PO List */}
        <div className={`${selectedPO ? 'col-span-7' : 'col-span-12'}`}>
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search purchase orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#1B2240] border border-transparent focus:border-[#4F46E5] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#64748B] outline-none transition-all focus:ring-2 focus:ring-[#4F46E5]/20"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filtered.map((po, i) => {
              const StatusIcon = statusIcons[po.status] || Clock;
              const color = statusColors[po.status] || '#F59E0B';
              return (
                <motion.div
                  key={po.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedPO(po.id)}
                  className={`bg-[#111827] border rounded-xl p-5 cursor-pointer transition-all ${
                    selectedPO === po.id ? 'border-[#4F46E5]/50 shadow-glow-sm' : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <StatusIcon className="w-5 h-5" style={{ color }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-[#4F46E5]">{po.id}</span>
                          <Badge variant={
                            po.status === 'Approved' ? 'info' :
                            po.status === 'Pending' ? 'warning' :
                            po.status === 'Shipped' ? 'primary' : 'success'
                          }>
                            {po.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-white font-medium mt-1">{po.vendor}</p>
                        <p className="text-xs text-[#64748B] mt-0.5">{po.items} items · {po.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold font-mono text-white">${po.amount.toLocaleString()}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* PO Detail */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="col-span-5"
            >
              <div className="bg-[#111827] border border-white/5 rounded-xl p-6 sticky top-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">PO Details</h3>
                  <Badge variant={
                    selected.status === 'Approved' ? 'info' :
                    selected.status === 'Pending' ? 'warning' :
                    selected.status === 'Shipped' ? 'primary' : 'success'
                  }>
                    {selected.status}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div className="bg-[#090C18] rounded-lg p-4">
                    <p className="text-[10px] text-[#64748B] uppercase tracking-wider mb-1">Purchase Order ID</p>
                    <p className="text-sm font-mono text-white">{selected.id}</p>
                  </div>

                  <div className="bg-[#090C18] rounded-lg p-4">
                    <p className="text-[10px] text-[#64748B] uppercase tracking-wider mb-1">Vendor</p>
                    <p className="text-sm text-white font-medium">{selected.vendor}</p>
                  </div>

                  {/* Status Tracker */}
                  <div className="bg-[#090C18] rounded-lg p-4">
                    <p className="text-[10px] text-[#64748B] uppercase tracking-wider mb-3">Order Status</p>
                    <div className="flex items-center gap-2">
                      {['Approved', 'Processing', 'Shipped', 'Delivered'].map((step, i) => {
                        const stepOrder = ['Approved', 'Pending', 'Shipped', 'Delivered'];
                        const currentIdx = stepOrder.indexOf(selected.status);
                        const isCompleted = i <= currentIdx;
                        const isCurrent = i === currentIdx;

                        return (
                          <div key={step} className="flex items-center gap-2 flex-1">
                            <div className="flex flex-col items-center">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                isCompleted ? 'bg-[#10B981]' : isCurrent ? 'bg-[#F59E0B]' : 'bg-[#1B2240]'
                              }`}>
                                {isCompleted && (
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                                {!isCompleted && !isCurrent && (
                                  <div className="w-2 h-2 rounded-full bg-[#64748B]" />
                                )}
                              </div>
                              <span className={`text-[9px] mt-1 ${isCurrent ? 'text-[#F59E0B] font-medium' : 'text-[#64748B]'}`}>
                                {step}
                              </span>
                            </div>
                            {i < 3 && (
                              <div className={`flex-1 h-px ${isCompleted ? 'bg-[#10B981]' : 'bg-[#1B2240]'}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-[10px] text-[#64748B] uppercase tracking-wider">Total Amount</p>
                      <p className="text-2xl font-bold font-mono text-white">${selected.amount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
