import React, { useState, useEffect } from 'react';
import {
  CalendarDays, ChevronLeft, ChevronRight, PartyPopper, Users, Clock
} from 'lucide-react';
import { pmsService } from '../services/pmsService';
import { PmsDatabaseState } from '../services/mockPmsDatabase';

interface ConventionCalendarViewProps {
  onSelectEvent: (eventId: string) => void;
}

export const ConventionCalendarView: React.FC<ConventionCalendarViewProps> = ({ onSelectEvent }) => {
  const [db, setDb] = useState<PmsDatabaseState>(pmsService.getState());
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    return pmsService.subscribe(setDb);
  }, []);

  const today = new Date();
  today.setDate(today.getDate() + weekOffset * 7);

  const days: { dateStr: string; displayDay: string; displayDate: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const displayDay = d.toLocaleDateString('en-US', { weekday: 'short' });
    const displayDate = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    days.push({ dateStr, displayDay, displayDate });
  }

  return (
    <div className="space-y-4 text-xs text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center border border-purple-500/30">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-100">Convention Hall Calendar Matrix</h1>
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px]">
                {db.halls.length} Halls
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Multi-hall visual timeline across Padma, Meghna, Jamuna, Surma, and Karnaphuli halls.
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setWeekOffset(prev => prev - 1)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg border border-slate-700 transition-colors text-xs"
          >
            Current Week
          </button>
          <button
            onClick={() => setWeekOffset(prev => prev + 1)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[800px]">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="sticky left-0 z-20 py-3 px-3 w-48 border-r border-slate-800 font-bold text-slate-300 bg-slate-950 shadow-sm">
                  Convention Hall
                </th>
                {days.map((day, idx) => (
                  <th key={idx} className="py-2 px-2 text-center border-r border-slate-800/80 bg-slate-950">
                    <span className="block text-[10px] uppercase font-bold text-purple-300">{day.displayDay}</span>
                    <span className="block font-mono text-[11px] text-slate-200">{day.displayDate}</span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
              {db.halls.map(hall => (
                <tr key={hall.id} className="hover:bg-slate-800/20 transition-colors">
                  {/* Hall Column */}
                  <td className="sticky left-0 z-10 py-3 px-3 border-r border-slate-800 bg-slate-950 shadow-sm">
                    <div className="font-bold text-slate-100 text-xs">{hall.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Cap: {hall.capacity} Pax • ৳{(hall.baseRatePerDay || 0).toLocaleString()}
                    </div>
                  </td>

                  {/* Days */}
                  {days.map((day, dIdx) => {
                    const eventOnDay = db.eventBookings.find(
                      e => e.hallId === hall.id && e.eventDate === day.dateStr && e.status !== 'Cancelled'
                    );

                    return (
                      <td
                        key={dIdx}
                        className={`p-2 border-r border-slate-800/60 text-center min-h-[60px] ${
                          eventOnDay ? 'bg-purple-950/30' : ''
                        }`}
                      >
                        {eventOnDay ? (
                          <div
                            onClick={() => onSelectEvent(eventOnDay.id)}
                            className="bg-purple-600/90 hover:bg-purple-500 text-white p-2 rounded-lg text-left cursor-pointer transition-all shadow-sm"
                          >
                            <span className="font-bold block truncate text-[11px]">{eventOnDay.eventName}</span>
                            <span className="text-[9.5px] text-purple-200 block truncate">{eventOnDay.clientName}</span>
                            <div className="flex items-center justify-between text-[9px] text-purple-200 mt-1">
                              <span>{eventOnDay.startTime}</span>
                              <span className="font-mono">{eventOnDay.guestCount}p</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-600 block py-3">Available</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
