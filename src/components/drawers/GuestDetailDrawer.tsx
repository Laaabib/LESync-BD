import React, { useState } from 'react';
import {
  X, User, Phone, Mail, MapPin, Building, ShieldCheck,
  Calendar, Receipt, FileText, Plus, Heart, Edit3, CheckCircle2
} from 'lucide-react';
import { pmsService } from '../../services/pmsService';
import { Guest } from '../../types/pms';

interface GuestDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  guestId: string;
  onBookForGuest?: (guest: Guest) => void;
  onSuccess?: () => void;
}

export const GuestDetailDrawer: React.FC<GuestDetailDrawerProps> = ({
  isOpen,
  onClose,
  guestId,
  onBookForGuest,
  onSuccess
}) => {
  const db = pmsService.getState();
  const guest = db.guests.find(g => g.id === guestId);

  const [activeTab, setActiveTab] = useState<'overview' | 'stays' | 'reservations' | 'invoices' | 'preferences'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [editVip, setEditVip] = useState(false);
  const [editPhone, setEditPhone] = useState('');

  if (!isOpen || !guest) return null;

  const stays = db.stays.filter(s => s.guestId === guest.id);
  const reservations = db.reservations.filter(r => r.guestId === guest.id);
  const invoices = db.invoices.filter(inv => inv.guestOrClientName.includes(guest.fullName));

  const handleSaveProfile = () => {
    try {
      pmsService.updateGuest(guest.id, {
        notes: editNotes,
        vipStatus: editVip,
        phone: editPhone || guest.phone
      });
      setIsEditing(false);
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-150">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-xl h-full flex flex-col shadow-2xl text-xs text-slate-200">
        {/* Header Banner */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-amber-700 text-slate-950 font-bold flex items-center justify-center text-sm shadow">
              {guest.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-100">{guest.fullName}</h3>
                {guest.vipStatus && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                    VIP GUEST
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-slate-400">{guest.guestCode} • Member Since {guest.createdAt ? guest.createdAt.split('T')[0] : '2026'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lifetime Stats Quick Bar */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-slate-900/90 border-b border-slate-800 text-center text-xs">
          <div className="bg-slate-950 p-2 rounded border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Stays</span>
            <span className="text-base font-bold font-mono text-slate-100">{guest.totalStays}</span>
          </div>
          <div className="bg-slate-950 p-2 rounded border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Nights</span>
            <span className="text-base font-bold font-mono text-cyan-400">{guest.totalNights}</span>
          </div>
          <div className="bg-slate-950 p-2 rounded border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Lifetime Spend</span>
            <span className="text-base font-bold font-mono text-amber-400">৳{(guest.totalSpend || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-3 bg-slate-950/60 overflow-x-auto text-[11px]">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'overview' ? 'border-amber-500 text-amber-300 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview & Bio
          </button>
          <button
            onClick={() => setActiveTab('stays')}
            className={`px-3 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'stays' ? 'border-amber-500 text-amber-300 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Stays ({stays.length})
          </button>
          <button
            onClick={() => setActiveTab('reservations')}
            className={`px-3 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'reservations' ? 'border-amber-500 text-amber-300 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Reservations ({reservations.length})
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-3 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'invoices' ? 'border-amber-500 text-amber-300 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`px-3 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'preferences' ? 'border-amber-500 text-amber-300 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Preferences
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-3">
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2.5">
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                  <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Contact & ID Verification</span>
                  <button
                    onClick={() => {
                      setIsEditing(!isEditing);
                      setEditNotes(guest.notes || '');
                      setEditVip(guest.vipStatus || false);
                      setEditPhone(guest.phone);
                    }}
                    className="text-[11px] text-amber-400 flex items-center space-x-1 hover:underline"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
                  </button>
                </div>

                {isEditing ? (
                  <div className="space-y-2 pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Phone:</span>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-1">
                      <input
                        type="checkbox"
                        checked={editVip}
                        onChange={(e) => setEditVip(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-700 text-amber-500"
                      />
                      <span className="text-slate-300 font-semibold">VIP Status Active</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Internal Operational Notes:</span>
                      <textarea
                        rows={3}
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 text-xs"
                      />
                    </div>
                    <button
                      onClick={handleSaveProfile}
                      className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded"
                    >
                      Save Profile Changes
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 text-[11px]">
                    <div className="flex items-center space-x-2 text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-mono">{guest.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-300">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>{guest.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{guest.idType}: <span className="font-mono font-medium">{guest.idNumber}</span></span>
                    </div>
                    {guest.company && (
                      <div className="flex items-center space-x-2 text-slate-300">
                        <Building className="w-3.5 h-3.5 text-slate-500" />
                        <span>{guest.company}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{guest.address || 'Dhaka, Bangladesh'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Guest Notes */}
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Guest Bio & History Notes</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {guest.notes || 'No special operational notes recorded for this guest profile.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: STAYS */}
          {activeTab === 'stays' && (
            <div className="space-y-2">
              {stays.length === 0 ? (
                <div className="p-6 text-center text-slate-500">No active or historical stays recorded yet.</div>
              ) : (
                stays.map(s => (
                  <div key={s.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-amber-400 font-mono">Room {s.roomNumber}</span>
                        <span className="text-slate-300 font-medium">{s.roomTypeName}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          s.status === 'Active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {s.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        In: {s.checkInAt ? s.checkInAt.split('T')[0] : 'N/A'} • Out: {s.actualCheckOutAt ? s.actualCheckOutAt.split('T')[0] : s.expectedCheckOutAt ? s.expectedCheckOutAt.split('T')[0] : 'N/A'}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{s.stayNumber}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: RESERVATIONS */}
          {activeTab === 'reservations' && (
            <div className="space-y-2">
              {reservations.length === 0 ? (
                <div className="p-6 text-center text-slate-500">No reservations found for this guest.</div>
              ) : (
                reservations.map(r => (
                  <div key={r.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-emerald-400">{r.reservationNumber}</span>
                        <span className="text-slate-300">{r.roomTypeName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                          {r.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {r.arrivalDate} → {r.departureDate} ({r.adults} Adults) • ৳{(r.totalEstimatedAmount || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: INVOICES */}
          {activeTab === 'invoices' && (
            <div className="space-y-2">
              {invoices.length === 0 ? (
                <div className="p-6 text-center text-slate-500">No settled tax invoices generated yet.</div>
              ) : (
                invoices.map(inv => (
                  <div key={inv.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-indigo-300">{inv.invoiceNumber}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                          {inv.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{inv.stayOrEventDetails} • {inv.roomOrHall}</p>
                    </div>
                    <span className="text-sm font-mono font-bold text-amber-400">৳{(inv.grandTotal || 0).toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 5: PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="space-y-3 bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Guest Stay Preferences</span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Floor Preference:</span>
                  <span className="font-semibold text-slate-200">High Floor (3rd Floor Lake View)</span>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Bedding:</span>
                  <span className="font-semibold text-slate-200">King Bed (Feather Pillow)</span>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Dietary Restrictions:</span>
                  <span className="font-semibold text-slate-200">Halal / Low Spice</span>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Special Amenities:</span>
                  <span className="font-semibold text-purple-300">Resort VIP Fruit Basket</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              onBookForGuest?.(guest);
              onClose();
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Book New Reservation</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
