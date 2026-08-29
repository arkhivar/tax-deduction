import { Router } from 'express';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const router = Router();

// POST /api/inn-lookup
// Proxies the DaData API to resolve organization info from INN.
// Keeps the DaData API key server-side (not exposed to the browser).
router.post('/', async (req, res) => {
  const DADATA_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party';
  const apiKey = process.env.DADATA_API_KEY;

  try {
    const { inn } = req.body;

    if (!inn || typeof inn !== 'string' || !/^\d{10,12}$/.test(inn)) {
      return res.status(400).json({ error: 'INN must be 10 or 12 digits' });
    }

    if (!apiKey) {
      return res.status(500).json({ error: 'DaData API key not configured' });
    }

    // Use curl instead of Node fetch — DaData rejects Node fetch's Authorization header
    const { stdout } = await execFileAsync('curl', [
      '-s', '-X', 'POST', DADATA_URL,
      '-H', 'Content-Type: application/json',
      '-H', 'Accept: application/json',
      '-H', `Authorization: Token ${apiKey}`,
      '-d', JSON.stringify({ query: inn, branch_type: 'MAIN' }),
    ]);

    const data = JSON.parse(stdout);
    const suggestion = data.suggestions?.[0];

    if (!suggestion) {
      return res.json({ found: false });
    }

    res.json({
      found: true,
      name: suggestion.data?.name?.short_with_opf || suggestion.value || '',
      full_name: suggestion.data?.name?.full_with_opf || '',
      kpp: suggestion.data?.kpp || '',
      inn: suggestion.data?.inn || inn,
    });
  } catch (err) {
    console.error('[DaData] request failed:', err.message);
    res.status(502).json({ error: 'DaData request failed', details: err.message });
  }
});

export default router;
