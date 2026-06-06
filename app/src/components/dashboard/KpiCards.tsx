import { motion } from 'framer-motion';
import { Users, Star, ShoppingCart } from 'lucide-react';
import { ActiveVendorsChart } from './ActiveVendorsChart';
import { VendorRatingRing } from './VendorRatingRing';
import { SparklineChart } from './SparklineChart';
import { kpiData } from '@/data/mockData';

export function KpiCards() {
  return (
    <div className="grid grid-cols-3 gap-6 mb-8">
      {/* Total Active Vendors */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0 }}
        className="bg-[#111827] border border-white/5 rounded-xl p-6 hover:border-[#4F46E5]/30 transition-all duration-300 group"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[#94A3B8] text-xs font-medium uppercase tracking-wider mb-1">
              Total Active Vendors
            </p>
            <h3 className="text-2xl font-bold text-white font-mono">
              {kpiData.totalActiveVendors.toLocaleString()}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#4F46E5]/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-[#4F46E5]" />
          </div>
        </div>
        <ActiveVendorsChart />
      </motion.div>

      {/* Avg Vendor Rating */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-[#111827] border border-white/5 rounded-xl p-6 hover:border-[#4F46E5]/30 transition-all duration-300"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[#94A3B8] text-xs font-medium uppercase tracking-wider mb-1">
              Avg. Vendor Rating
            </p>
            <h3 className="text-2xl font-bold text-white font-mono">
              {kpiData.avgVendorRating}
              <span className="text-sm text-[#64748B] font-normal ml-1">/ 5.0</span>
            </h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/20 flex items-center justify-center">
            <Star className="w-5 h-5 text-[#F59E0B]" />
          </div>
        </div>
        <div className="flex items-center justify-center py-2">
          <VendorRatingRing />
        </div>
      </motion.div>

      {/* Active Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-[#111827] border border-white/5 rounded-xl p-6 hover:border-[#4F46E5]/30 transition-all duration-300"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[#94A3B8] text-xs font-medium uppercase tracking-wider mb-1">
              Active Orders
            </p>
            <h3 className="text-2xl font-bold text-white font-mono">
              {kpiData.activeOrders.toLocaleString()}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#10B981]/20 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-[#10B981]" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <SparklineChart />
          <span className="text-xs font-medium text-[#10B981] bg-[#10B981]/20 px-2 py-1 rounded-full">
            +{kpiData.ordersGrowth}%
          </span>
        </div>
      </motion.div>
    </div>
  );
}
