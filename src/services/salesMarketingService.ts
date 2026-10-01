import { pmsService } from './pmsService';
import { CityLedgerAccount } from '../types/pms';

export interface CorporateAccountExtended extends CityLedgerAccount {
  discountPct: number;
  industry?: string;
  accountManager?: string;
  contractNumber?: string;
  totalRoomNights?: number;
  totalRevenue?: number;
  lastBookingDate?: string;
}

export interface TravelAgent {
  id: string;
  name: string;
  code: string;
  iataNumber?: string;
  contactPerson: string;
  phone: string;
  email: string;
  commissionType: 'Percentage' | 'Flat Fee';
  commissionRate: number; // e.g. 10 for 10%
  activeBookings: number;
  totalBookedRevenue: number;
  totalCommissionEarned: number;
  totalCommissionPaid: number;
  pendingCommission: number;
  status: 'Active' | 'Suspended' | 'Under Review';
  notes?: string;
  createdAt: string;
}

export interface SalesActivity {
  id: string;
  title: string;
  clientName: string;
  clientType: 'Corporate' | 'Travel Agent' | 'Lead' | 'Direct VIP';
  linkedId?: string; // corpId or leadId
  salesRep: string;
  activityType: 'Site Inspection' | 'Client Call' | 'Corporate Meeting' | 'Food Tasting' | 'Contract Signing' | 'Proposal Review';
  date: string;
  time?: string;
  outcomeNotes: string;
  status: 'Scheduled' | 'Completed' | 'Pending Review' | 'Cancelled';
  nextFollowUpDate?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
}

export interface SalesLead {
  id: string;
  title: string;
  clientCompany: string;
  contactPerson: string;
  phone: string;
  email: string;
  leadSource: 'Walk-in' | 'Corporate Referral' | 'Website' | 'Phone Inquiry' | 'Exhibition / Fair' | 'OTA Partner';
  eventType: 'Rooms Block' | 'Executive Retreat' | 'Annual General Meeting (AGM)' | 'Conference' | 'Banquet / Gala' | 'Wedding' | 'Seminar';
  expectedDate: string;
  expectedPax: number;
  expectedRooms?: number;
  expectedRevenue: number;
  probability: number; // 0 to 100
  stage: 'New Inquiry' | 'Qualification' | 'Proposal Sent' | 'Negotiation' | 'Contract Signed' | 'Converted' | 'Lost';
  assignedRep: string;
  notes?: string;
  createdAt: string;
  convertedReference?: string;
}

export interface SalesContract {
  id: string;
  contractNumber: string;
  corporateAccountId: string;
  clientName: string;
  effectiveDate: string;
  expiryDate: string;
  rateType: 'Corporate Master Agreement' | 'Volume Tier 1 Discount' | 'Executive Hall & Suites' | 'Fixed Room Rate Tariff';
  discountPct: number;
  minCommittedRoomNights: number;
  realizedRoomNights: number;
  creditLimit: number;
  paymentTerms: string;
  signedByHotelRep: string;
  signedByClientRep: string;
  specialConditions?: string;
  status: 'Active' | 'Expiring Soon' | 'Expired' | 'Terminated';
}

export interface SalesPromotion {
  id: string;
  code: string;
  title: string;
  name?: string;
  discountType: 'Percentage' | 'Fixed Amount' | 'Complimentary Perk';
  discountValue: number; // 25 for 25% or 1000 for 1000 BDT
  displayDiscount: string;
  minSpend: number;
  minBookingValue?: number;
  maxDiscountCap?: number;
  validFrom: string;
  startDate?: string;
  validTo: string;
  endDate?: string;
  applicableOutlets: ('Rooms' | 'Banquet' | 'Restaurant' | 'Activities')[];
  applicableTo?: string[];
  usageLimit?: number;
  maxRedemptions?: number;
  usageCount: number;
  currentRedemptions?: number;
  totalRevenueGenerated: number;
  revenueGenerated?: number;
  status: 'Active' | 'Paused' | 'Expired';
  description: string;
}

export type PromotionCampaign = SalesPromotion;

export interface AgentPayoutRecord {
  id: string;
  agentId: string;
  agentName: string;
  amount: number;
  payoutDate: string;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Cheque' | 'City Ledger Credit';
  referenceNumber: string;
  remarks?: string;
}

interface SalesMarketingState {
  corporateDetails: Record<string, Partial<CorporateAccountExtended>>;
  travelAgents: TravelAgent[];
  salesActivities: SalesActivity[];
  leads: SalesLead[];
  contracts: SalesContract[];
  promotions: SalesPromotion[];
  agentPayouts: AgentPayoutRecord[];
}

const STORAGE_KEY = 'cculb_sales_marketing_state_v1';

const INITIAL_AGENTS: TravelAgent[] = [
  {
    id: 'ta-1',
    code: 'TA-STRIP',
    name: 'ShareTrip Travel Services',
    iataNumber: 'IATA-420911',
    contactPerson: 'Shakil Rahman (Key Accounts)',
    phone: '+880 1911-334455',
    email: 'hoteldesk@sharetrip.net',
    commissionType: 'Percentage',
    commissionRate: 10,
    activeBookings: 14,
    totalBookedRevenue: 850000,
    totalCommissionEarned: 85000,
    totalCommissionPaid: 65000,
    pendingCommission: 20000,
    status: 'Active',
    notes: 'Primary domestic leisure and weekend package distributor',
    createdAt: '2026-01-10'
  },
  {
    id: 'ta-2',
    code: 'TA-GOZAY',
    name: 'GoZayaan Bangladesh',
    iataNumber: 'IATA-310822',
    contactPerson: 'Nabil Hasan (Supply Partner Head)',
    phone: '+880 1712-667788',
    email: 'partners@gozayaan.com',
    commissionType: 'Percentage',
    commissionRate: 12,
    activeBookings: 22,
    totalBookedRevenue: 1420000,
    totalCommissionEarned: 170400,
    totalCommissionPaid: 120000,
    pendingCommission: 50400,
    status: 'Active',
    notes: 'Premium OTA partner with guaranteed seasonal allocations',
    createdAt: '2026-02-01'
  },
  {
    id: 'ta-3',
    code: 'TA-FLEXP',
    name: 'Flight Expert Hospitality Desk',
    iataNumber: 'IATA-554190',
    contactPerson: 'Mehnaz Kabir (Contracting Lead)',
    phone: '+880 1814-112233',
    email: 'contracts@flightexpert.com',
    commissionType: 'Percentage',
    commissionRate: 8,
    activeBookings: 9,
    totalBookedRevenue: 490000,
    totalCommissionEarned: 39200,
    totalCommissionPaid: 39200,
    pendingCommission: 0,
    status: 'Active',
    notes: 'Inbound corporate flight and resort combo packages',
    createdAt: '2026-03-15'
  },
  {
    id: 'ta-4',
    code: 'OTA-BKGCOM',
    name: 'Booking.com Global Connectivity',
    iataNumber: 'OTA-GLOBAL-01',
    contactPerson: 'Account Manager (Dhaka Market)',
    phone: '+880 2-9887766',
    email: 'connectivity@booking.com',
    commissionType: 'Percentage',
    commissionRate: 15,
    activeBookings: 18,
    totalBookedRevenue: 1120000,
    totalCommissionEarned: 168000,
    totalCommissionPaid: 130000,
    pendingCommission: 38000,
    status: 'Active',
    notes: 'API Channel manager connected online travel agency',
    createdAt: '2026-01-01'
  }
];

const INITIAL_ACTIVITIES: SalesActivity[] = [
  {
    id: 'act-1',
    title: 'Site Inspection for Q4 Leadership Gala',
    clientName: 'Standard Chartered Bank Ltd.',
    clientType: 'Corporate',
    linkedId: 'cla-2',
    salesRep: 'Kamran Chowdhury',
    activityType: 'Site Inspection',
    date: '2026-09-02',
    time: '14:00',
    outcomeNotes: 'Client toured Grand Ballroom, Cottage Suites, and poolside lawn. Selected Grand Ballroom for 350 pax.',
    status: 'Completed',
    nextFollowUpDate: '2026-09-08',
    priority: 'High'
  },
  {
    id: 'act-2',
    title: 'Proposal Review for Annual Strategy Retreat',
    clientName: 'Unilever Bangladesh Leadership Team',
    clientType: 'Lead',
    linkedId: 'lead-2',
    salesRep: 'Nusrat Jahan',
    activityType: 'Client Call',
    date: '2026-09-03',
    time: '11:30',
    outcomeNotes: 'Sent revised banquet package proposal including outdoor BBQ dinner and team-building activities.',
    status: 'Pending Review',
    nextFollowUpDate: '2026-09-06',
    priority: 'Urgent'
  },
  {
    id: 'act-3',
    title: 'Annual Rate Agreement Signing Ceremony',
    clientName: 'Dhaka Chamber of Commerce (DCCI)',
    clientType: 'Corporate',
    linkedId: 'lead-1',
    salesRep: 'Kamran Chowdhury',
    activityType: 'Contract Signing',
    date: '2026-09-05',
    time: '15:30',
    outcomeNotes: 'Signed 2-day conference agreement with 20% room tariff waiver and 100 committed nights.',
    status: 'Scheduled',
    nextFollowUpDate: '2026-09-12',
    priority: 'High'
  },
  {
    id: 'act-4',
    title: 'Executive Chef Food Tasting for Medical Society',
    clientName: 'Bangladesh Orthopedic Society',
    clientType: 'Lead',
    linkedId: 'lead-3',
    salesRep: 'Nusrat Jahan',
    activityType: 'Food Tasting',
    date: '2026-09-08',
    time: '13:00',
    outcomeNotes: 'Special dietary menu tasting with Executive Chef for 500-pax annual surgeons convention.',
    status: 'Scheduled',
    nextFollowUpDate: '2026-09-10',
    priority: 'Medium'
  }
];

const INITIAL_LEADS: SalesLead[] = [
  {
    id: 'lead-1',
    title: 'Annual General Meeting & Gala Dinner 2026',
    clientCompany: 'Dhaka Chamber of Commerce (DCCI)',
    contactPerson: 'Engr. M. A. Jabbar',
    phone: '+880 1711-889900',
    email: 'secretary@dcci-bd.org',
    leadSource: 'Corporate Referral',
    eventType: 'Annual General Meeting (AGM)',
    expectedDate: '2026-09-20',
    expectedPax: 350,
    expectedRooms: 40,
    expectedRevenue: 750000,
    probability: 85,
    stage: 'Proposal Sent',
    assignedRep: 'Kamran Chowdhury',
    notes: 'Require Grand Ballroom with live AV broadcast, buffet lunch, and 40 Deluxe Cottages for dignitaries.',
    createdAt: '2026-08-20'
  },
  {
    id: 'lead-2',
    title: 'Winter Executive Retreat & Brainstorming',
    clientCompany: 'Unilever Bangladesh Leadership Team',
    contactPerson: 'Ms. Fahmida Shireen (HR Director)',
    phone: '+880 1819-223344',
    email: 'fahmida.shireen@unilever.com',
    leadSource: 'Phone Inquiry',
    eventType: 'Executive Retreat',
    expectedDate: '2026-10-05',
    expectedPax: 45,
    expectedRooms: 35,
    expectedRevenue: 480000,
    probability: 70,
    stage: 'Negotiation',
    assignedRep: 'Nusrat Jahan',
    notes: 'Seeking private conference hall setup, swimming pool BBQ lounge, and spa packages.',
    createdAt: '2026-08-25'
  },
  {
    id: 'lead-3',
    title: 'National Orthopedic Surgeons Conference 2026',
    clientCompany: 'Bangladesh Orthopedic Society',
    contactPerson: 'Prof. Dr. Shahidul Huq',
    phone: '+880 1713-776655',
    email: 'info@bos-bd.org',
    leadSource: 'Exhibition / Fair',
    eventType: 'Conference',
    expectedDate: '2026-11-12',
    expectedPax: 500,
    expectedRooms: 75,
    expectedRevenue: 1250000,
    probability: 90,
    stage: 'Contract Signed',
    assignedRep: 'Kamran Chowdhury',
    notes: 'Full resort buyout of cottages for 2 nights, concurrent multi-hall medical workshops.',
    createdAt: '2026-08-15'
  },
  {
    id: 'lead-4',
    title: 'South Asian Tech Summit & Hackathon',
    clientCompany: 'Bangladesh Association of Software (BASIS)',
    contactPerson: 'Tanvir Mahmud',
    phone: '+880 1912-445566',
    email: 'events@basis.org.bd',
    leadSource: 'Website',
    eventType: 'Conference',
    expectedDate: '2026-12-04',
    expectedPax: 220,
    expectedRooms: 50,
    expectedRevenue: 620000,
    probability: 50,
    stage: 'Qualification',
    assignedRep: 'Nusrat Jahan',
    notes: 'High-speed dedicated fiber optic internet required across resort.',
    createdAt: '2026-09-01'
  }
];

const INITIAL_CONTRACTS: SalesContract[] = [
  {
    id: 'cnt-1',
    contractNumber: 'CTR-2026-089',
    corporateAccountId: 'cla-3',
    clientName: 'Beximco Pharmaceuticals Ltd.',
    effectiveDate: '2026-01-01',
    expiryDate: '2026-12-31',
    rateType: 'Corporate Master Agreement',
    discountPct: 15,
    minCommittedRoomNights: 120,
    realizedRoomNights: 78,
    creditLimit: 300000,
    paymentTerms: 'Net 30',
    signedByHotelRep: 'General Manager, CCULB Resort',
    signedByClientRep: 'Dr. Asif Kamal (VP Supply)',
    specialConditions: 'Complimentary high-speed WiFi, late checkout till 15:00 subject to availability.',
    status: 'Active'
  },
  {
    id: 'cnt-2',
    contractNumber: 'CTR-2026-104',
    corporateAccountId: 'cla-1',
    clientName: 'Grameenphone Ltd.',
    effectiveDate: '2026-03-01',
    expiryDate: '2027-02-28',
    rateType: 'Volume Tier 1 Discount',
    discountPct: 25,
    minCommittedRoomNights: 300,
    realizedRoomNights: 184,
    creditLimit: 500000,
    paymentTerms: 'Net 30',
    signedByHotelRep: 'Director of Sales & Marketing',
    signedByClientRep: 'Syed Ashfaqur Rahman (HR & Admin Manager)',
    specialConditions: 'Direct billing to City Ledger Account CL-2026-001. 10% F&B discount for all resident guests.',
    status: 'Active'
  },
  {
    id: 'cnt-3',
    contractNumber: 'CTR-2026-112',
    corporateAccountId: 'cla-2',
    clientName: 'Standard Chartered Bank Ltd.',
    effectiveDate: '2026-06-01',
    expiryDate: '2027-05-31',
    rateType: 'Executive Hall & Suites',
    discountPct: 20,
    minCommittedRoomNights: 150,
    realizedRoomNights: 92,
    creditLimit: 400000,
    paymentTerms: 'Net 30',
    signedByHotelRep: 'Director of Sales & Marketing',
    signedByClientRep: 'Tanveer Ahmed (AVP Corporate Services)',
    specialConditions: 'Includes priority reservation hold up to 48 hours prior to arrival.',
    status: 'Active'
  }
];

const INITIAL_PROMOTIONS: SalesPromotion[] = [
  {
    id: 'prm-1',
    code: 'MONSOON25',
    title: 'Monsoon Resort Serenity Getaway',
    name: 'Monsoon Resort Serenity Getaway',
    discountType: 'Percentage',
    discountValue: 25,
    displayDiscount: '25% Off Room Tariff',
    minSpend: 5000,
    minBookingValue: 5000,
    maxDiscountCap: 4000,
    validFrom: '2026-07-01',
    startDate: '2026-07-01',
    validTo: '2026-09-30',
    endDate: '2026-09-30',
    applicableOutlets: ['Rooms'],
    applicableTo: ['Online Direct', 'Walk-in', 'Corporate'],
    usageLimit: 100,
    maxRedemptions: 100,
    usageCount: 48,
    currentRedemptions: 48,
    totalRevenueGenerated: 340000,
    revenueGenerated: 340000,
    status: 'Active',
    description: 'Special monsoon weekday and weekend discount on Deluxe Cottages and Family Villas.'
  },
  {
    id: 'prm-2',
    code: 'CORPEXEC',
    title: 'Corporate Executive Suite Upgrade & Tea',
    name: 'Corporate Executive Suite Upgrade & Tea',
    discountType: 'Percentage',
    discountValue: 15,
    displayDiscount: '15% Off + Compl. High Tea',
    minSpend: 8000,
    minBookingValue: 8000,
    maxDiscountCap: 5000,
    validFrom: '2026-01-01',
    startDate: '2026-01-01',
    validTo: '2026-12-31',
    endDate: '2026-12-31',
    applicableOutlets: ['Rooms', 'Restaurant'],
    applicableTo: ['Corporate', 'Online Direct'],
    usageLimit: 300,
    maxRedemptions: 300,
    usageCount: 112,
    currentRedemptions: 112,
    totalRevenueGenerated: 890000,
    revenueGenerated: 890000,
    status: 'Active',
    description: 'Corporate client privilege promotion with complimentary afternoon tea service.'
  },
  {
    id: 'prm-3',
    code: 'BANQUET50',
    title: 'Grand Hall Advance Booking Perk',
    name: 'Grand Hall Advance Booking Perk',
    discountType: 'Fixed Amount',
    discountValue: 15000,
    displayDiscount: '৳15,000 Off Hall Setup',
    minSpend: 150000,
    minBookingValue: 150000,
    validFrom: '2026-08-01',
    startDate: '2026-08-01',
    validTo: '2026-11-30',
    endDate: '2026-11-30',
    applicableOutlets: ['Banquet'],
    applicableTo: ['Banquet', 'Corporate Events'],
    usageLimit: 30,
    maxRedemptions: 30,
    usageCount: 16,
    currentRedemptions: 16,
    totalRevenueGenerated: 1850000,
    revenueGenerated: 1850000,
    status: 'Active',
    description: 'Fixed credit waiver on stage lighting and sound equipment package for Grand Ballroom.'
  },
  {
    id: 'prm-4',
    code: 'SUMMERFUN',
    title: 'Family Weekend Splash & Dine',
    name: 'Family Weekend Splash & Dine',
    discountType: 'Percentage',
    discountValue: 20,
    displayDiscount: '20% Off Activities & Dining',
    minSpend: 3000,
    minBookingValue: 3000,
    validFrom: '2026-05-01',
    startDate: '2026-05-01',
    validTo: '2026-10-31',
    endDate: '2026-10-31',
    applicableOutlets: ['Restaurant', 'Activities'],
    applicableTo: ['Walk-in', 'Resident Guests'],
    usageLimit: 150,
    maxRedemptions: 150,
    usageCount: 74,
    currentRedemptions: 74,
    totalRevenueGenerated: 260000,
    revenueGenerated: 260000,
    status: 'Active',
    description: 'Discount applies to water sports, speed boating, swimming pool cabanas, and family buffet.'
  }
];

class SalesMarketingService {
  private state: SalesMarketingState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadState();
  }

  private sanitizePromotions(promos: SalesPromotion[]): SalesPromotion[] {
    return promos.map(p => {
      const name = p.name || p.title || p.code || 'Promotion Campaign';
      const title = p.title || name;
      const validFrom = p.validFrom || p.startDate || '2026-01-01';
      const startDate = p.startDate || validFrom;
      const validTo = p.validTo || p.endDate || '2026-12-31';
      const endDate = p.endDate || validTo;
      const minSpend = p.minSpend ?? p.minBookingValue ?? 0;
      const usageLimit = p.usageLimit ?? p.maxRedemptions ?? 100;
      const maxRedemptions = p.maxRedemptions ?? usageLimit;
      const usageCount = p.usageCount ?? p.currentRedemptions ?? 0;
      const currentRedemptions = p.currentRedemptions ?? usageCount;
      const totalRevenueGenerated = p.totalRevenueGenerated ?? p.revenueGenerated ?? 0;
      const revenueGenerated = p.revenueGenerated ?? totalRevenueGenerated;

      return {
        ...p,
        name,
        title,
        validFrom,
        startDate,
        validTo,
        endDate,
        minSpend,
        minBookingValue: minSpend,
        usageLimit,
        maxRedemptions,
        usageCount,
        currentRedemptions,
        totalRevenueGenerated,
        revenueGenerated,
        description: p.description || 'Special promotion campaign'
      };
    });
  }

  private loadState(): SalesMarketingState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const promos = parsed.promotions && parsed.promotions.length > 0
          ? this.sanitizePromotions(parsed.promotions)
          : INITIAL_PROMOTIONS;

        return {
          corporateDetails: parsed.corporateDetails || {},
          travelAgents: parsed.travelAgents || INITIAL_AGENTS,
          salesActivities: parsed.salesActivities || INITIAL_ACTIVITIES,
          leads: parsed.leads || INITIAL_LEADS,
          contracts: parsed.contracts || INITIAL_CONTRACTS,
          promotions: promos,
          agentPayouts: parsed.agentPayouts || []
        };
      }
    } catch (e) {
      console.warn('Could not load SalesMarketingState from localStorage', e);
    }

    return {
      corporateDetails: {
        'cla-1': { discountPct: 25, industry: 'Telecommunications', accountManager: 'Kamran Chowdhury', contractNumber: 'CTR-2026-104', totalRoomNights: 184, totalRevenue: 1850000 },
        'cla-2': { discountPct: 20, industry: 'Banking & Financial Services', accountManager: 'Kamran Chowdhury', contractNumber: 'CTR-2026-112', totalRoomNights: 92, totalRevenue: 980000 },
        'cla-3': { discountPct: 15, industry: 'Pharmaceuticals & Healthcare', accountManager: 'Nusrat Jahan', contractNumber: 'CTR-2026-089', totalRoomNights: 78, totalRevenue: 820000 },
        'cla-4': { discountPct: 10, industry: 'Apparel & Ready Made Garments', accountManager: 'Nusrat Jahan', contractNumber: 'CTR-2026-045', totalRoomNights: 45, totalRevenue: 490000 }
      },
      travelAgents: INITIAL_AGENTS,
      salesActivities: INITIAL_ACTIVITIES,
      leads: INITIAL_LEADS,
      contracts: INITIAL_CONTRACTS,
      promotions: this.sanitizePromotions(INITIAL_PROMOTIONS),
      agentPayouts: []
    };
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save SalesMarketingState to localStorage', e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.saveState();
    this.listeners.forEach(fn => fn());
  }

  // --- CORPORATE ACCOUNTS (Integrated with pmsService.cityLedgerAccounts) ---
  public getCorporateAccounts(): CorporateAccountExtended[] {
    const pmsState = pmsService.getState();
    const cityAccounts = pmsState.cityLedgerAccounts || [];

    return cityAccounts.map(ca => {
      const extra = this.state.corporateDetails[ca.id] || {};
      return {
        ...ca,
        discountPct: extra.discountPct ?? 15,
        industry: extra.industry || 'Corporate Commercial',
        accountManager: extra.accountManager || 'Corporate Sales Desk',
        contractNumber: extra.contractNumber || 'Standard Tariff Agreement',
        totalRoomNights: extra.totalRoomNights ?? 12,
        totalRevenue: extra.totalRevenue ?? (ca.currentBalance * 2.5),
        lastBookingDate: extra.lastBookingDate || '2026-08-28'
      };
    });
  }

  public createCorporateAccount(data: {
    companyName: string;
    contactPerson: string;
    phone: string;
    email: string;
    creditLimit: number;
    paymentTerms: 'Immediate' | 'Net 15' | 'Net 30' | 'Net 45' | 'Net 60';
    discountPct: number;
    industry: string;
    accountManager: string;
    taxNumber?: string;
    address?: string;
    notes?: string;
  }): { success: boolean; account?: CorporateAccountExtended; message: string } {
    // 1. Call pmsService to create the City Ledger Account in the Core PMS DB
    const res = pmsService.createCityLedgerAccount({
      companyName: data.companyName,
      contactPerson: data.contactPerson,
      phone: data.phone,
      email: data.email,
      creditLimit: data.creditLimit,
      paymentTerms: data.paymentTerms,
      status: 'Active',
      taxNumber: data.taxNumber,
      address: data.address,
      notes: data.notes
    });

    if (!res.success || !res.account) {
      return { success: false, message: res.message };
    }

    // 2. Save commercial metadata
    this.state.corporateDetails[res.account.id] = {
      discountPct: data.discountPct || 15,
      industry: data.industry || 'Corporate Enterprise',
      accountManager: data.accountManager || 'Kamran Chowdhury',
      totalRoomNights: 0,
      totalRevenue: 0,
      lastBookingDate: new Date().toISOString().split('T')[0]
    };

    // 3. Auto-generate contract record
    const contractNo = `CTR-${new Date().getFullYear()}-${String(this.state.contracts.length + 101).padStart(3, '0')}`;
    this.state.corporateDetails[res.account.id].contractNumber = contractNo;

    this.state.contracts.unshift({
      id: `cnt-${Date.now()}`,
      contractNumber: contractNo,
      corporateAccountId: res.account.id,
      clientName: data.companyName,
      effectiveDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      rateType: 'Corporate Master Agreement',
      discountPct: data.discountPct || 15,
      minCommittedRoomNights: 60,
      realizedRoomNights: 0,
      creditLimit: data.creditLimit,
      paymentTerms: data.paymentTerms,
      signedByHotelRep: 'Director of Sales & Marketing',
      signedByClientRep: data.contactPerson,
      specialConditions: `Negotiated corporate rate of ${data.discountPct}% off rack tariff with direct City Ledger credit facility.`,
      status: 'Active'
    });

    this.notify();
    return {
      success: true,
      account: {
        ...res.account,
        discountPct: data.discountPct || 15,
        industry: data.industry,
        accountManager: data.accountManager
      },
      message: `Corporate client ${data.companyName} registered with ${data.discountPct}% tariff agreement & City Ledger ${res.account.accountNumber}.`
    };
  }

  public updateCorporateAccount(id: string, data: Partial<CorporateAccountExtended>): { success: boolean; message: string } {
    pmsService.updateCityLedgerAccount(id, {
      companyName: data.companyName,
      contactPerson: data.contactPerson,
      phone: data.phone,
      email: data.email,
      creditLimit: data.creditLimit,
      paymentTerms: data.paymentTerms,
      status: data.status,
      taxNumber: data.taxNumber,
      address: data.address,
      notes: data.notes
    });

    if (!this.state.corporateDetails[id]) {
      this.state.corporateDetails[id] = {};
    }
    if (data.discountPct !== undefined) this.state.corporateDetails[id].discountPct = data.discountPct;
    if (data.industry !== undefined) this.state.corporateDetails[id].industry = data.industry;
    if (data.accountManager !== undefined) this.state.corporateDetails[id].accountManager = data.accountManager;

    this.notify();
    return { success: true, message: 'Corporate account updated successfully.' };
  }

  public recordCorporateSettlement(accountId: string, amount: number, method: string, reference: string, notes?: string): { success: boolean; message: string } {
    return pmsService.recordCityLedgerPayment(accountId, amount, method, reference, notes);
  }

  // --- TRAVEL AGENTS & OTAs ---
  public getTravelAgents(): TravelAgent[] {
    return this.state.travelAgents;
  }

  public addTravelAgent(data: Omit<TravelAgent, 'id' | 'createdAt' | 'activeBookings' | 'totalBookedRevenue' | 'totalCommissionEarned' | 'totalCommissionPaid' | 'pendingCommission'>): TravelAgent {
    const newAgent: TravelAgent = {
      ...data,
      id: `ta-${Date.now()}`,
      activeBookings: 0,
      totalBookedRevenue: 0,
      totalCommissionEarned: 0,
      totalCommissionPaid: 0,
      pendingCommission: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };
    this.state.travelAgents.unshift(newAgent);
    this.notify();
    return newAgent;
  }

  public updateTravelAgent(id: string, updates: Partial<TravelAgent>): { success: boolean; message: string } {
    const idx = this.state.travelAgents.findIndex(a => a.id === id);
    if (idx === -1) return { success: false, message: 'Agent not found' };
    this.state.travelAgents[idx] = { ...this.state.travelAgents[idx], ...updates };
    this.notify();
    return { success: true, message: 'Travel agent updated successfully.' };
  }

  public recordAgentCommissionPayout(data: {
    agentId: string;
    amount: number;
    paymentMethod: 'Cash' | 'Bank Transfer' | 'Cheque' | 'City Ledger Credit';
    referenceNumber: string;
    remarks?: string;
  }): { success: boolean; message: string } {
    const agent = this.state.travelAgents.find(a => a.id === data.agentId);
    if (!agent) return { success: false, message: 'Agent not found' };
    if (data.amount <= 0) return { success: false, message: 'Amount must be greater than 0' };

    agent.totalCommissionPaid += data.amount;
    agent.pendingCommission = Math.max(0, agent.totalCommissionEarned - agent.totalCommissionPaid);

    const payout: AgentPayoutRecord = {
      id: `pay-${Date.now()}`,
      agentId: agent.id,
      agentName: agent.name,
      amount: data.amount,
      payoutDate: new Date().toISOString().split('T')[0],
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber,
      remarks: data.remarks
    };
    this.state.agentPayouts.unshift(payout);

    // Auto-create Journal Voucher in Core General Ledger
    pmsService.createJournalVoucher({
      date: pmsService.getState().settings.currentBusinessDate || new Date().toISOString().split('T')[0],
      sourceModule: 'Cashier Settlement',
      sourceReference: data.referenceNumber || `TA-PAY-${Date.now()}`,
      narration: `Travel Agent commission settlement paid to ${agent.name} via ${data.paymentMethod}. Ref: ${data.referenceNumber}`,
      entries: [
        { id: `jve-${Date.now()}-1`, accountCode: '5050', accountName: 'Sales Commission & Travel Agent Payouts', debit: data.amount, credit: 0, memo: `Commission expense for ${agent.name}` },
        { id: `jve-${Date.now()}-2`, accountCode: '1010', accountName: 'Cash in Vault & Commercial Bank Accounts', debit: 0, credit: data.amount, memo: `Disbursement via ${data.paymentMethod}` }
      ]
    });

    this.notify();
    return { success: true, message: `Disbursed ৳${(data.amount || 0).toLocaleString()} commission payout to ${agent.name} & posted to General Ledger.` };
  }

  public getAgentPayouts(): AgentPayoutRecord[] {
    return this.state.agentPayouts;
  }

  // --- SALES ACTIVITIES ---
  public getSalesActivities(): SalesActivity[] {
    return this.state.salesActivities;
  }

  public addSalesActivity(data: Omit<SalesActivity, 'id'>): SalesActivity {
    const newAct: SalesActivity = {
      ...data,
      id: `act-${Date.now()}`
    };
    this.state.salesActivities.unshift(newAct);
    this.notify();
    return newAct;
  }

  public updateSalesActivity(id: string, updates: Partial<SalesActivity>): { success: boolean; message: string } {
    const idx = this.state.salesActivities.findIndex(a => a.id === id);
    if (idx === -1) return { success: false, message: 'Activity not found' };
    this.state.salesActivities[idx] = { ...this.state.salesActivities[idx], ...updates };
    this.notify();
    return { success: true, message: 'Sales activity updated.' };
  }

  // --- LEADS & PIPELINE ---
  public getLeads(): SalesLead[] {
    return this.state.leads;
  }

  public addLead(data: Omit<SalesLead, 'id' | 'createdAt'>): SalesLead {
    const newLead: SalesLead = {
      ...data,
      id: `lead-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    this.state.leads.unshift(newLead);
    this.notify();
    return newLead;
  }

  public updateLead(id: string, updates: Partial<SalesLead>): { success: boolean; message: string } {
    const idx = this.state.leads.findIndex(l => l.id === id);
    if (idx === -1) return { success: false, message: 'Lead not found' };
    this.state.leads[idx] = { ...this.state.leads[idx], ...updates };
    this.notify();
    return { success: true, message: 'Lead updated successfully.' };
  }

  public convertLeadToReservation(leadId: string): { success: boolean; reservationId?: string; message: string } {
    const lead = this.state.leads.find(l => l.id === leadId);
    if (!lead) return { success: false, message: 'Lead not found' };

    try {
      const pmsState = pmsService.getState();
      let guest = pmsState.guests.find(g => g.phone === lead.phone);
      if (!guest) {
        guest = pmsService.createGuest({
          fullName: lead.contactPerson,
          phone: lead.phone,
          email: lead.email || `${lead.phone.replace(/[^0-9]/g, '')}@corp.resort.bd`,
          gender: 'Male',
          nationality: 'Bangladeshi',
          city: 'Dhaka',
          country: 'Bangladesh',
          address: `${lead.clientCompany}, Dhaka, Bangladesh`,
          idType: 'National ID (NID)',
          idNumber: `NID-${Date.now().toString().slice(-8)}`,
          company: lead.clientCompany,
          notes: `Created from Sales Lead: ${lead.title}`
        });
      }

      const roomType = pmsState.roomTypes[0];
      const reservation = pmsService.createReservation({
        guestId: guest.id,
        roomTypeId: roomType?.id || 'rt-5',
        arrivalDate: lead.expectedDate,
        departureDate: new Date(new Date(lead.expectedDate).getTime() + 86400000 * 2).toISOString().split('T')[0],
        adults: Math.max(1, Math.min(2, lead.expectedPax)),
        children: 0,
        bookingSource: 'Corporate',
        depositAmount: 5000,
        specialRequests: `Converted from Sales Lead ${lead.title} (${lead.clientCompany}). Pax: ${lead.expectedPax}. Expected value: ৳${(lead.expectedRevenue || 0).toLocaleString()}`
      });

      lead.stage = 'Converted';
      lead.convertedReference = `RES: ${reservation.reservationNumber}`;
      this.notify();
      return {
        success: true,
        reservationId: reservation.id,
        message: `Lead successfully converted into Room Reservation ${reservation.reservationNumber}!`
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to create reservation' };
    }
  }

  public convertLeadToBanquetEvent(leadId: string, hallId?: string): { success: boolean; eventId?: string; message: string } {
    const lead = this.state.leads.find(l => l.id === leadId);
    if (!lead) return { success: false, message: 'Lead not found' };

    try {
      const pmsState = pmsService.getState();
      const targetHall = pmsState.halls.find(h => h.id === hallId) || pmsState.halls[0];

      const event = pmsService.createEventBooking({
        clientName: lead.contactPerson,
        clientCompany: lead.clientCompany,
        clientPhone: lead.phone,
        clientEmail: lead.email,
        hallId: targetHall?.id || 'hl-1',
        eventName: lead.title,
        eventType: lead.eventType.includes('AGM') ? 'Annual General Meeting (AGM)' : (lead.eventType.includes('Wedding') ? 'Wedding' : 'Corporate'),
        eventDate: lead.expectedDate,
        startTime: '10:00',
        endTime: '18:00',
        guestCount: lead.expectedPax,
        items: [
          {
            itemType: 'Hall Rent',
            description: `${targetHall?.name || 'Grand Ballroom'} Full Day Rental`,
            quantity: 1,
            unitPrice: Math.round(lead.expectedRevenue * 0.4)
          },
          {
            itemType: 'Food Package',
            description: 'Executive Buffet Lunch & Tea Services',
            quantity: lead.expectedPax,
            unitPrice: Math.round((lead.expectedRevenue * 0.6) / Math.max(1, lead.expectedPax))
          }
        ],
        depositAmount: Math.round(lead.expectedRevenue * 0.25),
        paymentMethod: 'Bank Transfer',
        notes: `Converted from Sales Lead: ${lead.title}`
      });

      lead.stage = 'Converted';
      lead.convertedReference = `EVENT: ${event.eventNumber}`;
      this.notify();
      return {
        success: true,
        eventId: event.id,
        message: `Lead successfully converted to Banquet Event ${event.eventNumber} in ${targetHall?.name || 'Venue'}!`
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to create banquet event' };
    }
  }

  // --- CONTRACTS ---
  public getContracts(): SalesContract[] {
    return this.state.contracts;
  }

  public addContract(data: Omit<SalesContract, 'id'>): SalesContract {
    const newContract: SalesContract = {
      ...data,
      id: `cnt-${Date.now()}`
    };
    this.state.contracts.unshift(newContract);
    this.notify();
    return newContract;
  }

  public updateContract(id: string, updates: Partial<SalesContract>): { success: boolean; message: string } {
    const idx = this.state.contracts.findIndex(c => c.id === id);
    if (idx === -1) return { success: false, message: 'Contract not found' };
    this.state.contracts[idx] = { ...this.state.contracts[idx], ...updates };
    this.notify();
    return { success: true, message: 'Contract updated successfully.' };
  }

  // --- PROMOTIONS ---
  public getPromotions(): SalesPromotion[] {
    return this.state.promotions;
  }

  public addPromotion(data: Partial<SalesPromotion> & { code: string; discountType: SalesPromotion['discountType']; discountValue: number }): SalesPromotion {
    const title = data.title || data.name || data.code;
    const name = data.name || title;
    const validFrom = data.validFrom || data.startDate || new Date().toISOString().split('T')[0];
    const validTo = data.validTo || data.endDate || '2026-12-31';
    const minSpend = data.minSpend ?? data.minBookingValue ?? 0;
    const displayDiscount = data.displayDiscount || (data.discountType === 'Percentage' ? `${data.discountValue}% Off` : `৳${(data.discountValue || 0).toLocaleString()} Off`);

    const newPromo: SalesPromotion = {
      id: `prm-${Date.now()}`,
      code: data.code.toUpperCase().trim(),
      title,
      name,
      discountType: data.discountType,
      discountValue: data.discountValue,
      displayDiscount,
      minSpend,
      minBookingValue: minSpend,
      maxDiscountCap: data.maxDiscountCap,
      validFrom,
      startDate: validFrom,
      validTo,
      endDate: validTo,
      applicableOutlets: data.applicableOutlets || ['Rooms', 'Banquet', 'Restaurant', 'Activities'],
      applicableTo: data.applicableTo || ['Online Direct', 'Walk-in', 'Corporate'],
      usageLimit: data.usageLimit ?? data.maxRedemptions ?? 100,
      maxRedemptions: data.maxRedemptions ?? data.usageLimit ?? 100,
      usageCount: 0,
      currentRedemptions: 0,
      totalRevenueGenerated: 0,
      revenueGenerated: 0,
      status: data.status || 'Active',
      description: data.description || 'Promotional seasonal campaign'
    };
    this.state.promotions.unshift(newPromo);
    this.notify();
    return newPromo;
  }

  public updatePromotion(id: string, updates: Partial<SalesPromotion>): { success: boolean; message: string } {
    const idx = this.state.promotions.findIndex(p => p.id === id);
    if (idx === -1) return { success: false, message: 'Promotion not found' };
    this.state.promotions[idx] = { ...this.state.promotions[idx], ...updates };
    this.notify();
    return { success: true, message: 'Promotion updated successfully.' };
  }

  public validatePromoCode(code: string, amount: number, outlet: 'Rooms' | 'Banquet' | 'Restaurant' | 'Activities' = 'Rooms'): {
    valid: boolean;
    discountAmount: number;
    finalAmount: number;
    promo?: SalesPromotion;
    message: string;
  } {
    const cleanCode = (code || '').trim().toUpperCase();
    const promo = this.state.promotions.find(p => p.code.toUpperCase() === cleanCode && p.status === 'Active');

    if (!promo) {
      return { valid: false, discountAmount: 0, finalAmount: amount, message: `Promo code '${code}' is invalid or expired.` };
    }

    const today = new Date().toISOString().split('T')[0];
    const from = promo.validFrom || promo.startDate || '';
    const to = promo.validTo || promo.endDate || '';
    if ((from && today < from) || (to && today > to)) {
      return { valid: false, discountAmount: 0, finalAmount: amount, message: `Promo code is only valid from ${from} to ${to}.` };
    }

    if (promo.applicableOutlets && promo.applicableOutlets.length > 0 && !promo.applicableOutlets.includes(outlet)) {
      return { valid: false, discountAmount: 0, finalAmount: amount, message: `This promo code cannot be applied to ${outlet} transactions.` };
    }

    const minSpend = promo.minSpend ?? promo.minBookingValue ?? 0;
    if (amount < minSpend) {
      return { valid: false, discountAmount: 0, finalAmount: amount, message: `Minimum spend required for this promo is ৳${(minSpend || 0).toLocaleString()}.` };
    }

    let discount = 0;
    if (promo.discountType === 'Percentage') {
      discount = (amount * promo.discountValue) / 100;
      if (promo.maxDiscountCap && discount > promo.maxDiscountCap) {
        discount = promo.maxDiscountCap;
      }
    } else if (promo.discountType === 'Fixed Amount') {
      discount = Math.min(amount, promo.discountValue);
    } else {
      // Complimentary Perk
      discount = 0;
    }

    return {
      valid: true,
      discountAmount: discount,
      finalAmount: Math.max(0, amount - discount),
      promo,
      message: `Promo code applied! Enjoy ${promo.displayDiscount || `${promo.discountValue}% Off`} (${discount > 0 ? `৳${(discount || 0).toLocaleString()} savings` : 'Perk applied'}).`
    };
  }

  public applyPromoCode(code: string, amount: number, outlet: 'Rooms' | 'Banquet' | 'Restaurant' | 'Activities' = 'Rooms'): {
    valid: boolean;
    discountAmount: number;
    finalAmount: number;
    promo?: SalesPromotion;
    message: string;
  } {
    const res = this.validatePromoCode(code, amount, outlet);
    if (res.valid && res.promo) {
      res.promo.usageCount = (res.promo.usageCount || 0) + 1;
      res.promo.currentRedemptions = (res.promo.currentRedemptions || 0) + 1;
      res.promo.totalRevenueGenerated = (res.promo.totalRevenueGenerated || 0) + res.finalAmount;
      res.promo.revenueGenerated = (res.promo.revenueGenerated || 0) + res.finalAmount;
      this.notify();
    }
    return res;
  }
}

export const salesMarketingService = new SalesMarketingService();
