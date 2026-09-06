const eventModel = require('../../models/eventModel');
const { formatEvent, formatStatic, formatTimelineEntry } = require('../../lib/presenters');

exports.list = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
  const offset = parseInt(req.query.offset, 10) || 0;
  const rows = await eventModel.queryEvents({
    sessionId: req.query.session_id,
    type: req.query.type,
    startTime: req.query.start_time,
    endTime: req.query.end_time,
    limit,
    offset
  });
  res.json({ status: 'success', count: rows.length, data: rows.map(formatEvent) });
};

exports.timeline = async (req, res) => {
  const { staticRow, eventRows } = await eventModel.sessionTimeline(req.params.sessionId);
  res.json({
    status: 'success',
    sessionId: req.params.sessionId,
    deviceInfo: staticRow ? formatStatic(staticRow) : null,
    totalEvents: eventRows.length,
    timeline: eventRows.map(formatTimelineEntry)
  });
};
