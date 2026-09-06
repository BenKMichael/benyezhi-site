const pool = require('../db/pool');

const WINDOW = 'server_timestamp BETWEEN ? AND ?';

async function audienceCountries(start, end) {
  const [rows] = await pool.query(
    `SELECT COALESCE(NULLIF(data->>'$.country', 'null'), 'Unknown') AS label, COUNT(*) AS value
     FROM events
     WHERE type = 'static' AND ${WINDOW}
     GROUP BY label
     ORDER BY value DESC
     LIMIT 15`,
    [start, end]
  );
  return rows;
}

async function audienceScreenResolution(start, end) {
  const [rows] = await pool.query(
    `SELECT CAST(data->>'$.screenDimensions.width' AS UNSIGNED) AS x,
            CAST(data->>'$.screenDimensions.height' AS UNSIGNED) AS y
     FROM events
     WHERE type = 'static' AND ${WINDOW}
       AND data->>'$.screenDimensions.width' IS NOT NULL
       AND data->>'$.screenDimensions.height' IS NOT NULL
     LIMIT 2000`,
    [start, end]
  );
  return rows;
}

async function audienceVisitorsOverTime(start, end) {
  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(server_timestamp, '%Y-%m-%d') AS label, COUNT(DISTINCT session_id) AS value
     FROM events
     WHERE ${WINDOW}
     GROUP BY label
     ORDER BY label ASC`,
    [start, end]
  );
  return rows;
}

async function audienceBrowsers(start, end) {
  const [rows] = await pool.query(
    `SELECT browser AS label, COUNT(*) AS value
     FROM (
       SELECT CASE
         WHEN ua LIKE '%Edg/%' THEN 'Edge'
         WHEN ua LIKE '%Chrome/%' THEN 'Chrome'
         WHEN ua LIKE '%Firefox/%' THEN 'Firefox'
         WHEN ua LIKE '%Safari/%' THEN 'Safari'
         ELSE 'Other'
       END AS browser
       FROM (
         SELECT data->>'$.userAgent' AS ua
         FROM events
         WHERE type = 'static' AND ${WINDOW}
       ) agents
     ) families
     GROUP BY browser
     ORDER BY value DESC`,
    [start, end]
  );
  return rows;
}

async function perfLoadBuckets(start, end) {
  const [rows] = await pool.query(
    `SELECT bucket AS label, COUNT(*) AS value
     FROM (
       SELECT CASE
         WHEN ms < 1000 THEN '<1s'
         WHEN ms < 2000 THEN '1-2s'
         WHEN ms < 4000 THEN '2-4s'
         WHEN ms < 8000 THEN '4-8s'
         ELSE '>8s'
       END AS bucket
       FROM (
         SELECT CAST(data->>'$.totalLoadTimeMs' AS UNSIGNED) AS ms
         FROM events
         WHERE type = 'performance' AND ${WINDOW}
           AND data->>'$.totalLoadTimeMs' IS NOT NULL
       ) loads
     ) buckets
     GROUP BY bucket
     ORDER BY FIELD(bucket, '<1s', '1-2s', '2-4s', '4-8s', '>8s')`,
    [start, end]
  );
  return rows;
}

async function perfSlowestPages(start, end) {
  const [rows] = await pool.query(
    `SELECT url AS label, ROUND(AVG(CAST(data->>'$.totalLoadTimeMs' AS UNSIGNED))) AS value
     FROM events
     WHERE type = 'performance' AND ${WINDOW}
       AND url IS NOT NULL AND url != ''
       AND data->>'$.totalLoadTimeMs' IS NOT NULL
     GROUP BY url
     ORDER BY value DESC
     LIMIT 10`,
    [start, end]
  );
  return rows;
}

async function perfPhaseBreakdown(start, end) {
  const phase = (a, b) =>
    `AVG(GREATEST(CAST(data->>'$.timingObject.${a}' AS DOUBLE) - CAST(data->>'$.timingObject.${b}' AS DOUBLE), 0))`;
  const [rows] = await pool.query(
    `SELECT
       ROUND(${phase('domainLookupEnd', 'domainLookupStart')}) AS dns,
       ROUND(${phase('connectEnd', 'connectStart')}) AS tcp,
       ROUND(${phase('responseStart', 'requestStart')}) AS ttfb,
       ROUND(${phase('responseEnd', 'responseStart')}) AS download,
       ROUND(${phase('domComplete', 'responseEnd')}) AS dom
     FROM events
     WHERE type = 'performance' AND ${WINDOW}`,
    [start, end]
  );
  const r = rows[0] || {};
  return [
    { label: 'DNS', value: Number(r.dns) || 0 },
    { label: 'TCP', value: Number(r.tcp) || 0 },
    { label: 'TTFB', value: Number(r.ttfb) || 0 },
    { label: 'Download', value: Number(r.download) || 0 },
    { label: 'DOM', value: Number(r.dom) || 0 }
  ];
}

async function engageTimeOnPage(start, end) {
  const [rows] = await pool.query(
    `SELECT url, data->>'$.enterTime' AS enterTime, data->>'$.exitTime' AS exitTime
     FROM events
     WHERE type = 'page_exit' AND ${WINDOW}
       AND url IS NOT NULL AND url != ''`,
    [start, end]
  );
  const byUrl = {};
  rows.forEach((row) => {
    const seconds = (new Date(row.exitTime).getTime() - new Date(row.enterTime).getTime()) / 1000;
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > 3600) {
      return;
    }
    (byUrl[row.url] = byUrl[row.url] || []).push(seconds);
  });
  return Object.keys(byUrl)
    .map((url) => ({
      label: url,
      value: Math.round(byUrl[url].reduce((a, b) => a + b, 0) / byUrl[url].length)
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

async function engageFunnel(start, end) {
  const [rows] = await pool.query(
    `SELECT session_id, type, data
     FROM events
     WHERE type IN ('activity_batch', 'page_exit') AND ${WINDOW}
     LIMIT 50000`,
    [start, end]
  );
  const sessions = {};
  rows.forEach((row) => {
    const s = sessions[row.session_id] || (sessions[row.session_id] = {});
    let data = row.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (err) {
        data = null;
      }
    }
    if (row.type === 'activity_batch' && Array.isArray(data)) {
      data.forEach((e) => {
        if (e && e.event === 'scroll') s.scrolled = true;
        if (e && e.event === 'click') s.clicked = true;
        if (e && e.event === 'keydown') s.typed = true;
      });
    } else if (row.type === 'page_exit' && data) {
      const seconds = (new Date(data.exitTime).getTime() - new Date(data.enterTime).getTime()) / 1000;
      if (Number.isFinite(seconds) && seconds > 30) {
        s.stayed = true;
      }
    }
  });
  const ids = Object.keys(sessions);
  const total = ids.length || 1;
  const pct = (key) => Math.round((ids.filter((id) => sessions[id][key]).length / total) * 100);
  return [
    { label: 'Scrolled', value: pct('scrolled') },
    { label: 'Clicked', value: pct('clicked') },
    { label: 'Typed', value: pct('typed') },
    { label: 'Stayed >30s', value: pct('stayed') }
  ];
}

async function engageIdleByPage(start, end) {
  const [rows] = await pool.query(
    `SELECT url AS label, ROUND(AVG(CAST(data->>'$.idleDurationMs' AS UNSIGNED)) / 1000, 1) AS value
     FROM events
     WHERE type = 'idle' AND ${WINDOW}
       AND url IS NOT NULL AND url != ''
       AND data->>'$.idleDurationMs' IS NOT NULL
     GROUP BY url
     ORDER BY value DESC
     LIMIT 10`,
    [start, end]
  );
  return rows.map((r) => ({ label: r.label, value: Number(r.value) || 0 }));
}

async function journeyLandingPages(start, end) {
  const [rows] = await pool.query(
    `SELECT url AS label, COUNT(*) AS value
     FROM (
       SELECT url, ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY id ASC) AS rn
       FROM events
       WHERE ${WINDOW} AND url IS NOT NULL AND url != ''
     ) ordered
     WHERE rn = 1
     GROUP BY url
     ORDER BY value DESC
     LIMIT 10`,
    [start, end]
  );
  return rows;
}

async function journeyExitPages(start, end) {
  const [rows] = await pool.query(
    `SELECT url AS label, COUNT(*) AS value
     FROM (
       SELECT url, ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY id DESC) AS rn
       FROM events
       WHERE ${WINDOW} AND url IS NOT NULL AND url != ''
     ) ordered
     WHERE rn = 1
     GROUP BY url
     ORDER BY value DESC
     LIMIT 10`,
    [start, end]
  );
  return rows;
}

async function journeyBounceRate(start, end) {
  const [rows] = await pool.query(
    `SELECT landing AS label, ROUND(100 * SUM(bounced) / COUNT(*)) AS value
     FROM (
       SELECT
         (SELECT url FROM events f
          WHERE f.session_id = e.session_id AND f.url IS NOT NULL AND f.url != ''
          ORDER BY f.id ASC LIMIT 1) AS landing,
         (COUNT(DISTINCT NULLIF(url, '')) <= 1) AS bounced
       FROM events e
       WHERE ${WINDOW}
       GROUP BY e.session_id
     ) sessions
     WHERE landing IS NOT NULL
     GROUP BY landing
     ORDER BY value DESC
     LIMIT 10`,
    [start, end]
  );
  return rows.map((r) => ({ label: r.label, value: Number(r.value) || 0 }));
}

module.exports = {
  audienceCountries,
  audienceScreenResolution,
  audienceVisitorsOverTime,
  audienceBrowsers,
  perfLoadBuckets,
  perfSlowestPages,
  perfPhaseBreakdown,
  engageTimeOnPage,
  engageFunnel,
  engageIdleByPage,
  journeyLandingPages,
  journeyExitPages,
  journeyBounceRate
};
