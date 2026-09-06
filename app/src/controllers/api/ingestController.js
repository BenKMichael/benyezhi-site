const crypto = require('crypto');
const eventModel = require('../../models/eventModel');
const { lookupCountry } = require('../../lib/geo');
const {
  cleanType,
  cleanSessionId,
  cleanUrl,
  cleanString,
  cleanDataBlob,
  toMysqlDatetime
} = require('../../lib/validate');

exports.log = async (req, res) => {
  const payload = req.body || {};

  const type = cleanType(payload.type);
  const url = cleanUrl(payload.url);
  if (!type || !url) {
    return res.status(400).json({ error: 'Invalid or missing fields: url, type' });
  }

  let data = cleanDataBlob(payload.data);
  if (data === null) {
    return res.status(400).json({ error: 'Invalid data payload' });
  }

  let sessionId = cleanSessionId(payload.sessionId);
  if (!sessionId) {
    sessionId = 'anon_' + crypto.randomUUID();
  }

  if (type === 'static' && data && !Array.isArray(data)) {
    data = { ...data, country: lookupCountry(req.ip) };
  }

  try {
    await eventModel.insertEvent({
      sessionId,
      type,
      url,
      clientTimestamp: toMysqlDatetime(payload.timestamp, true),
      serverTimestamp: toMysqlDatetime(Date.now(), true),
      ip: req.ip,
      data
    });
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

exports.logNoscript = async (req, res) => {
  const url = cleanUrl(req.query.url);
  if (url) {
    const now = toMysqlDatetime(Date.now(), true);
    const data = {
      javascriptAllowed: false,
      imagesAllowed: true,
      userAgent: cleanString(req.headers['user-agent'], 512),
      language: cleanString((req.headers['accept-language'] || '').split(',')[0], 64),
      country: lookupCountry(req.ip)
    };
    try {
      await eventModel.insertEvent({
        sessionId: 'noscript_' + crypto.randomUUID(),
        type: 'static',
        url,
        clientTimestamp: now,
        serverTimestamp: now,
        ip: req.ip,
        data
      });
    } catch (err) {
      console.error(err);
    }
  }

  res.set('Content-Type', 'image/gif');
  res.set('Cache-Control', 'no-store');
  res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
};
