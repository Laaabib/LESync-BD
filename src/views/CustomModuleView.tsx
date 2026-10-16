import React, { useState, useEffect, useMemo } from 'react';
import {
  Sliders, Plus, Search, Filter, Trash2, Edit3, Download,
  CheckCircle2, AlertCircle, Clock, ShieldCheck, ArrowRight,
  ExternalLink, Layers, Building2, Calendar, FileText, Check, X
} from 'lucide-react';
import { adminMasterService, NavModuleDef, SubMenuItemDef } from '../services/adminMasterService';
import * as XLSX from 'xlsx';

interface CustomModuleViewProps {
  route: string;
  onNavigate: (route: string) => void;
}

interface CustomRecord {
  id: string;
  subRoute: string;
  code: string;
  title: string;
  category: string;
  status: 'Active' | 'Pending' | 'Completed' | 'Archived';
  assignedTo: string;
  priority: 'High' | 'Medium' | 'Low';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'cculb_custom_module_records_v1';

export const CustomModuleView: React.FC<CustomModuleViewProps> = ({
  route,
  onNavigate
}) => {
  // Look up module & sub-menu metadata from adminMasterService
  const [navModules, setNavModules] = useState<NavModuleDef[]>(() => adminMasterService.getNavModules());

  useEffect(() => {
    const unsub = adminMasterService.subscribe(() => {
      setNavModules([...adminMasterService.getNavModules()]);
    });
    return () => unsub();
  }, []);

  const match = useMemo(() => {
    return adminMasterService.getModuleOrSubMenu(route);
  }, [route, navModules]);

  const activeModule = match?.module;
  const activeSubMenu = match?.subMenu;

  // Custom Records State (persisted per subRoute)
  const [records, setRecords] = useState<CustomRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const saveRecords = (newRecords: CustomRecord[]) => {
    setRecords(newRecords);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
    } catch (e) {
      console.warn('Unable to persist custom module records', e);
    }
  };

  // Filter records for this specific sub-route or module
  const currentSubRoute = activeSubMenu?.targetRoute || activeSubMenu?.id || route;
  const moduleRecords = useMemo(() => {
    return records.filter(r => r.subRoute === currentSubRoute);
  }, [records, currentSubRoute]);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Pending' | 'Completed'>('All');

  const filteredRecords = useMemo(() => {
    return moduleRecords.filter(r => {
      const matchStatus = statusFilter === 'All' || r.status === statusFilter;
      const matchSearch =
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [moduleRecords, searchTerm, statusFilter]);

  // Modal State for adding/editing record
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CustomRecord | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCategory, setFormCategory] = useState('Standard Operation');
  const [formStatus, setFormStatus] = useState<CustomRecord['status']>('Active');
  const [formPriority, setFormPriority] = useState<CustomRecord['priority']>('Medium');
  const [formAssignedTo, setFormAssignedTo] = useState('Operations Desk');
  const [formNotes, setFormNotes] = useState('');

  const handleOpenAdd = () => {
    setEditingRecord(null);
    setFormTitle('');
    setFormCode(`REC-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormCategory('Standard Operation');
    setFormStatus('Active');
    setFormPriority('Medium');
    setFormAssignedTo('Operations Desk');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: CustomRecord) => {
    setEditingRecord(rec);
    setFormTitle(rec.title);
    setFormCode(rec.code);
    setFormCategory(rec.category);
    setFormStatus(rec.status);
    setFormPriority(rec.priority);
    setFormAssignedTo(rec.assignedTo);
    setFormNotes(rec.notes);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const now = new Date().toISOString();
    if (editingRecord) {
      const updated = records.map(r => r.id === editingRecord.id ? {
        ...r,
        title: formTitle.trim(),
        code: formCode.trim(),
        category: formCategory.trim(),
        status: formStatus,
        priority: formPriority,
        assignedTo: formAssignedTo.trim(),
        notes: formNotes.trim(),
        updatedAt: now
      } : r);
      saveRecords(updated);
    } else {
      const newRec: CustomRecord = {
        id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        subRoute: currentSubRoute,
        code: formCode.trim() || `REC-${Math.floor(1000 + Math.random() * 9000)}`,
        title: formTitle.trim(),
        category: formCategory.trim(),
        status: formStatus,
        priority: formPriority,
        assignedTo: formAssignedTo.trim() || 'Operations Desk',
        notes: formNotes.trim(),
        createdAt: now,
        updatedAt: now
      };
      saveRecords([newRec, ...records]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this operational record permanently?')) {
      saveRecords(records.filter(r => r.id !== id));
    }
  };

  const exportExcel = () => {
    if (filteredRecords.length === 0) return;
    const exportData = filteredRecords.map(r => ({
      'Reference Code': r.code,
      'Title / Description': r.title,
      'Category': r.category,
      'Status': r.status,
      'Priority': r.priority,
      'Assigned Staff': r.assignedTo,
      'Notes': r.notes,
      'Created Date': new Date(r.createdAt).toLocaleDateString()
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Operational Registry');
    XLSX.writeFile(wb, `${(activeSubMenu?.label || activeModule?.label || 'Custom_Module').replace(/[^a-zA-Z0-9]/g, '_')}_Records.xlsx`);
  };

  const displayTitle = activeSubMenu?.label || activeModule?.label || 'Custom Operations Hub';
  const displayParentLabel = activeModule?.label || 'Master Operations';
  const displayBadge = activeSubMenu?.badge || activeModule?.badge;
  const displayBadgeColor = activeSubMenu?.badgeColor || activeModule?.badgeColor || 'bg-amber-500/20 text-amber-300 border-amber-500/30';

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl border border-slate-700/80 shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-xs text-amber-400 font-mono mb-2">
              <span className="hover:underline cursor-pointer" onClick={() => onNavigate('dashboard')}>Dashboard</span>
              <span>/</span>
              <span className="hover:underline cursor-pointer" onClick={() => onNavigate('admin-master-hub')}>{displayParentLabel}</span>
              <span>/</span>
              <span className="text-white font-semibold">{displayTitle}</span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
                <Sliders className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-black tracking-tight text-white">{displayTitle}</h1>
                  {displayBadge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${displayBadgeColor}`}>
                      {displayBadge}
                    </span>
                  )}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Live Navigation Active
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Enterprise Operational Workspace for <strong className="text-amber-300">{displayTitle}</strong> in {displayParentLabel}.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('admin-master-hub')}
              className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-600 transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
              title="Open Master Operations Hub to edit modules, sub-menus, ordering or visibility"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Configure in Master Hub</span>
            </button>

            {activeModule && activeModule.id !== 'dashboard' && activeModule.id !== 'administration' && (
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to delete module "${activeModule.label}" and all its sub-menus?`)) {
                    adminMasterService.deleteNavModule(activeModule.id);
                    onNavigate('admin-master-hub');
                  }
                }}
                className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl text-xs font-semibold border border-rose-500/40 transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                title={`Delete "${activeModule.label}"`}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Delete Module</span>
              </button>
            )}

            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-md shadow-amber-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Record</span>
            </button>
          </div>
        </div>

        {/* Sibling Sub-Menus Horizontal Navigation Strip */}
        {activeModule && activeModule.children && activeModule.children.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-700/60 flex items-center space-x-2 overflow-x-auto scrollbar-none text-xs">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold shrink-0 mr-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-amber-400" />
              Sub-Menus ({activeModule.children.filter(c => c.enabled !== false).length}):
            </span>
            {activeModule.children
              .filter(c => c.enabled !== false)
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map(sub => {
                const subTarget = sub.targetRoute || sub.id;
                const isCurrent = subTarget === currentSubRoute || sub.id === currentSubRoute;
                return (
                  <button
                    key={sub.id}
                    onClick={() => onNavigate(subTarget)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                      isCurrent
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60'
                    }`}
                  >
                    <span>{sub.label}</span>
                    {sub.badge && (
                      <span className="text-[9px] px-1 rounded bg-black/20 font-bold">{sub.badge}</span>
                    )}
                  </button>
                );
              })}
          </div>
        )}
      </div>

      {/* Quick Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Total Operational Records</span>
            <FileText className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {moduleRecords.length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Managed under {displayTitle}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Active / In Progress</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {moduleRecords.filter(r => r.status === 'Active' || r.status === 'Pending').length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Pending operational tasks
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Completed Operations</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {moduleRecords.filter(r => r.status === 'Completed').length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Finished workflow items
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Module Sibling Menus</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {activeModule?.children.length || 0}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Configured in Master Hub
          </div>
        </div>
      </div>

      {/* Main Workspace Table */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
        {/* Table Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {displayTitle} — Operational Registry
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Live records, workflow entries, and operational tracking for this navigation module.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search records..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 w-48"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>

            <button
              onClick={exportExcel}
              disabled={filteredRecords.length === 0}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold flex items-center space-x-1 transition disabled:opacity-40 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center space-x-1 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Record</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-3 w-28">Ref Code</th>
                <th className="p-3">Title / Subject</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Priority</th>
                <th className="p-3">Assigned Staff</th>
                <th className="p-3">Notes</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center">
                    <div className="max-w-md mx-auto text-center space-y-2">
                      <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20">
                        <Sliders className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        No Operational Records for {displayTitle}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        This module is live in production navigation. Click "Add Record" above to create tasks, operational entries, logs, or department records.
                      </p>
                      <button
                        onClick={handleOpenAdd}
                        className="mt-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 transition cursor-pointer shadow-md"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create First Record</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {rec.code}
                    </td>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">
                      {rec.title}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10.5px]">
                        {rec.category}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${
                        rec.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : rec.status === 'Pending'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rec.priority === 'High'
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          : rec.priority === 'Medium'
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {rec.priority}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300 font-medium">
                      {rec.assignedTo}
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400 truncate max-w-xs" title={rec.notes}>
                      {rec.notes || '—'}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(rec)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition cursor-pointer"
                          title="Edit Record"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(rec.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
                          title="Delete Record"
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

      {/* Record Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingRecord ? 'Edit Operational Record' : `New Record for ${displayTitle}`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Title / Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Facility Inspection & Linen Supply"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Ref Code</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={e => setFormCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Category</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={e => setFormPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Assigned</label>
                  <input
                    type="text"
                    value={formAssignedTo}
                    onChange={e => setFormAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Operational Notes / Details</label>
                <textarea
                  rows={3}
                  placeholder="Additional instructions or notes..."
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold shadow-md cursor-pointer"
                >
                  {editingRecord ? 'Save Changes' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
