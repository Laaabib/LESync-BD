import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers, ShieldCheck, X, Edit2, Trash2, ArrowUpRight,
  ArrowDownRight, CheckCircle2, AlertTriangle, FileText,
  Calendar, Building2, Tag, BookOpen, Clock, Plus
} from 'lucide-react';
import { pmsService } from '../../services/pmsService';
import { GLAccount, JournalVoucher } from '../../types/pms';

interface AccountHeadDetailModalProps {
  account: GLAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenJvModalWithAccount?: (accountCode: string) => void;
  onSuccess?: () => void;
}

export const AccountHeadDetailModal: React.FC<AccountHeadDetailModalProps> = ({
  account,
  isOpen,
  onClose,
  onOpenJvModalWithAccount,
  onSuccess
}) => {
  const [db, setDb] = useState(pmsService.getState());

  useEffect(() => {
    return pmsService.subscribe(setDb);
  }, []);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sync state with selected account
  useEffect(() => {
    if (account) {
      setEditName(account.name);
      setEditCategory(account.category);
      setEditDepartment(account.department || 'Finance & Accounts');
      setEditDescription(account.description || '');
      setIsEditing(false);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [account, isOpen]);

  // Find all Journal Vouchers that contain entries for this account
  const matchingJvs = useMemo(() => {
    if (!account) return [];
    const jvs: {
      voucher: JournalVoucher;
      debit: number;
      credit: number;
      memo?: string;
    }[] = [];

    (db.journalVouchers || []).forEach(jv => {
      (jv.entries || []).forEach(entry => {
        if (entry.accountCode === account.code) {
          jvs.push({
            voucher: jv,
            debit: entry.debit || 0,
            credit: entry.credit || 0,
            memo: entry.memo
          });
        }
      });
    });

    return jvs.sort((a, b) => b.voucher.date.localeCompare(a.voucher.date));
  }, [account, db.journalVouchers]);

  if (!isOpen || !account) return null;

  const handleSaveEdits = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!editName.trim()) {
      setErrorMsg('Account name cannot be empty.');
      return;
    }
    if (!editCategory.trim()) {
      setErrorMsg('Category classification cannot be empty.');
      return;
    }

    const res = pmsService.updateGLAccount(account.code, {
      name: editName.trim(),
      category: editCategory.trim(),
      department: editDepartment.trim(),
      description: editDescription.trim()
    });

    if (res.success) {
      setSuccessMsg('Account head details updated.');
      setIsEditing(false);
      onSuccess?.();
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleDeleteAccount = () => {
    if (account.isSystem) {
      setErrorMsg('Core system accounts are protected and cannot be deleted.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete Account Head ${account.code} (${account.name})?`)) {
      return;
    }

    const res = pmsService.deleteGLAccount(account.code);
    if (res.success) {
      onSuccess?.();
      onClose();
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full my-auto shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/30 border border-indigo-400/40 rounded-xl text-indigo-300 font-mono font-bold text-sm">
              {account.code}
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {account.name}
                {account.isSystem ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Core System
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Custom Account Head
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                {account.type} • {account.category} • {account.department || 'General Accounting'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5 text-xs text-gray-700">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Running Balance Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
            <div>
              <span className="text-[10px] text-gray-500 font-semibold uppercase block">Current Balance</span>
              <span className="text-lg font-black font-mono text-gray-900">
                ৳{(account.balance || 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-semibold uppercase block">Account Type</span>
              <span className={`inline-block font-bold text-xs mt-0.5 px-2 py-0.5 rounded ${
                account.type === 'Asset' ? 'bg-blue-100 text-blue-800' :
                account.type === 'Liability' ? 'bg-amber-100 text-amber-800' :
                account.type === 'Equity' ? 'bg-purple-100 text-purple-800' :
                account.type === 'Revenue' ? 'bg-emerald-100 text-emerald-800' :
                'bg-rose-100 text-rose-800'
              }`}>
                {account.type}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-semibold uppercase block">Normal Balance</span>
              <span className="text-xs font-bold text-gray-800 font-mono mt-0.5 block">
                {account.type === 'Asset' || account.type === 'Expense' ? 'Debit (Dr)' : 'Credit (Cr)'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-semibold uppercase block">Ledger Activity</span>
              <span className="text-xs font-bold text-indigo-900 mt-0.5 block">
                {matchingJvs.length} Transactions
              </span>
            </div>
          </div>

          {/* Edit Form or Information Card */}
          {isEditing ? (
            <form onSubmit={handleSaveEdits} className="space-y-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                  <Edit2 className="w-3.5 h-3.5 text-indigo-700" />
                  Edit Account Head Parameters
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-gray-500 hover:text-gray-800 underline"
                >
                  Cancel Edit
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Account Head Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Category Classification *</label>
                  <input
                    type="text"
                    required
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={e => setEditDepartment(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Operational Description</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-950 rounded-lg shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Description & Purpose</span>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-lg flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit Parameters
                </button>
              </div>
              <p className="text-gray-600 leading-relaxed text-xs">
                {account.description || 'No detailed operational description registered for this ledger head.'}
              </p>
            </div>
          )}

          {/* Ledger History & Transactions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-900" />
                Journal Voucher Transactions ({matchingJvs.length})
              </h3>
              {onOpenJvModalWithAccount && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenJvModalWithAccount(account.code);
                    onClose();
                  }}
                  className="text-indigo-700 hover:text-indigo-900 text-xs font-semibold flex items-center gap-1 underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Post New JV to this Head
                </button>
              )}
            </div>

            {matchingJvs.length === 0 ? (
              <div className="p-6 text-center bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-xs">
                No manual or automated Journal Vouchers recorded yet for this account code.
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Voucher #</th>
                      <th className="py-2.5 px-3">Module / Source</th>
                      <th className="py-2.5 px-3 text-right">Debit (৳)</th>
                      <th className="py-2.5 px-3 text-right">Credit (৳)</th>
                      <th className="py-2.5 px-3">Memo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {matchingJvs.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/70">
                        <td className="py-2 px-3 font-mono text-[11px] text-gray-600">
                          {item.voucher.date}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-indigo-950">
                          {item.voucher.voucherNumber}
                        </td>
                        <td className="py-2 px-3 text-gray-600">
                          {item.voucher.sourceModule}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-blue-700">
                          {item.debit > 0 ? `৳${item.debit.toLocaleString()}` : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-700">
                          {item.credit > 0 ? `৳${item.credit.toLocaleString()}` : '-'}
                        </td>
                        <td className="py-2 px-3 text-gray-500 truncate max-w-xs">
                          {item.memo || item.voucher.narration}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-5 py-3.5 border-t border-gray-200 flex items-center justify-between shrink-0">
          {!account.isSystem ? (
            <button
              type="button"
              onClick={handleDeleteAccount}
              className="px-3 py-1.5 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Custom Head
            </button>
          ) : (
            <div className="text-[11px] text-gray-400 italic">
              Core system accounts are protected against deletion.
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
