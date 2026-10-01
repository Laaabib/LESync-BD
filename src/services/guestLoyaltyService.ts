import { pmsService } from './pmsService';
import { Guest } from '../types/pms';

export type LoyaltyTier = 'Diamond Royal' | 'Platinum Ambassador' | 'Gold Elite' | 'Silver Preferred' | 'Bronze Explorer';

export interface TierConfig {
  tier: LoyaltyTier;
  minStays: number;
  minSpend: number; // in BDT (৳)
  pointsMultiplier: number; // e.g. 1.0, 1.5, 2.0
  roomDiscountPct: number;
  fnbDiscountPct: number;
  spaDiscountPct: number;
  perks: string[];
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
}

export interface LoyaltyRewardItem {
  id: string;
  name: string;
  category: 'Room Upgrade' | 'Dining' | 'Spa & Wellness' | 'Transportation' | 'Free Night' | 'Banquets';
  pointsCost: number;
  description: string;
  voucherValidityDays: number;
  iconName: string;
}

export interface LoyaltyVoucher {
  id: string;
  memberId: string;
  rewardId: string;
  rewardName: string;
  code: string;
  pointsDeducted: number;
  issuedAt: string;
  expiresAt: string;
  status: 'Available' | 'Redeemed' | 'Expired';
  redeemedAt?: string;
  outletUsed?: string;
}

export interface IncidentRecoveryLog {
  id: string;
  date: string;
  category: 'Front Desk' | 'Housekeeping' | 'F&B' | 'Maintenance' | 'Billing';
  issue: string;
  resolution: string;
  compensationPoints?: number;
  recordedBy: string;
}

export interface GuestLoyaltyMember {
  id: string;
  guestId?: string;
  membershipNumber: string;
  fullName: string;
  phone: string;
  email: string;
  company?: string;
  designation?: string;
  tier: LoyaltyTier;
  enrolledDate: string;
  tierExpiresDate: string;
  currentPoints: number;
  lifetimePointsEarned: number;
  lifetimePointsRedeemed: number;
  totalStays: number;
  totalNights: number;
  lifetimeSpend: number; // in BDT
  preferredRoomType: string;
  roomPreferences: string[];
  dietaryPreferences: string[];
  specialDates: {
    title: string;
    date: string; // YYYY-MM-DD
  }[];
  vipProtocolNotes: string;
  internalServiceNotes: string;
  incidentHistory: IncidentRecoveryLog[];
  redeemedVouchers: LoyaltyVoucher[];
  status: 'Active' | 'Suspended' | 'Lapsed';
  lastActivityDate: string;
}

export const TIER_CONFIGS: Record<LoyaltyTier, TierConfig> = {
  'Diamond Royal': {
    tier: 'Diamond Royal',
    minStays: 35,
    minSpend: 750000,
    pointsMultiplier: 3.0,
    roomDiscountPct: 20,
    fnbDiscountPct: 15,
    spaDiscountPct: 25,
    perks: [
      'Guaranteed Suite Upgrade upon availability',
      'Personal Butler & Front Office Escort',
      'Complimentary Executive Airport Limousine Transfer',
      '24-Hour Flexible Check-in / Late Check-out (until 18:00)',
      'Complimentary Daily Gourmet Breakfast for 2',
      'Stop-Post Direct Folio Exemption up to ৳100,000',
      'VIP Lounge & Pool Cabana Unlimited Access'
    ],
    badgeColor: 'text-amber-300',
    badgeBg: 'bg-amber-950/80',
    badgeBorder: 'border-amber-500/80'
  },
  'Platinum Ambassador': {
    tier: 'Platinum Ambassador',
    minStays: 20,
    minSpend: 350000,
    pointsMultiplier: 2.0,
    roomDiscountPct: 15,
    fnbDiscountPct: 10,
    spaDiscountPct: 20,
    perks: [
      'Priority Room Upgrade to next category',
      'Daily Complimentary Breakfast for 2',
      'Guaranteed 15:00 Late Check-out & 11:00 Early Check-in',
      'Welcome Fruit Basket, Artisanal Chocolates & Mocktails',
      'Complimentary Laundry (2 pieces per stay)',
      'Dedicated Reservation Concierge Desk'
    ],
    badgeColor: 'text-purple-300',
    badgeBg: 'bg-purple-950/80',
    badgeBorder: 'border-purple-500/80'
  },
  'Gold Elite': {
    tier: 'Gold Elite',
    minStays: 12,
    minSpend: 150000,
    pointsMultiplier: 1.5,
    roomDiscountPct: 10,
    fnbDiscountPct: 10,
    spaDiscountPct: 15,
    perks: [
      'Complimentary Room Category Upgrade upon availability',
      'Late Check-out until 14:00',
      'Welcome Drink & Cold Towel on arrival',
      'High-Speed Premium WiFi prioritization',
      '10% Discount at all Resort Restaurants'
    ],
    badgeColor: 'text-yellow-300',
    badgeBg: 'bg-yellow-950/80',
    badgeBorder: 'border-yellow-500/80'
  },
  'Silver Preferred': {
    tier: 'Silver Preferred',
    minStays: 5,
    minSpend: 50000,
    pointsMultiplier: 1.2,
    roomDiscountPct: 5,
    fnbDiscountPct: 5,
    spaDiscountPct: 10,
    perks: [
      '5% Room Rate Discount on direct bookings',
      'Late Check-out until 13:00 upon request',
      'Welcome Fruit Platter in room',
      '1.2x Points Accrual on all room spend'
    ],
    badgeColor: 'text-slate-200',
    badgeBg: 'bg-slate-800',
    badgeBorder: 'border-slate-500'
  },
  'Bronze Explorer': {
    tier: 'Bronze Explorer',
    minStays: 0,
    minSpend: 0,
    pointsMultiplier: 1.0,
    roomDiscountPct: 0,
    fnbDiscountPct: 0,
    spaDiscountPct: 5,
    perks: [
      'Earn 1 Point per ৳100 spent',
      'Complimentary Bottled Spring Water',
      'Access to Member-only Seasonal Promotional Flash Sales',
      'Digital Registration & Quick Check-in'
    ],
    badgeColor: 'text-amber-600',
    badgeBg: 'bg-amber-950/30',
    badgeBorder: 'border-amber-700/60'
  }
};

export const REWARDS_CATALOG: LoyaltyRewardItem[] = [
  {
    id: 'rew-suite-upgrade',
    name: '1-Night Suite Upgrade Certificate',
    category: 'Room Upgrade',
    pointsCost: 2500,
    description: 'Upgrade your confirmed Deluxe Cottage booking to an Executive Honeymoon Suite for 1 night.',
    voucherValidityDays: 90,
    iconName: 'BedDouble'
  },
  {
    id: 'rew-dining-2500',
    name: '৳2,500 Dining & F&B Credit',
    category: 'Dining',
    pointsCost: 3000,
    description: 'Applicable at The Grand Dining Hall, Lake Breeze Cafe, or in-room dining services.',
    voucherValidityDays: 60,
    iconName: 'Utensils'
  },
  {
    id: 'rew-spa-60min',
    name: '60-Minute Aromatherapy Spa Session',
    category: 'Spa & Wellness',
    pointsCost: 4500,
    description: 'Full body signature herbal aromatherapy massage at the Resort Ayurvedic Spa Pavilion.',
    voucherValidityDays: 90,
    iconName: 'Sparkles'
  },
  {
    id: 'rew-airport-transfer',
    name: 'Executive Airport Chauffeur Transfer',
    category: 'Transportation',
    pointsCost: 2000,
    description: 'One-way luxury sedan pickup or drop-off between Hazrat Shahjalal Int’l Airport and Resort.',
    voucherValidityDays: 120,
    iconName: 'Car'
  },
  {
    id: 'rew-free-night',
    name: 'Complimentary 1-Night Deluxe Weekend Stay',
    category: 'Free Night',
    pointsCost: 8000,
    description: '1 complimentary night in Deluxe Garden View Cottage including gourmet breakfast buffet for 2 adults.',
    voucherValidityDays: 180,
    iconName: 'Gift'
  },
  {
    id: 'rew-banquet-discount',
    name: '৳10,000 Hall Rental Credit for Banquets',
    category: 'Banquets',
    pointsCost: 12000,
    description: 'Direct deduction from venue hall hire invoice for corporate retreats, seminars, or private galas.',
    voucherValidityDays: 180,
    iconName: 'Award'
  }
];

const INITIAL_MEMBERS: GuestLoyaltyMember[] = [
  {
    id: 'loy-001',
    guestId: 'gst-001',
    membershipNumber: 'LES-LOY-1001',
    fullName: 'Dr. Tariqul Islam',
    phone: '+880 1711-234567',
    email: 'tariqul.islam@apexgroup.com.bd',
    company: 'Apex Footwear & Holdings',
    designation: 'Managing Director & Group Advisor',
    tier: 'Diamond Royal',
    enrolledDate: '2024-03-15',
    tierExpiresDate: '2027-12-31',
    currentPoints: 18450,
    lifetimePointsEarned: 32000,
    lifetimePointsRedeemed: 13550,
    totalStays: 24,
    totalNights: 46,
    lifetimeSpend: 840000,
    preferredRoomType: 'Honeymoon Suite / Lake View Cottage',
    roomPreferences: [
      'High Floor / Upper Cottage',
      'Strictly feather-free hypoallergenic pillows',
      'Fresh coconut water placed in room minibar daily',
      'Lavender room mist at evening turndown'
    ],
    dietaryPreferences: [
      'Low sodium olive oil preparation',
      'Earl Grey tea served at exactly 07:00 AM',
      'Fresh seasonal papaya with lime'
    ],
    specialDates: [
      { title: 'Birthday', date: '1972-10-18' },
      { title: 'Wedding Anniversary', date: '2001-12-24' }
    ],
    vipProtocolNotes: 'Strict protocol escort upon arrival. Key pre-cut and handed in lobby lounge without waiting at Front Desk desk. Direct folio billing to Apex corporate city ledger account (1150).',
    internalServiceNotes: 'Guest is highly appreciative of quiet surroundings. Avoid allocating cottages adjacent to swimming pool recreation zone during high-season weddings.',
    incidentHistory: [
      {
        id: 'inc-01',
        date: '2026-05-10',
        category: 'Housekeeping',
        issue: 'Evening turndown mist delayed by 40 minutes due to staff shift transition.',
        resolution: 'Executive Housekeeper personally visited, delivered fresh fruit platter and 1,500 apology loyalty bonus points.',
        compensationPoints: 1500,
        recordedBy: 'Subrata Roy (Duty Manager)'
      }
    ],
    redeemedVouchers: [
      {
        id: 'vch-101',
        memberId: 'loy-001',
        rewardId: 'rew-suite-upgrade',
        rewardName: '1-Night Suite Upgrade Certificate',
        code: 'VCH-UPG-8291',
        pointsDeducted: 2500,
        issuedAt: '2026-07-02',
        expiresAt: '2026-10-02',
        status: 'Redeemed',
        redeemedAt: '2026-07-15',
        outletUsed: 'Front Desk - Room 301'
      }
    ],
    status: 'Active',
    lastActivityDate: '2026-08-25'
  },
  {
    id: 'loy-002',
    guestId: 'gst-002',
    membershipNumber: 'LES-LOY-1002',
    fullName: 'Ambassador Syed Mansur',
    phone: '+880 1819-876543',
    email: 'mansur.syed@diplomats.org',
    company: 'Ministry of Foreign Affairs (Retd)',
    designation: 'Former High Commissioner',
    tier: 'Diamond Royal',
    enrolledDate: '2023-11-20',
    tierExpiresDate: '2027-12-31',
    currentPoints: 28200,
    lifetimePointsEarned: 48000,
    lifetimePointsRedeemed: 19800,
    totalStays: 32,
    totalNights: 68,
    lifetimeSpend: 1250000,
    preferredRoomType: 'Presidential Suite',
    roomPreferences: [
      'Corner Suite with private lawn patio',
      'Firm orthopedic mattress with double sheet tucking',
      'Daily morning international newspapers (The Daily Star, Financial Times)'
    ],
    dietaryPreferences: [
      'Halal certified meat preparation',
      'Decaffeinated Colombian coffee with skimmed milk',
      'No crustaceans or shellfish'
    ],
    specialDates: [
      { title: 'Birthday', date: '1961-04-12' },
      { title: 'Diplomatic Honor Anniversary', date: '2015-09-08' }
    ],
    vipProtocolNotes: 'Full state dignitary reception protocol. Duty Manager must greet at porch. Dedicated security room allocation adjacent to suite.',
    internalServiceNotes: 'Prefers dining at 20:30 in private gazebo table #4. Always provide personalized welcome letter signed by General Manager.',
    incidentHistory: [],
    redeemedVouchers: [
      {
        id: 'vch-102',
        memberId: 'loy-002',
        rewardId: 'rew-airport-transfer',
        rewardName: 'Executive Airport Chauffeur Transfer',
        code: 'VCH-AIR-9411',
        pointsDeducted: 2000,
        issuedAt: '2026-06-18',
        expiresAt: '2026-10-18',
        status: 'Redeemed',
        redeemedAt: '2026-06-20',
        outletUsed: 'Resort Concierge Desk'
      }
    ],
    status: 'Active',
    lastActivityDate: '2026-08-30'
  },
  {
    id: 'loy-003',
    guestId: 'gst-003',
    membershipNumber: 'LES-LOY-1003',
    fullName: 'Ms. Rubaba Dowla',
    phone: '+880 1713-098765',
    email: 'rubaba.dowla@techhub.bd',
    company: 'Tech Hub Bangladesh Ltd',
    designation: 'Country Managing Director',
    tier: 'Platinum Ambassador',
    enrolledDate: '2024-08-10',
    tierExpiresDate: '2027-08-10',
    currentPoints: 9400,
    lifetimePointsEarned: 16500,
    lifetimePointsRedeemed: 7100,
    totalStays: 19,
    totalNights: 31,
    lifetimeSpend: 420000,
    preferredRoomType: 'Family Deluxe / Executive Suite',
    roomPreferences: [
      'Dedicated work desk with HDMI and multi-plug hub',
      'Almond milk & matcha green tea pods in minibar',
      'Guaranteed Late Checkout until 16:00'
    ],
    dietaryPreferences: [
      'Plant-based vegan breakfast options',
      'Gluten-free multigrain sourdough bread'
    ],
    specialDates: [
      { title: 'Birthday', date: '1980-07-22' }
    ],
    vipProtocolNotes: 'High-speed business fiber Wi-Fi priority pin. Invoice billing routed to Tech Hub corporate accounts contract.',
    internalServiceNotes: 'Regularly conducts executive board meetings in Orchid Boardroom. Very punctual; ensure wake-up calls are delivered on the second.',
    incidentHistory: [],
    redeemedVouchers: [
      {
        id: 'vch-103',
        memberId: 'loy-003',
        rewardId: 'rew-dining-2500',
        rewardName: '৳2,500 Dining & F&B Credit',
        code: 'VCH-DINE-3320',
        pointsDeducted: 3000,
        issuedAt: '2026-08-01',
        expiresAt: '2026-10-01',
        status: 'Available'
      }
    ],
    status: 'Active',
    lastActivityDate: '2026-09-04'
  },
  {
    id: 'loy-004',
    guestId: 'gst-004',
    membershipNumber: 'LES-LOY-1004',
    fullName: 'Engr. Subrata Chowdhury',
    phone: '+880 1715-443322',
    email: 'subrata.c@inovatech.com',
    company: 'Inovatech Energy & Infrastructure',
    designation: 'Chief Technology Officer',
    tier: 'Gold Elite',
    enrolledDate: '2025-01-14',
    tierExpiresDate: '2027-01-14',
    currentPoints: 6150,
    lifetimePointsEarned: 10500,
    lifetimePointsRedeemed: 4350,
    totalStays: 14,
    totalNights: 22,
    lifetimeSpend: 285000,
    preferredRoomType: 'Deluxe Cottage (Twin Bed)',
    roomPreferences: [
      'Quiet wing away from elevators and banquet hall',
      'Extra large bathrobes and slippers',
      'Ironing board and steam iron placed in closet'
    ],
    dietaryPreferences: [
      'Traditional Bengali cuisine (Ilish, Chital, Bhuna Khichuri)',
      'Black filter coffee without sugar'
    ],
    specialDates: [
      { title: 'Birthday', date: '1984-03-05' }
    ],
    vipProtocolNotes: 'Frequent weekend resident. Offer complimentary room category upgrade whenever occupancy permits.',
    internalServiceNotes: 'Passionate about morning jogging around the lake trail. Provide jogging route map and hydration towel.',
    incidentHistory: [],
    redeemedVouchers: [],
    status: 'Active',
    lastActivityDate: '2026-09-12'
  },
  {
    id: 'loy-005',
    guestId: 'gst-005',
    membershipNumber: 'LES-LOY-1005',
    fullName: 'Mr. Zahid Hossain',
    phone: '+880 1817-665544',
    email: 'zahid.hossain@scb.com',
    company: 'Standard Chartered Bank',
    designation: 'Senior Vice President - Retail Banking',
    tier: 'Silver Preferred',
    enrolledDate: '2025-06-10',
    tierExpiresDate: '2027-06-10',
    currentPoints: 2800,
    lifetimePointsEarned: 4500,
    lifetimePointsRedeemed: 1700,
    totalStays: 7,
    totalNights: 12,
    lifetimeSpend: 115000,
    preferredRoomType: 'Standard Room / Superior Double',
    roomPreferences: [
      'High floor with natural sunlight',
      'Extra soft pillows and light quilt'
    ],
    dietaryPreferences: [
      'Continental breakfast with fresh orange juice'
    ],
    specialDates: [
      { title: 'Birthday', date: '1988-11-30' }
    ],
    vipProtocolNotes: 'Eligible for 5% direct room rate discount on bank corporate card.',
    internalServiceNotes: 'Travels with family. Enjoys infinity pool and bicycle rentals.',
    incidentHistory: [],
    redeemedVouchers: [],
    status: 'Active',
    lastActivityDate: '2026-08-28'
  },
  {
    id: 'loy-006',
    guestId: 'gst-006',
    membershipNumber: 'LES-LOY-1006',
    fullName: 'Ms. Anika Tabassum',
    phone: '+880 1912-334455',
    email: 'anika.tabassum@gmail.com',
    company: 'Direct Leisure Guest',
    designation: 'Independent Architect',
    tier: 'Bronze Explorer',
    enrolledDate: '2026-02-18',
    tierExpiresDate: '2027-02-18',
    currentPoints: 1250,
    lifetimePointsEarned: 1250,
    lifetimePointsRedeemed: 0,
    totalStays: 3,
    totalNights: 5,
    lifetimeSpend: 48000,
    preferredRoomType: 'Honeymoon Suite / Cottage',
    roomPreferences: [
      'Balcony overlooking forest canopy',
      'Natural fragrance diffuser'
    ],
    dietaryPreferences: [
      'Vegetarian and herbal teas'
    ],
    specialDates: [
      { title: 'Birthday', date: '1995-05-14' }
    ],
    vipProtocolNotes: 'Enrolled via mobile booking engine. Potential candidate for Silver tier upgrade on next stay.',
    internalServiceNotes: 'Active on Instagram; took beautiful photos of resort architectural woodwork.',
    incidentHistory: [],
    redeemedVouchers: [],
    status: 'Active',
    lastActivityDate: '2026-08-30'
  }
];

class GuestLoyaltyService {
  private members: GuestLoyaltyMember[] = [];
  private rewards: LoyaltyRewardItem[] = [...REWARDS_CATALOG];
  private listeners: (() => void)[] = [];
  private readonly STORAGE_KEY = 'lesync_guest_loyalty_crm_v1';

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.members = parsed;
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load loyalty members from storage:', e);
    }
    this.members = [...INITIAL_MEMBERS];
    this.saveState();
  }

  private saveState() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.members));
    } catch (e) {
      console.error('Failed to save loyalty members to storage:', e);
    }
    this.notify();
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach(cb => {
      try {
        cb();
      } catch (err) {
        console.error('Error in loyalty listener:', err);
      }
    });
  }

  public getMembers(): GuestLoyaltyMember[] {
    return [...this.members];
  }

  public getMemberById(id: string): GuestLoyaltyMember | undefined {
    return this.members.find(m => m.id === id || m.membershipNumber === id);
  }

  public getMemberByGuestId(guestId: string): GuestLoyaltyMember | undefined {
    return this.members.find(m => m.guestId === guestId);
  }

  public getRewards(): LoyaltyRewardItem[] {
    return [...this.rewards];
  }

  public getTierConfig(tier: LoyaltyTier): TierConfig {
    return TIER_CONFIGS[tier];
  }

  public calculateEligibleTier(stays: number, spend: number): LoyaltyTier {
    if (stays >= 35 || spend >= 750000) return 'Diamond Royal';
    if (stays >= 20 || spend >= 350000) return 'Platinum Ambassador';
    if (stays >= 12 || spend >= 150000) return 'Gold Elite';
    if (stays >= 5 || spend >= 50000) return 'Silver Preferred';
    return 'Bronze Explorer';
  }

  public enrollMember(data: {
    fullName: string;
    phone: string;
    email: string;
    company?: string;
    designation?: string;
    guestId?: string;
    initialTier?: LoyaltyTier;
    initialPoints?: number;
    preferredRoomType?: string;
    roomPreferences?: string[];
    dietaryPreferences?: string[];
    specialDates?: { title: string; date: string }[];
    vipProtocolNotes?: string;
    internalServiceNotes?: string;
  }): { success: boolean; member?: GuestLoyaltyMember; message: string } {
    if (!data.fullName || !data.phone) {
      return { success: false, message: 'Guest Full Name and Mobile Number are required for loyalty enrollment.' };
    }

    // Check duplicate
    const existing = this.members.find(
      m => (data.email && m.email.toLowerCase() === data.email.toLowerCase()) ||
           m.phone === data.phone ||
           (data.guestId && m.guestId === data.guestId)
    );
    if (existing) {
      return { success: false, message: `Guest is already enrolled with Membership #${existing.membershipNumber} (${existing.tier}).` };
    }

    const nextIdNum = this.members.length + 1001;
    const membershipNumber = `LES-LOY-${nextIdNum}`;
    const initialPoints = data.initialPoints ?? 500; // 500 Welcome bonus points
    const tier = data.initialTier || 'Bronze Explorer';

    const newMember: GuestLoyaltyMember = {
      id: `loy-${Date.now()}`,
      guestId: data.guestId,
      membershipNumber,
      fullName: data.fullName,
      phone: data.phone,
      email: data.email || '',
      company: data.company,
      designation: data.designation,
      tier,
      enrolledDate: new Date().toISOString().split('T')[0],
      tierExpiresDate: new Date(Date.now() + 365 * 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
      currentPoints: initialPoints,
      lifetimePointsEarned: initialPoints,
      lifetimePointsRedeemed: 0,
      totalStays: 1,
      totalNights: 1,
      lifetimeSpend: 0,
      preferredRoomType: data.preferredRoomType || 'Deluxe Cottage',
      roomPreferences: data.roomPreferences || ['High Floor', 'Quiet Wing'],
      dietaryPreferences: data.dietaryPreferences || [],
      specialDates: data.specialDates || [],
      vipProtocolNotes: data.vipProtocolNotes || 'Welcome bonus enrolled member. Offer complimentary welcome drink.',
      internalServiceNotes: data.internalServiceNotes || '',
      incidentHistory: [],
      redeemedVouchers: [],
      status: 'Active',
      lastActivityDate: new Date().toISOString().split('T')[0]
    };

    this.members.unshift(newMember);
    this.saveState();

    return {
      success: true,
      member: newMember,
      message: `Successfully enrolled ${newMember.fullName} in Loyalty Program! Membership Number: ${membershipNumber} (${initialPoints} Welcome Points credited).`
    };
  }

  public awardPoints(
    memberId: string,
    points: number,
    reason: string,
    staffName: string = 'Front Desk Manager'
  ): { success: boolean; newBalance?: number; message: string } {
    const member = this.members.find(m => m.id === memberId);
    if (!member) {
      return { success: false, message: 'Loyalty member not found.' };
    }
    if (points <= 0) {
      return { success: false, message: 'Points to award must be greater than zero.' };
    }

    member.currentPoints += points;
    member.lifetimePointsEarned += points;
    member.lastActivityDate = new Date().toISOString().split('T')[0];

    // Log in incident history if it's service compensation
    if (reason.toLowerCase().includes('compensation') || reason.toLowerCase().includes('recovery') || reason.toLowerCase().includes('apology')) {
      member.incidentHistory.unshift({
        id: `inc-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        category: 'Front Desk',
        issue: `Points award: ${reason}`,
        resolution: `Credited ${points} bonus loyalty points to member balance.`,
        compensationPoints: points,
        recordedBy: staffName
      });
    }

    this.saveState();
    return {
      success: true,
      newBalance: member.currentPoints,
      message: `Successfully awarded ${points.toLocaleString()} points to ${member.fullName}! New Balance: ${member.currentPoints.toLocaleString()} pts.`
    };
  }

  public redeemReward(
    memberId: string,
    rewardId: string,
    staffName: string = 'Front Desk Agent'
  ): { success: boolean; voucher?: LoyaltyVoucher; message: string } {
    const member = this.members.find(m => m.id === memberId);
    if (!member) {
      return { success: false, message: 'Member not found.' };
    }
    const reward = this.rewards.find(r => r.id === rewardId);
    if (!reward) {
      return { success: false, message: 'Reward item not found.' };
    }
    if (member.currentPoints < reward.pointsCost) {
      return {
        success: false,
        message: `Insufficient points! Required: ${reward.pointsCost.toLocaleString()} pts, Member Balance: ${member.currentPoints.toLocaleString()} pts.`
      };
    }

    // Deduct points
    member.currentPoints -= reward.pointsCost;
    member.lifetimePointsRedeemed += reward.pointsCost;
    member.lastActivityDate = new Date().toISOString().split('T')[0];

    const voucherCode = `VCH-${reward.category.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const expiresAt = new Date(Date.now() + reward.voucherValidityDays * 24 * 3600 * 1000).toISOString().split('T')[0];

    const voucher: LoyaltyVoucher = {
      id: `vch-${Date.now()}`,
      memberId: member.id,
      rewardId: reward.id,
      rewardName: reward.name,
      code: voucherCode,
      pointsDeducted: reward.pointsCost,
      issuedAt: new Date().toISOString().split('T')[0],
      expiresAt,
      status: 'Available'
    };

    member.redeemedVouchers.unshift(voucher);
    this.saveState();

    return {
      success: true,
      voucher,
      message: `Reward redeemed successfully! Voucher Code: ${voucherCode} (${reward.name}). Deducted ${reward.pointsCost.toLocaleString()} pts. Remaining: ${member.currentPoints.toLocaleString()} pts.`
    };
  }

  public updateTier(
    memberId: string,
    newTier: LoyaltyTier,
    reason: string = 'Manual Management Promotion'
  ): { success: boolean; message: string } {
    const member = this.members.find(m => m.id === memberId);
    if (!member) {
      return { success: false, message: 'Member not found.' };
    }
    const oldTier = member.tier;
    member.tier = newTier;
    member.tierExpiresDate = new Date(Date.now() + 365 * 2 * 24 * 3600 * 1000).toISOString().split('T')[0];
    member.internalServiceNotes = `${member.internalServiceNotes ? member.internalServiceNotes + ' | ' : ''}Tier changed from ${oldTier} to ${newTier} on ${new Date().toISOString().split('T')[0]}: ${reason}`;
    this.saveState();

    return {
      success: true,
      message: `Loyalty tier updated from ${oldTier} to ${newTier} for ${member.fullName}. Privileges and multipliers updated.`
    };
  }

  public updateMemberPreferences(
    memberId: string,
    updates: {
      preferredRoomType?: string;
      roomPreferences?: string[];
      dietaryPreferences?: string[];
      specialDates?: { title: string; date: string }[];
      vipProtocolNotes?: string;
      internalServiceNotes?: string;
    }
  ): { success: boolean; message: string } {
    const member = this.members.find(m => m.id === memberId);
    if (!member) {
      return { success: false, message: 'Member not found.' };
    }

    if (updates.preferredRoomType !== undefined) member.preferredRoomType = updates.preferredRoomType;
    if (updates.roomPreferences !== undefined) member.roomPreferences = updates.roomPreferences;
    if (updates.dietaryPreferences !== undefined) member.dietaryPreferences = updates.dietaryPreferences;
    if (updates.specialDates !== undefined) member.specialDates = updates.specialDates;
    if (updates.vipProtocolNotes !== undefined) member.vipProtocolNotes = updates.vipProtocolNotes;
    if (updates.internalServiceNotes !== undefined) member.internalServiceNotes = updates.internalServiceNotes;

    this.saveState();
    return { success: true, message: `Guest preferences & VIP protocol saved for ${member.fullName}.` };
  }

  public markVoucherRedeemed(
    memberId: string,
    voucherId: string,
    outlet: string = 'Front Desk'
  ): { success: boolean; message: string } {
    const member = this.members.find(m => m.id === memberId);
    if (!member) return { success: false, message: 'Member not found.' };

    const voucher = member.redeemedVouchers.find(v => v.id === voucherId || v.code === voucherId);
    if (!voucher) return { success: false, message: 'Voucher not found.' };
    if (voucher.status === 'Redeemed') return { success: false, message: `Voucher ${voucher.code} has already been redeemed.` };

    voucher.status = 'Redeemed';
    voucher.redeemedAt = new Date().toISOString().split('T')[0];
    voucher.outletUsed = outlet;

    this.saveState();
    return { success: true, message: `Voucher ${voucher.code} marked as redeemed at ${outlet}.` };
  }
}

export const guestLoyaltyService = new GuestLoyaltyService();
