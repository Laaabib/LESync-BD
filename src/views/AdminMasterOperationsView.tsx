import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck, Sliders, Package, CreditCard, Building2,
  Plus, Search, Filter, Edit3, Trash2, CheckCircle2, AlertTriangle,
  ArrowUpDown, ArrowUp, ArrowDown, Eye, EyeOff, RotateCcw,
  Download, FileSpreadsheet, UtensilsCrossed, Wine, Sparkles,
  Palmtree, Gift, BedDouble, Check, X, Layers, Tag, DollarSign,
  Smartphone, Landmark, Percent, Clock, Users, ChevronRight,
  HelpCircle, Shield, Key, AlertCircle, ShoppingBag, RefreshCw, Database
} from 'lucide-react';
import {
  adminMasterService,
  NavModuleDef,
  SubMenuItemDef,
  BillingOptionDef,
  GenericDepartmentItem,
  DepartmentItemType,
  BillingMethodCategory
} from '../services/adminMasterService';
import { rbacService } from '../services/rbacService';
import { pmsService } from '../services/pmsService';
import { supabaseSyncService, SupabaseSyncStatus } from '../services/supabaseSyncService';
import { DepartmentDef, OutletDef } from '../types/reportingAndRbac';
import * as XLSX from 'xlsx';

export type MasterOperationsTab =
  | 'menus'
  | 'departments'
  | 'items'
  | 'billing'
  | 'taxes';

interface AdminMasterOperationsViewProps {
  initialTab?: string;
  onNavigate?: (route: string) => void;
}

export const AdminMasterOperationsView: React.FC<AdminMasterOperationsViewProps> = ({
  initialTab = 'menus',
  onNavigate
}) => {
  // Normalize initial tab
  const normalizeTab = (tab: string): MasterOperationsTab => {
    if (tab === 'admin-menu-master' || tab === 'menus') return 'menus';
    if (tab === 'admin-departments' || tab === 'departments') return 'departments';
    if (tab === 'admin-department-items' || tab === 'items') return 'items';
    if (tab === 'admin-billing-options' || tab === 'billing') return 'billing';
    if (tab === 'admin-tax' || tab === 'taxes') return 'taxes';
    return 'menus';
  };

  const [activeTab, setActiveTab] = useState<MasterOperationsTab>(normalizeTab(initialTab));

  useEffect(() => {
    setActiveTab(normalizeTab(initialTab));
  }, [initialTab]);

  // Reactive Data from adminMasterService
  const [navModules, setNavModules] = useState<NavModuleDef[]>(() => adminMasterService.getNavModules());
  const [billingOptions, setBillingOptions] = useState<BillingOptionDef[]>(() => adminMasterService.getBillingOptions());
  const [deptItems, setDeptItems] = useState<GenericDepartmentItem[]>(() => adminMasterService.getDepartmentItems());
  const [departments, setDepartments] = useState<DepartmentDef[]>(() => rbacService.getDepartments());
  const [outlets, setOutlets] = useState<OutletDef[]>(() => rbacService.getOutlets());

  // Reload trigger
  const reloadAll = () => {
    setNavModules([...adminMasterService.getNavModules()]);
    setBillingOptions([...adminMasterService.getBillingOptions()]);
    setDeptItems([...adminMasterService.getDepartmentItems()]);
    setDepartments([...rbacService.getDepartments()]);
    setOutlets([...rbacService.getOutlets()]);
  };

  useEffect(() => {
    const unsubAdmin = adminMasterService.subscribe(reloadAll);
    const unsubRbac = rbacService.subscribe(reloadAll);
    const unsubPms = pmsService.subscribe(reloadAll);
    return () => {
      unsubAdmin();
      unsubRbac();
      unsubPms();
    };
  }, []);

  // Notifications / Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Cloud SQL & Supabase Sync State
  const [syncStatus, setSyncStatus] = useState<SupabaseSyncStatus>(() => supabaseSyncService.getStatus());
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  useEffect(() => {
    const unsubSync = supabaseSyncService.subscribe((status) => {
      setSyncStatus({ ...status });
    });
    return () => unsubSync();
  }, []);

  const handleManualCloudSync = async () => {
    setIsManualSyncing(true);
    try {
      const res = await supabaseSyncService.syncEntirePmsState();
      if (res.success) {
        showToast('Admin catalog & PMS state synced to SQL & Supabase cloud!');
      } else {
        showToast(res.message || 'Sync completed with notices.');
      }
    } catch (err: any) {
      showToast(`Cloud Sync notice: ${err?.message || 'Sync failed'}`);
    } finally {
      setIsManualSyncing(false);
    }
  };

  // -------------------------------------------------------------------------
  // TAB 1: MENU CONTROLLER STATE
  // -------------------------------------------------------------------------
  const [selectedModuleId, setSelectedModuleId] = useState<string>('front-office');
  const [menuSearchTerm, setMenuSearchTerm] = useState('');

  // Primary Navigation Module Form State
  const [isAddModuleModalOpen, setIsAddModuleModalOpen] = useState(false);
  const [isEditModuleModalOpen, setIsEditModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<NavModuleDef | null>(null);
  const [moduleFormLabel, setModuleFormLabel] = useState('');
  const [moduleFormKey, setModuleFormKey] = useState('');
  const [moduleFormIcon, setModuleFormIcon] = useState('Sliders');
  const [moduleFormBadge, setModuleFormBadge] = useState('');
  const [moduleFormBadgeColor, setModuleFormBadgeColor] = useState('bg-blue-500/20 text-blue-300 border-blue-500/30');
  const [moduleFormOrder, setModuleFormOrder] = useState<number>(10);
  const [moduleFormEnabled, setModuleFormEnabled] = useState(true);

  // SubMenu Modal State
  const [isAddSubMenuModalOpen, setIsAddSubMenuModalOpen] = useState(false);
  const [isEditSubMenuModalOpen, setIsEditSubMenuModalOpen] = useState(false);
  const [editingSubMenuParentId, setEditingSubMenuParentId] = useState<string>('');
  const [editingSubMenuItem, setEditingSubMenuItem] = useState<SubMenuItemDef | null>(null);

  // SubMenu Form
  const [subMenuFormParent, setSubMenuFormParent] = useState('front-office');
  const [subMenuFormLabel, setSubMenuFormLabel] = useState('');
  const [subMenuFormRoute, setSubMenuFormRoute] = useState('');
  const [subMenuFormIcon, setSubMenuFormIcon] = useState('FileText');
  const [subMenuFormBadge, setSubMenuFormBadge] = useState('');
  const [subMenuFormBadgeColor, setSubMenuFormBadgeColor] = useState('bg-blue-500/20 text-blue-300 border-blue-500/30');

  // -------------------------------------------------------------------------
  // TAB 2: DEPARTMENT & OUTLET MANAGEMENT STATE
  // -------------------------------------------------------------------------
  const [deptSubTab, setDeptSubTab] = useState<'departments' | 'outlets'>('departments');
  const [deptSearchTerm, setDeptSearchTerm] = useState('');
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentDef | null>(null);
  const [deptFormName, setDeptFormName] = useState('');
  const [deptFormCode, setDeptFormCode] = useState('');
  const [deptFormHeadName, setDeptFormHeadName] = useState('');
  const [deptFormHeadEmail, setDeptFormHeadEmail] = useState('');
  const [deptFormStaffCount, setDeptFormStaffCount] = useState<number>(10);
  const [deptFormActive, setDeptFormActive] = useState(true);

  // Outlet Form
  const [isOutletModalOpen, setIsOutletModalOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<OutletDef | null>(null);
  const [outletFormName, setOutletFormName] = useState('');
  const [outletFormCode, setOutletFormCode] = useState('');
  const [outletFormType, setOutletFormType] = useState<OutletDef['type']>('Restaurant');
  const [outletFormDept, setOutletFormDept] = useState<any>('Food & Beverage');
  const [outletFormGL, setOutletFormGL] = useState('4020');
  const [outletFormTerminals, setOutletFormTerminals] = useState(2);
  const [outletFormActive, setOutletFormActive] = useState(true);

  // -------------------------------------------------------------------------
  // TAB 3: DEPARTMENTAL ITEMS MASTER STATE
  // -------------------------------------------------------------------------
  const [itemDeptFilter, setItemDeptFilter] = useState<DepartmentItemType>('bar');
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [itemCategoryFilter, setItemCategoryFilter] = useState('All');
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GenericDepartmentItem | null>(null);

  // Item Form Fields
  const [itemFormDept, setItemFormDept] = useState<DepartmentItemType>('bar');
  const [itemFormName, setItemFormName] = useState('');
  const [itemFormSku, setItemFormSku] = useState('');
  const [itemFormCategory, setItemFormCategory] = useState('');
  const [itemFormDescription, setItemFormDescription] = useState('');
  const [itemFormUnit, setItemFormUnit] = useState('PCS');
  const [itemFormCost, setItemFormCost] = useState<number>(50);
  const [itemFormSalePrice, setItemFormSalePrice] = useState<number>(150);
  const [itemFormActive, setItemFormActive] = useState(true);
  // Optional domain fields
  const [itemFormAbv, setItemFormAbv] = useState<number>(0);
  const [itemFormPortion, setItemFormPortion] = useState('1 Serving');
  const [itemFormPrepTime, setItemFormPrepTime] = useState<number>(15);
  const [itemFormStation, setItemFormStation] = useState('Main Kitchen');
  const [itemFormPricingType, setItemFormPricingType] = useState<string>('Per Person');
  const [itemFormDuration, setItemFormDuration] = useState<number>(60);
  const [itemFormCapacity, setItemFormCapacity] = useState<number>(10);
  const [itemFormInstructor, setItemFormInstructor] = useState(false);
  const [itemFormIsChargeable, setItemFormIsChargeable] = useState(false);
  const [itemFormStock, setItemFormStock] = useState<number>(100);
  const [itemFormReorder, setItemFormReorder] = useState<number>(20);

  // -------------------------------------------------------------------------
  // TAB 4: BILLING OPTIONS & PAYMENT TENDERS STATE
  // -------------------------------------------------------------------------
  const [billingSearchTerm, setBillingSearchTerm] = useState('');
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [editingBilling, setEditingBilling] = useState<BillingOptionDef | null>(null);

  // Billing Form Fields
  const [billFormCode, setBillFormCode] = useState('');
  const [billFormName, setBillFormName] = useState('');
  const [billFormCategory, setBillFormCategory] = useState<BillingMethodCategory>('Cash');
  const [billFormSurcharge, setBillFormSurcharge] = useState<number>(0);
  const [billFormTax, setBillFormTax] = useState<number>(0);
  const [billFormGL, setBillFormGL] = useState('1010');
  const [billFormDescription, setBillFormDescription] = useState('');
  const [billFormRequiresAuth, setBillFormRequiresAuth] = useState(false);
  const [billFormAllowRefund, setBillFormAllowRefund] = useState(true);
  const [billFormActive, setBillFormActive] = useState(true);
  const [billFormOutlets, setBillFormOutlets] = useState<string[]>(['Front Desk', 'Restaurant', 'Bar']);

  // Billing Simulator
  const [simAmount, setSimAmount] = useState<number>(5000);
  const [simOptionId, setSimOptionId] = useState<string>('bill-opt-2');

  // -------------------------------------------------------------------------
  // HANDLERS FOR MODULES & SUB-MENUS
  // -------------------------------------------------------------------------
  const handleOpenAddModule = () => {
    setModuleFormLabel('');
    setModuleFormKey('');
    setModuleFormIcon('Sliders');
    setModuleFormBadge('');
    setModuleFormBadgeColor('bg-blue-500/20 text-blue-300 border-blue-500/30');
    setModuleFormOrder(navModules.length + 1);
    setModuleFormEnabled(true);
    setIsAddModuleModalOpen(true);
  };

  const handleOpenEditModule = (m: NavModuleDef) => {
    setEditingModule(m);
    setModuleFormLabel(m.label);
    setModuleFormKey(m.moduleKey);
    setModuleFormIcon(m.iconName || 'Sliders');
    setModuleFormBadge(m.badge || '');
    setModuleFormBadgeColor(m.badgeColor || 'bg-blue-500/20 text-blue-300 border-blue-500/30');
    setModuleFormOrder(m.order);
    setModuleFormEnabled(m.enabled);
    setIsEditModuleModalOpen(true);
  };

  const handleSaveAddModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleFormLabel.trim()) return;
    const key = moduleFormKey.trim() || moduleFormLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newMod = adminMasterService.addNavModule({
      moduleKey: key,
      label: moduleFormLabel.trim(),
      iconName: moduleFormIcon,
      badge: moduleFormBadge.trim() || undefined,
      badgeColor: moduleFormBadge.trim() ? moduleFormBadgeColor : undefined,
      enabled: moduleFormEnabled,
      order: Number(moduleFormOrder) || (navModules.length + 1)
    });
    setSelectedModuleId(newMod.id);
    showToast(`Primary Module "${moduleFormLabel}" created successfully!`);
    setIsAddModuleModalOpen(false);
  };

  const handleSaveEditModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModule || !moduleFormLabel.trim()) return;
    const key = moduleFormKey.trim() || moduleFormLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    adminMasterService.updateNavModule(editingModule.id, {
      moduleKey: key,
      label: moduleFormLabel.trim(),
      iconName: moduleFormIcon,
      badge: moduleFormBadge.trim() || undefined,
      badgeColor: moduleFormBadge.trim() ? moduleFormBadgeColor : undefined,
      enabled: moduleFormEnabled,
      order: Number(moduleFormOrder) || editingModule.order
    });
    showToast(`Primary Module "${moduleFormLabel}" updated successfully!`);
    setIsEditModuleModalOpen(false);
    setEditingModule(null);
  };

  const handleOpenAddSubMenu = (parentId?: string) => {
    setSubMenuFormParent(parentId || selectedModuleId || 'front-office');
    setSubMenuFormLabel('');
    setSubMenuFormRoute('');
    setSubMenuFormIcon('FileText');
    setSubMenuFormBadge('');
    setSubMenuFormBadgeColor('bg-blue-500/20 text-blue-300 border-blue-500/30');
    setIsAddSubMenuModalOpen(true);
  };

  const handleSaveAddSubMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subMenuFormLabel.trim()) return;

    const routeSlug = subMenuFormRoute.trim() || subMenuFormLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    adminMasterService.addSubMenu(subMenuFormParent, {
      label: subMenuFormLabel.trim(),
      iconName: subMenuFormIcon,
      targetRoute: routeSlug,
      badge: subMenuFormBadge.trim() || undefined,
      badgeColor: subMenuFormBadge.trim() ? subMenuFormBadgeColor : undefined,
      enabled: true,
      order: 99
    });

    showToast(`Sub-menu "${subMenuFormLabel}" added to navigation successfully!`);
    setIsAddSubMenuModalOpen(false);
  };

  const handleOpenEditSubMenu = (parentId: string, item: SubMenuItemDef) => {
    setEditingSubMenuParentId(parentId);
    setEditingSubMenuItem(item);
    setSubMenuFormLabel(item.label);
    setSubMenuFormRoute(item.id);
    setSubMenuFormIcon(item.iconName || 'FileText');
    setSubMenuFormBadge(item.badge || '');
    setSubMenuFormBadgeColor(item.badgeColor || 'bg-blue-500/20 text-blue-300 border-blue-500/30');
    setIsEditSubMenuModalOpen(true);
  };

  const handleSaveEditSubMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubMenuItem || !editingSubMenuParentId || !subMenuFormLabel.trim()) return;

    adminMasterService.updateSubMenu(editingSubMenuParentId, editingSubMenuItem.id, {
      label: subMenuFormLabel.trim(),
      iconName: subMenuFormIcon,
      badge: subMenuFormBadge.trim() || undefined,
      badgeColor: subMenuFormBadge.trim() ? subMenuFormBadgeColor : undefined
    });

    showToast(`Sub-menu "${subMenuFormLabel}" updated successfully!`);
    setIsEditSubMenuModalOpen(false);
    setEditingSubMenuItem(null);
  };

  const handleDeleteSubMenu = (parentId: string, item: SubMenuItemDef) => {
    if (confirm(`Are you sure you want to delete sub-menu "${item.label}" from navigation?`)) {
      adminMasterService.deleteSubMenu(parentId, item.id);
      showToast(`Sub-menu "${item.label}" deleted.`);
    }
  };

  const handleToggleSubMenu = (parentId: string, item: SubMenuItemDef) => {
    adminMasterService.toggleSubMenuVisibility(parentId, item.id, !item.enabled);
    showToast(`"${item.label}" ${!item.enabled ? 'enabled in' : 'hidden from'} sidebar.`);
  };

  const handleReorderSubMenu = (parentId: string, item: SubMenuItemDef, dir: 'up' | 'down') => {
    adminMasterService.reorderSubMenu(parentId, item.id, dir);
  };

  const handleResetNavigation = () => {
    if (confirm('Reset all menus and sub-menus to default factory configuration? Any custom sub-menus will be removed.')) {
      adminMasterService.resetNavigationToDefault();
      showToast('Navigation menus reset to factory default.');
    }
  };

  // -------------------------------------------------------------------------
  // HANDLERS FOR DEPARTMENTS & OUTLETS
  // -------------------------------------------------------------------------
  const handleOpenAddDept = () => {
    setEditingDept(null);
    setDeptFormName('');
    setDeptFormCode(`CC-${Math.floor(100 + Math.random() * 900)}`);
    setDeptFormHeadName('');
    setDeptFormHeadEmail('');
    setDeptFormStaffCount(12);
    setDeptFormActive(true);
    setIsDeptModalOpen(true);
  };

  const handleOpenEditDept = (dept: DepartmentDef) => {
    setEditingDept(dept);
    setDeptFormName(dept.name);
    setDeptFormCode(dept.code);
    setDeptFormHeadName(dept.headName);
    setDeptFormHeadEmail(dept.headEmail);
    setDeptFormStaffCount(dept.staffCount || 10);
    setDeptFormActive(dept.active);
    setIsDeptModalOpen(true);
  };

  const handleSaveDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptFormName.trim() || !deptFormCode.trim()) return;

    if (editingDept) {
      adminMasterService.updateDepartment({
        ...editingDept,
        name: deptFormName.trim() as any,
        code: deptFormCode.trim().toUpperCase(),
        costCenterCode: deptFormCode.trim().toUpperCase(),
        headName: deptFormHeadName.trim(),
        headEmail: deptFormHeadEmail.trim(),
        staffCount: Number(deptFormStaffCount) || 0,
        active: deptFormActive
      });
      showToast(`Department "${deptFormName}" updated.`);
    } else {
      adminMasterService.addDepartment({
        name: deptFormName.trim() as any,
        code: deptFormCode.trim().toUpperCase(),
        costCenterCode: deptFormCode.trim().toUpperCase(),
        headName: deptFormHeadName.trim(),
        headEmail: deptFormHeadEmail.trim(),
        staffCount: Number(deptFormStaffCount) || 0,
        active: deptFormActive
      });
      showToast(`Department "${deptFormName}" created.`);
    }
    setIsDeptModalOpen(false);
  };

  const handleDeleteDept = (dept: DepartmentDef) => {
    if (confirm(`Are you sure you want to delete department "${dept.name}" (${dept.code})? This action cannot be undone.`)) {
      adminMasterService.deleteDepartment(dept.id);
      showToast(`Department "${dept.name}" deleted.`);
    }
  };

  // Outlet handlers
  const handleOpenAddOutlet = () => {
    setEditingOutlet(null);
    setOutletFormName('');
    setOutletFormCode(`OUT-${Math.floor(10 + Math.random() * 90)}`);
    setOutletFormType('Restaurant');
    setOutletFormDept('Food & Beverage');
    setOutletFormGL('4020');
    setOutletFormTerminals(2);
    setOutletFormActive(true);
    setIsOutletModalOpen(true);
  };

  const handleOpenEditOutlet = (outlet: OutletDef) => {
    setEditingOutlet(outlet);
    setOutletFormName(outlet.name);
    setOutletFormCode(outlet.code);
    setOutletFormType(outlet.type);
    setOutletFormDept(outlet.department);
    setOutletFormGL(outlet.revenueGL);
    setOutletFormTerminals(outlet.posTerminalCount || 1);
    setOutletFormActive(outlet.active);
    setIsOutletModalOpen(true);
  };

  const handleSaveOutlet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outletFormName.trim() || !outletFormCode.trim()) return;

    if (editingOutlet) {
      adminMasterService.updateOutlet({
        ...editingOutlet,
        name: outletFormName.trim(),
        code: outletFormCode.trim().toUpperCase(),
        type: outletFormType,
        department: outletFormDept,
        revenueGL: outletFormGL.trim(),
        posTerminalCount: Number(outletFormTerminals) || 1,
        active: outletFormActive
      });
      showToast(`Outlet "${outletFormName}" updated.`);
    } else {
      adminMasterService.addOutlet({
        name: outletFormName.trim(),
        code: outletFormCode.trim().toUpperCase(),
        type: outletFormType,
        department: outletFormDept,
        revenueGL: outletFormGL.trim(),
        posTerminalCount: Number(outletFormTerminals) || 1,
        active: outletFormActive
      });
      showToast(`Outlet "${outletFormName}" created.`);
    }
    setIsOutletModalOpen(false);
  };

  const handleDeleteOutlet = (outlet: OutletDef) => {
    if (confirm(`Delete outlet "${outlet.name}" (${outlet.code})?`)) {
      adminMasterService.deleteOutlet(outlet.id);
      showToast(`Outlet "${outlet.name}" deleted.`);
    }
  };

  // -------------------------------------------------------------------------
  // HANDLERS FOR DEPARTMENTAL ITEMS MASTER (Bar, Restaurant, HK, Activities, Amenities)
  // -------------------------------------------------------------------------
  const handleOpenAddItem = (deptType: DepartmentItemType) => {
    setEditingItem(null);
    setItemFormDept(deptType);
    setItemFormName('');
    setItemFormSku(`${deptType.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`);
    setItemFormCategory(
      deptType === 'bar' ? 'Mocktails & Coolers' :
      deptType === 'restaurant' ? 'Bengali Delicacies' :
      deptType === 'housekeeping' ? 'Linen & Bedding' :
      deptType === 'activity' ? 'Water Sports' : 'Bathroom'
    );
    setItemFormDescription('');
    setItemFormUnit(deptType === 'bar' ? 'Glass' : deptType === 'restaurant' ? 'Plate' : 'PCS');
    setItemFormCost(deptType === 'housekeeping' ? 120 : 80);
    setItemFormSalePrice(deptType === 'housekeeping' ? 0 : 250);
    setItemFormActive(true);
    setItemFormAbv(0);
    setItemFormPortion(deptType === 'bar' ? '300 ml' : '1 Person');
    setItemFormPrepTime(15);
    setItemFormStation(deptType === 'bar' ? 'Beverage & Bar' : 'Main Kitchen');
    setItemFormPricingType('Per Person');
    setItemFormDuration(60);
    setItemFormCapacity(10);
    setItemFormInstructor(false);
    setItemFormIsChargeable(deptType !== 'housekeeping');
    setItemFormStock(50);
    setItemFormReorder(15);
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item: GenericDepartmentItem) => {
    setEditingItem(item);
    setItemFormDept(item.departmentType);
    setItemFormName(item.name);
    setItemFormSku(item.sku);
    setItemFormCategory(item.category);
    setItemFormDescription(item.description);
    setItemFormUnit(item.unit);
    setItemFormCost(item.costPrice);
    setItemFormSalePrice(item.salePrice);
    setItemFormActive(item.active);
    setItemFormAbv(item.abvPercent || 0);
    setItemFormPortion(item.portionSize || '1 Person');
    setItemFormPrepTime(item.prepTimeMinutes || 15);
    setItemFormStation(item.kitchenStation || 'Main Kitchen');
    setItemFormPricingType(item.pricingType || 'Per Person');
    setItemFormDuration(item.durationMinutes || 60);
    setItemFormCapacity(item.maxCapacity || 10);
    setItemFormInstructor(item.instructorRequired || false);
    setItemFormIsChargeable(item.isChargeable ?? (item.salePrice > 0));
    setItemFormStock(item.inStock || 50);
    setItemFormReorder(item.reorderLevel || 15);
    setIsItemModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemFormName.trim()) return;

    const generatedSku = `${itemFormDept.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const finalSku = itemFormSku.trim() ? itemFormSku.trim().toUpperCase() : generatedSku;

    if (editingItem) {
      adminMasterService.updateDepartmentItem(editingItem.id, {
        name: itemFormName.trim(),
        sku: finalSku,
        category: itemFormCategory.trim(),
        description: itemFormDescription.trim(),
        unit: itemFormUnit.trim(),
        costPrice: Number(itemFormCost) || 0,
        salePrice: Number(itemFormSalePrice) || 0,
        active: itemFormActive,
        abvPercent: itemFormDept === 'bar' ? Number(itemFormAbv) || 0 : undefined,
        portionSize: itemFormPortion.trim(),
        kitchenStation: itemFormStation,
        prepTimeMinutes: Number(itemFormPrepTime) || 15,
        pricingType: itemFormDept === 'activity' ? itemFormPricingType : undefined,
        durationMinutes: itemFormDept === 'activity' ? Number(itemFormDuration) : undefined,
        maxCapacity: itemFormDept === 'activity' ? Number(itemFormCapacity) : undefined,
        instructorRequired: itemFormDept === 'activity' ? itemFormInstructor : undefined,
        isChargeable: itemFormIsChargeable,
        inStock: Number(itemFormStock) || 0,
        reorderLevel: Number(itemFormReorder) || 10
      });
      showToast(`Item "${itemFormName}" updated successfully.`);
    } else {
      adminMasterService.addDepartmentItem({
        departmentType: itemFormDept,
        name: itemFormName.trim(),
        sku: itemFormSku.trim().toUpperCase(),
        category: itemFormCategory.trim(),
        description: itemFormDescription.trim(),
        unit: itemFormUnit.trim(),
        costPrice: Number(itemFormCost) || 0,
        salePrice: Number(itemFormSalePrice) || 0,
        active: itemFormActive,
        abvPercent: itemFormDept === 'bar' ? Number(itemFormAbv) || 0 : undefined,
        portionSize: itemFormPortion.trim(),
        kitchenStation: itemFormStation,
        prepTimeMinutes: Number(itemFormPrepTime) || 15,
        pricingType: itemFormDept === 'activity' ? itemFormPricingType : undefined,
        durationMinutes: itemFormDept === 'activity' ? Number(itemFormDuration) : undefined,
        maxCapacity: itemFormDept === 'activity' ? Number(itemFormCapacity) : undefined,
        instructorRequired: itemFormDept === 'activity' ? itemFormInstructor : undefined,
        isChargeable: itemFormIsChargeable,
        inStock: Number(itemFormStock) || 0,
        reorderLevel: Number(itemFormReorder) || 10,
        taxPercent: 15,
        serviceChargePercent: 10
      });
      showToast(`New ${itemFormDept} item "${itemFormName}" added.`);
      setItemDeptFilter(itemFormDept);
      setItemSearchTerm('');
      setItemCategoryFilter('All');
    }
    reloadAll();
    setIsItemModalOpen(false);
  };

  const handleDeleteItem = (item: GenericDepartmentItem) => {
    if (confirm(`Are you sure you want to permanently delete "${item.name}" (${item.sku})?`)) {
      adminMasterService.deleteDepartmentItem(item.id);
      reloadAll();
      showToast(`Item "${item.name}" deleted.`);
    }
  };

  // -------------------------------------------------------------------------
  // HANDLERS FOR BILLING OPTIONS & PAYMENT METHODS
  // -------------------------------------------------------------------------
  const handleOpenAddBilling = () => {
    setEditingBilling(null);
    setBillFormCode(`TENDER-${Math.floor(10 + Math.random() * 90)}`);
    setBillFormName('');
    setBillFormCategory('Cash');
    setBillFormSurcharge(0);
    setBillFormTax(0);
    setBillFormGL('1010');
    setBillFormDescription('');
    setBillFormRequiresAuth(false);
    setBillFormAllowRefund(true);
    setBillFormActive(true);
    setBillFormOutlets(['Front Desk', 'Restaurant', 'Bar', 'Banquet', 'Activities', 'Room Amenities']);
    setIsBillingModalOpen(true);
  };

  const handleOpenEditBilling = (option: BillingOptionDef) => {
    setEditingBilling(option);
    setBillFormCode(option.code);
    setBillFormName(option.name);
    setBillFormCategory(option.category);
    setBillFormSurcharge(option.surchargePercent);
    setBillFormTax(option.taxRatePercent);
    setBillFormGL(option.defaultGLAccountCode);
    setBillFormDescription(option.description);
    setBillFormRequiresAuth(option.requiresAuthCode);
    setBillFormAllowRefund(option.allowRefund);
    setBillFormActive(option.active);
    setBillFormOutlets(option.applicableOutlets || []);
    setIsBillingModalOpen(true);
  };

  const handleSaveBilling = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billFormName.trim() || !billFormCode.trim()) return;

    if (editingBilling) {
      adminMasterService.updateBillingOption(editingBilling.id, {
        name: billFormName.trim(),
        code: billFormCode.trim().toUpperCase(),
        category: billFormCategory,
        surchargePercent: Number(billFormSurcharge) || 0,
        taxRatePercent: Number(billFormTax) || 0,
        defaultGLAccountCode: billFormGL.trim(),
        description: billFormDescription.trim(),
        requiresAuthCode: billFormRequiresAuth,
        allowRefund: billFormAllowRefund,
        active: billFormActive,
        applicableOutlets: billFormOutlets
      });
      showToast(`Billing option "${billFormName}" updated.`);
    } else {
      adminMasterService.addBillingOption({
        name: billFormName.trim(),
        code: billFormCode.trim().toUpperCase(),
        category: billFormCategory,
        surchargePercent: Number(billFormSurcharge) || 0,
        taxRatePercent: Number(billFormTax) || 0,
        defaultGLAccountCode: billFormGL.trim(),
        description: billFormDescription.trim(),
        iconName: billFormCategory.includes('Card') ? 'CreditCard' : billFormCategory.includes('MFS') ? 'Smartphone' : 'DollarSign',
        requiresAuthCode: billFormRequiresAuth,
        allowRefund: billFormAllowRefund,
        active: billFormActive,
        applicableOutlets: billFormOutlets
      });
      showToast(`Billing option "${billFormName}" created.`);
    }
    setIsBillingModalOpen(false);
  };

  const handleDeleteBilling = (option: BillingOptionDef) => {
    if (confirm(`Delete billing option "${option.name}" (${option.code})? This will remove it from all POS and checkout cashiers.`)) {
      adminMasterService.deleteBillingOption(option.id);
      showToast(`Billing option "${option.name}" deleted.`);
    }
  };

  const handleToggleBilling = (option: BillingOptionDef) => {
    adminMasterService.toggleBillingOption(option.id, !option.active);
    showToast(`"${option.name}" ${!option.active ? 'enabled' : 'disabled'}.`);
  };

  // Export any catalog to Excel
  const exportItemsToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredDeptItems.map(item => ({
        'SKU': item.sku,
        'Name': item.name,
        'Department': item.departmentType.toUpperCase(),
        'Category': item.category,
        'Unit': item.unit,
        'Cost Price': item.costPrice,
        'Selling Price': item.salePrice,
        'Stock': item.inStock || 0,
        'Status': item.active ? 'Active' : 'Inactive',
        'Description': item.description
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Departmental Items');
    XLSX.writeFile(wb, `Departmental_Items_${itemDeptFilter}_Master.xlsx`);
  };

  // -------------------------------------------------------------------------
  // FILTERED DATASETS
  // -------------------------------------------------------------------------
  const currentModule = useMemo(() => {
    return navModules.find(m => m.id === selectedModuleId) || navModules[0];
  }, [navModules, selectedModuleId]);

  const filteredSubMenus = useMemo(() => {
    if (!currentModule) return [];
    return currentModule.children.filter(c =>
      c.label.toLowerCase().includes(menuSearchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(menuSearchTerm.toLowerCase())
    );
  }, [currentModule, menuSearchTerm]);

  const filteredDeptItems = useMemo(() => {
    return deptItems.filter(i => {
      const matchDept = i.departmentType === itemDeptFilter;
      const matchCat = itemCategoryFilter === 'All' || i.category === itemCategoryFilter;
      const matchSearch =
        i.name.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
        i.sku.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
        i.category.toLowerCase().includes(itemSearchTerm.toLowerCase());
      return matchDept && matchCat && matchSearch;
    });
  }, [deptItems, itemDeptFilter, itemCategoryFilter, itemSearchTerm]);

  const uniqueCategories = useMemo(() => {
    const cats = deptItems.filter(i => i.departmentType === itemDeptFilter).map(i => i.category);
    return ['All', ...Array.from(new Set(cats))];
  }, [deptItems, itemDeptFilter]);

  const filteredBillingOptions = useMemo(() => {
    return billingOptions.filter(b =>
      b.name.toLowerCase().includes(billingSearchTerm.toLowerCase()) ||
      b.code.toLowerCase().includes(billingSearchTerm.toLowerCase()) ||
      b.category.toLowerCase().includes(billingSearchTerm.toLowerCase()) ||
      b.defaultGLAccountCode.includes(billingSearchTerm)
    );
  }, [billingOptions, billingSearchTerm]);

  // Simulation Calculations
  const activeSimOption = useMemo(() => {
    return billingOptions.find(b => b.id === simOptionId) || billingOptions[0];
  }, [billingOptions, simOptionId]);

  const simSurcharge = activeSimOption ? (simAmount * (activeSimOption.surchargePercent || 0)) / 100 : 0;
  const simTax = activeSimOption ? (simAmount * (activeSimOption.taxRatePercent || 0)) / 100 : 0;
  const simNetPayable = simAmount + simSurcharge + simTax;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 animate-in fade-in slide-in-from-top-2 border border-emerald-400/50">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* TOP HERO BANNER: SUPER ADMIN OPERATIONAL HUB */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 p-6 shadow-2xl relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-32 w-60 h-60 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 rounded-xl font-bold shadow-lg flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-[11px] uppercase tracking-widest font-black text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                Super Admin Master Controller
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center space-x-2">
              <span>Admin Operations & Master Catalog Hub</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl">
              Complete administrative sovereignty over the entire application. Add, edit, reorder, or delete any department, departmental items (Housekeeping, Bar, Restaurant, Activities, Room Amenities), billing options & tenders, tax policies, and all sidebar menus & sub-menus in real-time.
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl px-3.5 py-2">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Active Menus</span>
              <span className="text-lg font-black font-mono text-emerald-400">{navModules.length} Modules</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl px-3.5 py-2">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Dept Items</span>
              <span className="text-lg font-black font-mono text-amber-400">{deptItems.length} Master Items</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl px-3.5 py-2">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Billing Tenders</span>
              <span className="text-lg font-black font-mono text-cyan-400">{billingOptions.filter(b => b.active).length} Active</span>
            </div>

            <button
              type="button"
              onClick={handleManualCloudSync}
              disabled={isManualSyncing || syncStatus.isSyncing}
              className="bg-indigo-600/90 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-2xl flex items-center space-x-2 border border-indigo-400/40 transition-all shadow-lg shadow-indigo-950/40 cursor-pointer disabled:opacity-50 self-center"
              title="Synchronize all admin menus, departments, items, tenders, and users directly to Cloud SQL & Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing || syncStatus.isSyncing ? 'animate-spin' : ''}`} />
              <span>{isManualSyncing || syncStatus.isSyncing ? 'Syncing...' : 'Sync with SQL & Supabase'}</span>
            </button>
          </div>
        </div>

        {/* PRIMARY NAVIGATION TABS */}
        <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto scrollbar-none text-xs">
          <button
            onClick={() => setActiveTab('menus')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'menus'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Menu & Sub-Menus Controller</span>
          </button>

          <button
            onClick={() => setActiveTab('departments')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'departments'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Departments & Outlets</span>
          </button>

          <button
            onClick={() => setActiveTab('items')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'items'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Departmental Items Master</span>
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'billing'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Billing Options & Tenders</span>
          </button>

          <button
            onClick={() => setActiveTab('taxes')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'taxes'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Taxes & Surcharge Rules</span>
          </button>

          {onNavigate && (
            <div className="flex items-center gap-1.5 pl-3 border-l border-slate-700/60">
              <button
                onClick={() => onNavigate('admin-room-types')}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 border border-cyan-500/30 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                title="Manage Room Types & Pricing"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Room Types Setup</span>
              </button>
              <button
                onClick={() => onNavigate('admin-floors')}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/30 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                title="Manage Floors & Wings"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Floor Creation</span>
              </button>
              <button
                onClick={() => onNavigate('admin-rooms')}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/30 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                title="Manage Physical Rooms"
              >
                <BedDouble className="w-3.5 h-3.5" />
                <span>Rooms Inventory</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 1. MENU & SUB-MENUS CONTROLLER TAB                                  */}
      {/* =================================================================== */}
      {activeTab === 'menus' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Primary Navigation Modules */}
          <div className="lg:col-span-4 space-y-3">
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between mb-3 gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Primary Navigation Modules</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Select module to manage sub-menus</p>
                </div>
                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    onClick={handleOpenAddModule}
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-md shadow-indigo-600/20 transition cursor-pointer"
                    title="Add New Navigation Module"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Module</span>
                  </button>
                  <button
                    onClick={handleResetNavigation}
                    title="Reset to Factory Defaults"
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1">
                {navModules.map(m => {
                  const isSelected = m.id === selectedModuleId;
                  const activeSubCount = m.children.filter(c => c.enabled).length;

                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedModuleId(m.id)}
                      className={`p-3 rounded-xl cursor-pointer transition-all border flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700/80 shadow-xs'
                          : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                        <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                          <Sliders className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{m.label}</span>
                            {m.badge && (
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold border shrink-0 ${m.badgeColor || 'bg-blue-500/20 text-blue-300'}`}>
                                {m.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block font-mono truncate">
                            {activeSubCount} of {m.children.length} sub-menus active
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModule(m);
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition cursor-pointer"
                          title="Edit Module Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            adminMasterService.toggleModuleVisibility(m.id, !m.enabled);
                            showToast(`Module "${m.label}" ${!m.enabled ? 'enabled' : 'hidden'}.`);
                          }}
                          className={`p-1 rounded-md transition cursor-pointer ${m.enabled ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30' : 'text-slate-400 hover:bg-slate-200'}`}
                          title={m.enabled ? 'Module Active in Sidebar' : 'Module Hidden'}
                        >
                          {m.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-rose-400" />}
                        </button>
                        <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Sub-Menus Management Table */}
          <div className="lg:col-span-8 space-y-4">
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Sub-Menus for: <span className="text-indigo-600 dark:text-indigo-400 underline">{currentModule?.label}</span>
                    </h3>
                    <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-mono font-bold">
                      {currentModule?.children.length} Total
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Add new sub-menus, edit labels, reorder, or toggle visibility in the sidebar.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter sub-menus..."
                      value={menuSearchTerm}
                      onChange={e => setMenuSearchTerm(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 w-44"
                    />
                  </div>

                  <button
                    onClick={() => handleOpenAddSubMenu(currentModule?.id)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-indigo-600/20 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Sub-Menu</span>
                  </button>
                </div>
              </div>

              {/* Sub-Menus Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3 text-center w-12">Order</th>
                      <th className="p-3">Sub-Menu Title</th>
                      <th className="p-3">Route Identifier</th>
                      <th className="p-3 text-center">Badge</th>
                      <th className="p-3 text-center">Sidebar Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                    {filteredSubMenus.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          No sub-menus found for this module. Click "Add Sub-Menu" above to create one.
                        </td>
                      </tr>
                    ) : (
                      filteredSubMenus.map((sub, idx) => (
                        <tr key={sub.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center space-x-0.5">
                              <button
                                onClick={() => handleReorderSubMenu(currentModule.id, sub, 'up')}
                                disabled={idx === 0}
                                title="Move Up"
                                className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-20 rounded"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleReorderSubMenu(currentModule.id, sub, 'down')}
                                disabled={idx === filteredSubMenus.length - 1}
                                title="Move Down"
                                className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-20 rounded"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white">
                            <div className="flex items-center space-x-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                              <span>{sub.label}</span>
                              {sub.isCustom && (
                                <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.2 rounded font-mono">Custom</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                            {sub.id}
                          </td>
                          <td className="p-3 text-center">
                            {sub.badge ? (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold border ${sub.badgeColor || 'bg-blue-500/20 text-blue-300'}`}>
                                {sub.badge}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">—</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleToggleSubMenu(currentModule.id, sub)}
                              className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold border transition ${
                                sub.enabled
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                              }`}
                            >
                              {sub.enabled ? 'Visible in Sidebar' : 'Hidden'}
                            </button>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => handleOpenEditSubMenu(currentModule.id, sub)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition"
                                title="Edit Sub-Menu"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSubMenu(currentModule.id, sub)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                                title="Delete Sub-Menu"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. DEPARTMENTS & OUTLETS TAB                                        */}
      {/* =================================================================== */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setDeptSubTab('departments')}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition ${
                  deptSubTab === 'departments'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Operational Departments ({departments.length})
              </button>
              <button
                onClick={() => setDeptSubTab('outlets')}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition ${
                  deptSubTab === 'outlets'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Revenue Outlets & POS Points ({outlets.length})
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={deptSearchTerm}
                  onChange={e => setDeptSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 w-48"
                />
              </div>

              {deptSubTab === 'departments' ? (
                <button
                  onClick={handleOpenAddDept}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Department</span>
                </button>
              ) : (
                <button
                  onClick={handleOpenAddOutlet}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Outlet</span>
                </button>
              )}
            </div>
          </div>

          {/* Departments Table */}
          {deptSubTab === 'departments' ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5">Code</th>
                    <th className="p-3.5">Department Name</th>
                    <th className="p-3.5">Head of Department (HOD)</th>
                    <th className="p-3.5 text-center">Staff Count</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                  {departments
                    .filter(d =>
                      d.name.toLowerCase().includes(deptSearchTerm.toLowerCase()) ||
                      d.code.toLowerCase().includes(deptSearchTerm.toLowerCase()) ||
                      d.headName.toLowerCase().includes(deptSearchTerm.toLowerCase())
                    )
                    .map(dept => (
                      <tr key={dept.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">{dept.code}</td>
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                          {dept.name}
                        </td>
                        <td className="p-3.5">
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white">{dept.headName || 'Not Assigned'}</span>
                            {dept.headEmail && (
                              <span className="text-[11px] text-slate-400 block">{dept.headEmail}</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold">{dept.staffCount || 0} Staff</td>
                        <td className="p-3.5 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                            dept.active ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400'
                          }`}>
                            {dept.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleOpenEditDept(dept)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition"
                              title="Edit Department"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteDept(dept)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                              title="Delete Department"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Outlets Table */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5">Code</th>
                    <th className="p-3.5">Outlet Name</th>
                    <th className="p-3.5">Type & Department</th>
                    <th className="p-3.5">Revenue GL Account</th>
                    <th className="p-3.5 text-center">POS Terminals</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                  {outlets
                    .filter(o =>
                      o.name.toLowerCase().includes(deptSearchTerm.toLowerCase()) ||
                      o.code.toLowerCase().includes(deptSearchTerm.toLowerCase()) ||
                      o.type.toLowerCase().includes(deptSearchTerm.toLowerCase())
                    )
                    .map(out => (
                      <tr key={out.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">{out.code}</td>
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                          {out.name}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                            {out.type} ({out.department})
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">{out.revenueGL}</td>
                        <td className="p-3.5 text-center font-mono font-bold">{out.posTerminalCount || 1} Stations</td>
                        <td className="p-3.5 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                            out.active ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400'
                          }`}>
                            {out.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleOpenEditOutlet(out)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition"
                              title="Edit Outlet"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteOutlet(out)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                              title="Delete Outlet"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* 3. DEPARTMENTAL ITEMS MASTER TAB (Bar, Restaurant, HK, Activities, Amenities) */}
      {/* =================================================================== */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          {/* Department Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <div className="flex items-center space-x-2 overflow-x-auto">
              <button
                onClick={() => { setItemDeptFilter('bar'); setItemCategoryFilter('All'); }}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition ${
                  itemDeptFilter === 'bar' ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Wine className="w-3.5 h-3.5" />
                <span>Bar & Beverages</span>
              </button>

              <button
                onClick={() => { setItemDeptFilter('restaurant'); setItemCategoryFilter('All'); }}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition ${
                  itemDeptFilter === 'restaurant' ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>Restaurant Food Menu</span>
              </button>

              <button
                onClick={() => { setItemDeptFilter('housekeeping'); setItemCategoryFilter('All'); }}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition ${
                  itemDeptFilter === 'housekeeping' ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Housekeeping Supplies</span>
              </button>

              <button
                onClick={() => { setItemDeptFilter('activity'); setItemCategoryFilter('All'); }}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition ${
                  itemDeptFilter === 'activity' ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Palmtree className="w-3.5 h-3.5" />
                <span>Activities Master</span>
              </button>

              <button
                onClick={() => { setItemDeptFilter('amenity'); setItemCategoryFilter('All'); }}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition ${
                  itemDeptFilter === 'amenity' ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Room Amenities</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={exportItemsToExcel}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1 transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={() => handleOpenAddItem(itemDeptFilter)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add {itemDeptFilter.toUpperCase()} Item</span>
              </button>
            </div>
          </div>

          {/* Search & Category Filter Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs text-xs">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Search ${itemDeptFilter} items...`}
                  value={itemSearchTerm}
                  onChange={e => setItemSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 w-56"
                />
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="text-slate-400 font-bold text-[11px]">Category:</span>
                <select
                  value={itemCategoryFilter}
                  onChange={e => setItemCategoryFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  {uniqueCategories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-slate-400 text-xs font-mono">
              Showing <span className="text-slate-900 dark:text-white font-bold">{filteredDeptItems.length}</span> items
            </div>
          </div>

          {/* Departmental Items Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5">SKU & Item Name</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5 text-center">Unit / Portion</th>
                    <th className="p-3.5 text-right">Cost Price</th>
                    <th className="p-3.5 text-right">Selling Price</th>
                    {itemDeptFilter === 'bar' && <th className="p-3.5 text-center">ABV%</th>}
                    {itemDeptFilter === 'restaurant' && <th className="p-3.5 text-center">Kitchen Station</th>}
                    {itemDeptFilter === 'activity' && <th className="p-3.5 text-center">Pricing Type</th>}
                    {itemDeptFilter === 'amenity' && <th className="p-3.5 text-center">Folio Billing</th>}
                    <th className="p-3.5 text-center">Stock / Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                  {filteredDeptItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        No items found for {itemDeptFilter}. Click "Add {itemDeptFilter.toUpperCase()} Item" above to add one.
                      </td>
                    </tr>
                  ) : (
                    filteredDeptItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            <span>{item.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 ml-4">{item.sku}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-semibold">
                            {item.category}
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-mono text-slate-500 dark:text-slate-400">
                          {item.portionSize || item.unit}
                        </td>
                        <td className="p-3.5 text-right font-mono text-slate-500">৳{(item.costPrice || 0).toLocaleString()}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {item.salePrice > 0 ? `৳${(item.salePrice || 0).toLocaleString()}` : 'Free'}
                        </td>

                        {itemDeptFilter === 'bar' && (
                          <td className="p-3.5 text-center font-mono font-bold text-amber-500">
                            {item.abvPercent ? `${item.abvPercent}%` : '0% (Non-Alc)'}
                          </td>
                        )}

                        {itemDeptFilter === 'restaurant' && (
                          <td className="p-3.5 text-center text-slate-600 dark:text-slate-400 text-[11px]">
                            {item.kitchenStation || 'Main Kitchen'}
                          </td>
                        )}

                        {itemDeptFilter === 'activity' && (
                          <td className="p-3.5 text-center">
                            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 text-[11px] font-bold">
                              {item.pricingType || 'Per Person'}
                            </span>
                          </td>
                        )}

                        {itemDeptFilter === 'amenity' && (
                          <td className="p-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                              item.isChargeable
                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {item.isChargeable ? 'Chargeable' : 'Complimentary'}
                            </span>
                          </td>
                        )}

                        <td className="p-3.5 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                            item.active ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500'
                          }`}>
                            {item.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleOpenEditItem(item)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition"
                              title="Edit Item"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 4. BILLING OPTIONS & PAYMENT TENDERS TAB                             */}
      {/* =================================================================== */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Payment Tenders & Billing Options</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Configure payment gateways, merchant QR, POS card swipe, corporate credit ledger, and surcharges.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search billing options..."
                  value={billingSearchTerm}
                  onChange={e => setBillingSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 w-56"
                />
              </div>

              <button
                onClick={handleOpenAddBilling}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Payment Option</span>
              </button>
            </div>
          </div>

          {/* Billing Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBillingOptions.map(opt => (
              <div
                key={opt.id}
                className={`p-4 rounded-2xl border transition-all ${
                  opt.active
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
                    : 'bg-slate-50/70 dark:bg-slate-950/70 border-dashed border-slate-300 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">{opt.name}</h4>
                      <span className="text-[10px] font-mono text-slate-400 block">{opt.code} • {opt.category}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleBilling(opt)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      opt.active
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                    }`}
                  >
                    {opt.active ? 'Active' : 'Disabled'}
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 line-clamp-2">
                  {opt.description}
                </p>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Surcharge Fee:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{opt.surchargePercent}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">GL Mapping:</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">Acc {opt.defaultGLAccountCode}</span>
                  </div>
                </div>

                <div className="mt-2 text-[10px] text-slate-400">
                  <span className="font-semibold">Outlets: </span>
                  <span>{opt.applicableOutlets?.join(', ') || 'All'}</span>
                </div>

                <div className="flex items-center justify-end space-x-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleOpenEditBilling(opt)}
                    className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg text-xs font-semibold flex items-center space-x-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteBilling(opt)}
                    className="px-2.5 py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-xs font-semibold flex items-center space-x-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Billing Surcharge & Tax Calculation Simulator */}
          <div className="p-5 bg-gradient-to-br from-indigo-900/30 via-slate-900/40 to-slate-950/40 border border-indigo-500/20 rounded-2xl">
            <div className="flex items-center space-x-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Live Tender Surcharge & Billing Calculator
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Test Bill Amount (৳)</label>
                <input
                  type="number"
                  value={simAmount}
                  onChange={e => setSimAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Select Payment Tender</label>
                <select
                  value={simOptionId}
                  onChange={e => setSimOptionId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                >
                  {billingOptions.filter(b => b.active).map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.surchargePercent}% Surcharge)
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-900/80 border border-indigo-500/30 rounded-xl p-3 flex flex-col justify-center">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Surcharge ({activeSimOption?.surchargePercent}%):</span>
                  <span className="font-mono text-amber-400">৳{simSurcharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-white text-xs mt-1 pt-1 border-t border-slate-800">
                  <span>Net Charged to Guest:</span>
                  <span className="font-mono text-emerald-400 text-sm">৳{simNetPayable.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 5. TAXES & SURCHARGE RULES TAB                                      */}
      {/* =================================================================== */}
      {activeTab === 'taxes' && (
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tax Policies & Service Charge Engine</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure Value Added Tax (VAT), Service Charge (SC), and Supplemental Duties across all hotel outlets.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <span className="text-xs font-bold text-slate-900 dark:text-white block mb-1">Standard National VAT</span>
              <p className="text-[11px] text-slate-400 mb-3">NBR mandated VAT on resort hospitality & catering.</p>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  defaultValue={15}
                  className="w-24 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold text-center font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                <span className="font-bold text-slate-500">% Percentage</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <span className="text-xs font-bold text-slate-900 dark:text-white block mb-1">Hotel Service Charge</span>
              <p className="text-[11px] text-slate-400 mb-3">Employee welfare & service charge pool rate.</p>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  defaultValue={10}
                  className="w-24 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold text-center font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                <span className="font-bold text-slate-500">% Percentage</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: ADD / EDIT PRIMARY NAVIGATION MODULE                         */}
      {/* =================================================================== */}
      {(isAddModuleModalOpen || isEditModuleModalOpen) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {isEditModuleModalOpen ? 'Edit Navigation Module' : 'Add New Navigation Module'}
              </h3>
              <button
                onClick={() => { setIsAddModuleModalOpen(false); setIsEditModuleModalOpen(false); }}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={isEditModuleModalOpen ? handleSaveEditModule : handleSaveAddModule} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Module Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Security & Facilities"
                  value={moduleFormLabel}
                  onChange={e => setModuleFormLabel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Module Key / Unique Identifier</label>
                <input
                  type="text"
                  placeholder="e.g. security-facilities"
                  value={moduleFormKey}
                  disabled={isEditModuleModalOpen}
                  onChange={e => setModuleFormKey(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-[11px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Module Icon</label>
                  <select
                    value={moduleFormIcon}
                    onChange={e => setModuleFormIcon(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  >
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="Sliders">Sliders / Controls</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="ShieldCheck">Shield / Security</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="Building2">Building / Facility</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="Layers">Layers / Architecture</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="BedDouble">Rooms / Lodging</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="UtensilsCrossed">Dining / Food</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="Users">Users / HR</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="CreditCard">Billing / Finance</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="Sparkles">Sparkles / Luxury</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="Package">Package / Inventory</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Display Order</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={moduleFormOrder}
                    onChange={e => setModuleFormOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 font-mono transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Badge Tag (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. NEW / PRO"
                    value={moduleFormBadge}
                    onChange={e => setModuleFormBadge(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Badge Color</label>
                  <select
                    value={moduleFormBadgeColor}
                    onChange={e => setModuleFormBadgeColor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-[11px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  >
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="bg-blue-500/20 text-blue-300 border-blue-500/30">Blue</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Emerald</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="bg-amber-500/20 text-amber-300 border-amber-500/30">Amber</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="bg-rose-500/20 text-rose-300 border-rose-500/30">Rose</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="bg-purple-500/20 text-purple-300 border-purple-500/30">Purple</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-100 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={moduleFormEnabled}
                    onChange={e => setModuleFormEnabled(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Active in Primary Navigation</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">If unchecked, this module will be hidden from the sidebar menu.</span>
                  </div>
                </label>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => { setIsAddModuleModalOpen(false); setIsEditModuleModalOpen(false); }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  {isEditModuleModalOpen ? 'Save Module' : 'Create Module'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: ADD / EDIT SUB-MENU                                          */}
      {/* =================================================================== */}
      {(isAddSubMenuModalOpen || isEditSubMenuModalOpen) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {isEditSubMenuModalOpen ? 'Edit Navigation Sub-Menu' : 'Add New Navigation Sub-Menu'}
              </h3>
              <button
                onClick={() => { setIsAddSubMenuModalOpen(false); setIsEditSubMenuModalOpen(false); }}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={isEditSubMenuModalOpen ? handleSaveEditSubMenu : handleSaveAddSubMenu} className="p-5 space-y-4 text-xs">
              {!isEditSubMenuModalOpen && (
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Parent Module *</label>
                  <select
                    value={subMenuFormParent}
                    onChange={e => setSubMenuFormParent(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  >
                    {navModules.map(m => (
                      <option key={m.id} value={m.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{m.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Sub-Menu Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Lounges / Minibar Master"
                  value={subMenuFormLabel}
                  onChange={e => setSubMenuFormLabel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Route Slug / Target Route</label>
                <input
                  type="text"
                  placeholder="e.g. vip-lounges"
                  value={subMenuFormRoute}
                  disabled={isEditSubMenuModalOpen}
                  onChange={e => setSubMenuFormRoute(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-[11px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Badge Tag (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. NEW / VIP"
                    value={subMenuFormBadge}
                    onChange={e => setSubMenuFormBadge(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Badge Color</label>
                  <select
                    value={subMenuFormBadgeColor}
                    onChange={e => setSubMenuFormBadgeColor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-[11px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  >
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="bg-blue-500/20 text-blue-300 border-blue-500/30">Blue</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Emerald</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="bg-amber-500/20 text-amber-300 border-amber-500/30">Amber</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="bg-rose-500/20 text-rose-300 border-rose-500/30">Rose</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="bg-purple-500/20 text-purple-300 border-purple-500/30">Purple</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => { setIsAddSubMenuModalOpen(false); setIsEditSubMenuModalOpen(false); }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  {isEditSubMenuModalOpen ? 'Save Changes' : 'Create Sub-Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: ADD / EDIT DEPARTMENT                                        */}
      {/* =================================================================== */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingDept ? `Edit Department (${editingDept.code})` : 'Create New Department'}
              </h3>
              <button
                onClick={() => setIsDeptModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDept} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Department Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Recreation"
                    value={deptFormName}
                    onChange={e => setDeptFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Code / Cost Center *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CC-301"
                    value={deptFormCode}
                    onChange={e => setDeptFormCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono uppercase text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Head of Department (HOD)</label>
                  <input
                    type="text"
                    placeholder="Manager Name"
                    value={deptFormHeadName}
                    onChange={e => setDeptFormHeadName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">HOD Email</label>
                  <input
                    type="email"
                    placeholder="hod@resort.com"
                    value={deptFormHeadEmail}
                    onChange={e => setDeptFormHeadEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Staff Count</label>
                  <input
                    type="number"
                    value={deptFormStaffCount}
                    onChange={e => setDeptFormStaffCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Status</label>
                  <select
                    value={deptFormActive ? 'active' : 'inactive'}
                    onChange={e => setDeptFormActive(e.target.value === 'active')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  >
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="active">Active</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  {editingDept ? 'Save Department' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: ADD / EDIT OUTLET                                            */}
      {/* =================================================================== */}
      {isOutletModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingOutlet ? `Edit Outlet (${editingOutlet.code})` : 'Create Revenue Outlet'}
              </h3>
              <button
                onClick={() => setIsOutletModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOutlet} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Outlet Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Moonlight Lounge"
                    value={outletFormName}
                    onChange={e => setOutletFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OUT-BAR-2"
                    value={outletFormCode}
                    onChange={e => setOutletFormCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono uppercase text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Outlet Type</label>
                  <select
                    value={outletFormType}
                    onChange={e => setOutletFormType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  >
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="Restaurant">Restaurant</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="Bar">Bar</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="Banquet">Banquet</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="Spa">Spa & Wellness</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="Activities">Activities / Sports</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="Housekeeping">Housekeeping Store</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Revenue GL Account</label>
                  <input
                    type="text"
                    placeholder="e.g. 4020"
                    value={outletFormGL}
                    onChange={e => setOutletFormGL(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">POS Terminals</label>
                  <input
                    type="number"
                    value={outletFormTerminals}
                    onChange={e => setOutletFormTerminals(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Status</label>
                  <select
                    value={outletFormActive ? 'active' : 'inactive'}
                    onChange={e => setOutletFormActive(e.target.value === 'active')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  >
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="active">Active</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsOutletModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  {editingOutlet ? 'Save Outlet' : 'Create Outlet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: ADD / EDIT DEPARTMENTAL ITEM (BAR, REST, HK, ACT, AMENITY)   */}
      {/* =================================================================== */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                {editingItem ? `Edit ${itemFormDept} Item (${editingItem.sku})` : `Add New ${itemFormDept.toUpperCase()} Item`}
              </h3>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 space-y-3.5 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Signature Mocktail / King Linen"
                    value={itemFormName}
                    onChange={e => setItemFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
                      <span>SKU / Item Code</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        Auto-Generated
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setItemFormSku(`SKU-${itemFormDept.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`)}
                      className="text-[11px] font-semibold text-amber-500 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Regenerate</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. BAR-001"
                      value={itemFormSku}
                      onChange={e => setItemFormSku(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono uppercase font-bold text-amber-600 dark:text-amber-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setItemFormSku(`SKU-${itemFormDept.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-amber-400 cursor-pointer"
                      title="Click to regenerate unique SKU"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    Auto-generated unique SKU. Users never need to type.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mocktails / Bengali / Linen"
                    value={itemFormCategory}
                    onChange={e => setItemFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Unit / Serving</label>
                  <input
                    type="text"
                    placeholder="e.g. Glass / Plate / PCS"
                    value={itemFormUnit}
                    onChange={e => setItemFormUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Cost Price (৳)</label>
                  <input
                    type="number"
                    value={itemFormCost}
                    onChange={e => setItemFormCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Selling / Guest Price (৳)</label>
                  <input
                    type="number"
                    value={itemFormSalePrice}
                    onChange={e => setItemFormSalePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-emerald-600 dark:text-emerald-400 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Domain Specific Fields */}
              {itemFormDept === 'bar' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <div>
                    <label className="block text-amber-500 font-bold mb-1">Alcohol by Volume (ABV %)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="0 for non-alcoholic"
                      value={itemFormAbv}
                      onChange={e => setItemFormAbv(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-amber-500 font-bold mb-1">Portion Size</label>
                    <input
                      type="text"
                      placeholder="e.g. 330 ml / 60 ml peg"
                      value={itemFormPortion}
                      onChange={e => setItemFormPortion(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              {itemFormDept === 'restaurant' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                  <div>
                    <label className="block text-indigo-500 font-bold mb-1">Kitchen Station / KOT</label>
                    <select
                      value={itemFormStation}
                      onChange={e => setItemFormStation(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                    >
                      <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="Main Kitchen">Main Kitchen</option>
                      <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="Tandoor & Curries">Tandoor & Curries</option>
                      <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="Continental & Grills">Continental & Grills</option>
                      <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="Bakery & Dessert">Bakery & Dessert</option>
                      <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="Beverage & Bar">Beverage & Bar</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-indigo-500 font-bold mb-1">Prep Time (Minutes)</label>
                    <input
                      type="number"
                      value={itemFormPrepTime}
                      onChange={e => setItemFormPrepTime(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              {itemFormDept === 'activity' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div>
                    <label className="block text-emerald-500 font-bold mb-1">Pricing Billing Model</label>
                    <select
                      value={itemFormPricingType}
                      onChange={e => setItemFormPricingType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                    >
                      <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="Per Person">Per Person</option>
                      <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="Per Hour">Per Hour</option>
                      <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="Flat Fee">Flat Fee</option>
                      <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="Per Session">Per Session</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-emerald-500 font-bold mb-1">Max Capacity / Slot</label>
                    <input
                      type="number"
                      value={itemFormCapacity}
                      onChange={e => setItemFormCapacity(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              {itemFormDept === 'amenity' && (
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={itemFormIsChargeable}
                      onChange={e => setItemFormIsChargeable(e.target.checked)}
                      className="rounded border-slate-700 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="font-bold text-purple-400">Post Charge directly to Room Folio Ledger</span>
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1 ml-6">
                    If checked, guest will be billed automatically upon issuance or checkout.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Ingredients, preparation notes, or guest amenities policy..."
                  value={itemFormDescription}
                  onChange={e => setItemFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  {editingItem ? 'Save Item Changes' : 'Add Item to Master'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: ADD / EDIT BILLING OPTION                                    */}
      {/* =================================================================== */}
      {isBillingModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingBilling ? `Edit Payment Tender (${editingBilling.code})` : 'Create New Payment Tender'}
              </h3>
              <button
                onClick={() => setIsBillingModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBilling} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Tender Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Visa / bKash QR"
                    value={billFormName}
                    onChange={e => setBillFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VISA_POS"
                    value={billFormCode}
                    onChange={e => setBillFormCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono uppercase text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Payment Category</label>
                  <select
                    value={billFormCategory}
                    onChange={e => setBillFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  >
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="Cash">Cash</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="Credit Card">Credit Card</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="Mobile Financial Services (MFS)">Mobile Financial Services (MFS)</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="Bank Transfer / Wire">Bank Transfer / Wire</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="Direct Billing (City Ledger)">Direct Billing (City Ledger)</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="Internal Folio / Voucher">Internal Folio / Voucher</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Default GL Account</label>
                  <input
                    type="text"
                    placeholder="e.g. 1010 or 1020"
                    value={billFormGL}
                    onChange={e => setBillFormGL(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Surcharge Fee %</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={billFormSurcharge}
                    onChange={e => setBillFormSurcharge(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Status</label>
                  <select
                    value={billFormActive ? 'active' : 'inactive'}
                    onChange={e => setBillFormActive(e.target.value === 'active')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  >
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="active">Active (Available in POS)</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="inactive">Disabled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Description & Cashier Instructions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Swiped on City Bank EDC Terminal, verify customer signature."
                  value={billFormDescription}
                  onChange={e => setBillFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsBillingModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  {editingBilling ? 'Save Changes' : 'Create Billing Option'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
