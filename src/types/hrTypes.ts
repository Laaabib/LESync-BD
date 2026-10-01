export type EmployeeStatus = 'Active' | 'On Leave' | 'Suspended' | 'Terminated';
export type ShiftType = 'Morning' | 'Evening' | 'Night' | 'General' | 'Rotational';

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface LeaveBalance {
  annual: number;
  casual: number;
  medical: number;
}

export type BiometricModality = 'Fingerprint' | 'Face' | 'RFID Card' | 'PIN' | 'PIN / Password';

export interface BiometricEnrollmentInfo {
  isEnrolled: boolean;
  deviceUserId: string; // ZKTeco / Biometric numeric Enroll ID (e.g. "1001", "1002")
  cardBadgeNumber?: string; // RFID 10-digit Card number
  privilege: 'Standard User' | 'Enroller' | 'Manager' | 'Super Administrator';
  biometricTypes: BiometricModality[];
  syncedDevices: string[]; // device IDs
  lastSyncedAt?: string;
}

export interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  designation: string;
  department: string;
  email: string;
  phone: string;
  roleId: string;
  roleName: string;
  shift: ShiftType;
  shiftTimings: string;
  joiningDate: string;
  salary: number;
  status: EmployeeStatus;
  avatar?: string;
  nationalId: string;
  address: string;
  bloodGroup: string;
  emergencyContact: EmergencyContact;
  leaveBalance: LeaveBalance;
  notes?: string;
  biometricEnrollment?: BiometricEnrollmentInfo;
}

export type LeaveType = 
  | 'Annual Leave' 
  | 'Sick / Medical Leave' 
  | 'Casual Leave' 
  | 'Maternity / Paternity' 
  | 'Compensatory Off' 
  | 'Unpaid Leave';

export type LeaveStatus = 'Pending Approval' | 'Approved' | 'Rejected';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  designation: string;
  department: string;
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  relieverName: string;
  contactDuringLeave: string;
  status: LeaveStatus;
  appliedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  remarks?: string;
}

export type AttendanceStatus = 'On Time' | 'Slight Delay' | 'Late' | 'Half Day' | 'On Leave' | 'Absent';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeCode: string;
  name: string;
  dept: string;
  designation: string;
  shift: string;
  inTime: string;
  outTime: string;
  overtimeHours?: number;
  status: AttendanceStatus;
  terminal: string;
  date: string;
}

export interface DepartmentSummary {
  id: string;
  name: string;
  code: string;
  head: string;
  headEmail: string;
  staffCount: number;
  budget: number;
  shifts: string;
  location: string;
}

export type BiometricDeviceStatus = 'Online' | 'Connected' | 'Syncing' | 'Offline' | 'Error';
export type BiometricDeviceModel = 
  | 'ZKTeco K40'
  | 'ZKTeco uFace800'
  | 'ZKTeco IN01-A'
  | 'ZKTeco MB20'
  | 'ZKTeco SilkBio-101TC'
  | 'ZKTeco BioTime / SpeedFace'
  | 'eSSL / Realtime Biometric'
  | 'Generic ZK-Protocol (TCP/IP)';

export interface BiometricDevice {
  id: string;
  name: string;
  ipAddress: string;
  port: number; // default 4370 for ZKTeco UDP/TCP, or 80/8080/443
  commKey: number | string; // communication key / password, default 0
  model: BiometricDeviceModel;
  serialNumber?: string;
  location: string; // e.g. "Main Staff Gate", "Front Desk Entrance", "Kitchen Terminal", "Admin Office"
  department?: string; // e.g. "All Departments", "Food & Beverage", "Front Office"
  connectionType: 'Ethernet TCP/IP' | 'WiFi' | 'RS485' | 'Cloud ADMS Push';
  status: BiometricDeviceStatus;
  enrolledUsersCount: number;
  enrolledFingerprintsCount: number;
  enrolledFacesCount: number;
  totalLogsCount: number;
  lastSyncedAt?: string;
  firmwareVersion?: string;
  macAddress?: string;
  notes?: string;
  enabled: boolean;
}

export interface BiometricLogEntry {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceIp: string;
  deviceUserId: string; // e.g. 1001 or 1
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  timestamp: string; // ISO string
  punchType: 'Check-In' | 'Check-Out' | 'Break-Out' | 'Break-In' | 'Overtime-In' | 'Overtime-Out';
  verifyMethod: BiometricModality;
  status: 'Synced to HR' | 'Duplicate / Skipped' | 'Unrecognized User';
  mappedAttendanceId?: string;
}
