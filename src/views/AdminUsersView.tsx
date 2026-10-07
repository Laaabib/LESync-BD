import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, UserPlus, Shield, ShieldCheck, ShieldAlert, Key, Lock, Unlock,
  Search, Filter, Edit3, Trash2, CheckCircle2, AlertTriangle,
  Building, Building2, Phone, Mail, FileText, Check, X, RefreshCw, RotateCcw,
  Plus, Sliders, DollarSign, HelpCircle, Layers, CheckSquare, Square,
  ChevronRight, AlertCircle, Sparkles, UtensilsCrossed, History, AlertOctagon, Bug,
  Database, Cloud
} from 'lucide-react';
import { rbacService, MASTER_PERMISSIONS } from '../services/rbacService';
import { authService } from '../services/authService';
import { pmsService } from '../services/pmsService';
import { supabaseSyncService, SupabaseSyncStatus } from '../services/supabaseSyncService';
import { userErrorTrackerService } from '../services/userErrorTrackerService';
import { RoleDefinition, DepartmentName, UserContext, ApprovalRule, PermissionDefinition, DepartmentDef } from '../types/reportingAndRbac';
import { AdminPermissionsTab } from '../components/admin/AdminPermissionsTab';
import { AdminDepartmentsTab } from '../components/admin/AdminDepartmentsTab';
import { AdminOutletsTab } from '../components/admin/AdminOutletsTab';
import { AdminActivityLogsTab } from '../components/admin/AdminActivityLogsTab';
import { AdminErrorFinderTab } from '../components/admin/AdminErrorFinderTab';

export type AdminTabType = 'users' | 'roles' | 'permissions' | 'departments' | 'outlets' | 'approvals' | 'activity-logs' | 'error-finder';

interface AdminUsersViewProps {
  initialTab?: string;
  onNavigate?: (route: string) => void;
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({ initialTab = 'users', onNavigate }) => {
  // Core Collections
  const [users, setUsers] = useState<UserContext[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [approvalRules, setApprovalRules] = useState<ApprovalRule[]>([]);
  const [departments, setDepartments] = useState<DepartmentDef[]>([]);
  const [credentials, setCredentials] = useState<Record<string, any>>({});
  const [selectedActivityUserId, setSelectedActivityUserId] = useState<string | undefined>(undefined);
  const [selectedErrorUserId, setSelectedErrorUserId] = useState<string | undefined>(undefined);

  const resolveTab = (tab?: string): AdminTabType => {
    if (!tab) return 'users';
    if (tab === 'admin-permissions' || tab === 'permissions') return 'permissions';
    if (tab === 'admin-departments' || tab === 'departments') return 'departments';
    if (tab === 'admin-outlets' || tab === 'outlets') return 'outlets';
    if (tab === 'admin-approvals' || tab === 'approvals') return 'approvals';
    if (tab === 'admin-roles' || tab === 'roles') return 'roles';
    if (tab === 'admin-audit' || tab === 'admin-activity' || tab === 'admin-activity-logs' || tab === 'activity-logs' || tab === 'audit') return 'activity-logs';
    if (tab === 'admin-error-finder' || tab === 'error-finder' || tab === 'admin-errors' || tab === 'errors') return 'error-finder';
    return 'users';
  };

  // Active Tab
  const [activeTab, setActiveTab] = useState<AdminTabType>(resolveTab(initialTab));

  useEffect(() => {
    setActiveTab(resolveTab(initialTab));
  }, [initialTab]);

  const handleTabChange = (newTab: AdminTabType) => {
    setActiveTab(newTab);
    const routeMap: Record<AdminTabType, string> = {
      users: 'admin-users',
      roles: 'admin-roles',
      permissions: 'admin-permissions',
      departments: 'admin-departments',
      outlets: 'admin-outlets',
      approvals: 'admin-approvals',
      'activity-logs': 'admin-audit',
      'error-finder': 'admin-error-finder'
    };
    if (onNavigate) {
      onNavigate(routeMap[newTab]);
    }
  };

  const handleViewUserActivity = (userId: string) => {
    setSelectedActivityUserId(userId);
    setActiveTab('activity-logs');
    if (onNavigate) {
      onNavigate('admin-audit');
    }
  };

  const handleViewUserErrors = (userId: string) => {
    setSelectedErrorUserId(userId);
    setActiveTab('error-finder');
    if (onNavigate) {
      onNavigate('admin-error-finder');
    }
  };

  // Filters for User Directory
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // User Create / Edit Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserContext | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formDepartment, setFormDepartment] = useState<DepartmentName>('Front Office');
  const [formRoleId, setFormRoleId] = useState<string>('role-fo-exec');
  const currentProperty = pmsService.getState().settings?.resortName || 'LESync Resort & Convention Hall';
  const [formProperty, setFormProperty] = useState(currentProperty);
  const [formOutlet, setFormOutlet] = useState('Front Desk');
  const [formDataScope, setFormDataScope] = useState<'Self' | 'Department' | 'Property' | 'Enterprise'>('Department');
  const [formPassword, setFormPassword] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive' | 'Suspended' | 'Locked'>('Active');

  // Individual User Permissions Override Modal State
  const [isUserPermsModalOpen, setIsUserPermsModalOpen] = useState(false);
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<UserContext | null>(null);
  const [userCustomPerms, setUserCustomPerms] = useState<string[]>([]);
  const [userDeniedPerms, setUserDeniedPerms] = useState<string[]>([]);
  const [userPermSearch, setUserPermSearch] = useState('');
  const [userPermCategoryFilter, setUserPermCategoryFilter] = useState('all');

  // Role Permissions Group State
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState<RoleDefinition | null>(null);
  const [editedPerms, setEditedPerms] = useState<string[]>([]);
  const [rolePermSearch, setRolePermSearch] = useState('');
  const [rolePermCategoryFilter, setRolePermCategoryFilter] = useState('all');

  // Create Role Modal State
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDept, setNewRoleDept] = useState<DepartmentName>('Front Office');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleTemplate, setNewRoleTemplate] = useState('role-fo-exec');

  // Approval Rule Edit / Create Modal State
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ApprovalRule | null>(null);
  const [ruleName, setRuleName] = useState('');
  const [ruleCategory, setRuleCategory] = useState<'Billing' | 'Payment' | 'Discount' | 'Credit Limit' | 'Procurement' | 'Expense' | 'HR'>('Billing');
  const [ruleActionType, setRuleActionType] = useState('Bill Resettlement');
  const [ruleThreshold, setRuleThreshold] = useState<number>(0);
  const [ruleRoles, setRuleRoles] = useState<string[]>(['role-fo-mgr']);
  const [ruleRequiresTwoSignatures, setRuleRequiresTwoSignatures] = useState(false);
  const [ruleActive, setRuleActive] = useState(true);
  const [ruleDesc, setRuleDesc] = useState('');

  // Feedback Toast
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [syncStatus, setSyncStatus] = useState<SupabaseSyncStatus>(() => supabaseSyncService.getStatus());
  const [isSyncingToCloud, setIsSyncingToCloud] = useState(false);

  useEffect(() => {
    const unsub = supabaseSyncService.subscribe(setSyncStatus);
    return unsub;
  }, []);

  const handleManualSync = async () => {
    setIsSyncingToCloud(true);
    try {
      const res = await supabaseSyncService.syncEntirePmsState();
      if (res.success) {
        showToast(`Admin users, roles, and master configurations synchronized to Supabase & SQL! (${res.totalEntities || 'All'} entities)`, 'success');
      } else {
        showToast(res.message || 'Sync completed with notices.', 'info');
      }
    } catch (err: any) {
      showToast(`Cloud Sync notice: ${err?.message || 'Sync encountered an error'}`, 'error');
    } finally {
      setIsSyncingToCloud(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setFeedbackToast({ type, message });
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  const loadData = () => {
    let loadedUsers = rbacService.getUsers();
    const loadedRoles = rbacService.getRoles();
    const loadedRules = rbacService.getApprovalRules();
    const loadedDepts = rbacService.getDepartments();
    const loadedCreds = authService.getCredentials();

    // Auto-heal: ensure any existing user with Super Admin title is mapped to role-super-admin
    let hasHealed = false;
    loadedUsers = loadedUsers.map(u => {
      const rName = (u.roleName || '').toLowerCase().trim();
      if (u.id === 'usr-admin-1' || rName === 'super admin' || rName === 'super administrator' || rName.includes('super admin') || rName.includes('super administrator')) {
        if (u.roleId !== 'role-super-admin' || u.roleName !== 'Super Administrator') {
          hasHealed = true;
          return {
            ...u,
            roleId: 'role-super-admin',
            roleName: 'Super Administrator',
            department: 'Executive Management',
            dataScope: 'All Properties'
          };
        }
      }
      return u;
    });

    if (hasHealed) {
      localStorage.setItem('cculb_rbac_users_v1', JSON.stringify(loadedUsers));
    }

    setUsers([...loadedUsers]);
    setRoles([...loadedRoles]);
    setApprovalRules([...loadedRules]);
    setDepartments([...loadedDepts]);
    setCredentials({ ...loadedCreds });

    if (!selectedRoleForPerms && loadedRoles.length > 0) {
      setSelectedRoleForPerms(loadedRoles[0]);
      setEditedPerms([...loadedRoles[0].permissions]);
    }
  };

  useEffect(() => {
    loadData();
    const unsubRbac = rbacService.subscribe(loadData);
    const unsubAuth = authService.subscribe(loadData);
    return () => {
      unsubRbac();
      unsubAuth();
    };
  }, []);

  useEffect(() => {
    if (selectedRoleForPerms) {
      setEditedPerms([...selectedRoleForPerms.permissions]);
    }
  }, [selectedRoleForPerms]);

  // Master Permission Categories
  const categoriesList = useMemo(() => {
    const cats = Array.from(new Set(MASTER_PERMISSIONS.map(p => p.category)));
    return cats;
  }, []);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const cred = credentials[u.id];
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (cred && cred.employeeId && cred.employeeId.toLowerCase().includes(search.toLowerCase())) ||
        (cred && cred.username && cred.username.toLowerCase().includes(search.toLowerCase()));
      if (!matchSearch) return false;

      if (roleFilter !== 'all' && u.roleId !== roleFilter) return false;
      if (deptFilter !== 'all' && u.department !== deptFilter) return false;
      if (statusFilter !== 'all' && cred && cred.status !== statusFilter) return false;

      return true;
    });
  }, [users, credentials, search, roleFilter, deptFilter, statusFilter]);

  // -------------------------------------------------------------
  // USER CRUD OPERATIONS
  // -------------------------------------------------------------
  const handleOpenCreateUser = () => {
    setEditingUserId(null);
    setFormName('');
    setFormEmployeeId(`EMP-${Math.floor(100 + Math.random() * 900)}`);
    setFormUsername('');
    setFormEmail('');
    setFormMobile('+880 1711-');
    setFormDepartment('Front Office');
    setFormRoleId('role-fo-exec');
    setFormProperty(currentProperty);
    setFormOutlet('Front Desk');
    setFormDataScope('Department');
    setFormPassword('pms12345');
    setFormStatus('Active');
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: UserContext) => {
    const cred = credentials[user.id] || authService.getCredentials()[user.id] || {
      username: user.username || user.email.split('@')[0],
      employeeId: 'EMP-001',
      mobile: '+880 1711-000000',
      property: currentProperty,
      status: 'Active'
    };

    setEditingUserId(user.id);
    setFormName(user.name);
    setFormEmployeeId(cred.employeeId || 'EMP-001');
    setFormUsername(cred.username || user.username || user.email.split('@')[0]);
    setFormEmail(user.email);
    setFormMobile(cred.mobile || '+880 1711-000000');
    setFormDepartment(user.department);
    setFormRoleId(user.roleId);
    setFormProperty(cred.property || currentProperty);
    setFormOutlet(user.outletId || 'Front Desk');
    setFormDataScope(user.dataScope as any);
    setFormPassword('');
    setFormStatus(cred.status || 'Active');
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const roleDef = roles.find(r => r.id === formRoleId);
    let roleName = roleDef ? roleDef.name : 'Front Desk';
    let targetRoleId = formRoleId;
    let targetDept = formDepartment;
    let targetDataScope = formDataScope;

    const isSuperRole = formRoleId === 'role-super-admin' || 
                        roleName.toLowerCase().includes('super admin') || 
                        roleName.toLowerCase().includes('super administrator') ||
                        editingUserId === 'usr-admin-1';

    if (isSuperRole) {
      targetRoleId = 'role-super-admin';
      roleName = 'Super Administrator';
      targetDept = 'Executive Management';
      targetDataScope = 'Enterprise';
    }

    if (editingUserId) {
      authService.adminUpdateUser(editingUserId, {
        name: formName,
        username: formUsername,
        email: formEmail,
        department: targetDept,
        roleId: targetRoleId,
        roleName: roleName as any,
        outletId: formOutlet,
        dataScope: targetDataScope as any,
        employeeId: formEmployeeId,
        mobile: formMobile,
        status: formStatus,
        ...(formPassword ? { passwordHash: formPassword } : {})
      });
      pmsService.logAudit('Updated User Profile', 'User', editingUserId, undefined, `Updated staff profile for ${formName} (${targetDept}, ${roleName})`);
      showToast(`User ${formName} updated successfully.`);
    } else {
      authService.adminCreateUser({
        name: formName,
        employeeId: formEmployeeId,
        username: formUsername || formEmail.split('@')[0],
        email: formEmail,
        mobile: formMobile,
        department: targetDept,
        roleId: targetRoleId,
        roleName: roleName as any,
        property: formProperty,
        outlet: formOutlet,
        dataScope: targetDataScope as any,
        passwordPlain: formPassword || 'cculb123',
        status: formStatus
      });
      pmsService.logAudit('Created Staff User', 'User', formEmployeeId, undefined, `Created new user account for ${formName} (${roleName})`);
      showToast(`User account created for ${formName}.`);
    }

    loadData();
    setIsUserModalOpen(false);
    supabaseSyncService.syncEntirePmsState().catch(err => console.warn('Background sync after user update:', err?.message || err));
  };

  const handleToggleUserStatus = (user: UserContext) => {
    if (user.id === 'usr-admin-1' || user.roleName === 'Super Admin') {
      showToast('The Root Super Admin account cannot be deactivated.', 'error');
      return;
    }
    const cred = credentials[user.id];
    const currentStatus = cred ? cred.status : 'Active';
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';

    authService.adminUpdateUser(user.id, { 
      status: nextStatus,
      ...(nextStatus === 'Inactive' ? { customPermissions: [] } : {})
    });
    loadData();
    showToast(
      nextStatus === 'Inactive'
        ? `User ${user.name} marked Inactive. Active role and permission assignments revoked.`
        : `User ${user.name} status updated to Active.`
    );
  };

  const handleDeleteUser = (user: UserContext) => {
    if (user.id === 'usr-admin-1' || user.roleName === 'Super Admin') {
      showToast('The Root Super Admin account cannot be deleted.', 'error');
      return;
    }
    setDeletingUser(user);
  };

  const confirmDeleteUser = () => {
    if (!deletingUser) return;
    const success = authService.adminDeleteUser(deletingUser.id);
    if (success) {
      showToast(`User account ${deletingUser.name} (${deletingUser.email}) and all permissions were permanently deleted.`);
      loadData();
    } else {
      showToast('Could not delete this user account.', 'error');
    }
    setDeletingUser(null);
  };

  const handleUnlockUser = (user: UserContext) => {
    authService.adminUpdateUser(user.id, { lockedUntil: undefined, failedAttempts: 0, status: 'Active' });
    loadData();
    showToast(`User ${user.name} unlocked and password attempt counter reset.`);
  };

  // -------------------------------------------------------------
  // INDIVIDUAL USER PERMISSIONS OVERRIDES
  // -------------------------------------------------------------
  const handleOpenUserPermissions = (user: UserContext) => {
    const cred = credentials[user.id];
    const isInactive = cred ? cred.status !== 'Active' : false;
    if (isInactive) {
      showToast(`Cannot assign permissions to inactive user ${user.name}. Activate user first.`, 'error');
      return;
    }
    setSelectedUserForPerms(user);
    setUserCustomPerms(user.customPermissions ? [...user.customPermissions] : []);
    setUserDeniedPerms(user.deniedPermissions ? [...user.deniedPermissions] : []);
    setUserPermSearch('');
    setUserPermCategoryFilter('all');
    setIsUserPermsModalOpen(true);
  };

  const handleSetUserPermMode = (permKey: string, mode: 'inherit' | 'grant' | 'deny') => {
    if (mode === 'inherit') {
      setUserCustomPerms(prev => prev.filter(k => k !== permKey));
      setUserDeniedPerms(prev => prev.filter(k => k !== permKey));
    } else if (mode === 'grant') {
      setUserDeniedPerms(prev => prev.filter(k => k !== permKey));
      if (!userCustomPerms.includes(permKey)) {
        setUserCustomPerms(prev => [...prev, permKey]);
      }
    } else if (mode === 'deny') {
      setUserCustomPerms(prev => prev.filter(k => k !== permKey));
      if (!userDeniedPerms.includes(permKey)) {
        setUserDeniedPerms(prev => [...prev, permKey]);
      }
    }
  };

  const handleSaveUserOverrides = () => {
    if (!selectedUserForPerms) return;
    rbacService.updateUserOverrides(selectedUserForPerms.id, userCustomPerms, userDeniedPerms);
    pmsService.logAudit(
      'Updated Individual User Permissions',
      'Settings',
      selectedUserForPerms.id,
      undefined,
      `Updated overrides for ${selectedUserForPerms.name}: +${userCustomPerms.length} granted, -${userDeniedPerms.length} denied`
    );
    showToast(`Individual permissions saved for ${selectedUserForPerms.name}.`);
    loadData();
    setIsUserPermsModalOpen(false);
  };

  const handleClearAllUserOverrides = () => {
    setUserCustomPerms([]);
    setUserDeniedPerms([]);
  };

  // -------------------------------------------------------------
  // ROLE PERMISSIONS MATRIX OPERATIONS
  // -------------------------------------------------------------
  const handleToggleRolePermission = (permKey: string) => {
    if (editedPerms.includes(permKey)) {
      setEditedPerms(editedPerms.filter(p => p !== permKey));
    } else {
      setEditedPerms([...editedPerms, permKey]);
    }
  };

  const handleSelectAllCategory = (perms: PermissionDefinition[]) => {
    const keysToAdd = perms.map(p => p.key);
    const newKeys = Array.from(new Set([...editedPerms, ...keysToAdd]));
    setEditedPerms(newKeys);
  };

  const handleDeselectAllCategory = (perms: PermissionDefinition[]) => {
    const keysToRemove = new Set(perms.map(p => p.key));
    setEditedPerms(editedPerms.filter(k => !keysToRemove.has(k)));
  };

  const handleSaveRolePermissions = () => {
    if (!selectedRoleForPerms) return;
    const updatedRole: RoleDefinition = {
      ...selectedRoleForPerms,
      permissions: editedPerms
    };
    rbacService.updateRole(updatedRole);
    pmsService.logAudit(
      'Updated Role Permissions Group',
      'Settings',
      selectedRoleForPerms.id,
      undefined,
      `Configured permissions for role ${selectedRoleForPerms.name} (${editedPerms.length} capabilities)`
    );
    showToast(`Permissions updated for role ${selectedRoleForPerms.name}.`);
    loadData();
  };

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    const templateRole = roles.find(r => r.id === newRoleTemplate);
    const templatePerms = templateRole ? [...templateRole.permissions] : [];

    const newRole = rbacService.addRole({
      name: newRoleName.trim(),
      department: newRoleDept,
      description: newRoleDesc.trim() || `Custom permission group for ${newRoleName}`,
      isSystem: false,
      defaultDataScope: 'Own Department',
      allowedModules: templateRole ? [...templateRole.allowedModules] : ['dashboard', 'front-office'],
      permissions: templatePerms
    });

    pmsService.logAudit('Created Custom Security Role', 'Settings', newRole.id, undefined, `Created custom role group ${newRole.name}`);
    showToast(`Role "${newRole.name}" created successfully.`);
    loadData();
    setSelectedRoleForPerms(newRole);
    setIsCreateRoleModalOpen(false);
    setNewRoleName('');
    setNewRoleDesc('');
  };

  // -------------------------------------------------------------
  // APPROVAL RULES OPERATIONS
  // -------------------------------------------------------------
  const handleOpenEditRule = (rule: ApprovalRule) => {
    setEditingRule(rule);
    setRuleName(rule.name);
    setRuleCategory(rule.category as any);
    setRuleActionType(rule.actionType);
    setRuleThreshold(rule.minThreshold);
    setRuleRoles(rule.requiredRoleIds ? [...rule.requiredRoleIds] : []);
    setRuleRequiresTwoSignatures(!!rule.requiresTwoSignatures);
    setRuleActive(rule.active);
    setRuleDesc(rule.description || '');
    setIsRuleModalOpen(true);
  };

  const handleOpenCreateRule = () => {
    setEditingRule(null);
    setRuleName('');
    setRuleCategory('Billing');
    setRuleActionType('Bill Resettlement');
    setRuleThreshold(0);
    setRuleRoles(['role-fo-mgr', 'role-finance-mgr']);
    setRuleRequiresTwoSignatures(false);
    setRuleActive(true);
    setRuleDesc('');
    setIsRuleModalOpen(true);
  };

  const handleSaveApprovalRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) return;

    if (editingRule) {
      const updatedRule: ApprovalRule = {
        ...editingRule,
        name: ruleName.trim(),
        category: ruleCategory,
        actionType: ruleActionType,
        minThreshold: Number(ruleThreshold),
        requiredRoleIds: ruleRoles,
        requiresTwoSignatures: ruleRequiresTwoSignatures,
        active: ruleActive,
        description: ruleDesc.trim()
      };
      rbacService.updateApprovalRule(updatedRule);
      pmsService.logAudit('Updated Approval Rule', 'Settings', editingRule.id, undefined, `Updated rule ${ruleName} (Threshold: ৳${ruleThreshold})`);
      showToast(`Approval rule "${ruleName}" updated.`);
    } else {
      const created = rbacService.addApprovalRule({
        ruleCode: `APR-${Date.now().toString().slice(-4)}`,
        name: ruleName.trim(),
        category: ruleCategory,
        actionType: ruleActionType,
        minThreshold: Number(ruleThreshold),
        requiredRoleIds: ruleRoles,
        requiresTwoSignatures: ruleRequiresTwoSignatures,
        active: ruleActive,
        description: ruleDesc.trim()
      });
      pmsService.logAudit('Created Approval Rule', 'Settings', created.id, undefined, `Created approval rule ${ruleName}`);
      showToast(`Approval rule "${ruleName}" created.`);
    }

    loadData();
    setIsRuleModalOpen(false);
  };

  const handleToggleRuleStatus = (rule: ApprovalRule) => {
    const updated = { ...rule, active: !rule.active };
    rbacService.updateApprovalRule(updated);
    loadData();
    showToast(`Rule "${rule.name}" is now ${updated.active ? 'Active' : 'Inactive'}.`);
  };

  // Helper for checking risk badge styling
  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'Critical':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Critical Risk</span>;
      case 'High':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">High Risk</span>;
      case 'Elevated':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Elevated</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-gray-100 text-gray-700 border border-gray-200">Standard</span>;
    }
  };

  return (
    <div className="space-y-4 text-xs text-gray-900">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-gray-200 p-4 rounded-xl shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-gray-900 uppercase tracking-tight">Staff Administration & RBAC Security</h1>
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200 font-mono">
                ENTERPRISE GOVERNANCE
              </span>
            </div>
            <p className="text-gray-500 text-xs mt-0.5">
              Role-based access control, individual permission overrides, bill resettle & void authorities, and operational approval workflows.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Supabase & Cloud SQL Sync Status Badge & Action */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className={`w-2.5 h-2.5 rounded-full ${syncStatus.connected ? 'bg-emerald-500' : 'bg-amber-500'} ${isSyncingToCloud || syncStatus.isSyncing ? 'animate-ping' : ''}`} />
            <div className="flex flex-col text-[10px] leading-tight">
              <span className="font-bold text-slate-800">
                {syncStatus.connected ? 'Supabase & SQL Connected' : 'Supabase Cloud Sync'}
              </span>
              <span className="text-slate-500">
                {syncStatus.lastSyncedAt
                  ? `Synced: ${new Date(syncStatus.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Ready to sync'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncingToCloud || syncStatus.isSyncing}
              className="ml-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded flex items-center gap-1.5 transition text-[11px] shadow-2xs"
              title="Synchronize all admin staff, roles, departments, and security permissions to live Supabase and PostgreSQL cloud database"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncingToCloud || syncStatus.isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncingToCloud || syncStatus.isSyncing ? 'Syncing...' : 'Sync to SQL & Supabase'}</span>
            </button>
          </div>

          {activeTab === 'users' && (
            <button
              onClick={handleOpenCreateUser}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition shadow-xs text-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Staff User</span>
            </button>
          )}

          {activeTab === 'roles' && (
            <button
              onClick={() => setIsCreateRoleModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition shadow-xs text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Role</span>
            </button>
          )}

          {activeTab === 'approvals' && (
            <button
              onClick={handleOpenCreateRule}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition shadow-xs text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Approval Rule</span>
            </button>
          )}
        </div>
      </div>

      {/* Toast Feedback */}
      {feedbackToast && (
        <div className={`p-3 rounded-lg border text-xs font-bold flex items-center space-x-2 animate-in fade-in ${
          feedbackToast.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' :
          feedbackToast.type === 'error' ? 'bg-red-50 border-red-300 text-red-900' :
          'bg-blue-50 border-blue-300 text-blue-900'
        }`}>
          {feedbackToast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> :
           feedbackToast.type === 'error' ? <AlertTriangle className="w-4 h-4 text-red-600" /> :
           <Check className="w-4 h-4 text-blue-600" />}
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-3 pt-2 rounded-t-xl shadow-xs space-x-1 overflow-x-auto scrollbar-thin">
        <button
          onClick={() => handleTabChange('users')}
          className={`px-3.5 py-2.5 font-bold text-xs border-b-2 transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff Users ({users.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('roles')}
          className={`px-3.5 py-2.5 font-bold text-xs border-b-2 transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'roles'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Role Profiles ({roles.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('permissions')}
          className={`px-3.5 py-2.5 font-bold text-xs border-b-2 transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'permissions'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Permissions & Rules ({MASTER_PERMISSIONS.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('departments')}
          className={`px-3.5 py-2.5 font-bold text-xs border-b-2 transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'departments'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Departments & Cost Centers</span>
        </button>

        <button
          onClick={() => handleTabChange('outlets')}
          className={`px-3.5 py-2.5 font-bold text-xs border-b-2 transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'outlets'
              ? 'border-amber-500 text-amber-600 font-extrabold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>Outlets & Restaurants</span>
        </button>

        <button
          onClick={() => handleTabChange('approvals')}
          className={`px-3.5 py-2.5 font-bold text-xs border-b-2 transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'approvals'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Approval Rules ({approvalRules.length})</span>
        </button>

        <button
          onClick={() => {
            setSelectedActivityUserId(undefined);
            handleTabChange('activity-logs');
          }}
          className={`px-3.5 py-2.5 font-bold text-xs border-b-2 transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'activity-logs'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <History className="w-4 h-4" />
          <span>User Activity Logs ({pmsService.getAuditLogs().length})</span>
        </button>

        <button
          onClick={() => {
            setSelectedErrorUserId(undefined);
            handleTabChange('error-finder');
          }}
          className={`px-3.5 py-2.5 font-bold text-xs border-b-2 transition-colors flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'error-finder'
              ? 'border-rose-600 text-rose-600 font-extrabold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <AlertOctagon className="w-4 h-4 text-rose-500" />
          <span>User Error Finder ({userErrorTrackerService.getErrors().filter(e => e.status !== 'Resolved').length})</span>
          {userErrorTrackerService.getErrors().filter(e => e.status === 'Unresolved').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          )}
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: USERS DIRECTORY & INDIVIDUAL OVERRIDES             */}
      {/* ========================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-3">
          {/* Super Admin Single Authority & Account Creation Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-4 sm:p-5 rounded-2xl shadow-md border border-slate-700/60">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    Super Admin Central Governance
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Root Authority: {users.find(u => u.id === 'usr-admin-1')?.name || 'Super Administrator'} (@{credentials['usr-admin-1']?.username || 'admin'})
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Single Super Admin Model & User Account Management
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  As the central Super Admin, you hold master authority to create, provision, update, and manage all staff and administrative accounts across all resort departments (Front Office, Accounts, F&B, Housekeeping, Stores, Maintenance, and Security).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
                <div className="flex items-center gap-4 px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Users</div>
                    <div className="text-base font-bold text-white">{users.length}</div>
                  </div>
                  <div className="h-6 w-px bg-slate-700" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Active</div>
                    <div className="text-base font-bold text-emerald-400">
                      {users.filter(u => (credentials[u.id]?.status || 'Active') === 'Active').length}
                    </div>
                  </div>
                  <div className="h-6 w-px bg-slate-700" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Roles</div>
                    <div className="text-base font-bold text-blue-400">{roles.length}</div>
                  </div>
                </div>

                <button
                  onClick={handleOpenCreateUser}
                  className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs flex items-center space-x-2 transition-all shadow-md shadow-blue-900/30 hover:shadow-lg active:scale-98 cursor-pointer shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Staff Account</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white border border-gray-200 p-3 rounded-xl shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Staff Name, Email, Employee ID, Username..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium"
              >
                <option value="all">All Departments ({departments.length})</option>
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>

              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium"
              >
                <option value="all">All Roles</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Locked">Locked</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3">Staff Member / ID</th>
                    <th className="p-3">Department & Role</th>
                    <th className="p-3">Permissions & Overrides</th>
                    <th className="p-3">Contact Details</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map(u => {
                    const cred = credentials[u.id] || {
                      username: u.email.split('@')[0],
                      employeeId: 'EMP-001',
                      mobile: '+880 1711-000000',
                      status: 'Active',
                      failedAttempts: 0
                    };

                    const isLocked = cred.lockedUntil && cred.lockedUntil > Date.now();
                    const isInactive = cred.status !== 'Active' || (u as any).active === false;
                    const hasOverrides = (u.customPermissions && u.customPermissions.length > 0) || (u.deniedPermissions && u.deniedPermissions.length > 0);
                    const isRootAdmin = u.id === 'usr-admin-1' || u.roleName === 'Super Admin';

                    return (
                      <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center space-x-2.5">
                            <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs ${
                              isRootAdmin
                                ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-gray-900">{u.name}</span>
                                {isRootAdmin && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5">
                                    <ShieldCheck className="w-2.5 h-2.5 text-amber-700" />
                                    <span>Root Super Admin</span>
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-gray-500 font-mono flex items-center space-x-1.5">
                                <span>{cred.employeeId || 'EMP-001'}</span>
                                <span>•</span>
                                <span>@{cred.username || u.username || u.email.split('@')[0]}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3">
                          <span className="font-bold text-gray-800">{u.roleName}</span>
                          <div className="text-[10px] text-gray-500">{u.department} • {u.dataScope}</div>
                        </td>

                        <td className="p-3">
                          {hasOverrides ? (
                            <div className="flex items-center space-x-1.5">
                              {u.customPermissions && u.customPermissions.length > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200 font-mono">
                                  +{u.customPermissions.length} Granted
                                </span>
                              )}
                              {u.deniedPermissions && u.deniedPermissions.length > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200 font-mono">
                                  -{u.deniedPermissions.length} Denied
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-gray-400 italic">Inherited from Role</span>
                          )}
                        </td>

                        <td className="p-3">
                          <div className="text-gray-800 font-mono text-[11px]">{u.email}</div>
                          <div className="text-[10px] text-gray-500">{cred.mobile || '+880 1711-000000'}</div>
                        </td>

                        <td className="p-3">
                          {isLocked ? (
                            <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300 font-bold text-[10px] flex items-center space-x-1 w-max">
                              <Lock className="w-3 h-3" />
                              <span>Locked</span>
                            </span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              cred.status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                              cred.status === 'Inactive' ? 'bg-gray-100 text-gray-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {cred.status || 'Active'}
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {/* Individual Activity Logs Button */}
                            <button
                              onClick={() => handleViewUserActivity(u.id)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded font-bold text-[11px] transition-colors flex items-center space-x-1"
                              title="View user activity history and audit logs"
                            >
                              <History className="w-3 h-3 text-indigo-600" />
                              <span>Activity</span>
                            </button>

                            {/* Individual Errors Button */}
                            <button
                              onClick={() => handleViewUserErrors(u.id)}
                              className={`px-2.5 py-1 rounded font-bold text-[11px] transition-colors flex items-center space-x-1 ${
                                userErrorTrackerService.getErrorsByUser(u.id).length > 0
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200'
                              }`}
                              title={`View errors faced by ${u.name}`}
                            >
                              <AlertOctagon className={`w-3 h-3 ${userErrorTrackerService.getErrorsByUser(u.id).length > 0 ? 'text-rose-600' : 'text-gray-400'}`} />
                              <span>Errors ({userErrorTrackerService.getErrorsByUser(u.id).length})</span>
                            </button>

                            {/* Individual Permissions Button */}
                            <button
                              onClick={() => handleOpenUserPermissions(u)}
                              disabled={isInactive}
                              className={`px-2.5 py-1 rounded font-bold text-[11px] transition-colors flex items-center space-x-1 ${
                                isInactive
                                  ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60'
                                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300'
                              }`}
                              title={isInactive ? 'Account is inactive — active permissions are disabled' : 'Configure individual permissions overrides for this user'}
                            >
                              <Key className={`w-3 h-3 ${isInactive ? 'text-gray-400' : 'text-amber-600'}`} />
                              <span>{isInactive ? 'Inactive' : 'Permissions'}</span>
                            </button>

                            {isLocked && (
                              <button
                                onClick={() => handleUnlockUser(u)}
                                className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-800 border border-red-300 rounded font-bold text-[11px] transition-colors"
                              >
                                Unlock
                              </button>
                            )}

                            {isRootAdmin ? (
                              <span
                                className="px-2 py-1 bg-gray-50 text-gray-400 border border-gray-200 rounded font-semibold text-[11px] cursor-not-allowed"
                                title="Root Super Admin cannot be deactivated"
                              >
                                Protected
                              </span>
                            ) : (
                              <button
                                onClick={() => handleToggleUserStatus(u)}
                                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded font-bold text-[11px] transition-colors"
                              >
                                {cred.status === 'Active' ? 'Deactivate' : 'Activate'}
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[11px] transition-colors shadow-xs"
                            >
                              Edit
                            </button>

                            {!isRootAdmin && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded font-bold text-[11px] transition-colors flex items-center space-x-1"
                                title="Permanently delete staff user account"
                              >
                                <Trash2 className="w-3 h-3 text-red-600" />
                                <span>Delete</span>
                              </button>
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
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ROLE PERMISSION GROUPS MATRIX                      */}
      {/* ========================================================= */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left Column: Role Directory */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-xs p-3 space-y-2">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <h2 className="font-bold text-gray-800 text-xs uppercase tracking-tight">
                Permission Groups ({roles.length})
              </h2>
              <button
                onClick={() => setIsCreateRoleModalOpen(true)}
                className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Role</span>
              </button>
            </div>

            <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
              {roles.map(r => {
                const isSelected = selectedRoleForPerms?.id === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRoleForPerms(r)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-500/30'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-gray-900 text-xs">{r.name}</div>
                      {r.isSystem && (
                        <span className="px-1.5 py-0.2 rounded bg-gray-200 text-gray-700 text-[9px] font-mono">SYSTEM</span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{r.department}</div>
                    <div className="flex items-center justify-between mt-1 text-[10px]">
                      <span className="text-blue-700 font-mono font-semibold">
                        {(r.permissions || []).includes('*') ? 'Full System (*)' : `${(r.permissions || []).length} capabilities`}
                      </span>
                      <span className="text-emerald-700 font-mono font-semibold">
                        {users.filter(u => u.roleId === r.id && !rbacService.isUserDeleted(u.id) && ((credentials[u.id] ? credentials[u.id].status === 'Active' : (u as any).active !== false))).length} Active Staff
                      </span>
                    </div>
                    <div className="text-[9px] text-gray-400 mt-0.5">Scope: {r.defaultDataScope}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Permission Matrix for Selected Role */}
          {selectedRoleForPerms && (
            <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl shadow-xs p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="font-bold text-gray-900 text-sm">
                      Group Matrix: {selectedRoleForPerms.name}
                    </h2>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold font-mono">
                      {editedPerms.includes('*') ? 'All Capabilities (*)' : `${editedPerms.length} Enabled`}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">{selectedRoleForPerms.description}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] text-gray-500 font-semibold">Active Assigned Staff:</span>
                    {users.filter(u => u.roleId === selectedRoleForPerms.id && !rbacService.isUserDeleted(u.id) && ((credentials[u.id] ? credentials[u.id].status === 'Active' : (u as any).active !== false))).length === 0 ? (
                      <span className="text-[10px] text-amber-600 italic">No active staff currently assigned to this role profile</span>
                    ) : (
                      users
                        .filter(u => u.roleId === selectedRoleForPerms.id && !rbacService.isUserDeleted(u.id) && ((credentials[u.id] ? credentials[u.id].status === 'Active' : (u as any).active !== false)))
                        .map(u => (
                          <span key={u.id} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-medium flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>{u.name}</span>
                          </span>
                        ))
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSaveRolePermissions}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs flex items-center space-x-1.5 transition"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Group Permissions</span>
                  </button>
                </div>
              </div>

              {/* Filters for Matrix */}
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Filter permissions by keyword..."
                    value={rolePermSearch}
                    onChange={e => setRolePermSearch(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1 bg-gray-50 border border-gray-300 rounded text-xs outline-none"
                  />
                </div>
                <select
                  value={rolePermCategoryFilter}
                  onChange={e => setRolePermCategoryFilter(e.target.value)}
                  className="px-2 py-1 bg-gray-50 border border-gray-300 rounded text-xs"
                >
                  <option value="all">All Categories ({categoriesList.length})</option>
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Categories Accordion / Sections */}
              <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
                {categoriesList
                  .filter(cat => rolePermCategoryFilter === 'all' || rolePermCategoryFilter === cat)
                  .map(category => {
                    const categoryPerms = MASTER_PERMISSIONS.filter(
                      p => p.category === category &&
                           (p.label.toLowerCase().includes(rolePermSearch.toLowerCase()) ||
                            p.key.toLowerCase().includes(rolePermSearch.toLowerCase()) ||
                            p.description.toLowerCase().includes(rolePermSearch.toLowerCase()))
                    );

                    if (categoryPerms.length === 0) return null;

                    const allChecked = categoryPerms.every(p => editedPerms.includes(p.key) || editedPerms.includes('*'));

                    return (
                      <div key={category} className="border border-gray-200 rounded-xl p-3 bg-gray-50/50 space-y-2.5">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-gray-900 text-xs uppercase tracking-wider text-blue-900">
                              {category}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">({categoryPerms.length})</span>
                          </div>

                          <div className="flex items-center space-x-2 text-[10px]">
                            <button
                              type="button"
                              onClick={() => handleSelectAllCategory(categoryPerms)}
                              className="text-blue-600 hover:text-blue-800 font-semibold"
                            >
                              Select All
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              type="button"
                              onClick={() => handleDeselectAllCategory(categoryPerms)}
                              className="text-gray-500 hover:text-gray-700 font-semibold"
                            >
                              Deselect All
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {categoryPerms.map(perm => {
                            const isGranted = editedPerms.includes(perm.key) || editedPerms.includes('*');
                            return (
                              <label
                                key={perm.key}
                                className={`flex items-start space-x-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                                  isGranted
                                    ? 'bg-blue-50/40 border-blue-200'
                                    : 'bg-white border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isGranted}
                                  onChange={() => handleToggleRolePermission(perm.key)}
                                  className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-bold text-gray-900 text-xs truncate">{perm.label}</span>
                                    {getRiskBadge(perm.riskLevel)}
                                  </div>
                                  <div className="text-[10px] font-mono text-gray-400 mt-0.5">{perm.key}</div>
                                  <div className="text-[10px] text-gray-500 mt-1 line-clamp-2">{perm.description}</div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: APPROVAL RULES & THRESHOLDS                        */}
      {/* ========================================================= */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="bg-amber-50/60 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 flex items-start space-x-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-950">Financial Governance & Operational Approval Policies</div>
              <p className="text-[11px] text-amber-800 mt-0.5">
                These rules enforce mandatory supervisory authorizations before critical financial operations can be performed, such as reopening settled folios (resettlement), voiding official invoices, reversing payments, or extending corporate credit limits.
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3">Rule Code & Name</th>
                    <th className="p-3">Category & Action</th>
                    <th className="p-3">Threshold Amount</th>
                    <th className="p-3">Authorized Signatures</th>
                    <th className="p-3">Dual Sign-off</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {approvalRules.map(rule => {
                    return (
                      <tr key={rule.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-gray-900">{rule.name}</div>
                          <div className="text-[10px] font-mono text-gray-500">{rule.ruleCode}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{rule.description}</div>
                        </td>

                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200">
                            {rule.category}
                          </span>
                          <div className="text-[10px] text-gray-600 font-medium mt-1">{rule.actionType}</div>
                        </td>

                        <td className="p-3">
                          {rule.minThreshold === 0 ? (
                            <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold text-[10px] border border-purple-200">
                              Universal (All Amounts)
                            </span>
                          ) : (
                            <span className="font-bold text-gray-900 font-mono text-xs">
                              ৳{(rule.minThreshold || 0).toLocaleString()} +
                            </span>
                          )}
                        </td>

                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {rule.requiredRoleIds.map(rid => {
                              const r = roles.find(ro => ro.id === rid);
                              return (
                                <span key={rid} className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-bold text-[9px] border border-gray-200">
                                  {r ? r.name : rid}
                                </span>
                              );
                            })}
                          </div>
                        </td>

                        <td className="p-3">
                          {rule.requiresTwoSignatures ? (
                            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200">
                              Dual Approval Required
                            </span>
                          ) : (
                            <span className="text-[11px] text-gray-500">Single Sign-off</span>
                          )}
                        </td>

                        <td className="p-3">
                          <button
                            onClick={() => handleToggleRuleStatus(rule)}
                            className={`px-2 py-0.5 rounded font-bold text-[10px] transition ${
                              rule.active
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {rule.active ? 'Active' : 'Inactive'}
                          </button>
                        </td>

                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleOpenEditRule(rule)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[11px] transition shadow-xs"
                          >
                            Edit Rule
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: PERMISSIONS & POLICY RULES MATRIX                   */}
      {/* ========================================================= */}
      {activeTab === 'permissions' && (
        <AdminPermissionsTab
          roles={roles}
          onNavigateToRoles={(roleId) => handleTabChange('roles')}
          onShowToast={(msg, typ) => setFeedbackToast({ message: msg, type: typ || 'success' })}
        />
      )}

      {/* ========================================================= */}
      {/* TAB 5: DEPARTMENTS & COST CENTERS DIRECTORY               */}
      {/* ========================================================= */}
      {activeTab === 'departments' && (
        <AdminDepartmentsTab
          onShowToast={(msg, typ) => setFeedbackToast({ message: msg, type: typ || 'success' })}
        />
      )}

      {/* ========================================================= */}
      {/* TAB 6: OUTLETS & RESTAURANTS DIRECTORY                    */}
      {/* ========================================================= */}
      {activeTab === 'outlets' && (
        <AdminOutletsTab
          onShowToast={(msg, typ) => setFeedbackToast({ message: msg, type: typ || 'success' })}
        />
      )}

      {/* ========================================================= */}
      {/* TAB 7: USER ACTIVITY LOGS & AUDIT TRAIL                  */}
      {/* ========================================================= */}
      {activeTab === 'activity-logs' && (
        <AdminActivityLogsTab
          initialUserId={selectedActivityUserId}
          onShowToast={(msg, typ) => setFeedbackToast({ message: msg, type: typ || 'success' })}
          onNavigateToUser={(uid) => {
            setSearch(uid);
            handleTabChange('users');
          }}
        />
      )}

      {/* ========================================================= */}
      {/* TAB 8: USER ERROR FINDER & INCIDENT DIAGNOSTICS          */}
      {/* ========================================================= */}
      {activeTab === 'error-finder' && (
        <AdminErrorFinderTab
          initialUserId={selectedErrorUserId}
          onShowToast={(msg, typ) => setFeedbackToast({ message: msg, type: typ || 'success' })}
          onNavigateToUser={(uid) => {
            setSearch(uid);
            handleTabChange('users');
          }}
          onNavigateToRoute={onNavigate}
        />
      )}
      {/* ========================================================= */}
      {isUserPermsModalOpen && selectedUserForPerms && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50/80">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white font-bold flex items-center justify-center shadow-xs">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm uppercase">
                    Individual Permissions: {selectedUserForPerms.name}
                  </h3>
                  <div className="text-[11px] text-gray-500 flex items-center space-x-2 mt-0.5">
                    <span>Role: <strong className="text-gray-800">{selectedUserForPerms.roleName}</strong></span>
                    <span>•</span>
                    <span>Department: <strong className="text-gray-800">{selectedUserForPerms.department}</strong></span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsUserPermsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Bar */}
            <div className="p-3 bg-blue-50/40 border-b border-blue-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-3">
                <span className="text-gray-600">
                  Custom Granted: <strong className="text-emerald-700 font-mono">+{userCustomPerms.length}</strong>
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-600">
                  Explicitly Denied: <strong className="text-rose-700 font-mono">-{userDeniedPerms.length}</strong>
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleClearAllUserOverrides}
                  className="px-2.5 py-1 text-gray-600 hover:text-gray-900 font-bold text-[11px] border border-gray-300 rounded hover:bg-white transition"
                >
                  Reset to Role Defaults
                </button>
              </div>
            </div>

            {/* Search & Category Filter */}
            <div className="p-3 border-b border-gray-200 flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search individual permissions..."
                  value={userPermSearch}
                  onChange={e => setUserPermSearch(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1 bg-gray-50 border border-gray-300 rounded text-xs outline-none"
                />
              </div>

              <select
                value={userPermCategoryFilter}
                onChange={e => setUserPermCategoryFilter(e.target.value)}
                className="px-2.5 py-1 bg-gray-50 border border-gray-300 rounded text-xs font-medium"
              >
                <option value="all">All Categories ({categoriesList.length})</option>
                {categoriesList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Permissions List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4 max-h-[500px]">
              {categoriesList
                .filter(cat => userPermCategoryFilter === 'all' || userPermCategoryFilter === cat)
                .map(cat => {
                  const filteredPerms = MASTER_PERMISSIONS.filter(
                    p => p.category === cat &&
                         (p.label.toLowerCase().includes(userPermSearch.toLowerCase()) ||
                          p.key.toLowerCase().includes(userPermSearch.toLowerCase()) ||
                          p.description.toLowerCase().includes(userPermSearch.toLowerCase()))
                  );

                  if (filteredPerms.length === 0) return null;

                  const userRole = roles.find(r => r.id === selectedUserForPerms.roleId);
                  const roleHasWildcard = userRole?.permissions.includes('*');

                  return (
                    <div key={cat} className="border border-gray-200 rounded-xl p-3 bg-gray-50/50 space-y-2">
                      <div className="font-bold text-gray-900 text-xs uppercase tracking-wide text-blue-950 border-b border-gray-200 pb-1.5 flex items-center justify-between">
                        <span>{cat}</span>
                        <span className="text-[10px] text-gray-500 font-mono">({filteredPerms.length})</span>
                      </div>

                      <div className="space-y-1.5">
                        {filteredPerms.map(perm => {
                          const isRoleGranted = roleHasWildcard || (userRole ? userRole.permissions.includes(perm.key) : false);
                          const isCustomGranted = userCustomPerms.includes(perm.key);
                          const isDenied = userDeniedPerms.includes(perm.key);

                          const isEffective = !isDenied && (isCustomGranted || isRoleGranted);

                          return (
                            <div
                              key={perm.key}
                              className={`p-2.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition ${
                                isDenied
                                  ? 'bg-rose-50/40 border-rose-200'
                                  : isCustomGranted
                                  ? 'bg-emerald-50/40 border-emerald-200'
                                  : 'bg-white border-gray-200'
                              }`}
                            >
                              <div className="flex-1 min-w-0 pr-2">
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-gray-900 text-xs">{perm.label}</span>
                                  {getRiskBadge(perm.riskLevel)}
                                  {isEffective ? (
                                    <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">ALLOWED</span>
                                  ) : (
                                    <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 text-[9px] font-bold">BLOCKED</span>
                                  )}
                                </div>
                                <div className="text-[10px] font-mono text-gray-400 mt-0.5">{perm.key}</div>
                                <div className="text-[10px] text-gray-500 mt-0.5">{perm.description}</div>
                              </div>

                              {/* 3-Way Segmented Control */}
                              <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-300 text-[10px] font-bold shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleSetUserPermMode(perm.key, 'inherit')}
                                  className={`px-2.5 py-1 rounded transition ${
                                    !isCustomGranted && !isDenied
                                      ? 'bg-white text-gray-900 shadow-xs'
                                      : 'text-gray-500 hover:text-gray-800'
                                  }`}
                                  title="Inherit directly from assigned user role"
                                >
                                  Inherit ({isRoleGranted ? 'On' : 'Off'})
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleSetUserPermMode(perm.key, 'grant')}
                                  className={`px-2.5 py-1 rounded transition ${
                                    isCustomGranted
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'text-gray-500 hover:text-emerald-700'
                                  }`}
                                  title="Explicitly grant this permission to this user"
                                >
                                  + Grant
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleSetUserPermMode(perm.key, 'deny')}
                                  className={`px-2.5 py-1 rounded transition ${
                                    isDenied
                                      ? 'bg-rose-600 text-white shadow-xs'
                                      : 'text-gray-500 hover:text-rose-700'
                                  }`}
                                  title="Explicitly deny/revoke this permission from this user"
                                >
                                  - Deny
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsUserPermsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-bold text-xs hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveUserOverrides}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition"
              >
                Save Overrides
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: USER CREATE & EDIT MODAL                        */}
      {/* ========================================================= */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-sm uppercase">
                  {editingUserId ? 'Edit Staff Profile & Access' : 'Create New Staff User'}
                </h3>
              </div>
              <button onClick={() => setIsUserModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-4 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold text-xs mb-1">Full Name:</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g. Shamima Akter"
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold text-xs mb-1">Employee ID:</label>
                  <input
                    type="text"
                    required
                    value={formEmployeeId}
                    onChange={e => setFormEmployeeId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold text-xs mb-1">Username:</label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={e => setFormUsername(e.target.value)}
                    placeholder="e.g. shamima"
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold text-xs mb-1">Staff Email:</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="e.g. s.akter@cculbresort.com"
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold text-xs mb-1">Department:</label>
                  <select
                    value={formDepartment}
                    onChange={e => {
                      const newDept = e.target.value as any;
                      setFormDepartment(newDept);
                      if (newDept === 'Executive Management') {
                        setFormRoleId('role-super-admin');
                        setFormDataScope('Enterprise');
                      }
                    }}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-medium"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold text-xs mb-1">System Role:</label>
                  <select
                    value={formRoleId}
                    onChange={e => {
                      const newRole = e.target.value;
                      setFormRoleId(newRole);
                      const rDef = roles.find(r => r.id === newRole);
                      if (newRole === 'role-super-admin' || rDef?.name.toLowerCase().includes('super admin')) {
                        setFormDepartment('Executive Management');
                        setFormDataScope('Enterprise');
                      }
                    }}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-medium"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold text-xs mb-1">Data Scope:</label>
                  <select
                    value={formDataScope}
                    onChange={e => setFormDataScope(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-medium"
                  >
                    <option value="Self">Self Only</option>
                    <option value="Department">Department Scope</option>
                    <option value="Property">Full Property</option>
                    <option value="Enterprise">Enterprise Super-Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold text-xs mb-1">Password {editingUserId && '(Leave blank to retain current)'}:</label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={e => setFormPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold text-xs mb-1">Account Status:</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-medium"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Locked">Locked</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-3.5 py-1.5 border border-gray-300 rounded font-bold text-gray-700 hover:bg-gray-100 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs shadow-xs"
                >
                  Save Staff Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: CREATE CUSTOM ROLE MODAL                         */}
      {/* ========================================================= */}
      {isCreateRoleModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-sm uppercase">Create Custom Permission Group</h3>
              </div>
              <button onClick={() => setIsCreateRoleModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="p-4 space-y-3">
              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1">Role Title / Group Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Night Auditor Lead or Food & Beverage Captain"
                  value={newRoleName}
                  onChange={e => setNewRoleName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1">Department:</label>
                <select
                  value={newRoleDept}
                  onChange={e => setNewRoleDept(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-medium"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1">Base Template (Copy Permissions From):</label>
                <select
                  value={newRoleTemplate}
                  onChange={e => setNewRoleTemplate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-medium"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({(r.permissions || []).length} perms)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1">Description:</label>
                <textarea
                  rows={2}
                  value={newRoleDesc}
                  onChange={e => setNewRoleDesc(e.target.value)}
                  placeholder="Operational responsibilities and scope"
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs"
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateRoleModalOpen(false)}
                  className="px-3.5 py-1.5 border border-gray-300 rounded text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-xs"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: APPROVAL RULE EDIT & CREATE MODAL               */}
      {/* ========================================================= */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-sm uppercase">
                  {editingRule ? `Edit Rule: ${editingRule.name}` : 'Create Approval Rule'}
                </h3>
              </div>
              <button onClick={() => setIsRuleModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveApprovalRule} className="p-4 space-y-3">
              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1">Rule Name / Action:</label>
                <input
                  type="text"
                  required
                  value={ruleName}
                  onChange={e => setRuleName(e.target.value)}
                  placeholder="e.g., Bill Resettlement Approval"
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold text-xs mb-1">Category:</label>
                  <select
                    value={ruleCategory}
                    onChange={e => setRuleCategory(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-medium"
                  >
                    <option value="Billing">Billing (Resettle / Void)</option>
                    <option value="Payment">Payment (Void / Refund)</option>
                    <option value="Discount">Discount / Allowance</option>
                    <option value="Credit Limit">Credit Limit</option>
                    <option value="Procurement">Procurement & PO</option>
                    <option value="Expense">Expense Voucher</option>
                    <option value="HR">HR & Roster</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold text-xs mb-1">Min Threshold (৳ BDT):</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={ruleThreshold}
                    onChange={e => setRuleThreshold(Number(e.target.value))}
                    placeholder="0 for universal"
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-mono"
                  />
                  <div className="text-[10px] text-gray-400 mt-0.5">0 applies rule to all transactions</div>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1">Authorized Approver Roles:</label>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-2 border border-gray-200 rounded bg-gray-50">
                  {roles.map(r => {
                    const checked = ruleRoles.includes(r.id);
                    return (
                      <label key={r.id} className="flex items-center space-x-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            if (checked) {
                              setRuleRoles(ruleRoles.filter(id => id !== r.id));
                            } else {
                              setRuleRoles([...ruleRoles, r.id]);
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-0"
                        />
                        <span className="truncate">{r.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                <div>
                  <div className="font-bold text-gray-800 text-xs">Require Dual Approvals</div>
                  <div className="text-[10px] text-gray-500">Requires 2 independent managerial signatures</div>
                </div>
                <input
                  type="checkbox"
                  checked={ruleRequiresTwoSignatures}
                  onChange={e => setRuleRequiresTwoSignatures(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-0 h-4 w-4"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1">Policy Description / Narrative:</label>
                <textarea
                  rows={2}
                  value={ruleDesc}
                  onChange={e => setRuleDesc(e.target.value)}
                  placeholder="Explain why this authorization is necessary"
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs"
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-3.5 py-1.5 border border-gray-300 rounded text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-xs"
                >
                  Save Policy Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================= */}
      {/* MODAL 5: DELETE USER CONFIRMATION MODAL                   */}
      {/* ========================================================= */}
      {deletingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-red-50">
              <div className="flex items-center space-x-2 text-red-800">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-sm uppercase">
                  Delete Staff Account
                </h3>
              </div>
              <button onClick={() => setDeletingUser(null)} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-gray-700 leading-relaxed">
                Are you sure you want to permanently delete the account for <strong className="text-gray-900">{deletingUser.name}</strong> ({deletingUser.email})?
              </p>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs space-y-1 text-gray-600">
                <div>• <span className="font-semibold text-gray-700">Role:</span> {deletingUser.roleName}</div>
                <div>• <span className="font-semibold text-gray-700">Department:</span> {deletingUser.department}</div>
                <div>• <span className="font-semibold text-gray-700">Account ID:</span> {deletingUser.id}</div>
              </div>
              <p className="text-[11px] text-red-600 font-medium leading-relaxed">
                Warning: This will permanently remove login credentials, revoke access, and remove the staff member from the system.
              </p>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-3.5 py-1.5 border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteUser}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Permanently Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
