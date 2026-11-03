const MAX_BODY = 2048;
const allowed = new Set(['Opened', 'Yes', 'No']);
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  const url = process.env.APPS_SCRIPT_URL;
  const secret = process.env.RSVP_SHARED_SECRET;
  if (!url || !secret) return res.status(503).json({error:'RSVP tracking is not configured'});
  try {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    if (raw.length > MAX_BODY) return res.status(413).json({error:'Request too large'});
    const body = JSON.parse(raw);
    const guest = String(body.guest || '').trim().slice(0, 80);
    const status = String(body.status || '');
    const phone = String(body.phone || '').replace(/\D/g, '').slice(0, 15);
    const visitorId = String(body.visitorId || '').slice(0, 100);
    if (!guest || !allowed.has(status) || !/^[A-Za-z0-9_-]{12,100}$/.test(visitorId)) return res.status(400).json({error:'Invalid guest, status or visitor ID'});
    if (status === 'Yes' && !/^[6-9]\d{9}$/.test(phone)) return res.status(400).json({error:'Enter a valid Indian mobile number'});
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    let response;
    try {
      response = await fetch(url, {
        method:'POST',
        headers:{'Content-Type':'text/plain;charset=utf-8'},
        body:JSON.stringify({secret, guest, status, phone:status==='Yes'?phone:'', visitorId, time:new Date().toISOString()}),
        redirect:'follow',signal:controller.signal
      });
    } finally { clearTimeout(timer); }
    if (!response.ok) return res.status(502).json({error:'Could not connect to guest list'});
    const replyText = await response.text();
    let reply; try { reply = JSON.parse(replyText); } catch { return res.status(502).json({error:'Unexpected guest list response'}); }
    if (reply.ok !== true) return res.status(502).json({error:'Guest list rejected the update'});
    return res.status(200).json({ok:true});
  } catch(e) { return res.status(502).json({error:'Unable to save. Please try again.'}); }
}
