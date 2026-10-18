# Implementation Plan: Dynamic Property-Based Backup Naming (`lesync_18_10_26_8.00AM.bak`)

## 1. Overview & Pattern Specification

The user requested that database backup filenames strictly follow the property name and date/time convention:
`example: lesync_18_10_26_8.00AM.bak`

### Format Specification:
`<property_slug>_<DD>_<MM>_<YY>_<time_with_am_pm>.bak`

* **`<property_slug>`**: Dynamically generated from the active property/resort name in System Settings (`db.settings.resortName`), converted to lowercase alphanumeric snake_case (e.g., `"LESync"` → `lesync`, `"CCULB Resort"` → `cculb_resort`).
* **`<DD>_<MM>_<YY>`**: Current two-digit day, two-digit month, and two-digit year (e.g., 18th October 2026 → `18_10_26`).
* **`<time_with_am_pm>`**: 12-hour formatted time with dot separator and uppercase meridian indicator:
  - Morning Shift (8:00 AM) → `8.00AM`
  - Afternoon Shift (4:00 PM) → `4.00PM`
  - Night Audit Close (11:00 PM) → `11.00PM`
  - Current manual execution → e.g. `11.35PM`
* **Extension**: `.bak`

---

## 2. Proposed Changes

### A. Core PMS Service (`src/services/pmsService.ts`)
* Add helper `formatBackupFilename(propertyName?: string, date?: Date, fixedTimeSlot?: string): string`.
* Update `downloadBakArchive()`:
  - Generates the filename using the dynamic property name and current timestamp (e.g. `lesync_18_10_26_8.00AM.bak`).
  - Downloads the `.bak` file in the browser with the exact format.

### B. Backend Auto-Backup Service (`src/server/backupService.ts`)
* Update `createBackup()`:
  - Extract resort/property name from `clientState.settings.resortName` or from PostgreSQL state payload.
  - For `scheduled_8am`: generate `<property>_<DD>_<MM>_<YY>_8.00AM.bak`.
  - For `scheduled_4pm`: generate `<property>_<DD>_<MM>_<YY>_4.00PM.bak`.
  - For `scheduled_11pm`: generate `<property>_<DD>_<MM>_<YY>_11.00PM.bak`.
  - For `manual`: generate `<property>_<DD>_<MM>_<YY>_<H.MM><AM|PM>.bak`.
* Update `listBackupFiles()`:
  - Parse trigger types and time slots correctly from the new naming convention.

### C. Backup Views (`src/views/BackupManagementView.tsx` & `src/views/SettingsView.tsx`)
* Show preview of the exact file name being exported (e.g. `lesync_18_10_26_8.00AM.bak`).
* Ensure manual backup buttons and server archive lists render the clean property-named files.

---

## 3. Verification & Validation Plan

1. **Format Validation**:
   - Verify that exporting from the browser downloads a file matching `lesync_18_10_26_*.bak`.
   - Verify that automated server triggers generate files named:
     - `lesync_18_10_26_8.00AM.bak`
     - `lesync_18_10_26_4.00PM.bak`
     - `lesync_18_10_26_11.00PM.bak`
2. **Dynamic Property Name Test**:
   - Change property name in System Settings (e.g., to "Grand Palace") and verify the generated filename updates to `grand_palace_18_10_26_*.bak`.
3. **Build & Compilation**:
   - Run `lint_applet` and `compile_applet` to confirm zero TypeScript errors.
