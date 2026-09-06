function parseData(value) {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (err) {
      return {};
    }
  }
  return value || {};
}

function formatStatic(row) {
  if (!row) {
    return null;
  }
  const data = parseData(row.data);
  return {
    id: row.id,
    sessionId: row.session_id,
    userAgent: data.userAgent,
    language: data.language,
    cookiesAllowed: Boolean(data.cookiesAllowed),
    javascriptAllowed: Boolean(data.javascriptAllowed),
    imagesAllowed: Boolean(data.imagesAllowed),
    cssAllowed: Boolean(data.cssAllowed),
    screenDimensions: data.screenDimensions,
    windowDimensions: data.windowDimensions,
    networkConnection: data.networkConnection,
    country: data.country || null,
    createdAt: row.server_timestamp
  };
}

function formatEvent(row) {
  return {
    id: row.id,
    sessionId: row.session_id,
    type: row.type,
    url: row.url,
    clientTimestamp: row.client_timestamp,
    serverTimestamp: row.server_timestamp,
    ip: row.ip,
    data: parseData(row.data)
  };
}

function formatTimelineEntry(row) {
  return {
    id: row.id,
    type: row.type,
    url: row.url,
    clientTimestamp: row.client_timestamp,
    serverTimestamp: row.server_timestamp,
    data: parseData(row.data)
  };
}

module.exports = { formatStatic, formatEvent, formatTimelineEntry };
