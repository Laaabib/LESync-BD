import React, { useState } from 'react';
import {
  Search, X, FileText, Receipt, Scale, Building2,
  Users, ShoppingCart, ArrowRight, CheckCircle2, DollarSign
} from 'lucide-react';
import { accountingEngineService } from '../../services/accountingEngineService';

interface FinanceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult?: (result: any) => void;
}

export const FinanceSearchModal: React.FC<FinanceSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectResult
}) => {
  const [query, setQuery] = useState('');
  const results = accountingEngineService.globalFinanceSearch(query);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Header */}
        <div className="p-4 border-b border-gray-200 flex items-center gap-3 bg-gray-50/50">
          <Search className="w-5 h-5 text-indigo-900 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search Invoice #, Payment #, Receipt #, Journal #, Guest, Supplier, PO, GRN..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-gray-900 font-medium placeholder-gray-400 focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-gray-400 hover:text-gray-600 text-xs px-1.5 py-0.5 rounded bg-gray-200"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-3 divide-y divide-gray-100 flex-1">
          {query.trim() === '' ? (
            <div className="p-8 text-center text-xs text-gray-400 space-y-2">
              <Search className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="font-semibold text-gray-600">Unified Global Financial Cross-Index Search</p>
              <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
                Type any voucher ID (JE-2026-000001), folio (FOL-101), corporate account, supplier name, receipt number, or amount.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">
              No matching financial records found for "{query}".
            </div>
          ) : (
            results.map((res, idx) => (
              <div
                key={idx}
                onClick={() => {
                  if (onSelectResult) onSelectResult(res);
                  onClose();
                }}
                className="p-3 hover:bg-indigo-50/60 rounded-xl transition-colors cursor-pointer flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100/70 text-indigo-900 flex items-center justify-center shrink-0">
                    {res.type.includes('Journal') || res.type.includes('Transaction') ? (
                      <Scale className="w-4 h-4" />
                    ) : res.type.includes('Folio') ? (
                      <Receipt className="w-4 h-4" />
                    ) : res.type.includes('Corporate') ? (
                      <Building2 className="w-4 h-4" />
                    ) : (
                      <ShoppingCart className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-gray-900">{res.reference}</span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                        {res.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {res.secondaryRef && <span className="font-medium text-gray-700">{res.secondaryRef} • </span>}
                      {res.counterparty} • Date: {res.date}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-indigo-950 text-sm">
                    ৳{(res.amount || 0)?.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                    {res.status || 'Active'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-500">
          <span>{results.length} Financial Record(s) Indexed</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};
