import React, { useState, useMemo } from 'react';
import {
  Building2, Plus, Search, Edit3, CheckCircle2, AlertTriangle,
  Mail, Phone, Users, ShieldCheck, X, Check, Filter, Layers, DollarSign, Trash2
} from 'lucide-react';
import { rbacService } from '../../services/rbacService';
import { pmsService } from '../../services/pmsService';
import { DepartmentDef, DepartmentName } from '../../types/reportingAndRbac';

interface AdminDepartmentsTabProps {
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminDepartmentsTab: React.FC<AdminDepartmentsTabProps> = ({ onShowToast }) => {
  const [departments, setDepartments] = useState<DepartmentDef[]>(() => rbacService.getDepartments());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentDef | null>(null);

  // Form State
  const [formName, setFormName] = useState<string>('Front Office');
  const [formCode, setFormCode] = useState('');
  const [formCostCenter, setFormCostCenter] = useState('');
  const [formHeadName, setFormHeadName] = useState('');
  const [formHeadEmail, setFormHeadEmail] = useState('');
  const [formStaffCount, setFormStaffCount] = useState<number>(10);
  const [formActive, setFormActive] = useState(true);

  const reloadData = () => {
    setDepartments([...rbacService.getDepartments()]);
  };

  const filteredDepartments = useMemo(() => {
    return departments.filter(d => {
      const matchSearch =
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.headName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.costCenterCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && d.active) ||
        (statusFilter === 'inactive' && !d.active);
      return matchSearch && matchStatus;
    });
  }, [departments, searchTerm, statusFilter]);

  const totalStaff = useMemo(() => {
    return departments.reduce((acc, d) => acc + (d.staffCount || 0), 0);
  }, [departments]);

  const activeCount = useMemo(() => {
    return departments.filter(d => d.active).length;
  }, [departments]);

  const handleOpenCreate = () => {
    setEditingDept(null);
    setFormName('Front Office');
    setFormCode(`CC-${Date.now().toString().slice(-3)}`);
    setFormCostCenter(`CC-${Date.now().toString().slice(-3)}`);
    setFormHeadName('');
    setFormHeadEmail('');
    setFormStaffCount(10);
    setFormActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept: DepartmentDef) => {
    setEditingDept(dept);
    setFormName(dept.name);
    setFormCode(dept.code);
    setFormCostCenter(dept.costCenterCode);
    setFormHeadName(dept.headName);
    setFormHeadEmail(dept.headEmail);
    setFormStaffCount(dept.staffCount);
    setFormActive(dept.active);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) return;

    if (editingDept) {
      const updated: DepartmentDef = {
        ...editingDept,
        name: formName as DepartmentName,
        code: formCode.trim().toUpperCase(),
        costCenterCode: formCostCenter.trim().toUpperCase() || formCode.trim().toUpperCase(),
        headName: formHeadName.trim(),
        headEmail: formHeadEmail.trim(),
        staffCount: Number(formStaffCount) || 0,
        active: formActive
      };
      rbacService.updateDepartment(updated);
      pmsService.logAudit('Updated Department', 'Settings', editingDept.id, undefined, `Updated department ${updated.name} (${updated.code})`);
      onShowToast?.(`Department "${updated.name}" updated successfully.`, 'success');
    } else {
      const created = rbacService.addDepartment({
        name: formName as DepartmentName,
        code: formCode.trim().toUpperCase(),
        costCenterCode: formCostCenter.trim().toUpperCase() || formCode.trim().toUpperCase(),
        headName: formHeadName.trim(),
        headEmail: formHeadEmail.trim(),
        staffCount: Number(formStaffCount) || 0,
        active: formActive
      });
      pmsService.logAudit('Created Department', 'Settings', created.id, undefined, `Created department ${created.name} (${created.code})`);
      onShowToast?.(`Department "${created.name}" created successfully.`, 'success');
    }

    reloadData();
    setIsModalOpen(false);
  };

  const handleToggleActive = (dept: DepartmentDef) => {
    const updated: DepartmentDef = { ...dept, active: !dept.active };
    rbacService.updateDepartment(updated);
    pmsService.logAudit('Toggled Department Status', 'Settings', dept.id, undefined, `Department ${dept.name} active=${updated.active}`);
    reloadData();
    onShowToast?.(`Department "${dept.name}" marked as ${updated.active ? 'Active' : 'Inactive'}.`, 'info');
  };

  const handleDelete = (dept: DepartmentDef) => {
    if (confirm(`Are you sure you want to permanently delete department "${dept.name}"?`)) {
      const ok = rbacService.deleteDepartment(dept.id);
      if (ok) {
        reloadData();
        onShowToast?.(`Department "${dept.name}" deleted successfully.`, 'success');
      } else {
        onShowToast?.(`Failed to delete department "${dept.name}".`, 'error');
      }
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Overview Banner & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 block uppercase tracking-wider">Total Departments</span>
            <span className="text-xl font-extrabold text-gray-900 mt-0.5 block">{departments.length}</span>
          </div>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 block uppercase tracking-wider">Active Cost Centers</span>
            <span className="text-xl font-extrabold text-emerald-600 mt-0.5 block">{activeCount} / {departments.length}</span>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 block uppercase tracking-wider">Assigned Staff</span>
            <span className="text-xl font-extrabold text-indigo-600 mt-0.5 block">{totalStaff} Personnel</span>
          </div>
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 block uppercase tracking-wider">Cost Center Architecture</span>
            <span className="text-xs font-bold text-amber-600 mt-1 block">CC-100 to CC-900</span>
          </div>
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search department by name, cost center code, or department head..."
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
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition shadow-xs text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        </div>
      </div>

      {/* Departments Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3">Cost Center & Code</th>
                <th className="p-3">Department Name</th>
                <th className="p-3">Department Head</th>
                <th className="p-3">Official Email</th>
                <th className="p-3 text-center">Staff Count</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDepartments.map(dept => (
                <tr key={dept.id} className="hover:bg-blue-50/20 transition-colors">
                  <td className="p-3">
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                      {dept.costCenterCode || dept.code}
                    </span>
                  </td>

                  <td className="p-3">
                    <div className="font-bold text-gray-900 text-xs flex items-center space-x-1.5">
                      <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{dept.name}</span>
                    </div>
                  </td>

                  <td className="p-3 text-gray-800 font-medium">
                    {dept.headName || 'Not Assigned'}
                  </td>

                  <td className="p-3">
                    {dept.headEmail ? (
                      <span className="text-gray-500 font-mono text-[11px] flex items-center space-x-1">
                        <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                        <span>{dept.headEmail}</span>
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">None</span>
                    )}
                  </td>

                  <td className="p-3 text-center">
                    <span className="font-mono font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                      {dept.staffCount || 0}
                    </span>
                  </td>

                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(dept)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                        dept.active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      {dept.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>

                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => handleOpenEdit(dept)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit Department"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(dept)}
                        className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Department"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDepartments.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="font-bold text-gray-600">No departments found</p>
                    <p className="text-xs text-gray-400">Adjust your search query or add a new department</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Department Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-sm uppercase">
                  {editingDept ? `Edit Department (${editingDept.code})` : 'Create Hospitality Department'}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold text-xs mb-1">Department Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Front Office / Culinary"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold text-xs mb-1">Cost Center Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CC-101"
                    value={formCode}
                    onChange={e => {
                      setFormCode(e.target.value);
                      setFormCostCenter(e.target.value);
                    }}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold text-xs mb-1">Department Head</label>
                  <input
                    type="text"
                    placeholder="e.g. Shamima Akter"
                    value={formHeadName}
                    onChange={e => setFormHeadName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold text-xs mb-1">Head Contact Email</label>
                  <input
                    type="email"
                    placeholder="e.g. fom@cculbresort.com"
                    value={formHeadEmail}
                    onChange={e => setFormHeadEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold text-xs mb-1">Authorized Staff Count</label>
                  <input
                    type="number"
                    min="0"
                    value={formStaffCount}
                    onChange={e => setFormStaffCount(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={e => setFormActive(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-bold text-gray-700 text-xs">Active Operational Status</span>
                  </label>
                </div>
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition"
                >
                  {editingDept ? 'Update Department' : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
