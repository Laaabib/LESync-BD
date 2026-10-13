import defaultApp from '../src/server/app.ts';

export default function handler(req: any, res: any) {
  // If Vercel pre-parsed or consumed the body, ensure req._body is set so Express body-parser does not hang
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body);
      } catch {}
    } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(req.body)) {
      try {
        req.body = JSON.parse(req.body.toString('utf8'));
      } catch {}
    }
    req._body = true;
  }

  // Restore real path when Vercel rewrites /api/(.*) -> /api?path=$1
  const queryPath = req.query?.path || req.query?.__path;
  if (queryPath) {
    const rawQuery = req.url && req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    const cleanPath = Array.isArray(queryPath) ? queryPath.join('/') : String(queryPath);
    req.url = cleanPath.startsWith('/') ? '/api' + cleanPath : '/api/' + cleanPath;
    if (rawQuery) {
      req.url += rawQuery;
    }
    delete req.query.path;
    delete req.query.__path;
  } else if (req.headers && (req.headers['x-matched-path'] || req.headers['x-invoke-path'])) {
    const matched = req.headers['x-matched-path'] || req.headers['x-invoke-path'];
    if (matched && typeof matched === 'string' && matched.startsWith('/api')) {
      req.url = matched;
    }
  }

  return (defaultApp as any)(req, res);
}

