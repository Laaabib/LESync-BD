import React, { useState, useEffect } from 'react';
import {
  History, Search, Download, Printer, ShieldAlert, Filter, Clock
} from 'lucide-react';
import { pmsService } from '../services/pmsService';
import { pdfExportService } from '../services/pdfExportService';
import { PmsDatabaseState } from '../services/mockPmsDatabase';

interface AdminAuditViewProps {
  onPrintReport?: (reportData: any) => void;
}

export const AdminAuditView: React.FC<AdminAuditViewProps> = ({ onPrintReport }) => {
  const [db, setDb] = useState<PmsDatabaseState>(pmsService.getState());
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('All');

  useEffect(() => {
    return pmsService.subscribe(setDb);
  }, []);

  const filteredLogs = db.auditLogs.filter(log => {
    const detailText = (log as any).details || log.newValue || log.oldValue || '';
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.entityType.toLowerCase().includes(search.toLowerCase()) ||
      detailText.toLowerCase().includes(search.toLowerCase()) ||
      log.userName.toLowerCase().includes(search.toLowerCase());

    const matchesAction = actionFilter === 'All' || log.entityType === actionFilter;

    return matchesSearch && matchesAction;
  });

  const handleExportPDF = () => {
    const propertyName = db.settings.resortName || 'Resort MIS';
    pdfExportService.exportToPDF({
      title: 'IMMUTABLE AUDIT TRAIL & SECURITY EVENT REGISTER',
      subtitle: `${propertyName.toUpperCase()} • CYBERSECURITY & AUDIT LOGS`,
      date: new Date().toLocaleDateString('en-GB'),
      columns: [
        { key: 'timestamp', header: 'Timestamp' },
        { key: 'user', header: 'Operator User' },
        { key: 'role', header: 'Role' },
        { key: 'action', header: 'Action' },
        { key: 'entity', header: 'Entity' },
        { key: 'details', header: 'Event Details' }
      ],
      rows: filteredLogs.map(l => ({
        timestamp: (l as any).timestamp || l.createdAt,
        user: l.userName,
        role: l.userRole,
        action: l.action,
        entity: `${l.entityType} (#${l.entityId})`,
        details: (l as any).details || l.newValue || l.oldValue || '-'
      })),
      summaryTotals: {
        timestamp: `Total Events: ${filteredLogs.length}`,
        details: 'Audit Log Integrity: SECURE'
      },
      department: 'System Administration & Security',
      metadata: {
        'Entity Filter': actionFilter,
        'Recorded Events': `${filteredLogs.length}`
      }
    }, `System_Audit_Trail_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handlePreviewReport = () => {
    if (onPrintReport) {
      onPrintReport({
        title: 'IMMUTABLE AUDIT TRAIL & SECURITY EVENT REGISTER',
        definition: {
          reportCode: 'RPT-AUDIT-TRAIL',
          reportName: 'System Audit Trail Register',
          defaultDataScope: 'Security & Compliance'
        },
        department: 'Security & Compliance',
        generatedAt: new Date().toLocaleString(),
        generatedBy: 'System Administrator',
        columns: [
          { key: 'timestamp', header: 'Timestamp' },
          { key: 'user', header: 'Operator User' },
          { key: 'role', header: 'Role' },
          { key: 'action', header: 'Action' },
          { key: 'entity', header: 'Entity' },
          { key: 'details', header: 'Event Details' }
        ],
        rows: filteredLogs.map(l => ({
          timestamp: (l as any).timestamp || l.createdAt,
          user: l.userName,
          role: l.userRole,
          action: l.action,
          entity: `${l.entityType} (#${l.entityId})`,
          details: (l as any).details || l.newValue || l.oldValue || '-'
        })),
        summaryTotals: {
          timestamp: `Total Events: ${filteredLogs.length}`,
          details: 'Audit Log Integrity: SECURE'
        }
      });
    } else {
      handleExportPDF();
    }
  };

  return (
    <div className="space-y-4 text-xs text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-amber-400 font-bold flex items-center justify-center border border-slate-700">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-100">Immutable Audit Trail & System Logs</h1>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                {filteredLogs.length} Events
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Comprehensive trace of every check-in, checkout, folio charge, payment, and room status change.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-colors shadow text-xs cursor-pointer"
            title="Download vector PDF audit trail"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={handlePreviewReport}
            className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors shadow text-xs cursor-pointer"
            title="Preview system audit trail with pagination & print"
          >
            <Printer className="w-4 h-4" />
            <span>Preview & Print</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, details, user, entity..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-center">
          <span className="text-slate-400 text-[11px]">Entity Category:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded px-2.5 py-1 text-xs text-slate-100 focus:outline-none"
          >
            <option value="All">All Categories</option>
            <option value="Stay">Stay Check-In / Out</option>
            <option value="Folio">Folio & Billing</option>
            <option value="Payment">Financial Payments</option>
            <option value="Reservation">Reservations</option>
            <option value="EventBooking">Convention Events</option>
            <option value="Room">Room Status Changes</option>
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Operator User</th>
                <th className="py-3 px-4">Audit Description</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-300">
                      {log.action}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950 text-slate-300 border border-slate-800 font-mono">
                        {log.entityType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-200 font-medium">
                      <div>{log.userName}</div>
                      <div className="text-[10px] text-slate-500">{log.userRole}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-[11.5px]">
                      {(log as any).details || log.newValue || log.oldValue || '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500 text-[11px]">
                      {((log as any).timestamp || log.createdAt) ? ((log as any).timestamp || log.createdAt).replace('T', ' ').substring(0, 19) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
