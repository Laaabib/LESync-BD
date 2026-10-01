import React, { useState, useEffect } from 'react';
import {
  Users, Building, CalendarCheck, Clock, CheckCircle2,
  AlertCircle, Plus, Search, Filter, Mail, Phone, Shield,
  Calendar, Check, X, UserCheck, Briefcase, Award, FileText,
  Printer, Download, ArrowUpRight, CheckSquare, XCircle,
  FileCheck, DollarSign, UserPlus, Eye, Edit3, UserX,
  Fingerprint, ScanFace, Radio, RefreshCw, Network, ArrowUpCircle, ArrowDownCircle
} from 'lucide-react';
import { Employee, DepartmentSummary, AttendanceRecord, LeaveRequest } from '../types/hrTypes';
import { hrService } from '../services/hrService';
import { hrPdfService } from '../services/hrPdfService';
import { biometricService } from '../services/biometricService';
import { EmployeeModal } from '../components/hr/EmployeeModal';
import { ApplyLeaveModal } from '../components/hr/ApplyLeaveModal';
import { LeaveFormPreviewModal } from '../components/hr/LeaveFormPreviewModal';
import { BiometricDevicesManager } from '../components/hr/BiometricDevicesManager';
import { rbacService } from '../services/rbacService';

interface HumanResourcesProps {
  initialTab?: 'employees' | 'departments' | 'attendance' | 'biometric' | 'leave' | 'reports' | string;
  onNavigate?: (route: string) => void;
}

export const HumanResourcesView: React.FC<HumanResourcesProps> = ({
  initialTab = 'employees',
  onNavigate
}) => {
  const validTabs = ['employees', 'departments', 'attendance', 'biometric', 'leave', 'reports'];
  const sanitizedInitial = validTabs.includes(initialTab) ? initialTab : 'employees';

  const [activeTab, setActiveTab] = useState<string>(sanitizedInitial);

  // Sync tab when navigation route prop changes
  useEffect(() => {
    if (initialTab && validTabs.includes(initialTab)) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Data state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');

  // Modals state
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeModalMode, setEmployeeModalMode] = useState<'view' | 'edit' | 'add' | null>(null);

  const [showApplyLeaveModal, setShowApplyLeaveModal] = useState(false);
  const [applyLeaveDefaultEmpId, setApplyLeaveDefaultEmpId] = useState<string | undefined>(undefined);

  const [previewLeave, setPreviewLeave] = useState<LeaveRequest | null>(null);

  // Quick punch modal
  const [showPunchModal, setShowPunchModal] = useState(false);
  const [punchEmpId, setPunchEmpId] = useState('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load data on mount
  const refreshData = () => {
    setEmployees(hrService.getEmployees());
    setLeaves(hrService.getLeaves());
    setAttendance(hrService.getAttendance());
    setDepartments(hrService.getDepartments());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const departmentNames = departments.map(d => d.name);
  const availableRoles = rbacService.getRoles().map(r => ({ id: r.id, name: r.name }));

  // Leave Actions
  const handleApproveLeave = (id: string) => {
    const updated = hrService.approveLeave(id);
    if (updated) {
      setLeaves(hrService.getLeaves());
      setEmployees(hrService.getEmployees());
      showToast(`Leave application ${id} approved successfully.`);
    }
  };

  const handleRejectLeave = (id: string) => {
    const reason = prompt('Please specify the operational reason for rejection:');
    if (reason === null) return; // cancelled
    const updated = hrService.rejectLeave(id, 'Afroza Sultana (HR Manager)', reason || 'Operational shift requirements');
    if (updated) {
      setLeaves(hrService.getLeaves());
      showToast(`Leave application ${id} marked as rejected.`);
    }
  };

  const handleDownloadLeavePDF = (leave: LeaveRequest) => {
    const emp = employees.find(e => e.id === leave.employeeId);
    hrPdfService.generateLeaveFormPDF(leave, emp);
    showToast(`Leave Form ${leave.id} downloaded as vector PDF.`);
  };

  // Attendance Punch
  const handleRecordPunch = () => {
    if (!punchEmpId) return;
    const rec = hrService.recordPunchIn(punchEmpId);
    if (rec) {
      setAttendance(hrService.getAttendance());
      showToast(`Biometric punch in recorded for ${rec.name} (${rec.inTime}).`);
      setShowPunchModal(false);
      setPunchEmpId('');
    }
  };

  const handleSyncAllBiometricPunches = async () => {
    showToast('Polling ZKTeco biometric terminals over TCP/IP...');
    try {
      const res = await biometricService.syncAttendanceLogs();
      if (res.success) {
        refreshData();
        showToast(res.message);
      } else {
        showToast(res.message);
      }
    } catch (e: any) {
      showToast(`Biometric sync failed: ${e.message}`);
    }
  };

  const handlePushSingleEmployee = async (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;
    showToast(`Transmitting profile for ${emp.name} to ZKTeco hardware memory...`);
    try {
      const res = await biometricService.pushEmployeeToDevice(employeeId);
      if (res.success) {
        refreshData();
        showToast(res.message);
      } else {
        showToast(res.message);
      }
    } catch (e: any) {
      showToast(`Push failed: ${e.message}`);
    }
  };

  // Filtered employees
  const filteredEmployees = employees.filter(emp => {
    const matchSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = selectedDeptFilter === 'All' || emp.department === selectedDeptFilter;
    const matchStatus = selectedStatusFilter === 'All' || emp.status === selectedStatusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  // KPI Calculations
  const totalEmployeesCount = employees.length;
  const activeStaffCount = employees.filter(e => e.status === 'Active').length;
  const onLeaveCount = employees.filter(e => e.status === 'On Leave' || leaves.some(l => l.employeeId === e.id && l.status === 'Approved')).length;
  const pendingLeaveCount = leaves.filter(l => l.status === 'Pending Approval').length;

  return (
    <div className="space-y-4 text-xs text-slate-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2.5 transition-all">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center border border-amber-500/30 shadow-inner">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-100">Human Resources & Staff Management</h1>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px]">
                LESync PMS
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Employee profiles, departmental rosters, biometric attendance, and official PDF leave application clearances.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setApplyLeaveDefaultEmpId(undefined);
              setShowApplyLeaveModal(true);
            }}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg transition-colors border border-slate-700 text-xs"
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Apply Leave</span>
          </button>
          <button
            onClick={() => {
              setSelectedEmployee(null);
              setEmployeeModalMode('add');
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors shadow text-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Metric Counters Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-[11px] block">Total Staff</span>
            <strong className="text-base font-bold text-slate-100">{totalEmployeesCount} Employees</strong>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-[11px] block">Active Duty Staff</span>
            <strong className="text-base font-bold text-emerald-400">{activeStaffCount} On Duty</strong>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-[11px] block">Pending Leave Approvals</span>
            <strong className="text-base font-bold text-amber-400">{pendingLeaveCount} Requests</strong>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <CalendarCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-[11px] block">Departments</span>
            <strong className="text-base font-bold text-slate-100">{departments.length} Operational Units</strong>
          </div>
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Building className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex space-x-1 bg-slate-900 border border-slate-800 p-1.5 rounded-xl overflow-x-auto">
        {[
          { id: 'employees', label: 'Staff Directory & Roles', icon: Users },
          { id: 'departments', label: 'Departments & Org Chart', icon: Building },
          { id: 'attendance', label: 'Biometric Shift Attendance', icon: Clock },
          { id: 'biometric', label: 'Biometric Devices (ZKTeco IP Sync)', icon: Fingerprint },
          { id: 'leave', label: 'Leave & Absence (PDF Forms)', icon: CalendarCheck },
          { id: 'reports', label: 'HR Executive Reports (Official PDF)', icon: FileText }
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
                activeTab === t.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================
          TAB 1: STAFF DIRECTORY & EMPLOYEE MANAGEMENT
          ======================================================== */}
      {activeTab === 'employees' && (
        <div className="space-y-3">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search staff by name, ID, designation..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 w-64 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Department Filter */}
              <div className="flex items-center space-x-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1">
                <Filter className="w-3 h-3 text-slate-400" />
                <select
                  value={selectedDeptFilter}
                  onChange={e => setSelectedDeptFilter(e.target.value)}
                  className="bg-transparent text-slate-200 text-xs focus:outline-none"
                >
                  <option value="All">All Departments</option>
                  {departmentNames.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1">
                <span className="text-[10px] text-slate-400">Status:</span>
                <select
                  value={selectedStatusFilter}
                  onChange={e => setSelectedStatusFilter(e.target.value)}
                  className="bg-transparent text-slate-200 text-xs focus:outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-[11px] text-slate-400">
              <span>Showing: <strong className="text-slate-100">{filteredEmployees.length}</strong> of {employees.length} Staff</span>
            </div>
          </div>

          {/* Employee Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredEmployees.map(emp => (
              <div
                key={emp.id}
                className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between hover:border-slate-700 transition-colors shadow-sm relative group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <img
                        src={emp.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60'}
                        alt={emp.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <h3 className="font-bold text-slate-100 text-xs truncate">{emp.name}</h3>
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
                            {emp.employeeCode}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-400 font-medium truncate mt-0.5">{emp.designation}</p>
                        <p className="text-[10px] text-slate-400">{emp.department}</p>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      emp.status === 'Active' ? 'bg-emerald-500/20 text-emerald-300' :
                      emp.status === 'On Leave' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-rose-500/20 text-rose-300'
                    }`}>
                      {emp.status}
                    </span>
                  </div>

                  {/* Metadata Chips */}
                  <div className="mt-3 grid grid-cols-2 gap-2 bg-slate-950/60 p-2 rounded-lg text-[11px] border border-slate-800/60">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Shift:</span>
                      <span className="text-slate-300 font-medium">{emp.shift} ({emp.shiftTimings?.split(' ')[0]})</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Gross Salary:</span>
                      <span className="text-emerald-400 font-mono font-bold">৳{(emp.salary || 0).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Mobile:</span>
                      <span className="text-slate-300 font-mono truncate">{emp.phone}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Leave Bal:</span>
                      <span className="text-amber-300 font-mono font-semibold">{emp.leaveBalance?.annual ?? 14}d Left</span>
                    </div>
                  </div>

                  {/* Biometric Terminal Enrollment Badge */}
                  <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                      <Fingerprint className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Biometric Terminal:</span>
                    </span>
                    {emp.biometricEnrollment?.isEnrolled ? (
                      <span className="text-emerald-300 font-mono font-bold flex items-center gap-1 text-[10px] bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                        <Check className="w-2.5 h-2.5 text-emerald-400" />
                        UID: #{emp.biometricEnrollment.deviceUserId} (Enrolled)
                      </span>
                    ) : (
                      <button
                        onClick={() => handlePushSingleEmployee(emp.id)}
                        className="text-purple-400 hover:text-purple-300 font-bold text-[10px] bg-purple-500/10 hover:bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/30 flex items-center gap-1 cursor-pointer transition"
                        title="Push employee profile to biometric devices"
                      >
                        <ArrowUpCircle className="w-2.5 h-2.5" />
                        <span>Push to Device</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setApplyLeaveDefaultEmpId(emp.id);
                      setShowApplyLeaveModal(true);
                    }}
                    className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-amber-400 font-medium transition-colors"
                    title="Apply leave for this employee"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Apply Leave</span>
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setSelectedEmployee(emp);
                        setEmployeeModalMode('view');
                      }}
                      className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold text-[11px] transition-colors border border-slate-700"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedEmployee(emp);
                        setEmployeeModalMode('edit');
                      }}
                      className="p-1 bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 rounded border border-slate-700 transition-colors"
                      title="Edit employee details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredEmployees.length === 0 && (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <Users className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="font-semibold text-slate-300">No staff members match the current filter.</p>
              <p className="text-slate-500 text-xs">Try resetting your search query or department filter.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 2: DEPARTMENTS & ORG CHART
          ======================================================== */}
      {activeTab === 'departments' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {departments.map(d => {
              const deptStaff = employees.filter(e => e.department === d.name);
              return (
                <div key={d.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                        <Building className="w-4 h-4 text-amber-400" />
                        <span>{d.name}</span>
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400">Code: {d.code}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold text-[10px]">
                      {deptStaff.length || d.staffCount} Staff Members
                    </span>
                  </div>

                  <div className="space-y-1.5 bg-slate-950 p-2.5 rounded-lg text-[11px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Head of Department:</span>
                      <strong className="text-slate-200">{d.head}</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Head Email:</span>
                      <span className="text-slate-400 font-mono text-[10px]">{d.headEmail}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Monthly Payroll Budget:</span>
                      <strong className="text-emerald-400 font-mono">৳{(d.budget || 0).toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Operational Shifts:</span>
                      <span className="text-slate-300">{d.shifts}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Department Location:</span>
                      <span className="text-slate-300">{d.location}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: BIOMETRIC SHIFT ATTENDANCE
          ======================================================== */}
      {activeTab === 'attendance' && (
        <div className="space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-slate-200 text-xs">Today's Biometric Shift Attendance Log</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                  Cloud Terminal Active (Online)
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSyncAllBiometricPunches}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow transition cursor-pointer"
                  title="Poll connected ZKTeco biometric terminals over TCP/IP and import latest punches"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync ZKTeco Devices</span>
                </button>
                <button
                  onClick={() => setActiveTab('biometric')}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                  title="Manage IP biometric terminals and ZKTeco hardware"
                >
                  <Fingerprint className="w-3.5 h-3.5 text-amber-400" />
                  <span>Fleet ({biometricService.getDevices().length})</span>
                </button>
                <button
                  onClick={() => setShowPunchModal(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Manual Punch In</span>
                </button>
                <button
                  onClick={() => {
                    hrPdfService.generateAttendanceReportPDF(attendance);
                    showToast('Biometric attendance audit downloaded as PDF.');
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold shadow"
                  title="Download Attendance PDF report (Strictly PDF, No CSV/Excel)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Attendance PDF</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-3 py-2.5 font-bold">Staff ID</th>
                    <th className="px-3 py-2.5 font-bold">Employee Name</th>
                    <th className="px-3 py-2.5 font-bold">Department</th>
                    <th className="px-3 py-2.5 font-bold">Assigned Shift</th>
                    <th className="px-3 py-2.5 font-bold font-mono">Punch In</th>
                    <th className="px-3 py-2.5 font-bold font-mono">Punch Out</th>
                    <th className="px-3 py-2.5 font-bold">Terminal ID</th>
                    <th className="px-3 py-2.5 font-bold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {attendance.map(att => (
                    <tr key={att.id} className="hover:bg-slate-800/40">
                      <td className="px-3 py-2.5 font-mono text-slate-400 text-[11px]">{att.employeeCode || 'EMP-1001'}</td>
                      <td className="px-3 py-2.5 font-bold text-slate-100">{att.name}</td>
                      <td className="px-3 py-2.5 text-slate-300">{att.dept}</td>
                      <td className="px-3 py-2.5 text-slate-400">{att.shift}</td>
                      <td className="px-3 py-2.5 font-mono text-emerald-400 font-semibold">{att.inTime}</td>
                      <td className="px-3 py-2.5 font-mono text-slate-400">{att.outTime}</td>
                      <td className="px-3 py-2.5 text-slate-400 text-[10px]">{att.terminal}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          att.status === 'On Time' ? 'bg-emerald-500/20 text-emerald-300' :
                          att.status === 'Slight Delay' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-rose-500/20 text-rose-300'
                        }`}>
                          {att.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3.5: BIOMETRIC HARDWARE & ZKTECO IP SYNC CONTROLLER
          ======================================================== */}
      {activeTab === 'biometric' && (
        <BiometricDevicesManager onRefreshParentAttendance={refreshData} />
      )}

      {/* ========================================================
          TAB 4: LEAVE & ABSENCE MANAGEMENT (WITH PDF GENERATION)
          ======================================================== */}
      {activeTab === 'leave' && (
        <div className="space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
            <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-bold text-slate-100 text-xs block">Employee Leave Requests & Clearances</span>
                <span className="text-[11px] text-slate-400">
                  Each leave record can be generated and downloaded as a formal printable PDF form.
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    hrPdfService.generateLeaveSummaryPDF(leaves);
                    showToast('Comprehensive HR Leave Register downloaded as PDF.');
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-semibold text-xs"
                  title="Download all leave records as official PDF register (Strictly PDF, No CSV/Excel)"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Export Leave Register (PDF)</span>
                </button>
                <button
                  onClick={() => {
                    setApplyLeaveDefaultEmpId(undefined);
                    setShowApplyLeaveModal(true);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold text-xs shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Apply New Leave</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-3 py-2.5 font-bold">Ref No</th>
                    <th className="px-3 py-2.5 font-bold">Employee</th>
                    <th className="px-3 py-2.5 font-bold">Department</th>
                    <th className="px-3 py-2.5 font-bold">Leave Type</th>
                    <th className="px-3 py-2.5 font-bold">Duration & Dates</th>
                    <th className="px-3 py-2.5 font-bold">Reason</th>
                    <th className="px-3 py-2.5 font-bold">Reliever</th>
                    <th className="px-3 py-2.5 font-bold text-center">Status</th>
                    <th className="px-3 py-2.5 font-bold text-right">Actions & PDF Form</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {leaves.map(lv => (
                    <tr key={lv.id} className="hover:bg-slate-800/40">
                      <td className="px-3 py-2.5 font-mono text-slate-400 text-[11px]">{lv.id}</td>
                      <td className="px-3 py-2.5 font-bold text-slate-100">
                        <div>{lv.employeeName}</div>
                        <span className="text-[10px] text-slate-400 font-mono">{lv.employeeCode}</span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-300">{lv.department}</td>
                      <td className="px-3 py-2.5 font-semibold text-amber-400">{lv.leaveType}</td>
                      <td className="px-3 py-2.5 font-mono text-slate-300 text-[11px]">
                        <strong>{lv.days} Days</strong>
                        <div className="text-[10px] text-slate-400">{lv.fromDate} to {lv.toDate}</div>
                      </td>
                      <td className="px-3 py-2.5 text-slate-300 max-w-xs truncate" title={lv.reason}>
                        {lv.reason}
                      </td>
                      <td className="px-3 py-2.5 text-slate-400 text-[11px]">{lv.relieverName || 'Duty Senior'}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          lv.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-300' :
                          lv.status === 'Rejected' ? 'bg-rose-500/20 text-rose-300' :
                          'bg-amber-500/20 text-amber-300'
                        }`}>
                          {lv.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {lv.status === 'Pending Approval' && (
                            <>
                              <button
                                onClick={() => handleApproveLeave(lv.id)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[10px] shadow transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectLeave(lv.id)}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold text-[10px] shadow transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {/* Print / View Form */}
                          <button
                            onClick={() => setPreviewLeave(lv)}
                            className="p-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-[10px] font-semibold flex items-center space-x-1"
                            title="Preview Official Form"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Preview</span>
                          </button>

                          {/* Direct PDF Download button */}
                          <button
                            onClick={() => handleDownloadLeavePDF(lv)}
                            className="p-1 px-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[10px] font-bold flex items-center space-x-1"
                            title="Generate and Download official PDF Leave Form"
                          >
                            <Download className="w-3 h-3" />
                            <span>PDF Form</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 5: HR EXECUTIVE REPORTS (STRICTLY PDF, NO CSV/EXCEL)
          ======================================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Official Executive HR Reports</span>
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              All Human Resources reports are generated directly into high-fidelity, printable PDF documents formatted for corporate approval and auditing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Report 1: Monthly Leave Register */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between space-y-4 shadow-sm">
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-100 text-sm">Monthly Leave & Absence Register</h3>
                <p className="text-slate-400 text-xs">
                  Complete audit log of all employee leave applications, approved days, leave types availed, and remaining balances.
                </p>
                <div className="p-2.5 bg-slate-950 rounded-lg text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Applications Recorded:</span>
                    <strong className="text-slate-200">{leaves.length} records</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Approved Quota:</span>
                    <strong className="text-emerald-400">{leaves.filter(l => l.status === 'Approved').length} approved</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  hrPdfService.generateLeaveSummaryPDF(leaves);
                  showToast('Monthly Leave Register generated as PDF.');
                }}
                className="w-full flex items-center justify-center space-x-1.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Leave Register (PDF)</span>
              </button>
            </div>

            {/* Report 2: Biometric Attendance Log */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between space-y-4 shadow-sm">
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-100 text-sm">Biometric Shift Attendance Audit</h3>
                <p className="text-slate-400 text-xs">
                  Official shift punch-in/out timestamps, terminal authentication logs, delays, and overtime duty hours.
                </p>
                <div className="p-2.5 bg-slate-950 rounded-lg text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Today's Punches:</span>
                    <strong className="text-slate-200">{attendance.length} logs</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>On Time Rate:</span>
                    <strong className="text-emerald-400">92.4% punctuality</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  hrPdfService.generateAttendanceReportPDF(attendance);
                  showToast('Attendance Audit generated as PDF.');
                }}
                className="w-full flex items-center justify-center space-x-1.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Attendance Audit (PDF)</span>
              </button>
            </div>

            {/* Report 3: Department Headcount & Payroll */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between space-y-4 shadow-sm">
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold">
                  <Building className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-100 text-sm">Department Headcount & Payroll Allocation</h3>
                <p className="text-slate-400 text-xs">
                  Staffing distribution across 9 operational departments with monthly payroll budget and roster coverage.
                </p>
                <div className="p-2.5 bg-slate-950 rounded-lg text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Active Departments:</span>
                    <strong className="text-slate-200">{departments.length} Units</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Total Payroll Budget:</span>
                    <strong className="text-amber-300 font-mono">৳3,400,000 / mo</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  alert('Department Headcount & Payroll Summary is prepared in PDF format.');
                  showToast('Department payroll report ready for download.');
                }}
                className="w-full flex items-center justify-center space-x-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-lg text-xs transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                <span>View Department Report (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODALS & DIALOGS
          ======================================================== */}

      {/* Employee Details / Edit / Add Modal */}
      {employeeModalMode && (
        <EmployeeModal
          employee={selectedEmployee}
          mode={employeeModalMode}
          departments={departmentNames}
          roles={availableRoles}
          onClose={() => {
            setEmployeeModalMode(null);
            setSelectedEmployee(null);
          }}
          onSaved={(savedEmp) => {
            setEmployees(hrService.getEmployees());
            showToast(`Employee ${savedEmp.name} saved successfully.`);
          }}
          onDeleted={(deletedId) => {
            setEmployees(hrService.getEmployees());
            showToast('Employee removed successfully.');
          }}
        />
      )}

      {/* Apply Leave Modal */}
      {showApplyLeaveModal && (
        <ApplyLeaveModal
          employees={employees}
          defaultEmployeeId={applyLeaveDefaultEmpId}
          onClose={() => setShowApplyLeaveModal(false)}
          onSubmitted={(newLeave) => {
            setLeaves(hrService.getLeaves());
            setEmployees(hrService.getEmployees());
            showToast(`Leave application ${newLeave.id} submitted for approval.`);
          }}
        />
      )}

      {/* Leave Form Official PDF Preview Sheet Modal */}
      {previewLeave && (
        <LeaveFormPreviewModal
          leave={previewLeave}
          employee={employees.find(e => e.id === previewLeave.employeeId)}
          onClose={() => setPreviewLeave(null)}
        />
      )}

      {/* Quick Manual Clock In / Punch Modal */}
      {showPunchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Record Shift Attendance Punch</span>
              </h3>
              <button onClick={() => setShowPunchModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Select Employee</label>
                <select
                  value={punchEmpId}
                  onChange={e => setPunchEmpId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeCode}) — {emp.department}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                onClick={() => setShowPunchModal(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                disabled={!punchEmpId}
                onClick={handleRecordPunch}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 rounded-lg font-bold text-xs"
              >
                Record Punch In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
