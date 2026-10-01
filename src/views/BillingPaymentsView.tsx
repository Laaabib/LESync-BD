import React, { useState, useEffect } from 'react';
import {
  CreditCard, Search, Download, Filter,
  CheckCircle2, ArrowDownRight, DollarSign, Calendar, Printer
} from 'lucide-react';
import { pmsService } from '../services/pmsService';
import { pdfExportService } from '../services/pdfExportService';
import { PmsDatabaseState } from '../services/mockPmsDatabase';
import { Payment } from '../types/pms';

interface BillingPaymentsViewProps {
  onPrintReceipt?: (payment: Payment) => void;
  onPrintReport?: (reportData: any) => void;
}

export const BillingPaymentsView: React.FC<BillingPaymentsViewProps> = ({ onPrintReceipt, onPrintReport }) => {
  const [db, setDb] = useState<PmsDatabaseState>(pmsService.getState());
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('All');

  useEffect(() => {
    return pmsService.subscribe(setDb);
  }, []);

  const filteredPayments = db.payments.filter(p => {
    const receiptNum = (p as any).receiptNumber || (p as any).transactionNumber || '';
    const creator = (p as any).recordedBy || (p as any).createdBy || '';
    const matchesSearch =
      receiptNum.toLowerCase().includes(search.toLowerCase()) ||
      creator.toLowerCase().includes(search.toLowerCase()) ||
      (p.reference && p.reference.toLowerCase().includes(search.toLowerCase()));

    const matchesMethod = methodFilter === 'All' || p.method === methodFilter;

    return matchesSearch && matchesMethod;
  });

  const totalCollected = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  const handleExportPDF = () => {
    const propertyName = db.settings.resortName || 'Resort MIS';
    pdfExportService.exportToPDF({
      title: 'PAYMENT JOURNAL & CASHIER RECONCILIATION',
      subtitle: `${propertyName.toUpperCase()} • FINANCIAL AUDIT LEDGER`,
      date: new Date().toLocaleDateString('en-GB'),
      columns: [
        { key: 'receiptNumber', header: 'Receipt #' },
        { key: 'timestamp', header: 'Date & Time' },
        { key: 'method', header: 'Method' },
        { key: 'reference', header: 'Reference / Trx' },
        { key: 'cashier', header: 'Cashier Staff' },
        { key: 'amount', header: 'Amount (BDT)', align: 'right' }
      ],
      rows: filteredPayments.map(p => ({
        receiptNumber: (p as any).receiptNumber || (p as any).transactionNumber || 'TXN-N/A',
        timestamp: new Date(p.createdAt).toLocaleString(),
        method: p.method,
        reference: p.reference || 'Counter Cash',
        cashier: (p as any).recordedBy || (p as any).createdBy || 'Accounts',
        amount: `BDT ${(p.amount || 0).toLocaleString()}`
      })),
      summaryTotals: {
        receiptNumber: 'Total Collected',
        amount: `BDT ${(totalCollected || 0).toLocaleString()}`
      },
      department: 'Finance & Cashiering',
      metadata: {
        'Total Receipts': `${filteredPayments.length}`,
        'Method Filter': methodFilter
      }
    }, `Payment_Journal_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handlePreviewReport = () => {
    if (onPrintReport) {
      onPrintReport({
        title: 'PAYMENT JOURNAL & CASHIER RECONCILIATION',
        definition: {
          reportCode: 'RPT-PAY-JOURNAL',
          reportName: 'Financial Payment Journal',
          defaultDataScope: 'Consolidated Cashiering'
        },
        department: 'Accounts & Finance',
        generatedAt: new Date().toLocaleString(),
        generatedBy: 'Cashier Controller',
        columns: [
          { key: 'receiptNumber', header: 'Receipt #' },
          { key: 'timestamp', header: 'Date & Time' },
          { key: 'method', header: 'Method' },
          { key: 'reference', header: 'Reference / Trx' },
          { key: 'cashier', header: 'Cashier Staff' },
          { key: 'amount', header: 'Amount (BDT)', align: 'right' }
        ],
        rows: filteredPayments.map(p => ({
          receiptNumber: (p as any).receiptNumber || (p as any).transactionNumber || 'TXN-N/A',
          timestamp: new Date(p.createdAt).toLocaleString(),
          method: p.method,
          reference: p.reference || 'Counter Cash',
          cashier: (p as any).recordedBy || (p as any).createdBy || 'Accounts',
          amount: `BDT ${(p.amount || 0).toLocaleString()}`
        })),
        summaryTotals: {
          receiptNumber: 'Total Reconciled',
          amount: `BDT ${(totalCollected || 0).toLocaleString()}`
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
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center border border-emerald-500/30">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-100">Financial Payment Journal</h1>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-semibold">
                Total ৳{(totalCollected || 0).toLocaleString()}
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Auditable log of counter cash, POS credit card, bKash, and bank wire transactions.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-colors shadow text-xs cursor-pointer"
            title="Download vector PDF payment journal"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={handlePreviewReport}
            className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors shadow text-xs cursor-pointer"
            title="Preview formal journal report with page navigation & print"
          >
            <Printer className="w-4 h-4" />
            <span>Preview & Print</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by receipt #, reference, cashier..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-center">
          <span className="text-slate-400 text-[11px]">Payment Method:</span>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded px-2.5 py-1 text-xs text-slate-100 focus:outline-none"
          >
            <option value="All">All Payment Methods</option>
            <option value="Cash">Cash at Counter</option>
            <option value="Credit Card">Credit Card (POS)</option>
            <option value="bKash">bKash Merchant</option>
            <option value="Nagad">Nagad</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>
        </div>
      </div>

      {/* Payment Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Transaction / Slip Reference</th>
                <th className="py-3 px-4">Cashier / Staff</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4 text-right">Amount (৳ BDT)</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No payment transactions recorded.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(pay => (
                  <tr key={pay.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {(pay as any).receiptNumber || (pay as any).transactionNumber || 'TXN-REC'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-200 border border-slate-800 font-mono text-[10.5px]">
                        {pay.method}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono">
                      {pay.reference || 'Counter Cash Receipt'}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {(pay as any).recordedBy || (pay as any).createdBy || 'Cashier'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {pay.createdAt ? pay.createdAt.replace('T', ' ').substring(0, 16) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                      +৳{(pay.amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onPrintReceipt?.(pay)}
                        title="Print Official Money Receipt"
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded text-[11px] border border-slate-700 transition-colors inline-flex items-center space-x-1"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Receipt</span>
                      </button>
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
