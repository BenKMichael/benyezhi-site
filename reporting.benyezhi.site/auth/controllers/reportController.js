const db = require('../db');
const { ROLES } = require('../config/constants');

exports.getDegradationReport = async (req, res) => {
    try {
        const [chartRows] = await db.query(`
            SELECT 
                url,
                CAST(COALESCE(SUM(CASE WHEN type = 'error' THEN 1 ELSE 0 END), 0) AS UNSIGNED) AS error_count,
                CAST(COALESCE(SUM(CASE 
                    WHEN type = 'activity_batch' AND JSON_VALID(data) THEN JSON_LENGTH(data)
                    WHEN type IN ('click', 'keydown', 'scroll') THEN 1
                    ELSE 0 
                END), 0) AS UNSIGNED) AS interaction_count
            FROM events
            WHERE url IS NOT NULL AND url != ''
            GROUP BY url
            ORDER BY error_count DESC, interaction_count DESC
            LIMIT 6;
        `);

        const [gridRows] = await db.query(`
            SELECT 
                url,
                COALESCE(data->>'$.message', 'Uncaught Script Error') AS error_message,
                COALESCE(data->>'$.source', 'inline') AS script_source,
                COALESCE(data->>'$.lineno', 'N/A') AS line_number,
                COUNT(*) AS occurrences
            FROM events
            WHERE type = 'error'
            GROUP BY url, error_message, script_source, line_number
            ORDER BY occurrences DESC
            LIMIT 10;
        `);

        const [capabilityRows] = await db.query(`
            SELECT 
                session_id,
                MAX(CASE WHEN data->>'$.cookiesAllowed' = 'true' OR data->>'$.cookiesEnabled' = 'true' THEN 1 ELSE 0 END) AS cookies,
                MAX(CASE WHEN data->>'$.javascriptAllowed' = 'true' THEN 1 ELSE 0 END) AS js,
                MAX(CASE WHEN data->>'$.imagesAllowed' = 'true' THEN 1 ELSE 0 END) AS images,
                MAX(CASE WHEN data->>'$.cssAllowed' = 'true' THEN 1 ELSE 0 END) AS css
            FROM events
            WHERE type = 'static'
            GROUP BY session_id;
        `);

        const totalSessions = capabilityRows.length || 1;
        let cookiesCount = 0;
        let jsCount = 0;
        let imagesCount = 0;
        let cssCount = 0;

        capabilityRows.forEach(row => {
            if (row.cookies) cookiesCount++;
            if (row.js) jsCount++;
            if (row.images) imagesCount++;
            if (row.css) cssCount++;
        });

        const capabilityPercentages = [
            Math.round((cookiesCount / totalSessions) * 100),
            Math.round((jsCount / totalSessions) * 100),
            Math.round((imagesCount / totalSessions) * 100),
            Math.round((cssCount / totalSessions) * 100)
        ];

        const user = req.session.user;
        res.render('report-degradation', {
            user,
            isAdmin: user.role === ROLES.ADMIN,
            chartData: chartRows,
            gridData: gridRows,
            totalSessions: capabilityRows.length,
            capabilityPercentages
        });
    } catch (err) {
        console.error('Error loading graceful degradation report:', err);
        res.status(500).send('Internal Server Error: Unable to fetch report data.');
    }
};