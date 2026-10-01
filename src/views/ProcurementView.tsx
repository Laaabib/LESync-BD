// CCULB PMS - Enterprise Procurement & Accounts Payable Module
// Direct integration between Requisitions, PO, GRN, Vendor Bills, AP Ledger & Accounting GL

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart, FileText, CheckCircle2, Clock, AlertTriangle, ArrowRight,
  Plus, Search, Filter, RefreshCw, Printer, Download, Eye, Building2,
  Receipt, DollarSign, CreditCard, ShieldCheck, XCircle, ArrowUpDown,
  BarChart3, PieChart, TrendingUp, AlertCircle, ChevronRight, FileCheck,
  Truck, Archive, Check, Sparkles, HelpCircle, Layers, Calendar, ChevronDown,
  Trash2
} from 'lucide-react';
import { inventoryMenuService } from '../services/inventoryMenuService';
import { pmsService } from '../services/pmsService';
import { PmsDatabaseState } from '../services/mockPmsDatabase';
import {
  PurchaseRequest, PurchaseOrder, GoodsReceiveNote, PurchaseReturn,
  PurchaseBill, SupplierPayment, Supplier, WarehouseStore, InventoryItem,
  ItemGroupType, APAgingBucket, ProcurementSpendByGLAccount, ThreeWayReconciliationItem,
  DepartmentalProcurementBudget
} from '../types/inventoryMenu';
import { determineItemGroup, DEPARTMENT_ITEM_GROUP_RULES, DepartmentItemGroupRule } from '../services/inventoryMenuService';

interface ProcurementViewProps {
  initialTab?: string;
  onNavigate?: (tab: string) => void;
}

export const ProcurementView: React.FC<ProcurementViewProps> = ({ initialTab = 'requisitions', onNavigate }) => {
  const [db, setDb] = useState<PmsDatabaseState>(pmsService.getState());
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>('all');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');

  // Modals
  const [isNewReqModalOpen, setIsNewReqModalOpen] = useState(false);
  const [isNewPoModalOpen, setIsNewPoModalOpen] = useState(false);
  const [isNewGrnModalOpen, setIsNewGrnModalOpen] = useState(false);
  const [isNewBillModalOpen, setIsNewBillModalOpen] = useState(false);
  const [isNewPaymentModalOpen, setIsNewPaymentModalOpen] = useState(false);
  const [isNewReturnModalOpen, setIsNewReturnModalOpen] = useState(false);
  const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState(false);
  const [viewSupplierLedger, setViewSupplierLedger] = useState<string | null>(null);
  const [selectedDocDetails, setSelectedDocDetails] = useState<{ type: string; data: any } | null>(null);

  // Toast feedback state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Sync state
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const unsub = pmsService.subscribe((state) => {
      setDb({ ...state });
    });
    return unsub;
  }, []);

  const suppliers = db.suppliers || [];
  const warehouses = db.warehouses || [];
  const inventoryItems = useMemo(() => {
    return inventoryMenuService.getInventoryItems();
  }, [db.inventoryItems]);
  const glAccounts = db.glAccounts || [];
  const requisitions = db.purchaseRequests || [];
  const purchaseOrders = db.purchaseOrders || [];
  const grns = db.goodsReceiveNotes || [];
  const bills = db.purchaseBills || [];
  const payments = db.supplierPayments || [];
  const returns = db.purchaseReturns || [];

  // Summary Metrics
  const totalOpenReqs = requisitions.filter(r => r.status === 'Submitted' || r.status === 'Under Review').length;
  const totalPendingPOs = purchaseOrders.filter(p => p.status === 'Draft' || p.status === 'Submitted').length;
  const totalUnpaidBills = bills.filter(b => b.status !== 'Paid' && b.status !== 'Void');
  const totalPayableOutstanding = totalUnpaidBills.reduce((sum, b) => sum + (b.dueAmount || b.totalAmount), 0);
  const totalProcurementMTD = bills.reduce((sum, b) => sum + b.totalAmount, 0) + grns.reduce((sum, g) => sum + g.totalAcceptedAmount, 0);

  // Report Data
  const glSpendReport = useMemo(() => inventoryMenuService.getProcurementSpendByGLReport(), [db]);
  const apAgingReport = useMemo(() => inventoryMenuService.getAPAgingReport(), [db]);
  const threeWayReport = useMemo(() => inventoryMenuService.getThreeWayReconciliationReport(), [db]);
  const budgetReport = useMemo(() => inventoryMenuService.getDepartmentalProcurementBudgetReport(), [db]);

  // Handle Tab Switch
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (onNavigate) onNavigate(tabId);
  };

  // 1. Requisition Form State
  const [reqForm, setReqForm] = useState({
    department: 'Main Kitchen F&B',
    warehouseId: 'wh-kitchen',
    requiredDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    priority: 'Normal' as 'Low' | 'Normal' | 'High' | 'Emergency',
    requestedBy: 'Md. Rafiqul Islam (Sous Chef)',
    remarks: 'Routine restocking for upcoming banquet',
    items: [
      { itemId: 'item-101', itemCode: 'ING-RICE-01', itemName: 'Premium Shahi Basmati Rice', requestedQuantity: 50, approvedQuantity: 50, uom: 'kg', estimatedUnitCost: 140, estimatedTotal: 7000, currentStock: 80, notes: '' }
    ]
  });

  // Requisition Typeahead Search & Item Group State
  const [reqItemSearchQuery, setReqItemSearchQuery] = useState('');
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
  const [reqSelectedItemGroup, setReqSelectedItemGroup] = useState<'all' | ItemGroupType>('all');

  const currentDeptRule = useMemo(() => {
    return inventoryMenuService.getDepartmentRule(reqForm.department);
  }, [reqForm.department]);

  // Sync selected group with department routing rule
  useEffect(() => {
    if (currentDeptRule && currentDeptRule.defaultGroup) {
      setReqSelectedItemGroup(currentDeptRule.defaultGroup);
    }
  }, [reqForm.department, currentDeptRule]);

  const currentSelectedItem = useMemo(() => {
    if (!reqForm.items || reqForm.items.length === 0) return null;
    const itId = reqForm.items[0].itemId;
    return inventoryItems.find(i => i.id === itId) || null;
  }, [reqForm.items, inventoryItems]);

  const filteredReqItems = useMemo(() => {
    const q = reqItemSearchQuery.trim().toLowerCase();
    return inventoryItems.filter(item => {
      const grp = item.itemGroup || determineItemGroup(item);
      const normalizedGrp = grp === 'kitchen' ? 'food' : grp;
      const normalizedReqGrp = reqSelectedItemGroup === 'kitchen' ? 'food' : reqSelectedItemGroup;
      const matchesGroup = normalizedReqGrp === 'all' || normalizedGrp === normalizedReqGrp;
      const matchesSearch = !q ||
        item.name.toLowerCase().includes(q) ||
        item.itemCode.toLowerCase().includes(q) ||
        (item.categoryName && item.categoryName.toLowerCase().includes(q)) ||
        (item.subcategory && item.subcategory.toLowerCase().includes(q));
      return matchesGroup && matchesSearch;
    });
  }, [inventoryItems, reqSelectedItemGroup, reqItemSearchQuery]);

  const groupCounts = useMemo(() => {
    const q = reqItemSearchQuery.trim().toLowerCase();
    const base = inventoryItems.filter(i => {
      if (!q) return true;
      return i.name.toLowerCase().includes(q) ||
        i.itemCode.toLowerCase().includes(q) ||
        (i.categoryName && i.categoryName.toLowerCase().includes(q));
    });
    return {
      all: base.length,
      food: base.filter(i => {
        const g = i.itemGroup || determineItemGroup(i);
        return g === 'food' || g === 'kitchen';
      }).length,
      housekeeping: base.filter(i => (i.itemGroup || determineItemGroup(i)) === 'housekeeping').length,
      maintenance: base.filter(i => (i.itemGroup || determineItemGroup(i)) === 'maintenance').length,
      it: base.filter(i => (i.itemGroup || determineItemGroup(i)) === 'it').length,
      administrative: base.filter(i => (i.itemGroup || determineItemGroup(i)) === 'administrative').length,
      accessories: base.filter(i => (i.itemGroup || determineItemGroup(i)) === 'accessories').length
    };
  }, [inventoryItems, reqItemSearchQuery]);

  const handleSelectItemForReq = (item: InventoryItem) => {
    const currentQty = reqForm.items[0]?.requestedQuantity || 20;
    setReqForm(prev => ({
      ...prev,
      items: [
        {
          itemId: item.id,
          itemCode: item.itemCode,
          itemName: item.name,
          requestedQuantity: currentQty,
          approvedQuantity: currentQty,
          uom: item.uomCode,
          estimatedUnitCost: item.averageCost,
          estimatedTotal: currentQty * item.averageCost,
          currentStock: item.currentTotalStock,
          notes: ''
        }
      ]
    }));
    setReqItemSearchQuery('');
    setIsItemDropdownOpen(false);
  };

  // 2. Purchase Order Form State
  const [poForm, setPoForm] = useState({
    requisitionId: '',
    supplierId: 'sup-1',
    warehouseId: 'wh-kitchen',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    paymentTerms: 'Net 30',
    preparedBy: 'Abdul Karim (Store Keeper)',
    notes: 'Urgent weekend delivery. Quality inspection certificate required.',
    items: [
      { itemId: 'item-101', itemCode: 'ING-RICE-01', itemName: 'Premium Shahi Basmati Rice', quantity: 50, receivedQuantity: 0, pendingQuantity: 50, uom: 'kg', unitPrice: 140, taxPercent: 0, total: 7000 },
      { itemId: 'item-102', itemCode: 'ING-CHIK-01', itemName: 'Farm Fresh Chicken (Bone-In / Boneless)', quantity: 30, receivedQuantity: 0, pendingQuantity: 30, uom: 'kg', unitPrice: 280, taxPercent: 0, total: 8400 }
    ]
  });

  // 3. Goods Receive Note (GRN) Form State
  const [grnForm, setGrnForm] = useState({
    poId: '',
    supplierId: 'sup-1',
    warehouseId: 'wh-kitchen',
    challanNumber: `CH-${Date.now().toString().slice(-6)}`,
    challanDate: new Date().toISOString().split('T')[0],
    receiveDate: new Date().toISOString().split('T')[0],
    inspectionPassed: true,
    inspectedBy: 'Shafiqul Alam (Quality Inspector)',
    receivedBy: 'Abdul Karim (Store Keeper)',
    notes: 'Packaging intact, temperature verified satisfactory.',
    items: [
      {
        itemId: 'item-101',
        itemCode: 'ING-RICE-01',
        itemName: 'Premium Shahi Basmati Rice',
        poQuantity: 50,
        receivedQuantity: 50,
        acceptedQuantity: 50,
        rejectedQuantity: 0,
        uom: 'kg',
        unitPrice: 140,
        totalPrice: 7000,
        batchNumber: `BAT-${new Date().getFullYear()}-01`,
        expiryDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
        rejectionReason: ''
      }
    ]
  });

  // 4. Vendor Bill Form State
  const [billForm, setBillForm] = useState({
    supplierInvoiceNumber: '',
    supplierId: 'sup-1',
    poId: '',
    grnId: '',
    billDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    paymentTerms: 'Net 30',
    glDebitAccountCode: '5020',
    glDebitAccountName: 'F&B Kitchen Raw Materials & Consumables',
    glCreditAccountCode: '2050',
    glCreditAccountName: 'Accounts Payable / Trade Creditors',
    subtotal: 15400,
    taxAmount: 0,
    discountAmount: 0,
    notes: 'Invoice verified against delivery challan and PO terms.',
    createdBy: 'Arif Chowdhury (Accounts)',
    items: [] as any[]
  });

  // 5. Supplier Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    supplierId: 'sup-1',
    billId: '',
    amount: 15400,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer' as 'Cash' | 'Bank Transfer' | 'Cheque' | 'bKash' | 'Nagad' | 'Online / Card',
    referenceNumber: `EBL-${Date.now().toString().slice(-6)}`,
    glDebitAccountCode: '2050',
    glDebitAccountName: 'Accounts Payable / Trade Creditors',
    glCreditAccountCode: '1010',
    glCreditAccountName: 'Eastern Bank Ltd (EBL) Operating A/C',
    notes: 'Full invoice settlement via online corporate banking',
    paidBy: 'Arif Chowdhury (Accounts)'
  });

  // 6. Purchase Return Form State
  const [returnForm, setReturnForm] = useState({
    supplierId: 'sup-1',
    warehouseId: 'wh-kitchen',
    grnId: '',
    returnDate: new Date().toISOString().split('T')[0],
    reason: 'Damaged Goods / Packaging Defect',
    returnedBy: 'Abdul Karim (Store Keeper)',
    approvedBy: 'Farhana Sultana (GM)',
    items: [
      {
        itemId: 'item-101',
        itemCode: 'ING-RICE-01',
        itemName: 'Premium Shahi Basmati Rice',
        quantity: 5,
        uom: 'kg',
        unitPrice: 140,
        totalAmount: 700,
        reason: 'Packaging torn during delivery transport'
      }
    ]
  });

  // 7. Supplier Form State
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    code: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    taxNumber: '',
    paymentTerms: 'Net 30',
    creditLimit: 200000,
    categoriesSupplied: ['Food & Raw Ingredients']
  });

  // Helper: Pre-fill PO from Requisition
  const handleSelectReqForPo = (reqId: string) => {
    if (!reqId) {
      setPoForm(prev => ({ ...prev, requisitionId: '' }));
      return;
    }
    const req = requisitions.find(r => r.id === reqId);
    if (req) {
      setPoForm(prev => ({
        ...prev,
        requisitionId: req.id,
        warehouseId: req.warehouseId || prev.warehouseId,
        items: req.items.map(item => ({
          itemId: item.itemId,
          itemCode: item.itemCode,
          itemName: item.itemName,
          quantity: item.requestedQuantity,
          receivedQuantity: 0,
          pendingQuantity: item.requestedQuantity,
          uom: item.uom,
          unitPrice: item.estimatedUnitCost,
          taxPercent: 0,
          total: item.requestedQuantity * item.estimatedUnitCost
        }))
      }));
    }
  };

  // Helper: Pre-fill GRN from PO
  const handleSelectPoForGrn = (poId: string) => {
    if (!poId) {
      setGrnForm(prev => ({ ...prev, poId: '' }));
      return;
    }
    const po = purchaseOrders.find(p => p.id === poId);
    if (po) {
      setGrnForm(prev => ({
        ...prev,
        poId: po.id,
        supplierId: po.supplierId,
        warehouseId: po.warehouseId,
        items: po.items.map(item => {
          const remaining = Math.max(0, item.quantity - (item.receivedQuantity || 0));
          return {
            itemId: item.itemId,
            itemCode: item.itemCode,
            itemName: item.itemName,
            poQuantity: item.quantity,
            receivedQuantity: remaining,
            acceptedQuantity: remaining,
            rejectedQuantity: 0,
            uom: item.uom,
            unitPrice: item.unitPrice,
            totalPrice: remaining * item.unitPrice,
            batchNumber: `BAT-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
            expiryDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
            rejectionReason: ''
          };
        })
      }));
    }
  };

  // Helper: Pre-fill Bill from PO or GRN
  const handleSelectPoForBill = (poId: string) => {
    if (!poId) {
      setBillForm(prev => ({ ...prev, poId: '' }));
      return;
    }
    const po = purchaseOrders.find(p => p.id === poId);
    if (po) {
      setBillForm(prev => ({
        ...prev,
        poId: po.id,
        supplierId: po.supplierId,
        subtotal: po.grandTotal,
        paymentTerms: po.paymentTerms,
        notes: `Billed for Purchase Order ${po.poNumber}`
      }));
    }
  };

  // Helper: Pre-fill Payment from Bill
  const handleSelectBillForPayment = (billId: string) => {
    if (!billId) {
      setPaymentForm(prev => ({ ...prev, billId: '' }));
      return;
    }
    const bill = bills.find(b => b.id === billId);
    if (bill) {
      setPaymentForm(prev => ({
        ...prev,
        billId: bill.id,
        supplierId: bill.supplierId,
        amount: bill.dueAmount || bill.totalAmount,
        notes: `Settlement for Bill ${bill.billNumber} (Inv #${bill.supplierInvoiceNumber})`
      }));
    }
  };

  // PO Line Items Helpers
  const updatePoItem = (index: number, field: string, value: any) => {
    setPoForm(prev => {
      const updated = [...prev.items];
      const current = { ...updated[index], [field]: value };
      if (field === 'quantity' || field === 'unitPrice' || field === 'taxPercent') {
        const q = field === 'quantity' ? Math.max(1, Number(value) || 0) : current.quantity;
        const p = field === 'unitPrice' ? Math.max(0, Number(value) || 0) : current.unitPrice;
        current.total = q * p;
        current.quantity = q;
        current.unitPrice = p;
        current.pendingQuantity = q;
      }
      updated[index] = current;
      return { ...prev, items: updated };
    });
  };

  const selectPoCatalogItem = (index: number, itemId: string) => {
    const item = inventoryItems.find(i => i.id === itemId);
    if (!item) return;
    setPoForm(prev => {
      const updated = [...prev.items];
      const price = item.averageCost || item.lastPurchaseCost || 100;
      const qty = updated[index]?.quantity || 10;
      updated[index] = {
        ...updated[index],
        itemId: item.id,
        itemCode: item.itemCode,
        itemName: item.name,
        uom: item.uomCode,
        unitPrice: price,
        total: qty * price,
        pendingQuantity: qty
      };
      return { ...prev, items: updated };
    });
  };

  const addPoItem = () => {
    const first = inventoryItems[0];
    const price = first?.averageCost || 100;
    setPoForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          itemId: first?.id || 'item-101',
          itemCode: first?.itemCode || 'ING-01',
          itemName: first?.name || 'New Procurement Item',
          quantity: 10,
          receivedQuantity: 0,
          pendingQuantity: 10,
          uom: first?.uomCode || 'kg',
          unitPrice: price,
          taxPercent: 0,
          total: 10 * price
        }
      ]
    }));
  };

  const removePoItem = (index: number) => {
    if (poForm.items.length <= 1) {
      showToast('A Purchase Order requires at least one line item.', 'info');
      return;
    }
    setPoForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // GRN Line Items Helpers
  const updateGrnItem = (index: number, field: string, value: any) => {
    setGrnForm(prev => {
      const updated = [...prev.items];
      const current = { ...updated[index], [field]: value };
      if (field === 'acceptedQuantity' || field === 'unitPrice') {
        const acc = field === 'acceptedQuantity' ? Math.max(0, Number(value) || 0) : current.acceptedQuantity;
        const p = field === 'unitPrice' ? Math.max(0, Number(value) || 0) : current.unitPrice;
        current.totalPrice = acc * p;
        current.acceptedQuantity = acc;
        current.unitPrice = p;
      }
      if (field === 'receivedQuantity') {
        const rec = Math.max(0, Number(value) || 0);
        current.receivedQuantity = rec;
        current.acceptedQuantity = Math.max(0, rec - (current.rejectedQuantity || 0));
        current.totalPrice = current.acceptedQuantity * current.unitPrice;
      }
      if (field === 'rejectedQuantity') {
        const rej = Math.max(0, Number(value) || 0);
        current.rejectedQuantity = rej;
        current.acceptedQuantity = Math.max(0, current.receivedQuantity - rej);
        current.totalPrice = current.acceptedQuantity * current.unitPrice;
      }
      updated[index] = current;
      return { ...prev, items: updated };
    });
  };

  const selectGrnCatalogItem = (index: number, itemId: string) => {
    const item = inventoryItems.find(i => i.id === itemId);
    if (!item) return;
    setGrnForm(prev => {
      const updated = [...prev.items];
      const price = item.averageCost || item.lastPurchaseCost || 100;
      const qty = updated[index]?.receivedQuantity || 10;
      updated[index] = {
        ...updated[index],
        itemId: item.id,
        itemCode: item.itemCode,
        itemName: item.name,
        uom: item.uomCode,
        unitPrice: price,
        totalPrice: qty * price
      };
      return { ...prev, items: updated };
    });
  };

  const addGrnItem = () => {
    const first = inventoryItems[0];
    const price = first?.averageCost || 100;
    setGrnForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          itemId: first?.id || 'item-101',
          itemCode: first?.itemCode || 'ING-01',
          itemName: first?.name || 'New Item to Receive',
          poQuantity: 10,
          receivedQuantity: 10,
          acceptedQuantity: 10,
          rejectedQuantity: 0,
          uom: first?.uomCode || 'kg',
          unitPrice: price,
          totalPrice: 10 * price,
          batchNumber: `BAT-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
          expiryDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
          rejectionReason: ''
        }
      ]
    }));
  };

  const removeGrnItem = (index: number) => {
    if (grnForm.items.length <= 1) {
      showToast('GRN requires at least one item line.', 'info');
      return;
    }
    setGrnForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Return Line Items Helpers
  const updateReturnItem = (index: number, field: string, value: any) => {
    setReturnForm(prev => {
      const updated = [...prev.items];
      const current = { ...updated[index], [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        const q = field === 'quantity' ? Math.max(1, Number(value) || 0) : current.quantity;
        const p = field === 'unitPrice' ? Math.max(0, Number(value) || 0) : current.unitPrice;
        current.totalAmount = q * p;
        current.quantity = q;
        current.unitPrice = p;
      }
      updated[index] = current;
      return { ...prev, items: updated };
    });
  };

  const selectReturnCatalogItem = (index: number, itemId: string) => {
    const item = inventoryItems.find(i => i.id === itemId);
    if (!item) return;
    setReturnForm(prev => {
      const updated = [...prev.items];
      const price = item.averageCost || 100;
      const qty = updated[index]?.quantity || 1;
      updated[index] = {
        ...updated[index],
        itemId: item.id,
        itemCode: item.itemCode,
        itemName: item.name,
        uom: item.uomCode,
        unitPrice: price,
        totalAmount: qty * price
      };
      return { ...prev, items: updated };
    });
  };

  const addReturnItem = () => {
    const first = inventoryItems[0];
    const price = first?.averageCost || 100;
    setReturnForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          itemId: first?.id || 'item-101',
          itemCode: first?.itemCode || 'ING-01',
          itemName: first?.name || 'Return Item',
          quantity: 1,
          uom: first?.uomCode || 'kg',
          unitPrice: price,
          totalAmount: price,
          reason: 'Damaged / Defect'
        }
      ]
    }));
  };

  const removeReturnItem = (index: number) => {
    if (returnForm.items.length <= 1) {
      showToast('Purchase Return requires at least one item.', 'info');
      return;
    }
    setReturnForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Submit Handlers
  const handleCreateRequisition = (e: React.FormEvent, shouldPrint: boolean = false) => {
    e.preventDefault();
    if (!reqForm.items || reqForm.items.length === 0 || !reqForm.items[0].itemId) {
      showToast('Please select an item to request.', 'error');
      return;
    }
    const wh = warehouses.find(w => w.id === reqForm.warehouseId);
    const totalEst = reqForm.items.reduce((s, i) => s + (i.requestedQuantity * i.estimatedUnitCost), 0);

    const newReq = inventoryMenuService.createPurchaseRequest({
      department: reqForm.department,
      warehouseId: reqForm.warehouseId,
      warehouseName: wh ? wh.name : 'Central Store',
      requestDate: new Date().toISOString().split('T')[0],
      requiredDate: reqForm.requiredDate,
      priority: (reqForm.priority === 'Emergency' ? 'Urgent' : reqForm.priority === 'Normal' ? 'Medium' : reqForm.priority) as any,
      items: reqForm.items.map(i => ({
        ...i,
        approvedQuantity: i.requestedQuantity,
        estimatedTotal: i.requestedQuantity * i.estimatedUnitCost
      })),
      totalEstimatedAmount: totalEst,
      status: 'Submitted',
      requestedBy: reqForm.requestedBy,
      remarks: reqForm.remarks
    });

    setIsNewReqModalOpen(false);
    if (shouldPrint) {
      showToast(`Purchase Requisition ${newReq.requestNumber} created. Opening voucher for instant print...`, 'success');
      setSelectedDocDetails({ type: 'Purchase Requisition', data: newReq });
    } else {
      showToast(`Purchase Requisition ${newReq.requestNumber} created successfully.`, 'success');
    }
  };

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poForm.items || poForm.items.length === 0) {
      showToast('Please add at least one line item to the Purchase Order.', 'error');
      return;
    }
    const sup = suppliers.find(s => s.id === poForm.supplierId);
    const wh = warehouses.find(w => w.id === poForm.warehouseId);
    const subtotal = poForm.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
    const taxAmount = poForm.items.reduce((s, i) => s + (i.quantity * i.unitPrice * (i.taxPercent || 0) / 100), 0);
    const grandTotal = subtotal + taxAmount;

    const req = poForm.requisitionId ? requisitions.find(r => r.id === poForm.requisitionId) : undefined;

    const newPo = inventoryMenuService.createPurchaseOrder({
      requisitionId: poForm.requisitionId || undefined,
      requisitionNumber: req ? req.requestNumber : undefined,
      supplierId: poForm.supplierId,
      supplierName: sup ? sup.name : 'Selected Supplier',
      warehouseId: poForm.warehouseId,
      warehouseName: wh ? wh.name : 'Central Store',
      orderDate: poForm.orderDate || new Date().toISOString().split('T')[0],
      expectedDeliveryDate: poForm.expectedDeliveryDate,
      paymentTerms: poForm.paymentTerms,
      items: poForm.items.map(i => ({
        ...i,
        total: i.quantity * i.unitPrice
      })),
      subtotal,
      taxAmount,
      grandTotal,
      status: 'Issued to Supplier',
      receivedTotalValue: 0,
      preparedBy: poForm.preparedBy,
      notes: poForm.notes
    });

    setIsNewPoModalOpen(false);
    showToast(`Purchase Order ${newPo.poNumber} issued to ${sup?.name || 'supplier'} (৳${grandTotal.toLocaleString()}).`, 'success');
  };

  const handleCreateGRN = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grnForm.items || grnForm.items.length === 0) {
      showToast('Please add at least one item to receive.', 'error');
      return;
    }
    const sup = suppliers.find(s => s.id === grnForm.supplierId);
    const wh = warehouses.find(w => w.id === grnForm.warehouseId);
    const po = grnForm.poId ? purchaseOrders.find(p => p.id === grnForm.poId) : undefined;
    const totalAccepted = grnForm.items.reduce((sum, item) => sum + (item.acceptedQuantity * item.unitPrice), 0);

    const newGrn = inventoryMenuService.createGoodsReceiveNote({
      poId: grnForm.poId || undefined,
      poNumber: po ? po.poNumber : undefined,
      supplierId: grnForm.supplierId,
      supplierName: sup ? sup.name : 'Selected Supplier',
      warehouseId: grnForm.warehouseId,
      warehouseName: wh ? wh.name : 'Central Store',
      receiveDate: grnForm.receiveDate,
      challanNumber: grnForm.challanNumber || `CH-${Date.now().toString().slice(-6)}`,
      challanDate: grnForm.challanDate,
      items: grnForm.items.map(item => ({
        ...item,
        totalPrice: item.acceptedQuantity * item.unitPrice
      })),
      totalAcceptedAmount: totalAccepted,
      inspectionPassed: grnForm.inspectionPassed,
      inspectedBy: grnForm.inspectedBy,
      receivedBy: grnForm.receivedBy,
      status: 'Approved & Added to Stock'
    });

    setIsNewGrnModalOpen(false);
    showToast(`GRN ${newGrn.grnNumber} posted! Stock updated and JV generated (৳${totalAccepted.toLocaleString()}).`, 'success');
  };

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.id === billForm.supplierId);
    const drGl = glAccounts.find(g => g.code === billForm.glDebitAccountCode);
    const subtotal = Number(billForm.subtotal) || 0;
    const tax = Number(billForm.taxAmount) || 0;
    const discount = Number(billForm.discountAmount) || 0;
    const total = subtotal + tax - discount;

    const newBill = inventoryMenuService.createPurchaseBill({
      supplierInvoiceNumber: billForm.supplierInvoiceNumber || `INV-${Date.now().toString().slice(-5)}`,
      supplierId: billForm.supplierId,
      supplierName: sup ? sup.name : 'Selected Supplier',
      poId: billForm.poId || undefined,
      poNumber: billForm.poId ? purchaseOrders.find(p => p.id === billForm.poId)?.poNumber : undefined,
      grnId: billForm.grnId || undefined,
      grnNumber: billForm.grnId ? grns.find(g => g.id === billForm.grnId)?.grnNumber : undefined,
      billDate: billForm.billDate,
      dueDate: billForm.dueDate,
      subtotal,
      taxAmount: tax,
      discountAmount: discount,
      totalAmount: total,
      status: 'Approved',
      paymentTerms: billForm.paymentTerms,
      glDebitAccountCode: billForm.glDebitAccountCode,
      glDebitAccountName: drGl ? drGl.name : billForm.glDebitAccountName,
      glCreditAccountCode: '2050',
      glCreditAccountName: 'Accounts Payable / Trade Creditors',
      items: billForm.items && billForm.items.length > 0 ? billForm.items : [
        {
          itemId: 'item-gen',
          itemCode: 'GEN-SUP',
          itemName: 'Procured Materials & Supplies Batch',
          quantity: 1,
          uom: 'lot',
          unitPrice: subtotal,
          totalPrice: subtotal,
          glAccountCode: billForm.glDebitAccountCode,
          glAccountName: drGl?.name
        }
      ],
      notes: billForm.notes,
      createdBy: billForm.createdBy
    });

    setIsNewBillModalOpen(false);
    showToast(`Vendor Bill ${newBill.billNumber} posted. AP Ledger debited/credited (৳${total.toLocaleString()}).`, 'success');
  };

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.id === paymentForm.supplierId);
    const crGl = glAccounts.find(g => g.code === paymentForm.glCreditAccountCode);
    const amount = Number(paymentForm.amount) || 0;

    const newPayment = inventoryMenuService.createSupplierPayment({
      supplierId: paymentForm.supplierId,
      supplierName: sup ? sup.name : 'Selected Supplier',
      billId: paymentForm.billId || undefined,
      billNumber: paymentForm.billId ? bills.find(b => b.id === paymentForm.billId)?.billNumber : undefined,
      amount,
      paymentDate: paymentForm.paymentDate,
      paymentMethod: paymentForm.paymentMethod,
      referenceNumber: paymentForm.referenceNumber || `TXN-${Date.now().toString().slice(-6)}`,
      glDebitAccountCode: '2050',
      glDebitAccountName: 'Accounts Payable / Trade Creditors',
      glCreditAccountCode: paymentForm.glCreditAccountCode,
      glCreditAccountName: crGl ? crGl.name : 'Cash in Vault & Commercial Bank Accounts',
      notes: paymentForm.notes,
      paidBy: paymentForm.paidBy
    });

    setIsNewPaymentModalOpen(false);
    showToast(`Payment ${newPayment.paymentNumber} of ৳${amount.toLocaleString()} disbursed to ${sup?.name || 'supplier'}.`, 'success');
  };

  const handleCreateReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnForm.items || returnForm.items.length === 0) {
      showToast('Please add at least one line item to return.', 'error');
      return;
    }
    const sup = suppliers.find(s => s.id === returnForm.supplierId);
    const wh = warehouses.find(w => w.id === returnForm.warehouseId);
    const totalAmount = returnForm.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    const newReturn = inventoryMenuService.createPurchaseReturn({
      supplierId: returnForm.supplierId,
      supplierName: sup ? sup.name : 'Selected Supplier',
      warehouseId: returnForm.warehouseId,
      warehouseName: wh ? wh.name : 'Central Store',
      grnId: returnForm.grnId || undefined,
      grnNumber: returnForm.grnId ? grns.find(g => g.id === returnForm.grnId)?.grnNumber : undefined,
      returnDate: returnForm.returnDate,
      reason: returnForm.reason,
      returnedBy: returnForm.returnedBy,
      approvedBy: returnForm.approvedBy,
      items: returnForm.items.map(item => ({
        ...item,
        totalAmount: item.quantity * item.unitPrice
      })),
      totalAmount,
      status: 'Completed'
    });

    setIsNewReturnModalOpen(false);
    showToast(`Purchase Return ${newReturn.returnNumber} issued. Debit note posted (৳${totalAmount.toLocaleString()}).`, 'success');
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    const code = supplierForm.code || `SUP-${(suppliers.length + 1).toString().padStart(3, '0')}`;
    const newSup = inventoryMenuService.addSupplier({
      name: supplierForm.name,
      code,
      contactPerson: supplierForm.contactPerson,
      phone: supplierForm.phone,
      email: supplierForm.email,
      address: supplierForm.address,
      taxNumber: supplierForm.taxNumber,
      paymentTerms: supplierForm.paymentTerms as any,
      creditLimit: Number(supplierForm.creditLimit) || 0,
      categoriesSupplied: supplierForm.categoriesSupplied,
      active: true
    });
    setIsNewSupplierModalOpen(false);
    showToast(`Supplier "${newSup.name}" (${newSup.code}) registered successfully.`, 'success');
  };

  return (
    <div className="flex-1 bg-slate-50 min-h-full">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-6 py-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                <ShoppingCart className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Procurement & Accounts Payable</h1>
                <p className="text-xs text-slate-500 font-medium">Requisitions, Purchase Orders, GRN, Vendor Invoices & GL Account Ledgers</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsNewReqModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Requisition
            </button>
            <button
              onClick={() => setIsNewPoModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors shadow-sm"
            >
              <FileText className="w-4 h-4" /> New Purchase Order
            </button>
            <button
              onClick={() => setIsNewBillModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
            >
              <Receipt className="w-4 h-4" /> Post Vendor Bill
            </button>
            <button
              onClick={() => setIsNewPaymentModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
            >
              <DollarSign className="w-4 h-4" /> Record Payment
            </button>
          </div>
        </div>

        {/* Executive Stat Strips */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-100">
          <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Open Requisitions</span>
              <div className="text-lg font-bold text-slate-900 mt-0.5">{totalOpenReqs} Pending</div>
            </div>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-md">
              <Clock className="w-4 h-4" />
            </span>
          </div>

          <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active PO Orders</span>
              <div className="text-lg font-bold text-indigo-700 mt-0.5">{purchaseOrders.length} Orders</div>
            </div>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-md">
              <FileText className="w-4 h-4" />
            </span>
          </div>

          <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Accounts Payable (AP)</span>
              <div className="text-lg font-bold text-rose-600 mt-0.5">৳ {(totalPayableOutstanding || 0).toLocaleString()}</div>
            </div>
            <span className="p-2 bg-rose-50 text-rose-600 rounded-md">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>

          <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Procurement Spend (MTD)</span>
              <div className="text-lg font-bold text-emerald-700 mt-0.5">৳ {(totalProcurementMTD || 0).toLocaleString()}</div>
            </div>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-md">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
        </div>

        {/* Navigation Submenu Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto mt-4 pt-1 border-t border-slate-100 scrollbar-none">
          {[
            { id: 'requisitions', label: 'Purchase Requisitions', icon: Clock, count: totalOpenReqs },
            { id: 'purchase-orders', label: 'Purchase Orders', icon: FileText, count: purchaseOrders.length },
            { id: 'grn', label: 'Goods Received (GRN)', icon: Truck, count: grns.length },
            { id: 'bills', label: 'Vendor Bills & Invoices', icon: Receipt, count: bills.length },
            { id: 'payments', label: 'Supplier Payments', icon: DollarSign, count: payments.length },
            { id: 'returns', label: 'Purchase Returns / Debit Notes', icon: ArrowUpDown, count: returns.length },
            { id: 'suppliers', label: 'Vendors & Suppliers', icon: Building2, count: suppliers.length },
            { id: 'approvals', label: 'Approval Pipeline', icon: ShieldCheck, count: totalOpenReqs + totalPendingPOs },
            { id: 'reports', label: 'Procurement & GL Reports', icon: BarChart3 }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                    isActive ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="w-full max-w-full px-2 sm:px-4 py-4 space-y-4">

        {/* 1. REQUISITIONS VIEW */}
        {activeTab === 'requisitions' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search requisitions by number, department, requester..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none"
                >
                  <option value="all">All Departments</option>
                  <option value="Kitchen">Main Kitchen F&B</option>
                  <option value="Bar">Bar & Lounge</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Maintenance">Engineering & Maintenance</option>
                </select>

                <button
                  onClick={() => setIsNewReqModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Requisition
                </button>
              </div>
            </div>

            {/* Requisitions List Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Requisition #</th>
                    <th className="px-4 py-3">Department & Store</th>
                    <th className="px-4 py-3">Requested By</th>
                    <th className="px-4 py-3">Items Requested</th>
                    <th className="px-4 py-3">Est. Amount</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {requisitions
                    .filter(r => {
                      const matchesSearch = r.requestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        r.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        r.requestedBy.toLowerCase().includes(searchQuery.toLowerCase());
                      const matchesDept = selectedDeptFilter === 'all' || r.department.toLowerCase().includes(selectedDeptFilter.toLowerCase());
                      return matchesSearch && matchesDept;
                    })
                    .map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{req.requestNumber}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-normal">{req.requestDate}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-900">{req.department}</div>
                          <div className="text-[10px] text-slate-500">{req.warehouseName}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{req.requestedBy}</td>
                        <td className="px-4 py-3 text-slate-600">
                          <span className="font-semibold text-slate-900">{req.items.length} items</span> ({req.items.map(i => i.itemName).slice(0, 2).join(', ')}{req.items.length > 2 ? '...' : ''})
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">৳ {(req.totalEstimatedAmount || 0).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            req.priority === 'Urgent' || (req.priority as any) === 'Emergency' ? 'bg-rose-100 text-rose-700' :
                            req.priority === 'High' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {req.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === 'PO Generated' ? 'bg-indigo-100 text-indigo-700' :
                            req.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                            req.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-1">
                          {req.status === 'Submitted' && (
                            <button
                              onClick={() => inventoryMenuService.updatePurchaseRequestStatus(req.id, 'Approved', 'Farhana Sultana (GM)')}
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-semibold rounded"
                            >
                              Approve
                            </button>
                          )}
                          {req.status === 'Approved' && (
                            <button
                              onClick={() => {
                                setPoForm(prev => ({
                                  ...prev,
                                  items: req.items.map(i => ({
                                    itemId: i.itemId,
                                    itemCode: i.itemCode,
                                    itemName: i.itemName,
                                    quantity: i.requestedQuantity,
                                    receivedQuantity: 0,
                                    pendingQuantity: i.requestedQuantity,
                                    uom: i.uom,
                                    unitPrice: i.estimatedUnitCost,
                                    taxPercent: 0,
                                    total: i.requestedQuantity * i.estimatedUnitCost
                                  }))
                                }));
                                setIsNewPoModalOpen(true);
                              }}
                              className="px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[11px] font-semibold rounded"
                            >
                              Generate PO
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedDocDetails({ type: 'Purchase Requisition', data: req })}
                            title="Instant Print Requisition Slip"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedDocDetails({ type: 'Purchase Requisition', data: req })}
                            title="View Requisition Voucher"
                            className="p-1 text-slate-400 hover:text-slate-700"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. PURCHASE ORDERS VIEW */}
        {activeTab === 'purchase-orders' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search PO by number, vendor, item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedSupplierFilter}
                  onChange={(e) => setSelectedSupplierFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none"
                >
                  <option value="all">All Suppliers</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>

                <button
                  onClick={() => setIsNewPoModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Purchase Order
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">PO Number</th>
                    <th className="px-4 py-3">Vendor / Supplier</th>
                    <th className="px-4 py-3">Destination Warehouse</th>
                    <th className="px-4 py-3">Order Date</th>
                    <th className="px-4 py-3">Total Amount</th>
                    <th className="px-4 py-3">Received Value</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {purchaseOrders
                    .filter(po => {
                      const matchesSearch = po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        po.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
                      const matchesSup = selectedSupplierFilter === 'all' || po.supplierId === selectedSupplierFilter;
                      return matchesSearch && matchesSup;
                    })
                    .map((po) => (
                      <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{po.poNumber}</span>
                          </div>
                          {po.requisitionNumber && (
                            <span className="text-[10px] text-slate-400 font-normal">Ref: {po.requisitionNumber}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{po.supplierName}</td>
                        <td className="px-4 py-3 text-slate-600">{po.warehouseName}</td>
                        <td className="px-4 py-3 text-slate-700">{po.orderDate}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">৳ {(po.grandTotal || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 font-bold text-emerald-600">
                          ৳ {(po.receivedTotalValue || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            po.status === 'Fully Received' ? 'bg-emerald-100 text-emerald-700' :
                            po.status === 'Partially Received' ? 'bg-indigo-100 text-indigo-700' :
                            po.status === 'Approved' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {po.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-1">
                          {po.status !== 'Fully Received' && (
                            <button
                              onClick={() => {
                                // Trigger GRN modal with this PO data
                                setIsNewGrnModalOpen(true);
                              }}
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-semibold rounded"
                            >
                              Receive GRN
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedDocDetails({ type: 'Purchase Order', data: po })}
                            className="p-1 text-slate-400 hover:text-slate-700"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. GOODS RECEIVED NOTES (GRN) */}
        {activeTab === 'grn' && (
          <div className="space-y-4">
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-sm">
                  <Truck className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">3-Way Stock & Financial GRN Clearance</h3>
                  <p className="text-xs text-slate-600">Every approved GRN automatically creates a balanced General Ledger entry (Dr Inventory 1300/1310 vs Cr Accounts Payable 2050).</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-white text-emerald-800 font-semibold text-xs rounded-lg border border-emerald-200">
                  Total GRN Cleared: ৳ {(grns.reduce((s, g) => s + g.totalAcceptedAmount, 0) || 0).toLocaleString()}
                </span>
                <button
                  onClick={() => setIsNewGrnModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Receive Goods (GRN)
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search GRNs by number, vendor, PO #, challan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">GRN Number</th>
                    <th className="px-4 py-3">Vendor / Supplier</th>
                    <th className="px-4 py-3">Warehouse Store</th>
                    <th className="px-4 py-3">Challan #</th>
                    <th className="px-4 py-3">Receive Date</th>
                    <th className="px-4 py-3">Accepted Value</th>
                    <th className="px-4 py-3">GL Journal Voucher</th>
                    <th className="px-4 py-3">Quality Inspection</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {grns
                    .filter(g =>
                      g.grnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      g.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (g.poNumber && g.poNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
                      (g.challanNumber && g.challanNumber.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .map((grn) => (
                    <tr key={grn.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{grn.grnNumber}</span>
                        </div>
                        {grn.poNumber && <span className="text-[10px] text-slate-400 font-normal">PO: {grn.poNumber}</span>}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{grn.supplierName}</td>
                      <td className="px-4 py-3 text-slate-600">{grn.warehouseName}</td>
                      <td className="px-4 py-3 text-slate-700 font-mono">{grn.challanNumber}</td>
                      <td className="px-4 py-3 text-slate-700">{grn.receiveDate}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">৳ {(grn.totalAcceptedAmount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-mono text-[11px] font-bold">
                          {grn.journalVoucherNumber || 'Auto-Posted JV'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <button
                          onClick={() => setSelectedDocDetails({ type: 'GRN', data: grn })}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded"
                        >
                          View Voucher
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. VENDOR BILLS & INVOICES */}
        {activeTab === 'bills' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search bills by invoice #, vendor, GL account..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsNewBillModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Enter Vendor Bill
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Bill # / Vendor Invoice</th>
                    <th className="px-4 py-3">Supplier Name</th>
                    <th className="px-4 py-3">GL Debit Account</th>
                    <th className="px-4 py-3">Bill Date & Due</th>
                    <th className="px-4 py-3">Total Amount</th>
                    <th className="px-4 py-3">Paid / Due</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">GL Posting</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {bills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{bill.billNumber}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">Inv: {bill.supplierInvoiceNumber}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{bill.supplierName}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-mono text-[10px] font-bold">
                          {bill.glDebitAccountCode}
                        </span>
                        <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{bill.glDebitAccountName}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div>{bill.billDate}</div>
                        <div className="text-[10px] text-rose-600 font-semibold">Due: {bill.dueDate}</div>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">৳ {(bill.totalAmount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="text-emerald-600">Paid: ৳ {(bill.paidAmount || 0).toLocaleString()}</div>
                        <div className="font-bold text-rose-600">Due: ৳ {(bill.dueAmount || 0).toLocaleString()}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          bill.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                          bill.status === 'Partially Paid' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] font-bold text-slate-600">
                          {bill.journalVoucherNumber || 'JV-Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        {bill.dueAmount > 0 && (
                          <button
                            onClick={() => {
                              setPaymentForm(prev => ({
                                ...prev,
                                supplierId: bill.supplierId,
                                billId: bill.id,
                                amount: bill.dueAmount
                              }));
                              setIsNewPaymentModalOpen(true);
                            }}
                            className="px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[11px] font-semibold rounded"
                          >
                            Pay Bill
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedDocDetails({ type: 'Purchase Bill', data: bill })}
                          className="p-1 text-slate-400 hover:text-slate-700"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. SUPPLIER PAYMENTS */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search payments by voucher #, supplier, bank ref..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsNewPaymentModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Disburse Payment
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Payment #</th>
                    <th className="px-4 py-3">Supplier Name</th>
                    <th className="px-4 py-3">Payment Method & Ref</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Settlement Amount</th>
                    <th className="px-4 py-3">Debit (AP) Account</th>
                    <th className="px-4 py-3">Credit (Bank/Cash) Account</th>
                    <th className="px-4 py-3">GL Voucher</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {payments
                    .filter(p =>
                      p.paymentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (p.billNumber && p.billNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
                      (p.referenceNumber && p.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{pay.paymentNumber}</span>
                        </div>
                        {pay.billNumber && <span className="text-[10px] text-slate-400 font-normal">Bill: {pay.billNumber}</span>}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{pay.supplierName}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-semibold text-[11px]">
                          {pay.paymentMethod}
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{pay.referenceNumber}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{pay.paymentDate}</td>
                      <td className="px-4 py-3 font-bold text-indigo-700 text-sm">৳ {(pay.amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[10px] font-bold text-slate-800">{pay.glDebitAccountCode}</span>
                        <div className="text-[10px] text-slate-500">{pay.glDebitAccountName}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[10px] font-bold text-slate-800">{pay.glCreditAccountCode}</span>
                        <div className="text-[10px] text-slate-500">{pay.glCreditAccountName}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-mono text-[11px] font-bold">
                          {pay.journalVoucherNumber || 'Auto-JV'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedDocDetails({ type: 'Supplier Payment', data: pay })}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded"
                        >
                          View Voucher
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. PURCHASE RETURNS & DEBIT NOTES */}
        {activeTab === 'returns' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search returns by number, vendor, reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsNewReturnModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Issue Purchase Return
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Return #</th>
                    <th className="px-4 py-3">Supplier Name</th>
                    <th className="px-4 py-3">Warehouse Store</th>
                    <th className="px-4 py-3">Return Date</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Debit Note Value</th>
                    <th className="px-4 py-3">AP Reduction Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {returns
                    .filter(r =>
                      r.returnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      r.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      r.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (r.grnNumber && r.grnNumber.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .map((ret) => (
                    <tr key={ret.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <ArrowUpDown className="w-3.5 h-3.5 text-rose-600" />
                          <span>{ret.returnNumber}</span>
                        </div>
                        {ret.grnNumber && <span className="text-[10px] text-slate-400 font-normal">GRN: {ret.grnNumber}</span>}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{ret.supplierName}</td>
                      <td className="px-4 py-3 text-slate-600">{ret.warehouseName}</td>
                      <td className="px-4 py-3 text-slate-700">{ret.returnDate}</td>
                      <td className="px-4 py-3 text-slate-600">{ret.reason}</td>
                      <td className="px-4 py-3 font-bold text-rose-600">৳ {(ret.totalAmount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                          Debit Note Posted (Dr AP 2050)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedDocDetails({ type: 'Purchase Return', data: ret })}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded"
                        >
                          View Voucher
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. SUPPLIERS DIRECTORY */}
        {activeTab === 'suppliers' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search suppliers by name, contact, code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsNewSupplierModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New Supplier
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers
                .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((sup) => (
                  <div key={sup.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-mono font-bold">{sup.code}</span>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{sup.name}</h4>
                        <p className="text-xs text-slate-500 font-medium">{sup.contactPerson}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        (sup.currentPayableBalance || 0) > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {(sup.currentPayableBalance || 0) > 0 ? 'Active Payable' : 'Zero Balance'}
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Phone</span>
                        <span className="font-medium text-slate-700">{sup.phone}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Terms / Credit Limit</span>
                        <span className="font-medium text-slate-700">{sup.paymentTerms} / ৳{(sup.creditLimit || 0).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="mt-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold block">Current Payable (AP)</span>
                        <span className="text-sm font-bold text-rose-600">৳ {(sup.currentPayableBalance || 0).toLocaleString()}</span>
                      </div>
                      <button
                        onClick={() => setViewSupplierLedger(sup.id)}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                      >
                        Statement of Account
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 8. APPROVAL PIPELINE */}
        {activeTab === 'approvals' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
                  <ShieldCheck className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Executive Procurement Approval Pipeline</h3>
                  <p className="text-xs text-slate-500">Multi-tier authorization queue for Departmental Requisitions, Purchase Orders, and High-value Vendor Bills.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pending Requisitions */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" /> Pending Requisitions ({totalOpenReqs})
                  </h4>
                </div>

                <div className="space-y-2">
                  {requisitions.filter(r => r.status === 'Submitted' || r.status === 'Under Review').map(req => (
                    <div key={req.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{req.requestNumber} - {req.department}</div>
                        <div className="text-[11px] text-slate-500">Est. ৳ {(req.totalEstimatedAmount || 0).toLocaleString()} • {req.requestedBy}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => inventoryMenuService.updatePurchaseRequestStatus(req.id, 'Approved', 'Farhana Sultana (GM)')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded shadow-xs"
                        >
                          Authorize
                        </button>
                        <button
                          onClick={() => inventoryMenuService.updatePurchaseRequestStatus(req.id, 'Rejected', 'Farhana Sultana (GM)', 'Budget review required')}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold rounded"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                  {totalOpenReqs === 0 && (
                    <div className="text-center py-6 text-xs text-slate-400 font-medium">No pending requisitions awaiting authorization.</div>
                  )}
                </div>
              </div>

              {/* Pending Purchase Orders */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500" /> Pending Purchase Orders
                  </h4>
                </div>

                <div className="space-y-2">
                  {purchaseOrders.filter(p => p.status === 'Draft' || p.status === 'Submitted').map(po => (
                    <div key={po.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{po.poNumber} • {po.supplierName}</div>
                        <div className="text-[11px] text-slate-500">Total: ৳ {(po.grandTotal || 0).toLocaleString()} • Terms: {po.paymentTerms}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => inventoryMenuService.updatePurchaseOrderStatus(po.id, 'Approved', 'Farhana Sultana (GM)')}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold rounded shadow-xs"
                        >
                          Sign PO
                        </button>
                      </div>
                    </div>
                  ))}
                  {purchaseOrders.filter(p => p.status === 'Draft' || p.status === 'Submitted').length === 0 && (
                    <div className="text-center py-6 text-xs text-slate-400 font-medium">All Purchase Orders are currently approved and issued.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 9. REPORTS: FINANCIAL & PROCUREMENT MAPPED TO ACCOUNTS */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Procurement & Accounts Financial Reporting Suite</h3>
                <p className="text-xs text-slate-500">Ledger mapping, AP aging schedule, 3-way reconciliation audit, and departmental budget variances.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Financial Summary
                </button>
              </div>
            </div>

            {/* 1. Procurement Spend vs Chart of Accounts GL Mapping */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    Procurement Spend Mapped to Chart of Accounts (GL)
                  </h4>
                  <p className="text-xs text-slate-500">Breakdown of inventory purchases and operational expenses debited to General Ledger codes.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">GL Code</th>
                      <th className="px-4 py-2.5">General Ledger Account Title</th>
                      <th className="px-4 py-2.5">Account Category</th>
                      <th className="px-4 py-2.5">Department</th>
                      <th className="px-4 py-2.5 text-center">Tx Count</th>
                      <th className="px-4 py-2.5 text-right">Total Spent (৳)</th>
                      <th className="px-4 py-2.5 text-right">Share of Spend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {glSpendReport.map((row) => (
                      <tr key={row.glAccountCode} className="hover:bg-slate-50/80">
                        <td className="px-4 py-2.5 font-mono font-bold text-slate-900">{row.glAccountCode}</td>
                        <td className="px-4 py-2.5 font-semibold text-slate-800">{row.glAccountName}</td>
                        <td className="px-4 py-2.5">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">
                            {row.category}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">{row.department}</td>
                        <td className="px-4 py-2.5 text-center text-slate-700">{row.transactionCount}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-900">৳ {(row.totalSpent || 0).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className="font-semibold text-emerald-700">{row.percentageOfTotal}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Accounts Payable (AP) Aging Schedule */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-rose-600" />
                    Accounts Payable (AP) Aging Schedule by Vendor
                  </h4>
                  <p className="text-xs text-slate-500">Aging buckets (Current, 1-30, 31-60, 61-90, &gt;90 days) for all supplier balances.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Vendor Name</th>
                      <th className="px-4 py-2.5">Terms</th>
                      <th className="px-4 py-2.5 text-right">Current (Not Due)</th>
                      <th className="px-4 py-2.5 text-right">1-30 Days</th>
                      <th className="px-4 py-2.5 text-right">31-60 Days</th>
                      <th className="px-4 py-2.5 text-right">61-90 Days</th>
                      <th className="px-4 py-2.5 text-right">&gt; 90 Days</th>
                      <th className="px-4 py-2.5 text-right font-bold">Total Payable</th>
                      <th className="px-4 py-2.5 text-center">Credit Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {apAgingReport.map((row) => (
                      <tr key={row.supplierId} className="hover:bg-slate-50/80">
                        <td className="px-4 py-2.5 font-bold text-slate-900">{row.supplierName}</td>
                        <td className="px-4 py-2.5 text-slate-600">{row.paymentTerms}</td>
                        <td className="px-4 py-2.5 text-right text-slate-700">৳ {(row.currentNotDue || 0).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right text-amber-700">৳ {(row.days1To30 || 0).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right text-orange-700">৳ {(row.days31To60 || 0).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right text-rose-700">৳ {(row.days61To90 || 0).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right text-rose-900 font-bold">৳ {(row.daysOver90 || 0).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-900">৳ {(row.totalOutstanding || 0).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.creditRisk === 'Critical' ? 'bg-rose-100 text-rose-800' :
                            row.creditRisk === 'High' ? 'bg-orange-100 text-orange-800' :
                            row.creditRisk === 'Moderate' ? 'bg-amber-100 text-amber-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {row.creditRisk}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. 3-Way Reconciliation Audit (PO vs GRN vs Vendor Bill) */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-indigo-600" />
                    3-Way Audit Trail (PO Commitment vs Physical GRN vs Vendor Bill)
                  </h4>
                  <p className="text-xs text-slate-500">Verification of order quantity, receiving confirmation, billed charges, and settlement.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">PO Number</th>
                      <th className="px-4 py-2.5">Supplier</th>
                      <th className="px-4 py-2.5 text-right">PO Amount</th>
                      <th className="px-4 py-2.5">GRN Document</th>
                      <th className="px-4 py-2.5 text-right">GRN Value</th>
                      <th className="px-4 py-2.5">Bill Number</th>
                      <th className="px-4 py-2.5 text-right">Bill Amount</th>
                      <th className="px-4 py-2.5">Reconciliation Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {threeWayReport.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="px-4 py-2.5 font-bold text-slate-900">{row.poNumber}</td>
                        <td className="px-4 py-2.5 font-semibold text-slate-800">{row.supplierName}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-900">৳ {(row.poAmount || 0).toLocaleString()}</td>
                        <td className="px-4 py-2.5 font-mono text-[11px] text-slate-700">{row.grnNumber || '—'}</td>
                        <td className="px-4 py-2.5 text-right text-emerald-700 font-semibold">
                          {row.grnAmount ? `৳ ${(row.grnAmount || 0).toLocaleString()}` : '—'}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-[11px] text-slate-700">{row.billNumber || '—'}</td>
                        <td className="px-4 py-2.5 text-right text-indigo-700 font-semibold">
                          {row.billAmount ? `৳ ${(row.billAmount || 0).toLocaleString()}` : '—'}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.status === 'Matched & Fully Settled' ? 'bg-emerald-100 text-emerald-800' :
                            row.status === 'Pending Payment' ? 'bg-indigo-100 text-indigo-800' :
                            row.status === 'Unbilled GRN' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Departmental Procurement vs Budget */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-emerald-600" />
                    Departmental Procurement Spend vs Budget Allocation
                  </h4>
                  <p className="text-xs text-slate-500">Committed vs Allocated Budget per Departmental Cost Center.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {budgetReport.map((b) => (
                  <div key={b.department} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">{b.department}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        b.status === 'Over Budget' ? 'bg-rose-100 text-rose-800' :
                        b.status === 'Near Limit' ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {b.status}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-slate-500">
                        <span>Budget Allocated:</span>
                        <span className="font-semibold text-slate-800">৳ {(b.allocatedBudget || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Actual Invoiced:</span>
                        <span className="font-semibold text-slate-900">৳ {(b.actualSpend || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Committed PO:</span>
                        <span className="font-semibold text-indigo-700">৳ {(b.committedPOAmount || 0).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-2 mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          b.utilizationPercent > 90 ? 'bg-rose-500' :
                          b.utilizationPercent > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, b.utilizationPercent)}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-right font-bold text-slate-600">
                      {b.utilizationPercent}% Utilized
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MODAL: NEW REQUISITION */}
      {isNewReqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Create Purchase Requisition</h3>
              <button onClick={() => setIsNewReqModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequisition} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Requesting Department</label>
                  <select
                    value={reqForm.department}
                    onChange={(e) => {
                      const newDept = e.target.value;
                      const rule = inventoryMenuService.getDepartmentRule(newDept);
                      setReqForm({ ...reqForm, department: newDept });
                      setReqSelectedItemGroup(rule.defaultGroup);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Main Kitchen F&B">Main Kitchen F&B</option>
                    <option value="Bar & Lounge">Bar & Lounge</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Engineering & Maintenance">Engineering & Maintenance</option>
                    <option value="Front Office">Front Office & Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Target Warehouse Store</label>
                  <select
                    value={reqForm.warehouseId}
                    onChange={(e) => setReqForm({ ...reqForm, warehouseId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Required By Date</label>
                  <input
                    type="date"
                    value={reqForm.requiredDate}
                    onChange={(e) => setReqForm({ ...reqForm, requiredDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Priority</label>
                  <select
                    value={reqForm.priority}
                    onChange={(e) => setReqForm({ ...reqForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
              </div>

                {/* SEARCHABLE ITEM SELECTION & GROUPING RULES */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-slate-700 font-semibold text-xs">
                    Select Item to Request *
                  </label>
                  <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    Rule: {currentDeptRule.description || currentDeptRule.defaultGroup}
                  </span>
                </div>

                {/* If an item is already selected and user hasn't opened search dropdown */}
                {currentSelectedItem && !isItemDropdownOpen ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {(() => {
                        const g = currentSelectedItem.itemGroup || determineItemGroup(currentSelectedItem);
                        const isFood = g === 'food' || g === 'kitchen';
                        const isHk = g === 'housekeeping';
                        const isMaint = g === 'maintenance';
                        const isIt = g === 'it';
                        const isAdmin = g === 'administrative';
                        const isAcc = g === 'accessories';
                        const icon = isFood ? '🍳' : isHk ? '🧹' : isMaint ? '🔧' : isIt ? '💻' : isAdmin ? '📋' : '🧰';
                        const label = isFood ? 'Food & Kitchen' : isHk ? 'Housekeeping' : isMaint ? 'Maintenance' : isIt ? 'IT & Tech' : isAdmin ? 'Administrative' : 'Accessories';
                        const bgCol = isFood ? 'bg-amber-100 text-amber-800' : isHk ? 'bg-teal-100 text-teal-800' : isMaint ? 'bg-orange-100 text-orange-800' : isIt ? 'bg-sky-100 text-sky-800' : isAdmin ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800';

                        return (
                          <>
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${bgCol}`}>
                              {icon}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 truncate text-xs">{currentSelectedItem.name}</span>
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-800 shrink-0">
                                  {currentSelectedItem.itemCode}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                <span className="capitalize font-semibold text-slate-700">{label}</span>
                                <span>•</span>
                                <span>Stock: <strong className="text-emerald-700">{currentSelectedItem.currentTotalStock} {currentSelectedItem.uomCode}</strong></span>
                                <span>•</span>
                                <span>Rate: ৳ {currentSelectedItem.averageCost} / {currentSelectedItem.uomCode}</span>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDocDetails({
                            type: 'Purchase Requisition',
                            data: {
                              id: 'preview-slip',
                              requestNumber: `REQ-SLIP-${Date.now().toString().slice(-4)}`,
                              department: reqForm.department,
                              warehouseName: warehouses.find(w => w.id === reqForm.warehouseId)?.name || 'Store',
                              requestDate: new Date().toISOString().split('T')[0],
                              requiredDate: reqForm.requiredDate,
                              priority: reqForm.priority as any,
                              items: [{
                                itemId: currentSelectedItem.id,
                                itemCode: currentSelectedItem.itemCode,
                                itemName: currentSelectedItem.name,
                                requestedQuantity: reqForm.items[0]?.requestedQuantity || 1,
                                approvedQuantity: reqForm.items[0]?.requestedQuantity || 1,
                                uom: currentSelectedItem.uomCode,
                                estimatedUnitCost: currentSelectedItem.averageCost,
                                estimatedTotal: (reqForm.items[0]?.requestedQuantity || 1) * currentSelectedItem.averageCost
                              }],
                              totalEstimatedAmount: (reqForm.items[0]?.requestedQuantity || 1) * currentSelectedItem.averageCost,
                              status: 'Draft / Preview',
                              requestedBy: reqForm.requestedBy,
                              remarks: reqForm.remarks || 'Instant Requisition Slip'
                            }
                          });
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                        title="Click for Instant Print Requisition Slip"
                      >
                        <Printer className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Instant Print Slip</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsItemDropdownOpen(true);
                          setReqItemSearchQuery('');
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                      >
                        <Search className="w-3 h-3 text-slate-500" />
                        <span>Change Item</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Dynamic Search Combobox with Live Type-Ahead Filtering */
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        autoFocus
                        value={reqItemSearchQuery}
                        onChange={(e) => {
                          setReqItemSearchQuery(e.target.value);
                          setIsItemDropdownOpen(true);
                        }}
                        onFocus={() => setIsItemDropdownOpen(true)}
                        placeholder="Type to search items by name or SKU (e.g. Rice, Toner, Towel, Cable, Tap, Paper)..."
                        className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-indigo-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-xl text-xs text-slate-900 font-medium outline-none transition"
                      />
                      {reqItemSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setReqItemSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Group Filter Tabs with Dynamic Item Count Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-1 pt-0.5">
                      <div className="flex flex-wrap items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setReqSelectedItemGroup('all')}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition cursor-pointer ${
                            reqSelectedItemGroup === 'all'
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          All ({groupCounts.all})
                        </button>
                        <button
                          type="button"
                          onClick={() => setReqSelectedItemGroup('food')}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition flex items-center gap-1 cursor-pointer ${
                            reqSelectedItemGroup === 'food' || reqSelectedItemGroup === 'kitchen'
                              ? 'bg-amber-600 text-white font-bold'
                              : 'bg-amber-50 text-amber-800 border border-amber-200/50 hover:bg-amber-100'
                          }`}
                        >
                          <span>🍳 Food ({groupCounts.food})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setReqSelectedItemGroup('housekeeping')}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition flex items-center gap-1 cursor-pointer ${
                            reqSelectedItemGroup === 'housekeeping'
                              ? 'bg-teal-600 text-white font-bold'
                              : 'bg-teal-50 text-teal-800 border border-teal-200/50 hover:bg-teal-100'
                          }`}
                        >
                          <span>🧹 Housekeeping ({groupCounts.housekeeping})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setReqSelectedItemGroup('maintenance')}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition flex items-center gap-1 cursor-pointer ${
                            reqSelectedItemGroup === 'maintenance'
                              ? 'bg-orange-600 text-white font-bold'
                              : 'bg-orange-50 text-orange-800 border border-orange-200/50 hover:bg-orange-100'
                          }`}
                        >
                          <span>🔧 Maintenance ({groupCounts.maintenance})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setReqSelectedItemGroup('it')}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition flex items-center gap-1 cursor-pointer ${
                            reqSelectedItemGroup === 'it'
                              ? 'bg-sky-600 text-white font-bold'
                              : 'bg-sky-50 text-sky-800 border border-sky-200/50 hover:bg-sky-100'
                          }`}
                        >
                          <span>💻 IT ({groupCounts.it})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setReqSelectedItemGroup('administrative')}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition flex items-center gap-1 cursor-pointer ${
                            reqSelectedItemGroup === 'administrative'
                              ? 'bg-emerald-600 text-white font-bold'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200/50 hover:bg-emerald-100'
                          }`}
                        >
                          <span>📋 Admin ({groupCounts.administrative})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setReqSelectedItemGroup('accessories')}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition flex items-center gap-1 cursor-pointer ${
                            reqSelectedItemGroup === 'accessories'
                              ? 'bg-purple-600 text-white font-bold'
                              : 'bg-purple-50 text-purple-800 border border-purple-200/50 hover:bg-purple-100'
                          }`}
                        >
                          <span>🧰 Accessories ({groupCounts.accessories})</span>
                        </button>
                      </div>

                      {currentSelectedItem && (
                        <button
                          type="button"
                          onClick={() => setIsItemDropdownOpen(false)}
                          className="text-[10px] text-slate-500 hover:underline font-semibold cursor-pointer"
                        >
                          Keep current selection
                        </button>
                      )}
                    </div>

                    {/* Department Routing Rule Tip */}
                    <div className="text-[10px] text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/60 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                      <span><strong>Dept Rule:</strong> {currentDeptRule.description}</span>
                    </div>

                    {/* Filtered Dropdown Items List */}
                    <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white shadow-lg">
                      {filteredReqItems.length === 0 ? (
                        <div className="p-4 text-center text-slate-400">
                          <p className="font-semibold text-xs">No matching items found</p>
                          <p className="text-[10px] mt-0.5">Try searching with a different keyword or switch the Item Group filter above.</p>
                        </div>
                      ) : (
                        filteredReqItems.map(item => {
                          const grp = item.itemGroup || determineItemGroup(item);
                          const isFood = grp === 'food' || grp === 'kitchen';
                          const isHk = grp === 'housekeeping';
                          const isMaint = grp === 'maintenance';
                          const isIt = grp === 'it';
                          const isAdmin = grp === 'administrative';
                          const icon = isFood ? '🍳' : isHk ? '🧹' : isMaint ? '🔧' : isIt ? '💻' : isAdmin ? '📋' : '🧰';
                          const bgCol = isFood ? 'bg-amber-100 text-amber-800' : isHk ? 'bg-teal-100 text-teal-800' : isMaint ? 'bg-orange-100 text-orange-800' : isIt ? 'bg-sky-100 text-sky-800' : isAdmin ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800';
                          const isSelected = reqForm.items[0]?.itemId === item.id;
                          return (
                            <div
                              key={item.id}
                              onClick={() => handleSelectItemForReq(item)}
                              className={`p-2.5 hover:bg-indigo-50/70 cursor-pointer flex items-center justify-between gap-2 transition ${
                                isSelected ? 'bg-indigo-50/90 border-l-4 border-indigo-600' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`w-6 h-6 rounded flex items-center justify-center text-xs shrink-0 ${bgCol}`}>
                                  {icon}
                                </span>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900 text-xs truncate">{item.name}</span>
                                    <span className="font-mono text-[10px] font-semibold px-1 rounded bg-slate-100 text-slate-700 shrink-0">
                                      {item.itemCode}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                    <span>{item.categoryName || 'General'}</span>
                                    <span>•</span>
                                    <span className="font-medium text-emerald-700">Stock: {item.currentTotalStock} {item.uomCode}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="font-bold text-slate-900 text-xs block">৳ {item.averageCost}</span>
                                <span className="text-[10px] text-slate-400">per {item.uomCode}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-semibold">Requested Quantity</label>
                  {reqForm.items[0]?.estimatedUnitCost ? (
                    <span className="text-[11px] text-slate-500">
                      Est. Total: <strong className="text-emerald-700 font-mono">৳ {(reqForm.items[0].requestedQuantity * reqForm.items[0].estimatedUnitCost).toLocaleString()}</strong>
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={reqForm.items[0]?.requestedQuantity || 1}
                    onChange={(e) => {
                      const qty = Math.max(1, Number(e.target.value) || 1);
                      setReqForm({
                        ...reqForm,
                        items: reqForm.items.map(it => ({
                          ...it,
                          requestedQuantity: qty,
                          approvedQuantity: qty,
                          estimatedTotal: qty * it.estimatedUnitCost
                        }))
                      });
                    }}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                  <span className="px-2.5 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 shrink-0">
                    {reqForm.items[0]?.uom || 'Unit'}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewReqModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleCreateRequisition(e, true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                    title="Submit requisition and immediately open printable voucher slip"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Submit &amp; Instant Print</span>
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    Submit Requisition
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: POST VENDOR BILL */}
      {isNewBillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Post Vendor Bill / Invoice</h3>
                <p className="text-xs text-slate-500">Creates an Accounts Payable entry and posts directly to the selected GL expense code.</p>
              </div>
              <button onClick={() => setIsNewBillModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBill} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Supplier / Vendor</label>
                  <select
                    value={billForm.supplierId}
                    onChange={(e) => setBillForm({ ...billForm, supplierId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Supplier Invoice #</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INV-BM-90821"
                    value={billForm.supplierInvoiceNumber}
                    onChange={(e) => setBillForm({ ...billForm, supplierInvoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">GL Debit Expense Account</label>
                  <select
                    value={billForm.glDebitAccountCode}
                    onChange={(e) => {
                      const gl = glAccounts.find(g => g.code === e.target.value);
                      setBillForm({
                        ...billForm,
                        glDebitAccountCode: e.target.value,
                        glDebitAccountName: gl ? gl.name : ''
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  >
                    <option value="1300">1300 - Food & Raw Ingredients Stock</option>
                    <option value="1310">1310 - Bar & Beverage Stock</option>
                    <option value="1320">1320 - Housekeeping & Room Amenities Stock</option>
                    <option value="5010">5010 - Housekeeping Supplies Expense</option>
                    <option value="5020">5020 - Kitchen Raw Materials Expense</option>
                    <option value="5030">5030 - Engineering Maintenance Expense</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">GL Credit Payable Account</label>
                  <input
                    type="text"
                    disabled
                    value="2050 - Accounts Payable / Trade Creditors"
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Subtotal (৳)</label>
                  <input
                    type="number"
                    required
                    value={billForm.subtotal || ''}
                    onChange={(e) => setBillForm({ ...billForm, subtotal: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tax / VAT (৳)</label>
                  <input
                    type="number"
                    value={billForm.taxAmount || ''}
                    onChange={(e) => setBillForm({ ...billForm, taxAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Due Date</label>
                  <input
                    type="date"
                    value={billForm.dueDate}
                    onChange={(e) => setBillForm({ ...billForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewBillModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Post Bill &amp; Update Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DISBURSE SUPPLIER PAYMENT */}
      {isNewPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Supplier Settlement Payment</h3>
                <p className="text-xs text-slate-500">Debits AP 2050 and Credits Commercial Bank / Cash Accounts.</p>
              </div>
              <button onClick={() => setIsNewPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePayment} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Supplier</label>
                <select
                  value={paymentForm.supplierId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, supplierId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (Payable: ৳{(s.currentPayableBalance || 0).toLocaleString()})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Method</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Bank Transfer">Bank Transfer (EBL/DBBL)</option>
                    <option value="Cheque">Cheque Payment</option>
                    <option value="Cash">Cash Voucher</option>
                    <option value="bKash">bKash Merchant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Transaction / Cheque Ref #</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EBL-CORP-99214"
                    value={paymentForm.referenceNumber}
                    onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Amount (৳)</label>
                  <input
                    type="number"
                    required
                    value={paymentForm.amount || ''}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewPaymentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Disburse &amp; Post JV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUPPLIER STATEMENT OF ACCOUNT */}
      {viewSupplierLedger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            {(() => {
              const statement = inventoryMenuService.getSupplierStatementOfAccount(viewSupplierLedger);
              if (!statement) return null;
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Supplier Subsidiary Ledger &amp; Statement</h3>
                      <p className="text-xs text-slate-500 font-medium">{statement.supplier.name} • Terms: {statement.supplier.paymentTerms}</p>
                    </div>
                    <button onClick={() => setViewSupplierLedger(null)} className="text-slate-400 hover:text-slate-600">
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                      <span className="text-[10px] text-slate-400 block font-semibold">Total Purchases</span>
                      <span className="font-bold text-slate-900">৳ {(statement.totalPurchases || 0).toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                      <span className="text-[10px] text-slate-400 block font-semibold">Total Returns</span>
                      <span className="font-bold text-rose-600">৳ {(statement.totalReturns || 0).toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                      <span className="text-[10px] text-slate-400 block font-semibold">Total Paid</span>
                      <span className="font-bold text-emerald-600">৳ {(statement.totalPaid || 0).toLocaleString()}</span>
                    </div>
                    <div className="bg-rose-50 p-2.5 rounded-lg border border-rose-200 text-xs">
                      <span className="text-[10px] text-rose-600 block font-semibold">Closing Balance (AP)</span>
                      <span className="font-bold text-rose-700">৳ {(statement.closingPayableBalance || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-[11px] font-semibold text-slate-700 uppercase tracking-wider sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Doc Type &amp; #</th>
                          <th className="px-3 py-2">Particulars / Memo</th>
                          <th className="px-3 py-2 text-right">Debit (Paid/Ret)</th>
                          <th className="px-3 py-2 text-right">Credit (Bill)</th>
                          <th className="px-3 py-2 text-right">Running Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {statement.transactions.map((tx, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80">
                            <td className="px-3 py-2">{tx.date}</td>
                            <td className="px-3 py-2 font-mono font-bold text-slate-800">{tx.docNumber}</td>
                            <td className="px-3 py-2 text-slate-600">{tx.reference}</td>
                            <td className="px-3 py-2 text-right text-emerald-600 font-semibold">{tx.debit ? `৳ ${(tx.debit || 0).toLocaleString()}` : '—'}</td>
                            <td className="px-3 py-2 text-right text-slate-900 font-semibold">{tx.credit ? `৳ ${(tx.credit || 0).toLocaleString()}` : '—'}</td>
                            <td className="px-3 py-2 text-right font-bold text-slate-900">৳ {(tx.balance || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => setViewSupplierLedger(null)}
                      className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs"
                    >
                      Close Statement
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL: ADD SUPPLIER */}
      {isNewSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add New Supplier Profile</h3>
              <button onClick={() => setIsNewSupplierModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Company / Supplier Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bengal Meat Processing Ltd."
                    value={supplierForm.name}
                    onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Contact Person</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Md. Shahidul Islam"
                    value={supplierForm.contactPerson}
                    onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="+880 1711-XXXXXX"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="sales@vendor.com"
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Terms</label>
                  <select
                    value={supplierForm.paymentTerms}
                    onChange={(e) => setSupplierForm({ ...supplierForm, paymentTerms: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Cash on Delivery">Cash on Delivery</option>
                    <option value="Net 7">Net 7 Days</option>
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Net 30">Net 30 Days</option>
                    <option value="Advance">100% Advance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Credit Limit (৳)</label>
                  <input
                    type="number"
                    value={supplierForm.creditLimit}
                    onChange={(e) => setSupplierForm({ ...supplierForm, creditLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewSupplierModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ISSUE NEW PURCHASE ORDER (PO) */}
      {isNewPoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <FileText className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Issue Purchase Order (PO)</h3>
                  <p className="text-xs text-slate-500">Official vendor procurement authorization, budget reservation, and delivery contract.</p>
                </div>
              </div>
              <button onClick={() => setIsNewPoModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="space-y-4 mt-4 text-xs overflow-y-auto pr-1 flex-1">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Pull Approved Requisition (Optional)</label>
                  <select
                    value={poForm.requisitionId}
                    onChange={(e) => handleSelectReqForPo(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="">-- Direct Purchase Order --</option>
                    {requisitions.filter(r => r.status === 'Approved' || r.status === 'Submitted').map(r => (
                      <option key={r.id} value={r.id}>{r.requestNumber} - {r.department} ({r.items.length} items)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Vendor / Supplier *</label>
                  <select
                    required
                    value={poForm.supplierId}
                    onChange={(e) => setPoForm({ ...poForm, supplierId: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.paymentTerms})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Destination Warehouse *</label>
                  <select
                    required
                    value={poForm.warehouseId}
                    onChange={(e) => setPoForm({ ...poForm, warehouseId: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Order Date</label>
                  <input
                    type="date"
                    required
                    value={poForm.orderDate}
                    onChange={(e) => setPoForm({ ...poForm, orderDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    required
                    value={poForm.expectedDeliveryDate}
                    onChange={(e) => setPoForm({ ...poForm, expectedDeliveryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Terms</label>
                  <select
                    value={poForm.paymentTerms}
                    onChange={(e) => setPoForm({ ...poForm, paymentTerms: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Net 30">Net 30 Days</option>
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Net 7">Net 7 Days</option>
                    <option value="Cash on Delivery">Cash on Delivery (COD)</option>
                    <option value="100% Advance">100% Advance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Prepared By</label>
                  <input
                    type="text"
                    required
                    value={poForm.preparedBy}
                    onChange={(e) => setPoForm({ ...poForm, preparedBy: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Dynamic Line Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    Procurement Line Items ({poForm.items.length})
                  </span>
                  <button
                    type="button"
                    onClick={addPoItem}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Item
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Catalog Item</th>
                        <th className="px-3 py-2 w-28">Quantity</th>
                        <th className="px-3 py-2 w-20">UOM</th>
                        <th className="px-3 py-2 w-32">Unit Price (৳)</th>
                        <th className="px-3 py-2 w-24">Tax / VAT %</th>
                        <th className="px-3 py-2 w-32 text-right">Line Total</th>
                        <th className="px-2 py-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {poForm.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="px-3 py-2">
                            <select
                              value={item.itemId}
                              onChange={(e) => selectPoCatalogItem(idx, e.target.value)}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium"
                            >
                              <optgroup label="🍳 Kitchen Items">
                                {inventoryItems.filter(i => (i.itemGroup || determineItemGroup(i)) === 'kitchen').map(inv => (
                                  <option key={inv.id} value={inv.id}>
                                    {inv.itemCode} - {inv.name} (Stock: {inv.currentTotalStock} {inv.uomCode})
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="🧰 Accessories & Consumables">
                                {inventoryItems.filter(i => (i.itemGroup || determineItemGroup(i)) === 'accessories').map(inv => (
                                  <option key={inv.id} value={inv.id}>
                                    {inv.itemCode} - {inv.name} (Stock: {inv.currentTotalStock} {inv.uomCode})
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="🏢 Department Items">
                                {inventoryItems.filter(i => (i.itemGroup || determineItemGroup(i)) === 'department').map(inv => (
                                  <option key={inv.id} value={inv.id}>
                                    {inv.itemCode} - {inv.name} (Stock: {inv.currentTotalStock} {inv.uomCode})
                                  </option>
                                ))}
                              </optgroup>
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updatePoItem(idx, 'quantity', e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-center font-bold"
                            />
                          </td>
                          <td className="px-3 py-2 text-slate-500 font-mono">
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-semibold">{item.uom}</span>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => updatePoItem(idx, 'unitPrice', e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-right font-medium"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.taxPercent || 0}
                              onChange={(e) => updatePoItem(idx, 'taxPercent', e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-center"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-slate-900">
                            ৳ {((item.quantity * item.unitPrice) || 0).toLocaleString()}
                          </td>
                          <td className="px-2 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removePoItem(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Summary & Delivery Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Commercial Notes & Delivery Terms</label>
                  <textarea
                    rows={3}
                    placeholder="Enter special instructions, warranty terms, receiving location..."
                    value={poForm.notes}
                    onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-slate-900">
                      ৳ {poForm.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Estimated Tax / VAT:</span>
                    <span className="font-semibold text-slate-900">
                      ৳ {poForm.items.reduce((s, i) => s + (i.quantity * i.unitPrice * (i.taxPercent || 0) / 100), 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-indigo-700 border-t border-slate-200 pt-1.5">
                    <span>Grand Total Commitment:</span>
                    <span>
                      ৳ {(
                        poForm.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0) +
                        poForm.items.reduce((s, i) => s + (i.quantity * i.unitPrice * (i.taxPercent || 0) / 100), 0)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-shrink-0">
                <span className="text-[11px] text-slate-500 font-medium">
                  Authorizing this PO reserves budget and generates tracking document for GRN clearance.
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewPoModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm"
                  >
                    Issue Purchase Order
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE GOODS RECEIVE NOTE (GRN) */}
      {isNewGrnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <Truck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Goods Receive Note (GRN) &amp; QA Check</h3>
                  <p className="text-xs text-slate-600">Verifies physical consignment, performs QA inspection, and debits Inventory Accounts (1300/1310).</p>
                </div>
              </div>
              <button onClick={() => setIsNewGrnModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGRN} className="space-y-4 mt-4 text-xs overflow-y-auto pr-1 flex-1">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Select Purchase Order *</label>
                  <select
                    value={grnForm.poId}
                    onChange={(e) => handleSelectPoForGrn(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value="">-- Direct / Ad-hoc Receiving --</option>
                    {purchaseOrders.filter(p => p.status !== 'Fully Received').map(p => (
                      <option key={p.id} value={p.id}>
                        {p.poNumber} - {p.supplierName} (৳{(p.grandTotal || 0).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Supplier / Consignor *</label>
                  <select
                    required
                    value={grnForm.supplierId}
                    onChange={(e) => setGrnForm({ ...grnForm, supplierId: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Receiving Warehouse *</label>
                  <select
                    required
                    value={grnForm.warehouseId}
                    onChange={(e) => setGrnForm({ ...grnForm, warehouseId: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Vendor Challan / Delivery Ref # *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CH-2026-8910"
                    value={grnForm.challanNumber}
                    onChange={(e) => setGrnForm({ ...grnForm, challanNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Receive Date</label>
                  <input
                    type="date"
                    required
                    value={grnForm.receiveDate}
                    onChange={(e) => setGrnForm({ ...grnForm, receiveDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Received &amp; Checked By</label>
                  <input
                    type="text"
                    required
                    value={grnForm.receivedBy}
                    onChange={(e) => setGrnForm({ ...grnForm, receivedBy: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Items Received QA Verification Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Consignment Items &amp; Quality Inspection ({grnForm.items.length})
                  </span>
                  <button
                    type="button"
                    onClick={addGrnItem}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg text-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Item Line
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Item Name &amp; Code</th>
                        <th className="px-2 py-2 w-20 text-center">PO Qty</th>
                        <th className="px-2 py-2 w-24 text-center">Received</th>
                        <th className="px-2 py-2 w-24 text-center text-emerald-700">Accepted</th>
                        <th className="px-2 py-2 w-24 text-center text-rose-700">Rejected</th>
                        <th className="px-2 py-2 w-24 text-right">Unit Rate</th>
                        <th className="px-3 py-2 w-28 text-right">Total Accepted</th>
                        <th className="px-2 py-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {grnForm.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="px-3 py-2">
                            <select
                              value={item.itemId}
                              onChange={(e) => selectGrnCatalogItem(idx, e.target.value)}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium"
                            >
                              {inventoryItems.map(inv => (
                                <option key={inv.id} value={inv.id}>
                                  {inv.itemCode} - {inv.name} ({inv.uomCode})
                                </option>
                              ))}
                            </select>
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="text"
                                placeholder="Batch #"
                                value={item.batchNumber || ''}
                                onChange={(e) => updateGrnItem(idx, 'batchNumber', e.target.value)}
                                className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] w-28 font-mono"
                              />
                              <input
                                type="date"
                                placeholder="Expiry"
                                value={item.expiryDate || ''}
                                onChange={(e) => updateGrnItem(idx, 'expiryDate', e.target.value)}
                                className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px]"
                              />
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center font-bold text-slate-500">
                            {item.poQuantity || '—'}
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input
                              type="number"
                              min="0"
                              value={item.receivedQuantity}
                              onChange={(e) => updateGrnItem(idx, 'receivedQuantity', e.target.value)}
                              className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded text-xs text-center font-bold"
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input
                              type="number"
                              min="0"
                              value={item.acceptedQuantity}
                              onChange={(e) => updateGrnItem(idx, 'acceptedQuantity', e.target.value)}
                              className="w-full px-1.5 py-1 bg-emerald-50 border border-emerald-300 rounded text-xs text-center font-bold text-emerald-800"
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input
                              type="number"
                              min="0"
                              value={item.rejectedQuantity || 0}
                              onChange={(e) => updateGrnItem(idx, 'rejectedQuantity', e.target.value)}
                              className="w-full px-1.5 py-1 bg-rose-50 border border-rose-200 rounded text-xs text-center font-bold text-rose-700"
                            />
                          </td>
                          <td className="px-2 py-2 text-right font-medium">
                            ৳ {(item.unitPrice || 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-emerald-700">
                            ৳ {((item.acceptedQuantity * item.unitPrice) || 0).toLocaleString()}
                          </td>
                          <td className="px-2 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeGrnItem(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* QA Remarks & Automatic Journal Entry Notice */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Quality Inspection Remarks</label>
                  <textarea
                    rows={2}
                    placeholder="Temperature compliance, seal intact, packaging condition..."
                    value={grnForm.notes}
                    onChange={(e) => setGrnForm({ ...grnForm, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 text-xs space-y-1">
                  <span className="font-bold text-emerald-900 block flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Automated General Ledger Impact:
                  </span>
                  <div className="text-emerald-800 font-mono text-[11px]">
                    <div>• Dr. Inventory Stock Asset (1300/1310): ৳ {grnForm.items.reduce((s, i) => s + (i.acceptedQuantity * i.unitPrice), 0).toLocaleString()}</div>
                    <div>• Cr. Accounts Payable Clearing (2050): ৳ {grnForm.items.reduce((s, i) => s + (i.acceptedQuantity * i.unitPrice), 0).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-shrink-0">
                <span className="text-[11px] text-slate-500 font-medium">
                  Posting this GRN instantly increments physical warehouse stock and generates balanced JV.
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewGrnModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm"
                  >
                    Post GRN &amp; Update Inventory
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ISSUE PURCHASE RETURN & DEBIT NOTE */}
      {isNewReturnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-rose-50 text-rose-700 rounded-xl">
                  <ArrowUpDown className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Issue Purchase Return &amp; Debit Note</h3>
                  <p className="text-xs text-slate-500">Returns defective or rejected stock to vendor and debits Accounts Payable (AP 2050).</p>
                </div>
              </div>
              <button onClick={() => setIsNewReturnModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReturn} className="space-y-4 mt-4 text-xs overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Vendor / Supplier *</label>
                  <select
                    required
                    value={returnForm.supplierId}
                    onChange={(e) => setReturnForm({ ...returnForm, supplierId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Store / Warehouse *</label>
                  <select
                    required
                    value={returnForm.warehouseId}
                    onChange={(e) => setReturnForm({ ...returnForm, warehouseId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Reference GRN (Optional)</label>
                  <select
                    value={returnForm.grnId}
                    onChange={(e) => setReturnForm({ ...returnForm, grnId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="">-- Manual Return --</option>
                    {grns.map(g => (
                      <option key={g.id} value={g.id}>{g.grnNumber} ({g.supplierName})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Return Date</label>
                  <input
                    type="date"
                    required
                    value={returnForm.returnDate}
                    onChange={(e) => setReturnForm({ ...returnForm, returnDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Primary Reason</label>
                  <select
                    value={returnForm.reason}
                    onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Damaged / Defective Goods">Damaged / Defective Goods</option>
                    <option value="Expired / Close to Expiry">Expired / Close to Expiry</option>
                    <option value="Wrong Specification Delivered">Wrong Specification Delivered</option>
                    <option value="Over-shipment / Excess Stock">Over-shipment / Excess Stock</option>
                    <option value="Quality Inspection Failed">Quality Inspection Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Returned By</label>
                  <input
                    type="text"
                    required
                    value={returnForm.returnedBy}
                    onChange={(e) => setReturnForm({ ...returnForm, returnedBy: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Items to Return Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <ArrowUpDown className="w-3.5 h-3.5 text-rose-600" />
                    Items for Return ({returnForm.items.length})
                  </span>
                  <button
                    type="button"
                    onClick={addReturnItem}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg text-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Return Item
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Item</th>
                        <th className="px-2 py-2 w-24 text-center">Return Qty</th>
                        <th className="px-2 py-2 w-20">UOM</th>
                        <th className="px-2 py-2 w-28 text-right">Unit Rate (৳)</th>
                        <th className="px-3 py-2 w-32 text-right">Debit Total</th>
                        <th className="px-2 py-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {returnForm.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="px-3 py-2">
                            <select
                              value={item.itemId}
                              onChange={(e) => selectReturnCatalogItem(idx, e.target.value)}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium"
                            >
                              {inventoryItems.map(inv => (
                                <option key={inv.id} value={inv.id}>
                                  {inv.itemCode} - {inv.name} (Stock: {inv.currentTotalStock} {inv.uomCode})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateReturnItem(idx, 'quantity', e.target.value)}
                              className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded text-xs text-center font-bold"
                            />
                          </td>
                          <td className="px-2 py-2 text-slate-500 font-mono text-[11px]">
                            {item.uom}
                          </td>
                          <td className="px-2 py-2 text-right">
                            <input
                              type="number"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => updateReturnItem(idx, 'unitPrice', e.target.value)}
                              className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded text-xs text-right font-medium"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-rose-600">
                            ৳ {((item.quantity * item.unitPrice) || 0).toLocaleString()}
                          </td>
                          <td className="px-2 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeReturnItem(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-rose-900 block">Total Debit Note Amount</span>
                  <span className="text-rose-700 text-[11px]">This amount will be directly debited against Accounts Payable (AP 2050).</span>
                </div>
                <div className="text-lg font-bold text-rose-700">
                  ৳ {returnForm.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0).toLocaleString()}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsNewReturnModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Post Return &amp; Issue Debit Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DOCUMENT DETAILS / PRINTABLE VOUCHER VIEWER */}
      {selectedDocDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 flex-shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold uppercase tracking-wider">
                    {selectedDocDetails.type}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 font-mono">
                    {selectedDocDetails.data.requestNumber ||
                     selectedDocDetails.data.poNumber ||
                     selectedDocDetails.data.grnNumber ||
                     selectedDocDetails.data.billNumber ||
                     selectedDocDetails.data.paymentNumber ||
                     selectedDocDetails.data.returnNumber ||
                     'Document'}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">CCULB Resort &amp; Convention Hall • Procurement &amp; Inventory Division</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                  title="Instant Print this Voucher Slip"
                >
                  <Printer className="w-4 h-4" /> Instant Print
                </button>
                <button
                  onClick={() => setSelectedDocDetails(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Content */}
            <div className="space-y-4 my-4 text-xs overflow-y-auto flex-1 pr-1">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Date</span>
                  <span className="font-bold text-slate-800">
                    {selectedDocDetails.data.orderDate ||
                     selectedDocDetails.data.receiveDate ||
                     selectedDocDetails.data.billDate ||
                     selectedDocDetails.data.paymentDate ||
                     selectedDocDetails.data.returnDate ||
                     selectedDocDetails.data.requestDate ||
                     'Today'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Vendor / Party</span>
                  <span className="font-bold text-slate-800">
                    {selectedDocDetails.data.supplierName || selectedDocDetails.data.department || 'Central Stores'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Warehouse</span>
                  <span className="font-bold text-slate-800">
                    {selectedDocDetails.data.warehouseName || 'Main Kitchen Store'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Status</span>
                  <span className="font-bold text-emerald-700">
                    {selectedDocDetails.data.status || 'Active / Authorized'}
                  </span>
                </div>
              </div>

              {/* Items Table if available */}
              {selectedDocDetails.data.items && Array.isArray(selectedDocDetails.data.items) && selectedDocDetails.data.items.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Item Code &amp; Name</th>
                        <th className="px-2 py-2 text-center">Quantity</th>
                        <th className="px-2 py-2 text-center">UOM</th>
                        <th className="px-3 py-2 text-right">Unit Rate</th>
                        <th className="px-3 py-2 text-right">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedDocDetails.data.items.map((it: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/60">
                          <td className="px-3 py-2 font-medium text-slate-900">
                            {it.itemCode} - {it.itemName}
                          </td>
                          <td className="px-2 py-2 text-center font-bold">
                            {it.quantity || it.acceptedQuantity || it.requestedQuantity || 0}
                          </td>
                          <td className="px-2 py-2 text-center text-slate-500 font-mono text-[11px]">
                            {it.uom}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-700">
                            ৳ {(it.unitPrice || it.estimatedUnitCost || 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-slate-900">
                            ৳ {(it.total || it.totalPrice || it.totalAmount || it.estimatedTotal || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Financial Breakdown */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex justify-between items-center">
                <div className="text-slate-500">
                  {selectedDocDetails.data.journalVoucherNumber && (
                    <span className="font-mono text-xs font-semibold text-emerald-700">
                      General Ledger Voucher: {selectedDocDetails.data.journalVoucherNumber}
                    </span>
                  )}
                  {selectedDocDetails.data.notes && (
                    <div className="text-[11px] text-slate-600 mt-1 italic">
                      Notes: {selectedDocDetails.data.notes}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Valuation</span>
                  <span className="text-lg font-bold text-emerald-700">
                    ৳ {(
                      selectedDocDetails.data.grandTotal ||
                      selectedDocDetails.data.totalAcceptedAmount ||
                      selectedDocDetails.data.totalAmount ||
                      selectedDocDetails.data.amount ||
                      selectedDocDetails.data.totalEstimatedAmount ||
                      0
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 flex-shrink-0">
              {selectedDocDetails.type === 'Purchase Order' && selectedDocDetails.data.status !== 'Fully Received' && (
                <button
                  onClick={() => {
                    handleSelectPoForGrn(selectedDocDetails.data.id);
                    setSelectedDocDetails(null);
                    setIsNewGrnModalOpen(true);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs"
                >
                  Create GRN for this PO
                </button>
              )}
              {selectedDocDetails.type === 'Purchase Bill' && selectedDocDetails.data.dueAmount > 0 && (
                <button
                  onClick={() => {
                    setPaymentForm(prev => ({
                      ...prev,
                      supplierId: selectedDocDetails.data.supplierId,
                      billId: selectedDocDetails.data.id,
                      amount: selectedDocDetails.data.dueAmount
                    }));
                    setSelectedDocDetails(null);
                    setIsNewPaymentModalOpen(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs"
                >
                  Pay this Bill
                </button>
              )}
              <button
                onClick={() => setSelectedDocDetails(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5">
          <div className={`px-4 py-3 rounded-xl shadow-xl border flex items-center gap-2.5 text-xs font-semibold ${
            toast.type === 'success' ? 'bg-emerald-800 text-white border-emerald-700' :
            toast.type === 'error' ? 'bg-rose-800 text-white border-rose-700' :
            'bg-slate-800 text-white border-slate-700'
          }`}>
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
            {toast.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-300" />}
            {toast.type === 'info' && <Sparkles className="w-4 h-4 text-indigo-300" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};
