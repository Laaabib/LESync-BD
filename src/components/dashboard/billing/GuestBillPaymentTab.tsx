import React, { useState } from 'react';
import { CreditCard, CheckCircle2, DollarSign, Printer, Receipt, Check, AlertCircle } from 'lucide-react';
import { Room, Stay, Folio, Payment, PaymentMethod } from '../../../types/pms';
import { pmsService } from '../../../services/pmsService';
import { BDCardAndPaymentSelector } from '../../common/BDCardAndPaymentSelector';
import { PaymentTenderDetails } from '../../../constants/paymentConfig';

interface GuestBillPaymentTabProps {
  room: Room;
  activeStay: Stay;
  activeFolio: Folio;
  onShowToast: (msg: string) => void;
  onPaymentSuccess?: () => void;
}

export const GuestBillPaymentTab: React.FC<GuestBillPaymentTabProps> = ({
  room,
  activeStay,
  activeFolio,
  onShowToast,
  onPaymentSuccess
}) => {
  const balance = Math.max(0, activeFolio.balance);
  const [payAmount, setPayAmount] = useState<number | ''>(balance > 0 ? balance : 1000);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Cash');
  const [payRef, setPayRef] = useState<string>(`RCP-RM${room.roomNumber}-${Date.now().toString().slice(-4)}`);
  const [payDetails, setPayDetails] = useState<Partial<PaymentTenderDetails>>({});
  const [payNotes, setPayNotes] = useState<string>('Front Desk Guest Bill Settlement');
  const [lastPayment, setLastPayment] = useState<Payment | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = typeof payAmount === 'number' ? payAmount : parseFloat(payAmount) || 0;
    if (numAmount <= 0) {
      alert('Payment amount must be greater than zero.');
      return;
    }

    setIsProcessing(true);
    try {
      const payment = pmsService.recordFolioPayment(activeFolio.id, {
        amount: numAmount,
        method: payMethod as PaymentMethod,
        reference: payRef || `RM${room.roomNumber}-RCP-${Date.now().toString().slice(-4)}`,
        notes: payNotes || `Guest payment collected for Room ${room.roomNumber}`,
        ...payDetails
      });

      setLastPayment(payment);
      onShowToast(`Payment of ৳${numAmount.toLocaleString()} recorded for Room ${room.roomNumber}!`);
      
      const newBal = Math.max(0, activeFolio.balance - numAmount);
      setPayAmount(newBal > 0 ? newBal : '');
      setPayRef(`RCP-RM${room.roomNumber}-${Date.now().toString().slice(-4)}`);
      
      if (onPaymentSuccess) onPaymentSuccess();
    } catch (err: any) {
      alert(err.message || 'Payment recording failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Financial Status Summary */}
      <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Current Outstanding Balance
          </span>
          <div className="flex items-baseline space-x-2 mt-0.5">
            <span className={`text-2xl sm:text-3xl font-black font-mono ${balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              ৳{(balance || 0).toLocaleString()}
            </span>
            {balance === 0 && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
                ✓ Fully Settled
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-300 mt-1">
            Total Billed: <strong className="text-white">৳{(activeFolio.grandTotal || 0).toLocaleString()}</strong> • Paid: <strong className="text-emerald-300">৳{(activeFolio.paidTotal || 0).toLocaleString()}</strong>
          </p>
        </div>

        <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
          <p className="text-[11px] text-slate-400">Guest: <strong className="text-white">{activeFolio.guestName}</strong></p>
          <p className="text-[11px] text-slate-400">Folio: <strong className="text-white font-mono">{activeFolio.folioNumber}</strong></p>
          <p className="text-[11px] text-slate-400">Room: <strong className="text-white font-mono">{room.roomNumber} ({room.roomTypeName})</strong></p>
        </div>
      </div>

      {/* Payment Success Receipt Card */}
      {lastPayment && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-xl space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-900 font-black">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-sm">Payment Receipt Generated</span>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-md flex items-center space-x-1 shadow-xs text-[11px]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1 border-t border-emerald-200">
            <div>
              <span className="text-emerald-700 font-semibold">Receipt Number:</span>
              <p className="font-mono font-black text-emerald-950">{lastPayment.transactionNumber}</p>
            </div>
            <div>
              <span className="text-emerald-700 font-semibold">Amount Paid:</span>
              <p className="font-mono font-black text-emerald-950">৳{lastPayment.amount.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-emerald-700 font-semibold">Payment Method:</span>
              <p className="font-bold text-emerald-950">{lastPayment.method}</p>
            </div>
            <div>
              <span className="text-emerald-700 font-semibold">Trx Reference:</span>
              <p className="font-mono text-emerald-950 truncate">{lastPayment.reference}</p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Form */}
      <form onSubmit={handleExecutePayment} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
        <h4 className="font-black text-slate-800 text-sm flex items-center space-x-1.5">
          <CreditCard className="w-4 h-4 text-emerald-600" />
          <span>Post Guest Bill Payment</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-gray-700">Payment Amount (৳):</label>
              {balance > 0 && (
                <div className="space-x-1">
                  <button
                    type="button"
                    onClick={() => setPayAmount(balance)}
                    className="text-[10px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-1.5 py-0.5 rounded"
                  >
                    Pay Full (৳{balance.toLocaleString()})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayAmount(Math.round(balance / 2))}
                    className="text-[10px] font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 px-1.5 py-0.5 rounded"
                  >
                    50%
                  </button>
                </div>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 font-bold text-gray-400">৳</span>
              <input
                type="number"
                min="1"
                required
                value={payAmount}
                onChange={e => {
                  const val = e.target.value;
                  if (val === '') {
                    setPayAmount('');
                  } else {
                    const parsed = parseFloat(val);
                    setPayAmount(isNaN(parsed) ? '' : parsed);
                  }
                }}
                placeholder="0"
                className="w-full pl-7 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono font-black text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        <BDCardAndPaymentSelector
          method={payMethod}
          onMethodChange={setPayMethod}
          amount={Number(payAmount) || 0}
          reference={payRef}
          onReferenceChange={setPayRef}
          details={payDetails}
          onDetailsChange={setPayDetails}
          theme="light"
        />

        <div>
          <label className="font-bold text-gray-700 block mb-1">Payment Remarks / FO Notes:</label>
          <input
            type="text"
            value={payNotes}
            onChange={e => setPayNotes(e.target.value)}
            placeholder="e.g. Check-in advance, Dinner bill settle, Room balance"
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs"
          />
        </div>

        <div className="pt-2 flex items-center justify-end">
          <button
            type="submit"
            disabled={Number(payAmount) <= 0 || isProcessing}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-md flex items-center space-x-2 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Post Payment of ৳{Number(payAmount || 0).toLocaleString()} to Folio</span>
          </button>
        </div>
      </form>
    </div>
  );
};
