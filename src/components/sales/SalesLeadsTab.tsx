import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Search, Plus, Calendar, DollarSign, Users,
  CheckCircle2, ArrowRight, Building, Award, Filter, X,
  ExternalLink, Sparkles, BedDouble, UtensilsCrossed
} from 'lucide-react';
import { salesMarketingService, SalesLead } from '../../services/salesMarketingService';
import { pmsService } from '../../services/pmsService';

interface SalesLeadsTabProps {
  onNavigate?: (route: string) => void;
}

export const SalesLeadsTab: React.FC<SalesLeadsTabProps> = ({ onNavigate }) => {
  const [leads, setLeads] = useState<SalesLead[]>(salesMarketingService.getLeads());
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('All');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [convertModalLead, setConvertModalLead] = useState<SalesLead | null>(null);
  const [selectedHallId, setSelectedHallId] = useState<string>('hall-1');

  // Add Form states
  const [formTitle, setFormTitle] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formEvent, setFormEvent] = useState<SalesLead['eventType']>('Executive Retreat');
  const [formDate, setFormDate] = useState('2026-10-15');
  const [formPax, setFormPax] = useState(60);
  const [formRooms, setFormRooms] = useState(30);
  const [formRevenue, setFormRevenue] = useState(450000);
  const [formProbability, setFormProbability] = useState(70);
  const [formStage, setFormStage] = useState<SalesLead['stage']>('Proposal Sent');
  const [formRep, setFormRep] = useState('Kamran Chowdhury');
  const [formNotes, setFormNotes] = useState('');

  const refresh = () => {
    setLeads([...salesMarketingService.getLeads()]);
  };

  useEffect(() => {
    const unsub = salesMarketingService.subscribe(refresh);
    return () => unsub();
  }, []);

  const pmsState = pmsService.getState();
  const halls = pmsState.halls || [];

  const filtered = leads.filter(l => {
    const term = (searchTerm || '').toLowerCase();
    const matchSearch =
      (l.title || '').toLowerCase().includes(term) ||
      (l.clientCompany || '').toLowerCase().includes(term) ||
      (l.contactPerson || '').toLowerCase().includes(term) ||
      (l.assignedRep || '').toLowerCase().includes(term);
    const matchStage = stageFilter === 'All' || l.stage === stageFilter;
    return matchSearch && matchStage;
  });

  const totalPipeline = leads.reduce((sum, l) => sum + (l.stage !== 'Lost' ? l.expectedRevenue : 0), 0);
  const weightedPipeline = leads.reduce((sum, l) => sum + (l.stage !== 'Lost' ? (l.expectedRevenue * l.probability) / 100 : 0), 0);
  const activeLeadsCount = leads.filter(l => l.stage !== 'Lost' && l.stage !== 'Converted').length;
  const wonLeadsCount = leads.filter(l => l.stage === 'Converted').length;

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formCompany || !formContact) {
      alert('Please fill in lead title, company, and contact person.');
      return;
    }

    salesMarketingService.addLead({
      title: formTitle,
      clientCompany: formCompany,
      contactPerson: formContact,
      phone: formPhone,
      email: formEmail,
      leadSource: 'Corporate Referral',
      eventType: formEvent,
      expectedDate: formDate,
      expectedPax: Number(formPax),
      expectedRooms: Number(formRooms),
      expectedRevenue: Number(formRevenue),
      probability: Number(formProbability),
      stage: formStage,
      assignedRep: formRep,
      notes: formNotes
    });

    alert(`Lead '${formTitle}' added to pipeline.`);
    setShowAddModal(false);
    setFormTitle('');
    setFormCompany('');
    setFormContact('');
    setFormPhone('');
    setFormEmail('');
    setFormNotes('');
  };

  const handleConvertToReservation = (lead: SalesLead) => {
    if (confirm(`Convert lead '${lead.title}' into a verified Room Reservation in Front Office?`)) {
      const res = salesMarketingService.convertLeadToReservation(lead.id);
      if (res.success) {
        alert(res.message);
        setConvertModalLead(null);
        refresh();
      } else {
        alert(res.message);
      }
    }
  };

  const handleConvertToBanquetEvent = (lead: SalesLead) => {
    const res = salesMarketingService.convertLeadToBanquetEvent(lead.id, selectedHallId);
    if (res.success) {
      alert(res.message);
      setConvertModalLead(null);
      refresh();
    } else {
      alert(res.message);
    }
  };

  const handleAdvanceStage = (lead: SalesLead) => {
    const stages: SalesLead['stage'][] = ['New Inquiry', 'Qualification', 'Proposal Sent', 'Negotiation', 'Contract Signed', 'Converted', 'Lost'];
    const currentIdx = stages.indexOf(lead.stage);
    if (currentIdx < stages.length - 2) {
      const nextStage = stages[currentIdx + 1];
      salesMarketingService.updateLead(lead.id, {
        stage: nextStage,
        probability: Math.min(100, lead.probability + 15)
      });
      refresh();
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Pipeline KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Pipeline Value</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-emerald-400">
            ৳{(totalPipeline || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Gross expected revenue across open deals
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Weighted Forecast</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-amber-400">
            ৳{(Math.round(weightedPipeline) || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Adjusted by deal stage probability
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Pipeline Opportunities</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-blue-400">
            {activeLeadsCount} Deals
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Conferences, retreats & AGM proposals
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Converted to Bookings</span>
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-purple-400">
            {wonLeadsCount} Converted
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Integrated with PMS Reservations & Events
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search lead, client, rep..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-amber-500"
            />
          </div>

          <select
            value={stageFilter}
            onChange={e => setStageFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="All">All Pipeline Stages</option>
            <option value="New Inquiry">New Inquiry</option>
            <option value="Qualification">Qualification</option>
            <option value="Proposal Sent">Proposal Sent</option>
            <option value="Negotiation">Negotiation</option>
            <option value="Contract Signed">Contract Signed</option>
            <option value="Converted">Converted to Booking</option>
            <option value="Lost">Lost</option>
          </select>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Sales Lead</span>
        </button>
      </div>

      {/* Leads List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-500 text-xs">
            No pipeline leads found matching the selected criteria.
          </div>
        ) : (
          filtered.map(lead => (
            <div
              key={lead.id}
              className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 hover:border-slate-700 transition-colors shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider ${
                      lead.stage === 'Converted' ? 'bg-purple-500/20 text-purple-300' :
                      lead.stage === 'Contract Signed' ? 'bg-emerald-500/20 text-emerald-300' :
                      lead.stage === 'Negotiation' ? 'bg-amber-500/20 text-amber-300' :
                      lead.stage === 'Proposal Sent' ? 'bg-blue-500/20 text-blue-300' :
                      lead.stage === 'Lost' ? 'bg-rose-500/20 text-rose-300' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {lead.stage} ({lead.probability}% Prob)
                    </span>
                    <span className="text-slate-400 text-xs">• {lead.eventType}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-100 mt-1">{lead.title}</h3>
                  <p className="text-xs text-amber-400 font-medium">{lead.clientCompany}</p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-slate-400">Estimated Pipeline Value</span>
                  <p className="text-base font-bold font-mono text-emerald-400">
                    ৳{(lead.expectedRevenue || 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Weighted: ৳{(Math.round((lead.expectedRevenue * lead.probability) / 100) || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800/60">
                <div>
                  <span className="text-slate-500 text-[10px]">Contact Person:</span>
                  <p className="font-semibold text-slate-200 mt-0.5">{lead.contactPerson}</p>
                  <p className="text-[10px] text-slate-400">{lead.phone}</p>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px]">Expected Date & Size:</span>
                  <p className="font-mono text-slate-200 mt-0.5">{lead.expectedDate}</p>
                  <p className="text-[10px] text-slate-400">{lead.expectedPax} Pax • {lead.expectedRooms || 0} Rooms</p>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px]">Account Rep:</span>
                  <p className="text-slate-200 mt-0.5">{lead.assignedRep}</p>
                  <p className="text-[10px] text-slate-400">Source: {lead.leadSource}</p>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px]">System Status:</span>
                  {lead.convertedReference ? (
                    <p className="text-[11px] text-purple-400 font-mono font-bold mt-0.5">
                      ✓ {lead.convertedReference}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-0.5">In Commercial Pipeline</p>
                  )}
                </div>
              </div>

              {lead.notes && (
                <p className="text-slate-400 text-xs italic">
                  "{lead.notes}"
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-2">
                  {lead.stage !== 'Converted' && lead.stage !== 'Lost' && (
                    <button
                      onClick={() => handleAdvanceStage(lead)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded text-xs border border-slate-700 flex items-center space-x-1"
                    >
                      <span>Advance Stage</span>
                      <ArrowRight className="w-3 h-3 text-amber-400" />
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {lead.stage !== 'Converted' && (
                    <button
                      onClick={() => setConvertModalLead(lead)}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center space-x-1.5 shadow-xs"
                      title="Convert directly to Room Reservation or Banquet Event in Core PMS"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Convert Lead to Booking</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: Convert Lead to Booking / Event */}
      {convertModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Convert Sales Lead to Operational PMS Booking</span>
                </h3>
                <p className="text-[11px] text-slate-400">Instantly generate reservations or banquet hall bookings</p>
              </div>
              <button onClick={() => setConvertModalLead(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl space-y-1 text-xs border border-slate-800">
              <div className="flex justify-between text-slate-400">
                <span>Opportunity:</span>
                <strong className="text-slate-100">{convertModalLead.title}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Client Organization:</span>
                <span className="text-amber-400 font-semibold">{convertModalLead.clientCompany}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Expected Revenue:</span>
                <span className="font-mono font-bold text-emerald-400">৳{(convertModalLead.expectedRevenue || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Target Date & PAX:</span>
                <span className="font-mono">{convertModalLead.expectedDate} ({convertModalLead.expectedPax} Guests)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-1.5 font-bold text-slate-200">
                    <BedDouble className="w-4 h-4 text-blue-400" />
                    <span>Room Reservation</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-1">
                    Creates room booking in Front Office reservations with guest details and expected dates.
                  </p>
                </div>
                <button
                  onClick={() => handleConvertToReservation(convertModalLead)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors text-xs shadow-xs"
                >
                  Book Rooms
                </button>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-1.5 font-bold text-slate-200">
                    <UtensilsCrossed className="w-4 h-4 text-purple-400" />
                    <span>Banquet & Hall Event</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-1">
                    Schedules hall rental, catering packages, and sets billing to City Ledger.
                  </p>
                  <select
                    value={selectedHallId}
                    onChange={e => setSelectedHallId(e.target.value)}
                    className="w-full mt-2 bg-slate-900 border border-slate-700 text-slate-200 rounded p-1 text-[11px]"
                  >
                    {halls.map(h => (
                      <option key={h.id} value={h.id}>{h.name} (Cap: {h.capacity})</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => handleConvertToBanquetEvent(convertModalLead)}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors text-xs shadow-xs"
                >
                  Confirm Banquet Hall
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setConvertModalLead(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add New Lead */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>Add Opportunity to Sales Pipeline</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddLead} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Deal / Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Leadership Conference & Team Retreat"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Client Organization *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bangladesh Bank Staff Welfare"
                    value={formCompany}
                    onChange={e => setFormCompany(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Event Category</label>
                  <select
                    value={formEvent}
                    onChange={e => setFormEvent(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Executive Retreat">Executive Retreat</option>
                    <option value="Annual General Meeting (AGM)">Annual General Meeting (AGM)</option>
                    <option value="Conference">Conference / Convention</option>
                    <option value="Banquet / Gala">Banquet / Gala Dinner</option>
                    <option value="Rooms Block">Group Rooms Block</option>
                    <option value="Wedding">Destination Wedding</option>
                    <option value="Seminar">Training / Seminar</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full name"
                    value={formContact}
                    onChange={e => setFormContact(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+880 1700-000000"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="rep@client.com"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Expected Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Expected PAX</label>
                  <input
                    type="number"
                    min="5"
                    value={formPax}
                    onChange={e => setFormPax(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Required Rooms</label>
                  <input
                    type="number"
                    min="0"
                    value={formRooms}
                    onChange={e => setFormRooms(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Estimated Value (৳)</label>
                  <input
                    type="number"
                    min="10000"
                    step="10000"
                    value={formRevenue}
                    onChange={e => setFormRevenue(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Probability (%)</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={formProbability}
                    onChange={e => setFormProbability(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Pipeline Stage</label>
                  <select
                    value={formStage}
                    onChange={e => setFormStage(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="New Inquiry">New Inquiry</option>
                    <option value="Qualification">Qualification</option>
                    <option value="Proposal Sent">Proposal Sent</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Contract Signed">Contract Signed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Requirements & Special Requests</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Stage lighting, buffet arrangement for 200 pax, executive suites with lake view"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold"
                >
                  Save to Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
