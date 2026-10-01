export type RoomHousekeepingStatus = 
  | 'Vacant Clean' 
  | 'Vacant Dirty' 
  | 'Occupied Clean' 
  | 'Occupied Dirty' 
  | 'Cleaning' 
  | 'Cleaned' 
  | 'Inspection Pending' 
  | 'Inspected' 
  | 'Out of Order' 
  | 'Out of Service' 
  | 'Do Not Disturb'
  | 'Touch Up';

export type CleaningType = 
  | 'Checkout Cleaning' 
  | 'Stayover Cleaning' 
  | 'Deep Cleaning' 
  | 'VIP Cleaning' 
  | 'Special Cleaning' 
  | 'Turndown' 
  | 'Public Area Cleaning' 
  | 'Post-Maintenance Cleaning';

export type CleaningTaskStatus = 
  | 'Pending' 
  | 'Assigned' 
  | 'In Progress' 
  | 'Cleaned' 
  | 'Inspection Pending' 
  | 'Inspected' 
  | 'Rejected' 
  | 'Completed';

export type TaskPriority = 'Normal' | 'High' | 'VIP' | 'Urgent';

export interface HousekeepingStaff {
  id: string;
  name: string;
  employeeCode: string;
  role: 'Attendant' | 'Supervisor' | 'Executive Housekeeper' | 'Laundry Operator';
  shift: 'Morning' | 'Evening' | 'Night' | 'Custom';
  phone: string;
  active: boolean;
  assignedFloor?: number | string;
  avatar?: string;
  currentActiveRoomsCount?: number;
}

export interface HousekeepingChecklist {
  bedLinenChanged: boolean;
  pillowCasesReplaced: boolean;
  bathroomSanitized: boolean;
  towelsReplaced: boolean;
  amenitiesRestocked: boolean;
  floorVacuumedMopped: boolean;
  dustingSurfacesCleaned: boolean;
  trashEmptied: boolean;
  minibarChecked: boolean;
  acTvWorking: boolean;
  odorFree: boolean;
}

export interface HousekeepingTaskEnhanced {
  id: string;
  taskNumber: string;
  roomId: string;
  roomNumber: string;
  roomTypeName: string;
  floor: number;
  guestName?: string;
  stayId?: string;
  reservationId?: string;
  cleaningType: CleaningType;
  priority: TaskPriority;
  isVip: boolean;
  assignedAttendantId?: string;
  assignedAttendantName?: string;
  supervisorId?: string;
  supervisorName?: string;
  status: CleaningTaskStatus;
  startedAt?: string;
  completedAt?: string;
  inspectedAt?: string;
  estimatedDurationMinutes: number;
  actualDurationMinutes?: number;
  checklist: HousekeepingChecklist;
  remarks?: string;
  inspectionRemarks?: string;
  inspectionPassed?: boolean;
  createdAt: string;
  updatedAt: string;
  history: {
    timestamp: string;
    action: string;
    user: string;
    notes?: string;
  }[];
}

export interface InspectionCheckItem {
  id: string;
  category: 'Bedroom' | 'Bathroom' | 'Fixtures & Electronics' | 'Amenities & Supplies' | 'Overall';
  name: string;
  status: 'Pass' | 'Fail' | 'N/A';
  remarks?: string;
}

export interface RoomInspectionRecord {
  id: string;
  inspectionNumber: string;
  roomId: string;
  roomNumber: string;
  roomTypeName: string;
  supervisorId: string;
  supervisorName: string;
  attendantId?: string;
  attendantName?: string;
  inspectionDate: string;
  items: InspectionCheckItem[];
  overallResult: 'Pass' | 'Fail';
  scorePercent: number;
  remarks: string;
  createdAt: string;
}

export type LostFoundCategory = 
  | 'Electronics' 
  | 'Clothing' 
  | 'Jewelry' 
  | 'Documents' 
  | 'Money' 
  | 'Accessories' 
  | 'Personal Items' 
  | 'Other';

export type LostFoundStatus = 
  | 'Found' 
  | 'Stored' 
  | 'Guest Contacted' 
  | 'Claimed' 
  | 'Returned' 
  | 'Transferred' 
  | 'Disposed' 
  | 'Unclaimed';

export interface LostFoundItem {
  id: string;
  itemCode: string;
  foundDate: string; // YYYY-MM-DD
  foundTime: string; // HH:mm
  foundLocation: string; // e.g. "Room 205", "Lobby Lounge", "Convention Hall A"
  roomId?: string;
  roomNumber?: string;
  guestName?: string;
  guestPhone?: string;
  guestEmail?: string;
  reservationNumber?: string;
  checkoutDate?: string;
  description: string;
  category: LostFoundCategory;
  color: string;
  brand?: string;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Damaged';
  foundBy: string;
  storedLocation: string; // e.g. "HK Safe Locker A-3", "Main Store Shelf 2"
  status: LostFoundStatus;
  remarks?: string;
  isHighValue?: boolean;
  estimatedValue?: number; // in BDT (৳)
  dispositionMethod?: 'Handover In-Person' | 'Courier Dispatched' | 'Auction' | 'Charity Donation' | 'Discarded';
  claimedBy?: string;
  claimedDate?: string;
  receiverPhone?: string;
  receiverNid?: string;
  returnedBy?: string;
  witnessedBy?: string;
  courierName?: string;
  courierTrackingNumber?: string;
  courierRecipientAddress?: string;
  courierDispatchDate?: string;
  courierCost?: number;
  disposalApprovedBy?: string;
  disposalNotes?: string;
  disposalDate?: string;
  storageBinCode?: string;
  history: {
    timestamp: string;
    action: string;
    user: string;
    notes: string;
  }[];
  createdAt: string;
}

export type LinenCategory = 
  | 'Bed Sheet' 
  | 'Pillow Case' 
  | 'Duvet Cover' 
  | 'Bath Towel' 
  | 'Hand Towel' 
  | 'Face Towel' 
  | 'Bath Mat' 
  | 'Pool Towel' 
  | 'Table Linen' 
  | 'Napkin' 
  | 'Other';

export type LinenLocation = 
  | 'Floor 1' 
  | 'Floor 2' 
  | 'Floor 3' 
  | 'VIP Floor' 
  | 'Laundry' 
  | 'Housekeeping Store' 
  | 'Banquet' 
  | 'Pool';

export interface LinenItem {
  id: string;
  itemCode: string;
  name: string;
  category: LinenCategory;
  sizeOrSpec: string;
  uom: string;
  parLevel: number;
  totalStock: number;
  unitCost: number;
}

export interface LinenLocationStock {
  id: string;
  linenItemId: string;
  linenItemName: string;
  location: LinenLocation;
  cleanQty: number;
  dirtyQty: number;
  inUseQty: number;
  inLaundryQty: number;
  damagedQty: number;
  lostQty: number;
  lastUpdated: string;
}

export type LinenTransactionType = 
  | 'Issue to Floor' 
  | 'Return Clean' 
  | 'Return Dirty' 
  | 'Send to Laundry' 
  | 'Receive from Laundry' 
  | 'Damaged Write-Off' 
  | 'Lost Write-Off' 
  | 'Opening Stock';

export interface LinenTransaction {
  id: string;
  transactionNumber: string;
  date: string;
  time: string;
  transactionType: LinenTransactionType;
  fromLocation: LinenLocation;
  toLocation: LinenLocation;
  linenItemId: string;
  linenItemName: string;
  quantity: number;
  cleanQty?: number;
  dirtyQty?: number;
  damagedQty?: number;
  lostQty?: number;
  issuedBy: string;
  receivedBy?: string;
  remarks?: string;
  createdAt: string;
}

export interface HousekeepingAmenity {
  id: string;
  name: string;
  category: 'Bathroom' | 'Beverage' | 'Room Comfort' | 'Sanitary' | 'Stationery' | 'Other';
  sku: string;
  unit: string;
  cost: number;
  salePrice: number;
  isChargeable: boolean;
  reorderLevel: number;
  maximumLevel: number;
  currentStock: number;
  supplier: string;
  active: boolean;
  remarks?: string;
}

export interface AmenityConsumptionRecord {
  id: string;
  recordNumber: string;
  roomId: string;
  roomNumber: string;
  guestName?: string;
  stayId?: string;
  folioId?: string;
  amenityId: string;
  amenityName: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  totalAmount: number;
  isChargeable: boolean;
  isPostedToFolio: boolean;
  consumedAt: string;
  attendantName: string;
  notes?: string;
}

export type RequestSource = 'Front Desk' | 'Guest' | 'Housekeeping' | 'Other Departments';

export type RequestType = 
  | 'Extra Towel' 
  | 'Extra Pillow' 
  | 'Extra Blanket' 
  | 'Baby Cot' 
  | 'Toiletries' 
  | 'Water' 
  | 'Room Cleaning' 
  | 'Deep Cleaning' 
  | 'Turndown' 
  | 'Laundry' 
  | 'Iron' 
  | 'Other';

export type RequestStatus = 'New' | 'Assigned' | 'In Progress' | 'Waiting' | 'Completed' | 'Cancelled';

export interface HousekeepingRequest {
  id: string;
  requestNumber: string;
  source: RequestSource;
  requestType: RequestType;
  roomId: string;
  roomNumber: string;
  guestName?: string;
  guestPhone?: string;
  stayId?: string;
  folioId?: string;
  priority: TaskPriority;
  status: RequestStatus;
  assignedTo?: string;
  assignedAttendantName?: string;
  isChargeable: boolean;
  chargeAmount?: number;
  isPostedToFolio: boolean;
  requestedAt: string;
  completedAt?: string;
  requestedBy: string;
  completedBy?: string;
  notes?: string;
  departmentNote?: string;
}

export interface RoomDiscrepancyRecord {
  id: string;
  roomId: string;
  roomNumber: string;
  frontOfficeStatus: 'Vacant' | 'Occupied';
  housekeepingStatus: 'Vacant' | 'Occupied';
  frontOfficeDetails: string;
  housekeepingDetails: string;
  detectedAt: string;
  reportedBy: string;
  status: 'Open' | 'Investigating' | 'Resolved';
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface HousekeepingShiftRecord {
  id: string;
  shiftName: 'Morning Shift' | 'Evening Shift' | 'Night Shift' | 'Custom Shift';
  shiftDate: string;
  staffId: string;
  staffName: string;
  startTime: string;
  endTime?: string;
  assignedRoomsCount: number;
  completedRoomsCount: number;
  rejectedCount: number;
  pendingCount: number;
  avgCleaningTimeMinutes: number;
  status: 'Active' | 'Closed';
}

export interface HousekeepingDashboardStats {
  totalRooms: number;
  vacantClean: number;
  vacantDirty: number;
  occupiedClean: number;
  occupiedDirty: number;
  cleaningInProgress: number;
  inspected: number;
  outOfOrder: number;
  outOfService: number;
  roomsDueForCleaning: number;
  priorityRooms: number;
  pendingRequests: number;
  openMaintenanceIssues: number;
  lostAndFoundItems: number;
  linenBalance: number;
}
