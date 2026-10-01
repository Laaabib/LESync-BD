// CCULB PMS - Inventory & Menu Management Service Layer
// Single source of truth for stock ledger, recipes, costing, procurement and POS consumption

import { pmsService } from './pmsService';
import {
  UnitOfMeasure, InventoryCategory, WarehouseStore, Supplier,
  InventoryItem, ItemGroupType, InventoryStockByWarehouse, ItemBatchRecord,
  StockLedgerEntry, PurchaseRequest, PurchaseOrder, GoodsReceiveNote,
  PurchaseReturn, PurchaseBill, SupplierPayment, StockTransfer, StoreIssueConsumption, WastageEntry,
  PhysicalStockCount, StockAdjustment, MenuItemEnhanced, Recipe,
  RecipeIngredientItem, MenuModifierItem, MenuComboItem, MenuPriceHistory,
  ServiceChargeRule, TaxRule, FoodAndBeverageCostSummary, MenuItemProfitabilityRow,
  APAgingBucket, ProcurementSpendByGLAccount, ThreeWayReconciliationItem, DepartmentalProcurementBudget,
  MenuCategoryItem, MenuVersion, MenuAccountingMapping
} from '../types/inventoryMenu';
import { RestaurantOrder, JournalVoucher } from '../types/pms';
import {
  SEED_UOMS,
  SEED_INVENTORY_CATEGORIES,
  SEED_WAREHOUSES,
  SEED_SUPPLIERS,
  SEED_INVENTORY_ITEMS,
  SEED_ENHANCED_MENU_ITEMS,
  SEED_RECIPES,
  SEED_MENU_MODIFIERS,
  SEED_MENU_COMBOS,
  SEED_PRICE_HISTORIES,
  SEED_SERVICE_CHARGE_RULES,
  SEED_TAX_RULES
} from './mockInventoryData';

export function determineItemGroup(item: {
  itemType?: string;
  categoryName?: string;
  subcategory?: string;
  name?: string;
  itemGroup?: ItemGroupType;
}): ItemGroupType {
  if (item.itemGroup) {
    if ((item.itemGroup as string) === 'kitchen') return 'food';
    return item.itemGroup;
  }
  
  const text = `${item.itemType || ''} ${item.categoryName || ''} ${item.subcategory || ''} ${item.name || ''}`.toLowerCase();
  
  // 1. IT, Technology & Electronics Equipment
  if (
    text.includes(' it ') || text.includes('it-') || text.includes(' it') || text.includes('computer') ||
    text.includes('laptop') || text.includes('printer') || text.includes('toner') ||
    text.includes('cartridge') || text.includes('pos ') || text.includes('pos-') ||
    text.includes('thermal roll') || text.includes('keycard') || text.includes('network') ||
    text.includes('router') || text.includes('switch') || text.includes('lan cable') ||
    text.includes('cat6') || text.includes('cat-6') || text.includes('hdmi') ||
    text.includes('usb') || text.includes('cctv') || text.includes('encoder') ||
    text.includes('mouse') || text.includes('keyboard') || text.includes('monitor') ||
    text.includes('server') || text.includes('scanner') || text.includes('hardware')
  ) {
    return 'it';
  }

  // 2. Administrative & Office Supplies
  if (
    text.includes('admin') || text.includes('office') || text.includes('paper') ||
    text.includes('stationery') || text.includes('pen ') || text.includes('pens') ||
    text.includes('folder') || text.includes('envelope') || text.includes('file') ||
    text.includes('stapler') || text.includes('register') || text.includes('voucher pad') ||
    text.includes('folio') || text.includes('form') || text.includes('stamp') ||
    text.includes('a4') || text.includes('a3') || text.includes('desk') ||
    text.includes('notepad') || text.includes('binder')
  ) {
    return 'administrative';
  }

  // 3. Maintenance, Spares & Engineering
  if (
    text.includes('maintenance') || text.includes('engineering') || text.includes('electrical') ||
    text.includes('plumbing') || text.includes('hvac') || text.includes('filter') ||
    text.includes('bulb') || text.includes('light') || text.includes('led') ||
    text.includes('wire') || text.includes('circuit') || text.includes('breaker') ||
    text.includes('pipe') || text.includes('valve') || text.includes('tap') ||
    text.includes('faucet') || text.includes('screw') || text.includes('bolt') ||
    text.includes('nut') || text.includes('nail') || text.includes('paint') ||
    text.includes('cement') || text.includes('silicone') || text.includes('spares') ||
    text.includes('tool') || text.includes('drill') || text.includes('wrench') ||
    text.includes('switchboard') || text.includes('socket')
  ) {
    return 'maintenance';
  }

  // 4. Housekeeping, Linen & Amenities
  if (
    text.includes('housekeeping') || text.includes('linen') || text.includes('sheet') ||
    text.includes('pillow') || text.includes('blanket') || text.includes('duvet') ||
    text.includes('towel') || text.includes('amenity') || text.includes('amenities') ||
    text.includes('toiletrie') || text.includes('shampoo') || text.includes('body wash') ||
    text.includes('dental kit') || text.includes('toothbrush') || text.includes('detergent') ||
    text.includes('taski') || text.includes('bleach') || text.includes('sanitizer') ||
    text.includes('disinfectant') || text.includes('mop') || text.includes('broom') ||
    text.includes('slipper') || text.includes('hanger') || text.includes('bath mat') ||
    text.includes('cleaning')
  ) {
    return 'housekeeping';
  }

  // 5. Food & Raw Ingredients (Meats, Groceries, Dairy, Beverages)
  if (
    text.includes('food') || text.includes('ingredient') || text.includes('meat') ||
    text.includes('chicken') || text.includes('beef') || text.includes('fish') ||
    text.includes('mutton') || text.includes('prawn') || text.includes('shrimp') ||
    text.includes('seafood') || text.includes('vegetable') || text.includes('onion') ||
    text.includes('potato') || text.includes('tomato') || text.includes('garlic') ||
    text.includes('ginger') || text.includes('spice') || text.includes('salt') ||
    text.includes('sugar') || text.includes('rice') || text.includes('flour') ||
    text.includes('oil') || text.includes('ghee') || text.includes('butter') ||
    text.includes('dairy') || text.includes('milk') || text.includes('cheese') ||
    text.includes('cream') || text.includes('sauce') || text.includes('egg') ||
    text.includes('produce') || text.includes('bakery') || text.includes('bread') ||
    text.includes('beverage') || text.includes('syrup') || text.includes('juice') ||
    text.includes('tea') || text.includes('coffee') || text.includes('raw material')
  ) {
    return 'food';
  }

  // 6. Accessories & Consumables (Wraps, Takeaway Boxes, Disposables)
  if (
    text.includes('packag') || text.includes('consumable') || text.includes('utensil') ||
    text.includes('container') || text.includes('napkin') || text.includes('tissue') ||
    text.includes('glass') || text.includes('plate') || text.includes('cup') ||
    text.includes('foil') || text.includes('wrap') || text.includes('straw') ||
    text.includes('disposable') || text.includes('accessory') || text.includes('accessories') ||
    text.includes('glove') || text.includes('bag')
  ) {
    return 'accessories';
  }

  return 'administrative';
}

export interface DepartmentItemGroupRule {
  department: string;
  allowedGroups: ItemGroupType[];
  defaultGroup: ItemGroupType;
  description: string;
}

export const DEPARTMENT_ITEM_GROUP_RULES: Record<string, DepartmentItemGroupRule> = {
  'Main Kitchen F&B': {
    department: 'Main Kitchen F&B',
    allowedGroups: ['food', 'kitchen', 'accessories'],
    defaultGroup: 'food',
    description: 'Prioritizing Food & Raw Ingredients (Meats, groceries, spices, dairy) & Kitchen Accessories'
  },
  'Bar & Lounge': {
    department: 'Bar & Lounge',
    allowedGroups: ['food', 'kitchen', 'accessories'],
    defaultGroup: 'food',
    description: 'Prioritizing Beverages, Drink Ingredients & Bar Accessories (Glassware, syrups, disposables)'
  },
  'Housekeeping': {
    department: 'Housekeeping',
    allowedGroups: ['housekeeping', 'accessories', 'administrative'],
    defaultGroup: 'housekeeping',
    description: 'Prioritizing Housekeeping Supplies (Bed linens, bath towels, guest amenities, cleaning chemicals)'
  },
  'Engineering & Maintenance': {
    department: 'Engineering & Maintenance',
    allowedGroups: ['maintenance', 'accessories', 'it'],
    defaultGroup: 'maintenance',
    description: 'Prioritizing Engineering & Maintenance Spares (Electricals, plumbing, hardware, HVAC parts)'
  },
  'IT Department': {
    department: 'IT Department',
    allowedGroups: ['it', 'administrative', 'accessories'],
    defaultGroup: 'it',
    description: 'Prioritizing IT Equipment (Network cables, POS accessories, toners, keycard encoders, computer spares)'
  },
  'Front Office': {
    department: 'Front Office',
    allowedGroups: ['administrative', 'it', 'accessories'],
    defaultGroup: 'administrative',
    description: 'Prioritizing Administrative Items (Guest registration pads, hotel stationery, receipt paper, keycards)'
  },
  'Administration & HR': {
    department: 'Administration & HR',
    allowedGroups: ['administrative', 'it', 'accessories'],
    defaultGroup: 'administrative',
    description: 'Prioritizing Office Supplies, Printing Paper, Administrative Documents & General Stationery'
  }
};

class InventoryMenuService {
  // Helper to get raw state
  public getState() {
    return pmsService.getDatabase();
  }

  // Subscribe to updates
  public subscribe(listener: (state: any) => void): () => void {
    return pmsService.subscribe(listener);
  }

  // Helper to commit state changes & notify listeners
  private saveAndNotify() {
    pmsService.notify();
  }

  // ========================================================
  // 1. UNITS OF MEASURE (UOM)
  // ========================================================
  getUoms(): UnitOfMeasure[] {
    const state = this.getState();
    if (!state.uoms || state.uoms.length === 0) {
      state.uoms = JSON.parse(JSON.stringify(SEED_UOMS));
    }
    return state.uoms;
  }

  addUom(uom: Omit<UnitOfMeasure, 'id'>): UnitOfMeasure {
    const state = this.getState();
    const newUom: UnitOfMeasure = {
      ...uom,
      id: `uom-${Date.now()}`
    };
    state.uoms.push(newUom);
    this.saveAndNotify();
    return newUom;
  }

  // ========================================================
  // 2. INVENTORY CATEGORIES
  // ========================================================
  getCategories(): InventoryCategory[] {
    const state = this.getState();
    if (!state.inventoryCategories || state.inventoryCategories.length === 0) {
      state.inventoryCategories = JSON.parse(JSON.stringify(SEED_INVENTORY_CATEGORIES));
    }
    return state.inventoryCategories;
  }

  addCategory(category: Omit<InventoryCategory, 'id'>): InventoryCategory {
    const state = this.getState();
    const newCat: InventoryCategory = {
      ...category,
      id: `icat-${Date.now()}`
    };
    state.inventoryCategories.push(newCat);
    this.saveAndNotify();
    return newCat;
  }

  // ========================================================
  // 3. WAREHOUSES & STORAGE STORES
  // ========================================================
  getWarehouses(): WarehouseStore[] {
    const state = this.getState();
    if (!state.warehouses || state.warehouses.length === 0) {
      state.warehouses = JSON.parse(JSON.stringify(SEED_WAREHOUSES));
    }
    return state.warehouses;
  }

  addWarehouse(store: Omit<WarehouseStore, 'id'>): WarehouseStore {
    const state = this.getState();
    const newStore: WarehouseStore = {
      ...store,
      id: `wh-${Date.now()}`
    };
    state.warehouses.push(newStore);
    this.saveAndNotify();
    return newStore;
  }

  updateWarehouse(id: string, updates: Partial<WarehouseStore>): void {
    const state = this.getState();
    const index = state.warehouses.findIndex(w => w.id === id);
    if (index !== -1) {
      state.warehouses[index] = { ...state.warehouses[index], ...updates };
      this.saveAndNotify();
    }
  }

  deleteWarehouse(id: string): boolean {
    const state = this.getState();
    const idx = state.warehouses.findIndex(w => w.id === id);
    if (idx !== -1) {
      state.warehouses.splice(idx, 1);
      this.saveAndNotify();
      return true;
    }
    return false;
  }

  deleteCategory(id: string): boolean {
    const state = this.getState();
    const idx = state.inventoryCategories.findIndex(c => c.id === id);
    if (idx !== -1) {
      state.inventoryCategories.splice(idx, 1);
      this.saveAndNotify();
      return true;
    }
    return false;
  }

  deleteUom(id: string): boolean {
    const state = this.getState();
    const idx = state.uoms.findIndex(u => u.id === id);
    if (idx !== -1) {
      state.uoms.splice(idx, 1);
      this.saveAndNotify();
      return true;
    }
    return false;
  }

  // ========================================================
  // 4. SUPPLIERS & VENDORS
  // ========================================================
  getSuppliers(): Supplier[] {
    const state = this.getState();
    if (!state.suppliers || state.suppliers.length === 0) {
      state.suppliers = JSON.parse(JSON.stringify(SEED_SUPPLIERS));
    }
    const sups = state.suppliers || [];
    return sups.map(s => ({
      ...s,
      creditLimit: s.creditLimit ?? 300000,
      currentPayableBalance: s.currentPayableBalance ?? 0,
      taxNumber: s.taxNumber || s.tradeLicense || 'TIN-00000000'
    }));
  }

  addSupplier(supplier: Omit<Supplier, 'id' | 'createdAt' | 'currentPayableBalance'>): Supplier {
    const state = this.getState();
    const newSup: Supplier = {
      ...supplier,
      creditLimit: supplier.creditLimit ?? 300000,
      id: `sup-${Date.now()}`,
      currentPayableBalance: 0,
      createdAt: new Date().toISOString()
    };
    state.suppliers.push(newSup);
    this.saveAndNotify();
    return newSup;
  }

  updateSupplier(id: string, updates: Partial<Supplier>): void {
    const state = this.getState();
    const idx = state.suppliers.findIndex(s => s.id === id);
    if (idx !== -1) {
      state.suppliers[idx] = { ...state.suppliers[idx], ...updates };
      this.saveAndNotify();
    }
  }

  // ========================================================
  // 5. INVENTORY ITEMS MASTER & STOCK LEVELS
  // ========================================================
  getInventoryItems(): InventoryItem[] {
    const state = this.getState();
    if (!state.inventoryItems || state.inventoryItems.length === 0) {
      state.inventoryItems = JSON.parse(JSON.stringify(SEED_INVENTORY_ITEMS));
    }
    const rawItems = state.inventoryItems || [];
    return rawItems.map(item => ({
      ...item,
      itemGroup: item.itemGroup || determineItemGroup(item)
    }));
  }

  getItemGroup(item: Partial<InventoryItem>): ItemGroupType {
    return determineItemGroup(item);
  }

  determineItemGroup(item: { name?: string; categoryName?: string; itemType?: string; subcategory?: string; description?: string }): ItemGroupType {
    return determineItemGroup(item);
  }

  getDepartmentRule(department: string): DepartmentItemGroupRule {
    return DEPARTMENT_ITEM_GROUP_RULES[department] || {
      department,
      allowedGroups: ['food', 'housekeeping', 'maintenance', 'it', 'administrative', 'accessories'],
      defaultGroup: 'food',
      description: 'Standard departmental supply requisitions'
    };
  }

  getInventoryItemById(id: string): InventoryItem | undefined {
    return this.getState().inventoryItems.find(i => i.id === id);
  }

  getWarehouseStocks(itemId?: string): InventoryStockByWarehouse[] {
    const stocks = this.getState().inventoryStocks || [];
    if (itemId) {
      return stocks.filter(s => s.itemId === itemId);
    }
    return stocks;
  }

  getBatches(itemId?: string): ItemBatchRecord[] {
    const batches = this.getState().itemBatches || [];
    if (itemId) {
      return batches.filter(b => b.itemId === itemId);
    }
    return batches;
  }

  /**
   * Automatically generate a unique, clean SKU for an inventory item.
   * e.g., "Basmati Rice" + "Food Ingredient" -> "SKU-RICE-0104" or "ITM-RICE-001"
   * Always collision-free against all existing items in the database.
   */
  generateItemSku(itemName?: string, categoryName?: string): string {
    const state = this.getState();
    const existingSkus = new Set(
      (state.inventoryItems || [])
        .map(i => (i.itemCode || '').trim().toUpperCase())
        .filter(Boolean)
    );

    // 1. Determine Category Tag
    let catTag = 'INV';
    if (categoryName) {
      const cleanCat = categoryName.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (cleanCat.includes('FOOD') || cleanCat.includes('INGREDIENT')) catTag = 'ING';
      else if (cleanCat.includes('BEV') || cleanCat.includes('DRINK') || cleanCat.includes('BAR')) catTag = 'BEV';
      else if (cleanCat.includes('LINEN') || cleanCat.includes('BED')) catTag = 'LIN';
      else if (cleanCat.includes('AMENIT') || cleanCat.includes('HOUSEKEEPING')) catTag = 'AMN';
      else if (cleanCat.includes('MEAT') || cleanCat.includes('CHICKEN') || cleanCat.includes('BEEF')) catTag = 'MET';
      else if (cleanCat.includes('SEAFOOD') || cleanCat.includes('FISH')) catTag = 'SEA';
      else if (cleanCat.includes('DAIRY') || cleanCat.includes('MILK')) catTag = 'DRY';
      else if (cleanCat.includes('VEG') || cleanCat.includes('PRODUCE')) catTag = 'VEG';
      else if (cleanCat.includes('SPICE') || cleanCat.includes('SEASONING')) catTag = 'SPC';
      else if (cleanCat.length >= 3) catTag = cleanCat.slice(0, 3);
    }

    // 2. Determine Item Name Tag
    let nameTag = '';
    if (itemName && itemName.trim()) {
      const words = itemName
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => !['PREMIUM', 'FRESH', 'ORGANIC', 'THE', 'AND', 'WITH', 'NEW', 'ITEM'].includes(w) && w.length >= 2);
      
      const targetWord = words[words.length - 1] || words[0] || itemName.toUpperCase().replace(/[^A-Z0-9]/g, '');
      nameTag = targetWord.slice(0, 4);
    }

    // 3. Construct base prefix (e.g. SKU-RICE or SKU-ING)
    const basePrefix = nameTag ? `SKU-${nameTag}` : `SKU-${catTag}`;

    // 4. Find the next available unique sequence number
    let counter = (state.inventoryItems || []).length + 1;
    let candidate = `${basePrefix}-${String(counter).padStart(3, '0')}`;
    while (existingSkus.has(candidate)) {
      counter++;
      candidate = `${basePrefix}-${String(counter).padStart(3, '0')}`;
    }

    return candidate;
  }

  addInventoryItem(item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'currentTotalStock' | 'currentTotalValue'>): InventoryItem {
    const state = this.getState();
    const finalItemCode = (item.itemCode && item.itemCode.trim())
      ? item.itemCode.trim().toUpperCase()
      : this.generateItemSku(item.name, item.categoryName);

    const finalItemGroup = item.itemGroup || determineItemGroup(item);

    const newItem: InventoryItem = {
      ...item,
      itemCode: finalItemCode,
      itemGroup: finalItemGroup,
      id: `item-${Date.now()}`,
      currentTotalStock: item.openingStock || 0,
      currentTotalValue: (item.openingStock || 0) * (item.averageCost || 0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    state.inventoryItems.push(newItem);

    // Initial stock by default warehouse
    if (newItem.openingStock > 0 && newItem.defaultWarehouseId) {
      const wh = state.warehouses.find(w => w.id === newItem.defaultWarehouseId);
      state.inventoryStocks.push({
        id: `stk-${Date.now()}`,
        itemId: newItem.id,
        warehouseId: newItem.defaultWarehouseId,
        warehouseName: wh?.name || 'Default Store',
        quantity: newItem.openingStock,
        averageCost: newItem.averageCost,
        stockValue: newItem.openingStock * newItem.averageCost,
        lastUpdated: new Date().toISOString()
      });

      // Opening balance ledger entry
      state.stockLedgers.push({
        id: `sl-${Date.now()}`,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        transactionNumber: `TX-OPN-${Date.now().toString().slice(-4)}`,
        itemId: newItem.id,
        itemCode: newItem.itemCode,
        itemName: newItem.name,
        warehouseId: newItem.defaultWarehouseId,
        warehouseName: wh?.name || 'Default Store',
        transactionType: 'Opening Balance',
        referenceType: 'Adjustment',
        referenceId: 'OPN-INIT',
        referenceDocument: 'INITIAL-SETUP',
        quantityIn: newItem.openingStock,
        quantityOut: 0,
        unitCost: newItem.averageCost,
        totalCost: newItem.openingStock * newItem.averageCost,
        runningQuantity: newItem.openingStock,
        runningValue: newItem.openingStock * newItem.averageCost,
        businessDate: state.settings.currentBusinessDate,
        department: 'Inventory Management',
        user: state.currentUser?.name || 'System Admin',
        notes: 'Initial opening stock balance setup',
        createdAt: new Date().toISOString()
      });
    }

    this.saveAndNotify();
    return newItem;
  }

  updateInventoryItem(id: string, updates: Partial<InventoryItem>): void {
    const state = this.getState();
    const idx = state.inventoryItems.findIndex(i => i.id === id);
    if (idx !== -1) {
      state.inventoryItems[idx] = {
        ...state.inventoryItems[idx],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.saveAndNotify();
    }
  }

  getLowStockAlerts(): { item: InventoryItem; deficit: number; urgency: 'Low' | 'Medium' | 'Critical' }[] {
    const items = this.getInventoryItems();
    const alerts: { item: InventoryItem; deficit: number; urgency: 'Low' | 'Medium' | 'Critical' }[] = [];

    items.forEach(item => {
      if (item.currentTotalStock <= item.reorderLevel) {
        const deficit = item.reorderLevel - item.currentTotalStock;
        let urgency: 'Low' | 'Medium' | 'Critical' = 'Medium';
        if (item.currentTotalStock <= item.minimumStock) urgency = 'Critical';
        else if (item.currentTotalStock === 0) urgency = 'Critical';
        else if (deficit < 10) urgency = 'Low';

        alerts.push({ item, deficit, urgency });
      }
    });

    return alerts;
  }

  // ========================================================
  // 6. STOCK LEDGER & TRANSACTION AUDIT TRAIL
  // ========================================================
  getStockLedgers(filters?: { itemId?: string; warehouseId?: string; transactionType?: string }): StockLedgerEntry[] {
    let list = this.getState().stockLedgers || [];
    if (filters?.itemId) {
      list = list.filter(l => l.itemId === filters.itemId);
    }
    if (filters?.warehouseId) {
      list = list.filter(l => l.warehouseId === filters.warehouseId);
    }
    if (filters?.transactionType) {
      list = list.filter(l => l.transactionType === filters.transactionType);
    }
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // ========================================================
  // 7. STOCK ADJUSTMENTS
  // ========================================================
  getAdjustments(): StockAdjustment[] {
    return this.getState().stockAdjustments || [];
  }

  createStockAdjustment(adjustment: Omit<StockAdjustment, 'id' | 'adjustmentNumber' | 'createdAt'>): StockAdjustment {
    const state = this.getState();
    const adjNumber = `ADJ-2026-${(state.stockAdjustments.length + 1).toString().padStart(4, '0')}`;
    const newAdj: StockAdjustment = {
      ...adjustment,
      id: `adj-${Date.now()}`,
      adjustmentNumber: adjNumber,
      createdAt: new Date().toISOString()
    };
    state.stockAdjustments.push(newAdj);

    // Update item total stock
    const item = state.inventoryItems.find(i => i.id === adjustment.itemId);
    if (item) {
      if (adjustment.adjustmentType === 'Increase') {
        item.currentTotalStock += adjustment.quantity;
      } else {
        item.currentTotalStock = Math.max(0, item.currentTotalStock - adjustment.quantity);
      }
      item.currentTotalValue = item.currentTotalStock * item.averageCost;
    }

    // Update warehouse stock
    let whStock = state.inventoryStocks.find(s => s.itemId === adjustment.itemId && s.warehouseId === adjustment.warehouseId);
    if (!whStock) {
      whStock = {
        id: `stk-${Date.now()}`,
        itemId: adjustment.itemId,
        warehouseId: adjustment.warehouseId,
        warehouseName: adjustment.warehouseName,
        quantity: 0,
        averageCost: adjustment.unitCost,
        stockValue: 0,
        lastUpdated: new Date().toISOString()
      };
      state.inventoryStocks.push(whStock);
    }

    if (adjustment.adjustmentType === 'Increase') {
      whStock.quantity += adjustment.quantity;
    } else {
      whStock.quantity = Math.max(0, whStock.quantity - adjustment.quantity);
    }
    whStock.stockValue = whStock.quantity * whStock.averageCost;
    whStock.lastUpdated = new Date().toISOString();

    // Create Stock Ledger Entry
    state.stockLedgers.push({
      id: `sl-${Date.now()}`,
      date: adjustment.date,
      transactionNumber: `TX-${adjNumber}`,
      itemId: adjustment.itemId,
      itemCode: adjustment.itemCode,
      itemName: adjustment.itemName,
      warehouseId: adjustment.warehouseId,
      warehouseName: adjustment.warehouseName,
      transactionType: adjustment.adjustmentType === 'Increase' ? 'Adjustment Increase' : 'Adjustment Decrease',
      referenceType: 'Adjustment',
      referenceId: newAdj.id,
      referenceDocument: adjNumber,
      quantityIn: adjustment.adjustmentType === 'Increase' ? adjustment.quantity : 0,
      quantityOut: adjustment.adjustmentType === 'Decrease' ? adjustment.quantity : 0,
      unitCost: adjustment.unitCost,
      totalCost: adjustment.totalValue,
      runningQuantity: whStock.quantity,
      runningValue: whStock.stockValue,
      businessDate: state.settings.currentBusinessDate,
      department: 'Inventory Management',
      user: adjustment.adjustedBy,
      notes: adjustment.reason,
      createdAt: new Date().toISOString()
    });

    // Generate Accounting Journal Voucher for stock adjustment
    const jvNum = `JV-2026-${(state.journalVouchers.length + 1).toString().padStart(4, '0')}`;
    const isBar = adjustment.warehouseId === 'wh-bar' || (item && (item.itemType === 'Beverage' || item.itemType === 'Bar Item'));
    const invCode = isBar ? '1310' : '1300';
    const invName = isBar ? 'Bar & Beverage Store Inventory' : 'Food & Beverage Store Inventory';
    const absVal = Math.round(adjustment.totalValue * 100) / 100;

    if (absVal > 0) {
      const isIncrease = adjustment.adjustmentType === 'Increase';
      const jv: JournalVoucher = {
        id: `jv-${Date.now()}`,
        voucherNumber: jvNum,
        date: adjustment.date,
        sourceModule: 'Inventory Audit',
        sourceReference: adjNumber,
        narration: `Stock Adjustment (${adjustment.adjustmentType}): ${adjustment.quantity} ${adjustment.uom} of ${adjustment.itemName} - ${adjustment.reason}`,
        entries: isIncrease ? [
          { id: `jve-adj-1-${Date.now()}`, accountCode: invCode, accountName: invName, debit: absVal, credit: 0, memo: `Stock inventory gain adjustment` },
          { id: `jve-adj-2-${Date.now()}`, accountCode: '5029', accountName: 'Inventory Shrinkage & Audit Variance', debit: 0, credit: absVal, memo: `Audit variance surplus credit` }
        ] : [
          { id: `jve-adj-1-${Date.now()}`, accountCode: '5029', accountName: 'Inventory Shrinkage & Audit Variance', debit: absVal, credit: 0, memo: `Inventory shrinkage loss write-down` },
          { id: `jve-adj-2-${Date.now()}`, accountCode: invCode, accountName: invName, debit: 0, credit: absVal, memo: `Stock inventory asset deduction` }
        ],
        totalDebit: absVal,
        totalCredit: absVal,
        isBalanced: true,
        postedBy: adjustment.adjustedBy,
        postedAt: new Date().toISOString()
      };
      state.journalVouchers.push(jv);
      newAdj.journalVoucherNumber = jvNum;

      // Update GL balance
      const glInv = state.glAccounts.find(g => g.code === invCode);
      if (glInv) {
        if (isIncrease) glInv.balance += absVal;
        else glInv.balance = Math.max(0, glInv.balance - absVal);
      }
      const glVar = state.glAccounts.find(g => g.code === '5029');
      if (glVar) {
        if (isIncrease) glVar.balance -= absVal;
        else glVar.balance += absVal;
      }
    }

    this.saveAndNotify();
    return newAdj;
  }

  // ========================================================
  // 8. STORE TO STORE TRANSFERS
  // ========================================================
  getStockTransfers(): StockTransfer[] {
    return this.getState().stockTransfers || [];
  }

  createStockTransfer(transfer: Omit<StockTransfer, 'id' | 'transferNumber' | 'createdAt'>): StockTransfer {
    const state = this.getState();
    const trfNumber = `TRF-2026-${(state.stockTransfers.length + 1).toString().padStart(4, '0')}`;
    const newTrf: StockTransfer = {
      ...transfer,
      id: `trf-${Date.now()}`,
      transferNumber: trfNumber,
      createdAt: new Date().toISOString()
    };
    state.stockTransfers.push(newTrf);

    // If status is Received or In Transit, perform inventory deduction / movement
    if (transfer.status === 'Received') {
      transfer.items.forEach(tItem => {
        // Decrease source warehouse
        const srcWh = state.inventoryStocks.find(s => s.itemId === tItem.itemId && s.warehouseId === transfer.sourceWarehouseId);
        if (srcWh) {
          srcWh.quantity = Math.max(0, srcWh.quantity - tItem.quantity);
          srcWh.stockValue = srcWh.quantity * srcWh.averageCost;
          srcWh.lastUpdated = new Date().toISOString();
        }

        // Increase dest warehouse
        let destWh = state.inventoryStocks.find(s => s.itemId === tItem.itemId && s.warehouseId === transfer.destinationWarehouseId);
        if (!destWh) {
          destWh = {
            id: `stk-${Date.now()}-${tItem.itemId}`,
            itemId: tItem.itemId,
            warehouseId: transfer.destinationWarehouseId,
            warehouseName: transfer.destinationWarehouseName,
            quantity: 0,
            averageCost: tItem.unitCost,
            stockValue: 0,
            lastUpdated: new Date().toISOString()
          };
          state.inventoryStocks.push(destWh);
        }
        destWh.quantity += tItem.quantity;
        destWh.stockValue = destWh.quantity * destWh.averageCost;
        destWh.lastUpdated = new Date().toISOString();

        // Source Out Ledger
        state.stockLedgers.push({
          id: `sl-${Date.now()}-out`,
          date: transfer.transferDate,
          transactionNumber: `TX-${trfNumber}-OUT`,
          itemId: tItem.itemId,
          itemCode: tItem.itemCode,
          itemName: tItem.itemName,
          warehouseId: transfer.sourceWarehouseId,
          warehouseName: transfer.sourceWarehouseName,
          transactionType: 'Store Transfer Out',
          referenceType: 'Transfer',
          referenceId: newTrf.id,
          referenceDocument: trfNumber,
          quantityIn: 0,
          quantityOut: tItem.quantity,
          unitCost: tItem.unitCost,
          totalCost: tItem.totalCost,
          runningQuantity: srcWh ? srcWh.quantity : 0,
          runningValue: srcWh ? srcWh.stockValue : 0,
          businessDate: state.settings.currentBusinessDate,
          department: transfer.sourceWarehouseName,
          user: transfer.requestedBy,
          notes: `Transferred to ${transfer.destinationWarehouseName}`,
          createdAt: new Date().toISOString()
        });

        // Destination In Ledger
        state.stockLedgers.push({
          id: `sl-${Date.now()}-in`,
          date: transfer.transferDate,
          transactionNumber: `TX-${trfNumber}-IN`,
          itemId: tItem.itemId,
          itemCode: tItem.itemCode,
          itemName: tItem.itemName,
          warehouseId: transfer.destinationWarehouseId,
          warehouseName: transfer.destinationWarehouseName,
          transactionType: 'Store Transfer In',
          referenceType: 'Transfer',
          referenceId: newTrf.id,
          referenceDocument: trfNumber,
          quantityIn: tItem.quantity,
          quantityOut: 0,
          unitCost: tItem.unitCost,
          totalCost: tItem.totalCost,
          runningQuantity: destWh.quantity,
          runningValue: destWh.stockValue,
          businessDate: state.settings.currentBusinessDate,
          department: transfer.destinationWarehouseName,
          user: transfer.receivedBy || transfer.requestedBy,
          notes: `Received from ${transfer.sourceWarehouseName}`,
          createdAt: new Date().toISOString()
        });
      });
    }

    this.saveAndNotify();
    return newTrf;
  }

  // ========================================================
  // 9. PROCUREMENT: PURCHASE REQUESTS & PURCHASE ORDERS
  // ========================================================
  getPurchaseRequests(): PurchaseRequest[] {
    return this.getState().purchaseRequests || [];
  }

  createPurchaseRequest(request: Omit<PurchaseRequest, 'id' | 'requestNumber' | 'createdAt'>): PurchaseRequest {
    const state = this.getState();
    const reqNum = `REQ-2026-${(state.purchaseRequests.length + 1).toString().padStart(4, '0')}`;
    const newReq: PurchaseRequest = {
      ...request,
      id: `req-${Date.now()}`,
      requestNumber: reqNum,
      createdAt: new Date().toISOString()
    };
    state.purchaseRequests.push(newReq);
    this.saveAndNotify();
    return newReq;
  }

  getPurchaseOrders(): PurchaseOrder[] {
    return this.getState().purchaseOrders || [];
  }

  createPurchaseOrder(po: Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt'>): PurchaseOrder {
    const state = this.getState();
    const poNum = `PO-2026-${(state.purchaseOrders.length + 1).toString().padStart(4, '0')}`;
    const newPo: PurchaseOrder = {
      ...po,
      id: `po-${Date.now()}`,
      poNumber: poNum,
      createdAt: new Date().toISOString()
    };
    state.purchaseOrders.push(newPo);

    // Update Requisition status if linked
    if (po.requisitionId) {
      const req = state.purchaseRequests.find(r => r.id === po.requisitionId);
      if (req) req.status = 'PO Generated';
    }

    this.saveAndNotify();
    return newPo;
  }

  // ========================================================
  // 10. GOODS RECEIVE NOTE (GRN) & ACCOUNTING POSTING
  // ========================================================
  getGoodsReceiveNotes(): GoodsReceiveNote[] {
    return this.getState().goodsReceiveNotes || [];
  }

  createGoodsReceiveNote(grnData: Omit<GoodsReceiveNote, 'id' | 'grnNumber' | 'createdAt' | 'journalVoucherNumber'>): GoodsReceiveNote {
    const state = this.getState();
    const grnNum = `GRN-2026-${(state.goodsReceiveNotes.length + 1).toString().padStart(4, '0')}`;
    
    // 1. Create Accounting Journal Voucher:
    // Dr Inventory (1300 Food / 1310 Bar), Cr Accounts Payable (2050)
    const isBar = grnData.warehouseId === 'wh-bar';
    const inventoryAccountCode = isBar ? '1310' : '1300';
    const inventoryAccountName = isBar ? 'Bar & Beverage Store Inventory' : 'Food & Beverage Store Inventory';

    const jvNum = `JV-2026-${(state.journalVouchers.length + 1).toString().padStart(4, '0')}`;
    const jv: JournalVoucher = {
      id: `jv-${Date.now()}`,
      voucherNumber: jvNum,
      date: grnData.receiveDate,
      sourceModule: 'Inventory GRN',
      sourceReference: grnNum,
      narration: `Goods received against Challan #${grnData.challanNumber} from ${grnData.supplierName}`,
      entries: [
        {
          id: `jve-grn-dr-${Date.now()}`,
          accountCode: inventoryAccountCode,
          accountName: inventoryAccountName,
          debit: grnData.totalAcceptedAmount,
          credit: 0,
          memo: `Inventory received into ${grnData.warehouseName}`
        },
        {
          id: `jve-grn-cr-${Date.now()}`,
          accountCode: '2050',
          accountName: 'Accounts Payable / Trade Creditors',
          debit: 0,
          credit: grnData.totalAcceptedAmount,
          memo: `Payable to supplier: ${grnData.supplierName}`
        }
      ],
      totalDebit: grnData.totalAcceptedAmount,
      totalCredit: grnData.totalAcceptedAmount,
      isBalanced: true,
      postedBy: grnData.receivedBy,
      postedAt: new Date().toISOString()
    };
    state.journalVouchers.push(jv);

    // Update GL Account balances
    const invGl = state.glAccounts.find(g => g.code === inventoryAccountCode);
    if (invGl) invGl.balance += grnData.totalAcceptedAmount;
    const apGl = state.glAccounts.find(g => g.code === '2050');
    if (apGl) apGl.balance += grnData.totalAcceptedAmount;

    // Update Supplier payable balance
    const sup = state.suppliers.find(s => s.id === grnData.supplierId);
    if (sup) {
      sup.currentPayableBalance += grnData.totalAcceptedAmount;
    }

    // 2. Create GRN
    const newGrn: GoodsReceiveNote = {
      ...grnData,
      id: `grn-${Date.now()}`,
      grnNumber: grnNum,
      journalVoucherNumber: jvNum,
      createdAt: new Date().toISOString()
    };
    state.goodsReceiveNotes.push(newGrn);

    // 3. Update stock levels, batches, and ledger
    grnData.items.forEach(item => {
      const invItem = state.inventoryItems.find(i => i.id === item.itemId);
      if (invItem) {
        // Weighted Moving Average Cost Calculation
        const prevTotalVal = invItem.currentTotalStock * invItem.averageCost;
        const newStockVal = item.acceptedQuantity * item.unitPrice;
        invItem.currentTotalStock += item.acceptedQuantity;
        if (invItem.currentTotalStock > 0) {
          invItem.averageCost = Math.round(((prevTotalVal + newStockVal) / invItem.currentTotalStock) * 100) / 100;
        }
        invItem.lastPurchaseCost = item.unitPrice;
        invItem.currentTotalValue = invItem.currentTotalStock * invItem.averageCost;
        invItem.updatedAt = new Date().toISOString();
      }

      // Warehouse stock
      let whStock = state.inventoryStocks.find(s => s.itemId === item.itemId && s.warehouseId === grnData.warehouseId);
      if (!whStock) {
        whStock = {
          id: `stk-${Date.now()}-${item.itemId}`,
          itemId: item.itemId,
          warehouseId: grnData.warehouseId,
          warehouseName: grnData.warehouseName,
          quantity: 0,
          averageCost: item.unitPrice,
          stockValue: 0,
          lastUpdated: new Date().toISOString()
        };
        state.inventoryStocks.push(whStock);
      }
      whStock.quantity += item.acceptedQuantity;
      whStock.stockValue = whStock.quantity * (invItem?.averageCost || item.unitPrice);
      whStock.lastUpdated = new Date().toISOString();

      // Create Batch Record if applicable
      if (item.batchNumber) {
        state.itemBatches.push({
          id: `bat-${Date.now()}-${item.itemId}`,
          itemId: item.itemId,
          itemCode: item.itemCode,
          itemName: item.itemName,
          warehouseId: grnData.warehouseId,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate || new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().split('T')[0],
          receivedDate: grnData.receiveDate,
          quantity: item.acceptedQuantity,
          remainingQuantity: item.acceptedQuantity,
          unitCost: item.unitPrice,
          supplierName: grnData.supplierName,
          grnNumber: grnNum,
          status: 'Fresh'
        });
      }

      // Stock Ledger Entry
      state.stockLedgers.push({
        id: `sl-${Date.now()}-${item.itemId}`,
        date: grnData.receiveDate,
        transactionNumber: `TX-${grnNum}`,
        itemId: item.itemId,
        itemCode: item.itemCode,
        itemName: item.itemName,
        warehouseId: grnData.warehouseId,
        warehouseName: grnData.warehouseName,
        transactionType: 'Purchase Receive',
        referenceType: 'GRN',
        referenceId: newGrn.id,
        referenceDocument: grnNum,
        quantityIn: item.acceptedQuantity,
        quantityOut: 0,
        unitCost: item.unitPrice,
        totalCost: item.totalPrice,
        runningQuantity: whStock.quantity,
        runningValue: whStock.stockValue,
        businessDate: state.settings.currentBusinessDate,
        department: 'Procurement & Warehouse',
        user: grnData.receivedBy,
        notes: `Received from ${grnData.supplierName} (Challan: ${grnData.challanNumber})`,
        createdAt: new Date().toISOString()
      });
    });

    // Update PO status if linked
    if (grnData.poId) {
      const po = state.purchaseOrders.find(p => p.id === grnData.poId);
      if (po) {
        po.receivedTotalValue += grnData.totalAcceptedAmount;
        if (po.receivedTotalValue >= po.grandTotal) {
          po.status = 'Fully Received';
        } else {
          po.status = 'Partially Received';
        }
      }
    }

    this.saveAndNotify();
    return newGrn;
  }

  updatePurchaseRequestStatus(id: string, status: PurchaseRequest['status'], approverName?: string, remarks?: string): PurchaseRequest | undefined {
    const state = this.getState();
    const req = (state.purchaseRequests || []).find(r => r.id === id);
    if (req) {
      req.status = status;
      if (approverName) req.approvedBy = approverName;
      if (remarks) req.remarks = remarks;
      if (status === 'Approved' || status === 'PO Generated') {
        req.approvedAt = new Date().toISOString();
      }
      this.saveAndNotify();
    }
    return req;
  }

  updatePurchaseOrderStatus(id: string, status: PurchaseOrder['status'], approverName?: string): PurchaseOrder | undefined {
    const state = this.getState();
    const po = (state.purchaseOrders || []).find(p => p.id === id);
    if (po) {
      po.status = status;
      if (approverName) po.approvedBy = approverName;
      this.saveAndNotify();
    }
    return po;
  }

  // ========================================================
  // 10B. PURCHASE RETURNS & DEBIT NOTES
  // ========================================================
  getPurchaseReturns(): PurchaseReturn[] {
    return this.getState().purchaseReturns || [];
  }

  createPurchaseReturn(returnData: Omit<PurchaseReturn, 'id' | 'returnNumber' | 'createdAt'>): PurchaseReturn {
    const state = this.getState();
    const prnNum = `PRN-2026-${((state.purchaseReturns || []).length + 1).toString().padStart(4, '0')}`;
    
    // Create accounting JV for Purchase Return: Dr Accounts Payable (2050), Cr Purchase Return Recovery / Inventory (5015/1300)
    const jvNum = `JV-2026-${(state.journalVouchers.length + 1).toString().padStart(4, '0')}`;
    const jv: JournalVoucher = {
      id: `jv-${Date.now()}`,
      voucherNumber: jvNum,
      date: returnData.returnDate,
      sourceModule: 'Purchase Return',
      sourceReference: prnNum,
      narration: `Debit note issued to ${returnData.supplierName} for return of goods (${returnData.reason})`,
      entries: [
        {
          id: `jve-prn-dr-${Date.now()}`,
          accountCode: '2050',
          accountName: 'Accounts Payable / Trade Creditors',
          debit: returnData.totalAmount,
          credit: 0,
          memo: `Debit note to ${returnData.supplierName}`
        },
        {
          id: `jve-prn-cr-${Date.now()}`,
          accountCode: '5015',
          accountName: 'Purchase Returns & Allowances Recovery',
          debit: 0,
          credit: returnData.totalAmount,
          memo: `Returned items inventory credit`
        }
      ],
      totalDebit: returnData.totalAmount,
      totalCredit: returnData.totalAmount,
      isBalanced: true,
      postedBy: returnData.returnedBy,
      postedAt: new Date().toISOString()
    };
    state.journalVouchers.push(jv);

    // Update GL balance & Supplier Payable balance
    const apGl = state.glAccounts.find(g => g.code === '2050');
    if (apGl) apGl.balance = Math.max(0, apGl.balance - returnData.totalAmount);
    
    const retGl = state.glAccounts.find(g => g.code === '5015');
    if (retGl) retGl.balance -= returnData.totalAmount;

    const sup = (state.suppliers || []).find(s => s.id === returnData.supplierId);
    if (sup) {
      sup.currentPayableBalance = Math.max(0, sup.currentPayableBalance - returnData.totalAmount);
    }

    // Deduct stock for returned items
    returnData.items.forEach(item => {
      const invItem = state.inventoryItems.find(i => i.id === item.itemId);
      if (invItem) {
        invItem.currentTotalStock = Math.max(0, invItem.currentTotalStock - item.quantity);
        invItem.currentTotalValue = invItem.currentTotalStock * invItem.averageCost;
      }

      const whStock = state.inventoryStocks.find(s => s.itemId === item.itemId && s.warehouseId === returnData.warehouseId);
      if (whStock) {
        whStock.quantity = Math.max(0, whStock.quantity - item.quantity);
        whStock.stockValue = whStock.quantity * whStock.averageCost;
        whStock.lastUpdated = new Date().toISOString();
      }

      state.stockLedgers.push({
        id: `sl-${Date.now()}-${item.itemId}`,
        date: returnData.returnDate,
        transactionNumber: `TX-${prnNum}`,
        itemId: item.itemId,
        itemCode: item.itemCode,
        itemName: item.itemName,
        warehouseId: returnData.warehouseId,
        warehouseName: returnData.warehouseName,
        transactionType: 'Purchase Return',
        referenceType: 'Return',
        referenceId: prnNum,
        referenceDocument: prnNum,
        quantityIn: 0,
        quantityOut: item.quantity,
        unitCost: item.unitPrice,
        totalCost: item.totalAmount,
        runningQuantity: whStock ? whStock.quantity : 0,
        runningValue: whStock ? whStock.stockValue : 0,
        businessDate: state.settings.currentBusinessDate,
        department: 'Procurement',
        user: returnData.returnedBy,
        notes: `Purchase return to ${returnData.supplierName}: ${item.reason || returnData.reason}`,
        createdAt: new Date().toISOString()
      });
    });

    const newReturn: PurchaseReturn = {
      ...returnData,
      id: `prn-${Date.now()}`,
      returnNumber: prnNum,
      createdAt: new Date().toISOString()
    };
    if (!state.purchaseReturns) state.purchaseReturns = [];
    state.purchaseReturns.push(newReturn);

    this.saveAndNotify();
    return newReturn;
  }

  // ========================================================
  // 10C. PURCHASE BILLS / VENDOR INVOICES (ACCOUNTS PAYABLE)
  // ========================================================
  getPurchaseBills(): PurchaseBill[] {
    return this.getState().purchaseBills || [];
  }

  createPurchaseBill(billData: Omit<PurchaseBill, 'id' | 'billNumber' | 'paidAmount' | 'dueAmount' | 'createdAt' | 'journalVoucherNumber'>): PurchaseBill {
    const state = this.getState();
    const billNum = `BILL-2026-${((state.purchaseBills || []).length + 1).toString().padStart(4, '0')}`;
    const totalAmount = billData.subtotal + billData.taxAmount - (billData.discountAmount || 0);

    // Create Accounting JV for Purchase Bill:
    // Dr GL Expense / Inventory Account (e.g. 1300, 5010, 5020, 5030), Cr Accounts Payable (2050)
    const jvNum = `JV-2026-${(state.journalVouchers.length + 1).toString().padStart(4, '0')}`;
    const jv: JournalVoucher = {
      id: `jv-${Date.now()}`,
      voucherNumber: jvNum,
      date: billData.billDate,
      sourceModule: 'Purchase Bill',
      sourceReference: billNum,
      narration: `Vendor Invoice #${billData.supplierInvoiceNumber} from ${billData.supplierName}`,
      entries: [
        {
          id: `jve-bill-dr-${Date.now()}`,
          accountCode: billData.glDebitAccountCode || '5020',
          accountName: billData.glDebitAccountName || 'F&B Kitchen Raw Materials & Consumables',
          debit: totalAmount,
          credit: 0,
          memo: `Invoice #${billData.supplierInvoiceNumber} from ${billData.supplierName}`
        },
        {
          id: `jve-bill-cr-${Date.now()}`,
          accountCode: billData.glCreditAccountCode || '2050',
          accountName: billData.glCreditAccountName || 'Accounts Payable / Trade Creditors',
          debit: 0,
          credit: totalAmount,
          memo: `Payable for Invoice #${billData.supplierInvoiceNumber}`
        }
      ],
      totalDebit: totalAmount,
      totalCredit: totalAmount,
      isBalanced: true,
      postedBy: billData.createdBy,
      postedAt: new Date().toISOString()
    };
    state.journalVouchers.push(jv);

    // Update GL Accounts
    const drGl = state.glAccounts.find(g => g.code === billData.glDebitAccountCode);
    if (drGl) drGl.balance += totalAmount;
    const apGl = state.glAccounts.find(g => g.code === (billData.glCreditAccountCode || '2050'));
    if (apGl) apGl.balance += totalAmount;

    // Update Supplier Payable Balance
    const sup = (state.suppliers || []).find(s => s.id === billData.supplierId);
    if (sup) {
      sup.currentPayableBalance += totalAmount;
    }

    const newBill: PurchaseBill = {
      ...billData,
      id: `bill-${Date.now()}`,
      billNumber: billNum,
      totalAmount,
      paidAmount: 0,
      dueAmount: totalAmount,
      journalVoucherNumber: jvNum,
      createdAt: new Date().toISOString()
    };

    if (!state.purchaseBills) state.purchaseBills = [];
    state.purchaseBills.push(newBill);

    this.saveAndNotify();
    return newBill;
  }

  updatePurchaseBillStatus(id: string, status: PurchaseBill['status'], approverName?: string): PurchaseBill | undefined {
    const state = this.getState();
    const bill = (state.purchaseBills || []).find(b => b.id === id);
    if (bill) {
      bill.status = status;
      if (approverName) bill.approvedBy = approverName;
      this.saveAndNotify();
    }
    return bill;
  }

  // ========================================================
  // 10D. SUPPLIER PAYMENTS & SETTLEMENTS
  // ========================================================
  getSupplierPayments(): SupplierPayment[] {
    return this.getState().supplierPayments || [];
  }

  createSupplierPayment(paymentData: Omit<SupplierPayment, 'id' | 'paymentNumber' | 'createdAt' | 'journalVoucherNumber'>): SupplierPayment {
    const state = this.getState();
    const payNum = `SPAY-2026-${((state.supplierPayments || []).length + 1).toString().padStart(4, '0')}`;

    // Create Accounting JV for Supplier Payment:
    // Dr Accounts Payable (2050), Cr Bank/Cash (1010/1020)
    const jvNum = `JV-2026-${(state.journalVouchers.length + 1).toString().padStart(4, '0')}`;
    const jv: JournalVoucher = {
      id: `jv-${Date.now()}`,
      voucherNumber: jvNum,
      date: paymentData.paymentDate,
      sourceModule: 'Supplier Payment',
      sourceReference: payNum,
      narration: `Payment to ${paymentData.supplierName} via ${paymentData.paymentMethod} (Ref: ${paymentData.referenceNumber})`,
      entries: [
        {
          id: `jve-spay-dr-${Date.now()}`,
          accountCode: paymentData.glDebitAccountCode || '2050',
          accountName: paymentData.glDebitAccountName || 'Accounts Payable / Trade Creditors',
          debit: paymentData.amount,
          credit: 0,
          memo: `AP settlement to ${paymentData.supplierName}`
        },
        {
          id: `jve-spay-cr-${Date.now()}`,
          accountCode: paymentData.glCreditAccountCode || '1010',
          accountName: paymentData.glCreditAccountName || 'Cash in Vault & Commercial Bank Accounts',
          debit: 0,
          credit: paymentData.amount,
          memo: `Payment via ${paymentData.paymentMethod} Ref #${paymentData.referenceNumber}`
        }
      ],
      totalDebit: paymentData.amount,
      totalCredit: paymentData.amount,
      isBalanced: true,
      postedBy: paymentData.paidBy,
      postedAt: new Date().toISOString()
    };
    state.journalVouchers.push(jv);

    // Update GL Accounts
    const apGl = state.glAccounts.find(g => g.code === (paymentData.glDebitAccountCode || '2050'));
    if (apGl) apGl.balance = Math.max(0, apGl.balance - paymentData.amount);
    
    const bankGl = state.glAccounts.find(g => g.code === (paymentData.glCreditAccountCode || '1010'));
    if (bankGl) bankGl.balance = Math.max(0, bankGl.balance - paymentData.amount);

    // Update Supplier Payable balance
    const sup = (state.suppliers || []).find(s => s.id === paymentData.supplierId);
    if (sup) {
      sup.currentPayableBalance = Math.max(0, sup.currentPayableBalance - paymentData.amount);
    }

    // Update associated Bill paid/due amount if linked
    if (paymentData.billId) {
      const bill = (state.purchaseBills || []).find(b => b.id === paymentData.billId);
      if (bill) {
        bill.paidAmount = Math.min(bill.totalAmount, bill.paidAmount + paymentData.amount);
        bill.dueAmount = Math.max(0, bill.totalAmount - bill.paidAmount);
        if (bill.dueAmount === 0) {
          bill.status = 'Paid';
        } else {
          bill.status = 'Partially Paid';
        }
      }
    }

    const newPayment: SupplierPayment = {
      ...paymentData,
      id: `spay-${Date.now()}`,
      paymentNumber: payNum,
      journalVoucherNumber: jvNum,
      createdAt: new Date().toISOString()
    };

    if (!state.supplierPayments) state.supplierPayments = [];
    state.supplierPayments.push(newPayment);

    this.saveAndNotify();
    return newPayment;
  }

  // ========================================================
  // 10E. PROCUREMENT & ACCOUNTS FINANCIAL REPORTS
  // ========================================================
  getProcurementSpendByGLReport(): ProcurementSpendByGLAccount[] {
    const state = this.getState();
    const bills = state.purchaseBills || [];
    const grns = state.goodsReceiveNotes || [];

    const map = new Map<string, { name: string; category: string; count: number; total: number; department: string }>();

    // Default standard mappings
    map.set('1300', { name: 'Food & Raw Ingredients Inventory Asset', category: 'Inventory Assets', count: 0, total: 0, department: 'F&B Kitchen' });
    map.set('1310', { name: 'Bar & Lounge Beverages Inventory Asset', category: 'Inventory Assets', count: 0, total: 0, department: 'Bar & Lounge' });
    map.set('1320', { name: 'Housekeeping Supplies & Room Amenities Stock', category: 'Inventory Assets', count: 0, total: 0, department: 'Housekeeping' });
    map.set('5010', { name: 'Housekeeping Linen & Guest Room Supplies', category: 'Hotel Operations', count: 0, total: 0, department: 'Housekeeping' });
    map.set('5020', { name: 'F&B Kitchen Raw Materials & Consumables', category: 'F&B Costs', count: 0, total: 0, department: 'F&B Kitchen' });
    map.set('5030', { name: 'Engineering, Facility & Maintenance Repairs', category: 'Maintenance', count: 0, total: 0, department: 'Engineering' });
    map.set('5040', { name: 'Power, Generator Diesel & Utilities', category: 'Utilities', count: 0, total: 0, department: 'Engineering / Operations' });

    // Aggregate bills
    bills.forEach(b => {
      const code = b.glDebitAccountCode || '5020';
      const existing = map.get(code) || { name: b.glDebitAccountName || 'General Procurement', category: 'Direct Cost', count: 0, total: 0, department: 'General Store' };
      existing.count += 1;
      existing.total += b.totalAmount;
      map.set(code, existing);
    });

    // Also factor GRNs if not billed
    grns.forEach(g => {
      const isBar = g.warehouseId === 'wh-bar';
      const code = isBar ? '1310' : '1300';
      const existing = map.get(code);
      if (existing) {
        existing.count += 1;
        existing.total += g.totalAcceptedAmount;
      }
    });

    const totalOverall = Array.from(map.values()).reduce((sum, item) => sum + item.total, 0) || 1;

    const result: ProcurementSpendByGLAccount[] = [];
    map.forEach((data, code) => {
      if (data.total > 0 || ['1300', '1310', '5010', '5020'].includes(code)) {
        result.push({
          glAccountCode: code,
          glAccountName: data.name,
          category: data.category,
          transactionCount: data.count,
          totalSpent: data.total,
          percentageOfTotal: Math.round((data.total / totalOverall) * 1000) / 10,
          department: data.department
        });
      }
    });

    return result.sort((a, b) => b.totalSpent - a.totalSpent);
  }

  getAPAgingReport(): APAgingBucket[] {
    const state = this.getState();
    const suppliers = state.suppliers || [];
    const bills = state.purchaseBills || [];

    const now = new Date('2026-09-02');

    return suppliers.map(sup => {
      const supBills = bills.filter(b => b.supplierId === sup.id && b.status !== 'Paid' && b.status !== 'Void');
      
      let notDue = 0;
      let days1To30 = 0;
      let days31To60 = 0;
      let days61To90 = 0;
      let daysOver90 = 0;

      supBills.forEach(b => {
        const due = new Date(b.dueDate);
        const diffDays = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
        const amount = b.dueAmount || b.totalAmount;

        if (diffDays <= 0) {
          notDue += amount;
        } else if (diffDays <= 30) {
          days1To30 += amount;
        } else if (diffDays <= 60) {
          days31To60 += amount;
        } else if (diffDays <= 90) {
          days61To90 += amount;
        } else {
          daysOver90 += amount;
        }
      });

      const totalOutstanding = notDue + days1To30 + days31To60 + days61To90 + daysOver90 || sup.currentPayableBalance || 0;
      
      const supCreditLimit = sup.creditLimit ?? 300000;
      let creditRisk: APAgingBucket['creditRisk'] = 'Low';
      if (daysOver90 > 0 || totalOutstanding > supCreditLimit * 0.9) {
        creditRisk = 'Critical';
      } else if (days61To90 > 0 || totalOutstanding > supCreditLimit * 0.7) {
        creditRisk = 'High';
      } else if (days31To60 > 0) {
        creditRisk = 'Moderate';
      }

      return {
        supplierId: sup.id,
        supplierName: sup.name,
        contactPerson: sup.contactPerson,
        phone: sup.phone,
        paymentTerms: sup.paymentTerms,
        currentNotDue: notDue,
        days1To30,
        days31To60,
        days61To90,
        daysOver90,
        totalOutstanding,
        creditLimit: supCreditLimit,
        creditRisk
      };
    });
  }

  getThreeWayReconciliationReport(): ThreeWayReconciliationItem[] {
    const state = this.getState();
    const pos = state.purchaseOrders || [];
    const grns = state.goodsReceiveNotes || [];
    const bills = state.purchaseBills || [];

    return pos.map(po => {
      const linkedGrn = grns.find(g => g.poId === po.id);
      const linkedBill = bills.find(b => b.poId === po.id || (linkedGrn && b.grnId === linkedGrn.id));

      let status: ThreeWayReconciliationItem['status'] = 'Partially Received';
      if (linkedBill) {
        if (linkedBill.status === 'Paid') {
          status = 'Matched & Fully Settled';
        } else if (linkedBill.dueAmount > 0) {
          status = 'Pending Payment';
        }
      } else if (linkedGrn) {
        status = 'Unbilled GRN';
      }

      return {
        poNumber: po.poNumber,
        poDate: po.orderDate,
        supplierName: po.supplierName,
        poAmount: po.grandTotal,
        grnNumber: linkedGrn?.grnNumber,
        grnDate: linkedGrn?.receiveDate,
        grnAmount: linkedGrn?.totalAcceptedAmount,
        billNumber: linkedBill?.billNumber,
        supplierInvoiceNumber: linkedBill?.supplierInvoiceNumber,
        billDate: linkedBill?.billDate,
        billAmount: linkedBill?.totalAmount,
        paidAmount: linkedBill?.paidAmount || 0,
        dueAmount: linkedBill?.dueAmount || (linkedBill ? linkedBill.totalAmount : 0),
        status,
        notes: linkedBill?.notes || po.notes
      };
    });
  }

  getDepartmentalProcurementBudgetReport(): DepartmentalProcurementBudget[] {
    const state = this.getState();
    const bills = state.purchaseBills || [];
    const pos = state.purchaseOrders || [];

    const depts = [
      { name: 'F&B Kitchen', budget: 350000 },
      { name: 'Bar & Lounge', budget: 150000 },
      { name: 'Housekeeping & Amenities', budget: 120000 },
      { name: 'Engineering & Maintenance', budget: 80000 },
      { name: 'Admin & General', budget: 50000 },
      { name: 'Convention & Banquet Operations', budget: 200000 }
    ];

    return depts.map(d => {
      let actualSpend = 0;
      let committedPO = 0;

      bills.forEach(b => {
        if (d.name.includes('Kitchen') && (b.glDebitAccountCode === '1300' || b.glDebitAccountCode === '5020')) {
          actualSpend += b.totalAmount;
        } else if (d.name.includes('Housekeeping') && (b.glDebitAccountCode === '1320' || b.glDebitAccountCode === '5010')) {
          actualSpend += b.totalAmount;
        } else if (d.name.includes('Bar') && b.glDebitAccountCode === '1310') {
          actualSpend += b.totalAmount;
        } else if (d.name.includes('Engineering') && (b.glDebitAccountCode === '1330' || b.glDebitAccountCode === '5030')) {
          actualSpend += b.totalAmount;
        }
      });

      pos.forEach(p => {
        if (p.status !== 'Cancelled') {
          if (d.name.includes('Kitchen') && p.warehouseId === 'wh-kitchen') {
            committedPO += (p.grandTotal - (p.receivedTotalValue || 0));
          } else if (d.name.includes('Housekeeping') && p.warehouseId === 'wh-hk') {
            committedPO += (p.grandTotal - (p.receivedTotalValue || 0));
          }
        }
      });

      const totalCommitted = actualSpend + committedPO;
      const variance = d.budget - totalCommitted;
      const utilPct = Math.round((totalCommitted / d.budget) * 1000) / 10;

      let status: DepartmentalProcurementBudget['status'] = 'Within Budget';
      if (utilPct > 100) status = 'Over Budget';
      else if (utilPct > 85) status = 'Near Limit';

      return {
        department: d.name,
        allocatedBudget: d.budget,
        actualSpend,
        committedPOAmount: committedPO,
        totalCommitted,
        varianceAmount: variance,
        utilizationPercent: utilPct,
        status
      };
    });
  }

  getSupplierStatementOfAccount(supplierId: string) {
    const state = this.getState();
    const sup = (state.suppliers || []).find(s => s.id === supplierId);
    if (!sup) return null;

    const bills = (state.purchaseBills || []).filter(b => b.supplierId === supplierId);
    const grns = (state.goodsReceiveNotes || []).filter(g => g.supplierId === supplierId);
    const returns = (state.purchaseReturns || []).filter(r => r.supplierId === supplierId);
    const payments = (state.supplierPayments || []).filter(p => p.supplierId === supplierId);

    const transactions: {
      date: string;
      docType: 'Bill' | 'GRN' | 'Return' | 'Payment';
      docNumber: string;
      reference: string;
      debit: number;
      credit: number;
      balance: number;
    }[] = [];

    let running = 0;

    bills.forEach(b => {
      running += b.totalAmount;
      transactions.push({
        date: b.billDate,
        docType: 'Bill',
        docNumber: b.billNumber,
        reference: `Inv #${b.supplierInvoiceNumber}`,
        debit: 0,
        credit: b.totalAmount,
        balance: running
      });
    });

    returns.forEach(r => {
      running -= r.totalAmount;
      transactions.push({
        date: r.returnDate,
        docType: 'Return',
        docNumber: r.returnNumber,
        reference: `Debit Note (${r.reason})`,
        debit: r.totalAmount,
        credit: 0,
        balance: running
      });
    });

    payments.forEach(p => {
      running -= p.amount;
      transactions.push({
        date: p.paymentDate,
        docType: 'Payment',
        docNumber: p.paymentNumber,
        reference: `${p.paymentMethod} Ref #${p.referenceNumber}`,
        debit: p.amount,
        credit: 0,
        balance: running
      });
    });

    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      supplier: sup,
      openingBalance: 0,
      totalPurchases: bills.reduce((s, b) => s + b.totalAmount, 0),
      totalReturns: returns.reduce((s, r) => s + r.totalAmount, 0),
      totalPaid: payments.reduce((s, p) => s + p.amount, 0),
      closingPayableBalance: sup.currentPayableBalance || running,
      transactions
    };
  }

  // ========================================================
  // 11. STORE ISSUE / CONSUMPTION (KITCHEN & BAR)
  // ========================================================
  getStoreIssues(): StoreIssueConsumption[] {
    return this.getState().storeIssues || [];
  }

  createStoreIssue(issue: Omit<StoreIssueConsumption, 'id' | 'issueNumber' | 'createdAt'>): StoreIssueConsumption {
    const state = this.getState();
    const issueNum = `ISS-2026-${(state.storeIssues.length + 1).toString().padStart(4, '0')}`;
    const newIssue: StoreIssueConsumption = {
      ...issue,
      id: `iss-${Date.now()}`,
      issueNumber: issueNum,
      createdAt: new Date().toISOString()
    };
    state.storeIssues.push(newIssue);

    // Deduct stock and record ledger
    issue.items.forEach(item => {
      const invItem = state.inventoryItems.find(i => i.id === item.itemId);
      if (invItem) {
        invItem.currentTotalStock = Math.max(0, invItem.currentTotalStock - item.quantity);
        invItem.currentTotalValue = invItem.currentTotalStock * invItem.averageCost;
      }

      const whStock = state.inventoryStocks.find(s => s.itemId === item.itemId && s.warehouseId === issue.warehouseId);
      if (whStock) {
        whStock.quantity = Math.max(0, whStock.quantity - item.quantity);
        whStock.stockValue = whStock.quantity * whStock.averageCost;
        whStock.lastUpdated = new Date().toISOString();
      }

      state.stockLedgers.push({
        id: `sl-${Date.now()}-${item.itemId}`,
        date: issue.issueDate,
        transactionNumber: `TX-${issueNum}`,
        itemId: item.itemId,
        itemCode: item.itemCode,
        itemName: item.itemName,
        warehouseId: issue.warehouseId,
        warehouseName: issue.warehouseName,
        transactionType: issue.department === 'Bar' ? 'Bar Issue' : 'Kitchen Issue',
        referenceType: issue.department === 'Bar' ? 'BarIssue' : 'KitchenIssue',
        referenceId: newIssue.id,
        referenceDocument: issueNum,
        quantityIn: 0,
        quantityOut: item.quantity,
        unitCost: item.unitCost,
        totalCost: item.totalCost,
        runningQuantity: whStock ? whStock.quantity : 0,
        runningValue: whStock ? whStock.stockValue : 0,
        businessDate: state.settings.currentBusinessDate,
        department: `${issue.department} Store`,
        user: issue.issuedBy,
        notes: `Issued to ${issue.recipientName} for ${issue.purpose}`,
        createdAt: new Date().toISOString()
      });
    });

    // Generate Accounting Journal Voucher for Store Issue Consumption
    const jvNum = `JV-2026-${(state.journalVouchers.length + 1).toString().padStart(4, '0')}`;
    const isBar = issue.department === 'Bar' || issue.warehouseId === 'wh-bar';
    const isHk = issue.department === 'Housekeeping';
    const isMaint = issue.department === 'Maintenance';
    const isBanquet = issue.department === 'Banquet & Catering';

    const expenseCode = isBar ? '5020' : isHk ? '5030' : isMaint ? '5040' : isBanquet ? '5050' : '5010';
    const expenseName = isBar ? 'Beverage & Bar Production Cost' : isHk ? 'Housekeeping & Guest Amenities Expense' : isMaint ? 'Repairs & Maintenance Supplies' : isBanquet ? 'Banquet & Catering Direct Cost' : 'Food Production & Raw Materials Cost';
    const invCode = isBar ? '1310' : (isHk || isMaint) ? '1320' : '1300';
    const invName = isBar ? 'Bar & Beverage Store Inventory' : (isHk || isMaint) ? 'General Supplies & Amenities Inventory' : 'Food & Beverage Store Inventory';

    const totalIssueCost = Math.round(issue.totalCost * 100) / 100;
    if (totalIssueCost > 0) {
      const jv: JournalVoucher = {
        id: `jv-${Date.now()}`,
        voucherNumber: jvNum,
        date: issue.issueDate,
        sourceModule: 'Inventory Consumption',
        sourceReference: issueNum,
        narration: `Department consumption issue to ${issue.recipientName} (${issue.department}): ${issue.purpose}`,
        entries: [
          { id: `jve-iss-dr-${Date.now()}`, accountCode: expenseCode, accountName: expenseName, debit: totalIssueCost, credit: 0, memo: `Material consumption for ${issue.department}` },
          { id: `jve-iss-cr-${Date.now()}`, accountCode: invCode, accountName: invName, debit: 0, credit: totalIssueCost, memo: `Store issue from ${issue.warehouseName}` }
        ],
        totalDebit: totalIssueCost,
        totalCredit: totalIssueCost,
        isBalanced: true,
        postedBy: issue.issuedBy,
        postedAt: new Date().toISOString()
      };
      state.journalVouchers.push(jv);
      newIssue.journalVoucherNumber = jvNum;

      // Update GL balance
      const glExp = state.glAccounts.find(g => g.code === expenseCode);
      if (glExp) glExp.balance += totalIssueCost;
      const glInv = state.glAccounts.find(g => g.code === invCode);
      if (glInv) glInv.balance = Math.max(0, glInv.balance - totalIssueCost);
    }

    this.saveAndNotify();
    return newIssue;
  }

  // ========================================================
  // 12. WASTAGE & SPOILAGE MANAGEMENT
  // ========================================================
  getWastages(): WastageEntry[] {
    return this.getState().wastages || [];
  }

  createWastage(wastage: Omit<WastageEntry, 'id' | 'wastageNumber' | 'createdAt' | 'journalVoucherNumber'>): WastageEntry {
    const state = this.getState();
    const wstNum = `WST-2026-${(state.wastages.length + 1).toString().padStart(4, '0')}`;

    // Create GL Journal Voucher: Dr 5028 Kitchen & Bar Wastage Expense, Cr 1300 Inventory
    const jvNum = `JV-2026-${(state.journalVouchers.length + 1).toString().padStart(4, '0')}`;
    const isBar = wastage.department === 'Bar';
    const invCode = isBar ? '1310' : '1300';
    const invName = isBar ? 'Bar & Beverage Store Inventory' : 'Food & Beverage Store Inventory';

    const jv: JournalVoucher = {
      id: `jv-${Date.now()}`,
      voucherNumber: jvNum,
      date: wastage.date,
      sourceModule: 'Inventory Wastage',
      sourceReference: wstNum,
      narration: `Inventory write-off: ${wastage.quantity} ${wastage.uom} of ${wastage.itemName} due to ${wastage.reason}`,
      entries: [
        {
          id: `jve-wst-dr-${Date.now()}`,
          accountCode: '5028',
          accountName: 'Kitchen & Bar Wastage / Spoilage Expense',
          debit: wastage.totalCost,
          credit: 0,
          memo: `Wastage write-off (${wastage.reason})`
        },
        {
          id: `jve-wst-cr-${Date.now()}`,
          accountCode: invCode,
          accountName: invName,
          debit: 0,
          credit: wastage.totalCost,
          memo: `Deducted from ${wastage.warehouseName}`
        }
      ],
      totalDebit: wastage.totalCost,
      totalCredit: wastage.totalCost,
      isBalanced: true,
      postedBy: wastage.reportedBy,
      postedAt: new Date().toISOString()
    };
    state.journalVouchers.push(jv);

    // Update item stock
    const invItem = state.inventoryItems.find(i => i.id === wastage.itemId);
    if (invItem) {
      invItem.currentTotalStock = Math.max(0, invItem.currentTotalStock - wastage.quantity);
      invItem.currentTotalValue = invItem.currentTotalStock * invItem.averageCost;
    }

    // Update warehouse stock
    const whStock = state.inventoryStocks.find(s => s.itemId === wastage.itemId && s.warehouseId === wastage.warehouseId);
    if (whStock) {
      whStock.quantity = Math.max(0, whStock.quantity - wastage.quantity);
      whStock.stockValue = whStock.quantity * whStock.averageCost;
      whStock.lastUpdated = new Date().toISOString();
    }

    const newWastage: WastageEntry = {
      ...wastage,
      id: `wst-${Date.now()}`,
      wastageNumber: wstNum,
      journalVoucherNumber: jvNum,
      status: 'Approved & Written Off',
      createdAt: new Date().toISOString()
    };
    state.wastages.push(newWastage);

    // Record stock ledger
    state.stockLedgers.push({
      id: `sl-${Date.now()}`,
      date: wastage.date,
      transactionNumber: `TX-${wstNum}`,
      itemId: wastage.itemId,
      itemCode: wastage.itemCode,
      itemName: wastage.itemName,
      warehouseId: wastage.warehouseId,
      warehouseName: wastage.warehouseName,
      transactionType: 'Wastage',
      referenceType: 'Wastage',
      referenceId: newWastage.id,
      referenceDocument: wstNum,
      quantityIn: 0,
      quantityOut: wastage.quantity,
      unitCost: wastage.unitCost,
      totalCost: wastage.totalCost,
      runningQuantity: whStock ? whStock.quantity : 0,
      runningValue: whStock ? whStock.stockValue : 0,
      businessDate: state.settings.currentBusinessDate,
      department: `${wastage.department} Department`,
      user: wastage.reportedBy,
      notes: `Wastage write-off (${wastage.reason}): ${wastage.remarks || ''}`,
      createdAt: new Date().toISOString()
    });

    this.saveAndNotify();
    return newWastage;
  }

  // ========================================================
  // 13. PHYSICAL STOCK COUNT AUDIT
  // ========================================================
  getPhysicalCounts(): PhysicalStockCount[] {
    return this.getState().physicalStockCounts || [];
  }

  createPhysicalStockCount(count: Omit<PhysicalStockCount, 'id' | 'countNumber' | 'createdAt' | 'adjustmentJournalVoucher'>): PhysicalStockCount {
    const state = this.getState();
    const countNum = `PSC-2026-${(state.physicalStockCounts.length + 1).toString().padStart(4, '0')}`;
    
    let jvNum: string | undefined;
    if (count.status === 'Reconciled & Adjusted' && count.netVarianceValue !== 0) {
      jvNum = `JV-2026-${(state.journalVouchers.length + 1).toString().padStart(4, '0')}`;
      const isPositive = count.netVarianceValue > 0;
      const absVal = Math.abs(count.netVarianceValue);

      state.journalVouchers.push({
        id: `jv-${Date.now()}`,
        voucherNumber: jvNum,
        date: count.countDate,
        sourceModule: 'Inventory Audit',
        sourceReference: countNum,
        narration: `Physical stock count reconciliation for ${count.warehouseName} (Net variance ৳${count.netVarianceValue})`,
        entries: isPositive ? [
          { id: `jve-psc-1-${Date.now()}`, accountCode: '1300', accountName: 'Food & Beverage Store Inventory', debit: absVal, credit: 0, memo: 'Inventory increase' },
          { id: `jve-psc-2-${Date.now()}`, accountCode: '5029', accountName: 'Inventory Shrinkage & Audit Variance', debit: 0, credit: absVal, memo: 'Audit variance gain' }
        ] : [
          { id: `jve-psc-1-${Date.now()}`, accountCode: '5029', accountName: 'Inventory Shrinkage & Audit Variance', debit: absVal, credit: 0, memo: 'Audit variance shrinkage loss' },
          { id: `jve-psc-2-${Date.now()}`, accountCode: '1300', accountName: 'Food & Beverage Store Inventory', debit: 0, credit: absVal, memo: 'Inventory write-down' }
        ],
        totalDebit: absVal,
        totalCredit: absVal,
        isBalanced: true,
        postedBy: count.verifiedBy,
        postedAt: new Date().toISOString()
      });

      // Update actual item and warehouse stocks to counted values
      count.items.forEach(cItem => {
        if (cItem.varianceQuantity !== 0) {
          const invItem = state.inventoryItems.find(i => i.id === cItem.itemId);
          if (invItem) {
            invItem.currentTotalStock += cItem.varianceQuantity;
            invItem.currentTotalValue = invItem.currentTotalStock * invItem.averageCost;
          }

          const whStock = state.inventoryStocks.find(s => s.itemId === cItem.itemId && s.warehouseId === count.warehouseId);
          if (whStock) {
            whStock.quantity = cItem.countedQuantity;
            whStock.stockValue = whStock.quantity * whStock.averageCost;
            whStock.lastUpdated = new Date().toISOString();
          }

          state.stockLedgers.push({
            id: `sl-${Date.now()}-${cItem.itemId}`,
            date: count.countDate,
            transactionNumber: `TX-${countNum}`,
            itemId: cItem.itemId,
            itemCode: cItem.itemCode,
            itemName: cItem.itemName,
            warehouseId: count.warehouseId,
            warehouseName: count.warehouseName,
            transactionType: 'Physical Count Adjustment',
            referenceType: 'CountAudit',
            referenceId: countNum,
            referenceDocument: countNum,
            quantityIn: cItem.varianceQuantity > 0 ? cItem.varianceQuantity : 0,
            quantityOut: cItem.varianceQuantity < 0 ? Math.abs(cItem.varianceQuantity) : 0,
            unitCost: cItem.unitCost,
            totalCost: Math.abs(cItem.varianceValue),
            runningQuantity: cItem.countedQuantity,
            runningValue: cItem.countedQuantity * cItem.unitCost,
            businessDate: state.settings.currentBusinessDate,
            department: 'Internal Audit',
            user: count.verifiedBy,
            notes: `Physical audit reconciliation. Counted: ${cItem.countedQuantity}, System: ${cItem.systemQuantity}`,
            createdAt: new Date().toISOString()
          });
        }
      });
    }

    const newCount: PhysicalStockCount = {
      ...count,
      id: `psc-${Date.now()}`,
      countNumber: countNum,
      adjustmentJournalVoucher: jvNum,
      createdAt: new Date().toISOString()
    };
    state.physicalStockCounts.push(newCount);
    this.saveAndNotify();
    return newCount;
  }

  // ========================================================
  // 14. ENHANCED MENU ITEMS & CATALOG
  // ========================================================
  getEnhancedMenuItems(): MenuItemEnhanced[] {
    const state = this.getState();
    if (!Array.isArray(state.enhancedMenuItems) || state.enhancedMenuItems.length === 0 || state.enhancedMenuItems.some((i: any) => i.categoryName === 'Main Course' || i.categoryId === 'cat-main')) {
      state.enhancedMenuItems = JSON.parse(JSON.stringify(SEED_ENHANCED_MENU_ITEMS));
      this.saveAndNotify();
    }
    const items = state.enhancedMenuItems || [];
    // Ensure live portions calculated safely
    items.forEach(item => {
      try {
        item.maxProduciblePortions = this.calculateMaxProduciblePortions(item.id);
        if (item.autoOutOfStockOnLowIngredients && item.maxProduciblePortions === 0) {
          item.availability = 'Out of Stock';
        }
      } catch {
        item.maxProduciblePortions = 999;
      }
    });
    return items;
  }

  resetToSeedMenuItems(): MenuItemEnhanced[] {
    const state = this.getState();
    state.enhancedMenuItems = JSON.parse(JSON.stringify(SEED_ENHANCED_MENU_ITEMS));
    // Also ensure recipes and categories exist
    if (!Array.isArray(state.recipes) || state.recipes.length === 0) {
      state.recipes = JSON.parse(JSON.stringify(SEED_RECIPES));
    }
    this.saveAndNotify();
    return this.getEnhancedMenuItems();
  }

  getEnhancedMenuItemById(id: string): MenuItemEnhanced | undefined {
    return this.getState().enhancedMenuItems.find(m => m.id === id);
  }

  addEnhancedMenuItem(item: Omit<MenuItemEnhanced, 'id' | 'createdAt' | 'updatedAt' | 'maxProduciblePortions'>): MenuItemEnhanced {
    const state = this.getState();
    const newItem: MenuItemEnhanced = {
      ...item,
      id: `menu-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    newItem.maxProduciblePortions = this.calculateMaxProduciblePortions(newItem.id);
    state.enhancedMenuItems.push(newItem);
    this.saveAndNotify();
    return newItem;
  }

  createMenuItem(item: Omit<MenuItemEnhanced, 'id' | 'createdAt' | 'updatedAt' | 'maxProduciblePortions'>): MenuItemEnhanced {
    return this.addEnhancedMenuItem(item);
  }

  updateMenuItem(id: string, updates: Partial<MenuItemEnhanced>): void {
    this.updateEnhancedMenuItem(id, updates);
  }

  addPriceHistory(history: Partial<MenuPriceHistory> & { menuItemId: string; newPrice: number; reason: string }): MenuPriceHistory {
    const state = this.getState();
    if (!state.menuPriceHistories) state.menuPriceHistories = [];
    const newEntry: MenuPriceHistory = {
      id: `mph-${Date.now()}`,
      menuItemId: history.menuItemId,
      menuItemName: history.menuItemName || history.menuItemId,
      oldPrice: history.oldPrice ?? history.previousPrice ?? 0,
      previousPrice: history.previousPrice ?? history.oldPrice ?? 0,
      newPrice: history.newPrice,
      effectiveFrom: history.effectiveFrom || history.effectiveDate || new Date().toISOString().split('T')[0],
      effectiveDate: history.effectiveDate || history.effectiveFrom || new Date().toISOString().split('T')[0],
      changedBy: history.changedBy || history.updatedBy || 'Executive Chef',
      updatedBy: history.updatedBy || history.changedBy || 'Executive Chef',
      reason: history.reason,
      createdAt: new Date().toISOString()
    };
    state.menuPriceHistories.unshift(newEntry);
    this.saveAndNotify();
    return newEntry;
  }

  updateEnhancedMenuItem(id: string, updates: Partial<MenuItemEnhanced>): void {
    const state = this.getState();
    const idx = state.enhancedMenuItems.findIndex(m => m.id === id);
    if (idx !== -1) {
      state.enhancedMenuItems[idx] = {
        ...state.enhancedMenuItems[idx],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.saveAndNotify();
    }
  }

  updateMenuPrice(menuItemId: string, newPrice: number, reason: string, changedBy: string): void {
    const state = this.getState();
    const item = state.enhancedMenuItems.find(m => m.id === menuItemId);
    if (item) {
      const oldPrice = item.basePrice;
      const historyEntry: MenuPriceHistory = {
        id: `mph-${Date.now()}`,
        menuItemId,
        menuItemName: item.name,
        oldPrice,
        newPrice,
        effectiveFrom: new Date().toISOString().split('T')[0],
        changedBy,
        reason,
        createdAt: new Date().toISOString()
      };
      state.menuPriceHistories.push(historyEntry);

      item.basePrice = newPrice;
      item.serviceChargeAmount = Math.round(newPrice * (item.serviceChargePercent / 100));
      item.taxAmount = Math.round((newPrice + item.serviceChargeAmount) * (item.taxPercent / 100));
      item.finalSellingPrice = newPrice + item.serviceChargeAmount + item.taxAmount;
      item.foodCostPercentage = Math.round((item.costPrice / newPrice) * 1000) / 10;
      item.profitMargin = newPrice - item.costPrice;
      item.updatedAt = new Date().toISOString();

      this.saveAndNotify();
    }
  }

  // ========================================================
  // 15. RECIPES & INGREDIENT COSTING ENGINE
  // ========================================================
  getRecipes(): Recipe[] {
    const state = this.getState();
    if (!Array.isArray(state.recipes) || state.recipes.length === 0) {
      state.recipes = JSON.parse(JSON.stringify(SEED_RECIPES));
      this.saveAndNotify();
    }
    return state.recipes || [];
  }

  getRecipeByMenuItemId(menuItemId: string): Recipe | undefined {
    return this.getRecipes().find(r => r.menuItemId === menuItemId && r.active);
  }

  createOrUpdateRecipe(recipeData: Omit<Recipe, 'id' | 'createdAt'>): Recipe {
    const state = this.getState();
    if (!Array.isArray(state.recipes)) state.recipes = [];
    // Calculate total cost
    let totalCost = 0;
    recipeData.ingredients.forEach(ing => {
      // Find current item unit cost from inventory item
      const item = (state.inventoryItems || []).find(i => i.id === ing.inventoryItemId);
      if (item) {
        // Convert to consumption cost
        // e.g. item cost is ৳140 per kg, uom is g => ৳0.14 per g
        const unitCostInConsumptionUom = item.averageCost / (item.conversionFactor || 1000);
        ing.unitCost = Math.round(unitCostInConsumptionUom * 1000) / 1000;
      }
      ing.effectiveQuantity = ing.quantity * (1 + (ing.wastagePercentage || 0) / 100);
      ing.totalCost = Math.round(ing.effectiveQuantity * ing.unitCost * 100) / 100;
      totalCost += ing.totalCost;
    });

    const newRecipe: Recipe = {
      ...recipeData,
      id: `rec-${Date.now()}`,
      totalRecipeCost: Math.round(totalCost * 100) / 100,
      createdAt: new Date().toISOString()
    };

    // Deactivate previous versions
    state.recipes.forEach(r => {
      if (r.menuItemId === recipeData.menuItemId) {
        r.active = false;
        r.effectiveTo = new Date().toISOString().split('T')[0];
      }
    });

    state.recipes.push(newRecipe);

    // Update Enhanced Menu Item with new cost price & margin
    const menuItem = (state.enhancedMenuItems || []).find(m => m.id === recipeData.menuItemId);
    if (menuItem) {
      menuItem.costPrice = newRecipe.totalRecipeCost;
      menuItem.foodCostPercentage = Math.round((newRecipe.totalRecipeCost / menuItem.basePrice) * 1000) / 10;
      menuItem.profitMargin = menuItem.basePrice - newRecipe.totalRecipeCost;
      menuItem.hasActiveRecipe = true;
      menuItem.activeRecipeId = newRecipe.id;
      menuItem.maxProduciblePortions = this.calculateMaxProduciblePortions(menuItem.id);
    }

    this.saveAndNotify();
    return newRecipe;
  }

  // Calculate live portion limit based on bottleneck ingredient in Kitchen / Bar Store
  calculateMaxProduciblePortions(menuItemId: string): number {
    const state = this.getState();
    const recipes = Array.isArray(state.recipes) ? state.recipes : (SEED_RECIPES || []);
    const recipe = recipes.find(r => r.menuItemId === menuItemId && r.active);
    if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
      return 999; // Unlimited / unconstrained if no recipe
    }

    let minPortions = 999999;
    const inventoryItems = Array.isArray(state.inventoryItems) ? state.inventoryItems : [];

    recipe.ingredients.forEach(ing => {
      const invItem = inventoryItems.find(i => i.id === ing.inventoryItemId);
      if (!invItem) return;

      // Check stock in default store or total stock
      // convert total stock (e.g. 52 kg) to consumption UOM (52,000 g)
      const stockInConsumptionUom = (invItem.currentTotalStock || 0) * (invItem.conversionFactor || 1000);
      const possiblePortions = Math.floor(stockInConsumptionUom / Math.max(0.001, ing.effectiveQuantity));

      if (possiblePortions < minPortions) {
        minPortions = possiblePortions;
      }
    });

    return minPortions === 999999 ? 0 : Math.max(0, minPortions);
  }

  // ========================================================
  // 16. MODIFIERS & COMBOS & PRICING RULES
  // ========================================================
  getModifiers(): MenuModifierItem[] {
    const state = this.getState();
    if (!Array.isArray(state.menuModifiers) || state.menuModifiers.length === 0) {
      state.menuModifiers = JSON.parse(JSON.stringify(SEED_MENU_MODIFIERS));
      this.saveAndNotify();
    }
    return state.menuModifiers || [];
  }

  getCombos(): MenuComboItem[] {
    const state = this.getState();
    if (!Array.isArray(state.menuCombos) || state.menuCombos.length === 0) {
      state.menuCombos = JSON.parse(JSON.stringify(SEED_MENU_COMBOS));
      this.saveAndNotify();
    }
    return state.menuCombos || [];
  }

  getServiceChargeRules(): ServiceChargeRule[] {
    const state = this.getState();
    if (!Array.isArray(state.serviceChargeRules) || state.serviceChargeRules.length === 0) {
      state.serviceChargeRules = JSON.parse(JSON.stringify(SEED_SERVICE_CHARGE_RULES));
      this.saveAndNotify();
    }
    return state.serviceChargeRules || [];
  }

  getTaxRules(): TaxRule[] {
    const state = this.getState();
    if (!Array.isArray(state.taxRules) || state.taxRules.length === 0) {
      state.taxRules = JSON.parse(JSON.stringify(SEED_TAX_RULES));
      this.saveAndNotify();
    }
    return state.taxRules || [];
  }

  getPriceHistories(menuItemId?: string): MenuPriceHistory[] {
    const state = this.getState();
    if (!Array.isArray(state.menuPriceHistories) || state.menuPriceHistories.length === 0) {
      state.menuPriceHistories = JSON.parse(JSON.stringify(SEED_PRICE_HISTORIES));
    }
    const list = state.menuPriceHistories || [];
    if (menuItemId) {
      return list.filter(h => h.menuItemId === menuItemId);
    }
    return list;
  }

  // ========================================================
  // 17. AUTOMATIC STOCK CONSUMPTION FOR RESTAURANT & BAR ORDERS
  // Connects Sale -> Recipe -> Inventory -> Ledger -> GL
  // ========================================================
  consumeIngredientsForRestaurantOrder(order: RestaurantOrder): void {
    const state = this.getState();
    if (!order || !order.items || order.items.length === 0) return;

    let totalCogsAmount = 0;
    const isBar = order.orderType === 'bar-lounge';
    const storeId = isBar ? 'wh-bar' : 'wh-kitchen';
    const store = state.warehouses.find(w => w.id === storeId) || state.warehouses[0];

    order.items.forEach(orderItem => {
      // Find active recipe for this menu item
      // First check enhancedMenuItems
      const orderItemName = (orderItem.name || '').toLowerCase();
      let menuItem = state.enhancedMenuItems.find(m => m.id === orderItem.menuItemId || (orderItemName && (m.name || '').toLowerCase() === orderItemName));
      if (!menuItem) {
        // Fallback match standard menu item
        const stdItem = state.menuItems.find(m => m.id === orderItem.menuItemId || (orderItemName && (m.name || '').toLowerCase() === orderItemName));
        if (stdItem) {
          const stdName = (stdItem.name || '').toLowerCase();
          menuItem = state.enhancedMenuItems.find(m => stdName && (m.name || '').toLowerCase() === stdName);
        }
      }

      if (!menuItem) return;

      const menuItemName = (menuItem.name || '').toLowerCase();
      const recipe = state.recipes.find(r => (r.menuItemId === menuItem?.id || (menuItemName && (r.menuItemName || '').toLowerCase() === menuItemName)) && r.active);
      if (!recipe) return;

      // Consume each ingredient for ordered quantity
      recipe.ingredients.forEach(ing => {
        const invItem = state.inventoryItems.find(i => i.id === ing.inventoryItemId);
        if (!invItem) return;

        // Effective consumption in inventory base UOM (e.g. Grams -> Kilograms)
        const qtyInConsumptionUom = ing.effectiveQuantity * orderItem.quantity;
        const qtyInBaseUom = qtyInConsumptionUom / (invItem.conversionFactor || 1000);
        const costDeducted = Math.round(qtyInConsumptionUom * ing.unitCost * 100) / 100;
        totalCogsAmount += costDeducted;

        // Deduct from overall item stock
        invItem.currentTotalStock = Math.max(0, invItem.currentTotalStock - qtyInBaseUom);
        invItem.currentTotalValue = invItem.currentTotalStock * invItem.averageCost;

        // Deduct from warehouse stock
        const whStock = state.inventoryStocks.find(s => s.itemId === invItem.id && s.warehouseId === storeId);
        if (whStock) {
          whStock.quantity = Math.max(0, whStock.quantity - qtyInBaseUom);
          whStock.stockValue = whStock.quantity * whStock.averageCost;
          whStock.lastUpdated = new Date().toISOString();
        }

        // Add Stock Ledger Entry
        state.stockLedgers.push({
          id: `sl-pos-${Date.now()}-${invItem.id}`,
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          transactionNumber: `TX-POS-${order.orderNumber}`,
          itemId: invItem.id,
          itemCode: invItem.itemCode,
          itemName: invItem.name,
          warehouseId: store.id,
          warehouseName: store.name,
          transactionType: 'Recipe Consumption',
          referenceType: 'POSOrder',
          referenceId: order.id,
          referenceDocument: order.orderNumber,
          quantityIn: 0,
          quantityOut: Math.round(qtyInBaseUom * 1000) / 1000,
          unitCost: invItem.averageCost,
          totalCost: costDeducted,
          runningQuantity: whStock ? whStock.quantity : 0,
          runningValue: whStock ? whStock.stockValue : 0,
          businessDate: state.settings.currentBusinessDate,
          department: isBar ? 'Bar & Lounge POS' : 'Restaurant Kitchen POS',
          user: order.createdBy || 'POS Server',
          notes: `Auto-consumed for ${orderItem.quantity}x ${orderItem.name} (Order: ${order.orderNumber})`,
          createdAt: new Date().toISOString()
        });
      });
    });

    // If ingredients were consumed, post GL Accounting Journal Voucher
    if (totalCogsAmount > 0) {
      const jvNum = `JV-2026-${(state.journalVouchers.length + 1).toString().padStart(4, '0')}`;
      const cogsCode = isBar ? '5025' : '5020';
      const cogsName = isBar ? 'Bar & Beverage Cost of Sales' : 'F&B Kitchen Raw Materials & Consumables';
      const invCode = isBar ? '1310' : '1300';
      const invName = isBar ? 'Bar & Beverage Store Inventory' : 'Food & Beverage Store Inventory';

      state.journalVouchers.push({
        id: `jv-pos-${Date.now()}`,
        voucherNumber: jvNum,
        date: new Date().toISOString().split('T')[0],
        sourceModule: isBar ? 'Bar POS' : 'Restaurant POS',
        sourceReference: order.orderNumber,
        narration: `Automated COGS & recipe stock consumption for Order #${order.orderNumber} (${order.orderType})`,
        entries: [
          {
            id: `jve-cogs-dr-${Date.now()}`,
            accountCode: cogsCode,
            accountName: cogsName,
            debit: totalCogsAmount,
            credit: 0,
            memo: `Cost of Sales for Order ${order.orderNumber}`
          },
          {
            id: `jve-cogs-cr-${Date.now()}`,
            accountCode: invCode,
            accountName: invName,
            debit: 0,
            credit: totalCogsAmount,
            memo: `Inventory reduction from ${store.name}`
          }
        ],
        totalDebit: totalCogsAmount,
        totalCredit: totalCogsAmount,
        isBalanced: true,
        postedBy: order.createdBy || 'POS Engine',
        postedAt: new Date().toISOString()
      });

      // Update GL balances
      const cogsGl = state.glAccounts.find(g => g.code === cogsCode);
      if (cogsGl) cogsGl.balance += totalCogsAmount;
      const invGl = state.glAccounts.find(g => g.code === invCode);
      if (invGl) invGl.balance = Math.max(0, invGl.balance - totalCogsAmount);
    }

    this.saveAndNotify();
  }

  // ========================================================
  // 18. F&B COSTING & MENU ENGINEERING REPORTS
  // ========================================================
  getFoodAndBeverageCostSummary(): FoodAndBeverageCostSummary {
    const state = this.getState();
    const inventoryItems = state.inventoryItems || [];
    const totalInventoryValue = inventoryItems.reduce((sum, i) => sum + i.currentTotalValue, 0);

    const orders = state.restaurantOrders || [];
    let foodRev = 0;
    let bevRev = 0;

    orders.forEach(ord => {
      if (ord.status !== 'Voided') {
        if (ord.orderType === 'bar-lounge') {
          bevRev += ord.total;
        } else {
          foodRev += ord.total;
        }
      }
    });

    const totalRev = foodRev + bevRev || 1;
    const cogsLedgers = (state.stockLedgers || []).filter(l => l.transactionType === 'Recipe Consumption');
    const totalCogs = cogsLedgers.reduce((sum, l) => sum + l.totalCost, 0) || 54000;
    const wastagesTotal = (state.wastages || []).reduce((sum, w) => sum + w.totalCost, 0);

    return {
      period: `August 2026 (MTD)`,
      openingInventoryValue: 245000,
      purchasesTotal: 185000,
      closingInventoryValue: totalInventoryValue,
      cogsTotal: totalCogs,
      foodRevenue: foodRev || 420000,
      beverageRevenue: bevRev || 115000,
      totalRevenue: totalRev || 535000,
      overallCostPercentage: Math.round((totalCogs / (totalRev || 535000)) * 1000) / 10,
      foodCostPercentage: 27.8,
      beverageCostPercentage: 22.4,
      totalWastageValue: wastagesTotal,
      complimentaryCostValue: 4200
    };
  }

  getMenuProfitabilityReport(): MenuItemProfitabilityRow[] {
    const items = this.getEnhancedMenuItems();
    return items.map(m => {
      const unitsSold = m.menuType === 'Food' ? 142 : 88;
      const totalRevenue = unitsSold * m.basePrice;
      const totalCost = unitsSold * m.costPrice;
      const totalGrossProfit = totalRevenue - totalCost;
      const margin = m.basePrice - m.costPrice;
      const foodCostPct = Math.round((m.costPrice / m.basePrice) * 1000) / 10;

      let tier: MenuItemProfitabilityRow['profitabilityTier'] = 'Stars (High Profit, High Sales)';
      if (margin > 300 && unitsSold > 100) tier = 'Stars (High Profit, High Sales)';
      else if (margin <= 300 && unitsSold > 100) tier = 'Plowhorses (Low Profit, High Sales)';
      else if (margin > 300 && unitsSold <= 100) tier = 'Puzzles (High Profit, Low Sales)';
      else tier = 'Dogs (Low Profit, Low Sales)';

      return {
        menuItemId: m.id,
        menuCode: m.menuCode,
        name: m.name,
        category: m.categoryName,
        menuType: m.menuType,
        costPrice: m.costPrice,
        sellingPrice: m.basePrice,
        grossMargin: margin,
        foodCostPercentage: foodCostPct,
        unitsSold,
        totalRevenue,
        totalCost,
        totalGrossProfit,
        profitabilityTier: tier
      };
    });
  }
  // ========================================================
  // 19. MENU CATEGORIES WITH GL MAPPING
  // ========================================================
  getMenuCategories(): MenuCategoryItem[] {
    const state = this.getState();
    if (!state.menuCategoriesList || state.menuCategoriesList.length === 0) {
      state.menuCategoriesList = [
        {
          id: 'mcat-1',
          code: 'CAT-BNG',
          name: 'Traditional Bengali & Royal Feast',
          description: 'Authentic Kacchi, Hilsha, Kala Bhuna, and classic heirloom recipes',
          menuType: 'Food',
          kitchenStation: 'Main Hot Kitchen',
          glSalesAccountCode: '4020',
          glSalesAccountName: 'Food & Beverage Outlet Sales',
          glCogsAccountCode: '5020',
          glCogsAccountName: 'F&B Kitchen Raw Materials & Consumables',
          defaultTaxPercent: 15,
          defaultServiceChargePercent: 10,
          displayOrder: 1,
          active: true
        },
        {
          id: 'mcat-2',
          code: 'CAT-BBQ',
          name: 'Grills, Steaks & Tandoori BBQ',
          description: 'Charcoal grilled kebabs, imported beef steaks, and live grill platters',
          menuType: 'Food',
          kitchenStation: 'Live BBQ Station',
          glSalesAccountCode: '4020',
          glSalesAccountName: 'Food & Beverage Outlet Sales',
          glCogsAccountCode: '5020',
          glCogsAccountName: 'F&B Kitchen Raw Materials & Consumables',
          defaultTaxPercent: 15,
          defaultServiceChargePercent: 10,
          displayOrder: 2,
          active: true
        },
        {
          id: 'mcat-3',
          code: 'CAT-CNT',
          name: 'Continental, Italian & Pastas',
          description: 'Handmade thin crust pizzas, pastas, burgers, and sizzlers',
          menuType: 'Food',
          kitchenStation: 'Main Hot Kitchen',
          glSalesAccountCode: '4020',
          glSalesAccountName: 'Food & Beverage Outlet Sales',
          glCogsAccountCode: '5020',
          glCogsAccountName: 'F&B Kitchen Raw Materials & Consumables',
          defaultTaxPercent: 15,
          defaultServiceChargePercent: 10,
          displayOrder: 3,
          active: true
        },
        {
          id: 'mcat-4',
          code: 'CAT-SEA',
          name: 'Seafood & Fresh Catch Delights',
          description: 'Padma river fish, jumbo river prawns, and deep-sea specialties',
          menuType: 'Food',
          kitchenStation: 'Main Hot Kitchen',
          glSalesAccountCode: '4020',
          glSalesAccountName: 'Food & Beverage Outlet Sales',
          glCogsAccountCode: '5020',
          glCogsAccountName: 'F&B Kitchen Raw Materials & Consumables',
          defaultTaxPercent: 15,
          defaultServiceChargePercent: 10,
          displayOrder: 4,
          active: true
        },
        {
          id: 'mcat-5',
          code: 'CAT-BEV',
          name: 'Bar, Mocktails & Specialty Beverages',
          description: 'Fresh squeezed juices, artisanal mocktails, iced teas, and coffee',
          menuType: 'Beverage',
          kitchenStation: 'Bar & Beverage Counter',
          glSalesAccountCode: '4030',
          glSalesAccountName: 'Bar & Lounge Revenue',
          glCogsAccountCode: '5025',
          glCogsAccountName: 'Bar & Beverage Cost of Sales',
          defaultTaxPercent: 15,
          defaultServiceChargePercent: 10,
          displayOrder: 5,
          active: true
        },
        {
          id: 'mcat-6',
          code: 'CAT-DST',
          name: 'Artisan Bakery & Pastry Desserts',
          description: 'Specialty cheesecakes, claypot matka kulfi, puddings, and sundaes',
          menuType: 'Dessert',
          kitchenStation: 'Bakery & Pastry',
          glSalesAccountCode: '4020',
          glSalesAccountName: 'Food & Beverage Outlet Sales',
          glCogsAccountCode: '5020',
          glCogsAccountName: 'F&B Kitchen Raw Materials & Consumables',
          defaultTaxPercent: 15,
          defaultServiceChargePercent: 10,
          displayOrder: 6,
          active: true
        },
        {
          id: 'mcat-7',
          code: 'CAT-BNQ',
          name: 'Convention & Banquet Event Packages',
          description: 'Corporate gala buffet, wedding packages, and executive tea spreads',
          menuType: 'Package',
          kitchenStation: 'Room Service Pantry',
          glSalesAccountCode: '4040',
          glSalesAccountName: 'Convention Halls & Banquet Venue Hire',
          glCogsAccountCode: '5020',
          glCogsAccountName: 'F&B Kitchen Raw Materials & Consumables',
          defaultTaxPercent: 15,
          defaultServiceChargePercent: 10,
          displayOrder: 7,
          active: true
        }
      ];
    }
    const items = this.getEnhancedMenuItems();
    return (state.menuCategoriesList || []).map(cat => ({
      ...cat,
      itemCount: items.filter(i => i.categoryName === cat.name || i.categoryId === cat.id).length
    }));
  }

  addMenuCategory(category: Omit<MenuCategoryItem, 'id'>): MenuCategoryItem {
    const state = this.getState();
    if (!state.menuCategoriesList) state.menuCategoriesList = [];
    const newCat: MenuCategoryItem = {
      ...category,
      id: `mcat-${Date.now()}`
    };
    state.menuCategoriesList.push(newCat);
    this.saveAndNotify();
    return newCat;
  }

  updateMenuCategory(id: string, updates: Partial<MenuCategoryItem>): void {
    const state = this.getState();
    if (!state.menuCategoriesList) return;
    const idx = state.menuCategoriesList.findIndex(c => c.id === id);
    if (idx !== -1) {
      state.menuCategoriesList[idx] = {
        ...state.menuCategoriesList[idx],
        ...updates
      };
      this.saveAndNotify();
    }
  }

  deleteMenuCategory(id: string): void {
    const state = this.getState();
    if (!state.menuCategoriesList) return;
    state.menuCategoriesList = state.menuCategoriesList.filter(c => c.id !== id);
    this.saveAndNotify();
  }

  deleteEnhancedMenuItem(id: string): void {
    const state = this.getState();
    state.enhancedMenuItems = (state.enhancedMenuItems || []).filter(m => m.id !== id);
    this.saveAndNotify();
  }

  // ========================================================
  // 20. MENU MODIFIERS CRUD
  // ========================================================
  addModifier(modifier: Omit<MenuModifierItem, 'id'>): MenuModifierItem {
    const state = this.getState();
    if (!state.menuModifiers) state.menuModifiers = [];
    const newMod: MenuModifierItem = {
      ...modifier,
      id: `mod-${Date.now()}`
    };
    state.menuModifiers.push(newMod);
    this.saveAndNotify();
    return newMod;
  }

  updateModifier(id: string, updates: Partial<MenuModifierItem>): void {
    const state = this.getState();
    if (!state.menuModifiers) return;
    const idx = state.menuModifiers.findIndex(m => m.id === id);
    if (idx !== -1) {
      state.menuModifiers[idx] = {
        ...state.menuModifiers[idx],
        ...updates
      };
      this.saveAndNotify();
    }
  }

  deleteModifier(id: string): void {
    const state = this.getState();
    if (!state.menuModifiers) return;
    state.menuModifiers = state.menuModifiers.filter(m => m.id !== id);
    this.saveAndNotify();
  }

  // ========================================================
  // 21. MENU VERSIONS & SEASONAL MENUS
  // ========================================================
  getMenuVersions(): MenuVersion[] {
    const state = this.getState();
    if (!state.menuVersionsList || state.menuVersionsList.length === 0) {
      state.menuVersionsList = [
        {
          id: 'mver-1',
          versionCode: 'MNU-VER-2026-SUM',
          name: 'Summer Resort A La Carte Menu 2026 V2.4',
          description: 'Primary resort dining menu featuring summer grills, fresh beverages, and seasonal specialties',
          menuType: 'All Outlets',
          validFrom: '2026-06-01',
          validTo: '2026-09-30',
          status: 'Active',
          targetFoodCostPercentage: 28.0,
          totalMenuItems: (state.enhancedMenuItems || []).length || 18,
          approvedBy: 'Executive Chef Mohammad Ali',
          createdAt: '2026-05-25T10:00:00Z',
          updatedAt: '2026-08-15T14:30:00Z'
        },
        {
          id: 'mver-2',
          versionCode: 'MNU-VER-2026-BNQ',
          name: 'Royal Banquet & Wedding Gala Package 2026',
          description: 'Grand wedding feast, corporate conference lunch spreads, and royal buffet setups',
          menuType: 'Banquet & Events',
          validFrom: '2026-01-01',
          validTo: '2026-12-31',
          status: 'Active',
          targetFoodCostPercentage: 30.0,
          totalMenuItems: 12,
          approvedBy: 'F&B Director Tanvir Hasan',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-06-10T12:00:00Z'
        },
        {
          id: 'mver-3',
          versionCode: 'MNU-VER-2026-LCH',
          name: 'Executive Business Lunch Express Menu',
          description: '30-minute guaranteed fast business lunch sets for corporate guests and conference delegates',
          menuType: 'Restaurant',
          validFrom: '2026-03-01',
          validTo: '2026-11-30',
          status: 'Active',
          targetFoodCostPercentage: 26.0,
          totalMenuItems: 8,
          approvedBy: 'Sous Chef Rafiqul Islam',
          createdAt: '2026-03-01T08:00:00Z',
          updatedAt: '2026-07-20T09:00:00Z'
        },
        {
          id: 'mver-4',
          versionCode: 'MNU-VER-2026-AUT',
          name: 'Autumn & Winter Festive Menu 2026 (Upcoming)',
          description: 'Upcoming cold season menu featuring rich slow-cooked stews, hot desserts, and festive roasts',
          menuType: 'All Outlets',
          validFrom: '2026-10-01',
          validTo: '2027-02-28',
          status: 'Upcoming',
          targetFoodCostPercentage: 29.0,
          totalMenuItems: 14,
          approvedBy: 'Executive Chef Mohammad Ali',
          createdAt: '2026-08-20T16:00:00Z',
          updatedAt: '2026-08-28T11:00:00Z'
        },
        {
          id: 'mver-5',
          versionCode: 'MNU-VER-2026-RMD',
          name: 'Ramadan Iftar & Sehri Gala Buffet 2026',
          description: 'Special holy month menu with 60+ item authentic iftar buffet and early morning sehri banquets',
          menuType: 'Restaurant & Banquet',
          validFrom: '2026-03-10',
          validTo: '2026-04-10',
          status: 'Archived',
          targetFoodCostPercentage: 32.5,
          totalMenuItems: 24,
          approvedBy: 'F&B Director Tanvir Hasan',
          createdAt: '2026-02-15T00:00:00Z',
          updatedAt: '2026-04-12T00:00:00Z'
        }
      ];
    }
    return state.menuVersionsList || [];
  }

  addMenuVersion(version: Omit<MenuVersion, 'id' | 'createdAt' | 'updatedAt'>): MenuVersion {
    const state = this.getState();
    if (!state.menuVersionsList) state.menuVersionsList = [];
    const newVer: MenuVersion = {
      ...version,
      id: `mver-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    state.menuVersionsList.unshift(newVer);
    this.saveAndNotify();
    return newVer;
  }

  updateMenuVersion(id: string, updates: Partial<MenuVersion>): void {
    const state = this.getState();
    if (!state.menuVersionsList) return;
    const idx = state.menuVersionsList.findIndex(v => v.id === id);
    if (idx !== -1) {
      state.menuVersionsList[idx] = {
        ...state.menuVersionsList[idx],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.saveAndNotify();
    }
  }

  activateMenuVersion(id: string): void {
    const state = this.getState();
    if (!state.menuVersionsList) return;
    state.menuVersionsList.forEach(v => {
      if (v.id === id) {
        v.status = 'Active';
        v.updatedAt = new Date().toISOString();
      }
    });
    this.saveAndNotify();
  }

  deleteMenuVersion(id: string): void {
    const state = this.getState();
    if (!state.menuVersionsList) return;
    state.menuVersionsList = state.menuVersionsList.filter(v => v.id !== id);
    this.saveAndNotify();
  }

  // ========================================================
  // 22. SERVICE CHARGE RULES & STAFF POOL DISTRIBUTION
  // ========================================================
  addServiceChargeRule(rule: Omit<ServiceChargeRule, 'id'>): ServiceChargeRule {
    const state = this.getState();
    if (!state.serviceChargeRules) state.serviceChargeRules = [];
    const newRule: ServiceChargeRule = {
      ...rule,
      id: `sc-rule-${Date.now()}`
    };
    state.serviceChargeRules.push(newRule);
    this.saveAndNotify();
    return newRule;
  }

  updateServiceChargeRule(id: string, updates: Partial<ServiceChargeRule>): void {
    const state = this.getState();
    if (!state.serviceChargeRules) return;
    const idx = state.serviceChargeRules.findIndex(r => r.id === id);
    if (idx !== -1) {
      state.serviceChargeRules[idx] = {
        ...state.serviceChargeRules[idx],
        ...updates
      };
      this.saveAndNotify();
    }
  }

  distributeStaffServiceChargePool(amount: number, monthName: string, approvedBy: string): JournalVoucher {
    const state = this.getState();
    const jvNum = `JV-SC-DIST-${Date.now().toString().slice(-4)}`;
    
    // Debit 2110 Service Charge Payable, Credit 1010 Bank / Cash
    const newJv: JournalVoucher = {
      id: `jv-sc-${Date.now()}`,
      voucherNumber: jvNum,
      date: new Date().toISOString().split('T')[0],
      sourceModule: 'Restaurant POS',
      sourceReference: `SC-DIST-${monthName}`,
      narration: `Monthly distribution of 10% F&B Service Charge pool to hotel & kitchen staff for ${monthName}`,
      entries: [
        {
          id: `jve-sc-dr-${Date.now()}`,
          accountCode: '2110',
          accountName: 'Service Charge Payable (10% Staff Pool)',
          debit: amount,
          credit: 0,
          memo: `Staff welfare pool disbursement for ${monthName}`
        },
        {
          id: `jve-sc-cr-${Date.now()}`,
          accountCode: '1010',
          accountName: 'Cash in Vault & Commercial Bank Accounts',
          debit: 0,
          credit: amount,
          memo: `Direct bank transfer to staff payroll accounts`
        }
      ],
      totalDebit: amount,
      totalCredit: amount,
      isBalanced: true,
      postedBy: approvedBy || 'F&B Director',
      postedAt: new Date().toISOString()
    };

    if (!state.journalVouchers) state.journalVouchers = [];
    state.journalVouchers.unshift(newJv);

    // Update GL balances
    const scGl = (state.glAccounts || []).find(g => g.code === '2110');
    if (scGl) scGl.balance = Math.max(0, scGl.balance - amount);
    const bankGl = (state.glAccounts || []).find(g => g.code === '1010');
    if (bankGl) bankGl.balance -= amount;

    this.saveAndNotify();
    return newJv;
  }

  // ========================================================
  // 23. TAX & VAT RULES CRUD
  // ========================================================
  addTaxRule(rule: Omit<TaxRule, 'id'>): TaxRule {
    const state = this.getState();
    if (!state.taxRules) state.taxRules = [];
    const newTax: TaxRule = {
      ...rule,
      id: `tax-rule-${Date.now()}`
    };
    state.taxRules.push(newTax);
    this.saveAndNotify();
    return newTax;
  }

  updateTaxRule(id: string, updates: Partial<TaxRule>): void {
    const state = this.getState();
    if (!state.taxRules) return;
    const idx = state.taxRules.findIndex(t => t.id === id);
    if (idx !== -1) {
      state.taxRules[idx] = {
        ...state.taxRules[idx],
        ...updates
      };
      this.saveAndNotify();
    }
  }

  // ========================================================
  // 24. MENU ACCOUNTING MAPPING (GL CHART OF ACCOUNTS)
  // ========================================================
  getMenuAccountingMapping(): MenuAccountingMapping {
    const state = this.getState();
    if (!state.menuAccountingMapping) {
      state.menuAccountingMapping = {
        foodRevenueGlCode: '4020',
        foodRevenueGlName: 'Food & Beverage Outlet Sales',
        beverageRevenueGlCode: '4030',
        beverageRevenueGlName: 'Bar & Lounge Revenue',
        banquetRevenueGlCode: '4040',
        banquetRevenueGlName: 'Convention Halls & Banquet Venue Hire',
        foodCostGlCode: '5020',
        foodCostGlName: 'F&B Kitchen Raw Materials & Consumables',
        beverageCostGlCode: '5025',
        beverageCostGlName: 'Bar & Beverage Cost of Sales',
        vatLiabilityGlCode: '2100',
        vatLiabilityGlName: 'VAT / Government Tax Payable (15%)',
        serviceChargeLiabilityGlCode: '2110',
        serviceChargeLiabilityGlName: 'Service Charge Payable (10% Staff Pool)',
        discountExpenseGlCode: '4090',
        discountExpenseGlName: 'Sales Discounts & Promotions Allowance',
        spoilageWastageGlCode: '5028',
        spoilageWastageGlName: 'Kitchen & Bar Spoilage / Wastage Expense',
        inventoryFoodAssetGlCode: '1300',
        inventoryFoodAssetGlName: 'Food & Raw Ingredients Inventory Asset',
        inventoryBeverageAssetGlCode: '1310',
        inventoryBeverageAssetGlName: 'Bar & Lounge Beverages Inventory Asset'
      };
    }
    return state.menuAccountingMapping;
  }

  updateMenuAccountingMapping(mapping: Partial<MenuAccountingMapping>): void {
    const state = this.getState();
    state.menuAccountingMapping = {
      ...this.getMenuAccountingMapping(),
      ...mapping
    };
    this.saveAndNotify();
  }
}

export const inventoryMenuService = new InventoryMenuService();
