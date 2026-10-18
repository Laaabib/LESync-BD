import fs from 'fs';
import path from 'path';
import { pool } from '../db/index';

export interface BackupMetadata {
  filename: string;
  filepath: string;
  sizeBytes: number;
  sizeFormatted: string;
  createdAt: string;
  triggerType: 'scheduled_8am' | 'scheduled_4pm' | 'scheduled_11pm' | 'manual';
  syncedToSupabase: boolean;
  totalEntities?: number;
}

export interface BackupScheduleConfig {
  times: string[]; // ['08:00', '16:00', '23:00']
  backupDir: string;
  autoSyncToSupabase: boolean;
  retentionCount: number;
}

const DEFAULT_SCHEDULE_CONFIG: BackupScheduleConfig = {
  times: ['08:00', '16:00', '23:00'],
  backupDir: path.resolve(process.cwd(), 'backups'),
  autoSyncToSupabase: true,
  retentionCount: 30
};

class BackupService {
  private config: BackupScheduleConfig = { ...DEFAULT_SCHEDULE_CONFIG };
  private timer: NodeJS.Timeout | null = null;
  private lastExecutedDateHour: string = '';

  constructor() {
    this.ensureBackupDir();
    this.startScheduler();
  }

  private ensureBackupDir() {
    try {
      if (!fs.existsSync(this.config.backupDir)) {
        fs.mkdirSync(this.config.backupDir, { recursive: true });
      }
    } catch (err) {
      console.error('[BackupService] Failed to create backup directory:', err);
    }
  }

  public getScheduleConfig(): BackupScheduleConfig & { nextRuns: string[]; totalBackups: number } {
    this.ensureBackupDir();
    const files = this.listBackupFiles();
    const nextRuns = this.calculateNextRuns();

    return {
      ...this.config,
      nextRuns,
      totalBackups: files.length
    };
  }

  private calculateNextRuns(): string[] {
    const now = new Date();
    const nextRuns: string[] = [];

    for (const timeStr of this.config.times) {
      const [hourStr, minuteStr] = timeStr.split(':');
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);

      const candidate = new Date(now);
      candidate.setHours(hour, minute, 0, 0);

      if (candidate.getTime() <= now.getTime()) {
        candidate.setDate(candidate.getDate() + 1);
      }
      nextRuns.push(candidate.toISOString());
    }

    nextRuns.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    return nextRuns;
  }

  private startScheduler() {
    if (this.timer) clearInterval(this.timer);

    // Check every 30 seconds if current time matches 08:00, 16:00, or 23:00
    this.timer = setInterval(() => {
      this.checkAndExecuteSchedule();
    }, 30000);

    // Initial check
    this.checkAndExecuteSchedule();
  }

  private async checkAndExecuteSchedule() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Check for 08:00, 16:00, 23:00 (window of minute 0 to 2)
    const is8am = currentHour === 8 && currentMinute <= 2;
    const is4pm = currentHour === 16 && currentMinute <= 2;
    const is11pm = currentHour === 23 && currentMinute <= 2;

    if (!is8am && !is4pm && !is11pm) {
      return;
    }

    const key = `${now.toISOString().split('T')[0]}_${currentHour}`;
    if (this.lastExecutedDateHour === key) {
      return; // Already executed for this time slot today
    }

    this.lastExecutedDateHour = key;
    const trigger = is8am ? 'scheduled_8am' : is4pm ? 'scheduled_4pm' : 'scheduled_11pm';

    console.log(`[BackupService] Running 3x daily automated backup: ${trigger} at ${now.toISOString()}`);
    try {
      await this.createBackup(trigger);
    } catch (err: any) {
      console.error('[BackupService] Automated scheduled backup failed:', err?.message || err);
    }
  }

  public async createBackup(triggerType: 'scheduled_8am' | 'scheduled_4pm' | 'scheduled_11pm' | 'manual' = 'manual', clientState?: any): Promise<BackupMetadata> {
    this.ensureBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `LESYNC_PMS_BACKUP_${triggerType.toUpperCase()}_${timestamp}.bak`;
    const filepath = path.join(this.config.backupDir, filename);

    // Gather data from PostgreSQL pool or fallback state
    let backupPayload: any = null;
    let totalEntities = 0;

    try {
      if (pool) {
        // Query latest snapshot from pms_snapshots or build export
        const snapRes = await pool.query('SELECT * FROM pms_snapshots ORDER BY snapshot_version DESC LIMIT 1');
        if (snapRes.rows.length > 0) {
          backupPayload = {
            metadata: {
              exportedAt: new Date().toISOString(),
              version: '2.0.0',
              triggerType,
              system: 'LESync Enterprise PMS',
              source: 'Postgres Supabase Snapshot'
            },
            snapshotVersion: snapRes.rows[0].snapshot_version,
            pmsDatabase: snapRes.rows[0].state_payload || snapRes.rows[0].entities || {}
          };
          totalEntities = snapRes.rows[0].total_entities || 0;
        }
      }
    } catch (e: any) {
      console.warn('[BackupService] Postgres query notice while creating backup:', e?.message || e);
    }

    if (!backupPayload && clientState) {
      backupPayload = {
        metadata: {
          exportedAt: new Date().toISOString(),
          version: '2.0.0',
          triggerType,
          system: 'LESync Enterprise PMS',
          source: 'Client PMS State'
        },
        pmsDatabase: clientState
      };
      totalEntities = Object.keys(clientState).length;
    }

    if (!backupPayload) {
      backupPayload = {
        metadata: {
          exportedAt: new Date().toISOString(),
          version: '2.0.0',
          triggerType,
          system: 'LESync Enterprise PMS',
          source: 'Local Auto Snapshot'
        },
        timestamp: new Date().toISOString()
      };
    }

    const fileContent = [
      '-- LESYNC ENTERPRISE PMS DATABASE BACKUP ARCHIVE (.BAK)',
      `-- Exported At: ${new Date().toISOString()}`,
      `-- Trigger: ${triggerType}`,
      `-- Application: LESync Enterprise Property Management System`,
      '-- FORMAT: JSON-CONTAINER',
      JSON.stringify(backupPayload, null, 2)
    ].join('\n');

    fs.writeFileSync(filepath, fileContent, 'utf-8');
    const stats = fs.statSync(filepath);

    let syncedToSupabase = false;
    if (this.config.autoSyncToSupabase && pool) {
      try {
        await pool.query(
          `INSERT INTO pms_sync_events (entity_type, entity_id, action, payload, status)
           VALUES ($1, $2, $3, $4, $5)`,
          ['DATABASE_BACKUP', filename, 'AUTO_BACKUP_SNAPSHOT', { filename, triggerType, sizeBytes: stats.size }, 'SUCCESS']
        );
        syncedToSupabase = true;
      } catch (err: any) {
        console.warn('[BackupService] Sync event notice for backup:', err?.message || err);
      }
    }

    this.pruneOldBackups();

    return {
      filename,
      filepath,
      sizeBytes: stats.size,
      sizeFormatted: `${(stats.size / 1024).toFixed(1)} KB`,
      createdAt: new Date().toISOString(),
      triggerType,
      syncedToSupabase,
      totalEntities
    };
  }

  public listBackupFiles(): BackupMetadata[] {
    this.ensureBackupDir();
    try {
      const files = fs.readdirSync(this.config.backupDir);
      const bakFiles = files.filter(f => f.endsWith('.bak') || f.endsWith('.json'));

      return bakFiles.map(f => {
        const fullPath = path.join(this.config.backupDir, f);
        const stats = fs.statSync(fullPath);

        let triggerType: BackupMetadata['triggerType'] = 'manual';
        if (f.includes('SCHEDULED_8AM')) triggerType = 'scheduled_8am';
        else if (f.includes('SCHEDULED_4PM')) triggerType = 'scheduled_4pm';
        else if (f.includes('SCHEDULED_11PM')) triggerType = 'scheduled_11pm';

        return {
          filename: f,
          filepath: fullPath,
          sizeBytes: stats.size,
          sizeFormatted: `${(stats.size / 1024).toFixed(1)} KB`,
          createdAt: stats.mtime.toISOString(),
          triggerType,
          syncedToSupabase: true
        };
      }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return [];
    }
  }

  public readBackupFileContent(filename: string): string | null {
    this.ensureBackupDir();
    const safeName = path.basename(filename);
    const fullPath = path.join(this.config.backupDir, safeName);
    if (!fs.existsSync(fullPath)) return null;
    return fs.readFileSync(fullPath, 'utf-8');
  }

  private pruneOldBackups() {
    try {
      const files = this.listBackupFiles();
      if (files.length > this.config.retentionCount) {
        const toDelete = files.slice(this.config.retentionCount);
        for (const item of toDelete) {
          if (fs.existsSync(item.filepath)) {
            fs.unlinkSync(item.filepath);
            console.log(`[BackupService] Pruned old backup archive: ${item.filename}`);
          }
        }
      }
    } catch (err) {
      console.warn('[BackupService] Prune notice:', err);
    }
  }

  public generateWindowsIisScript(hostUrl: string = 'http://localhost:3000'): { powershell: string; batch: string } {
    const psScript = `# ==============================================================================
# LESYNC ENTERPRISE PMS - WINDOWS IIS / SERVER TASK SCHEDULER SETUP SCRIPT
# Configures 3x Daily Automated Database Backups (8:00 AM, 4:00 PM, 11:00 PM)
# Compatible with: Windows Server 2016/2019/2022, Windows 10/11 Pro, IIS 10
# ==============================================================================

$HostUrl = "${hostUrl}"
$BackupDir = "C:\\LESync_PMS_Backups"
$LogDir = "C:\\LESync_PMS_Backups\\logs"

# Ensure directories exist
if (!(Test-Path -Path $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null }
if (!(Test-Path -Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

Write-Host "Registering 3x Daily LESync PMS Auto-Backup Tasks..." -ForegroundColor Cyan

# 1. Morning Shift Backup: 8:00 AM
$Action8AM = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -Command \\"Invoke-RestMethod -Uri '$HostUrl/api/backup/trigger' -Method Post -Body (@{triggerType='scheduled_8am'} | ConvertTo-Json) -ContentType 'application/json' | Out-File -FilePath '$LogDir\\backup_8am.log'\\""
$Trigger8AM = New-ScheduledTaskTrigger -Daily -At 8:00AM
Register-ScheduledTask -TaskName "LESync_PMS_Backup_0800_Morning" -Action $Action8AM -Trigger $Trigger8AM -Description "LESync PMS Automated Morning Shift Database Backup" -Force | Out-Null

# 2. Afternoon Shift Backup: 4:00 PM
$Action4PM = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -Command \\"Invoke-RestMethod -Uri '$HostUrl/api/backup/trigger' -Method Post -Body (@{triggerType='scheduled_4pm'} | ConvertTo-Json) -ContentType 'application/json' | Out-File -FilePath '$LogDir\\backup_4pm.log'\\""
$Trigger4PM = New-ScheduledTaskTrigger -Daily -At 4:00PM
Register-ScheduledTask -TaskName "LESync_PMS_Backup_1600_Afternoon" -Action $Action4PM -Trigger $Trigger4PM -Description "LESync PMS Automated Afternoon Shift Database Backup" -Force | Out-Null

# 3. Night Audit Backup: 11:00 PM
$Action11PM = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -Command \\"Invoke-RestMethod -Uri '$HostUrl/api/backup/trigger' -Method Post -Body (@{triggerType='scheduled_11pm'} | ConvertTo-Json) -ContentType 'application/json' | Out-File -FilePath '$LogDir\\backup_11pm.log'\\""
$Trigger11PM = New-ScheduledTaskTrigger -Daily -At 11:00PM
Register-ScheduledTask -TaskName "LESync_PMS_Backup_2300_Night" -Action $Action11PM -Trigger $Trigger11PM -Description "LESync PMS Automated Night Audit Day-Close Database Backup" -Force | Out-Null

Write-Host "[SUCCESS] All 3 daily automated backup tasks successfully registered in Windows Task Scheduler!" -ForegroundColor Green
Write-Host "Schedule: 08:00 AM, 16:00 PM, 23:00 PM" -ForegroundColor Yellow
Write-Host "Log directory: $LogDir" -ForegroundColor Yellow
`;

    const batScript = `@echo off
REM ============================================================================
REM LESYNC PMS WINDOWS TASK SCHEDULER INSTALLER (.BAT)
REM Creates 3 daily automated tasks at 8:00 AM, 4:00 PM, and 11:00 PM
REM ============================================================================

set HOST_URL=${hostUrl}

echo Registering LESync PMS Automated Tasks...
schtasks /create /tn "LESync_PMS_Backup_0800_Morning" /tr "curl -s -X POST %HOST_URL%/api/backup/trigger -H \\"Content-Type: application/json\\" -d \\"{\\"triggerType\\":\\"scheduled_8am\\"}\\"" /sc daily /st 08:00 /f
schtasks /create /tn "LESync_PMS_Backup_1600_Afternoon" /tr "curl -s -X POST %HOST_URL%/api/backup/trigger -H \\"Content-Type: application/json\\" -d \\"{\\"triggerType\\":\\"scheduled_4pm\\"}\\"" /sc daily /st 16:00 /f
schtasks /create /tn "LESync_PMS_Backup_2300_Night" /tr "curl -s -X POST %HOST_URL%/api/backup/trigger -H \\"Content-Type: application/json\\" -d \\"{\\"triggerType\\":\\"scheduled_11pm\\"}\\"" /sc daily /st 23:00 /f

echo [SUCCESS] Tasks registered successfully!
pause
`;

    return { powershell: psScript, batch: batScript };
  }
}

export const backupService = new BackupService();
