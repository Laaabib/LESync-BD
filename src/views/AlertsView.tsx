import React, { useState, useEffect } from 'react';
import {
  Bell, CheckCircle2, AlertTriangle, AlertCircle, Info, Trash2, CheckCheck
} from 'lucide-react';
import { pmsService } from '../services/pmsService';
import { PmsDatabaseState } from '../services/mockPmsDatabase';

export const AlertsView: React.FC = () => {
  const [db, setDb] = useState<PmsDatabaseState>(pmsService.getState());

  useEffect(() => {
    return pmsService.subscribe(setDb);
  }, []);

  const handleMarkAllRead = () => {
    pmsService.clearAllAlerts();
  };

  const handleMarkRead = (id: string) => {
    pmsService.markAlertRead(id);
  };

  return (
    <div className="space-y-4 text-xs text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center border border-amber-500/30">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-100">Operational Alerts & Notifications</h1>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px]">
                {db.alerts.filter(n => !n.read).length} Unread
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              System alerts for arrivals, check-outs, maintenance defects, and banquet payments.
            </p>
          </div>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg transition-colors border border-slate-700 text-xs"
        >
          <CheckCheck className="w-4 h-4 text-amber-400" />
          <span>Mark All Read</span>
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-800">
        {db.alerts.length === 0 ? (
          <div className="py-12 text-center text-slate-500">No alerts on file.</div>
        ) : (
          db.alerts.map(notif => (
            <div
              key={notif.id}
              onClick={() => handleMarkRead(notif.id)}
              className={`p-3.5 flex items-start justify-between gap-3 transition-colors cursor-pointer ${
                notif.read ? 'bg-slate-900/50 hover:bg-slate-800/40' : 'bg-slate-950/80 hover:bg-slate-800/60 border-l-2 border-amber-500'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="mt-0.5">
                  {notif.type === 'urgent' ? (
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                  ) : notif.type === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  ) : notif.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Info className="w-4 h-4 text-blue-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className={`text-xs font-bold ${notif.read ? 'text-slate-300' : 'text-slate-100'}`}>
                      {notif.title}
                    </h4>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                    )}
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">{notif.message}</p>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    {notif.timestamp}
                  </span>
                </div>
              </div>

              {!notif.read && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkRead(notif.id);
                  }}
                  className="text-[10.5px] text-amber-400 hover:underline shrink-0"
                >
                  Mark Read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
