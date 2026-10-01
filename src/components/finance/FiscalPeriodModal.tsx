import React, { useState, useEffect } from 'react';
import {
  Lock, Unlock, ShieldCheck, Clock, X, CheckCircle2,
  AlertTriangle, History, User, Calendar
} from 'lucide-react';
import { accountingEngineService, FiscalPeriod, FinanceAuditEntry } from '../../services/accountingEngineService';
import { pmsService } from '../../services/pmsService';

interface FiscalPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FiscalPeriodModal: React.FC<FiscalPeriodModalProps> = ({ isOpen, onClose }) => {
  const [periods, setPeriods] = useState<FiscalPeriod[]>(() => accountingEngineService.getFiscalPeriods());
  const [auditLogs, setAuditLogs] = useState<FinanceAuditEntry[]>(() => accountingEngineService.getAuditTrail(100));
  const [activeTab, setActiveTab] = useState<'periods' | 'audit'>('periods');
  const [selectedPeriodCode, setSelectedPeriodCode] = useState('2026-09');
  const [actionReason, setActionReason] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const refresh = () => {
    setPeriods([...accountingEngineService.getFiscalPeriods()]);
    setAuditLogs([...accountingEngineService.getAuditTrail(100)]);
  };

  useEffect(() => {
    const unsub = accountingEngineService.subscribe(() => {
      refresh();
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const currentUser = pmsService.getState().currentUser?.name || 'Chief Accountant';

  const handleClosePeriod = (periodCode: string) => {
    const res = accountingEngineService.closePeriod(periodCode, currentUser, actionReason || 'Month-end financial closing procedure');
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
      setActionReason('');
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  const handleReopenPeriod = (periodCode: string) => {
    const res = accountingEngineService.reopenPeriod(periodCode, currentUser, actionReason || 'Authorized executive adjustment');
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
      setActionReason('');
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-900" />
            <h2 className="text-base font-bold text-gray-900">Fiscal Period Controls & Enhanced Audit Trail</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-gray-200 text-xs font-semibold bg-gray-50/50">
          <button
            onClick={() => setActiveTab('periods')}
            className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-colors ${
              activeTab === 'periods' ? 'border-indigo-900 text-indigo-950 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Lock className="w-4 h-4" />
            Fiscal Periods (Books Closing)
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-colors ${
              activeTab === 'audit' ? 'border-indigo-900 text-indigo-950 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <History className="w-4 h-4" />
            100% Immutable Audit Trail ({auditLogs.length})
          </button>
        </div>

        {feedback && (
          <div
            className={`m-4 p-3 rounded-xl text-xs font-semibold flex items-center justify-between border ${
              feedback.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            <span>{feedback.text}</span>
            <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
        )}

        {/* Tab Content */}
        <div className="overflow-y-auto p-4 flex-1">
          {activeTab === 'periods' ? (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Fiscal Period Integrity: </strong>
                  Closing a fiscal period prevents any user or automated batch from posting backdated charges, invoices, or journals to that month. Only the Chief Accountant may reopen closed periods with a logged reason.
                </div>
              </div>

              <div className="space-y-3">
                {periods.map(period => (
                  <div
                    key={period.id}
                    className="p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">{period.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            period.status === 'OPEN'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {period.status === 'OPEN' ? '✓ OPEN FOR POSTINGS' : '🔒 LOCKED / CLOSED'}
                        </span>
                      </div>
                      <div className="text-gray-500 mt-1">
                        Span: {period.startDate} to {period.endDate}
                        {period.closedBy && <span> • Closed by: {period.closedBy}</span>}
                        {period.reopenedBy && <span> • Reopened by: {period.reopenedBy}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {period.status === 'OPEN' ? (
                        <button
                          onClick={() => handleClosePeriod(period.periodCode)}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          Close Period
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReopenPeriod(period.periodCode)}
                          className="px-3 py-1.5 bg-indigo-900 hover:bg-indigo-950 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          Reopen Period
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs text-gray-500 mb-2">
                Immutable financial log capturing all Created, Edited, Submitted, Approved, Posted, Reversed, Voided, Reconciled, and Closed transactions.
              </div>

              <div className="divide-y divide-gray-100 text-xs">
                {auditLogs.map(log => (
                  <div key={log.id} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-900 border border-indigo-200">
                          {log.action}
                        </span>
                        <span className="font-semibold text-gray-900">{log.recordType}: {log.recordId}</span>
                      </div>
                      <div className="text-gray-600 text-[11px]">{log.reason}</div>
                      {log.oldValue && (
                        <div className="text-[10px] text-gray-400">
                          Old: {log.oldValue} ➔ New: {log.newValue}
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0 text-[10px] text-gray-500">
                      <div className="font-semibold text-gray-700">{log.user}</div>
                      <div>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <span>Current Session Operator: <strong className="text-gray-900">{currentUser}</strong></span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
