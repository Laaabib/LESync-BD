import defaultApp from '../src/server/app.ts';

export default function handler(req: any, res: any) {
  // Restore real path when Vercel rewrites /api/(.*) -> /api?path=$1
  const queryPath = req.query?.path || req.query?.__path;
  if (queryPath) {
    const rawQuery = req.url && req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    const cleanPath = Array.isArray(queryPath) ? queryPath.join('/') : String(queryPath);
    req.url = cleanPath.startsWith('/') ? '/api' + cleanPath : '/api/' + cleanPath;
    if (rawQuery) {
      req.url += rawQuery;
    }
  } else if (req.headers && (req.headers['x-matched-path'] || req.headers['x-invoke-path'])) {
    const matched = req.headers['x-matched-path'] || req.headers['x-invoke-path'];
    if (matched && typeof matched === 'string' && matched.startsWith('/api')) {
      req.url = matched;
    }
  }

  return (defaultApp as any)(req, res);
}

