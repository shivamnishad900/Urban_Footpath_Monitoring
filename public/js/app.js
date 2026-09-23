// ==========================================
// REPORT SUBMISSION
// ==========================================

const reportForm = document.getElementById('reportForm');

if (reportForm) {

    reportForm.addEventListener(
        'submit',
        async function (event) {

            event.preventDefault();

            const message =
                document.getElementById('message');

            const submitButton =
                reportForm.querySelector('.submit-btn');

            // Create form data
            const formData =
                new FormData(reportForm);

            // ------------------------------------------------
            // USER LOGIN IS NOT REQUIRED
            // ------------------------------------------------
            // If user_id exists, send it.
            // Otherwise backend can store NULL.
            const userId =
                localStorage.getItem('user_id');

            if (userId) {
                formData.append('user_id', userId);
            }

            // Show submitting status
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = '⏳ Submitting...';
            }

            if (message) {
                message.textContent =
                    'Submitting your report...';

                message.style.color =
                    '#19b5fe';
            }

            try {

                const response =
                    await fetch('/api/reports', {
                        method: 'POST',
                        body: formData
                    });

                const data =
                    await response.json();

                // --------------------------------------------
                // SUCCESS
                // --------------------------------------------

                if (data.success) {

                    if (message) {

                        message.innerHTML = `
                            ✅ <strong>
                            Report submitted successfully!
                            </strong>
                            <br>
                            📋 Your Report ID is:
                            <strong>#${data.reportId}</strong>
                        `;

                        message.style.color =
                            '#00e5a0';
                    }

                    // Save report ID
                    localStorage.setItem(
                        'last_report_id',
                        data.reportId
                    );

                    // Reset form
                    reportForm.reset();

                    // Reset location information
                    const latitudeInput =
                        document.getElementById('latitude');

                    const longitudeInput =
                        document.getElementById('longitude');

                    const locationStatus =
                        document.getElementById(
                            'locationStatus'
                        );

                    const displayLatitude =
                        document.getElementById(
                            'displayLatitude'
                        );

                    const displayLongitude =
                        document.getElementById(
                            'displayLongitude'
                        );

                    if (latitudeInput) {
                        latitudeInput.value = '';
                    }

                    if (longitudeInput) {
                        longitudeInput.value = '';
                    }

                    if (locationStatus) {

                        locationStatus.textContent =
                            'Location not captured yet.';

                        locationStatus.style.color =
                            '#94a3b8';
                    }

                    if (displayLatitude) {
                        displayLatitude.textContent =
                            'Not selected';
                    }

                    if (displayLongitude) {
                        displayLongitude.textContent =
                            'Not selected';
                    }

                }

                // --------------------------------------------
                // SERVER ERROR
                // --------------------------------------------

                else {

                    if (message) {

                        message.innerHTML =
                            `❌ ${data.message || 'Unable to submit report.'}`;

                        message.style.color =
                            '#ff6b6b';
                    }

                }

            } catch (error) {

                console.error(
                    'Report submission error:',
                    error
                );

                if (message) {

                    message.innerHTML =
                        '❌ Unable to connect to server. Please try again.';

                    message.style.color =
                        '#ff6b6b';
                }

            }

            // Enable button again
            if (submitButton) {

                submitButton.disabled =
                    false;

                submitButton.textContent =
                    '📍 Submit Report';
            }

        }
    );

}


// ==========================================
// TRACK REPORT
// ==========================================

const trackForm =
    document.getElementById('trackForm');

if (trackForm) {

    trackForm.addEventListener(
        'submit',
        async function (event) {

            event.preventDefault();

            const reportId =
                document.getElementById(
                    'reportId'
                ).value;

            const result =
                document.getElementById(
                    'trackResult'
                );

            result.innerHTML =
                '<p>🔎 Searching for report...</p>';

            try {

                const response =
                    await fetch(
                        `/api/reports/${reportId}`
                    );

                const data =
                    await response.json();

                if (!data.success) {

                    result.innerHTML = `
                        <div class="track-error">
                            ❌ ${data.message}
                        </div>
                    `;

                    return;
                }

                const report =
                    data.report;

                const date =
                    new Date(
                        report.created_at
                    ).toLocaleString();

                result.innerHTML = `

                    <div class="track-card">

                        <h2>
                            Report #${report.id}
                        </h2>

                        <div class="track-info">

                            <div>
                                <strong>Location</strong><br>
                                ${report.location}
                            </div>

                            <div>
                                <strong>Obstruction</strong><br>
                                ${report.obstruction_type}
                            </div>

                            <div>
                                <strong>Severity</strong><br>
                                ${report.severity}
                            </div>

                            <div>
                                <strong>Status</strong><br>

                                <span class="status-badge">
                                    ${report.status}
                                </span>
                            </div>

                            <div>
                                <strong>Submitted By</strong><br>
                                ${report.name}
                            </div>

                            <div>
                                <strong>Submitted On</strong><br>
                                ${date}
                            </div>

                        </div>

                        <div style="margin-top:20px;">

                            <strong>Description</strong>

                            <p style="margin-top:8px;">
                                ${report.description}
                            </p>

                        </div>

                    </div>

                `;

            } catch (error) {

                console.error(error);

                result.innerHTML = `
                    <div class="track-error">
                        ❌ Unable to connect to server.
                    </div>
                `;

            }

        }
    );

}





// ==========================================
// LOAD ADMIN REPORTS
// ==========================================

async function loadAdminReports() {

    try {

        const response =
            await fetch(
                '/api/admin/reports'
            );

        const data =
            await response.json();

        if (!data.success) {
            return;
        }

        const reports =
            data.reports || [];

        // ------------------------------------------
        // STATISTICS
        // ------------------------------------------

        const totalReports =
            document.getElementById(
                'totalReports'
            );

        const pendingReports =
            document.getElementById(
                'pendingReports'
            );

        const progressReports =
            document.getElementById(
                'progressReports'
            );

        const resolvedReports =
            document.getElementById(
                'resolvedReports'
            );

        if (totalReports) {
            totalReports.textContent =
                reports.length;
        }

        if (pendingReports) {

            pendingReports.textContent =
                reports.filter(
                    r =>
                        r.status === 'Pending'
                ).length;
        }

        if (progressReports) {

            progressReports.textContent =
                reports.filter(
                    r =>
                        r.status === 'In Progress'
                ).length;
        }

        if (resolvedReports) {

            resolvedReports.textContent =
                reports.filter(
                    r =>
                        r.status === 'Resolved'
                ).length;
        }


        // ------------------------------------------
        // PATTERN ANALYSIS
        // ------------------------------------------

        if (reports.length > 0) {

            const topObstruction =
                document.getElementById(
                    'topObstruction'
                );

            const topLocation =
                document.getElementById(
                    'topLocation'
                );

            const topSeverity =
                document.getElementById(
                    'topSeverity'
                );

            if (topObstruction) {

                topObstruction.textContent =
                    findMostCommon(
                        reports.map(
                            r =>
                                r.obstruction_type
                        )
                    );
            }

            if (topLocation) {

                topLocation.textContent =
                    findMostCommon(
                        reports.map(
                            r =>
                                r.location
                        )
                    );
            }

            if (topSeverity) {

                topSeverity.textContent =
                    findMostCommon(
                        reports.map(
                            r =>
                                r.severity
                        )
                    );
            }

        }


        // ------------------------------------------
        // REPORT TABLE
        // ------------------------------------------

        const table =
            document.getElementById(
                'reportsTable'
            );

        if (!table) {
            return;
        }

        table.innerHTML = '';

        reports.forEach(
            report => {

                const row =
                    document.createElement('tr');

                row.innerHTML = `

                    <td>
                        #${report.id}
                    </td>

                    <td>
                        ${report.name || 'Anonymous'}
                    </td>

                    <td>
                        ${report.location || 'Unknown'}
                    </td>

                    <td>
                        ${report.obstruction_type || 'Unknown'}
                    </td>

                    <td>
                        ${report.severity || 'Unknown'}
                    </td>

                    <td>

                        <select
                            class="status-select"
                            id="status-${report.id}"
                        >

                            <option
                                ${report.status === 'Pending'
                                    ? 'selected'
                                    : ''}
                            >
                                Pending
                            </option>

                            <option
                                ${report.status === 'Verified'
                                    ? 'selected'
                                    : ''}
                            >
                                Verified
                            </option>

                            <option
                                ${report.status === 'In Progress'
                                    ? 'selected'
                                    : ''}
                            >
                                In Progress
                            </option>

                            <option
                                ${report.status === 'Resolved'
                                    ? 'selected'
                                    : ''}
                            >
                                Resolved
                            </option>

                        </select>

                    </td>

                    <td>

                        <button
                            class="update-btn"
                            onclick="updateReportStatus(${report.id})"
                        >
                            Update
                        </button>

                    </td>

                `;

                table.appendChild(row);

            }
        );

    } catch (error) {

        console.error(
            'Unable to load admin reports:',
            error
        );

    }

}


// ==========================================
// FIND MOST COMMON VALUE
// ==========================================

function findMostCommon(values) {

    if (!values || values.length === 0) {
        return 'N/A';
    }

    const counts = {};

    values.forEach(
        value => {

            if (!value) {
                return;
            }

            counts[value] =
                (counts[value] || 0) + 1;

        }
    );

    let mostCommon =
        values[0];

    let highestCount =
        0;

    for (
        const value in counts
    ) {

        if (
            counts[value] >
            highestCount
        ) {

            highestCount =
                counts[value];

            mostCommon =
                value;
        }

    }

    return mostCommon;

}


// ==========================================
// UPDATE REPORT STATUS
// ==========================================

async function updateReportStatus(
    reportId
) {

    const select =
        document.getElementById(
            `status-${reportId}`
        );

    if (!select) {
        return;
    }

    const status =
        select.value;

    try {

        const response =
            await fetch(
                `/api/admin/reports/${reportId}/status`,
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({
                        status
                    })
                }
            );

        const data =
            await response.json();

        if (data.success) {

            alert(
                '✅ Report status updated successfully!'
            );

            loadAdminReports();

        } else {

            alert(
                `❌ ${data.message}`
            );

        }

    } catch (error) {

        console.error(error);

        alert(
            '❌ Unable to update report.'
        );

    }

}


// ==========================================
// ADMIN LOGOUT
// ==========================================

const logoutBtn =
    document.getElementById('logoutBtn');

if (logoutBtn) {

    logoutBtn.addEventListener(
        'click',
        function () {

            localStorage.removeItem(
                'admin_logged_in'
            );

            localStorage.removeItem(
                'admin_username'
            );

            const dashboard =
                document.getElementById(
                    'adminDashboard'
                );

            const loginBox =
                document.getElementById(
                    'adminLogin'
                );

            if (dashboard) {
                dashboard.style.display =
                    'none';
            }

            if (loginBox) {
                loginBox.style.display =
                    'block';
            }

        }
    );

}


// ==========================================
// ANALYTICS
// ==========================================

const analyticsPage =
    document.getElementById(
        'analyticsTotal'
    );

if (analyticsPage) {
    loadAnalytics();
}


// ==========================================
// LOAD ANALYTICS
// ==========================================

async function loadAnalytics() {

    try {

        const response =
            await fetch(
                '/api/analytics'
            );

        const data =
            await response.json();

        if (!data.success) {

            console.error(
                'Analytics failed'
            );

            return;
        }

        // ------------------------------------------
        // TOTAL
        // ------------------------------------------

        const analyticsTotal =
            document.getElementById(
                'analyticsTotal'
            );

        if (analyticsTotal) {

            analyticsTotal.textContent =
                data.total;
        }


        // ------------------------------------------
        // TOP OBSTRUCTION
        // ------------------------------------------

        if (
            data.obstruction &&
            data.obstruction.length > 0
        ) {

            const element =
                document.getElementById(
                    'analyticsTopObstruction'
                );

            if (element) {

                element.textContent =
                    data.obstruction[0].type;
            }

        }


        // ------------------------------------------
        // TOP LOCATION
        // ------------------------------------------

        if (
            data.location &&
            data.location.length > 0
        ) {

            const element =
                document.getElementById(
                    'analyticsTopLocation'
                );

            if (element) {

                element.textContent =
                    data.location[0].location;
            }

        }


        // ------------------------------------------
        // TOP SEVERITY
        // ------------------------------------------

        if (
            data.severity &&
            data.severity.length > 0
        ) {

            const element =
                document.getElementById(
                    'analyticsTopSeverity'
                );

            if (element) {

                element.textContent =
                    data.severity[0].severity;
            }

        }


        // ------------------------------------------
        // CHARTS
        // ------------------------------------------

        createBarChart(
            'obstructionChart',
            data.obstruction,
            'type'
        );

        createBarChart(
            'severityChart',
            data.severity,
            'severity'
        );

        createBarChart(
            'locationChart',
            data.location,
            'location'
        );

        createBarChart(
            'statusChart',
            data.status,
            'status'
        );


        // ------------------------------------------
        // RECOMMENDATION
        // ------------------------------------------

        createRecommendation(data);


        // ------------------------------------------
        // HOTSPOT ANALYSIS
        // ------------------------------------------

        createHotspotAnalysis(data);


        // ------------------------------------------
        // MAP REPORTS
        // ------------------------------------------

        fetch('/api/reports')
            .then(
                response =>
                    response.json()
            )
            .then(
                result => {

                    if (result.success) {

                        createObstructionMap(
                            result.reports
                        );

                    }

                }
            )
            .catch(
                error => {

                    console.error(
                        'Map reports error:',
                        error
                    );

                }
            );

    } catch (error) {

        console.error(
            'Analytics error:',
            error
        );

    }

}


// ==========================================
// CREATE BAR CHART
// ==========================================

function createBarChart(
    elementId,
    data,
    labelField
) {

    const container =
        document.getElementById(
            elementId
        );

    if (!container) {
        return;
    }

    container.innerHTML = '';

    if (
        !data ||
        data.length === 0
    ) {

        container.innerHTML =
            '<p>No data available yet.</p>';

        return;
    }

    const maxCount =
        Math.max(
            ...data.map(
                item =>
                    item.count
            )
        );

    data.forEach(
        item => {

            const percentage =
                maxCount > 0
                    ? (item.count / maxCount) * 100
                    : 0;

            const bar =
                document.createElement(
                    'div'
                );

            bar.className =
                'bar-item';

            bar.innerHTML = `

                <div class="bar-label">

                    <span>
                        ${item[labelField]}
                    </span>

                    <span>
                        ${item.count}
                    </span>

                </div>

                <div class="bar-background">

                    <div
                        class="bar-fill"
                        style="width: ${percentage}%"
                    >
                    </div>

                </div>

            `;

            container.appendChild(bar);

        }
    );

}


// ==========================================
// IMPROVEMENT RECOMMENDATION
// ==========================================

function createRecommendation(
    data
) {

    const element =
        document.getElementById(
            'recommendation'
        );

    if (!element) {
        return;
    }

    if (
        !data.obstruction ||
        !data.location ||
        data.obstruction.length === 0 ||
        data.location.length === 0
    ) {

        element.textContent =
            'More reports are required to identify meaningful operational patterns.';

        return;
    }

    const topObstruction =
        data.obstruction[0].type;

    const topObstructionCount =
        data.obstruction[0].count;

    const topLocation =
        data.location[0].location;

    const topLocationCount =
        data.location[0].count;

    element.textContent =

        `The analysis shows that "${topObstruction}" ` +

        `is the most frequently reported obstruction ` +

        `with ${topObstructionCount} report(s). ` +

        `"${topLocation}" is currently the most reported ` +

        `location with ${topLocationCount} report(s). ` +

        `Authorities can prioritize this location for ` +

        `inspection and corrective action.`;

}


// ==========================================
// HOTSPOT PRIORITY ANALYSIS
// ==========================================

function createHotspotAnalysis(
    data
) {

    const container =
        document.getElementById(
            'hotspotContainer'
        );

    if (!container) {
        return;
    }

    if (
        !data.location ||
        data.location.length === 0
    ) {

        container.innerHTML =
            '<p>No hotspot data available yet.</p>';

        return;
    }

    container.innerHTML = '';

    data.location.forEach(
        (locationData, index) => {

            const location =
                locationData.location;

            const reportCount =
                locationData.count;

            /*
             * Priority calculation
             *
             * 1 report   = Low
             * 2 reports  = Medium
             * 3+ reports = High
             */

            let priority =
                'Low';

            let priorityClass =
                'priority-low';

            if (
                reportCount >= 3
            ) {

                priority =
                    'High';

                priorityClass =
                    'priority-high';

            } else if (
                reportCount >= 2
            ) {

                priority =
                    'Medium';

                priorityClass =
                    'priority-medium';

            }

            const card =
                document.createElement(
                    'div'
                );

            card.className =
                'hotspot-card';

            card.innerHTML = `

                <h3>
                    📍 ${location}
                </h3>

                <div class="hotspot-details">

                    <div class="hotspot-detail">

                        <strong>
                            Reports
                        </strong>

                        ${reportCount}

                    </div>

                    <div class="hotspot-detail">

                        <strong>
                            Rank
                        </strong>

                        #${index + 1}

                    </div>

                    <div class="hotspot-detail">

                        <strong>
                            Priority
                        </strong>

                        <span
                            class="${priorityClass}"
                        >
                            ${priority}
                        </span>

                    </div>

                    <div class="hotspot-detail">

                        <strong>
                            Action
                        </strong>

                        Inspect & Monitor

                    </div>

                </div>

            `;

            container.appendChild(
                card
            );

        }
    );

}


// ==========================================
// FOOTPATH OBSTRUCTION MAP
// ==========================================

function createObstructionMap(
    reports
) {

    const mapElement =
        document.getElementById(
            'obstructionMap'
        );

    if (!mapElement) {
        return;
    }

    // Prevent duplicate map initialization
    if (
        mapElement._leaflet_id
    ) {
        return;
    }

    // Create map
    const map =
        L.map(
            'obstructionMap'
        ).setView(
            [19.0626729, 72.8417004],
            13
        );

    // OpenStreetMap tiles
    L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
            attribution:
                '&copy; OpenStreetMap contributors'
        }
    ).addTo(map);

    // Add report markers
    (reports || []).forEach(
        report => {

            // Skip reports without coordinates
            if (
                report.latitude === null ||
                report.longitude === null ||
                report.latitude === undefined ||
                report.longitude === undefined
            ) {
                return;
            }

            const latitude =
                Number(
                    report.latitude
                );

            const longitude =
                Number(
                    report.longitude
                );

            // Make sure coordinates are valid
            if (
                !Number.isFinite(latitude) ||
                !Number.isFinite(longitude)
            ) {
                return;
            }

            const marker =
                L.marker([
                    latitude,
                    longitude
                ]).addTo(map);

            marker.bindPopup(`

                <div style="min-width:200px;">

                    <h3>
                        📍 Footpath Obstruction
                    </h3>

                    <p>
                        <strong>
                            Location:
                        </strong>
                        ${report.location || 'Unknown'}
                    </p>

                    <p>
                        <strong>
                            Type:
                        </strong>
                        ${report.obstruction_type || 'Unknown'}
                    </p>

                    <p>
                        <strong>
                            Severity:
                        </strong>
                        ${report.severity || 'Unknown'}
                    </p>

                    <p>
                        <strong>
                            Status:
                        </strong>
                        ${report.status || 'Pending'}
                    </p>

                    <p>
                        <strong>
                            Reported By:
                        </strong>
                        ${report.name || 'Anonymous'}
                    </p>

                </div>

            `);

        }
    );

}
// ==========================================
// END OF MAIN REPORT / ADMIN / ANALYTICS
// ==========================================


// ==========================================
// OPTIONAL REAL GPS LOCATION
// ==========================================
// Manual area detection remains the primary method.
// This button works only if the user explicitly allows
// browser location permission.

const getLocationBtn =
    document.getElementById('getLocationBtn');

if (getLocationBtn) {

    getLocationBtn.addEventListener(
        'click',
        function () {

            const status =
                document.getElementById(
                    'locationStatus'
                );

            const latitudeInput =
                document.getElementById(
                    'latitude'
                );

            const longitudeInput =
                document.getElementById(
                    'longitude'
                );

            // Browser support check
            if (!navigator.geolocation) {

                if (status) {

                    status.textContent =
                        '❌ Geolocation is not supported by this browser.';

                    status.style.color =
                        '#ff6b6b';
                }

                return;
            }

            // Loading state
            if (status) {

                status.textContent =
                    '📍 Detecting your current location...';

                status.style.color =
                    '#19b5fe';
            }

            getLocationBtn.disabled =
                true;

            getLocationBtn.textContent =
                '⏳ Detecting Location...';

            navigator.geolocation.getCurrentPosition(

                function (position) {

                    const latitude =
                        position.coords.latitude;

                    const longitude =
                        position.coords.longitude;

                    // Store coordinates
                    if (latitudeInput) {

                        latitudeInput.value =
                            latitude;
                    }

                    if (longitudeInput) {

                        longitudeInput.value =
                            longitude;
                    }

                    // Display success
                    if (status) {

                        status.innerHTML = `
                            ✅ <strong>
                            Location captured successfully
                            </strong>
                            <br>
                            📍 Latitude:
                            ${latitude.toFixed(6)}
                            <br>
                            📍 Longitude:
                            ${longitude.toFixed(6)}
                        `;

                        status.style.color =
                            '#00e5a0';
                    }

                    getLocationBtn.disabled =
                        false;

                    getLocationBtn.textContent =
                        '📍 Location Captured';

                    // Reverse geocoding
                    getAddressFromCoordinates(
                        latitude,
                        longitude
                    );

                },

                function (error) {

                    console.error(
                        'Geolocation error:',
                        error
                    );

                    let errorMessage =
                        '⚠️ Unable to get your location.';

                    if (
                        error.code === 1
                    ) {

                        errorMessage =
                            '⚠️ Location permission denied. Please enter your area manually.';

                    } else if (
                        error.code === 2
                    ) {

                        errorMessage =
                            '⚠️ Your current location could not be determined.';

                    } else if (
                        error.code === 3
                    ) {

                        errorMessage =
                            '⚠️ Location request timed out. Please try again.';

                    }

                    if (status) {

                        status.textContent =
                            errorMessage;

                        status.style.color =
                            '#fbbf24';
                    }

                    getLocationBtn.disabled =
                        false;

                    getLocationBtn.textContent =
                        '📍 Try Again';

                },

                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0
                }

            );

        }
    );

}


// ==========================================
// REVERSE GEOCODING
// GPS COORDINATES → READABLE ADDRESS
// ==========================================

async function getAddressFromCoordinates(
    latitude,
    longitude
) {

    const locationInput =
        document.getElementById(
            'location'
        );

    if (!locationInput) {
        return;
    }

    try {

        const response =
            await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
                {
                    headers: {
                        'Accept':
                            'application/json'
                    }
                }
            );

        if (!response.ok) {
            return;
        }

        const data =
            await response.json();

        if (
            data &&
            data.display_name
        ) {

            locationInput.value =
                data.display_name;

            const status =
                document.getElementById(
                    'locationStatus'
                );

            if (status) {

                status.innerHTML = `
                    ✅ <strong>
                    Current location detected
                    </strong>
                    <br>
                    📍 ${escapeLocationText(
                        data.display_name
                    )}
                `;

                status.style.color =
                    '#00e5a0';
            }

        }

    } catch (error) {

        console.log(
            'Address lookup unavailable:',
            error
        );

        // GPS coordinates remain available
    }

}


// ==========================================
// SAFE LOCATION TEXT
// ==========================================

function escapeLocationText(
    text
) {

    const div =
        document.createElement(
            'div'
        );

    div.textContent =
        text;

    return div.innerHTML;

}


// ==========================================
// HOME PAGE QUICK STATS
// ==========================================

async function loadHomeStats() {

    try {

        const response =
            await fetch(
                '/api/home-stats'
            );

        const data =
            await response.json();

        if (!data.success) {
            return;
        }

        const total =
            document.getElementById(
                'totalReportsHome'
            );

        const resolved =
            document.getElementById(
                'resolvedReportsHome'
            );

        const areas =
            document.getElementById(
                'activeAreasHome'
            );

        const community =
            document.getElementById(
                'communityHome'
            );

        if (total) {

            total.textContent =
                data.total;
        }

        if (resolved) {

            resolved.textContent =
                data.resolved;
        }

        if (areas) {

            areas.textContent =
                data.areas;
        }

        if (community) {

            community.textContent =
                data.community + '%';
        }

    } catch (error) {

        console.error(
            'Home stats error:',
            error
        );

    }

}


// ==========================================
// LOAD QUICK STATS ON HOME PAGE
// ==========================================

if (
    document.getElementById(
        'totalReportsHome'
    )
) {

    loadHomeStats();

}


// ==========================================
// HOME PAGE LIVE STATISTICS
// ==========================================

async function loadHomeStatistics() {

    try {

        const response =
            await fetch(
                '/api/statistics'
            );

        const data =
            await response.json();

        if (!data.success) {

            console.error(
                'Statistics failed'
            );

            return;
        }

        // Total reports
        const total =
            document.getElementById(
                'totalReportsHome'
            );

        if (total) {

            total.textContent =
                data.totalReports;
        }

        // Resolved reports
        const resolved =
            document.getElementById(
                'resolvedReportsHome'
            );

        if (resolved) {

            resolved.textContent =
                data.resolved;
        }

        // Active areas
        const areas =
            document.getElementById(
                'activeAreasHome'
            );

        if (areas) {

            areas.textContent =
                data.activeAreas;
        }

    } catch (error) {

        console.error(
            'Home statistics error:',
            error
        );

    }

}


// ==========================================
// RUN HOME STATISTICS
// ==========================================

if (
    document.getElementById(
        'totalReportsHome'
    )
) {

    loadHomeStatistics();

}


// ==========================================
// MUMBAI AREA-WISE LOCATION DATABASE
// ==========================================

const areaCoordinates = {

    // ------------------------------------------
    // MIRA ROAD / BHAYANDAR
    // ------------------------------------------

    "mira road": {
        latitude: 19.284167,
        longitude: 72.871111
    },

    "mira road east": {
        latitude: 19.285637,
        longitude: 72.869109
    },

    "bhayandar": {
        latitude: 19.290000,
        longitude: 72.850000
    },

    "bhayander": {
        latitude: 19.290000,
        longitude: 72.850000
    },

    "uttan": {
        latitude: 19.280000,
        longitude: 72.785000
    },


    // ------------------------------------------
    // ANDHERI
    // ------------------------------------------

    "andheri": {
        latitude: 19.120232,
        longitude: 72.854502
    },

    "andheri east": {
        latitude: 19.113611,
        longitude: 72.871389
    },

    "andheri west": {
        latitude: 19.116949,
        longitude: 72.833519
    },

    "chakala": {
        latitude: 19.111388,
        longitude: 72.860833
    },

    "dn nagar": {
        latitude: 19.124085,
        longitude: 72.831373
    },

    "d n nagar": {
        latitude: 19.124085,
        longitude: 72.831373
    },

    "lokhandwala": {
        latitude: 19.130815,
        longitude: 72.829270
    },

    "marol": {
        latitude: 19.119219,
        longitude: 72.882743
    },

    "versova": {
        latitude: 19.120000,
        longitude: 72.820000
    },

    "juhu": {
        latitude: 19.100000,
        longitude: 72.830000
    },


    // ------------------------------------------
    // BANDRA / KHAR
    // ------------------------------------------

    "bandra": {
        latitude: 19.061590,
        longitude: 72.847999
    },

    "bandra east": {
        latitude: 19.061486,
        longitude: 72.848756
    },

    "bandra west": {
        latitude: 19.057574,
        longitude: 72.828419
    },

    "bandra kurla complex": {
        latitude: 19.067310,
        longitude: 72.865448
    },

    "bkc": {
        latitude: 19.067310,
        longitude: 72.865448
    },

    "khar": {
        latitude: 19.062742,
        longitude: 72.829396
    },


    // ------------------------------------------
    // SANTACRUZ / VILE PARLE
    // ------------------------------------------

    "santacruz": {
        latitude: 19.081667,
        longitude: 72.841389
    },

    "santa cruz": {
        latitude: 19.081667,
        longitude: 72.841389
    },

    "vile parle": {
        latitude: 19.100000,
        longitude: 72.833333
    },

    "vile parle east": {
        latitude: 19.100000,
        longitude: 72.833333
    },

    "vile parle west": {
        latitude: 19.100000,
        longitude: 72.833333
    },


    // ------------------------------------------
    // GOREGAON / MALAD
    // ------------------------------------------

    "goregaon": {
        latitude: 19.160914,
        longitude: 72.846979
    },

    "goregaon east": {
        latitude: 19.163167,
        longitude: 72.850995
    },

    "goregaon west": {
        latitude: 19.160914,
        longitude: 72.846979
    },

    "malad": {
        latitude: 19.175000,
        longitude: 72.842000
    },

    "malad east": {
        latitude: 19.175000,
        longitude: 72.864891
    },

    "malad west": {
        latitude: 19.175000,
        longitude: 72.842000
    },


    // ------------------------------------------
    // KANDIVALI / BORIVALI
    // ------------------------------------------

    "kandivali": {
        latitude: 19.210000,
        longitude: 72.842000
    },

    "kandivali west": {
        latitude: 19.211319,
        longitude: 72.842737
    },

    "kandivali east": {
        latitude: 19.210206,
        longitude: 72.872980
    },

    "borivali": {
        latitude: 19.234965,
        longitude: 72.859760
    },

    "borivali west": {
        latitude: 19.228501,
        longitude: 72.847595
    },

    "borivali east": {
        latitude: 19.226394,
        longitude: 72.862015
    },

    "dahisar": {
        latitude: 19.250069,
        longitude: 72.859347
    },

    "dahisar east": {
        latitude: 19.250069,
        longitude: 72.859347
    },

    "dahisar west": {
        latitude: 19.250069,
        longitude: 72.859347
    },


    // ------------------------------------------
    // POWAI / GHATKOPAR
    // ------------------------------------------

    "powai": {
        latitude: 19.118986,
        longitude: 72.911767
    },

    "ghatkopar": {
        latitude: 19.083858,
        longitude: 72.899694
    },

    "ghatkopar east": {
        latitude: 19.080000,
        longitude: 72.910000
    },

    "ghatkopar west": {
        latitude: 19.044729,
        longitude: 72.864769
    },

    "vikhroli": {
        latitude: 19.114921,
        longitude: 72.926710
    },

    "kanjurmarg": {
        latitude: 19.130000,
        longitude: 72.940000
    },

    "mulund": {
        latitude: 19.164857,
        longitude: 72.960820
    },

    "bhandup": {
        latitude: 19.150000,
        longitude: 72.933333
    },


    // ------------------------------------------
    // KURLA / CHEMBUR
    // ------------------------------------------

    "kurla": {
        latitude: 19.071285,
        longitude: 72.883043
    },

    "chembur": {
        latitude: 19.051000,
        longitude: 72.894000
    },

    "chembur east": {
        latitude: 19.045990,
        longitude: 72.893548
    },

    "chembur west": {
        latitude: 19.057275,
        longitude: 72.899166
    },

    "sion": {
        latitude: 19.040000,
        longitude: 72.860000
    },

    "dharavi": {
        latitude: 19.049810,
        longitude: 72.863797
    },


    // ------------------------------------------
    // DADAR / MAHIM
    // ------------------------------------------

    "dadar": {
        latitude: 19.016099,
        longitude: 72.842822
    },

    "dadar east": {
        latitude: 19.014811,
        longitude: 72.851983
    },

    "dadar west": {
        latitude: 19.023174,
        longitude: 72.837982
    },

    "mahim": {
        latitude: 19.035000,
        longitude: 72.840000
    },

    "prabhadevi": {
        latitude: 19.016600,
        longitude: 72.829500
    },

    "worli": {
        latitude: 19.000000,
        longitude: 72.815000
    },


    // ------------------------------------------
    // SOUTH MUMBAI
    // ------------------------------------------

    "lower parel": {
        latitude: 18.995278,
        longitude: 72.830000
    },

    "mumbai central": {
        latitude: 18.969700,
        longitude: 72.819400
    },

    "mahalaxmi": {
        latitude: 18.983333,
        longitude: 72.800000
    },

    "churchgate": {
        latitude: 18.930000,
        longitude: 72.820000
    },

    "marine lines": {
        latitude: 18.944700,
        longitude: 72.824400
    },

    "marine drive": {
        latitude: 18.944000,
        longitude: 72.823000
    },

    "colaba": {
        latitude: 18.914509,
        longitude: 72.824083
    },

    "fort": {
        latitude: 18.933568,
        longitude: 72.838668
    },

    "nariman point": {
        latitude: 18.926000,
        longitude: 72.823000
    },

    "malabar hill": {
        latitude: 18.950000,
        longitude: 72.795000
    }

};


// ==========================================
// SMART LOCATION DETECTION
// ==========================================

document.addEventListener(
    'DOMContentLoaded',
    function () {

        // ------------------------------------------
        // LOCATION INPUT
        // ------------------------------------------

        const locationInput =
            document.querySelector(
                '#location'
            ) ||
            document.querySelector(
                'input[name="location"]'
            );


        // ------------------------------------------
        // LATITUDE
        // ------------------------------------------

        const latitudeInput =
            document.querySelector(
                '#latitude'
            );


        // ------------------------------------------
        // LONGITUDE
        // ------------------------------------------

        const longitudeInput =
            document.querySelector(
                '#longitude'
            );


        // ------------------------------------------
        // STATUS
        // ------------------------------------------

        const locationStatus =
            document.querySelector(
                '#locationStatus'
            );


        // ------------------------------------------
        // CHECK LOCATION INPUT
        // ------------------------------------------

        if (!locationInput) {

            console.log(
                'ℹ️ Location input not found on this page.'
            );

            return;
        }

        console.log(
            '✅ Smart Location Detection Loaded'
        );


        // ==========================================
        // DETECT LOCATION WHILE TYPING
        // ==========================================

        locationInput.addEventListener(
            'input',
            function () {

                const enteredLocation =
                    this.value
                        .trim()
                        .toLowerCase();


                // --------------------------------------
                // EMPTY LOCATION
                // --------------------------------------

                if (
                    enteredLocation === ''
                ) {

                    if (latitudeInput) {
                        latitudeInput.value = '';
                    }

                    if (longitudeInput) {
                        longitudeInput.value = '';
                    }

                    if (locationStatus) {

                        locationStatus.innerHTML =
                            'Location not captured yet.';

                        locationStatus.style.color =
                            '#94a3b8';
                    }

                    return;
                }


                // --------------------------------------
                // FIND AREA
                // --------------------------------------

                let matchedArea =
                    null;

                let matchedName =
                    '';


                // First try exact / included match
                for (
                    const area in areaCoordinates
                ) {

                    if (
                        enteredLocation === area ||
                        enteredLocation.includes(area)
                    ) {

                        matchedArea =
                            areaCoordinates[area];

                        matchedName =
                            area;

                        break;
                    }

                }


                // ======================================
                // LOCATION FOUND
                // ======================================

                if (matchedArea) {

                    if (latitudeInput) {

                        latitudeInput.value =
                            matchedArea.latitude;
                    }

                    if (longitudeInput) {

                        longitudeInput.value =
                            matchedArea.longitude;
                    }


                    if (locationStatus) {

                        locationStatus.innerHTML = `

                            ✅ <strong>
                            Location Detected
                            </strong>

                            <br>

                            📍 Area:
                            ${matchedName}

                            <br>

                            🌐 Latitude:
                            ${matchedArea.latitude}

                            <br>

                            🌐 Longitude:
                            ${matchedArea.longitude}

                        `;

                        locationStatus.style.color =
                            '#00e5a0';
                    }


                    console.log(
                        'Location:',
                        matchedName,
                        matchedArea.latitude,
                        matchedArea.longitude
                    );

                }


                // ======================================
                // LOCATION NOT FOUND
                // ======================================

                else {

                    if (latitudeInput) {
                        latitudeInput.value = '';
                    }

                    if (longitudeInput) {
                        longitudeInput.value = '';
                    }


                    if (locationStatus) {

                        locationStatus.innerHTML = `

                            ⚠️ <strong>
                            Area not found.
                            </strong>

                            <br>

                            Try:
                            Mira Road, Bhayandar,
                            Andheri, Borivali

                        `;

                        locationStatus.style.color =
                            '#f59e0b';
                    }

                }

            }
        );

    }
);
// ==========================================
// ADDITIONAL LOCATION UTILITIES
// ==========================================

// Update visible coordinate fields whenever
// latitude / longitude values are available.

function updateCoordinateDisplay() {

    const latitudeInput =
        document.getElementById('latitude');

    const longitudeInput =
        document.getElementById('longitude');

    const displayLatitude =
        document.getElementById(
            'displayLatitude'
        );

    const displayLongitude =
        document.getElementById(
            'displayLongitude'
        );

    if (
        latitudeInput &&
        displayLatitude
    ) {

        displayLatitude.textContent =
            latitudeInput.value
                ? Number(
                    latitudeInput.value
                  ).toFixed(6)
                : 'Not selected';

    }

    if (
        longitudeInput &&
        displayLongitude
    ) {

        displayLongitude.textContent =
            longitudeInput.value
                ? Number(
                    longitudeInput.value
                  ).toFixed(6)
                : 'Not selected';

    }

}


// ==========================================
// UPDATE COORDINATE DISPLAY ON LOCATION CHANGE
// ==========================================

document.addEventListener(
    'DOMContentLoaded',
    function () {

        const latitudeInput =
            document.getElementById(
                'latitude'
            );

        const longitudeInput =
            document.getElementById(
                'longitude'
            );

        if (latitudeInput) {

            latitudeInput.addEventListener(
                'input',
                updateCoordinateDisplay
            );

            latitudeInput.addEventListener(
                'change',
                updateCoordinateDisplay
            );

        }

        if (longitudeInput) {

            longitudeInput.addEventListener(
                'input',
                updateCoordinateDisplay
            );

            longitudeInput.addEventListener(
                'change',
                updateCoordinateDisplay
            );

        }

        updateCoordinateDisplay();

    }
);


// ==========================================
// REPORT MAP HELPER
// ==========================================

function updateReportMapLocation(
    latitude,
    longitude,
    locationName
) {

    // This function is used only when a map
    // exists on the current page.

    const mapElement =
        document.getElementById(
            'reportMap'
        );

    if (!mapElement) {
        return;
    }

    // Leaflet must be loaded first
    if (
        typeof L === 'undefined'
    ) {

        console.warn(
            'Leaflet is not loaded.'
        );

        return;
    }

    try {

        // Reuse existing map if available
        if (
            window.reportLocationMap
        ) {

            window.reportLocationMap.setView(
                [
                    latitude,
                    longitude
                ],
                15
            );

            if (
                window.reportLocationMarker
            ) {

                window.reportLocationMarker
                    .setLatLng([
                        latitude,
                        longitude
                    ]);

            } else {

                window.reportLocationMarker =
                    L.marker([
                        latitude,
                        longitude
                    ]).addTo(
                        window.reportLocationMap
                    );

            }

            window.reportLocationMarker
                .bindPopup(
                    `📍 ${locationName || 'Selected Location'}`
                )
                .openPopup();

            return;
        }


        // Create map for first time
        window.reportLocationMap =
            L.map(
                'reportMap'
            ).setView(
                [
                    latitude,
                    longitude
                ],
                15
            );


        // OpenStreetMap
        L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
                attribution:
                    '&copy; OpenStreetMap contributors'
            }
        ).addTo(
            window.reportLocationMap
        );


        // Marker
        window.reportLocationMarker =
            L.marker([
                latitude,
                longitude
            ]).addTo(
                window.reportLocationMap
            );


        window.reportLocationMarker
            .bindPopup(
                `📍 ${locationName || 'Selected Location'}`
            )
            .openPopup();

    } catch (error) {

        console.error(
            'Report map error:',
            error
        );

    }

}


// ==========================================
// CONNECT AREA DETECTION WITH MAP
// ==========================================

document.addEventListener(
    'DOMContentLoaded',
    function () {

        const locationInput =
            document.getElementById(
                'location'
            );

        if (!locationInput) {
            return;
        }

        locationInput.addEventListener(
            'input',
            function () {

                const value =
                    this.value
                        .trim()
                        .toLowerCase();

                if (!value) {
                    return;
                }

                let matchedArea =
                    null;

                let matchedName =
                    '';

                for (
                    const area in areaCoordinates
                ) {

                    if (
                        value === area ||
                        value.includes(area)
                    ) {

                        matchedArea =
                            areaCoordinates[
                                area
                            ];

                        matchedName =
                            area;

                        break;
                    }

                }

                if (
                    matchedArea
                ) {

                    updateReportMapLocation(
                        matchedArea.latitude,
                        matchedArea.longitude,
                        matchedName
                    );

                    updateCoordinateDisplay();

                }

            }
        );

    }
);


// ==========================================
// RESET REPORT MAP
// ==========================================

function resetReportMap() {

    if (
        window.reportLocationMap
    ) {

        try {

            window.reportLocationMap.remove();

        } catch (error) {

            console.error(
                'Unable to reset report map:',
                error
            );

        }

    }

    window.reportLocationMap =
        null;

    window.reportLocationMarker =
        null;

}


// ==========================================
// RESET LOCATION UI
// ==========================================

function resetLocationFields() {

    const latitudeInput =
        document.getElementById(
            'latitude'
        );

    const longitudeInput =
        document.getElementById(
            'longitude'
        );

    const locationStatus =
        document.getElementById(
            'locationStatus'
        );

    const displayLatitude =
        document.getElementById(
            'displayLatitude'
        );

    const displayLongitude =
        document.getElementById(
            'displayLongitude'
        );

    if (latitudeInput) {
        latitudeInput.value = '';
    }

    if (longitudeInput) {
        longitudeInput.value = '';
    }

    if (locationStatus) {

        locationStatus.textContent =
            'Location not captured yet.';

        locationStatus.style.color =
            '#94a3b8';
    }

    if (displayLatitude) {

        displayLatitude.textContent =
            'Not selected';
    }

    if (displayLongitude) {

        displayLongitude.textContent =
            'Not selected';
    }

    resetReportMap();

}


// ==========================================
// AUTO UPDATE COORDINATES
// ==========================================

setInterval(
    function () {

        const latitudeInput =
            document.getElementById(
                'latitude'
            );

        const longitudeInput =
            document.getElementById(
                'longitude'
            );

        if (
            latitudeInput &&
            longitudeInput
        ) {

            updateCoordinateDisplay();

        }

    },
    1000
);