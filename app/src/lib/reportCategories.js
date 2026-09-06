const a = require('../models/analyticsModel');

function series(rows) {
  return {
    labels: rows.map((r) => String(r.label)),
    values: rows.map((r) => Number(r.value) || 0)
  };
}

const CATEGORIES = {
  audience: {
    label: 'Audience & Technology',
    charts: [
      { key: 'countries', title: 'Sessions by Country (Top 15)', kind: 'hbar', width: 'full' },
      { key: 'screens', title: 'Screen Size Class', kind: 'bar', width: 'half' },
      { key: 'browsers', title: 'Browser Family', kind: 'bar', width: 'half' }
    ],
    async build(start, end) {
      const [countries, screens, browsers] = await Promise.all([
        a.audienceCountries(start, end),
        a.audienceScreenClasses(start, end),
        a.audienceBrowsers(start, end)
      ]);
      return { countries: series(countries), screens: series(screens), browsers: series(browsers) };
    }
  },

  performance: {
    label: 'Page Load Performance',
    charts: [
      { key: 'buckets', title: 'Load Time Distribution', kind: 'bar', width: 'half' },
      { key: 'phases', title: 'Average Timing Phase (ms)', kind: 'bar', width: 'half' },
      { key: 'slowest', title: 'Slowest Pages (avg ms, Top 10)', kind: 'hbar', width: 'full' }
    ],
    async build(start, end) {
      const [buckets, phases, slowest] = await Promise.all([
        a.perfLoadBuckets(start, end),
        a.perfPhaseBreakdown(start, end),
        a.perfSlowestPages(start, end)
      ]);
      return { buckets: series(buckets), phases: series(phases), slowest: series(slowest) };
    }
  },

  engagement: {
    label: 'Engagement & Attention',
    charts: [
      { key: 'funnel', title: 'Engagement Funnel (% of sessions)', kind: 'bar', width: 'half' },
      { key: 'idle', title: 'Avg Idle Break by Page (seconds, Top 10)', kind: 'hbar', width: 'half' },
      { key: 'timeOnPage', title: 'Avg Time on Page (seconds, Top 10)', kind: 'hbar', width: 'full' }
    ],
    async build(start, end) {
      const [funnel, idle, timeOnPage] = await Promise.all([
        a.engageFunnel(start, end),
        a.engageIdleByPage(start, end),
        a.engageTimeOnPage(start, end)
      ]);
      return { funnel: series(funnel), idle: series(idle), timeOnPage: series(timeOnPage) };
    }
  },

  journey: {
    label: 'Journey: Entry & Exit',
    charts: [
      { key: 'landing', title: 'Top Landing Pages', kind: 'hbar', width: 'full' },
      { key: 'exit', title: 'Top Exit Pages', kind: 'hbar', width: 'full' },
      { key: 'bounce', title: 'Bounce Rate by Landing Page (%)', kind: 'hbar', width: 'full' }
    ],
    async build(start, end) {
      const [landing, exit, bounce] = await Promise.all([
        a.journeyLandingPages(start, end),
        a.journeyExitPages(start, end),
        a.journeyBounceRate(start, end)
      ]);
      return { landing: series(landing), exit: series(exit), bounce: series(bounce) };
    }
  }
};

function exists(type) {
  return Object.prototype.hasOwnProperty.call(CATEGORIES, type);
}

function list() {
  return Object.keys(CATEGORIES).map((key) => ({ key, label: CATEGORIES[key].label }));
}

module.exports = { CATEGORIES, exists, list };
