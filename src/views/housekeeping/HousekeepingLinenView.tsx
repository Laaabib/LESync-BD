import React, { useState, useEffect } from 'react';
import {
  Droplet, Layers, Search, Filter, Plus, ArrowRightLeft,
  Send, CornerDownLeft, AlertOctagon, CheckCircle2,
  RefreshCw, History, ShieldAlert, Package, Check, X, FileText
} from 'lucide-react';
import { housekeepingService } from '../../services/housekeepingService';
import { pmsService } from '../../services/pmsService';
import {
  LinenItem,
  LinenLocationStock,
  LinenTransaction,
  LinenLocation,
  LinenTransactionType
} from '../../types/housekeeping';

const LOCATIONS: LinenLocation[] = [
  'Housekeeping Store',
  'Floor 1',
  'Floor 2',
  'Floor 3',
  'VIP Floor',
  'Laundry',
  'Pool',
  'Banquet'
];

export const HousekeepingLinenView: React.FC = () => {
  const [linenItems, setLinenItems] = useState<LinenItem[]>(housekeepingService.getState().linenItems);
  const [stocks, setStocks] = useState<LinenLocationStock[]>(housekeepingService.getState().linenStocks);
  const [transactions, setTransactions] = useState<LinenTransaction[]>(housekeepingService.getState().linenTransactions);
  const [staff, setStaff] = useState(housekeepingService.getState().staff);

  const [activeTab, setActiveTab] = useState<'matrix' | 'ledger' | 'items'>('matrix');
  const [selectedLocation, setSelectedLocation] = useState<LinenLocation | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueFrom, setIssueFrom] = useState<LinenLocation>('Housekeeping Store');
  const [issueTo, setIssueTo] = useState<LinenLocation>('Floor 1');
  const [issueItemId, setIssueItemId] = useState('');
  const [issueQty, setIssueQty] = useState(10);
  const [issueStaffName, setIssueStaffName] = useState('');
  const [issueRemarks, setIssueRemarks] = useState('');

  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnFrom, setReturnFrom] = useState<LinenLocation>('Floor 1');
  const [returnItemId, setReturnItemId] = useState('');
  const [returnCleanQty, setReturnCleanQty] = useState(0);
  const [returnDirtyQty, setReturnDirtyQty] = useState(10);
  const [returnDamagedQty, setReturnDamagedQty] = useState(0);
  const [returnLostQty, setReturnLostQty] = useState(0);
  const [returnRemarks, setReturnRemarks] = useState('');

  const [laundryModalOpen, setLaundryModalOpen] = useState(false);
  const [laundryMode, setLaundryMode] = useState<'send' | 'receive'>('send');
  const [laundryLocation, setLaundryLocation] = useState<LinenLocation>('Floor 1');
  const [laundryItemId, setLaundryItemId] = useState('');
  const [laundryQty, setLaundryQty] = useState(20);
  const [laundryRemarks, setLaundryRemarks] = useState('');

  const [damageModalOpen, setDamageModalOpen] = useState(false);
  const [damageLoc, setDamageLoc] = useState<LinenLocation>('Floor 1');
  const [damageItemId, setDamageItemId] = useState('');
  const [damagedCount, setDamagedCount] = useState(1);
  const [lostCount, setLostCount] = useState(0);
  const [damageNotes, setDamageNotes] = useState('');

  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const unsub = housekeepingService.subscribe(s => {
      setLinenItems([...s.linenItems]);
      setStocks([...s.linenStocks]);
      setTransactions([...s.linenTransactions]);
      setStaff([...s.staff]);
    });
    return unsub;
  }, []);

  // Handle Issue
  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      housekeepingService.issueLinen({
        fromLocation: issueFrom,
        toLocation: issueTo,
        linenItemId: issueItemId || linenItems[0]?.id,
        quantity: issueQty,
        issuedBy: pmsService.getState().currentUser.name,
        receivedBy: issueStaffName || staff[0]?.name,
        remarks: issueRemarks
      });
      setIssueModalOpen(false);
      setIssueRemarks('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to issue linen');
    }
  };

  // Handle Return
  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      housekeepingService.returnLinen({
        location: returnFrom,
        linenItemId: returnItemId || linenItems[0]?.id,
        cleanQty: returnCleanQty,
        dirtyQty: returnDirtyQty,
        damagedQty: returnDamagedQty,
        lostQty: returnLostQty,
        returnedBy: staff[0]?.name || 'Attendant',
        receivedBy: pmsService.getState().currentUser.name,
        remarks: returnRemarks
      });
      setReturnModalOpen(false);
      setReturnRemarks('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process linen return');
    }
  };

  // Handle Laundry
  const handleLaundrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      if (laundryMode === 'send') {
        housekeepingService.sendLinenToLaundry({
          fromLocation: laundryLocation,
          linenItemId: laundryItemId || linenItems[0]?.id,
          quantity: laundryQty,
          sentBy: pmsService.getState().currentUser.name,
          remarks: laundryRemarks
        });
      } else {
        housekeepingService.receiveLinenFromLaundry({
          toLocation: laundryLocation,
          linenItemId: laundryItemId || linenItems[0]?.id,
          quantity: laundryQty,
          receivedBy: pmsService.getState().currentUser.name,
          remarks: laundryRemarks
        });
      }
      setLaundryModalOpen(false);
      setLaundryRemarks('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Laundry transaction failed');
    }
  };

  // Handle Damage / Loss
  const handleDamageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      housekeepingService.returnLinen({
        location: damageLoc,
        linenItemId: damageItemId || linenItems[0]?.id,
        cleanQty: 0,
        dirtyQty: 0,
        damagedQty: damagedCount,
        lostQty: lostCount,
        returnedBy: pmsService.getState().currentUser.name,
        remarks: damageNotes || 'Damage / Loss Write-off'
      });
      setDamageModalOpen(false);
      setDamageNotes('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Write-off failed');
    }
  };

  // Calculate totals
  const totalCleanInHouse = stocks.reduce((acc, s) => acc + (s.cleanQty || 0), 0);
  const totalDirtyInHouse = stocks.reduce((acc, s) => acc + (s.dirtyQty || 0), 0);
  const totalInLaundry = stocks.reduce((acc, s) => acc + (s.inLaundryQty || 0), 0);
  const totalDamaged = stocks.reduce((acc, s) => acc + (s.damagedQty || 0), 0);

  // Filter matrix
  const filteredStocks = stocks.filter(s => {
    if (selectedLocation !== 'All' && s.location !== selectedLocation) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.linenItemName.toLowerCase().includes(q);
      const matchLoc = s.location.toLowerCase().includes(q);
      if (!matchName && !matchLoc) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-md">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-linear-to-br from-blue-600 to-cyan-600 text-white flex items-center justify-center shadow-md shrink-0">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-base sm:text-lg font-bold text-white uppercase tracking-tight">
                Linen Management & Par Stock Control
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                PAR LEDGER
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Double-entry inventory ledger across all 8 resort pantries, laundry flows, and write-off audits.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setIssueModalOpen(true);
              setIssueItemId(linenItems[0]?.id || '');
            }}
            className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-blue-900/30 transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Issue Linen</span>
          </button>

          <button
            onClick={() => {
              setReturnModalOpen(true);
              setReturnItemId(linenItems[0]?.id || '');
            }}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-emerald-900/30 transition-colors"
          >
            <CornerDownLeft className="w-4 h-4" />
            <span>Return Linen</span>
          </button>

          <button
            onClick={() => {
              setLaundryModalOpen(true);
              setLaundryItemId(linenItems[0]?.id || '');
            }}
            className="px-3.5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-purple-900/30 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Laundry Transfer</span>
          </button>

          <button
            onClick={() => {
              setDamageModalOpen(true);
              setDamageItemId(linenItems[0]?.id || '');
            }}
            className="px-3 py-2 bg-red-950/60 hover:bg-red-900/60 border border-red-500/40 text-red-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>Loss / Damage</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-semibold text-emerald-400">Total Clean Linen</span>
          <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">{totalCleanInHouse}</div>
          <div className="text-[10.5px] text-slate-400 mt-0.5">Across store & pantries</div>
        </div>
        <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30">
          <span className="text-[11px] font-semibold text-amber-400">Dirty / Soiled Linen</span>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-1">{totalDirtyInHouse}</div>
          <div className="text-[10.5px] text-amber-400/80 mt-0.5">Awaiting laundry dispatch</div>
        </div>
        <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30">
          <span className="text-[11px] font-semibold text-purple-400">In Laundry Washing</span>
          <div className="text-2xl font-bold font-mono text-purple-300 mt-1">{totalInLaundry}</div>
          <div className="text-[10.5px] text-purple-400/80 mt-0.5">Active wash & steam press</div>
        </div>
        <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/30">
          <span className="text-[11px] font-semibold text-red-400">Damaged / Written-Off</span>
          <div className="text-2xl font-bold font-mono text-red-300 mt-1">{totalDamaged}</div>
          <div className="text-[10.5px] text-red-400/80 mt-0.5">Disposed or condemned</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'matrix' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Location Stock Matrix (8 Pantries)
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'ledger' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Linen Transaction Ledger
        </button>
        <button
          onClick={() => setActiveTab('items')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'items' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Linen Master Catalog (Par Levels)
        </button>
      </div>

      {/* TAB 1: LOCATION STOCK MATRIX */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search linen item or pantry location..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-slate-400 font-medium">Filter Location:</label>
              <select
                value={selectedLocation}
                onChange={e => setSelectedLocation(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="All">All 8 Locations</option>
                {LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/90 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10.5px] tracking-wider">
                  <tr>
                    <th className="p-3.5">Linen Item Name</th>
                    <th className="p-3.5">Storage Location</th>
                    <th className="p-3.5 text-center text-emerald-400">Clean Qty</th>
                    <th className="p-3.5 text-center text-amber-400">Dirty Qty</th>
                    <th className="p-3.5 text-center text-purple-400">In Laundry</th>
                    <th className="p-3.5 text-center text-red-400">Damaged</th>
                    <th className="p-3.5 text-right">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {filteredStocks.map(s => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-semibold text-slate-100">{s.linenItemName}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-medium text-[11px]">
                          {s.location}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-emerald-400">{s.cleanQty}</td>
                      <td className="p-3.5 text-center font-mono font-bold text-amber-400">{s.dirtyQty}</td>
                      <td className="p-3.5 text-center font-mono font-bold text-purple-400">{s.inLaundryQty}</td>
                      <td className="p-3.5 text-center font-mono text-red-400">{s.damagedQty}</td>
                      <td className="p-3.5 text-right text-slate-400 font-mono text-[11px]">
                        {new Date(s.lastUpdated).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRANSACTION LEDGER */}
      {activeTab === 'ledger' && (
        <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/90 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10.5px] tracking-wider">
                <tr>
                  <th className="p-3.5">Txn #</th>
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5">Transaction Type</th>
                  <th className="p-3.5">Movement Flow</th>
                  <th className="p-3.5">Item & Quantity</th>
                  <th className="p-3.5">Authorized By</th>
                  <th className="p-3.5">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {transactions.map(txn => (
                  <tr key={txn.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-blue-400">{txn.transactionNumber}</td>
                    <td className="p-3.5 font-mono text-slate-400">{txn.date} {txn.time}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                        txn.transactionType === 'Issue to Floor'
                          ? 'bg-blue-500/20 text-blue-300'
                          : txn.transactionType === 'Return Dirty' || txn.transactionType === 'Return Clean'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : txn.transactionType === 'Send to Laundry'
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {txn.transactionType}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-300">
                      <span>{txn.fromLocation}</span>
                      <span className="text-slate-500 mx-1.5">→</span>
                      <span>{txn.toLocation}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-slate-100">{txn.linenItemName}</span>
                      <span className="ml-2 font-mono font-bold text-emerald-400">x{txn.quantity}</span>
                    </td>
                    <td className="p-3.5 text-slate-300">{txn.issuedBy}</td>
                    <td className="p-3.5 text-slate-400 italic text-[11px]">{txn.remarks || 'Standard transfer'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MASTER CATALOG */}
      {activeTab === 'items' && (
        <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/90 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10.5px] tracking-wider">
                <tr>
                  <th className="p-3.5">Item Code</th>
                  <th className="p-3.5">Item Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Specification / Size</th>
                  <th className="p-3.5 text-center">Par Level</th>
                  <th className="p-3.5 text-center">Total Resort Stock</th>
                  <th className="p-3.5 text-right">Unit Cost (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {linenItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-blue-400">{item.itemCode}</td>
                    <td className="p-3.5 font-bold text-slate-100">{item.name}</td>
                    <td className="p-3.5 text-slate-300">{item.category}</td>
                    <td className="p-3.5 text-slate-400 font-mono text-[11px]">{item.sizeOrSpec}</td>
                    <td className="p-3.5 text-center font-mono font-semibold text-slate-300">{item.parLevel}</td>
                    <td className="p-3.5 text-center font-mono font-bold text-emerald-400">{item.totalStock} {item.uom}</td>
                    <td className="p-3.5 text-right font-mono text-slate-200">৳{item.unitCost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Issue Linen */}
      {issueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <form onSubmit={handleIssueSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">Issue Clean Linen to Floor Pantry</h3>
              <button type="button" onClick={() => setIssueModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/50 text-red-300 text-xs">
                {errorMessage}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Select Linen Item:</label>
                <select
                  value={issueItemId}
                  onChange={e => setIssueItemId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {linenItems.map(i => (
                    <option key={i.id} value={i.id}>{i.name} ({i.category})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">From Location:</label>
                  <select
                    value={issueFrom}
                    onChange={e => setIssueFrom(e.target.value as LinenLocation)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  >
                    {LOCATIONS.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">To Location:</label>
                  <select
                    value={issueTo}
                    onChange={e => setIssueTo(e.target.value as LinenLocation)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  >
                    {LOCATIONS.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Quantity (Pieces):</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={issueQty}
                    onChange={e => setIssueQty(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Received By (Staff):</label>
                  <input
                    type="text"
                    value={issueStaffName}
                    onChange={e => setIssueStaffName(e.target.value)}
                    placeholder="e.g. Fatema Begum"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Remarks:</label>
                <input
                  type="text"
                  value={issueRemarks}
                  onChange={e => setIssueRemarks(e.target.value)}
                  placeholder="e.g. Daily morning floor replenishment"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIssueModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs"
              >
                Post Ledger Issue
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Return Linen */}
      {returnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <form onSubmit={handleReturnSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">Return Linen from Floor</h3>
              <button type="button" onClick={() => setReturnModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/50 text-red-300 text-xs">
                {errorMessage}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Select Linen Item:</label>
                <select
                  value={returnItemId}
                  onChange={e => setReturnItemId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                >
                  {linenItems.map(i => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Returning From Location:</label>
                <select
                  value={returnFrom}
                  onChange={e => setReturnFrom(e.target.value as LinenLocation)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                >
                  {LOCATIONS.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-emerald-400">Clean Returned (PCS):</label>
                  <input
                    type="number"
                    min={0}
                    value={returnCleanQty}
                    onChange={e => setReturnCleanQty(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-amber-400">Dirty / Soiled (PCS):</label>
                  <input
                    type="number"
                    min={0}
                    value={returnDirtyQty}
                    onChange={e => setReturnDirtyQty(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-red-400">Damaged / Torn (PCS):</label>
                  <input
                    type="number"
                    min={0}
                    value={returnDamagedQty}
                    onChange={e => setReturnDamagedQty(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-rose-400">Lost / Missing (PCS):</label>
                  <input
                    type="number"
                    min={0}
                    value={returnLostQty}
                    onChange={e => setReturnLostQty(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Remarks:</label>
                <input
                  type="text"
                  value={returnRemarks}
                  onChange={e => setReturnRemarks(e.target.value)}
                  placeholder="e.g. End of morning turnover batch"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setReturnModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs"
              >
                Confirm Return Entry
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Laundry Transfer */}
      {laundryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <form onSubmit={handleLaundrySubmit} className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">Laundry Movement Flow</h3>
              <button type="button" onClick={() => setLaundryModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLaundryMode('send')}
                  className={`p-2.5 rounded-xl border font-bold text-xs ${
                    laundryMode === 'send'
                      ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Send Soiled to Laundry
                </button>
                <button
                  type="button"
                  onClick={() => setLaundryMode('receive')}
                  className={`p-2.5 rounded-xl border font-bold text-xs ${
                    laundryMode === 'receive'
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Receive Clean from Laundry
                </button>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Select Linen Item:</label>
                <select
                  value={laundryItemId}
                  onChange={e => setLaundryItemId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                >
                  {linenItems.map(i => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">{laundryMode === 'send' ? 'From Location:' : 'Receive Into Location:'}</label>
                  <select
                    value={laundryLocation}
                    onChange={e => setLaundryLocation(e.target.value as LinenLocation)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  >
                    {LOCATIONS.filter(l => l !== 'Laundry').map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Quantity (Pieces):</label>
                  <input
                    type="number"
                    min={1}
                    value={laundryQty}
                    onChange={e => setLaundryQty(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Remarks:</label>
                <input
                  type="text"
                  value={laundryRemarks}
                  onChange={e => setLaundryRemarks(e.target.value)}
                  placeholder="e.g. Steam pressed King sheets"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setLaundryModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-purple-600 text-white font-bold rounded-xl text-xs"
              >
                Post Laundry Flow
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Write-off Damage/Loss */}
      {damageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <form onSubmit={handleDamageSubmit} className="bg-slate-900 border border-red-500/40 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">Write-Off Damaged / Lost Linen</h3>
              <button type="button" onClick={() => setDamageModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Select Linen Item:</label>
                <select
                  value={damageItemId}
                  onChange={e => setDamageItemId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                >
                  {linenItems.map(i => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Location where detected:</label>
                <select
                  value={damageLoc}
                  onChange={e => setDamageLoc(e.target.value as LinenLocation)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                >
                  {LOCATIONS.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-red-400">Damaged (Pieces):</label>
                  <input
                    type="number"
                    min={0}
                    value={damagedCount}
                    onChange={e => setDamagedCount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-rose-400">Lost (Pieces):</label>
                  <input
                    type="number"
                    min={0}
                    value={lostCount}
                    onChange={e => setLostCount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Cause of Damage / Audit Justification:</label>
                <textarea
                  rows={2}
                  required
                  value={damageNotes}
                  onChange={e => setDamageNotes(e.target.value)}
                  placeholder="e.g. Severe chemical stain during dining event / torn seam beyond repair."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDamageModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-red-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-red-900/30"
              >
                Post Write-off Audit
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
