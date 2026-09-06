const reportModel = require('../models/reportModel');
const { CATEGORIES, exists, list } = require('../lib/reportCategories');
const { cleanString, toMysqlDatetime } = require('../lib/validate');

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function typeLabel(type) {
  return CATEGORIES[type] ? CATEGORIES[type].label : type;
}

exports.list = async (req, res) => {
  const reports = await reportModel.list();
  res.render('reports-list', {
    active: 'reports',
    reports: reports.map((r) => ({ ...r, type_label: typeLabel(r.report_type) })),
    error: req.query.error || null,
    success: req.query.success || null
  });
};

exports.newPicker = (req, res) => {
  res.render('report-new', { active: 'create', categories: list() });
};

exports.newWorkspace = async (req, res) => {
  const type = req.params.type;
  if (!exists(type)) {
    return res.redirect('/reports/new');
  }
  const category = CATEGORIES[type];
  const end = new Date();
  const start = new Date(end.getTime() - WEEK_MS);
  const charts = await category.build(toMysqlDatetime(start), toMysqlDatetime(end));

  res.render('report-workspace', {
    active: 'create',
    typeLabel: category.label,
    payload: {
      type,
      typeLabel: category.label,
      specs: category.charts,
      charts,
      comments: {},
      rangeStart: start.toISOString(),
      rangeEnd: end.toISOString()
    }
  });
};

function cleanComments(type, raw) {
  const valid = new Set(CATEGORIES[type].charts.map((c) => c.key));
  const out = {};
  Object.keys(raw || {}).forEach((key) => {
    if (valid.has(key)) {
      out[key] = cleanString(String(raw[key]), 4000) || '';
    }
  });
  return out;
}

exports.save = async (req, res) => {
  const { type, charts, comments, rangeStart, rangeEnd } = req.body || {};
  if (!exists(type)) {
    return res.status(400).json({ status: 'error', message: 'Unknown report type' });
  }

  const end = new Date(rangeEnd);
  const start = new Date(rangeStart);
  const validRange = !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime());
  const fallbackEnd = new Date();
  const fallbackStart = new Date(fallbackEnd.getTime() - WEEK_MS);

  const id = await reportModel.create({
    reportType: type,
    createdBy: req.user.id,
    creatorName: req.user.username,
    rangeStart: toMysqlDatetime(validRange ? start : fallbackStart),
    rangeEnd: toMysqlDatetime(validRange ? end : fallbackEnd),
    data: {
      charts: charts && typeof charts === 'object' ? charts : {},
      comments: cleanComments(type, comments)
    }
  });

  res.json({ status: 'success', id });
};

exports.downloadSaved = async (req, res) => {
  const report = await reportModel.findById(parseInt(req.params.id, 10));
  if (!report) {
    return res.status(404).send('Report not found');
  }
  if (!exists(report.report_type)) {
    return res.status(410).send('Report type no longer available');
  }
  const data = typeof report.data === 'string' ? JSON.parse(report.data) : report.data;

  res.render('report-print', {
    typeLabel: typeLabel(report.report_type),
    creatorName: report.creator_name,
    createdAt: report.created_at,
    payload: {
      type: report.report_type,
      typeLabel: typeLabel(report.report_type),
      specs: CATEGORIES[report.report_type].charts,
      charts: data.charts || {},
      comments: data.comments || {},
      rangeStart: report.range_start,
      rangeEnd: report.range_end,
      meta: {
        creatorName: report.creator_name,
        createdAt: new Date(report.created_at).toISOString()
      }
    }
  });
};

exports.remove = async (req, res) => {
  const affected = await reportModel.remove(parseInt(req.params.id, 10));
  if (!affected) {
    return res.redirect('/?error=' + encodeURIComponent('Report not found.'));
  }
  res.redirect('/?success=' + encodeURIComponent('Report deleted.'));
};
