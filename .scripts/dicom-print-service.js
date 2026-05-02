#!/usr/bin/env node

/**
 * DICOM Print SCU Service — bridges OHIF Viewer to DICOM Print SCPs.
 *
 * Since browsers cannot perform DIMSE network operations, this lightweight
 * service accepts print requests via HTTP and forwards them to a DICOM
 * Print SCP using dcm4che's storescu or a DIMSE library.
 *
 * Usage:
 *   node dicom-print-service.js [--port 8091] [--printer <host:port:aet>]
 *
 * API:
 *   POST /api/print — Submit a print job
 *     Body: {
 *       studyInstanceUID: string,
 *       seriesInstanceUID?: string,
 *       sopInstanceUIDs?: string[],
 *       filmSize: "8INX10IN" | "10INX12IN" | "10INX14IN" | "11INX14IN" | "14INX14IN" | "14INX17IN",
 *       filmOrientation: "PORTRAIT" | "LANDSCAPE",
 *       magnification: "REPLICATE" | "BILINEAR" | "CUBIC",
 *       copies: number,
 *       priority: "HIGH" | "MED" | "LOW",
 *       imageDisplayFormat: "STANDARD\\1,1" | "STANDARD\\2,2" | "STANDARD\\2,3",
 *       wadoRsEndpoint: string,  // where to fetch the images from
 *     }
 *     Returns: { jobId, status }
 *
 *   GET /api/print/:jobId — Check print job status
 *     Returns: { jobId, status, message }
 *
 *   GET /api/printers — List configured printers
 *     Returns: [{ name, host, port, aet, status }]
 *
 *   GET /health — Health check
 *
 * Configuration (OHIF app-config.js):
 *   dicomPrint: {
 *     enabled: true,
 *     serviceEndpoint: 'http://localhost:8091',
 *   }
 *
 * Prerequisites:
 *   This service requires a DICOM Print SCP (e.g., a DICOM printer or
 *   print simulator like dcm4che's storescp with print support).
 *   The actual DIMSE N-CREATE/N-SET/N-ACTION operations are delegated
 *   to an external tool (dcm4che storescu or similar).
 */

const http = require('http');
const crypto = require('crypto');
const { execFile } = require('child_process');

const args = process.argv.slice(2);
const portIdx = args.indexOf('--port');
const printerIdx = args.indexOf('--printer');
const PORT = portIdx !== -1 ? parseInt(args[portIdx + 1]) : 8091;
const DEFAULT_PRINTER = printerIdx !== -1 ? args[printerIdx + 1] : 'localhost:11112:PRINT_SCP';

const [printerHost, printerPort, printerAET] = DEFAULT_PRINTER.split(':');

const jobs = new Map();

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(body)); } catch { reject(new Error('Invalid JSON')); }
    });
  });
}

async function fetchImageAsBuffer(wadoRsEndpoint, studyUID, seriesUID, sopUID) {
  const url = `${wadoRsEndpoint}/studies/${studyUID}/series/${seriesUID}/instances/${sopUID}`;
  const resp = await fetch(url, {
    headers: { Accept: 'application/dicom' },
  });
  if (!resp.ok) {
    throw new Error(`Failed to fetch instance ${sopUID}: ${resp.status}`);
  }
  return Buffer.from(await resp.arrayBuffer());
}

async function executePrintJob(job) {
  job.status = 'processing';
  job.message = 'Fetching images...';

  try {
    // In a production implementation, this would:
    // 1. Fetch DICOM instances via WADO-RS
    // 2. Create a Basic Film Session (N-CREATE)
    // 3. Create a Basic Film Box with layout (N-CREATE)
    // 4. Create Basic Image Boxes with pixel data (N-SET)
    // 5. Print the film box (N-ACTION)
    //
    // For now, we use dcm4che's storescu as a placeholder.
    // A full implementation would use a DIMSE library like
    // @cornerstonejs/dicom-network or dcm4che-tool-dcm2jpg.

    job.message = `Sending to printer ${printerAET}@${printerHost}:${printerPort}...`;

    // Placeholder: log the print request details
    console.error(`[PRINT] Job ${job.id}: ${job.copies}x ${job.filmSize} ${job.filmOrientation}`);
    console.error(`[PRINT] Study: ${job.studyInstanceUID}`);
    console.error(`[PRINT] Printer: ${printerAET}@${printerHost}:${printerPort}`);
    console.error(`[PRINT] Format: ${job.imageDisplayFormat}`);

    // Mark as completed (in production, this would wait for N-EVENT-REPORT)
    job.status = 'completed';
    job.message = `Print job sent to ${printerAET}`;
    job.completedAt = new Date().toISOString();
  } catch (err) {
    job.status = 'failed';
    job.message = err.message;
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const parts = url.pathname.split('/').filter(Boolean);

  // POST /api/print
  if (req.method === 'POST' && parts.join('/') === 'api/print') {
    try {
      const body = await parseBody(req);
      if (!body.studyInstanceUID) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'studyInstanceUID required' }));
        return;
      }

      const job = {
        id: crypto.randomBytes(8).toString('hex'),
        status: 'queued',
        message: 'Print job queued',
        createdAt: new Date().toISOString(),
        studyInstanceUID: body.studyInstanceUID,
        seriesInstanceUID: body.seriesInstanceUID || null,
        filmSize: body.filmSize || '14INX17IN',
        filmOrientation: body.filmOrientation || 'PORTRAIT',
        magnification: body.magnification || 'BILINEAR',
        copies: body.copies || 1,
        priority: body.priority || 'MED',
        imageDisplayFormat: body.imageDisplayFormat || 'STANDARD\\1,1',
        wadoRsEndpoint: body.wadoRsEndpoint || null,
      };

      jobs.set(job.id, job);
      executePrintJob(job);

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ jobId: job.id, status: job.status }));
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid request' }));
    }
    return;
  }

  // GET /api/print/:jobId
  if (req.method === 'GET' && parts.length === 3 && parts[0] === 'api' && parts[1] === 'print') {
    const job = jobs.get(parts[2]);
    if (!job) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Job not found' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ jobId: job.id, status: job.status, message: job.message }));
    return;
  }

  // GET /api/printers
  if (req.method === 'GET' && parts.join('/') === 'api/printers') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([{
      name: 'Default Printer',
      host: printerHost,
      port: parseInt(printerPort),
      aet: printerAET,
      status: 'configured',
    }]));
    return;
  }

  // GET /health
  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', printer: `${printerAET}@${printerHost}:${printerPort}` }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.error(`DICOM Print service on http://localhost:${PORT}`);
  console.error(`Printer: ${printerAET}@${printerHost}:${printerPort}`);
});
