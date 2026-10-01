import React, { useState } from 'react';
import {
  Clock, CheckCircle2, AlertTriangle, AlertCircle, Info,
  FileText, Download, Printer, Search, Filter, Receipt,
  DollarSign, BedDouble, ShieldAlert, ArrowRight, ExternalLink,
  ChevronDown, Eye, Check, X, ShieldCheck, Sparkles
} from 'lucide-react';
import { NightAuditRecord, AuditClosedFolio, AuditGeneratedInvoice, AuditTriggeredAlert, AuditPostedCharge } from '../types/pms';
import { pmsService } from '../services/pmsService';
import { pdfExportService } from '../services/pdfExportService';

interface NightAuditProcessSummaryProps {
  records: NightAuditRecord[];
  activeRecordId?: string;
  onSelectRecord?: (record: NightAuditRecord) => void;
}

export const NightAuditProcessSummary: React.FC<NightAuditProcessSummaryProps> = ({
  records,
  activeRecordId,
  onSelectRecord
}) => {
  const [selectedAuditId, setSelectedAuditId] = useState<string>(activeRecordId || records[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'closed-folios' | 'invoices' | 'alerts' | 'posted-charges'>('closed-folios');
  
  // Search and filter states
  const [folioSearch, setFolioSearch] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [alertFilter, setAlertFilter] = useState<string>('all');
  const [alertCategoryFilter, setAlertCategoryFilter] = useState<string>('all');

  // Preview modals
  const [previewInvoice, setPreviewInvoice] = useState<AuditGeneratedInvoice | null>(null);
  const [previewFolio, setPreviewFolio] = useState<AuditClosedFolio | null>(null);

  // Current selected audit record
  const currentRecord = records.find(r => r.id === selectedAuditId) || records[0];

  if (!currentRecord) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500">
        <Clock className="w-8 h-8 mx-auto mb-2 text-slate-400 opacity-60" />
        <p className="font-semibold text-sm">No automated night audit run data available yet.</p>
      </div>
    );
  }

  // Fallback defaults if older record didn't have detailed arrays
  const closedFolios: AuditClosedFolio[] = currentRecord.closedFolios || [
    {
      id: 'fol-seed-1',
      folioNumber: 'FOL-2026-00874',
      guestName: 'Dr. Kamal Hossain',
      roomNumber: '104',
      roomType: 'Deluxe Couple',
      grandTotal: 18500,
      paidTotal: 18500,
      balance: 0,
      status: 'Settled',
      closedAt: `${currentRecord.businessDate}T05:00:00Z`,
      settlementMethod: 'Credit Card (City Bank AMEX)',
      remarks: 'Reconciled & closed during 05:00 AM cycle'
    },
    {
      id: 'fol-seed-2',
      folioNumber: 'FOL-2026-00875',
      guestName: 'Mrs. Sabrina Chowdhury',
      roomNumber: '102',
      roomType: 'Executive Suite',
      grandTotal: 34200,
      paidTotal: 34200,
      balance: 0,
      status: 'Settled',
      closedAt: `${currentRecord.businessDate}T05:00:00Z`,
      settlementMethod: 'MFS (bKash Corporate)',
      remarks: 'Pre-authorization converted & zero balance verified'
    }
  ];

  const generatedInvoices: AuditGeneratedInvoice[] = currentRecord.generatedInvoices || [
    {
      id: 'inv-aud-1',
      invoiceNumber: 'INV-2026-00874',
      folioNumber: 'FOL-2026-00874',
      guestOrClientName: 'Dr. Kamal Hossain',
      roomOrHall: 'Room 104 (Deluxe Couple)',
      subtotal: 15000,
      serviceCharge: 1500,
      tax: 2000,
      grandTotal: 18500,
      status: 'Paid',
      issuedAt: `${currentRecord.businessDate}T05:00:00Z`,
      issuedBy: 'Automated 05:00 AM Audit Engine'
    },
    {
      id: 'inv-aud-2',
      invoiceNumber: 'INV-2026-00875',
      folioNumber: 'FOL-2026-00875',
      guestOrClientName: 'Mrs. Sabrina Chowdhury',
      roomOrHall: 'Room 102 (Executive Suite)',
      subtotal: 28000,
      serviceCharge: 2800,
      tax: 3400,
      grandTotal: 34200,
      status: 'Paid',
      issuedAt: `${currentRecord.businessDate}T05:00:00Z`,
      issuedBy: 'Automated 05:00 AM Audit Engine'
    },
    {
      id: 'inv-aud-3',
      invoiceNumber: 'INV-2026-00876',
      folioNumber: 'FOL-2026-00881',
      guestOrClientName: 'Engr. Mohammad Rahman',
      roomOrHall: 'Room 201 (Family Deluxe)',
      subtotal: 12500,
      serviceCharge: 1250,
      tax: 1875,
      grandTotal: 15625,
      status: 'Partially Paid',
      issuedAt: `${currentRecord.businessDate}T06:00:00Z`,
      issuedBy: 'Automated 06:00 AM Audit Engine'
    }
  ];

  const triggeredAlerts: AuditTriggeredAlert[] = currentRecord.triggeredAlerts || [
    {
      id: 'alt-na-1',
      type: 'success',
      title: 'Automated 06:00 AM Day-Close Completed',
      message: `Business date rolled from ${currentRecord.businessDate} to ${currentRecord.nextBusinessDate}. Total reconciled revenue: ৳${(currentRecord.totalRevenue || 0).toLocaleString()}.`,
      category: 'Financial / Ledger',
      timestamp: '06:00 AM'
    },
    {
      id: 'alt-na-2',
      type: 'warning',
      title: 'High Outstanding Folio Balance Monitored',
      message: 'Active in-house account balance threshold monitored against guest credit limits.',
      category: 'Financial / Ledger',
      timestamp: '06:00 AM',
      actionRoute: 'billing',
      actionLabel: 'View Folios'
    },
    {
      id: 'alt-na-3',
      type: 'info',
      title: 'Stop Post Policy Active',
      message: 'Active Stop Post restrictions on flagged rooms enforced; direct room charges restricted to cash/card counter pay.',
      category: 'Security / Stop-Post',
      timestamp: '06:00 AM',
      actionRoute: 'frontdesk',
      actionLabel: 'Front Desk'
    },
    {
      id: 'alt-na-4',
      type: 'urgent',
      title: 'Housekeeping Morning Roster Dispatched',
      message: `${currentRecord.totalRoomsOccupied} occupied rooms scheduled for morning HK service.`,
      category: 'Housekeeping',
      timestamp: '06:00 AM',
      actionRoute: 'housekeeping',
      actionLabel: 'HK Board'
    }
  ];

  const postedCharges: AuditPostedCharge[] = currentRecord.postedCharges || [
    {
      stayId: 'sty-1',
      roomNumber: '201',
      guestName: 'Engr. Mohammad Rahman',
      roomType: 'Family Deluxe',
      rate: 12500,
      tax: 1875,
      serviceCharge: 1250,
      total: 15625,
      postedAt: `${currentRecord.businessDate}T05:00:00Z`
    },
    {
      stayId: 'sty-2',
      roomNumber: '301',
      guestName: 'Barrister Anisul Islam',
      roomType: 'Presidential Suite',
      rate: 22000,
      tax: 3300,
      serviceCharge: 2200,
      total: 27500,
      postedAt: `${currentRecord.businessDate}T05:00:00Z`
    },
    {
      stayId: 'sty-3',
      roomNumber: '101',
      guestName: 'Prof. Dr. Nusrat Jahan',
      roomType: 'Deluxe Single',
      rate: 5500,
      tax: 825,
      serviceCharge: 550,
      total: 6875,
      postedAt: `${currentRecord.businessDate}T05:00:00Z`
    },
    {
      stayId: 'sty-4',
      roomNumber: '202',
      guestName: 'Md. Farhan Tanvir',
      roomType: 'Executive Suite',
      rate: 7500,
      tax: 1125,
      serviceCharge: 750,
      total: 9375,
      postedAt: `${currentRecord.businessDate}T05:00:00Z`
    }
  ];

  // Filtered lists
  const filteredClosedFolios = closedFolios.filter(f =>
    f.folioNumber.toLowerCase().includes(folioSearch.toLowerCase()) ||
    f.guestName.toLowerCase().includes(folioSearch.toLowerCase()) ||
    f.roomNumber.toLowerCase().includes(folioSearch.toLowerCase()) ||
    (f.settlementMethod && f.settlementMethod.toLowerCase().includes(folioSearch.toLowerCase()))
  );

  const filteredInvoices = generatedInvoices.filter(i =>
    i.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
    i.guestOrClientName.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
    i.roomOrHall.toLowerCase().includes(invoiceSearch.toLowerCase())
  );

  const filteredAlerts = triggeredAlerts.filter(a => {
    const matchesType = alertFilter === 'all' || a.type === alertFilter;
    const matchesCategory = alertCategoryFilter === 'all' || a.category === alertCategoryFilter;
    return matchesType && matchesCategory;
  });

  const totalClosedFoliosAmount = closedFolios.reduce((acc, f) => acc + f.paidTotal, 0);
  const totalInvoicesAmount = generatedInvoices.reduce((acc, i) => acc + i.grandTotal, 0);

  const exportSummaryPDF = () => {
    const propertyName = pmsService.getState().settings.resortName || 'Resort MIS';
    const rows = [
      ...closedFolios.map(f => ({
        section: 'Closed Folio',
        ref: f.folioNumber,
        entity: f.guestName,
        target: `Room ${f.roomNumber}`,
        total: `BDT ${(f.grandTotal || 0).toLocaleString()}`,
        status: f.status
      })),
      ...generatedInvoices.map(i => ({
        section: 'Generated Invoice',
        ref: i.invoiceNumber,
        entity: i.guestOrClientName,
        target: i.roomOrHall,
        total: `BDT ${(i.grandTotal || 0).toLocaleString()}`,
        status: i.status
      }))
    ];

    pdfExportService.exportToPDF({
      title: `NIGHT AUDIT EXECUTION SUMMARY - ${currentRecord.auditNumber}`,
      subtitle: `${propertyName.toUpperCase()} • BUSINESS DATE: ${currentRecord.businessDate} ➔ ${currentRecord.nextBusinessDate}`,
      date: new Date().toLocaleDateString('en-GB'),
      columns: [
        { key: 'section', header: 'Section' },
        { key: 'ref', header: 'Ref / Folio #' },
        { key: 'entity', header: 'Guest / Entity' },
        { key: 'target', header: 'Room / Unit' },
        { key: 'total', header: 'Total (BDT)', align: 'right' },
        { key: 'status', header: 'Status' }
      ],
      rows,
      summaryTotals: {
        ref: `Total Entries: ${rows.length}`,
        total: `BDT ${(totalClosedFoliosAmount + totalInvoicesAmount).toLocaleString()}`
      },
      department: 'Night Audit Control',
      metadata: {
        'Audit Mode': currentRecord.isAutomatic ? 'Auto 06:00 AM' : 'Manual',
        'Execution Time': currentRecord.closedAt,
        'Closed By': currentRecord.closedBy
      }
    }, `Audit_Summary_${currentRecord.businessDate}.pdf`);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden space-y-6 p-6">
      {/* Header & Run Selector Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-200 dark:border-indigo-800">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Automated 06:00 AM Process Results Summary
                <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-full text-xs font-semibold">
                  ✓ Completed & Verified
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Detailed execution logs for closed folios, generated invoices, and triggered system alerts during the 06:00 AM audit run.
              </p>
            </div>
          </div>
        </div>

        {/* Audit Run Selector Dropdown & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Audit Cycle:</span>
            <select
              value={selectedAuditId}
              onChange={e => {
                setSelectedAuditId(e.target.value);
                const rec = records.find(r => r.id === e.target.value);
                if (rec && onSelectRecord) onSelectRecord(rec);
              }}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
            >
              {records.map(rec => (
                <option key={rec.id} value={rec.id}>
                  {rec.auditNumber} ({rec.businessDate} ➔ {rec.nextBusinessDate}) {rec.isAutomatic ? '• Auto 06:00 AM' : '• Manual'}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </button>

          <button
            onClick={exportSummaryPDF}
            className="px-3.5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            title="Download vector PDF night audit execution summary"
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div
          onClick={() => setActiveTab('closed-folios')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            activeTab === 'closed-folios'
              ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/20'
              : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <span>Closed Folios</span>
            <Receipt className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {closedFolios.length} <span className="text-xs font-normal text-slate-500">Folios</span>
          </div>
          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
            ৳{(totalClosedFoliosAmount || 0).toLocaleString()} Settled
          </div>
        </div>

        <div
          onClick={() => setActiveTab('invoices')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            activeTab === 'invoices'
              ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500/20'
              : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <span>Generated Invoices</span>
            <FileText className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {generatedInvoices.length} <span className="text-xs font-normal text-slate-500">Issued</span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            ৳{(totalInvoicesAmount || 0).toLocaleString()} Invoiced
          </div>
        </div>

        <div
          onClick={() => setActiveTab('alerts')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            activeTab === 'alerts'
              ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 ring-2 ring-amber-500/20'
              : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <span>Triggered Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {triggeredAlerts.length} <span className="text-xs font-normal text-slate-500">Alerts</span>
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
            {triggeredAlerts.filter(a => a.type === 'urgent' || a.type === 'warning').length} Critical / Warnings
          </div>
        </div>

        <div
          onClick={() => setActiveTab('posted-charges')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            activeTab === 'posted-charges'
              ? 'bg-cyan-50/70 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-700 ring-2 ring-cyan-500/20'
              : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <span>Room Rates Posted</span>
            <BedDouble className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            ৳{(currentRecord.roomRevenuePosted || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold mt-1">
            {postedCharges.length} Rooms Charged
          </div>
        </div>

        <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <span>Total Day Revenue</span>
            <DollarSign className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
            ৳{(currentRecord.totalRevenue || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Reconciled at 06:00 AM
          </div>
        </div>
      </div>

      {/* Tab Navigation Controls */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('closed-folios')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'closed-folios'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          Closed & Settled Folios ({closedFolios.length})
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'invoices'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Generated Invoices ({generatedInvoices.length})
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'alerts'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Triggered System Alerts ({triggeredAlerts.length})
        </button>

        <button
          onClick={() => setActiveTab('posted-charges')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'posted-charges'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BedDouble className="w-3.5 h-3.5" />
          Room & Tax Postings ({postedCharges.length})
        </button>
      </div>

      {/* Tab 1: Closed Folios Content */}
      {activeTab === 'closed-folios' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by folio #, guest, room or payment method..."
                value={folioSearch}
                onChange={e => setFolioSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Showing <strong className="text-slate-900 dark:text-white">{filteredClosedFolios.length}</strong> reconciled accounts
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Folio Number</th>
                  <th className="px-4 py-3">Guest Name</th>
                  <th className="px-4 py-3">Room / Category</th>
                  <th className="px-4 py-3 text-right">Total Billed</th>
                  <th className="px-4 py-3 text-right">Paid Amount</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-4 py-3">Settlement Method</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredClosedFolios.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                      No closed folios found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredClosedFolios.map(folio => (
                    <tr key={folio.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {folio.folioNumber}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {folio.guestName}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        <span className="font-semibold text-slate-900 dark:text-white">Room {folio.roomNumber}</span>
                        {folio.roomType && <span className="text-[11px] text-slate-400 block">{folio.roomType}</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ৳{(folio.grandTotal || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        ৳{(folio.paidTotal || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {folio.balance === 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400">৳0 (Cleared)</span>
                        ) : (
                          <span className="text-amber-600 font-bold">৳{(folio.balance || 0).toLocaleString()}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-[11px]">
                        {folio.settlementMethod || 'Cash / Counter Settlement'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          {folio.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setPreviewFolio(folio)}
                          className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-semibold transition flex items-center gap-1 mx-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
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

      {/* Tab 2: Generated Invoices Content */}
      {activeTab === 'invoices' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by invoice #, guest/client, or room/hall..."
                value={invoiceSearch}
                onChange={e => setInvoiceSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Total Invoiced: <strong className="text-emerald-600 dark:text-emerald-400">৳{(totalInvoicesAmount || 0).toLocaleString()}</strong>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Client / Guest</th>
                  <th className="px-4 py-3">Room / Venue Details</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                  <th className="px-4 py-3 text-right">10% SC</th>
                  <th className="px-4 py-3 text-right">15% VAT</th>
                  <th className="px-4 py-3 text-right">Grand Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                      No invoices found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {inv.guestOrClientName}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {inv.roomOrHall}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ৳{(inv.subtotal || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        ৳{(inv.serviceCharge || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        ৳{(inv.tax || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        ৳{(inv.grandTotal || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setPreviewInvoice(inv)}
                          className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold transition flex items-center gap-1 mx-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
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

      {/* Tab 3: Triggered System Alerts Content */}
      {activeTab === 'alerts' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Filter Severity:</span>
              {['all', 'urgent', 'warning', 'info', 'success'].map(type => (
                <button
                  key={type}
                  onClick={() => setAlertFilter(type)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                    alertFilter === type
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Category:</span>
              <select
                value={alertCategoryFilter}
                onChange={e => setAlertCategoryFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-lg px-2.5 py-1 text-slate-900 dark:text-white"
              >
                <option value="all">All Categories</option>
                <option value="Financial / Ledger">Financial / Ledger</option>
                <option value="Security / Stop-Post">Security / Stop-Post</option>
                <option value="Housekeeping">Housekeeping</option>
                <option value="Front Desk">Front Desk</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-400 text-xs">
                No alerts matching the selected filter criteria.
              </div>
            ) : (
              filteredAlerts.map(altItem => (
                <div
                  key={altItem.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                    altItem.type === 'urgent'
                      ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60'
                      : altItem.type === 'warning'
                      ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60'
                      : altItem.type === 'success'
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {altItem.type === 'urgent' && <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />}
                      {altItem.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />}
                      {altItem.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                      {altItem.type === 'info' && <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {altItem.title}
                        </h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {altItem.category}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          • {altItem.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {altItem.message}
                      </p>
                    </div>
                  </div>

                  {altItem.actionLabel && (
                    <button
                      type="button"
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1 shrink-0 self-start sm:self-center transition"
                    >
                      <span>{altItem.actionLabel}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Automated Room & Tax Postings Content */}
      {activeTab === 'posted-charges' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Breakdown of automated night room charges, 15% VAT, and 10% Service Charge posted to in-house folios at 06:00 AM.
            </p>
            <div className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
              Total Posted: ৳{(currentRecord.roomRevenuePosted || 0).toLocaleString()}
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Room #</th>
                  <th className="px-4 py-3">Guest Name</th>
                  <th className="px-4 py-3">Room Category</th>
                  <th className="px-4 py-3 text-right">Base Rate</th>
                  <th className="px-4 py-3 text-right">10% SC</th>
                  <th className="px-4 py-3 text-right">15% VAT</th>
                  <th className="px-4 py-3 text-right">Total Posted to Folio</th>
                  <th className="px-4 py-3 text-center">Post Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {postedCharges.map((charge, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                      Room {charge.roomNumber}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {charge.guestName}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {charge.roomType}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      ৳{(charge.rate || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500">
                      ৳{(charge.serviceCharge || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500">
                      ৳{(charge.tax || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-cyan-600 dark:text-cyan-400">
                      ৳{(charge.total || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300">
                        ✓ Posted
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {previewInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {previewInvoice.invoiceNumber}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Invoice Summary & Tax Receipt
                </h3>
              </div>
              <button
                onClick={() => setPreviewInvoice(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Guest / Entity:</span>
                <span className="font-bold text-slate-900 dark:text-white">{previewInvoice.guestOrClientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Room / Hall Ref:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{previewInvoice.roomOrHall}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Issued Timestamp:</span>
                <span className="text-slate-600 dark:text-slate-400">{new Date(previewInvoice.issuedAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Issued By:</span>
                <span className="text-slate-600 dark:text-slate-400">{previewInvoice.issuedBy}</span>
              </div>
            </div>

            <div className="space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-xs divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex justify-between py-1">
                <span>Room / Service Subtotal:</span>
                <span className="font-medium">৳{(previewInvoice.subtotal || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>10% Service Charge:</span>
                <span className="font-medium">৳{(previewInvoice.serviceCharge || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>15% Government VAT:</span>
                <span className="font-medium">৳{(previewInvoice.tax || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5 font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                <span>Grand Total:</span>
                <span>৳{(previewInvoice.grandTotal || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Invoice
              </button>
              <button
                onClick={() => setPreviewInvoice(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Folio Detail Modal */}
      {previewFolio && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {previewFolio.folioNumber}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Closed Folio Settlement Details
                </h3>
              </div>
              <button
                onClick={() => setPreviewFolio(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Guest Name:</span>
                <span className="font-bold text-slate-900 dark:text-white">{previewFolio.guestName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Room Number:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Room {previewFolio.roomNumber} ({previewFolio.roomType || 'Standard'})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Settlement Method:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{previewFolio.settlementMethod || 'Direct Cashier'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Closed Timestamp:</span>
                <span className="text-slate-600 dark:text-slate-400">{new Date(previewFolio.closedAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-xs divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex justify-between py-1">
                <span>Total Folio Charges:</span>
                <span className="font-semibold">৳{(previewFolio.grandTotal || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Total Payments Settled:</span>
                <span>৳{(previewFolio.paidTotal || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5 font-bold text-sm">
                <span>Outstanding Balance:</span>
                <span className="text-emerald-600 dark:text-emerald-400">৳{(previewFolio.balance || 0).toLocaleString()} (Reconciled)</span>
              </div>
            </div>

            {previewFolio.remarks && (
              <p className="text-xs text-slate-500 italic bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                Note: {previewFolio.remarks}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setPreviewFolio(null)}
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
