// CCULB PMS - Menu Accounting & GL Mapping Modal
// Configures backend accounting accounts for Revenue, COGS, Taxes, Service Charge, Discounts & Wastages

import React, { useState } from 'react';
import {
  X, Check, ShieldCheck, DollarSign,
  TrendingDown, Percent, Scale, RefreshCw, AlertCircle
} from 'lucide-react';
import { inventoryMenuService } from '../../services/inventoryMenuService';
import { MenuAccountingMapping } from '../../types/inventoryMenu';
import { pmsService } from '../../services/pmsService';

interface MenuGLMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MenuGLMappingModal: React.FC<MenuGLMappingModalProps> = ({ isOpen, onClose }) => {
  const glAccounts = pmsService.getState().glAccounts || [];
  const currentMapping = inventoryMenuService.getMenuAccountingMapping();
  const [formData, setFormData] = useState<MenuAccountingMapping>(currentMapping);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    inventoryMenuService.updateMenuAccountingMapping(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleAccountSelect = (fieldCode: keyof MenuAccountingMapping, fieldName: keyof MenuAccountingMapping, code: string) => {
    const acc = glAccounts.find(g => g.code === code);
    setFormData(prev => ({
      ...prev,
      [fieldCode]: code,
      [fieldName]: acc ? acc.name : ''
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">F&B Menu Accounting & GL Mapping</h2>
              <p className="text-xs text-slate-400">
                Map menu revenues, recipe raw material costs, VAT, service charge & discounts directly to General Ledger
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Revenue Mapping */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800">1. F&B Sales Revenue Accounts (Credit 4xxx)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Food Sales Revenue
                </label>
                <select
                  value={formData.foodRevenueGlCode}
                  onChange={e => handleAccountSelect('foodRevenueGlCode', 'foodRevenueGlName', e.target.value)}
                  className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  {glAccounts.filter(a => a.type === 'Revenue').map(acc => (
                    <option key={acc.code} value={acc.code}>
                      {acc.code} - {acc.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">{formData.foodRevenueGlName}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Beverage & Bar Revenue
                </label>
                <select
                  value={formData.beverageRevenueGlCode}
                  onChange={e => handleAccountSelect('beverageRevenueGlCode', 'beverageRevenueGlName', e.target.value)}
                  className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  {glAccounts.filter(a => a.type === 'Revenue').map(acc => (
                    <option key={acc.code} value={acc.code}>
                      {acc.code} - {acc.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">{formData.beverageRevenueGlName}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Banquet & Event Revenue
                </label>
                <select
                  value={formData.banquetRevenueGlCode}
                  onChange={e => handleAccountSelect('banquetRevenueGlCode', 'banquetRevenueGlName', e.target.value)}
                  className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  {glAccounts.filter(a => a.type === 'Revenue').map(acc => (
                    <option key={acc.code} value={acc.code}>
                      {acc.code} - {acc.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">{formData.banquetRevenueGlName}</p>
              </div>
            </div>
          </div>

          {/* Cost of Goods Sold (COGS) Mapping */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-800">2. Recipe Cost of Sales & Inventory Assets (Debit 5xxx / Credit 1xxx)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Food Raw Material COGS (Debit on Recipe Consumption)
                </label>
                <select
                  value={formData.foodCostGlCode}
                  onChange={e => handleAccountSelect('foodCostGlCode', 'foodCostGlName', e.target.value)}
                  className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  {glAccounts.filter(a => a.type === 'Expense' || a.category === 'Cost of Sales').map(acc => (
                    <option key={acc.code} value={acc.code}>
                      {acc.code} - {acc.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">{formData.foodCostGlName}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Beverage COGS (Debit on Bar Sale)
                </label>
                <select
                  value={formData.beverageCostGlCode}
                  onChange={e => handleAccountSelect('beverageCostGlCode', 'beverageCostGlName', e.target.value)}
                  className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  {glAccounts.filter(a => a.type === 'Expense' || a.category === 'Cost of Sales').map(acc => (
                    <option key={acc.code} value={acc.code}>
                      {acc.code} - {acc.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">{formData.beverageCostGlName}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Food Inventory Asset Account (Credit on Consumption)
                </label>
                <select
                  value={formData.inventoryFoodAssetGlCode}
                  onChange={e => handleAccountSelect('inventoryFoodAssetGlCode', 'inventoryFoodAssetGlName', e.target.value)}
                  className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  {glAccounts.filter(a => a.type === 'Asset').map(acc => (
                    <option key={acc.code} value={acc.code}>
                      {acc.code} - {acc.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">{formData.inventoryFoodAssetGlName}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Beverage Inventory Asset Account (Credit on Consumption)
                </label>
                <select
                  value={formData.inventoryBeverageAssetGlCode}
                  onChange={e => handleAccountSelect('inventoryBeverageAssetGlCode', 'inventoryBeverageAssetGlName', e.target.value)}
                  className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  {glAccounts.filter(a => a.type === 'Asset').map(acc => (
                    <option key={acc.code} value={acc.code}>
                      {acc.code} - {acc.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">{formData.inventoryBeverageAssetGlName}</p>
              </div>
            </div>
          </div>

          {/* Tax & Service Charge Liabilities */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Percent className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800">3. Statutory Tax & Service Charge Liabilities (Credit 2xxx)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  NBR VAT / Government Tax Liability
                </label>
                <select
                  value={formData.vatLiabilityGlCode}
                  onChange={e => handleAccountSelect('vatLiabilityGlCode', 'vatLiabilityGlName', e.target.value)}
                  className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  {glAccounts.filter(a => a.type === 'Liability').map(acc => (
                    <option key={acc.code} value={acc.code}>
                      {acc.code} - {acc.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">{formData.vatLiabilityGlName}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  10% Service Charge Payable (Staff Welfare Pool)
                </label>
                <select
                  value={formData.serviceChargeLiabilityGlCode}
                  onChange={e => handleAccountSelect('serviceChargeLiabilityGlCode', 'serviceChargeLiabilityGlName', e.target.value)}
                  className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  {glAccounts.filter(a => a.type === 'Liability').map(acc => (
                    <option key={acc.code} value={acc.code}>
                      {acc.code} - {acc.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">{formData.serviceChargeLiabilityGlName}</p>
              </div>
            </div>
          </div>

          {/* Discounts & Spoilage Adjustments */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Scale className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-800">4. Discounts, Promotions & Kitchen Spoilage</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Sales Discounts & Promotions (Contra Revenue / Debit)
                </label>
                <select
                  value={formData.discountExpenseGlCode}
                  onChange={e => handleAccountSelect('discountExpenseGlCode', 'discountExpenseGlName', e.target.value)}
                  className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                >
                  {glAccounts.map(acc => (
                    <option key={acc.code} value={acc.code}>
                      {acc.code} - {acc.name} ({acc.type})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">{formData.discountExpenseGlName}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Kitchen & Bar Spoilage / Wastage Expense
                </label>
                <select
                  value={formData.spoilageWastageGlCode}
                  onChange={e => handleAccountSelect('spoilageWastageGlCode', 'spoilageWastageGlName', e.target.value)}
                  className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                >
                  {glAccounts.filter(a => a.type === 'Expense').map(acc => (
                    <option key={acc.code} value={acc.code}>
                      {acc.code} - {acc.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">{formData.spoilageWastageGlName}</p>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-emerald-700 shrink-0" />
            <p className="text-xs text-emerald-800 leading-relaxed">
              Every POS dining bill and Kitchen Order Ticket (KOT) automatically posts a balanced Journal Voucher into the General Ledger using these mapped accounts upon order settlement.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => setFormData(currentMapping)}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset to Current
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              {savedSuccess ? <Check className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
              {savedSuccess ? 'Saved & Mapped!' : 'Save GL Accounting Mapping'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
