import React from 'react';
import { X, Printer, Download, CheckCircle2, Shield, Calendar, User, FileText, Loader2 } from 'lucide-react';
import { LeaveRequest, Employee } from '../../types/hrTypes';
import { hrPdfService } from '../../services/hrPdfService';
import { exportElementToPDF } from '../../services/pdfExportService';

interface LeaveFormPreviewModalProps {
  leave: LeaveRequest;
  employee?: Employee;
  onClose: () => void;
}

export const LeaveFormPreviewModal: React.FC<LeaveFormPreviewModalProps> = ({
  leave,
  employee,
  onClose
}) => {
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownloadPDF = async () => {
    const el = document.getElementById('leave-form-printable-document');
    if (el) {
      setIsDownloading(true);
      const filename = `Leave_Application_${leave.id || 'Form'}.pdf`;
      try {
        const ok = await exportElementToPDF(el, filename, { scale: 2.2, margin: 8 });
        setIsDownloading(false);
        if (ok) return;
      } catch (e) {
        console.warn('DOM preview capture fallback to vector exporter:', e);
        setIsDownloading(false);
      }
    }
    hrPdfService.generateLeaveFormPDF(leave, employee);
  };

  const handlePrint = () => {
    window.print();
  };

  const getResumptionDate = (toDateStr: string) => {
    try {
      const d = new Date(toDateStr);
      if (!isNaN(d.getTime())) {
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
      }
    } catch {
      // fallback
    }
    return toDateStr;
  };

  const resumptionDate = getResumptionDate(leave.toDate);
  const empCode = leave.employeeCode || employee?.employeeCode || 'EMP-1001';
  const empName = leave.employeeName || employee?.name || 'Staff Employee';
  const empDept = leave.department || employee?.department || 'Operations';
  const empDesig = leave.designation || employee?.designation || 'Staff';
  const empPhone = employee?.phone || '+880 1711-000000';
  const empJoining = employee?.joiningDate || '2024-02-15';

  const annualRemain = employee?.leaveBalance?.annual ?? 14;
  const casualRemain = employee?.leaveBalance?.casual ?? 8;
  const medicalRemain = employee?.leaveBalance?.medical ?? 13;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Action Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Official Leave Form (Two-Part A4 Document)
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  leave.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-300' :
                  leave.status === 'Rejected' ? 'bg-rose-500/20 text-rose-300' :
                  'bg-amber-500/20 text-amber-300'
                }`}>
                  {leave.status}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                A4 Single Page Layout • Upper Half: HR Dept Copy • Lower Half: Employee Copy
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
              title="Print via browser"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow cursor-pointer"
              title="Download formal two-part A4 PDF"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Leave Form Paper Sheet (2 Parts on single A4) */}
        <div className="p-6 overflow-y-auto bg-slate-950/50 flex justify-center">
          <div
            id="leave-form-printable-document"
            className="w-full max-w-2xl bg-white text-slate-900 p-6 rounded-lg shadow-xl border border-slate-200 font-sans space-y-4 text-xs"
          >
            
            {/* ==================================================== */}
            {/* PART 1: HR DEPARTMENT COPY (OFFICE RECORD)          */}
            {/* ==================================================== */}
            <div className="border border-slate-300 rounded-lg p-3.5 bg-white space-y-3">
              {/* Part 1 Header */}
              <div className="flex justify-between items-start pb-2 border-b-2 border-slate-900">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-900 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wide">
                      Part 1: HR Dept Copy
                    </span>
                    <h1 className="text-xs font-black tracking-tight text-slate-950 uppercase">
                      LESYNC PMS & RESORT MANAGEMENT
                    </h1>
                  </div>
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mt-0.5">
                    Human Resources Directorate • Staff Leave & Authorization Dossier (Office Record)
                  </p>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div className="text-right">
                    <span className="block text-[8px] font-bold text-slate-400 uppercase font-mono">Ref: {leave.id}</span>
                    <span className="text-[9px] text-slate-600">Applied: {leave.appliedAt ? leave.appliedAt.split('T')[0] : '2026-09-15'}</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                    leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                    leave.status === 'Rejected' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                    'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {leave.status}
                  </span>
                </div>
              </div>

              {/* 1. Employee Particulars */}
              <div>
                <h3 className="font-bold text-[10px] uppercase text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 mb-1.5">
                  1. Employee Particulars
                </h3>
                <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-[10px] px-1">
                  <div><span className="text-slate-500">Staff ID:</span> <strong className="text-slate-900 ml-1">{empCode}</strong></div>
                  <div><span className="text-slate-500">Full Name:</span> <strong className="text-slate-900 ml-1">{empName}</strong></div>
                  <div><span className="text-slate-500">Department:</span> <strong className="text-slate-900 ml-1">{empDept}</strong></div>
                  <div><span className="text-slate-500">Designation:</span> <strong className="text-slate-900 ml-1">{empDesig}</strong></div>
                  <div><span className="text-slate-500">Joining Date:</span> <span className="text-slate-900 ml-1">{empJoining}</span></div>
                  <div><span className="text-slate-500">Contact:</span> <span className="text-slate-900 ml-1">{empPhone}</span></div>
                </div>
              </div>

              {/* 2. Leave Schedule & Specifications */}
              <div>
                <h3 className="font-bold text-[10px] uppercase text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 mb-1.5">
                  2. Leave Schedule & Specifications
                </h3>
                <div className="grid grid-cols-4 gap-x-3 gap-y-1 text-[10px] px-1">
                  <div><span className="text-slate-500">Leave Type:</span> <strong className="text-amber-800 ml-1">{leave.leaveType}</strong></div>
                  <div><span className="text-slate-500">From:</span> <strong className="text-slate-900 ml-1">{leave.fromDate}</strong></div>
                  <div><span className="text-slate-500">To:</span> <strong className="text-slate-900 ml-1">{leave.toDate}</strong></div>
                  <div><span className="text-slate-500">Duration:</span> <strong className="text-slate-950 ml-1">{leave.days} Day(s)</strong></div>
                </div>
                <div className="mt-1 px-1 text-[9.5px] grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded border border-slate-200">
                  <div>
                    <span className="text-slate-500 block font-semibold uppercase text-[8.5px]">Purpose / Grounds:</span>
                    <span className="text-slate-800 italic">{leave.reason || 'Personal obligation'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-semibold uppercase text-[8.5px]">Station / Contact During Leave:</span>
                    <span className="text-slate-800 font-medium">{leave.contactDuringLeave || 'Available on registered phone'}</span>
                  </div>
                </div>
              </div>

              {/* 3. Handover & Balance Audit */}
              <div>
                <h3 className="font-bold text-[10px] uppercase text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 mb-1.5">
                  3. Reliever Handover & Leave Balance Audit
                </h3>
                <div className="grid grid-cols-2 gap-3 text-[10px] px-1">
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                    <span className="text-slate-500 text-[8.5px] block font-semibold uppercase">Assigned Reliever:</span>
                    <strong className="text-slate-900">{leave.relieverName || 'Duty Senior Assigned'}</strong>
                    <p className="text-slate-500 text-[8px] italic mt-0.5">
                      Handover confirmed: Duties, operational keys & pending items transferred.
                    </p>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                    <span className="text-slate-500 text-[8.5px] block font-semibold uppercase mb-0.5">Remaining Entitlement:</span>
                    <div className="flex justify-between text-[9px]">
                      <span>Annual: <strong>{annualRemain}d</strong></span>
                      <span>Casual: <strong>{casualRemain}d</strong></span>
                      <span>Medical: <strong>{medicalRemain}d</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Approvals & Signatures (4 Boxes) */}
              <div>
                <h3 className="font-bold text-[10px] uppercase text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 mb-1.5">
                  4. Authorization Sign-off & Executive Clearances
                </h3>
                <div className="grid grid-cols-4 gap-2 text-center text-[9px]">
                  <div className="border border-slate-300 p-1.5 rounded flex flex-col justify-between h-16 bg-slate-50/50">
                    <span className="font-bold text-slate-600 uppercase text-[8px]">1. Applicant Employee</span>
                    <div className="border-b border-slate-300 my-0.5"></div>
                    <div>
                      <strong className="block text-slate-900 truncate text-[8.5px]">{empName}</strong>
                      <span className="text-slate-400 text-[7px]">Signature</span>
                    </div>
                  </div>
                  <div className="border border-slate-300 p-1.5 rounded flex flex-col justify-between h-16 bg-slate-50/50">
                    <span className="font-bold text-slate-600 uppercase text-[8px]">2. Reliever Officer</span>
                    <div className="border-b border-slate-300 my-0.5"></div>
                    <div>
                      <strong className="block text-slate-900 truncate text-[8.5px]">{leave.relieverName || 'Duty Senior'}</strong>
                      <span className="text-slate-400 text-[7px]">Handover Ack.</span>
                    </div>
                  </div>
                  <div className="border border-slate-300 p-1.5 rounded flex flex-col justify-between h-16 bg-slate-50/50">
                    <span className="font-bold text-slate-600 uppercase text-[8px]">3. Department Head</span>
                    <div className="border-b border-slate-300 my-0.5"></div>
                    <div>
                      <strong className="block text-slate-900 text-[8.5px]">Recommended</strong>
                      <span className="text-slate-400 text-[7px]">HOD Clearance</span>
                    </div>
                  </div>
                  <div className={`border p-1.5 rounded flex flex-col justify-between h-16 ${
                    leave.status === 'Approved' ? 'border-emerald-400 bg-emerald-50/50' : 'border-slate-300 bg-slate-50/50'
                  }`}>
                    <span className="font-bold text-slate-600 uppercase text-[8px]">4. HR Directorate</span>
                    <div className="border-b border-slate-300 my-0.5"></div>
                    <div>
                      <strong className={`block text-[8.5px] ${
                        leave.status === 'Approved' ? 'text-emerald-700 font-bold' : 'text-slate-900'
                      }`}>
                        {leave.status === 'Approved' ? 'APPROVED & FILED' : 'PENDING'}
                      </strong>
                      <span className="text-slate-400 text-[7px]">Directorate Seal</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[8px] italic text-slate-400 pt-1">
                [PART 1: HR DEPARTMENT ARCHIVE COPY • TO BE PRESERVED IN MASTER PERSONNEL DOSSIER]
              </div>
            </div>

            {/* ==================================================== */}
            {/* PERFORATION / TEAR-OFF LINE                         */}
            {/* ==================================================== */}
            <div className="relative py-2 text-center my-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-dashed border-slate-400"></div>
              </div>
              <div className="relative inline-flex items-center gap-1 px-3 py-1 bg-white border border-slate-300 rounded-full text-[9px] font-bold text-slate-600 tracking-wider uppercase shadow-sm">
                <span>✂ CUT / TEAR ALONG THIS LINE</span>
                <span className="text-slate-300 mx-1">|</span>
                <span className="text-amber-700">PART B: EMPLOYEE ACKNOWLEDGMENT COPY</span>
                <span>✂</span>
              </div>
            </div>

            {/* ==================================================== */}
            {/* PART 2: EMPLOYEE COPY (SANCTION SLIP)               */}
            {/* ==================================================== */}
            <div className="border border-slate-300 rounded-lg p-3.5 bg-white space-y-3">
              {/* Part 2 Header */}
              <div className="flex justify-between items-start pb-2 border-b-2 border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-800 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wide">
                      Part 2: Employee Copy
                    </span>
                    <h1 className="text-xs font-black tracking-tight text-slate-950 uppercase">
                      LESYNC PMS & RESORT MANAGEMENT
                    </h1>
                  </div>
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mt-0.5">
                    Official Leave Approval Slip & Duty Resumption Pass (Staff Copy)
                  </p>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div className="text-right">
                    <span className="block text-[8px] font-bold text-slate-400 uppercase font-mono">Ref: {leave.id}</span>
                    <span className="text-[9px] text-slate-600">Issue Date: {new Date().toISOString().split('T')[0]}</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                    leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                    leave.status === 'Rejected' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                    'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {leave.status}
                  </span>
                </div>
              </div>

              {/* 1. Staff Information */}
              <div>
                <h3 className="font-bold text-[10px] uppercase text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 mb-1.5">
                  1. Staff Information & Identification
                </h3>
                <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-[10px] px-1">
                  <div><span className="text-slate-500">Staff ID:</span> <strong className="text-slate-900 ml-1">{empCode}</strong></div>
                  <div><span className="text-slate-500">Staff Name:</span> <strong className="text-slate-900 ml-1">{empName}</strong></div>
                  <div><span className="text-slate-500">Department:</span> <strong className="text-slate-900 ml-1">{empDept}</strong></div>
                  <div><span className="text-slate-500">Designation:</span> <strong className="text-slate-900 ml-1">{empDesig}</strong></div>
                  <div><span className="text-slate-500">Emergency Phone:</span> <span className="text-slate-900 ml-1">{empPhone}</span></div>
                  <div><span className="text-slate-500">Leave Station:</span> <span className="text-slate-900 ml-1">{leave.contactDuringLeave || 'On Mobile'}</span></div>
                </div>
              </div>

              {/* 2. Sanctioned Leave Period & Duty Resumption Pass */}
              <div>
                <h3 className="font-bold text-[10px] uppercase text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 mb-1.5">
                  2. Sanctioned Leave Period & Duty Resumption Pass
                </h3>
                <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-[10px] px-1">
                  <div><span className="text-slate-500">Sanctioned Type:</span> <strong className="text-amber-800 ml-1">{leave.leaveType}</strong></div>
                  <div><span className="text-slate-500">Leave Window:</span> <strong className="text-slate-900 ml-1">{leave.fromDate} to {leave.toDate}</strong></div>
                  <div><span className="text-slate-500">Approved Duration:</span> <strong className="text-slate-950 ml-1">{leave.days} Calendar Day(s)</strong></div>
                </div>

                {/* Resumption Highlight */}
                <div className="mt-2 p-2 bg-amber-50 border border-amber-300 rounded flex justify-between items-center">
                  <div>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-amber-800 block">Duty Resumption Requirement:</span>
                    <strong className="text-xs text-amber-950">
                      MANDATORY DUTY RESUMPTION DATE: {resumptionDate} (Morning Shift)
                    </strong>
                  </div>
                  <div className="text-right text-[9px] text-slate-600">
                    <span>Reliever Handover: </span>
                    <strong className="text-slate-900">{leave.relieverName || 'Duty Senior'}</strong>
                  </div>
                </div>
              </div>

              {/* 3. Balances & Compliance Rules */}
              <div>
                <h3 className="font-bold text-[10px] uppercase text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 mb-1.5">
                  3. Remaining Balance & Employee Compliance Rules
                </h3>
                <div className="grid grid-cols-2 gap-3 text-[9.5px] px-1">
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-600 font-semibold">Post-Leave Balances:</span>
                    <div className="flex gap-2">
                      <span className="text-slate-700">Annual: <strong>{annualRemain}d</strong></span>
                      <span className="text-slate-700">Casual: <strong>{casualRemain}d</strong></span>
                      <span className="text-slate-700">Medical: <strong>{medicalRemain}d</strong></span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-200 text-[8.5px] text-slate-500 leading-tight">
                    • Report on resumption date. Extensions require 48h advance notice.
                    <br />• Retain this slip as proof of authorized leave for payroll reconciliation.
                  </div>
                </div>
              </div>

              {/* 4. Dual Sign-off & Stamp */}
              <div>
                <h3 className="font-bold text-[10px] uppercase text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 mb-1.5">
                  4. Receipt Acknowledgment & Issuing Validation
                </h3>
                <div className="grid grid-cols-2 gap-3 text-[9px]">
                  <div className="border border-slate-300 p-2 rounded flex flex-col justify-between h-16 bg-slate-50/50">
                    <span className="font-bold text-slate-600 uppercase text-[8px]">Employee Acknowledgment</span>
                    <div className="border-b border-slate-300 my-0.5"></div>
                    <div>
                      <strong className="block text-slate-900 text-[8.5px]">{empName} (Staff Signature)</strong>
                      <span className="text-slate-400 text-[7px]">I acknowledge receipt and commit to resume on schedule</span>
                    </div>
                  </div>
                  <div className="border border-slate-300 p-2 rounded flex flex-col justify-between h-16 bg-slate-50/50">
                    <span className="font-bold text-slate-600 uppercase text-[8px]">HR Directorate Seal & Sanction</span>
                    <div className="border-b border-slate-300 my-0.5"></div>
                    <div>
                      <strong className="block text-emerald-700 font-bold text-[8.5px]">
                        {leave.reviewedBy || 'HR Directorate Executive Seal'}
                      </strong>
                      <span className="text-slate-400 text-[7px]">OFFICIAL STAMP & VERIFIED SIGN-OFF</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[8px] italic text-slate-400 pt-1 flex justify-between">
                <span>LESync PMS HR Module • Two-Part Single A4 Leave Record • Ref: {leave.id}</span>
                <span>Page 1 of 1</span>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-400">
            Clicking <strong>Download PDF</strong> generates the two-part single A4 page vector PDF.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
