import React, { useState, useEffect } from 'react';
import {
  Sparkles, Search, Filter, Plus, DollarSign, Package,
  AlertTriangle, CheckCircle2, BedDouble, User, CreditCard,
  X, Check, History, ArrowUpRight, ShieldCheck, Tag, Palmtree
} from 'lucide-react';
import { housekeepingService } from '../../services/housekeepingService';
import { pmsService } from '../../services/pmsService';
import {
  HousekeepingAmenity,
  AmenityConsumptionRecord
} from '../../types/housekeeping';

export const HousekeepingAmenitiesView: React.FC = () => {
  const [amenities, setAmenities] = useState<HousekeepingAmenity[]>(housekeepingService.getState().amenities);
  const [consumptions, setConsumptions] = useState<AmenityConsumptionRecord[]>(housekeepingService.getState().amenityConsumptions);
  const [rooms, setRooms] = useState(pmsService.getState().rooms);

  const [activeTab, setActiveTab] = useState<'inventory' | 'consumption'>('inventory');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Post Consumption Modal
  const [consumeModalOpen, setConsumeModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedAmenityId, setSelectedAmenityId] = useState('');
  const [consumeQty, setConsumeQty] = useState(1);
  const [activeStayInfo, setActiveStayInfo] = useState<{
    stayId: string;
    folioId: string;
    guestName: string;
    roomNumber: string;
  } | null>(null);
  const [consumeRemarks, setConsumeRemarks] = useState('');

  // Restock Store Modal
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [restockAmenityId, setRestockAmenityId] = useState('');
  const [restockQty, setRestockQty] = useState(50);
  const [restockNotes, setRestockNotes] = useState('');

  useEffect(() => {
    const unsub = housekeepingService.subscribe(s => {
      setAmenities([...s.amenities]);
      setConsumptions([...s.amenityConsumptions]);
      setRooms([...pmsService.getState().rooms]);
    });
    return unsub;
  }, []);

  // When room changes in consume modal, find guest stay and folio
  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
    if (!roomId) {
      setActiveStayInfo(null);
      return;
    }
    const currentStays = pmsService.getState().stays;
    const stay = currentStays.find(s => s.roomId === roomId && s.status === 'Active');
    if (stay) {
      setActiveStayInfo({
        stayId: stay.id,
        folioId: stay.folioId,
        guestName: stay.guestName,
        roomNumber: stay.roomNumber
      });
      return;
    }
    setActiveStayInfo(null);
  };

  const handlePostConsumption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId || !selectedAmenityId) return;

    housekeepingService.recordAmenityConsumption({
      roomId: selectedRoomId,
      amenityId: selectedAmenityId,
      quantity: consumeQty,
      attendantName: pmsService.getState().currentUser.name,
      postChargeToFolio: true,
      notes: consumeRemarks
    });

    setConsumeModalOpen(false);
    setSelectedRoomId('');
    setSelectedAmenityId('');
    setActiveStayInfo(null);
    setConsumeRemarks('');
  };

  const handleRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockAmenityId || restockQty <= 0) return;

    housekeepingService.restockAmenity(restockAmenityId, restockQty, restockNotes);
    setRestockModalOpen(false);
    setRestockNotes('');
  };

  // Filter items
  const filteredAmenities = amenities.filter(item => {
    if (categoryFilter !== 'All' && item.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchSku = item.sku.toLowerCase().includes(q);
      if (!matchName && !matchSku) return false;
    }
    return true;
  });

  const categories = Array.from(new Set(amenities.map(a => a.category)));

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-md">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-linear-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shrink-0">
            <Palmtree className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-base sm:text-lg font-bold text-white uppercase tracking-tight">
                Guest Amenities, Minibar & Folio Billing
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                AMENITY VAULT
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Real-time replenishment tracking, par level alarms, and automated Guest Folio charging on delivery.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setRestockModalOpen(true)}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700"
          >
            <Package className="w-4 h-4" />
            <span>Restock Inventory</span>
          </button>

          <button
            onClick={() => setConsumeModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-emerald-900/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Record Consumption / Bill Folio</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'inventory' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          Amenity Master Catalog ({amenities.length})
        </button>

        <button
          onClick={() => setActiveTab('consumption')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'consumption' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          Consumption & Folio Billing Ledger ({consumptions.length})
        </button>
      </div>

      {/* VIEW 1: AMENITY CATALOG */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search amenities by name or SKU..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="All">All Categories</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/90 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10.5px] tracking-wider">
                  <tr>
                    <th className="p-3.5">SKU & Item Name</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5 text-center">Unit</th>
                    <th className="p-3.5 text-center">In Stock</th>
                    <th className="p-3.5 text-center">Reorder Threshold</th>
                    <th className="p-3.5 text-right">Unit Cost</th>
                    <th className="p-3.5 text-right">Guest Price</th>
                    <th className="p-3.5 text-center">Billing Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {filteredAmenities.map(item => {
                    const isLow = item.currentStock <= item.reorderLevel;

                    return (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-bold text-slate-100">
                          <div>{item.name}</div>
                          <div className="text-[10.5px] font-mono text-slate-400">{item.sku}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                            {item.category}
                          </span>
                        </td>
                        <td className="p-3.5 text-center text-slate-300 font-mono">{item.unit}</td>
                        <td className="p-3.5 text-center">
                          <span className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs ${
                            isLow ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-800 text-slate-100'
                          }`}>
                            {item.currentStock}
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-mono text-slate-400">{item.reorderLevel}</td>
                        <td className="p-3.5 text-right font-mono text-slate-400">৳{(item.cost || 0).toLocaleString()}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                          ৳{(item.salePrice || 0).toLocaleString()}
                        </td>
                        <td className="p-3.5 text-center">
                          {item.isChargeable ? (
                            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold text-[10.5px]">
                              Chargeable to Folio
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold text-[10.5px]">
                              Complimentary
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: CONSUMPTION & BILLING AUDIT LEDGER */}
      {activeTab === 'consumption' && (
        <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/90 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10.5px] tracking-wider">
                <tr>
                  <th className="p-3.5">Record #</th>
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5">Room & Guest</th>
                  <th className="p-3.5">Amenity / Item</th>
                  <th className="p-3.5 text-center">Quantity</th>
                  <th className="p-3.5 text-right">Amount</th>
                  <th className="p-3.5 text-center">Folio Status</th>
                  <th className="p-3.5">Delivered By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {consumptions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      No consumption records posted yet.
                    </td>
                  </tr>
                ) : (
                  consumptions.map(c => (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-blue-400">{c.recordNumber}</td>
                      <td className="p-3.5 text-slate-400 text-[11px]">
                        {new Date(c.consumedAt).toLocaleDateString()} {new Date(c.consumedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-100">Room {c.roomNumber}</div>
                        <div className="text-[10.5px] text-slate-400">{c.guestName || 'Non-Resident / Vacant'}</div>
                      </td>
                      <td className="p-3.5 font-medium text-slate-200">{c.amenityName}</td>
                      <td className="p-3.5 text-center font-mono font-bold text-slate-100">{c.quantity}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                        {c.isChargeable ? `৳${(c.totalAmount || 0).toLocaleString()}` : 'Free'}
                      </td>
                      <td className="p-3.5 text-center">
                        {c.isPostedToFolio ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] flex items-center justify-center space-x-1 w-fit mx-auto">
                            <Check className="w-3 h-3" />
                            <span>Posted to Folio</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium text-[10px]">
                            Internal Restock
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-300">{c.attendantName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Record Consumption & Post to Folio */}
      {consumeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <form onSubmit={handlePostConsumption} className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">Record Amenity Consumption</h3>
              <button type="button" onClick={() => setConsumeModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Select Room:</label>
                <select
                  required
                  value={selectedRoomId}
                  onChange={e => handleRoomSelect(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose Room --</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>
                      Room {r.roomNumber} ({r.roomTypeName}) - {r.operationalStatus}
                    </option>
                  ))}
                </select>
              </div>

              {activeStayInfo && (
                <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/30 space-y-1">
                  <div className="text-[11px] font-bold text-blue-400">In-House Guest Identified</div>
                  <div className="text-slate-200 font-semibold">{activeStayInfo.guestName}</div>
                  <div className="text-[10px] text-slate-400">Folio will automatically be debited upon saving.</div>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Amenity Item:</label>
                <select
                  required
                  value={selectedAmenityId}
                  onChange={e => setSelectedAmenityId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose Amenity --</option>
                  {amenities.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.category}) - Stock: {a.currentStock} {a.isChargeable ? `(৳${a.salePrice})` : '(Free)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Quantity Provided:</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={consumeQty}
                  onChange={e => setConsumeQty(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Delivery Notes (Optional):</label>
                <textarea
                  value={consumeRemarks}
                  onChange={e => setConsumeRemarks(e.target.value)}
                  placeholder="e.g. Delivered on guest request via front desk"
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setConsumeModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-900/30"
              >
                Post & Apply Charge
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Restock Inventory */}
      {restockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <form onSubmit={handleRestock} className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">Restock Housekeeping Store</h3>
              <button type="button" onClick={() => setRestockModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Amenity to Restock:</label>
                <select
                  required
                  value={restockAmenityId}
                  onChange={e => setRestockAmenityId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Select Item --</option>
                  {amenities.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Current Stock: {a.currentStock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Quantity Added to Stock:</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQty}
                  onChange={e => setRestockQty(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Supplier / GRN Reference (Optional):</label>
                <input
                  type="text"
                  value={restockNotes}
                  onChange={e => setRestockNotes(e.target.value)}
                  placeholder="e.g. Received from Central Warehouse GRN-882"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 placeholder-slate-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setRestockModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-900/30"
              >
                Confirm Restock
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
