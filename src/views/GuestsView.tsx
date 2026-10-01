import React, { useState, useEffect } from 'react';
import {
  Users, Search, UserPlus, Download, Printer, Phone, Mail,
  ShieldCheck, Star, ArrowUpRight, Building
} from 'lucide-react';
import { pmsService } from '../services/pmsService';
import { pdfExportService } from '../services/pdfExportService';
import { PmsDatabaseState } from '../services/mockPmsDatabase';
import { Guest } from '../types/pms';

interface GuestsViewProps {
  onSelectGuest: (guestId: string) => void;
  onPrintReport?: (reportData: any) => void;
}

export const GuestsView: React.FC<GuestsViewProps> = ({ onSelectGuest, onPrintReport }) => {
  const [db, setDb] = useState<PmsDatabaseState>(pmsService.getState());
  const [search, setSearch] = useState('');
  const [vipOnly, setVipOnly] = useState(false);

  // New guest modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [idType, setIdType] = useState('NID');
  const [idNumber, setIdNumber] = useState('');
  const [company, setCompany] = useState('');
  const [vip, setVip] = useState(false);

  useEffect(() => {
    return pmsService.subscribe(setDb);
  }, []);

  const filteredGuests = db.guests.filter(g => {
    const matchesSearch =
      g.fullName.toLowerCase().includes(search.toLowerCase()) ||
      g.phone.includes(search) ||
      g.email.toLowerCase().includes(search.toLowerCase()) ||
      g.guestCode.toLowerCase().includes(search.toLowerCase()) ||
      g.idNumber.includes(search);

    const matchesVip = !vipOnly || g.vipStatus;

    return matchesSearch && matchesVip;
  });

  const handleExportPDF = () => {
    const propertyName = db.settings.resortName || 'Resort MIS';
    pdfExportService.exportToPDF({
      title: 'GUEST PROFILES & CRM MASTER DIRECTORY',
      subtitle: `${propertyName.toUpperCase()} • GUEST RELATIONS & CRM`,
      date: new Date().toLocaleDateString('en-GB'),
      columns: [
        { key: 'code', header: 'Guest Code' },
        { key: 'name', header: 'Full Name' },
        { key: 'phone', header: 'Phone' },
        { key: 'company', header: 'Company' },
        { key: 'vip', header: 'VIP' },
        { key: 'stays', header: 'Stays', align: 'center' },
        { key: 'nights', header: 'Nights', align: 'center' },
        { key: 'spend', header: 'Lifetime Spend (BDT)', align: 'right' }
      ],
      rows: filteredGuests.map(g => ({
        code: g.guestCode,
        name: g.fullName,
        phone: g.phone,
        company: g.company || 'Individual',
        vip: g.vipStatus ? 'VIP' : 'Regular',
        stays: `${g.totalStays}`,
        nights: `${g.totalNights}`,
        spend: `BDT ${(g.totalSpend || 0).toLocaleString()}`
      })),
      summaryTotals: {
        name: `Total Guests: ${filteredGuests.length}`,
        spend: `BDT ${filteredGuests.reduce((sum, g) => sum + (g.totalSpend || 0), 0).toLocaleString()}`
      },
      department: 'Guest Relations & Front Desk',
      metadata: {
        'VIP Filter': vipOnly ? 'VIP Only' : 'All Guests',
        'Record Count': `${filteredGuests.length}`
      }
    }, `Guest_Directory_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handlePreviewReport = () => {
    if (onPrintReport) {
      onPrintReport({
        title: 'GUEST PROFILES & CRM MASTER DIRECTORY',
        definition: {
          reportCode: 'RPT-CRM-GUESTS',
          reportName: 'Guest Profiles Directory',
          defaultDataScope: 'Guest Relations'
        },
        department: 'Guest Relations',
        generatedAt: new Date().toLocaleString(),
        generatedBy: 'Guest Relations Officer',
        columns: [
          { key: 'code', header: 'Guest Code' },
          { key: 'name', header: 'Full Name' },
          { key: 'phone', header: 'Phone' },
          { key: 'company', header: 'Company' },
          { key: 'vip', header: 'VIP' },
          { key: 'stays', header: 'Stays', align: 'center' },
          { key: 'nights', header: 'Nights', align: 'center' },
          { key: 'spend', header: 'Lifetime Spend (BDT)', align: 'right' }
        ],
        rows: filteredGuests.map(g => ({
          code: g.guestCode,
          name: g.fullName,
          phone: g.phone,
          company: g.company || 'Individual',
          vip: g.vipStatus ? 'VIP' : 'Regular',
          stays: `${g.totalStays}`,
          nights: `${g.totalNights}`,
          spend: `BDT ${(g.totalSpend || 0).toLocaleString()}`
        })),
        summaryTotals: {
          name: `Total Profiles: ${filteredGuests.length}`,
          spend: `BDT ${filteredGuests.reduce((sum, g) => sum + (g.totalSpend || 0), 0).toLocaleString()}`
        }
      });
    } else {
      handleExportPDF();
    }
  };

  const handleCreateGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) return;

    try {
      const newGuest = pmsService.createGuest({
        fullName,
        phone,
        email: email || `${phone.replace(/[^0-9]/g, '')}@guest.cculb.org`,
        gender: 'Male',
        nationality: 'Bangladeshi',
        address: 'Dhaka, Bangladesh',
        city: 'Dhaka',
        country: 'Bangladesh',
        idType: 'National ID (NID)',
        idNumber: idNumber || 'VERIFIED-NID',
        company,
        vipStatus: vip
      });
      setShowAddModal(false);
      setFullName('');
      setPhone('');
      setEmail('');
      setIdNumber('');
      setCompany('');
      onSelectGuest(newGuest.id);
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4 text-xs text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center border border-amber-500/30">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-100">Guest Profiles & CRM Directory</h1>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                {filteredGuests.length} Guests
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Guest history, VIP preferences, identification records, and lifetime stay metrics.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-colors shadow text-xs cursor-pointer"
            title="Download vector PDF guest CRM directory"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={handlePreviewReport}
            className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors shadow text-xs cursor-pointer"
            title="Preview guest directory report with pagination & print"
          >
            <Printer className="w-4 h-4" />
            <span>Preview & Print</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors shadow-sm text-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>New Guest Profile</span>
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, NID, guest code..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <label className="flex items-center space-x-2 cursor-pointer self-start sm:self-center">
          <input
            type="checkbox"
            checked={vipOnly}
            onChange={(e) => setVipOnly(e.target.checked)}
            className="rounded bg-slate-950 border-slate-700 text-amber-500"
          />
          <span className="text-slate-300 font-medium text-[11px] flex items-center space-x-1">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span>Show VIP Guests Only</span>
          </span>
        </label>
      </div>

      {/* Guests Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[720px]">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Guest Code</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Phone / Contact</th>
                <th className="py-3 px-4">Identification</th>
                <th className="py-3 px-4 text-center">Total Stays</th>
                <th className="py-3 px-4 text-center">Nights</th>
                <th className="py-3 px-4 text-right">Lifetime Spend</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No guest profiles found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredGuests.map(guest => (
                  <tr
                    key={guest.id}
                    onClick={() => onSelectGuest(guest.id)}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      {guest.guestCode}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-100">{guest.fullName}</span>
                        {guest.vipStatus && (
                          <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                            VIP
                          </span>
                        )}
                      </div>
                      {guest.company && (
                        <span className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                          <Building className="w-2.5 h-2.5" />
                          <span>{guest.company}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      <div>{guest.phone}</div>
                      <div className="text-[10px] text-slate-500 font-sans">{guest.email}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <span className="text-slate-400 text-[10px]">{guest.idType}: </span>
                      <span className="font-mono">{guest.idNumber}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-200">
                      {guest.totalStays}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-cyan-400">
                      {guest.totalNights}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                      ৳{(guest.totalSpend || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectGuest(guest.id);
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium text-[11px] border border-slate-700"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Guest Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-4 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-100">Create New Guest Profile</h3>
            <form onSubmit={handleCreateGuest} className="space-y-3">
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Guest Full Name *</span>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Major (Retd.) Rafiqul Islam"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Phone *</span>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 1711-..."
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 text-xs font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="guest@mail.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">ID Type</span>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 text-xs"
                  >
                    <option value="NID">National ID (NID)</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                  </select>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">ID Number</span>
                  <input
                    type="text"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="e.g. 19842691..."
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Company / Affiliation</span>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. CCULB Credit Union / Beximco"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 text-xs"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  checked={vip}
                  onChange={(e) => setVip(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-amber-500"
                />
                <span className="text-slate-300 font-semibold">Mark as VIP Guest Profile</span>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
