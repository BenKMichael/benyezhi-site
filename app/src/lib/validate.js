function stripControlChars(s) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code > 31 && code !== 127) {
      out += s[i];
    }
  }
  return out;
}

function cleanString(value, maxLength) {
  if (value === undefined || value === null) {
    return null;
  }
  let s = stripControlChars(String(value)).trim();
  if (maxLength && s.length > maxLength) {
    s = s.slice(0, maxLength);
  }
  return s === '' ? null : s;
}

function cleanType(value) {
  if (value === undefined || value === null) {
    return null;
  }
  const s = String(value).trim().toLowerCase();
  return /^[a-z_]{1,50}$/.test(s) ? s : null;
}

function cleanSessionId(value) {
  if (value === undefined || value === null) {
    return null;
  }
  const s = String(value).trim();
  return /^[A-Za-z0-9_-]{1,128}$/.test(s) ? s : null;
}

function cleanUrl(value, maxLength = 2048) {
  if (value === undefined || value === null) {
    return null;
  }
  const s = String(value).trim();
  if (s === '' || s.length > maxLength) {
    return null;
  }
  try {
    const parsed = new URL(s);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
  } catch (err) {
    return null;
  }
  return s;
}

function cleanEmail(value) {
  if (value === undefined || value === null) {
    return null;
  }
  const s = String(value).trim().toLowerCase();
  if (s.length > 100) {
    return null;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : null;
}

function cleanUsername(value) {
  if (value === undefined || value === null) {
    return null;
  }
  const s = String(value).trim();
  return /^[A-Za-z0-9._-]{3,50}$/.test(s) ? s : null;
}

function cleanPassword(value) {
  if (value === undefined || value === null) {
    return null;
  }
  const s = String(value);
  return s.length >= 8 && s.length <= 200 ? s : null;
}

function cleanDataBlob(value, maxBytes = 65536) {
  if (value === undefined || value === null) {
    return {};
  }
  if (typeof value !== 'object') {
    return null;
  }
  let serialized;
  try {
    serialized = JSON.stringify(value);
  } catch (err) {
    return null;
  }
  if (serialized.length > maxBytes) {
    return null;
  }
  return value;
}

function toMysqlDatetime(value, fallbackToNow = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallbackToNow ? toMysqlDatetime(Date.now()) : null;
  }
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

module.exports = {
  cleanString,
  cleanType,
  cleanSessionId,
  cleanUrl,
  cleanEmail,
  cleanUsername,
  cleanPassword,
  cleanDataBlob,
  toMysqlDatetime
};
