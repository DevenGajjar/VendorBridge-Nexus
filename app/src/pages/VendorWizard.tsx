import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StepIndicator } from '@/components/vendor-wizard/StepIndicator';
import { SignaturePad } from '@/components/vendor-wizard/SignaturePad';
import { SuccessOverlay } from '@/components/vendor-wizard/SuccessOverlay';
import { apiFetch } from '@/lib/api';

const steps = ['Profile', 'Compliance', 'Banking', 'Products', 'Terms'];

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 100 : -100, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -100 : 100, opacity: 0 }),
};

export default function VendorWizard() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [signature, setSignature] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await apiFetch("/vendors/categories");
        if (res && res.success && res.data) {
          setCategories(res.data);
        }
      } catch (err) {
        console.error("Failed to load categories: ", err);
      }
    }
    loadCategories();
  }, []);

  const updateField = useCallback((section: string, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  }, []);

  const goNext = async () => {
    if (step < 5) {
      setDirection(1);
      setStep(step + 1);
    } else {
      setSubmitting(true);
      setError(null);
      try {
        // Validation check
        if (!formData.profile?.businessName) {
          throw new Error("Business Name is required in Step 1.");
        }
        if (!formData.profile?.email) {
          throw new Error("Email is required in Step 1.");
        }
        if (!formData.compliance?.gstNumber) {
          throw new Error("GST Number is required in Step 2.");
        }

        const catId = formData.profile.categoryId && formData.profile.categoryId.trim() !== ""
          ? formData.profile.categoryId
          : (categories.length > 0 ? categories[0].id : undefined);

        if (!catId) {
          throw new Error("Please select a Vendor Category in Step 1.");
        }

        const payload = {
          name: formData.profile.businessName,
          vendor_code: formData.profile.regNumber || ("VND-" + Math.random().toString(36).substring(2, 8).toUpperCase()),
          email: formData.profile.email,
          phone: formData.profile.phone || "",
          address: formData.compliance.address || "",
          gst_number: formData.compliance.gstNumber.toUpperCase(),
          rating: 4.0,
          category_id: catId,
          status: "PENDING"
        };

        const res = await apiFetch("/vendors", {
          method: "POST",
          json: payload
        });

        if (res && res.success) {
          setShowSuccess(true);
        } else {
          setError(res.message || "Failed to submit vendor onboarding profile.");
        }
      } catch (err: any) {
        console.error("Vendor onboarding failed: ", err);
        setError(err.message || "An unexpected error occurred during vendor registration.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const goPrev = () => {
    setDirection(-1);
    if (step > 1) setStep(step - 1);
  };

  const toggleProduct = (id: string) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-white tracking-tight">Vendor Onboarding</h1>
        <p className="text-sm text-[#94A3B8] mt-1">Complete the following steps to register a new vendor</p>
      </div>

      <StepIndicator currentStep={step} steps={steps} />

      <div className="bg-[#111827] border border-white/5 rounded-2xl p-8 shadow-2xl overflow-hidden relative min-h-[420px]">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Step 1: Vendor Profile */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-white mb-4">Vendor Profile</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#94A3B8] mb-1.5">Business Name *</label>
                    <input
                      type="text"
                      placeholder="Enter business name"
                      className="w-full bg-[#090C18] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#64748B] outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition-all"
                      onChange={(e) => updateField('profile', 'businessName', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#94A3B8] mb-1.5">Business Type *</label>
                    <select
                      className="w-full bg-[#090C18] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition-all appearance-none"
                      onChange={(e) => updateField('profile', 'businessType', e.target.value)}
                    >
                      <option value="">Select type</option>
                      <option value="corporation">Corporation</option>
                      <option value="llc">LLC</option>
                      <option value="partnership">Partnership</option>
                      <option value="sole_proprietorship">Sole Proprietorship</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#94A3B8] mb-1.5">Registration Number *</label>
                    <input
                      type="text"
                      placeholder="e.g., CIN-LXXXXX"
                      className="w-full bg-[#090C18] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#64748B] outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition-all"
                      onChange={(e) => updateField('profile', 'regNumber', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#94A3B8] mb-1.5">Year of Establishment</label>
                    <input
                      type="number"
                      placeholder="YYYY"
                      className="w-full bg-[#090C18] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#64748B] outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition-all"
                      onChange={(e) => updateField('profile', 'yearEstablished', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#94A3B8] mb-1.5">Contact Name *</label>
                    <input
                      type="text"
                      placeholder="Primary contact person"
                      className="w-full bg-[#090C18] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#64748B] outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition-all"
                      onChange={(e) => updateField('profile', 'contactName', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#94A3B8] mb-1.5">Email *</label>
                    <input
                      type="email"
                      placeholder="contact@company.com"
                      className="w-full bg-[#090C18] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#64748B] outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition-all"
                      onChange={(e) => updateField('profile', 'email', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#94A3B8] mb-1.5">Phone Number *</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-[#090C18] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#64748B] outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition-all"
                      onChange={(e) => updateField('profile', 'phone', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#94A3B8] mb-1.5">Vendor Category *</label>
                    <select
                      className="w-full bg-[#090C18] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition-all appearance-none"
                      onChange={(e) => updateField('profile', 'categoryId', e.target.value)}
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Compliance */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-white mb-4">Compliance Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#94A3B8] mb-1.5">GST Number *</label>
                    <input
                      type="text"
                      placeholder="e.g., 27AABCU9603R1ZX"
                      maxLength={15}
                      className="w-full bg-[#090C18] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#64748B] outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition-all"
                      onChange={(e) => updateField('compliance', 'gstNumber', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#94A3B8] mb-1.5">PAN Number</label>
                    <input
                      type="text"
                      placeholder="e.g., ABCDE1234F"
                      className="w-full bg-[#090C18] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#64748B] outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition-all"
                      onChange={(e) => updateField('compliance', 'panNumber', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-[#94A3B8] mb-1.5">Registered Address *</label>
                    <textarea
                      rows={3}
                      placeholder="Full registered business address"
                      className="w-full bg-[#090C18] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#64748B] outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition-all resize-none"
                      onChange={(e) => updateField('compliance', 'address', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#94A3B8] mb-1.5">Tax Classification</label>
                    <select
                      className="w-full bg-[#090C18] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition-all appearance-none"
                      onChange={(e) => updateField('compliance', 'taxClass', e.target.value)}
                    >
                      <option value="">Select classification</option>
                      <option value="regular">Regular</option>
                      <option value="composition">Composition</option>
                      <option value="exempt">Exempt</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#94A3B8] mb-1.5">MSME Registration</label>
                    <select
                      className="w-full bg-[#090C18] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition-all appearance-none"
                      onChange={(e) => updateField('compliance', 'msme', e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="micro">Micro</option>
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="na">Not Applicable</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Banking */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-white mb-4">Banking Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#94A3B8] mb-1.5">Account Holder Name *</label>
                    <input
                      type="text"
                      placeholder="Name as per bank records"
                      className="w-full bg-[#090C18] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#64748B] outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition-all"
                      onChange={(e) => updateField('banking', 'accountHolder', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#94A3B8] mb-1.5">Bank Name *</label>
                    <input
                      type="text"
                      placeholder="e.g., HDFC Bank"
                      className="w-full bg-[#090C18] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#64748B] outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition-all"
                      onChange={(e) => updateField('banking', 'bankName', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#94A3B8] mb-1.5">Account Number *</label>
                    <input
                      type="password"
                      placeholder="Enter account number"
                      className="w-full bg-[#090C18] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#64748B] outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition-all"
                      onChange={(e) => updateField('banking', 'accountNumber', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#94A3B8] mb-1.5">Confirm Account Number *</label>
                    <input
                      type="password"
                      placeholder="Re-enter account number"
                      className="w-full bg-[#090C18] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#64748B] outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#94A3B8] mb-1.5">IFSC / SWIFT Code *</label>
                    <input
                      type="text"
                      placeholder="e.g., HDFC0001234"
                      className="w-full bg-[#090C18] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#64748B] outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition-all"
                      onChange={(e) => updateField('banking', 'ifsc', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#94A3B8] mb-1.5">Branch Name</label>
                    <input
                      type="text"
                      placeholder="Branch location"
                      className="w-full bg-[#090C18] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#64748B] outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition-all"
                      onChange={(e) => updateField('banking', 'branch', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Product Selection */}
            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-white mb-4">Select Products for Supply</h2>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'p1', name: 'Paracetamol 500mg', category: 'Pharmaceuticals', price: '$2.50' },
                    { id: 'p2', name: 'Surgical Masks (N95)', category: 'PPE', price: '$18.00' },
                    { id: 'p3', name: 'Nitrile Gloves', category: 'PPE', price: '$12.50' },
                    { id: 'p4', name: 'Digital Thermometer', category: 'Equipment', price: '$45.00' },
                    { id: 'p5', name: 'BP Monitor', category: 'Equipment', price: '$120.00' },
                    { id: 'p6', name: 'Surgical Sutures', category: 'Surgical', price: '$35.00' },
                  ].map((product) => {
                    const isSelected = selectedProducts.has(product.id);
                    return (
                      <motion.button
                        key={product.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleProduct(product.id)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? 'border-[#4F46E5] bg-[#4F46E5]/10'
                            : 'border-white/5 bg-[#090C18] hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="w-8 h-8 rounded-lg bg-[#1B2240] flex items-center justify-center">
                            <svg className="w-4 h-4 text-[#4F46E5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-[#4F46E5] flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-white font-medium">{product.name}</p>
                        <p className="text-[10px] text-[#64748B] mt-0.5">{product.category}</p>
                        <p className="text-xs font-mono text-[#4F46E5] mt-1">{product.price}</p>
                      </motion.button>
                    );
                  })}
                </div>
                {selectedProducts.size > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {Array.from(selectedProducts).map((id) => {
                      const product = { p1: 'Paracetamol', p2: 'Surgical Masks', p3: 'Nitrile Gloves', p4: 'Thermometer', p5: 'BP Monitor', p6: 'Sutures' }[id];
                      return (
                        <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#4F46E5]/20 text-[#4F46E5] text-xs rounded-full">
                          {product}
                          <button onClick={() => toggleProduct(id)} className="hover:text-white">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Terms & Signature */}
            {step === 5 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-white mb-4">Terms & Conditions</h2>
                <div className="bg-[#090C18] rounded-xl p-4 border border-white/5 max-h-40 overflow-y-auto">
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    By submitting this vendor registration form, you agree to comply with all applicable laws and regulations governing the sale and distribution of medical supplies and pharmaceuticals. The vendor warrants that all products supplied shall meet the quality standards specified in the purchase order and applicable regulatory requirements. Payment terms are Net 30 days from the date of invoice unless otherwise agreed in writing. The vendor agrees to maintain adequate insurance coverage and indemnify the purchaser against any claims arising from defective products. This agreement may be terminated by either party with 30 days written notice. All pricing is confidential and subject to periodic review. The vendor shall not assign or subcontract any obligations without prior written consent.
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-[#94A3B8] mb-2">Digital Signature *</label>
                  <SignaturePad onChange={setSignature} />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={goPrev}
          disabled={step === 1 || submitting}
          className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            step === 1 || submitting
              ? 'bg-[#1B2240] text-[#64748B] cursor-not-allowed'
              : 'bg-[#1B2240] text-[#94A3B8] hover:text-white hover:bg-[#1B2240]/80'
          }`}
        >
          Previous
        </button>
        <button
          onClick={goNext}
          disabled={submitting}
          className={`px-6 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-medium rounded-lg shadow-glow-sm hover:shadow-glow transition-all flex items-center gap-2 ${
            submitting ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {submitting ? 'Submitting...' : (step === 5 ? 'Submit for Approval' : 'Next Step')}
          {!submitting && step < 5 && (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>

      {showSuccess && <SuccessOverlay />}
    </div>
  );
}
