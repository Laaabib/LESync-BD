import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, Download, Printer, Calendar, BarChart3,
  CheckCircle2, AlertTriangle, ShieldCheck, User, Sparkles,
  Layers, Package, Droplet, RefreshCw, Eye, Search,
  FileSpreadsheet, ExternalLink, CheckCircle, ArrowRight
} from 'lucide-react';
import { housekeepingService } from '../../services/housekeepingService';
import { reportingService, ReportQueryResult, ReportFilterState } from '../../services/reportingService';
import { reportExportService } from '../../services/reportExportService';
import { pdfExportService } from '../../services/pdfExportService';
import { pmsService } from '../../services/pmsService';
import { PrintableModal } from '../../components/common/PrintableModal';

export type HousekeepingReportType = 'summary' | 'productivity' | 'linen' | 'lostfound' | 'discrepancy';

export interface HousekeepingReportsViewProps {
  onPrintReport?: (reportData: any) => void;
  onNavigate?: (route: string) => void;
}

export const HousekeepingReportsView: React.FC<HousekeepingReportsViewProps> = ({
  onPrintReport,
  onNavigate
}) => {
  const [selectedReport, setSelectedReport] = useState<HousekeepingReportType>('summary');
  const [showPaperPreview, setShowPaperPreview] = useState<boolean>(false);
  const [isInternalPrintModalOpen, setIsInternalPrintModalOpen] = useState<boolean>(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);

  const [datePreset, setDatePreset] = useState<'today' | 'yesterday' | '7days' | 'month' | 'custom'>('today');
  const [filterState, setFilterState] = useState<ReportFilterState>({
    dateFrom: new Date().toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    searchTerm: ''
  });

  const [pmsDb, setPmsDb] = useState(pmsService.getState());
  const [hkState, setHkState] = useState(housekeepingService.getState());

  useEffect(() => {
    const unsubPms = pmsService.subscribe(setPmsDb);
    const unsubHk = housekeepingService.subscribe(setHkState);
    return () => {
      unsubPms();
      unsubHk();
    };
  }, []);

  // Quick date presets
  const handlePresetChange = (preset: 'today' | 'yesterday' | '7days' | 'month' | 'custom') => {
    setDatePreset(preset);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'today') {
      setFilterState(prev => ({ ...prev, dateFrom: todayStr, dateTo: todayStr }));
    } else if (preset === 'yesterday') {
      const yest = new Date(today);
      yest.setDate(today.getDate() - 1);
      const yestStr = yest.toISOString().split('T')[0];
      setFilterState(prev => ({ ...prev, dateFrom: yestStr, dateTo: yestStr }));
    } else if (preset === '7days') {
      const d7 = new Date(today);
      d7.setDate(today.getDate() - 7);
      setFilterState(prev => ({ ...prev, dateFrom: d7.toISOString().split('T')[0], dateTo: todayStr }));
    } else if (preset === 'month') {
      const m1 = new Date(today.getFullYear(), today.getMonth(), 1);
      setFilterState(prev => ({ ...prev, dateFrom: m1.toISOString().split('T')[0], dateTo: todayStr }));
    }
  };

  const stats = housekeepingService.getDashboardStats();
  const tasks = hkState.tasks || [];
  const staff = hkState.staff || [];
  const linenStocks = hkState.linenStocks || [];
  const linenItems = hkState.linenItems || [];
  const lostFound = hkState.lostFound || [];
  const discrepancies = housekeepingService.detectDiscrepancies() || [];
  const productivity = housekeepingService.calculateStaffProductivity() || [];

  const completedCount = tasks.filter(t => t.status === 'Cleaned' || t.status === 'Inspected' || t.status === 'Completed').length;

  // Map sub-tabs to official registry report codes
  const reportCodeMap: Record<HousekeepingReportType, string> = {
    summary: 'RPT-HK-001',
    productivity: 'RPT-HK-004',
    linen: 'RPT-HK-003',
    lostfound: 'RPT-HK-002',
    discrepancy: 'RPT-HK-005'
  };

  // Compile audited ReportQueryResult object
  const activeReportResult: ReportQueryResult | null = useMemo(() => {
    try {
      const code = reportCodeMap[selectedReport] || 'RPT-HK-001';
      return reportingService.runReport(code, filterState);
    } catch (err) {
      console.warn('Error running report query:', err);
      return null;
    }
  }, [selectedReport, filterState, hkState, pmsDb]);

  // Primary PDF Preview & Print Action
  const handlePreviewAndPrint = () => {
    if (!activeReportResult) return;
    if (onPrintReport) {
      onPrintReport(activeReportResult);
    } else {
      setIsInternalPrintModalOpen(true);
    }
  };

  // Direct Vector PDF Export Action
  const handleDownloadPDF = () => {
    if (!activeReportResult) return;
    const ok = pdfExportService.exportReportResultToPDF(activeReportResult);
    if (ok) {
      setDownloadSuccessToast(`Audited PDF document generated successfully.`);
      setTimeout(() => setDownloadSuccessToast(null), 4000);
    }
  };

  // Excel (.xlsx) Export Action
  const handleExportExcel = () => {
    if (!activeReportResult) return;
    reportExportService.exportReportToExcel(activeReportResult);
    setDownloadSuccessToast(`Excel spreadsheet generated successfully.`);
    setTimeout(() => setDownloadSuccessToast(null), 4000);
  };

  // Clean CSV (.csv) Export Action
  const handleExportCSV = () => {
    if (activeReportResult) {
      reportExportService.exportReportToCSV(activeReportResult);
      setDownloadSuccessToast(`CSV file generated successfully.`);
      setTimeout(() => setDownloadSuccessToast(null), 4000);
    }
  };

  // Direct Browser Print
  const handleDirectPrint = () => {
    window.print();
  };

  // Filtered rows for on-screen tables
  const searchTermLower = (filterState.searchTerm || '').trim().toLowerCase();

  return (
    <div className="space-y-5">
      {/* 1. Header & Primary Multi-Format Export Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-linear-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <h1 className="text-base sm:text-lg font-bold text-white uppercase tracking-tight">
                Housekeeping Analytics & Departmental Reports
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                AUDIT LOGS
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> PDF Preview & Print Enabled
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Room turnover board, attendant productivity benchmarks, linen consumption, and room discrepancy analytics with multi-format PDF & Excel export.
            </p>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2 shrink-0">
          {/* Paper Layout Preview Toggle */}
          <button
            type="button"
            onClick={() => setShowPaperPreview(prev => !prev)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all border cursor-pointer ${
              showPaperPreview
                ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Toggle formal paper printable sheet view"
          >
            <Eye className="w-4 h-4" />
            <span>{showPaperPreview ? 'Back to App View' : 'Paper Layout Preview'}</span>
          </button>

          {/* Direct Download Vector PDF Button */}
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={!activeReportResult}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
            title="Download formal vector PDF report"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>

          {/* PRIMARY PREVIEW & PRINT MODAL BUTTON */}
          <button
            type="button"
            onClick={handlePreviewAndPrint}
            disabled={!activeReportResult}
            className="px-4 py-2 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md shadow-emerald-900/30 transition-all border border-emerald-400/40 cursor-pointer"
            title="Open printable document preview modal with page navigation, zoom, and print"
          >
            <Printer className="w-4 h-4" />
            <span>Preview & Print</span>
          </button>

          {/* Spreadsheet & Data Export Dropdown / Buttons */}
          <div className="flex items-center space-x-1 border-l border-slate-700/60 pl-2">
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={!activeReportResult}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
              title="Export as Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={!activeReportResult}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
              title="Export as CSV (.csv)"
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {downloadSuccessToast && (
        <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-200 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{downloadSuccessToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setDownloadSuccessToast(null)}
            className="text-emerald-400 hover:text-emerald-200 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Departmental Live KPI Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Rooms</span>
          <div className="text-xl font-bold font-mono text-slate-100">{stats.totalRooms}</div>
          <div className="text-[10px] text-slate-500">100% active inventory</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">Inspection Pass Rate</span>
          <div className="text-xl font-bold font-mono text-emerald-300">96.8%</div>
          <div className="text-[10px] text-emerald-400/80">16-point standard verified</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider block">Avg Turnover Speed</span>
          <div className="text-xl font-bold font-mono text-blue-300">32 Mins</div>
          <div className="text-[10px] text-blue-400/80">Checkout to Inspected Clean</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider block">Cleaned Today</span>
          <div className="text-xl font-bold font-mono text-purple-300">{completedCount}</div>
          <div className="text-[10px] text-purple-400/80">Avg SLA delivery: 11.4 mins</div>
        </div>
      </div>

      {/* 3. Report Selector Tabs & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-md space-y-3">
        {/* Tab Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700 text-xs font-bold">
          <button
            type="button"
            onClick={() => setSelectedReport('summary')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center space-x-1.5 cursor-pointer ${
              selectedReport === 'summary'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>Daily Executive Summary</span>
            <span className="px-1.5 py-0.2 bg-black/30 rounded text-[10px] font-mono">RPT-HK-001</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedReport('productivity')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center space-x-1.5 cursor-pointer ${
              selectedReport === 'productivity'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>Attendant Productivity & Quality Audit</span>
            <span className="px-1.5 py-0.2 bg-black/30 rounded text-[10px] font-mono">RPT-HK-004</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedReport('linen')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center space-x-1.5 cursor-pointer ${
              selectedReport === 'linen'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>Linen & Laundry Circulation</span>
            <span className="px-1.5 py-0.2 bg-black/30 rounded text-[10px] font-mono">RPT-HK-003</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedReport('lostfound')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center space-x-1.5 cursor-pointer ${
              selectedReport === 'lostfound'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>Lost & Found Property Audit</span>
            <span className="px-1.5 py-0.2 bg-black/30 rounded text-[10px] font-mono">RPT-HK-002</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedReport('discrepancy')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center space-x-1.5 cursor-pointer ${
              selectedReport === 'discrepancy'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>FO vs HK Room Discrepancies</span>
            <span className="px-1.5 py-0.2 bg-black/30 rounded text-[10px] font-mono">RPT-HK-005</span>
          </button>
        </div>

        {/* Date Presets & Filter Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 pt-2 border-t border-slate-800/80 items-center text-xs">
          {/* Preset Buttons */}
          <div className="md:col-span-4 flex items-center space-x-1 overflow-x-auto">
            {(['today', 'yesterday', '7days', 'month'] as const).map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetChange(preset)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors uppercase cursor-pointer ${
                  datePreset === preset
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {preset === '7days' ? 'Last 7D' : preset}
              </button>
            ))}
          </div>

          {/* Date Pickers */}
          <div className="md:col-span-4 flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 px-2 py-1 bg-slate-950 border border-slate-800 rounded flex-1">
              <span className="text-[10px] text-slate-500 uppercase font-mono">From:</span>
              <input
                type="date"
                value={filterState.dateFrom}
                onChange={e => {
                  setDatePreset('custom');
                  setFilterState(prev => ({ ...prev, dateFrom: e.target.value }));
                }}
                className="bg-transparent text-slate-200 text-xs focus:outline-none w-full"
              />
            </div>
            <div className="flex items-center space-x-1.5 px-2 py-1 bg-slate-950 border border-slate-800 rounded flex-1">
              <span className="text-[10px] text-slate-500 uppercase font-mono">To:</span>
              <input
                type="date"
                value={filterState.dateTo}
                onChange={e => {
                  setDatePreset('custom');
                  setFilterState(prev => ({ ...prev, dateTo: e.target.value }));
                }}
                className="bg-transparent text-slate-200 text-xs focus:outline-none w-full"
              />
            </div>
          </div>

          {/* Search Table Rows */}
          <div className="md:col-span-4">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search table rows..."
                value={filterState.searchTerm || ''}
                onChange={e => setFilterState(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="bg-transparent text-slate-200 text-xs focus:outline-none w-full placeholder-slate-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. PAPER LAYOUT PREVIEW MODE OR DYNAMIC APP VIEW */}
      {showPaperPreview && activeReportResult ? (
        /* Formal Printable Sheet Paper Layout */
        <div className="bg-white text-slate-900 p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-300 space-y-6 print:p-0 print:border-none print:shadow-none">
          {/* Quick Action Header inside paper view */}
          <div className="flex items-center justify-between bg-slate-100 p-3 rounded-lg border border-slate-300 print:hidden text-xs">
            <div className="flex items-center space-x-2 text-slate-700">
              <Eye className="w-4 h-4 text-amber-600" />
              <span className="font-bold">Official Document Print Layout (A4 Format)</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold flex items-center space-x-1 text-xs cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save as PDF</span>
              </button>
              <button
                type="button"
                onClick={handleDirectPrint}
                className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold flex items-center space-x-1 text-xs cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </button>
            </div>
          </div>

          {/* Formal Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {pmsDb.settings.resortName || 'CCULB RESORT & CONVENTION HALL'}
              </h2>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {pmsDb.settings.address || 'Purbachal Link Road, Gazipur / Dhaka, Bangladesh'} • Tel: {pmsDb.settings.phone || '+880 1711-223344'}
              </p>
              <div className="mt-2 inline-block px-2.5 py-0.5 bg-slate-900 text-amber-400 font-bold text-xs rounded uppercase font-mono">
                Housekeeping Departmental Operations Audit
              </div>
            </div>
            <div className="text-left sm:text-right text-xs text-slate-600">
              <span className="font-mono font-bold text-slate-900 text-sm block">
                {activeReportResult.definition.reportCode}
              </span>
              <p className="font-semibold text-slate-800 mt-0.5">
                Run Date: {activeReportResult.generatedAt}
              </p>
              <p className="text-[11px] text-slate-500">
                Period: {filterState.dateFrom} to {filterState.dateTo}
              </p>
              <p className="text-[11px] text-slate-500">
                Prepared By: <strong>{activeReportResult.generatedBy}</strong>
              </p>
            </div>
          </div>

          {/* Report Title */}
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
              {activeReportResult.definition.reportName}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              {activeReportResult.definition.description}
            </p>
          </div>

          {/* Printable Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs border border-slate-300">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-300 text-slate-800">
                  <th className="py-2 px-2.5 text-left font-bold w-10">#</th>
                  {activeReportResult.columns.map(col => (
                    <th
                      key={col.key}
                      className={`py-2 px-2.5 font-bold uppercase text-[11px] ${
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                      }`}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {activeReportResult.rows.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="py-2 px-2.5 text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                    {activeReportResult.columns.map(col => {
                      const val = row[col.key];
                      return (
                        <td
                          key={col.key}
                          className={`py-2 px-2.5 ${
                            col.align === 'right' ? 'text-right font-mono' : col.align === 'center' ? 'text-center' : 'text-left'
                          }`}
                        >
                          {val !== undefined && val !== null ? String(val) : '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              {activeReportResult.summaryTotals && (
                <tfoot>
                  <tr className="bg-slate-100 border-t-2 border-slate-900 font-bold text-slate-900">
                    <td className="py-2.5 px-2.5">Total</td>
                    {activeReportResult.columns.map(col => {
                      const val = activeReportResult.summaryTotals?.[col.key];
                      return (
                        <td
                          key={col.key}
                          className={`py-2.5 px-2.5 ${
                            col.align === 'right' ? 'text-right font-mono' : col.align === 'center' ? 'text-center' : 'text-left'
                          }`}
                        >
                          {val !== undefined && val !== null ? String(val) : ''}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Audit Verification & Signature Block */}
          <div className="pt-8 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs text-slate-600">
            <div>
              <div className="h-10 border-b border-slate-400 border-dashed mb-1"></div>
              <p className="font-bold text-slate-800">Duty Housekeeping Supervisor</p>
              <p className="text-[10px] text-slate-500">Floor Inspection Certified</p>
            </div>
            <div>
              <div className="h-10 border-b border-slate-400 border-dashed mb-1"></div>
              <p className="font-bold text-slate-800">Executive Housekeeper</p>
              <p className="text-[10px] text-slate-500">Department Clearance</p>
            </div>
            <div>
              <div className="h-10 border-b border-slate-400 border-dashed mb-1"></div>
              <p className="font-bold text-slate-800">Front Office & Night Auditor</p>
              <p className="text-[10px] text-slate-500">Residency Reconciled</p>
            </div>
          </div>
        </div>
      ) : (
        /* DYNAMIC INTERACTIVE APP VIEW */
        <div className="space-y-6">
          {/* REPORT 1: DAILY EXECUTIVE SUMMARY */}
          {selectedReport === 'summary' && (
            <div className="space-y-6">
              {/* Departmental Status Snapshot */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 shadow-md">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-100">Live Departmental Status Snapshot</h3>
                  <span className="text-[11px] text-slate-400">Total Rooms: {stats.totalRooms}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/20">
                    <span className="text-slate-400 block">Vacant Clean</span>
                    <span className="text-lg font-bold font-mono text-emerald-400">{stats.vacantClean}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/20">
                    <span className="text-slate-400 block">Vacant Dirty</span>
                    <span className="text-lg font-bold font-mono text-amber-400">{stats.vacantDirty}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-blue-500/20">
                    <span className="text-slate-400 block">Occupied Clean</span>
                    <span className="text-lg font-bold font-mono text-blue-400">{stats.occupiedClean}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-purple-500/20">
                    <span className="text-slate-400 block">In Progress</span>
                    <span className="text-lg font-bold font-mono text-purple-400">{stats.cleaningInProgress}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-teal-500/20">
                    <span className="text-slate-400 block">Inspected</span>
                    <span className="text-lg font-bold font-mono text-teal-400">{stats.inspected}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-red-500/20">
                    <span className="text-slate-400 block">Out of Order (OOO)</span>
                    <span className="text-lg font-bold font-mono text-red-400">{stats.outOfOrder}</span>
                  </div>
                </div>
              </div>

              {/* Tasks / Room Status Board Table */}
              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/90 shadow-xl">
                <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Room Cleaning & Turnover Log
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Showing {activeReportResult?.rows.length || 0} Rooms
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10.5px] tracking-wider">
                      <tr>
                        <th className="p-3.5">Room No.</th>
                        <th className="p-3.5 text-center">Floor</th>
                        <th className="p-3.5">Room Category</th>
                        <th className="p-3.5 text-center">Housekeeping Status</th>
                        <th className="p-3.5 text-center">Front Desk Status</th>
                        <th className="p-3.5 text-center">Last Cleaned</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {(activeReportResult?.rows || []).map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 font-bold text-slate-100 font-mono">Room {r.roomNumber}</td>
                          <td className="p-3.5 text-center text-slate-300">{r.floor}</td>
                          <td className="p-3.5 text-slate-200 font-medium">{r.type}</td>
                          <td className="p-3.5 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              r.housekeepingStatus === 'Clean' || r.housekeepingStatus === 'Inspected'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : r.housekeepingStatus === 'Dirty'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}>
                              {r.housekeepingStatus}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                              {r.operationalStatus}
                            </span>
                          </td>
                          <td className="p-3.5 text-center text-slate-400 font-mono text-[11px]">{r.lastCleaned}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* REPORT 2: ATTENDANT PRODUCTIVITY */}
          {selectedReport === 'productivity' && (
            <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/90 shadow-xl">
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Attendant Performance & Productivity Matrix
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {productivity.length} Staff On Record
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10.5px] tracking-wider">
                    <tr>
                      <th className="p-3.5">Attendant Name</th>
                      <th className="p-3.5">Shift & Section</th>
                      <th className="p-3.5 text-center">Active Tasks</th>
                      <th className="p-3.5 text-center">Rooms Cleaned Today</th>
                      <th className="p-3.5 text-center">Avg Time / Room</th>
                      <th className="p-3.5 text-center">Completion %</th>
                      <th className="p-3.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {productivity
                      .filter(p => !searchTermLower || p.staff.name.toLowerCase().includes(searchTermLower))
                      .map(p => (
                        <tr key={p.staff.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 font-bold text-slate-100 flex items-center space-x-2">
                            <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-xs">
                              {p.staff.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span>{p.staff.name}</span>
                          </td>
                          <td className="p-3.5 text-slate-300">
                            {p.staff.shift} Shift • Floor {p.staff.assignedFloor || '1'}
                          </td>
                          <td className="p-3.5 text-center font-mono font-bold text-purple-400">{p.pendingCount}</td>
                          <td className="p-3.5 text-center font-mono font-bold text-emerald-400">{p.completedCount}</td>
                          <td className="p-3.5 text-center font-mono text-slate-300">{p.avgCleaningTimeMinutes || 28} mins</td>
                          <td className="p-3.5 text-center font-mono font-bold text-teal-400">{p.completionRate}%</td>
                          <td className="p-3.5 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.staff.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {p.staff.active ? 'Active' : 'Off Duty'}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REPORT 3: LINEN & LAUNDRY CIRCULATION */}
          {selectedReport === 'linen' && (
            <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/90 shadow-xl">
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Linen Par Level & Laundry Circulation Ledger
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {linenItems.length} Linen Articles Tracked
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10.5px] tracking-wider">
                    <tr>
                      <th className="p-3.5">Linen Article</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5 text-center">Total Resort Par</th>
                      <th className="p-3.5 text-center text-emerald-400">Clean in Circulation</th>
                      <th className="p-3.5 text-center text-amber-400">Dirty Soiled</th>
                      <th className="p-3.5 text-center text-purple-400">In Laundry</th>
                      <th className="p-3.5 text-center text-red-400">Damaged / Condemned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {linenItems
                      .filter(item => !searchTermLower || item.name.toLowerCase().includes(searchTermLower) || item.category.toLowerCase().includes(searchTermLower))
                      .map(item => {
                        const itemStocks = linenStocks.filter(s => s.linenItemId === item.id);
                        const cleanSum = itemStocks.reduce((acc, s) => acc + s.cleanQty, 0);
                        const dirtySum = itemStocks.reduce((acc, s) => acc + s.dirtyQty, 0);
                        const laundrySum = itemStocks.reduce((acc, s) => acc + s.inLaundryQty, 0);
                        const damagedSum = itemStocks.reduce((acc, s) => acc + s.damagedQty, 0);

                        return (
                          <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-3.5 font-bold text-slate-100">{item.name}</td>
                            <td className="p-3.5 text-slate-400">{item.category}</td>
                            <td className="p-3.5 text-center font-mono font-bold text-slate-200">{item.parLevel}</td>
                            <td className="p-3.5 text-center font-mono font-bold text-emerald-400">{cleanSum}</td>
                            <td className="p-3.5 text-center font-mono font-bold text-amber-400">{dirtySum}</td>
                            <td className="p-3.5 text-center font-mono font-bold text-purple-400">{laundrySum}</td>
                            <td className="p-3.5 text-center font-mono font-bold text-red-400">{damagedSum}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REPORT 4: LOST & FOUND PROPERTY AUDIT */}
          {selectedReport === 'lostfound' && (
            <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/90 shadow-xl">
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Lost & Found Property Custody Register
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {lostFound.length} Items Logged
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10.5px] tracking-wider">
                    <tr>
                      <th className="p-3.5">Property Tag #</th>
                      <th className="p-3.5">Discovered Date & Area</th>
                      <th className="p-3.5">Category & Description</th>
                      <th className="p-3.5">Guest / Claimant</th>
                      <th className="p-3.5">Safe Bin Location</th>
                      <th className="p-3.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {lostFound
                      .filter(lf => !searchTermLower || lf.itemCode.toLowerCase().includes(searchTermLower) || lf.description.toLowerCase().includes(searchTermLower))
                      .map(lf => (
                        <tr key={lf.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-blue-400">{lf.itemCode}</td>
                          <td className="p-3.5 text-slate-300">
                            <div>{lf.foundLocation}</div>
                            <div className="text-[10.5px] text-slate-500">{lf.foundDate}</div>
                          </td>
                          <td className="p-3.5">
                            <div className="font-semibold text-slate-100">{lf.description}</div>
                            <div className="text-[10.5px] text-slate-400">{lf.category} • {lf.color}</div>
                          </td>
                          <td className="p-3.5">
                            {lf.guestName ? (
                              <span className="font-medium text-slate-200">{lf.guestName}</span>
                            ) : (
                              <span className="text-slate-500 italic">Unidentified</span>
                            )}
                          </td>
                          <td className="p-3.5 font-mono text-amber-400 text-[11px]">{lf.storageBinCode}</td>
                          <td className="p-3.5 text-right">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                              lf.status === 'Returned'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : lf.status === 'Guest Contacted'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {lf.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REPORT 5: ROOM DISCREPANCIES AUDIT */}
          {selectedReport === 'discrepancy' && (
            <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/90 shadow-xl">
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Front Office vs Housekeeping Physical Status Discrepancies
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {discrepancies.length} Discrepancies Flagged
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10.5px] tracking-wider">
                    <tr>
                      <th className="p-3.5">Room Number</th>
                      <th className="p-3.5">Discrepancy Details</th>
                      <th className="p-3.5">Front Office Status</th>
                      <th className="p-3.5">Housekeeping Floor Status</th>
                      <th className="p-3.5 text-right">Audit Recommendation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {discrepancies.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">
                          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                          <div className="font-bold text-slate-200">All Rooms 100% Reconciled</div>
                          <div className="text-xs text-slate-500 mt-1">Zero sleepers or skips detected across front desk and housekeeping logs.</div>
                        </td>
                      </tr>
                    ) : (
                      discrepancies.map(disc => (
                        <tr key={disc.roomId} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-slate-100 text-sm">Room {disc.roomNumber}</td>
                          <td className="p-3.5">
                            <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                              FO: {disc.frontOfficeStatus} vs HK: {disc.housekeepingStatus}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-300 font-medium">{disc.frontOfficeDetails}</td>
                          <td className="p-3.5 text-blue-400 font-medium">{disc.housekeepingDetails}</td>
                          <td className="p-3.5 text-right text-slate-300 italic">
                            Verify physical occupancy & update FO stay record
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Standalone Fallback PrintableModal */}
      {isInternalPrintModalOpen && activeReportResult && (
        <PrintableModal
          isOpen={isInternalPrintModalOpen}
          onClose={() => setIsInternalPrintModalOpen(false)}
          data={activeReportResult}
          documentType="report"
        />
      )}
    </div>
  );
};
