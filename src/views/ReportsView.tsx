import React, { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, DollarSign, BedDouble, Calendar,
  FileSpreadsheet, Download, Printer, PieChart as PieIcon, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import { pmsService } from '../services/pmsService';
import { pdfExportService } from '../services/pdfExportService';
import { PmsDatabaseState } from '../services/mockPmsDatabase';

interface ReportsViewProps {
  onPrintReport?: (reportData: any) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onPrintReport }) => {
  const [db, setDb] = useState<PmsDatabaseState>(pmsService.getState());
  const [activeTab, setActiveTab] = useState<'flash' | 'departments' | 'occupancy' | 'payments'>('flash');

  useEffect(() => {
    return pmsService.subscribe(setDb);
  }, []);

  const kpis = pmsService.getOperationalKPIs();

  // Department Revenue Breakdown
  const roomRevenue = db.folios.reduce((acc, f) => {
    return acc + f.items.filter(i => i.type === 'Room Charge').reduce((s, i) => s + i.total, 0);
  }, 0);

  const fbRevenue = db.folios.reduce((acc, f) => {
    return acc + f.items.filter(i => i.type === 'Restaurant' || i.type === 'Room Service').reduce((s, i) => s + i.total, 0);
  }, 0);

  const eventRevenue = db.eventBookings.reduce((acc, e) => acc + e.total, 0);
  const otherRevenue = db.folios.reduce((acc, f) => {
    return acc + f.items.filter(i => !['Room Charge', 'Restaurant', 'Room Service'].includes(i.type)).reduce((s, i) => s + i.total, 0);
  }, 0);

  const totalGrossRevenue = roomRevenue + fbRevenue + eventRevenue + otherRevenue;

  const handlePrintDailyFlash = () => {
    if (onPrintReport) {
      onPrintReport({
        kpis,
        roomRevenue,
        fbRevenue,
        eventRevenue,
        otherRevenue,
        totalGrossRevenue
      });
    } else {
      window.print();
    }
  };

  // Monthly Occupancy & ADR History
  const monthlyData = [
    { month: 'Jan', occupancy: 68, adr: 8500, revpar: 5780 },
    { month: 'Feb', occupancy: 74, adr: 9200, revpar: 6808 },
    { month: 'Mar', occupancy: 82, adr: 9800, revpar: 8036 },
    { month: 'Apr', occupancy: 70, adr: 8900, revpar: 6230 },
    { month: 'May', occupancy: 78, adr: 9400, revpar: 7332 },
    { month: 'Jun', occupancy: 85, adr: 10200, revpar: 8670 },
    { month: 'Jul', occupancy: 91, adr: 11000, revpar: 10010 },
    { month: 'Aug', occupancy: kpis.occupancyRate || 80, adr: kpis.adr || 9500, revpar: kpis.revpar || 7600 }
  ];

  const handleExportFlashReport = () => {
    const reportRows = [
      { metric: 'Total Property Rooms', value: `${kpis.totalRooms}` },
      { metric: 'Occupied Rooms', value: `${kpis.occupiedRooms}` },
      { metric: 'Available / Vacant Rooms', value: `${kpis.availableRooms}` },
      { metric: 'Occupancy Rate (%)', value: `${kpis.occupancyRate}%` },
      { metric: 'In-House Registered Guests', value: `${kpis.inHouseGuests}` },
      { metric: 'Average Daily Rate (ADR)', value: `BDT ${(kpis.adr || 0).toLocaleString()}` },
      { metric: 'RevPAR (Revenue per Available Room)', value: `BDT ${(kpis.revpar || 0).toLocaleString()}` },
      { metric: 'Room Revenue (Folios)', value: `BDT ${(roomRevenue || 0).toLocaleString()}` },
      { metric: 'Food & Beverage Revenue', value: `BDT ${(fbRevenue || 0).toLocaleString()}` },
      { metric: 'Convention & Banquet Revenue', value: `BDT ${(eventRevenue || 0).toLocaleString()}` },
      { metric: 'Other Facilities & Amenities Revenue', value: `BDT ${(otherRevenue || 0).toLocaleString()}` },
      { metric: 'Total Daily Gross Revenue', value: `BDT ${(totalGrossRevenue || 0).toLocaleString()}` },
      { metric: 'Total Outstanding Guest Dues', value: `BDT ${(kpis.outstandingBalance || 0).toLocaleString()}` }
    ];

    pdfExportService.exportToPDF({
      title: 'DAILY FLASH & REVPAR MANAGEMENT REPORT',
      subtitle: `${(db.settings.resortName || 'Resort MIS').toUpperCase()} • AUDITED EXECUTIVE REPORT`,
      date: new Date().toLocaleDateString('en-GB'),
      columns: [
        { key: 'metric', header: 'Operational & Financial Metric' },
        { key: 'value', header: 'Audited Value', align: 'right' }
      ],
      rows: reportRows,
      department: 'Executive Management',
      metadata: {
        'Audited By': 'Duty Officer & Night Auditor',
        'Scope': 'Consolidated Property KPIs'
      }
    }, `Daily_Flash_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-4 text-xs text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center border border-amber-500/30">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-100">Management Reports & Analytics</h1>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px]">
                DAILY FLASH & REVPAR
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Audited daily flash reports, department revenue distributions, ADR, and shift settlement.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportFlashReport}
            className="flex items-center space-x-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-colors shadow text-xs cursor-pointer"
            title="Download formal vector PDF daily flash report"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={handlePrintDailyFlash}
            className="flex items-center space-x-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors shadow text-xs cursor-pointer"
            title="Open printable preview & print official daily flash"
          >
            <Printer className="w-4 h-4" />
            <span>Preview & Print</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-900 border border-slate-800 p-1.5 rounded-xl text-xs">
        <button
          onClick={() => setActiveTab('flash')}
          className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
            activeTab === 'flash' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Daily Flash Report
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
            activeTab === 'departments' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Department Revenue
        </button>
        <button
          onClick={() => setActiveTab('occupancy')}
          className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
            activeTab === 'occupancy' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ADR & RevPAR Trends
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
            activeTab === 'payments' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Shift Reconciliation
        </button>
      </div>

      {/* 1. DAILY FLASH REPORT */}
      {activeTab === 'flash' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Gross Revenue Generated</span>
              <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">
                ৳{(totalGrossRevenue || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">All departments & events</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Average Daily Rate (ADR)</span>
              <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                ৳{(kpis.adr || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Across occupied room inventory</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">RevPAR</span>
              <span className="text-xl font-bold font-mono text-cyan-400 mt-1 block">
                ৳{(kpis.revpar || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Per available resort room</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Current Ledger Dues</span>
              <span className="text-xl font-bold font-mono text-rose-400 mt-1 block">
                ৳{(kpis.outstandingBalance || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Receivable on open folios</span>
            </div>
          </div>

          {/* Flash Summary Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-3.5 bg-slate-950 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-xs">Operational Metrics Breakdown</h3>
            </div>
            <div className="divide-y divide-slate-800 text-xs">
              <div className="p-3 flex justify-between">
                <span className="text-slate-300">Total Rooms in Inventory</span>
                <span className="font-mono font-bold text-slate-100">{kpis.totalRooms} Rooms</span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-slate-300">Occupied Rooms (In-House)</span>
                <span className="font-mono font-bold text-rose-400">{kpis.occupiedRooms} Rooms ({kpis.occupancyRate}%)</span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-slate-300">Available / Vacant Clean Rooms</span>
                <span className="font-mono font-bold text-emerald-400">{kpis.availableRooms} Rooms</span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-slate-300">Rooms Under Housekeeping / Turnover</span>
                <span className="font-mono font-bold text-amber-400">{kpis.dirtyRooms} Rooms</span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-slate-300">Out of Order (OOO) Maintenance</span>
                <span className="font-mono font-bold text-slate-400">{kpis.oooRooms} Rooms</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. DEPARTMENT REVENUE */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
            <h3 className="font-bold text-slate-100 text-xs">Revenue Contribution by Department</h3>
            <div className="space-y-3 pt-2 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300">Room Accommodation:</span>
                  <span className="font-mono font-bold text-slate-100">৳{(roomRevenue || 0).toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full" style={{ width: `${(roomRevenue / (totalGrossRevenue || 1)) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300">Food & Beverage (Restaurant / Room Service):</span>
                  <span className="font-mono font-bold text-emerald-400">৳{(fbRevenue || 0).toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${(fbRevenue / (totalGrossRevenue || 1)) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300">Convention & Banquet Halls:</span>
                  <span className="font-mono font-bold text-purple-400">৳{(eventRevenue || 0).toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full" style={{ width: `${(eventRevenue / (totalGrossRevenue || 1)) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300">Spa, Laundry & Miscellaneous Services:</span>
                  <span className="font-mono font-bold text-cyan-400">৳{(otherRevenue || 0).toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full" style={{ width: `${(otherRevenue / (totalGrossRevenue || 1)) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-center items-center text-center">
            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Grand Consolidated Total</span>
            <span className="text-3xl font-black font-mono text-amber-400">৳{(totalGrossRevenue || 0).toLocaleString()}</span>
            <p className="text-slate-400 text-xs mt-2 max-w-xs">
              Includes all active guest folios, settled invoices, restaurant dining charges, and banquet contracts.
            </p>
          </div>
        </div>
      )}

      {/* 3. ADR & REVPAR TRENDS */}
      {activeTab === 'occupancy' && (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
          <div>
            <h3 className="font-bold text-slate-100 text-xs">8-Month Historical ADR & RevPAR (BDT)</h3>
            <p className="text-slate-400 text-[11px]">Monthly Average Daily Rate vs Revenue per Available Room</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `৳${v / 1000}k`} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                <Legend />
                <Bar dataKey="adr" name="ADR (৳)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revpar" name="RevPAR (৳)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 4. SHIFT RECONCILIATION */}
      {activeTab === 'payments' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-slate-100 text-xs">Front Desk Cashier Shift Settlement</h3>
            <span className="text-emerald-400 font-mono font-bold text-xs">
              Settled: ৳{(db.payments.reduce((s, p) => s + p.amount, 0) || 0).toLocaleString()}
            </span>
          </div>

          <div className="p-4 space-y-3">
            <p className="text-slate-400 text-xs">
              Daily cashier drawer count verified by duty front desk manager.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {['Cash', 'Credit Card', 'bKash'].map(method => {
                const amount = db.payments
                  .filter(p => p.method === method)
                  .reduce((sum, p) => sum + p.amount, 0);
                return (
                  <div key={method} className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">{method} Collection</span>
                    <span className="text-base font-bold font-mono text-slate-100 mt-1 block">৳{(amount || 0).toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
