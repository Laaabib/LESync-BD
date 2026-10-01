import React, { useState, useEffect, useMemo } from 'react';
import {
  Award, Star, Gift, Plus, Search, Filter, Phone, Mail, Building,
  Sparkles, CheckCircle2, ChevronRight, X, AlertCircle, Calendar,
  CreditCard, TrendingUp, Shield, Heart, ArrowUpRight, BedDouble,
  Utensils, Car, FileText, Printer, Download, Clock, UserCheck,
  Percent, Tag, Eye, RefreshCw, Copy, Check, MessageSquare
} from 'lucide-react';
import {
  guestLoyaltyService,
  GuestLoyaltyMember,
  LoyaltyTier,
  TIER_CONFIGS,
  REWARDS_CATALOG,
  LoyaltyRewardItem,
  LoyaltyVoucher
} from '../../services/guestLoyaltyService';
import { pmsService } from '../../services/pmsService';
import { pdfExportService } from '../../services/pdfExportService';

interface GuestLoyaltyCrmTabProps {
  onNavigate?: (route: string) => void;
}

export const GuestLoyaltyCrmTab: React.FC<GuestLoyaltyCrmTabProps> = ({ onNavigate }) => {
  const [members, setMembers] = useState<GuestLoyaltyMember[]>(guestLoyaltyService.getMembers());
  const [rewards, setRewards] = useState<LoyaltyRewardItem[]>(guestLoyaltyService.getRewards());
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick filter flags
  const [showMilestonesOnly, setShowMilestonesOnly] = useState(false);
  const [showHighSpendOnly, setShowHighSpendOnly] = useState(false);
  const [showActiveVouchersOnly, setShowActiveVouchersOnly] = useState(false);

  // Modals & Drawers state
  const [selectedMember, setSelectedMember] = useState<GuestLoyaltyMember | null>(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showAwardPointsModal, setShowAwardPointsModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showTierMatrixModal, setShowTierMatrixModal] = useState(false);
  const [showAddIncidentModal, setShowAddIncidentModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form states
  // 1. Enroll Form
  const [enrollName, setEnrollName] = useState('');
  const [enrollPhone, setEnrollPhone] = useState('');
  const [enrollEmail, setEnrollEmail] = useState('');
  const [enrollCompany, setEnrollCompany] = useState('');
  const [enrollDesignation, setEnrollDesignation] = useState('');
  const [enrollTier, setEnrollTier] = useState<LoyaltyTier>('Bronze Explorer');
  const [enrollPoints, setEnrollPoints] = useState<number>(500);
  const [enrollRoomType, setEnrollRoomType] = useState('Deluxe Cottage');
  const [enrollRoomPrefs, setEnrollRoomPrefs] = useState('High Floor, Quiet Wing');
  const [enrollDietaryPrefs, setEnrollDietaryPrefs] = useState('');
  const [enrollBirthday, setEnrollBirthday] = useState('');
  const [enrollVipProtocol, setEnrollVipProtocol] = useState('');

  // 2. Award Points Form
  const [awardMemberId, setAwardMemberId] = useState('');
  const [awardPointsVal, setAwardPointsVal] = useState<number>(1000);
  const [awardReason, setAwardReason] = useState('Stay Accrual Bonus');
  const [awardCustomNote, setAwardCustomNote] = useState('');

  // 3. Redeem Form
  const [redeemMemberId, setRedeemMemberId] = useState('');
  const [selectedRewardId, setSelectedRewardId] = useState('');

  // 4. Incident Form
  const [incidentCategory, setIncidentCategory] = useState<'Front Desk' | 'Housekeeping' | 'F&B' | 'Maintenance' | 'Billing'>('Front Desk');
  const [incidentIssue, setIncidentIssue] = useState('');
  const [incidentResolution, setIncidentResolution] = useState('');
  const [incidentCompPoints, setIncidentCompPoints] = useState<number>(500);

  // Subscribe to service updates
  useEffect(() => {
    return guestLoyaltyService.subscribe(() => {
      setMembers(guestLoyaltyService.getMembers());
      setRewards(guestLoyaltyService.getRewards());
    });
  }, []);

  // Sync selectedMember if updated
  useEffect(() => {
    if (selectedMember) {
      const updated = guestLoyaltyService.getMemberById(selectedMember.id);
      if (updated) setSelectedMember(updated);
    }
  }, [members]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedCode(text);
    showToast(`Copied #${text} to clipboard`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // KPIs
  const totalMembers = members.length;
  const totalPointsCirculation = members.reduce((sum, m) => sum + m.currentPoints, 0);
  const totalLifetimeSpend = members.reduce((sum, m) => sum + m.lifetimeSpend, 0);
  const diamondCount = members.filter(m => m.tier === 'Diamond Royal').length;
  const platinumCount = members.filter(m => m.tier === 'Platinum Ambassador').length;
  const activeVouchersCount = members.reduce(
    (sum, m) => sum + m.redeemedVouchers.filter(v => v.status === 'Available').length,
    0
  );

  // Current month for milestone check
  const currentMonth = new Date().toISOString().substring(5, 7); // 'MM'

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        m.fullName.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.membershipNumber.toLowerCase().includes(q) ||
        (m.company && m.company.toLowerCase().includes(q));

      const matchTier = selectedTier === 'all' || m.tier === selectedTier;

      let matchMilestone = true;
      if (showMilestonesOnly) {
        matchMilestone = m.specialDates.some(d => d.date && d.date.substring(5, 7) === currentMonth);
      }

      let matchHighSpend = true;
      if (showHighSpendOnly) {
        matchHighSpend = m.lifetimeSpend >= 250000;
      }

      let matchVouchers = true;
      if (showActiveVouchersOnly) {
        matchVouchers = m.redeemedVouchers.some(v => v.status === 'Available');
      }

      return matchSearch && matchTier && matchMilestone && matchHighSpend && matchVouchers;
    });
  }, [members, search, selectedTier, showMilestonesOnly, showHighSpendOnly, showActiveVouchersOnly, currentMonth]);

  // Handle Enroll
  const handleEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollName || !enrollPhone) {
      showToast('Please provide guest full name and phone number.');
      return;
    }

    const specialDates = [];
    if (enrollBirthday) {
      specialDates.push({ title: 'Birthday', date: enrollBirthday });
    }

    const res = guestLoyaltyService.enrollMember({
      fullName: enrollName,
      phone: enrollPhone,
      email: enrollEmail,
      company: enrollCompany,
      designation: enrollDesignation,
      initialTier: enrollTier,
      initialPoints: Number(enrollPoints) || 500,
      preferredRoomType: enrollRoomType,
      roomPreferences: enrollRoomPrefs.split(',').map(s => s.trim()).filter(Boolean),
      dietaryPreferences: enrollDietaryPrefs ? enrollDietaryPrefs.split(',').map(s => s.trim()).filter(Boolean) : [],
      specialDates,
      vipProtocolNotes: enrollVipProtocol
    });

    if (res.success) {
      showToast(res.message);
      setShowEnrollModal(false);
      // Reset form
      setEnrollName('');
      setEnrollPhone('');
      setEnrollEmail('');
      setEnrollCompany('');
      setEnrollDesignation('');
      setEnrollBirthday('');
      setEnrollVipProtocol('');
      if (res.member) setSelectedMember(res.member);
    } else {
      showToast(res.message);
    }
  };

  // Handle Award Points
  const handleAwardPointsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!awardMemberId || awardPointsVal <= 0) {
      showToast('Please select member and enter valid points amount.');
      return;
    }

    const fullReason = awardCustomNote ? `${awardReason}: ${awardCustomNote}` : awardReason;
    const res = guestLoyaltyService.awardPoints(awardMemberId, Number(awardPointsVal), fullReason);

    showToast(res.message);
    if (res.success) {
      setShowAwardPointsModal(false);
      setAwardCustomNote('');
    }
  };

  // Handle Redeem Reward
  const handleRedeemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemMemberId || !selectedRewardId) {
      showToast('Please select reward to redeem.');
      return;
    }

    const res = guestLoyaltyService.redeemReward(redeemMemberId, selectedRewardId);
    showToast(res.message);
    if (res.success) {
      setShowRedeemModal(false);
    }
  };

  // Handle Add Incident Recovery Log
  const handleAddIncidentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !incidentIssue || !incidentResolution) {
      showToast('Please fill in both the issue and resolution details.');
      return;
    }

    const compPoints = Number(incidentCompPoints) || 0;
    if (compPoints > 0) {
      guestLoyaltyService.awardPoints(
        selectedMember.id,
        compPoints,
        `Service recovery apology: ${incidentIssue}`
      );
    }

    selectedMember.incidentHistory.unshift({
      id: `inc-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      category: incidentCategory,
      issue: incidentIssue,
      resolution: incidentResolution,
      compensationPoints: compPoints,
      recordedBy: 'Guest Relations Duty Manager'
    });

    showToast(`Logged service recovery incident for ${selectedMember.fullName}. Awarded ${compPoints} bonus points.`);
    setShowAddIncidentModal(false);
    setIncidentIssue('');
    setIncidentResolution('');
    setIncidentCompPoints(500);
  };

  // Export PDF Report
  const handleExportPDF = () => {
    pdfExportService.exportToPDF({
      title: 'GUEST CRM & VIP LOYALTY DIRECTORY',
      subtitle: 'LESYNC LUXURY RESORT & CONVENTION • COMMERCIAL CRM',
      date: new Date().toLocaleDateString('en-GB'),
      columns: [
        { key: 'code', header: 'Membership #' },
        { key: 'name', header: 'Member Name' },
        { key: 'tier', header: 'Tier' },
        { key: 'phone', header: 'Phone' },
        { key: 'points', header: 'Points', align: 'right' },
        { key: 'stays', header: 'Stays', align: 'center' },
        { key: 'spend', header: 'Lifetime Spend', align: 'right' },
        { key: 'prefs', header: 'VIP Room Preferences' }
      ],
      rows: filteredMembers.map(m => ({
        code: m.membershipNumber,
        name: m.fullName,
        tier: m.tier,
        phone: m.phone,
        points: m.currentPoints.toLocaleString(),
        stays: `${m.totalStays}`,
        spend: `৳${(m.lifetimeSpend || 0).toLocaleString()}`,
        prefs: m.roomPreferences.slice(0, 2).join('; ') || 'Standard'
      }))
    }, 'loyalty-master-directory');
  };

  return (
    <div className="space-y-4 text-xs text-slate-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl border border-amber-500/40 flex items-center space-x-2 animate-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER: GUEST CRM & LOYALTY ENGINE OVERVIEW */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 p-4 rounded-2xl shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 font-black flex items-center justify-center border-2 border-amber-500/40 shadow-inner shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                Guest CRM & Loyalty Profiling Engine
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-black border border-amber-500/30 flex items-center gap-1">
                <Star className="w-2.5 h-2.5 fill-amber-400" />
                <span>5-Tier Rewards</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5 max-w-2xl">
              Track 360° guest stay history, automated tier progression, departmental preferences, birthday/anniversary milestone reminders, and reward points redemption.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          <button
            onClick={() => setShowTierMatrixModal(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors border border-slate-700 flex items-center space-x-1.5 cursor-pointer shadow-xs"
            title="View benefits & privileges across all 5 tiers"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Tier Benefits</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors border border-slate-700 flex items-center space-x-1.5 cursor-pointer shadow-xs"
            title="Export Loyalty Registry as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={() => setShowEnrollModal(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center space-x-1.5 shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll Loyalty Member</span>
          </button>
        </div>
      </div>

      {/* METRIC KPI TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Total Members */}
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold">Active Members</span>
            <UsersIcon className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-black text-white font-mono">{totalMembers}</span>
            <span className="text-[10px] text-emerald-400 font-bold">100% Retained</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[9px] text-slate-400">
            <span className="text-amber-400 font-bold">{diamondCount} Diamond</span>
            <span>•</span>
            <span className="text-purple-400 font-bold">{platinumCount} Platinum</span>
          </div>
        </div>

        {/* Points in Circulation */}
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold">Points in Circulation</span>
            <Star className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-black text-amber-400 font-mono">
              {totalPointsCirculation.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">pts</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Accrual rate: 1.0x - 3.0x per ৳100
          </span>
        </div>

        {/* Total Lifetime Spend */}
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold">Member Lifetime Spend</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-black text-emerald-400 font-mono">
              ৳{(totalLifetimeSpend || 0).toLocaleString()}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Synced with Front Desk Folios & Ledgers
          </span>
        </div>

        {/* Active Vouchers & Perks */}
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold">Active Reward Vouchers</span>
            <Gift className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-black text-white font-mono">{activeVouchersCount}</span>
            <span className="text-[10px] text-rose-300 font-bold">Ready to Redeem</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Room upgrades, dining, spa credits
          </span>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Search input */}
        <div className="flex items-center space-x-2 flex-1 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search member by name, phone, email, membership #..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Middle: Tier Filter Pills */}
        <div className="flex items-center flex-wrap gap-1">
          <button
            onClick={() => setSelectedTier('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedTier === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Tiers ({members.length})
          </button>
          {(['Diamond Royal', 'Platinum Ambassador', 'Gold Elite', 'Silver Preferred', 'Bronze Explorer'] as LoyaltyTier[]).map(t => {
            const count = members.filter(m => m.tier === t).length;
            const config = TIER_CONFIGS[t];
            return (
              <button
                key={t}
                onClick={() => setSelectedTier(t)}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                  selectedTier === t
                    ? `${config.badgeBg} ${config.badgeColor} border ${config.badgeBorder} ring-1 ring-amber-500/50`
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{t.split(' ')[0]}</span>
                <span className="px-1 rounded bg-slate-950/60 font-mono text-[9px]">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Quick Tag Filters & View Mode Toggle */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setShowMilestonesOnly(!showMilestonesOnly)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors flex items-center space-x-1 cursor-pointer ${
              showMilestonesOnly
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Filter members with birthdays or anniversaries this month"
          >
            <span>🎂 This Month</span>
          </button>

          <button
            onClick={() => setShowHighSpendOnly(!showHighSpendOnly)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors flex items-center space-x-1 cursor-pointer ${
              showHighSpendOnly
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Filter VIP high spenders (> ৳250k)"
          >
            <span>৳250k+ VIP</span>
          </button>

          <div className="border-l border-slate-700 pl-1.5 flex items-center space-x-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title="Card Grid View"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title="Compact Table View"
            >
              <UsersIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* MEMBER CARDS OR TABLE */}
      {filteredMembers.length === 0 ? (
        <div className="bg-slate-900 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
          <Award className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-300">No Loyalty Members Found</h3>
          <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or enroll a new guest into the loyalty program.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedTier('all');
              setShowMilestonesOnly(false);
              setShowHighSpendOnly(false);
              setShowActiveVouchersOnly(false);
            }}
            className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-lg text-xs"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredMembers.map(member => {
            const config = TIER_CONFIGS[member.tier];
            const hasActiveVoucher = member.redeemedVouchers.some(v => v.status === 'Available');
            const hasMilestoneThisMonth = member.specialDates.some(
              d => d.date && d.date.substring(5, 7) === currentMonth
            );

            return (
              <div
                key={member.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md hover:border-slate-700 transition-all flex flex-col justify-between space-y-3 relative group"
              >
                {/* Header: Name, Membership # & Tier badge */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <h3 className="font-black text-slate-100 text-sm truncate hover:text-amber-400 transition-colors cursor-pointer" onClick={() => setSelectedMember(member)}>
                          {member.fullName}
                        </h3>
                        {hasMilestoneThisMonth && (
                          <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded border border-rose-500/40" title="Milestone (Birthday/Anniversary) this month">
                            🎂
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {member.designation ? `${member.designation} • ` : ''}
                        {member.company || 'Private Guest'}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider shrink-0 ${config.badgeBg} ${config.badgeColor} ${config.badgeBorder}`}
                    >
                      {member.tier}
                    </span>
                  </div>

                  {/* Membership Number with copy */}
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30 flex items-center space-x-1">
                      <span>{member.membershipNumber}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(member.membershipNumber);
                        }}
                        className="text-amber-400/70 hover:text-amber-300 ml-1 cursor-pointer"
                        title="Copy Membership Number"
                      >
                        {copiedCode === member.membershipNumber ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                      </button>
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Member since {member.enrolledDate}
                    </span>
                  </div>
                </div>

                {/* Metrics Box: Points, Stays, Lifetime Spend */}
                <div className="grid grid-cols-3 gap-1.5 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Points</span>
                    <span className="text-xs font-black text-amber-400 font-mono">
                      {member.currentPoints.toLocaleString()}
                    </span>
                  </div>
                  <div className="border-x border-slate-800">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Stays</span>
                    <span className="text-xs font-black text-slate-200 font-mono">
                      {member.totalStays} ({member.totalNights}n)
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Spend</span>
                    <span className="text-xs font-black text-emerald-400 font-mono truncate block">
                      ৳{(member.lifetimeSpend || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* VIP Preferences snippet */}
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center space-x-1 text-slate-400">
                    <BedDouble className="w-3 h-3 text-blue-400 shrink-0" />
                    <span className="truncate">{member.preferredRoomType}</span>
                  </div>

                  {member.roomPreferences.length > 0 && (
                    <div className="flex items-center flex-wrap gap-1">
                      {member.roomPreferences.slice(0, 2).map((pref, i) => (
                        <span key={i} className="text-[10px] bg-slate-800/80 text-slate-300 px-1.5 py-0.2 rounded border border-slate-700/60 truncate max-w-[140px]">
                          {pref}
                        </span>
                      ))}
                      {member.roomPreferences.length > 2 && (
                        <span className="text-[10px] text-slate-500">
                          +{member.roomPreferences.length - 2} more
                        </span>
                      )}
                    </div>
                  )}

                  {hasActiveVoucher && (
                    <div className="flex items-center space-x-1 text-[10px] text-rose-300 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/30">
                      <Gift className="w-3 h-3 text-rose-400 shrink-0" />
                      <span>Has Unused Reward Voucher</span>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => {
                      setAwardMemberId(member.id);
                      setShowAwardPointsModal(true);
                    }}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-lg text-[11px] transition-colors flex items-center space-x-1 cursor-pointer"
                    title="Credit bonus loyalty points"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Points</span>
                  </button>

                  <button
                    onClick={() => {
                      setRedeemMemberId(member.id);
                      setShowRedeemModal(true);
                    }}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold rounded-lg text-[11px] transition-colors flex items-center space-x-1 cursor-pointer"
                    title="Redeem points for vouchers"
                  >
                    <Gift className="w-3 h-3" />
                    <span>Redeem</span>
                  </button>

                  <button
                    onClick={() => setSelectedMember(member)}
                    className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold rounded-lg text-[11px] transition-colors flex items-center space-x-1 border border-amber-500/40 cursor-pointer ml-auto"
                  >
                    <span>Profile</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-black border-b border-slate-800">
                <tr>
                  <th className="px-3.5 py-3">Member & Code</th>
                  <th className="px-3.5 py-3">Tier</th>
                  <th className="px-3.5 py-3">Contact & Company</th>
                  <th className="px-3.5 py-3 text-right">Points Balance</th>
                  <th className="px-3.5 py-3 text-center">Stays / Nights</th>
                  <th className="px-3.5 py-3 text-right">Lifetime Spend</th>
                  <th className="px-3.5 py-3">Preferences</th>
                  <th className="px-3.5 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredMembers.map(m => {
                  const config = TIER_CONFIGS[m.tier];
                  return (
                    <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-3.5 py-3 font-bold text-white">
                        <div
                          className="hover:text-amber-400 transition-colors cursor-pointer"
                          onClick={() => setSelectedMember(m)}
                        >
                          {m.fullName}
                        </div>
                        <span className="text-[10px] font-mono text-amber-400 font-bold block">
                          {m.membershipNumber}
                        </span>
                      </td>
                      <td className="px-3.5 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${config.badgeBg} ${config.badgeColor} ${config.badgeBorder}`}>
                          {m.tier}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-slate-300">
                        <div>{m.phone}</div>
                        <div className="text-[10px] text-slate-500">{m.company || m.email}</div>
                      </td>
                      <td className="px-3.5 py-3 text-right font-mono font-black text-amber-400">
                        {m.currentPoints.toLocaleString()} pts
                      </td>
                      <td className="px-3.5 py-3 text-center font-mono text-slate-300">
                        {m.totalStays} / {m.totalNights}
                      </td>
                      <td className="px-3.5 py-3 text-right font-mono font-black text-emerald-400">
                        ৳{(m.lifetimeSpend || 0).toLocaleString()}
                      </td>
                      <td className="px-3.5 py-3 text-slate-400 text-[11px] max-w-[200px] truncate">
                        {m.roomPreferences.join(', ') || 'Standard Service'}
                      </td>
                      <td className="px-3.5 py-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => {
                              setAwardMemberId(m.id);
                              setShowAwardPointsModal(true);
                            }}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400"
                            title="Award Points"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setRedeemMemberId(m.id);
                              setShowRedeemModal(true);
                            }}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-400"
                            title="Redeem Reward"
                          >
                            <Gift className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedMember(m)}
                            className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold border border-amber-500/40"
                          >
                            Profile
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

      {/* 360° MEMBER PROFILE DRAWER / MODAL */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 font-black flex items-center justify-center border-2 border-amber-500/40 text-lg">
                  {selectedMember.fullName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-black text-white">{selectedMember.fullName}</h2>
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black border ${TIER_CONFIGS[selectedMember.tier].badgeBg} ${TIER_CONFIGS[selectedMember.tier].badgeColor} ${TIER_CONFIGS[selectedMember.tier].badgeBorder}`}>
                      {selectedMember.tier}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                    <span className="font-mono text-amber-400 font-bold">{selectedMember.membershipNumber}</span>
                    <span>•</span>
                    <span>{selectedMember.designation ? `${selectedMember.designation}, ` : ''}{selectedMember.company}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedMember(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Loyalty Membership Card Graphic */}
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-5 rounded-2xl border border-amber-500/30 shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex items-center justify-between text-xs text-slate-400 mb-6">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span className="font-bold tracking-widest text-slate-200 uppercase">
                    LESync Loyalty Club
                  </span>
                </div>
                <span className="font-mono text-[11px] text-amber-300 font-black">
                  VALID THRU {selectedMember.tierExpiresDate}
                </span>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Member Name</span>
                  <span className="text-base font-black text-white tracking-wide">{selectedMember.fullName}</span>
                  <span className="text-xs font-mono text-amber-400 block font-bold mt-1 tracking-widest">{selectedMember.membershipNumber}</span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Points Balance</span>
                  <span className="text-2xl font-black text-amber-400 font-mono">
                    {selectedMember.currentPoints.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    (Earned {selectedMember.lifetimePointsEarned.toLocaleString()} • Redeemed {selectedMember.lifetimePointsRedeemed.toLocaleString()})
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons for Member */}
            <div className="flex items-center flex-wrap gap-2 pt-1">
              <button
                onClick={() => {
                  setAwardMemberId(selectedMember.id);
                  setShowAwardPointsModal(true);
                }}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Credit Bonus Points</span>
              </button>

              <button
                onClick={() => {
                  setRedeemMemberId(selectedMember.id);
                  setShowRedeemModal(true);
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-colors border border-slate-700 cursor-pointer shadow-xs"
              >
                <Gift className="w-4 h-4" />
                <span>Redeem Reward Item</span>
              </button>

              <button
                onClick={() => setShowAddIncidentModal(true)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-colors border border-slate-700 cursor-pointer shadow-xs"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Log Service Recovery</span>
              </button>

              {/* Tier Promotion dropdown */}
              <div className="ml-auto flex items-center space-x-1.5 text-xs">
                <span className="text-slate-400 font-semibold">Tier Level:</span>
                <select
                  value={selectedMember.tier}
                  onChange={e => {
                    const res = guestLoyaltyService.updateTier(selectedMember.id, e.target.value as LoyaltyTier);
                    showToast(res.message);
                  }}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="Bronze Explorer">Bronze Explorer (1.0x)</option>
                  <option value="Silver Preferred">Silver Preferred (1.2x)</option>
                  <option value="Gold Elite">Gold Elite (1.5x)</option>
                  <option value="Platinum Ambassador">Platinum Ambassador (2.0x)</option>
                  <option value="Diamond Royal">Diamond Royal (3.0x)</option>
                </select>
              </div>
            </div>

            {/* Comprehensive Detail Tabs / Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Preferences & Protocol */}
              <div className="space-y-4">
                {/* VIP Protocol & Front Desk Instructions */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center space-x-2 text-amber-300 font-bold">
                    <Shield className="w-4 h-4" />
                    <span>VIP Reception & Protocol</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed italic bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    "{selectedMember.vipProtocolNotes || 'Standard VIP guest welcome. Provide complimentary greeting drink and priority registration.'}"
                  </p>
                </div>

                {/* Room & Bedding Preferences */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center space-x-2 text-blue-300 font-bold">
                    <BedDouble className="w-4 h-4" />
                    <span>Housekeeping & Room Preferences</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500 block">Preferred Category:</span>
                    <span className="font-bold text-slate-200 text-xs">{selectedMember.preferredRoomType}</span>
                  </div>
                  <div className="flex items-center flex-wrap gap-1.5 pt-1">
                    {selectedMember.roomPreferences.map((p, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-lg bg-blue-950/40 text-blue-300 border border-blue-500/30 text-[11px] font-semibold">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* F&B & Dietary Preferences */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-300 font-bold">
                    <Utensils className="w-4 h-4" />
                    <span>Dining & Dietary Requirements</span>
                  </div>
                  {selectedMember.dietaryPreferences.length > 0 ? (
                    <div className="flex items-center flex-wrap gap-1.5">
                      {selectedMember.dietaryPreferences.map((d, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold">
                          {d}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-xs">No dietary restrictions recorded.</p>
                  )}
                </div>
              </div>

              {/* Right Column: Special Dates, Vouchers & Incidents */}
              <div className="space-y-4">
                {/* Special Dates & Milestones */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center space-x-2 text-rose-300 font-bold">
                    <Calendar className="w-4 h-4" />
                    <span>Special Dates & Milestones</span>
                  </div>
                  {selectedMember.specialDates.length > 0 ? (
                    <div className="space-y-1.5">
                      {selectedMember.specialDates.map((dateObj, i) => (
                        <div key={i} className="flex justify-between items-center bg-slate-900/60 p-2 rounded-xl text-xs border border-slate-800">
                          <span className="font-bold text-slate-200">{dateObj.title}</span>
                          <span className="font-mono text-amber-400 font-semibold">{dateObj.date}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-xs">No milestone dates added.</p>
                  )}
                </div>

                {/* Active Reward Vouchers */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-amber-300 font-bold">
                    <div className="flex items-center space-x-2">
                      <Gift className="w-4 h-4" />
                      <span>Reward Vouchers ({selectedMember.redeemedVouchers.length})</span>
                    </div>
                  </div>
                  {selectedMember.redeemedVouchers.length === 0 ? (
                    <p className="text-slate-500 text-xs">No vouchers issued yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {selectedMember.redeemedVouchers.map(v => (
                        <div key={v.id} className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-200 block">{v.rewardName}</span>
                            <span className="font-mono text-[10px] text-amber-400">{v.code}</span>
                            <span className="text-[10px] text-slate-500 block">Valid until {v.expiresAt}</span>
                          </div>
                          <div>
                            {v.status === 'Available' ? (
                              <button
                                onClick={() => {
                                  const res = guestLoyaltyService.markVoucherRedeemed(selectedMember.id, v.id);
                                  showToast(res.message);
                                }}
                                className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] cursor-pointer"
                              >
                                Redeem Voucher
                              </button>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-500 font-bold text-[10px]">
                                Redeemed
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Service Recovery & Incident History */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center space-x-2 text-purple-300 font-bold">
                    <MessageSquare className="w-4 h-4" />
                    <span>Service Recovery Log ({selectedMember.incidentHistory.length})</span>
                  </div>
                  {selectedMember.incidentHistory.length === 0 ? (
                    <p className="text-slate-500 text-xs">Zero unresolved complaints. Clean guest record.</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {selectedMember.incidentHistory.map(inc => (
                        <div key={inc.id} className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 space-y-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-rose-300">{inc.category}: {inc.issue}</span>
                            <span className="text-[10px] text-slate-500">{inc.date}</span>
                          </div>
                          <p className="text-slate-300 text-[11px]">{inc.resolution}</p>
                          {inc.compensationPoints && inc.compensationPoints > 0 && (
                            <span className="text-[10px] text-amber-400 font-bold block">
                              +{inc.compensationPoints} pts compensation awarded
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ENROLL NEW LOYALTY MEMBER */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-white text-base">Enroll New Loyalty Member</h3>
              </div>
              <button onClick={() => setShowEnrollModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEnrollSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 text-[11px] font-bold">Guest Full Name *</label>
                  <input
                    type="text"
                    required
                    value={enrollName}
                    onChange={e => setEnrollName(e.target.value)}
                    placeholder="e.g. Dr. Subrata Roy"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 text-xs focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 text-[11px] font-bold">Mobile Phone *</label>
                  <input
                    type="text"
                    required
                    value={enrollPhone}
                    onChange={e => setEnrollPhone(e.target.value)}
                    placeholder="+880 1711-XXXXXX"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 text-xs focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 text-[11px] font-bold">Email Address</label>
                  <input
                    type="email"
                    value={enrollEmail}
                    onChange={e => setEnrollEmail(e.target.value)}
                    placeholder="guest@domain.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 text-xs focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 text-[11px] font-bold">Corporate Company</label>
                  <input
                    type="text"
                    value={enrollCompany}
                    onChange={e => setEnrollCompany(e.target.value)}
                    placeholder="e.g. Grameenphone Ltd"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 text-xs focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 text-[11px] font-bold">Initial Loyalty Tier</label>
                  <select
                    value={enrollTier}
                    onChange={e => setEnrollTier(e.target.value as LoyaltyTier)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 text-xs focus:outline-none focus:border-amber-500 font-bold"
                  >
                    <option value="Bronze Explorer">Bronze Explorer (Entry)</option>
                    <option value="Silver Preferred">Silver Preferred</option>
                    <option value="Gold Elite">Gold Elite</option>
                    <option value="Platinum Ambassador">Platinum Ambassador</option>
                    <option value="Diamond Royal">Diamond Royal (VIP)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 text-[11px] font-bold">Welcome Bonus Points</label>
                  <input
                    type="number"
                    value={enrollPoints}
                    onChange={e => setEnrollPoints(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-amber-400 font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 text-[11px] font-bold">Room & Bedding Preferences (Comma Separated)</label>
                <input
                  type="text"
                  value={enrollRoomPrefs}
                  onChange={e => setEnrollRoomPrefs(e.target.value)}
                  placeholder="e.g. High Floor, Feather-Free Pillows, Extra Towels"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 text-[11px] font-bold">Dietary Preferences</label>
                  <input
                    type="text"
                    value={enrollDietaryPrefs}
                    onChange={e => setEnrollDietaryPrefs(e.target.value)}
                    placeholder="e.g. Vegetarian, Halal, Low-Sodium"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 text-[11px] font-bold">Birthday (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    value={enrollBirthday}
                    onChange={e => setEnrollBirthday(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 text-[11px] font-bold">VIP Reception & Front Desk Protocol</label>
                <textarea
                  rows={2}
                  value={enrollVipProtocol}
                  onChange={e => setEnrollVipProtocol(e.target.value)}
                  placeholder="Special instructions for Front Desk and Concierge upon check-in..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-md"
                >
                  Complete Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: AWARD BONUS POINTS */}
      {showAwardPointsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-white text-base">Credit Loyalty Bonus Points</h3>
              </div>
              <button onClick={() => setShowAwardPointsModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAwardPointsSubmit} className="space-y-3.5">
              <div>
                <label className="block text-slate-400 mb-1 text-[11px] font-bold">Select Member *</label>
                <select
                  required
                  value={awardMemberId}
                  onChange={e => setAwardMemberId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 text-xs focus:outline-none focus:border-amber-500 font-bold"
                >
                  <option value="">-- Choose Member --</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.membershipNumber}) — Balance: {m.currentPoints.toLocaleString()} pts
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 text-[11px] font-bold">Points Amount *</label>
                <input
                  type="number"
                  required
                  min={50}
                  step={50}
                  value={awardPointsVal}
                  onChange={e => setAwardPointsVal(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-amber-400 font-mono font-black text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 text-[11px] font-bold">Award Reason / Event</label>
                <select
                  value={awardReason}
                  onChange={e => setAwardReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 text-xs focus:outline-none focus:border-amber-500 font-bold"
                >
                  <option value="Stay Accrual Bonus">Stay Accrual Bonus (Direct Booking)</option>
                  <option value="Birthday Celebration Bonus">Birthday Celebration Surprise</option>
                  <option value="Service Recovery Compensation">Service Recovery Compensation</option>
                  <option value="General Manager Courtesy Credit">General Manager Courtesy Credit</option>
                  <option value="Corporate Event Host Incentive">Corporate Event Host Incentive</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 text-[11px] font-bold">Internal Note / Folio Ref</label>
                <input
                  type="text"
                  value={awardCustomNote}
                  onChange={e => setAwardCustomNote(e.target.value)}
                  placeholder="e.g. Folio #FOL-8821 checkout incentive"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAwardPointsModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-md"
                >
                  Credit Points
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: REDEEM REWARD ITEM */}
      {showRedeemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Gift className="w-5 h-5 text-rose-400" />
                <h3 className="font-black text-white text-base">Redeem Loyalty Rewards</h3>
              </div>
              <button onClick={() => setShowRedeemModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRedeemSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1 text-[11px] font-bold">Select Member *</label>
                <select
                  required
                  value={redeemMemberId}
                  onChange={e => setRedeemMemberId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 text-xs focus:outline-none focus:border-amber-500 font-bold"
                >
                  <option value="">-- Choose Member --</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.membershipNumber}) — Balance: {m.currentPoints.toLocaleString()} pts
                    </option>
                  ))}
                </select>
              </div>

              {/* Reward Items Catalog */}
              <div className="space-y-2">
                <label className="block text-slate-400 text-[11px] font-bold">Choose Reward Certificate *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {rewards.map(item => {
                    const isSelected = selectedRewardId === item.id;
                    const curMember = members.find(m => m.id === redeemMemberId);
                    const canAfford = curMember ? curMember.currentPoints >= item.pointsCost : true;

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedRewardId(item.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/50 shadow-md'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        } ${!canAfford ? 'opacity-60' : ''}`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.category}</span>
                            <span className="text-xs font-black text-amber-400 font-mono">
                              {item.pointsCost.toLocaleString()} pts
                            </span>
                          </div>
                          <h4 className="font-bold text-white text-xs leading-snug">{item.name}</h4>
                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{item.description}</p>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                          <span>Valid {item.voucherValidityDays} days</span>
                          {isSelected && <span className="font-bold text-amber-400">Selected ✓</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRedeemModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedRewardId}
                  className="px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 disabled:opacity-50 text-white font-black rounded-xl text-xs cursor-pointer shadow-md"
                >
                  Issue Reward Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: TIER BENEFITS MATRIX */}
      {showTierMatrixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-white text-base">Loyalty Program Tiers & Privilege Matrix</h3>
              </div>
              <button onClick={() => setShowTierMatrixModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {(['Bronze Explorer', 'Silver Preferred', 'Gold Elite', 'Platinum Ambassador', 'Diamond Royal'] as LoyaltyTier[]).map(t => {
                const conf = TIER_CONFIGS[t];
                return (
                  <div key={t} className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${conf.badgeBg} ${conf.badgeBorder}`}>
                    <div>
                      <span className={`text-[10px] uppercase font-black tracking-wider block ${conf.badgeColor}`}>
                        {t}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        <span className="text-[11px] text-slate-300 block font-bold">
                          {conf.minStays > 0 ? `${conf.minStays}+ Stays` : 'Entry Level'}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {conf.minSpend > 0 ? `৳${conf.minSpend.toLocaleString()} Spend` : 'No min spend'}
                        </span>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/80 space-y-1 text-[11px]">
                        <div className="flex justify-between text-slate-300">
                          <span>Points Accrual:</span>
                          <strong className="text-amber-400 font-mono">{conf.pointsMultiplier}x</strong>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Room Discount:</span>
                          <strong className="text-emerald-400 font-mono">{conf.roomDiscountPct}%</strong>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>F&B Discount:</span>
                          <strong className="text-blue-400 font-mono">{conf.fnbDiscountPct}%</strong>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[10px] text-slate-300">
                      <span className="font-bold text-slate-400 block uppercase text-[9px]">Privileges:</span>
                      <ul className="space-y-1 list-disc list-inside">
                        {conf.perks.map((p, i) => (
                          <li key={i} className="leading-tight">{p}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: LOG SERVICE RECOVERY INCIDENT */}
      {showAddIncidentModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                <h3 className="font-black text-white text-base">Service Recovery & Apology</h3>
              </div>
              <button onClick={() => setShowAddIncidentModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddIncidentSubmit} className="space-y-3.5">
              <div>
                <label className="block text-slate-400 mb-1 text-[11px] font-bold">Department Scope</label>
                <select
                  value={incidentCategory}
                  onChange={e => setIncidentCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 text-xs focus:outline-none focus:border-amber-500 font-bold"
                >
                  <option value="Front Desk">Front Desk</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="F&B">F&B & Dining</option>
                  <option value="Maintenance">Maintenance / Room Defect</option>
                  <option value="Billing">Billing & Settlement</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 text-[11px] font-bold">Incident / Complaint Description *</label>
                <textarea
                  rows={2}
                  required
                  value={incidentIssue}
                  onChange={e => setIncidentIssue(e.target.value)}
                  placeholder="e.g. AC cooling malfunction on day 2 of stay..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 text-[11px] font-bold">Resolution & Recovery Action Taken *</label>
                <textarea
                  rows={2}
                  required
                  value={incidentResolution}
                  onChange={e => setIncidentResolution(e.target.value)}
                  placeholder="e.g. Relocated to executive suite, complimentary fruit basket delivered by Duty Manager..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 text-[11px] font-bold">Compensation Loyalty Points</label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={incidentCompPoints}
                  onChange={e => setIncidentCompPoints(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-amber-400 font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddIncidentModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-black rounded-xl text-xs cursor-pointer shadow-md"
                >
                  Record & Compensate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Lucide icon helper
const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
