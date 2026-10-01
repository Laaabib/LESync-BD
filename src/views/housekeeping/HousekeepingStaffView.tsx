import React, { useState, useEffect } from 'react';
import {
  Users, Search, Filter, Plus, Clock, MapPin, Phone,
  CheckCircle2, AlertTriangle, UserCheck, UserX, Edit2,
  Calendar, Shield, Award, Sparkles, X, Check
} from 'lucide-react';
import { housekeepingService } from '../../services/housekeepingService';
import { HousekeepingStaff } from '../../types/housekeeping';

export const HousekeepingStaffView: React.FC = () => {
  const [staff, setStaff] = useState<HousekeepingStaff[]>(housekeepingService.getState().staff);
  const [tasks, setTasks] = useState(housekeepingService.getState().tasks);
  const [searchQuery, setSearchQuery] = useState('');
  const [shiftFilter, setShiftFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');

  // Edit / Reassign Modal
  const [editStaff, setEditStaff] = useState<HousekeepingStaff | null>(null);
  const [editShift, setEditShift] = useState<HousekeepingStaff['shift']>('Morning');
  const [editFloor, setEditFloor] = useState<number | string>(1);
  const [editIsActive, setEditIsActive] = useState(true);

  // Add Staff Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<HousekeepingStaff['role']>('Attendant');
  const [newShift, setNewShift] = useState<HousekeepingStaff['shift']>('Morning');
  const [newFloor, setNewFloor] = useState<number | string>(1);
  const [newPhone, setNewPhone] = useState('+880 1711-');
  const [newEmployeeCode, setNewEmployeeCode] = useState(`EMP-HK-${Math.floor(100 + Math.random() * 900)}`);

  useEffect(() => {
    const unsub = housekeepingService.subscribe(s => {
      setStaff([...s.staff]);
      setTasks([...s.tasks]);
    });
    return unsub;
  }, []);

  const productivity = housekeepingService.calculateStaffProductivity();

  const handleToggleDuty = (staffId: string) => {
    housekeepingService.toggleStaffDuty(staffId);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStaff) return;

    housekeepingService.updateStaffRoster(editStaff.id, {
      shift: editShift,
      assignedFloor: editFloor,
      active: editIsActive
    });

    setEditStaff(null);
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    housekeepingService.addStaffMember({
      name: newName,
      role: newRole,
      shift: newShift,
      assignedFloor: newFloor,
      phone: newPhone,
      employeeCode: newEmployeeCode,
      active: true,
      currentActiveRoomsCount: 0
    });

    setIsAddModalOpen(false);
    setNewName('');
    setNewEmployeeCode(`EMP-HK-${Math.floor(100 + Math.random() * 900)}`);
  };

  // Filter staff
  const filteredStaff = staff.filter(s => {
    if (shiftFilter !== 'All' && s.shift !== shiftFilter) return false;
    if (roleFilter !== 'All' && s.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchCode = s.employeeCode.toLowerCase().includes(q);
      const matchPhone = s.phone.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchPhone) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-md">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-linear-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-base sm:text-lg font-bold text-white uppercase tracking-tight">
                Housekeeping Staff & Shift Roster
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                DUTY ROSTER
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Manage daily duty rosters, section floor allocations, active cleaning workload, and contact profiles.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-md shadow-blue-900/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Team Member</span>
          </button>
        </div>
      </div>

      {/* Shift Overview Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400">Total HK Workforce</span>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-1">{staff.length}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
          <span className="text-[11px] font-semibold text-emerald-400">On Duty Right Now</span>
          <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">
            {staff.filter(s => s.active).length}
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5">Active across floors & store</div>
        </div>

        <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/30">
          <span className="text-[11px] font-semibold text-blue-400">Morning Shift (07:00 - 15:30)</span>
          <div className="text-2xl font-bold font-mono text-blue-300 mt-1">
            {staff.filter(s => s.shift === 'Morning').length}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30">
          <span className="text-[11px] font-semibold text-purple-400">Evening / Night Coverage</span>
          <div className="text-2xl font-bold font-mono text-purple-300 mt-1">
            {staff.filter(s => s.shift === 'Evening' || s.shift === 'Night').length}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search staff name, code, phone..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <select
            value={shiftFilter}
            onChange={e => setShiftFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Shifts</option>
            <option value="Morning">Morning Shift</option>
            <option value="Evening">Evening Shift</option>
            <option value="Night">Night Shift</option>
            <option value="Custom">Custom / General</option>
          </select>
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Roles</option>
            <option value="Attendant">Attendants</option>
            <option value="Supervisor">Supervisors</option>
            <option value="Executive Housekeeper">Executive Housekeeper</option>
            <option value="Laundry Operator">Laundry Operator</option>
          </select>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map(member => {
          const prod = productivity.find(p => p.staff.id === member.id);
          const activeTasks = prod ? prod.pendingCount : 0;
          const completedTasks = prod ? prod.completedCount : 0;

          return (
            <div
              key={member.id}
              className={`p-4 rounded-2xl bg-slate-900/90 border transition-all ${
                member.active ? 'border-slate-800 hover:border-slate-700 shadow-lg' : 'border-slate-800/50 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-sm">
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm">{member.name}</h3>
                    <div className="text-[10.5px] font-mono text-slate-400">{member.employeeCode} • {member.role}</div>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  member.active
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {member.active ? 'On Duty' : 'Off Duty'}
                </span>
              </div>

              <div className="mt-3.5 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Shift:</span>
                  </span>
                  <span className="font-semibold text-slate-200">{member.shift} Shift</span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Section:</span>
                  </span>
                  <span className="font-semibold text-blue-400">
                    {typeof member.assignedFloor === 'number' ? `Floor ${member.assignedFloor}` : (member.assignedFloor || 'Floors 1-3')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400 flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>Phone:</span>
                  </span>
                  <span className="font-mono text-slate-200">{member.phone}</span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px]">
                  <div className="text-slate-400">
                    Active Tasks: <strong className="text-purple-400 font-mono">{activeTasks}</strong>
                  </div>
                  <div className="text-slate-400">
                    Completed Today: <strong className="text-emerald-400 font-mono">{completedTasks}</strong>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-3.5 pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => handleToggleDuty(member.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    member.active
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {member.active ? 'Clock Out' : 'Check In Duty'}
                </button>

                <button
                  onClick={() => {
                    setEditStaff(member);
                    setEditShift(member.shift);
                    setEditFloor(member.assignedFloor || 1);
                    setEditIsActive(member.active);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center space-x-1 transition-colors"
                  title="Edit Roster Allocation"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Roster</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Edit Staff Roster */}
      {editStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <form onSubmit={handleSaveEdit} className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-100">Update Duty Allocation</h3>
                <p className="text-xs text-slate-400">{editStaff.name} ({editStaff.role})</p>
              </div>
              <button type="button" onClick={() => setEditStaff(null)} className="p-1 text-slate-400 hover:text-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Shift Schedule:</label>
                <select
                  value={editShift}
                  onChange={e => setEditShift(e.target.value as HousekeepingStaff['shift'])}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="Morning">Morning (07:00 - 15:30)</option>
                  <option value="Evening">Evening (15:00 - 23:30)</option>
                  <option value="Night">Night (23:00 - 07:30)</option>
                  <option value="Custom">Custom / General</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Assigned Section / Floor:</label>
                <select
                  value={String(editFloor)}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === 'Public Area' || val === 'Laundry') {
                      setEditFloor(val);
                    } else {
                      setEditFloor(Number(val));
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="1">Floor 1 (Rooms 101 - 105)</option>
                  <option value="2">Floor 2 (Rooms 201 - 205)</option>
                  <option value="3">Floor 3 (Suites & Chalets 301 - 305)</option>
                  <option value="Public Area">Public Areas, Lobby & Banquet</option>
                  <option value="Laundry">Central Laundry & Linen Store</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={e => setEditIsActive(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                  />
                  <span className="font-bold text-slate-200">Staff is Currently On Duty</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditStaff(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-900/30"
              >
                Save Roster Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add New Team Member */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <form onSubmit={handleAddStaff} className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">Add Housekeeping Team Member</h3>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Staff Full Name:</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Morshedul Alam"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Role:</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as HousekeepingStaff['role'])}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  >
                    <option value="Attendant">Attendant</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Executive Housekeeper">Executive Housekeeper</option>
                    <option value="Laundry Operator">Laundry Operator</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Shift:</label>
                  <select
                    value={newShift}
                    onChange={e => setNewShift(e.target.value as HousekeepingStaff['shift'])}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                    <option value="Custom">Custom / General</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Employee Code:</label>
                  <input
                    type="text"
                    required
                    value={newEmployeeCode}
                    onChange={e => setNewEmployeeCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Phone Number:</label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Assigned Section / Floor:</label>
                <select
                  value={String(newFloor)}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === 'Public Area' || val === 'Laundry') {
                      setNewFloor(val);
                    } else {
                      setNewFloor(Number(val));
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                >
                  <option value="1">Floor 1</option>
                  <option value="2">Floor 2</option>
                  <option value="3">Floor 3</option>
                  <option value="Public Area">Public Area</option>
                  <option value="Laundry">Laundry & Store</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-900/30"
              >
                Enroll Staff Member
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
