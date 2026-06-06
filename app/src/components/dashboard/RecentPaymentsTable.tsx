import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { recentPayments } from '@/data/mockData';
import { Badge } from '../shared/Badge';

export function RecentPaymentsTable() {
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);

  useEffect(() => {
    if (rowRefs.current.length === 0) return;
    gsap.fromTo(
      rowRefs.current.filter(Boolean),
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: 'power2.out', delay: 0.2 }
    );

    return () => {
      rowRefs.current.forEach((row) => {
        if (row) gsap.killTweensOf(row);
      });
    };
  }, []);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Paid': return 'success' as const;
      case 'Pending': return 'warning' as const;
      case 'Processing': return 'info' as const;
      default: return 'default' as const;
    }
  };

  return (
    <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-white/5">
        <h3 className="text-sm font-semibold text-white">Recent Vendor Payments</h3>
        <p className="text-xs text-[#94A3B8] mt-0.5">Track & manage your recent vendor payments</p>
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-[#1B2240]">
            <th className="py-3 px-4 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Vendor</th>
            <th className="py-3 px-4 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Status</th>
            <th className="py-3 px-4 text-xs font-medium text-[#94A3B8] uppercase tracking-wider text-right">Total Spend</th>
          </tr>
        </thead>
        <tbody>
          {recentPayments.map((vendor, i) => (
            <tr
              key={vendor.id}
              ref={(el) => { rowRefs.current[i] = el; }}
              className="border-b border-white/5 hover:bg-white/5 transition-colors group cursor-pointer"
            >
              <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1B2240] flex items-center justify-center text-xs font-bold text-[#94A3B8]">
                    {vendor.initials}
                  </div>
                  <span className="text-white font-medium text-sm">{vendor.name}</span>
                </div>
              </td>
              <td className="py-4 px-4">
                <Badge variant={getStatusVariant(vendor.status)}>{vendor.status}</Badge>
              </td>
              <td className="py-4 px-4 text-right font-mono text-white">{vendor.spend}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
