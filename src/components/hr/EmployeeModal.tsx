import React, { useState } from 'react';
import {
  X, User, Briefcase, Phone, Mail, Shield, Calendar, CreditCard, Heart, Check,
  Trash2, Edit3, Save, AlertCircle, Fingerprint, ScanFace, RefreshCw, CheckCircle2,
  ArrowUpCircle, Cpu, Radio, Network
} from 'lucide-react';
import { Employee, EmployeeStatus, ShiftType, BiometricEnrollmentInfo, BiometricModality } from '../../types/hrTypes';
import { hrService } from '../../services/hrService';
import { biometricService } from '../../services/biometricService';

interface EmployeeModalProps {
  employee?: Employee | null;
  mode: 'view' | 'edit' | 'add';
  departments: string[];
  roles: { id: string; name: string }[];
  onClose: () => void;
  onSaved: (emp: Employee) => void;
  onDeleted?: (id: string) => void;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  employee,
  mode: initialMode,
  departments,
  roles,
  onClose,
  onSaved,
  onDeleted
}) => {
  const [mode, setMode] = useState<'view' | 'edit' | 'add'>(initialMode);
  const [activeTab, setActiveTab] = useState<'general' | 'employment' | 'contact' | 'leaves' | 'biometric'>('general');

  // Form State with guaranteed unique Employee ID initialization
  const [name, setName] = useState(employee?.name || '');
  const [employeeCode, setEmployeeCode] = useState(
    employee?.employeeCode || (initialMode === 'add' ? hrService.generateUniqueEmployeeCode('EMP') : '')
  );
  const [designation, setDesignation] = useState(employee?.designation || '');
  const [department, setDepartment] = useState(employee?.department || departments[0] || 'Front Office');
  const [roleId, setRoleId] = useState(employee?.roleId || 'role-fo-exec');
  const [email, setEmail] = useState(employee?.email || '');
  const [phone, setPhone] = useState(employee?.phone || '');
  const [shift, setShift] = useState<ShiftType>(employee?.shift || 'Morning');
  const [shiftTimings, setShiftTimings] = useState(employee?.shiftTimings || '07:00 AM - 03:30 PM');
  const [joiningDate, setJoiningDate] = useState(employee?.joiningDate || '2024-01-01');
  const [salary, setSalary] = useState(employee?.salary || 35000);
  const [status, setStatus] = useState<EmployeeStatus>(employee?.status || 'Active');
  const [nationalId, setNationalId] = useState(employee?.nationalId || '');
  const [address, setAddress] = useState(employee?.address || '');
  const [bloodGroup, setBloodGroup] = useState(employee?.bloodGroup || 'O+');
  const [avatar, setAvatar] = useState(employee?.avatar || '');

  // Biometric Enrollment State
  const initialEnrollment = employee?.biometricEnrollment;
  const [isBioEnrolled, setIsBioEnrolled] = useState(initialEnrollment?.isEnrolled ?? true);
  const [deviceUserId, setDeviceUserId] = useState(
    initialEnrollment?.deviceUserId || (employee?.employeeCode ? employee.employeeCode.replace(/\D/g, '') : employeeCode.replace(/\D/g, '') || '1001')
  );
  const [cardBadgeNumber, setCardBadgeNumber] = useState(
    initialEnrollment?.cardBadgeNumber || `CARD-${Math.floor(10000000 + Math.random() * 90000000)}`
  );
  const [devicePrivilege, setDevicePrivilege] = useState<'Standard User' | 'Enroller' | 'Manager' | 'Super Administrator'>(
    initialEnrollment?.privilege || 'Standard User'
  );
  const [biometricTypes, setBiometricTypes] = useState<BiometricModality[]>(
    initialEnrollment?.biometricTypes || ['Fingerprint']
  );
  const [isPushingNow, setIsPushingNow] = useState(false);
  const [pushStatusMsg, setPushStatusMsg] = useState<string | null>(null);

  // Emergency contact
  const [emName, setEmName] = useState(employee?.emergencyContact?.name || '');
  const [emRelation, setEmRelation] = useState(employee?.emergencyContact?.relation || '');
  const [emPhone, setEmPhone] = useState(employee?.emergencyContact?.phone || '');

  // Leave balances
  const [annualLeave, setAnnualLeave] = useState(employee?.leaveBalance?.annual ?? 18);
  const [casualLeave, setCasualLeave] = useState(employee?.leaveBalance?.casual ?? 10);
  const [medicalLeave, setMedicalLeave] = useState(employee?.leaveBalance?.medical ?? 14);

  const [error, setError] = useState('');

  // Uniqueness validation check
  const isCodeTaken = hrService.isEmployeeCodeTaken(employeeCode, employee?.id);

  const handleGenerateNextCode = () => {
    const nextCode = hrService.generateUniqueEmployeeCode('EMP');
    setEmployeeCode(nextCode);
    setDeviceUserId(nextCode.replace(/\D/g, '') || '1001');
    setError('');
  };

  const handlePushDirectlyToDevice = async () => {
    if (!employee && mode === 'add') {
      setError('Please complete saving the employee profile first before pushing to device.');
      return;
    }
    setIsPushingNow(true);
    setPushStatusMsg(null);
    try {
      const targetId = employee ? employee.id : 'emp-temp';
      const res = await biometricService.pushEmployeeToDevice(
        targetId,
        undefined,
        devicePrivilege,
        biometricTypes
      );
      if (res.success) {
        setPushStatusMsg(res.message);
        setIsBioEnrolled(true);
      } else {
        setPushStatusMsg(`Push failed: ${res.message}`);
      }
    } catch (err: any) {
      setPushStatusMsg(`Error: ${err.message}`);
    } finally {
      setIsPushingNow(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError('Employee name is required.');
      return;
    }
    if (!employeeCode.trim()) {
      setError('Employee unique ID is required.');
      return;
    }
    if (isCodeTaken) {
      setError(`Employee ID "${employeeCode.trim()}" is already assigned to another employee. Each employee must have a unique ID.`);
      return;
    }
    if (!department) {
      setError('Please select a department.');
      return;
    }

    const selectedRole = roles.find(r => r.id === roleId);

    const bioPayload: BiometricEnrollmentInfo = {
      isEnrolled: isBioEnrolled,
      deviceUserId: deviceUserId.trim() || employeeCode.replace(/\D/g, '') || '1001',
      cardBadgeNumber: cardBadgeNumber.trim(),
      privilege: devicePrivilege,
      biometricTypes,
      syncedDevices: initialEnrollment?.syncedDevices || biometricService.getDevices().map(d => d.id),
      lastSyncedAt: new Date().toISOString()
    };

    const payload: Omit<Employee, 'id'> = {
      name: name.trim(),
      employeeCode: employeeCode.trim(),
      designation: designation.trim() || 'Staff Officer',
      department,
      roleId,
      roleName: selectedRole ? selectedRole.name : 'Staff',
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@cculbresort.com`,
      phone: phone.trim() || '+880 1711-000000',
      shift,
      shiftTimings,
      joiningDate,
      salary: Number(salary) || 0,
      status,
      avatar: avatar.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      nationalId: nationalId.trim() || '19902691234567890',
      address: address.trim() || 'Dhaka, Bangladesh',
      bloodGroup,
      emergencyContact: {
        name: emName.trim() || 'Family Contact',
        relation: emRelation.trim() || 'Relative',
        phone: emPhone.trim() || phone
      },
      leaveBalance: {
        annual: Number(annualLeave) || 0,
        casual: Number(casualLeave) || 0,
        medical: Number(medicalLeave) || 0
      },
      biometricEnrollment: bioPayload
    };

    if (mode === 'add') {
      const created = hrService.addEmployee(payload);
      // Also register into biometric fleet
      biometricService.pushEmployeeToDevice(created.id, undefined, devicePrivilege, biometricTypes);
      onSaved(created);
    } else if (employee) {
      const updated = hrService.updateEmployee(employee.id, payload);
      if (updated) {
        biometricService.pushEmployeeToDevice(employee.id, undefined, devicePrivilege, biometricTypes);
        onSaved(updated);
      }
    }
    onClose();
  };

  const handleDelete = () => {
    if (!employee) return;
    if (confirm(`Are you sure you want to remove ${employee.name} (${employee.employeeCode}) from the employee records?`)) {
      hrService.deleteEmployee(employee.id);
      if (onDeleted) onDeleted(employee.id);
      onClose();
    }
  };

  const handleToggleStatus = () => {
    if (!employee) return;
    const toggled = hrService.toggleEmployeeStatus(employee.id);
    if (toggled) {
      setStatus(toggled.status);
      onSaved(toggled);
    }
  };

  const isReadOnly = mode === 'view';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              {mode === 'add' ? <User className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                {mode === 'add' ? 'Onboard New Employee' : mode === 'edit' ? 'Edit Employee Profile' : 'Employee Details & Management'}
                {employee && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    status === 'Active' ? 'bg-emerald-500/20 text-emerald-300' :
                    status === 'On Leave' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-rose-500/20 text-rose-300'
                  }`}>
                    {status}
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                {mode === 'add' ? 'Enter staff credentials, department assignment & payroll details' : `${employee?.name} • ${employee?.employeeCode}`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {mode === 'view' && employee && (
              <>
                <button
                  onClick={() => setMode('edit')}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleToggleStatus}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
                  title="Toggle status between Active and Suspended"
                >
                  {status === 'Active' ? 'Suspend' : 'Activate'}
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 border border-rose-800/40 rounded-lg transition-colors"
                  title="Delete employee"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}

            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2 space-x-2 overflow-x-auto">
          {[
            { id: 'general', label: 'Personal & General' },
            { id: 'employment', label: 'Role & Payroll' },
            { id: 'biometric', label: 'Biometric & ZKTeco' },
            { id: 'contact', label: 'Contact & Emergency' },
            { id: 'leaves', label: 'Leave Entitlements' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors shrink-0 ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="flex items-center space-x-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: General */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Full Legal Name *</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Shamima Akter"
                    className="w-full bg-slate-950 border border-slate-700 disabled:opacity-70 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-400 font-semibold flex items-center gap-1.5">
                      <span>Unique Employee ID *</span>
                      {isCodeTaken ? (
                        <span className="text-[10px] text-rose-400 font-bold bg-rose-950/60 px-1.5 py-0.2 rounded border border-rose-800/60">
                          ID Taken
                        </span>
                      ) : employeeCode.trim() ? (
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/60 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" />
                          Unique ID
                        </span>
                      ) : null}
                    </label>

                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={handleGenerateNextCode}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30 cursor-pointer transition"
                        title="Auto-calculate next guaranteed unique employee ID"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>Auto-ID</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={employeeCode}
                    onChange={e => {
                      const val = e.target.value.toUpperCase();
                      setEmployeeCode(val);
                      setDeviceUserId(val.replace(/\D/g, '') || '1001');
                    }}
                    placeholder="e.g. EMP-1015"
                    className={`w-full bg-slate-950 border disabled:opacity-70 rounded-lg p-2 text-slate-100 font-mono font-bold focus:outline-none ${
                      isCodeTaken
                        ? 'border-rose-500 ring-1 ring-rose-500/50'
                        : 'border-slate-700 focus:border-amber-500'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">National ID / Passport</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={nationalId}
                    onChange={e => setNationalId(e.target.value)}
                    placeholder="e.g. 1990269123456"
                    className="w-full bg-slate-950 border border-slate-700 disabled:opacity-70 rounded-lg p-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Blood Group</label>
                  <select
                    disabled={isReadOnly}
                    value={bloodGroup}
                    onChange={e => setBloodGroup(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 disabled:opacity-70 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Status</label>
                  <select
                    disabled={isReadOnly}
                    value={status}
                    onChange={e => setStatus(e.target.value as EmployeeStatus)}
                    className="w-full bg-slate-950 border border-slate-700 disabled:opacity-70 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Residential Address</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="e.g. Block C, Bashundhara R/A, Dhaka"
                  className="w-full bg-slate-950 border border-slate-700 disabled:opacity-70 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Profile Avatar URL</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={avatar}
                  onChange={e => setAvatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-950 border border-slate-700 disabled:opacity-70 rounded-lg p-2 text-slate-100 text-[11px] focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Employment & Role */}
          {activeTab === 'employment' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Department *</label>
                  <select
                    disabled={isReadOnly}
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 disabled:opacity-70 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Official Designation</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={designation}
                    onChange={e => setDesignation(e.target.value)}
                    placeholder="e.g. Front Office Executive"
                    className="w-full bg-slate-950 border border-slate-700 disabled:opacity-70 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Security Role / Access Level</label>
                  <select
                    disabled={isReadOnly}
                    value={roleId}
                    onChange={e => setRoleId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 disabled:opacity-70 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Date of Joining</label>
                  <input
                    type="date"
                    disabled={isReadOnly}
                    value={joiningDate}
                    onChange={e => setJoiningDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 disabled:opacity-70 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Assigned Shift</label>
                  <select
                    disabled={isReadOnly}
                    value={shift}
                    onChange={e => setShift(e.target.value as ShiftType)}
                    className="w-full bg-slate-950 border border-slate-700 disabled:opacity-70 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                    <option value="General">General</option>
                    <option value="Rotational">Rotational</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Shift Timings</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={shiftTimings}
                    onChange={e => setShiftTimings(e.target.value)}
                    placeholder="07:00 AM - 03:30 PM"
                    className="w-full bg-slate-950 border border-slate-700 disabled:opacity-70 rounded-lg p-2 text-slate-100 font-mono text-[11px] focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Gross Monthly Salary (BDT)</label>
                  <input
                    type="number"
                    disabled={isReadOnly}
                    value={salary}
                    onChange={e => setSalary(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 disabled:opacity-70 rounded-lg p-2 text-emerald-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Contact & Emergency */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Official Email Address</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                    <input
                      type="email"
                      disabled={isReadOnly}
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="staff@cculbresort.com"
                      className="w-full bg-slate-950 border border-slate-700 disabled:opacity-70 rounded-lg pl-8 pr-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Official Phone / Mobile</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                    <input
                      type="tel"
                      disabled={isReadOnly}
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+880 1711-..."
                      className="w-full bg-slate-950 border border-slate-700 disabled:opacity-70 rounded-lg pl-8 pr-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <span className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span>Emergency Contact Details</span>
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-500 text-[11px] mb-1">Contact Name</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={emName}
                      onChange={e => setEmName(e.target.value)}
                      placeholder="e.g. Kamrul Hasan"
                      className="w-full bg-slate-900 border border-slate-700 disabled:opacity-70 rounded-lg p-1.5 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[11px] mb-1">Relationship</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={emRelation}
                      onChange={e => setEmRelation(e.target.value)}
                      placeholder="e.g. Spouse / Brother"
                      className="w-full bg-slate-900 border border-slate-700 disabled:opacity-70 rounded-lg p-1.5 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[11px] mb-1">Emergency Phone</label>
                    <input
                      type="tel"
                      disabled={isReadOnly}
                      value={emPhone}
                      onChange={e => setEmPhone(e.target.value)}
                      placeholder="+880 1819-..."
                      className="w-full bg-slate-900 border border-slate-700 disabled:opacity-70 rounded-lg p-1.5 text-slate-100 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Leaves */}
          {/* TAB: Biometric & ZKTeco Device Sync */}
          {activeTab === 'biometric' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                      <Fingerprint className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100">Hardware Biometric Terminal Enrollment</h4>
                      <p className="text-[11px] text-slate-400">
                        ZKTeco TCP/IP attendance terminal mapping & unique employee synchronization
                      </p>
                    </div>
                  </div>

                  <label className="flex items-center space-x-2 cursor-pointer bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
                    <input
                      type="checkbox"
                      disabled={isReadOnly}
                      checked={isBioEnrolled}
                      onChange={e => setIsBioEnrolled(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-xs font-semibold text-slate-200">
                      {isBioEnrolled ? 'Enrolled in Fleet' : 'Pending Enrollment'}
                    </span>
                  </label>
                </div>

                {pushStatusMsg && (
                  <div className="p-2.5 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-200 text-xs flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>{pushStatusMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">
                      Device Enroll UID (ZKTeco) *
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={deviceUserId}
                      onChange={e => setDeviceUserId(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 1011"
                      className="w-full bg-slate-900 border border-slate-700 disabled:opacity-70 rounded-lg p-2 text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Numeric UID stored in terminal hardware memory
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">
                      RFID Card / Badge #
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={cardBadgeNumber}
                      onChange={e => setCardBadgeNumber(e.target.value)}
                      placeholder="e.g. CARD-8829103"
                      className="w-full bg-slate-900 border border-slate-700 disabled:opacity-70 rounded-lg p-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      10-digit EM/Mifare proximity RFID card
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">
                      Terminal Privilege
                    </label>
                    <select
                      disabled={isReadOnly}
                      value={devicePrivilege}
                      onChange={e => setDevicePrivilege(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 disabled:opacity-70 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                    >
                      <option value="Standard User">Standard User (Normal Duty Punch)</option>
                      <option value="Enroller">Enroller (Can Enroll Co-workers)</option>
                      <option value="Manager">Manager (Shift Supervisor)</option>
                      <option value="Super Administrator">Super Administrator</option>
                    </select>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Hardware privilege on terminal screen
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1.5 font-semibold">
                    Enrolled Biometric Sensor Modalities
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'Fingerprint', label: 'Fingerprint Scan', icon: Fingerprint },
                      { id: 'Face', label: 'Facial Scan (3D AI)', icon: ScanFace },
                      { id: 'RFID Card', label: 'RFID Proximity Badge', icon: CreditCard },
                      { id: 'PIN', label: 'Security Passcode PIN', icon: Shield }
                    ].map(b => {
                      const Icon = b.icon;
                      const isChecked = biometricTypes.includes(b.id as any);
                      return (
                        <label
                          key={b.id}
                          className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition ${
                            isChecked
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={isReadOnly}
                            checked={isChecked}
                            onChange={e => {
                              if (e.target.checked) {
                                setBiometricTypes(prev => [...prev, b.id as any]);
                              } else {
                                setBiometricTypes(prev => prev.filter(t => t !== b.id));
                              }
                            }}
                            className="rounded text-amber-500 focus:ring-amber-500"
                          />
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[11px] font-medium">{b.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400">
                    <span>Fleet Status: </span>
                    <strong className="text-emerald-400">
                      Mapped to {biometricService.getDevices().length} ZKTeco Terminals (Port 4370)
                    </strong>
                  </div>

                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={handlePushDirectlyToDevice}
                      disabled={isPushingNow}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-xs transition shadow cursor-pointer disabled:opacity-50"
                    >
                      <ArrowUpCircle className={`w-3.5 h-3.5 ${isPushingNow ? 'animate-spin' : ''}`} />
                      <span>{isPushingNow ? 'Transmitting to Hardware...' : 'Push to ZKTeco Device'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Leaves */}
          {activeTab === 'leaves' && (
            <div className="space-y-3">
              <p className="text-slate-400 text-xs">
                Remaining annual leave days available for this employee:
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="block text-slate-400 text-[11px]">Annual Leave</span>
                  <input
                    type="number"
                    disabled={isReadOnly}
                    value={annualLeave}
                    onChange={e => setAnnualLeave(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 disabled:opacity-70 rounded p-1.5 mt-1 font-mono font-bold text-amber-400"
                  />
                  <span className="text-[10px] text-slate-500">Days Remaining</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="block text-slate-400 text-[11px]">Casual Leave</span>
                  <input
                    type="number"
                    disabled={isReadOnly}
                    value={casualLeave}
                    onChange={e => setCasualLeave(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 disabled:opacity-70 rounded p-1.5 mt-1 font-mono font-bold text-blue-400"
                  />
                  <span className="text-[10px] text-slate-500">Days Remaining</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="block text-slate-400 text-[11px]">Medical / Sick Leave</span>
                  <input
                    type="number"
                    disabled={isReadOnly}
                    value={medicalLeave}
                    onChange={e => setMedicalLeave(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 disabled:opacity-70 rounded p-1.5 mt-1 font-mono font-bold text-emerald-400"
                  />
                  <span className="text-[10px] text-slate-500">Days Remaining</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold text-xs transition-colors"
          >
            {isReadOnly ? 'Close' : 'Cancel'}
          </button>

          {!isReadOnly && (
            <button
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold text-xs transition-colors shadow"
            >
              <Save className="w-4 h-4" />
              <span>{mode === 'add' ? 'Confirm Onboarding' : 'Save Changes'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
