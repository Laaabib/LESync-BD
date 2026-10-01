import { Employee, DepartmentSummary, AttendanceRecord, LeaveRequest, BiometricEnrollmentInfo } from '../types/hrTypes';

const EMPLOYEES_STORAGE_KEY = 'lesync_hr_employees_v2';
const LEAVE_STORAGE_KEY = 'lesync_hr_leaves_v2';
const ATTENDANCE_STORAGE_KEY = 'lesync_hr_attendance_v2';
const DEPARTMENTS_STORAGE_KEY = 'lesync_hr_departments_v2';

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-001',
    employeeCode: 'EMP-1001',
    name: 'Labib Zunaedy',
    designation: 'Super Administrator & IT Director',
    department: 'Executive Management',
    email: 'admin@cculbresort.com',
    phone: '+880 1711-100200',
    roleId: 'role-super-admin',
    roleName: 'Super Administrator',
    shift: 'General',
    shiftTimings: '09:00 AM - 06:00 PM',
    joiningDate: '2023-01-01',
    salary: 120000,
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    nationalId: '19882691234567890',
    address: 'House 14, Road 7, Dhanmondi, Dhaka',
    bloodGroup: 'O+',
    emergencyContact: {
      name: 'Mrs. S. Zunaedy',
      relation: 'Spouse',
      phone: '+880 1711-998877'
    },
    leaveBalance: { annual: 18, casual: 10, medical: 14 },
    notes: 'Enterprise platform owner & system controller'
  },
  {
    id: 'emp-002',
    employeeCode: 'EMP-1002',
    name: 'Shamima Akter',
    designation: 'Front Office Manager',
    department: 'Front Office',
    email: 'frontdesk.mgr@cculbresort.com',
    phone: '+880 1712-345678',
    roleId: 'role-fo-mgr',
    roleName: 'Front Office Manager',
    shift: 'Morning',
    shiftTimings: '07:00 AM - 03:30 PM',
    joiningDate: '2023-06-15',
    salary: 55000,
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    nationalId: '19902691234567891',
    address: 'Block C, Bashundhara R/A, Dhaka',
    bloodGroup: 'A+',
    emergencyContact: {
      name: 'Kamrul Hasan',
      relation: 'Brother',
      phone: '+880 1819-223344'
    },
    leaveBalance: { annual: 14, casual: 8, medical: 12 },
    notes: 'Handles guest concierge, VIP check-ins and room racks'
  },
  {
    id: 'emp-003',
    employeeCode: 'EMP-1003',
    name: 'Tanvir Hossain',
    designation: 'Senior Front Desk Officer',
    department: 'Front Office',
    email: 'tanvir.fo@cculbresort.com',
    phone: '+880 1713-456789',
    roleId: 'role-fo-exec',
    roleName: 'Front Office Executive',
    shift: 'Evening',
    shiftTimings: '03:00 PM - 11:30 PM',
    joiningDate: '2024-01-10',
    salary: 32000,
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    nationalId: '19942691234567892',
    address: 'Mirpur DOHS, Dhaka',
    bloodGroup: 'B+',
    emergencyContact: {
      name: 'Rezaul Karim',
      relation: 'Father',
      phone: '+880 1715-667788'
    },
    leaveBalance: { annual: 16, casual: 9, medical: 14 }
  },
  {
    id: 'emp-004',
    employeeCode: 'EMP-1004',
    name: 'Rasheda Begum',
    designation: 'Executive Housekeeper',
    department: 'Housekeeping',
    email: 'housekeeping.head@cculbresort.com',
    phone: '+880 1714-567890',
    roleId: 'role-hk-mgr',
    roleName: 'Housekeeping Manager',
    shift: 'Morning',
    shiftTimings: '08:00 AM - 04:30 PM',
    joiningDate: '2023-04-01',
    salary: 48000,
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    nationalId: '19872691234567893',
    address: 'Uttara Sector 4, Dhaka',
    bloodGroup: 'O+',
    emergencyContact: {
      name: 'Nazmul Huda',
      relation: 'Spouse',
      phone: '+880 1718-112233'
    },
    leaveBalance: { annual: 12, casual: 7, medical: 10 },
    notes: 'Supervises resort room turnarounds, linen stocks and deep sanitization'
  },
  {
    id: 'emp-005',
    employeeCode: 'EMP-1005',
    name: 'Monirul Islam',
    designation: 'Floor Room Attendant',
    department: 'Housekeeping',
    email: 'monir.hk@cculbresort.com',
    phone: '+880 1715-678901',
    roleId: 'role-hk-exec',
    roleName: 'Housekeeping Executive',
    shift: 'Morning',
    shiftTimings: '08:00 AM - 04:30 PM',
    joiningDate: '2024-03-01',
    salary: 22000,
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    nationalId: '19962691234567894',
    address: 'Tongi, Gazipur',
    bloodGroup: 'AB+',
    emergencyContact: {
      name: 'Kulsum Begum',
      relation: 'Mother',
      phone: '+880 1912-334455'
    },
    leaveBalance: { annual: 18, casual: 10, medical: 14 }
  },
  {
    id: 'emp-006',
    employeeCode: 'EMP-1006',
    name: 'Chef Aminul Islam',
    designation: 'Executive Chef',
    department: 'Food & Beverage',
    email: 'chef.aminul@cculbresort.com',
    phone: '+880 1716-789012',
    roleId: 'role-chef',
    roleName: 'Executive Chef',
    shift: 'Rotational',
    shiftTimings: '11:00 AM - 09:30 PM',
    joiningDate: '2023-03-15',
    salary: 75000,
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    nationalId: '19852691234567895',
    address: 'Gulshan 2, Dhaka',
    bloodGroup: 'A-',
    emergencyContact: {
      name: 'Salma Islam',
      relation: 'Spouse',
      phone: '+880 1711-445566'
    },
    leaveBalance: { annual: 15, casual: 9, medical: 14 }
  },
  {
    id: 'emp-007',
    employeeCode: 'EMP-1007',
    name: 'Kazi Farhan',
    designation: 'F&B Service Captain',
    department: 'Food & Beverage',
    email: 'farhan.rest@cculbresort.com',
    phone: '+880 1717-890123',
    roleId: 'role-fnb-mgr',
    roleName: 'Food & Beverage Captain',
    shift: 'General',
    shiftTimings: '10:00 AM - 07:00 PM',
    joiningDate: '2024-02-01',
    salary: 30000,
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    nationalId: '19952691234567896',
    address: 'Banani Road 11, Dhaka',
    bloodGroup: 'B-',
    emergencyContact: {
      name: 'Kazi Anwar',
      relation: 'Father',
      phone: '+880 1712-778899'
    },
    leaveBalance: { annual: 13, casual: 8, medical: 14 }
  },
  {
    id: 'emp-008',
    employeeCode: 'EMP-1008',
    name: 'Mohammad Farooq (FCMA)',
    designation: 'Senior Financial Controller',
    department: 'Finance & Accounts',
    email: 'finance.lead@cculbresort.com',
    phone: '+880 1718-901234',
    roleId: 'role-accounts-mgr',
    roleName: 'Senior Accounts Officer',
    shift: 'General',
    shiftTimings: '09:00 AM - 06:00 PM',
    joiningDate: '2023-02-01',
    salary: 80000,
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    nationalId: '19812691234567897',
    address: 'Eskaton Garden, Dhaka',
    bloodGroup: 'O+',
    emergencyContact: {
      name: 'Tahmina Farooq',
      relation: 'Spouse',
      phone: '+880 1716-223344'
    },
    leaveBalance: { annual: 16, casual: 10, medical: 14 }
  },
  {
    id: 'emp-009',
    employeeCode: 'EMP-1009',
    name: 'Engr. Mahbubur Rahman',
    designation: 'Chief Maintenance Engineer',
    department: 'Engineering & Maintenance',
    email: 'engineering@cculbresort.com',
    phone: '+880 1719-012345',
    roleId: 'role-it-mgr',
    roleName: 'Chief Engineer',
    shift: 'General',
    shiftTimings: '09:00 AM - 06:00 PM',
    joiningDate: '2023-05-10',
    salary: 65000,
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    nationalId: '19832691234567898',
    address: 'Khilkhet, Dhaka',
    bloodGroup: 'A+',
    emergencyContact: {
      name: 'Rashid Rahman',
      relation: 'Brother',
      phone: '+880 1817-556677'
    },
    leaveBalance: { annual: 15, casual: 9, medical: 12 }
  },
  {
    id: 'emp-010',
    employeeCode: 'EMP-1010',
    name: 'Afroza Sultana',
    designation: 'Human Resources Manager',
    department: 'Human Resources',
    email: 'hr.mgr@cculbresort.com',
    phone: '+880 1720-123456',
    roleId: 'role-hr-mgr',
    roleName: 'HR Manager',
    shift: 'General',
    shiftTimings: '09:00 AM - 06:00 PM',
    joiningDate: '2023-07-01',
    salary: 58000,
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
    nationalId: '19892691234567899',
    address: 'Lalmatia, Dhaka',
    bloodGroup: 'B+',
    emergencyContact: {
      name: 'Dr. Tariq Hasan',
      relation: 'Spouse',
      phone: '+880 1711-889900'
    },
    leaveBalance: { annual: 17, casual: 10, medical: 14 }
  }
];

export const INITIAL_DEPARTMENTS: DepartmentSummary[] = [
  { id: 'dept-1', code: 'CC-101', name: 'Front Office', head: 'Shamima Akter', headEmail: 'frontdesk.mgr@cculbresort.com', staffCount: 14, budget: 450000, shifts: '3 Shifts (24/7)', location: 'Main Lobby & Reception' },
  { id: 'dept-2', code: 'CC-201', name: 'Housekeeping', head: 'Rasheda Begum', headEmail: 'housekeeping.head@cculbresort.com', staffCount: 26, budget: 620000, shifts: '2 Shifts (07:00 - 22:00)', location: 'Basement Linen & Floor Hubs' },
  { id: 'dept-3', code: 'CC-205', name: 'Food & Beverage', head: 'Chef Aminul Islam', headEmail: 'chef.aminul@cculbresort.com', staffCount: 32, budget: 890000, shifts: '3 Shifts (Breakfast, Lunch, Dinner)', location: 'Padma Restaurant & Central Kitchen' },
  { id: 'dept-4', code: 'CC-206', name: 'Bar & Lounge', head: 'Tanvir Hossain', headEmail: 'bar.lead@cculbresort.com', staffCount: 8, budget: 280000, shifts: 'Evening & Night (16:00 - 01:00)', location: 'Meghna Sunset Lounge' },
  { id: 'dept-5', code: 'CC-301', name: 'Banquets & Events', head: 'Zubair Ahmed', headEmail: 'banquet.mgr@cculbresort.com', staffCount: 12, budget: 380000, shifts: 'Variable Event Rosters', location: 'Jamuna & Surma Convention Halls' },
  { id: 'dept-6', code: 'CC-501', name: 'Finance & Accounts', head: 'Mohammad Farooq (FCMA)', headEmail: 'finance.lead@cculbresort.com', staffCount: 8, budget: 420000, shifts: 'General Day (09:00 - 18:00)', location: 'Admin Building, 2nd Floor' },
  { id: 'dept-7', code: 'CC-701', name: 'Human Resources', head: 'Afroza Sultana', headEmail: 'hr.mgr@cculbresort.com', staffCount: 5, budget: 250000, shifts: 'General Day (09:00 - 18:00)', location: 'Admin Building, 1st Floor' },
  { id: 'dept-8', code: 'CC-801', name: 'Engineering & Maintenance', head: 'Engr. Mahbubur Rahman', headEmail: 'engineering@cculbresort.com', staffCount: 10, budget: 350000, shifts: '24/7 On-Call Support', location: 'Power Plant & Workshop' },
  { id: 'dept-9', code: 'CC-802', name: 'Security & Safety', head: 'Major (Retd) Anwarul Kabir', headEmail: 'security@cculbresort.com', staffCount: 18, budget: 390000, shifts: '3 Shifts (24/7 Gate & Patrol)', location: 'Main Entrance & CCTV Room' }
];

export const INITIAL_LEAVES: LeaveRequest[] = [
  {
    id: 'LV-2026-0041',
    employeeId: 'emp-007',
    employeeCode: 'EMP-1007',
    employeeName: 'Kazi Farhan',
    designation: 'F&B Service Captain',
    department: 'Food & Beverage',
    leaveType: 'Annual Leave',
    fromDate: '2026-09-20',
    toDate: '2026-09-23',
    days: 3,
    reason: 'Attending elder sister’s wedding ceremony in Sylhet',
    relieverName: 'Monirul Islam (Senior Attendant)',
    contactDuringLeave: 'Zindabazar, Sylhet (01717-890123)',
    status: 'Pending Approval',
    appliedAt: '2026-09-14T10:30:00Z'
  },
  {
    id: 'LV-2026-0040',
    employeeId: 'emp-004',
    employeeCode: 'EMP-1004',
    employeeName: 'Rasheda Begum',
    designation: 'Executive Housekeeper',
    department: 'Housekeeping',
    leaveType: 'Sick / Medical Leave',
    fromDate: '2026-09-04',
    toDate: '2026-09-05',
    days: 2,
    reason: 'Follow-up appointment with orthopedic consultant at Square Hospital',
    relieverName: 'Shamima Akter (Cross-Covering Ops)',
    contactDuringLeave: 'Home Residence (01714-567890)',
    status: 'Approved',
    appliedAt: '2026-09-02T09:15:00Z',
    reviewedBy: 'Afroza Sultana (HR Manager)',
    reviewedAt: '2026-09-02T16:40:00Z',
    remarks: 'Medical prescription verified. Leave approved.'
  },
  {
    id: 'LV-2026-0039',
    employeeId: 'emp-003',
    employeeCode: 'EMP-1003',
    employeeName: 'Tanvir Hossain',
    designation: 'Senior Front Desk Officer',
    department: 'Front Office',
    leaveType: 'Casual Leave',
    fromDate: '2026-09-12',
    toDate: '2026-09-12',
    days: 1,
    reason: 'Urgent family personal affairs at native district',
    relieverName: 'Shamima Akter (FOM)',
    contactDuringLeave: 'Available on cell phone',
    status: 'Approved',
    appliedAt: '2026-09-10T14:00:00Z',
    reviewedBy: 'Afroza Sultana (HR Manager)',
    reviewedAt: '2026-09-11T09:00:00Z'
  },
  {
    id: 'LV-2026-0038',
    employeeId: 'emp-009',
    employeeCode: 'EMP-1009',
    employeeName: 'Engr. Mahbubur Rahman',
    designation: 'Chief Maintenance Engineer',
    department: 'Engineering & Maintenance',
    leaveType: 'Compensatory Off',
    fromDate: '2026-09-25',
    toDate: '2026-09-26',
    days: 2,
    reason: 'Compensatory rest for emergency generator overhaul over the weekend',
    relieverName: 'Subrata Roy (Asst. Engineer)',
    contactDuringLeave: '01719-012345',
    status: 'Pending Approval',
    appliedAt: '2026-09-15T11:00:00Z'
  }
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  { id: 'att-1', employeeId: 'emp-001', employeeCode: 'EMP-1001', name: 'Labib Zunaedy', dept: 'Executive Management', designation: 'Super Administrator', shift: 'General (09:00 - 18:00)', inTime: '08:52 AM', outTime: '06:10 PM', status: 'On Time', terminal: 'HQ Biometric Terminal #1', date: '2026-09-16' },
  { id: 'att-2', employeeId: 'emp-002', employeeCode: 'EMP-1002', name: 'Shamima Akter', dept: 'Front Office', designation: 'Front Office Manager', shift: 'Morning (07:00 - 15:30)', inTime: '06:55 AM', outTime: '03:35 PM', status: 'On Time', terminal: 'Front Desk Biometric #2', date: '2026-09-16' },
  { id: 'att-3', employeeId: 'emp-003', employeeCode: 'EMP-1003', name: 'Tanvir Hossain', dept: 'Front Office', designation: 'Front Desk Officer', shift: 'Evening (15:00 - 23:30)', inTime: '02:54 PM', outTime: '—', status: 'On Time', terminal: 'Front Desk Biometric #2', date: '2026-09-16' },
  { id: 'att-4', employeeId: 'emp-004', employeeCode: 'EMP-1004', name: 'Rasheda Begum', dept: 'Housekeeping', designation: 'Executive Housekeeper', shift: 'Morning (08:00 - 16:30)', inTime: '08:04 AM', outTime: '04:40 PM', status: 'Slight Delay', terminal: 'Housekeeping Hub #3', date: '2026-09-16' },
  { id: 'att-5', employeeId: 'emp-005', employeeCode: 'EMP-1005', name: 'Monirul Islam', dept: 'Housekeeping', designation: 'Room Attendant', shift: 'Morning (08:00 - 16:30)', inTime: '07:50 AM', outTime: '04:30 PM', status: 'On Time', terminal: 'Housekeeping Hub #3', date: '2026-09-16' },
  { id: 'att-6', employeeId: 'emp-006', employeeCode: 'EMP-1006', name: 'Chef Aminul Islam', dept: 'Food & Beverage', designation: 'Executive Chef', shift: 'Rotational (11:00 - 21:30)', inTime: '10:55 AM', outTime: '—', status: 'On Time', terminal: 'Kitchen Biometric #4', date: '2026-09-16' },
  { id: 'att-7', employeeId: 'emp-007', employeeCode: 'EMP-1007', name: 'Kazi Farhan', dept: 'Food & Beverage', designation: 'F&B Captain', shift: 'General (10:00 - 19:00)', inTime: '09:58 AM', outTime: '07:05 PM', status: 'On Time', terminal: 'Restaurant Terminal #5', date: '2026-09-16' },
  { id: 'att-8', employeeId: 'emp-008', employeeCode: 'EMP-1008', name: 'Mohammad Farooq (FCMA)', dept: 'Finance & Accounts', designation: 'Senior Accounts Officer', shift: 'General (09:00 - 18:00)', inTime: '08:58 AM', outTime: '06:05 PM', status: 'On Time', terminal: 'Admin Biometric #1', date: '2026-09-16' },
  { id: 'att-9', employeeId: 'emp-009', employeeCode: 'EMP-1009', name: 'Engr. Mahbubur Rahman', dept: 'Engineering & Maintenance', designation: 'Chief Engineer', shift: 'General (09:00 - 18:00)', inTime: '08:45 AM', outTime: '06:15 PM', status: 'On Time', terminal: 'Workshop Terminal #6', date: '2026-09-16' },
  { id: 'att-10', employeeId: 'emp-010', employeeCode: 'EMP-1010', name: 'Afroza Sultana', dept: 'Human Resources', designation: 'HR Manager', shift: 'General (09:00 - 18:00)', inTime: '08:50 AM', outTime: '06:00 PM', status: 'On Time', terminal: 'Admin Biometric #1', date: '2026-09-16' }
];

class HrService {
  private employees: Employee[] = [];
  private leaves: LeaveRequest[] = [];
  private attendance: AttendanceRecord[] = [];
  private departments: DepartmentSummary[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const storedEmp = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
      this.employees = storedEmp ? JSON.parse(storedEmp) : [...INITIAL_EMPLOYEES];

      const storedLeaves = localStorage.getItem(LEAVE_STORAGE_KEY);
      this.leaves = storedLeaves ? JSON.parse(storedLeaves) : [...INITIAL_LEAVES];

      const storedAtt = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
      this.attendance = storedAtt ? JSON.parse(storedAtt) : [...INITIAL_ATTENDANCE];

      const storedDepts = localStorage.getItem(DEPARTMENTS_STORAGE_KEY);
      this.departments = storedDepts ? JSON.parse(storedDepts) : [...INITIAL_DEPARTMENTS];
    } catch (e) {
      this.employees = [...INITIAL_EMPLOYEES];
      this.leaves = [...INITIAL_LEAVES];
      this.attendance = [...INITIAL_ATTENDANCE];
      this.departments = [...INITIAL_DEPARTMENTS];
    }
  }

  private saveEmployees(): void {
    localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(this.employees));
  }

  private saveLeaves(): void {
    localStorage.setItem(LEAVE_STORAGE_KEY, JSON.stringify(this.leaves));
  }

  private saveAttendance(): void {
    localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(this.attendance));
  }

  private saveDepartments(): void {
    localStorage.setItem(DEPARTMENTS_STORAGE_KEY, JSON.stringify(this.departments));
  }

  // --- EMPLOYEES ---
  getEmployees(): Employee[] {
    return [...this.employees];
  }

  getEmployeeById(id: string): Employee | undefined {
    return this.employees.find(e => e.id === id);
  }

  isEmployeeCodeTaken(code: string, currentEmpId?: string): boolean {
    const trimmed = (code || '').trim().toLowerCase();
    if (!trimmed) return false;
    return this.employees.some(e => e.id !== currentEmpId && e.employeeCode.trim().toLowerCase() === trimmed);
  }

  generateUniqueEmployeeCode(prefix = 'EMP'): string {
    const cleanPrefix = (prefix || 'EMP').trim().toUpperCase();
    const existingNumbers: number[] = [];

    for (const emp of this.employees) {
      const match = emp.employeeCode.match(/(\d+)$/);
      if (match) {
        existingNumbers.push(parseInt(match[1], 10));
      }
    }

    let nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1001;
    if (nextNumber < 1001) nextNumber = 1001;

    let candidate = `${cleanPrefix}-${nextNumber}`;
    while (this.isEmployeeCodeTaken(candidate)) {
      nextNumber++;
      candidate = `${cleanPrefix}-${nextNumber}`;
    }

    return candidate;
  }

  addEmployee(empData: Omit<Employee, 'id'>): Employee {
    const newId = `emp-${Date.now().toString(36)}`;
    let finalCode = (empData.employeeCode || '').trim();

    // Enforce uniqueness
    if (!finalCode || this.isEmployeeCodeTaken(finalCode)) {
      finalCode = this.generateUniqueEmployeeCode();
    }

    // Default biometric enrollment template
    const defaultBiometric = empData.biometricEnrollment || {
      isEnrolled: false,
      deviceUserId: finalCode.replace(/\D/g, '') || String(1000 + this.employees.length + 1),
      privilege: 'Standard User',
      biometricTypes: ['Fingerprint'],
      syncedDevices: []
    };

    const newEmployee: Employee = {
      ...empData,
      id: newId,
      employeeCode: finalCode,
      biometricEnrollment: defaultBiometric
    };

    this.employees.unshift(newEmployee);
    this.saveEmployees();
    return newEmployee;
  }

  updateEmployee(id: string, updates: Partial<Employee>): Employee | null {
    const idx = this.employees.findIndex(e => e.id === id);
    if (idx === -1) return null;

    let codeToUse = updates.employeeCode ? updates.employeeCode.trim() : this.employees[idx].employeeCode;
    if (updates.employeeCode && this.isEmployeeCodeTaken(updates.employeeCode, id)) {
      // Keep existing code if candidate is taken
      codeToUse = this.employees[idx].employeeCode;
    }

    this.employees[idx] = {
      ...this.employees[idx],
      ...updates,
      employeeCode: codeToUse
    };
    this.saveEmployees();
    return this.employees[idx];
  }

  updateBiometricEnrollment(employeeId: string, enrollment: Partial<BiometricEnrollmentInfo>): Employee | null {
    const emp = this.getEmployeeById(employeeId);
    if (!emp) return null;

    const currentEnrollment = emp.biometricEnrollment || {
      isEnrolled: false,
      deviceUserId: emp.employeeCode.replace(/\D/g, '') || '1001',
      privilege: 'Standard User',
      biometricTypes: ['Fingerprint'],
      syncedDevices: []
    };

    const updatedEnrollment: BiometricEnrollmentInfo = {
      ...currentEnrollment,
      ...enrollment,
      syncedDevices: enrollment.syncedDevices || currentEnrollment.syncedDevices || []
    };

    return this.updateEmployee(employeeId, { biometricEnrollment: updatedEnrollment });
  }

  deleteEmployee(id: string): boolean {
    const initialLen = this.employees.length;
    this.employees = this.employees.filter(e => e.id !== id);
    if (this.employees.length !== initialLen) {
      this.saveEmployees();
      return true;
    }
    return false;
  }

  toggleEmployeeStatus(id: string): Employee | null {
    const emp = this.getEmployeeById(id);
    if (!emp) return null;

    const newStatus = emp.status === 'Active' ? 'Suspended' : 'Active';
    return this.updateEmployee(id, { status: newStatus });
  }

  // --- LEAVE MANAGEMENT ---
  getLeaves(): LeaveRequest[] {
    return [...this.leaves];
  }

  getLeaveById(id: string): LeaveRequest | undefined {
    return this.leaves.find(l => l.id === id);
  }

  submitLeave(req: Omit<LeaveRequest, 'id' | 'status' | 'appliedAt'>): LeaveRequest {
    const newId = `LV-${new Date().getFullYear()}-${String(this.leaves.length + 42).padStart(4, '0')}`;
    const newLeave: LeaveRequest = {
      ...req,
      id: newId,
      status: 'Pending Approval',
      appliedAt: new Date().toISOString()
    };

    this.leaves.unshift(newLeave);
    this.saveLeaves();
    return newLeave;
  }

  approveLeave(id: string, reviewerName: string = 'Afroza Sultana (HR Manager)', remarks?: string): LeaveRequest | null {
    const idx = this.leaves.findIndex(l => l.id === id);
    if (idx === -1) return null;

    this.leaves[idx] = {
      ...this.leaves[idx],
      status: 'Approved',
      reviewedBy: reviewerName,
      reviewedAt: new Date().toISOString(),
      remarks: remarks || 'Leave request reviewed and approved according to entitlement balance.'
    };

    // Deduct leave balance if employee exists
    const emp = this.getEmployeeById(this.leaves[idx].employeeId);
    if (emp && emp.leaveBalance) {
      const type = this.leaves[idx].leaveType;
      const days = this.leaves[idx].days;
      if (type.includes('Annual')) {
        emp.leaveBalance.annual = Math.max(0, emp.leaveBalance.annual - days);
      } else if (type.includes('Casual')) {
        emp.leaveBalance.casual = Math.max(0, emp.leaveBalance.casual - days);
      } else if (type.includes('Sick') || type.includes('Medical')) {
        emp.leaveBalance.medical = Math.max(0, emp.leaveBalance.medical - days);
      }
      this.saveEmployees();
    }

    this.saveLeaves();
    return this.leaves[idx];
  }

  rejectLeave(id: string, reviewerName: string = 'Afroza Sultana (HR Manager)', reason: string = 'Operational shift constraints during festive period'): LeaveRequest | null {
    const idx = this.leaves.findIndex(l => l.id === id);
    if (idx === -1) return null;

    this.leaves[idx] = {
      ...this.leaves[idx],
      status: 'Rejected',
      reviewedBy: reviewerName,
      reviewedAt: new Date().toISOString(),
      remarks: reason
    };

    this.saveLeaves();
    return this.leaves[idx];
  }

  // --- ATTENDANCE ---
  getAttendance(): AttendanceRecord[] {
    return [...this.attendance];
  }

  recordPunchIn(employeeId: string, customTime?: string): AttendanceRecord | null {
    const emp = this.getEmployeeById(employeeId);
    if (!emp) return null;

    const timeStr = customTime || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const newRecord: AttendanceRecord = {
      id: `att-${Date.now().toString(36)}`,
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      name: emp.name,
      dept: emp.department,
      designation: emp.designation,
      shift: `${emp.shift} (${emp.shiftTimings})`,
      inTime: timeStr,
      outTime: '—',
      status: 'On Time',
      terminal: 'Manual HR Web Terminal',
      date: new Date().toISOString().split('T')[0]
    };

    this.attendance.unshift(newRecord);
    this.saveAttendance();
    return newRecord;
  }

  // --- DEPARTMENTS ---
  getDepartments(): DepartmentSummary[] {
    return [...this.departments];
  }

  addDepartment(dept: Omit<DepartmentSummary, 'id'>): DepartmentSummary {
    const newDept: DepartmentSummary = {
      ...dept,
      id: `dept-${Date.now().toString(36)}`
    };
    this.departments.push(newDept);
    this.saveDepartments();
    return newDept;
  }
}

export const hrService = new HrService();
