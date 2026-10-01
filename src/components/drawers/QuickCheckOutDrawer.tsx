import React, { useState, useEffect } from 'react';
import { X, LogOut, CheckCircle2, Receipt, CreditCard, Printer, AlertTriangle, ArrowRight, FileText, Check } from 'lucide-react';
import { pmsService } from '../../services/pmsService';
import { Stay, Folio, Invoice, PaymentMethod } from '../../types/pms';
import { BDCardAndPaymentSelector } from '../common/BDCardAndPaymentSelector';
import { PaymentTenderDetails } from '../../constants/paymentConfig';

interface QuickCheckOutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stayId?: string;
  onPrintInvoice: (invoice: Invoice) => void;
  onPrintCheckoutForm?: (data: { stay: Stay; folio?: Folio; invoice?: Invoice }) => void;
  onPrintFolio?: (folio: Folio) => void;
  onSuccess?: () => void;
}

export const QuickCheckOutDrawer: React.FC<QuickCheckOutDrawerProps> = ({
  isOpen,
  onClose,
  stayId,
  onPrintInvoice,
  onPrintCheckoutForm,
  onPrintFolio,
  onSuccess
}) => {
  const [db, setDb] = useState(pmsService.getState());
  const [selectedStayId, setSelectedStayId] = useState<string>(stayId || '');

  useEffect(() => {
    return pmsService.subscribe(setDb);
  }, []);

  const activeStays = db.stays.filter(s => s.status === 'Active');

  // Choose the target stay
  const currentStayId = selectedStayId || stayId || (activeStays.length > 0 ? activeStays[0].id : '');
  const stay = db.stays.find(s => s.id === currentStayId);
  const folio = stay ? db.folios.find(f => f.id === stay.folioId) : undefined;

  const [settleAmount, setSettleAmount] = useState<number | ''>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Credit Card');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [paymentDetails, setPaymentDetails] = useState<Partial<PaymentTenderDetails>>({});
  const [error, setError] = useState<string>('');
  const [showPaymentInput, setShowPaymentInput] = useState<boolean>(false);
  
  // Post-checkout success state
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);
  const [completedStay, setCompletedStay] = useState<Stay | null>(null);
  const [completedFolio, setCompletedFolio] = useState<Folio | null>(null);

  useEffect(() => {
    if (stayId) {
      setSelectedStayId(stayId);
    } else if (activeStays.length > 0 && !selectedStayId) {
      setSelectedStayId(activeStays[0].id);
    }
  }, [stayId, activeStays.length]);

  useEffect(() => {
    if (isOpen && folio) {
      setError('');
      setCompletedInvoice(null);
      setCompletedStay(null);
      setCompletedFolio(null);
      setSettleAmount(Math.max(0, folio.balance));
      setShowPaymentInput(folio.balance > 0);
      setPaymentRef('Counter POS Settlement');
    }
  }, [isOpen, currentStayId, folio?.balance]);

  if (!isOpen) return null;

  const handleCheckout = () => {
    setError('');

    // If balance remains and payment is provided
    let settlePayment = undefined;
    const settleNum = typeof settleAmount === 'number' ? settleAmount : parseFloat(settleAmount) || 0;
    if (folio.balance > 0) {
      if (settleNum > 0) {
        settlePayment = {
          amount: settleNum,
          method: paymentMethod,
          reference: paymentRef || 'Check-out Counter Settlement',
          ...paymentDetails
        };
      }
    }

    try {
      const { invoice } = pmsService.checkOutStay({
        stayId: stay.id,
        settlePayment
      });

      // Fetch fresh state snapshot for print documents
      const freshDb = pmsService.getState();
      const freshStay = freshDb.stays.find(s => s.id === stay.id) || stay;
      const freshFolio = freshDb.folios.find(f => f.id === stay.folioId) || folio;

      setCompletedInvoice(invoice);
      setCompletedStay(freshStay);
      setCompletedFolio(freshFolio);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Checkout failed. Please verify folio balance.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-150">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-lg h-full flex flex-col shadow-2xl text-xs text-slate-200">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center border border-rose-500/30">
              <LogOut className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Front Desk Check-Out</h3>
              <p className="text-[11px] text-slate-400">Folio Settlement & Room Departure</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Quick print previews before checking out */}
            {!completedInvoice && (
              <>
                <button
                  type="button"
                  onClick={() => onPrintCheckoutForm?.({ stay, folio })}
                  className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded text-[11px] font-medium border border-slate-700"
                  title="Preview Check-Out Clearance Slip"
                >
                  <Printer className="w-3 h-3" />
                  <span>Check-Out Form</span>
                </button>
                <button
                  type="button"
                  onClick={() => onPrintFolio?.(folio)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium border border-slate-700"
                  title="Print Guest Folio Statement"
                >
                  <Receipt className="w-3 h-3 text-amber-400" />
                  <span>Folio</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body: Completed Screen or Settlement Form */}
        {completedInvoice ? (
          /* POST-CHECKOUT SUCCESS & PRINT OPTIONS SCREEN */
          <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              {/* Success Banner */}
              <div className="p-5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-center space-y-2 animate-in zoom-in-95">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-emerald-300">Check-Out & Settlement Cleared</h4>
                <p className="text-xs text-slate-300">
                  Guest <span className="font-semibold text-white">{completedStay?.guestName || stay.guestName}</span> has been checked out from <span className="font-mono font-bold text-amber-400">Room {completedStay?.roomNumber || stay.roomNumber}</span>.
                </p>
                <div className="inline-block px-3 py-1 bg-slate-900 border border-slate-800 rounded-full font-mono text-[11px] text-slate-300">
                  Invoice #{completedInvoice.invoiceNumber} • Folio Balance ৳0.00
                </div>
              </div>

              {/* Print Document Options */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Select Print Document Options:
                </span>

                <div className="space-y-2.5">
                  {/* Option 1: Check-Out Clearance Slip */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onPrintCheckoutForm && completedStay) {
                        onPrintCheckoutForm({ stay: completedStay, folio: completedFolio || folio, invoice: completedInvoice });
                      } else {
                        onPrintInvoice(completedInvoice);
                      }
                    }}
                    className="w-full flex items-center justify-between p-3.5 bg-slate-950 hover:bg-rose-950/30 border border-rose-500/40 hover:border-rose-400 rounded-xl text-left transition group shadow-md"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 group-hover:scale-105 transition-transform">
                        <Printer className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-rose-300 text-xs block group-hover:text-rose-200">
                          Check-Out Clearance & Departure Slip
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Official gatepass clearance, key card return & inspection signoff slip
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] px-2.5 py-1 bg-rose-600 group-hover:bg-rose-500 text-white font-bold rounded-lg shrink-0">
                      Print Form
                    </span>
                  </button>

                  {/* Option 2: Tax Invoice */}
                  <button
                    type="button"
                    onClick={() => onPrintInvoice(completedInvoice)}
                    className="w-full flex items-center justify-between p-3.5 bg-slate-950 hover:bg-amber-950/30 border border-amber-500/40 hover:border-amber-400 rounded-xl text-left transition group shadow-md"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 group-hover:scale-105 transition-transform">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-amber-300 text-xs block group-hover:text-amber-200">
                          Official Tax Invoice / Bill (NBR Compliant)
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Itemized charges, VAT 15%, Service Charge 10% & paid receipt
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] px-2.5 py-1 bg-amber-500 group-hover:bg-amber-400 text-slate-950 font-bold rounded-lg shrink-0">
                      Print Invoice
                    </span>
                  </button>

                  {/* Option 3: Master Folio Statement */}
                  <button
                    type="button"
                    onClick={() => onPrintFolio?.(completedFolio || folio)}
                    className="w-full flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                        <Receipt className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-200 text-xs block">
                          Guest Master Folio Statement
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Complete chronological room & outlet billing ledger
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] px-2.5 py-1 bg-slate-800 group-hover:bg-slate-700 text-slate-200 font-medium rounded-lg shrink-0 border border-slate-700">
                      Print Folio
                    </span>
                  </button>
                </div>
              </div>

              {/* Status Note */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Room {stay.roomNumber} is now marked as Dirty on the Housekeeping Board.</span>
              </div>
            </div>

            {/* Bottom Done Button */}
            <div className="pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition text-xs flex items-center justify-center gap-1.5"
              >
                <span>Done & Return to Front Desk</span>
              </button>
            </div>
          </div>
        ) : !stay || !folio ? (
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
              <LogOut className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-200">No In-House Guests Available</h4>
            <p className="text-xs text-slate-400 max-w-xs">
              There are currently no active in-house stays to check out.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold"
            >
              Close
            </button>
          </div>
        ) : (
          /* ACTIVE CHECKOUT & SETTLEMENT SCREEN */
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded text-rose-300">
                {error}
              </div>
            )}

            {/* In-House Guest / Room Switcher (Enables Anytime Check-Out) */}
            <div className="bg-slate-950/90 p-3 rounded-lg border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Select Room / Guest (Check-Out Anytime):
                </span>
                <span className="text-[10px] text-rose-400 font-mono">
                  {activeStays.length} Active In-House Rooms
                </span>
              </div>
              <select
                value={stay.id}
                onChange={(e) => setSelectedStayId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-medium text-xs focus:outline-none focus:border-rose-500"
              >
                {activeStays.map(s => {
                  const f = db.folios.find(fol => fol.id === s.folioId);
                  const bal = f ? f.balance : 0;
                  return (
                    <option key={s.id} value={s.id}>
                      Room {s.roomNumber} — {s.guestName} ({s.stayNumber}) [{bal <= 0 ? '৳0 Balance Cleared' : `Due: ৳${(bal || 0).toLocaleString()}`}]
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Stay Info Card */}
            <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Guest Information</span>
                  <h4 className="text-sm font-bold text-slate-100 mt-0.5">{stay.guestName}</h4>
                  <p className="text-slate-400 text-[11px]">Stay Record: <span className="font-mono text-slate-300">{stay.stayNumber}</span></p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Room Allocation</span>
                  <p className="text-base font-mono font-bold text-amber-400 mt-0.5">Room {stay.roomNumber}</p>
                  <p className="text-slate-400 text-[11px]">{stay.roomTypeName}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex justify-between text-[11px] text-slate-400">
                <span>Check-in: {stay.checkInAt ? stay.checkInAt.split('T')[0] : 'N/A'}</span>
                <span>Expected Out: {stay.expectedCheckOutAt ? stay.expectedCheckOutAt.split('T')[0] : 'N/A'}</span>
              </div>
            </div>

            {/* Itemized Folio Summary */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 flex items-center space-x-1.5">
                  <Receipt className="w-3.5 h-3.5 text-amber-400" />
                  <span>Itemized Folio ({folio.folioNumber})</span>
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                  folio.balance <= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {folio.balance <= 0 ? 'Fully Paid' : `Due: ৳${(folio.balance || 0).toLocaleString()}`}
                </span>
              </div>

              <div className="bg-slate-950 rounded border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-1.5 px-3">Description</th>
                      <th className="py-1.5 px-2 text-right">Qty</th>
                      <th className="py-1.5 px-3 text-right">Total (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {folio.items.map(it => (
                      <tr key={it.id}>
                        <td className="py-2 px-3 text-slate-300">
                          <span className="font-medium block text-slate-200">{it.description}</span>
                          <span className="text-[10px] text-slate-500">{it.type}</span>
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-slate-400">{it.quantity}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-200 font-semibold">
                          ৳{(it.total || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Financial Totals */}
                <div className="p-3 bg-slate-900/90 border-t border-slate-800 space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-mono">৳{(folio.subtotal || 0).toLocaleString()}</span>
                  </div>
                  {folio.discountTotal > 0 && (
                    <div className="flex justify-between text-rose-400">
                      <span>Discount:</span>
                      <span className="font-mono">-৳{(folio.discountTotal || 0).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400">
                    <span>Service Charge (10%):</span>
                    <span className="font-mono">৳{(folio.serviceChargeTotal || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>VAT / Tax (15%):</span>
                    <span className="font-mono">৳{(folio.taxTotal || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-100 border-t border-slate-800 pt-1">
                    <span>Grand Total:</span>
                    <span className="font-mono text-amber-400">৳{(folio.grandTotal || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>Total Paid / Advances:</span>
                    <span className="font-mono">৳{(folio.paidTotal || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm bg-slate-950 p-2 rounded border border-slate-800">
                    <span>Outstanding Balance:</span>
                    <span className={`font-mono ${folio.balance <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ৳{(folio.balance || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Settlement if Balance Due */}
            {folio.balance > 0 && (
              <div className="p-3.5 bg-slate-950 border border-amber-500/40 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-2 text-amber-300 font-bold">
                    <CreditCard className="w-4 h-4" />
                    <span>Checkout Balance Settlement (Due: ৳{folio.balance.toLocaleString()}):</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettleAmount(folio.balance)}
                    className="text-[10px] text-amber-400 hover:text-amber-300 underline font-semibold"
                  >
                    Match Folio Due
                  </button>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5 font-medium">Settlement Amount (৳):</span>
                  <input
                    type="number"
                    value={settleAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setSettleAmount('');
                      } else {
                        const parsed = parseFloat(val);
                        setSettleAmount(isNaN(parsed) ? '' : parsed);
                      }
                    }}
                    placeholder="0"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono font-bold text-sm"
                  />
                </div>

                <BDCardAndPaymentSelector
                  method={paymentMethod}
                  onMethodChange={setPaymentMethod}
                  amount={Number(settleAmount) || 0}
                  reference={paymentRef}
                  onReferenceChange={setPaymentRef}
                  details={paymentDetails}
                  onDetailsChange={setPaymentDetails}
                  theme="dark"
                />
              </div>
            )}

            {/* Operational Departure Note */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded text-[11px] text-slate-400 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-300">Automated Housekeeping Dispatch:</span>
                <p className="mt-0.5 leading-relaxed">
                  Confirming checkout will mark <span className="text-amber-300 font-medium">Room {stay.roomNumber}</span> as <span className="text-rose-300 font-semibold">Dirty</span> and dispatch a turnover task to the housekeeping board.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer (Only for Active Checkout view) */}
        {!completedInvoice && stay && folio && (
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded text-xs transition-colors"
            >
              Cancel
            </button>
            <div className="flex items-center space-x-2">
              {folio.balance <= 0 ? (
                <button
                  onClick={handleCheckout}
                  className="flex items-center space-x-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg text-xs transition-colors shadow-lg shadow-emerald-950"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Complete Check-Out (Settled)</span>
                </button>
              ) : (
                <button
                  onClick={handleCheckout}
                  className="flex items-center space-x-1.5 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs transition-colors shadow-lg shadow-rose-950"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Confirm Check-Out & Settle Bill</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
