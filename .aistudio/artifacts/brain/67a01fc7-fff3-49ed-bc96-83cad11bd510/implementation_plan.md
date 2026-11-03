# Implementation Plan: Persistent Property Settings & Clean-Slate Onboarding Sync

## 1. Confirmed Requirements & Scope
Based on your responses:
- **Target Sections**: Both **System Settings & Property Profile** and **Onboard New Property (Clean Slate)** tabs must reliably save and retain all changes in the final deployed application.
- **Cloud Synchronization Strategy**: Saving property settings or provisioning a new property must **sync immediately to the cloud database** and **block older cloud snapshots from overwriting** newly saved settings or freshly onboarded clean-slate properties.

---

## 2. Root Causes Identified
1. **Cloud Hydration Overwrites Clean-Slate & Updated Settings on Reload**:
   - During startup hydration, the sync service checks whether the local state has active reservations (`reservations.length > 0`). When a new property is onboarded (which resets reservations to `0`) or before new bookings are created, the hydration logic assumes the local database is empty and overwrites it with an older cloud snapshot.
2. **Delayed & Incomplete Snapshot Sync on Save**:
   - Saving settings or onboarding a property currently triggers a debounced background timer rather than an immediate cloud push, and the top-level cloud snapshot metadata (`resort_name` and `business_date`) was reading top-level fields instead of `settings.resortName` and `settings.currentBusinessDate`.
3. **Startup Initialization Overwrites**:
   - Database initialization contains legacy startup overrides that reset certain property names and night-audit flags back to defaults when loading from browser storage.
4. **Uncompressed Base64 Logo Payloads**:
   - Uploading high-resolution PNG/JPEG logos stores raw multi-megabyte Base64 strings directly inside the state payload, which can exceed browser `localStorage` quotas (5 MB limit) or cause cloud sync request payloads to fail silently.
5. **Form State Desynchronization**:
   - The Settings view initializes its input fields once on mount without syncing when the underlying database settings finish hydrating.

---

## 3. Architecture & Data Flow

```text
+-------------------------------------------------------------------------+
|                   Settings & Property Onboarding UI                     |
|  1. Compress uploaded logo (Canvas max 480x180 PNG/WebP, < 40 KB)       |
|  2. Stamp settings.updatedAt = ISO Timestamp                            |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                    Local Persistence Layer (Dual-Key)                   |
|  - Primary PMS State Store (full database + settings)                   |
|  - Dedicated Property Settings Store (lightweight, quota-safe backup)   |
|  - Removes legacy startup overrides on resortName & nightAudit flags    |
+------------------------------------+------------------------------------+
                                     |
                                     | Immediate Async Push (syncNow)
                                     v
+-------------------------------------------------------------------------+
|                Cloud Snapshot & Hydration Guard (Supabase)              |
|  - Writes settings.resortName & settings.currentBusinessDate to cloud   |
|  - Compares settings.updatedAt on startup hydration:                    |
|    * If Local settings.updatedAt >= Cloud settings.updatedAt -> Keep    |
|      local settings & push to cloud                                     |
|    * Respects Clean-Slate onboarded properties (0 reservations)         |
+-------------------------------------------------------------------------+
```

---

## 4. Planned Changes

### A. Versioned Property Settings Persistence & Startup Guard
- Add an explicit `updatedAt` timestamp and `isOnboardedCleanSlate` marker to the system settings record every time **Save System Settings** or **Initialize & Onboard Property** is executed.
- Persist a dedicated, lightweight property settings record in browser storage alongside the main database snapshot so property identity, logo, tax rates, and policies are never lost even if storage is near capacity.
- Remove legacy initialization checks that forcibly reset `resortName`, `email`, `website`, or `autoNightAuditEnabled` on page reload.

### B. Immediate Cloud Sync & Snapshot Metadata Alignment
- Update both **Save System Settings** and **Initialize & Onboard Property** actions to immediately execute and await a full cloud snapshot push (`syncNow`) with visual saving/synced confirmation.
- Ensure the cloud snapshot payload maps `settings.resortName` and `settings.currentBusinessDate` directly into the cloud snapshot's top-level columns so the live server record always matches the active property profile.

### C. Hydration Protection Against Stale Cloud Snapshots
- Update the startup cloud hydration logic to compare `settings.updatedAt` between the local state and the incoming cloud snapshot.
- If the local state has newer property settings or was recently provisioned via **Onboard New Property (Clean Slate)**, block the older cloud snapshot from overwriting local state and immediately push the newer local state to the cloud.
- Preserve newer property settings during background state synchronization unless the user explicitly uploads and restores a manual `.bak` backup file.

### D. Automatic Client-Side Logo Optimization & Form Sync
- Add an automatic client-side image optimizer on both the **Property Profile** and **Onboard New Property** logo uploaders so uploaded PNG/JPG files are scaled cleanly (preserving transparency and crispness for PDFs/invoices) while keeping Base64 strings lightweight and quota-safe.
- Synchronize the Settings view form state when database settings update so the UI always reflects the latest persisted configuration.
