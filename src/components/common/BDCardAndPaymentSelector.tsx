import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Building2, 
  Building, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { PaymentMethod, CityLedgerAccount } from '../../types/pms';
import { 
  SIMPLE_CARD_OPTIONS,
  PaymentTenderDetails 
} from '../../constants/paymentConfig';
import { pmsService } from '../../services/pmsService';

interface BDCardAndPaymentSelectorProps {
  method: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  amount: number;
  reference: string;
  onReferenceChange: (ref: string) => void;
  details: Partial<PaymentTenderDetails>;
  onDetailsChange: (details: Partial<PaymentTenderDetails>) => void;
  theme?: 'dark' | 'light';
  showMethodSelect?: boolean;
  allowedMethods?: PaymentMethod[];
}

export const BDCardAndPaymentSelector: React.FC<BDCardAndPaymentSelectorProps> = ({
  method,
  onMethodChange,
  amount,
  reference,
  onReferenceChange,
  details,
  onDetailsChange,
  theme = 'dark',
  showMethodSelect = true,
  allowedMethods
}) => {
  const [cityAccounts, setCityAccounts] = useState<CityLedgerAccount[]>([]);
  const isDark = theme === 'dark';

  useEffect(() => {
    const accs = pmsService.getCityLedgerAccounts();
    setCityAccounts(accs);

    // Set default initial values for fields if empty
    if ((method === 'Credit Card' || method === 'City Bank POS') && !details.cardType) {
      const defaultOpt = method === 'City Bank POS' ? SIMPLE_CARD_OPTIONS[1] : SIMPLE_CARD_OPTIONS[0];
      onDetailsChange({
        ...details,
        cardType: defaultOpt.label,
        cardProviderName: defaultOpt.label,
        posTerminal: defaultOpt.terminal
      });
      if (!reference) {
        onReferenceChange(`${defaultOpt.label} POS`);
      }
    }

    if (method === 'Bank Transfer') {
      if (!details.transactionNo && !details.traceNo) {
        onDetailsChange({
          ...details,
          transactionNo: details.transactionNo || '',
          traceNo: details.traceNo || ''
        });
      }
    }

    if ((method === 'Company Credit' || method === 'City Ledger') && !details.cityLedgerAccountId && accs.length > 0) {
      const defaultCorp = accs[0];
      onDetailsChange({
        ...details,
        cityLedgerAccountId: defaultCorp.id,
        cityLedgerAccountName: defaultCorp.companyName
      });
    }
  }, [method]);

  // Selected corporate account
  const selectedCorpAccount = cityAccounts.find(a => a.id === details.cityLedgerAccountId) || cityAccounts[0];
  const availableCredit = selectedCorpAccount ? (selectedCorpAccount.creditLimit - selectedCorpAccount.currentBalance) : 0;
  const isCreditExceeded = selectedCorpAccount ? (amount > availableCredit) : false;

  const defaultMethods: PaymentMethod[] = [
    'Credit Card',
    'Bank Transfer',
    'Company Credit',
    'Cash',
    'bKash',
    'Nagad',
    'Rocket',
    'City Bank POS'
  ];

  const availableMethodList = allowedMethods || defaultMethods;

  return (
    <div className="space-y-3">
      {/* 1. Method Selection */}
      {showMethodSelect && (
        <div>
          <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Payment Tender Method:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {availableMethodList.map(m => {
              const isSelected = method === m;
              let icon = <DollarSign className="w-3.5 h-3.5" />;
              if (m.includes('Card') || m === 'City Bank POS') icon = <CreditCard className="w-3.5 h-3.5" />;
              else if (m === 'Bank Transfer') icon = <Building className="w-3.5 h-3.5" />;
              else if (m === 'Company Credit' || m === 'City Ledger') icon = <Building2 className="w-3.5 h-3.5" />;

              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => onMethodChange(m)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center space-x-1.5 border transition-all text-left ${
                    isSelected 
                      ? (isDark 
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm shadow-amber-500/10' 
                          : 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs')
                      : (isDark 
                          ? 'bg-slate-900/80 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')
                  }`}
                >
                  <span className={isSelected ? (isDark ? 'text-amber-400' : 'text-emerald-700') : 'text-slate-400'}>
                    {icon}
                  </span>
                  <span className="truncate">{m}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. SPECIFIC SECTION: CARD PAYMENT (Clean Drop-down Menu, Not Many Details Needed) */}
      {(method === 'Credit Card' || method === 'City Bank POS') && (
        <div className={`p-3 rounded-xl border space-y-2.5 ${
          isDark ? 'bg-slate-900/90 border-amber-500/30' : 'bg-slate-50 border-emerald-500/30'
        }`}>
          <div className="flex items-center justify-between border-b pb-2 border-slate-700/40">
            <div className="flex items-center space-x-2">
              <CreditCard className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-emerald-600'}`} />
              <span className={`text-xs font-bold ${isDark ? 'text-amber-300' : 'text-emerald-900'}`}>
                Card Option
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-semibold">
              GL 1010 (Commercial Bank)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Card Option Drop-down Menu */}
            <div>
              <label className={`block text-[10px] font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Select Card Option <span className="text-rose-400">*</span>:
              </label>
              <select
                value={details.cardType || 'Visa / MasterCard'}
                onChange={(e) => {
                  const val = e.target.value;
                  const matched = SIMPLE_CARD_OPTIONS.find(c => c.label === val);
                  onDetailsChange({
                    ...details,
                    cardType: val,
                    cardProviderName: val,
                    posTerminal: matched?.terminal || 'Counter POS Terminal'
                  });
                  if (!reference || reference.includes('POS') || reference.includes('Card') || reference === 'Front Desk Counter Settlement') {
                    onReferenceChange(`${val} POS`);
                  }
                }}
                className={`w-full rounded-lg px-2.5 py-1.5 text-xs font-medium border ${
                  isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                {SIMPLE_CARD_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.label}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Simple Slip / Auth / Ref Code */}
            <div>
              <label className={`block text-[10px] font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Slip / Approval No (Optional):
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => {
                  onReferenceChange(e.target.value);
                  onDetailsChange({ ...details, cardApprovalCode: e.target.value });
                }}
                placeholder="e.g. SLIP-908129"
                className={`w-full rounded-lg px-2.5 py-1.5 text-xs font-mono border ${
                  isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. SPECIFIC SECTION: BANK TRANSFER (Just Transaction No & Trace No) */}
      {method === 'Bank Transfer' && (
        <div className={`p-3 rounded-xl border space-y-2.5 ${
          isDark ? 'bg-slate-900/90 border-blue-500/30' : 'bg-blue-50/50 border-blue-500/30'
        }`}>
          <div className="flex items-center justify-between border-b pb-2 border-slate-700/40">
            <div className="flex items-center space-x-2">
              <Building className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className={`text-xs font-bold ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>
                Bank Transfer
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono font-semibold">
              GL 1010 (Commercial Bank)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Transaction No */}
            <div>
              <label className={`block text-[10px] font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Transaction No <span className="text-rose-400">*</span>:
              </label>
              <input
                type="text"
                value={details.transactionNo || ''}
                onChange={(e) => {
                  const txn = e.target.value;
                  const trace = details.traceNo || '';
                  const compositeRef = [
                    txn ? `Txn: ${txn}` : '',
                    trace ? `Trace: ${trace}` : ''
                  ].filter(Boolean).join(' | ');
                  onReferenceChange(compositeRef || txn);
                  onDetailsChange({ ...details, transactionNo: txn, bankTxnRef: txn });
                }}
                placeholder="e.g. TXN-98271049"
                className={`w-full rounded-lg px-2.5 py-1.5 text-xs font-mono border ${
                  isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            {/* Trace No */}
            <div>
              <label className={`block text-[10px] font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Trace No:
              </label>
              <input
                type="text"
                value={details.traceNo || ''}
                onChange={(e) => {
                  const trace = e.target.value;
                  const txn = details.transactionNo || '';
                  const compositeRef = [
                    txn ? `Txn: ${txn}` : '',
                    trace ? `Trace: ${trace}` : ''
                  ].filter(Boolean).join(' | ');
                  onReferenceChange(compositeRef || trace);
                  onDetailsChange({ ...details, traceNo: trace });
                }}
                placeholder="e.g. TRACE-08472"
                className={`w-full rounded-lg px-2.5 py-1.5 text-xs font-mono border ${
                  isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. SPECIFIC SECTION: COMPANY CREDIT (City Ledger Direct Billing mapped to GL 1150) */}
      {(method === 'Company Credit' || method === 'City Ledger') && (
        <div className={`p-3.5 rounded-xl border space-y-3 ${
          isDark ? 'bg-slate-900/90 border-purple-500/30' : 'bg-purple-50/60 border-purple-500/30'
        }`}>
          <div className="flex items-center justify-between border-b pb-2 border-slate-700/40">
            <div className="flex items-center space-x-2">
              <Building2 className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              <span className={`text-xs font-bold ${isDark ? 'text-purple-300' : 'text-purple-900'}`}>
                Company Credit / City Ledger Direct Billing
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-mono font-semibold">
              Debit GL 1150 (City Ledger AR)
            </span>
          </div>

          <div className="space-y-2.5">
            {/* Corporate Company Account Selection */}
            <div>
              <label className={`block text-[10px] font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Select Corporate Client Account <span className="text-rose-400">*</span>:
              </label>
              <select
                value={details.cityLedgerAccountId || (cityAccounts[0]?.id || '')}
                onChange={(e) => {
                  const corp = cityAccounts.find(a => a.id === e.target.value);
                  if (corp) {
                    onDetailsChange({
                      ...details,
                      cityLedgerAccountId: corp.id,
                      cityLedgerAccountName: corp.companyName
                    });
                    if (!reference || reference.includes('CORP') || reference.includes('AUTH') || reference === 'Counter POS Settlement') {
                      onReferenceChange(`PO-${corp.accountNumber}-${new Date().getFullYear()}`);
                    }
                  }
                }}
                className={`w-full rounded-lg px-2.5 py-1.5 text-xs font-medium border ${
                  isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                {cityAccounts.map(corp => (
                  <option key={corp.id} value={corp.id}>
                    {corp.companyName} ({corp.accountNumber}) — Limit: ৳{(corp.creditLimit || 0).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            {/* Corporate Credit Health Card */}
            {selectedCorpAccount && (
              <div className={`p-2.5 rounded-lg border text-[11px] ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between font-medium pb-1.5 border-b border-slate-800/40">
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                    Account: <strong className="text-amber-400">{selectedCorpAccount.accountNumber}</strong> ({selectedCorpAccount.paymentTerms})
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    isCreditExceeded 
                      ? 'bg-rose-500/20 text-rose-300' 
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {isCreditExceeded ? 'Exceeds Credit Limit' : selectedCorpAccount.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1.5 text-[10px] font-mono">
                  <div>
                    <span className="text-slate-500 block">Credit Limit:</span>
                    <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      ৳{(selectedCorpAccount.creditLimit || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Current Balance:</span>
                    <span className="font-semibold text-amber-400">
                      ৳{(selectedCorpAccount.currentBalance || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Available Headroom:</span>
                    <span className={`font-bold ${availableCredit >= amount ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ৳{(availableCredit || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {isCreditExceeded && (
                  <div className="mt-2 p-1.5 rounded bg-rose-950/40 border border-rose-800/50 flex items-center space-x-1.5 text-rose-300 text-[10px]">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                    <span>
                      Notice: Settlement of ৳{amount.toLocaleString()} will exceed the company's approved limit by ৳{(amount - availableCredit).toLocaleString()}. Supervisor authorization recommended.
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Corporate Purchase Order / Sanction Ref */}
              <div>
                <label className={`block text-[10px] font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Corporate PO / Sanction Reference <span className="text-rose-400">*</span>:
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => {
                    onReferenceChange(e.target.value);
                    onDetailsChange({ ...details, companyPoNumber: e.target.value });
                  }}
                  placeholder="e.g. PO-GP-2026-9021"
                  className={`w-full rounded-lg px-2.5 py-1.5 text-xs font-mono border ${
                    isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Authorized By */}
              <div>
                <label className={`block text-[10px] font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Authorized By / Contact Person:
                </label>
                <input
                  type="text"
                  value={details.authorizedBy || selectedCorpAccount?.contactPerson || ''}
                  onChange={(e) => onDetailsChange({ ...details, authorizedBy: e.target.value })}
                  placeholder="e.g. HR / Admin Manager Name"
                  className={`w-full rounded-lg px-2.5 py-1.5 text-xs border ${
                    isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. SPECIFIC SECTION: CASH OR MFS (bKash/Nagad/Rocket) */}
      {(method === 'Cash' || method === 'bKash' || method === 'Nagad' || method === 'Rocket') && (
        <div className={`p-3 rounded-xl border space-y-2 ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {method === 'Cash' ? 'Cash at Front Desk / Till Drawer' : `${method} Mobile Financial Service (MFS)`}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              {method === 'Cash' ? 'GL 1020 (Cashier Till)' : 'GL 1010 (Commercial Bank MFS)'}
            </span>
          </div>

          <div>
            <label className={`block text-[10px] font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {method === 'Cash' ? 'Cash Receipt / Drawer Voucher Number:' : `${method} TrxID / Wallet Transaction Reference:`}
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => onReferenceChange(e.target.value)}
              placeholder={method === 'Cash' ? 'e.g. CASH-RCP-2026-092' : `e.g. ${method.toUpperCase()}-TXN-90281928`}
              className={`w-full rounded-lg px-2.5 py-1.5 text-xs font-mono border ${
                isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>
        </div>
      )}

      {/* Accounting Entry Live Preview Banner */}
      <div className={`p-2.5 rounded-lg border text-[10px] flex items-center justify-between ${
        isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-100/70 border-slate-200 text-slate-600'
      }`}>
        <div className="flex items-center space-x-1.5">
          <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Accounts Module Mapping:</span>
        </div>
        <div className="font-mono text-right">
          {method === 'Cash' && (
            <span><strong>Dr 1020</strong> Cashier Till / <strong>Cr 1100</strong> Guest Ledger</span>
          )}
          {(method === 'Credit Card' || method === 'City Bank POS') && (
            <span><strong>Dr 1010</strong> Bank Merchant Settlement / <strong>Cr 1100</strong> Guest Ledger</span>
          )}
          {method === 'Bank Transfer' && (
            <span><strong>Dr 1010</strong> Commercial Bank / <strong>Cr 1100</strong> Guest Ledger</span>
          )}
          {(method === 'Company Credit' || method === 'City Ledger') && (
            <span className="text-purple-400 font-bold"><strong>Dr 1150</strong> City Ledger Corporate AR / <strong>Cr 1100</strong> Guest Ledger</span>
          )}
          {(method === 'bKash' || method === 'Nagad' || method === 'Rocket') && (
            <span><strong>Dr 1010</strong> MFS Settlement / <strong>Cr 1100</strong> Guest Ledger</span>
          )}
        </div>
      </div>
    </div>
  );
};
