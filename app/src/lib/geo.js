const geoip = require('geoip-lite');

function lookupCountry(ip) {
  const geo = geoip.lookup(ip);
  return geo ? geo.country : null;
}

module.exports = { lookupCountry };
