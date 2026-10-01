// CCULB PMS - Comprehensive Inventory Management Module
// Full Stock Ledger, Warehouses, GRN, Wastage, Physical Count, Purchase & Valuation

import React, { useState, useEffect, useMemo } from 'react';
import {
  Boxes, Package, Store, ArrowUpDown, Receipt, AlertTriangle,
  FileCheck, Trash2, ClipboardList, ShoppingCart, Truck, Users,
  BarChart3, Settings, Plus, Search, Filter, RefreshCw, CheckCircle2,
  Calendar, Layers, Tag, Scale, ArrowRight, Eye, Printer, Download,
  TrendingDown, TrendingUp, Clock, AlertCircle, ShieldAlert, Sparkles, Send
} from 'lucide-react';
import { inventoryMenuService } from '../services/inventoryMenuService';
import { pmsService } from '../services/pmsService';
import { PmsDatabaseState } from '../services/mockPmsDatabase';
import {
  InventoryItem, WarehouseStore, InventoryCategory, UnitOfMeasure,
  Supplier, StockLedgerEntry, StockAdjustment, StockTransfer,
  GoodsReceiveNote, StoreIssueConsumption, WastageEntry,
  PhysicalStockCount, PurchaseRequest, PurchaseOrder, ItemGroupType
} from '../types/inventoryMenu';
import { StoresManagementTab } from '../components/inventory/StoresManagementTab';
import { StockLevelsTab } from '../components/inventory/StockLevelsTab';
import { CategoriesAndUnitsTab } from '../components/inventory/CategoriesAndUnitsTab';
import { StockTransfersTab } from '../components/inventory/StockTransfersTab';
import { StockIssuesTab } from '../components/inventory/StockIssuesTab';
import { InventoryReportsTab } from '../components/inventory/InventoryReportsTab';

interface InventoryViewProps {
  initialTab?: string;
  onPrintDocument?: (type: string, data: any) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ initialTab = 'dashboard', onPrintDocument }) => {
  const [db, setDb] = useState<PmsDatabaseState>(pmsService.getState());
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');

  // Modals
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isGrnModalOpen, setIsGrnModalOpen] = useState(false);
  const [isWastageModalOpen, setIsWastageModalOpen] = useState(false);
  const [isPhysicalCountModalOpen, setIsPhysicalCountModalOpen] = useState(false);
  const [isPurchaseOrderModalOpen, setIsPurchaseOrderModalOpen] = useState(false);
  const [selectedItemDetail, setSelectedItemDetail] = useState<InventoryItem | null>(null);

  // Form states for modals
  const [isSkuManuallyEdited, setIsSkuManuallyEdited] = useState(false);
  const [newItemForm, setNewItemForm] = useState({
    name: '',
    itemCode: '',
    itemGroup: 'kitchen' as ItemGroupType,
    categoryId: 'icat-1',
    primaryUomId: 'uom-kg',
    consumptionUomId: 'uom-g',
    conversionFactor: 1000,
    itemType: 'Food Ingredient' as InventoryItem['itemType'],
    defaultWarehouseId: 'wh-main',
    preferredSupplierId: 'sup-1',
    reorderLevel: 20,
    minimumStock: 10,
    maximumStock: 150,
    openingStock: 0,
    averageCost: 100
  });

  const [adjustmentForm, setAdjustmentForm] = useState({
    itemId: '',
    warehouseId: 'wh-kitchen',
    adjustmentType: 'Increase' as 'Increase' | 'Decrease',
    quantity: 1,
    reason: 'Inventory reconciliation audit correction',
    adjustedBy: 'Store Supervisor'
  });

  const [transferForm, setTransferForm] = useState({
    sourceWarehouseId: 'wh-main',
    destinationWarehouseId: 'wh-kitchen',
    itemId: '',
    quantity: 5,
    remarks: 'Daily kitchen store replenishment requisition',
    requestedBy: 'Executive Chef Mohammad Ali'
  });

  const [wastageForm, setWastageForm] = useState({
    itemId: '',
    warehouseId: 'wh-kitchen',
    quantity: 2,
    reason: 'Spoilage' as WastageEntry['reason'],
    department: 'Kitchen' as WastageEntry['department'],
    remarks: 'Expired after refrigeration failure check',
    reportedBy: 'Sous Chef Rafiqul Islam'
  });

  const [grnForm, setGrnForm] = useState({
    supplierId: 'sup-1',
    warehouseId: 'wh-main',
    challanNumber: 'CH-2026-894',
    itemId: '',
    receivedQty: 50,
    unitPrice: 140,
    batchNumber: 'BAT-2026-AUG31',
    expiryDate: '2027-02-28',
    receivedBy: 'Warehouse Officer'
  });

  useEffect(() => {
    return pmsService.subscribe(setDb);
  }, []);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const items = useMemo(() => inventoryMenuService.getInventoryItems(), [db]);
  const warehouses = useMemo(() => inventoryMenuService.getWarehouses(), [db]);
  const categories = useMemo(() => inventoryMenuService.getCategories(), [db]);
  const uoms = useMemo(() => inventoryMenuService.getUoms(), [db]);
  const suppliers = useMemo(() => inventoryMenuService.getSuppliers(), [db]);
  const stockLedgers = useMemo(() => inventoryMenuService.getStockLedgers(), [db]);
  const lowStockAlerts = useMemo(() => inventoryMenuService.getLowStockAlerts(), [db]);
  const grns = useMemo(() => inventoryMenuService.getGoodsReceiveNotes(), [db]);
  const wastages = useMemo(() => inventoryMenuService.getWastages(), [db]);
  const transfers = useMemo(() => inventoryMenuService.getStockTransfers(), [db]);
  const adjustments = useMemo(() => inventoryMenuService.getAdjustments(), [db]);
  const physicalCounts = useMemo(() => inventoryMenuService.getPhysicalCounts(), [db]);
  const purchaseOrders = useMemo(() => inventoryMenuService.getPurchaseOrders(), [db]);
  const purchaseRequests = useMemo(() => inventoryMenuService.getPurchaseRequests(), [db]);
  const costSummary = useMemo(() => inventoryMenuService.getFoodAndBeverageCostSummary(), [db]);

  // Total Valuation
  const totalInventoryValuation = useMemo(() => {
    return items.reduce((sum, i) => sum + i.currentTotalValue, 0);
  }, [items]);

  const foodValuation = useMemo(() => {
    return items.filter(i => i.itemType === 'Food Ingredient' || i.itemType === 'Raw Material' || (i.itemType as any) === 'Food Raw Material' || (i.itemType as any) === 'Perishable').reduce((sum, i) => sum + i.currentTotalValue, 0);
  }, [items]);

  const barValuation = useMemo(() => {
    return items.filter(i => i.itemType === 'Bar Item' || (i.itemType as any) === 'Beverage' || (i.itemType as any) === 'Bar Supply').reduce((sum, i) => sum + i.currentTotalValue, 0);
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.itemCode.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategoryFilter === 'all' || item.categoryId === selectedCategoryFilter;
      const matchWarehouse = selectedWarehouseFilter === 'all' || item.defaultWarehouseId === selectedWarehouseFilter;
      const grp = item.itemGroup || inventoryMenuService.determineItemGroup(item);
      const normalizedGrp = grp === 'kitchen' ? 'food' : grp === 'department' ? 'administrative' : grp;
      const normalizedFilter = selectedGroupFilter === 'kitchen' ? 'food' : selectedGroupFilter;
      const matchGroup = selectedGroupFilter === 'all' || normalizedGrp === normalizedFilter;
      return matchSearch && matchCategory && matchWarehouse && matchGroup;
    });
  }, [items, searchQuery, selectedCategoryFilter, selectedWarehouseFilter, selectedGroupFilter]);

  const itemGroupCounts = useMemo(() => {
    const counts = {
      all: items.length,
      food: 0,
      housekeeping: 0,
      maintenance: 0,
      it: 0,
      administrative: 0,
      accessories: 0
    };
    items.forEach(i => {
      const grp = i.itemGroup || inventoryMenuService.determineItemGroup(i);
      const norm = grp === 'kitchen' ? 'food' : grp === 'department' ? 'administrative' : grp;
      if (norm in counts) {
        (counts as any)[norm]++;
      }
    });
    return counts;
  }, [items]);

  // Tab Definitions
  const tabs = [
    { id: 'dashboard', label: 'Inventory Dashboard', icon: Boxes },
    { id: 'items', label: 'Items & Stock', icon: Package, badge: items.length },
    { id: 'stores', label: 'Stores Directory', icon: Store, badge: warehouses.length },
    { id: 'stock-levels', label: 'Store Stock Matrix', icon: Boxes },
    { id: 'ledger', label: 'Stock Ledger', icon: Receipt, badge: stockLedgers.length },
    { id: 'transfers', label: 'Store Transfers', icon: ArrowUpDown, badge: transfers.length },
    { id: 'issues', label: 'Store Issues / Consumption', icon: Send },
    { id: 'grn', label: 'Goods Receive (GRN)', icon: Truck, badge: grns.length },
    { id: 'wastage', label: 'Wastage & Spoilage', icon: Trash2, badge: wastages.length },
    { id: 'physical-counts', label: 'Physical Audit Count', icon: ClipboardList, badge: physicalCounts.length },
    { id: 'expiry', label: 'Batch Expiry Tracking', icon: Clock },
    { id: 'adjustments', label: 'Stock Adjustments', icon: Scale, badge: adjustments.length },
    { id: 'reports', label: 'GL Sync & Valuation', icon: BarChart3 },
    { id: 'categories-uom', label: 'Categories & UOM', icon: Tag }
  ];

  // Open Add Item Modal with fresh newly auto-generated SKU
  const openNewItemModal = () => {
    const defaultCat = categories[0]?.name || 'Food Ingredient';
    const autoSku = inventoryMenuService.generateItemSku('', defaultCat);
    const initialGroup = inventoryMenuService.determineItemGroup({
      name: '',
      categoryName: defaultCat,
      itemType: 'Food Ingredient'
    });
    setNewItemForm({
      name: '',
      itemCode: autoSku,
      itemGroup: initialGroup,
      categoryId: categories[0]?.id || 'icat-1',
      primaryUomId: uoms[0]?.id || 'uom-kg',
      consumptionUomId: uoms[1]?.id || uoms[0]?.id || 'uom-g',
      conversionFactor: 1000,
      itemType: 'Food Ingredient' as InventoryItem['itemType'],
      defaultWarehouseId: warehouses[0]?.id || 'wh-main',
      preferredSupplierId: suppliers[0]?.id || 'sup-1',
      reorderLevel: 20,
      minimumStock: 10,
      maximumStock: 150,
      openingStock: 0,
      averageCost: 100
    });
    setIsSkuManuallyEdited(false);
    setIsAddItemModalOpen(true);
  };

  // Dynamically update SKU and suggested Item Group when item name changes if not manually locked
  const handleItemNameChange = (name: string) => {
    const cat = categories.find(c => c.id === newItemForm.categoryId);
    const suggestedGroup = inventoryMenuService.determineItemGroup({
      name,
      categoryName: cat?.name,
      itemType: newItemForm.itemType
    });
    if (!isSkuManuallyEdited) {
      const generatedSku = inventoryMenuService.generateItemSku(name, cat?.name);
      setNewItemForm(prev => ({
        ...prev,
        name,
        itemGroup: suggestedGroup,
        itemCode: generatedSku
      }));
    } else {
      setNewItemForm(prev => ({ ...prev, name, itemGroup: suggestedGroup }));
    }
  };

  // Dynamically update SKU and Item Group when category changes if not manually locked
  const handleCategoryChange = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    const suggestedGroup = inventoryMenuService.determineItemGroup({
      name: newItemForm.name,
      categoryName: cat?.name,
      itemType: newItemForm.itemType
    });
    if (!isSkuManuallyEdited) {
      const generatedSku = inventoryMenuService.generateItemSku(newItemForm.name, cat?.name);
      setNewItemForm(prev => ({
        ...prev,
        categoryId,
        itemGroup: suggestedGroup,
        itemCode: generatedSku
      }));
    } else {
      setNewItemForm(prev => ({ ...prev, categoryId, itemGroup: suggestedGroup }));
    }
  };

  // Explicitly generate a fresh SKU on button click
  const handleRegenerateSku = () => {
    const cat = categories.find(c => c.id === newItemForm.categoryId);
    const newSku = inventoryMenuService.generateItemSku(newItemForm.name, cat?.name);
    setNewItemForm(prev => ({ ...prev, itemCode: newSku }));
    setIsSkuManuallyEdited(false);
  };

  // Safety hook: If modal is open and SKU is somehow empty, auto-generate immediately
  useEffect(() => {
    if (isAddItemModalOpen && !newItemForm.itemCode) {
      const cat = categories.find(c => c.id === newItemForm.categoryId);
      const generated = inventoryMenuService.generateItemSku(newItemForm.name, cat?.name);
      setNewItemForm(prev => ({ ...prev, itemCode: generated }));
    }
  }, [isAddItemModalOpen, categories]);

  // Handle Add Item
  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = categories.find(c => c.id === newItemForm.categoryId);
    const pUom = uoms.find(u => u.id === newItemForm.primaryUomId);
    const cUom = uoms.find(u => u.id === newItemForm.consumptionUomId);
    const sup = suppliers.find(s => s.id === newItemForm.preferredSupplierId);

    // Guaranteed auto-generated unique SKU
    const finalItemCode = (newItemForm.itemCode && newItemForm.itemCode.trim())
      ? newItemForm.itemCode.trim().toUpperCase()
      : inventoryMenuService.generateItemSku(newItemForm.name, cat?.name);

    inventoryMenuService.addInventoryItem({
      name: newItemForm.name,
      itemCode: finalItemCode,
      itemGroup: newItemForm.itemGroup || inventoryMenuService.determineItemGroup({
        name: newItemForm.name,
        categoryName: cat?.name,
        itemType: newItemForm.itemType
      }),
      categoryId: newItemForm.categoryId,
      categoryName: cat?.name || 'General',
      subcategory: cat?.subcategories?.[0] || 'General',
      uomId: newItemForm.primaryUomId,
      uomCode: pUom?.code || 'kg',
      purchaseUomId: newItemForm.primaryUomId,
      purchaseUomCode: pUom?.code || 'kg',
      consumptionUomId: newItemForm.consumptionUomId,
      consumptionUomCode: cUom?.code || 'g',
      conversionFactor: Number(newItemForm.conversionFactor) || 1000,
      itemType: newItemForm.itemType,
      defaultWarehouseId: newItemForm.defaultWarehouseId,
      preferredSupplierId: newItemForm.preferredSupplierId,
      preferredSupplierName: sup?.name,
      reorderLevel: Number(newItemForm.reorderLevel) || 10,
      reorderQuantity: 20,
      minimumStock: Number(newItemForm.minimumStock) || 5,
      maximumStock: Number(newItemForm.maximumStock) || 100,
      openingStock: Number(newItemForm.openingStock) || 0,
      openingCost: Number(newItemForm.averageCost) || 0,
      averageCost: Number(newItemForm.averageCost) || 0,
      lastPurchaseCost: Number(newItemForm.averageCost) || 0,
      taxPercent: 0,
      trackBatch: true,
      trackExpiry: true,
      active: true
    });

    setIsAddItemModalOpen(false);
  };

  // Handle Stock Adjustment
  const handleCreateAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const itm = items.find(i => i.id === adjustmentForm.itemId);
    const wh = warehouses.find(w => w.id === adjustmentForm.warehouseId);
    if (!itm || !wh) return;

    inventoryMenuService.createStockAdjustment({
      date: new Date().toISOString().split('T')[0],
      itemId: itm.id,
      itemCode: itm.itemCode,
      itemName: itm.name,
      warehouseId: wh.id,
      warehouseName: wh.name,
      adjustmentType: adjustmentForm.adjustmentType,
      quantity: Number(adjustmentForm.quantity) || 1,
      uom: itm.uomCode || 'kg',
      unitCost: itm.averageCost,
      totalValue: (Number(adjustmentForm.quantity) || 1) * itm.averageCost,
      reason: adjustmentForm.reason,
      adjustedBy: adjustmentForm.adjustedBy,
      approvedBy: 'Store Supervisor'
    });

    setIsAdjustmentModalOpen(false);
  };

  // Handle Transfer
  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const itm = items.find(i => i.id === transferForm.itemId);
    const src = warehouses.find(w => w.id === transferForm.sourceWarehouseId);
    const dest = warehouses.find(w => w.id === transferForm.destinationWarehouseId);
    if (!itm || !src || !dest) return;

    inventoryMenuService.createStockTransfer({
      transferDate: new Date().toISOString().split('T')[0],
      sourceWarehouseId: src.id,
      sourceWarehouseName: src.name,
      destinationWarehouseId: dest.id,
      destinationWarehouseName: dest.name,
      items: [
        {
          itemId: itm.id,
          itemCode: itm.itemCode,
          itemName: itm.name,
          quantity: Number(transferForm.quantity) || 1,
          uom: itm.uomCode || 'kg',
          unitCost: itm.averageCost,
          totalCost: (Number(transferForm.quantity) || 1) * itm.averageCost
        }
      ],
      totalCost: (Number(transferForm.quantity) || 1) * itm.averageCost,
      status: 'Received',
      requestedBy: transferForm.requestedBy,
      approvedBy: 'Warehouse In-Charge',
      receivedBy: 'Department Supervisor',
      remarks: transferForm.remarks
    });

    setIsTransferModalOpen(false);
  };

  // Handle Wastage
  const handleCreateWastage = (e: React.FormEvent) => {
    e.preventDefault();
    const itm = items.find(i => i.id === wastageForm.itemId);
    const wh = warehouses.find(w => w.id === wastageForm.warehouseId);
    if (!itm || !wh) return;

    inventoryMenuService.createWastage({
      date: new Date().toISOString().split('T')[0],
      itemId: itm.id,
      itemCode: itm.itemCode,
      itemName: itm.name,
      warehouseId: wh.id,
      warehouseName: wh.name,
      quantity: Number(wastageForm.quantity) || 1,
      uom: itm.uomCode || 'kg',
      unitCost: itm.averageCost,
      totalCost: (Number(wastageForm.quantity) || 1) * itm.averageCost,
      reason: wastageForm.reason,
      department: wastageForm.department,
      reportedBy: wastageForm.reportedBy,
      approvedBy: 'Executive Chef / F&B Manager',
      status: 'Approved & Written Off',
      remarks: wastageForm.remarks
    });

    setIsWastageModalOpen(false);
  };

  // Handle GRN
  const handleCreateGrn = (e: React.FormEvent) => {
    e.preventDefault();
    const itm = items.find(i => i.id === grnForm.itemId);
    const sup = suppliers.find(s => s.id === grnForm.supplierId);
    const wh = warehouses.find(w => w.id === grnForm.warehouseId);
    if (!itm || !sup || !wh) return;

    const acceptedQty = Number(grnForm.receivedQty) || 1;
    const unitPrice = Number(grnForm.unitPrice) || itm.averageCost;
    const totalAmount = acceptedQty * unitPrice;

    inventoryMenuService.createGoodsReceiveNote({
      supplierId: sup.id,
      supplierName: sup.name,
      warehouseId: wh.id,
      warehouseName: wh.name,
      receiveDate: new Date().toISOString().split('T')[0],
      challanNumber: grnForm.challanNumber,
      challanDate: new Date().toISOString().split('T')[0],
      items: [
        {
          itemId: itm.id,
          itemCode: itm.itemCode,
          itemName: itm.name,
          receivedQuantity: acceptedQty,
          acceptedQuantity: acceptedQty,
          rejectedQuantity: 0,
          uom: itm.uomCode || 'kg',
          unitPrice,
          totalPrice: totalAmount,
          batchNumber: grnForm.batchNumber,
          expiryDate: grnForm.expiryDate
        }
      ],
      totalAcceptedAmount: totalAmount,
      inspectionPassed: true,
      inspectedBy: 'Quality Inspector',
      receivedBy: grnForm.receivedBy,
      status: 'Approved & Added to Stock'
    });

    setIsGrnModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Boxes className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Inventory & Stores Management
              <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Single Source of Truth
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time stock ledger, procurement, automated recipe consumption, GRN & GL Accounting integration
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsGrnModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow transition"
          >
            <Truck className="w-4 h-4" />
            <span>Receive Goods (GRN)</span>
          </button>

          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow transition"
          >
            <ArrowUpDown className="w-4 h-4" />
            <span>Stock Transfer</span>
          </button>

          <button
            onClick={() => setIsWastageModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Log Wastage</span>
          </button>

          <button
            onClick={() => setIsAdjustmentModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl shadow transition"
          >
            <Scale className="w-4 h-4" />
            <span>Adjust Stock</span>
          </button>

          <button
            onClick={openNewItemModal}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Item</span>
          </button>
        </div>
      </div>

      {/* 2. Top Navigation Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-1.5 flex items-center gap-1 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. TAB VIEWS CONTENT */}

      {/* ========================================================
          TAB 1: DASHBOARD
      ======================================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Key Metrics Bento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow space-y-1">
              <span className="text-xs text-slate-400 font-medium">Total Inventory Valuation</span>
              <div className="text-2xl font-bold font-mono text-amber-400">
                ৳{(totalInventoryValuation || 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <span>Food: ৳{(foodValuation || 0).toLocaleString()}</span>
                <span>•</span>
                <span>Bar: ৳{(barValuation || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow space-y-1">
              <span className="text-xs text-slate-400 font-medium">Low Stock / Reorder Alerts</span>
              <div className="text-2xl font-bold font-mono text-rose-400 flex items-center justify-between">
                <span>{lowStockAlerts.length} Items</span>
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div className="text-[11px] text-rose-300/80">
                {lowStockAlerts.filter(a => a.urgency === 'Critical').length} Critical Out-of-Stock Risk
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow space-y-1">
              <span className="text-xs text-slate-400 font-medium">Food & Beverage COGS (MTD)</span>
              <div className="text-2xl font-bold font-mono text-indigo-400">
                ৳{(costSummary.cogsTotal || 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-400">
                Food Cost: {costSummary.foodCostPercentage}% (Target: ≤ 30%)
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow space-y-1">
              <span className="text-xs text-slate-400 font-medium">Recorded Wastage (MTD)</span>
              <div className="text-2xl font-bold font-mono text-orange-400">
                ৳{(costSummary.totalWastageValue || 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400">
                {wastages.length} approved write-off logs
              </div>
            </div>
          </div>

          {/* Low Stock Alerts Banner */}
          {lowStockAlerts.length > 0 && (
            <div className="bg-rose-950/30 border border-rose-500/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
                  <AlertCircle className="w-5 h-5" />
                  <span>Immediate Procurement Reorder Required ({lowStockAlerts.length} Items)</span>
                </div>
                <button
                  onClick={() => setIsPurchaseOrderModalOpen(true)}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition"
                >
                  Generate Purchase Orders
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {lowStockAlerts.map(({ item, deficit, urgency }) => (
                  <div key={item.id} className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-slate-200 block">{item.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Code: {item.itemCode} • Store: {item.storageLocation || item.defaultWarehouseId}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-rose-400 block">
                        {item.currentTotalStock} {item.uomCode} (Min: {item.minimumStock})
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        urgency === 'Critical' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {urgency} Deficit: -{deficit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Overview Tables: Stores & Recent Ledger */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stores Snapshot */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <Store className="w-4 h-4 text-amber-400" />
                  Store Inventory & Stock Breakdown
                </h3>
                <span className="text-xs text-slate-400">{warehouses.length} Active Stores</span>
              </div>

              <div className="space-y-3">
                {warehouses.map(wh => {
                  const whStocks = db.inventoryStocks.filter(s => s.warehouseId === wh.id);
                  const whValuation = whStocks.reduce((sum, s) => sum + s.stockValue, 0);
                  const itemCount = whStocks.length;

                  return (
                    <div key={wh.id} className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-slate-200">{wh.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                            {wh.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Managed by {wh.managerName} • Location: {wh.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-xs text-amber-400 block">
                          ৳{(whValuation || 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {itemCount} SKUs stocked
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Stock Ledger Activity */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-indigo-400" />
                  Live Stock Ledger Activity Stream
                </h3>
                <button
                  onClick={() => setActiveTab('ledger')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  View Full Ledger →
                </button>
              </div>

              <div className="space-y-2.5 overflow-y-auto max-h-[340px]">
                {stockLedgers.slice(0, 7).map(ledger => {
                  const isIncoming = ledger.quantityIn > 0;
                  return (
                    <div key={ledger.id} className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            ledger.transactionType === 'Purchase Receive'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : ledger.transactionType === 'Recipe Consumption'
                              ? 'bg-indigo-500/20 text-indigo-300'
                              : ledger.transactionType === 'Wastage'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {ledger.transactionType}
                          </span>
                          <span className="font-bold text-slate-200">{ledger.itemName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {ledger.date} • Ref: {ledger.referenceDocument} • Store: {ledger.warehouseName}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`font-mono font-bold block ${
                          isIncoming ? 'text-emerald-400' : 'text-slate-300'
                        }`}>
                          {isIncoming ? `+${ledger.quantityIn}` : `-${ledger.quantityOut}`}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ৳{(ledger.totalCost ?? 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: ITEMS & PRODUCTS MASTER
      ======================================================== */}
      {activeTab === 'items' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                Inventory Items Master Catalog ({filteredItems.length} Products)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Centralized master data with UOM conversions, weighted average cost, and live stock tracking
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search item name, SKU code..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategoryFilter}
                onChange={e => setSelectedCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {/* Warehouse Filter */}
              <select
                value={selectedWarehouseFilter}
                onChange={e => setSelectedWarehouseFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300"
              >
                <option value="all">All Warehouses</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Item Classification Group Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" />
              <span>Filter Group:</span>
            </span>
            <button
              type="button"
              onClick={() => setSelectedGroupFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedGroupFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              All ({itemGroupCounts.all})
            </button>
            <button
              type="button"
              onClick={() => setSelectedGroupFilter('food')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                selectedGroupFilter === 'food' || selectedGroupFilter === 'kitchen'
                  ? 'bg-amber-600 text-white font-bold shadow'
                  : 'bg-slate-950 text-amber-400/90 hover:text-amber-300 border border-slate-800'
              }`}
            >
              <span>🍳 Food &amp; Kitchen ({itemGroupCounts.food})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedGroupFilter('housekeeping')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                selectedGroupFilter === 'housekeeping'
                  ? 'bg-teal-600 text-white font-bold shadow'
                  : 'bg-slate-950 text-teal-400/90 hover:text-teal-300 border border-slate-800'
              }`}
            >
              <span>🧹 Housekeeping ({itemGroupCounts.housekeeping})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedGroupFilter('maintenance')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                selectedGroupFilter === 'maintenance'
                  ? 'bg-orange-600 text-white font-bold shadow'
                  : 'bg-slate-950 text-orange-400/90 hover:text-orange-300 border border-slate-800'
              }`}
            >
              <span>🔧 Maintenance ({itemGroupCounts.maintenance})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedGroupFilter('it')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                selectedGroupFilter === 'it'
                  ? 'bg-sky-600 text-white font-bold shadow'
                  : 'bg-slate-950 text-sky-400/90 hover:text-sky-300 border border-slate-800'
              }`}
            >
              <span>💻 IT &amp; Tech ({itemGroupCounts.it})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedGroupFilter('administrative')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                selectedGroupFilter === 'administrative' || selectedGroupFilter === 'department'
                  ? 'bg-emerald-600 text-white font-bold shadow'
                  : 'bg-slate-950 text-emerald-400/90 hover:text-emerald-300 border border-slate-800'
              }`}
            >
              <span>📋 Admin ({itemGroupCounts.administrative})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedGroupFilter('accessories')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                selectedGroupFilter === 'accessories'
                  ? 'bg-purple-600 text-white font-bold shadow'
                  : 'bg-slate-950 text-purple-400/90 hover:text-purple-300 border border-slate-800'
              }`}
            >
              <span>🧰 Accessories ({itemGroupCounts.accessories})</span>
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-3 py-3">Code / SKU</th>
                  <th className="px-3 py-3">Item Name</th>
                  <th className="px-3 py-3">Group</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3">Default Store</th>
                  <th className="px-3 py-3">UOM & Ratio</th>
                  <th className="px-3 py-3 text-right">Avg Cost</th>
                  <th className="px-3 py-3 text-right">Current Stock</th>
                  <th className="px-3 py-3 text-right">Total Valuation</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredItems.map(item => {
                  const isLow = item.currentTotalStock <= item.reorderLevel;
                  const isOut = item.currentTotalStock === 0;
                  const rawGrp = item.itemGroup || inventoryMenuService.determineItemGroup(item);
                  const grp = rawGrp === 'kitchen' ? 'food' : rawGrp === 'department' ? 'administrative' : rawGrp;
                  const isFood = grp === 'food';
                  const isHk = grp === 'housekeeping';
                  const isMaint = grp === 'maintenance';
                  const isIt = grp === 'it';
                  const isAdmin = grp === 'administrative';
                  const icon = isFood ? '🍳' : isHk ? '🧹' : isMaint ? '🔧' : isIt ? '💻' : isAdmin ? '📋' : '🧰';
                  const groupBadgeBg = isFood ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : isHk ? 'bg-teal-500/20 text-teal-300 border-teal-500/30' : isMaint ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' : isIt ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' : isAdmin ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-purple-500/20 text-purple-300 border-purple-500/30';
                  const groupLabel = isFood ? 'Food' : isHk ? 'Housekeeping' : isMaint ? 'Maintenance' : isIt ? 'IT & Tech' : isAdmin ? 'Admin' : 'Accessories';

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-3 py-3 font-mono font-bold text-amber-400">
                        {item.itemCode}
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-white">{item.name}</div>
                        <span className="text-[10px] text-slate-400">{item.itemType} • {item.storageLocation || item.subcategory}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-flex items-center gap-1 ${groupBadgeBg}`}>
                          <span>{icon}</span>
                          <span>{groupLabel}</span>
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">
                          {item.categoryName}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-400">
                        {item.storageLocation || item.defaultWarehouseId}
                      </td>
                      <td className="px-3 py-3 font-mono text-[11px]">
                        {item.uomCode} (1 {item.uomCode} = {item.conversionFactor} {item.consumptionUomCode})
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-semibold">
                        ৳{item.averageCost.toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-bold">
                        <span className={isOut ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-emerald-400'}>
                          {item.currentTotalStock} {item.uomCode}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-bold text-white">
                        ৳{(item.currentTotalValue || 0).toLocaleString()}
                      </td>
                      <td className="px-3 py-3">
                        {isOut ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Reorder (≤ {item.reorderLevel})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Adequate
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedItemDetail(item)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1"
                            title="View Full Item Details & Specs"
                          >
                            <Eye className="w-3 h-3 text-slate-400" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedItemDetail(item);
                              setTimeout(() => window.print(), 300);
                            }}
                            className="px-2 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                            title="Instant Print Item Spec & Barcode Slip"
                          >
                            <Printer className="w-3 h-3 text-indigo-400" />
                            <span className="hidden sm:inline">Print Slip</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 5: STOCK LEDGER (AUDIT TRAIL)
      ======================================================== */}
      {activeTab === 'ledger' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-400" />
                Immutable Stock Ledger & Audit Log ({stockLedgers.length} Transactions)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Every stock transaction is recorded here with running balance, unit cost, source document & business date
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-3 py-1 rounded-lg bg-slate-950 border border-slate-700 text-emerald-400 font-bold">
                GL Account Integrated: 1300 / 1310 / 5020 / 5028
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-3 py-3">Txn #</th>
                  <th className="px-3 py-3">Date & Time</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3">Item Name</th>
                  <th className="px-3 py-3">Store / Warehouse</th>
                  <th className="px-3 py-3">Source Ref</th>
                  <th className="px-3 py-3 text-right">In (+Qty)</th>
                  <th className="px-3 py-3 text-right">Out (-Qty)</th>
                  <th className="px-3 py-3 text-right">Unit Cost</th>
                  <th className="px-3 py-3 text-right">Total Cost</th>
                  <th className="px-3 py-3 text-right">Running Stock</th>
                  <th className="px-3 py-3">Authorized By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {stockLedgers.map(l => (
                  <tr key={l.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-3 py-2.5 font-mono font-bold text-indigo-400">
                      {l.transactionNumber}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-slate-400">
                      {l.date}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        l.transactionType === 'Purchase Receive'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : l.transactionType === 'Recipe Consumption'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : l.transactionType === 'Wastage'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {l.transactionType}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-white">
                      {l.itemName}
                    </td>
                    <td className="px-3 py-2.5 text-slate-400">
                      {l.warehouseName}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-slate-400">
                      {l.referenceDocument}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-400">
                      {l.quantityIn > 0 ? `+${l.quantityIn}` : '-'}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-rose-400">
                      {l.quantityOut > 0 ? `-${l.quantityOut}` : '-'}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      ৳{l.unitCost.toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-white">
                      ৳{(l.totalCost ?? 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-amber-400">
                      {l.runningQuantity}
                    </td>
                    <td className="px-3 py-2.5 text-slate-400">
                      {l.user}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 7: GOODS RECEIVE NOTE (GRN)
      ======================================================== */}
      {activeTab === 'grn' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                Goods Receive Notes (GRN) & Inward Receiving
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically posts Accounting Journal Vouchers (Dr 1300/1310 Inventory, Cr 2050 AP Creditors)
              </p>
            </div>
            <button
              onClick={() => setIsGrnModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Inward GRN</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {grns.map(grn => (
              <div key={grn.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-emerald-400 text-sm">{grn.grnNumber}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {grn.status}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{grn.receiveDate}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Supplier / Vendor:</span>
                    <span className="font-semibold text-slate-200">{grn.supplierName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Challan / Invoice #:</span>
                    <span className="font-mono text-slate-200">{grn.challanNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Receiving Store:</span>
                    <span className="text-slate-200">{grn.warehouseName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Accounting Journal Voucher:</span>
                    <span className="font-mono font-bold text-amber-400">{grn.journalVoucherNumber}</span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-900 rounded-lg space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Items Received:</span>
                  {grn.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-slate-300">
                      <span>{it.itemName} (x{it.acceptedQuantity} {it.uom})</span>
                      <span className="font-mono font-bold">৳{(it.totalPrice ?? 0).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-800 text-white">
                    <span>Total Accepted Value:</span>
                    <span className="text-emerald-400 font-mono">৳{(grn.totalAcceptedAmount ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 9: WASTAGE & SPOILAGE
      ======================================================== */}
      {activeTab === 'wastage' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-400" />
                Wastage, Spoilage & Write-Offs ({wastages.length} Records)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Every loss is accounted with GL Expense Voucher Dr 5028 Kitchen & Bar Wastage Expense
              </p>
            </div>
            <button
              onClick={() => setIsWastageModalOpen(true)}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Record Wastage</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-3 py-3">Wastage #</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Department</th>
                  <th className="px-3 py-3">Item Name</th>
                  <th className="px-3 py-3">Store</th>
                  <th className="px-3 py-3 text-right">Written-Off Qty</th>
                  <th className="px-3 py-3 text-right">Unit Cost</th>
                  <th className="px-3 py-3 text-right">Loss Amount</th>
                  <th className="px-3 py-3">Reason & Notes</th>
                  <th className="px-3 py-3">Accounting JV #</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {wastages.map(w => (
                  <tr key={w.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-3 py-3 font-mono font-bold text-rose-400">{w.wastageNumber}</td>
                    <td className="px-3 py-3 font-mono text-slate-400">{w.date}</td>
                    <td className="px-3 py-3 font-semibold text-slate-200">{w.department}</td>
                    <td className="px-3 py-3 font-bold text-white">{w.itemName}</td>
                    <td className="px-3 py-3 text-slate-400">{w.warehouseName}</td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-rose-400">
                      -{w.quantity} {w.uom}
                    </td>
                    <td className="px-3 py-3 text-right font-mono">৳{w.unitCost}</td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-rose-400">
                      ৳{(w.totalCost ?? 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">
                        {w.reason}
                      </span>
                      {w.remarks && <p className="text-[10px] text-slate-400 mt-0.5">{w.remarks}</p>}
                    </td>
                    <td className="px-3 py-3 font-mono font-bold text-amber-400">
                      {w.journalVoucherNumber}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 10: PHYSICAL STOCK COUNT AUDIT
      ======================================================== */}
      {activeTab === 'physical-counts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-amber-400" />
                Physical Stock Count & Blind Audit Reconciliations
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Compare actual physical counts with system stock, detect shrinkage & auto-post variance journals
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {physicalCounts.map(count => (
              <div key={count.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-amber-400 text-sm">{count.countNumber}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {count.status}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{count.countDate} • Verified by {count.verifiedBy}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-3 py-2">Item Code</th>
                        <th className="px-3 py-2">Item Name</th>
                        <th className="px-3 py-2 text-right">System Qty</th>
                        <th className="px-3 py-2 text-right">Counted Qty</th>
                        <th className="px-3 py-2 text-right">Variance Qty</th>
                        <th className="px-3 py-2 text-right">Variance Value</th>
                        <th className="px-3 py-2">Audit Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {count.items.map(it => (
                        <tr key={it.itemId}>
                          <td className="px-3 py-2 font-mono text-slate-400">{it.itemCode}</td>
                          <td className="px-3 py-2 font-bold text-white">{it.itemName}</td>
                          <td className="px-3 py-2 text-right font-mono">{it.systemQuantity} {it.uom}</td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-white">{it.countedQuantity} {it.uom}</td>
                          <td className={`px-3 py-2 text-right font-mono font-bold ${
                            it.varianceQuantity < 0 ? 'text-rose-400' : it.varianceQuantity > 0 ? 'text-emerald-400' : 'text-slate-400'
                          }`}>
                            {it.varianceQuantity > 0 ? `+${it.varianceQuantity}` : it.varianceQuantity} {it.uom}
                          </td>
                          <td className={`px-3 py-2 text-right font-mono font-bold ${
                            it.varianceValue < 0 ? 'text-rose-400' : it.varianceValue > 0 ? 'text-emerald-400' : 'text-slate-400'
                          }`}>
                            ৳{(it.varianceValue ?? 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-slate-400">{it.notes || 'Normal variance'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-400">
                    Adjustment Journal Voucher: <span className="font-mono font-bold text-amber-400">{count.adjustmentJournalVoucher}</span>
                  </span>
                  <span className="font-mono font-bold text-sm text-slate-200">
                    Net Audit Variance: <span className={count.netVarianceValue < 0 ? 'text-rose-400' : 'text-emerald-400'}>
                      ৳{(count.netVarianceValue ?? 0).toLocaleString()}
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: STORES DIRECTORY
      ======================================================== */}
      {(activeTab === 'stores' || activeTab === 'warehouses') && (
        <StoresManagementTab
          stores={warehouses}
          onOpenTransfer={(storeId) => {
            setTransferForm(prev => ({ ...prev, sourceWarehouseId: storeId }));
            setIsTransferModalOpen(true);
          }}
        />
      )}

      {/* ========================================================
          TAB 4: MULTI-STORE STOCK MATRIX
      ======================================================== */}
      {activeTab === 'stock-levels' && (
        <StockLevelsTab
          items={items}
          stores={warehouses}
          onOpenTransfer={(itemId) => {
            if (itemId) setTransferForm(prev => ({ ...prev, itemId }));
            setIsTransferModalOpen(true);
          }}
          onOpenAdjustment={(itemId) => {
            if (itemId) setAdjustmentForm(prev => ({ ...prev, itemId }));
            setIsAdjustmentModalOpen(true);
          }}
        />
      )}

      {/* ========================================================
          TAB 6: STORE TRANSFERS
      ======================================================== */}
      {activeTab === 'transfers' && (
        <StockTransfersTab
          transfers={transfers}
          stores={warehouses}
          items={items}
        />
      )}

      {/* ========================================================
          TAB 8: STORE ISSUES & CONSUMPTION
      ======================================================== */}
      {activeTab === 'issues' && (
        <StockIssuesTab
          issues={pmsService.getState().storeIssues || []}
          stores={warehouses}
          items={items}
        />
      )}

      {/* ========================================================
          TAB 11: STOCK ADJUSTMENTS
      ======================================================== */}
      {activeTab === 'adjustments' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-400" />
                Stock Adjustments & Reconciliation Log ({adjustments.length} Records)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Manual and audit adjustments with corresponding General Ledger Journal Vouchers
              </p>
            </div>
            <button
              onClick={() => setIsAdjustmentModalOpen(true)}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>New Stock Adjustment</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-3 py-3">Adjustment #</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Store</th>
                  <th className="px-3 py-3">Item Name</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3 text-right">Qty Adjusted</th>
                  <th className="px-3 py-3 text-right">Value (৳)</th>
                  <th className="px-3 py-3">Reason</th>
                  <th className="px-3 py-3">Adjusted By</th>
                  <th className="px-3 py-3">JV Number</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {adjustments.map(adj => (
                  <tr key={adj.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-3 py-3 font-mono font-bold text-amber-400">{adj.adjustmentNumber}</td>
                    <td className="px-3 py-3 font-mono text-slate-400">{adj.date}</td>
                    <td className="px-3 py-3 text-slate-300">{adj.warehouseName}</td>
                    <td className="px-3 py-3 font-bold text-white">{adj.itemName}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        adj.adjustmentType === 'Increase'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {adj.adjustmentType}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-bold">
                      {adj.adjustmentType === 'Increase' ? `+${adj.quantity}` : `-${adj.quantity}`} {adj.uom}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-amber-400">
                      ৳{(adj.totalValue ?? 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-slate-400">{adj.reason}</td>
                    <td className="px-3 py-3 text-slate-400">{adj.adjustedBy}</td>
                    <td className="px-3 py-3 font-mono font-bold text-emerald-400">{adj.journalVoucherNumber || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB: BATCH EXPIRY TRACKING
      ======================================================== */}
      {activeTab === 'expiry' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                Batch & Expiry Date Management
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitor perishable ingredients, dairy, poultry, beverages, and near-expiry stock with FEFO (First-Expired, First-Out)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold font-mono">
                FEFO Policy Active
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-3 py-3">Batch / Lot #</th>
                  <th className="px-3 py-3">Item Name</th>
                  <th className="px-3 py-3">Store Location</th>
                  <th className="px-3 py-3">Received Date</th>
                  <th className="px-3 py-3">Expiry Date</th>
                  <th className="px-3 py-3 text-right">Available Qty</th>
                  <th className="px-3 py-3">Expiry Status</th>
                  <th className="px-3 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {grns.flatMap(g => g.items.map(it => ({
                  batch: g.items[0]?.batchNumber || 'BAT-2026-AUG31',
                  itemName: it.itemName,
                  warehouseName: g.warehouseName,
                  receiveDate: g.receiveDate,
                  expiryDate: '2026-11-30',
                  quantity: it.acceptedQuantity,
                  uom: it.uom
                }))).concat([
                  {
                    batch: 'BAT-2026-DAIRY-09',
                    itemName: 'Full Cream Liquid Milk',
                    warehouseName: 'Main Central Store (CCULB HQ)',
                    receiveDate: '2026-09-15',
                    expiryDate: '2026-09-25',
                    quantity: 45,
                    uom: 'L'
                  },
                  {
                    batch: 'BAT-2026-POULTRY-12',
                    itemName: 'Fresh Broiler Chicken (Dressed)',
                    warehouseName: 'Kitchen Cold Room / Freezer',
                    receiveDate: '2026-09-18',
                    expiryDate: '2026-09-28',
                    quantity: 60,
                    uom: 'KG'
                  },
                  {
                    batch: 'BAT-2026-BEEF-02',
                    itemName: 'Boneless Beef Chuck',
                    warehouseName: 'Kitchen Cold Room / Freezer',
                    receiveDate: '2026-09-10',
                    expiryDate: '2026-10-10',
                    quantity: 80,
                    uom: 'KG'
                  }
                ]).map((row, idx) => {
                  const isExpiringSoon = row.expiryDate <= '2026-09-30';
                  return (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="px-3 py-3 font-mono font-bold text-amber-400">{row.batch}</td>
                      <td className="px-3 py-3 font-semibold text-white">{row.itemName}</td>
                      <td className="px-3 py-3 text-slate-300">{row.warehouseName}</td>
                      <td className="px-3 py-3 font-mono text-slate-400">{row.receiveDate}</td>
                      <td className="px-3 py-3 font-mono font-bold text-slate-200">{row.expiryDate}</td>
                      <td className="px-3 py-3 text-right font-mono font-bold text-emerald-400">{row.quantity} {row.uom}</td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isExpiringSoon
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {isExpiringSoon ? 'Near Expiry (< 10 Days)' : 'Fresh & Good'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() => {
                            setWastageForm(prev => ({
                              ...prev,
                              remarks: `Wastage write-off for batch ${row.batch}`
                            }));
                            setIsWastageModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-medium transition"
                        >
                          Record Spoilage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 12: VALUATION & REPORTS
      ======================================================== */}
      {activeTab === 'reports' && (
        <InventoryReportsTab
          stores={warehouses}
          items={items}
          categories={categories}
        />
      )}

      {/* ========================================================
          TAB 13: CATEGORIES & UNITS OF MEASURE
      ======================================================== */}
      {(activeTab === 'categories-uom' || activeTab === 'categories' || activeTab === 'units') && (
        <CategoriesAndUnitsTab
          categories={categories}
          uoms={uoms}
        />
      )}

      {/* ========================================================
          MODAL: ADD NEW ITEM
      ======================================================== */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                Register New Inventory Item / Product
              </h3>
              <button onClick={() => setIsAddItemModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="col-span-2">
                  <label className="text-slate-300 font-bold block mb-1">Item / Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Premium Basmati Rice / Tiger Prawns / Fresh Mint"
                    value={newItemForm.name}
                    onChange={e => handleItemNameChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-bold flex items-center gap-1.5">
                      <span>SKU / Item Code</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        Auto-Generated
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={handleRegenerateSku}
                      className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline cursor-pointer"
                      title="Click to generate a new fresh unique SKU"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Regenerate</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Auto-generating SKU..."
                      value={newItemForm.itemCode}
                      onChange={e => {
                        setIsSkuManuallyEdited(true);
                        setNewItemForm({ ...newItemForm, itemCode: e.target.value });
                      }}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl pl-3 pr-10 py-2 text-amber-300 font-mono font-bold tracking-wider"
                    />
                    <button
                      type="button"
                      onClick={handleRegenerateSku}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Click to generate a fresh unique SKU"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    Auto-generated unique SKU. Users never need to type.
                  </p>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Category *</label>
                  <select
                    value={newItemForm.categoryId}
                    onChange={e => handleCategoryChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    {categories.map(c => <option key={c.id} value={c.id} className="bg-slate-900 text-white">{c.name}</option>)}
                  </select>
                </div>

                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-300 font-bold flex items-center gap-1.5">
                      <span>Item Classification Group *</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        Rule-Based Routing
                      </span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Auto-assigned by category &amp; name keywords (or select manually)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewItemForm(prev => ({ ...prev, itemGroup: 'food' }))}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                        newItemForm.itemGroup === 'food' || newItemForm.itemGroup === 'kitchen'
                          ? 'bg-amber-500/25 border-amber-500 text-white font-bold ring-1 ring-amber-500/50'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-base shrink-0">🍳</span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white">Food &amp; Kitchen</div>
                        <div className="text-[10px] text-slate-400 truncate">Food, Spices, Dairy</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewItemForm(prev => ({ ...prev, itemGroup: 'housekeeping' }))}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                        newItemForm.itemGroup === 'housekeeping'
                          ? 'bg-teal-500/25 border-teal-500 text-white font-bold ring-1 ring-teal-500/50'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-base shrink-0">🧹</span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white">Housekeeping</div>
                        <div className="text-[10px] text-slate-400 truncate">Linen, Towels, Cleaners</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewItemForm(prev => ({ ...prev, itemGroup: 'maintenance' }))}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                        newItemForm.itemGroup === 'maintenance'
                          ? 'bg-orange-500/25 border-orange-500 text-white font-bold ring-1 ring-orange-500/50'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-base shrink-0">🔧</span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white">Maintenance</div>
                        <div className="text-[10px] text-slate-400 truncate">Electrical, Plumbing, HVAC</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewItemForm(prev => ({ ...prev, itemGroup: 'it' }))}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                        newItemForm.itemGroup === 'it'
                          ? 'bg-sky-500/25 border-sky-500 text-white font-bold ring-1 ring-sky-500/50'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-base shrink-0">💻</span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white">IT &amp; Tech</div>
                        <div className="text-[10px] text-slate-400 truncate">POS, Cables, Toners</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewItemForm(prev => ({ ...prev, itemGroup: 'administrative' }))}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                        newItemForm.itemGroup === 'administrative' || newItemForm.itemGroup === 'department'
                          ? 'bg-emerald-500/25 border-emerald-500 text-white font-bold ring-1 ring-emerald-500/50'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-base shrink-0">📋</span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white">Administrative</div>
                        <div className="text-[10px] text-slate-400 truncate">Stationery, Paper, Folios</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewItemForm(prev => ({ ...prev, itemGroup: 'accessories' }))}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                        newItemForm.itemGroup === 'accessories'
                          ? 'bg-purple-500/25 border-purple-500 text-white font-bold ring-1 ring-purple-500/50'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-base shrink-0">🧰</span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white">Accessories</div>
                        <div className="text-[10px] text-slate-400 truncate">Foil, Disposables, Bags</div>
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Primary Purchase UOM *</label>
                  <select
                    value={newItemForm.primaryUomId}
                    onChange={e => setNewItemForm({ ...newItemForm, primaryUomId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    {uoms.map(u => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Consumption Recipe UOM *</label>
                  <select
                    value={newItemForm.consumptionUomId}
                    onChange={e => setNewItemForm({ ...newItemForm, consumptionUomId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    {uoms.map(u => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Conversion Ratio (1 Base = ? Consumption)</label>
                  <input
                    type="number"
                    value={newItemForm.conversionFactor}
                    onChange={e => setNewItemForm({ ...newItemForm, conversionFactor: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Default Store Warehouse *</label>
                  <select
                    value={newItemForm.defaultWarehouseId}
                    onChange={e => setNewItemForm({ ...newItemForm, defaultWarehouseId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Opening Stock Quantity</label>
                  <input
                    type="number"
                    value={newItemForm.openingStock}
                    onChange={e => setNewItemForm({ ...newItemForm, openingStock: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Estimated Unit Cost (৳)</label>
                  <input
                    type="number"
                    value={newItemForm.averageCost}
                    onChange={e => setNewItemForm({ ...newItemForm, averageCost: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Reorder Level Threshold</label>
                  <input
                    type="number"
                    value={newItemForm.reorderLevel}
                    onChange={e => setNewItemForm({ ...newItemForm, reorderLevel: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Preferred Supplier</label>
                  <select
                    value={newItemForm.preferredSupplierId}
                    onChange={e => setNewItemForm({ ...newItemForm, preferredSupplierId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddItemModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs"
                >
                  Save & Register Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: GOODS RECEIVE NOTE (GRN)
      ======================================================== */}
      {isGrnModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                Goods Receive Note (GRN) Inward Processing
              </h3>
              <button onClick={() => setIsGrnModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateGrn} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Supplier / Vendor *</label>
                  <select
                    value={grnForm.supplierId}
                    onChange={e => setGrnForm({ ...grnForm, supplierId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Destination Warehouse *</label>
                  <select
                    value={grnForm.warehouseId}
                    onChange={e => setGrnForm({ ...grnForm, warehouseId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-slate-300 font-bold block mb-1">Select Item to Receive *</label>
                  <select
                    value={grnForm.itemId}
                    onChange={e => {
                      const itm = items.find(i => i.id === e.target.value);
                      setGrnForm({
                        ...grnForm,
                        itemId: e.target.value,
                        unitPrice: itm?.averageCost || 100
                      });
                    }}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="">-- Choose Inventory Item --</option>
                    {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.itemCode})</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Challan / Invoice Number *</label>
                  <input
                    type="text"
                    required
                    value={grnForm.challanNumber}
                    onChange={e => setGrnForm({ ...grnForm, challanNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Accepted Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={grnForm.receivedQty}
                    onChange={e => setGrnForm({ ...grnForm, receivedQty: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Unit Cost (৳) *</label>
                  <input
                    type="number"
                    required
                    value={grnForm.unitPrice}
                    onChange={e => setGrnForm({ ...grnForm, unitPrice: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Batch Number</label>
                  <input
                    type="text"
                    value={grnForm.batchNumber}
                    onChange={e => setGrnForm({ ...grnForm, batchNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={grnForm.expiryDate}
                    onChange={e => setGrnForm({ ...grnForm, expiryDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Received By</label>
                  <input
                    type="text"
                    value={grnForm.receivedBy}
                    onChange={e => setGrnForm({ ...grnForm, receivedBy: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                <span className="text-emerald-300 font-semibold">Total Payable Amount:</span>
                <span className="font-mono font-bold text-base text-emerald-400">
                  ৳{((Number(grnForm.receivedQty) || 0) * (Number(grnForm.unitPrice) || 0)).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsGrnModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs"
                >
                  Post GRN & Accounting JV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: STOCK TRANSFER
      ======================================================== */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5 text-indigo-400" />
                Inter-Store Stock Transfer
              </h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Source Warehouse (From) *</label>
                <select
                  value={transferForm.sourceWarehouseId}
                  onChange={e => setTransferForm({ ...transferForm, sourceWarehouseId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Destination Warehouse (To) *</label>
                <select
                  value={transferForm.destinationWarehouseId}
                  onChange={e => setTransferForm({ ...transferForm, destinationWarehouseId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  {warehouses.filter(w => w.id !== transferForm.sourceWarehouseId).map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Item to Transfer *</label>
                <select
                  value={transferForm.itemId}
                  onChange={e => setTransferForm({ ...transferForm, itemId: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="">-- Choose Item --</option>
                  {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.itemCode})</option>)}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={transferForm.quantity}
                  onChange={e => setTransferForm({ ...transferForm, quantity: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Requisition Purpose / Remarks</label>
                <input
                  type="text"
                  value={transferForm.remarks}
                  onChange={e => setTransferForm({ ...transferForm, remarks: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs"
                >
                  Dispatch & Complete Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: RECORD WASTAGE
      ======================================================== */}
      {isWastageModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-400" />
                Record Wastage & Spoilage Write-Off
              </h3>
              <button onClick={() => setIsWastageModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateWastage} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Department *</label>
                <select
                  value={wastageForm.department}
                  onChange={e => setWastageForm({ ...wastageForm, department: e.target.value as WastageEntry['department'] })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="Kitchen">Kitchen Production</option>
                  <option value="Bar">Bar & Lounge</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Banquet">Banquet & Events</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Store / Warehouse *</label>
                <select
                  value={wastageForm.warehouseId}
                  onChange={e => setWastageForm({ ...wastageForm, warehouseId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Item to Write Off *</label>
                <select
                  value={wastageForm.itemId}
                  onChange={e => setWastageForm({ ...wastageForm, itemId: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="">-- Choose Inventory Item --</option>
                  {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.itemCode})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    required
                    value={wastageForm.quantity}
                    onChange={e => setWastageForm({ ...wastageForm, quantity: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Reason Code *</label>
                  <select
                    value={wastageForm.reason}
                    onChange={e => setWastageForm({ ...wastageForm, reason: e.target.value as WastageEntry['reason'] })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Spoilage">Perishable Spoilage</option>
                    <option value="Expiry">Expired Date</option>
                    <option value="Breakage">Breakage / Damage</option>
                    <option value="Overcooked">Kitchen Overcooked</option>
                    <option value="Spill">Liquid Spill</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Justification & Notes</label>
                <input
                  type="text"
                  value={wastageForm.remarks}
                  onChange={e => setWastageForm({ ...wastageForm, remarks: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsWastageModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs"
                >
                  Approve Write-Off & Post JV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: STOCK ADJUSTMENT
      ======================================================== */}
      {isAdjustmentModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-400" />
                Manual Stock Level Adjustment
              </h3>
              <button onClick={() => setIsAdjustmentModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateAdjustment} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Warehouse / Store *</label>
                <select
                  value={adjustmentForm.warehouseId}
                  onChange={e => setAdjustmentForm({ ...adjustmentForm, warehouseId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Item to Adjust *</label>
                <select
                  value={adjustmentForm.itemId}
                  onChange={e => setAdjustmentForm({ ...adjustmentForm, itemId: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="">-- Choose Item --</option>
                  {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.itemCode})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Adjustment Type *</label>
                  <select
                    value={adjustmentForm.adjustmentType}
                    onChange={e => setAdjustmentForm({ ...adjustmentForm, adjustmentType: e.target.value as 'Increase' | 'Decrease' })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Increase">Stock Increase (+)</option>
                    <option value="Decrease">Stock Decrease (-)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Adjustment Quantity *</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    required
                    value={adjustmentForm.quantity}
                    onChange={e => setAdjustmentForm({ ...adjustmentForm, quantity: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Audit Justification Reason *</label>
                <input
                  type="text"
                  required
                  value={adjustmentForm.reason}
                  onChange={e => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs"
                >
                  Apply Stock Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ITEM DETAIL CARD & INSTANT BARCODE PRINT SLIP
      ======================================================== */}
      {selectedItemDetail && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">{selectedItemDetail.name}</h3>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                    {selectedItemDetail.itemCode}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {(() => {
                    const rawGrp = selectedItemDetail.itemGroup || inventoryMenuService.determineItemGroup(selectedItemDetail);
                    const grp = rawGrp === 'kitchen' ? 'food' : rawGrp === 'department' ? 'administrative' : rawGrp;
                    const isFood = grp === 'food';
                    const isHk = grp === 'housekeeping';
                    const isMaint = grp === 'maintenance';
                    const isIt = grp === 'it';
                    const isAdmin = grp === 'administrative';
                    const icon = isFood ? '🍳' : isHk ? '🧹' : isMaint ? '🔧' : isIt ? '💻' : isAdmin ? '📋' : '🧰';
                    const label = isFood ? 'Food & Kitchen' : isHk ? 'Housekeeping' : isMaint ? 'Maintenance' : isIt ? 'IT & Tech' : isAdmin ? 'Administrative' : 'Accessories';
                    const bgClass = isFood ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : isHk ? 'bg-teal-500/20 text-teal-300 border-teal-500/30' : isMaint ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' : isIt ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' : isAdmin ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-purple-500/20 text-purple-300 border-purple-500/30';
                    return (
                      <span className={`px-2.5 py-0.5 rounded text-xs font-bold border inline-flex items-center gap-1.5 ${bgClass}`}>
                        <span>{icon}</span>
                        <span>{label}</span>
                      </span>
                    );
                  })()}
                  <span className="text-xs text-slate-400">
                    {selectedItemDetail.categoryName} • {selectedItemDetail.itemType}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-4 h-4" />
                  <span>Instant Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedItemDetail(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Barcode & SKU Slip Preview Card */}
            <div className="bg-white text-slate-900 p-4 rounded-xl border border-slate-300 shadow-inner flex flex-col sm:flex-row items-center justify-between gap-4 print:m-0 print:border-none">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">CCULB RESORT & PMS • INVENTORY LABEL</span>
                <h4 className="text-base font-extrabold text-slate-950">{selectedItemDetail.name}</h4>
                <div className="text-xs text-slate-700 font-medium">
                  SKU: <strong className="font-mono">{selectedItemDetail.itemCode}</strong> | Store: <strong>{selectedItemDetail.storageLocation || selectedItemDetail.defaultWarehouseId}</strong>
                </div>
                <div className="text-[11px] text-slate-600">
                  UOM: <strong>{selectedItemDetail.uomCode}</strong> (1 {selectedItemDetail.uomCode} = {selectedItemDetail.conversionFactor} {selectedItemDetail.consumptionUomCode}) | Avg Cost: <strong>৳{selectedItemDetail.averageCost}</strong>
                </div>
              </div>

              {/* Barcode graphic visualization */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center shrink-0">
                <div className="font-mono text-xl tracking-[0.25em] font-black select-none text-slate-950 scale-y-150 py-1">
                  ||| | |||| | |||||| ||| |
                </div>
                <div className="font-mono text-[10px] tracking-wider text-slate-600 font-semibold mt-1">
                  *{selectedItemDetail.itemCode}*
                </div>
              </div>
            </div>

            {/* Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Current Total Stock</span>
                <span className="text-lg font-bold font-mono text-emerald-400">
                  {selectedItemDetail.currentTotalStock} {selectedItemDetail.uomCode}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  ({(selectedItemDetail.currentTotalStock * selectedItemDetail.conversionFactor).toLocaleString()} {selectedItemDetail.consumptionUomCode})
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Weighted Avg Cost</span>
                <span className="text-lg font-bold font-mono text-white">
                  ৳{selectedItemDetail.averageCost.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  per {selectedItemDetail.uomCode}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Total Stock Valuation</span>
                <span className="text-lg font-bold font-mono text-amber-400">
                  ৳{(selectedItemDetail.currentTotalValue || 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  GL Account 1300 / 1310
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Reorder Alert Level</span>
                <span className="text-sm font-bold font-mono text-slate-200">
                  {selectedItemDetail.reorderLevel} {selectedItemDetail.uomCode}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Min: {selectedItemDetail.minimumStock || 0} / Max: {selectedItemDetail.maximumStock || 500}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Default Warehouse</span>
                <span className="text-sm font-semibold text-slate-200 truncate block">
                  {selectedItemDetail.storageLocation || selectedItemDetail.defaultWarehouseId}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Designated central location
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Inventory Status</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded inline-block mt-1 ${
                  selectedItemDetail.currentTotalStock === 0
                    ? 'bg-rose-500/20 text-rose-300'
                    : selectedItemDetail.currentTotalStock <= selectedItemDetail.reorderLevel
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {selectedItemDetail.currentTotalStock === 0 ? 'Out of Stock' : selectedItemDetail.currentTotalStock <= selectedItemDetail.reorderLevel ? 'Reorder Needed' : 'Adequate Stock'}
                </span>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
              <span className="text-slate-400">
                Created: <strong className="text-slate-300 font-mono">{selectedItemDetail.createdAt || 'Active Master'}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const itmId = selectedItemDetail.id;
                    setSelectedItemDetail(null);
                    setGrnForm(prev => ({ ...prev, itemId: itmId }));
                    setIsGrnModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Receive Stock (GRN)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const itmId = selectedItemDetail.id;
                    setSelectedItemDetail(null);
                    setAdjustmentForm(prev => ({ ...prev, itemId: itmId }));
                    setIsAdjustmentModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Adjust Stock</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
