import React from 'react';
import { Printer, Download, FileText, CheckCircle2, Building, User, Calendar, CreditCard, ShieldCheck } from 'lucide-react';
import { Room, Stay, Folio, FolioItem, Payment } from '../../../types/pms';
import { PmsDatabaseState } from '../../../services/mockPmsDatabase';

interface BillPreviewTabProps {
  room: Room;
  activeStay: Stay;
  activeFolio: Folio;
  db: PmsDatabaseState;
  onShowToast: (msg: string) => void;
}

export const BillPreviewTab: React.FC<BillPreviewTabProps> = ({
  room,
  activeStay,
  activeFolio,
  db,
  onShowToast
}) => {
  const stayPayments = (db.payments || []).filter(
    p => p.folioId === activeFolio.id || (p as any).stayId === activeStay.id
  );

  const roomCharges = (activeFolio.items || []).filter(i => i.type === 'Room Charge');
  const fbCharges = (activeFolio.items || []).filter(i => i.type === 'Restaurant' || i.type === 'Room Service');
  const otherServiceCharges = (activeFolio.items || []).filter(
    i => i.type !== 'Room Charge' && i.type !== 'Restaurant' && i.type !== 'Room Service' && (i.type as any) !== 'Payment'
  );

  const handlePrintBill = () => {
    window.print();
  };

  const balance = Math.max(0, activeFolio.balance);
  const isPaidInFull = balance === 0;

  return (
    <div className="space-y-4 text-xs">
      {/* Top Action Toolbar */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-gray-700">Official Guest Bill & Folio Statement</span>
          {isPaidInFull ? (
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Paid in Full</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-black uppercase">
              Balance Due: ৳{balance.toLocaleString()}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handlePrintBill}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official Bill</span>
          </button>
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div className="p-6 bg-white border border-gray-300 rounded-xl shadow-xs space-y-5 text-gray-900 font-sans print:border-none print:shadow-none print:p-0">
        {/* Hotel Letterhead */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
              The Grand Palace Hotel & Suites
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">Plot 14, Road 45, Gulshan-2, Dhaka-1212, Bangladesh</p>
            <p className="text-[11px] text-gray-500">
              Tel: +880 2 988-1234 • Email: billing@grandpalacedhaka.com • Web: www.grandpalacedhaka.com
            </p>
            <p className="text-[10px] font-mono text-gray-400 mt-0.5">BIN / Tax ID: 002918271-0101 • Mushak-6.3 Tax Invoice</p>
          </div>

          <div className="text-right">
            <span className="text-xs font-black uppercase tracking-wider bg-slate-900 text-white px-2.5 py-1 rounded">
              Guest Folio Bill
            </span>
            <p className="font-mono text-xs font-black text-slate-900 mt-2">
              Folio #: {activeFolio.folioNumber}
            </p>
            <p className="text-[11px] text-gray-500">
              Date: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Guest & Stay Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs">
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase">Guest Name</span>
            <p className="font-black text-gray-900 text-sm">{activeStay.guestName}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase">Room Assigned</span>
            <p className="font-mono font-black text-gray-900 text-sm">{room.roomNumber} ({room.roomTypeName})</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase">Arrival (Check-in)</span>
            <p className="font-mono font-bold text-gray-800">
              {activeStay.checkInAt ? new Date(activeStay.checkInAt).toLocaleDateString('en-GB') : 'N/A'}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase">Departure (Check-out)</span>
            <p className="font-mono font-bold text-gray-800">
              {activeStay.expectedCheckOutAt ? new Date(activeStay.expectedCheckOutAt).toLocaleDateString('en-GB') : 'Today'}
            </p>
          </div>
        </div>

        {/* Consolidated Bills Table */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-gray-300 pb-1">
            Consolidated Bill Breakdown (All Charges)
          </h4>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-300 text-gray-600 text-[10px] uppercase font-black bg-gray-100">
                <th className="py-2 px-2">Date</th>
                <th className="py-2 px-2">Category</th>
                <th className="py-2 px-2">Description / Voucher</th>
                <th className="py-2 px-2 text-center">Qty</th>
                <th className="py-2 px-2 text-right">Unit Price</th>
                <th className="py-2 px-2 text-right">Total (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 font-mono">
              {activeFolio.items.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-gray-50">
                  <td className="py-1.5 px-2 text-[11px] text-gray-500">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Today'}
                  </td>
                  <td className="py-1.5 px-2 text-[11px] font-sans font-bold text-gray-700">
                    {item.type}
                  </td>
                  <td className="py-1.5 px-2 text-xs font-sans text-gray-900">
                    {item.description}
                  </td>
                  <td className="py-1.5 px-2 text-center text-xs">
                    {item.quantity}
                  </td>
                  <td className="py-1.5 px-2 text-right text-xs">
                    ৳{(item.unitPrice || 0).toLocaleString()}
                  </td>
                  <td className="py-1.5 px-2 text-right text-xs font-bold text-slate-900">
                    ৳{(item.total || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bill Financial Totals */}
        <div className="flex justify-end pt-2">
          <div className="w-full sm:w-72 space-y-1.5 p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span className="font-mono font-bold">৳{(activeFolio.subtotal || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Service Charge (10%):</span>
              <span className="font-mono font-bold">৳{(activeFolio.serviceChargeTotal || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>VAT / Tax (15%):</span>
              <span className="font-mono font-bold">৳{(activeFolio.taxTotal || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-black text-slate-900 pt-1 border-t border-gray-300">
              <span>Grand Total:</span>
              <span className="font-mono text-sm">৳{(activeFolio.grandTotal || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Total Payments Made:</span>
              <span className="font-mono">৳{(activeFolio.paidTotal || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-base font-black pt-1 border-t-2 border-slate-900">
              <span className={balance > 0 ? 'text-rose-700' : 'text-emerald-700'}>
                Net Balance Due:
              </span>
              <span className={`font-mono ${balance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                ৳{(balance || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Payment History Section */}
        {stayPayments.length > 0 && (
          <div className="pt-2">
            <h5 className="text-[11px] font-black uppercase tracking-wider text-gray-600 mb-1.5">
              Payment & Advance History
            </h5>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-gray-100 text-gray-600 uppercase font-black text-[9px]">
                  <tr>
                    <th className="py-1 px-2">Receipt #</th>
                    <th className="py-1 px-2">Date</th>
                    <th className="py-1 px-2">Method</th>
                    <th className="py-1 px-2">Reference</th>
                    <th className="py-1 px-2 text-right">Amount (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {stayPayments.map((pay, i) => (
                    <tr key={pay.id || i} className="hover:bg-gray-50">
                      <td className="py-1 px-2 font-bold">{pay.transactionNumber}</td>
                      <td className="py-1 px-2 text-gray-500 font-sans">
                        {pay.createdAt ? new Date(pay.createdAt).toLocaleDateString('en-GB') : 'Today'}
                      </td>
                      <td className="py-1 px-2 font-sans font-semibold">{pay.method}</td>
                      <td className="py-1 px-2 text-gray-500 truncate max-w-xs">{pay.reference || '-'}</td>
                      <td className="py-1 px-2 text-right font-bold text-emerald-700">৳{pay.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Signatures & Disclaimers */}
        <div className="pt-8 grid grid-cols-2 gap-8 text-xs text-gray-500 border-t border-gray-200">
          <div className="text-center pt-6 border-t border-gray-400">
            <p className="font-bold text-gray-800">Guest Signature</p>
            <p className="text-[10px] mt-0.5">I agree that I am responsible for the full payment of this bill.</p>
          </div>
          <div className="text-center pt-6 border-t border-gray-400">
            <p className="font-bold text-gray-800">Authorized Front Desk Cashier</p>
            <p className="text-[10px] mt-0.5">The Grand Palace Hotel & Suites Dhaka</p>
          </div>
        </div>
      </div>
    </div>
  );
};
