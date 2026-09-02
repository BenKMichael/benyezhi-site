(function () {
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

    function bucketEventsByHour(events) {
        const buckets = {};
        events.forEach(function (e) {
            const d = new Date(e.serverTimestamp);
            const key = (d.getMonth() + 1) + '/' + d.getDate() + ' ' + d.getHours() + ':00';
            buckets[key] = (buckets[key] || 0) + 1;
        });
        return buckets;
    }

    function countByType(events) {
        const counts = {};
        events.forEach(function (e) {
            counts[e.type] = (counts[e.type] || 0) + 1;
        });
        return counts;
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

    function renderEventsOverTime(events) {
        const buckets = bucketEventsByHour(events);
        new Chart(document.getElementById('eventsOverTimeChart'), {
            type: 'line',
            data: {
                labels: Object.keys(buckets),
                datasets: [{
                    label: 'Events',
                    data: Object.values(buckets),
                    borderColor: '#0066cc',
                    backgroundColor: 'rgba(0,102,204,0.1)',
                    fill: true,
                    tension: 0.2
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } } }
        });
    }

    function renderEventTypeBreakdown(events) {
        const counts = countByType(events);
        new Chart(document.getElementById('eventTypeChart'), {
            type: 'doughnut',
            data: {
                labels: Object.keys(counts),
                datasets: [{
                    data: Object.values(counts),
                    backgroundColor: ['#0066cc', '#2e8b57', '#d9534f', '#f0ad4e', '#5bc0de', '#8e44ad', '#777']
                }]
            },
            options: { responsive: true }
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
                + '<td>' + escapeHtml(s.language) + '</td>'
                + '<td>' + escapeHtml(new Date(s.createdAt).toLocaleString()) + '</td>'
                + '</tr>';
        }).join('');
    }

    async function init() {
        try {
            const [eventsRes, staticRes] = await Promise.all([
                fetchJSON('/api/events?limit=100'),
                fetchJSON('/api/static?limit=100')
            ]);
            const events = eventsRes.data || [];
            const sessions = staticRes.data || [];

            renderEventsOverTime(events);
            renderEventTypeBreakdown(events);
            renderCapabilityBreakdown(sessions);
            renderEventsGrid(events);
            renderSessionsGrid(sessions);
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
        }
    }

    document.addEventListener('DOMContentLoaded', init);
})();
