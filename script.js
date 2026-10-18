/* ===========================================================
   HubLink Logistics - script.js
   -----------------------------------------------------------
   Workflow records are stored in this browser. Authentication,
   identity review, payment, and live GPS services are not connected.

   Sections:
   1. Constants          6. Rendering helpers
   2. Sample data        7. Buyer screens
   3. State and storage  8. Seller screens
   4. Date and money     9. Administrator screens
   5. Business rules    10. Actions (buttons) and events
   =========================================================== */

/* ===========================================================
   1. CONSTANTS
   =========================================================== */
const STORAGE_KEY = 'hublink_prototype_v1';
const FEE_RATE = 0.03;        // Schedule & Hold service fee = 3% of order value
const MAX_HOLD_DAYS = 3;      // Maximum holding period (calendar days from hub arrival)
const DECISION_HOURS = 12;    // Buyer has 12 hours to choose a delivery option
const BUYER_NAME = 'Maria Santos'; // The demo buyer whose data the Buyer role shows

const TIME_WINDOWS = ['8:00 AM – 11:00 AM', '1:00 PM – 4:00 PM', '5:00 PM – 8:00 PM'];

// Statuses that mean "the parcel is physically at a local hub"
const HUB_STATUSES = ['At Local Hub', 'Awaiting Instruction', 'Consolidated', 'Scheduled Hold'];

const ORDER_FILTERS = ['All Orders', 'Processing', 'In Transit', 'At Local Hub', 'Awaiting Instruction',
  'Consolidated', 'Scheduled Hold', 'Out for Delivery', 'Delivered', 'Failed Delivery', 'Return to Seller'];

// Badge colors: green = completed, amber = pending, red = failed, blue = moving / scheduled
const STATUS_COLORS = {
  'Processing': 'amber', 'In Transit': 'blue', 'At Local Hub': 'amber', 'Awaiting Instruction': 'amber',
  'Consolidated': 'blue', 'Scheduled Hold': 'blue', 'Out for Delivery': 'blue', 'Delivered': 'green',
  'Failed Delivery': 'red', 'Return to Seller': 'red'
};

const STEPS = ['Order Confirmed', 'Packed by Seller', 'Ready to Ship', 'Parcel Handed Over', 'In Transit'];

const VERIFICATION_LABELS = {
  none: ['Not Verified', 'gray'],
  submitted: ['Verification Submitted', 'blue'],
  pending: ['Verification Pending', 'amber'],
  verified: ['Verified Buyer', 'green'],
  rejected: ['Verification Rejected', 'red']
};

const SELLERS = ['TechHub Manila', 'StyleLane', 'BookNook', 'GadgetPort', 'HomeNest'];

const PRODUCTS = [
  { name: 'Bluetooth Speaker', seller: 'TechHub Manila', price: 1800 },
  { name: 'Linen Shirt', seller: 'StyleLane', price: 950 },
  { name: 'Novel Bundle (3 books)', seller: 'BookNook', price: 840 },
  { name: 'Phone Stand', seller: 'GadgetPort', price: 350 },
  { name: 'Ceramic Mug Set', seller: 'HomeNest', price: 620 }
];

const RIDERS = [
  { name: 'Rico Dela Peña', vehicle: 'Motorcycle' },
  { name: 'Jun Bautista', vehicle: 'Van' },
  { name: 'Liza Montano', vehicle: 'Motorcycle' }
];

const HUBS = [
  { name: 'Central Local Hub', area: 'Quezon City service area', capacity: 40 },
  { name: 'South Local Hub', area: 'Makati service area', capacity: 30 },
  { name: 'North Local Hub', area: 'Caloocan service area', capacity: 25 }
];

const ROLE_INFO = {
  buyer: { label: 'Buyer', name: 'Maria Santos' },
  seller: { label: 'Seller', name: 'Seller Account' },
  admin: { label: 'Administrator', name: 'Admin Rivera' }
};

// Sidebar navigation for each role
const NAV = {
  buyer: [
    { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', desc: 'Your parcels, decisions, and updates at a glance.' },
    { id: 'orders', label: 'My Orders', icon: 'package', desc: 'Search, filter, and review all of your orders.' },
    { id: 'track', label: 'Shipment Tracking', icon: 'map-pin', desc: 'Review shipment locations and recorded progress.' },
    { id: 'hub', label: 'Hub Decisions', icon: 'warehouse', desc: 'Choose how your parcels leave the local hub.' },
    { id: 'schedule', label: 'Delivery Schedule', icon: 'calendar-days', desc: 'Schedule, reschedule, and handle missed deliveries.' },
    { id: 'addresses', label: 'Addresses', icon: 'house', desc: 'Manage saved delivery addresses and local checks.' },
    { id: 'notifications', label: 'Notifications', icon: 'bell', desc: 'Updates about verification, parcels, and deliveries.' },
    { id: 'profile', label: 'Profile', icon: 'user', desc: 'Your account and buyer verification status.' }
  ],
  seller: [
    { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', desc: 'Incoming orders, packing work, and shipment status.' },
    { id: 'orders', label: 'Orders', icon: 'package', desc: 'All orders for your store, with search and filters.' },
    { id: 'packing', label: 'Packing and Handover', icon: 'box', desc: 'Pack parcels, print labels, and hand over to the rider.' },
    { id: 'consolidation', label: 'Consolidation', icon: 'layers', desc: 'See which orders can be combined for the same buyer and address.' },
    { id: 'shipments', label: 'Shipments', icon: 'truck', desc: 'Parcels that have left your store.' },
    { id: 'history', label: 'Delivery History', icon: 'history', desc: 'Delivered, failed, and returned parcels.' }
  ],
  admin: [
    { id: 'overview', label: 'Overview', icon: 'layout-dashboard', desc: 'Network-wide parcel statistics.' },
    { id: 'parcels', label: 'Parcels', icon: 'package', desc: 'Manage every parcel and its status.' },
    { id: 'verification', label: 'Buyer Verification', icon: 'shield-check', desc: 'Review buyer verification workflow status.' },
    { id: 'addresses', label: 'Address Validation', icon: 'map-pin', desc: 'Review local address checks.' },
    { id: 'hubs', label: 'Local Hubs', icon: 'warehouse', desc: 'Hub capacity and parcels currently held.' },
    { id: 'consolidation', label: 'Consolidation', icon: 'layers', desc: 'Consolidation groups and the eligibility rule.' },
    { id: 'schedules', label: 'Delivery Schedules', icon: 'calendar-days', desc: 'Upcoming scheduled holds and delivery windows.' },
    { id: 'fees', label: 'Service Fees', icon: 'banknote', desc: '3% Schedule & Hold fees and the fee calculator.' },
    { id: 'reports', label: 'Reports', icon: 'trending-up', desc: 'Parcel and delivery reports.' }
  ]
};

/* ===========================================================
   4. DATE AND MONEY HELPERS (placed early so seed data can use them)
   =========================================================== */
function pad(n) { return String(n).padStart(2, '0'); }

// Dates are stored as text: 'YYYY-MM-DDTHH:mm' (date + time) or 'YYYY-MM-DD' (date only)
function toLocalISO(d) {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}
function toDateKey(d) {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}
function parseDateKey(key) {
  const parts = key.split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}
function addHours(d, h) { return new Date(d.getTime() + h * 3600000); }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function daysBetween(a, b) { return Math.round((startOfDay(b) - startOfDay(a)) / 86400000); }

function formatDate(d) { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
function formatDateTime(d) {
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}
function formatWeekday(d) { return d.toLocaleDateString('en-US', { weekday: 'short' }); }

function round2(n) { return Math.round(n * 100) / 100; }
function formatPeso(amount) {
  return '₱' + Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
// Service Fee = Total Order Value x 0.03
function calcFee(orderValue) { return round2(orderValue * FEE_RATE); }

/* ===========================================================
   2. SAMPLE DATA
   =========================================================== */
function createInitialState() {
  // The demo clock starts at 10:00 AM today. Hub arrival times are relative to it.
  const base = new Date();
  base.setHours(10, 0, 0, 0);
  const hoursAgo = function (h) { return toLocalISO(addHours(base, -h)); };
  const dayKey = function (n) { return toDateKey(addDays(base, n)); };
  const R = RIDERS;

  const specs = [
    // ----- Maria Santos: three parcels waiting for a hub decision -----
    { id: 'ORD-10231', seller: 'TechHub Manila', items: 'Wireless Earbuds x1', value: 2000, addressId: 'ADDR-1', tracking: 'PH-LGX-884201', status: 'Awaiting Instruction', ageHours: 60, arrivalAgo: 2 },
    { id: 'ORD-10232', seller: 'StyleLane', items: 'Cotton Hoodie x2', value: 1450, addressId: 'ADDR-1', tracking: 'PH-LGX-884202', status: 'Awaiting Instruction', ageHours: 62, arrivalAgo: 3 },
    { id: 'ORD-10233', seller: 'BookNook', items: 'Notebook Set x3', value: 780, addressId: 'ADDR-2', tracking: 'PH-LGX-884203', status: 'Awaiting Instruction', ageHours: 58, arrivalAgo: 1 },
    // ----- Maria Santos: other stages -----
    { id: 'ORD-10228', seller: 'GadgetPort', items: 'Phone Case x1', value: 650, addressId: 'ADDR-1', tracking: 'PH-LGX-883977', status: 'In Transit', ageHours: 30, rider: R[0].name, vehicle: R[0].vehicle },
    { id: 'ORD-10225', seller: 'HomeNest', items: 'Desk Lamp x1', value: 1200, addressId: 'ADDR-1', tracking: 'PH-LGX-883512', status: 'Out for Delivery', ageHours: 70, arrivalAgo: 20, method: 'Standard Dispatch', timeWindow: '1:00 PM – 6:00 PM', rider: R[1].name, vehicle: R[1].vehicle },
    { id: 'ORD-10219', seller: 'StyleLane', items: 'Running Sneakers x1', value: 3200, addressId: 'ADDR-1', tracking: 'PH-LGX-883120', status: 'Scheduled Hold', ageHours: 90, arrivalAgo: 24, method: 'Schedule & Hold', scheduledDate: dayKey(1), timeWindow: TIME_WINDOWS[1], feeApplied: true, feeAmount: 96, rider: R[2].name, vehicle: R[2].vehicle },
    { id: 'ORD-10216', seller: 'TechHub Manila', items: 'USB-C Hub x1', value: 1800, addressId: 'ADDR-1', tracking: 'PH-LGX-882904', status: 'Failed Delivery', ageHours: 110, arrivalAgo: 50, attemptAgo: 18, method: 'Schedule & Hold', scheduledDate: dayKey(-1), timeWindow: TIME_WINDOWS[0], feeApplied: true, feeAmount: 54, attempts: 1, rider: R[0].name, vehicle: R[0].vehicle },
    { id: 'ORD-10214', seller: 'BookNook', items: 'Cookbook x1', value: 950, addressId: 'ADDR-1', tracking: 'PH-LGX-882551', status: 'Delivered', ageHours: 240, arrivalAgo: 200, deliveredAgo: 120, method: 'Schedule & Hold', scheduledDate: dayKey(-5), timeWindow: TIME_WINDOWS[1], feeApplied: true, feeAmount: 28.5, rider: R[2].name, vehicle: R[2].vehicle },
    { id: 'ORD-10207', seller: 'GadgetPort', items: 'Power Bank x1', value: 1500, addressId: 'ADDR-1', tracking: 'PH-LGX-881976', status: 'Delivered', ageHours: 300, arrivalAgo: 260, deliveredAgo: 220, method: 'Standard Dispatch', rider: R[1].name, vehicle: R[1].vehicle },
    { id: 'ORD-10201', seller: 'HomeNest', items: 'Curtain Set x2', value: 2100, addressId: 'ADDR-1', tracking: 'PH-LGX-881340', status: 'Return to Seller', ageHours: 420, arrivalAgo: 380, rtsAgo: 280, rtsReason: 'Hold period expired and parcel unclaimed' },
    { id: 'ORD-10238', seller: 'StyleLane', items: 'Denim Jacket x1', value: 2400, addressId: 'ADDR-1', tracking: 'PH-LGX-884230', status: 'Processing', stage: 2, ageHours: 8 },
    { id: 'ORD-10239', seller: 'TechHub Manila', items: 'Gaming Mouse x1', value: 890, addressId: 'ADDR-2', tracking: 'PH-LGX-884231', status: 'Processing', stage: 1, ageHours: 3 },
    { id: 'ORD-10240', seller: 'GadgetPort', items: 'Mechanical Keyboard x1', value: 2750, addressId: 'ADDR-1', tracking: 'PH-LGX-884232', status: 'Processing', stage: 3, ageHours: 12 },
    { id: 'ORD-10221', seller: 'BookNook', items: 'Weekly Planner x1', value: 560, addressId: 'ADDR-1', tracking: 'PH-LGX-883301', status: 'Consolidated', ageHours: 80, arrivalAgo: 30, method: 'Consolidate & Combine', groupId: 'CG-3001' },
    { id: 'ORD-10222', seller: 'StyleLane', items: 'Tote Bag x1', value: 1100, addressId: 'ADDR-1', tracking: 'PH-LGX-883302', status: 'Consolidated', ageHours: 82, arrivalAgo: 30, method: 'Consolidate & Combine', groupId: 'CG-3001' },
    // ----- Other buyers (visible to Seller and Administrator roles) -----
    { id: 'ORD-10243', buyer: 'Juan Dela Cruz', seller: 'TechHub Manila', items: 'Smartwatch x1', value: 4500, addressId: 'ADDR-4', tracking: 'PH-LGX-884210', status: 'Awaiting Instruction', ageHours: 55, arrivalAgo: 5, hub: 'South Local Hub' },
    { id: 'ORD-10244', buyer: 'Juan Dela Cruz', seller: 'StyleLane', items: 'T-Shirt Pack x3', value: 1350, addressId: 'ADDR-4', tracking: 'PH-LGX-884211', status: 'Awaiting Instruction', ageHours: 56, arrivalAgo: 6, hub: 'South Local Hub' },
    { id: 'ORD-10246', buyer: 'Ana Reyes', seller: 'HomeNest', items: 'Pillow Set x2', value: 1700, addressId: 'ADDR-5', tracking: 'PH-LGX-884220', status: 'In Transit', ageHours: 26, hub: 'North Local Hub', rider: R[2].name, vehicle: R[2].vehicle },
    { id: 'ORD-10247', buyer: 'Ana Reyes', seller: 'GadgetPort', items: 'Wall Charger x1', value: 480, addressId: 'ADDR-5', tracking: 'PH-LGX-884221', status: 'In Transit', ageHours: 20, hub: 'North Local Hub', rider: R[2].name, vehicle: R[2].vehicle }
  ];

  const orders = specs.map(function (s) { return makeOrder(s, hoursAgo); });

  return {
    session: { loggedIn: false, role: 'buyer', name: 'Maria Santos', contact: 'maria.santos@example.com' },
    page: 'dashboard',
    demoNow: toLocalISO(base),
    counters: { order: 10250, tracking: 884300, group: 3002, notif: 100, address: 6 },
    orders: orders,
    addresses: [
      { id: 'ADDR-1', owner: BUYER_NAME, label: 'Home', recipient: 'Maria Santos', contact: '09171234567', address: 'Unit 12, Sampaguita Residences, Katipunan Avenue, Quezon City', lat: 14.6396, lng: 121.0775, status: 'verified', note: '' },
      { id: 'ADDR-2', owner: BUYER_NAME, label: 'Office', recipient: 'Maria Santos', contact: '09171234567', address: '5th Floor, Orchid Tower, Ayala Avenue, Makati City', lat: 14.5547, lng: 121.0244, status: 'verified', note: '' },
      { id: 'ADDR-3', owner: BUYER_NAME, label: 'Parents House', recipient: 'Rosa Santos', contact: '09181234567', address: 'Lot 4', lat: 14.7, lng: 121.1, status: 'needs_correction', note: 'Address is too short. Add street, barangay, and city.' },
      { id: 'ADDR-4', owner: 'Juan Dela Cruz', label: 'Home', recipient: 'Juan Dela Cruz', contact: '09201112222', address: '88 Mabini Street, Barangay San Antonio, Makati City', lat: 14.5666, lng: 121.0133, status: 'verified', note: '' },
      { id: 'ADDR-5', owner: 'Ana Reyes', label: 'Home', recipient: 'Ana Reyes', contact: '09223334444', address: 'Blk 7 Lot 3, Caloocan', lat: 14.65, lng: 120.97, status: 'needs_correction', note: 'Address is incomplete. Add street and barangay.' }
    ],
    verifications: [
      { id: 'VER-001', name: BUYER_NAME, contact: 'maria.santos@example.com', isYou: true, status: 'verified', reason: '', submittedAt: hoursAgo(300) },
      { id: 'VER-002', name: 'Juan Dela Cruz', contact: '09201112222', status: 'verified', reason: '', submittedAt: hoursAgo(200) },
      { id: 'VER-003', name: 'Ana Reyes', contact: '09223334444', status: 'pending', reason: '', submittedAt: hoursAgo(30) },
      { id: 'VER-004', name: 'Pedro Lim', contact: 'pedro.lim@example.com', status: 'submitted', reason: '', submittedAt: hoursAgo(2) },
      { id: 'VER-005', name: 'Carla Mendoza', contact: '09175550101', status: 'rejected', reason: 'Face did not match the ID photo (simulated reason).', submittedAt: hoursAgo(90) }
    ],
    notifications: {
      buyer: [
        { id: 'N-1', type: 'hub', title: 'Parcels arrived at your hub', text: '3 parcels are waiting. Choose a delivery option within 12 hours.', time: hoursAgo(1), read: false },
        { id: 'N-2', type: 'consolidation', title: 'Consolidation available', text: 'ORD-10231 and ORD-10232 share the same verified address and can be combined at no fee.', time: hoursAgo(1.5), read: false },
        { id: 'N-3', type: 'missed', title: 'Missed delivery', text: 'ORD-10216 could not be delivered. Reschedule within the remaining hold time.', time: hoursAgo(18), read: false },
        { id: 'N-4', type: 'expiry', title: 'Hold expiring soon', text: 'ORD-10216 hold ends tomorrow. Reschedule before it expires.', time: hoursAgo(17), read: false },
        { id: 'N-5', type: 'out', title: 'Out for delivery', text: 'ORD-10225 is out for delivery on today\'s run.', time: hoursAgo(5), read: false },
    { id: 'N-6', type: 'address', title: 'Address needs correction', text: 'Parents House did not pass local checks: address is too short.', time: hoursAgo(40), read: false },
        { id: 'N-7', type: 'schedule', title: 'Schedule confirmed', text: 'ORD-10219 is scheduled with a 3% service fee applied.', time: hoursAgo(23), read: true },
        { id: 'N-8', type: 'delivered', title: 'Delivery completed', text: 'ORD-10214 was delivered. Your receipt is ready.', time: hoursAgo(120), read: true },
        { id: 'N-9', type: 'verification', title: 'Verification approved', text: 'You are now a Verified Buyer and can check out.', time: hoursAgo(290), read: true },
        { id: 'N-10', type: 'address', title: 'Address checks passed', text: 'Home passed local field and coordinate checks.', time: hoursAgo(295), read: true }
      ],
      seller: [
        { id: 'N-11', type: 'hub', title: 'New order received', text: 'ORD-10239 is waiting to be packed.', time: hoursAgo(3), read: false },
        { id: 'N-12', type: 'out', title: 'Parcel in transit', text: 'ORD-10228 was handed to the rider.', time: hoursAgo(28), read: true }
      ],
      admin: [
        { id: 'N-13', type: 'verification', title: 'New verification request', text: 'Pedro Lim submitted a verification request for local review.', time: hoursAgo(2), read: false },
        { id: 'N-14', type: 'address', title: 'Address needs review', text: 'Ana Reyes has an address that needs correction.', time: hoursAgo(10), read: false },
        { id: 'N-15', type: 'expiry', title: 'Decision deadlines approaching', text: 'Several parcels are close to the 12-hour decision limit.', time: hoursAgo(1), read: false }
      ]
    }
  };
}

// Builds one order from a short spec, including its tracking events.
function makeOrder(s, hoursAgo) {
  const o = Object.assign({
    buyer: BUYER_NAME, stage: 5, hub: 'Central Local Hub', hubArrival: null, method: null, groupId: null,
    scheduledDate: null, timeWindow: null, feeApplied: false, feeAmount: 0, attempts: 0, deliveredAt: null,
    rtsReason: null, rider: null, vehicle: null, expiryNotified: false
  }, s);
  o.createdAt = hoursAgo(s.ageHours);
  if (s.arrivalAgo !== undefined) { o.hubArrival = hoursAgo(s.arrivalAgo); }
  if (s.deliveredAgo !== undefined) { o.deliveredAt = hoursAgo(s.deliveredAgo); }

  const events = [];
  const add = function (h, title, note) { events.push({ time: hoursAgo(h), title: title, note: note || '' }); };
  const age = s.ageHours;
  add(age, 'Order confirmed', 'Seller received the order.');
  if (o.stage >= 2) { add(age - 2, 'Packed by seller', 'Parcel packed and sealed.'); }
  if (o.stage >= 3) { add(age - 3, 'Ready to ship', 'Shipping label printed.'); }
  if (o.stage >= 4) { add(age - 5, 'Parcel handed over', 'Handed to the logistics rider.'); }
  if (o.stage >= 5) { add(age - 7, 'In transit', 'Parcel is on its way to the local hub.'); }
  if (s.arrivalAgo !== undefined) { add(s.arrivalAgo, 'Arrived at local hub', o.hub + '. 12-hour decision window started.'); }
  if (o.method === 'Schedule & Hold') { add(s.arrivalAgo - 1, 'Schedule confirmed', 'Delivery on ' + o.scheduledDate + ', ' + o.timeWindow + '. 3% service fee applied.'); }
  if (o.method === 'Consolidate & Combine') { add(s.arrivalAgo - 1, 'Consolidated', 'Combined into group ' + o.groupId + '. No service fee.'); }
  if (o.method === 'Standard Dispatch') { add(s.arrivalAgo - 8, 'Standard Dispatch', 'No selection within 12 hours. Defaulted to Standard Dispatch.'); }
  if (o.status === 'Out for Delivery') { add(4, 'Out for delivery', 'Rider ' + o.rider + ' (' + o.vehicle + ').'); }
  if (o.status === 'Failed Delivery') { add(s.attemptAgo, 'Delivery attempted', 'Recipient was not available. Parcel kept at the hub.'); }
  if (o.status === 'Delivered') { add(s.deliveredAgo, 'Delivered', 'Received by recipient.'); }
  if (o.status === 'Return to Seller') { add(s.rtsAgo, 'Return to seller', o.rtsReason); }
  o.events = events;
  return o;
}

/* ===========================================================
   3. STATE AND STORAGE
   =========================================================== */
let storageRecoveryNotice = '';
let invalidStorageSnapshot = null;
let storageWriteWarningShown = false;
let state = loadState();

// UI-only values (not saved): filters, selections, form drafts
const ui = {
  authTab: 'login',
  openMenu: null,
  modalButtons: [],
  modalTrigger: null,
  filters: {
    buyerOrders: { search: '', status: 'All Orders', sortBy: 'id', sortDir: 'desc' },
    sellerOrders: { search: '', status: 'All Orders', sortBy: 'id', sortDir: 'desc' },
    adminParcels: { search: '', status: 'All Orders', sortBy: 'id', sortDir: 'desc' }
  },
  trackId: null,
  mapOrderId: null,
  hubSelection: null,   // null = choose a sensible default
  hubOption: null,      // 'consolidate' | 'schedule' | 'standard'
  hubDate: '',
  hubWindow: 0,
  hubResult: '',
  schedOrderId: null,
  schedDate: '',
  schedWindow: 0,
  notifFilter: 'all',
  sellerFilter: 'All',
  addrForm: { id: null, label: '', recipient: '', contact: '', address: '', lat: '', lng: '' },
  addrResult: null,
  idPreview: null,
  faceDone: false,
  calc: { value: 2000, arrival: '', delivery: '' }
};

function loadState() {
  let saved = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (isValidStoredState(parsed)) { return parsed; }
      invalidStorageSnapshot = saved;
      storageRecoveryNotice = 'Saved local data could not be read. Sample records were loaded; the original value will be backed up before it is replaced.';
    }
  } catch (e) {
    invalidStorageSnapshot = saved;
    storageRecoveryNotice = 'Saved local data could not be read. Sample records were loaded; the original value will be backed up before it is replaced.';
  }
  return createInitialState();
}

function isValidStoredState(value) {
  const roles = ['buyer', 'seller', 'admin'];
  if (!value || typeof value !== 'object' || !value.session || typeof value.session !== 'object' ||
      roles.indexOf(value.session.role) === -1 || typeof value.session.loggedIn !== 'boolean' ||
      typeof value.page !== 'string' || typeof value.demoNow !== 'string' || !Number.isFinite(new Date(value.demoNow).getTime()) ||
      !value.counters || typeof value.counters !== 'object' ||
      !['order', 'tracking', 'group', 'notif'].every(function (key) { return Number.isFinite(Number(value.counters[key])); }) ||
      !Array.isArray(value.orders) || !Array.isArray(value.addresses) || !Array.isArray(value.verifications) ||
      !value.notifications || !roles.every(function (role) { return Array.isArray(value.notifications[role]); })) { return false; }
  return value.orders.every(function (order) {
    return order && typeof order.id === 'string' && typeof order.status === 'string' && Array.isArray(order.events);
  }) && value.addresses.every(function (address) {
    return address && typeof address.id === 'string' && typeof address.owner === 'string';
  }) && value.verifications.every(function (verification) {
    return verification && typeof verification.id === 'string' && typeof verification.status === 'string';
  });
}

function saveState() {
  try {
    if (invalidStorageSnapshot !== null) {
      const baseKey = STORAGE_KEY + '_recovery_backup';
      let backupKey = baseKey, suffix = 2;
      while (localStorage.getItem(backupKey) !== null) { backupKey = baseKey + '_' + suffix; suffix += 1; }
      localStorage.setItem(backupKey, invalidStorageSnapshot);
      invalidStorageSnapshot = null;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    storageWriteWarningShown = false;
    return true;
  } catch (e) {
    if (!storageWriteWarningShown) {
      storageWriteWarningShown = true;
      toast('Browser storage is unavailable. Changes will remain only until this page is closed.', 'error');
    }
    return false;
  }
}

/* ===========================================================
   5. BUSINESS RULES
   =========================================================== */
function now() { return new Date(state.demoNow); }
function getOrder(id) { return state.orders.find(function (o) { return o.id === id; }); }
function getAddress(id) { return state.addresses.find(function (a) { return a.id === id; }); }
function myOrders() { return state.orders.filter(function (o) { return o.buyer === BUYER_NAME; }); }
function sortNewestFirst(list) { return list.slice().sort(function (a, b) { return b.id.localeCompare(a.id); }); }

function verificationOf(name) { return state.verifications.find(function (v) { return v.name === name; }); }
function myVerification() { return state.verifications.find(function (v) { return v.isYou; }); }
function isBuyerVerified(name) { const v = verificationOf(name); return !!v && v.status === 'verified'; }
// Rule 1: only verified buyers may check out
function isVerifiedBuyer() { return isBuyerVerified(BUYER_NAME); }

// Rule 2 (simulation): an address is only "verified" after passing these checks.
// This does NOT check real-world locations.
function validateAddressData(a) {
  const problems = [];
  if (!a.recipient || a.recipient.trim().length < 2) { problems.push('Enter the recipient name.'); }
  if (!/^(09|\+639)\d{9}$/.test((a.contact || '').replace(/\s|-/g, ''))) { problems.push('Contact number must be a PH mobile number (09XXXXXXXXX).'); }
  const text = (a.address || '').trim();
  if (text.length < 20 || text.indexOf(',') === -1) { problems.push('Address is too short. Add street, barangay, and city, separated by commas.'); }
  const lat = parseFloat(a.lat);
  const lng = parseFloat(a.lng);
  if (isNaN(lat) || isNaN(lng)) { problems.push('Pick a location on the map or enter latitude and longitude.'); }
  else if (lat < 4.5 || lat > 21.2 || lng < 116.8 || lng > 126.7) { problems.push('Coordinates are outside the Philippines.'); }
  return { ok: problems.length === 0, problems: problems };
}

function holdExpiryDate(order) {
  // Last allowed day = hub arrival day + 3 calendar days
  return addDays(startOfDay(new Date(order.hubArrival)), MAX_HOLD_DAYS);
}
function isHoldExpired(order) {
  return order.hubArrival ? startOfDay(now()) > holdExpiryDate(order) : false;
}
function remainingHoldDays(order) {
  if (!order.hubArrival) { return 0; }
  return Math.max(0, daysBetween(now(), holdExpiryDate(order)));
}
function decisionDeadline(order) { return addHours(new Date(order.hubArrival), DECISION_HOURS); }
function hoursLeft(order) { return (decisionDeadline(order) - now()) / 3600000; }
function formatHoursLeft(h) {
  if (h <= 0) { return 'Deadline reached'; }
  const whole = Math.floor(h);
  const mins = Math.round((h - whole) * 60);
  return whole + 'h ' + pad(mins) + 'm left';
}

// Rule 6 and 10: dates must fall inside the holding period of every selected parcel
function allowedDatesFor(orders) {
  if (!orders.length) { return []; }
  const today = startOfDay(now());
  let expiry = holdExpiryDate(orders[0]);
  orders.forEach(function (o) { const e = holdExpiryDate(o); if (e < expiry) { expiry = e; } });
  if (today > expiry) { return []; }
  const tomorrow = addDays(today, 1);
  const start = tomorrow <= expiry ? tomorrow : today;
  const list = [];
  for (let d = start; d <= expiry; d = addDays(d, 1)) { list.push(toDateKey(d)); }
  return list;
}
function earliestExpiry(orders) {
  let expiry = holdExpiryDate(orders[0]);
  orders.forEach(function (o) { const e = holdExpiryDate(o); if (e < expiry) { expiry = e; } });
  return expiry;
}
function validateScheduleDate(orders, dateKey) {
  if (!dateKey) { return 'Select a delivery date.'; }
  if (!allowedDatesFor(orders).includes(dateKey)) { return 'That date is outside the 3-calendar-day holding period.'; }
  return '';
}

// Rule 3: consolidation needs the same verified buyer AND the same verified delivery address
function canConsolidate(orders) {
  if (orders.length < 2) { return { ok: false, reason: 'Select at least two parcels to combine.' }; }
  const buyer = orders[0].buyer;
  const addressId = orders[0].addressId;
  if (orders.some(function (o) { return o.buyer !== buyer; })) { return { ok: false, reason: 'Parcels belong to different buyers.' }; }
  if (orders.some(function (o) { return o.addressId !== addressId; })) { return { ok: false, reason: 'Parcels have different delivery addresses.' }; }
  if (!isBuyerVerified(buyer)) { return { ok: false, reason: 'The buyer is not verified.' }; }
  const addr = getAddress(addressId);
  if (!addr || addr.status !== 'verified') { return { ok: false, reason: 'The delivery address is not verified.' }; }
  if (orders.some(function (o) { return o.status !== 'Awaiting Instruction'; })) { return { ok: false, reason: 'Only parcels waiting for a decision can be combined.' }; }
  return { ok: true, reason: '' };
}

// Status text used on the order screens
function consolidationInfo(o) {
  if (o.status === 'Consolidated' || o.groupId) { return { ok: true, text: 'Consolidated in group ' + (o.groupId || '') }; }
  const live = ['Processing', 'In Transit', 'Awaiting Instruction', 'At Local Hub'];
  if (live.indexOf(o.status) === -1) { return { ok: false, text: 'Not applicable' }; }
  const partners = state.orders.filter(function (p) {
    return p.id !== o.id && p.buyer === o.buyer && p.addressId === o.addressId && live.indexOf(p.status) !== -1;
  });
  if (partners.length) { return { ok: true, text: 'Eligible: ' + partners.length + ' other parcel(s) share the same buyer and address' }; }
  return { ok: false, text: 'Not eligible: no other parcel with the same buyer and address' };
}

function packingStatus(o) {
  if (o.stage <= 1) { return 'Awaiting packing'; }
  if (o.stage === 2) { return 'Packed'; }
  if (o.stage === 3) { return 'Ready to ship'; }
  return 'Handed over';
}

function etaInfo(o) {
  const t = startOfDay(now());
  switch (o.status) {
    case 'Processing': return { eta: 'Not shipped yet', window: 'Pending handover' };
    case 'In Transit': return { eta: 'Moving toward the local hub', window: 'Arrival time not available' };
    case 'Awaiting Instruction': return { eta: 'Waiting for your delivery decision', window: 'Decide within 12 hours' };
    case 'At Local Hub': return { eta: 'At local hub', window: 'Awaiting next step' };
    case 'Consolidated': return { eta: 'Awaiting dispatch', window: 'Delivery time not available' };
    case 'Scheduled Hold': return { eta: formatDate(parseDateKey(o.scheduledDate)), window: o.timeWindow };
    case 'Out for Delivery': return { eta: 'With the delivery team', window: o.method === 'Schedule & Hold' && o.timeWindow ? o.timeWindow : 'Delivery time not available' };
    case 'Failed Delivery': return { eta: 'Needs a new delivery date', window: 'Reschedule within the hold window' };
    case 'Delivered': return { eta: 'Delivered ' + (o.deliveredAt ? formatDateTime(new Date(o.deliveredAt)) : ''), window: 'Completed' };
    default: return { eta: 'Returned to seller', window: 'Closed' };
  }
}

/* ----- Adding events, notifications, riders ----- */
function addEvent(order, title, note) {
  order.events.push({ time: state.demoNow, title: title, note: note || '' });
}
function addNotification(role, type, title, text) {
  state.counters.notif += 1;
  state.notifications[role].unshift({ id: 'N-' + state.counters.notif, type: type, title: title, text: text, time: state.demoNow, read: false });
}
function notifyBuyerIfDemo(order, type, title, text) {
  if (order.buyer === BUYER_NAME) { addNotification('buyer', type, title, text); }
}
function assignRider(order) {
  if (!order.rider) {
    const rider = RIDERS[state.counters.order % RIDERS.length];
    order.rider = rider.name;
    order.vehicle = rider.vehicle;
  }
}

/* ----- The three hub options (Rule 4, 5, 9) ----- */
function applyConsolidation(ids) {
  const orders = ids.map(getOrder);
  const check = canConsolidate(orders);
  if (!check.ok) { toast(check.reason, 'error'); return false; }
  const groupId = 'CG-' + state.counters.group;
  state.counters.group += 1;
  orders.forEach(function (o) {
    o.status = 'Consolidated';
    o.method = 'Consolidate & Combine';
    o.groupId = groupId;
    o.feeApplied = false;
    o.feeAmount = 0;
    addEvent(o, 'Consolidated', 'Combined into group ' + groupId + '. No service fee.');
  });
  addNotification('buyer', 'consolidation', 'Consolidation confirmed', orders.length + ' parcels combined in group ' + groupId + '. No service fee.');
  saveState();
  return groupId;
}

function applyStandardDispatch(ids, wasAutomatic) {
  ids.forEach(function (id) {
    const o = getOrder(id);
    o.status = 'Out for Delivery';
    o.method = 'Standard Dispatch';
    o.feeApplied = false;
    o.feeAmount = 0;
    assignRider(o);
    addEvent(o, 'Standard Dispatch', wasAutomatic ? 'No selection within 12 hours. Defaulted to Standard Dispatch (no fee).' : 'Buyer chose Standard Dispatch. No service fee.');
    notifyBuyerIfDemo(o, 'out', wasAutomatic ? 'Defaulted to Standard Dispatch' : 'Standard Dispatch confirmed', o.id + ' is recorded for Standard Dispatch. Delivery timing is not available. No service fee.');
  });
  saveState();
}

// isReschedule = true keeps the fee that was already charged (no second fee)
function applySchedule(ids, dateKey, windowIndex, isReschedule) {
  const orders = ids.map(getOrder);
  const error = validateScheduleDate(orders, dateKey);
  if (error) { toast(error, 'error'); return false; }
  const windowText = TIME_WINDOWS[windowIndex];
  orders.forEach(function (o) {
    o.status = 'Scheduled Hold';
    o.method = 'Schedule & Hold';
    o.scheduledDate = dateKey;
    o.timeWindow = windowText;
    if (!isReschedule) {
      o.feeApplied = true;
      o.feeAmount = calcFee(o.value);
    }
    addEvent(o, isReschedule ? 'Rescheduled' : 'Schedule confirmed',
      'Delivery on ' + formatDate(parseDateKey(dateKey)) + ', ' + windowText + (isReschedule ? '. No new fee.' : '. 3% service fee applied.'));
    notifyBuyerIfDemo(o, 'schedule', isReschedule ? 'Delivery rescheduled' : 'Schedule confirmed',
      o.id + ' will be delivered on ' + formatDate(parseDateKey(dateKey)) + ' (' + windowText + ').' + (isReschedule ? '' : ' 3% service fee applied.'));
  });
  saveState();
  return true;
}

// Rule 10: a missed delivery does NOT return the parcel to the seller
function simulateMissedDelivery(id) {
  const o = getOrder(id);
  o.status = 'Failed Delivery';
  o.attempts += 1;
  addEvent(o, 'Delivery attempted', 'Recipient was not available. Parcel kept at the hub.');
  notifyBuyerIfDemo(o, 'missed', 'Missed delivery', o.id + ' could not be delivered. Reschedule within the remaining hold time (' + remainingHoldDays(o) + ' day(s)).');
  saveState();
}

// Rule 11: Return-to-Seller only after expiry, refusal, or unclaimed
function returnToSeller(id, reason) {
  const o = getOrder(id);
  if ((reason === 'expired' || reason === 'unclaimed') && !isHoldExpired(o)) {
    toast('Return-to-Seller is not allowed yet. The 3-day hold has not expired.', 'error');
    return false;
  }
  const text = { expired: 'Hold period expired', refused: 'Buyer refused the delivery', unclaimed: 'Parcel unclaimed after hold expiry' }[reason];
  o.status = 'Return to Seller';
  o.rtsReason = text;
  addEvent(o, 'Return to seller', text);
  notifyBuyerIfDemo(o, 'expiry', 'Parcel returned to seller', o.id + ': ' + text + '.');
  saveState();
  return true;
}

// Rule 7 and 8: after 12 hours with no choice, default to Standard Dispatch.
// This uses the DEMO clock, not a real timer, so demos stay predictable.
function checkDeadlines() {
  const expired = state.orders.filter(function (o) { return o.status === 'Awaiting Instruction' && hoursLeft(o) <= 0; });
  expired.forEach(function (o) { applyStandardDispatch([o.id], true); });
  // Hold-expiry reminder (parcel is NOT returned automatically)
  state.orders.forEach(function (o) {
    const holding = ['Scheduled Hold', 'Failed Delivery', 'Consolidated'].indexOf(o.status) !== -1;
    if (holding && isHoldExpired(o) && !o.expiryNotified) {
      o.expiryNotified = true;
      addEvent(o, 'Hold period expired', 'Administrator review needed for Return-to-Seller.');
      notifyBuyerIfDemo(o, 'expiry', 'Hold expired', 'The 3-day hold for ' + o.id + ' has ended.');
    }
  });
  if (expired.length) { saveState(); }
  return expired.length;
}

/* ===========================================================
   6. RENDERING HELPERS
   =========================================================== */
function el(id) { return document.getElementById(id); }

// Always escape text that a user could type, so it cannot break the page
function escapeHTML(text) {
  return String(text === undefined || text === null ? '' : text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function icon(name, extraClass) { return '<i data-lucide="' + name + '" class="icon ' + (extraClass || '') + '"></i>'; }
function refreshIcons() { if (window.lucide) { window.lucide.createIcons(); } }

function badge(status, label) {
  return '<span class="badge badge-' + (STATUS_COLORS[status] || 'gray') + '">' + escapeHTML(label || status) + '</span>';
}
function verificationBadge(status) {
  const pair = VERIFICATION_LABELS[status] || VERIFICATION_LABELS.none;
  const iconName = status === 'verified' ? 'circle-check' : status === 'rejected' ? 'circle-x' : status === 'none' ? 'circle-alert' : 'clock';
  return '<span class="badge badge-' + pair[1] + '">' + icon(iconName, 'icon-sm') + pair[0] + '</span>';
}
function addressBadge(status) {
  return status === 'verified'
    ? '<span class="badge badge-green">' + icon('circle-check', 'icon-sm') + 'Address checks passed</span>'
    : '<span class="badge badge-red">' + icon('circle-alert', 'icon-sm') + 'Address Needs Correction</span>';
}
function notice(type, iconName, html) {
  return '<div class="notice notice-' + type + '">' + icon(iconName) + '<div>' + html + '</div></div>';
}
function emptyState(iconName, title, text, actionHTML) {
  return '<div class="empty-state">' + icon(iconName) + '<h4>' + title + '</h4><p>' + text + '</p>' + (actionHTML ? '<div style="margin-top:14px;">' + actionHTML + '</div>' : '') + '</div>';
}
function statCard(iconName, label, value, tone) {
  return '<div class="stat-card"><div class="stat-icon ' + (tone || '') + '">' + icon(iconName) + '</div><div><div class="stat-value">' + value + '</div><div class="stat-label">' + label + '</div></div></div>';
}
function cardHTML(title, sub, actions, body, flush) {
  return '<section class="card"><div class="card-header"><div><h3>' + title + '</h3>' + (sub ? '<p class="sub">' + sub + '</p>' : '') + '</div>' + (actions ? '<div class="btn-row">' + actions + '</div>' : '') + '</div>' +
    (flush ? body : '<div class="card-body">' + body + '</div>') + '</section>';
}
function detailItem(k, v) { return '<div class="detail-item"><div class="k">' + k + '</div><div class="v">' + v + '</div></div>'; }
function sampleTag() { return '<span class="sample-tag">' + icon('database', 'icon-sm') + 'Local records</span>'; }

function timeAgo(iso) {
  const hours = (now() - new Date(iso)) / 3600000;
  if (hours < 1) { return 'Just now'; }
  if (hours < 24) { return Math.floor(hours) + 'h ago'; }
  return Math.floor(hours / 24) + 'd ago';
}

/* ----- Toasts and modals ----- */
function toast(message, type) {
  const kind = type || 'success';
  const iconName = { success: 'circle-check', error: 'circle-alert', warning: 'triangle-alert', info: 'info' }[kind];
  const box = document.createElement('div');
  box.className = 'toast ' + kind;
  box.innerHTML = icon(iconName) + '<div>' + escapeHTML(message) + '</div>';
  el('toast-root').appendChild(box);
  refreshIcons();
  setTimeout(function () { box.remove(); }, 4200);
}

// openModal({ title, body, wide, buttons: [{ label, cls, onClick, keepOpen }] })
function openModal(opts) {
  if (!el('modal-root').innerHTML) { ui.modalTrigger = document.activeElement; }
  ui.modalButtons = opts.buttons || [];
  const buttons = ui.modalButtons.map(function (b, i) {
    return '<button class="btn ' + (b.cls || 'btn-secondary') + '" data-action="modal-button" data-index="' + i + '">' + b.label + '</button>';
  }).join('');
  el('modal-root').innerHTML =
    '<div class="modal-backdrop" id="modal-backdrop"><div class="modal ' + (opts.wide ? 'modal-wide' : '') + '" role="dialog" aria-modal="true" aria-labelledby="active-modal-title" tabindex="-1">' +
    '<div class="modal-header"><h3 id="active-modal-title">' + opts.title + '</h3><button class="icon-btn" data-action="close-modal" aria-label="Close dialog">' + icon('x') + '</button></div>' +
    '<div class="modal-body">' + opts.body + '</div>' +
    (buttons ? '<div class="modal-footer">' + buttons + '</div>' : '') + '</div></div>';
  refreshIcons();
  const dialog = el('modal-root').querySelector('[role="dialog"]');
  if (dialog) { dialog.focus(); }
}
function closeModal() {
  el('modal-root').innerHTML = '';
  ui.modalButtons = [];
  if (ui.modalTrigger && document.contains(ui.modalTrigger)) { ui.modalTrigger.focus(); }
  ui.modalTrigger = null;
}

// Rule 13: ask for confirmation before important actions
function confirmDialog(title, message, onConfirm, confirmLabel, danger) {
  openModal({
    title: title,
    body: '<p>' + message + '</p>',
    buttons: [
      { label: 'Cancel', cls: 'btn-secondary' },
      { label: confirmLabel || 'Confirm', cls: danger ? 'btn-danger' : 'btn-primary', onClick: onConfirm }
    ]
  });
}

/* ----- Order tables with search and filters ----- */
function filterOrders(list, f) {
  const q = f.search.trim().toLowerCase();
  return sortNewestFirst(list.filter(function (o) {
    let statusOk = f.status === 'All Orders' || o.status === f.status;
    if (f.status === 'At Local Hub') { statusOk = HUB_STATUSES.indexOf(o.status) !== -1; }
    const textOk = !q || o.id.toLowerCase().includes(q) || o.tracking.toLowerCase().includes(q) ||
      o.seller.toLowerCase().includes(q) || o.buyer.toLowerCase().includes(q);
    return statusOk && textOk;
  }));
}

function sortTableOrders(list, f) {
  const fields = { id: 'id', buyer: 'buyer', seller: 'seller', hub: 'hub', value: 'value', status: 'status', tracking: 'tracking' };
  const field = fields[f.sortBy] || 'id';
  const direction = f.sortDir === 'asc' ? 1 : -1;
  return list.slice().sort(function (a, b) {
    const left = a[field] == null ? '' : a[field];
    const right = b[field] == null ? '' : b[field];
    const comparison = typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' });
    return comparison * direction;
  });
}

function sellerOrders() {
  return ui.sellerFilter === 'All' ? state.orders : state.orders.filter(function (o) { return o.seller === ui.sellerFilter; });
}

// Each table has a name, so typing in the search box only redraws the table (not the whole page)
const TABLES = {
  buyerOrders: function () { return ordersTableHTML(sortTableOrders(filterOrders(myOrders(), ui.filters.buyerOrders), ui.filters.buyerOrders), 'buyer', 'buyerOrders'); },
  sellerOrders: function () { return ordersTableHTML(sortTableOrders(filterOrders(sellerOrders(), ui.filters.sellerOrders), ui.filters.sellerOrders), 'seller', 'sellerOrders'); },
  adminParcels: function () { return ordersTableHTML(sortTableOrders(filterOrders(state.orders, ui.filters.adminParcels), ui.filters.adminParcels), 'admin', 'adminParcels'); }
};

function tableSource(name) {
  if (name === 'buyerOrders') { return myOrders(); }
  if (name === 'sellerOrders') { return sellerOrders(); }
  return state.orders;
}

function refreshTable(name) {
  const box = el('tbl-' + name);
  if (box) { box.innerHTML = TABLES[name](); refreshIcons(); makeTableRegions(box); }
  const summary = el('filter-summary-' + name);
  if (summary) {
    const count = filterOrders(tableSource(name), ui.filters[name]).length;
    summary.textContent = count + (count === 1 ? ' result' : ' results');
  }
  const clear = el('clear-filters-' + name);
  if (clear) { clear.classList.toggle('hidden', !hasTableFilters(name)); }
}

function hasTableFilters(name) {
  const f = ui.filters[name];
  return !!(f.search.trim() || f.status !== 'All Orders');
}

function filterBarHTML(name) {
  const f = ui.filters[name];
  const options = ORDER_FILTERS.map(function (s) { return '<option' + (s === f.status ? ' selected' : '') + '>' + s + '</option>'; }).join('');
  const count = filterOrders(tableSource(name), f).length;
  return '<div class="filter-bar"><div class="search-box">' + icon('search') +
    '<input type="search" placeholder="Search order no., tracking no., or seller" value="' + escapeHTML(f.search) + '" data-oninput="table-search" data-table="' + name + '" aria-label="Search orders"></div>' +
    '<label class="filter-select-label">Status<select data-onchange="table-filter" data-table="' + name + '" aria-label="Filter by status">' + options + '</select></label>' +
    '<button type="button" id="clear-filters-' + name + '" class="btn btn-ghost btn-sm' + (hasTableFilters(name) ? '' : ' hidden') + '" data-action="clear-table-filters" data-table="' + name + '">Clear filters</button>' +
    '<span class="filter-summary" id="filter-summary-' + name + '" role="status" aria-live="polite">' + count + (count === 1 ? ' result' : ' results') + '</span></div>';
}

function ordersTableHTML(list, mode, tableName) {
  if (!list.length) { return emptyState('package', 'No orders found', 'Try a different search or filter.'); }
  const heads = {
    buyer: ['Order', 'Seller', 'Items', 'Value', 'Status', 'Tracking', 'Actions'],
    seller: ['Order', 'Buyer', 'Items', 'Value', 'Packing', 'Status', 'Actions'],
    admin: ['Order', 'Buyer', 'Seller', 'Hub', 'Value', 'Status', 'Actions']
  }[mode];
  const sortKeys = {
    buyer: ['id', 'seller', null, 'value', 'status', 'tracking', null],
    seller: ['id', 'buyer', null, 'value', null, 'status', null],
    admin: ['id', 'buyer', 'seller', 'hub', 'value', 'status', null]
  }[mode];
  const filter = ui.filters[tableName];
  const headings = heads.map(function (label, index) {
    const key = sortKeys[index];
    if (!key) { return '<th>' + label + '</th>'; }
    const active = filter.sortBy === key;
    const direction = active ? (filter.sortDir === 'asc' ? 'ascending' : 'descending') : 'none';
    const glyph = active ? (filter.sortDir === 'asc' ? '↑' : '↓') : '↕';
    return '<th aria-sort="' + direction + '"><button type="button" class="table-sort" data-action="table-sort" data-table="' + tableName + '" data-sort="' + key + '" aria-label="Sort by ' + label + (active ? ', ' + direction : '') + '">' + label + '<span aria-hidden="true">' + glyph + '</span></button></th>';
  }).join('');
  const rows = list.map(function (o) {
    let cells = '<td class="cell-strong">' + o.id + '</td>';
    let actions = '';
    if (mode === 'buyer') {
      cells += '<td>' + escapeHTML(o.seller) + '</td><td>' + escapeHTML(o.items) + '</td><td>' + formatPeso(o.value) + '</td><td>' + badge(o.status) + '</td><td class="nowrap">' + o.tracking + '</td>';
      actions = '<button class="btn btn-secondary btn-sm" data-action="order-details" data-id="' + o.id + '">Details</button>' +
        '<button class="btn btn-ghost btn-sm" data-action="order-track" data-id="' + o.id + '">Track</button>' +
        (o.status === 'Awaiting Instruction' ? '<button class="btn btn-primary btn-sm" data-action="nav" data-page="hub">Decide</button>' : '') +
        (o.status === 'Delivered' ? '<button class="btn btn-ghost btn-sm" data-action="order-receipt" data-id="' + o.id + '">Receipt</button>' : '');
    } else if (mode === 'seller') {
      cells += '<td>' + escapeHTML(o.buyer) + '<div class="cell-sub">' + (isBuyerVerified(o.buyer) ? 'Verified buyer' : 'Not verified') + '</div></td><td>' + escapeHTML(o.items) + '</td><td>' + formatPeso(o.value) + '</td><td>' + packingStatus(o) + '</td><td>' + badge(o.status) + '</td>';
      actions = '<button class="btn btn-secondary btn-sm" data-action="order-details" data-id="' + o.id + '">Details</button>';
    } else {
      cells += '<td>' + escapeHTML(o.buyer) + '</td><td>' + escapeHTML(o.seller) + '</td><td>' + o.hub + '</td><td>' + formatPeso(o.value) + '</td><td>' + badge(o.status) + '</td>';
      actions = '<button class="btn btn-secondary btn-sm" data-action="admin-locate" data-id="' + o.id + '">Locate</button><button class="btn btn-secondary btn-sm" data-action="admin-manage" data-id="' + o.id + '">Manage</button>';
    }
    return '<tr>' + cells + '<td><div class="btn-row">' + actions + '</div></td></tr>';
  }).join('');
  return '<div class="table-wrap"><table><thead><tr>' + headings + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
}

/* ----- Progress stepper, label, receipt ----- */
function stepperHTML(stage) {
  return '<ol class="stepper">' + STEPS.map(function (s, i) {
    const cls = i < stage ? 'done' : (i === stage ? 'current' : '');
    return '<li class="' + cls + '"><div class="step-dot">' + (i < stage ? icon('check', 'icon-sm') : (i + 1)) + '</div>' + s + '</li>';
  }).join('') + '</ol>';
}

function labelHTML(o) {
  const addr = getAddress(o.addressId);
  return '<div class="label-box"><div class="label-head"><span>HubLink Logistics</span><span class="small">SHIPPING LABEL</span></div>' +
    '<div class="small muted">From</div><div>' + escapeHTML(o.seller) + '</div>' +
    '<div class="small muted" style="margin-top:8px;">To</div><div><strong>' + escapeHTML(addr ? addr.recipient : o.buyer) + '</strong><br>' + escapeHTML(addr ? addr.address : '') + '</div>' +
    '<div class="barcode"></div><div class="label-code">' + o.tracking + '</div>' +
    '<div class="small muted right" style="margin-top:6px;">Order ' + o.id + '</div></div>';
}

function receiptHTML(o) {
  const addr = getAddress(o.addressId);
  const fee = o.feeApplied ? o.feeAmount : 0;
  const delivered = o.deliveredAt ? formatDateTime(new Date(o.deliveredAt)) : 'Not delivered yet';
  return '<div class="receipt"><div class="receipt-head"><div><h2>HubLink Logistics</h2><p class="muted small">Delivery receipt</p></div>' +
    '<div class="right"><strong>RCPT-' + o.id.replace('ORD-', '') + '</strong><p class="muted small">' + delivered + '</p></div></div>' +
    '<table>' +
    '<tr><td class="muted">Order number</td><td>' + o.id + '</td></tr>' +
    '<tr><td class="muted">Tracking number</td><td>' + o.tracking + '</td></tr>' +
    '<tr><td class="muted">Seller</td><td>' + escapeHTML(o.seller) + '</td></tr>' +
    '<tr><td class="muted">Items</td><td>' + escapeHTML(o.items) + '</td></tr>' +
    '<tr><td class="muted">Delivery method</td><td>' + (o.method || 'Standard Dispatch') + (o.groupId ? ' (' + o.groupId + ')' : '') + '</td></tr>' +
    '<tr><td class="muted">Delivery address</td><td>' + escapeHTML(addr ? addr.address : '') + '</td></tr>' +
    '</table>' +
    '<div class="receipt-totals"><table>' +
    '<tr><td>Order value</td><td>' + formatPeso(o.value) + '</td></tr>' +
    '<tr><td>Service fee' + (fee ? ' (3%)' : '') + '</td><td>' + formatPeso(fee) + '</td></tr>' +
    '<tr><td><strong>Total</strong></td><td><strong>' + formatPeso(o.value + fee) + '</strong></td></tr></table></div>' +
    (o.method === 'Schedule & Hold' && o.feeApplied ? '<div class="receipt-note">Scheduled Hold Service Completed — 3% Fee Applied</div>' : '') +
    '<p class="receipt-foot">Generated from locally stored order information.</p></div>';
}

/* ----- Date and window chips ----- */
function dateChipsHTML(orders, selectedKey, actionName) {
  if (!orders.length) { return ''; }
  const allowed = allowedDatesFor(orders);
  const today = startOfDay(now());
  const startIndex = (allowed.length && allowed[0] === toDateKey(today)) ? 0 : 1;
  let html = '<div class="chip-row">';
  for (let i = startIndex; i < startIndex + 5; i++) {
    const d = addDays(today, i);
    const key = toDateKey(d);
    const ok = allowed.includes(key);
    html += '<button type="button" class="chip' + (key === selectedKey ? ' active' : '') + '" data-action="' + actionName + '" data-date="' + key + '"' + (ok ? '' : ' disabled') + '>' +
      formatWeekday(d) + ' ' + d.getDate() + '<small>' + (ok ? d.toLocaleDateString('en-US', { month: 'short' }) : 'Beyond hold') + '</small></button>';
  }
  return html + '</div>';
}
function windowChipsHTML(selectedIndex, actionName) {
  return '<div class="chip-row">' + TIME_WINDOWS.map(function (w, i) {
    return '<button type="button" class="chip' + (i === selectedIndex ? ' active' : '') + '" data-action="' + actionName + '" data-window="' + i + '">' + w + '</button>';
  }).join('') + '</div>';
}

// Fee breakdown used by the hub option and the fee calculator
function feeBreakdownHTML(value, dateKey, expiryDate) {
  const fee = calcFee(value);
  return '<table class="mini-table">' +
    '<tr><td>Total order value</td><td>' + formatPeso(value) + '</td></tr>' +
    '<tr><td>Service fee rate</td><td>' + (FEE_RATE * 100) + '%</td></tr>' +
    '<tr><td>Service fee amount</td><td>' + formatPeso(fee) + '</td></tr>' +
    '<tr class="total"><td>Total including service fee</td><td>' + formatPeso(round2(value + fee)) + '</td></tr>' +
    '<tr><td>Selected delivery date</td><td>' + (dateKey ? formatDate(parseDateKey(dateKey)) : 'Not selected') + '</td></tr>' +
    '<tr><td>Hold expiry date</td><td>' + (expiryDate ? formatDate(expiryDate) : '-') + '</td></tr></table>' +
    '<div class="share-list"><div class="muted">Who receives the fee</div>' +
    '<div><span>Logistics provider or hub</span><strong>Majority share</strong></div>' +
    '<div><span>Seller</span><strong>Minor share</strong></div>' +
    '<div><span>Platform</span><strong>Minor share</strong></div></div>';
}

/* ===========================================================
   APP SHELL: sidebar, top bar, page switching
   =========================================================== */
const NOTIF_ICONS = {
  hub: ['warehouse', ''], consolidation: ['layers', ''], missed: ['triangle-alert', 'red'], expiry: ['clock', 'amber'],
  out: ['truck', ''], address: ['map-pin', 'amber'], schedule: ['calendar-days', ''], delivered: ['circle-check', 'green'],
  verification: ['shield-check', 'green'], shipping: ['package', '']
};

function currentNav() {
  const list = NAV[state.session.role];
  return list.find(function (n) { return n.id === state.page; }) || list[0];
}

function renderApp() {
  const loggedIn = state.session.loggedIn;
  el('auth-screen').classList.toggle('hidden', loggedIn);
  el('app').classList.toggle('hidden', !loggedIn);
  if (!loggedIn) { refreshIcons(); return; }
  if (!NAV[state.session.role].some(function (n) { return n.id === state.page; })) { state.page = NAV[state.session.role][0].id; }
  renderSidebar();
  renderTopbar();
  renderPage();
}

function renderSidebar() {
  const role = state.session.role;
  const pendingDecisions = myOrders().filter(function (o) { return o.status === 'Awaiting Instruction'; }).length;
  el('sidebar-nav').innerHTML = NAV[role].map(function (n) {
    const showBadge = role === 'buyer' && n.id === 'hub' && pendingDecisions > 0;
    return '<button class="nav-item' + (n.id === state.page ? ' active' : '') + '" data-action="nav" data-page="' + n.id + '" title="' + n.label + '">' +
      icon(n.icon) + '<span class="nav-label">' + n.label + '</span>' + (showBadge ? '<span class="nav-badge">' + pendingDecisions + '</span>' : '') + '</button>';
  }).join('');
  el('sidebar-role-card').innerHTML = '<strong>' + ROLE_INFO[role].label + ' workspace</strong><br><span class="muted">Records are stored in this browser.</span>';
}

function renderTopbar() {
  const nav = currentNav();
  const role = state.session.role;
  el('page-title').textContent = nav.label;
  el('page-desc').textContent = nav.desc;
  el('role-select').value = role;
  el('clock-label').textContent = 'Workflow: ' + now().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  const name = state.session.name || ROLE_INFO[role].name;
  el('profile-name').textContent = role === 'buyer' ? name : ROLE_INFO[role].name;
  el('profile-role').textContent = ROLE_INFO[role].label;
  el('profile-avatar').textContent = (role === 'buyer' ? name : ROLE_INFO[role].name).split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();

  const list = state.notifications[role];
  const unread = list.filter(function (n) { return !n.read; }).length;
  el('bell-badge').textContent = unread;
  el('bell-badge').classList.toggle('hidden', unread === 0);

  el('bell-panel').innerHTML = '<div class="dropdown-head"><span>Notifications</span><button class="link-btn small" data-action="notif-read-all">Mark all as read</button></div>' +
    (list.length ? list.slice(0, 5).map(function (n) {
      return '<button class="dropdown-item' + (n.read ? '' : ' unread') + '" data-action="notif-open" data-id="' + n.id + '"><div><div class="notif-title small">' + escapeHTML(n.title) + '</div><div class="small muted">' + escapeHTML(n.text) + '</div><div class="small muted">' + timeAgo(n.time) + '</div></div></button>';
    }).join('') : emptyState('bell', 'No notifications', 'You are all caught up.')) +
    (role === 'buyer' ? '<button class="menu-item" data-action="nav" data-page="notifications">' + icon('bell') + 'View all notifications</button>' : '');
  el('bell-panel').classList.toggle('open', ui.openMenu === 'bell');
  el('profile-panel').classList.toggle('open', ui.openMenu === 'profile');
  refreshIcons();
}

function goTo(pageId) {
  if (!NAV[state.session.role].some(function (item) { return item.id === pageId; })) {
    toast('That page is not available in the current workspace.', 'error');
    return;
  }
  state.page = pageId;
  ui.hubResult = '';
  ui.openMenu = null;
  el('sidebar').classList.remove('open');
  el('sidebar-backdrop').classList.remove('open');
  syncSidebarState();
  saveState();
  renderSidebar();
  renderTopbar();
  renderPage(false);
}

function syncSidebarState() {
  const toggle = document.querySelector('[data-action="toggle-sidebar"]');
  const isOpen = el('sidebar').classList.contains('open');
  document.body.classList.toggle('drawer-open', isOpen && window.innerWidth <= 900);
  if (toggle) { toggle.setAttribute('aria-expanded', String(isOpen)); }
}

let installPromptEvent = null;
function showInstallPrompt() {
  if (!installPromptEvent) { return; }
  installPromptEvent.prompt();
  installPromptEvent.userChoice.finally(function () {
    installPromptEvent = null;
    el('pwa-install').hidden = true;
  });
}

function updateNetworkStatus() {
  const status = el('network-status');
  if (!status) { return; }
  status.hidden = navigator.onLine;
  status.textContent = navigator.onLine ? '' : 'You are offline. This browser keeps local records on this device; maps and external assets need an internet connection.';
}

window.addEventListener('beforeinstallprompt', function (event) {
  event.preventDefault();
  installPromptEvent = event;
  el('pwa-install').hidden = false;
});
window.addEventListener('appinstalled', function () {
  installPromptEvent = null;
  el('pwa-install').hidden = true;
});
window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);
updateNetworkStatus();
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('./service-worker.js').catch(function () {});
  });
}

// Draws the current screen. keepScroll stays at the same position after a button press.
let pageMaps = [];

function destroyPageMaps() {
  pageMaps.forEach(function (map) { map.remove(); });
  pageMaps = [];
}

function renderPage(keepScroll) {
  const y = window.scrollY;
  const view = PAGES[state.session.role][state.page];
  destroyPageMaps();
  el('page-view').innerHTML = view ? view() : '';
  makeTableRegions(el('page-view'));
  refreshIcons();
  initializePageMaps();
  window.scrollTo(0, keepScroll === false ? 0 : y);
}

function makeTableRegions(root) {
  root.querySelectorAll('.table-wrap').forEach(function (region) {
    if (!region.hasAttribute('tabindex')) { region.setAttribute('tabindex', '0'); }
    if (!region.hasAttribute('role')) { region.setAttribute('role', 'region'); }
    if (!region.hasAttribute('aria-label')) {
      const card = region.closest('.card');
      const heading = card && card.querySelector('.card-header h3');
      region.setAttribute('aria-label', heading ? heading.textContent + ' table. Scroll horizontally to view all columns.' : 'Data table. Scroll horizontally to view all columns.');
    }
  });
}

// Leaflet maps use saved coordinates only. Missing locations remain centered on Bulacan.
function initializePageMaps() {
  if (typeof L === 'undefined') {
    document.querySelectorAll('.leaflet-map').forEach(function (node) {
      node.innerHTML = '<div class="map-unavailable">Map tiles could not load. Shipment details and tracking history remain available.</div>';
    });
    return;
  }
  const bulacan = [14.85, 120.82];
  const setup = function (node, center, zoom) {
    const map = L.map(node, { scrollWheelZoom: false }).setView(center, zoom);
    pageMaps.push(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    map.on('tileerror', function () {
      node.classList.add('map-tile-error');
      node.setAttribute('aria-label', 'Map tiles unavailable. Shipment details remain available.');
    });
    return map;
  };
  const track = document.getElementById('tracking-map');
  [track, document.getElementById('admin-monitor-map')].filter(Boolean).forEach(function (node) {
    const lat = Number(node.dataset.lat), lng = Number(node.dataset.lng);
    const valid = node.dataset.lat !== '' && node.dataset.lng !== '' && Number.isFinite(lat) && Number.isFinite(lng);
    const map = setup(node, valid ? [lat, lng] : bulacan, valid ? 13 : 10);
    if (valid) L.marker([lat, lng]).addTo(map).bindPopup(node.dataset.label || 'Saved delivery location').openPopup();
    window.setTimeout(function () { map.invalidateSize(); }, 0);
  });
  const addressMap = document.getElementById('address-map');
  if (addressMap) {
    const afLat = document.getElementById('af-lat'), afLng = document.getElementById('af-lng');
    const lat = afLat ? Number(afLat.value) : NaN, lng = afLng ? Number(afLng.value) : NaN;
    const valid = afLat && afLng && afLat.value && afLng.value && Number.isFinite(lat) && Number.isFinite(lng);
    const map = setup(addressMap, valid ? [lat, lng] : bulacan, valid ? 13 : 10);
    pageMaps.push(map);
    if (valid) L.marker([lat, lng]).addTo(map);
    map.on('click', function (event) {
      ui.addrForm.lat = event.latlng.lat.toFixed(6);
      ui.addrForm.lng = event.latlng.lng.toFixed(6);
      ui.addrResult = null;
      renderPage(true);
    });
    window.setTimeout(function () { map.invalidateSize(); }, 0);
  }
}

// Redraw everything after a status change (Rule 12: all screens stay in sync)
function refreshAll() {
  saveState();
  renderSidebar();
  renderTopbar();
  renderPage(true);
}

/* ===========================================================
   7. BUYER SCREENS
   =========================================================== */

/* ----- D. Buyer dashboard ----- */
function renderBuyerDashboard() {
  const list = myOrders();
  const count = function (fn) { return list.filter(fn).length; };
  const pending = count(function (o) { return o.status === 'Awaiting Instruction'; });
  let html = '';

  if (!isVerifiedBuyer()) {
    html += notice('warning', 'shield-check', '<strong>Verification needed.</strong> Only Verified Buyers can check out. <button class="link-btn" data-action="nav" data-page="profile">Verify your account</button>');
  }
  if (pending > 0) {
    const earliest = list.filter(function (o) { return o.status === 'Awaiting Instruction'; }).reduce(function (a, b) { return decisionDeadline(a) < decisionDeadline(b) ? a : b; });
    html += '<div class="notice notice-info">' + icon('warehouse') + '<div style="flex:1;"><strong>' + pending + ' parcel(s) are waiting for your delivery decision.</strong><p>Earliest deadline: ' + formatDateTime(decisionDeadline(earliest)) + '. Unanswered parcels default to Standard Dispatch after 12 hours.</p></div>' +
      '<button class="btn btn-primary btn-sm" data-action="nav" data-page="hub">Choose delivery option</button></div>';
  }

  html += '<div class="stats-grid">' +
    statCard('package', 'Total Orders', list.length) +
    statCard('truck', 'In Transit', count(function (o) { return o.status === 'In Transit' || o.status === 'Out for Delivery'; })) +
    statCard('warehouse', 'At Local Hub', count(function (o) { return HUB_STATUSES.indexOf(o.status) !== -1; }), 'amber') +
    statCard('calendar-days', 'Scheduled Deliveries', count(function (o) { return o.status === 'Scheduled Hold'; })) +
    statCard('circle-check', 'Delivered Orders', count(function (o) { return o.status === 'Delivered'; }), 'green') +
    statCard('clock', 'Pending Decisions', pending, pending ? 'red' : 'amber') + '</div>';

  const recent = sortNewestFirst(list).slice(0, 6).map(function (o) {
    return '<tr><td class="cell-strong">' + o.id + '</td><td>' + escapeHTML(o.seller) + '</td><td>' + formatPeso(o.value) + '</td><td>' + badge(o.status) + '</td>' +
      '<td><button class="btn btn-ghost btn-sm" data-action="order-track" data-id="' + o.id + '">Track</button></td></tr>';
  }).join('');
  const recentTable = '<div class="table-wrap"><table><thead><tr><th>Order</th><th>Seller</th><th>Value</th><th>Status</th><th></th></tr></thead><tbody>' + recent + '</tbody></table></div>';

  const active = list.filter(function (o) { return ['Processing', 'Delivered', 'Return to Seller'].indexOf(o.status) === -1; }).slice(0, 5);
  const shortcuts = active.map(function (o) {
    return '<div class="shortcut"><div><div class="cell-strong small">' + o.tracking + '</div>' + badge(o.status) + '</div><button class="btn btn-secondary btn-sm" data-action="order-track" data-id="' + o.id + '">Track</button></div>';
  }).join('');

  const notifs = state.notifications.buyer.slice(0, 4).map(function (n) {
    return '<div class="shortcut"><div>' + (n.read ? '' : '<span class="dot-unread"></span>') + '<span class="small cell-strong">' + escapeHTML(n.title) + '</span><div class="cell-sub">' + timeAgo(n.time) + '</div></div></div>';
  }).join('');

  html += '<div class="two-col"><div>' +
    cardHTML('Recent orders', '', '<button class="btn btn-secondary btn-sm" data-action="nav" data-page="orders">View all</button>', recentTable, true) +
    '</div><div class="stack">' +
    cardHTML('Tracking shortcuts', 'Active parcels', '', shortcuts || emptyState('map-pin', 'No active parcels', 'Active parcels show up here.'), true) +
    cardHTML('Notifications', '', '<button class="btn btn-secondary btn-sm" data-action="nav" data-page="notifications">Open</button>', notifs, true) +
    '</div></div>';
  return html;
}

/* ----- P and E. Orders, order processing ----- */
function renderBuyerOrders() {
  let html = '';
  if (!isVerifiedBuyer()) {
    html += notice('warning', 'shield-check', '<strong>Checkout is locked.</strong> Only a Verified Buyer can place an order. <button class="link-btn" data-action="nav" data-page="profile">Go to verification</button>');
  }
  html += '<div class="page-actions"><span class="muted small">Showing all orders for ' + escapeHTML(BUYER_NAME) + '.</span><button class="btn btn-primary" data-action="checkout-open">' + icon('plus') + 'Place order</button></div>';
  html += '<section class="card">' + filterBarHTML('buyerOrders') + '<div id="tbl-buyerOrders">' + TABLES.buyerOrders() + '</div></section>';
  return html;
}

// Shared by buyer, seller, and administrator (admin adds extra buttons)
function showOrderDetails(id, adminMode) {
  const o = getOrder(id);
  if (!o) { return; }
  const addr = getAddress(o.addressId);
  const buyerOk = isBuyerVerified(o.buyer);
  const addrOk = addr && addr.status === 'verified';
  const consolidation = consolidationInfo(o);
  const eta = etaInfo(o);
  let body = '<div class="detail-grid">' +
    detailItem('Order number', o.id) + detailItem('Seller', escapeHTML(o.seller)) + detailItem('Buyer', escapeHTML(o.buyer)) +
    detailItem('Items', escapeHTML(o.items)) + detailItem('Order value', formatPeso(o.value)) + detailItem('Status', badge(o.status)) +
    detailItem('Buyer check', buyerOk ? '<span class="badge badge-green">' + icon('circle-check', 'icon-sm') + 'Verified Buyer</span>' : '<span class="badge badge-red">Not verified</span>') +
    detailItem('Address checks', addrOk ? '<span class="badge badge-green">' + icon('circle-check', 'icon-sm') + 'Passed locally</span>' : '<span class="badge badge-red">Address needs correction</span>') +
    detailItem('Consolidation', '<span class="' + (consolidation.ok ? '' : 'muted') + '">' + consolidation.text + '</span>') +
    detailItem('Packing status', packingStatus(o)) + detailItem('Tracking number', o.tracking) + detailItem('Delivery progress', eta.eta) +
    '</div>' +
    '<h4 class="section-title">Order progress</h4>' + stepperHTML(o.stage) +
    '<h4 class="section-title">Shipping label preview</h4>' + labelHTML(o);
  const buttons = [{ label: 'Close', cls: 'btn-secondary' }];
  if (adminMode) { body += '<h4 class="section-title">Administrator actions</h4><div class="btn-row">' + adminActionsHTML(o) + '</div>'; }
  openModal({ title: 'Order ' + o.id, body: body, wide: true, buttons: buttons });
}

/* ----- F, L. Parcel tracking and delivery completion ----- */
function renderTrack() {
  const list = sortNewestFirst(myOrders());
  if (!list.length) {
    ui.trackId = null;
    return cardHTML('Shipment Tracking', 'Search or select an order to review its recorded progress.', '',
      emptyState('map-pin', 'No parcels to track', 'Shipment tracking will appear here after an order is placed.'));
  }
  if (!ui.trackId || !getOrder(ui.trackId)) {
    const firstActive = list.find(function (o) { return o.status !== 'Delivered' && o.status !== 'Return to Seller'; });
    ui.trackId = (firstActive || list[0]).id;
  }
  const o = getOrder(ui.trackId);
  const addr = getAddress(o.addressId);
  const eta = etaInfo(o);

  const options = list.map(function (p) { return '<option value="' + p.id + '"' + (p.id === o.id ? ' selected' : '') + '>' + p.id + ' - ' + escapeHTML(p.items) + '</option>'; }).join('');
  let html = '<section class="card"><div class="card-header"><div><h3>Shipment Tracking</h3><p class="sub">Search or select an order to review its recorded progress.</p></div></div><div class="card-body"><div class="form-row">' +
    '<div class="form-group" style="margin:0;"><label for="track-input">Find by tracking number</label><div style="display:flex;gap:8px;"><input type="text" id="track-input" placeholder="PH-LGX-884201"><button class="btn btn-primary" data-action="track-search">' + icon('search') + 'Track</button></div></div>' +
    '<div class="form-group" style="margin:0;"><label for="track-select">Or choose a parcel</label><select id="track-select" data-onchange="track-select">' + options + '</select></div>' +
    '</div></div></section>';

  const rider = o.rider ? escapeHTML(o.rider) : 'Not assigned yet';
  const coords = addr && Number.isFinite(Number(addr.lat)) && Number.isFinite(Number(addr.lng)) ? [Number(addr.lat), Number(addr.lng)] : null;
  html += '<section class="card tracking-summary"><div class="card-header"><div><h3>' + o.tracking + '</h3><p class="sub">' + o.id + ' · ' + escapeHTML(o.seller) + '</p></div>' + badge(o.status) + '</div><div class="card-body"><div class="detail-grid">' +
    detailItem('Current status', badge(o.status)) + detailItem('Last recorded update', o.events.length ? formatDateTime(new Date(o.events[o.events.length - 1].time)) : 'No event recorded') + detailItem('Delivery window', o.method === 'Schedule & Hold' && o.timeWindow ? escapeHTML(o.timeWindow) : 'Not scheduled') +
    detailItem('Local hub', escapeHTML(o.hub || 'Not recorded')) + detailItem('Rider', rider) + detailItem('Delivery address', escapeHTML(addr ? addr.label + ': ' + addr.address : 'Not available')) + '</div></div></section>' +
    '<div class="tracking-layout"><section class="card"><div class="card-header"><div><h3>Shipment location</h3><p class="sub">' + (coords ? 'Map marker uses the saved delivery coordinates.' : 'No saved coordinates for this shipment. Map opens at Bulacan.') + '</p></div></div><div id="tracking-map" class="leaflet-map" data-lat="' + (coords ? coords[0] : '') + '" data-lng="' + (coords ? coords[1] : '') + '" data-label="' + escapeHTML(addr ? addr.label + ' · ' + addr.address : '') + '" role="region" aria-label="Shipment location map"></div><div class="map-attribution-note">Map data © OpenStreetMap contributors. Map markers show saved address coordinates only; vehicle GPS is unavailable.</div></section>' +
    '<section class="card"><div class="card-header"><h3>Tracking timeline</h3></div><div class="card-body"><ul class="timeline">' +
    o.events.slice().reverse().map(function (e, i) {
      return '<li class="' + (i === 0 ? 'latest' : '') + '"><div class="t-title">' + escapeHTML(e.title) + '</div><div class="t-time">' + formatDateTime(new Date(e.time)) + '</div>' + (e.note ? '<div class="small">' + escapeHTML(e.note) + '</div>' : '') + '</li>';
    }).join('') + (o.events.length ? '' : '<li>No tracking events have been recorded.</li>') + '</ul><h4 class="section-title">Order progress</h4>' + stepperHTML(o.stage) + '</div></section></div>';

  if (o.status === 'Delivered') {
    html += cardHTML('Delivery completed', 'Delivered ' + (o.deliveredAt ? formatDateTime(new Date(o.deliveredAt)) : ''),
      '<button class="btn btn-primary" data-action="print-receipt" data-id="' + o.id + '">' + icon('printer') + 'Print receipt</button>',
      notice('success', 'circle-check', '<strong>Delivered.</strong> Tracking ' + o.tracking + ' was received at ' + escapeHTML(addr ? addr.address : '') + '.') + receiptHTML(o));
  }
  if (o.status === 'Return to Seller') {
    html += notice('error', 'circle-x', '<strong>Returned to seller.</strong> Reason: ' + escapeHTML(o.rtsReason || '') + '.');
  }
  return html;
}

/* ----- G and H. Local Hub Decision Point (the most important screen) ----- */
function getAwaiting() { return myOrders().filter(function (o) { return o.status === 'Awaiting Instruction'; }); }
function getHubSelected() {
  return getAwaiting().filter(function (o) { return (ui.hubSelection || []).includes(o.id); });
}

function renderHub() {
  const awaiting = getAwaiting();
  let html = '';
  if (ui.hubResult) { html += '<div class="notice notice-success">' + icon('circle-check') + '<div>' + ui.hubResult + '</div></div>'; }

  if (!awaiting.length) {
    return html + cardHTML('No parcels waiting', '', '', emptyState('warehouse', 'No parcels are waiting for a decision',
      'Parcels appear here when their status is updated to arrival at your local hub.',
      '<button class="btn btn-secondary" data-action="nav" data-page="track">Track a parcel</button> <button class="btn btn-secondary" data-action="nav" data-page="schedule">Delivery schedule</button>'));
  }

  // Default selection: all parcels that share the first parcel's address
  if (ui.hubSelection === null) {
    ui.hubSelection = awaiting.filter(function (o) { return o.addressId === awaiting[0].addressId; }).map(function (o) { return o.id; });
  }
  ui.hubSelection = ui.hubSelection.filter(function (id) { return awaiting.some(function (o) { return o.id === id; }); });
  const selected = getHubSelected();
  const totalValue = selected.reduce(function (sum, o) { return sum + o.value; }, 0);

  html += '<div class="hub-notice">' + icon('warehouse') + '<div><h3>Your parcel(s) have arrived at your delivery hub. Please select your delivery preference.</h3>' +
    '<p>Pick the parcels below, then choose one of the three delivery options.</p></div></div>';

  // Summary strip: value, hold period, deadline
  let deadlineHTML = '-';
  let holdHTML = '-';
  let bar = '';
  if (selected.length) {
    const earliest = selected.reduce(function (a, b) { return decisionDeadline(a) < decisionDeadline(b) ? a : b; });
    const left = hoursLeft(earliest);
    const pct = Math.min(100, Math.max(0, ((DECISION_HOURS - left) / DECISION_HOURS) * 100));
    deadlineHTML = formatDateTime(decisionDeadline(earliest));
    bar = '<div class="small muted">' + formatHoursLeft(left) + ' (workflow clock)</div><div class="progress-track"><div class="progress-fill ' + (left < 3 ? 'red' : left < 6 ? 'amber' : '') + '" style="width:' + pct + '%"></div></div>';
    const minDays = Math.min.apply(null, selected.map(remainingHoldDays));
    holdHTML = minDays + ' day(s) left<div class="small muted">Ends ' + formatDate(earliestExpiry(selected)) + '</div>';
  }
  html += '<div class="summary-strip">' +
    '<div class="summary-item"><div class="k">Parcels selected</div><div class="v">' + selected.length + ' of ' + awaiting.length + '</div></div>' +
    '<div class="summary-item"><div class="k">Total order value</div><div class="v">' + formatPeso(totalValue) + '</div></div>' +
    '<div class="summary-item"><div class="k">Remaining hold period (max 3 calendar days)</div><div class="v" style="font-size:16px;">' + holdHTML + '</div></div>' +
    '<div class="summary-item"><div class="k">Decision deadline (12 hours from arrival)</div><div class="v" style="font-size:16px;">' + deadlineHTML + '</div>' + bar + '</div></div>';

  html += notice('warning', 'clock', '<strong>No selection within 12 hours?</strong> The parcel defaults to Standard Dispatch (no fee). Deadline transitions use the workflow clock.');

  // Parcel selection table
  const rows = awaiting.map(function (o) {
    const addr = getAddress(o.addressId);
    return '<tr><td><input type="checkbox" data-onchange="hub-toggle" data-id="' + o.id + '"' + (ui.hubSelection.includes(o.id) ? ' checked' : '') + ' aria-label="Select ' + o.id + '"></td>' +
      '<td class="cell-strong">' + o.id + '<div class="cell-sub">' + o.tracking + '</div></td><td>' + escapeHTML(o.seller) + '</td><td>' + escapeHTML(o.items) + '</td>' +
      '<td>' + escapeHTML(addr ? addr.label : '-') + '</td><td>' + formatDateTime(new Date(o.hubArrival)) + '</td><td>' + formatPeso(o.value) + '</td>' +
      '<td>' + remainingHoldDays(o) + ' day(s)</td><td>' + formatDateTime(decisionDeadline(o)) + '<div class="cell-sub">' + formatHoursLeft(hoursLeft(o)) + '</div></td></tr>';
  }).join('');
  html += cardHTML('Eligible parcels', 'Tick the parcels this decision applies to.', '', '<div class="table-wrap"><table><thead><tr><th></th><th>Parcel</th><th>Seller</th><th>Items</th><th>Address</th><th>Hub arrival</th><th>Value</th><th>Hold left</th><th>Decision deadline</th></tr></thead><tbody>' + rows + '</tbody></table></div>', true);

  if (!selected.length) { html += notice('error', 'circle-alert', 'Select at least one parcel to continue.'); }
  html += renderHubOptions(selected, totalValue);

  html += cardHTML('Workflow clock controls', 'Advance the local clock to review deadline and hold-period transitions.', '',
    '<div class="btn-row"><button class="btn btn-secondary" data-action="clock-advance" data-hours="12">' + icon('clock') + 'Advance 12 hours</button>' +
    '<button class="btn btn-secondary" data-action="clock-advance" data-hours="24">' + icon('calendar-days') + 'Advance one day</button></div>');
  return html;
}

function renderHubOptions(selected, totalValue) {
  const sel = ui.hubOption;
  const has = selected.length > 0;

  // Option 1: Consolidate & Combine
  const check = canConsolidate(selected);
  const firstAddress = has ? selected[0].addressId : null;
  const list1 = has ? selected.map(function (o) {
    const same = o.addressId === firstAddress;
    return '<li class="' + (same ? '' : 'bad') + '">' + icon(same ? 'circle-check' : 'circle-x', 'icon-sm') + '<span>' + o.id + ' - ' + escapeHTML(o.seller) + ' (' + formatPeso(o.value) + ')</span></li>';
  }).join('') : '';
  const card1 = '<div class="option-card' + (sel === 'consolidate' ? ' selected' : '') + '" data-action="pick-option" data-option="consolidate">' +
    '<span class="option-flag">' + icon('check', 'icon-sm') + 'Selected</span>' +
    '<div class="option-head"><div class="option-icon">' + icon('layers', 'icon-lg') + '</div><div><h4>Consolidate &amp; Combine</h4><span class="fee-tag">No additional service fee</span></div></div>' +
    '<div class="option-body"><p>Combine parcels for the same verified buyer and delivery address into one delivery.</p>' +
    (has ? '<ul class="parcel-list">' + list1 + '</ul>' : '') +
    (check.ok ? notice('success', 'circle-check', 'These ' + selected.length + ' parcels can be combined.') : notice('warning', 'triangle-alert', escapeHTML(check.reason))) + '</div>' +
    '<button class="btn btn-primary btn-block" data-action="confirm-consolidate"' + (check.ok ? '' : ' disabled') + '>Confirm consolidation</button></div>';

  // Option 2: Schedule & Hold (3% fee)
  const allowed = allowedDatesFor(selected);
  if (!allowed.includes(ui.hubDate)) { ui.hubDate = allowed[0] || ''; }
  const canSchedule = has && allowed.length > 0;
  const card2 = '<div class="option-card' + (sel === 'schedule' ? ' selected' : '') + '" data-action="pick-option" data-option="schedule">' +
    '<span class="option-flag">' + icon('check', 'icon-sm') + 'Selected</span>' +
    '<div class="option-head"><div class="option-icon">' + icon('calendar-days', 'icon-lg') + '</div><div><h4>Schedule &amp; Hold</h4><span class="fee-tag paid">3% service fee</span></div></div>' +
    '<div class="option-body"><p>Pick a delivery date within the maximum three-calendar-day holding period.</p>' +
    (has ? (allowed.length ? '<div><div class="label">Delivery date</div>' + dateChipsHTML(selected, ui.hubDate, 'hub-pick-date') + '</div>' +
      '<div><div class="label">Time window</div>' + windowChipsHTML(ui.hubWindow, 'hub-pick-window') + '</div>' +
      '<div>' + feeBreakdownHTML(totalValue, ui.hubDate, earliestExpiry(selected)) + '</div>'
      : notice('error', 'circle-alert', 'The holding period has ended for a selected parcel, so no date can be scheduled.')) : '<p class="muted">Select a parcel to see dates and the fee.</p>') + '</div>' +
    '<button class="btn btn-primary btn-block" data-action="confirm-schedule"' + (canSchedule ? '' : ' disabled') + '>Confirm schedule and fee</button></div>';

  // Option 3: Standard Dispatch
  const card3 = '<div class="option-card' + (sel === 'standard' ? ' selected' : '') + '" data-action="pick-option" data-option="standard">' +
    '<span class="option-flag">' + icon('check', 'icon-sm') + 'Selected</span>' +
    '<div class="option-head"><div class="option-icon">' + icon('truck', 'icon-lg') + '</div><div><h4>Standard Dispatch</h4><span class="fee-tag">No additional service fee</span></div></div>' +
    '<div class="option-body"><p>Choose this option for Standard Dispatch. It is also the default if you do not choose within 12 hours.</p>' +
    '<div class="detail-item"><div class="k">Delivery timing</div><div class="v">Not available for this option</div></div>' +
    '<div class="detail-item"><div class="k">Parcels</div><div class="v">' + selected.length + ' selected</div></div></div>' +
    '<button class="btn btn-primary btn-block" data-action="confirm-standard"' + (has ? '' : ' disabled') + '>Confirm Standard Dispatch</button></div>';

  return '<div class="options-grid">' + card1 + card2 + card3 + '</div>';
}

/* ----- J and K. Delivery scheduling, missed delivery, rescheduling ----- */
function renderSchedule() {
  const candidates = myOrders().filter(function (o) { return ['Awaiting Instruction', 'Scheduled Hold', 'Failed Delivery'].indexOf(o.status) !== -1; });
  let html = '';

  // Section 1: schedule or reschedule form
  let formBody = '';
  if (!candidates.length) {
    formBody = emptyState('calendar-days', 'Nothing to schedule', 'Parcels waiting at the hub, scheduled parcels, and missed deliveries appear here.');
  } else {
    if (!ui.schedOrderId || !candidates.some(function (o) { return o.id === ui.schedOrderId; })) { ui.schedOrderId = candidates[0].id; }
    const o = getOrder(ui.schedOrderId);
    const allowed = allowedDatesFor([o]);
    if (!allowed.includes(ui.schedDate)) { ui.schedDate = allowed[0] || ''; }
    const isNew = o.status === 'Awaiting Instruction';
    const options = candidates.map(function (p) { return '<option value="' + p.id + '"' + (p.id === o.id ? ' selected' : '') + '>' + p.id + ' - ' + p.status + '</option>'; }).join('');
    formBody = '<div class="form-group"><label for="sched-order">Parcel</label><select id="sched-order" data-onchange="sched-order">' + options + '</select></div>' +
      '<div class="detail-grid" style="margin-bottom:16px;">' + detailItem('Hub arrival', formatDateTime(new Date(o.hubArrival))) +
      detailItem('Hold expires', formatDate(holdExpiryDate(o))) + detailItem('Remaining hold', remainingHoldDays(o) + ' day(s)') +
      detailItem('Current schedule', o.scheduledDate ? formatDate(parseDateKey(o.scheduledDate)) + ', ' + o.timeWindow : 'None yet') + '</div>';
    if (!allowed.length) {
      formBody += notice('error', 'circle-alert', 'The 3-day holding period has ended for this parcel. It can no longer be scheduled and is eligible for Return-to-Seller review.');
    } else {
      formBody += '<div class="form-group"><div class="label">Available delivery dates (max 3 calendar days from hub arrival)</div>' + dateChipsHTML([o], ui.schedDate, 'sched-pick-date') + '</div>' +
        '<div class="form-group"><div class="label">Time window</div>' + windowChipsHTML(ui.schedWindow, 'sched-pick-window') + '</div>' +
        '<h4 class="section-title">Schedule summary</h4><table class="mini-table">' +
        '<tr><td>Parcel</td><td>' + o.id + '</td></tr><tr><td>Delivery date</td><td>' + (ui.schedDate ? formatDate(parseDateKey(ui.schedDate)) : '-') + '</td></tr>' +
        '<tr><td>Time window</td><td>' + TIME_WINDOWS[ui.schedWindow] + '</td></tr>' +
        '<tr><td>Service fee</td><td>' + (isNew ? formatPeso(calcFee(o.value)) + ' (3% of ' + formatPeso(o.value) + ')' : (o.feeApplied ? 'Already applied, no new fee' : 'None')) + '</td></tr></table>' +
        '<div style="margin-top:16px;"><button class="btn btn-primary" data-action="sched-confirm">' + (isNew ? 'Confirm schedule' : 'Confirm reschedule') + '</button></div>';
    }
  }
  html += cardHTML('Schedule a delivery', 'Dates beyond the holding period are disabled.', '', formBody);

  // Section 2: scheduled deliveries
  const scheduled = myOrders().filter(function (o) { return o.status === 'Scheduled Hold'; });
  const rows = scheduled.map(function (o) {
    const addr = getAddress(o.addressId);
    return '<tr><td class="cell-strong">' + o.id + '</td><td>' + formatDate(parseDateKey(o.scheduledDate)) + '<div class="cell-sub">' + o.timeWindow + '</div></td><td>' + escapeHTML(addr ? addr.label : '') + '</td><td>' + formatPeso(o.feeAmount) + '</td><td>' + formatDate(holdExpiryDate(o)) + '</td>' +
      '<td><div class="btn-row"><button class="btn btn-secondary btn-sm" data-action="sched-reschedule" data-id="' + o.id + '">Reschedule</button><button class="btn btn-ghost btn-sm" data-action="sim-missed" data-id="' + o.id + '">Record missed delivery</button></div></td></tr>';
  }).join('');
  html += cardHTML('Scheduled deliveries', '', '', scheduled.length
    ? '<div class="table-wrap"><table><thead><tr><th>Parcel</th><th>Date and window</th><th>Address</th><th>Fee applied</th><th>Hold expires</th><th>Actions</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
    : emptyState('calendar-days', 'No scheduled deliveries', 'Choose Schedule & Hold on the Hub Decisions screen to book one.'), true);

  // Section 3: missed deliveries
  const failed = myOrders().filter(function (o) { return o.status === 'Failed Delivery'; });
  const missed = failed.map(function (o) {
    const allowed = allowedDatesFor([o]);
    let action;
    if (allowed.length) {
      const dateOptions = allowed.map(function (k) { return '<option value="' + k + '">' + formatDate(parseDateKey(k)) + '</option>'; }).join('');
      const windowOptions = TIME_WINDOWS.map(function (w, i) { return '<option value="' + i + '">' + w + '</option>'; }).join('');
      action = '<div class="form-row"><div class="form-group"><label>New delivery date</label><select id="resched-date-' + o.id + '">' + dateOptions + '</select></div>' +
        '<div class="form-group"><label>Time window</label><select id="resched-window-' + o.id + '">' + windowOptions + '</select></div></div>' +
        '<button class="btn btn-primary" data-action="resched-confirm" data-id="' + o.id + '">Confirm reschedule</button>';
    } else {
      action = notice('error', 'circle-alert', 'The hold period has ended. The parcel stays at the hub until an administrator reviews it for Return-to-Seller.');
    }
    return '<div class="missed-card"><div class="missed-head"><div><strong>' + o.id + '</strong> <span class="muted">' + o.tracking + '</span></div>' + badge('Failed Delivery', 'Attempted Delivery') + '</div>' +
      notice('error', 'triangle-alert', '<strong>Missed delivery notice.</strong> Our rider could not complete delivery (recipient not available). Attempts: ' + o.attempts + '. Your parcel was <strong>not</strong> returned to the seller.') +
      '<p class="small" style="margin-bottom:12px;">Remaining hold time: <strong>' + remainingHoldDays(o) + ' day(s)</strong>, until ' + formatDate(holdExpiryDate(o)) + '.</p>' + action + '</div>';
  }).join('');
  html += cardHTML('Missed delivery and rescheduling', 'No fee is charged again when you reschedule inside the hold window.', '', failed.length ? missed : emptyState('circle-check', 'No missed deliveries', 'A recorded missed delivery will appear here.'));
  return html;
}

/* ----- C. Address management ----- */
const MAP_BOX = { latMin: 4.5, latMax: 21.2, lngMin: 116.8, lngMax: 126.7 }; // rough Philippines bounds

function renderAddresses() {
  const mine = state.addresses.filter(function (a) { return a.owner === BUYER_NAME; });
  const f = ui.addrForm;
  let html = notice('info', 'info', '<strong>Address checks are local.</strong> This workspace checks field completeness and whether coordinates fall within the Philippines. It does not verify addresses with a real-world provider.');

  const saved = mine.length ? mine.map(function (a) {
    return '<div class="addr-card"><div class="top"><div><strong>' + escapeHTML(a.label) + '</strong><div class="small">' + escapeHTML(a.recipient) + ' · ' + escapeHTML(a.contact) + '</div></div>' + addressBadge(a.status) + '</div>' +
      '<p style="margin-top:8px;">' + escapeHTML(a.address) + '</p><p class="cell-sub">Lat ' + escapeHTML(a.lat) + ', Lng ' + escapeHTML(a.lng) + '</p>' +
      (a.status !== 'verified' && a.note ? '<p class="small" style="color:var(--red);margin-top:6px;">' + escapeHTML(a.note) + '</p>' : '') +
      '<div class="btn-row" style="margin-top:10px;"><button class="btn btn-secondary btn-sm" data-action="addr-edit" data-id="' + a.id + '">' + icon('pencil', 'icon-sm') + 'Edit</button>' +
      '<button class="btn btn-secondary btn-sm" data-action="addr-revalidate" data-id="' + a.id + '">Validate again</button>' +
      '<button class="btn btn-ghost btn-sm" data-action="addr-delete" data-id="' + a.id + '">' + icon('trash-2', 'icon-sm') + 'Delete</button></div></div>';
  }).join('') : emptyState('house', 'No saved addresses', 'Add your first address using the form.');

  let result = '';
  if (ui.addrResult) {
    result = ui.addrResult.ok
      ? notice('success', 'circle-check', '<strong>Address checks passed</strong> (local field and coordinate checks).')
      : notice('error', 'circle-alert', '<strong>Address Needs Correction</strong><ul style="margin:6px 0 0;padding-left:18px;">' + ui.addrResult.problems.map(function (p) { return '<li>' + escapeHTML(p) + '</li>'; }).join('') + '</ul>');
  }

  const fieldError = function (name) {
    const problems = ui.addrResult ? ui.addrResult.problems : [];
    const matched = problems.filter(function (problem) {
      if (name === 'recipient') { return problem.indexOf('recipient') !== -1; }
      if (name === 'contact') { return problem.indexOf('Contact number') !== -1; }
      if (name === 'address') { return problem.indexOf('Address is too short') !== -1; }
      if (name === 'lat' || name === 'lng') { return problem.indexOf('location') !== -1 || problem.indexOf('Coordinates') !== -1; }
      return false;
    });
    return matched[0] || '';
  };
  const field = function (name, label, type, extra) {
    const error = fieldError(name);
    return '<div class="form-group"><label for="af-' + name + '">' + label + '</label><input type="' + (type || 'text') + '" id="af-' + name + '" value="' + escapeHTML(f[name]) + '" data-oninput="addr-field" data-field="' + name + '" aria-invalid="' + (error ? 'true' : 'false') + '" aria-describedby="af-' + name + '-error" ' + (extra || '') + '><p class="field-error" id="af-' + name + '-error">' + escapeHTML(error) + '</p></div>';
  };
  const addressError = fieldError('address');

  const selectedLocation = f.lat && f.lng
    ? '<p class="location-review" aria-live="polite"><strong>Selected map point:</strong> ' + escapeHTML(f.lat) + ', ' + escapeHTML(f.lng) + '. Selecting a point does not verify the address.</p>'
    : '<p class="location-review muted" aria-live="polite">No point selected. You can save without coordinates, but local address checks will require them.</p>';
  const form = '<div class="form-row">' + field('label', 'Address label (optional)') + field('recipient', 'Recipient name (required)', 'text', 'required') + '</div>' +
    field('contact', 'Contact number (required)', 'text', 'placeholder="09171234567" required') +
    '<div class="form-group"><label for="af-address">Complete address (required)</label><textarea id="af-address" data-oninput="addr-field" data-field="address" placeholder="Unit, street, barangay, city" aria-invalid="' + (addressError ? 'true' : 'false') + '" aria-describedby="af-address-error" required>' + escapeHTML(f.address) + '</textarea><p class="field-error" id="af-address-error">' + escapeHTML(addressError) + '</p></div>' +
    '<div class="form-group"><div class="label">Location on map</div><div id="address-map" class="leaflet-map address-map" role="region" aria-label="Choose an address location on the map"></div><p class="hint">Select the delivery point and review its marker before saving. The map opens in Bulacan.</p>' + selectedLocation + '</div>' +
    '<div class="form-row">' + field('lat', 'Latitude', 'text', 'placeholder="14.6396"') + field('lng', 'Longitude', 'text', 'placeholder="121.0775"') + '</div>' +
    '<div id="addr-result">' + result + '</div>' +
    '<div class="btn-row"><button class="btn btn-secondary" data-action="addr-validate">Check address</button><button class="btn btn-primary" data-action="addr-save">' + (f.id ? 'Update address' : 'Save address') + '</button>' +
    (f.id ? '<button class="btn btn-ghost" data-action="addr-clear">Cancel editing</button>' : (f.address || f.recipient ? '<button class="btn btn-ghost" data-action="addr-clear">Clear form</button>' : '')) + '</div>';

  html += '<div class="two-col"><div>' + cardHTML('Saved addresses', mine.length + ' saved', '', saved) + '</div><div>' +
    cardHTML(f.id ? 'Edit address' : 'Add address', 'Validate first, then save.', '', form) + '</div></div>';
  return html;
}

/* ----- O. Notifications ----- */
function renderNotifications() {
  const all = state.notifications.buyer;
  const list = ui.notifFilter === 'unread' ? all.filter(function (n) { return !n.read; }) : all;
  const unread = all.filter(function (n) { return !n.read; }).length;
  const rows = list.map(function (n) {
    const pair = NOTIF_ICONS[n.type] || ['bell', ''];
    return '<div class="notif' + (n.read ? '' : ' unread') + '"><div class="notif-icon ' + pair[1] + '">' + icon(pair[0]) + '</div>' +
      '<div class="notif-main"><div class="notif-title">' + (n.read ? '' : '<span class="dot-unread"></span>') + escapeHTML(n.title) + '</div><div class="small">' + escapeHTML(n.text) + '</div><div class="cell-sub">' + timeAgo(n.time) + '</div></div>' +
      '<button class="btn btn-secondary btn-sm" data-action="notif-toggle" data-id="' + n.id + '">Mark as ' + (n.read ? 'unread' : 'read') + '</button></div>';
  }).join('');
  return '<div class="page-actions"><div class="tabs" style="margin:0;width:260px;"><button class="tab-btn' + (ui.notifFilter === 'all' ? ' active' : '') + '" data-action="notif-filter" data-filter="all">All (' + all.length + ')</button>' +
    '<button class="tab-btn' + (ui.notifFilter === 'unread' ? ' active' : '') + '" data-action="notif-filter" data-filter="unread">Unread (' + unread + ')</button></div>' +
    '<button class="btn btn-secondary" data-action="notif-read-all">Mark all as read</button></div>' +
    '<section class="card">' + (rows || emptyState('bell', 'No notifications here', ui.notifFilter === 'unread' ? 'You have read everything.' : 'New updates will appear here.')) + '</section>';
}

/* ----- B. Profile and buyer verification ----- */
function renderProfile() {
  const v = myVerification();
  const profile = '<div class="card-body" style="text-align:center;"><div class="avatar avatar-lg" style="margin:0 auto 12px;">' + escapeHTML((state.session.name || 'MS').split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase()) + '</div>' +
    '<h3>' + escapeHTML(state.session.name) + '</h3><p class="muted small">' + escapeHTML(state.session.contact) + '</p><div style="margin-top:10px;">' + verificationBadge(v.status) + '</div></div>';
  return '<div class="two-col" style="grid-template-columns:1fr 1.6fr;"><div class="stack">' + cardHTML('Account', '', '', profile, true) + '</div><div>' + verificationCardHTML(v) + '</div></div>';
}

function verificationCardHTML(v) {
  const messages = {
    none: 'Submit your ID and a face check to become a Verified Buyer.',
    submitted: 'Your verification was submitted and is waiting for review.',
    pending: 'Your verification is being reviewed. This usually takes a short time.',
    verified: 'You are a Verified Buyer. You can proceed to checkout.',
    rejected: 'Your verification was rejected. Fix the issue below and submit again.'
  };
  const tone = { none: 'info', submitted: 'info', pending: 'warning', verified: 'success', rejected: 'error' }[v.status];
  let body = '<div style="margin-bottom:14px;">' + verificationBadge(v.status) + '</div>' +
    notice(tone, 'shield-check', messages[v.status] + (v.status === 'rejected' && v.reason ? '<p><strong>Reason:</strong> ' + escapeHTML(v.reason) + '</p>' : '')) +
    notice('warning', 'triangle-alert', '<strong>Identity verification is not connected.</strong> Image previews stay in this browser. Review actions below only update local workflow status; they do not verify a person. Do not upload a government ID.');

  if (v.status === 'none' || v.status === 'rejected') {
    body += '<h4 class="section-title">Local review steps</h4><ol class="instr-list"><li>Select a non-sensitive image for the local preview.</li><li>Confirm the preview appears correctly.</li><li>Submit the request to update its local review status.</li></ol>' +
      '<h4 class="section-title">Government ID upload</h4><div class="upload-box">' + icon('upload', 'icon-lg') + '<p class="small muted" style="margin:6px 0 10px;">Image stays in your browser (preview only).</p>' +
      '<input type="file" id="id-file" accept="image/*" data-onchange="id-file">' +
      (ui.idPreview ? '<div><img class="preview-img" src="' + ui.idPreview + '" alt="Preview of the selected ID image"></div>' : '') + '</div>' +
      '<h4 class="section-title">Identity check</h4><div class="face-box' + (ui.faceDone ? ' done' : '') + '">' + icon(ui.faceDone ? 'circle-check' : 'camera', 'icon-lg') +
      '<p style="margin:6px 0 10px;">' + (ui.faceDone ? 'Local review step recorded. No biometric check was performed.' : 'No camera or biometric service is connected.') + '</p>' +
      (ui.faceDone ? '' : '<button class="btn btn-secondary" data-action="face-check">Record local review step</button>') + '</div>' +
      '<div style="margin-top:18px;"><button class="btn btn-primary" data-action="submit-verification">Submit verification</button></div>';
  }

  body += '<h4 class="section-title">Local workflow controls</h4><div class="btn-row">' +
    '<button class="btn btn-secondary btn-sm" data-action="ver-sim" data-status="pending">Verification Pending</button>' +
    '<button class="btn btn-secondary btn-sm" data-action="ver-sim" data-status="verified">Verified Buyer</button>' +
    '<button class="btn btn-secondary btn-sm" data-action="ver-sim" data-status="rejected">Verification Rejected</button>' +
    '<button class="btn btn-ghost btn-sm" data-action="ver-sim" data-status="none">Reset to Not Verified</button></div>';
  return cardHTML('Buyer verification', 'Only Verified Buyers can check out.', '', body);
}

/* ===========================================================
   8. SELLER SCREENS
   =========================================================== */
function sellerBarHTML() {
  const options = ['All'].concat(SELLERS).map(function (s) { return '<option value="' + s + '"' + (s === ui.sellerFilter ? ' selected' : '') + '>' + (s === 'All' ? 'All stores' : s) + '</option>'; }).join('');
  return '<div class="seller-bar"><label for="seller-select" class="label" style="margin:0;">Viewing store</label><select id="seller-select" data-onchange="seller-filter">' + options + '</select><span class="hint" style="margin:0;">Filter locally stored orders by store.</span></div>';
}

function renderSellerDashboard() {
  const list = sellerOrders();
  const count = function (fn) { return list.filter(fn).length; };
  const eligible = count(function (o) { return o.status !== 'Consolidated' && consolidationInfo(o).ok; });
  return sellerBarHTML() + '<div class="stats-grid">' +
    statCard('package', 'Incoming Orders', count(function (o) { return o.status === 'Processing'; })) +
    statCard('box', 'Awaiting Packing', count(function (o) { return o.status === 'Processing' && o.stage <= 1; }), 'amber') +
    statCard('send', 'Ready to Ship', count(function (o) { return o.status === 'Processing' && o.stage === 3; })) +
    statCard('truck', 'Parcels In Transit', count(function (o) { return o.status === 'In Transit' || o.status === 'Out for Delivery'; })) +
    statCard('layers', 'Consolidation-Eligible', eligible) +
    statCard('circle-check', 'Delivered Orders', count(function (o) { return o.status === 'Delivered'; }), 'green') +
    statCard('circle-x', 'RTS Cases', count(function (o) { return o.status === 'Return to Seller'; }), 'red') + '</div>' +
    '<section class="card"><div class="card-header"><div><h3>Orders</h3><p class="sub">Select Details to see the label, progress, and parcel information.</p></div></div>' +
    filterBarHTML('sellerOrders') + '<div id="tbl-sellerOrders">' + TABLES.sellerOrders() + '</div></section>';
}

function renderSellerOrders() { return renderSellerDashboardTableOnly(); }
function renderSellerDashboardTableOnly() {
  return sellerBarHTML() + '<section class="card">' + filterBarHTML('sellerOrders') + '<div id="tbl-sellerOrders">' + TABLES.sellerOrders() + '</div></section>';
}

function renderPacking() {
  const list = sortNewestFirst(sellerOrders().filter(function (o) { return o.status === 'Processing'; }));
  const nextLabel = { 1: 'Mark as packed', 2: 'Mark ready to ship', 3: 'Confirm handover to rider' };
  const rows = list.map(function (o) {
    return '<tr><td class="cell-strong">' + o.id + '</td><td>' + escapeHTML(o.buyer) + '</td><td>' + escapeHTML(o.items) + '</td><td>' + packingStatus(o) + '</td>' +
      '<td style="min-width:140px;"><div class="progress-track"><div class="progress-fill" style="width:' + (o.stage / 5 * 100) + '%"></div></div><div class="cell-sub">Step ' + o.stage + ' of 5</div></td>' +
      '<td><div class="btn-row"><button class="btn btn-primary btn-sm" data-action="pack-next" data-id="' + o.id + '">' + nextLabel[o.stage] + '</button>' +
      (o.stage >= 2 ? '<button class="btn btn-secondary btn-sm" data-action="view-label" data-id="' + o.id + '">View label</button>' : '') + '</div></td></tr>';
  }).join('');
  return sellerBarHTML() + cardHTML('Packing and handover', 'Move each order forward. Handover starts the In Transit stage.', '',
    list.length ? '<div class="table-wrap"><table><thead><tr><th>Order</th><th>Buyer</th><th>Items</th><th>Packing status</th><th>Progress</th><th>Actions</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
      : emptyState('box', 'Nothing to pack', 'New orders appear here after checkout.'), true);
}

function showSellerShipment(id) {
  const o = getOrder(id);
  if (!o || !sellerOrders().some(function (item) { return item.id === id; })) { toast('Shipment is not available for this store.', 'error'); return; }
  const events = o.events.slice().reverse().map(function (event) {
    return '<li><div class="t-title">' + escapeHTML(event.title) + '</div><div class="t-time">' + formatDateTime(new Date(event.time)) + '</div>' + (event.note ? '<div class="small">' + escapeHTML(event.note) + '</div>' : '') + '</li>';
  }).join('');
  openModal({ title: 'Shipment ' + o.tracking, wide: true, body: '<div class="detail-grid">' +
    detailItem('Order', escapeHTML(o.id)) + detailItem('Current status', badge(o.status)) +
    detailItem('Current hub', escapeHTML(o.hub || 'Not recorded')) +
    detailItem('Last recorded update', o.events.length ? formatDateTime(new Date(o.events[o.events.length - 1].time)) : 'No event recorded') +
    '</div><h4 class="section-title">Recorded shipment updates</h4><ul class="timeline">' + (events || '<li>No tracking events have been recorded.</li>') + '</ul>',
    buttons: [{ label: 'Close', cls: 'btn-secondary' }] });
}

function renderShipments() {
  const list = sortNewestFirst(sellerOrders().filter(function (o) { return o.status !== 'Processing'; }));
  const rows = list.map(function (o) {
    return '<tr><td class="cell-strong">' + o.id + '</td><td>' + o.tracking + '</td><td>' + badge(o.status) + '</td><td>' + (o.rider ? escapeHTML(o.rider) : '-') + '</td><td>' + (o.vehicle || '-') + '</td><td>' + etaInfo(o).eta + '</td><td><button class="btn btn-secondary btn-sm" data-action="seller-track" data-id="' + o.id + '">View tracking</button></td></tr>';
  }).join('');
  return sellerBarHTML() + cardHTML('Shipments', 'Parcels that have left your store.', '',
    list.length ? '<div class="table-wrap"><table><thead><tr><th>Order</th><th>Tracking</th><th>Status</th><th>Rider</th><th>Vehicle</th><th>Delivery progress</th><th>Updates</th></tr></thead><tbody>' + rows + '</tbody></table></div>' : emptyState('truck', 'No shipments yet', 'Hand over a parcel to see it here.'), true);
}

function renderHistory() {
  const list = sortNewestFirst(sellerOrders().filter(function (o) { return ['Delivered', 'Failed Delivery', 'Return to Seller'].indexOf(o.status) !== -1; }));
  const rows = list.map(function (o) {
    const last = o.events[o.events.length - 1];
    return '<tr><td class="cell-strong">' + o.id + '</td><td>' + escapeHTML(o.buyer) + '</td><td>' + formatPeso(o.value) + '</td><td>' + badge(o.status) + '</td><td>' + formatDateTime(new Date(last.time)) + '</td><td>' + escapeHTML(o.rtsReason || last.note) + '</td></tr>';
  }).join('');
  return sellerBarHTML() + cardHTML('Delivery history', '', '',
    list.length ? '<div class="table-wrap"><table><thead><tr><th>Order</th><th>Buyer</th><th>Value</th><th>Result</th><th>Last update</th><th>Note</th></tr></thead><tbody>' + rows + '</tbody></table></div>' : emptyState('history', 'No history yet', 'Completed deliveries appear here.'), true);
}

/* ----- I. Consolidation (shared by Seller and Administrator) ----- */
function renderConsolidation() {
  const source = state.session.role === 'seller' ? sellerOrders() : state.orders;
  let html = state.session.role === 'seller' ? sellerBarHTML() : '';

  // Groups that are already consolidated
  const groups = {};
  source.filter(function (o) { return o.groupId; }).forEach(function (o) { (groups[o.groupId] = groups[o.groupId] || []).push(o); });
  const groupRows = Object.keys(groups).map(function (gid) {
    const g = groups[gid];
    const addr = getAddress(g[0].addressId);
    return '<tr><td class="cell-strong">' + gid + '</td><td>' + escapeHTML(g[0].buyer) + '<div class="cell-sub">' + (isBuyerVerified(g[0].buyer) ? 'Verified buyer' : 'Not verified') + '</div></td><td>' + escapeHTML(addr ? addr.address : '') + '</td>' +
      '<td>' + g.map(function (o) { return o.tracking; }).join('<br>') + '</td><td>' + g.map(function (o) { return escapeHTML(o.seller); }).join('<br>') + '</td>' +
      '<td>' + g.map(function (o) { return formatPeso(o.value); }).join('<br>') + '<div class="cell-strong">' + formatPeso(g.reduce(function (s, o) { return s + o.value; }, 0)) + '</div></td><td>' + badge(g[0].status) + '</td></tr>';
  }).join('');
  html += cardHTML('Consolidated groups', 'Same verified buyer and same delivery address. No additional service fee.', '',
    groupRows ? '<div class="table-wrap"><table><thead><tr><th>Group ID</th><th>Verified buyer</th><th>Delivery address</th><th>Tracking numbers</th><th>Sellers</th><th>Order values</th><th>Status</th></tr></thead><tbody>' + groupRows + '</tbody></table></div>'
      : emptyState('layers', 'No consolidated groups yet', 'Groups are created when a buyer confirms Consolidate & Combine.'), true);

  // Eligibility: parcels grouped by buyer + address
  const live = ['Processing', 'In Transit', 'Awaiting Instruction', 'At Local Hub'];
  const keyed = {};
  source.filter(function (o) { return live.indexOf(o.status) !== -1; }).forEach(function (o) {
    const key = o.buyer + '|' + o.addressId;
    (keyed[key] = keyed[key] || []).push(o);
  });
  const eligRows = Object.keys(keyed).map(function (key) {
    const g = keyed[key];
    const addr = getAddress(g[0].addressId);
    const addrOk = addr && addr.status === 'verified';
    const buyerOk = isBuyerVerified(g[0].buyer);
    let status = '<span class="badge badge-gray">Single parcel</span>';
    if (g.length > 1) { status = (addrOk && buyerOk) ? '<span class="badge badge-green">Eligible</span>' : '<span class="badge badge-red">Blocked: buyer or address not verified</span>'; }
    return '<tr><td>' + escapeHTML(g[0].buyer) + '<div class="cell-sub">' + (buyerOk ? 'Verified buyer' : 'Not verified') + '</div></td><td>' + escapeHTML(addr ? addr.label + ': ' + addr.address : '') + '</td>' +
      '<td>' + g.map(function (o) { return o.id + ' (' + o.tracking + ')'; }).join('<br>') + '</td><td>' + g.map(function (o) { return escapeHTML(o.seller); }).join('<br>') + '</td><td>' + formatPeso(g.reduce(function (s, o) { return s + o.value; }, 0)) + '</td><td>' + status + '</td></tr>';
  }).join('');
  html += cardHTML('Consolidation eligibility', 'Parcels are grouped by buyer and delivery address. A different address means a different group.', '',
    '<div class="table-wrap"><table><thead><tr><th>Verified buyer</th><th>Delivery address</th><th>Parcels</th><th>Sellers</th><th>Total value</th><th>Eligibility</th></tr></thead><tbody>' + (eligRows || '<tr><td colspan="6">' + emptyState('layers', 'No active parcels', '') + '</td></tr>') + '</tbody></table></div>', true);

  // Rule checker
  const liveList = sortNewestFirst(source.filter(function (o) { return live.indexOf(o.status) !== -1; }));
  const opts = liveList.map(function (o) { return '<option value="' + o.id + '">' + o.id + ' - ' + escapeHTML(o.buyer) + ' (' + escapeHTML((getAddress(o.addressId) || {}).label || '') + ')</option>'; }).join('');
  html += cardHTML('Eligibility checker', 'Try two parcels to see the consolidation rule in action.', '',
    '<div class="form-row"><div class="form-group"><label for="chk-a">Parcel A</label><select id="chk-a">' + opts + '</select></div><div class="form-group"><label for="chk-b">Parcel B</label><select id="chk-b">' + opts + '</select></div></div>' +
    '<button class="btn btn-primary" data-action="check-consolidation">Check eligibility</button><div id="chk-result" style="margin-top:14px;"></div>');
  return html;
}

/* ===========================================================
   9. ADMINISTRATOR SCREENS
   =========================================================== */
function barChartHTML(items) {
  const max = Math.max.apply(null, items.map(function (i) { return i.value; }).concat([1]));
  return '<div class="bars">' + items.map(function (i) {
    return '<div class="bar-row"><span>' + i.label + '</span><div class="bar-track"><div class="bar-fill ' + (i.color || '') + '" style="width:' + (i.value / max * 100) + '%"></div></div><span class="bar-value">' + i.value + '</span></div>';
  }).join('') + '</div>';
}
function columnChartHTML(items) {
  const max = Math.max.apply(null, items.map(function (i) { return i.value; }).concat([1]));
  return '<div class="columns">' + items.map(function (i) {
    return '<div class="column"><strong>' + i.value + '</strong><div class="column-bar" style="height:' + (i.value / max * 100) + '%"></div><span class="muted">' + i.label + '</span></div>';
  }).join('') + '</div>';
}

function adminStats() {
  const list = state.orders;
  const count = function (fn) { return list.filter(fn).length; };
  const groupIds = {};
  list.forEach(function (o) { if (o.groupId) { groupIds[o.groupId] = true; } });
  return {
    total: list.length,
    transit: count(function (o) { return o.status === 'In Transit' || o.status === 'Out for Delivery'; }),
    atHub: count(function (o) { return HUB_STATUSES.indexOf(o.status) !== -1; }),
    consolidated: Object.keys(groupIds).length,
    scheduled: count(function (o) { return o.status === 'Scheduled Hold'; }),
    delivered: count(function (o) { return o.status === 'Delivered'; }),
    failed: list.reduce(function (s, o) { return s + o.attempts; }, 0),
    rts: count(function (o) { return o.status === 'Return to Seller'; }),
    fees: round2(list.reduce(function (s, o) { return s + (o.feeApplied ? o.feeAmount : 0); }, 0))
  };
}

function renderAdminOverview() {
  const s = adminStats();
  const byStatus = ORDER_FILTERS.slice(1).filter(function (x) { return x !== 'At Local Hub'; }).map(function (st) {
    return { label: st, value: state.orders.filter(function (o) { return o.status === st; }).length, color: STATUS_COLORS[st] === 'green' ? 'green' : STATUS_COLORS[st] === 'red' ? 'red' : STATUS_COLORS[st] === 'amber' ? 'amber' : '' };
  });
  const activity = [];
  state.orders.forEach(function (o) { o.events.forEach(function (e) { activity.push({ id: o.id, e: e }); }); });
  activity.sort(function (a, b) { return new Date(b.e.time) - new Date(a.e.time); });
  const feed = activity.slice(0, 7).map(function (a) {
    return '<div class="shortcut"><div><span class="cell-strong small">' + a.id + '</span> <span class="small">' + escapeHTML(a.e.title) + '</span><div class="cell-sub">' + timeAgo(a.e.time) + '</div></div></div>';
  }).join('');
  return '<div class="page-actions"><span class="muted small">Statistics are calculated from locally stored orders.</span>' + sampleTag() + '</div><div class="stats-grid">' +
    statCard('package', 'Total Parcels', s.total) + statCard('truck', 'In Transit', s.transit) + statCard('warehouse', 'At Local Hubs', s.atHub, 'amber') +
    statCard('layers', 'Consolidated Deliveries', s.consolidated) + statCard('calendar-days', 'Scheduled Holds', s.scheduled) +
    statCard('circle-check', 'Completed Deliveries', s.delivered, 'green') + statCard('triangle-alert', 'Failed Attempts', s.failed, 'red') +
    statCard('rotate-ccw', 'Return-to-Seller Cases', s.rts, 'red') + statCard('banknote', 'Service Fees Collected', formatPeso(s.fees), 'green') + '</div>' +
    '<div class="two-col">' + cardHTML('Parcels by status', 'Local records', '', barChartHTML(byStatus)) + cardHTML('Recent parcel activity', '', '', feed, true) + '</div>';
}

function renderAdminParcels() {
  const selected = getOrder(ui.mapOrderId) || state.orders[0];
  const address = selected && getAddress(selected.addressId);
  const hasCoords = address && Number.isFinite(Number(address.lat)) && Number.isFinite(Number(address.lng));
  return '<section class="card"><div class="card-header"><div><h3>Shipment monitoring</h3><p class="sub">Map locations come from saved order addresses. Vehicle GPS is not available.</p></div></div><div class="monitor-layout"><div id="admin-monitor-map" class="leaflet-map" data-lat="' + (hasCoords ? address.lat : '') + '" data-lng="' + (hasCoords ? address.lng : '') + '" data-label="' + escapeHTML(address ? address.label + ' · ' + address.address : '') + '" role="region" aria-label="Shipment monitoring map"></div><div class="monitor-selected"><strong>' + (selected ? escapeHTML(selected.tracking) : 'No shipment selected') + '</strong><div>' + (selected ? badge(selected.status) : '') + '</div><p class="small muted">' + (hasCoords ? 'Saved destination: ' + escapeHTML(address.address) : 'No saved destination coordinates are available.') + '</p>' + (selected ? '<button class="btn btn-secondary btn-sm" data-action="admin-manage" data-id="' + selected.id + '">Open shipment details</button>' : '') + '</div></div><div class="map-attribution-note">Map data © OpenStreetMap contributors. Select Locate in the shipment list to focus a saved address.</div></section><section class="card">' + filterBarHTML('adminParcels') + '<div id="tbl-adminParcels">' + TABLES.adminParcels() + '</div></section>';
}

// Buttons shown in the administrator's parcel dialog
function adminActionsHTML(o) {
  const b = function (label, action, cls, extra) { return '<button class="btn ' + (cls || 'btn-secondary') + ' btn-sm" data-action="' + action + '" data-id="' + o.id + '" ' + (extra || '') + '>' + label + '</button>'; };
  let h = '';
  if (o.status === 'In Transit') { h += b('Mark arrived at local hub', 'admin-set', 'btn-primary', 'data-to="hub"'); }
  if (o.status === 'Consolidated' || o.status === 'Scheduled Hold') { h += b('Dispatch for delivery', 'admin-set', 'btn-primary', 'data-to="out"'); }
  if (o.status === 'Out for Delivery') { h += b('Mark delivered', 'admin-set', 'btn-success', 'data-to="delivered"'); }
  if (o.status === 'Scheduled Hold' || o.status === 'Out for Delivery') { h += b('Record missed delivery', 'sim-missed'); }
  if (['Awaiting Instruction', 'Consolidated', 'Scheduled Hold', 'Out for Delivery', 'Failed Delivery'].indexOf(o.status) !== -1) { h += b('Return to seller', 'admin-rts', 'btn-danger'); }
  return h || '<span class="muted small">No actions are available for this status.</span>';
}

function renderAdminVerification() {
  const rows = state.verifications.map(function (v) {
    const set = function (label, status, cls) { return v.status === status ? '' : '<button class="btn ' + cls + ' btn-sm" data-action="ver-admin" data-id="' + v.id + '" data-status="' + status + '">' + label + '</button>'; };
    return '<tr><td class="cell-strong">' + escapeHTML(v.name) + (v.isYou ? ' <span class="badge badge-blue">Current buyer</span>' : '') + '<div class="cell-sub">' + escapeHTML(v.contact) + '</div></td>' +
      '<td>' + formatDateTime(new Date(v.submittedAt)) + '</td><td>' + verificationBadge(v.status) + (v.reason ? '<div class="cell-sub">' + escapeHTML(v.reason) + '</div>' : '') + '</td>' +
      '<td>' + (v.status === 'none' ? '<span class="muted small">Not submitted</span>' : '<div class="btn-row">' + set('Pending', 'pending', 'btn-secondary') + set('Approve', 'verified', 'btn-success') + set('Reject', 'rejected', 'btn-danger') + '</div>') + '</td></tr>';
  }).join('');
  return notice('info', 'info', 'Identity verification is not connected. Approvals update local workflow status only; no ID or face data is collected.') +
    cardHTML('Verification requests', '', '', '<div class="table-wrap"><table><thead><tr><th>Buyer</th><th>Submitted</th><th>Status</th><th>Actions</th></tr></thead><tbody>' + rows + '</tbody></table></div>', true);
}

function renderAdminAddresses() {
  const rows = state.addresses.map(function (a) {
    return '<tr><td class="cell-strong">' + escapeHTML(a.owner) + '<div class="cell-sub">' + escapeHTML(a.label) + '</div></td><td>' + escapeHTML(a.address) + '<div class="cell-sub">Lat ' + escapeHTML(a.lat) + ', Lng ' + escapeHTML(a.lng) + '</div></td>' +
      '<td>' + addressBadge(a.status) + (a.status !== 'verified' && a.note ? '<div class="cell-sub">' + escapeHTML(a.note) + '</div>' : '') + '</td>' +
      '<td><div class="btn-row"><button class="btn btn-secondary btn-sm" data-action="addr-admin" data-id="' + a.id + '" data-op="validate">Run validation</button>' +
      (a.status === 'verified' ? '' : '<button class="btn btn-success btn-sm" data-action="addr-admin" data-id="' + a.id + '" data-op="approve">Approve</button>') +
      (a.status === 'verified' ? '<button class="btn btn-danger btn-sm" data-action="addr-admin" data-id="' + a.id + '" data-op="flag">Flag for correction</button>' : '') + '</div></td></tr>';
  }).join('');
  return notice('info', 'info', 'Address checks only assess saved fields and coordinates. They do not verify real-world addresses.') +
    cardHTML('Address validation queue', '', '', '<div class="table-wrap"><table><thead><tr><th>Owner</th><th>Address</th><th>Status</th><th>Actions</th></tr></thead><tbody>' + rows + '</tbody></table></div>', true);
}

function renderAdminHubs() {
  const cards = HUBS.map(function (h) {
    const held = state.orders.filter(function (o) { return o.hub === h.name && HUB_STATUSES.indexOf(o.status) !== -1; });
    const pct = Math.min(100, held.length / h.capacity * 100);
    const rows = held.map(function (o) { return '<tr><td class="cell-strong">' + o.id + '</td><td>' + escapeHTML(o.buyer) + '</td><td>' + badge(o.status) + '</td><td>' + (o.status === 'Awaiting Instruction' ? formatHoursLeft(hoursLeft(o)) : '-') + '</td></tr>'; }).join('');
    return cardHTML(h.name, h.area, '', '<div class="small">' + held.length + ' of ' + h.capacity + ' parcel slots used</div><div class="progress-track" style="margin-bottom:14px;"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
      (held.length ? '<div class="table-wrap"><table><thead><tr><th>Parcel</th><th>Buyer</th><th>Status</th><th>Decision</th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '<p class="muted small">No parcels held right now.</p>'));
  }).join('');
  return '<div class="page-actions"><span class="muted small">Hub occupancy is based on locally stored orders.</span>' + sampleTag() + '</div><div class="three-col">' + cards + '</div>';
}

function renderAdminSchedules() {
  const list = state.orders.filter(function (o) { return o.status === 'Scheduled Hold'; }).sort(function (a, b) { return a.scheduledDate.localeCompare(b.scheduledDate); });
  const perDate = {};
  list.forEach(function (o) { perDate[o.scheduledDate] = (perDate[o.scheduledDate] || 0) + 1; });
  const chips = Object.keys(perDate).map(function (k) { return '<span class="badge badge-blue">' + formatDate(parseDateKey(k)) + ': ' + perDate[k] + ' parcel(s)</span>'; }).join(' ');
  const rows = list.map(function (o) {
    const addr = getAddress(o.addressId);
    return '<tr><td>' + formatDate(parseDateKey(o.scheduledDate)) + '<div class="cell-sub">' + o.timeWindow + '</div></td><td class="cell-strong">' + o.id + '</td><td>' + escapeHTML(o.buyer) + '</td><td>' + escapeHTML(addr ? addr.label : '') + '</td><td>' + formatDate(holdExpiryDate(o)) + '</td><td>' + formatPeso(o.feeAmount) + '</td></tr>';
  }).join('');
  return cardHTML('Upcoming scheduled holds', '', '', (chips ? '<div style="margin-bottom:14px;">' + chips + '</div>' : '') +
    (list.length ? '<div class="table-wrap"><table><thead><tr><th>Date and window</th><th>Parcel</th><th>Buyer</th><th>Address</th><th>Hold expires</th><th>Fee</th></tr></thead><tbody>' + rows + '</tbody></table></div>' : emptyState('calendar-days', 'No scheduled holds', 'Scheduled holds appear here after a buyer confirms Schedule & Hold.')));
}

/* ----- H. Fee calculator and service fees ----- */
function calcResultHTML() {
  const c = ui.calc;
  const value = parseFloat(c.value);
  if (isNaN(value) || value <= 0) { return notice('error', 'circle-alert', 'Enter an order value greater than zero.'); }
  if (!c.arrival) { return notice('error', 'circle-alert', 'Choose the hub arrival date.'); }
  const arrival = parseDateKey(c.arrival);
  const expiry = addDays(arrival, MAX_HOLD_DAYS);
  let message = '';
  let dateForTable = c.delivery;
  if (c.delivery) {
    const d = parseDateKey(c.delivery);
    if (d < arrival) { message = notice('error', 'circle-alert', 'The delivery date cannot be before the hub arrival date.'); dateForTable = ''; }
    else if (d > expiry) { message = notice('error', 'circle-alert', 'This date is beyond the 3-calendar-day holding period. Choose a date on or before ' + formatDate(expiry) + '.'); dateForTable = ''; }
    else { message = notice('success', 'circle-check', 'Delivery date is inside the holding period.'); }
  }
  return message + feeBreakdownHTML(value, dateForTable, expiry);
}

function renderAdminFees() {
  if (!ui.calc.arrival) { ui.calc.arrival = toDateKey(startOfDay(now())); ui.calc.delivery = toDateKey(addDays(startOfDay(now()), 1)); }
  const paid = state.orders.filter(function (o) { return o.feeApplied; });
  const total = round2(paid.reduce(function (s, o) { return s + o.feeAmount; }, 0));
  const rows = paid.map(function (o) {
    return '<tr><td class="cell-strong">' + o.id + '</td><td>' + escapeHTML(o.buyer) + '</td><td>' + formatPeso(o.value) + '</td><td>' + formatPeso(o.feeAmount) + '</td><td>' + badge(o.status) + '</td></tr>';
  }).join('');
  const calc = '<div class="form-group"><label for="calc-value">Total order value (₱)</label><input type="number" id="calc-value" min="0" step="0.01" value="' + escapeHTML(ui.calc.value) + '" data-oninput="calc-input" data-field="value"></div>' +
    '<div class="form-row"><div class="form-group"><label for="calc-arrival">Hub arrival date</label><input type="date" id="calc-arrival" value="' + ui.calc.arrival + '" data-oninput="calc-input" data-field="arrival"></div>' +
    '<div class="form-group"><label for="calc-delivery">Delivery date</label><input type="date" id="calc-delivery" value="' + ui.calc.delivery + '" data-oninput="calc-input" data-field="delivery"></div></div>' +
    '<div id="calc-result">' + calcResultHTML() + '</div>' +
    '<p class="hint">Service Fee = Total Order Value × 0.03. Example: ₱2,000.00 gives a ₱60.00 fee and a ₱2,060.00 total.</p>';
  return '<div class="stats-grid">' + statCard('banknote', 'Fees recorded', formatPeso(total), 'green') + statCard('package', 'Parcels with a fee', paid.length) + statCard('percent', 'Service fee rate', '3%') + '</div>' +
    '<div class="two-col">' + cardHTML('Schedule & Hold fee calculator', 'Updates as you type.', '', calc) +
    cardHTML('Fee transactions', 'Local records', '', paid.length ? '<div class="table-wrap"><table><thead><tr><th>Order</th><th>Buyer</th><th>Order value</th><th>Fee</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table></div>' : emptyState('banknote', 'No fees yet', 'Fees appear after a buyer confirms Schedule & Hold.'), true) + '</div>';
}

function renderAdminReports() {
  const s = adminStats();
  const methods = ['Consolidate & Combine', 'Schedule & Hold', 'Standard Dispatch'].map(function (m, i) {
    return { label: m.split(' ')[0] + ' ' + m.split(' ')[1], value: state.orders.filter(function (o) { return o.method === m; }).length, color: ['', 'amber', 'green'][i] };
  });
  const weekly = Array.from({ length: 7 }, function (_, i) {
    const day = addDays(startOfDay(now()), i - 6);
    const key = toDateKey(day);
    const delivered = state.orders.reduce(function (total, o) {
      return total + o.events.filter(function (event) { return event.title === 'Delivered' && toDateKey(new Date(event.time)) === key; }).length;
    }, 0);
    return { label: formatWeekday(day), value: delivered };
  });
  const feeBars = state.orders.filter(function (o) { return o.feeApplied; }).map(function (o) { return { label: o.id, value: o.feeAmount, color: 'green' }; });
  return '<div class="page-actions"><span class="muted small">Charts use simple CSS and JavaScript.</span>' + sampleTag() + '</div><div class="two-col">' +
    cardHTML('Delivery option chosen', 'Based on current workspace orders', '', barChartHTML(methods)) +
    cardHTML('Deliveries per day', 'Recorded delivery events from the last 7 days', '', columnChartHTML(weekly)) + '</div>' +
    cardHTML('Service fee per order', 'Total ' + formatPeso(s.fees), '', feeBars.length ? barChartHTML(feeBars) : emptyState('banknote', 'No fees yet', ''));
}

/* ===========================================================
   Screen registry: which function draws which screen
   =========================================================== */
const PAGES = {
  buyer: { dashboard: renderBuyerDashboard, orders: renderBuyerOrders, track: renderTrack, hub: renderHub, schedule: renderSchedule, addresses: renderAddresses, notifications: renderNotifications, profile: renderProfile },
  seller: { dashboard: renderSellerDashboard, orders: renderSellerOrders, packing: renderPacking, consolidation: renderConsolidation, shipments: renderShipments, history: renderHistory },
  admin: { overview: renderAdminOverview, parcels: renderAdminParcels, verification: renderAdminVerification, addresses: renderAdminAddresses, hubs: renderAdminHubs, consolidation: renderConsolidation, schedules: renderAdminSchedules, fees: renderAdminFees, reports: renderAdminReports }
};

/* ===========================================================
   10. ACTIONS (BUTTONS) AND EVENTS
   -----------------------------------------------------------
   Buttons use data-action="name". One click listener at the bottom
   finds the name and runs the matching function in clickActions.
   =========================================================== */

/* ----- Login and registration ----- */
function isValidContact(value) {
  const v = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || /^(09|\+639)\d{9}$/.test(v.replace(/[\s-]/g, ''));
}
function setFieldError(id, message) {
  el(id + '-error').textContent = message || '';
  el(id).classList.toggle('invalid', !!message);
  el(id).setAttribute('aria-invalid', message ? 'true' : 'false');
}

let loginSubmitting = false;
const LOCAL_TEST_PASSWORD = 'HubLink-Local-2026';

function setupLocalTestAccount() {
  const host = window.location.hostname;
  const isLocal = window.location.protocol === 'file:' || host === 'localhost' || host === '127.0.0.1' || host === '::1';
  el('use-test-account').classList.toggle('hidden', !isLocal);
}

function fillLocalTestAccount() {
  const role = el('login-role').value;
  const accounts = {
    buyer: 'buyer.test@hublink.local',
    seller: 'seller.test@hublink.local',
    admin: 'admin.test@hublink.local'
  };
  el('login-id').value = accounts[role];
  el('login-password').value = LOCAL_TEST_PASSWORD;
  setFieldError('login-id', '');
  setFieldError('login-password', '');
  el('test-account-message').textContent = 'Filled the ' + ROLE_INFO[role].label + ' local workspace fields. Review them, then select Log in. No account lookup is performed.';
  el('login-id').focus();
}

function startSession(role, name, contact) {
  state.session = { loggedIn: true, role: role, name: name, contact: contact };
  state.page = NAV[role][0].id;
  ui.hubResult = '';
  ui.openMenu = null;
  saveState();
  renderApp();
  window.scrollTo(0, 0);
  toast(ROLE_INFO[role].label + ' local workspace opened. Authentication is not connected.', 'info');
}

function handleLogin(e) {
  e.preventDefault();
  if (loginSubmitting) { return; }
  loginSubmitting = true;
  const submitButton = el('login-submit');
  submitButton.disabled = true;
  submitButton.textContent = 'Checking…';
  const id = el('login-id').value;
  const pw = el('login-password').value;
  let ok = true;
  setFieldError('login-id', ''); setFieldError('login-password', '');
  if (!id.trim()) { setFieldError('login-id', 'Enter your email or mobile number.'); ok = false; }
  else if (!isValidContact(id)) { setFieldError('login-id', 'Use a valid email or a PH mobile number (09XXXXXXXXX).'); ok = false; }
  if (pw.length < 6) { setFieldError('login-password', 'Password must have at least 6 characters.'); ok = false; }
  if (!ok) {
    loginSubmitting = false;
    submitButton.disabled = false;
    submitButton.textContent = 'Log in';
    const firstInvalid = document.querySelector('#login-form .invalid');
    if (firstInvalid) { firstInvalid.focus(); }
    return;
  }
  const role = el('login-role').value;
  startSession(role, role === 'buyer' ? 'Maria Santos' : ROLE_INFO[role].name, id.trim());
}

function handleRegister(e) {
  e.preventDefault();
  const name = el('reg-name').value.trim();
  const id = el('reg-id').value;
  const pw = el('reg-password').value;
  const confirm = el('reg-confirm').value;
  let ok = true;
  ['reg-name', 'reg-id', 'reg-password', 'reg-confirm'].forEach(function (f) { setFieldError(f, ''); });
  if (name.length < 2) { setFieldError('reg-name', 'Enter your full name.'); ok = false; }
  if (!id.trim() || !isValidContact(id)) { setFieldError('reg-id', 'Use a valid email or a PH mobile number (09XXXXXXXXX).'); ok = false; }
  if (pw.length < 6) { setFieldError('reg-password', 'Use at least 6 characters.'); ok = false; }
  if (confirm !== pw) { setFieldError('reg-confirm', 'Passwords do not match.'); ok = false; }
  if (!ok) { return; }
  startSession(el('reg-role').value, name, id.trim());
}

/* ----- Workflow clock ----- */
function openClockModal() {
  openModal({
    title: 'Workflow clock',
    body: '<p>This local clock controls order deadlines and holding periods in this browser.</p>' +
      '<div class="summary-item" style="margin:14px 0;"><div class="k">Current workflow time</div><div class="v">' + formatDateTime(now()) + '</div></div>' +
      '<div class="btn-row"><button class="btn btn-secondary" data-action="clock-advance" data-hours="12">+12 hours</button><button class="btn btn-secondary" data-action="clock-advance" data-hours="24">+1 day</button></div>' +
      '<p class="hint">Moving 12 hours forward makes undecided parcels default to Standard Dispatch. Moving days forward can end a hold period.</p>',
    buttons: [{ label: 'Close', cls: 'btn-secondary' }]
  });
}

function advanceClock(hours, fromModal) {
  state.demoNow = toLocalISO(addHours(now(), hours));
  const defaulted = checkDeadlines();
  refreshAll();
  toast('Workflow clock moved forward ' + hours + ' hours.' + (defaulted ? ' ' + defaulted + ' parcel(s) defaulted to Standard Dispatch.' : ''), defaulted ? 'warning' : 'info');
  if (fromModal) { openClockModal(); }
}

function resetDemo() {
  confirmDialog('Restore local records', 'This restores the locally stored orders, addresses, and notifications. Your current session stays active.', function () {
    const session = state.session;
    const page = state.page;
    state = createInitialState();
    state.session = session;
    state.page = page;
    ui.hubSelection = null; ui.hubOption = null; ui.hubResult = ''; ui.trackId = null; ui.schedOrderId = null;
    ui.addrForm = { id: null, label: '', recipient: '', contact: '', address: '', lat: '', lng: '' };
    ui.addrResult = null; ui.idPreview = null; ui.faceDone = false;
    checkDeadlines();
    refreshAll();
    toast('Local records were restored.', 'success');
  }, 'Reset data', true);
}

/* ----- Checkout (Rule 1: Verified Buyers only) ----- */
function openCheckout() {
  const v = myVerification();
  if (v.status !== 'verified') {
    openModal({
      title: 'Checkout is locked',
      body: notice('error', 'shield-check', '<strong>Only Verified Buyers can check out.</strong><p>Your status: ' + verificationBadge(v.status) + '</p>'),
      buttons: [{ label: 'Close', cls: 'btn-secondary' }, { label: 'Go to verification', cls: 'btn-primary', onClick: function () { goTo('profile'); } }]
    });
    return;
  }
  const addresses = state.addresses.filter(function (a) { return a.owner === BUYER_NAME && a.status === 'verified'; });
  if (!addresses.length) {
    openModal({
      title: 'No verified address',
      body: notice('error', 'map-pin', '<strong>Address checks must pass first.</strong><p>Complete the address fields and provide coordinates. Selecting a map point alone does not verify an address.</p>'),
      buttons: [{ label: 'Close', cls: 'btn-secondary' }, { label: 'Go to addresses', cls: 'btn-primary', onClick: function () { goTo('addresses'); } }]
    });
    return;
  }
  const products = PRODUCTS.map(function (p, i) { return '<option value="' + i + '">' + p.name + ' - ' + p.seller + ' (' + formatPeso(p.price) + ')</option>'; }).join('');
  const addrOptions = addresses.map(function (a) { return '<option value="' + a.id + '">' + escapeHTML(a.label) + ': ' + escapeHTML(a.address) + '</option>'; }).join('');
  openModal({
    title: 'Place order',
    body: '<div class="form-group"><label for="co-product">Product (required)</label><select id="co-product">' + products + '</select></div>' +
      '<div class="form-group"><label for="co-qty">Quantity (1–10)</label><input type="number" id="co-qty" min="1" max="10" step="1" value="1" aria-describedby="co-qty-error"><p class="field-error" id="co-qty-error"></p></div>' +
      '<div class="form-group"><label for="co-address">Delivery address (verified only)</label><select id="co-address">' + addrOptions + '</select></div>' +
      '<p class="hint">This local checkout records an order in this browser. No payment is processed.</p>',
    buttons: [
      { label: 'Cancel', cls: 'btn-secondary' },
      {
        label: 'Place order', cls: 'btn-primary', keepOpen: true,
        onClick: function () {
          const qty = Number(el('co-qty').value);
          if (!Number.isInteger(qty) || qty < 1 || qty > 10) {
            el('co-qty').setAttribute('aria-invalid', 'true');
            el('co-qty-error').textContent = 'Enter a whole number from 1 to 10.';
            el('co-qty').focus();
            return;
          }
          el('co-qty').setAttribute('aria-invalid', 'false');
          const product = PRODUCTS[parseInt(el('co-product').value, 10)];
          const id = 'ORD-' + state.counters.order;
          state.counters.order += 1;
          state.counters.tracking += 1;
          const order = makeOrder({ id: id, seller: product.seller, items: product.name + ' x' + qty, value: product.price * qty, addressId: el('co-address').value,
            tracking: 'PH-LGX-' + state.counters.tracking, status: 'Processing', stage: 1, ageHours: 0 }, function () { return state.demoNow; });
          state.orders.push(order);
          addNotification('seller', 'hub', 'New order received', id + ' is waiting to be packed.');
          closeModal();
          refreshAll();
          toast('Order ' + id + ' placed. The seller will pack it next.', 'success');
        }
      }
    ]
  });
}

/* ----- Receipts ----- */
function showReceiptModal(id) {
  const o = getOrder(id);
  openModal({
    title: 'Receipt for ' + o.id, wide: true, body: receiptHTML(o),
    buttons: [{ label: 'Close', cls: 'btn-secondary' }, { label: 'Print receipt', cls: 'btn-primary', keepOpen: true, onClick: function () { printReceipt(id); } }]
  });
}
// Uses the browser's print function; CSS hides everything except the receipt
function printReceipt(id) {
  el('print-area').innerHTML = receiptHTML(getOrder(id));
  window.print();
}

/* ----- Hub decision confirmations ----- */
function finishHub(messageHTML, toastText) {
  ui.hubResult = messageHTML;
  ui.hubSelection = null;
  ui.hubOption = null;
  refreshAll();
  toast(toastText, 'success');
}

function confirmConsolidate() {
  const selected = getHubSelected();
  const check = canConsolidate(selected);
  ui.hubOption = 'consolidate';
  if (!check.ok) { toast(check.reason, 'error'); renderPage(true); return; }
  const ids = selected.map(function (o) { return o.id; });
  confirmDialog('Confirm Consolidate & Combine', 'Combine ' + ids.join(', ') + ' into one delivery for the same verified address? <strong>No additional service fee.</strong>', function () {
    const groupId = applyConsolidation(ids);
    if (groupId) { finishHub('<strong>Consolidation confirmed.</strong> ' + ids.join(', ') + ' are now in group ' + groupId + '. Status: Consolidated. No service fee.', 'Parcels consolidated.'); }
  }, 'Confirm consolidation');
}

function confirmSchedule() {
  const selected = getHubSelected();
  ui.hubOption = 'schedule';
  const error = selected.length ? validateScheduleDate(selected, ui.hubDate) : 'Select at least one parcel.';
  if (error) { toast(error, 'error'); renderPage(true); return; }
  const ids = selected.map(function (o) { return o.id; });
  const total = selected.reduce(function (s, o) { return s + o.value; }, 0);
  const fee = calcFee(total);
  const date = ui.hubDate;
  const windowIndex = ui.hubWindow;
  confirmDialog('Confirm Schedule & Hold',
    'Deliver ' + ids.join(', ') + ' on <strong>' + formatDate(parseDateKey(date)) + '</strong> (' + TIME_WINDOWS[windowIndex] + ').<br><br>' +
    'Order value ' + formatPeso(total) + ' + 3% service fee ' + formatPeso(fee) + ' = <strong>' + formatPeso(round2(total + fee)) + '</strong>.',
    function () {
      if (applySchedule(ids, date, windowIndex, false)) {
        finishHub('<strong>Scheduled Hold confirmed.</strong> ' + ids.join(', ') + ' will be delivered on ' + formatDate(parseDateKey(date)) + ' (' + TIME_WINDOWS[windowIndex] + '). The 3% service fee of ' + formatPeso(fee) + ' has been applied. Status: Scheduled Hold.', 'Schedule confirmed. Service fee applied.');
      }
    }, 'Confirm and apply fee');
}

function confirmStandard() {
  const selected = getHubSelected();
  ui.hubOption = 'standard';
  if (!selected.length) { toast('Select at least one parcel.', 'error'); renderPage(true); return; }
  const ids = selected.map(function (o) { return o.id; });
  confirmDialog('Confirm Standard Dispatch', 'Apply Standard Dispatch to ' + ids.join(', ') + '? No specific delivery time is recorded. <strong>No additional service fee.</strong>', function () {
    applyStandardDispatch(ids, false);
    finishHub('<strong>Standard Dispatch confirmed.</strong> ' + ids.join(', ') + ' are recorded as Out for Delivery. No service fee was added.', 'Standard Dispatch confirmed.');
  }, 'Confirm dispatch');
}

/* ----- Delivery scheduling and missed deliveries ----- */
function confirmScheduleForm() {
  const o = getOrder(ui.schedOrderId);
  const error = validateScheduleDate([o], ui.schedDate);
  if (error) { toast(error, 'error'); return; }
  const isNew = o.status === 'Awaiting Instruction';
  const date = ui.schedDate;
  const windowIndex = ui.schedWindow;
  const fee = calcFee(o.value);
  confirmDialog(isNew ? 'Confirm schedule' : 'Confirm reschedule',
    o.id + ' will be delivered on <strong>' + formatDate(parseDateKey(date)) + '</strong> (' + TIME_WINDOWS[windowIndex] + ').' + (isNew ? '<br><br>A 3% service fee of <strong>' + formatPeso(fee) + '</strong> applies.' : '<br><br>No new fee is charged.'),
    function () {
      if (applySchedule([o.id], date, windowIndex, !isNew)) {
        refreshAll();
        toast(isNew ? 'Schedule confirmed. Service fee applied.' : 'Delivery rescheduled.', 'success');
      }
    }, isNew ? 'Confirm schedule' : 'Confirm reschedule');
}

function confirmReschedule(id) {
  const date = el('resched-date-' + id).value;
  const windowIndex = parseInt(el('resched-window-' + id).value, 10);
  const o = getOrder(id);
  const error = validateScheduleDate([o], date);
  if (error) { toast(error, 'error'); return; }
  confirmDialog('Confirm reschedule', o.id + ' will be delivered on <strong>' + formatDate(parseDateKey(date)) + '</strong> (' + TIME_WINDOWS[windowIndex] + '). No new fee is charged.', function () {
    if (applySchedule([id], date, windowIndex, true)) { refreshAll(); toast('Delivery rescheduled.', 'success'); }
  }, 'Confirm reschedule');
}

function confirmMissed(id) {
  confirmDialog('Record a missed delivery', 'Record a failed attempt for ' + id + '. The parcel stays at the hub and can be rescheduled. It is <strong>not</strong> returned to the seller.', function () {
    simulateMissedDelivery(id);
    refreshAll();
    toast('Missed delivery recorded. The buyer can reschedule.', 'warning');
  }, 'Record missed delivery', true);
}

/* ----- Addresses ----- */
function validateAddressForm() {
  const result = validateAddressData(ui.addrForm);
  ui.addrResult = result;
  return result;
}

function saveAddress() {
  const f = ui.addrForm;
  const result = validateAddressForm();
  if (!f.recipient.trim() && !f.address.trim() && !f.contact.trim()) { ui.addrResult = { ok: false, problems: ['Fill in the form before saving.'] }; renderPage(true); focusAddressError(); toast('Fill in the required address details before saving.', 'error'); return; }
  const record = {
    label: f.label.trim() || 'Address', recipient: f.recipient.trim(), contact: f.contact.trim(), address: f.address.trim(), lat: f.lat, lng: f.lng,
    status: result.ok ? 'verified' : 'needs_correction', note: result.ok ? '' : result.problems[0]
  };
  if (f.id) {
    const existing = getAddress(f.id);
    if (!existing || existing.owner !== BUYER_NAME) { toast('This saved address is no longer available to edit.', 'error'); return; }
    Object.assign(existing, record);
  } else {
    state.addresses.push(Object.assign({ id: nextAddressId(), owner: BUYER_NAME }, record));
  }
  addNotification('buyer', 'address', result.ok ? 'Address checks passed' : 'Address needs correction', record.label + (result.ok ? ' passed local field and coordinate checks.' : ' did not pass: ' + result.problems[0]));
  ui.addrForm = { id: null, label: '', recipient: '', contact: '', address: '', lat: '', lng: '' };
  ui.addrResult = null;
  refreshAll();
  toast(result.ok ? 'Address saved: local checks passed.' : 'Address saved, but it needs correction.', result.ok ? 'success' : 'warning');
}

function nextAddressId() {
  const usedAddressIds = state.addresses.map(function (address) { return address.id; })
    .concat(state.orders.map(function (order) { return order.addressId; }));
  const largestExistingId = usedAddressIds.reduce(function (largest, id) {
    const match = /^ADDR-(\d+)$/.exec(id || '');
    return match ? Math.max(largest, Number(match[1])) : largest;
  }, 0);
  let addressNumber = Math.max(Number(state.counters.address) || 1, largestExistingId + 1);
  while (usedAddressIds.indexOf('ADDR-' + addressNumber) !== -1) { addressNumber += 1; }
  state.counters.address = addressNumber + 1;
  return 'ADDR-' + addressNumber;
}

function focusAddressError() {
  if (!ui.addrResult || !ui.addrResult.problems.length) { return; }
  const problem = ui.addrResult.problems[0];
  const id = problem.indexOf('recipient') !== -1 || problem.indexOf('Fill in the form') !== -1 ? 'af-recipient' :
    problem.indexOf('Contact number') !== -1 ? 'af-contact' :
      problem.indexOf('Address is too short') !== -1 ? 'af-address' : 'af-lat';
  const input = el(id);
  if (input) { input.focus(); }
}

function revalidateSavedAddress(id, notifyOwner) {
  const a = getAddress(id);
  const result = validateAddressData(a);
  a.status = result.ok ? 'verified' : 'needs_correction';
  a.note = result.ok ? '' : result.problems[0];
  if (notifyOwner && a.owner === BUYER_NAME) {
    addNotification('buyer', 'address', result.ok ? 'Address checks passed' : 'Address needs correction', a.label + (result.ok ? ' passed local field and coordinate checks.' : ' did not pass: ' + result.problems[0]));
  }
  return result;
}

/* ----- Verification ----- */
function setVerificationStatus(v, status) {
  v.status = status;
  v.reason = status === 'rejected' ? 'Local review marked the submitted image unclear.' : '';
  const titles = { pending: 'Verification pending', verified: 'Verification approved', rejected: 'Verification rejected', none: 'Verification reset' };
  const texts = { pending: 'Your verification is under review.', verified: 'You are now a Verified Buyer and can check out.', rejected: 'Your verification was rejected. Please submit again.', none: 'Your verification status was reset.' };
  if (v.isYou) { addNotification('buyer', 'verification', titles[status], texts[status]); }
  refreshAll();
  toast(v.name + ': ' + VERIFICATION_LABELS[status][0], status === 'rejected' ? 'warning' : 'success');
}

/* ----- Seller packing and handover ----- */
function advancePacking(id) {
  const o = getOrder(id);
  const steps = {
    1: ['Mark as packed', 'Confirm that ' + id + ' is packed and sealed?'],
    2: ['Mark ready to ship', 'Print the shipping label and mark ' + id + ' as ready to ship?'],
    3: ['Confirm handover', 'Confirm that ' + id + ' was handed over to the logistics rider? It will move to In Transit.']
  }[o.stage];
  confirmDialog(steps[0], steps[1], function () {
    if (o.stage === 1) { o.stage = 2; addEvent(o, 'Packed by seller', 'Parcel packed and sealed.'); }
    else if (o.stage === 2) { o.stage = 3; addEvent(o, 'Ready to ship', 'Shipping label printed.'); }
    else {
      o.stage = 5; o.status = 'In Transit';
      assignRider(o);
      addEvent(o, 'Parcel handed over', 'Handed to ' + o.rider + ' (' + o.vehicle + ').');
      addEvent(o, 'In transit', 'Parcel is on its way to the local hub.');
      notifyBuyerIfDemo(o, 'shipping', 'Parcel in transit', o.id + ' was handed over and is on its way.');
    }
    refreshAll();
    toast(steps[0] + ' done for ' + id + '.', 'success');
  }, steps[0]);
}

/* ----- Administrator actions ----- */
function requestAdminStatus(id, to) {
  const o = getOrder(id);
  const next = { hub: 'Awaiting Instruction', out: 'Out for Delivery', delivered: 'Delivered' }[to];
  if (!o || !next) { toast('This status update is not available.', 'error'); return; }
  const effect = to === 'hub' ? 'This starts the buyer’s 12-hour delivery decision window.' :
    to === 'out' ? 'This records the parcel as Out for Delivery.' : 'This records the parcel as delivered.';
  confirmDialog('Update shipment status', 'Change ' + o.tracking + ' from <strong>' + escapeHTML(o.status) + '</strong> to <strong>' + next + '</strong>? ' + effect,
    function () { adminSetStatus(id, to); }, 'Confirm status update');
}

function adminSetStatus(id, to) {
  const o = getOrder(id);
  if (to === 'hub') {
    o.status = 'Awaiting Instruction';
    o.hubArrival = state.demoNow;
    addEvent(o, 'Arrived at local hub', o.hub + '. 12-hour decision window started.');
    notifyBuyerIfDemo(o, 'hub', 'Parcel arrived at your hub', o.id + ' is waiting. Choose a delivery option within 12 hours.');
  } else if (to === 'out') {
    o.status = 'Out for Delivery';
    assignRider(o);
    addEvent(o, 'Out for delivery', 'Rider ' + o.rider + ' (' + o.vehicle + ').');
    const deliveryWindow = o.method === 'Schedule & Hold' && o.timeWindow ? ' (' + o.timeWindow + ')' : '';
    notifyBuyerIfDemo(o, 'out', 'Out for delivery', o.id + ' is out for delivery' + deliveryWindow + '.');
  } else if (to === 'delivered') {
    o.status = 'Delivered';
    o.deliveredAt = state.demoNow;
    addEvent(o, 'Delivered', 'Received by recipient.');
    notifyBuyerIfDemo(o, 'delivered', 'Delivery completed', o.id + ' was delivered. Your receipt is ready.');
  }
  closeModal();
  refreshAll();
  showOrderDetails(id, true);
  toast('Status updated to ' + o.status + '.', 'success');
}

function openRtsDialog(id) {
  const o = getOrder(id);
  openModal({
    title: 'Return ' + id + ' to seller',
    body: '<p>Return-to-Seller is only allowed after the hold expires, the buyer refuses, or the parcel is unclaimed after expiry.</p>' +
      '<p class="small muted" style="margin-top:6px;">Hold ' + (isHoldExpired(o) ? 'has expired' : 'ends ' + formatDate(holdExpiryDate(o))) + '.</p>' +
      '<div class="form-group" style="margin-top:14px;"><label for="rts-reason">Reason</label><select id="rts-reason"><option value="expired">Hold period expired</option><option value="refused">Buyer refused the delivery</option><option value="unclaimed">Parcel unclaimed after expiry</option></select></div>',
    buttons: [
      { label: 'Cancel', cls: 'btn-secondary' },
      {
        label: 'Return to seller', cls: 'btn-danger', keepOpen: true,
        onClick: function () {
          if (returnToSeller(id, el('rts-reason').value)) { closeModal(); refreshAll(); toast(id + ' returned to seller.', 'success'); }
        }
      }
    ]
  });
}

function adminAddressOp(id, op) {
  const a = getAddress(id);
  if (op === 'validate') {
    const r = revalidateSavedAddress(id, true);
    toast(r.ok ? a.label + ': Local checks passed.' : a.label + ': Address needs correction.', r.ok ? 'success' : 'warning');
  } else if (op === 'approve') {
    const r = validateAddressData(a);
    if (!r.ok) { toast('This address fails the local checks. Ask the buyer to correct it first.', 'error'); return; }
    revalidateSavedAddress(id, true);
    toast('Address approved.', 'success');
  } else {
    a.status = 'needs_correction';
    a.note = 'Flagged by administrator for correction.';
    if (a.owner === BUYER_NAME) { addNotification('buyer', 'address', 'Address needs correction', a.label + ' was flagged by an administrator.'); }
    toast('Address flagged for correction.', 'warning');
  }
  refreshAll();
}

function checkConsolidationPair() {
  const a = getOrder(el('chk-a').value);
  const b = getOrder(el('chk-b').value);
  let html;
  if (!a || !b) { html = notice('error', 'circle-alert', 'Choose two parcels.'); }
  else if (a.id === b.id) { html = notice('error', 'circle-alert', 'Choose two different parcels.'); }
  else if (a.buyer !== b.buyer) { html = notice('error', 'circle-x', '<strong>Not eligible.</strong> The parcels belong to different buyers.'); }
  else if (a.addressId !== b.addressId) { html = notice('error', 'circle-x', '<strong>Not eligible.</strong> The delivery addresses are different.'); }
  else if (!isBuyerVerified(a.buyer)) { html = notice('error', 'circle-x', '<strong>Not eligible.</strong> The buyer is not verified.'); }
  else if ((getAddress(a.addressId) || {}).status !== 'verified') { html = notice('error', 'circle-x', '<strong>Not eligible.</strong> The delivery address is not verified.'); }
  else { html = notice('success', 'circle-check', '<strong>Eligible.</strong> Same verified buyer and same verified delivery address. No additional service fee.'); }
  el('chk-result').innerHTML = html;
  refreshIcons();
}

/* ----- Click actions table ----- */
const clickActions = {
  'auth-tab': function (b) {
    ui.authTab = b.dataset.tab;
    el('login-form').classList.toggle('hidden', ui.authTab !== 'login');
    el('register-form').classList.toggle('hidden', ui.authTab !== 'register');
    el('tab-login').classList.toggle('active', ui.authTab === 'login');
    el('tab-register').classList.toggle('active', ui.authTab === 'register');
  },
  'toggle-login-password': function (b) {
    const password = el('login-password');
    const show = password.type === 'password';
    password.type = show ? 'text' : 'password';
    b.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    b.setAttribute('aria-pressed', show ? 'true' : 'false');
    b.innerHTML = icon(show ? 'eye-off' : 'eye');
    refreshIcons();
    password.focus();
  },
  'use-test-account': function () { fillLocalTestAccount(); },
  'clear-table-filters': function (b) {
    const f = ui.filters[b.dataset.table];
    if (!f) { return; }
    f.search = ''; f.status = 'All Orders';
    renderPage(true);
  },
  'table-sort': function (b) {
    const f = ui.filters[b.dataset.table];
    if (!f) { return; }
    f.sortDir = f.sortBy === b.dataset.sort && f.sortDir === 'asc' ? 'desc' : 'asc';
    f.sortBy = b.dataset.sort;
    refreshTable(b.dataset.table);
  },
  'nav': function (b) { goTo(b.dataset.page); },
  'toggle-sidebar': function () {
    if (window.innerWidth <= 900) {
      el('sidebar').classList.toggle('open');
      el('sidebar-backdrop').classList.toggle('open');
      syncSidebarState();
    } else { el('sidebar').classList.toggle('collapsed'); }
  },
  'close-sidebar': function () { el('sidebar').classList.remove('open'); el('sidebar-backdrop').classList.remove('open'); syncSidebarState(); },
  'pwa-install': function () { showInstallPrompt(); },
  'toggle-bell': function () { ui.openMenu = ui.openMenu === 'bell' ? null : 'bell'; renderTopbar(); },
  'toggle-profile': function () { ui.openMenu = ui.openMenu === 'profile' ? null : 'profile'; renderTopbar(); },
  'go-profile': function () {
    ui.openMenu = null;
    if (state.session.role === 'buyer') { goTo('profile'); } else { renderTopbar(); toast('Switch to the Buyer role to see the profile and verification screen.', 'info'); }
  },
  'logout': function () {
    state.session.loggedIn = false;
    loginSubmitting = false;
    el('login-submit').disabled = false;
    el('login-submit').textContent = 'Log in';
    ui.openMenu = null; saveState(); renderApp(); toast('You are logged out.', 'info');
  },
  'reset-demo': function () { ui.openMenu = null; renderTopbar(); resetDemo(); },
  'open-clock': function () { ui.openMenu = null; renderTopbar(); openClockModal(); },
  'clock-advance': function (b) { advanceClock(parseInt(b.dataset.hours, 10), !!b.closest('.modal')); },
  'close-modal': function () { closeModal(); },
  'modal-button': function (b) {
    const button = ui.modalButtons[parseInt(b.dataset.index, 10)];
    if (!button.keepOpen) { closeModal(); }
    if (button.onClick) { button.onClick(); }
  },

  // Notifications
  'notif-toggle': function (b) {
    const n = state.notifications.buyer.find(function (x) { return x.id === b.dataset.id; });
    n.read = !n.read; refreshAll();
  },
  'notif-open': function (b) {
    const list = state.notifications[state.session.role];
    const n = list.find(function (x) { return x.id === b.dataset.id; });
    if (n) { n.read = true; }
    saveState(); renderTopbar(); renderPage(true);
  },
  'notif-read-all': function () { state.notifications[state.session.role].forEach(function (n) { n.read = true; }); refreshAll(); toast('All notifications marked as read.', 'success'); },
  'notif-filter': function (b) { ui.notifFilter = b.dataset.filter; renderPage(true); },

  // Orders, tracking, receipts
  'order-details': function (b) { showOrderDetails(b.dataset.id, false); },
  'order-track': function (b) { ui.trackId = b.dataset.id; goTo('track'); },
  'order-receipt': function (b) { showReceiptModal(b.dataset.id); },
  'print-receipt': function (b) { printReceipt(b.dataset.id); },
  'checkout-open': function () { openCheckout(); },
  'track-search': function () {
    const q = el('track-input').value.trim().toUpperCase();
    if (!q) { toast('Enter a tracking number.', 'error'); return; }
    const found = myOrders().find(function (o) { return o.tracking.toUpperCase() === q; });
    if (!found) { toast('No parcel with that tracking number was found in your orders.', 'error'); return; }
    ui.trackId = found.id; renderPage(true);
  },

  // Hub decisions
  'pick-option': function (b) { ui.hubOption = b.dataset.option; renderPage(true); },
  'hub-pick-date': function (b) { ui.hubDate = b.dataset.date; ui.hubOption = 'schedule'; renderPage(true); },
  'hub-pick-window': function (b) { ui.hubWindow = parseInt(b.dataset.window, 10); ui.hubOption = 'schedule'; renderPage(true); },
  'confirm-consolidate': function () { confirmConsolidate(); },
  'confirm-schedule': function () { confirmSchedule(); },
  'confirm-standard': function () { confirmStandard(); },

  // Delivery schedule
  'sched-pick-date': function (b) { ui.schedDate = b.dataset.date; renderPage(true); },
  'sched-pick-window': function (b) { ui.schedWindow = parseInt(b.dataset.window, 10); renderPage(true); },
  'sched-confirm': function () { confirmScheduleForm(); },
  'sched-reschedule': function (b) { ui.schedOrderId = b.dataset.id; ui.schedDate = ''; renderPage(true); window.scrollTo(0, 0); },
  'resched-confirm': function (b) { confirmReschedule(b.dataset.id); },
  'sim-missed': function (b) { closeModal(); confirmMissed(b.dataset.id); },

  // Addresses
  'addr-validate': function () { const result = validateAddressForm(); renderPage(true); if (!result.ok) { focusAddressError(); } },
  'addr-save': function () { saveAddress(); },
  'addr-clear': function () { ui.addrForm = { id: null, label: '', recipient: '', contact: '', address: '', lat: '', lng: '' }; ui.addrResult = null; renderPage(true); },
  'addr-edit': function (b) {
    const a = getAddress(b.dataset.id);
    ui.addrForm = { id: a.id, label: a.label, recipient: a.recipient, contact: a.contact, address: a.address, lat: String(a.lat), lng: String(a.lng) };
    ui.addrResult = null; renderPage(true);
  },
  'addr-revalidate': function (b) {
    const r = revalidateSavedAddress(b.dataset.id, true);
    refreshAll();
    toast(r.ok ? 'Address checks passed.' : 'Address needs correction: ' + r.problems[0], r.ok ? 'success' : 'warning');
  },
  'addr-delete': function (b) {
    const id = b.dataset.id;
    const inUse = state.orders.some(function (o) { return o.addressId === id && ['Delivered', 'Return to Seller'].indexOf(o.status) === -1; });
    if (inUse) { toast('This address is used by an active order and cannot be deleted.', 'error'); return; }
    confirmDialog('Delete address', 'Delete this saved address?', function () {
      state.addresses = state.addresses.filter(function (a) { return a.id !== id; });
      refreshAll(); toast('Address deleted.', 'success');
    }, 'Delete', true);
  },

  // Verification
  'face-check': function () { ui.faceDone = true; renderPage(true); toast('Local review step recorded. No biometric check was performed.', 'info'); },
  'submit-verification': function () {
    if (!ui.idPreview) { toast('Choose an image for the local preview first.', 'error'); return; }
    if (!ui.faceDone) { toast('Record the local review step first.', 'error'); return; }
    confirmDialog('Submit verification request', 'Submit the local image preview and review step for workflow review? No identity check will be performed.', function () {
      const v = myVerification();
      v.status = 'submitted'; v.reason = ''; v.submittedAt = state.demoNow;
      ui.idPreview = null; ui.faceDone = false;
      addNotification('admin', 'verification', 'New verification request', v.name + ' submitted a request for local workflow review.');
      addNotification('buyer', 'verification', 'Verification submitted', 'We received your verification. Review is pending.');
      refreshAll(); toast('Verification submitted.', 'success');
    }, 'Submit');
  },
  'ver-sim': function (b) { setVerificationStatus(myVerification(), b.dataset.status); },
  'ver-admin': function (b) {
    const v = state.verifications.find(function (x) { return x.id === b.dataset.id; });
    const status = b.dataset.status;
    confirmDialog('Update verification', 'Set ' + escapeHTML(v.name) + ' to "' + VERIFICATION_LABELS[status][0] + '"?', function () { setVerificationStatus(v, status); }, 'Confirm', status === 'rejected');
  },

  // Seller
  'pack-next': function (b) { advancePacking(b.dataset.id); },
  'view-label': function (b) { openModal({ title: 'Shipping label preview', body: labelHTML(getOrder(b.dataset.id)), buttons: [{ label: 'Close', cls: 'btn-secondary' }] }); },

  // Administrator
  'admin-manage': function (b) { showOrderDetails(b.dataset.id, true); },
  'seller-track': function (b) { showSellerShipment(b.dataset.id); },
  'admin-locate': function (b) { ui.mapOrderId = b.dataset.id; renderPage(true); },
  'admin-set': function (b) { requestAdminStatus(b.dataset.id, b.dataset.to); },
  'admin-rts': function (b) { closeModal(); openRtsDialog(b.dataset.id); },
  'addr-admin': function (b) { adminAddressOp(b.dataset.id, b.dataset.op); },
  'check-consolidation': function () { checkConsolidationPair(); }
};

// Defense in depth for the local prototype UI. These checks are not server
// authorization; role selection and all records still live in this browser.
const ACTION_ROLES = {
  'order-track': 'buyer', 'order-receipt': 'buyer', 'checkout-open': 'buyer', 'track-search': 'buyer',
  'pick-option': 'buyer', 'hub-pick-date': 'buyer', 'hub-pick-window': 'buyer', 'confirm-consolidate': 'buyer',
  'confirm-schedule': 'buyer', 'confirm-standard': 'buyer', 'sched-pick-date': 'buyer', 'sched-pick-window': 'buyer',
  'sched-confirm': 'buyer', 'sched-reschedule': 'buyer', 'resched-confirm': 'buyer', 'addr-validate': 'buyer',
  'addr-save': 'buyer', 'addr-clear': 'buyer', 'addr-edit': 'buyer', 'addr-revalidate': 'buyer', 'addr-delete': 'buyer',
  'face-check': 'buyer', 'submit-verification': 'buyer', 'ver-sim': 'buyer', 'notif-toggle': 'buyer', 'notif-filter': 'buyer', 'notif-read-all': 'buyer',
  'pack-next': 'seller', 'view-label': 'seller', 'seller-track': 'seller',
  'admin-locate': 'admin', 'admin-manage': 'admin', 'admin-set': 'admin', 'admin-rts': 'admin',
  'addr-admin': 'admin', 'ver-admin': 'admin', 'check-consolidation': 'admin',
  'sim-missed': ['buyer', 'admin']
};

function actionAllowedForRole(action, role) {
  const permitted = ACTION_ROLES[action];
  return !permitted || (Array.isArray(permitted) ? permitted.includes(role) : permitted === role);
}

/* ----- Change and input actions ----- */
const changeActions = {
  'role-switch': function (s) {
    if (!NAV[s.value]) { toast('Choose a valid workspace role.', 'error'); renderTopbar(); return; }
    state.session.role = s.value;
    state.page = NAV[s.value][0].id;
    ui.openMenu = null; ui.hubResult = '';
    saveState(); renderApp(); window.scrollTo(0, 0);
    toast('Now previewing the ' + ROLE_INFO[s.value].label + ' interface.', 'info');
  },
  'table-filter': function (s) { ui.filters[s.dataset.table].status = s.value; refreshTable(s.dataset.table); },
  'track-select': function (s) { ui.trackId = s.value; renderPage(true); },
  'hub-toggle': function (c) {
    const id = c.dataset.id;
    if (c.checked) { if (!ui.hubSelection.includes(id)) { ui.hubSelection.push(id); } }
    else { ui.hubSelection = ui.hubSelection.filter(function (x) { return x !== id; }); }
    renderPage(true);
  },
  'sched-order': function (s) { ui.schedOrderId = s.value; ui.schedDate = ''; renderPage(true); },
  'seller-filter': function (s) { ui.sellerFilter = s.value; renderPage(true); },
  'id-file': function (input) {
    const file = input.files && input.files[0];
    if (!file) { return; }
    if (file.type.indexOf('image/') !== 0) { toast('Please choose an image file.', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { toast('Image is too large. Use a file under 5 MB.', 'error'); return; }
    const reader = new FileReader();
    reader.onload = function () { ui.idPreview = reader.result; renderPage(true); };
    reader.readAsDataURL(file); // preview only, never uploaded anywhere
  }
};

const inputActions = {
  'table-search': function (i) { ui.filters[i.dataset.table].search = i.value; refreshTable(i.dataset.table); },
  'addr-field': function (i) {
    ui.addrForm[i.dataset.field] = i.value;
    ui.addrResult = null;
    i.setAttribute('aria-invalid', 'false');
    const error = el(i.id + '-error');
    if (error) { error.textContent = ''; }
    const result = el('addr-result');
    if (result) { result.innerHTML = ''; }
  },
  'calc-input': function (i) {
    ui.calc[i.dataset.field] = i.value;
    el('calc-result').innerHTML = calcResultHTML();
    refreshIcons();
  }
};

/* ----- Listeners (one for each event type) ----- */
document.addEventListener('click', function (e) {
  if (e.target.id === 'modal-backdrop') { closeModal(); return; }
  if (ui.openMenu && !e.target.closest('.dropdown-wrap')) { ui.openMenu = null; renderTopbar(); }
  const button = e.target.closest('[data-action]');
  if (!button) { return; }
  if (!actionAllowedForRole(button.dataset.action, state.session.role)) {
    toast('That action is not available in the current workspace.', 'error');
    return;
  }
  const fn = clickActions[button.dataset.action];
  if (fn) { fn(button, e); }
});

document.addEventListener('change', function (e) {
  const target = e.target.closest('[data-onchange]');
  if (target && changeActions[target.dataset.onchange]) { changeActions[target.dataset.onchange](target); }
});

document.addEventListener('input', function (e) {
  const target = e.target.closest('[data-oninput]');
  if (target && inputActions[target.dataset.oninput]) { inputActions[target.dataset.oninput](target); }
  if (e.target.id === 'login-id' || e.target.id === 'login-password') { el('test-account-message').textContent = ''; }
});

document.addEventListener('change', function (e) {
  if (e.target.id === 'login-role') { el('test-account-message').textContent = ''; }
});

document.addEventListener('keydown', function (e) {
  const dialog = el('modal-root').querySelector('[role="dialog"]');
  if (e.key === 'Escape' && dialog) { e.preventDefault(); closeModal(); return; }
  if (e.key === 'Escape' && el('sidebar').classList.contains('open')) {
    el('sidebar').classList.remove('open');
    el('sidebar-backdrop').classList.remove('open');
    syncSidebarState();
    const navToggle = document.querySelector('[data-action="toggle-sidebar"]');
    if (navToggle) { navToggle.focus(); }
    return;
  }
  if (e.key === 'Tab' && dialog) {
    const focusable = Array.from(dialog.querySelectorAll('a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'))
      .filter(function (node) { return !node.classList.contains('hidden'); });
    if (!focusable.length) { e.preventDefault(); dialog.focus(); return; }
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    return;
  }
  if (e.key === 'Escape' && ui.openMenu) { ui.openMenu = null; renderTopbar(); }
});

el('login-form').addEventListener('submit', handleLogin);
el('register-form').addEventListener('submit', handleRegister);
setupLocalTestAccount();

/* ===========================================================
   START
   =========================================================== */
checkDeadlines();   // applies the 12-hour default if the demo clock already passed a deadline
renderApp();
if (storageRecoveryNotice) { toast(storageRecoveryNotice, 'warning'); }
