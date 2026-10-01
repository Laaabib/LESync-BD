import React, { useState, useEffect } from 'react';
import {
  Sparkles, Users, Utensils, CheckCircle2, Building,
  Plus, Edit, Trash2, FileText, Download, Printer,
  ArrowRight, Search, Calendar, Clock, DollarSign,
  ShieldAlert, Check, BedDouble, Mic, Send, RefreshCw
} from 'lucide-react';
import { pmsService } from '../services/pmsService';
import { pdfExportService } from '../services/pdfExportService';
import { PmsDatabaseState } from '../services/mockPmsDatabase';
import { Package, BanquetQuotation } from '../types/pms';
import { CustomPackageModal } from '../components/convention/CustomPackageModal';
import { BanquetQuotationModal } from '../components/convention/BanquetQuotationModal';

interface ConventionPackagesViewProps {
  initialTab?: 'packages' | 'quotations' | 'halls';
  onNavigate?: (route: string) => void;
}

export const ConventionPackagesView: React.FC<ConventionPackagesViewProps> = ({
  initialTab = 'packages',
  onNavigate
}) => {
  const [db, setDb] = useState<PmsDatabaseState>(pmsService.getState());
  const [activeTab, setActiveTab] = useState<'packages' | 'quotations' | 'halls'>(initialTab);

  // Modals state
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);

  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<BanquetQuotation | null>(null);

  // Detail preview for Quotation
  const [viewingQuotation, setViewingQuotation] = useState<BanquetQuotation | null>(null);

  // Filters & Search
  const [quotationSearch, setQuotationSearch] = useState('');
  const [quotationStatusFilter, setQuotationStatusFilter] = useState('All');
  const [packageSearch, setPackageSearch] = useState('');

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    return pmsService.subscribe(setDb);
  }, []);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const quotations = db.quotations || [];
  const packages = db.packages || [];
  const halls = db.halls || [];

  // Handlers for Packages
  const handleOpenNewPackage = () => {
    setEditingPackage(null);
    setShowPackageModal(true);
  };

  const handleEditPackage = (pkg: Package) => {
    setEditingPackage(pkg);
    setShowPackageModal(true);
  };

  const handleDeletePackage = (pkgId: string, pkgName: string) => {
    if (window.confirm(`Are you sure you want to delete package "${pkgName}"?`)) {
      pmsService.deletePackage(pkgId);
      setFeedbackMsg({ type: 'success', text: `Package "${pkgName}" removed.` });
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  // Handlers for Quotations
  const handleOpenNewQuotation = (templatePackage?: Package) => {
    if (templatePackage) {
      // Pre-seed template
      setEditingQuotation({
        id: '',
        quotationNumber: '',
        clientName: '',
        clientPhone: '',
        eventName: `${templatePackage.name} Event`,
        eventType: templatePackage.packageType === 'Event' ? 'Wedding' : 'Corporate',
        eventDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '18:00',
        guestCount: templatePackage.minGuests || 100,
        packageId: templatePackage.id,
        packageName: templatePackage.name,
        isCustomPackage: true,
        halls: (templatePackage.selectedHalls || []).map(h => ({
          hallId: h.hallId,
          hallName: h.hallName,
          hallRate: h.rentalRate,
          setupStyle: 'Banquet'
        })),
        rooms: (templatePackage.selectedRooms || []).map(r => ({
          roomTypeId: r.roomTypeId,
          roomTypeName: r.roomTypeName,
          roomCount: r.count,
          nights: r.nights,
          ratePerNight: r.ratePerNight,
          totalAmount: r.count * r.nights * r.ratePerNight
        })),
        menuItems: (templatePackage.selectedMenuItems || []).map(m => ({
          itemId: m.itemId,
          name: m.name,
          categoryName: m.categoryName,
          unitPrice: m.price
        })),
        menuPricePerPerson: templatePackage.pricingModel === 'per_person' ? templatePackage.price : 1800,
        cateringTotal: (templatePackage.minGuests || 100) * (templatePackage.pricingModel === 'per_person' ? templatePackage.price : 1800),
        additionalServices: (templatePackage.customServices || []).map((cs, i) => ({
          id: `s-${i}`,
          name: cs.name,
          category: 'Other',
          rate: cs.cost,
          quantity: 1,
          total: cs.cost
        })),
        hallTotal: (templatePackage.selectedHalls || []).reduce((s, h) => s + h.rentalRate, 0),
        roomTotal: (templatePackage.selectedRooms || []).reduce((s, r) => s + (r.count * r.nights * r.ratePerNight), 0),
        servicesTotal: (templatePackage.customServices || []).reduce((s, cs) => s + cs.cost, 0),
        subtotal: templatePackage.price,
        discountPercent: 0,
        discountAmount: 0,
        serviceChargePercent: 10,
        serviceChargeAmount: 0,
        taxPercent: 15,
        taxAmount: 0,
        grandTotal: templatePackage.price,
        depositRequired: Math.round(templatePackage.price * 0.3),
        status: 'Draft',
        validUntil: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        createdBy: 'Banquet Sales Team'
      });
    } else {
      setEditingQuotation(null);
    }
    setShowQuotationModal(true);
  };

  const handleEditQuotation = (qtn: BanquetQuotation) => {
    setEditingQuotation(qtn);
    setShowQuotationModal(true);
  };

  const handleStatusChange = (qtnId: string, status: BanquetQuotation['status']) => {
    try {
      pmsService.updateQuotationStatus(qtnId, status);
      setFeedbackMsg({ type: 'success', text: `Quotation status set to ${status}.` });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Status update failed' });
    }
  };

  const handleConvertToEvent = (qtn: BanquetQuotation) => {
    if (window.confirm(`Convert Quotation ${qtn.quotationNumber} into a confirmed Event Booking? This will lock halls and generate booking entries.`)) {
      try {
        const createdEvt = pmsService.convertQuotationToEvent(qtn.id);
        setFeedbackMsg({
          type: 'success',
          text: `Quotation converted successfully to Event ${createdEvt.eventNumber}!`
        });
        setTimeout(() => setFeedbackMsg(null), 4000);
        if (onNavigate) {
          onNavigate('convention-events');
        }
      } catch (err: any) {
        setFeedbackMsg({ type: 'error', text: err.message || 'Conversion failed.' });
      }
    }
  };

  const handleDownloadPDF = (qtn: BanquetQuotation) => {
    const propName = db.settings.resortName || 'Hotel & Resort MIS';
    pdfExportService.exportQuotationToPDF(qtn, propName);
    const ref = qtn.customSerialNo || qtn.quotationNumber;
    setFeedbackMsg({ type: 'success', text: `Quotation PDF Quotation_${ref}.pdf generated successfully.` });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Filtered quotations
  const filteredQuotations = quotations.filter(q => {
    const matchQuery =
      q.quotationNumber.toLowerCase().includes(quotationSearch.toLowerCase()) ||
      (q.customSerialNo && q.customSerialNo.toLowerCase().includes(quotationSearch.toLowerCase())) ||
      q.clientName.toLowerCase().includes(quotationSearch.toLowerCase()) ||
      q.eventName.toLowerCase().includes(quotationSearch.toLowerCase()) ||
      (q.clientCompany && q.clientCompany.toLowerCase().includes(quotationSearch.toLowerCase()));
    const matchStatus = quotationStatusFilter === 'All' || q.status === quotationStatusFilter;
    return matchQuery && matchStatus;
  });

  // Filtered packages
  const filteredPackages = packages.filter(p => {
    return p.name.toLowerCase().includes(packageSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(packageSearch.toLowerCase()) ||
      p.packageType.toLowerCase().includes(packageSearch.toLowerCase());
  });

  return (
    <div className="space-y-4 text-xs text-slate-200">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className={`p-3 rounded-xl flex items-center space-x-2 border transition-all ${
          feedbackMsg.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-medium text-xs">{feedbackMsg.text}</span>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center border border-purple-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-100">
                Banquet Custom Packages & Guest Quotations
              </h1>
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px]">
                {packages.length} Packages • {quotations.length} Quotations • {halls.length} Halls
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Build custom packages with venues, catering menus, and room blocks. Generate client quotations and convert into confirmed events.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleOpenNewPackage}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl font-semibold flex items-center space-x-1.5 border border-slate-700 transition-colors shadow-sm text-xs"
          >
            <Plus className="w-3.5 h-3.5 text-purple-400" />
            <span>Create Custom Package</span>
          </button>
          <button
            onClick={() => handleOpenNewQuotation()}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold flex items-center space-x-1.5 transition-colors shadow-md shadow-purple-600/30 text-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>New Guest Quotation</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveTab('packages')}
          className={`flex-1 py-2 px-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors ${
            activeTab === 'packages'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Banquet Packages ({packages.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('quotations')}
          className={`flex-1 py-2 px-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors ${
            activeTab === 'quotations'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Guest Quotations & Proposals ({quotations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('halls')}
          className={`flex-1 py-2 px-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors ${
            activeTab === 'halls'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Convention Halls & Specs ({halls.length})</span>
        </button>
      </div>

      {/* TAB 1: BANQUET PACKAGES */}
      {activeTab === 'packages' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search packages by name, type, or inclusions..."
                value={packageSearch}
                onChange={e => setPackageSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 text-xs"
              />
            </div>
            <div className="text-slate-400 text-xs font-mono">
              Showing {filteredPackages.length} of {packages.length} Packages
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredPackages.map(pkg => (
              <div
                key={pkg.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-purple-500/40 transition-colors shadow-sm"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-slate-100 text-sm">{pkg.name}</h3>
                        {pkg.packageType === 'Custom' && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[9px]">
                            Custom
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-purple-400 font-semibold">{pkg.packageType} Package</span>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-purple-300 font-mono block">
                        ৳{(pkg.price || 0).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        {pkg.pricingModel ? pkg.pricingModel.replace('_', ' ') : '/ package'}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-400 text-[11px] mt-2 leading-relaxed">{pkg.description}</p>

                  {/* Component Breakdown Pills if configured */}
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {pkg.selectedHalls && pkg.selectedHalls.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-800/60 text-purple-300 text-[10px] flex items-center space-x-1">
                        <Building className="w-3 h-3" />
                        <span>{pkg.selectedHalls.length} Hall</span>
                      </span>
                    )}
                    {pkg.selectedMenuItems && pkg.selectedMenuItems.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-[10px] flex items-center space-x-1">
                        <Utensils className="w-3 h-3" />
                        <span>{pkg.selectedMenuItems.length} Dishes</span>
                      </span>
                    )}
                    {pkg.selectedRooms && pkg.selectedRooms.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-950/60 border border-blue-800/60 text-blue-300 text-[10px] flex items-center space-x-1">
                        <BedDouble className="w-3 h-3" />
                        <span>{pkg.selectedRooms.length} Room Types</span>
                      </span>
                    )}
                    {pkg.minGuests && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                        {pkg.minGuests}-{pkg.maxGuests || 500} Pax
                      </span>
                    )}
                  </div>

                  {/* Inclusions */}
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Package Inclusions:
                    </span>
                    <div className="space-y-1">
                      {pkg.includes.slice(0, 4).map((inc, i) => (
                        <div key={i} className="flex items-center space-x-2 text-[11px] text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{inc}</span>
                        </div>
                      ))}
                      {pkg.includes.length > 4 && (
                        <span className="text-[10px] text-purple-400 font-semibold block pt-0.5">
                          +{pkg.includes.length - 4} more inclusions
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Package Card Actions */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleEditPackage(pkg)}
                      className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit package parameters"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    {pkg.packageType === 'Custom' && (
                      <button
                        onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Delete package"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenNewQuotation(pkg)}
                    className="px-2.5 py-1.5 bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white rounded-lg font-semibold flex items-center space-x-1 border border-purple-500/40 transition-colors text-[11px]"
                  >
                    <span>Create Quotation</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: GUEST QUOTATIONS & PROPOSALS */}
      {activeTab === 'quotations' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center space-x-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by client, quotation #, company, or event..."
                  value={quotationSearch}
                  onChange={e => setQuotationSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 text-xs"
                />
              </div>

              <select
                value={quotationStatusFilter}
                onChange={e => setQuotationStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 text-xs"
              >
                <option value="All">All Quotation Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Sent">Sent to Client</option>
                <option value="Negotiating">Negotiating</option>
                <option value="Accepted">Accepted by Client</option>
                <option value="Converted to Event">Converted to Event</option>
                <option value="Declined">Declined</option>
              </select>
            </div>

            <button
              onClick={() => handleOpenNewQuotation()}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold flex items-center space-x-1.5 transition-colors text-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Quotation</span>
            </button>
          </div>

          {/* Quotations Table */}
          {filteredQuotations.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <FileText className="w-10 h-10 text-purple-400 mx-auto opacity-40" />
              <h3 className="font-bold text-slate-200 text-sm">No Guest Quotations Found</h3>
              <p className="text-slate-400 text-xs max-w-md mx-auto">
                Generate tailored client proposals with customized hall rentals, catering menu items, room allocations, and discounts.
              </p>
              <button
                onClick={() => handleOpenNewQuotation()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold inline-flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Quotation</span>
              </button>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[11px] font-semibold">
                      <th className="py-3 px-4">Quotation #</th>
                      <th className="py-3 px-4">Client & Organization</th>
                      <th className="py-3 px-4">Event Details</th>
                      <th className="py-3 px-4">Pax</th>
                      <th className="py-3 px-4">Halls & Rooms</th>
                      <th className="py-3 px-4 text-right">Grand Total (৳)</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-xs">
                    {filteredQuotations.map(qtn => {
                      const isConverted = qtn.status === 'Converted to Event';
                      return (
                        <tr key={qtn.id} className="hover:bg-slate-850/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              {qtn.propertyLogoUrl && (
                                <div className="w-6 h-6 rounded bg-white p-0.5 border border-slate-700 flex items-center justify-center shrink-0">
                                  <img src={qtn.propertyLogoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                                </div>
                              )}
                              <div>
                                <span className="font-mono font-bold text-purple-400 block">
                                  {qtn.customSerialNo || qtn.quotationNumber}
                                </span>
                                {qtn.customSerialNo && qtn.customSerialNo !== qtn.quotationNumber && (
                                  <span className="font-mono text-[9px] text-amber-400/90 block">
                                    Sys: {qtn.quotationNumber}
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-500">Valid to: {qtn.validUntil}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-100 block">{qtn.clientName}</span>
                            <span className="text-[11px] text-slate-400 block">{qtn.clientPhone}</span>
                            {qtn.clientCompany && (
                              <span className="text-[10px] text-purple-400/80 font-medium block">{qtn.clientCompany}</span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-200 block">{qtn.eventName}</span>
                            <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                              <span className="font-mono">{qtn.eventDate}</span>
                              <span>•</span>
                              <span>{qtn.startTime}-{qtn.endTime}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4 font-mono font-semibold text-slate-200">
                            {qtn.guestCount}
                          </td>

                          <td className="py-3 px-4">
                            <div className="space-y-0.5 text-[11px]">
                              <div className="text-slate-300">
                                <strong className="text-purple-400">{qtn.halls.length}</strong> Venue(s)
                              </div>
                              <div className="text-slate-400 text-[10px]">
                                {qtn.rooms.length > 0 ? `${qtn.rooms.length} Room Types` : 'No rooms'}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <span className="font-mono font-bold text-slate-100 block">
                              ৳{(qtn.grandTotal || 0).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-emerald-400/90 font-mono">
                              Deposit: ৳{(qtn.depositRequired || 0).toLocaleString()}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <select
                              value={qtn.status}
                              disabled={isConverted}
                              onChange={e => handleStatusChange(qtn.id, e.target.value as any)}
                              className={`text-[11px] font-semibold px-2 py-1 rounded-lg border focus:outline-none ${
                                qtn.status === 'Accepted'
                                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                                  : qtn.status === 'Converted to Event'
                                  ? 'bg-purple-950/60 text-purple-300 border-purple-800 cursor-not-allowed'
                                  : qtn.status === 'Sent'
                                  ? 'bg-blue-950/60 text-blue-300 border-blue-800'
                                  : qtn.status === 'Declined'
                                  ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                                  : 'bg-slate-950 text-slate-300 border-slate-700'
                              }`}
                            >
                              <option value="Draft">Draft</option>
                              <option value="Sent">Sent</option>
                              <option value="Negotiating">Negotiating</option>
                              <option value="Accepted">Accepted</option>
                              <option value="Declined">Declined</option>
                              <option value="Converted to Event">Converted to Event</option>
                            </select>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => handleDownloadPDF(qtn)}
                                className="p-1.5 text-slate-400 hover:text-purple-300 hover:bg-slate-800 rounded-lg transition-colors"
                                title="Export Formal Pro-Forma PDF"
                              >
                                <Download className="w-4 h-4" />
                              </button>

                              {!isConverted && (
                                <button
                                  onClick={() => handleEditQuotation(qtn)}
                                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                                  title="Edit quotation items & pricing"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}

                              {!isConverted && (
                                <button
                                  onClick={() => handleConvertToEvent(qtn)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[10px] flex items-center space-x-1 shadow-sm transition-colors"
                                  title="Convert quotation into confirmed event booking"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Book Event</span>
                                </button>
                              )}

                              {isConverted && (
                                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded font-mono text-[10px]">
                                  Booked
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CONVENTION HALLS SPECIFICATIONS */}
      {activeTab === 'halls' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Convention Hall Specifications & Inventory</h3>
              <p className="text-slate-400 text-xs">Dimension, capacity thresholds, AV infrastructure, and standard daily rental rates.</p>
            </div>
            <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 font-mono rounded-lg text-xs font-semibold">
              {halls.length} Venues Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {halls.map(hall => (
              <div key={hall.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-purple-400 text-sm block">{hall.name}</span>
                    <span className="text-[10px] text-slate-500">Location: {hall.floor || 'Ground Level'}</span>
                  </div>
                  <span className="font-mono text-slate-100 font-bold text-sm">
                    ৳{(hall.baseRatePerDay || 0).toLocaleString()}
                    <span className="text-[10px] text-slate-500 font-normal block text-right">/ day</span>
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>Max Capacity: <strong className="text-slate-200 font-mono">{hall.capacity} Guests</strong></span>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block mb-1 font-semibold uppercase">Hall Amenities & AV:</span>
                  <div className="flex flex-wrap gap-1">
                    {hall.amenities.map((am, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                        {am}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: CUSTOM PACKAGE CREATION / EDITING */}
      {showPackageModal && (
        <CustomPackageModal
          initialPackage={editingPackage}
          onClose={() => setShowPackageModal(false)}
          onSaved={(savedPkg) => {
            setShowPackageModal(false);
            setFeedbackMsg({
              type: 'success',
              text: `Custom package "${savedPkg.name}" successfully saved!`
            });
            setTimeout(() => setFeedbackMsg(null), 3000);
          }}
        />
      )}

      {/* MODAL: BANQUET GUEST QUOTATION CREATION / EDITING */}
      {showQuotationModal && (
        <BanquetQuotationModal
          initialQuotation={editingQuotation}
          onClose={() => setShowQuotationModal(false)}
          onSaved={(savedQtn) => {
            setShowQuotationModal(false);
            setActiveTab('quotations');
            setFeedbackMsg({
              type: 'success',
              text: `Guest Quotation ${savedQtn.quotationNumber} (${savedQtn.clientName}) generated!`
            });
            setTimeout(() => setFeedbackMsg(null), 3500);
          }}
        />
      )}
    </div>
  );
};
