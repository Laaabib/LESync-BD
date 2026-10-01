import React, { useState, useEffect, useRef } from 'react';
import {
  Settings, Building, DollarSign, Clock, ShieldAlert,
  RotateCcw, CheckCircle2, Save, Moon, Check, Percent, Hash, Layers,
  Database, Download, Upload, RefreshCw, FileSpreadsheet, HardDrive,
  Sparkles, Trash2, BedDouble, UserCheck, Image
} from 'lucide-react';
import { pmsService } from '../services/pmsService';
import { cloudSqlSyncService } from '../services/cloudSqlSyncService';

interface SettingsProps {
  initialTab?: 'property' | 'tax' | 'service-charge' | 'numbering' | 'audit' | 'backup' | 'onboarding' | string;
  onNavigate?: (route: string) => void;
  onNavigateToBackup?: () => void;
}

export const SettingsView: React.FC<SettingsProps> = ({ initialTab = 'property', onNavigate, onNavigateToBackup }) => {
  const [db, setDb] = useState(pmsService.getState());

  useEffect(() => {
    return pmsService.subscribe(setDb);
  }, []);

  // Map initial tab if it came from sidebar routes
  const resolveTab = (tab: string) => {
    if (tab === 'admin-tax' || tab === 'tax') return 'tax';
    if (tab === 'admin-service-charge' || tab === 'service-charge') return 'service-charge';
    if (tab === 'admin-numbering' || tab === 'numbering') return 'numbering';
    if (tab === 'admin-audit' || tab === 'admin-audit-rules' || tab === 'audit') return 'audit';
    if (tab === 'admin-backup' || tab === 'backup') return 'backup';
    if (tab === 'admin-onboarding' || tab === 'onboarding') return 'onboarding';
    return 'property';
  };

  const [activeTab, setActiveTab] = useState<string>(resolveTab(initialTab));

  useEffect(() => {
    setActiveTab(resolveTab(initialTab));
  }, [initialTab]);

  const [resortName, setResortName] = useState(db.settings?.resortName || 'LESync Resort & Convention Hall');
  const [address, setAddress] = useState(db.settings?.address || 'Joypara, Dohar, Dhaka-1330, Bangladesh');
  const [phone, setPhone] = useState(db.settings?.phone || '+880 1713-388000');
  const [email, setEmail] = useState(db.settings?.email || 'info@lesyncpms.com');
  const [website, setWebsite] = useState(db.settings?.website || '');
  const [logoUrl, setLogoUrl] = useState(db.settings?.logoUrl || '');
  const [binNumber, setBinNumber] = useState(db.settings?.binNumber || '');
  const [tradeLicense, setTradeLicense] = useState(db.settings?.tradeLicense || '');
  const [vatRate, setVatRate] = useState(db.settings?.vatRate || db.settings?.taxRatePercent || 15);
  const [serviceCharge, setServiceCharge] = useState(db.settings?.serviceChargeRate || db.settings?.serviceChargePercent || 10);
  const [currencySymbol, setCurrencySymbol] = useState(db.settings?.currencySymbol || '৳');
  const [checkInTime, setCheckInTime] = useState(db.settings?.checkInTime || '14:00');
  const [checkOutTime, setCheckOutTime] = useState(db.settings?.checkOutTime || '12:00');
  const [allowOverbooking, setAllowOverbooking] = useState(db.settings?.allowOverbooking ?? false);
  const [requireDeposit, setRequireDeposit] = useState(db.settings?.requireDepositForReservation ?? true);

  // New Property Provisioning State
  const [provResortName, setProvResortName] = useState('');
  const [provAddress, setProvAddress] = useState('');
  const [provPhone, setProvPhone] = useState('');
  const [provEmail, setProvEmail] = useState('');
  const [provLogoUrl, setProvLogoUrl] = useState('');
  const [provBin, setProvBin] = useState('');
  const [provLicense, setProvLicense] = useState('');
  const [provCurrency, setProvCurrency] = useState('৳');
  const [provVat, setProvVat] = useState(15);
  const [provServiceCharge, setProvServiceCharge] = useState(10);
  const [provBusinessDate, setProvBusinessDate] = useState(new Date().toISOString().split('T')[0]);
  const [provCleanMode, setProvCleanMode] = useState<'clean_transactions_keep_rooms' | 'fresh_slate_starter_rooms'>('clean_transactions_keep_rooms');
  const [provSuccess, setProvSuccess] = useState('');

  // Document Numbering Schemes
  const [folioPrefix, setFolioPrefix] = useState(db.settings?.folioPrefix || 'FOL-');
  const [invPrefix, setInvPrefix] = useState(db.settings?.invPrefix || 'INV-');
  const [resPrefix, setResPrefix] = useState(db.settings?.resPrefix || 'RES-');
  const [banquetPrefix, setBanquetPrefix] = useState(db.settings?.banquetPrefix || 'EVT-');
  const [poPrefix, setPoPrefix] = useState(db.settings?.poPrefix || 'PO-');
  const [grnPrefix, setGrnPrefix] = useState(db.settings?.grnPrefix || 'GRN-');
  const [posPrefix, setPosPrefix] = useState(db.settings?.posPrefix || 'POS-');
  const [kotPrefix, setKotPrefix] = useState(db.settings?.kotPrefix || 'KOT-');
  const [jvPrefix, setJvPrefix] = useState(db.settings?.jvPrefix || 'JV-');
  const [receiptPrefix, setReceiptPrefix] = useState(db.settings?.receiptPrefix || 'RCT-');
  const [numberPadding, setNumberPadding] = useState<number>(db.settings?.numberPadding || 5);
  const [numberDateFormat, setNumberDateFormat] = useState<'NONE' | 'YYYY' | 'YYMM'>(db.settings?.numberDateFormat || 'YYYY');

  // Operational Policies
  const [autoDirtyOnCheckout, setAutoDirtyOnCheckout] = useState(db.settings?.autoDirtyOnCheckout ?? true);
  const [allowDirectRoomPost, setAllowDirectRoomPost] = useState(db.settings?.allowDirectRoomPost ?? true);
  const [stopPostStrict, setStopPostStrict] = useState(db.settings?.stopPostStrict ?? true);
  const [lateCheckoutGraceMinutes, setLateCheckoutGraceMinutes] = useState(db.settings?.lateCheckoutGraceMinutes ?? 30);

  // Night Audit Settings
  const [autoNightAuditEnabled, setAutoNightAuditEnabled] = useState(db.settings?.autoNightAuditEnabled ?? false);
  const [autoNightAuditTime, setAutoNightAuditTime] = useState(db.settings?.autoNightAuditTime || '06:00');

  const [savedMessage, setSavedMessage] = useState('');
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Restore file input ref
  const restoreFileRef = useRef<HTMLInputElement>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save all parameters directly to pmsService and localStorage
    pmsService.updateSystemSettings({
      resortName,
      address,
      phone,
      email,
      website,
      logoUrl,
      binNumber,
      tradeLicense,
      currencySymbol,
      taxRatePercent: Number(vatRate),
      vatRate: Number(vatRate),
      serviceChargePercent: Number(serviceCharge),
      serviceChargeRate: Number(serviceCharge),
      checkInTime,
      checkOutTime,
      allowOverbooking,
      requireDepositForReservation: requireDeposit,
      autoNightAuditEnabled,
      autoNightAuditTime,
      folioPrefix,
      invPrefix,
      resPrefix,
      banquetPrefix,
      poPrefix,
      grnPrefix,
      posPrefix,
      kotPrefix,
      jvPrefix,
      receiptPrefix,
      numberPadding,
      numberDateFormat,
      autoDirtyOnCheckout,
      allowDirectRoomPost,
      stopPostStrict,
      lateCheckoutGraceMinutes
    });

    setSavedMessage('All resort settings, operational policies, tax rules, and document numbering schemes saved successfully.');
    setTimeout(() => setSavedMessage(''), 4000);
  };

  const handleProvisionNewProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!provResortName.trim()) {
      alert('Please enter the New Property / Hotel Name.');
      return;
    }
    const modeLabel = provCleanMode === 'fresh_slate_starter_rooms'
      ? 'Clean all guest stays & reset room inventory to 15 starter rooms'
      : 'Clean all guest bookings, stays, folios, and invoices, and mark all existing rooms Vacant & Clean';

    const confirmText = `⚠️ CONFIRM PROPERTY PROVISIONING\n\nAre you sure you want to provision "${provResortName}"?\n\nOperation:\n• ${modeLabel}\n• Set business date to: ${provBusinessDate}\n• All reports, folios, bills, and receipts will immediately display: "${provResortName}"\n\nThis action cannot be undone!`;

    if (window.confirm(confirmText)) {
      pmsService.provisionNewProperty({
        resortName: provResortName,
        address: provAddress || address,
        phone: provPhone || phone,
        email: provEmail || email,
        logoUrl: provLogoUrl || logoUrl,
        binNumber: provBin,
        tradeLicense: provLicense,
        currencySymbol: provCurrency,
        vatRate: Number(provVat),
        serviceCharge: Number(provServiceCharge),
        currentBusinessDate: provBusinessDate,
        cleanMode: provCleanMode
      });

      setResortName(provResortName);
      if (provLogoUrl) setLogoUrl(provLogoUrl);
      if (provAddress) setAddress(provAddress);
      if (provPhone) setPhone(provPhone);
      if (provEmail) setEmail(provEmail);
      setBinNumber(provBin);
      setTradeLicense(provLicense);
      setCurrencySymbol(provCurrency);
      setVatRate(Number(provVat));
      setServiceCharge(Number(provServiceCharge));

      setProvSuccess(`Property "${provResortName}" has been successfully provisioned! All previous guest records and invoices have been cleaned. All future reports will bear this property's name.`);
      setTimeout(() => setProvSuccess(''), 10000);
    }
  };

  const handleDownloadBackup = () => {
    try {
      const bakContent = pmsService.exportFullBakContent();
      const blob = new Blob([bakContent], { type: 'application/octet-stream;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', url);
      downloadAnchor.setAttribute('download', `LESync_PMS_Backup_${timestamp}.bak`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);

      setBackupMessage({ type: 'success', text: 'Enterprise database backup (.bak) downloaded successfully.' });
      setTimeout(() => setBackupMessage(null), 5000);
    } catch (err: any) {
      setBackupMessage({ type: 'error', text: `Backup export failed: ${err?.message || 'Error'}` });
    }
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const content = event.target?.result as string;
        let parsed: any;
        try {
          parsed = pmsService.parseBakContent(content);
        } catch {
          parsed = JSON.parse(content);
        }

        if (window.confirm(`Restore database from backup file "${file.name}"? This will overwrite the current active data.`)) {
          const result = pmsService.restoreFullBackupPayload(parsed);
          await cloudSqlSyncService.syncNow('Restored from Settings File Upload');
          setBackupMessage({
            type: 'success',
            text: `System restored successfully! (${result.details.rooms} rooms, ${result.details.reservations} reservations, ${result.details.folios} folios).`
          });
          setTimeout(() => setBackupMessage(null), 6000);
        }
      } catch (err: any) {
        setBackupMessage({ type: 'error', text: `Restore failed: ${err?.message || 'Invalid backup file'}` });
      }
    };
    reader.readAsText(file);
    if (restoreFileRef.current) restoreFileRef.current.value = '';
  };

  const handleResetData = () => {
    if (window.confirm('Reset database to clean seed state? This will restore initial rooms, bookings, and folios.')) {
      pmsService.resetToSeed();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 pb-12 text-slate-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center border border-amber-500/30 rounded-xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold tracking-tight">System Configuration & Administration</h1>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px]">
                LESync PMS
              </span>
            </div>
            <p className="text-slate-300 text-xs mt-0.5">
              Property parameters, Night Audit 06:00 AM automation, tax rules, service charge pools, document numbering, and manual data backup.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-900 border border-slate-800 p-1.5 rounded-xl overflow-x-auto scrollbar-thin">
        {[
          { id: 'property', label: 'System Settings & Property Profile', route: 'settings' },
          { id: 'onboarding', label: '🚀 Onboard New Property (Clean Slate)', route: 'admin-onboarding' },
          { id: 'tax', label: 'Tax & VAT Rates', route: 'admin-tax' },
          { id: 'service-charge', label: 'Service Charge Rules', route: 'admin-service-charge' },
          { id: 'numbering', label: 'Document Numbering Schemes', route: 'admin-numbering' },
          { id: 'audit', label: 'Night Audit Schedule', route: 'admin-audit' },
          { id: 'backup', label: 'Data Backup & Restore', route: 'admin-backup' }
        ].map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setActiveTab(t.id);
              if (onNavigate) onNavigate(t.route);
            }}
            className={`px-3.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors text-xs ${
              activeTab === t.id ? 'bg-amber-500 text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {savedMessage && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl flex items-center space-x-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {backupMessage && (
        <div className={`p-4 border rounded-xl flex items-center space-x-2 text-xs font-semibold ${
          backupMessage.type === 'success'
            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
            : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{backupMessage.text}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Property Identity Tab */}
        {activeTab === 'property' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <Building className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-slate-100 text-sm">Resort Property Identity</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">Property Name:</span>
                  <input
                    type="text"
                    value={resortName}
                    onChange={(e) => setResortName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs font-medium"
                    required
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Physical Address:</span>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block mb-1">Central Hotline:</span>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Official Email:</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block mb-1">Website / Domain:</span>
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="e.g. www.lesyncresort.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Default Currency Symbol:</span>
                    <input
                      type="text"
                      value={currencySymbol}
                      onChange={(e) => setCurrencySymbol(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
                {/* Property Logo Upload & Preview */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-slate-400 font-semibold block text-xs flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <Image className="w-3.5 h-3.5 text-amber-400" />
                      <span>Property Logo (Used for Invoices & Quotation PDFs)</span>
                    </span>
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="text-rose-400 hover:text-rose-300 text-[10px] font-medium"
                      >
                        Remove Logo
                      </button>
                    )}
                  </span>
                  <div className="flex items-center space-x-3">
                    {logoUrl ? (
                      <div className="w-16 h-12 rounded-lg bg-white p-1 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                        <img src={logoUrl} alt="Property Logo" className="max-h-full max-w-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-16 h-12 rounded-lg bg-slate-900 border border-dashed border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                        <Building className="w-5 h-5 opacity-40" />
                      </div>
                    )}
                    <div className="flex-1 space-y-1.5">
                      <input
                        type="text"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="Image URL or upload image file below"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-mono"
                      />
                      <label className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-medium cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        <span>Upload Logo File (PNG / JPG)</span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (uploadEvent) => {
                                if (typeof uploadEvent.target?.result === 'string') {
                                  setLogoUrl(uploadEvent.target.result);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block mb-1">BIN / VAT Registration #:</span>
                    <input
                      type="text"
                      value={binNumber}
                      onChange={(e) => setBinNumber(e.target.value)}
                      placeholder="e.g. 001928472-0102"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Gov. Resort / Trade License #:</span>
                    <input
                      type="text"
                      value={tradeLicense}
                      onChange={(e) => setTradeLicense(e.target.value)}
                      placeholder="e.g. CCU-2026-BD"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <Clock className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-slate-100 text-sm">Operating Times & Policies</h3>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block mb-1">Standard Check-In Time:</span>
                    <input
                      type="time"
                      value={checkInTime}
                      onChange={(e) => setCheckInTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Standard Check-Out Time:</span>
                    <input
                      type="time"
                      value={checkOutTime}
                      onChange={(e) => setCheckOutTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-200 block">Allow Overbooking</span>
                      <p className="text-[11px] text-slate-400">Permit reservations past 100% capacity threshold</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowOverbooking}
                      onChange={e => setAllowOverbooking(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700"
                    />
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-800 pt-2.5">
                    <div>
                      <span className="font-bold text-slate-200 block">Require Advance Deposit</span>
                      <p className="text-[11px] text-slate-400">Mandate at least 50% deposit before confirmation</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={requireDeposit}
                      onChange={e => setRequireDeposit(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700"
                    />
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-800 pt-2.5">
                    <div>
                      <span className="font-bold text-slate-200 block">Auto-Dirty on Guest Checkout</span>
                      <p className="text-[11px] text-slate-400">Automatically flag room status as 'Dirty' upon front desk departure</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoDirtyOnCheckout}
                      onChange={e => setAutoDirtyOnCheckout(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700"
                    />
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-800 pt-2.5">
                    <div>
                      <span className="font-bold text-slate-200 block">Direct Room Posting from Outlets</span>
                      <p className="text-[11px] text-slate-400">Enable POS stations to post dining and spa tabs to active guest room folios</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowDirectRoomPost}
                      onChange={e => setAllowDirectRoomPost(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700"
                    />
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-800 pt-2.5">
                    <div>
                      <span className="font-bold text-slate-200 block">Enforce Strict Stop-Post Lock</span>
                      <p className="text-[11px] text-slate-400">Reject all department room charges when a guest folio has Stop-Post activated</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={stopPostStrict}
                      onChange={e => setStopPostStrict(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Onboarding New Property Tab */}
        {activeTab === 'onboarding' && (
          <div className="space-y-6">
            {/* Guide Steps */}
            <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-indigo-500/10 border border-amber-500/30 rounded-2xl p-5 space-y-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-slate-100 text-sm">How to Hand Over to New Property Customers</h3>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                Follow these 3 simple steps to completely prepare this PMS for a new hotel or resort client. All previous guest bookings, stays, folios, bills, and orders will be wiped clean, and all future invoices and reports will be branded with their property identity.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <div className="text-amber-400 font-bold text-xs mb-1 flex items-center space-x-1.5">
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center">1</span>
                    <span>Clean & Brand Property</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Fill the form below with the new property's name, address, hotline, and BIN. Click <strong>Provision New Property</strong> to wipe all test bookings and set report headers.
                  </p>
                </div>

                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <div className="text-cyan-400 font-bold text-xs mb-1 flex items-center space-x-1.5">
                    <span className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-black flex items-center justify-center">2</span>
                    <span>Register Rooms & Tariffs</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Navigate to <strong>Room Setup / Room Rack</strong> in the sidebar to add their exact room numbers, floor layout, room categories, and base nightly rates.
                  </p>
                </div>

                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <div className="text-emerald-400 font-bold text-xs mb-1 flex items-center space-x-1.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black flex items-center justify-center">3</span>
                    <span>Create Staff Accounts</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Navigate to <strong>User Management / Access Control</strong> to register the property's general manager, front desk receptionists, and night auditors with secure RBAC roles.
                  </p>
                </div>
              </div>
            </div>

            {provSuccess && (
              <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 rounded-2xl flex items-center space-x-3 text-xs font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="space-y-1">
                  <p className="font-bold text-emerald-300">{provSuccess}</p>
                  <p className="text-[11px] text-emerald-400/90">
                    You can now begin adding reservations or customize room numbers in the sidebar!
                  </p>
                </div>
              </div>
            )}

            {/* Provisioning Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Building className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm">New Property Customer Registration & Database Sanitization</h3>
                    <p className="text-[11px] text-slate-400">This form updates all report headers and cleans previous customer data.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
                <div className="space-y-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      New Hotel / Resort Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={provResortName}
                      onChange={(e) => setProvResortName(e.target.value)}
                      placeholder="e.g. Grand Vista Resort & Spa"
                      className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3.5 py-2.5 text-slate-100 text-xs font-bold focus:outline-hidden focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Full Physical Address</label>
                    <input
                      type="text"
                      value={provAddress}
                      onChange={(e) => setProvAddress(e.target.value)}
                      placeholder="e.g. Marine Drive, Cox's Bazar, Bangladesh"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Central Hotline / Phone</label>
                      <input
                        type="text"
                        value={provPhone}
                        onChange={(e) => setProvPhone(e.target.value)}
                        placeholder="e.g. +880 1819-000111"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Official Support Email</label>
                      <input
                        type="email"
                        value={provEmail}
                        onChange={(e) => setProvEmail(e.target.value)}
                        placeholder="e.g. contact@grandvista.com"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Tax Identification / BIN #</label>
                      <input
                        type="text"
                        value={provBin}
                        onChange={(e) => setProvBin(e.target.value)}
                        placeholder="e.g. BIN-00998877-0101"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Gov. Trade / Hotel License #</label>
                      <input
                        type="text"
                        value={provLicense}
                        onChange={(e) => setProvLicense(e.target.value)}
                        placeholder="e.g. TR-2026-HOTEL-88"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Property Logo (Image URL or File Upload)</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={provLogoUrl}
                        onChange={(e) => setProvLogoUrl(e.target.value)}
                        placeholder="e.g. https://... or upload below"
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs font-mono"
                      />
                      <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer border border-slate-700 shrink-0">
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onload = ev => {
                                if (typeof ev.target?.result === 'string') {
                                  setProvLogoUrl(ev.target.result);
                                }
                              };
                              r.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Currency Symbol</label>
                      <input
                        type="text"
                        value={provCurrency}
                        onChange={(e) => setProvCurrency(e.target.value)}
                        placeholder="৳, $, €, £"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">VAT / Tax Rate %</label>
                      <input
                        type="number"
                        value={provVat}
                        onChange={(e) => setProvVat(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Service Charge %</label>
                      <input
                        type="number"
                        value={provServiceCharge}
                        onChange={(e) => setProvServiceCharge(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Starting PMS Business Date</label>
                    <input
                      type="date"
                      value={provBusinessDate}
                      onChange={(e) => setProvBusinessDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs font-mono"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      This will be set as the initial operational business date for the Night Audit cycle.
                    </span>
                  </div>

                  {/* Clean Mode Selection */}
                  <div className="pt-2 space-y-2">
                    <label className="text-slate-300 font-semibold block">Select Data Cleaning Mode:</label>
                    <div className="space-y-2">
                      <label className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition ${
                        provCleanMode === 'clean_transactions_keep_rooms'
                          ? 'bg-amber-500/10 border-amber-500/50 text-slate-100'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}>
                        <input
                          type="radio"
                          name="provCleanMode"
                          checked={provCleanMode === 'clean_transactions_keep_rooms'}
                          onChange={() => setProvCleanMode('clean_transactions_keep_rooms')}
                          className="mt-0.5 text-amber-500"
                        />
                        <div>
                          <span className="font-bold block text-xs">Option A: Clean All Transaction & Guest Data (Keep Room Numbers)</span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            Deletes all previous bookings, stays, folios, invoices, and restaurant orders. Keeps existing room numbers, but sets every single room to <strong>Vacant & Clean</strong>.
                          </span>
                        </div>
                      </label>

                      <label className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition ${
                        provCleanMode === 'fresh_slate_starter_rooms'
                          ? 'bg-amber-500/10 border-amber-500/50 text-slate-100'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}>
                        <input
                          type="radio"
                          name="provCleanMode"
                          checked={provCleanMode === 'fresh_slate_starter_rooms'}
                          onChange={() => setProvCleanMode('fresh_slate_starter_rooms')}
                          className="mt-0.5 text-amber-500"
                        />
                        <div>
                          <span className="font-bold block text-xs">Option B: Complete Clean Slate (15 Fresh Starter Rooms)</span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            Deletes all previous data and generates a clean starter set of 15 rooms (10 Deluxe + 5 Executive Suites) ready for custom numbering in Room Setup.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center space-x-2 text-[11px] text-rose-400">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Permanent action: all previous demo guest bookings and invoices will be purged.</span>
                </div>
                <button
                  type="button"
                  onClick={handleProvisionNewProperty}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl transition shadow-lg flex items-center justify-center space-x-2 text-xs cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Provision New Property & Clean Database</span>
                </button>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'tax' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Percent className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-slate-100 text-sm">Tax & Statutory VAT Configuration</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Standard VAT Rate (%):</span>
                <input
                  type="number"
                  step="0.1"
                  value={vatRate}
                  onChange={e => setVatRate(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-xs font-bold"
                  required
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Applicable to all guest rooms, banquets, and point-of-sale bills (National NBR rate: 15%).
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-center">
                <span className="text-[11px] text-slate-400">GL Account Linkage:</span>
                <span className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                  2100 (VAT Payable - Current Liabilities)
                </span>
                <span className="text-[11px] text-slate-500 mt-1">
                  Tax automatically credits GL 2100 on every room charge posting and POS invoice settlement.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Service Charge Tab */}
        {activeTab === 'service-charge' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-slate-100 text-sm">Service Charge & Gratuity Rules</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Service Charge Rate (%):</span>
                <input
                  type="number"
                  step="0.1"
                  value={serviceCharge}
                  onChange={e => setServiceCharge(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-xs font-bold"
                  required
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Standard hospitality pool rate (10%). Distributed to operational staff monthly.
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-center">
                <span className="text-[11px] text-slate-400">GL Account Linkage:</span>
                <span className="text-xs font-mono font-bold text-amber-400 mt-0.5">
                  2110 (Service Charge Payable - Current Liabilities)
                </span>
                <span className="text-[11px] text-slate-500 mt-1">
                  Service charge automatically credits GL 2110 for transparent audit reporting.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Document Numbering Tab */}
        {activeTab === 'numbering' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Hash className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">System Voucher & Document Numbering Schemes</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Configure document serial prefixes, zero-padding lengths, and year/month date markers.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition shadow-xs text-xs self-start sm:self-auto"
              >
                <Save className="w-4 h-4" />
                <span>Save Numbering Schemes</span>
              </button>
            </div>

            {/* Sequence Formatting Controls */}
            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Sequence Number Zero Padding</label>
                <select
                  value={numberPadding}
                  onChange={e => setNumberPadding(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-xs font-bold"
                >
                  <option value={4}>4 Digits (e.g. 0001)</option>
                  <option value={5}>5 Digits (e.g. 00001)</option>
                  <option value={6}>6 Digits (e.g. 000001)</option>
                  <option value={7}>7 Digits (e.g. 0000001)</option>
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Determines the fixed length of serial numbers in folios and vouchers.
                </span>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Date Insertion Pattern</label>
                <select
                  value={numberDateFormat}
                  onChange={e => setNumberDateFormat(e.target.value as 'NONE' | 'YYYY' | 'YYMM')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-xs font-bold"
                >
                  <option value="YYYY">Yearly Prefix (e.g. INV-2026-00042)</option>
                  <option value="YYMM">Monthly Prefix (e.g. INV-2608-00042)</option>
                  <option value="NONE">Continuous Without Date (e.g. INV-00042)</option>
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Inserts fiscal calendar year or month segment to avoid yearly serial overlap.
                </span>
              </div>
            </div>

            {/* Prefix Grid with Live Preview Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {[
                { label: 'Guest Folio Prefix', value: folioPrefix, setter: setFolioPrefix, desc: 'Assigned to active guest bills upon check-in' },
                { label: 'Tax Invoice Prefix', value: invPrefix, setter: setInvPrefix, desc: 'Final VAT-compliant tax invoice given to guest' },
                { label: 'Room Reservation Prefix', value: resPrefix, setter: setResPrefix, desc: 'Central booking confirmation reference' },
                { label: 'Banquet & Event Order', value: banquetPrefix, setter: setBanquetPrefix, desc: 'Convention halls and banquet bookings' },
                { label: 'Restaurant / POS Receipt', value: posPrefix, setter: setPosPrefix, desc: 'Dining, bar, and spa outlet cash receipts' },
                { label: 'Kitchen Order Ticket (KOT)', value: kotPrefix, setter: setKotPrefix, desc: 'Culinary order printouts sent to kitchen' },
                { label: 'Purchase Order (PO)', value: poPrefix, setter: setPoPrefix, desc: 'Official vendor procurement orders' },
                { label: 'Goods Received Note (GRN)', value: grnPrefix, setter: setGrnPrefix, desc: 'Store receiving vouchers for inventory' },
                { label: 'Journal Voucher (JV)', value: jvPrefix, setter: setJvPrefix, desc: 'General ledger double-entry voucher' },
                { label: 'Cash Receipt Voucher', value: receiptPrefix, setter: setReceiptPrefix, desc: 'Tender receipt for payment collections' }
              ].map((scheme, idx) => {
                const datePart = numberDateFormat === 'YYYY' ? '2026-' : numberDateFormat === 'YYMM' ? '2608-' : '';
                const sample = `${scheme.value}${datePart}${'42'.padStart(numberPadding, '0')}`;
                return (
                  <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-bold">{scheme.label}:</span>
                      <span className="font-mono text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {sample}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={scheme.value}
                      onChange={e => scheme.setter(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono text-xs font-bold"
                    />
                    <p className="text-[10px] text-slate-500">{scheme.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Audit Tab */}
        {activeTab === 'audit' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Moon className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-slate-100 text-sm">Automated Night Audit Service (06:00 AM)</h3>
              </div>
              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold rounded-full border border-indigo-500/30">
                Biz Date: {db.settings?.currentBusinessDate || '2026-09-22'}
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <span className="font-bold text-slate-200 block">Auto Night Audit Service</span>
                  <p className="text-[11px] text-slate-400">
                    Automatically posts daily room charges and rolls the operational day at 06:00 AM.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoNightAuditEnabled}
                  onChange={e => setAutoNightAuditEnabled(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block mb-1">Scheduled Close Time (24H):</span>
                  <input
                    type="time"
                    value={autoNightAuditTime}
                    onChange={e => setAutoNightAuditTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-xs font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Last Audit Executed:</span>
                  <input
                    type="text"
                    disabled
                    value={db.settings?.lastNightAuditDate || 'Never'}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-slate-400 font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Backup & Restore Tab */}
        {activeTab === 'backup' && (
          <div className="space-y-5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-slate-100 text-sm">Manual Database Backup & State Snapshots</h3>
                </div>
                {onNavigateToBackup && (
                  <button
                    type="button"
                    onClick={onNavigateToBackup}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline"
                  >
                    Open Full Backup Center →
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Download Backup Box */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <div>
                    <h4 className="font-bold text-slate-200">1. Download Enterprise Backup (.bak)</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Export complete property state archive (.bak) with rooms, folios, invoices, guests, and settings for server deployment.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center space-x-2 transition shadow-xs cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Enterprise Backup (.bak)</span>
                  </button>
                </div>

                {/* Restore Backup Box */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <div>
                    <h4 className="font-bold text-slate-200">2. Restore from Backup File (.bak)</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Upload an exported `.bak` (or `.json`) database backup archive to restore the entire property system.
                    </p>
                  </div>
                  <input
                    ref={restoreFileRef}
                    type="file"
                    accept=".bak,.json"
                    onChange={handleRestoreFile}
                    className="hidden"
                    id="settings-restore-file"
                  />
                  <label
                    htmlFor="settings-restore-file"
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold flex items-center justify-center space-x-2 transition cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <span>Upload & Restore Backup (.bak)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'onboarding' && activeTab !== 'backup' && (
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition shadow text-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>
                {activeTab === 'tax' ? 'Save Tax & VAT Rates' :
                 activeTab === 'service-charge' ? 'Save Service Charge Rules' :
                 activeTab === 'numbering' ? 'Save Numbering Schemes' :
                 activeTab === 'audit' ? 'Save Night Audit Schedule' :
                 'Save System Settings'}
              </span>
            </button>
          </div>
        )}
      </form>

      {/* Database Maintenance Tools */}
      <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-5 space-y-3">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <h3 className="font-bold text-rose-400 text-sm">Development Database Utilities</h3>
        </div>
        <p className="text-slate-400 text-xs">
          Reset all rooms, reservations, in-house stays, convention bookings, and folios to default development seed data.
        </p>
        <button
          type="button"
          onClick={handleResetData}
          className="flex items-center space-x-1.5 px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold rounded-xl border border-rose-500/30 transition text-xs"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset to Clean Seed State</span>
        </button>
      </div>
    </div>
  );
};
