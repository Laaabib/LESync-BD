import React, { useState, useEffect, useMemo } from 'react';
import {
  UtensilsCrossed, Plus, Minus, Trash2, CreditCard,
  BedDouble, CheckCircle2, Search, ShoppingBag, Receipt,
  Clock, ShieldAlert, AlertCircle, Printer, Wine, Coffee,
  FileText, History, Check, X, Lock, Grid3X3, ChefHat,
  Percent, Gift, Ban, ArrowRightLeft, DollarSign, BarChart3,
  Users, RefreshCw, Layers, Sliders, Download, Eye,
  Building2, Sparkles, Filter, AlertTriangle, ChevronRight,
  Calculator, CheckSquare, ClipboardList, BookOpen, ArrowRight,
  Hotel, RotateCcw
} from 'lucide-react';
import { pmsService } from '../services/pmsService';
import { PmsDatabaseState } from '../services/mockPmsDatabase';
import { RestaurantOrder, Stay } from '../types/pms';
import { inventoryMenuService } from '../services/inventoryMenuService';
import { MenuItemEnhanced } from '../types/inventoryMenu';
import * as XLSX from 'xlsx';

interface MenuItem {
  id: string;
  menuCode?: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  station: string;
  description: string;
  isPopular?: boolean;
  maxProduciblePortions?: number;
  availability?: string;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'm1', name: 'CCULB Traditional Kacchi Biryani', category: 'Bengali', price: 650, cost: 280, station: 'Main Kitchen', description: 'Fragrant aromatic basmati with mutton, potato & boiled egg', isPopular: true },
  { id: 'm2', name: 'Hilsa Mustard Curry (Shorshe Ilish)', category: 'Bengali', price: 850, cost: 420, station: 'Main Kitchen', description: 'Fresh Meghna river Hilsa with mustard paste & green chili', isPopular: true },
  { id: 'm3', name: 'Grilled Chicken Steak w/ Mashed Potato', category: 'Continental', price: 720, cost: 310, station: 'Continental & Grills', description: 'Herb marinated boneless breast with mushroom sauce' },
  { id: 'm4', name: 'Club Sandwich with French Fries', category: 'Continental', price: 420, cost: 160, station: 'Continental & Grills', description: 'Triple-decker chicken, egg, cheese and crisp lettuce' },
  { id: 'm5', name: 'Continental Buffet Breakfast', category: 'Breakfast', price: 550, cost: 210, station: 'Continental & Grills', description: 'Eggs to order, chicken sausage, toast, jam & juice' },
  { id: 'm6', name: 'Traditional Paratha & Beef Bhuna', category: 'Breakfast', price: 480, cost: 200, station: 'Main Kitchen', description: 'Layered butter paratha with slow-cooked beef masala', isPopular: true },
  { id: 'm7', name: 'Fresh Seasonal Green Coconut Water', category: 'Bar & Drinks', price: 120, cost: 45, station: 'Beverage & Bar', description: 'Chilled natural Daab water' },
  { id: 'm8', name: 'Resort Special Cold Coffee with Ice Cream', category: 'Bar & Drinks', price: 240, cost: 90, station: 'Beverage & Bar', description: 'Rich espresso blend topped with vanilla scoop' },
  { id: 'm9', name: 'Blue Lagoon Mocktail & Citrus Cooler', category: 'Bar & Drinks', price: 280, cost: 85, station: 'Beverage & Bar', description: 'Curacao blend, lime, mint & sparkling soda' },
  { id: 'm10', name: 'Warm Chocolate Lava Cake', category: 'Dessert', price: 320, cost: 110, station: 'Bakery & Dessert', description: 'Molten chocolate center with vanilla bean cream' },
  { id: 'm11', name: 'Chicken Butter Masala & Garlic Naan', category: 'Bengali', price: 580, cost: 240, station: 'Tandoor & Curries', description: 'Tender tandoor chicken in rich tomato butter gravy with 2 naans' },
  { id: 'm12', name: 'Crispy Calamari Rings with Tartar Dip', category: 'Snacks', price: 490, cost: 190, station: 'Continental & Grills', description: 'Golden batter fried squid rings with homemade herb tartar' },
  { id: 'm13', name: 'Fresh Fruit Platter (Seasonal Assortment)', category: 'Dessert', price: 350, cost: 130, station: 'Bakery & Dessert', description: 'Chilled slices of papaya, pineapple, apple, watermelon and grapes' },
  { id: 'm14', name: 'Special Masala Chai & Bakery Biscuits', category: 'Bar & Drinks', price: 90, cost: 25, station: 'Beverage & Bar', description: 'Brewed milk tea with cardamom, cinnamon, cloves and cookies' }
];

const RESTAURANT_TABLES = [
  { id: 'T-01', name: 'Table 01', zone: 'Main Dining Hall', capacity: 4, shape: 'Square' },
  { id: 'T-02', name: 'Table 02', zone: 'Main Dining Hall', capacity: 4, shape: 'Square' },
  { id: 'T-03', name: 'Table 03', zone: 'Main Dining Hall', capacity: 2, shape: 'Round' },
  { id: 'T-04', name: 'Table 04', zone: 'Main Dining Hall', capacity: 6, shape: 'Rectangle' },
  { id: 'T-05', name: 'Table 05', zone: 'Terrace Garden View', capacity: 4, shape: 'Round' },
  { id: 'T-06', name: 'Table 06', zone: 'Terrace Garden View', capacity: 4, shape: 'Round' },
  { id: 'T-07', name: 'Table 07', zone: 'Terrace Garden View', capacity: 8, shape: 'Rectangle' },
  { id: 'T-08', name: 'Table 08', zone: 'Poolside Veranda', capacity: 4, shape: 'Round' },
  { id: 'T-09', name: 'Table 09', zone: 'Poolside Veranda', capacity: 6, shape: 'Rectangle' },
  { id: 'T-10', name: 'VIP Booth 01', zone: 'Executive Lounge', capacity: 6, shape: 'Booth' },
  { id: 'T-11', name: 'VIP Booth 02', zone: 'Executive Lounge', capacity: 8, shape: 'Booth' },
  { id: 'T-12', name: 'Bar Counter 01', zone: 'Bar & Lounge', capacity: 2, shape: 'High Top' },
  { id: 'T-13', name: 'Bar Counter 02', zone: 'Bar & Lounge', capacity: 2, shape: 'High Top' },
  { id: 'T-14', name: 'Bar Counter 03', zone: 'Bar & Lounge', capacity: 4, shape: 'High Top' }
];

const MODIFIER_OPTIONS = [
  { id: 'mod-1', name: 'Extra Cheese', price: 80 },
  { id: 'mod-2', name: 'Spicy / Extra Hot', price: 0 },
  { id: 'mod-3', name: 'Mushroom Sauce', price: 120 },
  { id: 'mod-4', name: 'Sugar Free', price: 0 },
  { id: 'mod-5', name: 'No Onion / No Garlic', price: 0 },
  { id: 'mod-6', name: 'Extra French Fries', price: 100 }
];

const DISCOUNT_RULES = [
  { id: 'd-1', name: 'Corporate Account 10%', percent: 10, code: 'CORP10', description: 'Standard corporate partner discount' },
  { id: 'd-2', name: 'Resort Club Member 15%', percent: 15, code: 'CLUB15', description: 'CCULB privileged membership card holders' },
  { id: 'd-3', name: 'General Manager Special 20%', percent: 20, code: 'GM20', description: 'Requires GM/Duty Manager authorization' },
  { id: 'd-4', name: 'Staff Duty Discount 25%', percent: 25, code: 'STAFF25', description: 'Staff cafeteria & employee meal rate' }
];

interface RestaurantViewProps {
  initialTab?: string;
  outletType?: 'restaurant' | 'bar';
  onPrintInvoice?: (orderOrInvoice: any) => void;
  onNavigate?: (route: string) => void;
}

export const RestaurantView: React.FC<RestaurantViewProps> = ({
  initialTab = 'pos',
  outletType = 'restaurant',
  onPrintInvoice,
  onNavigate
}) => {
  const [db, setDb] = useState<PmsDatabaseState>(pmsService.getState());

  // Normalize Tab
  const normalizeTab = (tab: string) => {
    if (tab.includes('pos')) return 'pos';
    if (tab.includes('table')) return 'tables';
    if (tab.includes('order')) return 'orders';
    if (tab.includes('kot')) return 'kot';
    if (tab.includes('menu') || tab.includes('catalog')) return 'menu';
    if (tab.includes('modifier')) return 'modifiers';
    if (tab.includes('discount')) return 'discounts';
    if (tab.includes('complimentary')) return 'complimentary';
    if (tab.includes('void')) return 'voids';
    if (tab.includes('settlement')) return 'settlements';
    if (tab.includes('report')) return 'reports';
    return 'pos';
  };

  const [activeTab, setActiveTab] = useState<string>(normalizeTab(initialTab));

  useEffect(() => {
    setActiveTab(normalizeTab(initialTab));
  }, [initialTab]);

  useEffect(() => {
    return pmsService.subscribe(setDb);
  }, []);

  // Enhanced Master Menu Catalog state
  const [enhancedMenuItems, setEnhancedMenuItems] = useState<MenuItemEnhanced[]>(() => {
    const list = inventoryMenuService.getEnhancedMenuItems();
    return list.length > 0 ? list : inventoryMenuService.resetToSeedMenuItems();
  });
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>('All');
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [tableZoneFilter, setTableZoneFilter] = useState<string>('All Zones');

  useEffect(() => {
    const unsubMenu = inventoryMenuService.subscribe(() => {
      setEnhancedMenuItems([...inventoryMenuService.getEnhancedMenuItems()]);
    });
    return unsubMenu;
  }, []);

  // POS State
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchMenu, setSearchMenu] = useState<string>('');
  const [mobilePosTab, setMobilePosTab] = useState<'menu' | 'cart'>('menu');
  const [cart, setCart] = useState<{ item: MenuItem; quantity: number; selectedModifiers: string[] }[]>([]);
  const [orderType, setOrderType] = useState<'in-room-dining' | 'restaurant-table' | 'bar-lounge' | 'takeaway'>(
    outletType === 'bar' ? 'bar-lounge' : 'restaurant-table'
  );
  const [selectedStayId, setSelectedStayId] = useState<string>('');
  const [tableNumber, setTableNumber] = useState<string>('Table 01');
  const [deliverySchedule, setDeliverySchedule] = useState<string>('Immediate (15-20 mins)');
  const [includeTrayCharge, setIncludeTrayCharge] = useState<boolean>(true);
  const [kitchenNotes, setKitchenNotes] = useState<string>('');
  const [billingMethod, setBillingMethod] = useState<'room-charge' | 'direct-pay'>('direct-pay');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Credit Card' | 'bKash / Mobile Pay' | 'City Ledger'>('Cash');
  const [appliedDiscount, setAppliedDiscount] = useState<{ percent: number; name: string } | null>(null);
  const [isComplimentaryOrder, setIsComplimentaryOrder] = useState<boolean>(false);
  const [complimentaryJustification, setComplimentaryJustification] = useState<string>('');

  // Notification and Active Objects
  const [successMessage, setSuccessMessage] = useState('');
  const [lastBilledOrder, setLastBilledOrder] = useState<RestaurantOrder | null>(null);

  // Voiding State
  const [orderToVoid, setOrderToVoid] = useState<RestaurantOrder | null>(null);
  const [voidReason, setVoidReason] = useState<string>('Guest Changed Mind');
  const [customVoidReason, setCustomVoidReason] = useState<string>('');
  const [supervisorPin, setSupervisorPin] = useState<string>('');
  const [voidError, setVoidError] = useState<string>('');

  // Settlement & Resettlement State
  const [settlementSubTab, setSettlementSubTab] = useState<'open-bills' | 'resettlement' | 'shift-close'>('open-bills');
  const [orderToSettle, setOrderToSettle] = useState<RestaurantOrder | null>(null);
  const [settlePaymentMethod, setSettlePaymentMethod] = useState<string>('Cash');
  const [tenderCashAmount, setTenderCashAmount] = useState<number>(0);
  const [settleStayId, setSettleStayId] = useState<string>('');
  const [settleDiscountPct, setSettleDiscountPct] = useState<number>(0);

  // Resettlement Modal State
  const [orderToResettle, setOrderToResettle] = useState<RestaurantOrder | null>(null);
  const [resettleNewMethod, setResettleNewMethod] = useState<string>('Credit Card');
  const [resettleReason, setResettleReason] = useState<string>('Guest Requested Payment Method Change to Corporate Card');
  const [resettleStayId, setResettleStayId] = useState<string>('');
  const [resettleSupervisorAuth, setResettleSupervisorAuth] = useState<string>('');

  // KOT Station Filter
  const [kotStationFilter, setKotStationFilter] = useState<string>('All');

  const [roomSearchQuery, setRoomSearchQuery] = useState('');

  const inHouseStays = useMemo(() => db.stays.filter(s => s.status === 'Active'), [db.stays]);
  const selectedStay = useMemo(() => inHouseStays.find(s => s.id === selectedStayId), [inHouseStays, selectedStayId]);
  const isSelectedStayStopPost = !!selectedStay?.stopPost;

  const filteredInHouseStays = useMemo(() => {
    if (!roomSearchQuery.trim()) return inHouseStays;
    const q = roomSearchQuery.toLowerCase();
    return inHouseStays.filter(s =>
      s.roomNumber.toLowerCase().includes(q) ||
      s.guestName.toLowerCase().includes(q) ||
      (s.roomTypeName && s.roomTypeName.toLowerCase().includes(q))
    );
  }, [inHouseStays, roomSearchQuery]);

  const selectedStayFolio = useMemo(() => {
    if (!selectedStay?.folioId) return null;
    return db.folios.find(f => f.id === selectedStay.folioId) || null;
  }, [db.folios, selectedStay]);

  const selectedStayFolioBalance = useMemo(() => {
    if (!selectedStayFolio) return 0;
    return selectedStayFolio.balance ?? ((selectedStayFolio.grandTotal || 0) - (selectedStayFolio.paidTotal || 0));
  }, [selectedStayFolio]);

  // Cart Calculation
  const rawSubtotal = cart.reduce((sum, i) => sum + i.item.price * i.quantity, 0);
  const trayCharge = (orderType === 'in-room-dining' && includeTrayCharge) ? 100 : 0;
  const initialSub = rawSubtotal + trayCharge;
  const discountAmt = isComplimentaryOrder
    ? initialSub
    : appliedDiscount
    ? Math.round(initialSub * (appliedDiscount.percent / 100))
    : 0;
  const taxableSubtotal = Math.max(0, initialSub - discountAmt);
  const vat = isComplimentaryOrder ? 0 : Math.round(taxableSubtotal * 0.15);
  const serviceCharge = isComplimentaryOrder ? 0 : Math.round(taxableSubtotal * 0.10);
  const grandTotal = isComplimentaryOrder ? 0 : (taxableSubtotal + vat + serviceCharge);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.item.id === item.id);
      if (existing) {
        return prev.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { item, quantity: 1, selectedModifiers: [] }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(i => {
          if (i.item.id === itemId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as { item: MenuItem; quantity: number; selectedModifiers: string[] }[];
    });
  };

  const handleOpenSettleModal = (order: RestaurantOrder) => {
    setOrderToSettle(order);
    if (order.paymentMethod === 'Room Folio' || order.stayId) {
      setSettlePaymentMethod('Room Folio');
      setSettleStayId(order.stayId || '');
    } else {
      setSettlePaymentMethod('Cash');
      setSettleStayId(order.stayId || '');
    }
    setTenderCashAmount(order.total || 0);
  };

  const handleOpenResettleModal = (order: RestaurantOrder) => {
    setOrderToResettle(order);
    setResettleNewMethod(order.paymentMethod === 'Room Folio' ? 'Credit Card' : 'Room Folio');
    setResettleStayId(order.stayId || '');
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const isRoomCharge = billingMethod === 'room-charge' || (orderType === 'in-room-dining' && billingMethod !== 'direct-pay');

    if (isRoomCharge) {
      if (!selectedStayId || !selectedStay) {
        alert('Please select an active In-House Room / Guest to charge this POS order to.');
        return;
      }
      if (selectedStay.stopPost) {
        alert(`Cannot charge to Room ${selectedStay.roomNumber}: STOP POST restriction is active (${selectedStay.stopPostReason || 'Outlet charges restricted by Front Office'}). Please collect Direct Payment (Cash, Card, or Mobile Pay).`);
        return;
      }
    }

    const guestName = isRoomCharge && selectedStay
      ? selectedStay.guestName
      : `${tableNumber} Customer`;

    const roomNumber = isRoomCharge && selectedStay
      ? selectedStay.roomNumber
      : undefined;

    const folioId = isRoomCharge && selectedStay
      ? selectedStay.folioId
      : undefined;

    try {
      const order = pmsService.createRestaurantOrder({
        orderType: orderType === 'in-room-dining' ? 'room-dining' : (orderType === 'bar-lounge' ? 'bar-lounge' : 'restaurant-table'),
        stayId: isRoomCharge ? selectedStay?.id : undefined,
        guestName,
        roomNumber,
        folioId,
        tableNumber: orderType === 'restaurant-table' ? tableNumber : (orderType === 'bar-lounge' ? 'Bar Lounge Tab' : undefined),
        items: cart.map(i => ({
          menuItemId: i.item.id,
          name: i.item.name + (i.selectedModifiers.length ? ` (${i.selectedModifiers.join(', ')})` : ''),
          quantity: i.quantity,
          unitPrice: i.item.price,
          totalPrice: i.item.price * i.quantity
        })),
        subtotal: initialSub,
        total: grandTotal,
        paymentStatus: isRoomCharge ? 'Billed-To-Room' : (isComplimentaryOrder ? 'Settled' : 'Paid-Direct'),
        postToFolio: isRoomCharge,
        inRoomDiningDetails: orderType === 'in-room-dining' ? {
          trayChargeIncluded: includeTrayCharge,
          scheduledDeliveryTime: deliverySchedule,
          kitchenNotes: kitchenNotes.trim()
        } : undefined
      });

      // Update extra order flags
      if (appliedDiscount) {
        order.discount = discountAmt;
        order.discountPercent = appliedDiscount.percent;
        order.discountReason = appliedDiscount.name;
      }
      if (isComplimentaryOrder) {
        order.isComplimentary = true;
        order.complimentaryReason = complimentaryJustification || 'Management Complimentary Dining';
        order.paymentMethod = 'Complimentary (NC)';
      } else {
        order.paymentMethod = isRoomCharge ? 'Room Folio' : paymentMethod;
      }
      order.kotStatus = 'In Kitchen';

      setLastBilledOrder(order);
      setSuccessMessage(`Order ${order.orderNumber} placed for ৳${(grandTotal || 0).toLocaleString()} (${order.paymentMethod}${roomNumber ? ` - Room ${roomNumber}` : ''}).`);
      setCart([]);
      setKitchenNotes('');
      setAppliedDiscount(null);
      setIsComplimentaryOrder(false);
      setComplimentaryJustification('');
      setMobilePosTab('menu');
    } catch (err: any) {
      alert(`Order Placement Error: ${err.message}`);
    }
  };

  const handleExecuteVoid = () => {
    if (!orderToVoid) return;
    const finalReason = voidReason === 'Other' ? customVoidReason : voidReason;
    if (!finalReason.trim()) {
      setVoidError('Please select or specify a reason for voiding.');
      return;
    }

    try {
      pmsService.voidRestaurantOrder(orderToVoid.id, finalReason.trim());
      setSuccessMessage(`Bill ${orderToVoid.orderNumber} has been VOIDED.`);
      setOrderToVoid(null);
      setVoidReason('Guest Changed Mind');
      setCustomVoidReason('');
      setVoidError('');
    } catch (err: any) {
      setVoidError(err.message || 'Error voiding bill');
    }
  };

  const handleExecuteSettlement = () => {
    if (!orderToSettle) return;
    if (settlePaymentMethod === 'Room Folio') {
      if (!settleStayId) {
        alert('Please select an active in-house room to charge this bill to.');
        return;
      }
      const targetStay = inHouseStays.find(s => s.id === settleStayId);
      if (targetStay?.stopPost) {
        alert(`Cannot charge to Room ${targetStay.roomNumber}: STOP POST restriction is active (${targetStay.stopPostReason || 'Outlet charges restricted by Front Office'}). Please collect Direct Payment.`);
        return;
      }
    }
    try {
      const res = pmsService.settleRestaurantOrder(orderToSettle.id, {
        paymentMethod: settlePaymentMethod,
        tenderAmount: tenderCashAmount || orderToSettle.total,
        changeAmount: Math.max(0, (tenderCashAmount || orderToSettle.total) - orderToSettle.total),
        discountPercent: settleDiscountPct,
        postToFolio: settlePaymentMethod === 'Room Folio',
        stayId: settleStayId
      });
      setSuccessMessage(`Order ${orderToSettle.orderNumber} settled via ${settlePaymentMethod}.`);
      setOrderToSettle(null);
    } catch (err: any) {
      alert(`Settlement Error: ${err.message}`);
    }
  };

  const handleExecuteResettlement = () => {
    if (!orderToResettle) return;
    if (!resettleReason.trim()) {
      alert('Please state a reason for bill resettlement.');
      return;
    }
    if (resettleNewMethod === 'Room Folio') {
      if (!resettleStayId) {
        alert('Please select an active in-house room to post this folio charge to.');
        return;
      }
      const targetStay = inHouseStays.find(s => s.id === resettleStayId);
      if (targetStay?.stopPost) {
        alert(`Cannot resettle to Room ${targetStay.roomNumber}: STOP POST restriction is active (${targetStay.stopPostReason || 'Restricted'}).`);
        return;
      }
    }

    try {
      pmsService.resettleRestaurantOrder(orderToResettle.id, {
        paymentMethod: resettleNewMethod,
        resettlementReason: resettleReason.trim(),
        postToFolio: resettleNewMethod === 'Room Folio',
        stayId: resettleStayId
      });
      setSuccessMessage(`Bill ${orderToResettle.orderNumber} resettled to ${resettleNewMethod}.`);
      setOrderToResettle(null);
    } catch (err: any) {
      alert(`Resettlement Error: ${err.message}`);
    }
  };

  const allMenuItems: MenuItem[] = useMemo(() => {
    if (!enhancedMenuItems || enhancedMenuItems.length === 0) {
      return MENU_ITEMS;
    }
    return enhancedMenuItems.map(item => {
      let category = 'Continental';
      const cat = (item.categoryName || '').toLowerCase();
      if (cat.includes('bengali') || cat.includes('traditional') || cat.includes('biryani') || cat.includes('roast') || cat.includes('ilish') || cat.includes('khichuri') || cat.includes('bhuna') || cat.includes('fish')) {
        category = 'Bengali';
      } else if (cat.includes('grill') || cat.includes('steak') || cat.includes('bbq') || cat.includes('tandoor') || cat.includes('kebab') || cat.includes('tikka')) {
        category = 'Grills & BBQ';
      } else if (cat.includes('bar') || cat.includes('beverage') || cat.includes('drink') || cat.includes('cocktail') || cat.includes('mocktail') || cat.includes('coffee') || cat.includes('tea') || cat.includes('juice')) {
        category = 'Bar & Drinks';
      } else if (cat.includes('snack') || cat.includes('starter') || cat.includes('bite') || cat.includes('sandwich') || cat.includes('wing') || cat.includes('calamari')) {
        category = 'Snacks';
      } else if (cat.includes('dessert') || cat.includes('bakery') || cat.includes('sweet') || cat.includes('pastry') || cat.includes('cake') || cat.includes('firni')) {
        category = 'Dessert';
      } else {
        category = item.categoryName || 'Continental';
      }

      return {
        id: item.id,
        menuCode: item.menuCode,
        name: item.name,
        category,
        price: item.basePrice || 0,
        cost: item.costPrice || Math.round((item.basePrice || 0) * 0.35),
        station: item.kitchenStation || (category === 'Bar & Drinks' ? 'Beverage & Bar' : 'Main Kitchen'),
        description: item.description || `${item.categoryName} • ${item.servingSize || '1 Portion'}`,
        isPopular: (item as any).isPopular ?? (item as any).isChefSpecial ?? false,
        maxProduciblePortions: item.maxProduciblePortions ?? 50,
        availability: item.availability || 'Available'
      };
    });
  }, [enhancedMenuItems]);

  const filteredMenuItems = useMemo(() => {
    return allMenuItems.filter(m => {
      const matchCat =
        activeCategory === 'All' ||
        m.category === activeCategory ||
        (activeCategory === 'Bar & Drinks' && (m.category === 'Bar & Drinks' || m.station === 'Beverage & Bar'));
      const matchSearch =
        m.name.toLowerCase().includes(searchMenu.toLowerCase()) ||
        m.description.toLowerCase().includes(searchMenu.toLowerCase()) ||
        (m.menuCode && m.menuCode.toLowerCase().includes(searchMenu.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [allMenuItems, activeCategory, searchMenu]);

  // Order Metrics
  const activeOrders = db.restaurantOrders.filter(o => !o.voided);
  const voidedOrders = db.restaurantOrders.filter(o => o.voided);
  const settledOrders = db.restaurantOrders.filter(o => o.paymentStatus === 'Settled' || o.paymentStatus === 'Paid-Direct' || o.paymentStatus === 'Billed-To-Room');
  const openOrders = db.restaurantOrders.filter(o => !o.voided && o.status !== 'Served' && o.status !== 'Posted to Folio' && o.status !== 'Settled Direct');

  const totalSalesVolume = activeOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalVoidVolume = voidedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalDiscounts = activeOrders.reduce((sum, o) => sum + (o.discount || 0), 0);

  // Export Reports
  const handleExportReports = () => {
    const data = db.restaurantOrders.map(o => ({
      'Order Number': o.orderNumber,
      'Date & Time': o.createdAt ? new Date(o.createdAt).toLocaleString() : '',
      'Guest / Table': o.guestName || o.tableNumber || o.roomNumber || 'Counter',
      'Order Type': o.orderType,
      'Subtotal (BDT)': o.subtotal,
      'Discount (BDT)': o.discount || 0,
      'Service Charge (BDT)': o.serviceCharge,
      'VAT (BDT)': o.tax,
      'Grand Total (BDT)': o.total,
      'Payment Method': o.paymentMethod || 'Direct',
      'Status': o.status,
      'Voided': o.voided ? 'YES' : 'NO',
      'Void Reason': o.voidReason || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Restaurant_Orders');
    XLSX.writeFile(wb, `CCULB_Restaurant_Audit_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Navigation */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-5 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shadow-xs flex items-center gap-1.5">
              <UtensilsCrossed className="w-5 h-5" />
              <Wine className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  Restaurant & Bar Management
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Integrated Dining & Bar
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Tables, Bar Counter, KOT Station, Modifiers, Discounts, Complimentary, Voids, Settlements & Resettlement Billing.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Operational Metrics */}
        <div className="flex items-center gap-2 bg-slate-950/60 p-2 rounded-xl border border-slate-700/60 text-xs">
          <div className="px-3 py-1 border-r border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Today Sales</span>
            <span className="font-bold text-amber-400 font-mono">৳{(totalSalesVolume || 0).toLocaleString()}</span>
          </div>
          <div className="px-3 py-1 border-r border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Active KOT</span>
            <span className="font-bold text-emerald-400 font-mono">{openOrders.length}</span>
          </div>
          <div className="px-3 py-1 text-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Voided Bills</span>
            <span className="font-bold text-rose-400 font-mono">{voidedOrders.length}</span>
          </div>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 scrollbar-thin">
        {[
          { id: 'pos', label: 'POS Terminal', icon: ShoppingBag },
          { id: 'tables', label: 'Tables & Bar Counter', icon: Grid3X3 },
          { id: 'orders', label: 'Order Register', icon: ClipboardListIcon },
          { id: 'kot', label: 'Kitchen & Bar KOT', icon: ChefHat },
          { id: 'menu', label: 'Menu Catalog', icon: BookOpenIcon, badge: `${allMenuItems.length}` },
          { id: 'modifiers', label: 'Modifiers', icon: Layers },
          { id: 'discounts', label: 'Discounts', icon: Percent },
          { id: 'complimentary', label: 'Complimentary', icon: Gift },
          { id: 'voids', label: 'Voids Audit', icon: Ban, badge: voidedOrders.length > 0 ? voidedOrders.length : undefined },
          { id: 'settlements', label: 'Settlements & Resettle', icon: CreditCard, highlight: true },
          { id: 'reports', label: 'F&B & Bar Reports', icon: BarChart3 }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (onNavigate) onNavigate(`restaurant-${tab.id}`);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md font-bold'
                  : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-500 text-white font-mono font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <span className="font-bold text-white text-sm block">Action Processed Successfully</span>
              <span className="text-xs text-emerald-300">{successMessage}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lastBilledOrder && onPrintInvoice && (
              <button
                type="button"
                onClick={() => onPrintInvoice(lastBilledOrder)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Print Bill Invoice</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => { setSuccessMessage(''); setLastBilledOrder(null); }}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. POS TERMINAL VIEW */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'pos' && (
        <div className="space-y-4">
          {/* Mobile Tab Switcher for Remote Orders Taking */}
          <div className="lg:hidden flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <button
              type="button"
              onClick={() => setMobilePosTab('menu')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                mobilePosTab === 'menu'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpenIcon className="w-4 h-4" />
              <span>Menu Items</span>
            </button>
            <button
              type="button"
              onClick={() => setMobilePosTab('cart')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                mobilePosTab === 'cart'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Order Ticket ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
              {cart.length > 0 && (
                <span className="text-[10px] font-mono bg-slate-950 text-amber-300 px-1.5 py-0.5 rounded-full">
                  ৳{grandTotal}
                </span>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Menu Catalog (Col 1 & 2) */}
            <div className={`lg:col-span-2 space-y-4 ${mobilePosTab === 'cart' ? 'hidden lg:block' : 'block'}`}>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search menu items (Biryani, Steak, Hilsa, Mocktails)..."
                    value={searchMenu}
                    onChange={e => setSearchMenu(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                {appliedDiscount && (
                  <span className="px-2.5 py-1 rounded-xl text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5" />
                    <span>Applied: {appliedDiscount.name}</span>
                    <button onClick={() => setAppliedDiscount(null)} className="ml-1 hover:text-rose-500"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {isComplimentaryOrder && (
                  <span className="px-2.5 py-1 rounded-xl text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center gap-1 font-bold">
                    <Gift className="w-3.5 h-3.5" />
                    <span>Complimentary (NC) Mode</span>
                    <button onClick={() => setIsComplimentaryOrder(false)} className="ml-1 hover:text-rose-500"><X className="w-3 h-3" /></button>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {['All', 'Bengali', 'Grills & BBQ', 'Continental', 'Bar & Drinks', 'Snacks', 'Dessert'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      activeCategory === cat
                        ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 max-h-[580px] overflow-y-auto pr-1">
              {filteredMenuItems.map(item => {
                const inCart = cart.find(i => i.item.id === item.id);
                return (
                  <div
                    key={item.id}
                    className={`bg-white dark:bg-slate-900 border rounded-2xl p-3.5 flex flex-col justify-between transition hover:shadow-md ${
                      inCart ? 'border-amber-500 dark:border-amber-500/80 shadow-xs' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {item.category}
                        </span>
                        {item.isPopular && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-500 border border-amber-500/30">
                            Chef Special
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs mt-2 leading-tight">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-xs text-slate-400">Price: </span>
                        <span className="font-bold font-mono text-amber-600 dark:text-amber-400 text-sm">
                          ৳{item.price}
                        </span>
                      </div>

                      {inCart ? (
                        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-rose-50 hover:text-rose-600 shadow-xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-bold text-xs px-1.5 text-slate-900 dark:text-white font-mono">
                            {inCart.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-600 shadow-xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addToCart(item)}
                          className="px-3 py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1 shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* POS Cart & Checkout Panel (Col 3) */}
          <div className={`space-y-4 ${mobilePosTab === 'menu' ? 'hidden lg:block' : 'block'}`}>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-amber-500" />
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Active Order Ticket</h3>
                  </div>
                  {cart.length > 0 && (
                    <button
                      onClick={() => setCart([])}
                      className="text-[11px] text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear Cart
                    </button>
                  )}
                </div>

                {/* Order Type Selector */}
                <div className="grid grid-cols-2 gap-1.5 my-3">
                  {[
                    { id: 'restaurant-table', label: 'Dine-In Table' },
                    { id: 'in-room-dining', label: 'In-Room Service' },
                    { id: 'bar-lounge', label: 'Bar & Lounge Tab' },
                    { id: 'takeaway', label: 'Takeaway / Parcel' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setOrderType(t.id as any);
                        if (t.id === 'in-room-dining') {
                          setBillingMethod('room-charge');
                          if (!selectedStayId && inHouseStays.length > 0) {
                            setSelectedStayId(inHouseStays[0].id);
                          }
                        }
                      }}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold transition text-center ${
                        orderType === t.id
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Table or Room Selector */}
                {orderType === 'restaurant-table' && (
                  <div className="mb-3">
                    <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Select Dining Table:</label>
                    <select
                      value={tableNumber}
                      onChange={e => setTableNumber(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white"
                    >
                      {RESTAURANT_TABLES.map(t => (
                        <option key={t.id} value={t.name}>{t.name} ({t.zone} - {t.capacity} Pax)</option>
                      ))}
                    </select>
                  </div>
                )}

                {orderType === 'bar-lounge' && (
                  <div className="mb-3 space-y-2 bg-amber-500/10 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-500/30">
                    <label className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold block">Select Bar Counter / Lounge Tab:</label>
                    <select
                      value={tableNumber}
                      onChange={e => setTableNumber(e.target.value)}
                      className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white"
                    >
                      <option value="Bar Counter 01">Bar Counter 01 (Meghna Sunset Bar - 2 Pax)</option>
                      <option value="Bar Counter 02">Bar Counter 02 (Meghna Sunset Bar - 2 Pax)</option>
                      <option value="Bar Counter 03">Bar Counter 03 (Meghna Sunset Bar - 4 Pax)</option>
                      <option value="Lounge High Top 01">Lounge High Top 01 (Sky Lounge - 4 Pax)</option>
                      <option value="Lounge High Top 02">Lounge High Top 02 (Sky Lounge - 4 Pax)</option>
                      <option value="Poolside Bar Cabana">Poolside Bar Cabana</option>
                      <option value="Walk-in Bar Tab">Walk-in Bar Tab</option>
                    </select>
                  </div>
                )}

                {orderType === 'in-room-dining' && (
                  <div className="space-y-2 mb-3 bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/40">
                    <div>
                      <label className="text-[11px] text-amber-900 dark:text-amber-300 font-semibold block mb-1">Select In-House Room:</label>
                      {inHouseStays.length > 0 ? (
                        <select
                          value={selectedStayId}
                          onChange={e => setSelectedStayId(e.target.value)}
                          className="w-full text-xs bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-xl p-2"
                        >
                          {inHouseStays.map(s => (
                            <option key={s.id} value={s.id}>
                              Room {s.roomNumber} – {s.guestName} {s.stopPost ? '(STOP POST ACTIVE)' : ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-[11px] text-rose-500">No checked-in guests currently in resort.</p>
                      )}
                    </div>
                    {isSelectedStayStopPost && (
                      <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Room charges restricted. Must collect direct payment.
                      </p>
                    )}
                  </div>
                )}

                {/* Cart Items List */}
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 my-3 border-y border-slate-100 dark:border-slate-800 py-2">
                  {cart.length === 0 ? (
                    <div className="text-center py-6 text-slate-400">
                      <ShoppingBag className="w-8 h-8 mx-auto opacity-30 mb-1" />
                      <p className="text-xs">No items selected yet</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.item.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 dark:border-slate-800/60 last:border-0">
                        <div className="flex-1 pr-2">
                          <span className="font-semibold text-slate-900 dark:text-white">{item.item.name}</span>
                          <span className="text-slate-400 text-[10px] block">৳{item.item.price} × {item.quantity}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            ৳{item.item.price * item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.item.id, -item.quantity)}
                            className="text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Kitchen Special Notes */}
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Kitchen instructions (e.g. less salt, extra cutlery)..."
                    value={kitchenNotes}
                    onChange={e => setKitchenNotes(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Bill Calculation */}
                <div className="space-y-1.5 text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-mono">৳{rawSubtotal}</span>
                  </div>
                  {trayCharge > 0 && (
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Room Tray Service:</span>
                      <span className="font-mono">৳{trayCharge}</span>
                    </div>
                  )}
                  {discountAmt > 0 && (
                    <div className="flex justify-between text-rose-500 font-semibold">
                      <span>Discount ({isComplimentaryOrder ? '100% NC' : `${appliedDiscount?.percent}%`}):</span>
                      <span className="font-mono">-৳{discountAmt}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>VAT (15%):</span>
                    <span className="font-mono">৳{vat}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Service Charge (10%):</span>
                    <span className="font-mono">৳{serviceCharge}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span>Grand Total:</span>
                    <span className="font-mono text-amber-600 dark:text-amber-400">৳{(grandTotal || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Settlement Method */}
                {!isComplimentaryOrder && (
                  <div className="mt-3 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setBillingMethod('direct-pay')}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                          billingMethod === 'direct-pay'
                            ? 'bg-slate-900 dark:bg-slate-700 text-white font-bold shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        Direct Pay
                      </button>
                      <button
                        type="button"
                        disabled={inHouseStays.length === 0}
                        onClick={() => {
                          setBillingMethod('room-charge');
                          if (!selectedStayId && inHouseStays.length > 0) {
                            setSelectedStayId(inHouseStays[0].id);
                          }
                        }}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-1.5 ${
                          billingMethod === 'room-charge'
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 disabled:opacity-40'
                        }`}
                      >
                        <Hotel className="w-3.5 h-3.5" />
                        <span>Charge to Room</span>
                      </button>
                    </div>

                    {billingMethod === 'direct-pay' && (
                      <div className="flex gap-1 pt-0.5">
                        {['Cash', 'Credit Card', 'bKash / Mobile Pay', 'City Ledger'].map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setPaymentMethod(m as any)}
                            className={`flex-1 py-1.5 text-[10px] rounded-lg border font-medium transition cursor-pointer ${
                              paymentMethod === m
                                ? 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300 font-bold shadow-2xs'
                                : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Room Selection for Room Charge */}
                    {billingMethod === 'room-charge' && (
                      <div className="p-3 bg-amber-50/90 dark:bg-amber-950/40 rounded-2xl border border-amber-300 dark:border-amber-700/60 space-y-2.5 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                            <Hotel className="w-3.5 h-3.5 text-amber-600" />
                            <span>Select In-House Room to Charge:</span>
                          </label>
                          <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-200/80 dark:bg-amber-900/50 px-2 py-0.5 rounded-full">
                            {inHouseStays.length} In-House {inHouseStays.length === 1 ? 'Guest' : 'Guests'}
                          </span>
                        </div>

                        {inHouseStays.length === 0 ? (
                          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl text-center">
                            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">No checked-in guests currently in hotel.</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Please settle via Direct Pay.</p>
                          </div>
                        ) : (
                          <>
                            {/* Quick Room or Guest Search */}
                            <div className="relative">
                              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-amber-600/70 dark:text-amber-400/70" />
                              <input
                                type="text"
                                placeholder="Type room # or guest name..."
                                value={roomSearchQuery}
                                onChange={e => setRoomSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/70 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                              />
                            </div>

                            {/* Room Selection Dropdown */}
                            <select
                              value={selectedStayId}
                              onChange={e => setSelectedStayId(e.target.value)}
                              className="w-full text-xs font-medium bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
                            >
                              <option value="">-- Choose In-House Room / Guest --</option>
                              {filteredInHouseStays.map(s => (
                                <option key={s.id} value={s.id}>
                                  Room {s.roomNumber} – {s.guestName} ({s.roomTypeName}) {s.stopPost ? '⚠️ [STOP POST]' : ''}
                                </option>
                              ))}
                            </select>

                            {/* Selected Guest Room Details Card */}
                            {selectedStay ? (
                              <div className={`p-2.5 rounded-xl border text-xs space-y-1.5 ${
                                selectedStay.stopPost
                                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                                  : 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-800/40 text-slate-800 dark:text-slate-200 shadow-2xs'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                                    <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-mono font-bold text-[11px]">
                                      Room {selectedStay.roomNumber}
                                    </span>
                                    <span>{selectedStay.guestName}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                    Folio #{selectedStay.folioId?.slice(-6)?.toUpperCase()}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 pt-0.5">
                                  <span>{selectedStay.roomTypeName}</span>
                                  <span>
                                    Current Folio Balance: <strong className="text-slate-900 dark:text-white font-mono">৳{(selectedStayFolioBalance || 0).toLocaleString()}</strong>
                                  </span>
                                </div>

                                {selectedStay.stopPost && (
                                  <div className="mt-1 pt-1.5 border-t border-rose-200 dark:border-rose-800/50 flex items-start gap-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                                    <div>
                                      <strong>STOP POST ACTIVE:</strong> {selectedStay.stopPostReason || 'Outlet charges restricted by Front Desk'}.
                                      <p className="text-[10px] font-normal mt-0.5">Posting to Room {selectedStay.roomNumber} is blocked. Direct settlement is required.</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-[11px] text-amber-800 dark:text-amber-300 italic flex items-center gap-1">
                                <span>👉</span> Please select an in-house guest room above to link this POS bill to their hotel folio.
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Submit / Punch Button */}
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={cart.length === 0 || (billingMethod === 'room-charge' && (!selectedStayId || isSelectedStayStopPost))}
                className="w-full mt-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-sm shadow-md transition disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  {billingMethod === 'room-charge'
                    ? selectedStay
                      ? isSelectedStayStopPost
                        ? `Stop Post Active (Room ${selectedStay.roomNumber})`
                        : `Punch & Charge to Room ${selectedStay.roomNumber} (৳${(grandTotal || 0).toLocaleString()})`
                      : `Select Room to Charge (৳${(grandTotal || 0).toLocaleString()})`
                    : `Punch & Print Bill (৳${(grandTotal || 0).toLocaleString()})`}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Sticky Mobile Floating Order Bar (Remote Order Taking) */}
        {cart.length > 0 && mobilePosTab === 'menu' && (
          <div className="lg:hidden sticky bottom-4 left-0 right-0 p-3 bg-slate-950/95 backdrop-blur-md border border-slate-700 rounded-2xl z-30 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-white">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span className="font-bold">{cart.reduce((s, i) => s + i.quantity, 0)} Items Added</span>
              </div>
              <div className="text-amber-400 font-mono font-bold text-sm">৳{(grandTotal || 0).toLocaleString()}</div>
            </div>
            <button
              type="button"
              onClick={() => setMobilePosTab('cart')}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shrink-0 cursor-pointer"
            >
              <span>Review Order Slip</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. TABLES & FLOOR PLAN VIEW */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'tables' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Interactive Table & Bar Floor Map</h3>
              <p className="text-xs text-slate-400">Live dining and bar counter occupancy, running tickets, and quick settlement.</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Vacant</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></span> Occupied</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500"></span> Billed / Waiting Settle</span>
            </div>
          </div>

          {/* Zone Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {['All Zones', 'Main Dining Hall', 'Terrace Garden View', 'Poolside Veranda', 'Executive Lounge', 'Bar & Lounge'].map(zone => (
              <button
                key={zone}
                onClick={() => setTableZoneFilter(zone)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  tableZoneFilter === zone
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {zone}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {RESTAURANT_TABLES.filter(t => tableZoneFilter === 'All Zones' || t.zone === tableZoneFilter).map(table => {
              const activeOrder = db.restaurantOrders.find(
                o => !o.voided && o.tableNumber?.includes(table.name) && o.status !== 'Served' && o.status !== 'Settled Direct' && o.status !== 'Posted to Folio'
              );
              const isOccupied = !!activeOrder;

              return (
                <div
                  key={table.id}
                  className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
                    isOccupied
                      ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-400 dark:border-amber-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{table.name}</span>
                      <span className={`w-2.5 h-2.5 rounded-full ${isOccupied ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{table.zone}</span>
                    <span className="text-[10px] text-slate-500 block">Cap: {table.capacity} Pax</span>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                    {isOccupied ? (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 block">
                          ৳{activeOrder.total} ({activeOrder.orderNumber})
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleOpenSettleModal(activeOrder)}
                            className="flex-1 py-1 bg-amber-500 text-slate-950 text-[10px] font-bold rounded-lg hover:bg-amber-400"
                          >
                            Settle
                          </button>
                          <button
                            onClick={() => setOrderToVoid(activeOrder)}
                            className="p-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-lg"
                            title="Void Order"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setTableNumber(table.name);
                          setOrderType('restaurant-table');
                          setActiveTab('pos');
                        }}
                        className="w-full py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px] font-semibold rounded-xl"
                      >
                        + Punch Order
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. ORDER REGISTER & ACTIVE ORDER LEDGER */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Order Register & POS Bills</h3>
              <p className="text-xs text-slate-400">Total {db.restaurantOrders.length} transaction records found.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportReports}
                className="px-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export XLS</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Order #</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Guest / Table</th>
                  <th className="p-3">Items Summary</th>
                  <th className="p-3 text-right">Total (BDT)</th>
                  <th className="p-3">Tender</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {db.restaurantOrders.map(order => (
                  <tr key={order.id} className={order.voided ? 'bg-rose-50/40 dark:bg-rose-950/10 opacity-70' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}>
                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                      {order.orderNumber}
                      {order.isResettled && (
                        <span className="ml-1.5 text-[9px] px-1 py-0.2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded font-bold">
                          Resettled
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="capitalize px-2 py-0.5 rounded-md text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {order.orderType?.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold block text-slate-900 dark:text-white">
                        {order.roomNumber ? `Room ${order.roomNumber}` : (order.tableNumber || 'Walk-in')}
                      </span>
                      <span className="text-[10px] text-slate-400">{order.guestName}</span>
                    </td>
                    <td className="p-3 max-w-xs truncate text-[11px] text-slate-500">
                      {order.items.map(i => `${i.name} (${i.quantity})`).join(', ')}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                      ৳{(order.total || 0)?.toLocaleString()}
                    </td>
                    <td className="p-3 font-medium text-[11px]">
                      {order.paymentMethod || 'Direct'}
                    </td>
                    <td className="p-3">
                      {order.voided ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/30">
                          Voided
                        </span>
                      ) : order.paymentStatus === 'Settled' || order.paymentStatus === 'Paid-Direct' || order.paymentStatus === 'Billed-To-Room' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                          Settled
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/30">
                          Running
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {onPrintInvoice && (
                          <button
                            onClick={() => onPrintInvoice(order)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-amber-500"
                            title="Print Invoice"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!order.voided && (
                          <>
                            <button
                              onClick={() => handleOpenSettleModal(order)}
                              className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500 text-amber-700 dark:text-amber-300 hover:text-slate-950 font-bold rounded-lg text-[10px] transition"
                            >
                              Settle
                            </button>
                            <button
                              onClick={() => handleOpenResettleModal(order)}
                              className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500 text-blue-700 dark:text-blue-300 hover:text-white font-bold rounded-lg text-[10px] transition"
                              title="Resettle Payment Tender"
                            >
                              Resettle
                            </button>
                            <button
                              onClick={() => setOrderToVoid(order)}
                              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 rounded-lg"
                              title="Void Bill"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. KITCHEN ORDER TICKETS (KOT) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'kot' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Kitchen Display System (KDS) & KOT Routing</h3>
              <p className="text-xs text-slate-400">Manage real-time order preparation by kitchen stations.</p>
            </div>
            <div className="flex gap-1.5">
              {['All', 'Main Kitchen', 'Tandoor & Curries', 'Continental & Grills', 'Beverage & Bar', 'Bakery & Dessert'].map(st => (
                <button
                  key={st}
                  onClick={() => setKotStationFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                    kotStationFilter === st
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeOrders.map(order => (
              <div
                key={order.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <div>
                      <span className="font-mono font-bold text-sm text-amber-500 block">{order.orderNumber}</span>
                      <span className="text-[10px] text-slate-400">
                        {order.roomNumber ? `Room ${order.roomNumber}` : (order.tableNumber || 'Counter')}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      order.kotStatus === 'Ready'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400 animate-pulse'
                    }`}>
                      {order.kotStatus || 'In Kitchen'}
                    </span>
                  </div>

                  <div className="space-y-2 py-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {item.name}
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                          × {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  {onPrintInvoice && (
                    <button
                      onClick={() => onPrintInvoice(order)}
                      className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-600 dark:text-slate-400 rounded-xl transition flex items-center justify-center shrink-0"
                      title="Print 80mm KOT Ticket / Bill"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => pmsService.updateOrderKotStatus(order.id, 'Ready')}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs"
                  >
                    Mark Ready
                  </button>
                  <button
                    onClick={() => pmsService.updateOrderKotStatus(order.id, 'Served')}
                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs"
                  >
                    Mark Served
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. MENU & 6. MODIFIERS & 7. DISCOUNTS & 8. COMPLIMENTARY */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'menu' && (
        <div className="space-y-4">
          {/* Menu Catalog Header Toolbar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Restaurant & Bar Master Food & Beverage Catalog
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {allMenuItems.length} Dishes
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Live dishes & bar beverages with ingredient recipes, statutory 15% VAT, 10% Service Charge, and real-time portion availability.
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const restored = inventoryMenuService.resetToSeedMenuItems();
                  setEnhancedMenuItems([...restored]);
                  setCatalogCategoryFilter('All');
                  setCatalogSearch('');
                  setSuccessMessage('Standard Master Catalog restored with 22 authentic resort dishes!');
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                <span>Restore Standard Catalog</span>
              </button>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('menu-catalog')}
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <ChefHat className="w-4 h-4 text-slate-950" />
                  <span>Recipe Engineering Suite</span>
                </button>
              )}
            </div>
          </div>

          {/* Catalog Filter Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search catalog by dish name, code (MNU-...), or ingredient..."
                  value={catalogSearch}
                  onChange={e => setCatalogSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
              {catalogCategoryFilter !== 'All' && (
                <button
                  onClick={() => setCatalogCategoryFilter('All')}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-200 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Reset Category
                </button>
              )}
            </div>

            {/* Category Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['All', 'Bengali', 'Grills & BBQ', 'Continental', 'Bar & Drinks', 'Snacks', 'Dessert'].map(cat => {
                const count = allMenuItems.filter(i => cat === 'All' || i.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setCatalogCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      catalogCategoryFilter === cat
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dishes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allMenuItems
              .filter(m => {
                const matchCat = catalogCategoryFilter === 'All' || m.category === catalogCategoryFilter;
                const matchSearch =
                  m.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                  m.description.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                  (m.menuCode && m.menuCode.toLowerCase().includes(catalogSearch.toLowerCase()));
                return matchCat && matchSearch;
              })
              .map(m => {
                const margin = m.price > 0 ? Math.round(((m.price - m.cost) / m.price) * 100) : 0;
                const portions = m.maxProduciblePortions ?? 50;

                return (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between hover:shadow-md transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold">
                            {m.category}
                          </span>
                          {m.menuCode && (
                            <span className="text-[10px] font-mono text-slate-400">
                              {m.menuCode}
                            </span>
                          )}
                        </div>
                        <span className="font-mono font-bold text-amber-500 text-sm">
                          ৳{m.price}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-2">
                        {m.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {m.description}
                      </p>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400 font-mono">
                          Station: <strong className="text-slate-800 dark:text-slate-200">{m.station}</strong>
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                          Margin: {margin}%
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[10px]">
                        <span className={`px-2 py-0.5 rounded-md font-mono ${
                          portions > 10
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : portions > 0
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}>
                          {portions > 0 ? `${portions} portions ready` : 'Low Ingredient Stock'}
                        </span>
                        <span className="text-slate-400 font-mono">Cost: ৳{m.cost}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          addToCart(m);
                          setActiveTab('pos');
                          setSuccessMessage(`Added "${m.name}" to POS order ticket.`);
                        }}
                        className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to POS Ticket</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

          {allMenuItems.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Catalog is currently empty</h4>
              <p className="text-xs text-slate-500 mt-1 mb-4">Click below to restore the standard 22-dish resort master menu.</p>
              <button
                type="button"
                onClick={() => {
                  const restored = inventoryMenuService.resetToSeedMenuItems();
                  setEnhancedMenuItems([...restored]);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs inline-flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Initialize Standard Catalog (22 Dishes)
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'modifiers' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Active Modifiers & Preparation Notes</h3>
            <p className="text-xs text-slate-400">Configured add-ons, portion sizes, sauces, and cooking preferences.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {MODIFIER_OPTIONS.map(mod => (
              <div key={mod.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">{mod.name}</span>
                <span className="font-mono font-bold text-amber-500 text-xs">
                  {mod.price > 0 ? `+৳${mod.price}` : 'Free'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'discounts' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Discount Rules & Promotional Vouchers</h3>
            <p className="text-xs text-slate-400">Click a policy to apply it immediately to the current POS order.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {DISCOUNT_RULES.map(disc => (
              <div
                key={disc.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-amber-500 text-xs">{disc.code}</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{disc.percent}% OFF</span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 mt-2">{disc.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-1">{disc.description}</p>
                </div>
                <button
                  onClick={() => {
                    setAppliedDiscount({ percent: disc.percent, name: disc.name });
                    setActiveTab('pos');
                    setSuccessMessage(`Applied ${disc.name} (${disc.percent}% Off).`);
                  }}
                  className="mt-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition"
                >
                  Apply to POS
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'complimentary' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Complimentary (NC) Meal Authority</h3>
              <p className="text-xs text-slate-400">Non-chargeable food & beverage orders for VIPs, tasting, and management approval.</p>
            </div>
          </div>

          <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 rounded-2xl space-y-3">
            <p className="text-xs text-purple-900 dark:text-purple-300">
              Complimentary orders are recorded at ৳0 total with 100% discount, zero tax, and tracked in the Food Costing & NC ledger.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter justification (e.g. VIP Chairman Guest, Chef Tasting Trial)..."
                value={complimentaryJustification}
                onChange={e => setComplimentaryJustification(e.target.value)}
                className="flex-1 text-xs bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded-xl p-2.5"
              />
              <button
                onClick={() => {
                  if (!complimentaryJustification.trim()) {
                    alert('Please provide justification for complimentary meal.');
                    return;
                  }
                  setIsComplimentaryOrder(true);
                  setActiveTab('pos');
                  setSuccessMessage('Complimentary mode enabled for current POS ticket.');
                }}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center gap-1.5"
              >
                <Gift className="w-4 h-4" />
                <span>Enable NC Order</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 9. VOIDS CENTER & VOID AUDIT */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'voids' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Voided Bills & Audit Log</h3>
              <p className="text-xs text-slate-400">Audit trail of all cancelled orders, reversed charges, and supervisor justifications.</p>
            </div>
            <div className="font-mono text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900">
              Total Voided Volume: ৳{(totalVoidVolume || 0).toLocaleString()} ({voidedOrders.length} Bills)
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Void Voucher</th>
                  <th className="p-3">Original Bill</th>
                  <th className="p-3">Void Date & Time</th>
                  <th className="p-3">Voided By</th>
                  <th className="p-3">Reason / Justification</th>
                  <th className="p-3 text-right">Amount (BDT)</th>
                  <th className="p-3 text-center">Reversed From</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {voidedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400">
                      No voided orders recorded in the current session.
                    </td>
                  </tr>
                ) : (
                  voidedOrders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-rose-600 dark:text-rose-400">
                        VOID-{order.orderNumber}
                      </td>
                      <td className="p-3 font-mono">{order.orderNumber}</td>
                      <td className="p-3 text-slate-400">{order.voidedAt ? new Date(order.voidedAt).toLocaleString() : 'Recent'}</td>
                      <td className="p-3 font-semibold">{order.voidedBy || 'Supervisor'}</td>
                      <td className="p-3 text-slate-800 dark:text-slate-200 max-w-xs">{order.voidReason || 'Order Entry Error'}</td>
                      <td className="p-3 text-right font-mono font-bold text-rose-500">
                        ৳{(order.total || 0)?.toLocaleString()}
                      </td>
                      <td className="p-3 text-center text-[10px]">
                        {order.folioId ? (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 font-mono">
                            Room Folio #{order.roomNumber}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 font-mono">
                            Direct Cash/POS
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 10. SETTLEMENTS & RESETTLEMENTS HUB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'settlements' && (
        <div className="space-y-5">
          {/* Sub Navigation */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <button
              onClick={() => setSettlementSubTab('open-bills')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                settlementSubTab === 'open-bills'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Bill Settlement & Cashier Desk ({openOrders.length})</span>
            </button>
            <button
              onClick={() => setSettlementSubTab('resettlement')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                settlementSubTab === 'resettlement'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Bill Resettlement & Payment Tender Switch</span>
            </button>
            <button
              onClick={() => setSettlementSubTab('shift-close')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                settlementSubTab === 'shift-close'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Cashier Shift End Reconciliation</span>
            </button>
          </div>

          {/* Subtab 1: Open Bills Settlement */}
          {settlementSubTab === 'open-bills' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Pending & Active Bills for Settlement</h3>
                <div className="space-y-3">
                  {openOrders.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-50" />
                      <p className="text-xs">All active orders have been settled or posted!</p>
                    </div>
                  ) : (
                    openOrders.map(order => (
                      <div
                        key={order.id}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{order.orderNumber}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600">
                              {order.roomNumber ? `Room ${order.roomNumber}` : (order.tableNumber || 'Takeaway')}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 block mt-1">
                            {order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-base text-amber-600 dark:text-amber-400">
                            ৳{(order.total || 0)?.toLocaleString()}
                          </span>
                          <button
                            onClick={() => handleOpenSettleModal(order)}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-xs"
                          >
                            Settle Now
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Settlement Info Box */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Cashier Settlement Protocols</h4>
                <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Supports split tenders (Cash, Card, bKash MFS, City Ledger).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Transfers directly to guest room folio with instant folio balance update.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Calculates tender amount and change return automatically.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Subtab 2: Bill Resettlement (Change Tender) */}
          {settlementSubTab === 'resettlement' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Bill Resettlement Station (Amended / Re-Opened Bills)</h3>
                  <p className="text-xs text-slate-400">
                    Switch payment methods (e.g. from Cash to Corporate Card, or post to Room Folio after checkout).
                  </p>
                </div>
                <span className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold font-mono">
                  Audit Log Enforced
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500">
                    <tr>
                      <th className="p-3">Bill Number</th>
                      <th className="p-3">Guest / Account</th>
                      <th className="p-3">Current Tender</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3">Resettlement Status</th>
                      <th className="p-3 text-center">Resettle Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {settledOrders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{order.orderNumber}</td>
                        <td className="p-3">{order.guestName || order.tableNumber || 'Walk-in'}</td>
                        <td className="p-3 font-semibold text-amber-500">{order.paymentMethod || 'Direct Pay'}</td>
                        <td className="p-3 text-right font-mono font-bold">৳{(order.total || 0)?.toLocaleString()}</td>
                        <td className="p-3">
                          {order.isResettled ? (
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full font-bold text-[10px]">
                              Resettled by {order.resettledBy}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Original Settlement</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setOrderToResettle(order)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition"
                          >
                            Resettle Tender
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Subtab 3: Cashier Shift End Close */}
          {settlementSubTab === 'shift-close' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Cashier Shift-End Balance Reconciliation</h3>
                  <p className="text-xs text-slate-400">Review drawer float, cash collection, electronic EDC batch, and room transfers.</p>
                </div>
                <button
                  onClick={() => {
                    alert('Shift Summary Printed & Logged to General Ledger.');
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Shift Handover Report</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs text-slate-400 block">Total Shift Revenue</span>
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 block">
                    ৳{(totalSalesVolume || 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 block">Cash Tender in Drawer</span>
                  <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                    ৳{(Math.round(totalSalesVolume * 0.45) || 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <span className="text-xs text-blue-600 dark:text-blue-400 block">Credit Card & MFS Batch</span>
                  <span className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1 block">
                    ৳{(Math.round(totalSalesVolume * 0.35) || 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <span className="text-xs text-amber-600 dark:text-amber-400 block">Room Folio Charges</span>
                  <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 block">
                    ৳{(Math.round(totalSalesVolume * 0.20) || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 11. REPORTS TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'reports' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Restaurant & F&B Operational Analytics</h3>
              <p className="text-xs text-slate-400">Departmental sales, meal period velocity, and void audit summaries.</p>
            </div>
            <button
              onClick={handleExportReports}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Excel Report</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-400 block">Total Active Orders</span>
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 block">
                {activeOrders.length}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-400 block">Total F&B Gross Sales</span>
              <span className="text-2xl font-bold font-mono text-amber-500 mt-1 block">
                ৳{(totalSalesVolume || 0).toLocaleString()}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-400 block">Voided Volume Loss</span>
              <span className="text-2xl font-bold font-mono text-rose-500 mt-1 block">
                ৳{(totalVoidVolume || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: VOID ORDER POPUP */}
      {/* ------------------------------------------------------------- */}
      {orderToVoid && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-500 border border-rose-500/30">
                  <Ban className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Void Bill Authorization</h3>
                  <span className="text-xs text-slate-400 font-mono">Bill #{orderToVoid.orderNumber}</span>
                </div>
              </div>
              <button onClick={() => setOrderToVoid(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300">
              Voiding this bill will cancel the order amount (৳{(orderToVoid.total || 0)?.toLocaleString()}) and automatically reverse any posted charges from Room Folio.
            </div>

            {voidError && (
              <p className="text-xs text-rose-500 font-semibold">{voidError}</p>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Official Void Reason:
              </label>
              <select
                value={voidReason}
                onChange={e => setVoidReason(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5"
              >
                <option value="Guest Changed Mind">Guest Changed Mind</option>
                <option value="Order Entry Error / Wrong Table">Order Entry Error / Wrong Table</option>
                <option value="Food Quality Issue / Customer Complaint">Food Quality Issue / Customer Complaint</option>
                <option value="Duplicate Order Punch">Duplicate Order Punch</option>
                <option value="Manager Special Cancellation">Manager Special Cancellation</option>
                <option value="Other">Other (Specify below)</option>
              </select>
            </div>

            {voidReason === 'Other' && (
              <div>
                <input
                  type="text"
                  placeholder="Specify detailed reason..."
                  value={customVoidReason}
                  onChange={e => setCustomVoidReason(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5"
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOrderToVoid(null)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteVoid}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition shadow-md"
              >
                Confirm & Void Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: SETTLE ORDER POPUP */}
      {/* ------------------------------------------------------------- */}
      {orderToSettle && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-500 border border-amber-500/30">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Settle Bill</h3>
                  <span className="text-xs text-slate-400 font-mono">Bill #{orderToSettle.orderNumber} (৳{orderToSettle.total})</span>
                </div>
              </div>
              <button onClick={() => setOrderToSettle(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Payment Tender:
              </label>
              <select
                value={settlePaymentMethod}
                onChange={e => setSettlePaymentMethod(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
              >
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card (POS Terminal)</option>
                <option value="bKash / Mobile Pay">bKash / Nagad / Rocket MFS</option>
                <option value="Room Folio">Charge to Room Folio</option>
                <option value="City Ledger">City Ledger / Corporate Account</option>
              </select>
            </div>

            {settlePaymentMethod === 'Cash' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Cash Tendered (BDT):
                </label>
                <input
                  type="number"
                  value={tenderCashAmount || orderToSettle.total}
                  onChange={e => setTenderCashAmount(Number(e.target.value))}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono font-bold"
                />
                {tenderCashAmount > (orderToSettle.total || 0) && (
                  <p className="text-xs text-emerald-500 font-bold mt-1">
                    Change to Return: ৳{Math.max(0, tenderCashAmount - (orderToSettle.total || 0)).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {settlePaymentMethod === 'Room Folio' && (
              <div className="space-y-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/50">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1 flex items-center justify-between">
                  <span>Select In-House Room to Post Charge:</span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono">
                    {inHouseStays.length} active stays
                  </span>
                </label>
                <select
                  value={settleStayId}
                  onChange={e => setSettleStayId(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                >
                  <option value="">-- Choose In-House Room / Guest --</option>
                  {inHouseStays.map(s => (
                    <option key={s.id} value={s.id}>
                      Room {s.roomNumber} – {s.guestName} ({s.roomTypeName}) {s.stopPost ? '⚠️ [STOP POST]' : ''}
                    </option>
                  ))}
                </select>

                {inHouseStays.find(s => s.id === settleStayId)?.stopPost && (
                  <div className="flex items-start gap-1.5 text-rose-600 dark:text-rose-400 text-[11px] font-semibold mt-1">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>STOP POST restriction active on this room. Charges cannot be posted to folio.</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOrderToSettle(null)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteSettlement}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-md"
              >
                Complete Settlement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: RESETTLE ORDER POPUP */}
      {/* ------------------------------------------------------------- */}
      {orderToResettle && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-blue-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-500 border border-blue-500/30">
                  <ArrowRightLeft className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Resettle Bill Tender</h3>
                  <span className="text-xs text-slate-400 font-mono">Bill #{orderToResettle.orderNumber}</span>
                </div>
              </div>
              <button onClick={() => setOrderToResettle(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/40 text-xs text-blue-700 dark:text-blue-300">
              Current Method: <span className="font-bold">{orderToResettle.paymentMethod || 'Direct Pay'}</span> (৳{orderToResettle.total})
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                New Payment Method:
              </label>
              <select
                value={resettleNewMethod}
                onChange={e => setResettleNewMethod(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
              >
                <option value="Credit Card">Credit Card (POS Terminal)</option>
                <option value="Cash">Cash</option>
                <option value="bKash / Mobile Pay">bKash / Nagad / Rocket</option>
                <option value="Room Folio">Charge to Room Folio</option>
                <option value="City Ledger">City Ledger / Corporate Account</option>
              </select>
            </div>

            {resettleNewMethod === 'Room Folio' && (
              <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800/50">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1 flex items-center justify-between">
                  <span>Select In-House Room to Post Folio Charge:</span>
                  <span className="text-[10px] text-blue-700 dark:text-blue-400 font-mono">
                    {inHouseStays.length} active stays
                  </span>
                </label>
                <select
                  value={resettleStayId}
                  onChange={e => setResettleStayId(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                >
                  <option value="">-- Choose In-House Room / Guest --</option>
                  {inHouseStays.map(s => (
                    <option key={s.id} value={s.id}>
                      Room {s.roomNumber} – {s.guestName} ({s.roomTypeName}) {s.stopPost ? '⚠️ [STOP POST]' : ''}
                    </option>
                  ))}
                </select>

                {inHouseStays.find(s => s.id === resettleStayId)?.stopPost && (
                  <div className="flex items-start gap-1.5 text-rose-600 dark:text-rose-400 text-[11px] font-semibold mt-1">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>STOP POST restriction active on this room. Resettlement to folio is blocked.</span>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Resettlement Justification:
              </label>
              <input
                type="text"
                value={resettleReason}
                onChange={e => setResettleReason(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOrderToResettle(null)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteResettlement}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition shadow-md"
              >
                Confirm Resettlement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Icon components
function ClipboardListIcon(props: any) {
  return <ClipboardList {...props} />;
}

function BookOpenIcon(props: any) {
  return <BookOpen {...props} />;
}
