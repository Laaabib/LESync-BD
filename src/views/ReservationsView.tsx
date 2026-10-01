import React, { useState, useEffect } from 'react';
import {
  CalendarDays, Calendar, PlusCircle, Search, Download, Filter,
  CheckCircle2, XCircle, LogIn, Clock, Eye, Printer
} from 'lucide-react';
import { pmsService } from '../services/pmsService';
import { pdfExportService } from '../services/pdfExportService';
import { PmsDatabaseState } from '../services/mockPmsDatabase';
import { Reservation } from '../types/pms';

interface ReservationsViewProps {
  onOpenNewReservation: () => void;
  onOpenCheckIn: (reservationId: string) => void;
  onSelectGuest?: (guestId: string) => void;
  onPrintReservation?: (reservation: Reservation) => void;
  onPrintReport?: (reportData: any) => void;
}

export const ReservationsView: React.FC<ReservationsViewProps> = ({
  onOpenNewReservation,
  onOpenCheckIn,
  onSelectGuest,
  onPrintReservation,
  onPrintReport
}) => {
  const [db, setDb] = useState<PmsDatabaseState>(pmsService.getState());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Group' | 'Corporate'>('All');

  useEffect(() => {
    return pmsService.subscribe(setDb);
  }, []);

  const filteredReservations = db.reservations.filter(res => {
    const q = search.toLowerCase();
    const matchesSearch =
      res.reservationNumber.toLowerCase().includes(q) ||
      res.guestName.toLowerCase().includes(q) ||
      res.guestPhone.includes(search) ||
      (res.assignedRoomNumber && res.assignedRoomNumber.includes(search)) ||
      (res.companyName && res.companyName.toLowerCase().includes(q)) ||
      (res.groupName && res.groupName.toLowerCase().includes(q)) ||
      (res.groupMembers && res.groupMembers.some(m => m.name.toLowerCase().includes(q))) ||
      (res.allocatedRooms && res.allocatedRooms.some(ar => (ar.guestName && ar.guestName.toLowerCase().includes(q)) || (ar.roomNumber && ar.roomNumber.includes(search))));

    const matchesStatus = statusFilter === 'All' || res.status === statusFilter;
    const rawSource = String(res.bookingSource || '');
    const matchesSource = sourceFilter === 'All' || 
      rawSource === sourceFilter ||
      (sourceFilter === 'Phone / Direct' && (rawSource === 'Direct Phone' || rawSource === 'Phone / Direct')) ||
      (sourceFilter === 'Corporate' && (rawSource.includes('Corporate') || res.customerType === 'Corporate')) ||
      (sourceFilter === 'Website Engine' && (rawSource === 'Website Direct' || rawSource === 'Website Engine')) ||
      (sourceFilter === 'OTA' && (rawSource === 'Booking.com' || rawSource === 'Agoda' || rawSource.includes('OTA')));

    const matchesType =
      typeFilter === 'All' ||
      (typeFilter === 'Group' && (res.isGroupBooking || (res.allocatedRooms && res.allocatedRooms.length > 1))) ||
      (typeFilter === 'Corporate' && (res.customerType === 'Corporate' || rawSource === 'Corporate'));

    return matchesSearch && matchesStatus && matchesSource && matchesType;
  });

  const handleExportPDF = () => {
    const propertyName = db.settings.resortName || 'Resort MIS';
    pdfExportService.exportToPDF({
      title: 'ROOM RESERVATIONS DIRECTORY & FORECAST',
      subtitle: `${propertyName.toUpperCase()} • FRONT OFFICE OPERATIONS`,
      date: new Date().toLocaleDateString('en-GB'),
      columns: [
        { key: 'resNumber', header: 'Res #' },
        { key: 'guest', header: 'Guest Name' },
        { key: 'roomType', header: 'Room Type' },
        { key: 'room', header: 'Room' },
        { key: 'arrival', header: 'Arrival' },
        { key: 'departure', header: 'Departure' },
        { key: 'status', header: 'Status' },
        { key: 'deposit', header: 'Deposit (BDT)', align: 'right' },
        { key: 'total', header: 'Total Est. (BDT)', align: 'right' }
      ],
      rows: filteredReservations.map(r => ({
        resNumber: r.reservationNumber,
        guest: r.guestName,
        roomType: r.roomTypeName,
        room: r.assignedRoomNumber || 'TBD',
        arrival: r.arrivalDate,
        departure: r.departureDate,
        status: r.status,
        deposit: `BDT ${(r.paidAmount || 0).toLocaleString()}`,
        total: `BDT ${(r.totalEstimatedAmount || 0).toLocaleString()}`
      })),
      summaryTotals: {
        guest: `Total Bookings: ${filteredReservations.length}`,
        total: `BDT ${filteredReservations.reduce((sum, r) => sum + (r.totalEstimatedAmount || 0), 0).toLocaleString()}`
      },
      department: 'Front Office & Reservations',
      metadata: {
        'Status Filter': statusFilter,
        'Source Filter': sourceFilter
      }
    }, `Reservations_Directory_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handlePreviewReport = () => {
    if (onPrintReport) {
      onPrintReport({
        title: 'ROOM RESERVATIONS DIRECTORY & FORECAST',
        definition: {
          reportCode: 'RPT-RES-DIR',
          reportName: 'Room Reservations Directory',
          defaultDataScope: 'Front Office'
        },
        department: 'Front Office',
        generatedAt: new Date().toLocaleString(),
        generatedBy: 'Reservations Manager',
        columns: [
          { key: 'resNumber', header: 'Res #' },
          { key: 'guest', header: 'Guest Name' },
          { key: 'roomType', header: 'Room Type' },
          { key: 'room', header: 'Room' },
          { key: 'arrival', header: 'Arrival' },
          { key: 'departure', header: 'Departure' },
          { key: 'status', header: 'Status' },
          { key: 'deposit', header: 'Deposit (BDT)', align: 'right' },
          { key: 'total', header: 'Total Est. (BDT)', align: 'right' }
        ],
        rows: filteredReservations.map(r => ({
          resNumber: r.reservationNumber,
          guest: r.guestName,
          roomType: r.roomTypeName,
          room: r.assignedRoomNumber || 'TBD',
          arrival: r.arrivalDate,
          departure: r.departureDate,
          status: r.status,
          deposit: `BDT ${(r.paidAmount || 0).toLocaleString()}`,
          total: `BDT ${(r.totalEstimatedAmount || 0).toLocaleString()}`
        })),
        summaryTotals: {
          guest: `Total Bookings: ${filteredReservations.length}`,
          total: `BDT ${filteredReservations.reduce((sum, r) => sum + (r.totalEstimatedAmount || 0), 0).toLocaleString()}`
        }
      });
    } else {
      handleExportPDF();
    }
  };

  const handleCancelReservation = (resId: string) => {
    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      pmsService.cancelReservation(resId, 'Cancelled from Reservations Desk');
    }
  };

  return (
    <div className="space-y-4 text-xs text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center border border-amber-500/30">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-100">Room Reservations Directory</h1>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                {filteredReservations.length} Bookings
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Advance bookings, deposit settlements, OTA channels, and walk-in records.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-colors shadow text-xs cursor-pointer"
            title="Download vector PDF reservations directory"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={handlePreviewReport}
            className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors shadow text-xs cursor-pointer"
            title="Preview report modal with pagination & print"
          >
            <Printer className="w-4 h-4" />
            <span>Preview & Print</span>
          </button>
          <button
            onClick={onOpenNewReservation}
            className="flex items-center space-x-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors shadow-sm text-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Reservation</span>
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by res #, guest, phone, room..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-slate-400 text-[11px]">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
          >
            <option value="All">All Statuses</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Checked-In">Checked-In</option>
            <option value="Checked-Out">Checked-Out</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* Source Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-slate-400 text-[11px]">Channel:</span>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
          >
            <option value="All">All Booking Channels</option>
            <option value="Phone / Direct">Phone / Direct Call</option>
            <option value="Front Desk Walk-in">Front Desk Walk-in</option>
            <option value="Corporate">Corporate / Member</option>
            <option value="Website Engine">Website Direct Engine</option>
            <option value="Booking.com">Booking.com</option>
            <option value="Agoda">Agoda</option>
            <option value="OTA">All OTA Partners</option>
            <option value="Travel Agent">Travel Agent</option>
          </select>
        </div>
      </div>

      {/* Quick Filter Pill Ribbon */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto text-[11px] pb-1">
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => { setStatusFilter('All'); setSourceFilter('All'); setTypeFilter('All'); setSearch(''); }}
            className={`px-2.5 py-1 rounded-full font-medium transition cursor-pointer ${
              statusFilter === 'All' && sourceFilter === 'All' && typeFilter === 'All' && !search
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Bookings ({db.reservations.length})
          </button>
          <button
            onClick={() => setTypeFilter(typeFilter === 'Group' ? 'All' : 'Group')}
            className={`px-2.5 py-1 rounded-full font-medium transition cursor-pointer flex items-center space-x-1 ${
              typeFilter === 'Group'
                ? 'bg-purple-600 text-white font-bold'
                : 'bg-slate-800 text-purple-300 hover:text-purple-200 border border-purple-500/30'
            }`}
          >
            <span>👥 Group Bookings ({db.reservations.filter(r => r.isGroupBooking || (r.allocatedRooms && r.allocatedRooms.length > 1)).length})</span>
          </button>
          <button
            onClick={() => setTypeFilter(typeFilter === 'Corporate' ? 'All' : 'Corporate')}
            className={`px-2.5 py-1 rounded-full font-medium transition cursor-pointer flex items-center space-x-1 ${
              typeFilter === 'Corporate'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-slate-800 text-blue-300 hover:text-blue-200 border border-blue-500/30'
            }`}
          >
            <span>🏢 Corporate ({db.reservations.filter(r => r.customerType === 'Corporate' || r.bookingSource === 'Corporate').length})</span>
          </button>
          <button
            onClick={() => setStatusFilter('Confirmed')}
            className={`px-2.5 py-1 rounded-full font-medium transition cursor-pointer ${
              statusFilter === 'Confirmed'
                ? 'bg-emerald-500 text-white font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Confirmed ({db.reservations.filter(r => r.status === 'Confirmed').length})
          </button>
          <button
            onClick={() => setStatusFilter('Checked-In')}
            className={`px-2.5 py-1 rounded-full font-medium transition cursor-pointer ${
              statusFilter === 'Checked-In'
                ? 'bg-blue-500 text-white font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            In-House ({db.reservations.filter(r => r.status === 'Checked-In').length})
          </button>
          <button
            onClick={() => setStatusFilter('Checked-Out')}
            className={`px-2.5 py-1 rounded-full font-medium transition cursor-pointer ${
              statusFilter === 'Checked-Out'
                ? 'bg-slate-600 text-white font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Departed ({db.reservations.filter(r => r.status === 'Checked-Out').length})
          </button>
          <button
            onClick={() => setStatusFilter('Cancelled')}
            className={`px-2.5 py-1 rounded-full font-medium transition cursor-pointer ${
              statusFilter === 'Cancelled'
                ? 'bg-rose-500 text-white font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Cancelled ({db.reservations.filter(r => r.status === 'Cancelled').length})
          </button>
        </div>

        {(search || statusFilter !== 'All' || sourceFilter !== 'All' || typeFilter !== 'All') && (
          <button
            onClick={() => { setSearch(''); setStatusFilter('All'); setSourceFilter('All'); setTypeFilter('All'); }}
            className="text-amber-400 hover:text-amber-300 font-semibold underline text-[11px] whitespace-nowrap cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Main Reservations Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[850px]">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Res #</th>
                <th className="py-3 px-4">Guest / Booking Info</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Room Allocation</th>
                <th className="py-3 px-4">Stay Dates</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Advance Paid</th>
                <th className="py-3 px-4 text-right">Total Est.</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 space-y-3">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 border border-slate-700">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-semibold text-slate-300">
                        {db.reservations.length === 0 ? 'No reservations found in the PMS system yet.' : 'No reservations match your current filters.'}
                      </p>
                      <p className="text-xs text-slate-500 max-w-sm">
                        {db.reservations.length === 0 
                          ? 'Create a new room booking, corporate reservation, or group booking to start checking in guests.'
                          : 'Try clearing the search query, channel, group, or status filters to view all bookings.'}
                      </p>
                      <div className="flex items-center space-x-2 pt-2">
                        {(search || statusFilter !== 'All' || sourceFilter !== 'All' || typeFilter !== 'All') && (
                          <button
                            onClick={() => { setSearch(''); setStatusFilter('All'); setSourceFilter('All'); setTypeFilter('All'); }}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 cursor-pointer"
                          >
                            Reset All Filters
                          </button>
                        )}
                        <button
                          onClick={onOpenNewReservation}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center space-x-1.5 shadow-sm cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>New Reservation</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReservations.map(res => (
                  <tr key={res.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      <div>{res.reservationNumber}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {res.customerType === 'Corporate' && (
                          <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 text-[9px] font-bold border border-blue-500/30">
                            CORP
                          </span>
                        )}
                        {(res.isGroupBooking || (res.allocatedRooms && res.allocatedRooms.length > 1)) && (
                          <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[9px] font-bold border border-purple-500/30">
                            GROUP
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onSelectGuest?.(res.guestId)}
                        className="font-bold text-slate-100 hover:text-amber-300 transition-colors block text-left"
                      >
                        {res.guestName}
                      </button>
                      {res.customerType === 'Corporate' && res.companyName && (
                        <div className="text-[10px] text-blue-300 font-medium">
                          🏢 {res.companyName}
                        </div>
                      )}
                      {res.isGroupBooking && res.groupName && (
                        <div className="text-[10px] text-purple-300 font-medium">
                          👥 {res.groupName} ({res.totalRoomsCount || res.allocatedRooms?.length || 1} Rooms)
                        </div>
                      )}
                      <span className="text-[10px] text-slate-400">{res.bookingSource}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {res.guestPhone}
                    </td>
                    <td className="py-3 px-4">
                      {res.allocatedRooms && res.allocatedRooms.length > 1 ? (
                        <div>
                          <span className="font-bold text-amber-300 block text-xs">
                            🏨 {res.allocatedRooms.length} Rooms Allocated
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1 max-w-[220px]">
                            {res.allocatedRooms.map((ar, i) => (
                              <span
                                key={i}
                                title={`${ar.guestName || res.guestName} - ${ar.roomTypeName} (${ar.adults}A, ${ar.children}C)`}
                                className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[9px] border border-slate-700"
                              >
                                {ar.roomNumber ? `Rm ${ar.roomNumber}` : `#${i + 1}`} ({ar.roomTypeName.split(' ')[0]})
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="font-semibold text-slate-200 block">{res.roomTypeName}</span>
                          {res.assignedRoomNumber ? (
                            <span className="text-[10px] text-cyan-400 font-mono">Assigned: Room {res.assignedRoomNumber}</span>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">Unassigned room</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <span>{res.arrivalDate} → {res.departureDate}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10.5px] px-2 py-0.5 rounded font-semibold ${
                        res.status === 'Confirmed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        res.status === 'Checked-In' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                        res.status === 'Checked-Out' ? 'bg-slate-800 text-slate-400' :
                        'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {res.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-400">
                      ৳{(res.paidAmount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                      ৳{(res.totalEstimatedAmount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => onPrintReservation?.(res)}
                          title="Print Reservation Confirmation Voucher"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded font-medium border border-slate-700 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {res.status === 'Confirmed' && (
                          <button
                            onClick={() => onOpenCheckIn(res.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[11px] transition-colors"
                          >
                            Check-In
                          </button>
                        )}
                        {res.status === 'Confirmed' && (
                          <button
                            onClick={() => handleCancelReservation(res.id)}
                            title="Cancel Reservation"
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
