import React, { useState, useEffect } from 'react';
import {
  PhoneCall, Search, Plus, Calendar, CheckCircle2, Clock,
  AlertCircle, Building, User, FileText, ChevronRight, X,
  Filter, Sparkles, MessageSquare
} from 'lucide-react';
import { salesMarketingService, SalesActivity } from '../../services/salesMarketingService';

export const SalesActivitiesTab: React.FC = () => {
  const [activities, setActivities] = useState<SalesActivity[]>(
    salesMarketingService.getSalesActivities()
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<SalesActivity | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formClient, setFormClient] = useState('');
  const [formType, setFormType] = useState<SalesActivity['activityType']>('Site Inspection');
  const [formRep, setFormRep] = useState('Kamran Chowdhury');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTime, setFormTime] = useState('14:00');
  const [formPriority, setFormPriority] = useState<SalesActivity['priority']>('Medium');
  const [formNotes, setFormNotes] = useState('');
  const [formFollowUp, setFormFollowUp] = useState('');

  const refresh = () => {
    setActivities([...salesMarketingService.getSalesActivities()]);
  };

  useEffect(() => {
    const unsub = salesMarketingService.subscribe(refresh);
    return () => unsub();
  }, []);

  const filtered = activities.filter(a => {
    const term = (searchTerm || '').toLowerCase();
    const matchSearch =
      (a.title || '').toLowerCase().includes(term) ||
      (a.clientName || '').toLowerCase().includes(term) ||
      (a.salesRep || '').toLowerCase().includes(term) ||
      (a.outcomeNotes || '').toLowerCase().includes(term);
    const matchType = typeFilter === 'All' || a.activityType === typeFilter;
    const matchStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const completedCount = activities.filter(a => a.status === 'Completed').length;
  const scheduledCount = activities.filter(a => a.status === 'Scheduled').length;
  const urgentCount = activities.filter(a => a.priority === 'High' || a.priority === 'Urgent').length;

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formClient) {
      alert('Please fill in activity title and client organization.');
      return;
    }

    salesMarketingService.addSalesActivity({
      title: formTitle,
      clientName: formClient,
      clientType: 'Corporate',
      salesRep: formRep,
      activityType: formType,
      date: formDate,
      time: formTime,
      priority: formPriority,
      outcomeNotes: formNotes || 'Pending initial interaction with client.',
      status: 'Scheduled',
      nextFollowUpDate: formFollowUp || undefined
    });

    alert(`Sales activity '${formTitle}' scheduled successfully.`);
    setShowAddModal(false);
    setFormTitle('');
    setFormClient('');
    setFormNotes('');
    setFormFollowUp('');
  };

  const handleCompleteActivity = (act: SalesActivity) => {
    const outcome = prompt('Enter interaction outcome / minutes:', act.outcomeNotes);
    if (outcome !== null) {
      salesMarketingService.updateSalesActivity(act.id, {
        status: 'Completed',
        outcomeNotes: outcome || act.outcomeNotes
      });
      refresh();
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Activity KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Sales Interactions</span>
            <PhoneCall className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-slate-100">
            {activities.length} Recorded
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Client tours, calls & contract reviews
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Completed Interactions</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-emerald-400">
            {completedCount} Completed
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Documented meeting minutes & proposals
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Upcoming Scheduled</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-blue-400">
            {scheduledCount} Ahead
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Site inspections & banquet tastings
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>High Priority Leads</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-rose-400">
            {urgentCount} Key Accounts
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Immediate follow-up required
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
              placeholder="Search activity, client, rep..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-amber-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="All">All Types</option>
            <option value="Site Inspection">Site Inspection</option>
            <option value="Client Call">Client Call</option>
            <option value="Corporate Meeting">Corporate Meeting</option>
            <option value="Food Tasting">Food Tasting</option>
            <option value="Contract Signing">Contract Signing</option>
            <option value="Proposal Review">Proposal Review</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="All">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Pending Review">Pending Review</option>
          </select>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Log Sales Activity</span>
        </button>
      </div>

      {/* Activities Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-3.5 py-3 font-bold">Activity & Purpose</th>
                <th className="px-3.5 py-3 font-bold">Client / Organization</th>
                <th className="px-3.5 py-3 font-bold">Type & Sales Rep</th>
                <th className="px-3.5 py-3 font-bold">Date & Time</th>
                <th className="px-3.5 py-3 font-bold">Outcome / Notes</th>
                <th className="px-3.5 py-3 font-bold text-center">Status</th>
                <th className="px-3.5 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No sales activities found matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(act => (
                  <tr key={act.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-3.5 py-3">
                      <p className="font-bold text-slate-100">{act.title}</p>
                      <div className="flex items-center space-x-1 text-[10px] mt-0.5">
                        <span className={`px-1.5 py-0.2 rounded font-semibold ${
                          act.priority === 'Urgent' ? 'bg-rose-500/20 text-rose-300' :
                          act.priority === 'High' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {act.priority} Priority
                        </span>
                        {act.nextFollowUpDate && (
                          <span className="text-slate-400 font-mono">
                            • Follow-up: {act.nextFollowUpDate}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-3.5 py-3 font-medium text-slate-200">
                      <div className="flex items-center space-x-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{act.clientName}</span>
                      </div>
                    </td>

                    <td className="px-3.5 py-3">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-semibold text-[11px] border border-amber-500/20">
                        {act.activityType}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Rep: {act.salesRep}</p>
                    </td>

                    <td className="px-3.5 py-3 font-mono text-slate-300">
                      <div>{act.date}</div>
                      {act.time && <div className="text-[10px] text-slate-500">{act.time}</div>}
                    </td>

                    <td className="px-3.5 py-3 text-slate-300 max-w-xs">
                      <p className="line-clamp-2">{act.outcomeNotes}</p>
                    </td>

                    <td className="px-3.5 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        act.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-300' :
                        act.status === 'Scheduled' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-amber-500/20 text-amber-300'
                      }`}>
                        {act.status}
                      </span>
                    </td>

                    <td className="px-3.5 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {act.status !== 'Completed' && (
                          <button
                            onClick={() => handleCompleteActivity(act)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[11px] transition-colors flex items-center space-x-1 shadow-xs"
                            title="Mark Activity Completed with Minutes"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Complete</span>
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedActivity(act)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold text-[11px] transition-colors border border-slate-700"
                        >
                          View
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

      {/* MODAL: View Details */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100">{selectedActivity.title}</h3>
                <span className="text-[11px] text-amber-400 font-mono">{selectedActivity.activityType}</span>
              </div>
              <button onClick={() => setSelectedActivity(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl space-y-2 text-xs border border-slate-800">
              <div className="flex justify-between text-slate-400">
                <span>Client Organization:</span>
                <strong className="text-slate-100">{selectedActivity.clientName}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Sales Representative:</span>
                <span className="text-slate-200">{selectedActivity.salesRep}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Scheduled Date & Time:</span>
                <span className="font-mono text-slate-200">{selectedActivity.date} {selectedActivity.time}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Current Status:</span>
                <span className="text-emerald-400 font-bold">{selectedActivity.status}</span>
              </div>
              {selectedActivity.nextFollowUpDate && (
                <div className="flex justify-between text-slate-400">
                  <span>Next Follow-up:</span>
                  <span className="text-amber-400 font-mono">{selectedActivity.nextFollowUpDate}</span>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 mb-1">Meeting Minutes & Outcome Notes</h4>
              <p className="bg-slate-950 p-3 rounded-xl text-xs text-slate-200 border border-slate-800 leading-relaxed">
                {selectedActivity.outcomeNotes}
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedActivity(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Log Activity */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-amber-400" />
                <span>Log Sales Engagement Activity</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddActivity} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Activity Title / Purpose *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grand Ballroom Site Tour & Tariff Discussion"
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
                    placeholder="e.g. Standard Chartered Bank"
                    value={formClient}
                    onChange={e => setFormClient(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Activity Type</label>
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Site Inspection">Site Inspection</option>
                    <option value="Client Call">Client Call</option>
                    <option value="Corporate Meeting">Corporate Meeting</option>
                    <option value="Food Tasting">Food Tasting</option>
                    <option value="Contract Signing">Contract Signing</option>
                    <option value="Proposal Review">Proposal Review</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Assigned Sales Rep</label>
                  <select
                    value={formRep}
                    onChange={e => setFormRep(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Kamran Chowdhury">Kamran Chowdhury</option>
                    <option value="Nusrat Jahan">Nusrat Jahan</option>
                    <option value="Shamima Akter">Shamima Akter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Time</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={e => setFormTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={e => setFormPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Next Follow-Up Date</label>
                  <input
                    type="date"
                    value={formFollowUp}
                    onChange={e => setFormFollowUp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Notes / Action Items</label>
                <textarea
                  rows={2}
                  placeholder="Outline purpose of engagement, key client requirements, or attendees"
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
                  Schedule Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
