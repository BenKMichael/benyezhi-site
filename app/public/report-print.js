(function () {
    const payload = JSON.parse(document.getElementById('report-data').textContent);
    const status = document.getElementById('status');
    const charts = {};

    payload.specs.forEach(function (spec) {
        charts[spec.key] = window.reportPdf.drawChart(
            'chart-' + spec.key,
            spec,
            payload.charts[spec.key] || { labels: [], values: [], points: [] }
        );
    });

    setTimeout(function () {
        try {
            window.reportPdf.buildReportPdf(payload, function (key) {
                return charts[key] ? charts[key].toBase64Image('image/png', 1) : null;
            });
            status.textContent = 'Your PDF has downloaded. You can close this tab.';
        } catch (err) {
            status.textContent = 'Could not generate the PDF: ' + err.message;
        }
    }, 400);
})();
