import React, { useState } from 'react';
import {
  Sparkles, CheckCircle2, XCircle, AlertTriangle,
  X, Check, ShieldCheck, FileText, User, BedDouble
} from 'lucide-react';
import { InspectionCheckItem, RoomInspectionRecord } from '../../types/housekeeping';
import { housekeepingService } from '../../services/housekeepingService';

interface HousekeepingInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomNumber: string;
  roomTypeName: string;
  taskId?: string;
  attendantName?: string;
  onSuccess?: () => void;
}

const DEFAULT_INSPECTION_ITEMS: InspectionCheckItem[] = [
  { id: 'chk-1', category: 'Bedroom', name: 'Bed Frame, Headboard & Mattress', status: 'Pass' },
  { id: 'chk-2', category: 'Bedroom', name: 'Clean Bed Sheets, Duvet & Pillow Covers (Tucked)', status: 'Pass' },
  { id: 'chk-3', category: 'Bedroom', name: 'Floor / Carpet Vacuumed & Stain-Free', status: 'Pass' },
  { id: 'chk-4', category: 'Bedroom', name: 'Wardrobe, Safe & Wooden Hangers (x6)', status: 'Pass' },
  { id: 'chk-5', category: 'Bathroom', name: 'Shower Enclosure, Glass & Tub Sanitized', status: 'Pass' },
  { id: 'chk-6', category: 'Bathroom', name: 'Commode & Bidet Disinfected & Paper Sealed', status: 'Pass' },
  { id: 'chk-7', category: 'Bathroom', name: 'Basin, Chrome Faucets & Mirror Smudge-Free', status: 'Pass' },
  { id: 'chk-8', category: 'Bathroom', name: 'Plush Towels (2 Bath, 2 Hand, 1 Mat) Aligned', status: 'Pass' },
  { id: 'chk-9', category: 'Fixtures & Electronics', name: 'Air Conditioner & Remote Temperature Calibrated', status: 'Pass' },
  { id: 'chk-10', category: 'Fixtures & Electronics', name: 'Smart TV, Cable Channels & Sound Check', status: 'Pass' },
  { id: 'chk-11', category: 'Fixtures & Electronics', name: 'Intercom Telephone & Resort Directory Present', status: 'Pass' },
  { id: 'chk-12', category: 'Fixtures & Electronics', name: 'Mini-Bar Fridge Cold & Inventory Verified', status: 'Pass' },
  { id: 'chk-13', category: 'Amenities & Supplies', name: 'Toiletries (Soap, Shampoo, Dental Kit) Replenished', status: 'Pass' },
  { id: 'chk-14', category: 'Amenities & Supplies', name: 'Complimentary Mineral Water (x2) & Tea/Coffee Kit', status: 'Pass' },
  { id: 'chk-15', category: 'Overall', name: 'Room Air Freshness & Aroma Diffuser', status: 'Pass' },
  { id: 'chk-16', category: 'Overall', name: 'Balcony / Window Cleanliness & Safety Latches', status: 'Pass' }
];

export const HousekeepingInspectionModal: React.FC<HousekeepingInspectionModalProps> = ({
  isOpen,
  onClose,
  roomId,
  roomNumber,
  roomTypeName,
  taskId,
  attendantName,
  onSuccess
}) => {
  const [items, setItems] = useState<InspectionCheckItem[]>(DEFAULT_INSPECTION_ITEMS);
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleStatusToggle = (id: string, status: 'Pass' | 'Fail' | 'N/A') => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, status } : item));
  };

  const passCount = items.filter(i => i.status === 'Pass').length;
  const failCount = items.filter(i => i.status === 'Fail').length;
  const naCount = items.filter(i => i.status === 'N/A').length;
  const totalApplicable = items.filter(i => i.status !== 'N/A').length;
  const scorePercent = totalApplicable > 0 ? Math.round((passCount / totalApplicable) * 100) : 100;
  const overallResult: 'Pass' | 'Fail' = failCount === 0 ? 'Pass' : 'Fail';

  const handleSubmit = (overrideResult?: 'Pass' | 'Fail') => {
    setIsSubmitting(true);
    try {
      const finalResult = overrideResult || overallResult;
      housekeepingService.performRoomInspection({
        roomId,
        taskId,
        items,
        overallResult: finalResult,
        remarks: remarks || (finalResult === 'Pass' ? 'Passed full 16-point housekeeping inspection.' : `Inspection failed (${failCount} defects flagged). Returned to cleaning.`)
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = Array.from(new Set(items.map(i => i.category)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-100">Supervisor Room Inspection</h2>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[11px] font-bold">
                  Room {roomNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {roomTypeName} • Cleaned by {attendantName || 'Attendant'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score & Summary Banner */}
        <div className="px-5 py-3.5 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-6">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Inspection Score</span>
              <span className={`text-lg font-mono font-bold ${scorePercent >= 90 ? 'text-emerald-400' : scorePercent >= 75 ? 'text-amber-400' : 'text-red-400'}`}>
                {scorePercent}%
              </span>
            </div>
            <div className="h-7 w-px bg-slate-800" />
            <div className="flex items-center space-x-4 text-[11px]">
              <span className="flex items-center space-x-1 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{passCount} Pass</span>
              </span>
              <span className="flex items-center space-x-1 text-red-400 font-medium">
                <XCircle className="w-3.5 h-3.5" />
                <span>{failCount} Fail</span>
              </span>
              <span className="flex items-center space-x-1 text-slate-400">
                <span>{naCount} N/A</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center space-x-1 ${
              overallResult === 'Pass' 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}>
              {overallResult === 'Pass' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              <span>{overallResult === 'Pass' ? 'STATUS: READY FOR FO' : 'STATUS: DEFECTS FLAGGED'}</span>
            </span>
          </div>
        </div>

        {/* 16-Point Inspection Checklist Body */}
        <div className="p-5 max-h-[50vh] overflow-y-auto space-y-5 text-xs">
          {categories.map(cat => (
            <div key={cat} className="space-y-2">
              <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-300 uppercase tracking-wider pb-1 border-b border-slate-800">
                <BedDouble className="w-3.5 h-3.5 text-blue-400" />
                <span>{cat} Checkpoints</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {items.filter(i => i.category === cat).map(item => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                      item.status === 'Pass'
                        ? 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                        : item.status === 'Fail'
                        ? 'bg-red-950/20 border-red-500/40'
                        : 'bg-slate-950/20 border-slate-800/40'
                    }`}
                  >
                    <span className={`text-[11.5px] ${item.status === 'Fail' ? 'text-red-300 font-medium' : 'text-slate-200'}`}>
                      {item.name}
                    </span>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(item.id, 'Pass')}
                        className={`px-2.5 py-1 rounded text-[10.5px] font-bold transition-all ${
                          item.status === 'Pass'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                        }`}
                      >
                        Pass
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(item.id, 'Fail')}
                        className={`px-2.5 py-1 rounded text-[10.5px] font-bold transition-all ${
                          item.status === 'Fail'
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                        }`}
                      >
                        Fail
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(item.id, 'N/A')}
                        className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                          item.status === 'N/A'
                            ? 'bg-slate-700 text-slate-200'
                            : 'bg-slate-850 text-slate-500 hover:bg-slate-800'
                        }`}
                      >
                        N/A
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Supervisor Inspection Remarks */}
          <div className="space-y-1.5 pt-2">
            <label className="text-[11px] font-bold text-slate-300 flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Supervisor Remarks / Defect Instructions:</span>
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="e.g. Pristine room. Verified fresh high thread-count duvet and sparkling bathroom fittings."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-xs transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-2.5">
            {failCount > 0 ? (
              <>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit('Fail')}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs flex items-center space-x-1.5 transition-colors shadow-lg shadow-red-900/20"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject & Return to Cleaning</span>
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit('Pass')}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg text-xs transition-colors"
                >
                  Supervisor Override (Approve)
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit('Pass')}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center space-x-1.5 transition-colors shadow-lg shadow-emerald-900/30"
              >
                <Check className="w-4 h-4" />
                <span>Approve Room (Vacant Clean & FO Ready)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
