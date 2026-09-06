(function () {
    const payload = JSON.parse(document.getElementById('report-data').textContent);
    const charts = {};
    let dirty = false;

    const rangeLabel = document.getElementById('range-label');
    rangeLabel.textContent =
        'Data window: ' + new Date(payload.rangeStart).toLocaleString('en-US') +
        '  –  ' + new Date(payload.rangeEnd).toLocaleString('en-US');

    payload.specs.forEach(function (spec) {
        charts[spec.key] = window.reportPdf.drawChart(
            'chart-' + spec.key,
            spec,
            payload.charts[spec.key] || { labels: [], values: [] }
        );
    });

    document.querySelectorAll('.comment').forEach(function (box) {
        const key = box.dataset.key;
        const ta = box.querySelector('textarea');
        const editBtn = box.querySelector('.btn-edit');
        const saveBtn = box.querySelector('.btn-save');

        ta.value = payload.comments[key] || '';

        editBtn.addEventListener('click', function () {
            ta.readOnly = false;
            ta.focus();
            editBtn.hidden = true;
            saveBtn.hidden = false;
            dirty = true;
        });

        saveBtn.addEventListener('click', function () {
            payload.comments[key] = ta.value;
            ta.readOnly = true;
            ta.blur();
            saveBtn.hidden = true;
            editBtn.hidden = false;
        });

        ta.addEventListener('input', function () {
            dirty = true;
        });
    });

    function commitOpenEditors() {
        document.querySelectorAll('.comment').forEach(function (box) {
            const ta = box.querySelector('textarea');
            if (!ta.readOnly) {
                payload.comments[box.dataset.key] = ta.value;
            }
        });
    }

    window.addEventListener('beforeunload', function (e) {
        if (dirty) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    document.getElementById('save-report').addEventListener('click', async function () {
        commitOpenEditors();
        const btn = this;
        btn.disabled = true;
        try {
            const res = await fetch('/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: payload.type,
                    charts: payload.charts,
                    comments: payload.comments,
                    rangeStart: payload.rangeStart,
                    rangeEnd: payload.rangeEnd
                })
            });
            if (!res.ok) {
                throw new Error('server returned ' + res.status);
            }
            dirty = false;
            window.location = '/';
        } catch (err) {
            alert('Could not save the report: ' + err.message);
            btn.disabled = false;
        }
    });

    document.getElementById('download-report').addEventListener('click', function () {
        commitOpenEditors();
        window.reportPdf.buildReportPdf(payload, function (key) {
            return charts[key] ? charts[key].toBase64Image('image/png', 1) : null;
        });
    });
})();
