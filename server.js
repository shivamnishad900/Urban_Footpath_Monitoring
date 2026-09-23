const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve website files
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// ==========================================
// PHOTO UPLOAD CONFIGURATION
// ==========================================

const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },

    filename: function (req, file, cb) {

        const uniqueName =
            Date.now() +
            '-' +
            Math.round(Math.random() * 1E9) +
            path.extname(file.originalname);

        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: function (req, file, cb) {

        const allowedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPG, JPEG, PNG and WEBP images are allowed.'));
        }
    }
});


// ==========================================
// HOME PAGE
// ==========================================

app.get('/', (req, res) => {

    res.sendFile(
        path.join(__dirname, 'public', 'index.html')
    );

});


// ==========================================
// DATABASE TEST
// ==========================================

app.get('/test-db', (req, res) => {

    db.query(
        'SELECT 1 AS test',
        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: 'Database connection failed'
                });

            }

            res.json({
                success: true,
                message: 'Database connected successfully!',
                result: result
            });

        }
    );

});


// ==========================================
// SUBMIT FOOTPATH REPORT
// ==========================================

app.post(
    '/api/reports',
    upload.single('photo'),
    (req, res) => {

       const {
    user_id,
    name,
    mobile,
    location,
    latitude,
    longitude,
    obstruction_type,
    severity,
    description
} = req.body;

        // Validate required fields
        if (
            !name ||
            !location ||
            !obstruction_type ||
            !severity ||
            !description
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Please fill all required fields.'

            });

        }


        // Get uploaded photo filename
        const photo =
            req.file
                ? req.file.filename
                : null;


        const sql = `
    INSERT INTO reports
    (
        user_id,
        name,
        mobile,
        location,
        latitude,
        longitude,
        obstruction_type,
        severity,
        description,
        photo,
        status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

const values = [
    user_id || null,
    name,
    mobile || null,
    location,
    latitude || null,
    longitude || null,
    obstruction_type,
    severity,
    description,
    photo,
    'Pending'
];


        db.query(
            sql,
            values,
            (err, result) => {

                if (err) {

                    console.error(
                        'Report insert error:',
                        err
                    );

                    return res.status(500).json({

                        success: false,

                        message:
                            'Failed to save report.'

                    });

                }


                res.status(201).json({

                    success: true,

                    message:
                        'Report submitted successfully!',

                    reportId:
                        result.insertId

                });

            }
        );

    }
);



// ==========================================
// TRACK REPORT
// ==========================================

app.get('/api/reports/:id', (req, res) => {

    const reportId = req.params.id;

    const sql = `
        SELECT
            id,
            name,
            location,
            obstruction_type,
            severity,
            description,
            status,
            created_at
        FROM reports
        WHERE id = ?
    `;

    db.query(
        sql,
        [reportId],
        (err, results) => {

            if (err) {

                console.error(
                    'Track report error:',
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        'Unable to fetch report.'
                });

            }


            if (results.length === 0) {

                return res.status(404).json({
                    success: false,
                    message:
                        'Report not found.'
                });

            }


            res.json({
                success: true,
                report: results[0]
            });

        }
    );

});

// ==========================================
// ADMIN SIGNUP
// ==========================================

app.post('/api/admin/signup', (req, res) => {

    const { full_name, email, username, password } = req.body;

    if (!full_name || !email || !username || !password) {
        return res.status(400).json({
            success: false,
            message: 'All fields are required.'
        });
    }

    const checkSql = `
        SELECT id
        FROM admin
        WHERE username = ? OR email = ?
    `;

    db.query(checkSql, [username, email], (err, results) => {

        if (err) {
            console.error('Signup check error:', err);

            return res.status(500).json({
                success: false,
                message: 'Database error.'
            });
        }

        if (results.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Username or email already exists.'
            });
        }

        const insertSql = `
            INSERT INTO admin
            (full_name, email, username, password)
            VALUES (?, ?, ?, ?)
        `;

        db.query(
            insertSql,
            [full_name, email, username, password],
            (err, result) => {

                if (err) {
                    console.error('Signup insert error:', err);

                    return res.status(500).json({
                        success: false,
                        message: 'Failed to create account.'
                    });
                }

                res.status(201).json({
                    success: true,
                    message: 'Account created successfully.'
                });
            }
        );
    });
});

// ==========================================
// START SERVER
// ==========================================

// ==========================================
// HOMEPAGE LIVE STATISTICS
// ==========================================

app.get('/api/statistics', (req, res) => {

    const sql = `
        SELECT
            COUNT(*) AS totalReports,

            SUM(status = 'Pending') AS pending,

            SUM(status = 'In Progress') AS inProgress,

            SUM(status = 'Resolved') AS resolved,

            COUNT(DISTINCT location) AS activeAreas

        FROM reports
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error('Statistics error:', err);

            return res.status(500).json({
                success: false,
                message: 'Unable to fetch statistics.'
            });
        }

        const stats = results[0];

        res.json({
            success: true,
            totalReports: stats.totalReports || 0,
            pending: stats.pending || 0,
            inProgress: stats.inProgress || 0,
            resolved: stats.resolved || 0,
            activeAreas: stats.activeAreas || 0
        });
    });
});

// ==========================================
// HOME PAGE - LIVE STATISTICS
// ==========================================

app.get('/api/stats', (req, res) => {

    const sql = `
        SELECT
            COUNT(*) AS totalReports,
            SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) AS resolvedReports,
            COUNT(DISTINCT location) AS activeAreas
        FROM reports
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error('Stats error:', err);

            return res.status(500).json({
                success: false,
                message: 'Unable to fetch statistics.'
            });
        }

        res.json({
            success: true,
            stats: {
                totalReports: results[0].totalReports || 0,
                resolvedReports: results[0].resolvedReports || 0,
                activeAreas: results[0].activeAreas || 0,
                communityDriven: 100
            }
        });

    });
});

// ===============================
// PHOTO UPLOAD ERROR HANDLER
// ===============================

app.use((err, req, res, next) => {

    if (err instanceof multer.MulterError) {

        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'Photo is too large. Maximum file size is 10 MB.'
            });
        }

        return res.status(400).json({
            success: false,
            message: 'Photo upload failed: ' + err.message
        });
    }

    if (err) {
        console.error('Upload error:', err);

        return res.status(400).json({
            success: false,
            message: err.message || 'Photo upload failed.'
        });
    }

    next();
});


app.listen(
    PORT,
    () => {

        console.log(
            `🚀 Server running at http://localhost:${PORT}`
        );

    }
);


// ==========================================
// ANALYTICS DATA
// ==========================================

app.get('/api/analytics', (req, res) => {

    const queries = {

        total: `
            SELECT COUNT(*) AS total
            FROM reports
        `,

        obstruction: `
            SELECT
                obstruction_type AS type,
                COUNT(*) AS count
            FROM reports
            GROUP BY obstruction_type
            ORDER BY count DESC
        `,

        severity: `
            SELECT
                severity,
                COUNT(*) AS count
            FROM reports
            GROUP BY severity
            ORDER BY count DESC
        `,

        location: `
    SELECT
        location,
        COUNT(*) AS count,
        AVG(latitude) AS latitude,
        AVG(longitude) AS longitude
    FROM reports
    GROUP BY location
    ORDER BY count DESC
`,

        status: `
            SELECT
                status,
                COUNT(*) AS count
            FROM reports
            GROUP BY status
            ORDER BY count DESC
        `

    };


    db.query(
        queries.total,
        (err, totalResult) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: 'Analytics error.'
                });
            }


            db.query(
                queries.obstruction,
                (err, obstructionResult) => {

                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: 'Analytics error.'
                        });
                    }


                    db.query(
                        queries.severity,
                        (err, severityResult) => {

                            if (err) {
                                return res.status(500).json({
                                    success: false,
                                    message: 'Analytics error.'
                                });
                            }


                            db.query(
                                queries.location,
                                (err, locationResult) => {

                                    if (err) {
                                        return res.status(500).json({
                                            success: false,
                                            message: 'Analytics error.'
                                        });
                                    }


                                    db.query(
                                        queries.status,
                                        (err, statusResult) => {

                                            if (err) {
                                                return res.status(500).json({
                                                    success: false,
                                                    message: 'Analytics error.'
                                                });
                                            }


                                            res.json({

                                                success: true,

                                                total:
                                                    totalResult[0].total,

                                                obstruction:
                                                    obstructionResult,

                                                severity:
                                                    severityResult,

                                                location:
                                                    locationResult,

                                                status:
                                                    statusResult

                                            });

                                        }
                                    );

                                }
                            );

                        }
                    );

                }
            );

        }
    );

});
// ============================================
// GET ALL FOOTPATH REPORTS
// ============================================

app.get('/api/reports', (req, res) => {
    const sql = `
        SELECT
            id,
            name,
            mobile,
            location,
            latitude,
            longitude,
            obstruction_type,
            severity,
            description,
            photo,
            status,
            created_at
        FROM reports
        ORDER BY created_at DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Get reports error:', err);

            return res.status(500).json({
                success: false,
                message: 'Failed to fetch reports.'
            });
        }

        res.json({
            success: true,
            reports: results
        });
    });
});

// ==========================================
// ADMIN LOGIN
// ==========================================

app.post('/api/admin/login', (req, res) => {

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Username and password are required.'
        });
    }

    const sql = `
        SELECT id, username
        FROM admin
        WHERE username = ? AND password = ?
    `;

    db.query(
        sql,
        [username, password],
        (err, results) => {

            if (err) {
                console.error('Admin login error:', err);

                return res.status(500).json({
                    success: false,
                    message: 'Server error.'
                });
            }

            if (results.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid username or password.'
                });
            }

            res.json({
    success: true,
    message: 'Login successful!',
    admin: {
        id: results[0].id,
        username: results[0].username
    }
});

        }
    );

});


// ==========================================
// GET ALL REPORTS
// ==========================================

// ==========================================
// ADMIN DASHBOARD - GET ALL REPORTS
// ==========================================

app.get('/api/admin/reports', (req, res) => {

    const sql = `
        SELECT
            id,
            user_id,
            name,
            mobile,
            location,
            latitude,
            longitude,
            obstruction_type,
            severity,
            description,
            photo,
            status,
            created_at
        FROM reports
        ORDER BY created_at DESC
    `;

    db.query(sql, (err, reports) => {

        if (err) {
            console.error('Fetch reports error:', err);

            return res.status(500).json({
                success: false,
                message: 'Unable to fetch reports.'
            });
        }

        // Calculate dashboard statistics
        const stats = {
            total: reports.length,

            pending: reports.filter(
                report => report.status === 'Pending'
            ).length,

            inProgress: reports.filter(
                report => report.status === 'In Progress'
            ).length,

            resolved: reports.filter(
                report => report.status === 'Resolved'
            ).length
        };

        res.json({
            success: true,
            stats: stats,
            reports: reports
        });
    });
});


// ==========================================
// UPDATE REPORT STATUS
// ==========================================

app.put('/api/admin/reports/:id/status', (req, res) => {

    const reportId = req.params.id;
    const { status } = req.body;

    const allowedStatuses = [
        'Pending',
        'Verified',
        'In Progress',
        'Resolved'
    ];

    if (!allowedStatuses.includes(status)) {

        return res.status(400).json({
            success: false,
            message: 'Invalid status.'
        });

    }

    const sql = `
        UPDATE reports
        SET status = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [status, reportId],
        (err, result) => {

            if (err) {

                console.error(
                    'Status update error:',
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: 'Unable to update status.'
                });

            }

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    success: false,
                    message: 'Report not found.'
                });

            }

            res.json({
                success: true,
                message: 'Report status updated successfully!'
            });

        }
    );

});

// ==========================================
// USER LOGIN
// ==========================================

app.post('/api/user/login', (req, res) => {

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Username and password are required.'
        });
    }

    const sql = `
        SELECT id, username
        FROM users
        WHERE username = ? AND password = ?
    `;

    db.query(
        sql,
        [username, password],
        (err, results) => {

            if (err) {
                console.error('User login error:', err);

                return res.status(500).json({
                    success: false,
                    message: 'Server error.'
                });
            }

            if (results.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid username or password.'
                });
            }

            res.json({
                success: true,
                message: 'Login successful!',
                user: results[0]
            });
        }
    );

});