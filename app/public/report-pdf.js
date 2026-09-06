(function () {
    const PALETTE = [
        '#0066cc', '#2e8b57', '#e67e22', '#8e44ad', '#d9534f',
        '#16a085', '#f0ad4e', '#5bc0de', '#c0392b', '#7f8c8d'
    ];

    const WHITE_BG = {
        id: 'whiteBg',
        beforeDraw: function (chart) {
            const ctx = chart.ctx;
            ctx.save();
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, chart.width, chart.height);
            ctx.restore();
        }
    };

    function drawChart(canvasId, spec, series) {
        const horizontal = spec.kind === 'hbar';
        const values = series.values || [];
        return new Chart(document.getElementById(canvasId), {
            type: 'bar',
            data: {
                labels: series.labels || [],
                datasets: [{
                    label: spec.title,
                    data: values,
                    backgroundColor: values.map(function (_, i) { return PALETTE[i % PALETTE.length]; })
                }]
            },
            options: {
                indexAxis: horizontal ? 'y' : 'x',
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { beginAtZero: true },
                    y: { beginAtZero: true }
                }
            },
            plugins: [WHITE_BG]
        });
    }

    function fmtDate(value) {
        const d = new Date(value);
        return isNaN(d.getTime()) ? String(value) : d.toLocaleString('en-US');
    }

    function buildReportPdf(payload, getImage) {
        const jsPDF = window.jspdf.jsPDF;
        const doc = new jsPDF({ unit: 'pt', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const margin = 40;
        const contentW = pageW - margin * 2;
        const lineH = 12;
        const boxPad = 10;
        const gapAfterImg = 16;
        let y = margin;

        doc.setFontSize(18);
        doc.text(String(payload.typeLabel || payload.type), margin, y);
        y += 22;

        doc.setFontSize(10);
        doc.setTextColor(120);
        doc.text('Data window: ' + fmtDate(payload.rangeStart) + '  –  ' + fmtDate(payload.rangeEnd), margin, y);
        y += 14;
        if (payload.meta && payload.meta.creatorName) {
            doc.text('Created by ' + payload.meta.creatorName + ' on ' + fmtDate(payload.meta.createdAt), margin, y);
            y += 14;
        }
        doc.setTextColor(0);
        y += 12;

        payload.specs.forEach(function (spec) {
            const img = getImage(spec.key);
            const imgH = img ? contentW * 0.42 : 0;
            const comment = (payload.comments && payload.comments[spec.key]) || '';
            const lines = comment ? doc.splitTextToSize(comment, contentW - boxPad * 2) : ['(no notes)'];
            const boxH = boxPad * 2 + lines.length * lineH;
            const blockH = 16 + imgH + gapAfterImg + boxH + 22;

            if (y + blockH > pageH - margin) {
                doc.addPage();
                y = margin;
            }

            doc.setFontSize(12);
            doc.text(spec.title, margin, y);
            y += 14;

            if (img) {
                doc.addImage(img, 'PNG', margin, y, contentW, imgH);
                y += imgH;
            }
            y += gapAfterImg;

            doc.setDrawColor(200);
            doc.setLineWidth(0.75);
            doc.roundedRect(margin, y, contentW, boxH, 4, 4);

            doc.setFontSize(10);
            doc.setTextColor(comment ? 40 : 160);
            doc.text(lines, margin + boxPad, y + boxPad + 9);
            doc.setTextColor(0);

            y += boxH + 22;
        });

        doc.save('report-' + payload.type + '-' + new Date().toISOString().slice(0, 10) + '.pdf');
    }

    window.reportPdf = { drawChart: drawChart, buildReportPdf: buildReportPdf };
})();
