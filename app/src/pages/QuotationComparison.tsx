import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Clock, Star, TrendingDown, TrendingUp, ArrowLeftRight, CheckCircle, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function QuotationComparison() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramRfqId = searchParams.get('rfq_id');

  const [rfqList, setRfqList] = useState<any[]>([]);
  const [selectedRfqId, setSelectedRfqId] = useState<string>('');
  const [managers, setManagers] = useState<any[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');
  
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load RFQs and Managers on mount
  useEffect(() => {
    async function loadData() {
      try {
        const rfqsRes = await apiFetch("/rfqs?page=1&page_size=100");
        if (rfqsRes && rfqsRes.success && rfqsRes.data?.items) {
          setRfqList(rfqsRes.data.items);
          // If query param is present, select it. Else select first rfq
          if (paramRfqId) {
            setSelectedRfqId(paramRfqId);
          } else if (rfqsRes.data.items.length > 0) {
            setSelectedRfqId(rfqsRes.data.items[0].id);
          }
        }

        const mgrRes = await apiFetch("/auth/managers");
        if (mgrRes && mgrRes.success && mgrRes.data) {
          setManagers(mgrRes.data);
          if (mgrRes.data.length > 0) {
            setSelectedManagerId(mgrRes.data[0].id);
          }
        }
      } catch (err: any) {
        console.error("Failed to load setup data: ", err);
      }
    }
    loadData();
  }, [paramRfqId]);

  // Load comparison matrix when RFQ changes
  useEffect(() => {
    if (!selectedRfqId) return;

    async function loadComparison() {
      setLoading(true);
      setError('');
      setComparison(null);
      try {
        const res = await apiFetch(`/quotations/compare?rfq_id=${selectedRfqId}`);
        if (res && res.success && res.data) {
          setComparison(res.data);
        } else {
          setError("No comparison data available for this RFQ.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load quotation comparison matrix.");
      } finally {
        setLoading(false);
      }
    }
    loadComparison();
  }, [selectedRfqId]);

  // Submit approval request
  const handleApproveBestQuote = async () => {
    if (!comparison || !comparison.recommended_quotation) {
      setError("No recommended quotation to approve.");
      return;
    }
    if (!selectedManagerId) {
      setError("Please select a manager to review the request.");
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await apiFetch("/approvals", {
        method: 'POST',
        json: {
          entity_type: 'QUOTATION',
          entity_id: comparison.recommended_quotation.id,
          assigned_approver_id: selectedManagerId,
          comments: `Approved best quotation automatically selected by intelligence comparison matrix.`
        }
      });

      if (res && res.success) {
        setSuccess("Quotation approval request submitted successfully!");
        setTimeout(() => {
          navigate('/approvals');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit approval request.");
    } finally {
      setSubmitting(false);
    }
  };

  // Parsing matrix logic
  const getParsedData = () => {
    if (!comparison || !comparison.comparison_matrix || comparison.comparison_matrix.length === 0) {
      return { vendors: [], items: [], lowestPrice: 0, bestDelivery: null, bestRating: null };
    }

    const firstEntry = comparison.comparison_matrix[0];
    const vendorNames = firstEntry.quotes.map((q: any) => q.vendor_name);

    // Build vendors summary
    const parsedVendors = vendorNames.map((name: string) => {
      let rating = 4.0;
      let totalP = 0;
      let delDays = 999;

      comparison.comparison_matrix.forEach((entry: any) => {
        const q = entry.quotes.find((x: any) => x.vendor_name === name);
        if (q) {
          rating = q.vendor_rating;
          totalP += q.total_price;
          delDays = q.delivery_days;
        }
      });

      return {
        name,
        rating,
        delivery: `${delDays} days`,
        deliveryDays: delDays,
        totalPrice: totalP
      };
    });

    // Build item-by-item rows
    const parsedItems = comparison.comparison_matrix.map((entry: any) => {
      const row: any = { name: entry.item_name };
      entry.quotes.forEach((q: any) => {
        row[q.vendor_name] = q.unit_price;
      });
      return row;
    });

    const lowestPrice = Math.min(...parsedVendors.map((v: any) => v.totalPrice));
    const bestDelivery = parsedVendors.reduce((best: any, v: any) => v.deliveryDays < best.deliveryDays ? v : best, parsedVendors[0]);
    const bestRating = parsedVendors.reduce((best: any, v: any) => v.rating > best.rating ? v : best, parsedVendors[0]);

    return {
      vendors: parsedVendors,
      items: parsedItems,
      lowestPrice,
      bestDelivery,
      bestRating
    };
  };

  const { vendors, items, lowestPrice, bestDelivery, bestRating } = getParsedData();

  const selectedRfq = rfqList.find(r => r.id === selectedRfqId);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Quotation Comparison Matrix</h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Analyze vendor bid side-by-side matrices and trigger Odoo smart approvals
          </p>
        </div>
        
        {/* RFQ Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#94A3B8] font-medium uppercase">Select RFQ:</span>
          <select
            value={selectedRfqId}
            onChange={(e) => setSelectedRfqId(e.target.value)}
            className="bg-[#1B2240] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#4F46E5]"
          >
            {rfqList.map(r => (
              <option key={r.id} value={r.id}>
                {r.rfq_number} - {r.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-[#94A3B8] text-sm">
          Loading comparison data...
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-[#EF4444] text-sm gap-2">
          <AlertCircle className="w-8 h-8" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 text-green-500 text-sm rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {success}
        </div>
      )}

      {comparison && !loading && (
        <div>
          {/* Comparison Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {vendors.map((vendor: any, i: number) => {
              const isLowestPrice = vendor.totalPrice === lowestPrice;
              const isBestDelivery = vendor.name === bestDelivery?.name;
              const isBestRating = vendor.name === bestRating?.name;

              return (
                <motion.div
                  key={vendor.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-[#111827] border border-white/5 rounded-xl p-5 hover:border-[#4F46E5]/30 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white truncate max-w-[150px]">{vendor.name}</h3>
                    {isLowestPrice && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-[#10B981]/20 text-[#10B981] text-[9px] font-bold rounded-full">
                        <Trophy className="w-2.5 h-2.5" />
                        BEST PRICE
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#94A3B8] flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-[#F59E0B]" />
                        Rating
                      </span>
                      <span className={`text-xs font-bold ${isBestRating ? 'text-[#F59E0B]' : 'text-white'}`}>
                        {vendor.rating}/5.0
                        {isBestRating && <span className="text-[9px] ml-1 text-[#F59E0B]">TOP</span>}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#94A3B8] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#3B82F6]" />
                        Delivery
                      </span>
                      <span className={`text-xs font-bold ${isBestDelivery ? 'text-[#3B82F6]' : 'text-white'}`}>
                        {vendor.delivery}
                        {isBestDelivery && <span className="text-[9px] ml-1 text-[#3B82F6]">FASTEST</span>}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-[11px] text-[#94A3B8]">Total Bid</span>
                      <span className={`text-base font-bold font-mono ${isLowestPrice ? 'text-[#10B981]' : 'text-white'}`}>
                        ${vendor.totalPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Price comparison indicator */}
                  {!isLowestPrice && (
                    <div className="flex items-center gap-1 mt-3 text-[10px] text-[#EF4444]">
                      <TrendingUp className="w-3 h-3" />
                      +${(vendor.totalPrice - lowestPrice).toLocaleString()} vs best
                    </div>
                  )}
                  {isLowestPrice && (
                    <div className="flex items-center gap-1 mt-3 text-[10px] text-[#10B981]">
                      <TrendingDown className="w-3 h-3" />
                      Lowest price offered
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Side-by-side Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden mb-6"
          >
            <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-[#4F46E5]" />
              <h3 className="text-sm font-semibold text-white">Item-by-Item Price Comparison</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[500px]">
                <thead>
                  <tr className="bg-[#1B2240]">
                    <th className="py-3 px-4 text-xs font-medium text-[#94A3B8] uppercase">Item</th>
                    {vendors.map((v: any) => (
                      <th key={v.name} className="py-3 px-4 text-xs font-medium text-[#94A3B8] uppercase text-right">
                        {v.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any, i: number) => {
                    const prices = vendors.map((v: any) => item[v.name] || 0);
                    const minPrice = Math.min(...prices.filter((p: number) => p > 0));

                    return (
                      <tr key={i} className="border-b border-white/5">
                        <td className="py-3 px-4 text-white text-xs font-medium">{item.name}</td>
                        {vendors.map((v: any) => {
                          const price = item[v.name] || 0;
                          const isLowest = price === minPrice;
                          return (
                            <td key={v.name} className="py-3 px-4 text-right">
                              <span className={`font-mono text-xs ${isLowest ? 'text-[#10B981] font-bold' : 'text-[#94A3B8]'}`}>
                                {price > 0 ? `$${price.toLocaleString()}` : 'N/A'}
                              </span>
                              {isLowest && (
                                <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  <tr className="bg-[#1B2240]/50">
                    <td className="py-4 px-4 text-white font-bold text-xs">TOTAL</td>
                    {vendors.map((v: any) => (
                      <td key={v.name} className={`py-4 px-4 text-right font-mono text-sm font-bold ${
                        v.totalPrice === lowestPrice ? 'text-[#10B981]' : 'text-white'
                      }`}>
                        ${v.totalPrice.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Recommended Quotation Details & Manager Assigning */}
          {comparison.recommended_quotation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#101424] border border-[#4F46E5]/20 rounded-xl p-5 mb-6 flex flex-col md:flex-row items-center justify-between gap-4"
            >
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4F46E5] animate-ping" />
                  Smart Recommendation
                </h4>
                <p className="text-xs text-[#94A3B8] mt-1">
                  Quotation <span className="text-white font-mono">{comparison.recommended_quotation.quotation_number}</span> is recommended based on pricing, delivery speed, and vendor ratings.
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-[11px] text-[#94A3B8]">Total Amount: <strong className="text-[#10B981]">${comparison.recommended_quotation.total_amount.toLocaleString()}</strong></span>
                  <span className="text-[11px] text-[#94A3B8]">Delivery: <strong className="text-white">{comparison.recommended_quotation.delivery_days} days</strong></span>
                </div>
              </div>

              {/* Manager Dropdown and Approval Submission */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="flex flex-col gap-1 w-full md:w-48">
                  <label className="text-[10px] text-[#94A3B8] font-semibold uppercase">Assign Approver</label>
                  <select
                    value={selectedManagerId}
                    onChange={(e) => setSelectedManagerId(e.target.value)}
                    className="bg-[#1B2240] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#4F46E5]"
                  >
                    {managers.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.first_name} {m.last_name} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleApproveBestQuote}
                  disabled={submitting || !selectedManagerId}
                  className="px-5 py-3.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold rounded-lg shadow-glow hover:shadow-glow-lg transition-all flex items-center gap-1.5 mt-4 md:mt-0 w-full md:w-auto justify-center disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  {submitting ? "Submitting..." : "Approve Best Quote"}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
