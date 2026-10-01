// CCULB PMS - Inventory & Menu Management Data Types

export type InventoryItemType = 
  | 'Raw Material'
  | 'Food Ingredient'
  | 'Beverage'
  | 'Bar Item'
  | 'Packaging'
  | 'Housekeeping Supply'
  | 'Engineering Material'
  | 'Office Supply'
  | 'Amenity'
  | 'Fixed Asset'
  | 'Consumable'
  | 'Operating Supply'
  | 'Other';

export type StockTransactionType =
  | 'Opening Balance'
  | 'Purchase Receive'
  | 'Purchase Return'
  | 'Store Transfer In'
  | 'Store Transfer Out'
  | 'Kitchen Issue'
  | 'Bar Issue'
  | 'Housekeeping Issue'
  | 'Housekeeping Consumption'
  | 'Recipe Consumption'
  | 'Wastage'
  | 'Adjustment Increase'
  | 'Adjustment Decrease'
  | 'Physical Count Adjustment';

export type WastageReason =
  | 'Expired'
  | 'Spoiled'
  | 'Damaged'
  | 'Kitchen Waste'
  | 'Overproduction'
  | 'Breakage'
  | 'Spillage'
  | 'Other';

export type TransferStatus =
  | 'Draft'
  | 'Requested'
  | 'Approved'
  | 'In Transit'
  | 'Received'
  | 'Cancelled';

export type PurchaseRequestStatus =
  | 'Draft'
  | 'Submitted'
  | 'Pending Approval'
  | 'Under Review'
  | 'Approved'
  | 'Rejected'
  | 'PO Generated'
  | 'Partially Received'
  | 'Completed'
  | 'Cancelled';

export type PurchaseOrderStatus =
  | 'Draft'
  | 'Submitted'
  | 'Approved'
  | 'Issued to Supplier'
  | 'Sent to Supplier'
  | 'Partially Received'
  | 'Fully Received'
  | 'Billed'
  | 'Cancelled';

export type MenuType =
  | 'Food'
  | 'Beverage'
  | 'Dessert'
  | 'Bar'
  | 'Combo'
  | 'Package'
  | 'Special';

export type OutletType =
  | 'Restaurant'
  | 'Bar'
  | 'Pool'
  | 'Room Service'
  | 'Banquet'
  | 'Event'
  | 'Other';

export type MenuAvailabilityStatus =
  | 'Available'
  | 'Unavailable'
  | 'Temporarily Unavailable'
  | 'Out of Stock'
  | 'Seasonal'
  | 'Archived';

// ==========================================
// 1. INVENTORY MASTER MODELS
// ==========================================

export interface UnitOfMeasure {
  id: string;
  code: string; // e.g. "kg", "g", "ltr", "ml", "pcs", "carton"
  name: string; // e.g. "Kilogram", "Gram", "Liter", "Piece"
  symbol?: string;
  description?: string;
  baseUnitId?: string;
  conversionMultiplier: number; // e.g., 1 kg = 1000 g (multiplier: 1000 from kg to g, or 1 carton = 24 pcs)
  category: 'Weight' | 'Volume' | 'Count' | 'Portion';
  active: boolean;
}

export interface InventoryCategory {
  id: string;
  code: string;
  name: string; // e.g., "FOOD", "BEVERAGE", "BAR", "HOUSEKEEPING"
  description?: string;
  department: 'F&B Kitchen' | 'Bar & Lounge' | 'Housekeeping' | 'Engineering' | 'Front Office' | 'Admin & General';
  subcategories: string[]; // e.g. ["Meat", "Fish", "Chicken", "Vegetables", "Spices", "Dairy"]
  active: boolean;
}

export interface WarehouseStore {
  id: string;
  code: string;
  name: string; // e.g. "Main Store", "Kitchen Store", "Bar Store", "Cold Storage", "Frozen Store"
  location: string;
  storeKeeper?: string;
  managerName?: string;
  manager?: string;
  storeType?: 'Central' | 'Sub-Store' | 'Cold Storage' | 'Beverage Store' | 'Dry Store' | 'General';
  department?: string;
  totalCapacity?: string;
  temperatureControlled?: boolean;
  temperatureRange?: string;
  isProductionStore?: boolean;
  isKitchenStore?: boolean;
  isBarStore?: boolean;
  phone?: string;
  glInventoryAccountId?: string;
  glInventoryAccountCode?: string;
  glInventoryAccountName?: string;
  createdAt?: string;
  active: boolean;
}

export interface Supplier {
  id: string;
  code: string;
  name: string; // e.g. "Bengal Agro Ltd.", "Dhaka Beverage Supply"
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  tradeLicense?: string;
  tin?: string;
  taxNumber?: string;
  taxIdNumber?: string;
  creditLimit?: number;
  paymentTerms: 'Immediate' | 'Net 7' | 'Net 15' | 'Net 30' | 'Net 45';
  bankDetails?: string;
  categoriesSupplied: string[];
  currentPayableBalance: number;
  rating?: number;
  active: boolean;
  createdAt: string;
}

export type ItemGroupType =
  | 'food'
  | 'kitchen'
  | 'housekeeping'
  | 'maintenance'
  | 'it'
  | 'administrative'
  | 'accessories'
  | 'department';

export interface InventoryItem {
  id: string;
  itemCode: string;
  name: string;
  itemType: InventoryItemType;
  itemGroup?: ItemGroupType; // 'food'/'kitchen' = Food & Kitchen Ingredients, 'housekeeping' = Linens/Amenities, 'maintenance' = Eng Spares, 'it' = Tech/Hardware, 'administrative' = Office/Stationery, 'accessories' = Consumables
  categoryId: string;
  categoryName: string;
  subcategory: string;
  brand?: string;
  description?: string;
  uomId: string;
  uomCode: string;
  purchaseUomId: string;
  purchaseUomCode: string;
  consumptionUomId: string;
  consumptionUomCode: string;
  conversionFactor: number; // 1 Purchase UOM = X Consumption UOM (e.g. 1 Carton = 24 Bottles)
  storageLocation?: string;
  defaultWarehouseId: string;
  minimumStock: number;
  maximumStock: number;
  reorderLevel: number;
  reorderQuantity: number;
  openingStock: number;
  openingCost: number;
  averageCost: number; // Moving average cost in BDT (৳)
  lastPurchaseCost: number;
  preferredSupplierId?: string;
  preferredSupplierName?: string;
  taxPercent: number;
  active: boolean;
  trackBatch: boolean;
  trackExpiry: boolean;
  currentTotalStock: number; // Aggregate across stores
  currentTotalValue: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryStockByWarehouse {
  id: string;
  itemId: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  averageCost: number;
  stockValue: number;
  lastUpdated: string;
}

export interface ItemBatchRecord {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  warehouseId: string;
  batchNumber: string;
  manufacturingDate?: string;
  expiryDate: string; // YYYY-MM-DD
  receivedDate: string;
  quantity: number;
  remainingQuantity: number;
  unitCost: number;
  supplierName?: string;
  grnNumber?: string;
  status: 'Fresh' | 'Expiring Soon' | 'Expired';
}

export interface StockLedgerEntry {
  id: string;
  date: string;
  transactionNumber: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  warehouseId: string;
  warehouseName: string;
  transactionType: StockTransactionType;
  referenceType: 'PO' | 'GRN' | 'PurchaseReturn' | 'Return' | 'Transfer' | 'KitchenIssue' | 'BarIssue' | 'POSOrder' | 'Wastage' | 'Adjustment' | 'CountAudit' | 'Amenity Issue' | 'Issue';
  referenceId: string;
  referenceDocument: string; // e.g. "POS-2026-0104", "GRN-2026-0012"
  quantityIn: number;
  quantityOut: number;
  unitCost: number;
  totalCost: number;
  runningQuantity: number;
  runningValue: number;
  businessDate: string;
  department?: string;
  user: string;
  notes?: string;
  createdAt: string;
}

// ==========================================
// 2. PROCUREMENT & WAREHOUSE TRANSACTIONS
// ==========================================

export interface PurchaseRequestItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  requestedQuantity: number;
  approvedQuantity?: number;
  uom: string;
  estimatedUnitCost: number;
  estimatedTotal: number;
  currentStock: number;
  notes?: string;
}

export interface PurchaseRequest {
  id: string;
  requestNumber: string; // REQ-2026-001
  department: string;
  warehouseId: string;
  warehouseName: string;
  requestDate: string;
  requiredDate: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  items: PurchaseRequestItem[];
  totalEstimatedAmount: number;
  status: PurchaseRequestStatus;
  requestedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  remarks?: string;
  createdAt: string;
}

export interface PurchaseOrderItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  receivedQuantity: number;
  pendingQuantity: number;
  uom: string;
  unitPrice: number;
  taxPercent: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // PO-2026-001
  requisitionId?: string;
  requisitionNumber?: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  paymentTerms: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  status: PurchaseOrderStatus;
  receivedTotalValue: number;
  preparedBy: string;
  approvedBy?: string;
  notes?: string;
  createdAt: string;
}

export interface GoodsReceiveNoteItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  poQuantity?: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  uom: string;
  unitPrice: number;
  totalPrice: number;
  batchNumber?: string;
  expiryDate?: string;
  rejectionReason?: string;
}

export interface GoodsReceiveNote {
  id: string;
  grnNumber: string; // GRN-2026-001
  poId?: string;
  poNumber?: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  receiveDate: string;
  challanNumber: string; // Delivery note / Invoice no from supplier
  challanDate: string;
  items: GoodsReceiveNoteItem[];
  totalAcceptedAmount: number;
  inspectionPassed: boolean;
  inspectedBy: string;
  receivedBy: string;
  status: 'Draft' | 'Approved & Added to Stock' | 'Cancelled';
  journalVoucherNumber?: string;
  createdAt: string;
}

export interface PurchaseReturn {
  id: string;
  returnNumber: string; // PRN-2026-001
  grnId?: string;
  grnNumber?: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  returnDate: string;
  items: {
    itemId: string;
    itemCode: string;
    itemName: string;
    quantity: number;
    uom: string;
    unitPrice: number;
    totalAmount: number;
    reason: string;
  }[];
  totalAmount: number;
  reason: string;
  returnedBy: string;
  approvedBy: string;
  status: 'Pending' | 'Completed';
  createdAt: string;
}

export interface StockTransfer {
  id: string;
  transferNumber: string; // TRF-2026-001
  sourceWarehouseId: string;
  sourceWarehouseName: string;
  destinationWarehouseId: string;
  destinationWarehouseName: string;
  transferDate: string;
  items: {
    itemId: string;
    itemCode: string;
    itemName: string;
    quantity: number;
    uom: string;
    unitCost: number;
    totalCost: number;
  }[];
  totalCost: number;
  status: TransferStatus;
  requestedBy: string;
  approvedBy?: string;
  receivedBy?: string;
  remarks?: string;
  createdAt: string;
}

export interface StoreIssueConsumption {
  id: string;
  issueNumber: string; // ISS-2026-001
  warehouseId: string;
  warehouseName: string;
  department: 'Kitchen' | 'Bar' | 'Housekeeping' | 'Maintenance' | 'Banquet & Catering' | 'General';
  recipientName: string;
  issueDate: string;
  purpose: string;
  items: {
    itemId: string;
    itemCode: string;
    itemName: string;
    quantity: number;
    uom: string;
    unitCost: number;
    totalCost: number;
  }[];
  totalCost: number;
  issuedBy: string;
  approvedBy: string;
  journalVoucherNumber?: string;
  createdAt: string;
}

export interface WastageEntry {
  id: string;
  wastageNumber: string; // WST-2026-001
  date: string;
  department: 'Kitchen' | 'Bar' | 'Main Store' | 'Housekeeping' | 'Banquet';
  warehouseId: string;
  warehouseName: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  uom: string;
  unitCost: number;
  totalCost: number;
  reason: WastageReason;
  remarks?: string;
  reportedBy: string;
  approvedBy: string;
  status: 'Logged' | 'Approved & Written Off';
  journalVoucherNumber?: string;
  createdAt: string;
}

export interface PhysicalStockCountItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  uom: string;
  systemQuantity: number;
  countedQuantity: number;
  varianceQuantity: number;
  unitCost: number;
  varianceValue: number;
  notes?: string;
}

export interface PhysicalStockCount {
  id: string;
  countNumber: string; // PSC-2026-001
  warehouseId: string;
  warehouseName: string;
  countDate: string;
  items: PhysicalStockCountItem[];
  totalSystemValue: number;
  totalCountedValue: number;
  netVarianceValue: number;
  countedBy: string;
  verifiedBy: string;
  approvedBy?: string;
  status: 'In Progress' | 'Reconciled & Adjusted' | 'Rejected';
  adjustmentJournalVoucher?: string;
  createdAt: string;
}

export interface StockAdjustment {
  id: string;
  adjustmentNumber: string; // ADJ-2026-001
  date: string;
  warehouseId: string;
  warehouseName: string;
  adjustmentType: 'Increase' | 'Decrease';
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  uom: string;
  unitCost: number;
  totalValue: number;
  reason: string;
  adjustedBy: string;
  approvedBy: string;
  journalVoucherNumber?: string;
  createdAt: string;
}

// ==========================================
// 3. MENU, RECIPE & PRICING MODELS
// ==========================================

export interface MenuSubCategory {
  id: string;
  categoryId: string;
  name: string;
  displayOrder: number;
}

export interface ServiceChargeRule {
  id: string;
  name: string; // e.g. "Standard Restaurant SC (10%)"
  ratePercent: number;
  fixedAmount?: number;
  applicableOutlets: OutletType[];
  applicableCategories?: string[];
  effectiveDate: string;
  active: boolean;
}

export interface TaxRule {
  id: string;
  name: string; // e.g. "NBR VAT 15%"
  taxRatePercent: number;
  ratePercent?: number;
  isInclusive: boolean; // false = add on top of base price
  glAccountCode: string;
  effectiveDate: string;
  active: boolean;
}

export interface RecipeIngredientItem {
  id: string;
  inventoryItemId: string;
  inventoryItemCode: string;
  inventoryItemName: string;
  quantity: number; // Base required qty (e.g. 200)
  uomCode: string; // (e.g. "g" or "ml")
  wastagePercentage: number; // e.g. 5%
  effectiveQuantity: number; // e.g. 210g
  unitCost: number; // Cost per uom
  totalCost: number; // effectiveQuantity * unitCost
}

export interface Recipe {
  id: string;
  menuItemId: string;
  menuItemCode: string;
  menuItemName: string;
  version: string; // "V1", "V2"
  yieldQuantity: number; // e.g. 1
  yieldUnit: string; // "Plate", "Portion", "Glass"
  preparationTimeMinutes: number;
  instructions: string;
  ingredients: RecipeIngredientItem[];
  totalRecipeCost: number; // Sum of ingredient effective costs
  suggestedSellingPrice?: number;
  targetFoodCostPercentage?: number;
  active: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  createdBy: string;
  createdAt: string;
}

export interface MenuModifierItem {
  id: string;
  menuItemId: string;
  name: string; // e.g. "Extra Chicken", "Extra Cheese", "Large Glass"
  price: number;
  recipeIngredients?: {
    inventoryItemId: string;
    inventoryItemCode: string;
    inventoryItemName: string;
    quantity: number;
    uomCode: string;
    cost: number;
  }[];
  active: boolean;
}

export interface MenuComboItem {
  id: string;
  name: string; // "Family Feast Combo"
  code: string;
  price: number;
  description: string;
  itemsIncluded: {
    menuItemId: string;
    menuItemName: string;
    quantity: number;
  }[];
  active: boolean;
}

export interface MenuPriceHistory {
  id: string;
  menuItemId: string;
  menuItemName?: string;
  oldPrice?: number;
  previousPrice?: number;
  newPrice: number;
  effectiveFrom?: string;
  effectiveDate?: string;
  changedBy?: string;
  updatedBy?: string;
  reason: string;
  createdAt?: string;
}

export interface MenuCategoryItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  menuType: MenuType;
  kitchenStation: string;
  glSalesAccountCode: string; // e.g. "4020" or "4030"
  glSalesAccountName: string;
  glCogsAccountCode: string; // e.g. "5020" or "5025"
  glCogsAccountName: string;
  defaultTaxPercent: number;
  defaultServiceChargePercent: number;
  displayOrder: number;
  active: boolean;
  itemCount?: number;
}

export interface MenuVersion {
  id: string;
  versionCode?: string;
  code?: string;
  name: string;
  season?: string;
  description: string;
  menuType?: string;
  validFrom?: string;
  validTo?: string;
  effectiveStartDate?: string;
  effectiveEndDate?: string;
  status: 'Active' | 'Upcoming' | 'Archived' | 'Draft';
  targetFoodCostPercentage?: number;
  totalMenuItems?: number;
  itemCount?: number;
  applicableOutlets?: string[];
  approvedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuAccountingMapping {
  foodRevenueGlCode: string; // "4020"
  foodRevenueGlName: string;
  beverageRevenueGlCode: string; // "4030"
  beverageRevenueGlName: string;
  banquetRevenueGlCode: string; // "4040"
  banquetRevenueGlName: string;
  foodCostGlCode: string; // "5020"
  foodCostGlName: string;
  beverageCostGlCode: string; // "5025"
  beverageCostGlName: string;
  vatLiabilityGlCode: string; // "2100"
  vatLiabilityGlName: string;
  serviceChargeLiabilityGlCode: string; // "2110"
  serviceChargeLiabilityGlName: string;
  discountExpenseGlCode: string; // "4090"
  discountExpenseGlName: string;
  spoilageWastageGlCode: string; // "5028"
  spoilageWastageGlName: string;
  inventoryFoodAssetGlCode: string; // "1300"
  inventoryFoodAssetGlName: string;
  inventoryBeverageAssetGlCode: string; // "1310"
  inventoryBeverageAssetGlName: string;
}

export interface MenuItemEnhanced {
  id: string;
  menuCode: string;
  name: string;
  shortName?: string;
  categoryId: string;
  categoryName: string;
  subcategoryId?: string;
  subcategoryName?: string;
  menuType: MenuType;
  outlet: OutletType[];
  kitchenStation: 'Main Hot Kitchen' | 'Tandoor & Curry' | 'Live BBQ Station' | 'Bar & Beverage Counter' | 'Bakery & Pastry' | 'Salad & Cold Station' | 'Room Service Pantry';
  description: string;
  image?: string;
  preparationTimeMinutes: number;
  servingSize: string; // e.g. "1 Person", "2-3 Persons"
  basePrice: number;
  serviceChargeRuleId?: string;
  serviceChargePercent: number;
  serviceChargeAmount: number;
  taxRuleId?: string;
  taxPercent: number;
  taxAmount: number;
  discountPercent?: number;
  discountAmount?: number;
  finalSellingPrice: number; // Base + SC + Tax
  costPrice: number; // Derived from active recipe
  foodCostPercentage: number; // (Cost / BasePrice) * 100
  profitMargin: number; // BasePrice - Cost
  hasActiveRecipe: boolean;
  activeRecipeId?: string;
  availability: MenuAvailabilityStatus;
  outletAvailability: Record<OutletType, boolean>;
  maxProduciblePortions?: number; // Calculated dynamically from ingredient stocks!
  autoOutOfStockOnLowIngredients: boolean;
  status: 'Active' | 'Inactive' | 'Draft' | 'Archived';
  glRevenueAccountCode?: string;
  glRevenueAccountName?: string;
  glCogsAccountCode?: string;
  glCogsAccountName?: string;
  glTaxAccountCode?: string;
  glServiceChargeAccountCode?: string;
  glDiscountAccountCode?: string;
  monthlySalesCount?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 4. F&B COSTING & PROFITABILITY REPORTS
// ==========================================

export interface FoodAndBeverageCostSummary {
  period: string;
  openingInventoryValue: number;
  purchasesTotal: number;
  closingInventoryValue: number;
  cogsTotal: number; // Opening + Purchases - Closing
  foodRevenue: number;
  beverageRevenue: number;
  totalRevenue: number;
  overallCostPercentage: number;
  foodCostPercentage: number;
  beverageCostPercentage: number;
  totalWastageValue: number;
  complimentaryCostValue: number;
}

export interface MenuItemProfitabilityRow {
  menuItemId: string;
  menuCode: string;
  name: string;
  category: string;
  menuType: MenuType;
  costPrice: number;
  sellingPrice: number;
  grossMargin: number;
  foodCostPercentage: number;
  unitsSold: number;
  totalRevenue: number;
  totalCost: number;
  totalGrossProfit: number;
  profitabilityTier: 'Stars (High Profit, High Sales)' | 'Plowhorses (Low Profit, High Sales)' | 'Puzzles (High Profit, Low Sales)' | 'Dogs (Low Profit, Low Sales)';
}

// ==========================================
// 5. PROCUREMENT & ACCOUNTS PAYABLE TYPES
// ==========================================

export interface PurchaseBillItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  totalPrice: number;
  taxAmount?: number;
  glAccountCode?: string;
  glAccountName?: string;
}

export interface PurchaseBill {
  id: string;
  billNumber: string; // BILL-2026-0001
  supplierInvoiceNumber: string; // e.g. "INV-BM-9021"
  supplierId: string;
  supplierName: string;
  poId?: string;
  poNumber?: string;
  grnId?: string;
  grnNumber?: string;
  billDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Void';
  paymentTerms: string;
  glDebitAccountCode: string; // e.g. "5020" or "1300"
  glDebitAccountName: string;
  glCreditAccountCode: string; // "2050" Accounts Payable
  glCreditAccountName: string;
  items: PurchaseBillItem[];
  journalVoucherNumber?: string;
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
}

export interface SupplierPayment {
  id: string;
  paymentNumber: string; // SPAY-2026-0001
  supplierId: string;
  supplierName: string;
  billId?: string;
  billNumber?: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Cheque' | 'bKash' | 'Nagad' | 'Online / Card';
  referenceNumber: string; // Cheque No / Bank Trans Ref
  journalVoucherNumber?: string;
  glDebitAccountCode: string; // "2050" AP
  glDebitAccountName: string;
  glCreditAccountCode: string; // "1010" Bank / "1020" Cash
  glCreditAccountName: string;
  notes?: string;
  paidBy: string;
  createdAt: string;
}

export interface APAgingBucket {
  supplierId: string;
  supplierName: string;
  contactPerson: string;
  phone: string;
  paymentTerms: string;
  currentNotDue: number;
  days1To30: number;
  days31To60: number;
  days61To90: number;
  daysOver90: number;
  totalOutstanding: number;
  creditLimit: number;
  creditRisk: 'Low' | 'Moderate' | 'High' | 'Critical';
}

export interface ProcurementSpendByGLAccount {
  glAccountCode: string;
  glAccountName: string;
  category: string;
  transactionCount: number;
  totalSpent: number;
  percentageOfTotal: number;
  department: string;
}

export interface ThreeWayReconciliationItem {
  poNumber: string;
  poDate: string;
  supplierName: string;
  poAmount: number;
  grnNumber?: string;
  grnDate?: string;
  grnAmount?: number;
  billNumber?: string;
  supplierInvoiceNumber?: string;
  billDate?: string;
  billAmount?: number;
  paidAmount?: number;
  dueAmount?: number;
  status: 'Matched & Fully Settled' | 'Partially Received' | 'Unbilled GRN' | 'Pending Payment' | 'Variance Flagged';
  notes?: string;
}

export interface DepartmentalProcurementBudget {
  department: string;
  allocatedBudget: number;
  actualSpend: number;
  committedPOAmount: number;
  totalCommitted: number;
  varianceAmount: number;
  utilizationPercent: number;
  status: 'Within Budget' | 'Near Limit' | 'Over Budget';
}

