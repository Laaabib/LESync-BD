# Restrict Reservation Editing for Checked-In and Cancelled Bookings

Ensure that reservations with status `Checked-In` or `Cancelled` cannot be edited anywhere in the application, enforcing clean PMS lifecycle integrity across all views, modals, and backend services.

## User Review & Critical Decisions

> [!IMPORTANT]
> - **Checked-In Stays**: Once a guest is checked in, their stay is actively tracked in-house. Operational changes (e.g. room moves, extend stay, add charges, payment adjustments) are managed through the **In-House Guest Folio** and **Room Rack / Front Desk**, preventing pre-stay reservation overwrites.
> - **Cancelled Reservations**: Cancelled bookings are archived records. They cannot be edited; only permanent deletion (hard purge) or audit review is permitted.
> - **Active Bookings**: Only active, pre-arrival reservations (`Confirmed`, `Unconfirmed`, `Pending`) will display the **Edit Reservation** action.

---

## 1. Overview & Core Concept

- **What It Does**: Hides and disallows the **Edit Reservation** affordance whenever a reservation has a status of `Checked-In` or `Cancelled`.
- **Target Audience**: Front office staff, reservation agents, and hotel management.
- **Key Value**: Prevents operational inconsistencies (such as reassigning a room or altering rates on an already checked-in or already cancelled reservation), aligning with hospitality industry PMS best practices.

---

## 2. User Experience & Visual Design

### A. Reservations Directory (`src/views/ReservationsView.tsx`)
- In the actions column of each table row:
  - If status is `Confirmed`, `Unconfirmed`, or `Pending`: show **Print Voucher**, **Edit** (`Edit3`), **Check-In**, and **Cancel/Delete** (`Trash2`).
  - If status is `Checked-In`: hide **Edit**; show **Print Voucher** and view options.
  - If status is `Cancelled`: hide **Edit** and **Check-In**; show only **Print Voucher** and **Permanently Delete** (`Trash2`).

### B. Front Desk Arrivals (`src/views/FrontDeskView.tsx`)
- In the **Upcoming Check-Ins** table:
  - Conditionally render the **Edit** action button only when `res.status !== 'Checked-In' && res.status !== 'Cancelled'`.
  - For checked-in guests, front desk agents manage them from the **In-House** tab.

### C. Room Tape Chart & Calendar (`src/views/ReservationCalendarView.tsx`)
- In the **Unassigned Bookings** dock:
  - Conditionally render the **Edit** button only for non-checked-in, non-cancelled bookings.
- In the **Reservation Details & Quick Action Modal** (opened by clicking any reservation block on the grid):
  - When status is `Checked-In`:
    - Display an in-house badge and note: *"Guest is currently in-house. Manage room moves & folio charges via Front Desk."*
    - The **Edit Reservation** button is hidden.
  - When status is `Cancelled`:
    - Display a cancellation badge with timestamp and reason.
    - The **Edit Reservation** button is hidden.
    - Only the **Permanently Delete** button remains available.
  - When status is `Confirmed` / `Pending`:
    - Both **Edit Reservation** and **Check-In** / **Cancel** buttons are displayed.

### D. Edit Reservation Modal Safeguard (`src/components/drawers/EditReservationModal.tsx`)
- If the modal is opened for a reservation whose status is `Checked-In` or `Cancelled`:
  - Display a prominent informational warning: *"This reservation is [Checked-In / Cancelled] and cannot be modified."*
  - Disable the Save Changes button and inputs to prevent accidental state corruption.

### E. PMS Service Business Logic (`src/services/pmsService.ts`)
- In `updateReservation(reservationId, updates)`:
  - Validate:
    ```ts
    if (res.status === 'Checked-In') {
      throw new Error('Cannot edit a reservation that is currently Checked-In. Modifications must be made via Stay & Folio management.');
    }
    if (res.status === 'Cancelled') {
      throw new Error('Cannot edit a cancelled reservation.');
    }
    ```

---

## 3. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                 Reservation Status Lifecycle                │
│                                                             │
│   [Confirmed / Unconfirmed / Pending] ──────┐               │
│         │                                   │               │
│         │ (Edit Allowed: Dates/Room/Rate)   │               │
│         │                                   │               │
│         ▼                                   ▼               │
│   [Checked-In]                         [Cancelled]          │
│         │                                   │               │
│         │ ❌ NO EDIT OPTION                 │ ❌ NO EDIT    │
│         ▼                                   ▼               │
│   Manage via In-House Folio           Purge / Audit Only    │
└─────────────────────────────────────────────────────────────┘
```

### Component State & Handler Mapping

| Component | Location | Condition / Rule |
| :--- | :--- | :--- |
| `ReservationsView` | Table row action group | `{res.status !== 'Checked-In' && res.status !== 'Cancelled' && (<button ... Edit3 />)}` |
| `FrontDeskView` | Arrivals row action group | `{res.status !== 'Checked-In' && res.status !== 'Cancelled' && (<button ... Edit3 />)}` |
| `ReservationCalendarView` | Unassigned card & Detail dialog | `{selectedResForDetail.status !== 'Checked-In' && selectedResForDetail.status !== 'Cancelled' && (<button ... Edit Reservation />)}` |
| `EditReservationModal` | Modal body & Save action | Read-only mode & warning banner if `status === 'Checked-In' \|\| status === 'Cancelled'` |
| `pmsService` | `updateReservation()` | Throws explicit error if status is `Checked-In` or `Cancelled` |

---

## 4. Verification Plan

1. **Reservations Directory**:
   - Inspect table rows: verify confirmed reservations have the Edit button.
   - Inspect checked-in and cancelled reservations: verify the Edit button is completely removed.
2. **Calendar View**:
   - Click on a green confirmed block: verify "Edit Reservation" button is shown.
   - Click on a blue checked-in block: verify "Edit Reservation" button is absent; status note indicates active in-house stay.
3. **Front Desk Arrivals**:
   - Verify only valid upcoming arrivals show the Edit button.
4. **Service Level**:
   - Test `pmsService.updateReservation` against a checked-in reservation: ensure error is thrown.
5. **Code Quality**:
   - Run `lint_applet` (`tsc --noEmit`) and `compile_applet` to guarantee zero build errors.
