import React, { useState, useEffect } from 'react';
import { pmsService } from '../services/pmsService';
import { PmsDatabaseState } from '../services/mockPmsDatabase';
import { RoomStatusDashboard } from '../components/dashboard/RoomStatusDashboard';
import { QuickReportsMenuModal } from '../components/common/QuickReportsMenuModal';

interface DashboardViewProps {
  onNavigate: (route: string, reportCode?: string) => void;
  onOpenCheckIn: (reservationId?: string) => void;
  onOpenNewReservation: () => void;
  onSelectRoom: (roomId: string) => void;
  onSelectStay: (stayId: string) => void;
  onOpenCheckout?: (stayId?: string) => void;
  onOpenQuickMenuBar?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenCheckIn,
  onOpenNewReservation,
  onSelectRoom,
  onSelectStay,
  onOpenCheckout,
  onOpenQuickMenuBar
}) => {
  const [db, setDb] = useState<PmsDatabaseState>(pmsService.getState());
  const [isQuickReportsOpen, setIsQuickReportsOpen] = useState<boolean>(false);

  useEffect(() => {
    return pmsService.subscribe(setDb);
  }, []);

  const handleOpenReports = () => {
    if (onOpenQuickMenuBar) {
      onOpenQuickMenuBar();
    } else {
      setIsQuickReportsOpen(true);
    }
  };

  return (
    <div className="space-y-6 text-gray-900">
      {/* 1. PRIMARY MAIN DASHBOARD: ROOM STATUS INFORMATION */}
      <RoomStatusDashboard
        db={db}
        onNavigate={onNavigate}
        onOpenCheckIn={onOpenCheckIn}
        onOpenQuickReservation={onOpenNewReservation}
        onSelectStay={onSelectStay}
        onOpenCheckout={onOpenCheckout || onSelectStay}
        onSelectRoom={onSelectRoom}
        onOpenReportsMenu={handleOpenReports}
      />

      {/* QUICK REPORTS MENU MODAL: ALL REPORTS QUICK ACCESS */}
      <QuickReportsMenuModal
        isOpen={isQuickReportsOpen}
        onClose={() => setIsQuickReportsOpen(false)}
        onNavigate={onNavigate}
      />
    </div>
  );
};

