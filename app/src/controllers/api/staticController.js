const eventModel = require('../../models/eventModel');
const { formatStatic } = require('../../lib/presenters');
const { cleanSessionId, cleanUrl, cleanString, cleanDataBlob } = require('../../lib/validate');

exports.list = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
  const offset = parseInt(req.query.offset, 10) || 0;
  const rows = await eventModel.queryStatic({
    startTime: req.query.start_time,
    endTime: req.query.end_time,
    limit,
    offset
  });
  res.json({ status: 'success', count: rows.length, data: rows.map(formatStatic) });
};

exports.get = async (req, res) => {
  const row = await eventModel.findStatic(req.params.identifier);
  if (!row) {
    return res.status(404).json({ status: 'error', message: 'Record not found' });
  }
  res.json({ status: 'success', data: formatStatic(row) });
};

exports.create = async (req, res) => {
  const body = req.body || {};

  const sessionId = cleanSessionId(body.sessionId || body.session_id);
  if (!sessionId) {
    return res.status(400).json({ status: 'error', message: 'Valid sessionId is required' });
  }

  const rawUrl = body.url || null;
  const url = rawUrl === null ? null : cleanUrl(rawUrl);
  if (rawUrl !== null && url === null) {
    return res.status(400).json({ status: 'error', message: 'Invalid url' });
  }

  const data = cleanDataBlob({
    userAgent: cleanString(body.userAgent || body.user_agent, 512),
    language: cleanString(body.language, 64),
    cookiesAllowed: Boolean(body.cookiesAllowed),
    javascriptAllowed: body.javascriptAllowed !== false,
    imagesAllowed: body.imagesAllowed !== false,
    cssAllowed: body.cssAllowed !== false,
    screenDimensions: body.screenDimensions || body.screen_dimensions || null,
    windowDimensions: body.windowDimensions || body.window_dimensions || null,
    networkConnection: body.networkConnection || body.network_connection || null
  });
  if (data === null) {
    return res.status(400).json({ status: 'error', message: 'Invalid data payload' });
  }

  const id = await eventModel.insertStatic({ sessionId, url, ip: req.ip, data });
  res.status(201).json({
    status: 'success',
    data: { id, sessionId, ...data, createdAt: new Date().toISOString() }
  });
};

exports.remove = async (req, res) => {
  const affected = await eventModel.deleteStatic(parseInt(req.params.id, 10));
  if (!affected) {
    return res.status(404).json({ status: 'error', message: 'Record not found' });
  }
  res.json({ status: 'success', message: `Record ${req.params.id} deleted` });
};
