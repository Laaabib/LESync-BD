import React, { useState, useEffect } from 'react';
import {
  Briefcase, Users, Star, Gift, PhoneCall, FileText, CheckCircle2,
  Plus, Search, Filter, Mail, Building, Award, Calendar, DollarSign,
  Tag, MessageSquare, Heart, Shield, Sparkles, TrendingUp, X,
  ExternalLink, ArrowUpRight, Check, ThumbsUp
} from 'lucide-react';
import { salesMarketingService, CorporateAccountExtended } from '../services/salesMarketingService';
import { pmsService } from '../services/pmsService';
import { CorporateAccountsTab } from '../components/sales/CorporateAccountsTab';
import { TravelAgentsTab } from '../components/sales/TravelAgentsTab';
import { SalesActivitiesTab } from '../components/sales/SalesActivitiesTab';
import { SalesLeadsTab } from '../components/sales/SalesLeadsTab';
import { SalesContractsTab } from '../components/sales/SalesContractsTab';
import { PromotionsCampaignsTab } from '../components/sales/PromotionsCampaignsTab';
import { GuestLoyaltyCrmTab } from '../components/sales/GuestLoyaltyCrmTab';
import { guestLoyaltyService } from '../services/guestLoyaltyService';

interface CommercialCrmProps {
  initialTab?: 'loyalty' | 'corporate' | 'agents' | 'activities' | 'leads' | 'contracts' | 'promotions' | 'vip' | 'preferences' | 'feedback' | string;
  onNavigate?: (route: string) => void;
}

interface VipGuestRecord {
  id: string;
  name: string;
  designation: string;
  tier: 'Diamond VIP' | 'Platinum VIP' | 'Gold VIP' | 'Silver VIP';
  visits: number;
  totalSpend: number;
  specialNote: string;
}

interface PreferenceRecord {
  id: string;
  guest: string;
  category: 'Housekeeping' | 'F&B' | 'Front Desk' | 'Wellness' | 'Transportation';
  preference: string;
}

interface FeedbackRecord {
  id: string;
  guest: string;
  stayDate: string;
  rating: number;
  category: string;
  comments: string;
  status: 'Reviewed & Resolved' | 'Reviewed' | 'Commended' | 'In Progress';
}

export const CommercialCrmView: React.FC<CommercialCrmProps> = ({
  initialTab = 'loyalty',
  onNavigate
}) => {
  // Normalize initialTab
  const validTabs = ['loyalty', 'corporate', 'agents', 'activities', 'leads', 'contracts', 'promotions', 'vip', 'preferences', 'feedback'];
  const normalize = (tab: string) => (validTabs.includes(tab) ? tab : 'loyalty');

  const [activeTab, setActiveTab] = useState<string>(normalize(initialTab));

  useEffect(() => {
    setActiveTab(normalize(initialTab));
  }, [initialTab]);

  // VIP Guests state
  const [vipGuests, setVipGuests] = useState<VipGuestRecord[]>([
    { id: 'vip-1', name: 'Dr. Tariqul Islam', designation: 'Managing Director, Apex Group', tier: 'Platinum VIP', visits: 18, totalSpend: 840000, specialNote: 'High floor corner cottage, strictly feather-free pillows, fresh coconut water on arrival.' },
    { id: 'vip-2', name: 'Ambassador Syed Mansur', designation: 'Former High Commissioner', tier: 'Diamond VIP', visits: 24, totalSpend: 1250000, specialNote: 'Strict protocol escort, direct room check-in, loves Garden View Suite.' },
    { id: 'vip-3', name: 'Ms. Rubaba Dowla', designation: 'Country Director, Tech Hub', tier: 'Gold VIP', visits: 9, totalSpend: 390000, specialNote: 'High speed Wi-Fi priority, almond milk in minibar, late checkout 16:00.' }
  ]);
  const [showAddVipModal, setShowAddVipModal] = useState(false);
  const [vipName, setVipName] = useState('');
  const [vipDesignation, setVipDesignation] = useState('');
  const [vipTier, setVipTier] = useState<VipGuestRecord['tier']>('Platinum VIP');
  const [vipSpend, setVipSpend] = useState(250000);
  const [vipNotes, setVipNotes] = useState('');

  // Preferences state
  const [preferencesList, setPreferencesList] = useState<PreferenceRecord[]>([
    { id: 'pref-1', guest: 'Dr. Tariqul Islam', category: 'Housekeeping', preference: 'Feather-free hypoallergenic bedding & lavender pillow mist' },
    { id: 'pref-2', guest: 'Dr. Tariqul Islam', category: 'F&B', preference: 'Low-sodium olive oil preparation, Earl Grey tea at 07:00 AM' },
    { id: 'pref-3', guest: 'Ambassador Syed Mansur', category: 'Front Desk', preference: 'Pre-key cutting, quiet cottage away from main lobby pool' },
    { id: 'pref-4', guest: 'Ms. Rubaba Dowla', category: 'Wellness', preference: 'Aromatherapy massage appointment daily at 18:30' }
  ]);
  const [showAddPrefModal, setShowAddPrefModal] = useState(false);
  const [prefGuest, setPrefGuest] = useState('');
  const [prefCat, setPrefCat] = useState<PreferenceRecord['category']>('Housekeeping');
  const [prefText, setPrefText] = useState('');

  // Feedback state
  const [feedbackList, setFeedbackList] = useState<FeedbackRecord[]>([
    { id: 'fb-1', guest: 'Dr. Tariqul Islam', stayDate: '2026-08-25', rating: 5, category: 'Resort Ambience & Service', comments: 'Superb hospitality by front desk staff Shamima and excellent food at the dining hall.', status: 'Reviewed & Resolved' },
    { id: 'fb-2', guest: 'Mr. Zahid Hossain', stayDate: '2026-08-28', rating: 4, category: 'Convention Event', comments: 'Audio quality in the Grand Ballroom was crystal clear. Lunch buffet was warm and delicious.', status: 'Reviewed' },
    { id: 'fb-3', guest: 'Ms. Anika Tabassum', stayDate: '2026-08-30', rating: 5, category: 'Recreation Pool & Spa', comments: 'The infinity pool view is stunning. Very attentive lifeguard and spa therapists.', status: 'Commended' }
  ]);
  const [showAddFbModal, setShowAddFbModal] = useState(false);
  const [fbGuest, setFbGuest] = useState('');
  const [fbRating, setFbRating] = useState(5);
  const [fbCategory, setFbCategory] = useState('Resort Ambience & Service');
  const [fbComments, setFbComments] = useState('');

  // Quick stats from services
  const [loyaltyCount, setLoyaltyCount] = useState(guestLoyaltyService.getMembers().length);
  const [corpCount, setCorpCount] = useState(salesMarketingService.getCorporateAccounts().length);
  const [agentCount, setAgentCount] = useState(salesMarketingService.getTravelAgents().length);
  const [activityCount, setActivityCount] = useState(salesMarketingService.getSalesActivities().length);
  const [leadCount, setLeadCount] = useState(salesMarketingService.getLeads().length);
  const [contractCount, setContractCount] = useState(salesMarketingService.getContracts().length);
  const [promoCount, setPromoCount] = useState(salesMarketingService.getPromotions().length);

  useEffect(() => {
    const unsubSales = salesMarketingService.subscribe(() => {
      setCorpCount(salesMarketingService.getCorporateAccounts().length);
      setAgentCount(salesMarketingService.getTravelAgents().length);
      setActivityCount(salesMarketingService.getSalesActivities().length);
      setLeadCount(salesMarketingService.getLeads().length);
      setContractCount(salesMarketingService.getContracts().length);
      setPromoCount(salesMarketingService.getPromotions().length);
    });
    const unsubLoyalty = guestLoyaltyService.subscribe(() => {
      setLoyaltyCount(guestLoyaltyService.getMembers().length);
    });
    return () => {
      unsubSales();
      unsubLoyalty();
    };
  }, []);

  const handleAddVip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vipName) return;
    const newVip: VipGuestRecord = {
      id: `vip-${Date.now()}`,
      name: vipName,
      designation: vipDesignation || 'Corporate Executive',
      tier: vipTier,
      visits: 1,
      totalSpend: Number(vipSpend),
      specialNote: vipNotes || 'Priority VIP service and check-in assistance'
    };
    setVipGuests([newVip, ...vipGuests]);
    setShowAddVipModal(false);
    setVipName('');
    setVipDesignation('');
    setVipNotes('');
  };

  const handleAddPref = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prefGuest || !prefText) return;
    const newPref: PreferenceRecord = {
      id: `pref-${Date.now()}`,
      guest: prefGuest,
      category: prefCat,
      preference: prefText
    };
    setPreferencesList([newPref, ...preferencesList]);
    setShowAddPrefModal(false);
    setPrefGuest('');
    setPrefText('');
  };

  const handleAddFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbGuest || !fbComments) return;
    const newFb: FeedbackRecord = {
      id: `fb-${Date.now()}`,
      guest: fbGuest,
      stayDate: new Date().toISOString().split('T')[0],
      rating: Number(fbRating),
      category: fbCategory,
      comments: fbComments,
      status: 'Reviewed'
    };
    setFeedbackList([newFb, ...feedbackList]);
    setShowAddFbModal(false);
    setFbGuest('');
    setFbComments('');
  };

  const tabs = [
    { id: 'loyalty', label: 'Guest Loyalty & CRM', count: loyaltyCount },
    { id: 'corporate', label: 'Corporate Accounts', count: corpCount },
    { id: 'agents', label: 'Travel Agents & OTAs', count: agentCount },
    { id: 'activities', label: 'Sales Activities', count: activityCount },
    { id: 'leads', label: 'Sales Pipeline & Leads', count: leadCount },
    { id: 'contracts', label: 'Contracts & Agreements', count: contractCount },
    { id: 'promotions', label: 'Promotions & Promo Codes', count: promoCount },
    { id: 'vip', label: 'VIP Guests', count: vipGuests.length },
    { id: 'preferences', label: 'Guest Preferences', count: preferencesList.length },
    { id: 'feedback', label: 'Feedback & Ratings', count: feedbackList.length }
  ];

  return (
    <div className="space-y-4 text-xs text-slate-200">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center border border-amber-500/30 shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-100">Commercial, Sales & CRM Engine</h1>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                Connected to Accounts (GL) & PMS
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Live two-way synchronization: Corporate City Ledger AR (1150), Travel Agent Commission Payouts (GL 5050), Pipeline conversion to Front Office Reservations & Banquets.
            </p>
          </div>
        </div>

        {onNavigate && (
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => onNavigate('accounting-city-ledger')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs transition-colors border border-slate-700 flex items-center space-x-1.5"
              title="Open City Ledger & Accounts Receivable"
            >
              <span>Accounts Receivable</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
            </button>
            <button
              onClick={() => onNavigate('reservations')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs transition-colors border border-slate-700 flex items-center space-x-1.5"
              title="Open Room Reservations"
            >
              <span>Reservations</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
            </button>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 p-1.5 rounded-xl overflow-x-auto scrollbar-thin shadow-xs">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center space-x-1.5 text-xs ${
              activeTab === t.id
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span>{t.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === t.id
                  ? 'bg-slate-950/25 text-slate-950'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* TAB CONTENT: Guest CRM & Loyalty Profiling */}
      {activeTab === 'loyalty' && (
        <GuestLoyaltyCrmTab onNavigate={onNavigate} />
      )}

      {/* TAB CONTENT: Corporate Accounts */}
      {activeTab === 'corporate' && (
        <CorporateAccountsTab
          onNavigate={onNavigate}
          onOpenNewReservationForCorporate={(corp) => {
            if (onNavigate) {
              onNavigate('reservations');
            } else {
              alert(`Booking initiated for corporate account: ${corp.companyName}`);
            }
          }}
        />
      )}

      {/* TAB CONTENT: Travel Agents */}
      {activeTab === 'agents' && (
        <TravelAgentsTab onNavigate={onNavigate} />
      )}

      {/* TAB CONTENT: Sales Activities */}
      {activeTab === 'activities' && (
        <SalesActivitiesTab />
      )}

      {/* TAB CONTENT: Sales Leads & Pipeline */}
      {activeTab === 'leads' && (
        <SalesLeadsTab onNavigate={onNavigate} />
      )}

      {/* TAB CONTENT: Contracts & Agreements */}
      {activeTab === 'contracts' && (
        <SalesContractsTab />
      )}

      {/* TAB CONTENT: Promotions & Promo Codes */}
      {activeTab === 'promotions' && (
        <PromotionsCampaignsTab />
      )}

      {/* TAB CONTENT: VIP Guests */}
      {activeTab === 'vip' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-xs">
            <span className="font-bold text-slate-200">Registered VIP & VVIP Guest Directory ({vipGuests.length})</span>
            <button
              onClick={() => setShowAddVipModal(true)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add VIP Guest</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {vipGuests.map(v => (
              <div key={v.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 hover:border-slate-700 transition-colors shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span>{v.name}</span>
                  </h3>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    v.tier === 'Diamond VIP' ? 'bg-cyan-500/20 text-cyan-300' :
                    v.tier === 'Platinum VIP' ? 'bg-purple-500/20 text-purple-300' :
                    'bg-amber-500/20 text-amber-300'
                  }`}>
                    {v.tier}
                  </span>
                </div>
                <p className="text-slate-400 text-xs">{v.designation}</p>
                <div className="space-y-1 bg-slate-950 p-2.5 rounded-lg text-[11px] border border-slate-800">
                  <div className="flex justify-between text-slate-400">
                    <span>Total Stays:</span>
                    <strong className="text-slate-200">{v.visits} Stays</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Lifetime Spend:</span>
                    <strong className="text-emerald-400 font-mono font-bold">৳{(v.totalSpend || 0).toLocaleString()}</strong>
                  </div>
                </div>
                <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[11px] text-amber-200 leading-relaxed">
                  <strong>VIP Protocol:</strong> {v.specialNote}
                </div>
              </div>
            ))}
          </div>

          {showAddVipModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-slate-100">Add VIP Guest Profile</h3>
                  <button onClick={() => setShowAddVipModal(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleAddVip} className="space-y-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Guest Full Name *</label>
                    <input
                      type="text"
                      required
                      value={vipName}
                      onChange={e => setVipName(e.target.value)}
                      placeholder="e.g. Dr. Kamal Hossain"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 mb-1">Title / Designation</label>
                      <input
                        type="text"
                        value={vipDesignation}
                        onChange={e => setVipDesignation(e.target.value)}
                        placeholder="e.g. Chairman & Founder"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">VIP Tier</label>
                      <select
                        value={vipTier}
                        onChange={e => setVipTier(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                      >
                        <option value="Platinum VIP">Platinum VIP</option>
                        <option value="Diamond VIP">Diamond VIP</option>
                        <option value="Gold VIP">Gold VIP</option>
                        <option value="Silver VIP">Silver VIP</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">VIP Protocol & Requirements</label>
                    <textarea
                      rows={2}
                      value={vipNotes}
                      onChange={e => setVipNotes(e.target.value)}
                      placeholder="e.g. Lake view cottage, fruit basket, pre-checkin room inspection"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="pt-2 flex justify-end space-x-2">
                    <button type="button" onClick={() => setShowAddVipModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg">Save VIP</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Preferences */}
      {activeTab === 'preferences' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-xs">
            <span className="font-bold text-slate-200">Departmental Guest Preference Registry</span>
            <button
              onClick={() => setShowAddPrefModal(true)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Record Preference</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="px-3.5 py-2.5 font-bold">Guest Name</th>
                  <th className="px-3.5 py-2.5 font-bold">Department Scope</th>
                  <th className="px-3.5 py-2.5 font-bold">Specific Service Instruction / Preference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {preferencesList.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="px-3.5 py-2.5 font-bold text-slate-100">{p.guest}</td>
                    <td className="px-3.5 py-2.5">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-semibold text-[10px]">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-300 font-medium">{p.preference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showAddPrefModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-slate-100">Add Guest Service Preference</h3>
                  <button onClick={() => setShowAddPrefModal(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleAddPref} className="space-y-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Guest Full Name *</label>
                    <input
                      type="text"
                      required
                      value={prefGuest}
                      onChange={e => setPrefGuest(e.target.value)}
                      placeholder="e.g. Mr. S. A. Chowdhury"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Department</label>
                    <select
                      value={prefCat}
                      onChange={e => setPrefCat(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                    >
                      <option value="Housekeeping">Housekeeping (Bedding, Linens, Amenities)</option>
                      <option value="F&B">F&B (Dietary, Dining preferences)</option>
                      <option value="Front Desk">Front Desk (Room allocation, key cards)</option>
                      <option value="Wellness">Wellness (Spa, Pool, Fitness)</option>
                      <option value="Transportation">Transportation (Airport, Chauffeur)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Special Preference Instruction *</label>
                    <textarea
                      rows={2}
                      required
                      value={prefText}
                      onChange={e => setPrefText(e.target.value)}
                      placeholder="e.g. Non-dairy creamer, morning newspaper at door by 06:30"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="pt-2 flex justify-end space-x-2">
                    <button type="button" onClick={() => setShowAddPrefModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg">Save Preference</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Feedback */}
      {activeTab === 'feedback' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-xs">
            <span className="font-bold text-slate-200">Guest Reviews & Feedback Ledger ({feedbackList.length})</span>
            <button
              onClick={() => setShowAddFbModal(true)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Record Guest Feedback</span>
            </button>
          </div>

          <div className="space-y-3">
            {feedbackList.map(f => (
              <div key={f.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-slate-100 text-sm">{f.guest}</h3>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                      {f.category}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < f.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-slate-300 text-xs italic">"{f.comments}"</p>
                <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                  <span>Stay Date: {f.stayDate}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    {f.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {showAddFbModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-slate-100">Log Guest Review & Rating</h3>
                  <button onClick={() => setShowAddFbModal(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleAddFeedback} className="space-y-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Guest Full Name *</label>
                    <input
                      type="text"
                      required
                      value={fbGuest}
                      onChange={e => setFbGuest(e.target.value)}
                      placeholder="e.g. Mr. & Mrs. Farhan"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 mb-1">Rating (1 to 5 Stars)</label>
                      <select
                        value={fbRating}
                        onChange={e => setFbRating(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                      >
                        <option value={5}>★★★★★ (5 Stars - Exceptional)</option>
                        <option value={4}>★★★★☆ (4 Stars - Good)</option>
                        <option value={3}>★★★☆☆ (3 Stars - Average)</option>
                        <option value={2}>★★☆☆☆ (2 Stars - Needs Improvement)</option>
                        <option value={1}>★☆☆☆☆ (1 Star - Poor)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Experience Area</label>
                      <select
                        value={fbCategory}
                        onChange={e => setFbCategory(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                      >
                        <option value="Resort Ambience & Service">Resort Ambience & Service</option>
                        <option value="Convention Event">Convention Event</option>
                        <option value="Recreation Pool & Spa">Recreation Pool & Spa</option>
                        <option value="Dining & Restaurant">Dining & Restaurant</option>
                        <option value="Cottage Comfort">Cottage Comfort</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Feedback Remarks *</label>
                    <textarea
                      rows={3}
                      required
                      value={fbComments}
                      onChange={e => setFbComments(e.target.value)}
                      placeholder="Guest testimonial or constructive notes"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="pt-2 flex justify-end space-x-2">
                    <button type="button" onClick={() => setShowAddFbModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg">Submit Review</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
