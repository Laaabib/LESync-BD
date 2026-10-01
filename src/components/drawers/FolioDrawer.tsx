import React, { useState } from 'react';
import {
  X, Receipt, PlusCircle, CreditCard, Percent, FileText,
  Printer, ArrowDownRight, Tag, ShieldCheck, AlertCircle, Trash2, ShieldAlert,
  Lock, Unlock, AlertTriangle, CheckCircle2, Info, RefreshCw, RotateCcw
} from 'lucide-react';
import { pmsService } from '../../services/pmsService';
import { rbacService } from '../../services/rbacService';
import { Folio, FolioItem, PaymentMethod } from '../../types/pms';
import { BDCardAndPaymentSelector } from '../common/BDCardAndPaymentSelector';
import { PaymentTenderDetails } from '../../constants/paymentConfig';

interface FolioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  folioId: string;
  onPrintInvoice?: (folio: Folio) => void;
  onSuccess?: () => void;
}

export const FolioDrawer: React.FC<FolioDrawerProps> = ({
  isOpen,
  onClose,
  folioId,
  onPrintInvoice,
  onSuccess
}) => {
  const db = pmsService.getState();
  const folio = db.folios.find(f => f.id === folioId);
  const stay = folio ? db.stays.find(s => s.id === folio.stayId) : undefined;

  // Tab mode
  const [activeAction, setActiveAction] = useState<'view' | 'charge' | 'payment' | 'discount'>('view');

  // Charge state
  const [chargeType, setChargeType] = useState<FolioItem['type']>('Room Service');
  const [chargeDesc, setChargeDesc] = useState('');
  const [chargeQty, setChargeQty] = useState(1);
  const [chargeUnitPrice, setChargeUnitPrice] = useState(500);
  const [chargeTax, setChargeTax] = useState(true);
  const [allowStopPostOverride, setAllowStopPostOverride] = useState(false);

  // Payment state
  const [payAmount, setPayAmount] = useState<number | ''>(1000);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Credit Card');
  const [payRef, setPayRef] = useState('');
  const [payDetails, setPayDetails] = useState<Partial<PaymentTenderDetails>>({});

  // Discount state
  const [discAmount, setDiscAmount] = useState(500);
  const [discReason, setDiscReason] = useState('Management Courtesy / Corporate VIP Discount');

  // Void state
  const [itemToVoid, setItemToVoid] = useState<FolioItem | null>(null);
  const [voidReason, setVoidReason] = useState('');

  // Bill Resettle & Void Entire Folio state
  const [showResettleModal, setShowResettleModal] = useState(false);
  const [resettleReason, setResettleReason] = useState('');
  const [showVoidFolioModal, setShowVoidFolioModal] = useState(false);
  const [voidFolioReason, setVoidFolioReason] = useState('');

  // Stop Post inline modal state
  const [showStopPostModal, setShowStopPostModal] = useState(false);
  const [stopPostPreset, setStopPostPreset] = useState('Credit Limit Exceeded — Direct Pay Only');
  const [stopPostCustomReason, setStopPostCustomReason] = useState('');

  const [message, setMessage] = useState('');
  const canVoidBills = pmsService.hasPermission('can_void_bills') || rbacService.hasPermission('folio:void-charge') || rbacService.hasPermission('billing:bill-void') || rbacService.hasPermission('approvals:bill-void');
  const canResettleBills = rbacService.hasPermission('billing:bill-resettle') || rbacService.hasPermission('approvals:bill-resettle') || pmsService.hasPermission('can_void_bills');
  const canVoidEntireFolio = rbacService.hasPermission('billing:bill-void') || rbacService.hasPermission('approvals:bill-void');

  if (!isOpen || !folio) return null;

  const isStopPost = !!(folio.stopPost || stay?.stopPost);
  const stopPostReasonText = folio.stopPostReason || stay?.stopPostReason || 'Restricted by Front Office';

  const handleExecuteVoidItem = () => {
    if (!itemToVoid) return;
    if (!voidReason.trim()) {
      alert('Please specify an authorized void reason.');
      return;
    }
    try {
      pmsService.voidFolioItem(folio.id, itemToVoid.id, voidReason.trim());
      setMessage(`Item "${itemToVoid.description}" voided successfully.`);
      setItemToVoid(null);
      setVoidReason('');
      onSuccess?.();
    } catch (err: any) {
      alert(`Void Error: ${err.message}`);
    }
  };

  const handleExecuteResettleFolio = () => {
    if (!resettleReason.trim()) {
      alert('Please specify the reason for bill resettlement.');
      return;
    }
    try {
      pmsService.resettleFolio(folio.id, resettleReason.trim());
      setMessage(`Folio ${folio.folioNumber} reopened for resettlement.`);
      setShowResettleModal(false);
      setResettleReason('');
      onSuccess?.();
    } catch (err: any) {
      alert(`Resettle Error: ${err.message}`);
    }
  };

  const handleExecuteVoidEntireFolio = () => {
    if (!voidFolioReason.trim()) {
      alert('Please specify an authorized reason to void entire folio.');
      return;
    }
    try {
      pmsService.voidEntireFolio(folio.id, voidFolioReason.trim());
      setMessage(`Folio ${folio.folioNumber} has been voided.`);
      setShowVoidFolioModal(false);
      setVoidFolioReason('');
      onSuccess?.();
    } catch (err: any) {
      alert(`Void Error: ${err.message}`);
    }
  };

  const handleToggleStopPost = (enable: boolean) => {
    if (!folio.stayId) {
      alert('Cannot modify Stop Post: No active stay attached to folio.');
      return;
    }
    try {
      const reasonToUse = stopPostPreset === 'Other'
        ? (stopPostCustomReason.trim() || 'Restricted by Front Office')
        : (stopPostCustomReason.trim() ? `${stopPostPreset} (${stopPostCustomReason.trim()})` : stopPostPreset);

      pmsService.toggleStopPost(folio.stayId, enable, reasonToUse);
      setMessage(enable ? `Stop Post restriction enabled for Room ${folio.roomNumber}` : `Stop Post restriction removed for Room ${folio.roomNumber}`);
      setShowStopPostModal(false);
      onSuccess?.();
    } catch (err: any) {
      alert(err.message || 'Failed to update Stop Post');
    }
  };

  const handlePostCharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chargeDesc.trim() || chargeUnitPrice <= 0) return;

    try {
      pmsService.postFolioCharge(folio.id, {
        type: chargeType,
        description: chargeDesc,
        quantity: chargeQty,
        unitPrice: chargeUnitPrice,
        applyTax: chargeTax,
        allowStopPostOverride: isStopPost && allowStopPostOverride
      });
      setActiveAction('view');
      setMessage('Charge posted successfully to guest folio.');
      onSuccess?.();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = typeof payAmount === 'number' ? payAmount : parseFloat(payAmount) || 0;
    if (numAmount <= 0) return;

    try {
      pmsService.recordFolioPayment(folio.id, {
        amount: numAmount,
        method: payMethod as PaymentMethod,
        reference: payRef || 'Counter Payment',
        ...payDetails
      });
      setActiveAction('view');
      setMessage(`Payment of ৳${numAmount.toLocaleString()} via ${payMethod} recorded successfully.`);
      onSuccess?.();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleApplyDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (discAmount <= 0) return;

    try {
      pmsService.postFolioCharge(folio.id, {
        type: 'Discount',
        description: `Approved Discount: ${discReason}`,
        quantity: 1,
        unitPrice: 0,
        discount: discAmount,
        applyTax: false
      });
      setActiveAction('view');
      setMessage(`Discount of ৳${discAmount} applied to folio.`);
      onSuccess?.();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-150">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-xl h-full flex flex-col shadow-2xl text-xs text-slate-200">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center border border-amber-500/30">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-100">Guest Folio: {folio.folioNumber}</h3>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                  folio.status === 'Open' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {folio.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {folio.guestName} {folio.roomNumber ? `• Room ${folio.roomNumber}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons Bar */}
        <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveAction('view')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                activeAction === 'view' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Statement
            </button>
            <button
              onClick={() => setActiveAction('charge')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                activeAction === 'charge' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-amber-400 hover:bg-slate-800'
              }`}
            >
              <PlusCircle className="w-3 h-3" />
              <span>Post Charge</span>
            </button>
            <button
              onClick={() => setActiveAction('payment')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                activeAction === 'payment' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-emerald-400 hover:bg-slate-800'
              }`}
            >
              <CreditCard className="w-3 h-3" />
              <span>Add Payment</span>
            </button>
            <button
              onClick={() => setActiveAction('discount')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                activeAction === 'discount' ? 'bg-purple-500 text-white font-bold' : 'text-purple-400 hover:bg-slate-800'
              }`}
            >
              <Percent className="w-3 h-3" />
              <span>Discount</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Front Office Stop Post Toggle Button */}
            {folio.stayId && (
              <button
                onClick={() => {
                  if (isStopPost) {
                    handleToggleStopPost(false);
                  } else {
                    setShowStopPostModal(true);
                  }
                }}
                className={`flex items-center space-x-1 px-2 py-1 rounded text-[11px] font-bold border transition ${
                  isStopPost
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-800'
                }`}
                title={isStopPost ? "Click to unlock posting" : "Click to stop posting in this room"}
              >
                {isStopPost ? (
                  <>
                    <ShieldAlert className="w-3 h-3 text-amber-400" />
                    <span>Stop Post ON</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Stop Post</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => onPrintInvoice?.(folio)}
              className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium border border-slate-700"
            >
              <Printer className="w-3 h-3 text-amber-400" />
              <span>Print</span>
            </button>

            {canResettleBills && (
              <button
                onClick={() => setShowResettleModal(true)}
                className="flex items-center space-x-1 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-[11px] font-bold border border-amber-500/40 transition"
                title="Reopen or resettle guest folio"
              >
                <RotateCcw className="w-3 h-3 text-amber-400" />
                <span>Resettle</span>
              </button>
            )}

            {canVoidEntireFolio && folio.status !== 'Void' && (
              <button
                onClick={() => setShowVoidFolioModal(true)}
                className="flex items-center space-x-1 px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded text-[11px] font-bold border border-rose-500/40 transition"
                title="Void entire guest folio"
              >
                <Trash2 className="w-3 h-3 text-rose-400" />
                <span>Void Folio</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* STOP POST ALERT BANNER */}
          {isStopPost && (
            <div className="p-3 bg-amber-950/40 border border-amber-500/50 rounded-lg text-xs space-y-1.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>STOP POST ACTIVE ON ROOM {folio.roomNumber}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleStopPost(false)}
                  className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[10px] flex items-center gap-1 transition"
                >
                  <Unlock className="w-3 h-3" />
                  Unlock
                </button>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                Restriction Policy: <span className="font-semibold text-white">"{stopPostReasonText}"</span>. All automated and POS postings from Restaurant, In-Room Dining, and Outlets to this folio are blocked.
              </p>
            </div>
          )}

          {message && (
            <div className="p-2.5 bg-slate-800 border border-slate-700 rounded text-amber-300 text-[11px]">
              {message}
            </div>
          )}

          {/* 1. Subform: Post Charge */}
          {activeAction === 'charge' && (
            <form onSubmit={handlePostCharge} className="bg-slate-950 p-3.5 rounded-lg border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-400 text-xs block">Post New Charge to Folio</span>
                {isStopPost && (
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold">
                    Stop Post Active
                  </span>
                )}
              </div>

              {isStopPost && (
                <div className="p-2.5 bg-amber-950/60 border border-amber-600/40 rounded text-[11px] text-amber-200 space-y-1">
                  <p className="font-semibold text-amber-300">⚠️ Stop Post restriction is active for this room.</p>
                  <label className="flex items-center space-x-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowStopPostOverride}
                      onChange={(e) => setAllowStopPostOverride(e.target.checked)}
                      className="rounded bg-slate-900 border-amber-500 text-amber-500 focus:ring-amber-400"
                    />
                    <span className="text-amber-100 font-bold">Front Office Manual Posting Override</span>
                  </label>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Charge Category:</span>
                  <select
                    value={chargeType}
                    onChange={(e) => setChargeType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                  >
                    <option value="Room Service">Room Service Dining</option>
                    <option value="Restaurant">Restaurant Charges</option>
                    <option value="Laundry">Laundry Service</option>
                    <option value="Spa">Swimming / Spa Service</option>
                    <option value="Extra Bed">Extra Bed / Mattress</option>
                    <option value="Minibar">Minibar Consumption</option>
                    <option value="Damage">Damage / Repair Charge</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Description:</span>
                  <input
                    type="text"
                    value={chargeDesc}
                    onChange={(e) => setChargeDesc(e.target.value)}
                    placeholder="e.g. Club Sandwich & Juice"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Unit Price (৳):</span>
                  <input
                    type="number"
                    value={chargeUnitPrice}
                    onChange={(e) => setChargeUnitPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Quantity:</span>
                  <input
                    type="number"
                    min="1"
                    value={chargeQty}
                    onChange={(e) => setChargeQty(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={chargeTax}
                    onChange={(e) => setChargeTax(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500"
                  />
                  <span className="text-[11px] text-slate-300">Apply Standard VAT (15%)</span>
                </label>
                <div className="space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveAction('view')}
                    className="px-2.5 py-1 bg-slate-800 text-slate-400 rounded text-[11px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-[11px]"
                  >
                    Post Charge
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* 2. Subform: Add Payment */}
          {activeAction === 'payment' && (
            <form onSubmit={handleRecordPayment} className="bg-slate-950 p-3.5 rounded-lg border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 text-xs">Receive & Record Payment</span>
                <span className="text-[10px] text-slate-400">
                  Folio Outstanding: <strong className="text-amber-400 font-mono">৳{(folio.balance || 0).toLocaleString()}</strong>
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-400">Settlement Amount (৳):</span>
                  {folio.balance > 0 && (
                    <button
                      type="button"
                      onClick={() => setPayAmount(folio.balance)}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold underline"
                    >
                      Pay Full Due (৳{folio.balance.toLocaleString()})
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setPayAmount('');
                    } else {
                      const parsed = parseFloat(val);
                      setPayAmount(isNaN(parsed) ? '' : parsed);
                    }
                  }}
                  placeholder="0"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono font-bold text-sm"
                />
              </div>

              <BDCardAndPaymentSelector
                method={payMethod}
                onMethodChange={setPayMethod}
                amount={Number(payAmount) || 0}
                reference={payRef}
                onReferenceChange={setPayRef}
                details={payDetails}
                onDetailsChange={setPayDetails}
                theme="dark"
              />

              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveAction('view')}
                  className="px-2.5 py-1 bg-slate-800 text-slate-400 rounded text-[11px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[11px] shadow-md shadow-emerald-900/30"
                >
                  Record Payment
                </button>
              </div>
            </form>
          )}

          {/* 3. Subform: Apply Discount */}
          {activeAction === 'discount' && (
            <form onSubmit={handleApplyDiscount} className="bg-slate-950 p-3.5 rounded-lg border border-purple-500/30 space-y-3">
              <span className="font-bold text-purple-400 text-xs block">Apply Manager Discount</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Discount Amount (৳):</span>
                  <input
                    type="number"
                    value={discAmount}
                    onChange={(e) => setDiscAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono font-bold"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Approval Reason:</span>
                  <input
                    type="text"
                    value={discReason}
                    onChange={(e) => setDiscReason(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveAction('view')}
                  className="px-2.5 py-1 bg-slate-800 text-slate-400 rounded text-[11px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded text-[11px]"
                >
                  Apply Discount
                </button>
              </div>
            </form>
          )}

          {/* Erroneous Future Night Audit Charges Banner & 1-Click Fix */}
          {folio.items.some(it => 
            Boolean(it.postedBy && it.postedBy.includes('System Auto Night Audit')) &&
            Boolean(it.description && (
              it.description.includes('2028-') || 
              it.description.includes('2027-') || 
              it.description.includes('2026-09-23') ||
              it.description.includes('2026-09-24') ||
              it.description.includes('2026-09-25') ||
              it.description.includes('2026-09-26') ||
              it.description.includes('2026-09-27')
            ))
          ) && (
            <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-lg flex items-center justify-between gap-3 text-xs text-amber-200 animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Detected invalid future auto night audit room charges from runaway scheduler.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = pmsService.cleanErroneousAutoCharges(folio.id);
                  setMessage(res.message);
                  onSuccess?.();
                }}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-[11px] shrink-0 transition shadow-xs cursor-pointer"
              >
                Remove Invalid Charges
              </button>
            </div>
          )}

          {/* Main Statement Table */}
          <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Itemized Transactions</span>
              <span className="text-[11px] text-slate-400">{folio.items.length} Line Items</span>
            </div>

            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Transaction</th>
                  <th className="py-2 px-2">Type</th>
                  <th className="py-2 px-2 text-center">Qty</th>
                  <th className="py-2 px-3 text-right">Tax (৳)</th>
                  <th className="py-2 px-3 text-right">Total (৳)</th>
                  <th className="py-2 px-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {folio.items.map(it => (
                  <tr key={it.id} className={`hover:bg-slate-900/40 ${it.voided ? 'opacity-40 line-through bg-rose-950/10' : ''}`}>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-200 block">{it.description}</span>
                        {it.voided && (
                          <span className="no-underline px-1.5 py-0.2 bg-rose-500/20 text-rose-300 text-[9px] font-bold rounded">
                            VOIDED
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        {it.postedBy} • {it.createdAt ? it.createdAt.split('T')[0] : 'Current'}
                        {it.voidReason && ` (Void Reason: ${it.voidReason})`}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {it.type}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center font-mono text-slate-400">{it.quantity}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-400">৳{(it.tax || 0).toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-slate-200">
                      {it.discount && it.discount > 0 ? (
                        <span className="text-purple-400">-৳{(it.discount || 0).toLocaleString()}</span>
                      ) : (
                        `৳${(it.total || 0).toLocaleString()}`
                      )}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {!it.voided && (
                        <button
                          type="button"
                          onClick={() => setItemToVoid(it)}
                          disabled={!canVoidBills}
                          className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Void this line item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Financial Ledger Calculation */}
            <div className="p-3.5 bg-slate-900/90 border-t border-slate-800 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal (Room + Services):</span>
                <span className="font-mono">৳{(folio.subtotal || 0).toLocaleString()}</span>
              </div>
              {folio.discountTotal > 0 && (
                <div className="flex justify-between text-purple-400 font-medium">
                  <span>Courtesy Discounts:</span>
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
              <div className="flex justify-between font-bold text-slate-100 border-t border-slate-800 pt-1 text-xs">
                <span>Grand Total:</span>
                <span className="font-mono text-amber-400">৳{(folio.grandTotal || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Total Paid / Advance Deposits:</span>
                <span className="font-mono">৳{(folio.paidTotal || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-sm bg-slate-950 p-2.5 rounded border border-slate-800">
                <span>Net Outstanding Balance:</span>
                <span className={`font-mono ${folio.balance <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ৳{(folio.balance || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium text-xs transition-colors"
          >
            Close Folio
          </button>
        </div>

        {/* Void Line Item Modal */}
        {itemToVoid && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-xs text-slate-200">
              <div className="flex items-center space-x-3 text-rose-400">
                <div className="p-2 bg-rose-500/20 rounded-xl border border-rose-500/30">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Void Folio Transaction</h3>
                  <p className="text-slate-400 text-[11px]">Audit-logged financial reversal</p>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <p className="text-slate-300 font-semibold">{itemToVoid.description}</p>
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>Type: {itemToVoid.type}</span>
                  <span className="text-amber-400 font-bold">৳{(itemToVoid.total || 0).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Reason for Voiding <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={2}
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="e.g., Billing error / Duplicate posting / Guest disputed"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:ring-1 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setItemToVoid(null);
                    setVoidReason('');
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteVoidItem}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition text-xs shadow-lg shadow-rose-900/40"
                >
                  Confirm Void
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stop Post Confirmation Modal */}
        {showStopPostModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-xs text-slate-200">
              <div className="flex items-center space-x-3 text-amber-400">
                <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/30">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Activate Stop Post on Room {folio.roomNumber}</h3>
                  <p className="text-slate-400 text-[11px]">Prevent Outlet & POS charges to this folio</p>
                </div>
              </div>

              <div className="p-3 bg-amber-950/30 rounded-xl border border-amber-500/30 text-slate-300 space-y-1">
                <p className="text-[11px] text-amber-200">
                  When enabled, staff in the Restaurant POS, In-Room Dining, Minibar, and Spa outlets will not be able to post new room charges to {folio.guestName}.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-slate-300 font-medium">
                  Reason for Restriction <span className="text-amber-400">*</span>
                </label>
                <select
                  value={stopPostPreset}
                  onChange={(e) => setStopPostPreset(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                >
                  <option value="Credit Limit Exceeded — Direct Pay Only">Credit Limit Exceeded — Direct Pay Only</option>
                  <option value="Cash / MFS Only (No Card Pre-Auth on file)">Cash / MFS Only (No Card Pre-Auth on file)</option>
                  <option value="Guest Request — Block Outlet Charges to Room">Guest Request — Block Outlet Charges to Room</option>
                  <option value="Corporate Master Account — Settle Separately">Corporate Master Account — Settle Separately</option>
                  <option value="Pending Advance Deposit Clearance">Pending Advance Deposit Clearance</option>
                  <option value="Disputed Charges — Under FO Review">Disputed Charges — Under FO Review</option>
                  <option value="Checkout in Progress / Settlement Lock">Checkout in Progress / Settlement Lock</option>
                  <option value="Other">Other / Custom Reason</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={stopPostCustomReason}
                  onChange={(e) => setStopPostCustomReason(e.target.value)}
                  placeholder="e.g. Deposit pending or guest pays cash at outlet"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStopPostModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleStopPost(true)}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition text-xs shadow-lg shadow-rose-900/40 flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Confirm Stop Post</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Resettle Folio Modal */}
        {showResettleModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-xs text-slate-200">
              <div className="flex items-center space-x-3 text-amber-400">
                <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/30">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Resettle Folio #{folio.folioNumber}</h3>
                  <p className="text-slate-400 text-[11px]">Reopen bill for payment realignment / folio adjustments</p>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span>Guest: <strong className="text-white">{folio.guestName}</strong></span>
                  <span>Room: <strong className="text-amber-400">{folio.roomNumber}</strong></span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>Total: ৳{(folio.grandTotal || 0).toLocaleString()}</span>
                  <span>Paid: ৳{(folio.paidTotal || 0).toLocaleString()}</span>
                  <span className="text-rose-400">Balance: ৳{(folio.balance || 0).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Supervisor Reason for Resettlement <span className="text-amber-400">*</span>
                </label>
                <textarea
                  rows={2}
                  value={resettleReason}
                  onChange={(e) => setResettleReason(e.target.value)}
                  placeholder="e.g., Payment method switch / Corporate voucher adjustment / Split re-allocation"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowResettleModal(false);
                    setResettleReason('');
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteResettleFolio}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl transition text-xs shadow-lg shadow-amber-900/40"
                >
                  Reopen & Resettle
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Void Entire Folio Modal */}
        {showVoidFolioModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-xs text-slate-200">
              <div className="flex items-center space-x-3 text-rose-400">
                <div className="p-2 bg-rose-500/20 rounded-xl border border-rose-500/30">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Void Entire Folio #{folio.folioNumber}</h3>
                  <p className="text-rose-400 text-[11px] font-semibold">Critical Financial Action — All charges will be reversed</p>
                </div>
              </div>

              <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl text-[11px] text-rose-200 space-y-1">
                <p>
                  This action marks the entire folio and all associated charges as <strong>VOID</strong> in the guest ledger.
                  Full audit trail logging will record your user signature, timestamp, and reason.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Manager Authorization Reason <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={2}
                  value={voidFolioReason}
                  onChange={(e) => setVoidFolioReason(e.target.value)}
                  placeholder="e.g., Erroneous duplicate stay registered / Authorized booking annulment"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:ring-1 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowVoidFolioModal(false);
                    setVoidFolioReason('');
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteVoidEntireFolio}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition text-xs shadow-lg shadow-rose-900/40"
                >
                  Confirm Void Entire Folio
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
