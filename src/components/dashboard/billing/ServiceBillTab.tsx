import React, { useState } from 'react';
import { Utensils, Coffee, Sparkles, Shirt, Wine, Car, BedDouble, PlusCircle, CheckCircle2, Clock, FileText, Trash2 } from 'lucide-react';
import { Room, Stay, Folio, FolioItem } from '../../../types/pms';
import { pmsService } from '../../../services/pmsService';

interface ServiceBillTabProps {
  room: Room;
  activeStay: Stay;
  activeFolio: Folio;
  onShowToast: (msg: string) => void;
  onChargePosted?: () => void;
  onBillAdded?: () => void;
}

interface ServicePreset {
  category: FolioItem['type'];
  name: string;
  price: number;
  icon: any;
}

const SERVICE_PRESETS: ServicePreset[] = [
  { category: 'Restaurant', name: 'Buffet Dinner (The Grand Restaurant)', price: 1800, icon: Utensils },
  { category: 'Restaurant', name: 'Buffet Breakfast (The Grand Restaurant)', price: 950, icon: Coffee },
  { category: 'Room Service', name: 'Late Night Club Sandwich & Fries', price: 550, icon: Coffee },
  { category: 'Room Service', name: 'Continental Breakfast Tray', price: 650, icon: Coffee },
  { category: 'Laundry', name: 'Express Laundry - 2x Shirts & Trousers', price: 400, icon: Shirt },
  { category: 'Laundry', name: 'Executive Dry Cleaning Suit', price: 1100, icon: Shirt },
  { category: 'Amenity', name: 'Minibar - Snack & Chocolate Basket', price: 450, icon: Wine },
  { category: 'Amenity', name: 'Minibar - Imported Cold Beverages (3x)', price: 360, icon: Wine },
  { category: 'Spa/Wellness', name: 'Aromatherapy Relaxing Massage 60m', price: 3500, icon: Sparkles },
  { category: 'Amenity', name: 'Airport Pickup / Drop (Private Sedan)', price: 2500, icon: Car },
  { category: 'Amenity', name: 'Rollaway Extra Bed per Night', price: 1500, icon: BedDouble }
];

export const ServiceBillTab: React.FC<ServiceBillTabProps> = ({
  room,
  activeStay,
  activeFolio,
  onShowToast,
  onChargePosted,
  onBillAdded
}) => {
  const [category, setCategory] = useState<FolioItem['type']>('Restaurant');
  const [description, setDescription] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(500);
  const [refSlip, setRefSlip] = useState<string>(`KOT-${room.roomNumber}-${Date.now().toString().slice(-4)}`);
  const [applyTax, setApplyTax] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const subtotal = quantity * unitPrice;
  // Tax 15% VAT + 10% Service Charge if enabled
  const serviceCharge = applyTax ? Math.round(subtotal * 0.10) : 0;
  const vatTax = applyTax ? Math.round(subtotal * 0.15) : 0;
  const totalAmount = subtotal + serviceCharge + vatTax;

  // Filter existing service charges for this room
  const recentServiceCharges = (activeFolio.items || []).filter(
    item => item.type !== 'Room Charge' && (item.type as any) !== 'Payment'
  );

  const handleSelectPreset = (preset: ServicePreset) => {
    setCategory(preset.category);
    setDescription(preset.name);
    setUnitPrice(preset.price);
    setQuantity(1);
    setRefSlip(`${preset.category.substring(0, 3).toUpperCase()}-${room.roomNumber}-${Date.now().toString().slice(-4)}`);
  };

  const handlePostServiceBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Please enter a description for the service bill.');
      return;
    }
    if (unitPrice <= 0 || quantity <= 0) {
      alert('Quantity and price must be greater than zero.');
      return;
    }

    if (activeStay.stopPost || activeFolio.stopPost) {
      alert('Cannot post charges: Stop Post restriction is active on this room. Please remove Stop Post restriction first in the Folio Details tab.');
      return;
    }

    setIsSubmitting(true);
    try {
      pmsService.postFolioCharge(activeFolio.id, {
        type: category,
        description: `${description.trim()} [Slip: ${refSlip || 'N/A'}]`,
        quantity,
        unitPrice,
        applyTax,
        reference: refSlip || 'Front Desk Service Bill'
      });

      onShowToast(`Service bill posted: ${description} (৳${totalAmount.toLocaleString()})`);
      setDescription('');
      setQuantity(1);
      setUnitPrice(500);
      setRefSlip(`KOT-${room.roomNumber}-${Date.now().toString().slice(-4)}`);

      if (onChargePosted) onChargePosted();
      if (onBillAdded) onBillAdded();
    } catch (err: any) {
      alert(err.message || 'Failed to post service charge');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Banner / Stop-Post Warning */}
      {(activeStay.stopPost || activeFolio.stopPost) && (
        <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl flex items-center space-x-2">
          <FileText className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-bold">
            Notice: Stop-Post is ENABLED for Room {room.roomNumber}. Outlet charge postings are currently restricted by Front Desk.
          </span>
        </div>
      )}

      {/* Quick Service Presets */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
            1-Click Service Presets:
          </span>
          <span className="text-[10px] text-gray-400">Select to pre-fill bill details</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {SERVICE_PRESETS.map((preset, i) => {
            const IconComponent = preset.icon;
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className="p-2.5 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-400 rounded-lg text-left transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center space-x-1.5 text-slate-700 group-hover:text-blue-700">
                  <IconComponent className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-wider truncate">{preset.category}</span>
                </div>
                <p className="font-bold text-gray-900 line-clamp-1 mt-1 text-[11px]">{preset.name}</p>
                <span className="text-[11px] font-mono font-black text-blue-700 mt-1">
                  ৳{preset.price.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Service Bill Entry Form */}
      <form onSubmit={handlePostServiceBill} className="p-4 bg-white border border-gray-200 rounded-xl space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <h4 className="font-black text-slate-900 text-sm flex items-center space-x-1.5">
            <PlusCircle className="w-4 h-4 text-blue-600" />
            <span>Post Service Bill to Room {room.roomNumber}</span>
          </h4>
          <span className="text-[11px] text-gray-500">
            Guest: <strong>{activeStay.guestName}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="font-bold text-gray-700 block mb-1">Service Department:</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as FolioItem['type'])}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-bold"
            >
              <option value="Restaurant">Food & Beverage (Dining)</option>
              <option value="Room Service">In-Room Dining / Room Service</option>
              <option value="Laundry">Laundry & Dry Cleaning</option>
              <option value="Minibar">Minibar Consumption</option>
              <option value="Spa">Spa & Wellness</option>
              <option value="Transport">Airport Pickup / Car Rental</option>
              <option value="Extra Bed">Extra Bed / Crib</option>
              <option value="Banquet">Banquet / Meeting Room</option>
              <option value="Custom Service">Other Service Bill</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="font-bold text-gray-700 block mb-1">Service Description / Item Name:</label>
            <input
              type="text"
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Buffet Dinner, 2x Shirts Dry Clean, Airport Drop..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-semibold text-gray-900 focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="font-bold text-gray-700 block mb-1">Quantity:</label>
            <input
              type="number"
              min="1"
              max="99"
              required
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value) || 1)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Unit Price (৳):</label>
            <input
              type="number"
              min="1"
              required
              value={unitPrice}
              onChange={e => setUnitPrice(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Slip / Bill / KOT #:</label>
            <input
              type="text"
              value={refSlip}
              onChange={e => setRefSlip(e.target.value)}
              placeholder="e.g. KOT-402, LND-19"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono"
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Tax & Service Chg:</label>
            <label className="flex items-center space-x-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={applyTax}
                onChange={e => setApplyTax(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span className="font-bold text-gray-800 text-[11px]">15% VAT + 10% SC</span>
            </label>
          </div>
        </div>

        {/* Amount Calculation Summary */}
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between text-[11px]">
          <div className="space-x-4 text-gray-600">
            <span>Subtotal: <strong className="font-mono text-gray-900">৳{subtotal.toLocaleString()}</strong></span>
            {applyTax && (
              <>
                <span>Service Chg (10%): <strong className="font-mono text-gray-900">৳{serviceCharge.toLocaleString()}</strong></span>
                <span>VAT (15%): <strong className="font-mono text-gray-900">৳{vatTax.toLocaleString()}</strong></span>
              </>
            )}
          </div>
          <div className="text-right">
            <span className="text-gray-500 mr-2">Total Service Bill:</span>
            <span className="font-mono font-black text-sm text-blue-700">৳{totalAmount.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center justify-end pt-1">
          <button
            type="submit"
            disabled={isSubmitting || (activeStay.stopPost || activeFolio.stopPost)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Post Service Bill to Folio</span>
          </button>
        </div>
      </form>

      {/* List of Posted Service Bills on This Folio */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-800 text-xs flex items-center space-x-1.5">
            <FileText className="w-3.5 h-3.5 text-gray-500" />
            <span>Service Bills Posted to This Folio ({recentServiceCharges.length})</span>
          </span>
          <span className="text-[11px] text-gray-500 font-mono">
            Total Services: ৳{(recentServiceCharges.reduce((sum, item) => sum + (item.total || 0), 0)).toLocaleString()}
          </span>
        </div>

        {recentServiceCharges.length === 0 ? (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center text-gray-400">
            No service bills posted to this room yet.
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 bg-white shadow-xs">
            {recentServiceCharges.map((item, idx) => (
              <div key={item.id || idx} className="p-2.5 flex items-center justify-between hover:bg-gray-50 text-[11px]">
                <div className="flex items-center space-x-2.5 truncate">
                  <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold shrink-0">
                    {item.type}
                  </span>
                  <div className="truncate">
                    <p className="font-bold text-gray-900 truncate">{item.description}</p>
                    <p className="text-[10px] text-gray-400">
                      Qty: {item.quantity} × ৳{(item.unitPrice || 0).toLocaleString()} • Posted by {item.postedBy}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-2">
                  <span className="font-mono font-black text-slate-900">৳{(item.total || 0).toLocaleString()}</span>
                  <p className="text-[9px] text-gray-400">
                    {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
