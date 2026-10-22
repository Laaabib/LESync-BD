# Implementation Plan: System Owner Security, Database Isolation, and Master Ledger Correction

Provide strict access control separation between normal users and the root System Owner (`@admin` - Labib Zunaedy), isolate development/IDE database changes through a cloud sync toggle, update the central support hotline, safeguard data wiping, and build a background Master Ledger & inline charge correction suite.

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your confirmed choices:
> 1. **System Owner Exclusivity**: Only the root account `@admin` (Labib Zunaedy) holds System Owner authority. Regular staff (front desk, housekeeping, cashiers, and standard IT/managers) will strictly see only their own staff profile details and cannot switch roles, switch staff, open staff admin, or wipe database state.
> 2. **IDE & Database Isolation**: A dedicated manual cloud sync toggle will safeguard the live production database. In development/IDE preview mode, cloud sync to Supabase is disabled by default to protect live records.
> 3. **Master Ledger & Billing Correction**: Both a dedicated background Master Ledger Tool and owner-only inline table editing in folios/invoices will allow correcting wrongly posted bills, room charges, or amounts in real-time without interrupting active operations.
> 4. **Support Hotline**: Updated to `+8801330480273` across system settings, vouchers, invoices, and registration cards.

---

## 1. Overview & Core Concept

- **What It Does**:
  - Restricts the User Account popover so normal users only see their individual staff details, shift, profile edit, and sign-out.
  - Hides "Switch Role", "Switch Staff", "Staff Administration & Permissions", and "Reset Data to Clean State" from non-root accounts.
  - Implements a Cloud Sync toggle preventing IDE/dev environments from overwriting production database state.
  - Updates the central support phone number to `+8801330480273`.
  - Introduces a background Master Ledger Editor and inline table edit controls for `@admin` to fix mistaken charges, wrong bill amounts, or miscalculated folios seamlessly.
- **Target Audience**: Root System Owner (`@admin`), operational staff, and guests.
- **Key Value**: Security hardening, zero unauthorized database resets, isolated development testing, and immediate live correction of accounting errors.

---

## 2. User Experience & Visual Design

### A. User Profile / Account Dropdown (`UserAccountDropdown.tsx`)
- **For Normal Staff Users**:
  - Displays only the **Staff Details** card: Name, Employee ID, Username, Email, Authority badge, Assigned Shift, and Property.
  - Action buttons limited to: **Edit Profile / Change Name** and **Sign Out (Lock Session)**.
  - **Tabs Hidden**: The "Switch Role" and "Switch Staff" tabs are completely removed.
  - **Dangerous Actions Hidden**: "Staff Administration & Permissions" and "Reset Data to Clean State" are completely hidden.
- **For Root System Owner (`@admin` - Labib Zunaedy)**:
  - Displays all tabs ("Staff Details", "Switch Role", "Switch Staff").
  - Displays "Staff Administration & Permissions", "Master Ledger & Charge Editor", "Cloud Sync Toggle", and the guarded "Reset Data to Clean State" button.

### B. IDE & Production Database Sync Isolation
- Introduce `isCloudSyncEnabled` state in `supabaseSyncService.ts`:
  - In development preview (`ais-dev-*` or `import.meta.env.DEV`), default is `OFF` (Local Sandbox Mode).
  - In production / deployment, default is `ON`.
  - A persistent toggle switch in the System Owner panel and header sync indicator allows `@admin` to toggle live sync on or off at will.
  - When disabled, IDE changes remain local to browser storage and never alter production Supabase tables.

### C. Master Ledger & Background Charge Editor (`MasterLedgerCorrectionModal.tsx`)
- Accessible exclusively by `@admin`:
  - **Search & Filter**: Lookup any Folio, Room Number, Guest Name, or Transaction Code.
  - **Live Table**: Lists all posted charges (room tariff, restaurant POS, laundry, mini-bar, VAT, service charges, payments).
  - **Direct Inline Correction**:
    - Edit charge description, posted amount (BDT), date, or department classification.
    - Click **Apply Correction**: dynamically updates the transaction, recalculates folio subtotal, taxes, service charges, and balance.
    - Logs a non-disruptive administrative audit entry (`Master Correction: Adjusted Charge TRX-XXXX by System Owner`).
    - Pushes a live `notify()` event so any staff viewing that guest's folio sees the updated balance instantly without refreshing or logging out.
- **Owner Inline Editing in Folio Drawer (`FolioDrawer.tsx`)**:
  - When viewed by `@admin`, each posted line item displays an inline edit pencil button.

### D. Central Support Number
- Update central support number across:
  - `DEFAULT_SETTINGS.phone` in `mockPmsDatabase.ts` -> `+8801330480273`.
  - `SettingsView.tsx` default hotline -> `+8801330480273`.
  - `PrintableModal.tsx` header/footer default -> `+8801330480273`.
  - Auto-migration check in `pmsService.initializeDatabase()` to update existing cached settings.

---

## 3. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                 System Owner Permission Gate                │
│                                                             │
│   Active User Context                                       │
│         │                                                   │
│         ▼                                                   │
│   authService.isSystemOwner()                               │
│         │                                                   │
│   ┌─────┴─────────────────────────┐                         │
│   ▼                               ▼                         │
│ [Normal Staff]             [Root System Owner @admin]        │
│ • View Own Details         • View Full Staff Details        │
│ • Edit Profile Name        • Switch Roles & Staff           │
│ • Sign Out                 • Staff Administration           │
│                            • Clean Reset (0 BDT Wipe)       │
│                            • Cloud Sync Toggle (IDE Protect)│
│                            • Master Ledger / Charge Editor  │
└─────────────────────────────────────────────────────────────┘
```

### Component & Handler Mapping

| Component | Responsibility | Access Condition |
| :--- | :--- | :--- |
| `UserAccountDropdown.tsx` | Profile menu rendering | Tabs & Admin options restricted to `authService.isSystemOwner(activeUser)` |
| `supabaseSyncService.ts` | Cloud database push/pull | Checks `isCloudSyncEnabled()`; skips cloud push in IDE preview when disabled |
| `MasterLedgerCorrectionModal.tsx` | Master background bill/charge editor | Accessible only to `@admin` |
| `FolioDrawer.tsx` | Guest folio detail & charges | Shows inline charge edit controls only when `authService.isSystemOwner()` |
| `pmsService.ts` | Transaction correction & clean reset | `resetToCleanState()` and `correctFolioTransaction()` guarded with root checks |

---

## 4. Verification Plan

1. **Normal User View**:
   - Log in as Front Desk (e.g., `@receptionist` or `@cashier`).
   - Open User Profile dropdown: verify "Switch Role", "Switch Staff", "Staff Admin", and "Reset Data" are completely gone.
   - Verify only own profile details, name edit, and sign out are visible.
2. **System Owner View (`@admin`)**:
   - Verify full tabs, switch roles/staff, and Master Ledger Editor are visible.
   - Test "Reset Data to Clean State": confirm it resets rooms, cancels/vanishes bookings, and zeroes all BDT balances.
3. **Database Isolation Toggle**:
   - Toggle Cloud Sync off: verify IDE changes do not sync to Supabase.
   - Toggle Cloud Sync on: verify manual sync succeeds.
4. **Master Ledger & Charge Correction**:
   - Open a folio with a posted bill (e.g. ৳5,000 charge).
   - Use Master Ledger Editor to change amount to ৳3,500.
   - Verify the folio balance updates immediately to ৳3,500 without page reload or disruption.
5. **Support Hotline**:
   - Verify settings, invoices, and vouchers display `+8801330480273`.
6. **Build Quality**:
   - Run `lint_applet` (`tsc --noEmit`) and `compile_applet`.
