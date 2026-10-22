import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Search, ShieldCheck, Edit3, Check, AlertCircle, RefreshCw,
  DollarSign, FileText, BedDouble, Receipt, Calendar, ArrowRight, Save, PlusCircle
} from 'lucide-react';
import { pmsService } from '../../services/pmsService';
import { authService } from '../../services/authService';
import { supabaseSyncService } from '../../services/supabaseSyncService';
import { Folio, FolioItem } from '../../types/pms';

interface MasterLedgerCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetFolioId?: string;
}

export const MasterLedgerCorrectionModal: React.FC<MasterLedgerCorrectionModalProps> = ({
  isOpen,
  onClose,
  targetFolioId
}) => {
  const [db, setDb] = useState(pmsService.getState());
  const [search, setSearch] = useState(targetFolioId || '');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [editingItem, setEditingItem] = useState<{ folioId: string; item: FolioItem } | null>(null);

  // Edit form states
  const [editDesc, setEditDesc] = useState('');
  const [editQty, setEditQty] = useState<number>(1);
  const [editUnitPrice, setEditUnitPrice] = useState<number>(0);
  const [editTotal, setEditTotal] = useState<number>(0);
  const [editReason, setEditReason] = useState('Corrected wrong posting amount');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Cloud Sync Toggle state
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(supabaseSyncService.isCloudSyncEnabled());

  useEffect(() => {
    return pmsService.subscribe(setDb);
  }, []);

  useEffect(() => {
    if (editingItem) {
      setEditDesc(editingItem.item.description);
      setEditQty(editingItem.item.quantity || 1);
      setEditUnitPrice(editingItem.item.unitPrice || 0);
      setEditTotal(editingItem.item.total || 0);
      setEditReason('Mistaken charge amount correction');
      setStatusMsg(null);
    }
  }, [editingItem]);

  const allItems = useMemo(() => {
    const list: { folio: Folio; item: FolioItem }[] = [];
    (db.folios || []).forEach(f => {
      (f.items || []).forEach(it => {
        list.push({ folio: f, item: it });
      });
    });
    return list;
  }, [db.folios]);

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allItems.filter(({ folio, item }) => {
      if (item.voided) return false;
      const matchesSearch =
        !q ||
        folio.folioNumber.toLowerCase().includes(q) ||
        folio.roomNumber.toLowerCase().includes(q) ||
        folio.guestName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        (item.reference && item.reference.toLowerCase().includes(q));

      const matchesType =
        typeFilter === 'All' ||
        (typeFilter === 'Food & Beverage' && (item.type === 'Restaurant' || item.type === 'Room Service')) ||
        (typeFilter === 'Spa & Wellness' && (item.type === 'Spa/Wellness' || item.type === 'Amenity')) ||
        (typeFilter === 'Adjustment' && (item.type === 'Adjustment' || item.type === 'Discount')) ||
        item.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [allItems, search, typeFilter]);

  if (!isOpen) return null;

  const isOwner = authService.isSystemOwner(authService.getCurrentUser());
  if (!isOwner) {
    return (
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-rose-500/40 p-5 rounded-2xl max-w-md w-full text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-100">Access Restricted</h3>
          <p className="text-xs text-slate-400">
            The Master Ledger & Billing Correction Tool is exclusively accessible to the root System Owner (@admin - Labib Zunaedy).
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const handleSaveCorrection = () => {
    if (!editingItem) return;
    if (!editDesc.trim()) {
      setStatusMsg({ type: 'error', text: 'Item description cannot be empty.' });
      return;
    }
    if (isNaN(editTotal) || editTotal < 0) {
      setStatusMsg({ type: 'error', text: 'Please enter a valid positive total amount.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const res = pmsService.correctFolioItem(editingItem.folioId, editingItem.item.id, {
        description: editDesc.trim(),
        quantity: editQty,
        unitPrice: editUnitPrice,
        total: editTotal,
        reason: editReason.trim()
      });

      if (res.success) {
        setStatusMsg({ type: 'success', text: res.message });
        setEditingItem(null);
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to update ledger charge.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleCloudSync = () => {
    const newState = !cloudSyncEnabled;
    supabaseSyncService.setCloudSyncEnabled(newState);
    setCloudSyncEnabled(newState);
    setStatusMsg({
      type: 'success',
      text: newState
        ? 'Live Cloud Database Sync ENABLED. (Deployment mode active)'
        : 'Live Cloud Database Sync DISABLED. (IDE sandbox protected - local only)'
    });
  };

  const handleSeedSampleFolio = () => {
    try {
      const res = pmsService.seedSampleFolioForTesting();
      if (res.success) {
        setStatusMsg({ type: 'success', text: res.message });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to create sample folio' });
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden text-xs text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center border border-amber-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-100">System Owner Master Ledger & Charge Editor</h3>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                  Root Admin Tool
                </span>
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Background ledger correction engine for wrongly posted bills, charges, and rates without disrupting active users.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Database Cloud Sync Protection Switch */}
            <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="text-[11px] text-slate-400">Cloud DB Sync:</span>
              <button
                type="button"
                onClick={handleToggleCloudSync}
                className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition ${
                  cloudSyncEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
                title={cloudSyncEnabled ? 'Cloud Sync is Active (Production)' : 'Cloud Sync is Paused (IDE Sandbox Protected)'}
              >
                {cloudSyncEnabled ? 'LIVE SYNC ON' : 'SANDBOX (SYNC OFF)'}
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status notification */}
        {statusMsg && (
          <div className={`p-3 text-xs flex items-center justify-between ${
            statusMsg.type === 'success'
              ? 'bg-emerald-950/60 text-emerald-300 border-b border-emerald-800/60'
              : 'bg-rose-950/60 text-rose-300 border-b border-rose-800/60'
          }`}>
            <span>{statusMsg.text}</span>
            <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Filter bar */}
        <div className="p-3 bg-slate-950/50 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2 flex-1 min-w-[280px]">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search folio #, room, guest name, or charge description..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="px-2 py-1 text-[11px] text-slate-400 hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center space-x-1.5 text-[11px]">
            <span className="text-slate-400">Type:</span>
            {['All', 'Room Charge', 'Food & Beverage', 'Laundry', 'Adjustment', 'Payment'].map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2 py-0.5 rounded font-medium transition ${
                  typeFilter === t
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Table List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950 text-slate-400 font-semibold sticky top-0 border-b border-slate-800 text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Folio / Room</th>
                  <th className="py-2.5 px-3">Guest Name</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Amount (BDT)</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 px-4 text-center">
                      {allItems.length === 0 ? (
                        <div className="max-w-md mx-auto space-y-3">
                          <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 mx-auto flex items-center justify-center border border-slate-700">
                            <Receipt className="w-5 h-5 text-amber-400" />
                          </div>
                          <div>
                            <p className="text-slate-200 font-semibold text-xs">No Active Guest Folios in Database</p>
                            <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                              The database is currently in a clean state with 0 active folios. You can populate a test in-house guest folio with room tariff, restaurant dining, and laundry charges to verify background ledger corrections.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleSeedSampleFolio}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition shadow-xs inline-flex items-center space-x-1.5 cursor-pointer"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Populate Test Guest Folio & Charges</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-slate-400 text-xs py-4">
                          No matching posted charges found for the active filter/search.
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(({ folio, item }) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-800/40 transition ${
                        editingItem?.item.id === item.id ? 'bg-amber-500/10' : ''
                      }`}
                    >
                      <td className="py-2 px-3 font-mono">
                        <span className="text-cyan-400 font-bold block">{folio.folioNumber}</span>
                        <span className="text-[10px] text-slate-400">Room {folio.roomNumber}</span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-slate-200 font-medium block truncate max-w-[140px]">{folio.guestName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">Bal: ৳{(folio.balance || 0).toLocaleString()}</span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-slate-100 block">{item.description}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {item.createdAt ? item.createdAt.split('T')[0] : 'Today'} • By: {item.postedBy}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                          {item.type}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-100">
                        ৳{(item.total || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setEditingItem({ folioId: folio.id, item })}
                          className="px-2 py-1 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-400 border border-slate-700 rounded font-bold text-[11px] flex items-center space-x-1 mx-auto transition"
                          title="Edit charge amount or details"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Inline Edit Panel (if item selected) */}
          {editingItem && (
            <div className="w-full md:w-80 bg-slate-950 border-t md:border-t-0 md:border-l border-slate-800 p-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-1.5 text-amber-400 font-bold text-xs">
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Correct Line Charge</span>
                  </div>
                  <button
                    onClick={() => setEditingItem(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                    Charge Description
                  </label>
                  <input
                    type="text"
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-100 text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                      Qty
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editQty}
                      onChange={e => {
                        const q = Number(e.target.value) || 1;
                        setEditQty(q);
                        setEditTotal(q * editUnitPrice);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-100 text-xs focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                      Unit Price (৳)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editUnitPrice}
                      onChange={e => {
                        const p = Number(e.target.value) || 0;
                        setEditUnitPrice(p);
                        setEditTotal(editQty * p);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-100 text-xs focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                    Corrected Line Total (BDT ৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editTotal}
                    onChange={e => setEditTotal(Number(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-amber-500/50 rounded p-1.5 text-amber-300 font-bold font-mono text-sm focus:border-amber-400 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Folio subtotal, tax, and balance will be recalculated immediately.
                  </span>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                    Correction Reason / Audit Note
                  </label>
                  <textarea
                    rows={2}
                    value={editReason}
                    onChange={e => setEditReason(e.target.value)}
                    placeholder="e.g. Mistaken POS amount entered by outlet cashier"
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-100 text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCorrection}
                  disabled={isSubmitting}
                  className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs transition shadow-xs flex items-center justify-center space-x-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Saving...' : 'Apply Correction'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-2">
            <span>Showing {filteredItems.length} active posted charges</span>
            <span>•</span>
            <span className="text-amber-300">Total BDT: ৳{filteredItems.reduce((s, { item }) => s + (item.total || 0), 0).toLocaleString()}</span>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
