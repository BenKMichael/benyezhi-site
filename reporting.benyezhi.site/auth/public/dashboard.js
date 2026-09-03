(function () {
    const DAYS_SPAN = 7;
    const TOP_COUNTRIES = 10;

    async function fetchJSON(url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(url + ' returned ' + res.status);
        return res.json();
    }

    // Visitor-supplied strings (userAgent, url) go through collector.js,
    // which accepts input from anyone -- never insert them into the page
    // without escaping first.
    function escapeHtml(value) {
        const div = document.createElement('div');
        div.textContent = value == null ? '' : String(value);
        return div.innerHTML;
    }

    // Midnight-aligned Date objects for each of the last DAYS_SPAN days,
    // oldest first, today last -- used both to bucket data and to make
    // sure the chart always shows a full week, including zero-visitor days.
    function getLastNDays(n) {
        const days = [];
        for (let i = n - 1; i >= 0; i--) {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() - i);
            days.push(d);
        }
        return days;
    }

    function dayKey(date) {
        return date.toISOString().slice(0, 10); // YYYY-MM-DD
    }

    function dayLabel(date) {
        return date.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' });
    }

    function bucketUniqueVisitorsByDay(events, days) {
        const buckets = {};
        days.forEach(function (d) { buckets[dayKey(d)] = new Set(); });
        events.forEach(function (e) {
            const key = new Date(e.serverTimestamp).toISOString().slice(0, 10);
            if (buckets[key]) buckets[key].add(e.sessionId);
        });
        return days.map(function (d) { return buckets[dayKey(d)].size; });
    }

    function countByCountry(sessions) {
        const counts = {};
        sessions.forEach(function (s) {
            const key = s.country || 'Unknown';
            counts[key] = (counts[key] || 0) + 1;
        });
        return counts;
    }

    // Keeps the pie chart readable regardless of how many distinct
    // countries show up -- top N by count, everything past that collapsed
    // into a single "Other" slice rather than an unreadable sliver-fest.
    function topCountriesWithOther(counts, topN) {
        const entries = Object.entries(counts).sort(function (a, b) { return b[1] - a[1]; });
        if (entries.length <= topN) return counts;

        const top = entries.slice(0, topN);
        const rest = entries.slice(topN);
        const otherTotal = rest.reduce(function (sum, entry) { return sum + entry[1]; }, 0);

        const result = {};
        top.forEach(function (entry) { result[entry[0]] = entry[1]; });
        result['Other'] = otherTotal;
        return result;
    }

    function countCapabilities(sessions) {
        const caps = { cookiesAllowed: 0, javascriptAllowed: 0, imagesAllowed: 0, cssAllowed: 0 };
        sessions.forEach(function (s) {
            Object.keys(caps).forEach(function (key) {
                if (s[key]) caps[key]++;
            });
        });
        return caps;
    }

    function renderVisitorsOverTime(events, days) {
        const counts = bucketUniqueVisitorsByDay(events, days);
        new Chart(document.getElementById('visitorsOverTimeChart'), {
            type: 'line',
            data: {
                labels: days.map(dayLabel),
                datasets: [{
                    label: 'Unique visitors',
                    data: counts,
                    borderColor: '#0066cc',
                    backgroundColor: 'rgba(0,102,204,0.1)',
                    fill: true,
                    tension: 0.2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
            }
        });
    }

    function renderVisitorLocation(sessions) {
        const counts = topCountriesWithOther(countByCountry(sessions), TOP_COUNTRIES);
        new Chart(document.getElementById('locationChart'), {
            type: 'pie',
            data: {
                labels: Object.keys(counts),
                datasets: [{
                    data: Object.values(counts),
                    backgroundColor: ['#0066cc', '#2e8b57', '#d9534f', '#f0ad4e', '#5bc0de', '#8e44ad', '#e67e22', '#16a085', '#c0392b', '#7f8c8d', '#777']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                // Default legend position centers the pie in the leftover
                // space; putting the legend on the right instead keeps the
                // circle itself pinned to the left side of the card.
                plugins: { legend: { position: 'right', align: 'start' } }
            }
        });
    }

    function renderCapabilityBreakdown(sessions) {
        const caps = countCapabilities(sessions);
        const total = sessions.length || 1;
        new Chart(document.getElementById('capabilityChart'), {
            type: 'bar',
            data: {
                labels: ['Cookies', 'JavaScript', 'Images', 'CSS'],
                datasets: [{
                    label: '% of sessions allowed',
                    data: [caps.cookiesAllowed, caps.javascriptAllowed, caps.imagesAllowed, caps.cssAllowed]
                        .map(function (n) { return Math.round((n / total) * 100); }),
                    backgroundColor: '#0066cc'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, max: 100, ticks: { callback: function (v) { return v + '%'; } } } },
                plugins: { legend: { display: false } }
            }
        });
    }

    function renderEventsGrid(events) {
        const tbody = document.querySelector('#eventsGrid tbody');
        tbody.innerHTML = events.slice(0, 20).map(function (e) {
            return '<tr>'
                + '<td>' + escapeHtml((e.sessionId || '').slice(0, 12)) + '...</td>'
                + '<td>' + escapeHtml(e.type) + '</td>'
                + '<td>' + escapeHtml(e.url) + '</td>'
                + '<td>' + escapeHtml(new Date(e.serverTimestamp).toLocaleString()) + '</td>'
                + '</tr>';
        }).join('');
    }

    function renderSessionsGrid(sessions) {
        const tbody = document.querySelector('#sessionsGrid tbody');
        tbody.innerHTML = sessions.slice(0, 20).map(function (s) {
            return '<tr>'
                + '<td>' + escapeHtml((s.sessionId || '').slice(0, 12)) + '...</td>'
                + '<td>' + escapeHtml((s.userAgent || '').slice(0, 40)) + '</td>'
                + '<td>' + escapeHtml(s.country || 'Unknown') + '</td>'
                + '<td>' + escapeHtml(new Date(s.createdAt).toLocaleString()) + '</td>'
                + '</tr>';
        }).join('');
    }

    async function init() {
        try {
            const days = getLastNDays(DAYS_SPAN);
            const startTime = days[0].toISOString();

            const [eventsRes, staticRes] = await Promise.all([
                fetchJSON('/api/events?limit=100&start_time=' + encodeURIComponent(startTime)),
                fetchJSON('/api/static?limit=100&start_time=' + encodeURIComponent(startTime))
            ]);
            const events = eventsRes.data || [];
            const sessions = staticRes.data || [];

            renderVisitorsOverTime(events, days);
            renderVisitorLocation(sessions);
            renderCapabilityBreakdown(sessions);
            renderEventsGrid(events);
            renderSessionsGrid(sessions);
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
        }
    }

    document.addEventListener('DOMContentLoaded', init);
})();
