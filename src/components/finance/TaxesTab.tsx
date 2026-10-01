import React, { useState } from 'react';
import {
  Percent, Search, Download, CheckCircle2, AlertTriangle,
  FileText, Calendar, Building, DollarSign, ArrowUpRight
} from 'lucide-react';
import { pmsService } from '../../services/pmsService';
import * as XLSX from 'xlsx';

export const TaxesTab: React.FC = () => {
  const db = pmsService.getState();
  const [selectedPeriod, setSelectedPeriod] = useState<string>('August 2026');

  // Derive tax metrics
  const getNights = (s: any) => s.nights || Math.max(1, Math.round((new Date(s.expectedCheckOutAt || s.checkOutDate || Date.now()).getTime() - new Date(s.checkInAt || s.checkInDate || Date.now()).getTime()) / (1000 * 60 * 60 * 24))) || 1;
  const totalRoomRevenue = (db.stays || []).reduce((sum, s) => sum + s.rate * getNights(s), 0);
  const totalFbRevenue = (db.restaurantOrders || []).reduce((sum, o) => sum + (o.subtotal || 0), 0);
  const totalBanquetRevenue = (db.eventBookings || []).reduce((sum, e) => sum + (e.subtotal || 0), 0);
  const totalGrossRevenue = totalRoomRevenue + totalFbRevenue + totalBanquetRevenue;

  // Output VAT @ 15%
  const outputVat = Math.round(totalGrossRevenue * 0.15);
  // Service Charge @ 10%
  const serviceCharge = Math.round(totalGrossRevenue * 0.10);
  // Input VAT on Procurement (e.g. 15% of purchases)
  const totalPurchases = (db.purchaseBills || []).reduce((sum, b) => sum + b.totalAmount, 0);
  const inputVat = Math.round(totalPurchases * 0.15);
  // Net VAT Payable
  const netVatPayable = Math.max(0, outputVat - inputVat);

  const exportVatReport = () => {
    const data = [
      { 'Category': 'Room Revenue (Deluxe & Chalets)', 'Taxable Amount (BDT)': totalRoomRevenue, 'VAT Rate': '15%', 'Output VAT (BDT)': Math.round(totalRoomRevenue * 0.15) },
      { 'Category': 'Food & Beverage (Restaurant & Bar)', 'Taxable Amount (BDT)': totalFbRevenue, 'VAT Rate': '15%', 'Output VAT (BDT)': Math.round(totalFbRevenue * 0.15) },
      { 'Category': 'Banquet & Convention Halls', 'Taxable Amount (BDT)': totalBanquetRevenue, 'VAT Rate': '15%', 'Output VAT (BDT)': Math.round(totalBanquetRevenue * 0.15) },
      { 'Category': 'Total Output VAT (Sales)', 'Taxable Amount (BDT)': totalGrossRevenue, 'VAT Rate': '15%', 'Output VAT (BDT)': outputVat },
      { 'Category': 'Less: Input VAT (Purchases)', 'Taxable Amount (BDT)': totalPurchases, 'VAT Rate': '15%', 'Output VAT (BDT)': -inputVat },
      { 'Category': 'Net VAT Payable to NBR', 'Taxable Amount (BDT)': '-', 'VAT Rate': '-', 'Output VAT (BDT)': netVatPayable }
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'VAT Summary NBR');
    XLSX.writeFile(wb, `CCULB_NBR_VAT_Mushak_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Tax KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Output VAT 15% (GL 2100)</div>
          <div className="mt-2 text-2xl font-bold text-indigo-950 font-mono">৳{(outputVat || 0).toLocaleString()}</div>
          <div className="mt-1 text-[11px] text-gray-500">Collected from guest billings</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Input Tax Rebate (GL 1150)</div>
          <div className="mt-2 text-2xl font-bold text-blue-900 font-mono">৳{(inputVat || 0).toLocaleString()}</div>
          <div className="mt-1 text-[11px] text-emerald-600 font-medium">Rebate on raw materials</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Net NBR VAT Payable</div>
          <div className="mt-2 text-2xl font-bold text-rose-700 font-mono">৳{(netVatPayable || 0).toLocaleString()}</div>
          <div className="mt-1 text-[11px] text-gray-500">Due for monthly Treasury Challan</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Service Charge 10% (GL 2150)</div>
          <div className="mt-2 text-2xl font-bold text-amber-700 font-mono">৳{(serviceCharge || 0).toLocaleString()}</div>
          <div className="mt-1 text-[11px] text-gray-500">Staff distribution pool</div>
        </div>
      </div>

      {/* Statutory NBR Mushak Summary */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Statutory NBR VAT Summary (Mushak-9.1 Return Schedule)
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Government of the People's Republic of Bangladesh • National Board of Revenue (NBR)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-hidden font-medium"
            >
              <option value="August 2026">August 2026</option>
              <option value="July 2026">July 2026</option>
              <option value="June 2026">June 2026</option>
            </select>
            <button
              onClick={exportVatReport}
              className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download Mushak Schedule
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Revenue Stream / Tax Head</th>
                <th className="py-3 px-4">GL Code</th>
                <th className="py-3 px-4 text-right">Taxable Turnover (BDT)</th>
                <th className="py-3 px-4 text-center">VAT Rate</th>
                <th className="py-3 px-4 text-right">Output VAT (BDT)</th>
                <th className="py-3 px-4 text-right">Service Charge (10%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-gray-50/70">
                <td className="py-3 px-4 font-semibold text-gray-900">Room Accommodation & Suites</td>
                <td className="py-3 px-4 font-mono text-gray-600">GL 4010</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">৳{(totalRoomRevenue || 0).toLocaleString()}</td>
                <td className="py-3 px-4 text-center font-medium text-gray-700">15%</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-indigo-900">৳{(Math.round(totalRoomRevenue * 0.15) || 0).toLocaleString()}</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-amber-900">৳{(Math.round(totalRoomRevenue * 0.10) || 0).toLocaleString()}</td>
              </tr>
              <tr className="hover:bg-gray-50/70">
                <td className="py-3 px-4 font-semibold text-gray-900">Restaurant, Café & Room Service</td>
                <td className="py-3 px-4 font-mono text-gray-600">GL 4020</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">৳{(totalFbRevenue || 0).toLocaleString()}</td>
                <td className="py-3 px-4 text-center font-medium text-gray-700">15%</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-indigo-900">৳{(Math.round(totalFbRevenue * 0.15) || 0).toLocaleString()}</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-amber-900">৳{(Math.round(totalFbRevenue * 0.10) || 0).toLocaleString()}</td>
              </tr>
              <tr className="hover:bg-gray-50/70">
                <td className="py-3 px-4 font-semibold text-gray-900">Convention Halls & Banquet Catering</td>
                <td className="py-3 px-4 font-mono text-gray-600">GL 4030</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">৳{(totalBanquetRevenue || 0).toLocaleString()}</td>
                <td className="py-3 px-4 text-center font-medium text-gray-700">15%</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-indigo-900">৳{(Math.round(totalBanquetRevenue * 0.15) || 0).toLocaleString()}</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-amber-900">৳{(Math.round(totalBanquetRevenue * 0.10) || 0).toLocaleString()}</td>
              </tr>
              <tr className="bg-gray-50/80 font-bold text-gray-900">
                <td className="py-3 px-4" colSpan={2}>Total Gross Sales & Output Levies</td>
                <td className="py-3 px-4 text-right font-mono">৳{(totalGrossRevenue || 0).toLocaleString()}</td>
                <td className="py-3 px-4 text-center">-</td>
                <td className="py-3 px-4 text-right font-mono text-indigo-950">৳{(outputVat || 0).toLocaleString()}</td>
                <td className="py-3 px-4 text-right font-mono text-amber-950">৳{(serviceCharge || 0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
