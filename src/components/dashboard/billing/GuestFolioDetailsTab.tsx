import React, { useState } from 'react';
import { FileText, ShieldAlert, ShieldCheck, DollarSign, CreditCard, AlertTriangle, ArrowRight, Printer, CheckCircle2 } from 'lucide-react';
import { Room, Stay, Folio, FolioItem } from '../../../types/pms';
import { pmsService } from '../../../services/pmsService';

interface GuestFolioDetailsTabProps {
  room: Room;
  activeStay: Stay;
  activeFolio: Folio;
  onShowToast: (msg: string) => void;
  onSelectStay?: (stayId: string) => void;
  onNavigateToPayment?: () => void;
  onCloseModal?: () => void;
}

export const GuestFolioDetailsTab: React.FC<GuestFolioDetailsTabProps> = ({
  room,
  activeStay,
  activeFolio,
  onShowToast,
  onSelectStay,
  onNavigateToPayment,
  onCloseModal
}) => {
  const [showStopPostModal, setShowStopPostModal] = useState<boolean>(false);
  const [stopPostReason, setStopPostReason] = useState<string>('Exceeded credit limit / Front desk policy');
  const [showAdjustmentModal, setShowAdjustmentModal] = useState<boolean>(false);
  const [adjDesc, setAdjDesc] = useState<string>('');
  const [adjAmount, setAdjAmount] = useState<number>(0);
  const [adjType, setAdjType] = useState<'Discount' | 'Adjustment'>('Adjustment');

  const handleToggleStopPost = () => {
    try {
      const newStatus = !activeStay.stopPost;
      pmsService.toggleStopPost(activeStay.id, newStatus, newStatus ? stopPostReason : undefined);
      onShowToast(newStatus ? 'Stop-Post restriction enabled for this folio.' : 'Stop-Post restriction lifted.');
      setShowStopPostModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to toggle stop post');
    }
  };

  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjDesc.trim()) {
      alert('Please provide a reason/description for the adjustment.');
      return;
    }
    if (adjAmount <= 0) {
      alert('Adjustment amount must be greater than zero.');
      return;
    }

    try {
      pmsService.postFolioCharge(activeFolio.id, {
        type: adjType,
        description: `Adjustment: ${adjDesc.trim()}`,
        quantity: 1,
        unitPrice: -Math.abs(adjAmount),
        applyTax: false
      });
      onShowToast(`Folio adjusted by -৳${adjAmount.toLocaleString()}`);
      setShowAdjustmentModal(false);
      setAdjDesc('');
      setAdjAmount(0);
    } catch (err: any) {
      alert(err.message || 'Failed to post adjustment');
    }
  };

  const isStopPost = activeStay.stopPost || activeFolio.stopPost;

  return (
    <div className="space-y-4 text-xs">
      {/* Folio Master Header */}
      <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                Folio Master
              </span>
              <span className="font-mono font-black text-sm text-slate-900">{activeFolio.folioNumber}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                activeFolio.status === 'Open' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
              }`}>
                {activeFolio.status}
              </span>
            </div>
            <p className="text-gray-500 text-[11px] mt-1">
              Guest: <strong className="text-gray-900">{activeFolio.guestName}</strong> • Room: <strong className="text-gray-900">{room.roomNumber} ({room.roomTypeName})</strong>
            </p>
          </div>

          {/* Stop Post Status Control */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowStopPostModal(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 border transition-colors ${
                isStopPost
                  ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
              }`}
            >
              {isStopPost ? <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
              <span>{isStopPost ? 'Stop-Post Active (Restricted)' : 'Stop-Post Allowed'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAdjustmentModal(true)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-xs"
            >
              + Adjustment
            </button>
          </div>
        </div>

        {/* Stop Post Warning Bar if active */}
        {isStopPost && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-[11px] flex items-center justify-between">
            <span>
              <strong>Charge Posting Blocked:</strong> {activeStay.stopPostReason || activeFolio.stopPostReason || 'Restricted by Front Desk'}
            </span>
            <button
              type="button"
              onClick={handleToggleStopPost}
              className="text-rose-900 underline font-bold"
            >
              Lift Lock
            </button>
          </div>
        )}
      </div>

      {/* Stop Post Confirmation Modal / Inline Drawer */}
      {showStopPostModal && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h5 className="font-black text-amber-900 text-xs flex items-center space-x-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              <span>{isStopPost ? 'Remove Stop-Post Restriction' : 'Enable Stop-Post (Block Outlet Charges)'}</span>
            </h5>
            <button
              type="button"
              onClick={() => setShowStopPostModal(false)}
              className="text-amber-800 text-xs font-bold"
            >
              Cancel
            </button>
          </div>
          <p className="text-[11px] text-amber-800">
            {isStopPost
              ? 'Lifting the stop post lock will allow restaurant, room service, laundry, and minibar outlets to post charges to this room.'
              : 'When Stop-Post is enabled, staff at F&B outlets, laundry, and spa cannot charge bills to this room without supervisor override.'}
          </p>
          {!isStopPost && (
            <input
              type="text"
              value={stopPostReason}
              onChange={e => setStopPostReason(e.target.value)}
              placeholder="Reason for stop-post restriction..."
              className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs"
            />
          )}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleToggleStopPost}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs ${
                isStopPost ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {isStopPost ? 'Confirm Lift Restriction' : 'Confirm Enable Stop-Post'}
            </button>
          </div>
        </div>
      )}

      {/* Quick Adjustment Drawer */}
      {showAdjustmentModal && (
        <form onSubmit={handleApplyAdjustment} className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h5 className="font-black text-blue-950 text-xs">Post Folio Adjustment / Credit</h5>
            <button
              type="button"
              onClick={() => setShowAdjustmentModal(false)}
              className="text-blue-800 text-xs font-bold"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-bold text-blue-900 block mb-0.5">Type:</label>
              <select
                value={adjType}
                onChange={e => setAdjType(e.target.value as any)}
                className="w-full px-2 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-bold"
              >
                <option value="Adjustment">Folio Adjustment</option>
                <option value="Discount">Manager Courtesy Discount</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-blue-900 block mb-0.5">Credit Amount (৳):</label>
              <input
                type="number"
                min="1"
                required
                value={adjAmount}
                onChange={e => setAdjAmount(Number(e.target.value) || 0)}
                className="w-full px-2 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-blue-900 block mb-0.5">Reason / Description:</label>
              <input
                type="text"
                required
                value={adjDesc}
                onChange={e => setAdjDesc(e.target.value)}
                placeholder="e.g. AC service defect rebate, VIP promo"
                className="w-full px-2 py-1.5 bg-white border border-blue-300 rounded-lg text-xs"
              />
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs"
            >
              Apply Adjustment (-৳{adjAmount.toLocaleString()})
            </button>
          </div>
        </form>
      )}

      {/* Itemized Folio Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
        <div className="px-3.5 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <span className="font-bold text-gray-800 text-xs">Itemized Folio Transactions ({activeFolio.items.length})</span>
          <span className="text-[10px] text-gray-500 font-mono">Currency: BDT (৳)</span>
        </div>

        <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
          {activeFolio.items.length === 0 ? (
            <div className="p-6 text-center text-gray-400">No transactions recorded on this folio.</div>
          ) : (
            activeFolio.items.map((item, idx) => (
              <div key={item.id || idx} className="p-3 flex items-center justify-between hover:bg-gray-50 text-xs">
                <div className="space-y-0.5 truncate mr-3">
                  <div className="flex items-center space-x-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      item.type === 'Room Charge'
                        ? 'bg-purple-100 text-purple-800'
                        : (item.type as any) === 'Payment'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.type === 'Adjustment'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {item.type}
                    </span>
                    <span className="font-semibold text-gray-900 truncate">{item.description}</span>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    {item.quantity} × ৳{(item.unitPrice || 0).toLocaleString()} 
                    {item.tax ? ` • Tax ৳${item.tax.toLocaleString()}` : ''}
                    {item.postedBy ? ` • By ${item.postedBy}` : ''}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className={`font-mono font-bold ${item.total < 0 ? 'text-emerald-700' : 'text-gray-900'}`}>
                    ৳{(item.total || 0).toLocaleString()}
                  </span>
                  <p className="text-[9px] text-gray-400 font-mono">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Today'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Financial Summary Breakdown */}
      <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5 text-xs">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal:</span>
          <span className="font-mono">৳{(activeFolio.subtotal || 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Service Charge (10%):</span>
          <span className="font-mono">৳{(activeFolio.serviceChargeTotal || 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>VAT / Tax (15%):</span>
          <span className="font-mono">৳{(activeFolio.taxTotal || 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-bold text-gray-900 pt-1.5 border-t border-gray-300">
          <span>Grand Total:</span>
          <span className="font-mono text-sm">৳{(activeFolio.grandTotal || 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-emerald-700 font-bold">
          <span>Total Payments Received:</span>
          <span className="font-mono">৳{(activeFolio.paidTotal || 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-base font-black pt-1 border-t border-gray-300">
          <span className={activeFolio.balance > 0 ? 'text-rose-700' : 'text-emerald-700'}>
            Net Balance Due:
          </span>
          <span className={`font-mono ${activeFolio.balance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
            ৳{(activeFolio.balance || 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => {
            onCloseModal();
            onSelectStay(activeStay.id);
          }}
          className="text-xs font-bold text-indigo-700 hover:underline flex items-center space-x-1"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Open Full Folio Billing Drawer</span>
        </button>

        {activeFolio.balance > 0 && (
          <button
            type="button"
            onClick={onNavigateToPayment}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Pay Guest Bill (৳{activeFolio.balance.toLocaleString()})</span>
          </button>
        )}
      </div>
    </div>
  );
};
