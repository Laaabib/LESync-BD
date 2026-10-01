import React, { useState, useEffect } from 'react';
import {
  Fingerprint, ScanFace, Cpu, Network, Wifi, Radio, RefreshCw, Plus,
  CheckCircle2, AlertCircle, Clock, Trash2, Edit3, Shield, UserPlus,
  Play, RotateCw, Settings, Search, Check, X, ArrowDownCircle, ArrowUpCircle,
  Activity, Server, FileText, Lock, ExternalLink
} from 'lucide-react';
import { BiometricDevice, BiometricLogEntry, BiometricDeviceModel, Employee, BiometricModality } from '../../types/hrTypes';
import { biometricService } from '../../services/biometricService';
import { hrService } from '../../services/hrService';

interface BiometricDevicesManagerProps {
  onRefreshParentAttendance?: () => void;
}

export const BiometricDevicesManager: React.FC<BiometricDevicesManagerProps> = ({
  onRefreshParentAttendance
}) => {
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [logs, setLogs] = useState<BiometricLogEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Modals state
  const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<BiometricDevice | null>(null);
  const [isPushEmployeeModalOpen, setIsPushEmployeeModalOpen] = useState(false);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);

  // Device Form state
  const [devName, setDevName] = useState('');
  const [devIp, setDevIp] = useState('');
  const [devPort, setDevPort] = useState('4370');
  const [devCommKey, setDevCommKey] = useState('0');
  const [devModel, setDevModel] = useState<BiometricDeviceModel>('ZKTeco K40');
  const [devLocation, setDevLocation] = useState('');
  const [devDepartment, setDevDepartment] = useState('All Departments');
  const [devConnType, setDevConnType] = useState<'Ethernet TCP/IP' | 'WiFi' | 'RS485' | 'Cloud ADMS Push'>('Ethernet TCP/IP');
  const [devNotes, setDevNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [isTestingFormIp, setIsTestingFormIp] = useState(false);
  const [formTestResult, setFormTestResult] = useState<{ success: boolean; message: string; latency?: number } | null>(null);

  // Push Employee Form state
  const [pushSelectedEmpId, setPushSelectedEmpId] = useState('');
  const [pushTargetDeviceId, setPushTargetDeviceId] = useState('all');
  const [pushPrivilege, setPushPrivilege] = useState<'Standard User' | 'Enroller' | 'Manager' | 'Super Administrator'>('Standard User');
  const [pushBiometricType, setPushBiometricType] = useState<BiometricModality[]>(['Fingerprint']);
  const [pushCardNumber, setPushCardNumber] = useState('');
  const [isPushing, setIsPushing] = useState(false);

  // Live Simulate Form state
  const [simEmpId, setSimEmpId] = useState('');
  const [simDeviceId, setSimDeviceId] = useState('');
  const [simPunchType, setSimPunchType] = useState<'Check-In' | 'Check-Out'>('Check-In');
  const [simVerifyMethod, setSimVerifyMethod] = useState<'Fingerprint' | 'Face' | 'RFID Card'>('Fingerprint');

  // Status & Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [isTestingId, setIsTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{ [id: string]: { success: boolean; latency: number; message: string } }>({});

  // Filter logs
  const [logFilterDevice, setLogFilterDevice] = useState('All');
  const [logSearch, setLogSearch] = useState('');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const refreshAll = () => {
    setDevices(biometricService.getDevices());
    setLogs(biometricService.getLogs());
    setEmployees(hrService.getEmployees());
  };

  useEffect(() => {
    refreshAll();
  }, []);

  // Pre-fill edit modal
  const handleOpenEdit = (dev: BiometricDevice) => {
    setEditingDevice(dev);
    setDevName(dev.name);
    setDevIp(dev.ipAddress);
    setDevPort(String(dev.port));
    setDevCommKey(String(dev.commKey));
    setDevModel(dev.model);
    setDevLocation(dev.location);
    setDevDepartment(dev.department || 'All Departments');
    setDevConnType(dev.connectionType);
    setDevNotes(dev.notes || '');
    setFormError('');
    setFormTestResult(null);
    setIsAddDeviceModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingDevice(null);
    setDevName('ZKTeco Access Gate');
    setDevIp('192.168.1.204');
    setDevPort('4370');
    setDevCommKey('0');
    setDevModel('ZKTeco K40');
    setDevLocation('Staff Entry Gate');
    setDevDepartment('All Departments');
    setDevConnType('Ethernet TCP/IP');
    setDevNotes('ZKTeco TCP/IP biometric attendance terminal');
    setFormError('');
    setFormTestResult(null);
    setIsAddDeviceModalOpen(true);
  };

  const handleTestFormConnection = async () => {
    if (!devIp.trim()) {
      setFormError('Please enter an IP address first.');
      return;
    }
    setIsTestingFormIp(true);
    setFormError('');
    try {
      const res = await biometricService.testConnection(devIp.trim(), Number(devPort) || 4370, Number(devCommKey) || 0);
      setFormTestResult({
        success: res.success,
        message: res.message,
        latency: res.latencyMs
      });
    } catch (err: any) {
      setFormTestResult({
        success: false,
        message: err.message || 'Connection failed to IP address.'
      });
    } finally {
      setIsTestingFormIp(false);
    }
  };

  const handleSaveDevice = () => {
    if (!devName.trim()) {
      setFormError('Device name is required.');
      return;
    }
    if (!devIp.trim()) {
      setFormError('Device IP address is required.');
      return;
    }

    if (editingDevice) {
      try {
        biometricService.updateDevice(editingDevice.id, {
          name: devName.trim(),
          ipAddress: devIp.trim(),
          port: Number(devPort) || 4370,
          commKey: devCommKey.trim(),
          model: devModel,
          location: devLocation.trim() || 'Access Gate',
          department: devDepartment,
          connectionType: devConnType,
          notes: devNotes.trim()
        });
        showToast(`Device "${devName}" updated successfully.`);
        setIsAddDeviceModalOpen(false);
        refreshAll();
      } catch (err: any) {
        setFormError(err.message || 'Error updating device.');
      }
    } else {
      const result = biometricService.addDevice({
        name: devName.trim(),
        ipAddress: devIp.trim(),
        port: Number(devPort) || 4370,
        commKey: devCommKey.trim(),
        model: devModel,
        location: devLocation.trim() || 'Access Gate',
        department: devDepartment,
        connectionType: devConnType,
        notes: devNotes.trim()
      });

      if (!result.success) {
        setFormError(result.error || 'Failed to add biometric device.');
        return;
      }

      showToast(`Biometric device "${devName}" at ${devIp}:${devPort} added successfully.`);
      setIsAddDeviceModalOpen(false);
      refreshAll();
    }
  };

  const handleDeleteDevice = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove the biometric terminal "${name}"?`)) {
      biometricService.deleteDevice(id);
      showToast(`Device "${name}" deleted.`);
      refreshAll();
    }
  };

  const handlePingDevice = async (dev: BiometricDevice) => {
    setIsTestingId(dev.id);
    try {
      const res = await biometricService.testConnection(dev.ipAddress, dev.port, Number(dev.commKey) || 0);
      setTestResults(prev => ({
        ...prev,
        [dev.id]: {
          success: res.success,
          latency: res.latencyMs,
          message: res.message
        }
      }));
      showToast(`Ping ${dev.ipAddress}: ACK received in ${res.latencyMs}ms. ${res.message}`);
    } catch (err: any) {
      showToast(`Connection failed to ${dev.ipAddress}: ${err.message}`, 'error');
    } finally {
      setIsTestingId(null);
    }
  };

  const handleSyncDevice = async (deviceId?: string) => {
    setIsSyncingAll(true);
    try {
      const res = await biometricService.syncAttendanceLogs(deviceId);
      if (res.success) {
        showToast(res.message);
        refreshAll();
        if (onRefreshParentAttendance) {
          onRefreshParentAttendance();
        }
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(`Sync failed: ${err.message}`, 'error');
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handlePushAllStaff = async (deviceId?: string) => {
    if (confirm('Push all active employees and their unique IDs to the biometric terminal memory?')) {
      const res = await biometricService.pushAllEmployeesToDevice(deviceId);
      showToast(res.message);
      refreshAll();
    }
  };

  const handleOpenPushSingleModal = (defaultEmpId?: string) => {
    setPushSelectedEmpId(defaultEmpId || employees[0]?.id || '');
    setPushTargetDeviceId('all');
    setPushPrivilege('Standard User');
    setPushBiometricType(['Fingerprint']);
    setPushCardNumber(`CARD-${Math.floor(10000000 + Math.random() * 90000000)}`);
    setIsPushEmployeeModalOpen(true);
  };

  const handleExecutePushEmployee = async () => {
    if (!pushSelectedEmpId) return;
    setIsPushing(true);
    try {
      const res = await biometricService.pushEmployeeToDevice(
        pushSelectedEmpId,
        pushTargetDeviceId === 'all' ? undefined : pushTargetDeviceId,
        pushPrivilege,
        pushBiometricType
      );
      if (res.success) {
        showToast(res.message);
        setIsPushEmployeeModalOpen(false);
        refreshAll();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(`Push failed: ${err.message}`, 'error');
    } finally {
      setIsPushing(false);
    }
  };

  const handleExecuteSimulatePunch = async () => {
    if (!simEmpId || !simDeviceId) {
      showToast('Please select both an employee and a terminal.', 'error');
      return;
    }
    try {
      const res = await biometricService.simulateLivePunch(simEmpId, simDeviceId, simPunchType, simVerifyMethod);
      showToast(res.message);
      setIsSimulateModalOpen(false);
      refreshAll();
      if (onRefreshParentAttendance) {
        onRefreshParentAttendance();
      }
    } catch (err: any) {
      showToast(`Test punch failed: ${err.message}`, 'error');
    }
  };

  const handleSyncClock = async (deviceId: string) => {
    const res = await biometricService.syncDeviceTime(deviceId);
    showToast(res.message);
  };

  const handleClearBuffer = async (deviceId: string) => {
    if (confirm('Clear processed logs buffer from this terminal?')) {
      const res = await biometricService.clearDeviceLogs(deviceId);
      showToast(res.message);
      refreshAll();
    }
  };

  const handleRestartDevice = async (deviceId: string) => {
    if (confirm('Send warm reboot signal to this biometric terminal?')) {
      const res = await biometricService.restartDevice(deviceId);
      showToast(res.message);
      refreshAll();
    }
  };

  // Filter logs
  const filteredLogs = logs.filter(l => {
    const matchDevice = logFilterDevice === 'All' || l.deviceId === logFilterDevice;
    const matchSearch =
      l.employeeName.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.employeeCode.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.deviceIp.includes(logSearch) ||
      l.deviceName.toLowerCase().includes(logSearch.toLowerCase());
    return matchDevice && matchSearch;
  });

  const totalLogsAcrossFleet = devices.reduce((sum, d) => sum + (d.totalLogsCount || 0), 0);
  const enrolledStaffCount = employees.filter(e => e.biometricEnrollment?.isEnrolled).length;

  return (
    <div className="space-y-4">
      {/* Toast Feedback */}
      {feedback && (
        <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-lg transition-all ${
          feedback.type === 'success'
            ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
            : feedback.type === 'error'
            ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
            : 'bg-blue-950/90 border-blue-500/50 text-blue-200'
        }`}>
          <div className="flex items-center space-x-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white ml-3">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center border border-amber-500/30 shadow-inner">
            <Fingerprint className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-100">
                Biometric Device Fleet Controller (ZKTeco TCP/IP)
              </h2>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ZKTeco Protocol Online
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Manage IP-connected biometric terminals, push employees with unique IDs, and pull real-time shift punches.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleSyncDevice()}
            disabled={isSyncingAll}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition shadow-sm text-xs cursor-pointer disabled:opacity-50"
            title="Poll all online biometric devices and pull latest punches into HR attendance"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
            <span>{isSyncingAll ? 'Syncing Fleet...' : 'Sync All Punches'}</span>
          </button>

          <button
            onClick={() => handlePushAllStaff()}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-semibold transition text-xs cursor-pointer"
            title="Push all active employees and their unique IDs to devices"
          >
            <ArrowUpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Push All Staff</span>
          </button>

          <button
            onClick={() => {
              setSimEmpId(employees[0]?.id || '');
              setSimDeviceId(devices[0]?.id || '');
              setIsSimulateModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/80 rounded-lg font-semibold transition text-xs cursor-pointer"
            title="Simulate live biometric scan from physical terminal"
          >
            <Play className="w-3.5 h-3.5 text-indigo-400" />
            <span>Test Punch</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition shadow text-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Device (IP)</span>
          </button>
        </div>
      </div>

      {/* Fleet Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-[11px] block">Connected Terminals</span>
            <strong className="text-base font-bold text-slate-100">{devices.length} Devices Online</strong>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Network className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-[11px] block">Staff Enrolled on Device</span>
            <strong className="text-base font-bold text-emerald-400">
              {enrolledStaffCount} / {employees.length} Staff
            </strong>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Fingerprint className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-[11px] block">Total Biometric Logs</span>
            <strong className="text-base font-bold text-amber-400">{totalLogsAcrossFleet + logs.length} Records</strong>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-[11px] block">Standard Port / Comm</span>
            <strong className="text-base font-bold text-slate-100">TCP 4370 (ZKTeco)</strong>
          </div>
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Server className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Device Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {devices.map(dev => {
          const testRes = testResults[dev.id];
          const isTesting = isTestingId === dev.id;

          return (
            <div
              key={dev.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl shadow-sm flex flex-col justify-between transition-all group"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0">
                      {dev.model.includes('uFace') ? (
                        <ScanFace className="w-5 h-5 text-purple-400" />
                      ) : dev.model.includes('IN01') ? (
                        <Cpu className="w-5 h-5 text-blue-400" />
                      ) : (
                        <Fingerprint className="w-5 h-5 text-amber-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-slate-100 truncate" title={dev.name}>
                        {dev.name}
                      </h3>
                      <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 mt-0.5">
                        <span className="font-semibold text-slate-300">{dev.model}</span>
                        <span>•</span>
                        <span className="truncate">{dev.location}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 flex items-center gap-1 ${
                    dev.status === 'Online'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : dev.status === 'Syncing'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      dev.status === 'Online' ? 'bg-emerald-400' : 'bg-blue-400 animate-ping'
                    }`}></span>
                    {dev.status}
                  </span>
                </div>

                {/* Network & IP Address Specs */}
                <div className="mt-3 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500 font-sans text-[10px] uppercase font-bold">IP Address:</span>
                    <strong className="text-amber-400 font-bold tracking-tight">
                      {dev.ipAddress}:{dev.port}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span className="text-slate-500 font-sans uppercase font-semibold">CommKey / Pass:</span>
                    <span>{dev.commKey || '0 (Default)'}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span className="text-slate-500 font-sans uppercase font-semibold">Protocol:</span>
                    <span>{dev.connectionType}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span className="text-slate-500 font-sans uppercase font-semibold">Serial No:</span>
                    <span className="truncate max-w-[130px]">{dev.serialNumber || 'ZK-GEN-01'}</span>
                  </div>
                </div>

                {/* Enrolled Counts Strip */}
                <div className="grid grid-cols-3 gap-1.5 mt-2.5 text-center text-[10px]">
                  <div className="bg-slate-800/60 p-1.5 rounded border border-slate-700/50">
                    <span className="text-slate-400 block text-[9px]">Enrolled Users</span>
                    <strong className="text-slate-200 text-xs font-mono font-bold">
                      {dev.enrolledUsersCount || 0}
                    </strong>
                  </div>
                  <div className="bg-slate-800/60 p-1.5 rounded border border-slate-700/50">
                    <span className="text-slate-400 block text-[9px]">Fingerprints</span>
                    <strong className="text-slate-200 text-xs font-mono font-bold">
                      {dev.enrolledFingerprintsCount || 0}
                    </strong>
                  </div>
                  <div className="bg-slate-800/60 p-1.5 rounded border border-slate-700/50">
                    <span className="text-slate-400 block text-[9px]">Punches</span>
                    <strong className="text-amber-400 text-xs font-mono font-bold">
                      {dev.totalLogsCount || 0}
                    </strong>
                  </div>
                </div>

                {/* Last Sync Indicator */}
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Last synced:</span>
                  <span className="font-mono text-slate-400">
                    {dev.lastSyncedAt ? new Date(dev.lastSyncedAt).toLocaleTimeString() : 'Never'}
                  </span>
                </div>

                {testRes && (
                  <div className="mt-2 p-1.5 bg-emerald-950/60 border border-emerald-500/30 rounded text-[10px] text-emerald-300 font-mono flex items-center justify-between">
                    <span>Ping latency: {testRes.latency}ms</span>
                    <span className="text-[9px] text-emerald-400">ACK OK</span>
                  </div>
                )}
              </div>

              {/* Card Footer Controls */}
              <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-1.5">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handlePingDevice(dev)}
                    disabled={isTesting}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition text-[11px] font-semibold flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                    title="Ping IP address and test TCP 4370 socket connection"
                  >
                    <Radio className={`w-3 h-3 text-emerald-400 ${isTesting ? 'animate-ping' : ''}`} />
                    <span>{isTesting ? 'Pinging...' : 'Ping IP'}</span>
                  </button>

                  <button
                    onClick={() => handleSyncDevice(dev.id)}
                    className="p-1.5 bg-blue-950/80 hover:bg-blue-900 text-blue-300 rounded border border-blue-800/60 transition text-[11px] font-semibold flex items-center space-x-1 cursor-pointer"
                    title="Pull biometric punches from this terminal"
                  >
                    <ArrowDownCircle className="w-3 h-3 text-blue-400" />
                    <span>Sync</span>
                  </button>

                  <button
                    onClick={() => handleOpenPushSingleModal()}
                    className="p-1.5 bg-purple-950/80 hover:bg-purple-900 text-purple-300 rounded border border-purple-800/60 transition text-[11px] font-semibold flex items-center space-x-1 cursor-pointer"
                    title="Enroll an employee onto this device"
                  >
                    <UserPlus className="w-3 h-3 text-purple-400" />
                    <span>Enroll Staff</span>
                  </button>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleSyncClock(dev.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition cursor-pointer"
                    title="Synchronize hardware clock with PMS server time"
                  >
                    <Clock className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleOpenEdit(dev)}
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition cursor-pointer"
                    title="Edit terminal settings"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteDevice(dev.id, dev.name)}
                    className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 rounded transition cursor-pointer"
                    title="Delete terminal from system"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-time Biometric Punch Logs Registry */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
        <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <Activity className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-slate-200">
              Live Biometric Attendance Audit Registry (ZKTeco Raw Stream)
            </h3>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">
              {filteredLogs.length} Recent Punches
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff, code, IP..."
                value={logSearch}
                onChange={e => setLogSearch(e.target.value)}
                className="pl-8 pr-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-[11px] text-slate-200 w-44 focus:outline-none focus:border-amber-500"
              />
            </div>

            <select
              value={logFilterDevice}
              onChange={e => setLogFilterDevice(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] text-slate-200 focus:outline-none"
            >
              <option value="All">All Biometric Devices</option>
              {devices.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto max-h-72 overflow-y-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-950/80 text-slate-400 sticky top-0 border-b border-slate-800 text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Employee Name</th>
                <th className="py-2.5 px-3">Unique Code</th>
                <th className="py-2.5 px-3">Device & IP</th>
                <th className="py-2.5 px-3">Device UID</th>
                <th className="py-2.5 px-3">Punch Type</th>
                <th className="py-2.5 px-3">Verification</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-[11px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No biometric punch logs recorded yet. Click "Sync All Punches" or "Test Punch" to test synchronization.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2 px-3 font-mono text-slate-400">
                      {new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • {new Date(l.timestamp).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-100">
                      {l.employeeName}
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono font-bold border border-amber-500/20">
                        {l.employeeCode}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-300">
                      <div className="truncate max-w-[170px]" title={l.deviceName}>
                        {l.deviceName}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">{l.deviceIp}</div>
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-400">
                      #{l.deviceUserId}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        l.punchType === 'Check-In'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {l.punchType}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-300">
                      <span className="flex items-center space-x-1">
                        {l.verifyMethod === 'Face' ? (
                          <ScanFace className="w-3 h-3 text-purple-400" />
                        ) : (
                          <Fingerprint className="w-3 h-3 text-amber-400" />
                        )}
                        <span>{l.verifyMethod}</span>
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span>{l.status}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD / EDIT BIOMETRIC DEVICE */}
      {isAddDeviceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    {editingDevice ? 'Configure Biometric Terminal' : 'Add Biometric Device via IP Address'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Connect ZKTeco hardware over Local Network (TCP/IP 4370)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddDeviceModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-slate-200">
              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formTestResult && (
                <div className={`p-2.5 rounded-lg border flex items-center justify-between font-mono text-[11px] ${
                  formTestResult.success
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                }`}>
                  <div className="flex items-center space-x-2">
                    {formTestResult.success ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-rose-400" />}
                    <span>{formTestResult.message}</span>
                  </div>
                  {formTestResult.latency && <span>{formTestResult.latency}ms</span>}
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Device Name *</label>
                <input
                  type="text"
                  value={devName}
                  onChange={e => setDevName(e.target.value)}
                  placeholder="e.g. Front Gate Turnstile A"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-2">
                  <label className="block text-slate-400 mb-1 font-semibold">IP Address (Static/DHCP) *</label>
                  <input
                    type="text"
                    value={devIp}
                    onChange={e => setDevIp(e.target.value)}
                    placeholder="e.g. 192.168.1.201"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Port</label>
                  <input
                    type="number"
                    value={devPort}
                    onChange={e => setDevPort(e.target.value)}
                    placeholder="4370"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Comm Key (Password)</label>
                  <input
                    type="text"
                    value={devCommKey}
                    onChange={e => setDevCommKey(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-slate-500">ZKTeco default is 0</span>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Device Model</label>
                  <select
                    value={devModel}
                    onChange={e => setDevModel(e.target.value as BiometricDeviceModel)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="ZKTeco K40">ZKTeco K40 (Fingerprint & RFID)</option>
                    <option value="ZKTeco uFace800">ZKTeco uFace800 (Facial & Fingerprint)</option>
                    <option value="ZKTeco IN01-A">ZKTeco IN01-A (Rugged Battery)</option>
                    <option value="ZKTeco MB20">ZKTeco MB20 (Face/Finger Compact)</option>
                    <option value="ZKTeco SilkBio-101TC">ZKTeco SilkBio-101TC (SilkID)</option>
                    <option value="ZKTeco BioTime / SpeedFace">ZKTeco SpeedFace / BioTime</option>
                    <option value="eSSL / Realtime Biometric">eSSL / Realtime Standalone</option>
                    <option value="Generic ZK-Protocol (TCP/IP)">Generic ZK-Protocol (TCP/IP)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Physical Location</label>
                  <input
                    type="text"
                    value={devLocation}
                    onChange={e => setDevLocation(e.target.value)}
                    placeholder="e.g. Main Staff Turnstile"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Department Roster</label>
                  <select
                    value={devDepartment}
                    onChange={e => setDevDepartment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="All Departments">All Departments (General Access)</option>
                    <option value="Front Office">Front Office Only</option>
                    <option value="Housekeeping">Housekeeping Only</option>
                    <option value="Food & Beverage">Food & Beverage / Kitchen</option>
                    <option value="Human Resources">Human Resources & Executive</option>
                    <option value="Security & Safety">Security & Maintenance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Connection Protocol</label>
                <select
                  value={devConnType}
                  onChange={e => setDevConnType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="Ethernet TCP/IP">Ethernet TCP/IP (Direct Socket UDP/TCP 4370)</option>
                  <option value="WiFi">WiFi Wireless (TCP/IP 4370)</option>
                  <option value="Cloud ADMS Push">Cloud ADMS Push Protocol (/iclock/cdata)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleTestFormConnection}
                  disabled={isTestingFormIp}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-semibold transition cursor-pointer disabled:opacity-50 text-xs"
                >
                  <Radio className={`w-3.5 h-3.5 text-amber-400 ${isTestingFormIp ? 'animate-ping' : ''}`} />
                  <span>{isTestingFormIp ? 'Testing Socket...' : 'Test Connection'}</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsAddDeviceModalOpen(false)}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDevice}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition shadow"
                  >
                    {editingDevice ? 'Save Changes' : 'Add Device'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PUSH EMPLOYEE TO BIOMETRIC DEVICE */}
      {isPushEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    Push Employee to Biometric Terminal
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Transfers employee profile and unique ID to ZKTeco memory
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPushEmployeeModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-slate-200">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Select Employee *</label>
                <select
                  value={pushSelectedEmpId}
                  onChange={e => setPushSelectedEmpId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-purple-500 font-semibold"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name} — [{e.employeeCode}] ({e.department})
                    </option>
                  ))}
                </select>
              </div>

              {pushSelectedEmpId && (() => {
                const emp = employees.find(e => e.id === pushSelectedEmpId);
                if (!emp) return null;
                const numericUid = emp.biometricEnrollment?.deviceUserId || emp.employeeCode.replace(/\D/g, '') || '1001';

                return (
                  <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-1 font-mono text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-sans">Unique Employee ID:</span>
                      <strong className="text-amber-400 font-bold">{emp.employeeCode}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-sans">Device Enroll UID:</span>
                      <strong className="text-purple-300">#{numericUid}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-sans">Designation / Role:</span>
                      <span className="text-slate-300">{emp.designation}</span>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Target Biometric Terminal</label>
                <select
                  value={pushTargetDeviceId}
                  onChange={e => setPushTargetDeviceId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="all">Broadcast to All Connected Terminals ({devices.length} Devices)</option>
                  {devices.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.ipAddress})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">RFID Card / Badge #</label>
                  <input
                    type="text"
                    value={pushCardNumber}
                    onChange={e => setPushCardNumber(e.target.value)}
                    placeholder="e.g. CARD-8829103"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Device Privilege</label>
                  <select
                    value={pushPrivilege}
                    onChange={e => setPushPrivilege(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-purple-500"
                  >
                    <option value="Standard User">Standard User (Normal Punch)</option>
                    <option value="Enroller">Enroller (Can Register Others)</option>
                    <option value="Manager">Manager (Department Admin)</option>
                    <option value="Super Administrator">Super Administrator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Biometric Modalities Enrolled</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {[
                    { id: 'Fingerprint', label: 'Fingerprint Sensor' },
                    { id: 'Face', label: 'Facial Recognition' },
                    { id: 'RFID Card', label: 'Proximity Card' },
                    { id: 'PIN', label: 'Security PIN' }
                  ].map(b => (
                    <label key={b.id} className="flex items-center space-x-2 bg-slate-950 p-2 rounded-lg border border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pushBiometricType.includes(b.id as any)}
                        onChange={e => {
                          if (e.target.checked) {
                            setPushBiometricType(prev => [...prev, b.id as any]);
                          } else {
                            setPushBiometricType(prev => prev.filter(t => t !== b.id));
                          }
                        }}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-[11px] text-slate-300">{b.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPushEmployeeModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecutePushEmployee}
                  disabled={isPushing}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition shadow flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  <span>{isPushing ? 'Transmitting to IP...' : 'Push to Device'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LIVE TEST PUNCH SIMULATOR */}
      {isSimulateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold">
                  <Play className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    Live Hardware Punch Simulator
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Simulates physical biometric hardware scan and tests instant HR sync
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSimulateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-slate-200">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Select Employee *</label>
                <select
                  value={simEmpId}
                  onChange={e => setSimEmpId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-semibold"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name} — [{e.employeeCode}] ({e.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Physical Device *</label>
                <select
                  value={simDeviceId}
                  onChange={e => setSimDeviceId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  {devices.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.ipAddress}:{d.port})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Punch Event Type</label>
                  <select
                    value={simPunchType}
                    onChange={e => setSimPunchType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Check-In">Check-In (Duty Arrival)</option>
                    <option value="Check-Out">Check-Out (Shift End)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Verification Method</label>
                  <select
                    value={simVerifyMethod}
                    onChange={e => setSimVerifyMethod(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Fingerprint">Fingerprint Scan (Optical)</option>
                    <option value="Face">Facial Recognition (3D AI)</option>
                    <option value="RFID Card">RFID Proximity Card</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-[11px] text-indigo-300">
                <span className="font-bold block mb-0.5">Verification Flow:</span>
                Device sensor receives biometric sample → matches against device template memory → emits hardware beep/voice ACK → publishes packet over TCP socket → recorded directly into PMS HR attendance register!
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSimulateModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteSimulatePunch}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition shadow flex items-center space-x-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Simulate Biometric Scan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
