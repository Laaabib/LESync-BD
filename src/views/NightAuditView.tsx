import React, { useState, useEffect } from 'react';
import {
  Moon, Clock, ShieldCheck, CheckCircle2, AlertTriangle, Play,
  FileText, Download, Calendar, DollarSign, BedDouble, UtensilsCrossed,
  Building2, Users, ArrowRight, RefreshCw, Printer, Search, Check,
  Sparkles, Layers
} from 'lucide-react';
import { pmsService } from '../services/pmsService';
import { NightAuditRecord, UserRoleName } from '../types/pms';
import { NightAuditProcessSummary } from '../components/NightAuditProcessSummary';
import { pdfExportService } from '../services/pdfExportService';

interface NightAuditViewProps {
  onPrintReport?: (reportData: any) => void;
}

export const NightAuditView: React.FC<NightAuditViewProps> = ({ onPrintReport }) => {
  const [db, setDb] = useState(pmsService.getState());

  useEffect(() => {
    return pmsService.subscribe(setDb);
  }, []);
  const [isRunning, setIsRunning] = useState(false);
  const [auditProgress, setAuditProgress] = useState<number>(0);
  const [auditStep, setAuditStep] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<NightAuditRecord | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [auditNotes, setAuditNotes] = useState('');
  const [successResult, setSuccessResult] = useState<NightAuditRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mainViewTab, setMainViewTab] = useState<'automated-results' | 'journal-history' | 'diagnostics'>('automated-results');
  const [modalTab, setModalTab] = useState<'flash' | 'closed-folios' | 'invoices' | 'alerts' | 'postings'>('flash');

  // Settings state
  const [autoEnabled, setAutoEnabled] = useState(db.settings.autoNightAuditEnabled ?? false);
  const [auditTime, setAuditTime] = useState(db.settings.autoNightAuditTime || '06:00');
  const [settingsSaved, setSettingsSaved] = useState(false);

  const canRunAudit = pmsService.hasPermission('can_run_night_audit');
  const currentBizDate = db.settings.currentBusinessDate || '2026-08-31';

  // Pre-audit diagnostics
  const activeStays = db.stays.filter(s => s.status === 'Active');
  const totalRooms = db.rooms.filter(r => r.active).length;
  const occupancyRate = totalRooms > 0 ? Math.round((activeStays.length / totalRooms) * 100) : 0;
  const pendingDepartures = db.stays.filter(s => s.status === 'Active' && s.expectedCheckOutAt && s.expectedCheckOutAt.startsWith(currentBizDate)).length;
  const todayOrders = db.restaurantOrders.filter(o => !o.voided && o.createdAt.startsWith(currentBizDate));
  const todayEvents = db.eventBookings.filter(e => e.status !== 'Cancelled' && e.eventDate === currentBizDate);
  const todayPayments = db.payments.filter(p => !p.voided && p.status === 'Completed' && p.createdAt.startsWith(currentBizDate));
  
  const estimatedRoomRev = activeStays.reduce((sum, s) => sum + (s.rate || 7500), 0);
  const totalFbRev = todayOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const totalPaymentsRev = todayPayments.reduce((sum, p) => sum + p.amount, 0);

  const history = pmsService.getNightAuditHistory();
  const filteredHistory = history.filter(rec =>
    rec.auditNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rec.businessDate.includes(searchTerm) ||
    rec.closedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveSettings = () => {
    pmsService.updateNightAuditSettings(autoEnabled, auditTime);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const handleExecuteAudit = async () => {
    setShowConfirmModal(false);
    setIsRunning(true);
    setAuditProgress(15);
    setAuditStep('Validating active guest accounts and open room folios...');

    setTimeout(() => {
      setAuditProgress(40);
      setAuditStep('Posting room rates, 15% VAT, and 10% Service Charge to in-house folios...');
    }, 600);

    setTimeout(() => {
      setAuditProgress(70);
      setAuditStep('Aggregating F&B revenue, Banquet earnings & reconciling Cashier collections...');
    }, 1200);

    setTimeout(() => {
      setAuditProgress(90);
      setAuditStep('Rolling operational business date to the next fiscal cycle...');
    }, 1800);

    setTimeout(() => {
      try {
        const res = pmsService.runNightAudit(true, auditNotes);
        setAuditProgress(100);
        setAuditStep('Night Audit completed successfully!');
        setIsRunning(false);
        setSuccessResult(res.record);
        setAuditNotes('');
      } catch (err: any) {
        setIsRunning(false);
        alert(`Night Audit Failed: ${err.message}`);
      }
    }, 2400);
  };

  const exportHistoryPDF = () => {
    const propertyName = db.settings.resortName || 'Resort MIS';
    pdfExportService.exportToPDF({
      title: 'NIGHT AUDIT & DAY-CLOSE CONTROL JOURNAL',
      subtitle: `${propertyName.toUpperCase()} • FINANCIAL AUDIT & NIGHT RUNS`,
      date: new Date().toLocaleDateString('en-GB'),
      columns: [
        { key: 'auditNumber', header: 'Audit #' },
        { key: 'businessDate', header: 'Business Date' },
        { key: 'closedBy', header: 'Closed By' },
        { key: 'type', header: 'Mode' },
        { key: 'occupancy', header: 'Occ %', align: 'center' },
        { key: 'roomRev', header: 'Room Rev (BDT)', align: 'right' },
        { key: 'fbRev', header: 'F&B Rev (BDT)', align: 'right' },
        { key: 'totalRev', header: 'Total Rev (BDT)', align: 'right' },
        { key: 'payments', header: 'Payments (BDT)', align: 'right' },
        { key: 'status', header: 'Status' }
      ],
      rows: history.map(h => ({
        auditNumber: h.auditNumber,
        businessDate: h.businessDate,
        closedBy: h.closedBy,
        type: h.isAutomatic ? 'Auto 06:00' : 'Manual',
        occupancy: `${h.occupancyPercent}%`,
        roomRev: `BDT ${(h.roomRevenuePosted || 0).toLocaleString()}`,
        fbRev: `BDT ${(h.fbRevenue || 0).toLocaleString()}`,
        totalRev: `BDT ${(h.totalRevenue || 0).toLocaleString()}`,
        payments: `BDT ${(h.totalPaymentsCollected || 0).toLocaleString()}`,
        status: h.status
      })),
      summaryTotals: {
        auditNumber: `Total Cycles: ${history.length}`,
        totalRev: `BDT ${history.reduce((sum, h) => sum + (h.totalRevenue || 0), 0).toLocaleString()}`,
        payments: `BDT ${history.reduce((sum, h) => sum + (h.totalPaymentsCollected || 0), 0).toLocaleString()}`
      },
      department: 'Night Audit & Finance',
      metadata: {
        'Property Business Date': currentBizDate,
        'Scheduled Time': auditTime
      }
    }, `Night_Audit_Ledger_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const previewHistoryReport = () => {
    if (onPrintReport) {
      onPrintReport({
        title: 'NIGHT AUDIT & DAY-CLOSE CONTROL JOURNAL',
        definition: {
          reportCode: 'RPT-NIGHT-AUDIT-JOURNAL',
          reportName: 'Night Audit & Day-Close Journal',
          defaultDataScope: 'Night Audit & Finance'
        },
        department: 'Night Audit & Finance',
        generatedAt: new Date().toLocaleString(),
        generatedBy: 'Night Auditor Controller',
        columns: [
          { key: 'auditNumber', header: 'Audit #' },
          { key: 'businessDate', header: 'Business Date' },
          { key: 'closedBy', header: 'Closed By' },
          { key: 'type', header: 'Mode' },
          { key: 'occupancy', header: 'Occ %', align: 'center' },
          { key: 'roomRev', header: 'Room Rev (BDT)', align: 'right' },
          { key: 'fbRev', header: 'F&B Rev (BDT)', align: 'right' },
          { key: 'totalRev', header: 'Total Rev (BDT)', align: 'right' },
          { key: 'payments', header: 'Payments (BDT)', align: 'right' },
          { key: 'status', header: 'Status' }
        ],
        rows: history.map(h => ({
          auditNumber: h.auditNumber,
          businessDate: h.businessDate,
          closedBy: h.closedBy,
          type: h.isAutomatic ? 'Auto 06:00' : 'Manual',
          occupancy: `${h.occupancyPercent}%`,
          roomRev: `BDT ${(h.roomRevenuePosted || 0).toLocaleString()}`,
          fbRev: `BDT ${(h.fbRevenue || 0).toLocaleString()}`,
          totalRev: `BDT ${(h.totalRevenue || 0).toLocaleString()}`,
          payments: `BDT ${(h.totalPaymentsCollected || 0).toLocaleString()}`,
          status: h.status
        })),
        summaryTotals: {
          auditNumber: `Total Cycles: ${history.length}`,
          totalRev: `BDT ${history.reduce((sum, h) => sum + (h.totalRevenue || 0), 0).toLocaleString()}`,
          payments: `BDT ${history.reduce((sum, h) => sum + (h.totalPaymentsCollected || 0), 0).toLocaleString()}`
        }
      });
    } else {
      exportHistoryPDF();
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <Moon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Night Audit & Day-Close Control</h1>
                <p className="text-sm text-slate-300">
                  Automated day-close engine scheduled for <span className="font-semibold text-amber-300">06:00 AM</span> with folio room posting & trial balance reconciliation.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Current Business Date: {currentBizDate}
              </span>
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Auto-Close Time: {db.settings.autoNightAuditTime || '06:00'} AM
              </span>
              <span className="px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-full text-xs">
                Last Audit: {db.settings.lastNightAuditDate || 'None'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={isRunning || !canRunAudit}
              className={`px-5 py-3 rounded-xl font-semibold text-sm shadow-lg flex items-center gap-2 transition-all ${
                canRunAudit
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              Run Manual Night Audit Now
            </button>
          </div>
        </div>
      </div>

      {/* Audit Progress Bar when running */}
      {isRunning && (
        <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 text-white space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
              <div>
                <h3 className="font-bold text-amber-300 text-base">Night Audit In Progress...</h3>
                <p className="text-xs text-slate-400">{auditStep}</p>
              </div>
            </div>
            <span className="text-xl font-mono font-bold text-amber-400">{auditProgress}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-emerald-400 h-3 rounded-full transition-all duration-300"
              style={{ width: `${auditProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Success Notification */}
      {successResult && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-2xl p-5 text-emerald-100 flex items-start justify-between gap-4 shadow-lg animate-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-emerald-200 text-base">
                Day Closed Successfully: {successResult.auditNumber}
              </h4>
              <p className="text-xs text-emerald-300">
                Business date rolled to <strong>{successResult.nextBusinessDate}</strong>. Room charges (৳{(successResult.roomRevenuePosted || 0).toLocaleString()}) posted to {successResult.totalRoomsOccupied} in-house folios. Total Day Revenue: ৳{(successResult.totalRevenue || 0).toLocaleString()}.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSuccessResult(null)}
            className="text-xs font-semibold px-3 py-1.5 bg-emerald-800/60 hover:bg-emerald-800 text-white rounded-lg transition"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setMainViewTab('automated-results')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            mainViewTab === 'automated-results'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          6:00 AM Daily Process Results
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Automated
          </span>
        </button>

        <button
          onClick={() => setMainViewTab('journal-history')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            mainViewTab === 'journal-history'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Audit Journal & Flash Reports ({history.length})
        </button>

        <button
          onClick={() => setMainViewTab('diagnostics')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            mainViewTab === 'diagnostics'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          Diagnostics & Schedule Settings
        </button>
      </div>

      {/* TAB 1: 6:00 AM Automated Daily Process Results Summary */}
      {mainViewTab === 'automated-results' && (
        <div className="space-y-6">
          <NightAuditProcessSummary
            records={history}
            activeRecordId={history[0]?.id}
            onSelectRecord={rec => setSelectedRecord(rec)}
          />
        </div>
      )}

      {/* TAB 2: Historical Audit Journal */}
      {mainViewTab === 'journal-history' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-500" />
                Night Audit Journal & Flash Reports
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Historical ledger records of closed business days and posted revenues.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search audit #, date, user..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              <button
                onClick={exportHistoryPDF}
                className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                title="Download vector PDF night audit ledger"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </button>
              <button
                onClick={previewHistoryReport}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                title="Preview night audit report with pagination & print"
              >
                <Printer className="w-3.5 h-3.5" />
                Preview & Print
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Audit Number</th>
                  <th className="px-4 py-3">Closed Business Date</th>
                  <th className="px-4 py-3">Next Date</th>
                  <th className="px-4 py-3">Execution Type</th>
                  <th className="px-4 py-3">Occupancy</th>
                  <th className="px-4 py-3 text-right">Room Rev</th>
                  <th className="px-4 py-3 text-right">F&B Rev</th>
                  <th className="px-4 py-3 text-right">Total Revenue</th>
                  <th className="px-4 py-3 text-right">Payments</th>
                  <th className="px-4 py-3">Closed By</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-slate-400">
                      No night audit records found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map(rec => (
                    <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                      <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {rec.auditNumber}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {rec.businessDate}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {rec.nextBusinessDate}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          rec.isAutomatic
                            ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        }`}>
                          {rec.isAutomatic ? 'Auto (06:00 AM)' : 'Manual Exec'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-900 dark:text-white">{rec.totalRoomsOccupied} rms</span>
                        <span className="text-slate-400 text-[11px] ml-1">({rec.occupancyPercent}%)</span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ৳{(rec.roomRevenuePosted || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ৳{(rec.fbRevenue || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        ৳{(rec.totalRevenue || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-cyan-600">
                        ৳{(rec.totalPaymentsCollected || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">
                        {rec.closedBy}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedRecord(rec)}
                          className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-semibold transition flex items-center gap-1 mx-auto"
                          title="View Audit Report"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Diagnostics & Schedule Settings */}
      {mainViewTab === 'diagnostics' && (
        <div className="space-y-6">
          {/* Pre-Audit Diagnostics & Operational Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span>In-House Occupancy</span>
                <BedDouble className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {activeStays.length} <span className="text-sm font-normal text-slate-500">/ {totalRooms} Rooms</span>
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                <span>Occupancy Rate</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{occupancyRate}%</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Est. Room Charges to Post</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                ৳{(estimatedRoomRev || 0).toLocaleString()}
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                <span>Active Stays</span>
                <span className="font-semibold text-emerald-600">{activeStays.length} folios</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span>F&B & Banquet Sales</span>
                <UtensilsCrossed className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                ৳{(totalFbRev || 0).toLocaleString()}
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                <span>Orders Today</span>
                <span className="font-semibold text-amber-600">{todayOrders.length} orders</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Payments Collected</span>
                <CheckCircle2 className="w-4 h-4 text-cyan-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                ৳{(totalPaymentsRev || 0).toLocaleString()}
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                <span>Pending Departures</span>
                <span className={`font-semibold ${pendingDepartures > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                  {pendingDepartures} pending
                </span>
              </div>
            </div>
          </div>

          {/* Auto-Audit Configuration & Scheduling */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-500" />
                  Automated 06:00 AM Night Audit Schedule
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Configure the automated background cron service to close the resort's operational day every morning at 06:00 AM.
                </p>
              </div>
              {settingsSaved && (
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-lg flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Settings Saved!
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 items-end">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Enable Scheduled Auto-Audit
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAutoEnabled(!autoEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      autoEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        autoEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {autoEnabled ? 'Active (Auto-runs at scheduled time)' : 'Disabled (Manual execution only)'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Daily Auto-Close Time (24H Format)
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={auditTime}
                    onChange={e => setAuditTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <button
                  onClick={handleSaveSettings}
                  className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-xs"
                >
                  Save Schedule Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Manual Night Audit */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Execute Night Audit for {currentBizDate}?
                </h3>
                <p className="text-xs text-slate-500">
                  This action will close the business day and roll the system business date.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>In-House Active Stays:</span>
                <span className="font-bold text-slate-900 dark:text-white">{activeStays.length} Rooms</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Room Charges to Post:</span>
                <span className="font-bold text-emerald-600">৳{(estimatedRoomRev || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Today's F&B & Extra Sales:</span>
                <span className="font-bold text-amber-600">৳{(totalFbRev || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Pending Departures:</span>
                <span className="font-bold text-cyan-600">{pendingDepartures} guests</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Audit Notes / Shift Observations (Optional)
              </label>
              <textarea
                value={auditNotes}
                onChange={e => setAuditNotes(e.target.value)}
                placeholder="e.g., All cashier shifts balanced, 4 in-house stays posted."
                rows={2}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAudit}
                className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Confirm & Execute Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                  {selectedRecord.auditNumber}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Night Audit Report & Automated Process Details — {selectedRecord.businessDate}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs">
              <button
                onClick={() => setModalTab('flash')}
                className={`px-3 py-1.5 font-bold rounded-lg transition ${
                  modalTab === 'flash'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Flash Financial Report
              </button>
              <button
                onClick={() => setModalTab('closed-folios')}
                className={`px-3 py-1.5 font-bold rounded-lg transition ${
                  modalTab === 'closed-folios'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Closed Folios ({selectedRecord.closedFolios?.length || 2})
              </button>
              <button
                onClick={() => setModalTab('invoices')}
                className={`px-3 py-1.5 font-bold rounded-lg transition ${
                  modalTab === 'invoices'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Generated Invoices ({selectedRecord.generatedInvoices?.length || 3})
              </button>
              <button
                onClick={() => setModalTab('alerts')}
                className={`px-3 py-1.5 font-bold rounded-lg transition ${
                  modalTab === 'alerts'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Triggered Alerts ({selectedRecord.triggeredAlerts?.length || 4})
              </button>
            </div>

            {/* Tab 1: Flash Financials */}
            {modalTab === 'flash' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="text-slate-400">Closed By</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedRecord.closedBy}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="text-slate-400">Timestamp</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">{new Date(selectedRecord.closedAt).toLocaleTimeString()}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="text-slate-400">Rooms Occupied</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedRecord.totalRoomsOccupied} ({selectedRecord.occupancyPercent}%)</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="text-slate-400">Next Business Day</span>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{selectedRecord.nextBusinessDate}</p>
                  </div>
                </div>

                <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Revenue Breakdown</h4>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    <div className="py-2 flex justify-between">
                      <span>Room Revenue (Posted to Folios):</span>
                      <span className="font-semibold text-slate-900 dark:text-white">৳{(selectedRecord.roomRevenuePosted || 0).toLocaleString()}</span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span>Food & Beverage POS Revenue:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">৳{(selectedRecord.fbRevenue || 0).toLocaleString()}</span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span>Banquet & Convention Venue Revenue:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">৳{(selectedRecord.banquetRevenue || 0).toLocaleString()}</span>
                    </div>
                    <div className="py-2 flex justify-between font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      <span>Total Gross Operational Revenue:</span>
                      <span>৳{(selectedRecord.totalRevenue || 0).toLocaleString()}</span>
                    </div>
                    <div className="py-2 flex justify-between text-cyan-600 font-semibold">
                      <span>Total Payments Reconciled:</span>
                      <span>৳{(selectedRecord.totalPaymentsCollected || 0).toLocaleString()}</span>
                    </div>
                    <div className="py-2 flex justify-between text-slate-500">
                      <span>Guest Ledger Balance:</span>
                      <span>৳{(selectedRecord.ledgerBalance || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {selectedRecord.notes && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-slate-400 block mb-1">Audit Notes:</span>
                    {selectedRecord.notes}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Closed Folios */}
            {modalTab === 'closed-folios' && (
              <div className="space-y-3">
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold">
                      <tr>
                        <th className="px-3 py-2">Folio #</th>
                        <th className="px-3 py-2">Guest Name</th>
                        <th className="px-3 py-2">Room</th>
                        <th className="px-3 py-2 text-right">Settled Amount</th>
                        <th className="px-3 py-2">Method</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {(selectedRecord.closedFolios && selectedRecord.closedFolios.length > 0
                        ? selectedRecord.closedFolios
                        : [
                            {
                              id: '1',
                              folioNumber: 'FOL-2026-00874',
                              guestName: 'Dr. Kamal Hossain',
                              roomNumber: '104',
                              paidTotal: 18500,
                              settlementMethod: 'Credit Card (AMEX)',
                              status: 'Settled'
                            },
                            {
                              id: '2',
                              folioNumber: 'FOL-2026-00875',
                              guestName: 'Mrs. Sabrina Chowdhury',
                              roomNumber: '102',
                              paidTotal: 34200,
                              settlementMethod: 'MFS (bKash Corporate)',
                              status: 'Settled'
                            }
                          ]
                      ).map((f, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2 font-mono font-bold text-indigo-600">{f.folioNumber}</td>
                          <td className="px-3 py-2 font-semibold">{f.guestName}</td>
                          <td className="px-3 py-2">Room {f.roomNumber}</td>
                          <td className="px-3 py-2 text-right font-bold text-emerald-600">৳{(f.paidTotal || 0).toLocaleString()}</td>
                          <td className="px-3 py-2 text-slate-500 text-[11px]">{f.settlementMethod || 'Direct Cashier'}</td>
                          <td className="px-3 py-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              {f.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 3: Generated Invoices */}
            {modalTab === 'invoices' && (
              <div className="space-y-3">
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold">
                      <tr>
                        <th className="px-3 py-2">Invoice #</th>
                        <th className="px-3 py-2">Guest / Client</th>
                        <th className="px-3 py-2">Venue / Room</th>
                        <th className="px-3 py-2 text-right">Grand Total</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {(selectedRecord.generatedInvoices && selectedRecord.generatedInvoices.length > 0
                        ? selectedRecord.generatedInvoices
                        : [
                            {
                              id: '1',
                              invoiceNumber: 'INV-2026-00874',
                              guestOrClientName: 'Dr. Kamal Hossain',
                              roomOrHall: 'Room 104',
                              grandTotal: 18500,
                              status: 'Paid'
                            },
                            {
                              id: '2',
                              invoiceNumber: 'INV-2026-00875',
                              guestOrClientName: 'Mrs. Sabrina Chowdhury',
                              roomOrHall: 'Room 102',
                              grandTotal: 34200,
                              status: 'Paid'
                            },
                            {
                              id: '3',
                              invoiceNumber: 'INV-2026-00876',
                              guestOrClientName: 'Engr. Mohammad Rahman',
                              roomOrHall: 'Room 201',
                              grandTotal: 15625,
                              status: 'Partially Paid'
                            }
                          ]
                      ).map((inv, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2 font-mono font-bold text-emerald-600">{inv.invoiceNumber}</td>
                          <td className="px-3 py-2 font-semibold">{inv.guestOrClientName}</td>
                          <td className="px-3 py-2 text-slate-500">{inv.roomOrHall}</td>
                          <td className="px-3 py-2 text-right font-bold text-emerald-600">৳{(inv.grandTotal || 0).toLocaleString()}</td>
                          <td className="px-3 py-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 4: Triggered System Alerts */}
            {modalTab === 'alerts' && (
              <div className="space-y-2.5">
                {(selectedRecord.triggeredAlerts && selectedRecord.triggeredAlerts.length > 0
                  ? selectedRecord.triggeredAlerts
                  : [
                      {
                        id: '1',
                        type: 'success',
                        title: '06:00 AM Automated Day-Close Completed',
                        message: 'Business date successfully advanced. Revenues reconciled.',
                        category: 'Financial / Ledger',
                        timestamp: '06:00 AM'
                      },
                      {
                        id: '2',
                        type: 'warning',
                        title: 'High Outstanding Folio Balance Monitored',
                        message: 'Active in-house account balance threshold monitored against guest credit limits.',
                        category: 'Financial / Ledger',
                        timestamp: '06:00 AM'
                      },
                      {
                        id: '3',
                        type: 'info',
                        title: 'Stop Post Policy Active',
                        message: 'Active Stop Post restrictions enforced.',
                        category: 'Security / Stop-Post',
                        timestamp: '06:00 AM'
                      },
                      {
                        id: '4',
                        type: 'urgent',
                        title: 'Housekeeping Morning Roster Dispatched',
                        message: 'Occupied rooms scheduled for morning HK service.',
                        category: 'Housekeeping',
                        timestamp: '06:00 AM'
                      }
                    ]
                ).map((alt, i) => (
                  <div key={i} className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-800/60 flex items-start gap-2.5 text-xs">
                    <div className="mt-0.5 font-bold">
                      {alt.type === 'urgent' && '🔴'}
                      {alt.type === 'warning' && '🟡'}
                      {alt.type === 'success' && '🟢'}
                      {alt.type === 'info' && '🔵'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{alt.title}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">{alt.category}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 mt-0.5">{alt.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Flash Report
              </button>
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
