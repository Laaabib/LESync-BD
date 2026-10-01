import React, { useState, useMemo } from 'react';
import {
  UtensilsCrossed, Plus, Search, Edit3, CheckCircle2, AlertTriangle,
  Monitor, Layers, DollarSign, Building2, Coffee, Wine, Sparkles, X, Check, Trash2
} from 'lucide-react';
import { rbacService } from '../../services/rbacService';
import { pmsService } from '../../services/pmsService';
import { OutletDef, DepartmentName } from '../../types/reportingAndRbac';

interface AdminOutletsTabProps {
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminOutletsTab: React.FC<AdminOutletsTabProps> = ({ onShowToast }) => {
  const [outlets, setOutlets] = useState<OutletDef[]>(() => rbacService.getOutlets());
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<OutletDef | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formType, setFormType] = useState<OutletDef['type']>('Restaurant');
  const [formDepartment, setFormDepartment] = useState<DepartmentName>('Restaurant');
  const [formRevenueGL, setFormRevenueGL] = useState('4020 - Food & Beverage Revenue');
  const [formTerminals, setFormTerminals] = useState<number>(2);
  const [formActive, setFormActive] = useState(true);

  const departments = useMemo(() => rbacService.getDepartments(), []);

  const reloadData = () => {
    setOutlets([...rbacService.getOutlets()]);
  };

  const filteredOutlets = useMemo(() => {
    return outlets.filter(o => {
      const matchSearch =
        o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.revenueGL.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = typeFilter === 'all' || o.type === typeFilter;
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && o.active) ||
        (statusFilter === 'inactive' && !o.active);
      return matchSearch && matchType && matchStatus;
    });
  }, [outlets, searchTerm, typeFilter, statusFilter]);

  const totalTerminals = useMemo(() => {
    return outlets.reduce((acc, o) => acc + (o.posTerminalCount || 0), 0);
  }, [outlets]);

  const diningCount = useMemo(() => {
    return outlets.filter(o => o.type === 'Restaurant' || o.type === 'Bar').length;
  }, [outlets]);

  const banquetCount = useMemo(() => {
    return outlets.filter(o => o.type === 'Banquet').length;
  }, [outlets]);

  const handleOpenCreate = () => {
    setEditingOutlet(null);
    setFormName('');
    setFormCode(`OUT-${(outlets.length + 1).toString().padStart(2, '0')}`);
    setFormType('Restaurant');
    setFormDepartment('Restaurant');
    setFormRevenueGL('4020 - Food & Beverage Revenue');
    setFormTerminals(2);
    setFormActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (outlet: OutletDef) => {
    setEditingOutlet(outlet);
    setFormName(outlet.name);
    setFormCode(outlet.code);
    setFormType(outlet.type);
    setFormDepartment(outlet.department);
    setFormRevenueGL(outlet.revenueGL);
    setFormTerminals(outlet.posTerminalCount);
    setFormActive(outlet.active);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) return;

    if (editingOutlet) {
      const updated: OutletDef = {
        ...editingOutlet,
        name: formName.trim(),
        code: formCode.trim().toUpperCase(),
        type: formType,
        department: formDepartment,
        revenueGL: formRevenueGL.trim(),
        posTerminalCount: Number(formTerminals) || 1,
        active: formActive
      };
      rbacService.updateOutlet(updated);
      pmsService.logAudit('Updated Outlet', 'Settings', editingOutlet.id, undefined, `Updated outlet ${updated.name} (${updated.code})`);
      onShowToast?.(`Outlet "${updated.name}" updated successfully.`, 'success');
    } else {
      const created = rbacService.addOutlet({
        name: formName.trim(),
        code: formCode.trim().toUpperCase(),
        type: formType,
        department: formDepartment,
        revenueGL: formRevenueGL.trim(),
        posTerminalCount: Number(formTerminals) || 1,
        active: formActive
      });
      pmsService.logAudit('Created Outlet', 'Settings', created.id, undefined, `Created outlet ${created.name} (${created.code})`);
      onShowToast?.(`Outlet "${created.name}" created successfully.`, 'success');
    }

    reloadData();
    setIsModalOpen(false);
  };

  const handleToggleActive = (outlet: OutletDef) => {
    const updated: OutletDef = { ...outlet, active: !outlet.active };
    rbacService.updateOutlet(updated);
    pmsService.logAudit('Toggled Outlet Status', 'Settings', outlet.id, undefined, `Outlet ${outlet.name} active=${updated.active}`);
    reloadData();
    onShowToast?.(`Outlet "${outlet.name}" marked as ${updated.active ? 'Active' : 'Inactive'}.`, 'info');
  };

  const handleDelete = (outlet: OutletDef) => {
    if (confirm(`Are you sure you want to permanently delete outlet "${outlet.name}" (${outlet.code})?`)) {
      const ok = rbacService.deleteOutlet(outlet.id);
      if (ok) {
        reloadData();
        onShowToast?.(`Outlet "${outlet.name}" deleted successfully.`, 'success');
      } else {
        onShowToast?.(`Failed to delete outlet "${outlet.name}".`, 'error');
      }
    }
  };

  const getGlSuggested = (type: OutletDef['type']) => {
    switch (type) {
      case 'Restaurant': return '4020 - Food & Beverage Revenue';
      case 'Bar': return '4025 - Beverage & Bar Sales';
      case 'Banquet': return '4030 - Banquet & Event Rental';
      case 'Spa': return '4045 - Spa & Wellness Revenue';
      case 'Recreation': return '4040 - Recreation & Sports Revenue';
      case 'Front Desk': return '1040 - Guest Ledger Clearing';
      default: return '4020 - Food & Beverage Revenue';
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Overview Banner & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 block uppercase tracking-wider">Total Revenue Outlets</span>
            <span className="text-xl font-extrabold text-gray-900 mt-0.5 block">{outlets.length} Stations</span>
          </div>
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 block uppercase tracking-wider">Dining & Bars</span>
            <span className="text-xl font-extrabold text-orange-600 mt-0.5 block">{diningCount} Outlets</span>
          </div>
          <div className="p-2 bg-orange-50 text-orange-600 rounded-lg border border-orange-100">
            <Coffee className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 block uppercase tracking-wider">Banquet Halls</span>
            <span className="text-xl font-extrabold text-purple-600 mt-0.5 block">{banquetCount} Venues</span>
          </div>
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg border border-purple-100">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 block uppercase tracking-wider">POS Terminals</span>
            <span className="text-xl font-extrabold text-blue-600 mt-0.5 block">{totalTerminals} POS Devices</span>
          </div>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
            <Monitor className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search outlet by name, station code, GL account, or department..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <div className="flex items-center space-x-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-[11px]">
              {(['all', 'active', 'inactive'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded font-bold capitalize transition ${
                    statusFilter === st ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <button
              onClick={handleOpenCreate}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition shadow-xs text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Outlet</span>
            </button>
          </div>
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-[11px] font-bold text-gray-400 shrink-0">Outlet Type:</span>
          {['all', 'Restaurant', 'Bar', 'Banquet', 'Spa', 'Recreation', 'Front Desk'].map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-2.5 py-1 rounded-full font-bold text-[10px] whitespace-nowrap transition border ${
                typeFilter === type
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {type === 'all' ? `All Types (${outlets.length})` : type}
            </button>
          ))}
        </div>
      </div>

      {/* Outlets Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3">Outlet Code</th>
                <th className="p-3">Outlet / Station Name</th>
                <th className="p-3">Type</th>
                <th className="p-3">Linked Department</th>
                <th className="p-3">Revenue GL Account Mapping</th>
                <th className="p-3 text-center">POS Terminals</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOutlets.map(outlet => (
                <tr key={outlet.id} className="hover:bg-amber-50/20 transition-colors">
                  <td className="p-3">
                    <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                      {outlet.code}
                    </span>
                  </td>

                  <td className="p-3">
                    <div className="font-bold text-gray-900 text-xs flex items-center space-x-1.5">
                      {outlet.type === 'Restaurant' && <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                      {outlet.type === 'Bar' && <Wine className="w-3.5 h-3.5 text-orange-600 shrink-0" />}
                      {outlet.type === 'Banquet' && <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                      {outlet.type === 'Spa' && <Coffee className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                      {outlet.type === 'Recreation' && <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                      {outlet.type === 'Front Desk' && <Building2 className="w-3.5 h-3.5 text-gray-600 shrink-0" />}
                      <span>{outlet.name}</span>
                    </div>
                  </td>

                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] border ${
                      outlet.type === 'Restaurant' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      outlet.type === 'Bar' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      outlet.type === 'Banquet' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      outlet.type === 'Spa' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                      outlet.type === 'Recreation' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-gray-100 text-gray-700 border-gray-200'
                    }`}>
                      {outlet.type}
                    </span>
                  </td>

                  <td className="p-3 text-gray-700 font-medium">
                    {outlet.department}
                  </td>

                  <td className="p-3">
                    <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex items-center space-x-1 inline-flex">
                      <DollarSign className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{outlet.revenueGL}</span>
                    </span>
                  </td>

                  <td className="p-3 text-center">
                    <span className="font-mono font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 flex items-center space-x-1 inline-flex justify-center">
                      <Monitor className="w-3 h-3 text-gray-500" />
                      <span>{outlet.posTerminalCount || 1}</span>
                    </span>
                  </td>

                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(outlet)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                        outlet.active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      {outlet.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>

                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => handleOpenEdit(outlet)}
                        className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        title="Edit Outlet Configuration"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(outlet)}
                        className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Outlet"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOutlets.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="font-bold text-gray-600">No outlets found</p>
                    <p className="text-xs text-gray-400">Adjust your filter options or create a new outlet</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Outlet Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-2">
                <UtensilsCrossed className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-gray-900 text-sm uppercase">
                  {editingOutlet ? `Edit Outlet (${editingOutlet.code})` : 'Register Resort Outlet / Restaurant'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-3.5">
              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1">Outlet / Station Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Padma Multi-Cuisine Restaurant / Sunset Bar"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold text-xs mb-1">Outlet Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OUT-01"
                    value={formCode}
                    onChange={e => setFormCode(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold text-xs mb-1">Outlet Type *</label>
                  <select
                    value={formType}
                    onChange={e => {
                      const t = e.target.value as OutletDef['type'];
                      setFormType(t);
                      setFormRevenueGL(getGlSuggested(t));
                    }}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium"
                  >
                    <option value="Restaurant">Restaurant (Dine-In)</option>
                    <option value="Bar">Bar & Lounge</option>
                    <option value="Banquet">Banquet & Convention</option>
                    <option value="Spa">Spa & Wellness</option>
                    <option value="Recreation">Recreation & Sports</option>
                    <option value="Front Desk">Front Desk Cashier</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold text-xs mb-1">Linked Department</label>
                  <select
                    value={formDepartment}
                    onChange={e => setFormDepartment(e.target.value as DepartmentName)}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold text-xs mb-1">POS Terminals In Station</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formTerminals}
                    onChange={e => setFormTerminals(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1">General Ledger Revenue Account</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 4020 - Food & Beverage Revenue"
                  value={formRevenueGL}
                  onChange={e => setFormRevenueGL(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono"
                />
                <span className="text-[11px] text-gray-500 mt-0.5 block">
                  All cashier bills settled at this outlet will post credit entries to this GL account automatically.
                </span>
              </div>

              <div className="flex items-center pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={e => setFormActive(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span className="font-bold text-gray-700 text-xs">Active Operational Station (Accepts Orders)</span>
                </label>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-bold text-xs hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold text-xs shadow-xs transition"
                >
                  {editingOutlet ? 'Update Outlet' : 'Register Outlet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
