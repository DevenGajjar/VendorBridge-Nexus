// Dashboard KPI Data
export const kpiData = {
  totalActiveVendors: 9430,
  avgVendorRating: 4.6,
  activeOrders: 1847,
  ordersGrowth: 5.3,
  monthlySpend: 2847500,
  pendingRFQs: 24,
  pendingApprovals: 8,
  generatedInvoices: 156,
};

// Bar chart data for Active Vendors KPI
export const vendorBarData = [0.4, 0.7, 0.5, 0.9, 0.6];

// Sparkline data for Active Orders KPI
export const sparklineData = [65, 72, 68, 75, 82, 78, 85, 92, 88, 95, 102, 98, 105, 112, 108];

// Recent Vendor Payments
export const recentPayments = [
  { id: '1', name: 'MediCorp Pharmaceuticals', initials: 'MP', status: 'Paid', spend: '$48,250.00', date: '2026-06-05' },
  { id: '2', name: 'Global Surgical Supplies', initials: 'GS', status: 'Pending', spend: '$12,800.00', date: '2026-06-04' },
  { id: '3', name: 'Apex Medical Devices', initials: 'AM', status: 'Processing', spend: '$89,400.00', date: '2026-06-04' },
  { id: '4', name: 'BioHealth Diagnostics', initials: 'BH', status: 'Paid', spend: '$23,150.00', date: '2026-06-03' },
  { id: '5', name: 'SterileTech Industries', initials: 'ST', status: 'Pending', spend: '$67,900.00', date: '2026-06-03' },
  { id: '6', name: 'CarePlus Equipment', initials: 'CP', status: 'Paid', spend: '$34,600.00', date: '2026-06-02' },
  { id: '7', name: 'Vitality Life Sciences', initials: 'VL', status: 'Processing', spend: '$91,200.00', date: '2026-06-01' },
  { id: '8', name: 'MedSource Distribution', initials: 'MS', status: 'Paid', spend: '$15,750.00', date: '2026-05-31' },
];

// Order Tracking Donut Data
export const orderTrackingData = [
  { name: 'Requested', value: 423, color: '#4F46E5' },
  { name: 'Processing', value: 312, color: '#10B981' },
  { name: 'In-Transit', value: 568, color: '#F59E0B' },
  { name: 'Delivered', value: 544, color: '#64748B' },
];

// Procurement Pipeline Data
export const pipelineData = {
  rfqCreated: 48,
  quotationsReceived: 36,
  approvalPending: 12,
  poGenerated: 28,
  invoiceGenerated: 22,
};

// Recent Activity Timeline
export const recentActivity = [
  { id: '1', action: 'RFQ #2026-0542 Created', user: 'Sarah Chen', time: '2 min ago', type: 'rfq' },
  { id: '2', action: 'Quote Received from MediCorp', user: 'System', time: '15 min ago', type: 'quote' },
  { id: '3', action: 'PO #PO-2026-0891 Approved', user: 'Michael Roberts', time: '32 min ago', type: 'approval' },
  { id: '4', action: 'Invoice #INV-4521 Generated', user: 'System', time: '1 hour ago', type: 'invoice' },
  { id: '5', action: 'Vendor Apex Medical Onboarded', user: 'Sarah Chen', time: '2 hours ago', type: 'vendor' },
  { id: '6', action: 'Payment $48,250 Processed', user: 'System', time: '3 hours ago', type: 'payment' },
];

// Vendor Health Data
export const vendorHealthData = [
  { name: 'MediCorp', score: 94, status: 'Excellent' },
  { name: 'Global Surgical', score: 87, status: 'Good' },
  { name: 'Apex Medical', score: 72, status: 'Fair' },
  { name: 'BioHealth', score: 91, status: 'Excellent' },
  { name: 'SterileTech', score: 68, status: 'At Risk' },
];

// Upcoming Deadlines
export const upcomingDeadlines = [
  { id: '1', title: 'RFQ #2026-0542 Closes', vendor: 'Multiple Vendors', date: '2026-06-07', type: 'rfq' },
  { id: '2', title: 'Quote from Apex Medical Due', vendor: 'Apex Medical Devices', date: '2026-06-08', type: 'quote' },
  { id: '3', title: 'PO #PO-2026-0892 Approval', vendor: 'BioHealth Diagnostics', date: '2026-06-09', type: 'approval' },
  { id: '4', title: 'Invoice #INV-4522 Due', vendor: 'SterileTech Industries', date: '2026-06-10', type: 'invoice' },
];

// Product Catalog for Wizard
export const productCatalog = [
  { id: 'p1', name: 'Paracetamol 500mg', category: 'Pharmaceuticals', price: '$2.50', unit: 'Box/100' },
  { id: 'p2', name: 'Surgical Masks (N95)', category: 'PPE', price: '$18.00', unit: 'Box/50' },
  { id: 'p3', name: 'Nitrile Gloves (Medium)', category: 'PPE', price: '$12.50', unit: 'Box/100' },
  { id: 'p4', name: 'Digital Thermometer', category: 'Equipment', price: '$45.00', unit: 'Each' },
  { id: 'p5', name: 'Blood Pressure Monitor', category: 'Equipment', price: '$120.00', unit: 'Each' },
  { id: 'p6', name: 'Surgical Sutures (Pack)', category: 'Surgical', price: '$35.00', unit: 'Pack/24' },
  { id: 'p7', name: 'IV Drip Set', category: 'Infusion', price: '$8.75', unit: 'Set' },
  { id: 'p8', name: 'Medical Gauze Rolls', category: 'Wound Care', price: '$5.25', unit: 'Box/12' },
];

// Vendor List Data
export const vendorList = [
  {
    id: 'v1',
    name: 'MediCorp Pharmaceuticals',
    initials: 'MP',
    contact: 'Dr. James Wilson',
    email: 'jwilson@medicorp.com',
    phone: '+1 (555) 123-4567',
    category: 'Pharmaceuticals',
    status: 'Active',
    rating: 4.8,
    spend: '$1,245,800',
    gst: '27AABCU9603R1ZX',
    yearEstablished: 2005,
    address: '2500 Pharma Boulevard, Newark, NJ 07102',
    paymentTerms: 'Net 30',
    leadTime: '5-7 days',
    lastOrder: '2026-06-05',
  },
  {
    id: 'v2',
    name: 'Global Surgical Supplies',
    initials: 'GS',
    contact: 'Lisa Thompson',
    email: 'lthompson@globalsurgical.com',
    phone: '+1 (555) 234-5678',
    category: 'Surgical Equipment',
    status: 'Active',
    rating: 4.5,
    spend: '$892,400',
    gst: '29AAGFG1234R1ZM',
    yearEstablished: 1998,
    address: '1800 Medical Center Drive, Houston, TX 77030',
    paymentTerms: 'Net 45',
    leadTime: '10-14 days',
    lastOrder: '2026-06-04',
  },
  {
    id: 'v3',
    name: 'Apex Medical Devices',
    initials: 'AM',
    contact: 'Raj Patel',
    email: 'rpatel@apexmedical.com',
    phone: '+1 (555) 345-6789',
    category: 'Medical Devices',
    status: 'Active',
    rating: 4.2,
    spend: '$654,200',
    gst: '33AAICA1234R1ZL',
    yearEstablished: 2012,
    address: '890 Innovation Way, San Jose, CA 95134',
    paymentTerms: 'Net 30',
    leadTime: '7-10 days',
    lastOrder: '2026-06-01',
  },
  {
    id: 'v4',
    name: 'BioHealth Diagnostics',
    initials: 'BH',
    contact: 'Dr. Maria Santos',
    email: 'msantos@biohealth.com',
    phone: '+1 (555) 456-7890',
    category: 'Diagnostics',
    status: 'Active',
    rating: 4.9,
    spend: '$1,567,300',
    gst: '27AABCB1234R1ZM',
    yearEstablished: 2001,
    address: '450 Research Park, Boston, MA 02118',
    paymentTerms: 'Net 15',
    leadTime: '3-5 days',
    lastOrder: '2026-06-03',
  },
  {
    id: 'v5',
    name: 'SterileTech Industries',
    initials: 'ST',
    contact: 'David Kim',
    email: 'dkim@steriletech.com',
    phone: '+1 (555) 567-8901',
    category: 'Sterilization',
    status: 'Inactive',
    rating: 3.8,
    spend: '$423,100',
    gst: '29ABCDE1234R1Z5',
    yearEstablished: 2010,
    address: '720 Cleanroom Lane, Phoenix, AZ 85034',
    paymentTerms: 'Net 60',
    leadTime: '14-21 days',
    lastOrder: '2026-05-15',
  },
  {
    id: 'v6',
    name: 'CarePlus Equipment',
    initials: 'CP',
    contact: 'Angela Foster',
    email: 'afoster@careplus.com',
    phone: '+1 (555) 678-9012',
    category: 'Patient Care',
    status: 'Active',
    rating: 4.6,
    spend: '$789,600',
    gst: '27AAAFZ1234R1ZR',
    yearEstablished: 2008,
    address: '1500 Care Way, Chicago, IL 60611',
    paymentTerms: 'Net 30',
    leadTime: '5-7 days',
    lastOrder: '2026-06-02',
  },
];

// RFQ List Data
export const rfqList = [
  { id: 'RFQ-2026-0542', title: 'Q3 Pharmaceuticals Procurement', items: 12, vendors: 5, status: 'Open', deadline: '2026-06-07', createdBy: 'Sarah Chen', createdDate: '2026-05-28' },
  { id: 'RFQ-2026-0541', title: 'Surgical Equipment Refresh', items: 8, vendors: 3, status: 'Under Review', deadline: '2026-06-05', createdBy: 'Michael Roberts', createdDate: '2026-05-25' },
  { id: 'RFQ-2026-0540', title: 'PPE Emergency Restock', items: 24, vendors: 8, status: 'Closed', deadline: '2026-05-30', createdBy: 'Sarah Chen', createdDate: '2026-05-20' },
  { id: 'RFQ-2026-0539', title: 'Medical Device Calibration', items: 6, vendors: 2, status: 'Open', deadline: '2026-06-10', createdBy: 'David Lee', createdDate: '2026-05-18' },
  { id: 'RFQ-2026-0538', title: 'Diagnostic Reagents Supply', items: 15, vendors: 4, status: 'Under Review', deadline: '2026-06-03', createdBy: 'Sarah Chen', createdDate: '2026-05-15' },
];

// Quotation Comparison Data
export const quotationComparison = {
  rfqId: 'RFQ-2026-0542',
  rfqTitle: 'Q3 Pharmaceuticals Procurement',
  vendors: [
    { name: 'MediCorp', rating: 4.8, delivery: '5-7 days', totalPrice: 48250, priceColor: '#10B981' },
    { name: 'BioHealth', rating: 4.9, delivery: '3-5 days', totalPrice: 52300, priceColor: '#F59E0B' },
    { name: 'Apex Medical', rating: 4.2, delivery: '7-10 days', totalPrice: 46700, priceColor: '#10B981' },
  ],
  items: [
    { name: 'Paracetamol 500mg (1000 units)', medicorp: 2500, biohealth: 2650, apex: 2400 },
    { name: 'Amoxicillin 250mg (500 units)', medicorp: 1800, biohealth: 1750, apex: 1900 },
    { name: 'Ibuprofen 400mg (800 units)', medicorp: 3200, biohealth: 3400, apex: 3100 },
    { name: 'Cetirizine 10mg (600 units)', medicorp: 1500, biohealth: 1600, apex: 1450 },
    { name: 'Metformin 500mg (400 units)', medicorp: 2800, biohealth: 2900, apex: 2750 },
  ],
};

// Approval Workflow Data
export const approvalWorkflow = {
  rfqId: 'RFQ-2026-0542',
  title: 'Q3 Pharmaceuticals Procurement',
  currentStage: 'Approval Pending',
  stages: [
    { name: 'RFQ Created', status: 'completed', date: '2026-05-28', by: 'Sarah Chen' },
    { name: 'Quotations Received', status: 'completed', date: '2026-06-02', by: 'System' },
    { name: 'Technical Review', status: 'completed', date: '2026-06-03', by: 'Dr. James Wilson' },
    { name: 'Procurement Approval', status: 'pending', date: null, by: 'Michael Roberts' },
    { name: 'Finance Approval', status: 'upcoming', date: null, by: 'CFO Office' },
    { name: 'PO Generation', status: 'upcoming', date: null, by: 'System' },
  ],
};

// Purchase Orders Data
export const purchaseOrders: any[] = [
  { id: 'PO-2026-0891', vendor: 'MediCorp Pharmaceuticals', amount: 48250, status: 'Approved', date: '2026-06-04', items: 12 },
  { id: 'PO-2026-0890', vendor: 'BioHealth Diagnostics', amount: 23150, status: 'Pending', date: '2026-06-03', items: 8 },
  { id: 'PO-2026-0889', vendor: 'CarePlus Equipment', amount: 34600, status: 'Shipped', date: '2026-06-02', items: 6 },
  { id: 'PO-2026-0888', vendor: 'Global Surgical Supplies', amount: 12800, status: 'Delivered', date: '2026-05-30', items: 4 },
  { id: 'PO-2026-0887', vendor: 'Apex Medical Devices', amount: 89400, status: 'Approved', date: '2026-05-28', items: 15 },
];

// Invoice Data
export const invoiceData: any[] = [
  { id: 'INV-4521', poId: 'PO-2026-0891', vendor: 'MediCorp Pharmaceuticals', amount: 48250, tax: 8685, total: 56935, status: 'Paid', date: '2026-06-05' },
  { id: 'INV-4520', poId: 'PO-2026-0890', vendor: 'BioHealth Diagnostics', amount: 23150, tax: 4167, total: 27317, status: 'Pending', date: '2026-06-04' },
  { id: 'INV-4519', poId: 'PO-2026-0889', vendor: 'CarePlus Equipment', amount: 34600, tax: 6228, total: 40828, status: 'Overdue', date: '2026-06-02' },
  { id: 'INV-4518', poId: 'PO-2026-0888', vendor: 'Global Surgical Supplies', amount: 12800, tax: 2304, total: 15104, status: 'Paid', date: '2026-05-31' },
];

// Monthly Spend Trend Data
export const monthlySpendData = [
  { month: 'Jan', amount: 185000 },
  { month: 'Feb', amount: 210000 },
  { month: 'Mar', amount: 195000 },
  { month: 'Apr', amount: 245000 },
  { month: 'May', amount: 230000 },
  { month: 'Jun', amount: 284750 },
];
