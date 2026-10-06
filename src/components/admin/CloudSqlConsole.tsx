import React, { useState, useEffect } from 'react';
import {
  Terminal, Play, Database, Table, RefreshCw, Download,
  CheckCircle2, AlertCircle, Clock, Copy, Check, FileCode,
  Layers, HardDrive, ShieldCheck, Search
} from 'lucide-react';

interface TableMeta {
  table_name: string;
  column_count: number | string;
}

interface QueryResult {
  command?: string;
  rowCount?: number;
  fields?: { name: string; dataTypeId: number }[];
  rows?: any[];
  executionTimeMs?: number;
  error?: string;
}

const PRESET_QUERIES = [
  {
    label: 'Tables & Row Counts',
    sql: `SELECT 
  relname AS table_name, 
  n_live_tup AS row_estimate 
FROM pg_stat_user_tables 
ORDER BY n_live_tup DESC;`
  },
  {
    label: 'Rooms Inventory & Statuses',
    sql: `SELECT room_number, room_type_name, floor, status, condition, rate 
FROM pms_rooms 
ORDER BY room_number ASC 
LIMIT 25;`
  },
  {
    label: 'Active In-House Stays',
    sql: `SELECT stay_number, room_number, guest_name, check_in_at, expected_check_out_at, status, rate 
FROM pms_stays 
ORDER BY check_in_at DESC 
LIMIT 25;`
  },
  {
    label: 'Restaurant & Bar Orders',
    sql: `SELECT order_number, order_type, table_number, room_number, guest_name, total, payment_method, payment_status, created_at 
FROM pms_restaurant_orders 
ORDER BY created_at DESC 
LIMIT 25;`
  },
  {
    label: 'Chart of Accounts (GL)',
    sql: `SELECT code, name, category, account_type, balance, is_active 
FROM pms_gl_accounts 
ORDER BY code ASC 
LIMIT 30;`
  },
  {
    label: 'Journal Vouchers',
    sql: `SELECT voucher_number, voucher_date, narration, total_debit, total_credit, status 
FROM pms_journal_vouchers 
ORDER BY created_at DESC 
LIMIT 25;`
  },
  {
    label: 'City Ledger Accounts (AR)',
    sql: `SELECT account_name, company_name, credit_limit, current_balance 
FROM pms_city_ledger_accounts 
LIMIT 25;`
  },
  {
    label: 'Recent Audit Logs',
    sql: `SELECT user_name, action, module, description, created_at 
FROM pms_audit_logs 
ORDER BY created_at DESC 
LIMIT 25;`
  }
];

export const CloudSqlConsole: React.FC = () => {
  const [tables, setTables] = useState<TableMeta[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [query, setQuery] = useState(PRESET_QUERIES[0].sql);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [tableFilter, setTableFilter] = useState('');

  // Fetch available tables on mount
  const fetchTables = async () => {
    setLoadingTables(true);
    try {
      let res = await fetch('/api/supabase/tables');
      if (!res.ok) {
        res = await fetch('/api/cloudsql/tables');
      }
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        console.warn('Backend tables endpoint returned non-JSON response');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setTables(data.tables || []);
      }
    } catch (err: any) {
      console.warn('Notice: Could not load SQL tables list:', err?.message || err);
    } finally {
      setLoadingTables(false);
    }
  };

  useEffect(() => {
    fetchTables();
    handleRunQuery(PRESET_QUERIES[0].sql);
  }, []);

  const handleRunQuery = async (customSql?: string) => {
    const sqlToRun = customSql || query;
    if (!sqlToRun.trim()) return;

    setIsRunning(true);
    setResult(null);

    try {
      let res = await fetch('/api/supabase/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sqlQuery: sqlToRun })
      });
      if (!res.ok && res.status === 404) {
        res = await fetch('/api/cloudsql/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sqlQuery: sqlToRun })
        });
      }
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text().catch(() => '');
        setResult({
          error: `Server returned non-JSON status (${res.status}). Ensure Supabase (SUPABASE_DB_URL or DATABASE_URL) is configured.`
        });
        return;
      }
      const data = await res.json();
      if (data.success) {
        setResult({
          command: data.command,
          rowCount: data.rowCount,
          fields: data.fields,
          rows: data.rows,
          executionTimeMs: data.executionTimeMs
        });
      } else {
        setResult({
          error: data.error || 'Query failed to execute'
        });
      }
    } catch (err: any) {
      setResult({
        error: err.message || 'Network error executing query'
      });
    } finally {
      setIsRunning(false);
    }
  };

  const [copiedSql, setCopiedSql] = useState(false);

  const handleCopySetupSql = async () => {
    try {
      const res = await fetch('/api/supabase/export-sql');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    } catch (err) {
      console.warn('Failed to copy setup SQL:', err);
    }
  };

  const handleDownloadSetupSql = () => {
    const link = document.createElement('a');
    link.href = '/api/supabase/export-sql?download=true';
    link.download = 'supabase_schema_and_seed.sql';
    link.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRunQuery();
    }
  };

  const handleCopyResults = () => {
    if (!result?.rows) return;
    navigator.clipboard.writeText(JSON.stringify(result.rows, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCsv = () => {
    if (!result?.rows || result.rows.length === 0) return;
    const fields = result.fields?.map(f => f.name) || Object.keys(result.rows[0]);
    const csvRows = [
      fields.join(','),
      ...result.rows.map(row =>
        fields
          .map(f => {
            const val = row[f];
            if (val === null || val === undefined) return '';
            const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
            return `"${str.replace(/"/g, '""')}"`;
          })
          .join(',')
      )
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sql_query_export_${new Date().toISOString().slice(0, 19)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTables = tables.filter(t =>
    t.table_name.toLowerCase().includes(tableFilter.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Console Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Supabase SQL Interactive Console</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Supabase (PostgreSQL) Live
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Execute SQL statements directly against your Supabase database, inspect table structures, and explore live operational records.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopySetupSql}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Copy complete Supabase SQL setup script (tables + demo seed data)"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copiedSql ? 'Copied SQL!' : 'Copy Setup SQL'}</span>
          </button>

          <button
            onClick={handleDownloadSetupSql}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Download supabase_schema_and_seed.sql file"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Download .sql</span>
          </button>

          <button
            onClick={() => handleRunQuery()}
            disabled={isRunning}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-slate-950" />}
            <span>Execute Query</span>
            <span className="text-[10px] opacity-75 font-mono">(Ctrl+Enter)</span>
          </button>
        </div>
      </div>

      {/* Preset Queries Pill Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap mr-1 flex items-center gap-1">
          <FileCode className="w-3.5 h-3.5 text-amber-400" /> Presets:
        </span>
        {PRESET_QUERIES.map(p => (
          <button
            key={p.label}
            onClick={() => {
              setQuery(p.sql);
              handleRunQuery(p.sql);
            }}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 whitespace-nowrap transition"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Main Work Area: Sidebar (Tables) + Editor & Results */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Column: Schema Tables */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white">Database Tables ({tables.length})</span>
            </div>
            <button
              onClick={fetchTables}
              disabled={loadingTables}
              title="Refresh Tables"
              className="text-slate-400 hover:text-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingTables ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="my-2.5 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter tables..."
              value={tableFilter}
              onChange={e => setTableFilter(e.target.value)}
              className="w-full pl-8 pr-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
            {filteredTables.map(t => (
              <button
                key={t.table_name}
                onClick={() => {
                  const sql = `SELECT * FROM ${t.table_name} LIMIT 25;`;
                  setQuery(sql);
                  handleRunQuery(sql);
                }}
                className="w-full text-left p-2 rounded-lg hover:bg-slate-800/80 transition flex items-center justify-between group"
              >
                <div className="truncate">
                  <span className="text-xs font-mono text-slate-300 group-hover:text-amber-400 block truncate">
                    {t.table_name}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {t.column_count} columns
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 group-hover:text-amber-400 font-mono">
                  SELECT
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: SQL Editor & Results */}
        <div className="lg:col-span-3 space-y-4">
          {/* SQL Editor Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-inner flex flex-col">
            <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-amber-400" />
                Query Editor (PostgreSQL)
              </span>
              <span className="text-[11px] text-slate-500">
                Press Ctrl+Enter to Run
              </span>
            </div>
            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={5}
              placeholder="Enter SQL statement (e.g. SELECT * FROM pms_rooms LIMIT 10;)..."
              className="w-full p-4 font-mono text-xs bg-slate-950 text-amber-300 border-0 focus:outline-hidden resize-y leading-relaxed"
            />
          </div>

          {/* Results Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[340px]">
            {/* Results Header Toolbar */}
            <div className="px-4 py-2.5 bg-slate-850 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-white">Results</span>
                {result && !result.error && (
                  <span className="flex items-center gap-2 text-slate-400 text-[11px] font-mono">
                    <span className="text-emerald-400 font-bold">{result.rowCount} rows</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {result.executionTimeMs}ms
                    </span>
                  </span>
                )}
              </div>

              {result && !result.error && (result.rows?.length ?? 0) > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyResults}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1 transition"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                  <button
                    onClick={handleExportCsv}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1 transition"
                  >
                    <Download className="w-3 h-3 text-amber-400" />
                    <span>Export CSV</span>
                  </button>
                </div>
              )}
            </div>

            {/* Results Grid or Error / Empty */}
            <div className="flex-1 overflow-auto p-2 scrollbar-thin">
              {isRunning && (
                <div className="flex items-center justify-center h-full text-slate-400 gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
                  <span className="text-xs">Executing query on Supabase...</span>
                </div>
              )}

              {!isRunning && result?.error && (
                <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">SQL Execution Error</span>
                    <span className="font-mono mt-1 block">{result.error}</span>
                  </div>
                </div>
              )}

              {!isRunning && !result?.error && (!result?.rows || result.rows.length === 0) && (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs">
                  <Database className="w-8 h-8 text-slate-600 mb-1 opacity-50" />
                  <span>Query returned 0 rows or executed successfully.</span>
                </div>
              )}

              {!isRunning && result?.rows && result.rows.length > 0 && (
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead className="bg-slate-800/80 sticky top-0 text-slate-300 border-b border-slate-700">
                    <tr>
                      <th className="p-2 w-10 text-slate-500 font-normal">#</th>
                      {(result.fields?.map(f => f.name) || Object.keys(result.rows[0])).map(col => (
                        <th key={col} className="p-2 font-bold whitespace-nowrap text-amber-400">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {result.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/50 transition">
                        <td className="p-2 text-slate-600 select-none">{idx + 1}</td>
                        {(result.fields?.map(f => f.name) || Object.keys(row)).map(col => {
                          const val = row[col];
                          const isNull = val === null || val === undefined;
                          const isNum = typeof val === 'number';
                          const isObj = typeof val === 'object' && val !== null;
                          return (
                            <td
                              key={col}
                              className={`p-2 whitespace-nowrap max-w-xs truncate ${
                                isNull
                                  ? 'text-slate-600 italic'
                                  : isNum
                                  ? 'text-emerald-400'
                                  : isObj
                                  ? 'text-blue-300'
                                  : 'text-slate-200'
                              }`}
                            >
                              {isNull ? 'NULL' : isObj ? JSON.stringify(val) : String(val)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
