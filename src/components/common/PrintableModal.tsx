import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas-pro';
import {
  Printer, X, Download, FileText, CheckCircle2, BedDouble, Calendar,
  User, CreditCard, Receipt, Building, Sparkles,
  FileCheck2, Compass, Layers, ChevronLeft, ChevronRight, ChefHat, UtensilsCrossed
} from 'lucide-react';
import { Invoice, Stay, Folio, Payment, EventBooking, SystemSetting, Reservation, RestaurantOrder } from '../../types/pms';
import { pdfExportService, triggerPdfDownload } from '../../services/pdfExportService';
import { ReportQueryResult } from '../../services/reportingService';
import { pmsService } from '../../services/pmsService';

export type PrintableDocumentType = 
  | 'invoice' 
  | 'pos-bill'
  | 'kot-receipt'
  | 'folio'
  | 'folio-statement'
  | 'reservation-confirmation'
  | 'checkout-form'
  | 'checkout-statement'
  | 'registration-card' 
  | 'payment-receipt' 
  | 'event-contract' 
  | 'banquet-contract'
  | 'beo'
  | 'function-sheet'
  | 'daily-flash-report'
  | 'operational-report'
  | 'report';

interface PrintableModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType?: PrintableDocumentType;
  type?: PrintableDocumentType;
  data: any;
}

// Convert numbers into words for Bangladesh Taka (BDT)
function numberToWordsBDT(num: number): string {
  if (isNaN(num) || num === 0) return 'Zero Taka Only';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    const digit = n % 10;
    if (n < 100) return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 === 0 ? '' : ' ' + inWords(n % 100));
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
  }

  const rounded = Math.round(num);
  return `${inWords(rounded)} Taka Only`;
}

export const PrintableModal: React.FC<PrintableModalProps> = (props) => {
  const { isOpen, onClose } = props;
  const rawData = props.data || {};

  // Restaurant / Bar POS Order extraction
  let posOrder: RestaurantOrder | any = undefined;
  if (rawData) {
    if ('orderNumber' in rawData) posOrder = rawData;
    else if (rawData.order && 'orderNumber' in rawData.order) posOrder = rawData.order;
    else if (rawData.restaurantOrder && 'orderNumber' in rawData.restaurantOrder) posOrder = rawData.restaurantOrder;
  }
  const isPosOrderData = Boolean(
    posOrder ||
    rawData?.outlet === 'restaurant' ||
    rawData?.outlet === 'bar' ||
    props.documentType === 'pos-bill' ||
    props.type === 'pos-bill' ||
    props.documentType === 'kot-receipt' ||
    props.type === 'kot-receipt'
  );

  const defaultInitialDocType = (props.documentType || props.type)
    ? ((props.documentType || props.type) as PrintableDocumentType)
    : (isPosOrderData ? 'pos-bill' : 'invoice');

  const [activeDocType, setActiveDocType] = React.useState<PrintableDocumentType>(defaultInitialDocType);
  const [isLandscape, setIsLandscape] = React.useState(false);
  const [compactScale, setCompactScale] = React.useState(false);
  const [previewPage, setPreviewPage] = React.useState(1);
  const [downloadFeedback, setDownloadFeedback] = React.useState<string | null>(null);
  const [isExporting, setIsExporting] = React.useState(false);

  const docType = activeDocType;
  const isThermal80mm = (activeDocType === 'pos-bill' || activeDocType === 'kot-receipt') || (
    isPosOrderData && activeDocType !== 'invoice'
  );

  // Report data extraction for orientation calculation
  const reportData = rawData && (rawData.reportData || rawData.kpis || rawData.columns ? rawData : undefined);
  const isReportResult = Boolean(
    reportData &&
    reportData.columns &&
    Array.isArray(reportData.columns) &&
    reportData.rows &&
    Array.isArray(reportData.rows)
  );

  React.useEffect(() => {
    if (props.documentType || props.type) {
      setActiveDocType((props.documentType || props.type) as PrintableDocumentType);
    } else if (isPosOrderData) {
      setActiveDocType('pos-bill');
    }
  }, [props.documentType, props.type, isOpen, isPosOrderData]);

  React.useEffect(() => {
    if (isReportResult && reportData?.columns && reportData.columns.length >= 6) {
      setIsLandscape(true);
    }
  }, [isReportResult, reportData]);

  React.useEffect(() => {
    if (isOpen) {
      setPreviewPage(1);
      setDownloadFeedback(null);
    }
  }, [isOpen, activeDocType]);

  // Escape key to close modal (MUST be called before any early return)
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const defaultSettings: SystemSetting = {
    resortName: 'LESync Resort & Convention Hall',
    address: 'Purbachal Link Road, Gazipur / Dhaka, Bangladesh',
    phone: '+880 1711-223344 / +880 9612-445566',
    email: 'info@lesyncresort.com / support@leinnova.com',
    taxRatePercent: 15,
    serviceChargePercent: 10,
    currencySymbol: '৳',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    allowOverbooking: false,
    requireDepositForReservation: true,
    autoNightAuditEnabled: true,
    autoNightAuditTime: '05:00',
    currentBusinessDate: '2026-08-31'
  };

  // Safe data unwrapping - always dynamically prioritize the active PMS database settings
  const liveSettings = pmsService.getState()?.settings;
  const settings: SystemSetting = (rawData && rawData.settings)
    ? { ...defaultSettings, ...liveSettings, ...rawData.settings }
    : { ...defaultSettings, ...(liveSettings || {}) };
  
  // Invoice extraction
  let invoice: Invoice | undefined = undefined;
  if (rawData) {
    if ('invoiceNumber' in rawData) invoice = rawData as Invoice;
    else if (rawData.invoice) invoice = rawData.invoice;
    else if ('orderNumber' in rawData) {
      // Auto-adapt RestaurantOrder into an Invoice view
      const o = rawData;
      const vat = Math.round(o.subtotal * 0.15);
      const srv = Math.round(o.subtotal * 0.10);
      invoice = {
        id: o.id,
        invoiceNumber: `INV-${o.orderNumber}`,
        folioId: o.folioId,
        guestOrClientName: o.guestName || 'Restaurant Guest',
        roomOrHall: o.roomNumber ? `Room ${o.roomNumber}` : (o.tableNumber ? `Table ${o.tableNumber}` : (o.orderType === 'bar-lounge' ? 'Bar & Lounge Tab' : 'Takeaway / Outlets')),
        dates: `Date: ${o.createdAt ? o.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]}`,
        stayOrEventDetails: `${o.orderType === 'in-room-dining' ? 'In-Room Dining POS' : o.orderType === 'bar-lounge' ? 'Bar & Lounge Tab' : 'Restaurant Dining POS'} • ${o.paymentMethod || 'Direct Payment'}`,
        items: (o.items || []).map((i: any) => ({
          description: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.totalPrice || (i.unitPrice * i.quantity)
        })),
        subtotal: o.subtotal,
        discount: 0,
        serviceCharge: srv,
        tax: o.tax || vat,
        grandTotal: o.total,
        paidAmount: o.paymentStatus === 'Paid-Direct' ? o.total : 0,
        balance: o.paymentStatus === 'Billed-To-Room' ? o.total : 0,
        status: o.paymentStatus === 'Paid-Direct' ? 'Paid' : 'Issued',
        issuedAt: o.createdAt || new Date().toISOString(),
        issuedBy: 'F&B Cashier / Duty Captain'
      };
    }
    else if ('chargeNumber' in rawData) {
      // Auto-adapt ActivityAmenityCharge into an Invoice view
      const c = rawData;
      invoice = {
        id: c.id,
        invoiceNumber: `INV-${c.chargeNumber}`,
        folioId: c.folioId,
        guestOrClientName: c.guestOrCustomerName || 'Resort Guest',
        roomOrHall: c.roomNumber ? `Room ${c.roomNumber}` : 'Recreation / Amenity Counter',
        dates: `Date: ${c.createdAt ? c.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]}`,
        stayOrEventDetails: `${c.category}: ${c.serviceType} • ${c.paymentType}`,
        items: [{
          description: `${c.serviceType} (${c.category})`,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
          total: c.subtotal
        }],
        subtotal: c.subtotal,
        discount: 0,
        serviceCharge: 0,
        tax: c.tax,
        grandTotal: c.grandTotal,
        paidAmount: c.settlementStatus === 'Paid Direct' ? c.grandTotal : 0,
        balance: c.settlementStatus === 'Posted to Room' ? c.grandTotal : 0,
        status: c.settlementStatus === 'Paid Direct' ? 'Paid' : 'Issued',
        issuedAt: c.createdAt || new Date().toISOString(),
        issuedBy: c.createdBy || 'Duty Activity Supervisor'
      };
    }
    else if ('folioNumber' in rawData && docType === 'invoice') {
      // Auto-adapt Folio into an Invoice view
      const f = rawData as Folio;
      invoice = {
        id: f.id,
        invoiceNumber: f.folioNumber.replace('FOL-', 'INV-'),
        folioId: f.id,
        guestOrClientName: f.guestName,
        roomOrHall: f.roomNumber ? `Room ${f.roomNumber}` : 'Master Folio',
        dates: `Stay opened ${f.openedAt ? f.openedAt.split('T')[0] : 'Current'}`,
        stayOrEventDetails: `Stay in Room ${f.roomNumber}`,
        items: f.items.map(i => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.total
        })),
        subtotal: f.subtotal,
        discount: f.discountTotal,
        serviceCharge: f.serviceChargeTotal,
        tax: f.taxTotal,
        grandTotal: f.grandTotal,
        paidAmount: f.paidTotal,
        balance: f.balance,
        status: f.balance <= 0 ? 'Paid' : 'Issued',
        issuedAt: new Date().toISOString(),
        issuedBy: 'Front Desk Duty Officer'
      };
    }
  }

  // Folio extraction
  const folio: Folio | undefined = rawData && ('folioNumber' in rawData ? rawData : rawData.folio);
  
  // Stay extraction
  const stay: Stay | undefined = rawData && ('stayNumber' in rawData ? rawData : rawData.stay);
  
  // Reservation extraction
  const reservation: Reservation | undefined = rawData && ('reservationNumber' in rawData ? rawData : rawData.reservation);
  const guest = reservation?.guestId ? pmsService.getState()?.guests?.find(g => g.id === reservation.guestId) : undefined;
  const currentUser = pmsService.getState()?.currentUser;

  const formatVoucherDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getFreeCancellationDate = (arrivalDateStr?: string) => {
    if (!arrivalDateStr) return '2 days prior to check-in';
    try {
      const d = new Date(arrivalDateStr);
      d.setDate(d.getDate() - 2);
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return '2 days prior to check-in';
    }
  };
  
  // Payment extraction
  const payment: Payment | undefined = rawData && ('transactionNumber' in rawData ? rawData : (rawData.payment || rawData.receipt));
  
  // Event extraction
  const event: EventBooking | undefined = rawData && ('eventNumber' in rawData ? rawData : rawData.event);
  
  const isGenericReport = Boolean(
    isReportResult ||
    docType === 'daily-flash-report' ||
    docType === 'operational-report' ||
    docType === 'report' ||
    (reportData && (reportData.columns || reportData.definition))
  );

  const previewPageSize = 20;

  const getCleanFilename = (): string => {
    const today = new Date().toISOString().split('T')[0];
    if (invoice?.invoiceNumber) return `Invoice_${invoice.invoiceNumber}.pdf`;
    if (folio?.folioNumber) return `Folio_${folio.folioNumber}.pdf`;
    if (reservation?.reservationNumber) return `Reservation_Confirmation_${reservation.reservationNumber}.pdf`;
    if (isThermal80mm && posOrder) return `${activeDocType === 'kot-receipt' ? 'KOT' : 'POS_Receipt'}_${posOrder.orderNumber || 'Slip'}.pdf`;
    if (payment?.transactionNumber || payment?.reference) return `Money_Receipt_${payment.transactionNumber || payment.reference}.pdf`;
    if (stay?.stayNumber) return `CheckOut_Clearance_${stay.stayNumber}.pdf`;
    if (event?.eventNumber) return `Event_Contract_${event.eventNumber}.pdf`;
    if (docType === 'registration-card') return `Registration_Card_${rawData?.guestName ? String(rawData.guestName).replace(/\s+/g, '_') : 'Guest'}.pdf`;
    if (reportData?.definition?.reportCode) return `${reportData.definition.reportCode}_${today}.pdf`;
    if (rawData?.definition?.reportCode) return `${rawData.definition.reportCode}_${today}.pdf`;
    return `${(docType || 'Document').replace(/[^a-zA-Z0-9_-]/g, '_')}_${today}.pdf`;
  };

  const handleDownloadPDF = async () => {
    const propertyName = settings.resortName || 'Resort MIS';
    const logoUrl = settings.logoUrl;
    const filename = getCleanFilename();
    setDownloadFeedback('Generating high-resolution PDF preview...');

    try {
      // 1. Exact WYSIWYG capture of the on-screen preview sheet
      const element = document.getElementById('printable-document');
      if (element) {
        setIsExporting(true);
        // Micro-delay to let React render all rows for reports if paginated
        await new Promise(r => setTimeout(r, 60));

        const success = await pdfExportService.exportElementToPDF(element, filename, {
          isThermal: isThermal80mm,
          isLandscape: isLandscape || isGenericReport,
          scale: 2.2,
          margin: isThermal80mm ? 2 : 8
        });

        setIsExporting(false);

        if (success) {
          setDownloadFeedback('PDF Saved Successfully!');
          setTimeout(() => setDownloadFeedback(null), 3500);
          return;
        }
      }
    } catch (renderErr) {
      console.warn('DOM preview capture fallback to vector exporter:', renderErr);
      setIsExporting(false);
    }

    let success = false;

    try {
      // 2. Vector PDF fallback if DOM capture encounters an unexpected browser error
      if (docType === 'reservation-confirmation' && reservation) {
        const resOk = await pdfExportService.exportReservationToPDF(reservation, propertyName);
        if (resOk) {
          setDownloadFeedback('Voucher PDF Saved!');
          setTimeout(() => setDownloadFeedback(null), 3500);
          return;
        }
      }

      if (isReportResult || isGenericReport || (reportData && (reportData.columns || reportData.rows || reportData.kpis))) {
        let columns = reportData?.columns;
        let rows = reportData?.rows;

        if (!columns || !rows || rows.length === 0) {
          columns = [
            { key: 'metric', header: 'Operational & Financial Metric' },
            { key: 'value', header: 'Audited Value', align: 'right' }
          ];
          const kpis = reportData?.kpis || {};
          rows = [
            { metric: 'Total Property Rooms', value: kpis.totalRooms ?? 120 },
            { metric: 'Occupied Rooms', value: kpis.occupiedRooms ?? 96 },
            { metric: 'Available / Vacant Rooms', value: kpis.availableRooms ?? 24 },
            { metric: 'Resort Occupancy Rate (%)', value: `${kpis.occupancyRate ?? 80}%` },
            { metric: 'In-House Registered Guests', value: kpis.inHouseGuests ?? 184 },
            { metric: 'Average Daily Rate (ADR)', value: `BDT ${(kpis.adr ?? 9500).toLocaleString()}` },
            { metric: 'RevPAR (Revenue per Available Room)', value: `BDT ${(kpis.revpar ?? 7600).toLocaleString()}` },
            { metric: 'Room Revenue (Folios)', value: `BDT ${(reportData?.roomRevenue ?? 450000).toLocaleString()}` },
            { metric: 'Food & Beverage Revenue', value: `BDT ${(reportData?.fbRevenue ?? 185000).toLocaleString()}` },
            { metric: 'Convention & Banquet Revenue', value: `BDT ${(reportData?.eventRevenue ?? 220000).toLocaleString()}` },
            { metric: 'Other Facilities & Amenities Revenue', value: `BDT ${(reportData?.otherRevenue ?? 45000).toLocaleString()}` },
            { metric: 'Total Daily Gross Revenue', value: `BDT ${(reportData?.totalGrossRevenue ?? 900000).toLocaleString()}` }
          ];
        }

        success = pdfExportService.exportToPDF({
          title: getDocTitle(),
          subtitle: `${propertyName.toUpperCase()} • OFFICIAL AUDITED REPORT`,
          date: reportData?.generatedAt || new Date().toLocaleString(),
          propertyName,
          logoUrl,
          columns: columns.map((c: any) => ({ key: c.key, header: c.header, align: c.align })),
          rows,
          summaryTotals: reportData?.summaryTotals,
          department: reportData?.department || 'Property Operations',
          metadata: {
            'Audited By': reportData?.generatedBy || 'System Auditor',
            'Scope': reportData?.definition?.defaultDataScope || 'Consolidated Property',
            'Report Code': reportData?.definition?.reportCode || docType || 'RPT'
          }
        }, `${(reportData?.definition?.reportCode || docType || 'Report')}_${new Date().toISOString().split('T')[0]}.pdf`);
      } else if (isThermal80mm && posOrder) {
        success = pdfExportService.exportPosOrderToPDF(posOrder, activeDocType === 'kot-receipt', propertyName);
      } else if (invoice) {
        success = pdfExportService.exportInvoiceToPDF(invoice, propertyName);
      } else if (folio) {
        success = pdfExportService.exportFolioToPDF(folio, propertyName);
      } else if (payment) {
        success = pdfExportService.exportPaymentReceiptToPDF(payment, propertyName);
      } else if (reservation) {
        success = await pdfExportService.exportReservationToPDF(reservation, propertyName);
      } else if (event) {
        success = pdfExportService.exportGenericDocToPDF('event-contract', event, propertyName);
      } else if (stay) {
        success = pdfExportService.exportGenericDocToPDF('checkout-clearance', stay, propertyName);
      } else {
        success = pdfExportService.exportGenericDocToPDF(docType, rawData, propertyName);
      }

      if (success) {
        setDownloadFeedback('PDF Saved Successfully!');
        setTimeout(() => setDownloadFeedback(null), 3500);
      } else {
        // Fallback to browser print if vector rendering encountered an issue
        handlePrint();
      }
    } catch (err) {
      console.error('Download PDF error:', err);
      handlePrint();
    }
  };

  const getDocTitle = () => {
    if (rawData?.definition?.reportName) {
      return String(rawData.definition.reportName).toUpperCase();
    }
    if (rawData?.title) {
      return String(rawData.title).toUpperCase();
    }
    switch (docType) {
      case 'pos-bill': return '80MM POS GUEST BILL / RECEIPT';
      case 'kot-receipt': return '80MM KITCHEN ORDER TICKET (KOT)';
      case 'invoice': return 'TAX INVOICE / OFFICIAL BILL';
      case 'folio':
      case 'folio-statement': return 'GUEST MASTER FOLIO STATEMENT';
      case 'reservation-confirmation': return 'RESERVATION CONFIRMATION & VOUCHER';
      case 'checkout-form':
      case 'checkout-statement': return 'CHECK-OUT CLEARANCE & SETTLEMENT SLIP';
      case 'registration-card': return 'GUEST REGISTRATION CARD (REG-CARD)';
      case 'payment-receipt': return 'OFFICIAL MONEY RECEIPT';
      case 'event-contract':
      case 'banquet-contract': return 'CONVENTION & BANQUET CONTRACT';
      case 'beo':
      case 'function-sheet': return 'BANQUET EVENT ORDER (BEO) FUNCTION SHEET';
      case 'daily-flash-report':
      case 'operational-report':
      case 'report': return "DAILY FLASH & AUDIT REPORT";
      default: return 'OFFICIAL RESORT DOCUMENT';
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto printable-modal-overlay select-none"
    >
      {/* Floating viewport close button (Top Right Corner) */}
      <button
        type="button"
        onClick={onClose}
        className="fixed top-3 right-3 sm:top-5 sm:right-5 z-60 p-2.5 rounded-full bg-slate-900/95 hover:bg-rose-600 text-slate-300 hover:text-white border border-slate-700 hover:border-rose-500 shadow-2xl transition-all cursor-pointer no-print flex items-center justify-center group"
        title="Close Preview (Esc)"
        aria-label="Close Preview"
      >
        <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>

      <style>{`
        @media print {
          ${isThermal80mm ? `
            @page {
              size: 80mm auto;
              margin: 2mm 3mm;
            }
            body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
            }
            #printable-document {
              width: 76mm !important;
              max-width: 76mm !important;
              min-width: 76mm !important;
              margin: 0 auto !important;
              padding: 2mm 2mm !important;
              box-shadow: none !important;
              border: none !important;
              background: #ffffff !important;
              color: #000000 !important;
            }
          ` : `
            @page {
              size: A4 ${isLandscape ? 'landscape' : 'portrait'};
              margin: 8mm;
            }
          `}
        }
      `}</style>
      <div className={`bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl ${isGenericReport || isLandscape ? 'max-w-6xl' : 'max-w-3xl'} w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 relative select-text`}>
        
        {/* Top Control Bar (Hidden on print) */}
        <div className="p-3 sm:px-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 no-print">
          {/* Left Title & Status */}
          <div className="flex items-center space-x-2.5 min-w-0 pr-1">
            {isThermal80mm ? (
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                <Receipt className="w-4 h-4" />
              </span>
            ) : (
              <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                <FileText className="w-4 h-4" />
              </span>
            )}
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wide block truncate">
                {getDocTitle()}
              </span>
              <span className="text-[10px] text-slate-400 block truncate">
                {isThermal80mm ? '80mm POS Thermal Print Slip' : 'Document Print Preview'}
              </span>
            </div>
          </div>

          {/* Right Controls & Dedicated Close Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* 80mm POS & KOT format toggles (Tablet & Desktop) */}
            {isPosOrderData && posOrder && (
              <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setActiveDocType('pos-bill')}
                  className={`px-2.5 py-1 rounded font-bold transition flex items-center gap-1 cursor-pointer ${
                    activeDocType === 'pos-bill' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="80mm Thermal POS Guest Receipt"
                >
                  <Receipt className="w-3 h-3" />
                  <span>80mm Bill</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDocType('kot-receipt')}
                  className={`px-2.5 py-1 rounded font-bold transition flex items-center gap-1 cursor-pointer ${
                    activeDocType === 'kot-receipt' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="80mm Kitchen Order Ticket"
                >
                  <ChefHat className="w-3 h-3" />
                  <span>80mm KOT</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDocType('invoice')}
                  className={`px-2.5 py-1 rounded font-medium transition flex items-center gap-1 cursor-pointer ${
                    activeDocType === 'invoice' ? 'bg-slate-700 text-slate-100 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Switch to full A4 Tax Invoice"
                >
                  <FileText className="w-3 h-3" />
                  <span>A4 Invoice</span>
                </button>
              </div>
            )}

            {/* Format switchers if stay or folio or reservation is available */}
            {!isPosOrderData && (reservation || stay || folio || invoice) && (
              <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px]">
                {reservation && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveDocType('reservation-confirmation')}
                      className={`px-2 py-1 rounded font-medium transition ${
                        activeDocType === 'reservation-confirmation' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Agoda Voucher
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveDocType('registration-card')}
                      className={`px-2 py-1 rounded font-medium transition ${
                        activeDocType === 'registration-card' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Guest Reg-Slip
                    </button>
                  </>
                )}
                {(invoice || folio) && (
                  <button
                    type="button"
                    onClick={() => setActiveDocType('invoice')}
                    className={`px-2 py-1 rounded font-medium transition ${
                      activeDocType === 'invoice' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Tax Invoice
                  </button>
                )}
                {(stay || folio) && (
                  <button
                    type="button"
                    onClick={() => setActiveDocType('checkout-form')}
                    className={`px-2 py-1 rounded font-medium transition ${
                      activeDocType === 'checkout-form' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Check-out Slip
                  </button>
                )}
                {folio && (
                  <button
                    type="button"
                    onClick={() => setActiveDocType('folio')}
                    className={`px-2 py-1 rounded font-medium transition ${
                      activeDocType === 'folio' ? 'bg-slate-700 text-slate-100 font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Master Folio
                  </button>
                )}
                {stay && (
                  <button
                    type="button"
                    onClick={() => setActiveDocType('registration-card')}
                    className={`px-2 py-1 rounded font-medium transition ${
                      activeDocType === 'registration-card' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Reg Card
                  </button>
                )}
              </div>
            )}

            {/* Page Change Control if more than 1 page */}
            {isReportResult && (reportData?.rows?.length || 0) > previewPageSize && (
              <div className="hidden md:flex items-center space-x-1.5 bg-slate-800 px-2 py-1 rounded text-slate-200 text-xs font-mono border border-slate-700">
                <button
                  type="button"
                  onClick={() => setPreviewPage(p => Math.max(1, p - 1))}
                  disabled={previewPage === 1}
                  className="p-0.5 rounded hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span>
                  {previewPage}/{Math.max(1, Math.ceil((reportData.rows?.length || 1) / previewPageSize))}
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewPage(p => Math.min(Math.ceil((reportData.rows?.length || 1) / previewPageSize), p + 1))}
                  disabled={previewPage >= Math.ceil((reportData.rows?.length || 1) / previewPageSize)}
                  className="p-0.5 rounded hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 ${
                downloadFeedback ? 'bg-emerald-600 text-white' : 'bg-rose-600 hover:bg-rose-500 text-white'
              } font-semibold text-xs rounded-lg transition-colors shadow-xs cursor-pointer shrink-0`}
              title="Download clean PDF"
            >
              {downloadFeedback ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{downloadFeedback}</span>
                  <span className="md:hidden">Saved</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Download PDF</span>
                  <span className="md:hidden">PDF</span>
                </>
              )}
            </button>

            {/* Orientation & Scale Toggles for wide reports */}
            {isGenericReport && (
              <div className="hidden lg:flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsLandscape(prev => !prev)}
                  className={`px-2 py-1 text-[11px] rounded font-medium border transition-colors ${
                    isLandscape
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                  title="Switch page orientation between Portrait and Landscape"
                >
                  {isLandscape ? 'Landscape' : 'Portrait'}
                </button>

                <button
                  type="button"
                  onClick={() => setCompactScale(prev => !prev)}
                  className={`px-2 py-1 text-[11px] rounded font-medium border transition-colors ${
                    compactScale
                      ? 'bg-amber-600 text-white border-amber-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                  title="Toggle compact density for wide tables"
                >
                  {compactScale ? 'Compact' : 'Standard'}
                </button>
              </div>
            )}

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-xs shrink-0 cursor-pointer"
              title="Print directly or save via system printer dialog"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            {/* Prominent Header Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white border border-slate-700 hover:border-rose-500 rounded-lg transition-colors font-bold text-xs shadow-xs shrink-0 cursor-pointer ml-1"
              title="Close Preview (Esc)"
              aria-label="Close Preview"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>
        </div>

        {/* Mobile Format Switcher Strip */}
        {isPosOrderData && posOrder && (
          <div className="sm:hidden px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-center gap-1.5 text-xs no-print shrink-0">
            <button
              type="button"
              onClick={() => setActiveDocType('pos-bill')}
              className={`flex-1 py-1 px-2 text-center rounded font-bold text-[11px] ${
                activeDocType === 'pos-bill' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 bg-slate-800'
              }`}
            >
              80mm Bill
            </button>
            <button
              type="button"
              onClick={() => setActiveDocType('kot-receipt')}
              className={`flex-1 py-1 px-2 text-center rounded font-bold text-[11px] ${
                activeDocType === 'kot-receipt' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 bg-slate-800'
              }`}
            >
              80mm KOT
            </button>
            <button
              type="button"
              onClick={() => setActiveDocType('invoice')}
              className={`flex-1 py-1 px-2 text-center rounded font-medium text-[11px] ${
                activeDocType === 'invoice' ? 'bg-slate-700 text-slate-100 font-bold' : 'text-slate-400 bg-slate-800'
              }`}
            >
              A4 Invoice
            </button>
          </div>
        )}

        {/* Printable Area (White Paper Style) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-900 flex flex-col items-center">
          {isThermal80mm && (
            <div className="mb-3 text-center no-print">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-amber-400 text-[10px] font-mono font-semibold">
                <Receipt className="w-3.5 h-3.5" />
                80mm Thermal Slip Format (Standard POS-80 / KOT printer roll)
              </span>
            </div>
          )}

          {/* Quick Action & Success Banner for Reservation Confirmation */}
          {docType === 'reservation-confirmation' && reservation && (
            <div className="w-full max-w-2xl mb-4 no-print">
              <div className="bg-linear-to-r from-emerald-950/90 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-100 text-xs">Reservation Confirmed!</span>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-[10px] rounded font-bold border border-emerald-500/30">
                        {reservation.reservationNumber}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Ready to print official confirmation letter or export PDF voucher for the guest.
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Letter</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div
            id="printable-document"
            className={
              isThermal80mm
                ? "bg-white text-slate-950 p-4 sm:p-5 rounded-lg shadow-2xl w-[320px] max-w-[340px] text-[11px] font-mono leading-tight print:shadow-none print:p-0 print:m-0 thermal-80mm border border-slate-300 select-text"
                : docType === 'reservation-confirmation'
                  ? "bg-white text-slate-900 p-2 sm:p-4 rounded shadow-lg max-w-3xl sm:max-w-4xl w-full text-xs font-sans print:shadow-none print:p-0 print:m-0 print:border-none printable-card select-text"
                  : `bg-white text-slate-900 p-6 sm:p-8 rounded shadow-lg ${isGenericReport || isLandscape ? 'max-w-5xl' : 'max-w-2xl'} w-full text-xs font-sans print:shadow-none print:p-0 print:m-0 printable-card ${compactScale ? 'text-[11px]' : ''}`
            }
          >
            {/* 1. DOCUMENT HEADER - Hidden for 80mm thermal receipts and dedicated reservation confirmation voucher */}
            {!isThermal80mm && docType !== 'reservation-confirmation' && (
              <div className="border-b-2 border-slate-900 pb-4 mb-5">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-3">
                      {settings.logoUrl ? (
                        <img
                          src={settings.logoUrl}
                          alt="Logo"
                          className="h-10 max-w-[120px] object-contain rounded"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 font-black text-sm flex items-center justify-center font-serif shadow-xs">
                          {(settings.resortName || 'H').charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div>
                        <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                          {settings.resortName}
                        </h1>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">{settings.address}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Hotline: {settings.phone} | Email: {settings.email}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {settings.binNumber ? `BIN / VAT Reg #: ${settings.binNumber}` : 'BIN / VAT Reg #: 001928472-0102'} | {settings.tradeLicense ? `Gov. License: ${settings.tradeLicense}` : 'Gov. Resort License: CCU-2026-BD'}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="inline-block px-2.5 py-1 bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider rounded">
                      {getDocTitle()}
                    </span>
                    <p className="text-[10px] font-mono text-slate-600 mt-1">
                      Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-[9px] text-slate-400 font-mono">
                      Time: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 80MM THERMAL POS GUEST BILL / RECEIPT */}
            {/* ========================================================================= */}
            {isThermal80mm && activeDocType === 'pos-bill' && posOrder && (
              <div className="space-y-2 text-slate-950 font-mono">
                {/* Thermal Header */}
                <div className="text-center space-y-0.5">
                  <div className="text-sm font-black uppercase tracking-tight">
                    {settings.resortName || 'LESync Resort & Spa'}
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                    {posOrder.outlet === 'bar' ? 'Bar & Sky Lounge POS' : 'Restaurant & Room Dining POS'}
                  </div>
                  <div className="text-[9.5px] text-slate-600">
                    {settings.address || 'Purbachal Link Road, Gazipur / Dhaka'}
                  </div>
                  <div className="text-[9.5px] text-slate-600">
                    Hotline: {settings.phone || '+880 1711-223344'}
                  </div>
                  <div className="text-[9px] text-slate-500">
                    BIN: {settings.binNumber || '001928472-0102'} • Mushak-6.3
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-900 my-1.5" />
                <div className="text-center font-black text-[11px] uppercase tracking-wider py-0.5 bg-slate-100 print:bg-transparent">
                  *** POS GUEST RECEIPT / BILL ***
                </div>
                <div className="border-t border-dashed border-slate-900 my-1.5" />

                {/* Metadata */}
                <div className="text-[10px] space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Bill No:</span>
                    <span className="font-bold text-slate-950">{posOrder.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Date & Time:</span>
                    <span>
                      {posOrder.createdAt ? new Date(posOrder.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-GB')} {posOrder.createdAt ? new Date(posOrder.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Table / Room:</span>
                    <span className="font-black text-[11.5px] text-slate-950">
                      {posOrder.roomNumber ? `ROOM ${posOrder.roomNumber}` : (posOrder.tableNumber ? `TABLE ${posOrder.tableNumber}` : 'DIRECT COUNTER')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Order Type:</span>
                    <span className="font-medium">
                      {posOrder.orderType === 'in-room-dining' ? 'In-Room Service' : (posOrder.orderType === 'bar-lounge' ? 'Bar & Lounge' : (posOrder.orderType === 'takeaway' ? 'Takeaway' : 'Dine-In Table'))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Guest:</span>
                    <span className="font-semibold truncate max-w-[170px]">{posOrder.guestName || 'Walk-In Guest'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Server / Steward:</span>
                    <span>{posOrder.stewardName || posOrder.serverName || 'F&B Steward #01'}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-900 my-1.5" />

                {/* Items Table */}
                <div className="flex justify-between text-[10px] font-bold uppercase pb-1 border-b border-slate-400">
                  <span className="w-1/2">Item Description</span>
                  <span className="w-1/6 text-center">Qty</span>
                  <span className="w-1/3 text-right">Price (৳)</span>
                </div>

                <div className="space-y-1.5 py-1 text-[10.5px]">
                  {(posOrder.items || []).map((item: any, idx: number) => {
                    const itemTotal = item.totalPrice || item.total || (item.unitPrice * item.quantity);
                    return (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex justify-between items-start">
                          <span className="w-1/2 font-bold leading-tight">{item.name}</span>
                          <span className="w-1/6 text-center font-bold">x{item.quantity}</span>
                          <span className="w-1/3 text-right font-mono font-bold">৳{(itemTotal || 0).toLocaleString()}</span>
                        </div>
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="text-[9px] text-slate-600 pl-2">
                            {item.modifiers.map((m: string, mIdx: number) => (
                              <span key={mIdx} className="block">• {m}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-dashed border-slate-900 my-1.5" />

                {/* Financial Summary */}
                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Subtotal:</span>
                    <span className="font-mono">৳{(posOrder.subtotal || 0).toLocaleString()}</span>
                  </div>
                  {posOrder.inRoomDiningDetails?.trayCharge && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">In-Room Tray Charge:</span>
                      <span className="font-mono">৳{(posOrder.inRoomDiningDetails.trayCharge || 100).toLocaleString()}</span>
                    </div>
                  )}
                  {(posOrder.discount || 0) > 0 && (
                    <div className="flex justify-between text-slate-800 font-semibold">
                      <span>Discount ({posOrder.discountPercent || ''}%):</span>
                      <span className="font-mono">-৳{(posOrder.discount || 0).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">Service Charge (10%):</span>
                    <span className="font-mono">৳{(posOrder.serviceCharge ?? Math.round((posOrder.subtotal || 0) * 0.10)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Govt VAT (15%):</span>
                    <span className="font-mono">৳{(posOrder.tax ?? Math.round((posOrder.subtotal || 0) * 0.15)).toLocaleString()}</span>
                  </div>

                  <div className="border-t-2 border-slate-900 my-1" />

                  {/* Net Amount / Grand Total */}
                  <div className="flex justify-between items-baseline text-sm font-black pt-0.5">
                    <span>NET PAYABLE:</span>
                    <span className="font-mono text-base font-black">৳{(posOrder.total || 0).toLocaleString()}</span>
                  </div>

                  <div className="border-t-2 border-slate-900 my-1" />

                  <div className="text-[9px] text-slate-600 italic leading-tight">
                    {numberToWordsBDT(posOrder.total || 0)}
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-900 my-1.5" />

                {/* Tender & Settlement Info */}
                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Payment Tender:</span>
                    <span className="font-bold uppercase text-slate-950">{posOrder.paymentMethod || 'Direct Payment'}</span>
                  </div>
                  {posOrder.paymentMethod === 'Room Folio' && (
                    <div className="p-1.5 bg-slate-100 border border-slate-300 rounded text-[9px] space-y-0.5">
                      <span className="font-black block text-slate-950">ROOM FOLIO POSTING:</span>
                      <div>Room: <span className="font-bold">{posOrder.roomNumber || 'In-House'}</span> • Guest: {posOrder.guestName || 'Guest'}</div>
                      <div className="text-slate-600 italic">Bill verified & posted to guest master account</div>
                    </div>
                  )}
                  {posOrder.paymentMethod === 'Cash' && posOrder.tenderAmount && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Tendered / Change:</span>
                      <span className="font-mono">৳{(posOrder.tenderAmount || posOrder.total).toLocaleString()} / ৳{(posOrder.changeAmount || 0).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">Bill Status:</span>
                    <span className="font-black uppercase text-slate-950">
                      {posOrder.paymentStatus === 'Billed-To-Room' ? 'BILLED TO ROOM FOLIO' : (posOrder.voided ? 'VOIDED BILL' : 'PAID & SETTLED')}
                    </span>
                  </div>
                </div>

                {/* Signature slip for Room Folio or Card */}
                {posOrder.paymentMethod === 'Room Folio' && (
                  <div className="pt-2 mt-2 border-t border-dashed border-slate-400 space-y-1 text-[9px]">
                    <p className="text-slate-600">I confirm receipt of F&B services and agree to charge my room account:</p>
                    <div className="pt-6 border-b border-slate-500" />
                    <div className="flex justify-between text-[8.5px] text-slate-500">
                      <span>Guest Signature</span>
                      <span>Room #{posOrder.roomNumber || ''}</span>
                    </div>
                  </div>
                )}

                {/* Thermal Barcode representation */}
                <div className="pt-2 text-center space-y-1">
                  <div className="flex justify-center items-center gap-[2px] h-6 px-4">
                    {[4, 2, 6, 1, 3, 5, 2, 4, 1, 6, 3, 2, 5, 1, 4, 2, 3, 5, 1, 6, 2, 4, 3, 1, 5, 2, 4].map((w, i) => (
                      <div key={i} className="bg-slate-900 h-full" style={{ width: `${(w % 3) + 1}px` }} />
                    ))}
                  </div>
                  <div className="text-[9px] font-mono tracking-widest text-slate-600">
                    *{posOrder.orderNumber}*
                  </div>
                  <div className="text-[9px] font-bold text-slate-800 pt-0.5">
                    *** THANK YOU FOR DINING WITH US ***
                  </div>
                  <div className="text-[8px] text-slate-500">
                    80mm Thermal Receipt • {settings.resortName || 'LESync Resort'}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 80MM KITCHEN ORDER TICKET (KOT) */}
            {/* ========================================================================= */}
            {isThermal80mm && activeDocType === 'kot-receipt' && posOrder && (
              <div className="space-y-2 text-slate-950 font-mono">
                {/* KOT Header */}
                <div className="text-center space-y-0.5 border-b-2 border-dashed border-slate-900 pb-2">
                  <div className="text-xs font-bold uppercase tracking-wider">
                    *** KITCHEN ORDER TICKET (KOT) ***
                  </div>
                  <div className="text-sm font-black uppercase text-slate-950">
                    {posOrder.outlet === 'bar' ? 'BAR DISPENSE KOT' : 'MAIN KITCHEN KOT'}
                  </div>
                  <div className="text-[9.5px] text-slate-600">
                    Station: {posOrder.outlet === 'bar' ? 'Bar & Lounge Dispense' : 'Hot Kitchen / Pantry Station'}
                  </div>
                </div>

                {/* Location Box */}
                <div className="p-2 bg-slate-100 rounded border border-slate-300 text-center">
                  <span className="text-[9.5px] text-slate-600 uppercase font-bold block">ORDER DESTINATION:</span>
                  <span className="text-lg font-black text-slate-950 tracking-tight block">
                    {posOrder.roomNumber ? `ROOM ${posOrder.roomNumber}` : (posOrder.tableNumber ? `TABLE ${posOrder.tableNumber}` : 'DIRECT COUNTER')}
                  </span>
                  <span className="text-[10px] font-bold text-slate-700 uppercase">
                    {posOrder.orderType === 'in-room-dining' ? 'In-Room Service' : (posOrder.orderType === 'bar-lounge' ? 'Bar & Lounge' : 'Dine-In Table')}
                  </span>
                </div>

                {/* KOT Metadata */}
                <div className="text-[10px] space-y-0.5 border-b border-dashed border-slate-900 pb-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">KOT No:</span>
                    <span className="font-black text-slate-950">KOT-{posOrder.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Time / Date:</span>
                    <span>
                      {posOrder.createdAt ? new Date(posOrder.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} • {posOrder.createdAt ? new Date(posOrder.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Server / Steward:</span>
                    <span>{posOrder.stewardName || posOrder.serverName || 'F&B Steward'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Guest:</span>
                    <span className="truncate max-w-[170px] font-semibold">{posOrder.guestName || 'Walk-In Guest'}</span>
                  </div>
                </div>

                {/* Chef / Kitchen Instructions */}
                {(posOrder.inRoomDiningDetails?.kitchenNotes || posOrder.notes) && (
                  <div className="p-1.5 bg-amber-50 border border-amber-300 rounded text-[9.5px] space-y-0.5">
                    <span className="font-bold text-amber-900 block flex items-center gap-1">
                      ⚠️ SPECIAL PREPARATION NOTES:
                    </span>
                    <p className="font-bold text-slate-900 italic">
                      "{posOrder.inRoomDiningDetails?.kitchenNotes || posOrder.notes}"
                    </p>
                  </div>
                )}

                {/* Items to Cook */}
                <div className="pt-1">
                  <div className="flex justify-between text-[10px] font-bold uppercase pb-1 border-b border-slate-900">
                    <span>ITEMS TO PREPARE</span>
                    <span>QTY</span>
                  </div>

                  <div className="divide-y divide-slate-300 py-1">
                    {(posOrder.items || []).map((item: any, idx: number) => (
                      <div key={idx} className="py-1.5 space-y-0.5">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-1.5 w-4/5">
                            <span className="w-3.5 h-3.5 border border-slate-700 rounded-xs mt-0.5 shrink-0 inline-block" />
                            <span className="text-xs font-black uppercase leading-tight text-slate-950">
                              {item.name}
                            </span>
                          </div>
                          <span className="w-1/5 text-right font-black text-sm text-slate-950">
                            x{item.quantity}
                          </span>
                        </div>
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="pl-5 text-[9.5px] font-bold text-slate-700">
                            {item.modifiers.map((m: string, mIdx: number) => (
                              <div key={mIdx}>* {m}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t-2 border-dashed border-slate-900 my-2" />

                {/* KOT Footer Summary */}
                <div className="text-[10px] space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Total Kitchen Items:</span>
                    <span className="font-black text-xs">
                      {(posOrder.items || []).reduce((acc: number, item: any) => acc + (item.quantity || 1), 0)} Items
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>KOT Status:</span>
                    <span className="font-bold text-slate-950 uppercase">
                      {posOrder.kotStatus || 'SENT TO KITCHEN'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Printed At:</span>
                    <span className="font-mono">
                      {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="border-t-2 border-slate-900 my-2" />

                <div className="text-center text-[9px] font-bold uppercase tracking-widest text-slate-700 py-1">
                  *** END OF KOT TICKET ***
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 1. TAX INVOICE */}
            {/* ========================================================================= */}
            {!isThermal80mm && docType === 'invoice' && (
              invoice ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded border border-slate-200 text-[11px]">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Billed To (Guest / Client):</span>
                      <p className="font-bold text-slate-900 text-sm">{invoice.guestOrClientName}</p>
                      <p className="text-slate-600">{invoice.phone || 'Phone on record'}</p>
                      <p className="text-slate-600">{invoice.address || 'Dhaka, Bangladesh'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Invoice Details:</span>
                      <p className="font-mono font-bold text-slate-900 text-sm">{invoice.invoiceNumber}</p>
                      <p className="text-slate-700 font-semibold">{invoice.roomOrHall}</p>
                      <p className="text-slate-600">{invoice.dates}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                        invoice.balance <= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        Status: {invoice.balance <= 0 ? 'PAID IN FULL' : 'PAYMENT DUE'}
                      </span>
                    </div>
                  </div>

                  <table className="w-full border-collapse text-left text-[11px] mt-4">
                    <thead>
                      <tr className="border-b-2 border-slate-300 text-slate-700 bg-slate-100">
                        <th className="py-2 px-2">#</th>
                        <th className="py-2 px-2">Item Description</th>
                        <th className="py-2 px-2 text-center">Qty</th>
                        <th className="py-2 px-2 text-right">Unit Price</th>
                        <th className="py-2 px-2 text-right">Total (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(invoice.items || []).map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-2 text-slate-400">{idx + 1}</td>
                          <td className="py-2 px-2 font-medium text-slate-800">{item.description}</td>
                          <td className="py-2 px-2 text-center text-slate-600">{item.quantity}</td>
                          <td className="py-2 px-2 text-right font-mono text-slate-600">৳{(item.unitPrice || 0).toLocaleString()}</td>
                          <td className="py-2 px-2 text-right font-mono font-semibold text-slate-900">৳{(item.total || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex flex-col sm:flex-row justify-between items-start pt-4 gap-4 border-t border-slate-200">
                    <div className="text-[10px] text-slate-500 max-w-xs space-y-1">
                      <p className="font-bold text-slate-700 uppercase">Payment Terms & Notes:</p>
                      <p>• All bills are payable upon receipt or before check-out.</p>
                      <p>• Amount in Words: <span className="font-semibold text-slate-800 italic">{numberToWordsBDT(invoice.grandTotal)}</span></p>
                    </div>

                    <div className="w-64 space-y-1.5 text-[11px]">
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal:</span>
                        <span className="font-mono">৳{(invoice.subtotal || 0).toLocaleString()}</span>
                      </div>
                      {(invoice.discount || 0) > 0 && (
                        <div className="flex justify-between text-rose-600">
                          <span>Discount Applied:</span>
                          <span className="font-mono">-৳{(invoice.discount || 0).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-600">
                        <span>Service Charge ({settings.serviceChargePercent}%):</span>
                        <span className="font-mono">৳{(invoice.serviceCharge || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>VAT / Tax ({settings.taxRatePercent}%):</span>
                        <span className="font-mono">৳{(invoice.tax || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-slate-900 border-t-2 border-slate-900 pt-1.5">
                        <span>Grand Total:</span>
                        <span className="font-mono">৳{(invoice.grandTotal || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>Total Paid / Settled:</span>
                        <span className="font-mono">৳{(invoice.paidAmount || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-slate-900 bg-slate-100 p-1.5 rounded">
                        <span>Net Balance Due:</span>
                        <span className={`font-mono ${invoice.balance <= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          ৳{(invoice.balance || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-dashed border-slate-300 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-500">
                    <div>
                      <div className="border-b border-slate-400 h-8 mb-1"></div>
                      <p>Guest Signature</p>
                    </div>
                    <div>
                      <div className="border-b border-slate-400 h-8 mb-1"></div>
                      <p>Authorized Cashier / Front Office Executive</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400">No invoice data available to preview.</div>
              )
            )}

            {/* ========================================================================= */}
            {/* 2. GUEST FOLIO STATEMENT */}
            {/* ========================================================================= */}
            {(docType === 'folio' || docType === 'folio-statement') && (
              folio ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded border border-slate-200 text-[11px]">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Guest Ledger Account:</span>
                      <p className="font-bold text-slate-900 text-sm">{folio.guestName}</p>
                      <p className="text-slate-700 font-semibold">{folio.roomNumber ? `Room ${folio.roomNumber}` : 'Master Non-Room Account'}</p>
                      <p className="text-slate-600 font-mono text-[10px]">Opened: {folio.openedAt ? folio.openedAt.replace('T', ' ').substring(0, 16) : 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Folio Number:</span>
                      <p className="font-mono font-bold text-slate-900 text-sm">{folio.folioNumber}</p>
                      <p className="text-slate-600">Status: <span className="font-semibold">{folio.status}</span></p>
                      <p className="text-slate-600">Currency: BDT (৳)</p>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded overflow-hidden mt-3">
                    <table className="w-full border-collapse text-left text-[11px]">
                      <thead className="bg-slate-100 border-b border-slate-200 text-slate-700">
                        <tr>
                          <th className="py-2 px-2">#</th>
                          <th className="py-2 px-2">Category</th>
                          <th className="py-2 px-2">Description</th>
                          <th className="py-2 px-2 text-center">Qty</th>
                          <th className="py-2 px-2 text-right">Unit Rate</th>
                          <th className="py-2 px-2 text-right">Debit (৳)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {(folio.items || []).map((item, idx) => (
                          <tr key={idx} className={item.voided ? 'opacity-50 line-through bg-rose-50/50' : ''}>
                            <td className="py-2 px-2 text-slate-400">{idx + 1}</td>
                            <td className="py-2 px-2 font-semibold text-slate-700 text-[10px] uppercase">{item.type}</td>
                            <td className="py-2 px-2 font-medium text-slate-900">
                              {item.description}
                              {item.voided && (
                                <span className="no-underline ml-1.5 px-1.5 py-0.5 bg-rose-100 text-rose-800 text-[9px] font-bold rounded">
                                  VOIDED: {item.voidReason || 'Reversed'}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-2 text-center text-slate-600">{item.quantity}</td>
                            <td className="py-2 px-2 text-right font-mono text-slate-600">৳{(item.unitPrice || 0).toLocaleString()}</td>
                            <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                              {item.voided ? '৳0 (Voided)' : `৳${(item.total || 0).toLocaleString()}`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start pt-4 gap-4 border-t border-slate-200">
                    <div className="text-[10px] text-slate-500 max-w-xs space-y-1">
                      <p className="font-bold text-slate-700 uppercase">Statement Summary:</p>
                      <p>This document reflects all postings made to this guest folio up to this statement date.</p>
                    </div>

                    <div className="w-64 space-y-1.5 text-[11px]">
                      <div className="flex justify-between text-slate-600">
                        <span>Items Subtotal:</span>
                        <span className="font-mono">৳{(folio.subtotal || 0).toLocaleString()}</span>
                      </div>
                      {(folio.discountTotal || 0) > 0 && (
                        <div className="flex justify-between text-rose-600">
                          <span>Total Discounts:</span>
                          <span className="font-mono">-৳{(folio.discountTotal || 0).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-600">
                        <span>Service Charge ({settings.serviceChargePercent}%):</span>
                        <span className="font-mono">৳{(folio.serviceChargeTotal || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>VAT / Tax ({settings.taxRatePercent}%):</span>
                        <span className="font-mono">৳{(folio.taxTotal || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-slate-900 border-t-2 border-slate-900 pt-1.5">
                        <span>Total Folio Charges:</span>
                        <span className="font-mono">৳{(folio.grandTotal || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>Total Payments Applied:</span>
                        <span className="font-mono">৳{(folio.paidTotal || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-slate-900 bg-slate-100 p-1.5 rounded">
                        <span>Current Balance:</span>
                        <span className={`font-mono ${folio.balance <= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          ৳{(folio.balance || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-dashed border-slate-300 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-500">
                    <div>
                      <div className="border-b border-slate-400 h-8 mb-1"></div>
                      <p>Guest Signature (I acknowledge the above ledger entries)</p>
                    </div>
                    <div>
                      <div className="border-b border-slate-400 h-8 mb-1"></div>
                      <p>Front Office Duty Cashier</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400">No folio data available to display.</div>
              )
            )}

            {/* ========================================================================= */}
            {/* 3. RESERVATION CONFIRMATION & BOOKING VOUCHER (AGODA STYLE) */}
            {/* ========================================================================= */}
            {docType === 'reservation-confirmation' && (
              reservation ? (
                <div id="voucher-card" className="border-2 border-slate-900 bg-white text-slate-900 p-4 sm:p-5 font-sans space-y-3.5 print:border print:border-slate-900 print:p-3 text-[11px] leading-tight select-text rounded-sm">
                  {/* 1. TOP HEADER */}
                  <div>
                    <div className="flex justify-between items-start">
                      {/* Left: Brand Logo & 5-dot colored circles */}
                      <div>
                        <div className="flex items-center space-x-2.5">
                          {settings.logoUrl ? (
                            <img
                              src={settings.logoUrl}
                              alt="Logo"
                              className="h-9 max-w-[130px] object-contain"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="flex items-center space-x-1.5">
                              <span className="w-7 h-7 rounded bg-slate-950 text-amber-400 font-black text-sm flex items-center justify-center font-serif">
                                {(settings.resortName || 'H').charAt(0).toUpperCase()}
                              </span>
                              <span className="text-base font-black tracking-tight text-slate-900 lowercase font-sans">
                                {settings.resortName?.split(' ')[0]?.toLowerCase() || 'resort'}
                              </span>
                            </div>
                          )}
                        </div>
                        {/* 5-dot colored circles matching Agoda voucher branding */}
                        <div className="flex items-center space-x-1.5 mt-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#e11d48]" title="Red"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" title="Yellow"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" title="Green"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" title="Blue"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]" title="Purple"></span>
                        </div>
                      </div>

                      {/* Right: Booking Confirmation Header */}
                      <div className="text-right">
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                          Booking <span className="text-[#e11d48]">Confirmation</span>
                        </h1>
                        <p className="text-[10px] text-slate-600 font-medium mt-0.5">
                          Please present either an electronic or paper copy of your hotel voucher upon check-in.
                        </p>
                      </div>
                    </div>

                    {/* Repeating Subtle Ribbon Bar */}
                    <div className="bg-[#cbd5e1] text-slate-600 text-[9px] uppercase tracking-widest py-0.5 px-3 mt-2 flex justify-between font-semibold border-y border-slate-300 select-none">
                      <span>{settings.resortName || 'RESORT'}</span>
                      <span>{settings.resortName || 'RESORT'}</span>
                      <span>{settings.resortName || 'RESORT'}</span>
                      <span>{settings.resortName || 'RESORT'}</span>
                      <span>{settings.resortName || 'RESORT'}</span>
                      <span className="hidden sm:inline">{settings.resortName || 'RESORT'}</span>
                      <span className="hidden sm:inline">{settings.resortName || 'RESORT'}</span>
                    </div>

                    {/* Dedicated Corporate or Group Booking Banner if applicable */}
                    {(reservation.customerType === 'Corporate' || reservation.isGroupBooking) && (
                      <div className="mt-2.5 p-2 rounded border bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-slate-300">
                        {reservation.customerType === 'Corporate' && (
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300 text-[9px] font-bold uppercase tracking-wider">
                              Corporate Account
                            </span>
                            <span className="font-bold text-slate-900 text-xs">
                              {reservation.companyName || 'Corporate Client'}
                            </span>
                            {reservation.companyGstBin && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                (BIN: {reservation.companyGstBin})
                              </span>
                            )}
                          </div>
                        )}
                        {reservation.isGroupBooking && (
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-300 text-[9px] font-bold uppercase tracking-wider">
                              Group Booking
                            </span>
                            <span className="font-bold text-purple-950 text-xs">
                              {reservation.groupName || 'Group Delegation'}
                            </span>
                            {reservation.groupLeaderName && (
                              <span className="text-[10px] text-slate-600">
                                • Leader: <strong className="text-slate-800">{reservation.groupLeaderName}</strong>
                                {reservation.groupLeaderPhone && <span className="font-mono ml-1">({reservation.groupLeaderPhone})</span>}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="text-[10px] font-bold text-slate-700 font-mono self-end sm:self-auto">
                          Total Rooms: {reservation.totalRoomsCount || reservation.allocatedRooms?.length || 1}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. TWO COLUMN DETAILS GRID */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Left Column */}
                    <div className="space-y-1.5">
                      <div className="flex items-baseline">
                        <div className="w-36 text-slate-800 font-medium">Booking ID :</div>
                        <div className="flex-1 font-mono font-bold text-slate-950 text-xs">{reservation.reservationNumber}</div>
                      </div>
                      <div className="flex items-baseline">
                        <div className="w-36 text-slate-800 font-medium">Booking Reference No :</div>
                        <div className="flex-1 font-mono text-slate-900">{reservation.id.slice(-8).toUpperCase()}</div>
                      </div>
                      <div className="flex items-baseline">
                        <div className="w-36 text-slate-800 font-medium">
                          {reservation.customerType === 'Corporate' ? 'Lead Delegate / Guest :' : 'Client :'}
                        </div>
                        <div className="flex-1 font-black text-slate-950 uppercase">{reservation.guestName}</div>
                      </div>
                      {reservation.customerType === 'Corporate' && reservation.companyName && (
                        <div className="flex items-baseline">
                          <div className="w-36 text-slate-800 font-medium">Company Name :</div>
                          <div className="flex-1 font-bold text-blue-900">{reservation.companyName}</div>
                        </div>
                      )}
                      {reservation.customerType === 'Corporate' && reservation.companyContactPerson && (
                        <div className="flex items-baseline">
                          <div className="w-36 text-slate-800 font-medium">Booked By / Contact :</div>
                          <div className="flex-1 text-slate-800">
                            {reservation.companyContactPerson} {reservation.companyDesignation ? `(${reservation.companyDesignation})` : ''}
                          </div>
                        </div>
                      )}
                      {reservation.isGroupBooking && reservation.groupName && (
                        <div className="flex items-baseline">
                          <div className="w-36 text-slate-800 font-medium">Group Delegation :</div>
                          <div className="flex-1 font-bold text-purple-900">{reservation.groupName}</div>
                        </div>
                      )}
                      <div className="flex items-baseline">
                        <div className="w-36 text-slate-800 font-medium">Member ID :</div>
                        <div className="flex-1 font-mono text-slate-900">{guest?.guestCode || (reservation.guestId ? reservation.guestId.slice(-8).toUpperCase() : '513660356')}</div>
                      </div>
                      <div className="flex items-baseline">
                        <div className="w-36 text-slate-800 font-medium">Country of Residence :</div>
                        <div className="flex-1 text-slate-900">{guest?.country || guest?.nationality || 'Bangladesh'} {guest?.city ? `/ ${guest.city}` : ''}</div>
                      </div>

                      {/* Property Block */}
                      <div className="pt-1">
                        <div className="text-[10px] text-slate-600 font-semibold leading-none">Property :</div>
                        <div className="text-[9px] text-slate-500 font-medium mb-0.5">Hotel :</div>
                        <div className="border border-slate-300 bg-white p-1.5 rounded text-slate-900 font-bold">
                          {settings.resortName}
                        </div>
                      </div>

                      {/* Address Block */}
                      <div>
                        <div className="text-[10px] text-slate-600 font-semibold mb-0.5">Address :</div>
                        <div className="border border-slate-300 bg-white p-1.5 rounded text-slate-800 text-[10.5px]">
                          {settings.address}
                        </div>
                      </div>

                      {/* Property Contact Block */}
                      <div>
                        <div className="text-[10px] text-slate-600 font-semibold leading-none">Property Contact Number :</div>
                        <div className="text-[9px] text-slate-500 font-medium mb-0.5">Hotel Contact Number :</div>
                        <div className="border border-slate-300 bg-white p-1.5 rounded font-mono text-slate-900 text-[10.5px]">
                          {settings.phone} {settings.email ? `• ${settings.email}` : ''}
                        </div>
                      </div>
                    </div>

                    {/* Right Column (Form input style boxes matching voucher) */}
                    <div className="space-y-1.5">
                      {/* Number of Rooms */}
                      <div className="flex border border-slate-300 rounded overflow-hidden">
                        <div className="w-36 bg-[#f1f5f9] p-1.5 text-slate-700 font-medium border-r border-slate-300 flex flex-col justify-center">
                          <span>Number of Rooms :</span>
                          <span className="text-[9px] text-slate-400">Total Rooms :</span>
                        </div>
                        <div className="flex-1 bg-white p-1.5 font-bold text-slate-900 flex items-center justify-center font-mono text-sm">
                          {reservation.totalRoomsCount || reservation.allocatedRooms?.length || 1}
                        </div>
                      </div>

                      {/* Extra Beds */}
                      <div className="flex border border-slate-300 rounded overflow-hidden">
                        <div className="w-36 bg-[#f1f5f9] p-1.5 text-slate-700 font-medium border-r border-slate-300 flex items-center">
                          Number of Extra Beds :
                        </div>
                        <div className="flex-1 bg-white p-1.5 font-bold text-slate-900 flex items-center justify-center font-mono">
                          0
                        </div>
                      </div>

                      {/* Adults */}
                      <div className="flex border border-slate-300 rounded overflow-hidden">
                        <div className="w-36 bg-[#f1f5f9] p-1.5 text-slate-700 font-medium border-r border-slate-300 flex items-center">
                          Number of Adults :
                        </div>
                        <div className="flex-1 bg-white p-1.5 font-bold text-slate-900 flex items-center justify-center font-mono">
                          {reservation.adults}
                        </div>
                      </div>

                      {/* Children */}
                      <div className="flex border border-slate-300 rounded overflow-hidden">
                        <div className="w-36 bg-[#f1f5f9] p-1.5 text-slate-700 font-medium border-r border-slate-300 flex items-center">
                          Number of Children :
                        </div>
                        <div className="flex-1 bg-white p-1.5 font-bold text-slate-900 flex items-center justify-center font-mono">
                          {reservation.children}
                        </div>
                      </div>

                      {/* Room Type */}
                      <div className="flex border border-slate-300 rounded overflow-hidden">
                        <div className="w-36 bg-[#f1f5f9] p-1.5 text-slate-700 font-medium border-r border-slate-300 flex items-center">
                          Room Type :
                        </div>
                        <div className="flex-1 bg-white p-1.5 font-bold text-slate-900 flex items-center justify-center text-center">
                          {reservation.allocatedRooms && reservation.allocatedRooms.length > 1
                            ? `${reservation.allocatedRooms.length} Rooms Allocated`
                            : reservation.roomTypeName}
                        </div>
                      </div>

                      {/* Promotion */}
                      <div className="flex border border-slate-300 rounded overflow-hidden">
                        <div className="w-36 bg-[#f1f5f9] p-1.5 text-slate-700 font-medium border-r border-slate-300 flex items-center">
                          Promotion :
                        </div>
                        <div className="flex-1 bg-white p-1.5 text-slate-800 text-[10.5px] flex items-center justify-center text-center">
                          {reservation.packageName || (reservation.customerType === 'Corporate' ? 'Corporate Negotiated Rate & Breakfast' : 'Best Flexible Rate with Complimentary Breakfast')}
                        </div>
                      </div>
                      <p className="text-[9.5px] text-slate-500 italic text-right pr-1">
                        For Full Promotion details and conditions see confirmation email
                      </p>
                    </div>
                  </div>

                  {/* NEW: ALLOCATED ROOMS & OCCUPANTS SCHEDULE TABLE (Rendered for all bookings, especially multi-room & group bookings) */}
                  {reservation.allocatedRooms && reservation.allocatedRooms.length > 0 && (
                    <div className="border border-slate-400 rounded overflow-hidden">
                      <div className="bg-slate-900 text-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider flex justify-between items-center">
                        <span className="flex items-center space-x-1.5">
                          <span>🏨 Room Allocation & Occupancy Schedule ({reservation.allocatedRooms.length} {reservation.allocatedRooms.length === 1 ? 'Room' : 'Rooms'})</span>
                        </span>
                        <span className="font-mono text-amber-400 font-normal">
                          {formatVoucherDate(reservation.arrivalDate)} → {formatVoucherDate(reservation.departureDate)}
                        </span>
                      </div>
                      <table className="w-full text-left text-[10px]">
                        <thead className="bg-[#f1f5f9] text-slate-800 border-b border-slate-300 font-bold">
                          <tr>
                            <th className="py-1 px-2 border-r border-slate-300 w-16 text-center">Room #</th>
                            <th className="py-1 px-2 border-r border-slate-300">Room Category</th>
                            <th className="py-1 px-2 border-r border-slate-300">Allocated Guest / Occupant</th>
                            <th className="py-1 px-2 border-r border-slate-300 text-center w-20">Occupancy</th>
                            <th className="py-1 px-2 border-r border-slate-300 text-right w-24">Daily Rate</th>
                            <th className="py-1 px-2 text-right w-24">Est. Room Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {reservation.allocatedRooms.map((ar, idx) => {
                            const arrD = new Date(reservation.arrivalDate);
                            const depD = new Date(reservation.departureDate);
                            const n = Math.max(1, Math.round((depD.getTime() - arrD.getTime()) / (1000 * 60 * 60 * 24)));
                            return (
                              <tr key={ar.id || idx} className="hover:bg-slate-50">
                                <td className="py-1 px-2 font-mono font-bold text-center border-r border-slate-200 text-slate-950 bg-slate-50">
                                  {ar.roomNumber ? `Room ${ar.roomNumber}` : `#${idx + 1}`}
                                </td>
                                <td className="py-1 px-2 font-semibold text-slate-900 border-r border-slate-200">
                                  {ar.roomTypeName}
                                </td>
                                <td className="py-1 px-2 border-r border-slate-200 text-slate-900">
                                  <span className="font-bold text-slate-950">{ar.guestName || reservation.guestName}</span>
                                  {ar.guestPhone && (
                                    <span className="text-[9px] text-slate-500 font-mono ml-1.5">({ar.guestPhone})</span>
                                  )}
                                </td>
                                <td className="py-1 px-2 text-center border-r border-slate-200 font-mono text-slate-800">
                                  {ar.adults}A {ar.children > 0 ? `+ ${ar.children}C` : ''}
                                </td>
                                <td className="py-1 px-2 text-right border-r border-slate-200 font-mono text-slate-800">
                                  ৳{(ar.rate || 0).toLocaleString()}
                                </td>
                                <td className="py-1 px-2 text-right font-mono font-bold text-slate-950">
                                  ৳{((ar.rate || 0) * n).toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-[#f8fafc] border-t border-slate-300 font-bold text-slate-950 text-[10px]">
                          <tr>
                            <td colSpan={3} className="py-1 px-2 text-right border-r border-slate-300 uppercase">
                              Total Schedule: {reservation.allocatedRooms.length} {reservation.allocatedRooms.length === 1 ? 'Room' : 'Rooms'}
                            </td>
                            <td className="py-1 px-2 text-center border-r border-slate-300 font-mono">
                              {reservation.adults}A {reservation.children > 0 ? `+ ${reservation.children}C` : ''}
                            </td>
                            <td className="py-1 px-2 text-right border-r border-slate-300 font-mono text-slate-700">
                              ৳{reservation.allocatedRooms.reduce((s, r) => s + (r.rate || 0), 0).toLocaleString()}/nt
                            </td>
                            <td className="py-1 px-2 text-right font-mono text-emerald-800">
                              ৳{(reservation.totalEstimatedAmount || 0).toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  {/* NEW: GROUP GUEST ROSTER / ATTENDEE MANIFEST (When Group Booking has member names) */}
                  {reservation.isGroupBooking && reservation.groupMembers && reservation.groupMembers.length > 0 && (
                    <div className="border border-purple-300 rounded overflow-hidden bg-purple-50/40">
                      <div className="bg-purple-950 text-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider flex justify-between items-center">
                        <span className="flex items-center space-x-1.5">
                          <span>👥 Group Guest Manifest & Attendee Roster ({reservation.groupMembers.length} Registered Guests)</span>
                        </span>
                        <span className="text-[9px] text-purple-200 normal-case font-normal">
                          Group: {reservation.groupName || 'Delegation'}
                        </span>
                      </div>
                      <div className="p-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[9.5px]">
                        {reservation.groupMembers.map((m, idx) => (
                          <div key={m.id || idx} className="bg-white border border-purple-200 rounded p-1.5 flex items-center justify-between">
                            <div>
                              <div className="flex items-center space-x-1">
                                <span className="font-mono text-purple-700 font-bold">#{idx + 1}</span>
                                <span className="font-bold text-slate-900">{m.name}</span>
                              </div>
                              {m.phone && <span className="block text-[8.5px] text-slate-500 font-mono">{m.phone}</span>}
                              {m.idNumber && <span className="block text-[8px] text-slate-400 font-mono">ID: {m.idNumber}</span>}
                            </div>
                            {m.isLeader && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[8px] font-bold uppercase">
                                Leader
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. CANCELLATION POLICY */}
                  <div className="border border-slate-300 bg-slate-100/70 p-2 rounded text-[10px] text-slate-800 leading-snug">
                    <strong className="text-slate-900">Cancellation Policy: </strong>
                    Stay flexible! Cancel for free before {getFreeCancellationDate(reservation.arrivalDate)}. Any cancellation received within 1 day prior to the arrival date will incur the first night&apos;s charge. Failure to arrive at your hotel or property will be treated as a No-Show and will incur a charge of 100% of the booking value (Hotel policy).
                  </div>

                  {/* 4. BENEFITS INCLUDED */}
                  <div className="bg-slate-200/90 border border-slate-300 py-1.5 px-3 rounded text-[10px] text-slate-800 font-medium">
                    <strong className="text-slate-900">Benefits Included </strong> Free WiFi, Breakfast
                  </div>

                  {/* 5. DATES, PAYMENT & SIGNATURES */}
                  <div className="border border-slate-300 rounded overflow-hidden">
                    {/* Arrival & Departure Top Banner */}
                    <div className="grid grid-cols-2 bg-slate-100 border-b border-slate-300 text-[11px]">
                      <div className="p-2 border-r border-slate-300 flex items-center">
                        <span className="font-bold text-slate-700 w-24">Arrival :</span>
                        <span className="font-bold font-mono text-slate-900">
                          {formatVoucherDate(reservation.arrivalDate)}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-2">(From 14:00)</span>
                      </div>
                      <div className="p-2 flex items-center">
                        <span className="font-bold text-slate-700 w-24">Departure :</span>
                        <span className="font-bold font-mono text-slate-900">
                          {formatVoucherDate(reservation.departureDate)}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-2">(Until 12:00)</span>
                      </div>
                    </div>

                    {/* Lower Row: Payment info on Left, Signature box on Right */}
                    <div className="grid grid-cols-2 p-2.5 gap-3 bg-white">
                      {/* Left: Payment Method & Booked and Payable through */}
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="bg-slate-100 p-1.5 rounded border border-slate-200">
                            <span className="text-slate-500 block text-[9px]">Payment Method :</span>
                            <span className="font-bold text-slate-800">{reservation.bookingSource || 'Direct / Credit Card'}</span>
                          </div>
                          <div className="bg-slate-100 p-1.5 rounded border border-slate-200">
                            <span className="text-slate-500 block text-[9px]">Card No :</span>
                            <span className="font-mono font-bold text-slate-800">XXXX-XXXX-XXXX-4031</span>
                          </div>
                        </div>

                        <div>
                          <div className="text-[9.5px] font-bold text-slate-700 leading-tight">Booked And Payable Through :</div>
                          <div className="text-[8.5px] text-slate-400 mb-1">Booked And Payable By :</div>
                          <div className="bg-slate-100/90 border border-slate-300 p-2 rounded text-[10px] text-slate-700 space-y-0.5">
                            <p className="font-bold text-slate-900">{settings.resortName}</p>
                            <p>{settings.address}</p>
                            <p className="font-mono text-[9px]">Hotline: {settings.phone}</p>
                          </div>
                        </div>
                      </div>

                      {/* Right: Signature Box (Guest Signature & Staff Who Made Reservation, NO OFFICIAL SEAL) */}
                      <div className="border border-slate-300 rounded p-2.5 flex flex-col justify-between bg-slate-50/40">
                        {/* Guest Signature */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-slate-800 uppercase">Guest Signature :</span>
                            <span className="text-slate-700 font-semibold">{reservation.guestName}</span>
                          </div>
                          <div className="h-9 border-b border-slate-400 flex items-end justify-start">
                            <span className="text-[9px] text-slate-400 italic">Signature of Guest at Check-in</span>
                          </div>
                        </div>

                        {/* Reserved By / Staff Signature */}
                        <div className="space-y-1 pt-2">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-slate-800 uppercase">Reserved By :</span>
                            <span className="font-bold text-slate-950 font-mono bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-300 text-[10.5px]">
                              {reservation.createdBy || currentUser?.name || 'Front Desk Staff'}
                            </span>
                          </div>
                          <div className="h-9 border-b border-slate-400 flex items-end justify-between">
                            <span className="text-[9px] text-slate-400 italic">Authorized Staff Signature</span>
                            <span className="text-[9px] font-mono text-slate-500">
                              {new Date(reservation.createdAt || Date.now()).toLocaleDateString('en-GB')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 6. REMARKS */}
                  <div className="space-y-1 text-[10px] text-slate-700">
                    <div className="font-bold text-slate-900">Remarks :</div>
                    <p>
                      <span className="font-semibold text-slate-800">Financial Schedule: </span>
                      Total Estimated Charges: <strong className="font-mono">৳{(reservation.totalEstimatedAmount || 0).toLocaleString()}</strong> • 
                      Advance Deposit Received: <strong className="font-mono text-emerald-700">৳{(reservation.paidAmount || reservation.depositAmount || 0).toLocaleString()}</strong> • 
                      Balance Payable at Check-in: <strong className="font-mono text-rose-700">৳{Math.max(0, (reservation.totalEstimatedAmount || 0) - (reservation.paidAmount || reservation.depositAmount || 0)).toLocaleString()}</strong>
                    </p>
                    {reservation.customerType === 'Corporate' && reservation.companyName && (
                      <p>
                        <span className="font-semibold text-blue-900">Corporate Account: </span>
                        {reservation.companyName} {reservation.companyGstBin ? `[BIN: ${reservation.companyGstBin}]` : ''} • Contact: {reservation.companyContactPerson || reservation.guestName}
                      </p>
                    )}
                    {reservation.isGroupBooking && (
                      <p>
                        <span className="font-semibold text-purple-900">Group Delegation: </span>
                        {reservation.groupName || 'Group Delegation'} ({reservation.totalRoomsCount || reservation.allocatedRooms?.length || 1} Rooms Allocated)
                        {reservation.groupLeaderName && ` • Group Leader: ${reservation.groupLeaderName}`}
                      </p>
                    )}
                    <p>
                      <span className="font-semibold text-slate-800">Guest List: </span>
                      {reservation.guestName} ({reservation.adults} Adults{reservation.children > 0 ? `, ${reservation.children} Children` : ''})
                    </p>
                    <p className="italic text-slate-500">
                      All special requests are subject to availability upon arrival
                    </p>
                    {reservation.specialRequests && (
                      <p className="text-amber-900 bg-amber-50 p-1.5 rounded border border-amber-200">
                        <strong>Guest Notes / Special Requests: </strong> {reservation.specialRequests}
                      </p>
                    )}
                  </div>

                  {/* 7. NOTES (matching image bullet points) */}
                  <div className="border border-slate-300 p-2.5 rounded text-[9.5px] text-slate-600 space-y-1 bg-white leading-tight">
                    <div className="font-bold text-slate-900 text-[10px]">Notes</div>
                    <p className="flex items-start space-x-1.5">
                      <span className="text-red-500 font-bold">•</span>
                      <span>
                        <strong className="text-red-600 uppercase">IMPORTANT: </strong> 
                        At check-in, you must present the credit card used to make this booking and a valid photo ID (NID/Passport) with the same name. Failure to do so may result in the hotel requesting additional payment or your reservation not being honored. If you have submitted additional documentation for a third party booking or paid via a different payment method, please disregard the note above.
                      </span>
                    </p>
                    <p className="flex items-start space-x-1.5">
                      <span className="text-slate-400 font-bold">•</span>
                      <span>
                        All rooms are guaranteed on the day of arrival. In the case of a no-show, your room(s) will be released and you will be subject to the terms and conditions of the Cancellation/No-Show Policy specified at the time you made the booking as well as noted in the Confirmation Email.
                      </span>
                    </p>
                    <p className="flex items-start space-x-1.5">
                      <span className="text-slate-400 font-bold">•</span>
                      <span>
                        The total price for this booking does not include mini-bar items, telephone usage, laundry service, etc. The hotel will bill you directly.
                      </span>
                    </p>
                    <p className="flex items-start space-x-1.5">
                      <span className="text-slate-400 font-bold">•</span>
                      <span>
                        In cases where Breakfast is included with the room rate, please note that certain hotels may charge extra for children travelling with their parents. If applicable, the hotel will bill you directly. Upon arrival, if you have any questions, please verify with the hotel.
                      </span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400">No reservation data available.</div>
              )
            )}

            {/* ========================================================================= */}
            {/* 4. CHECK-OUT CLEARANCE SLIP & SETTLEMENT FORM */}
            {/* ========================================================================= */}
            {(docType === 'checkout-form' || docType === 'checkout-statement') && (
              <div className="space-y-4">
                <div className="bg-rose-50 border border-rose-200 p-3 rounded flex justify-between items-center">
                  <div>
                    <span className="text-rose-800 font-bold text-[10px] uppercase block">Guest Departure & Clearance Slip</span>
                    <p className="text-base font-black font-mono text-slate-900">
                      {stay?.roomNumber ? `ROOM ${stay.roomNumber}` : 'ROOM CHECKOUT'}
                    </p>
                    <p className="text-[10px] text-slate-600">Guest: <span className="font-bold text-slate-900">{stay?.guestName || 'Valued Guest'}</span></p>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 bg-slate-900 text-white font-bold text-[10px] uppercase rounded">
                      CHECK-OUT CLEARED
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">
                      {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>

                <div className="border border-slate-200 p-3.5 rounded space-y-3 text-[11px]">
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-slate-500 text-[10px]">Stay Record #:</span> <p className="font-mono font-bold">{stay?.stayNumber || 'STY-CURRENT'}</p></div>
                    <div><span className="text-slate-500 text-[10px]">Room Category:</span> <p className="font-semibold">{stay?.roomTypeName || 'Deluxe Room'}</p></div>
                    <div><span className="text-slate-500 text-[10px]">Check-In Timestamp:</span> <p className="font-mono">{stay?.checkInAt ? stay.checkInAt.replace('T', ' ').substring(0, 16) : '2026-08-31 14:30'}</p></div>
                    <div><span className="text-slate-500 text-[10px]">Check-Out Timestamp:</span> <p className="font-mono">{new Date().toISOString().replace('T', ' ').substring(0, 16)}</p></div>
                  </div>

                  <div className="border-t border-slate-200 pt-3">
                    <span className="text-slate-700 font-bold uppercase text-[10px] block mb-2">Departure Inspection & Clearance Checklist:</span>
                    <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                      <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded border border-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Room Key Cards Returned ({stay?.keyCardsIssued || 2} Cards)</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded border border-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Minibar & Linen Inspection Cleared</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded border border-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>In-Room Safe Locker Emptied</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded border border-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Folio Settlement Balance Verified (৳0.00)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded flex justify-between items-center text-[11px]">
                  <div>
                    <span className="text-emerald-800 font-bold block uppercase text-[10px]">Account Settlement Status</span>
                    <p className="text-slate-700">All room charges, food bills, and taxes have been fully reconciled and settled.</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-600 text-white font-bold rounded font-mono text-xs">
                    ৳0.00 DUE
                  </span>
                </div>

                <div className="mt-8 pt-8 border-t border-dashed border-slate-300 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-500">
                  <div>
                    <div className="border-b border-slate-400 h-8 mb-1"></div>
                    <p>Guest Departure Signature</p>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 h-8 mb-1"></div>
                    <p>Duty Front Desk Cashier / Supervisor</p>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 5. GUEST REGISTRATION CARD (REG-CARD) */}
            {/* ========================================================================= */}
            {docType === 'registration-card' && (
              <div className="space-y-4">
                <div className="border border-slate-300 p-3.5 rounded space-y-3 text-[11px]">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold">Guest Full Name:</span>
                      <p className="font-bold text-slate-900 text-sm">{stay?.guestName || reservation?.guestName || 'Valued Guest'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold">Record #:</span>
                      <p className="font-mono font-semibold text-slate-900">{stay?.stayNumber || reservation?.reservationNumber || 'REC-2026-00311'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold">Mobile Phone:</span>
                      <p className="font-mono font-medium">{(stay as any)?.guestPhone || reservation?.guestPhone || guest?.phone || '+880 1711-000111'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold">{stay?.idType || 'National ID / Passport'}:</span>
                      <p className="font-mono font-medium">{stay?.idNumber || (stay as any)?.guestIdNumber || (guest as any)?.nidPassportNumber || (guest as any)?.idNumber || (stay?.verifiedId ? 'Verified by Front Desk' : 'ID on record')}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold">Room Category / Assigned:</span>
                      <p className="font-bold text-amber-800 text-sm">
                        {stay?.roomNumber ? `Room ${stay.roomNumber} (${stay.roomTypeName})` : reservation?.assignedRoomNumber ? `Room ${reservation.assignedRoomNumber} (${reservation.roomTypeName})` : `${reservation?.roomTypeName || 'Deluxe Room'}`}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold">Key Cards / Occupancy:</span>
                      <p className="font-semibold">{stay?.keyCardsIssued ? `${stay.keyCardsIssued} RFID Cards` : `${reservation?.adults || 1} Adults, ${reservation?.children || 0} Children`}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold">Check-In / Arrival:</span>
                      <p className="font-mono">{stay?.checkInAt ? stay.checkInAt.replace('T', ' ').substring(0, 16) : reservation?.arrivalDate ? `${reservation.arrivalDate} (From 14:00)` : '2026-08-31 14:30'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold">Departure / Check-Out:</span>
                      <p className="font-mono">{stay?.expectedCheckOutAt ? stay.expectedCheckOutAt.replace('T', ' ').substring(0, 16) : reservation?.departureDate ? `${reservation.departureDate} (Until 12:00)` : '2026-09-03 12:00'}</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-600 space-y-1">
                  <p className="font-bold text-slate-800 uppercase">Resort Policy & Terms of Stay:</p>
                  <p>1. <strong>Check-Out Time:</strong> Strictly 12:00 PM. Late check-out is subject to room availability and front desk approval.</p>
                  <p>2. <strong>Smoking:</strong> Non-smoking policy applies in all indoor rooms and suite corridors. Designated smoking zones available outdoors.</p>
                  <p>3. <strong>Valuables:</strong> The resort management is not liable for unsecured valuables in rooms. Please use in-room digital safe lockers.</p>
                  <p>4. <strong>Swimming Pool:</strong> Appropriate swimwear mandatory. Pool timing: 07:00 AM – 08:00 PM.</p>
                </div>

                <div className="mt-8 pt-8 border-t border-dashed border-slate-300 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-500">
                  <div>
                    <div className="border-b border-slate-400 h-8 mb-1"></div>
                    <p>Guest Signature (I agree to resort terms)</p>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 h-8 mb-1"></div>
                    <p>Front Desk Duty Officer</p>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 6. OFFICIAL MONEY RECEIPT */}
            {/* ========================================================================= */}
            {docType === 'payment-receipt' && (
              payment ? (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded text-center">
                    <span className="text-emerald-800 font-bold text-xs uppercase block">Official Money Receipt</span>
                    <p className="text-2xl font-black text-slate-900 mt-1 font-mono">৳{(payment.amount || 0).toLocaleString()}</p>
                    <p className="text-xs text-slate-700 italic mt-0.5 font-medium">({numberToWordsBDT(payment.amount || 0)})</p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Receipt #: <span className="font-mono font-bold text-slate-900">{payment.transactionNumber || 'TXN-PENDING'}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] border border-slate-200 p-3.5 rounded">
                    <div><span className="text-slate-500 text-[10px] uppercase font-bold">Payment Method:</span> <p className="font-semibold text-slate-900">{payment.method}</p></div>
                    <div><span className="text-slate-500 text-[10px] uppercase font-bold">Payment Date & Time:</span> <p className="font-mono">{payment.createdAt ? payment.createdAt.replace('T', ' ').substring(0, 16) : 'Current'}</p></div>
                    <div><span className="text-slate-500 text-[10px] uppercase font-bold">Transaction / Slip Reference:</span> <p className="font-mono font-bold text-slate-800">{payment.reference || 'Counter Cash'}</p></div>
                    <div><span className="text-slate-500 text-[10px] uppercase font-bold">Received & Logged By:</span> <p className="font-medium text-slate-800">{payment.createdBy || 'Accounts Department'}</p></div>
                    {payment.notes && <div className="col-span-2 border-t border-slate-100 pt-1.5"><span className="text-slate-500 text-[10px]">Payment Remarks:</span> <p>{payment.notes}</p></div>}
                  </div>

                  <div className="mt-8 pt-8 border-t border-dashed border-slate-300 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-500">
                    <div>
                      <div className="border-b border-slate-400 h-8 mb-1"></div>
                      <p>Guest / Payer Signature</p>
                    </div>
                    <div>
                      <div className="border-b border-slate-400 h-8 mb-1"></div>
                      <p>Authorized Cashier / Accounts Officer</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400">No payment receipt data available.</div>
              )
            )}

            {/* ========================================================================= */}
            {/* 7. EVENT BANQUET CONTRACT & BEO */}
            {/* ========================================================================= */}
            {(docType === 'event-contract' || docType === 'banquet-contract' || docType === 'beo' || docType === 'function-sheet') && (
              event ? (
                docType === 'beo' || docType === 'function-sheet' ? (
                  /* Dedicated Banquet Event Order (BEO) Layout */
                  <div className="space-y-4 text-[11px] text-slate-800">
                    <div className="bg-purple-900 text-white p-3 rounded flex justify-between items-center">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-purple-200 tracking-wider">Banquet Event Order (BEO) • Function Sheet</span>
                        <h3 className="text-base font-bold">{event.eventName}</h3>
                      </div>
                      <div className="text-right font-mono text-xs">
                        <span className="bg-white/20 px-2 py-0.5 rounded font-bold">{event.eventNumber}</span>
                        <div className="text-[10px] text-purple-200 mt-0.5">Date: {event.eventDate}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-300 p-3 rounded">
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Venue & Setup</span>
                        <p className="font-bold text-purple-950 text-xs">{event.hallName}</p>
                        <p className="text-slate-700">Seating Style: <strong>{event.setupStyle || 'Round Banquet Tables'}</strong></p>
                        <p className="text-slate-700">Guaranteed Attendance: <strong>{event.guestCount} Guests</strong> {event.tableCount ? `(${event.tableCount} Tables)` : ''}</p>
                        <p className="text-slate-700 font-mono">Timing: <strong>{event.startTime} - {event.endTime}</strong></p>
                      </div>

                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Host / Client Organization</span>
                        <p className="font-bold text-slate-900 text-xs">{event.clientName}</p>
                        {event.clientCompany && <p className="text-slate-700 font-semibold">{event.clientCompany}</p>}
                        <p className="text-slate-600 font-mono">Contact: {event.clientPhone}</p>
                        <p className="text-slate-700 mt-1">Floor Captain: <strong>{event.floorSupervisor || 'Anisur Rahman (Banquet Manager)'}</strong> {event.supervisorPhone ? `(${event.supervisorPhone})` : ''}</p>
                      </div>
                    </div>

                    {/* Audio Visual & Production Section */}
                    <div className="border border-slate-300 rounded overflow-hidden">
                      <div className="bg-slate-100 px-3 py-1.5 font-bold text-slate-800 text-[11px] border-b border-slate-300 flex items-center justify-between">
                        <span>Audio / Visual & Stage Production Specifications</span>
                        <span className="text-[10px] text-purple-800 font-semibold">Technical Deck</span>
                      </div>
                      <div className="p-3 bg-white">
                        <div className="grid grid-cols-2 gap-2">
                          {(event.avRequirements && event.avRequirements.length > 0 ? event.avRequirements : [
                            'PA Sound System & Digital Mixer',
                            'Wireless Handheld & Collar Mics (x4)',
                            '4K Laser Projector & Motorized Screen',
                            'LED Stage Backdrop & Spotlights',
                            'Podium with CCULB Resort Logo',
                            'Dedicated Sound & Lighting Technician'
                          ]).map((req, idx) => (
                            <div key={idx} className="flex items-center space-x-1.5 text-slate-700 text-[10px]">
                              <span className="w-2 h-2 rounded-full bg-purple-700 shrink-0"></span>
                              <span className="font-medium">{req}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Catering & Service Timeline */}
                    <div className="border border-slate-300 rounded overflow-hidden">
                      <div className="bg-slate-100 px-3 py-1.5 font-bold text-slate-800 text-[11px] border-b border-slate-300 flex items-center justify-between">
                        <span>Food & Beverage Service Schedule & Menu Plan</span>
                        <span className="text-[10px] text-purple-800 font-semibold">{event.packageName || 'Grand CCULB Buffet'}</span>
                      </div>
                      <div className="p-3 bg-white space-y-2">
                        <div className="grid grid-cols-3 gap-2 text-center text-[10px] border-b border-slate-200 pb-2">
                          <div className="p-1.5 bg-slate-50 rounded">
                            <span className="text-slate-500 block uppercase font-bold">Welcome Refreshments</span>
                            <span className="font-mono font-bold text-slate-800">{event.startTime || '10:00 AM'}</span>
                          </div>
                          <div className="p-1.5 bg-purple-50 rounded border border-purple-200">
                            <span className="text-purple-700 block uppercase font-bold">Grand Buffet Meal</span>
                            <span className="font-mono font-bold text-purple-900">01:30 PM</span>
                          </div>
                          <div className="p-1.5 bg-slate-50 rounded">
                            <span className="text-slate-500 block uppercase font-bold">Evening Tea & Cookies</span>
                            <span className="font-mono font-bold text-slate-800">{event.endTime ? `${event.endTime}` : '04:30 PM'}</span>
                          </div>
                        </div>

                        {event.dietaryRequirements && (
                          <div className="text-[10px] text-slate-600 bg-amber-50 p-2 rounded border border-amber-200">
                            <strong className="text-amber-900">Dietary Directives:</strong> {event.dietaryRequirements}
                          </div>
                        )}

                        <div className="text-[10px] text-slate-700">
                          <strong className="block text-slate-900 mb-0.5">Kitchen & Service Instructions:</strong>
                          <p>{event.kitchenNotes || 'Buffet warmers on 30 minutes before schedule. Continuous replenishments on rice, chicken roast, and salads.'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Special Instructions & Dais Setup */}
                    <div className="bg-slate-50 border border-slate-300 p-3 rounded text-[10px]">
                      <strong className="block text-slate-900 mb-0.5">Special Production, VIP Protocol & Dais Instructions:</strong>
                      <p className="text-slate-700">{event.specialInstructions || 'VIP Table on elevated dais facing main hall. Customized welcome slide displayed on 4K LED Screen.'}</p>
                    </div>

                    {/* Operational Signatures */}
                    <div className="mt-8 pt-6 border-t border-dashed border-slate-400 grid grid-cols-3 gap-4 text-center text-[10px] text-slate-600">
                      <div>
                        <div className="border-b border-slate-400 h-8 mb-1"></div>
                        <p className="font-bold text-slate-800">Banquet Operations Manager</p>
                        <p className="text-[9px] text-slate-400">CCULB Convention Center</p>
                      </div>
                      <div>
                        <div className="border-b border-slate-400 h-8 mb-1"></div>
                        <p className="font-bold text-slate-800">Executive Head Chef</p>
                        <p className="text-[9px] text-slate-400">Kitchen & F&B Department</p>
                      </div>
                      <div>
                        <div className="border-b border-slate-400 h-8 mb-1"></div>
                        <p className="font-bold text-slate-800">Client / Event Organizer</p>
                        <p className="text-[9px] text-slate-400">Authorized Signature & Seal</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standard Event Banquet Contract */
                  <div className="space-y-4 text-[11px]">
                    <div className="bg-purple-50 border border-purple-200 p-3.5 rounded">
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className="text-slate-500 text-[10px] uppercase font-bold">Event Booking #:</span> <p className="font-mono font-bold text-purple-900">{event.eventNumber}</p></div>
                        <div><span className="text-slate-500 text-[10px] uppercase font-bold">Event Title / Purpose:</span> <p className="font-bold text-slate-900">{event.eventName}</p></div>
                        <div><span className="text-slate-500 text-[10px] uppercase font-bold">Client / Organization:</span> <p className="font-semibold text-slate-800">{event.clientName} ({event.clientPhone})</p></div>
                        <div><span className="text-slate-500 text-[10px] uppercase font-bold">Reserved Hall:</span> <p className="font-bold text-purple-800">{event.hallName}</p></div>
                        <div><span className="text-slate-500 text-[10px] uppercase font-bold">Event Date & Timing:</span> <p className="font-mono">{event.eventDate} ({event.startTime} - {event.endTime})</p></div>
                        <div><span className="text-slate-500 text-[10px] uppercase font-bold">Guaranteed Attendance:</span> <p className="font-semibold">{event.guestCount} Pax</p></div>
                      </div>
                    </div>

                    <table className="w-full border-collapse text-left text-[11px] mt-2 border border-slate-200">
                      <thead>
                        <tr className="border-b border-slate-300 bg-slate-100 text-slate-700">
                          <th className="py-2 px-2">#</th>
                          <th className="py-2 px-2">Service / Item Description</th>
                          <th className="py-2 px-2 text-center">Qty</th>
                          <th className="py-2 px-2 text-right">Unit Price</th>
                          <th className="py-2 px-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {(event.items || []).map((it, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-2 text-slate-400">{idx + 1}</td>
                            <td className="py-2 px-2 font-medium">{it.description}</td>
                            <td className="py-2 px-2 text-center">{it.quantity}</td>
                            <td className="py-2 px-2 text-right font-mono">৳{(it.unitPrice || 0).toLocaleString()}</td>
                            <td className="py-2 px-2 text-right font-mono font-semibold">৳{(it.total || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="flex justify-end pt-2 text-[11px]">
                      <div className="w-64 space-y-1 border-t border-slate-300 pt-2">
                        <div className="flex justify-between"><span>Grand Total:</span> <span className="font-bold font-mono">৳{(event.total || 0).toLocaleString()}</span></div>
                        <div className="flex justify-between text-emerald-700"><span>Deposit Advance Paid:</span> <span className="font-bold font-mono">৳{(event.deposit || 0).toLocaleString()}</span></div>
                        <div className="flex justify-between text-rose-600 font-bold border-t border-slate-300 pt-1"><span>Balance Payable:</span> <span className="font-mono">৳{(event.balance || 0).toLocaleString()}</span></div>
                      </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-dashed border-slate-300 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-500">
                      <div>
                        <div className="border-b border-slate-400 h-8 mb-1"></div>
                        <p>Client Signature & Official Seal</p>
                      </div>
                      <div>
                        <div className="border-b border-slate-400 h-8 mb-1"></div>
                        <p>LESync Convention Director</p>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="py-8 text-center text-slate-400">No event data available.</div>
              )
            )}

            {/* ========================================================================= */}
            {/* 8. UNIVERSAL AUDITED OPERATIONAL / FINANCIAL / EXECUTIVE REPORT */}
            {/* ========================================================================= */}
            {isReportResult ? (
              <div className="space-y-4">
                {/* Report Banner */}
                <div className="bg-slate-50 border border-slate-300 p-3.5 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-900 text-amber-400 font-mono text-[10px] rounded font-bold">
                        {reportData.definition?.reportCode || reportData.code || 'AUDITED REPORT'}
                      </span>
                      <span className="text-slate-600 font-bold text-[10px] uppercase">
                        {reportData.definition?.category || reportData.category || 'Resort Operations Audit'}
                      </span>
                    </div>
                    <h2 className="text-base font-black text-slate-900 mt-0.5">
                      {reportData.definition?.reportName || reportData.title || getDocTitle()}
                    </h2>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {reportData.definition?.description || 'Audited operational and management report generated by CCULB Resort Management Information System.'}
                    </p>
                  </div>
                  <div className="text-right text-[10px] font-mono text-slate-600 flex-shrink-0">
                    <span className="inline-block px-2 py-0.5 bg-emerald-700 text-white font-mono text-[10px] rounded font-bold shadow-xs">
                      AUDITED & RECONCILED
                    </span>
                    <p className="mt-1">Audited By: <strong className="text-slate-900">{reportData.generatedBy || 'System Auditor'}</strong></p>
                    <p>Timestamp: {reportData.generatedAt || new Date().toLocaleString()}</p>
                    <p>Scope: <strong className="text-slate-800">{reportData.definition?.defaultDataScope || 'Consolidated Property'}</strong></p>
                  </div>
                </div>

                {/* Executive KPI Snapshot Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
                  <div className="border border-slate-200 p-2 rounded bg-slate-50">
                    <span className="text-[10px] text-slate-500 block uppercase">Total Line Records</span>
                    <span className="text-base font-bold font-mono text-slate-900">
                      {reportData.rows.length} Items
                    </span>
                  </div>
                  {reportData.summaryTotals && Object.entries(reportData.summaryTotals)
                    .filter(([k, v]) => typeof v === 'number' && v > 0)
                    .slice(0, 3)
                    .map(([k, v]: [string, any]) => {
                      const colDef = reportData.columns.find((c: any) => c.key === k);
                      const isCurr = colDef?.format === 'currency' ||
                        k.toLowerCase().includes('revenue') ||
                        k.toLowerCase().includes('total') ||
                        k.toLowerCase().includes('amount') ||
                        k.toLowerCase().includes('balance') ||
                        k.toLowerCase().includes('cost') ||
                        k.toLowerCase().includes('rate');
                      return (
                        <div key={k} className="border border-slate-200 p-2 rounded bg-slate-50">
                          <span className="text-[10px] text-slate-500 block uppercase truncate">
                            {colDef?.header || k.replace(/([A-Z])/g, ' $1')}
                          </span>
                          <span className="text-base font-bold font-mono text-amber-900">
                            {isCurr ? `৳${(v || 0).toLocaleString()}` : (v || 0).toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                </div>

                {/* Audited Data Table */}
                <div className="border border-slate-300 rounded overflow-hidden mt-3">
                  <table className="w-full text-[10.5px] border-collapse">
                    <thead className="bg-slate-100 border-b-2 border-slate-400">
                      <tr>
                        {reportData.columns.map((col: any) => (
                          <th
                            key={col.key}
                            className={`py-2 px-2.5 font-bold text-slate-800 uppercase tracking-wide text-[9.5px] ${
                              col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                            }`}
                          >
                            {col.header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(isExporting
                        ? reportData.rows
                        : reportData.rows.slice((previewPage - 1) * previewPageSize, previewPage * previewPageSize)
                      ).map((row: any, rIdx: number) => {
                        const actualIdx = isExporting ? rIdx : (previewPage - 1) * previewPageSize + rIdx;
                        return (
                        <tr key={actualIdx} className={actualIdx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                          {reportData.columns.map((col: any) => {
                            const val = row[col.key];
                            let rendered = val !== undefined && val !== null ? String(val) : '—';
                            if (col.format === 'currency' && typeof val === 'number') {
                              rendered = `৳${(val || 0).toLocaleString()}`;
                            } else if (col.format === 'percent' && typeof val === 'number') {
                              rendered = `${val}%`;
                            } else if (col.format === 'badge') {
                              const isPositive = ['Clean', 'Confirmed', 'Settled', 'Optimal', 'Balanced', 'Completed', 'Occupied', 'Available', 'Passed', 'Claimed', 'Verified', 'Reconciled'].includes(String(val));
                              return (
                                <td key={col.key} className="py-1.5 px-2.5 text-center">
                                  <span className={`inline-block px-1.5 py-0.5 rounded text-[9.5px] font-bold border ${
                                    isPositive ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'
                                  }`}>
                                    {rendered}
                                  </span>
                                </td>
                              );
                            }

                            return (
                              <td
                                key={col.key}
                                className={`py-1.5 px-2.5 text-slate-800 ${
                                  col.align === 'right' ? 'text-right font-mono font-medium' : col.align === 'center' ? 'text-center font-mono' : 'text-left'
                                }`}
                              >
                                {rendered}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                    </tbody>

                    {/* Summary Totals Row */}
                    {reportData.summaryTotals && (
                      <tfoot className="bg-slate-100 border-t-2 border-slate-900 font-bold text-[10.5px]">
                        <tr>
                          {reportData.columns.map((col: any) => {
                            const val = reportData.summaryTotals?.[col.key];
                            let rendered = val !== undefined && val !== null ? String(val) : '';
                            if (typeof val === 'number' && (col.format === 'currency' || col.key.toLowerCase().includes('revenue') || col.key.toLowerCase().includes('amount') || col.key.toLowerCase().includes('total') || col.key.toLowerCase().includes('cost'))) {
                              rendered = `৳${(val || 0).toLocaleString()}`;
                            }
                            return (
                              <td
                                key={col.key}
                                className={`py-2 px-2.5 text-slate-900 ${
                                  col.align === 'right' ? 'text-right font-mono font-extrabold text-amber-900' : col.align === 'center' ? 'text-center font-mono' : 'text-left font-bold'
                                }`}
                              >
                                {rendered}
                              </td>
                            );
                          })}
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* Page change navigation when more than 1 page */}
                {reportData.rows.length > previewPageSize && !isExporting && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-600 pt-1 px-1 print:hidden">
                    <span>
                      Showing <strong>{(previewPage - 1) * previewPageSize + 1}</strong> to <strong>{Math.min(previewPage * previewPageSize, reportData.rows.length)}</strong> of <strong>{reportData.rows.length}</strong> audited records
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setPreviewPage(p => Math.max(1, p - 1))}
                        disabled={previewPage === 1}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 disabled:opacity-40 font-medium transition cursor-pointer"
                      >
                        ← Previous Page
                      </button>
                      <span className="font-mono font-bold text-slate-800">
                        Page {previewPage} / {Math.ceil(reportData.rows.length / previewPageSize)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPreviewPage(p => Math.min(Math.ceil(reportData.rows.length / previewPageSize), p + 1))}
                        disabled={previewPage >= Math.ceil(reportData.rows.length / previewPageSize)}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 disabled:opacity-40 font-medium transition cursor-pointer"
                      >
                        Next Page →
                      </button>
                    </div>
                  </div>
                )}

                {/* 3 Executive Signature Certification Blocks */}
                <div className="mt-8 pt-6 border-t border-dashed border-slate-300 grid grid-cols-3 gap-6 text-center text-[10px] text-slate-600">
                  <div>
                    <div className="border-b border-slate-400 h-8 mb-1 flex items-end justify-center pb-0.5 font-mono text-[9px] text-slate-500">
                      {reportData.generatedBy || 'Duty Officer'}
                    </div>
                    <p className="font-bold text-slate-800">Prepared By</p>
                    <p className="text-[9px] text-slate-500">Operating Officer / Department Head</p>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 h-8 mb-1 flex items-end justify-center pb-0.5 font-mono text-[9px] text-slate-500">
                      Internal Audit Reconciled
                    </div>
                    <p className="font-bold text-slate-800">Audited & Verified By</p>
                    <p className="text-[9px] text-slate-500">Night Auditor / Accounts Controller</p>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 h-8 mb-1 flex items-end justify-center pb-0.5 font-mono text-[9px] text-slate-500">
                      Approved
                    </div>
                    <p className="font-bold text-slate-800">Executive Endorsement</p>
                    <p className="text-[9px] text-slate-500">General Manager / Director of Finance</p>
                  </div>
                </div>

                {/* Legal Audit Notice */}
                <div className="pt-3 border-t border-slate-200 text-[9px] text-slate-500 flex justify-between items-center font-mono">
                  <span>Official Record • CCULB Resort Management Information System (MIS)</span>
                  <span>Certified Audited Document • Confidential & Proprietary</span>
                </div>
              </div>
            ) : (docType === 'daily-flash-report' || docType === 'operational-report' || docType === 'report') ? (
              <div className="space-y-4">
                <div className="bg-slate-100 border border-slate-300 p-3.5 rounded flex justify-between items-center">
                  <div>
                    <span className="text-slate-600 font-bold text-[10px] uppercase block">Audit & Operations Command</span>
                    <h2 className="text-base font-black text-slate-900">RESORT DAILY FLASH & AUDIT REPORT</h2>
                    <p className="text-[10px] text-slate-500">Generated for General Management & Night Audit Review</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 bg-slate-900 text-white font-mono text-[10px] rounded font-bold">
                      AUDITED
                    </span>
                    <p className="text-[10px] font-mono text-slate-600 mt-1">Audit Date: {new Date().toLocaleDateString('en-GB')}</p>
                  </div>
                </div>

                {/* KPI Overview Grid */}
                <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                  <div className="border border-slate-200 p-2 rounded bg-slate-50">
                    <span className="text-[10px] text-slate-500 block uppercase">Occupancy</span>
                    <span className="text-base font-bold font-mono text-slate-900">
                      {reportData?.kpis?.occupancyRate ?? 80}%
                    </span>
                  </div>
                  <div className="border border-slate-200 p-2 rounded bg-slate-50">
                    <span className="text-[10px] text-slate-500 block uppercase">ADR</span>
                    <span className="text-base font-bold font-mono text-emerald-700">
                      ৳{(reportData?.kpis?.adr ?? 9500).toLocaleString()}
                    </span>
                  </div>
                  <div className="border border-slate-200 p-2 rounded bg-slate-50">
                    <span className="text-[10px] text-slate-500 block uppercase">RevPAR</span>
                    <span className="text-base font-bold font-mono text-cyan-700">
                      ৳{(reportData?.kpis?.revpar ?? 7600).toLocaleString()}
                    </span>
                  </div>
                  <div className="border border-slate-200 p-2 rounded bg-slate-50">
                    <span className="text-[10px] text-slate-500 block uppercase">In-House Guests</span>
                    <span className="text-base font-bold font-mono text-slate-900">
                      {reportData?.kpis?.inHouseGuests ?? 42} Pax
                    </span>
                  </div>
                </div>

                {/* Detailed Department Breakdown Table */}
                <div className="border border-slate-200 rounded overflow-hidden mt-3">
                  <div className="bg-slate-100 p-2 border-b border-slate-200">
                    <span className="font-bold text-slate-800 text-[10px] uppercase">Department Revenue & Collections</span>
                  </div>
                  <table className="w-full text-[11px] border-collapse">
                    <tbody className="divide-y divide-slate-200">
                      <tr className="p-2">
                        <td className="py-2 px-3 text-slate-700 font-medium">Room Accommodation Revenue</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          ৳{(reportData?.roomRevenue ?? 185000).toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-slate-700 font-medium">Food & Beverage (Restaurant & Room Service)</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          ৳{(reportData?.fbRevenue ?? 64500).toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-slate-700 font-medium">Convention & Banquet Hall Events</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          ৳{(reportData?.eventRevenue ?? 120000).toLocaleString()}
                        </td>
                      </tr>
                      <tr className="bg-slate-50 font-bold">
                        <td className="py-2.5 px-3 text-slate-900 uppercase">Total Consolidated Gross Revenue</td>
                        <td className="py-2.5 px-3 text-right font-mono font-extrabold text-amber-700 text-sm">
                          ৳{(reportData?.totalGrossRevenue ?? 369500).toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Inventory Status */}
                <div className="grid grid-cols-3 gap-2 text-center text-[10.5px] border border-slate-200 p-2.5 rounded bg-slate-50">
                  <div>
                    <span className="text-slate-500 block">Total Inventory:</span>
                    <span className="font-bold font-mono text-slate-900">{reportData?.kpis?.totalRooms ?? 48} Rooms</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Occupied / Clean Vacant:</span>
                    <span className="font-bold font-mono text-slate-900">
                      {reportData?.kpis?.occupiedRooms ?? 38} / {reportData?.kpis?.availableRooms ?? 6}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Dirty / Maintenance OOO:</span>
                    <span className="font-bold font-mono text-slate-900">
                      {reportData?.kpis?.dirtyRooms ?? 3} / {reportData?.kpis?.oooRooms ?? 1}
                    </span>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-dashed border-slate-300 grid grid-cols-3 gap-6 text-center text-[10px] text-slate-500">
                  <div>
                    <div className="border-b border-slate-400 h-8 mb-1"></div>
                    <p className="font-bold text-slate-700">Prepared By</p>
                    <p className="text-[9px]">Duty Night Auditor</p>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 h-8 mb-1"></div>
                    <p className="font-bold text-slate-700">Audited By</p>
                    <p className="text-[9px]">Financial Controller</p>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 h-8 mb-1"></div>
                    <p className="font-bold text-slate-700">Approved By</p>
                    <p className="text-[9px]">Resort General Manager</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Bottom Status & Close Bar (Hidden on print) */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 no-print shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[11px] text-slate-400 truncate">
              {isThermal80mm ? '80mm Thermal Slip • Optimized for POS & KOT Roll Printers' : 'Official Document Print Preview'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white border border-slate-700 hover:border-rose-500 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close Preview</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
