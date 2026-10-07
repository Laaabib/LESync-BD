import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Clock,
  LogOut,
  RefreshCw,
  UserCheck,
  ChevronRight,
  ExternalLink,
  Building2,
  Mail,
  Phone,
  KeyRound,
  Check,
  UserPlus,
  Shield,
  Edit3,
  User
} from 'lucide-react';
import { pmsService } from '../../services/pmsService';
import { rbacService } from '../../services/rbacService';
import { authService } from '../../services/authService';
import { UserContext } from '../../types/reportingAndRbac';

interface UserAccountDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
  position: 'header' | 'sidebar';
  activeUser: UserContext;
}

export const UserAccountDropdown: React.FC<UserAccountDropdownProps> = ({
  isOpen,
  onClose,
  onNavigate,
  position,
  activeUser
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'switch-role' | 'switch-user'>('profile');
  const [roles, setRoles] = useState(rbacService.getRoles());
  const [users, setUsers] = useState(pmsService.getState().users || []);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Keep users, roles and credentials updated with live subscriptions
  const [liveCreds, setLiveCreds] = useState<Record<string, any>>(() => authService.getCredentials());

  useEffect(() => {
    const unsubPms = pmsService.subscribe(() => {
      setUsers(pmsService.getState().users || []);
    });
    const unsubRbac = rbacService.subscribe(() => {
      setRoles(rbacService.getRoles());
    });
    const unsubAuth = authService.subscribe(() => {
      setLiveCreds(authService.getCredentials());
    });
    setRoles(rbacService.getRoles());
    setUsers(pmsService.getState().users || []);
    setLiveCreds(authService.getCredentials());
    return () => {
      unsubPms();
      unsubRbac();
      unsubAuth();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const creds = liveCreds[activeUser.id] || authService.getCredentials()[activeUser.id];
  const displayUsername = creds?.username || activeUser.username || activeUser.email.split('@')[0];
  const employeeId = creds?.employeeId || 'EMP-001';
  const shiftInfo = authService.getActiveShift()?.shiftNumber || 'SFT-M1';

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(activeUser.name || '');
  const [editUsername, setEditUsername] = useState(displayUsername || '');
  const [editSaveMsg, setEditSaveMsg] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    setEditName(activeUser.name || '');
    setEditUsername(displayUsername || '');
  }, [activeUser, creds, displayUsername]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setIsSavingProfile(true);
    try {
      const trimmedName = editName.trim();
      const trimmedUsername = editUsername.trim() || trimmedName.toLowerCase().replace(/\s+/g, '');
      authService.adminUpdateUser(activeUser.id, {
        name: trimmedName,
        username: trimmedUsername
      });
      setLiveCreds(authService.getCredentials());
      setEditSaveMsg('Saved & synced to SQL & Supabase!');
      setTimeout(() => {
        setEditSaveMsg('');
        setIsEditingProfile(false);
      }, 1200);
    } catch {
      setEditSaveMsg('Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const isHeader = position === 'header';

  return (
    <div
      ref={dropdownRef}
      className={`absolute z-50 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden text-gray-800 animate-in fade-in zoom-in-95 duration-150 ${
        isHeader
          ? 'right-0 top-full mt-2'
          : 'bottom-full left-2 mb-2'
      }`}
    >
      {/* Profile Header Banner */}
      <div className="p-3.5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white relative">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center font-bold text-sm text-amber-300 shadow-sm">
                {activeUser.name ? activeUser.name.charAt(0) : 'U'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" title="Active Status"></span>
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-sm text-white truncate leading-tight">
                {activeUser.name}
              </h4>
              <p className="text-[11px] text-amber-300 font-semibold truncate mt-0.5">
                {activeUser.roleName} <span className="text-slate-400 font-mono text-[10px]">(@{displayUsername})</span>
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {activeUser.department}
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-semibold uppercase tracking-wider">
            Active
          </span>
        </div>

        {/* Shift and Scope Info */}
        <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Shift: <strong className="text-white">{shiftInfo}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate max-w-[120px]">{activeUser.dataScope || 'All Properties'}</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation for switching testing roles / viewing profile */}
      <div className="flex border-b border-gray-200 bg-gray-50 text-[11px] font-medium text-gray-600">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-2 text-center transition-colors border-b-2 ${
            activeTab === 'profile'
              ? 'border-amber-600 text-amber-900 font-bold bg-white'
              : 'border-transparent hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Staff Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('switch-role')}
          className={`flex-1 py-2 text-center transition-colors border-b-2 ${
            activeTab === 'switch-role'
              ? 'border-amber-600 text-amber-900 font-bold bg-white'
              : 'border-transparent hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Switch Role
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('switch-user')}
          className={`flex-1 py-2 text-center transition-colors border-b-2 ${
            activeTab === 'switch-user'
              ? 'border-amber-600 text-amber-900 font-bold bg-white'
              : 'border-transparent hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Switch Staff
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-3 max-h-64 overflow-y-auto scrollbar-thin">
        {activeTab === 'profile' && (
          <div className="space-y-2.5 text-xs">
            <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-gray-400" /> Employee ID:
                </span>
                <span className="font-mono font-bold text-gray-800">{employeeId}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-400" /> Username:
                </span>
                <span className="font-mono font-bold text-gray-800">@{displayUsername}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-gray-400" /> Email:
                </span>
                <span className="font-medium text-gray-800 truncate max-w-[150px]">{activeUser.email}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-gray-400" /> Authority:
                </span>
                <span className="font-semibold text-amber-800">
                  {activeUser.roleName === 'Super Admin' ? 'Root Super Admin (*)' : activeUser.roleName}
                </span>
              </div>
            </div>

            {/* Inline Name / Username Change Card */}
            {isEditingProfile ? (
              <form onSubmit={handleSaveProfile} className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg space-y-2">
                <p className="text-[11px] font-bold text-blue-900 flex items-center gap-1">
                  <Edit3 className="w-3.5 h-3.5 text-blue-700" />
                  <span>Update Name & Username</span>
                </p>
                <div>
                  <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g. Labib Zunaedy"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">Username (Login ID)</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g. admin"
                  />
                </div>
                {editSaveMsg && (
                  <p className="text-[10px] font-bold text-emerald-700">{editSaveMsg}</p>
                )}
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="flex-1 py-1 px-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded text-[11px] transition"
                  >
                    {isSavingProfile ? 'Saving...' : 'Save & Sync'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="py-1 px-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded text-[11px] transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingProfile(true)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 font-bold rounded-lg text-xs transition"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-700" />
                <span>Edit Profile / Change Name</span>
              </button>
            )}

            {/* Direct Link to Staff Administration View */}
            <button
              type="button"
              onClick={() => {
                onNavigate('admin-users');
                onClose();
              }}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-950 font-bold transition-colors"
            >
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-700" />
                <span>Staff Administration & Permissions</span>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-700" />
            </button>
          </div>
        )}

        {activeTab === 'switch-role' && (
          <div className="space-y-1">
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1.5">
              Test Operational Roles (Live PMS Update)
            </p>
            {roles.map(r => {
              const isSelected = activeUser.roleId === r.id || activeUser.roleName === r.name;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    rbacService.switchActiveRole(r.id);
                    if (onNavigate) {
                      onNavigate('dashboard');
                    }
                    onClose();
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <p className="truncate leading-tight">{r.name}</p>
                    <p className={`text-[10px] truncate ${isSelected ? 'text-slate-900/80' : 'text-gray-400'}`}>
                      {r.department}
                    </p>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {activeTab === 'switch-user' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                Staff Accounts ({users.length})
              </p>
              <button
                type="button"
                onClick={() => {
                  onNavigate('admin-users');
                  onClose();
                }}
                className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                title="Open Staff Administration to create or manage accounts"
              >
                <UserPlus className="w-3 h-3" />
                <span>+ Create</span>
              </button>
            </div>

            {users.length <= 1 ? (
              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-lg text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-900 leading-tight text-[11px]">
                      One Super Admin Provisioned
                    </p>
                    <p className="text-[10px] text-amber-800/80 leading-relaxed mt-0.5">
                      The Super Admin is the master account holder. You can create accounts for Front Office, Accounts, F&B, Housekeeping, and more.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('admin-users');
                    onClose();
                  }}
                  className="w-full py-1.5 px-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-[10px] flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Other Staff Accounts</span>
                </button>
              </div>
            ) : null}

            <div className="space-y-1">
              {users.map(u => {
                const isSelected = activeUser.id === u.id || activeUser.email.toLowerCase() === u.email.toLowerCase();
                const isSuperAdmin = rbacService.isSuperAdmin(u as any);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      pmsService.setCurrentUser(u.id);
                      if (onNavigate) {
                        onNavigate('dashboard');
                      }
                      onClose();
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between text-xs transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold'
                        : 'hover:bg-gray-100 text-gray-700 border border-transparent hover:border-gray-200'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate font-semibold leading-tight">{u.name}</p>
                        {isSuperAdmin && (
                          <span className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase tracking-wider ${
                            isSelected ? 'bg-blue-800 text-blue-100' : 'bg-amber-100 text-amber-800'
                          }`}>
                            Super Admin
                          </span>
                        )}
                      </div>
                      <p className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                        {u.role} • {u.department || 'Operations'}
                      </p>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {users.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  onNavigate('admin-users');
                  onClose();
                }}
                className="w-full mt-1.5 py-1.5 px-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-blue-600 font-bold rounded text-[10px] flex items-center justify-center gap-1.5 transition-colors"
              >
                <UserPlus className="w-3 h-3 text-blue-600" />
                <span>+ Create Another Staff Account</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Global Actions Footer */}
      <div className="p-2.5 border-t border-gray-200 bg-gray-50 space-y-1">
        <button
          type="button"
          onClick={() => {
            pmsService.resetToSeed();
            onClose();
          }}
          className="w-full text-left px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-200/70 rounded-lg flex items-center gap-2 font-medium transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          <span>Reset PMS Database to Default Seed</span>
        </button>

        <button
          type="button"
          onClick={() => {
            authService.logout();
            onClose();
          }}
          className="w-full text-left px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 font-bold transition-colors"
        >
          <LogOut className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <span>Sign Out (Lock Session)</span>
        </button>
      </div>
    </div>
  );
};
