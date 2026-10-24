# System Owner Exclusive Bill/Payment Adjustments & Backdated Data Controls

Strict role-based governance model restricting all financial corrections (bill adjustments, charge edits, folio item voiding, payment voiding, bill resettlements) and past-date entries (backdating) exclusively to System Owner Labib Zunaedy.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed via interactive clarification:
>
> - **Staff Bill & Payment Experience**: Non-owner staff will have full visibility into guest folios, checkout invoices, and cashier payment histories, but all modification affordances (Edit Charge, Void Item, Void Payment, Reopen/Resettle Folio, Post Adjustment, and Void Entire Bill) will be completely hidden from the interface.
> - **Backdated Data Entry Controls**: All date pickers across the application will dynamically bind `min={todayStr}` for non-owners, rendering past dates unselectable in the calendar. If an unauthorized client attempts to bypass the UI, core PMS services will throw strict security errors.
> - **Enforced Functional Domains**:
>   1. **Billing & Folios**: Charge corrections, folio item voids, bill resettlements, payment voids, adjustments, refunds.
>   2. **General Ledger & Accounting**: Manual journal vouchers, ledger adjustments, audit corrections.
>   3. **Front Desk & Reservations**: Check-in arrival dates, room charges, new reservations.
>   4. **F&B POS & Convention Banquets**: Restaurant orders, bar KOTs, banquet event booking schedules.

---

### 1. Overview & Core Concept

#### What It Does
This security update establishes an unassailable financial integrity perimeter. Regular hotel staff (receptionists, cashiers, F&B order-takers, banquet coordinators, and night auditors) can capture current-day transactions and review operational data in real-time, but are prohibited from:
1. Tampering with or adjusting posted bills, line charges, payments, and closed folios.
2. Backdating records to prior calendar dates, which would otherwise alter historical audit trails and closed night-audit books.

Only the authenticated System Owner (**Labib Zunaedy**, `@admin`, `usr-admin-1`, `admin@lesyncpms.com`, `labibzunaedy@gmail.com`) possesses the administrative clearance to correct bills, void payments, and post backdated adjustments.

#### Target Audience & Persona
- **System Owner (Labib Zunaedy)**: Unrestricted master authority to rectify billing errors, override fiscal dates, and execute historical ledger adjustments.
- **Hotel Operations Staff (Front Desk, Cashiers, Accounting, Banquet)**: Clean, high-efficiency data entry restricted to current business dates and non-destructive viewing.

#### Key Value
Eliminates cashier fraud, unauthorized discounts, retro-active folio manipulation, and discrepancy in NBR tax and service charge reports by freezing closed periods and enforcing single-owner financial correction.

---

### 2. User Experience & Visual Design

#### Key User Flows

```
[ Staff User Interaction ]
      │
      ├─► Opens Guest Folio Drawer / Billing Views
      │     └─► View-Only: Line items, payment rows, and receipts visible
      │     └─► Hidden: Edit Charge (Pencil), Void (Trash), Resettle, and Adjustment buttons
      │
      └─► Opens Any Booking / Payment / Journal Date Picker
            └─► Calendar Popup: All dates before current business date are greyed out & disabled
            └─► Input Attribute: min="YYYY-MM-DD" enforced natively

[ System Owner Interaction (Labib Zunaedy) ]
      │
      ├─► Opens Guest Folio Drawer / Billing Views
      │     └─► Full Action Suite: Edit Charge, Void Line, Resettle Folio, Adjustment, Void Payment
      │     └─► Indicator: Amber "System Owner Clearance" badge on financial action panels
      │
      └─► Opens Any Booking / Payment / Journal Date Picker
            └─► Unlocked Calendar: Can select historical dates (yesterday, last month, past years)
            └─► Subtle Audit Notice: "Backdated Entry - System Owner Authorization Logged"
```

#### Visual Identity & SaaS Aesthetics
- **Zero-Pill Discipline**: Statuses and metadata render as clean, unboxed typography with tabular numerals (`font-mono tabular-nums`).
- **Owner Mode Accent**: System Owner action areas use subtle amber highlight tones (`bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20`) with clear typography rather than noisy badge clusters.
- **Calendar Disabled State**: Date picker elements apply standard disabled opacity (`disabled:opacity-40 disabled:cursor-not-allowed`) for previous dates.
- **Auditing Transparency**: When the System Owner performs a correction or posts a backdated entry, an instant audit record is written to `pmsService.logAudit` documenting the previous value, new value, and authorized user.

---

### 3. Key Product Decisions & Trade-Offs

#### Decision 1: Hidden Actions vs. Disabled Tooltips
- **Chosen Approach**: Completely hide financial correction buttons (Void, Resettle, Edit Charge, Post Adjustment) for non-owners, rather than showing disabled grey buttons.
- **Rationale**: Reduces visual clutter for frontline cashiers, prevents cognitive friction, and strictly follows the user's explicit preference ("Allow staff to view bills with edit actions hidden").

#### Decision 2: Two-Tier Defense Architecture
- **Chosen Approach**: Combine HTML5 date picker constraints (`min={isOwner ? undefined : todayStr}`) with strict runtime checks in `pmsService.ts`.
- **Rationale**: UI-level constraints prevent user frustration before form submission; service-level invariants guarantee that even direct script injection or payload modification cannot write backdated records without System Owner clearance.

#### Decision 3: Centralized Date Security Utility
- **Chosen Approach**: Implement a shared utility `src/utils/dateSecurity.ts` providing helper functions (`getMinAllowedDate`, `validateDateEntry`, `isBackdated`) used consistently across all views and modals.
- **Rationale**: Avoids redundant `Date.now()` logic across 10+ different component files and provides a single point of maintenance for business date handling.

---

### 4. Technical Architecture & Data Strategy

#### System Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        User Session Context                            │
│           authService.isSystemOwner(rbacService.getActiveUser())       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
         [ System Owner: TRUE ]              [ System Owner: FALSE ]
                  │                                   │
                  ├─► Bill Edit Controls: Visible     ├─► Bill Edit Controls: Hidden
                  ├─► Date Pickers: Unlocked          ├─► Date Pickers: min={todayStr}
                  └─► Service Actions: Permitted      └─► Service Actions: Denied (Throws Error)
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   pmsService Enforcement Matrix                        │
├────────────────────────────────┬───────────────────────────────────────┤
│ Operation                      │ Authorization Rule                    │
├────────────────────────────────┼───────────────────────────────────────┤
│ correctFolioItem()             │ isSystemOwner() Required (Strict)     │
│ voidFolioItem()                │ isSystemOwner() Required (Strict)     │
│ postFolioAdjustment()          │ isSystemOwner() Required (Strict)     │
│ resettleFolio()                │ isSystemOwner() Required (Strict)     │
│ voidEntireFolio()              │ isSystemOwner() Required (Strict)     │
│ voidPayment()                  │ isSystemOwner() Required (Strict)     │
│ createJournalVoucher(date)     │ date < today => isSystemOwner()       │
│ recordFolioPayment(date)       │ date < today => isSystemOwner()       │
│ createReservation(arrival)     │ arrival < today => isSystemOwner()    │
│ createEventBooking(date)       │ date < today => isSystemOwner()       │
│ createRestaurantOrder(date)    │ date < today => isSystemOwner()       │
└────────────────────────────────────────────────────────────────────────┘
```

#### Files to Update During Execution Phase

1. **`src/utils/dateSecurity.ts` (New Utility)**:
   - `getMinAllowedDate(isOwner: boolean): string | undefined`
   - `isPastDate(dateStr: string, businessDate?: string): boolean`
   - `assertOwnerForBackdate(dateStr: string, isOwner: boolean, operationName: string): void`

2. **`src/services/pmsService.ts`**:
   - Guard `voidFolioItem()`, `postFolioAdjustment()`, `resettleFolio()`, `voidEntireFolio()`, and `voidPayment()` to require `isSystemOwner()`.
   - In `recordFolioPayment()`, `createJournalVoucher()`, `createReservation()`, `createEventBooking()`, and `createRestaurantOrder()`, check if the provided date is prior to current business date; if so, enforce `isSystemOwner()`.

3. **`src/components/drawers/FolioDrawer.tsx`**:
   - Detect `isOwner = authService.isSystemOwner(rbacService.getActiveUser())`.
   - Hide Edit Charge button, Void Line Item button, Reopen/Resettle button, Void Entire Folio button, and Adjustment tab when `!isOwner`.

4. **`src/views/BillingFoliosView.tsx` & `src/views/BillingPaymentsView.tsx`**:
   - Hide Void Payment and Resettle triggers for non-owners.

5. **`src/views/AccountingLedgerView.tsx`**:
   - Enforce `min={isOwner ? undefined : todayStr}` in the Manual Journal Voucher date picker.
   - Display informative System Owner clearance badge.

6. **`src/components/drawers/NewReservationModal.tsx` & `src/components/drawers/QuickCheckInDrawer.tsx`**:
   - Enforce `min={isOwner ? undefined : todayStr}` for arrival/check-in dates.

7. **`src/views/ConventionEventsView.tsx` & `src/views/RestaurantView.tsx`**:
   - Enforce `min={isOwner ? undefined : todayStr}` for banquet event dates and POS order dates.
