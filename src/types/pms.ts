export * from './inventoryMenu';

export type OperationalStatus = 
  | 'Available' 
  | 'Reserved' 
  | 'Occupied' 
  | 'Dirty' 
  | 'Cleaning' 
  | 'Inspected' 
  | 'Out of Order' 
  | 'Out of Service' 
  | 'Blocked';

export type HousekeepingStatus = 
  | 'Clean' 
  | 'Dirty' 
  | 'Cleaning' 
  | 'Inspected' 
  | 'Touch Up';

export type ReservationStatus = 
  | 'Confirmed' 
  | 'Unconfirmed' 
  | 'Checked-In' 
  | 'Checked-Out' 
  | 'Cancelled' 
  | 'No-Show';

export type StayStatus = 
  | 'Active' 
  | 'Checked-Out' 
  | 'Transferred';

export type FolioStatus = 
  | 'Open' 
  | 'Closed' 
  | 'Settled'
  | 'Void';

export type FolioItemType = 
  | 'Room Charge' 
  | 'Restaurant' 
  | 'Room Service' 
  | 'Convention' 
  | 'Laundry' 
  | 'Spa/Wellness' 
  | 'Amenity' 
  | 'Discount' 
  | 'Tax' 
  | 'Service Charge' 
  | 'Adjustment';

export type PaymentMethod = 
  | 'Cash' 
  | 'Credit Card' 
  | 'Bank Transfer' 
  | 'Company Credit'
  | 'City Ledger'
  | 'bKash' 
  | 'Nagad' 
  | 'Rocket' 
  | 'City Bank POS';

export type PaymentStatus = 
  | 'Completed' 
  | 'Refunded' 
  | 'Partially Refunded' 
  | 'Void';

export type InvoiceStatus = 
  | 'Draft' 
  | 'Issued' 
  | 'Paid' 
  | 'Partially Paid' 
  | 'Cancelled';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type MaintenancePriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type MaintenanceStatus = 'Open' | 'Assigned' | 'In Progress' | 'Completed' | 'Closed';

export type EventStatus = 'Inquiry' | 'Confirmed' | 'Ongoing' | 'Completed' | 'Cancelled';

export type UserRoleName = 
  | 'Super Admin' 
  | 'General Manager' 
  | 'Front Office Manager' 
  | 'Front Desk' 
  | 'Accounts' 
  | 'Housekeeping' 
  | 'Maintenance' 
  | 'Event Manager' 
  | 'Restaurant Staff' 
  | 'POS Cashier'
  | 'POS User'
  | 'Management';

export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  role: UserRoleName;
  active: boolean;
  department?: string;
  avatar?: string;
  phone?: string;
  createdAt: string;
}

export type AccountCategory = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

export interface GLAccount {
  code: string;
  name: string;
  type: AccountCategory;
  category: string;
  description: string;
  balance: number;
  isSystem: boolean;
  department?: string;
  parentCode?: string;
  openingBalance?: number;
  normalBalance?: 'Debit' | 'Credit';
  isBankCash?: boolean;
  isDirectPostingAllowed?: boolean;
  isTaxApplicable?: boolean;
  status?: 'Active' | 'Inactive';
  createdAt?: string;
}

export interface JournalEntryItem {
  id: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  memo?: string;
}

export interface JournalVoucher {
  id: string;
  voucherNumber: string;
  date: string;
  sourceModule: 'Front Desk' | 'Restaurant POS' | 'Bar POS' | 'Activities' | 'Amenities' | 'Banquet & Events' | 'Cashier Settlement' | 'Night Audit' | 'Manual Adjustment' | 'Inventory GRN' | 'Inventory Wastage' | 'Inventory Consumption' | 'Inventory Audit' | 'Purchase Return' | 'Purchase Bill' | 'Supplier Payment' | 'Procurement' | 'Housekeeping';
  sourceReference: string;
  narration: string;
  entries: JournalEntryItem[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  postedBy: string;
  postedAt: string;
}

export interface CityLedgerAccount {
  id: string;
  accountNumber: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  creditLimit: number;
  currentBalance: number;
  paymentTerms: 'Immediate' | 'Net 15' | 'Net 30' | 'Net 45' | 'Net 60';
  status: 'Active' | 'Credit Warning' | 'Suspended';
  taxNumber?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface DepartmentalSyncStatus {
  department: 'Front Desk Rooms' | 'Restaurant F&B' | 'Bar & Lounge POS' | 'Activities & Recreation' | 'Amenities & Spa' | 'Banquet & Venues' | 'Payment Cashiers' | string;
  totalBills: number;
  totalVolume: number;
  syncedCount: number;
  unmappedCount: number;
  lastSyncTime: string;
  syncStatus: 'In Sync' | 'Pending Sync' | 'Syncing';
  glAccountMapping: { debitAccount: string; creditAccount: string };
  glAccountCode?: string;
  glAccountName?: string;
  totalRevenuePosted?: number;
}

export interface ActivityItem {
  id: string;
  code: string;
  name: string;
  category: 'Water Sports' | 'Racquet Sports' | 'Outdoor Adventure' | 'Fitness & Wellness' | 'Kids & Family' | 'Indoor Games' | 'Spa & Therapy' | 'Special Recreation';
  description: string;
  price: number;
  pricingUnit: 'Per Person' | 'Per Hour' | 'Per Session' | 'Day Pass' | 'Per Game' | 'Per Ride' | '20 Arrows + Instructor' | 'Per Match';
  durationMinutes: number;
  maxCapacityPerSlot: number;
  location: string;
  operatingHours: string;
  instructorAvailable: boolean;
  instructorFee?: number;
  glAccountCode: string;
  isActive: boolean;
  badge?: string;
  badgeColor?: string;
  iconName?: string;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface ActivityBooking {
  id: string;
  bookingNumber: string;
  activityId: string;
  activityName: string;
  guestName: string;
  guestPhone?: string;
  guestEmail?: string;
  guestType: 'In-House Guest' | 'Walk-in Visitor' | 'Corporate Member';
  roomNumber?: string;
  stayId?: string;
  folioId?: string;
  bookingDate: string; // YYYY-MM-DD
  timeSlot: string; // e.g. '10:00 AM - 11:00 AM'
  participantCount: number;
  unitPrice: number;
  subtotal: number;
  tax: number;
  total: number;
  paymentType: 'Billed to Room Folio' | 'Cash Direct' | 'Credit Card' | 'bKash MFS';
  paymentStatus: 'Posted to Folio' | 'Paid Direct' | 'Pending';
  bookingStatus: 'Confirmed' | 'In-Progress' | 'Completed' | 'Cancelled';
  assignedInstructor?: string;
  specialRequests?: string;
  chargeId?: string;
  createdAt: string;
  createdBy: string;
}

export interface ActivityAmenityCharge {
  id: string;
  chargeNumber: string;
  category: 'Activity' | 'Amenity';
  serviceType: string;
  guestOrCustomerName: string;
  roomNumber?: string;
  stayId?: string;
  folioId?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  tax: number;
  grandTotal: number;
  paymentType: 'Billed to Room Folio' | 'Cash Direct' | 'Credit Card' | 'bKash MFS';
  settlementStatus: 'Posted to Folio' | 'Settled Direct' | 'Pending';
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface RolePermission {
  id: string;
  roleName: UserRoleName;
  permissions: string[];
}

export interface Guest {
  id: string;
  guestCode: string;
  fullName: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth?: string;
  nationality: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  idType: 'National ID (NID)' | 'Passport' | 'Driving License' | 'Birth Certificate';
  idNumber: string;
  company?: string;
  emergencyContact?: string;
  notes?: string;
  vipStatus?: boolean;
  totalStays: number;
  totalNights: number;
  totalSpend: number;
  createdAt: string;
  updatedAt: string;
}

export interface GuestDocument {
  id: string;
  guestId: string;
  documentType: string;
  documentNumber: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
}

export interface RoomType {
  id: string;
  name: string;
  code?: string; // Short code e.g. 'DLX-K', 'ROYAL'
  description: string;
  maxAdults: number;
  maxChildren: number;
  baseRate: number; // in BDT (৳)
  basePrice?: number;
  bedType?: string;
  roomSize?: string; // e.g. "450 sq.ft" or "42 sq.m"
  extraAdultRate: number;
  extraChildRate: number;
  amenities: string[];
  photoUrl?: string;
  active: boolean;
  totalRooms?: number;
}

export interface Floor {
  id: string;
  floorNumber: number; // e.g. 1, 2, 3, 4, 5
  name: string; // e.g. "Ground Floor", "1st Floor - Garden Wing", "2nd Floor - Executive"
  code?: string; // e.g. "FL-01", "GND", "FL-02"
  building?: string; // e.g. "Main Resort Complex", "Convention Center"
  wing?: string; // e.g. "East Garden Wing", "West Lake Wing"
  totalRooms?: number;
  description?: string;
  keyCardPrefix?: string; // e.g. "KC-1", "KC-2"
  isSmokingAllowed?: boolean;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Room {
  id: string;
  roomNumber: string;
  roomTypeId: string;
  roomTypeName?: string;
  floor: number;
  building?: string;
  wing?: string;
  isSmoking?: boolean;
  connectingRoom?: string;
  keyCardCode?: string;
  keyCardAssigned?: string;
  features?: string[];
  amenities?: string[];
  operationalStatus: OperationalStatus;
  housekeepingStatus: HousekeepingStatus;
  active: boolean;
  notes?: string;
}

export type CustomerType = 'Individual' | 'Corporate';

export interface GroupMember {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  idType?: string;
  idNumber?: string;
  assignedRoomNumber?: string;
  isLeader?: boolean;
  notes?: string;
}

export interface AllocatedRoom {
  id: string;
  roomTypeId: string;
  roomTypeName: string;
  roomId?: string;
  roomNumber?: string;
  guestName: string;
  guestPhone?: string;
  adults: number;
  children: number;
  rate: number;
  packageId?: string;
  packageName?: string;
  notes?: string;
}

export interface Reservation {
  id: string;
  reservationNumber: string;
  guestId: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  roomTypeId: string;
  roomTypeName: string;
  assignedRoomId?: string;
  assignedRoomNumber?: string;
  arrivalDate: string; // YYYY-MM-DD
  departureDate: string; // YYYY-MM-DD
  adults: number;
  children: number;
  status: ReservationStatus;
  bookingSource: 'Front Desk Walk-in' | 'Phone / Direct' | 'Corporate' | 'Booking.com' | 'Agoda' | 'Website Engine' | 'Travel Agent';
  rate: number;
  packageId?: string;
  packageName?: string;
  specialRequests?: string;
  depositAmount: number;
  paidAmount: number;
  totalEstimatedAmount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;

  // Corporate or Individual Booking Details
  customerType?: CustomerType;
  companyName?: string;
  companyGstBin?: string;
  companyContactPerson?: string;
  companyDesignation?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  corporateAccountId?: string;

  // Group Booking & Multi-Room Allocation Details
  isGroupBooking?: boolean;
  groupName?: string;
  groupLeaderName?: string;
  groupLeaderPhone?: string;
  groupMembers?: GroupMember[];
  allocatedRooms?: AllocatedRoom[];
  totalRoomsCount?: number;
}

export interface Stay {
  id: string;
  stayNumber: string;
  reservationId: string;
  guestId: string;
  guestName: string;
  roomId: string;
  roomNumber: string;
  roomTypeName: string;
  rate?: number;
  adults?: number;
  children?: number;
  checkInAt: string;
  expectedCheckOutAt: string;
  actualCheckOutAt?: string;
  status: StayStatus;
  folioId: string;
  keyCardsIssued: number;
  verifiedId: boolean;
  idType?: 'National ID (NID)' | 'Passport' | 'Driving License' | 'Birth Certificate' | string;
  idNumber?: string;
  stopPost?: boolean;
  stopPostReason?: string;
  stopPostBy?: string;
  stopPostAt?: string;
  notes?: string;
  paxHistory?: Array<{
    id: string;
    type: 'pax-in' | 'pax-out' | 'adjust';
    paxDiff: number;
    adults: number;
    children: number;
    notes: string;
    timestamp: string;
    by: string;
  }>;
}

export interface FolioItem {
  id: string;
  folioId: string;
  type: FolioItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
  postedBy: string;
  createdAt: string;
  reference?: string;
  voided?: boolean;
  voidReason?: string;
  voidedAt?: string;
  voidedBy?: string;
}

export interface Folio {
  id: string;
  folioNumber: string;
  stayId: string;
  guestId: string;
  guestName: string;
  roomNumber: string;
  status: FolioStatus;
  items: FolioItem[];
  subtotal: number;
  discountTotal: number;
  serviceChargeTotal: number;
  taxTotal: number;
  grandTotal: number;
  paidTotal: number;
  balance: number;
  openedAt: string;
  closedAt?: string;
  stopPost?: boolean;
  stopPostReason?: string;
  stopPostBy?: string;
  stopPostAt?: string;
}

export interface Payment {
  id: string;
  transactionNumber: string;
  folioId?: string;
  eventBookingId?: string;
  reservationId?: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  status: PaymentStatus;
  notes?: string;
  createdBy: string;
  createdAt: string;
  voided?: boolean;
  voidReason?: string;
  voidedAt?: string;
  voidedBy?: string;
  // BD Card Provider Details
  cardType?: string;
  cardProvider?: string;
  cardProviderId?: string;
  cardNetwork?: string;
  cardLast4?: string;
  cardApprovalCode?: string;
  posTerminal?: string;
  // Bank Transfer Details
  transactionNo?: string;
  traceNo?: string;
  bankAccountId?: string;
  bankAccountName?: string;
  senderBankName?: string;
  bankTxnRef?: string;
  bankTransferDate?: string;
  // Company Credit / City Ledger Details
  cityLedgerAccountId?: string;
  cityLedgerAccountName?: string;
  companyPoNumber?: string;
  authorizedBy?: string;
}

export interface Refund {
  id: string;
  paymentId: string;
  transactionNumber: string;
  amount: number;
  reason: string;
  method?: string;
  refundedAt?: string;
  refundedBy?: string;
  createdBy: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  folioId?: string;
  eventBookingId?: string;
  guestOrClientName: string;
  phone?: string;
  address?: string;
  stayOrEventDetails: string;
  roomOrHall: string;
  dates: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  discount: number;
  serviceCharge: number;
  tax: number;
  grandTotal: number;
  paidAmount: number;
  balance: number;
  status: InvoiceStatus;
  issuedAt: string;
  issuedBy: string;
}

export interface HousekeepingTask {
  id: string;
  roomId: string;
  roomNumber: string;
  roomTypeName: string;
  assignedTo?: string;
  taskType: 'Full Turnover' | 'Daily Service' | 'Inspection' | 'Deep Clean' | 'VIP Rush';
  priority: TaskPriority;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Inspected';
  checklist: {
    bedLinenChanged: boolean;
    bathroomSanitized: boolean;
    towelsReplaced: boolean;
    amenitiesRestocked: boolean;
    floorCleaned: boolean;
    minibarChecked: boolean;
  };
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface MaintenanceTicket {
  id: string;
  ticketNumber: string;
  roomId: string;
  roomNumber: string;
  title: string;
  description: string;
  priority: MaintenancePriority;
  assignedTo?: string;
  status: MaintenanceStatus;
  cost: number;
  marksOutOfOrder: boolean;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Hall {
  id: string;
  name: string;
  code: string;
  description: string;
  venueType?: 'Convention Hall' | 'Banquet Hall' | 'Meeting Room' | 'Boardroom' | 'Open Lawn' | 'Open Lawn / Amphitheatre';
  floor?: string;
  capacity: number;
  seatingTheater?: number;
  seatingBanquet?: number;
  seatingUShape?: number;
  seatingClassroom?: number;
  dimensions: string;
  baseRatePerDay: number;
  baseRateHalfDay: number;
  baseRatePerHour?: number;
  amenities: string[];
  active: boolean;
}

export interface EventClient {
  id: string;
  name: string;
  company?: string;
  phone: string;
  email: string;
  address: string;
  notes?: string;
  createdAt: string;
}

export interface EventBookingItem {
  id: string;
  itemType: 'Hall Rent' | 'Food Package' | 'Decoration' | 'Sound & AV' | 'Stage Setup' | 'Projector' | 'Extra Service';
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface EventBooking {
  id: string;
  eventNumber: string;
  clientId: string;
  clientName: string;
  clientCompany?: string;
  clientPhone: string;
  hallId: string;
  hallName: string;
  eventName: string;
  eventType: 'Corporate' | 'Wedding' | 'Conference' | 'Banquet' | 'Exhibition' | 'Annual General Meeting (AGM)' | 'Seminar' | 'Birthday / Social';
  eventDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  guestCount: number;
  packageId?: string;
  packageName?: string;
  status: EventStatus;
  items: EventBookingItem[];
  subtotal: number;
  discount: number;
  serviceCharge: number;
  tax: number;
  total: number;
  totalAmount?: number;
  deposit: number;
  balance: number;
  notes?: string;
  createdAt: string;
  setupStyle?: 'Banquet' | 'Theatre' | 'Classroom' | 'U-Shape' | 'Boardroom' | 'Cocktail / Standing';
  avRequirements?: string[];
  timeline?: { time: string; activity: string; notes?: string }[];
  menuCourses?: { courseName: string; items: string[] }[];
  floorSupervisor?: string;
  supervisorPhone?: string;
  tableCount?: number;
  dietaryRequirements?: string;
  kitchenNotes?: string;
  specialInstructions?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  settledAt?: string;
  settledBy?: string;
  settlementMethod?: string;
  cityLedgerAccountId?: string;
  cityLedgerAccountName?: string;
  invoiceNumber?: string;
}

export interface Package {
  id: string;
  name: string;
  description: string;
  packageType: 'Honeymoon' | 'Family' | 'Corporate' | 'Weekend' | 'Event' | 'Custom';
  price: number;
  active: boolean;
  includes: string[];
  nightsCount?: number;
  // Customization & breakdown details
  pricingModel?: 'per_person' | 'fixed_package' | 'per_day';
  minGuests?: number;
  maxGuests?: number;
  selectedHalls?: { hallId: string; hallName: string; rentalRate: number }[];
  selectedRooms?: { roomTypeId: string; roomTypeName: string; count: number; ratePerNight: number; nights: number }[];
  selectedMenuItems?: { itemId: string; name: string; categoryName: string; price: number; course?: string }[];
  customServices?: { name: string; cost: number; description?: string }[];
  menuCourses?: { courseName: string; items: string[] }[];
  createdAt?: string;
  updatedAt?: string;
}

export type QuotationStatus = 'Draft' | 'Sent' | 'Negotiating' | 'Accepted' | 'Declined' | 'Converted to Event' | 'Expired';

export interface BanquetQuotation {
  id: string;
  quotationNumber: string; // e.g. QTN-2026-001
  // Client details
  clientName: string;
  clientCompany?: string;
  clientPhone: string;
  clientEmail?: string;
  clientAddress?: string;
  // Event details
  eventName: string;
  eventType: EventBooking['eventType'];
  eventDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  guestCount: number;
  // Package linked or custom
  packageId?: string;
  packageName?: string;
  isCustomPackage?: boolean;
  // Venue & Halls selection
  halls: {
    hallId: string;
    hallName: string;
    hallRate: number;
    durationHours?: number;
    setupStyle?: 'Banquet' | 'Theatre' | 'Classroom' | 'U-Shape' | 'Boardroom' | 'Cocktail / Standing';
  }[];
  // Rooms accommodation selection
  rooms: {
    roomTypeId: string;
    roomTypeName: string;
    roomCount: number;
    nights: number;
    ratePerNight: number;
    totalAmount: number;
  }[];
  // Menu / Catering customization
  menuItems: {
    itemId: string;
    name: string;
    categoryName: string;
    unitPrice: number;
    course?: string;
  }[];
  menuPricePerPerson: number;
  cateringTotal: number;
  // Additional AV / Decor / Sound / Services
  additionalServices: {
    id: string;
    name: string;
    category: 'Audio-Visual' | 'Stage & Decor' | 'Photography' | 'Special Lighting' | 'Manpower & Protocol' | 'Other';
    rate: number;
    quantity: number;
    total: number;
  }[];
  // Financial breakdown
  hallTotal: number;
  roomTotal: number;
  servicesTotal: number;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  serviceChargePercent: number;
  serviceChargeAmount: number;
  taxPercent: number;
  taxAmount: number;
  grandTotal: number;
  depositRequired: number;
  // Terms & Lifecycle
  status: QuotationStatus;
  validUntil: string; // YYYY-MM-DD
  propertyLogoUrl?: string;
  customSerialNo?: string;
  notes?: string;
  termsAndConditions?: string;
  convertedEventId?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  active: boolean;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description: string;
  price: number;
  active: boolean;
}

export interface RestaurantOrder {
  id: string;
  orderNumber: string;
  stayId?: string;
  roomNumber?: string;
  guestName?: string;
  tableNumber?: string;
  orderType?: 'room-dining' | 'restaurant-table' | 'bar-lounge' | 'counter-takeaway';
  outlet?: 'restaurant' | 'bar';
  inRoomDiningDetails?: {
    deliveryTime?: string;
    trayCharge?: number;
    trayChargeIncluded?: boolean;
    specialNotes?: string;
  };
  status: 'Pending' | 'Preparing' | 'Served' | 'Posted to Folio' | 'Settled Direct' | 'Voided';
  kotStatus?: 'Pending' | 'In Kitchen' | 'Ready' | 'Served';
  items: {
    menuItemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
    modifiers?: string[];
    voided?: boolean;
    voidReason?: string;
  }[];
  subtotal: number;
  discount?: number;
  discountPercent?: number;
  discountReason?: string;
  isComplimentary?: boolean;
  complimentaryReason?: string;
  serviceCharge: number;
  tax: number;
  total: number;
  folioId?: string;
  paymentMethod?: string;
  paymentStatus?: 'Pending' | 'Billed-To-Room' | 'Paid-Direct' | 'Settled' | 'Voided';
  tenderAmount?: number;
  changeAmount?: number;
  settledAt?: string;
  settledBy?: string;
  isResettled?: boolean;
  resettledAt?: string;
  resettledBy?: string;
  resettlementReason?: string;
  previousPaymentMethod?: string;
  createdBy: string;
  createdAt: string;
  voided?: boolean;
  voidReason?: string;
  voidedAt?: string;
  voidedBy?: string;
}

export interface AuditClosedFolio {
  id: string;
  folioNumber: string;
  stayId?: string;
  guestName: string;
  roomNumber: string;
  roomType?: string;
  grandTotal: number;
  paidTotal: number;
  balance: number;
  status: 'Settled' | 'Closed' | 'Open' | 'Partially Paid' | 'Void';
  closedAt: string;
  settlementMethod?: string;
  remarks?: string;
}

export interface AuditGeneratedInvoice {
  id: string;
  invoiceNumber: string;
  folioNumber?: string;
  guestOrClientName: string;
  roomOrHall: string;
  subtotal: number;
  serviceCharge: number;
  tax: number;
  grandTotal: number;
  status: InvoiceStatus;
  issuedAt: string;
  issuedBy: string;
}

export interface AuditTriggeredAlert {
  id: string;
  type: 'urgent' | 'warning' | 'info' | 'vip' | 'success';
  title: string;
  message: string;
  category: 'Financial / Ledger' | 'Front Desk' | 'Housekeeping' | 'Security / Stop-Post' | 'Banquet & Events';
  timestamp: string;
  actionRoute?: string;
  actionLabel?: string;
  resolved?: boolean;
}

export interface AuditPostedCharge {
  stayId: string;
  roomNumber: string;
  guestName: string;
  roomType: string;
  rate: number;
  tax: number;
  serviceCharge: number;
  total: number;
  postedAt: string;
}

export interface NightAuditRecord {
  id: string;
  auditNumber: string;
  businessDate: string;
  nextBusinessDate: string;
  closedAt: string;
  closedBy: string;
  isAutomatic: boolean;
  totalRoomsOccupied: number;
  occupancyPercent: number;
  roomRevenuePosted: number;
  fbRevenue: number;
  banquetRevenue: number;
  otherRevenue: number;
  totalRevenue: number;
  totalPaymentsCollected: number;
  ledgerBalance: number;
  inHouseStaysCount: number;
  departuresPending: number;
  notes?: string;
  status: 'Completed' | 'Warning' | 'Failed';
  
  // Detailed automated process results from the 06:00 AM audit run
  closedFolios?: AuditClosedFolio[];
  generatedInvoices?: AuditGeneratedInvoice[];
  triggeredAlerts?: AuditTriggeredAlert[];
  postedCharges?: AuditPostedCharge[];
}

export type PermissionKey =
  | 'can_void_bills'
  | 'can_delete_reservations'
  | 'can_modify_reservations'
  | 'can_void_payments'
  | 'can_run_night_audit'
  | 'can_manage_rooms'
  | 'can_manage_halls'
  | 'can_manage_users'
  | 'can_manage_roles'
  | 'can_view_reports'
  | 'can_checkin_checkout'
  | 'can_post_charges';

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entityType: 'Reservation' | 'Stay' | 'Room' | 'Folio' | 'Payment' | 'Refund' | 'Event' | 'Housekeeping' | 'Maintenance' | 'User' | 'Settings' | 'Hall' | 'Order' | 'NightAudit';
  entityId: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface OperationalAlert {
  id: string;
  type: 'urgent' | 'warning' | 'info' | 'vip' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
  actionLabel?: string;
  actionRoute?: string;
}

export interface SystemSetting {
  resortName: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  website?: string;
  taxRatePercent: number;
  vatRate?: number;
  serviceChargePercent: number;
  serviceChargeRate?: number;
  currencySymbol: string;
  checkInTime: string;
  checkOutTime: string;
  allowOverbooking: boolean;
  requireDepositForReservation: boolean;
  autoNightAuditEnabled: boolean;
  autoNightAuditTime: string; // e.g. "06:00"
  currentBusinessDate: string; // e.g. "2026-08-31"
  lastNightAuditDate?: string;
  binNumber?: string;
  tradeLicense?: string;
  // Document Numbering Schemes
  folioPrefix?: string;
  invPrefix?: string;
  resPrefix?: string;
  banquetPrefix?: string;
  poPrefix?: string;
  grnPrefix?: string;
  posPrefix?: string;
  kotPrefix?: string;
  jvPrefix?: string;
  receiptPrefix?: string;
  numberPadding?: number;
  numberDateFormat?: 'NONE' | 'YYYY' | 'YYMM';
  // Operational Policies
  autoDirtyOnCheckout?: boolean;
  allowDirectRoomPost?: boolean;
  stopPostStrict?: boolean;
  lateCheckoutGraceMinutes?: number;
}

export * from './inventoryMenu';
