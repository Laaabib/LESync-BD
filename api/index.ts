import defaultApp from '../src/server/app.ts';

export default async function handler(req: any, res: any) {
  try {
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
      const cleanPath = Array.isArray(queryPath) ? queryPath.join('/') : String(queryPath);
      const newPath = cleanPath.startsWith('/') ? '/api' + cleanPath : '/api/' + cleanPath;
      delete req.query.path;
      delete req.query.__path;
      const remainingParams = new URLSearchParams(req.query).toString();
      req.url = remainingParams ? `${newPath}?${remainingParams}` : newPath;
    } else if (req.headers && (req.headers['x-matched-path'] || req.headers['x-invoke-path'])) {
      const matched = req.headers['x-matched-path'] || req.headers['x-invoke-path'];
      if (matched && typeof matched === 'string' && matched.startsWith('/api')) {
        req.url = matched;
      }
    }

    return (defaultApp as any)(req, res);
  } catch (err: any) {
    console.error('[Vercel Serverless Handler Error]:', err);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: err?.message || 'Serverless Handler Execution Error',
      });
    }
  }
}

