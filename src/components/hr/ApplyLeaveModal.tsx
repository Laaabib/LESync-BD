import React, { useState } from 'react';
import { X, Calendar, User, FileText, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { Employee, LeaveRequest, LeaveType } from '../../types/hrTypes';
import { hrService } from '../../services/hrService';
import { hrPdfService } from '../../services/hrPdfService';

interface ApplyLeaveModalProps {
  employees: Employee[];
  defaultEmployeeId?: string;
  onClose: () => void;
  onSubmitted: (leave: LeaveRequest) => void;
}

export const ApplyLeaveModal: React.FC<ApplyLeaveModalProps> = ({
  employees,
  defaultEmployeeId,
  onClose,
  onSubmitted
}) => {
  const initialEmp = employees.find(e => e.id === defaultEmployeeId) || employees[0];

  const [selectedEmpId, setSelectedEmpId] = useState(initialEmp?.id || '');
  const [leaveType, setLeaveType] = useState<LeaveType>('Annual Leave');
  const [fromDate, setFromDate] = useState('2026-09-20');
  const [toDate, setToDate] = useState('2026-09-22');
  const [reason, setReason] = useState('');
  const [relieverName, setRelieverName] = useState('');
  const [contactDuringLeave, setContactDuringLeave] = useState('');
  const [error, setError] = useState('');

  const currentEmp = employees.find(e => e.id === selectedEmpId) || initialEmp;

  // Calculate days
  const calcDays = () => {
    try {
      const d1 = new Date(fromDate);
      const d2 = new Date(toDate);
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return isNaN(diffDays) ? 1 : Math.max(1, diffDays);
    } catch {
      return 1;
    }
  };

  const days = calcDays();

  const handleSubmit = (autoDownloadPdf: boolean = false) => {
    if (!currentEmp) {
      setError('Please select an employee.');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a specific reason for the leave application.');
      return;
    }

    const newLeave = hrService.submitLeave({
      employeeId: currentEmp.id,
      employeeCode: currentEmp.employeeCode,
      employeeName: currentEmp.name,
      designation: currentEmp.designation,
      department: currentEmp.department,
      leaveType,
      fromDate,
      toDate,
      days,
      reason: reason.trim(),
      relieverName: relieverName.trim() || 'Duty Senior Assigned',
      contactDuringLeave: contactDuringLeave.trim() || currentEmp.phone
    });

    if (autoDownloadPdf) {
      hrPdfService.generateLeaveFormPDF(newLeave, currentEmp);
    }

    onSubmitted(newLeave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Apply for Employee Leave
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Official clearance form will be prepared for department sign-off
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="flex items-center space-x-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Employee Selection */}
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Select Employee *</label>
            <select
              value={selectedEmpId}
              onChange={e => setSelectedEmpId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-amber-500 font-medium"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employeeCode}) — {emp.department} • {emp.designation}
                </option>
              ))}
            </select>
          </div>

          {/* Employee Mini Card */}
          {currentEmp && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-[11px]">
              <div className="flex items-center space-x-2.5">
                <img
                  src={currentEmp.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60'}
                  alt={currentEmp.name}
                  className="w-8 h-8 rounded-lg object-cover border border-slate-700"
                />
                <div>
                  <strong className="text-slate-200 block text-xs">{currentEmp.name}</strong>
                  <span className="text-slate-400">{currentEmp.department} • {currentEmp.shift} Shift</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px]">Annual Balance</span>
                <strong className="text-amber-400 font-mono text-xs">{currentEmp.leaveBalance?.annual ?? 14} Days Left</strong>
              </div>
            </div>
          )}

          {/* Leave Type & Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Leave Type *</label>
              <select
                value={leaveType}
                onChange={e => setLeaveType(e.target.value as LeaveType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="Annual Leave">Annual Leave</option>
                <option value="Sick / Medical Leave">Sick / Medical Leave</option>
                <option value="Casual Leave">Casual Leave</option>
                <option value="Compensatory Off">Compensatory Off</option>
                <option value="Maternity / Paternity">Maternity / Paternity</option>
                <option value="Unpaid Leave">Unpaid Leave</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Total Duration</label>
              <div className="p-2 bg-slate-950 border border-slate-700 rounded-lg font-mono font-bold text-amber-400">
                {days} Calendar Day(s)
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">From Date *</label>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">To Date *</label>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Purpose & Grounds for Leave *</label>
            <textarea
              rows={2}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Attending family wedding ceremony / Medical checkup..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Reliever & Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Work Handover Reliever</label>
              <input
                type="text"
                value={relieverName}
                onChange={e => setRelieverName(e.target.value)}
                placeholder="e.g. Tanvir Hossain (Colleague)"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Address / Phone during leave</label>
              <input
                type="text"
                value={contactDuringLeave}
                onChange={e => setContactDuringLeave(e.target.value)}
                placeholder="e.g. Sylhet (01717-890123)"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold text-xs transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleSubmit(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 rounded-lg font-bold text-xs transition-colors shadow"
              title="Submit and immediately save vector PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Submit & Download PDF</span>
            </button>
            <button
              onClick={() => handleSubmit(false)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold text-xs transition-colors shadow"
            >
              Submit Application
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
