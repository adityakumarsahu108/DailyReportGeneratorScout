/*
==========================================
Daily Report Generator
dataBuilder.js
Version 1.0

Purpose:
- Convert Cyera and Purview CSV records
  into a structured data object.
- Preserve useful alert-level information.
- Generate summaries for future analytics.
- NO API calls are made here.
==========================================
*/


/*
==========================================
Helpers
==========================================
*/

function cleanValue(value) {
    if (value === null || value === undefined) {
        return null;
    }

    const cleaned = String(value).trim();

    if (
        cleaned === "" ||
        cleaned.toLowerCase() === "nan" ||
        cleaned.toLowerCase() === "null"
    ) {
        return null;
    }

    return cleaned;
}


function cleanArrayValue(value) {

    const cleaned = cleanValue(value);

    if (!cleaned) {
        return [];
    }

    return cleaned
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);
}


function countBy(records, field) {

    const counts = {};

    records.forEach(record => {

        const value =
            cleanValue(record[field]) || "Unknown";

        counts[value] =
            (counts[value] || 0) + 1;

    });

    return counts;
}


function countNormalized(records, getter) {

    const counts = {};

    records.forEach(record => {

        const value =
            cleanValue(getter(record)) || "Unknown";

        counts[value] =
            (counts[value] || 0) + 1;

    });

    return counts;
}


/*
==========================================
Cyera Normalization
==========================================
*/

function normalizeCyeraAlert(record) {

    return {

        source: "cyera",

        /*
        Core identity
        */
        id:
            cleanValue(record["ID"]),

        name:
            cleanValue(record["Name"]),

        timestamp:
            cleanValue(record["Timestamp"]),

        updatedAt:
            cleanValue(record["Updated At"]),

        /*
        Severity / Status
        */
        severity:
            cleanValue(record["Severity"]),

        originalSeverity:
            cleanValue(record["Original Analysis Severity"]),

        externalSeverity:
            cleanValue(record["External Severity"]),

        status:
            cleanValue(record["Status"]),

        statusUpdatedAt:
            cleanValue(record["Status Updated At"]),

        /*
        IMPORTANT:
        This is the person the alert is assigned to.
        */
        assignedUserEmail:
            cleanValue(record["Assigned User Email"]),

        assignedUserId:
            cleanValue(record["Assigned User ID"]),

        /*
        Person/activity that triggered the alert.
        Kept separate from assignedUserEmail.
        */
        triggeringUser:
            cleanValue(record["Triggering User"]),

        authenticatedUser:
            cleanValue(record["Authenticated User"]),

        /*
        Policy information
        */
        policy: {

            id:
                cleanValue(record["Policy ID"]),

            name:
                cleanValue(record["Policy Name"]),

            type:
                cleanValue(record["Policy Type"]),

            action:
                cleanValue(record["Policy Action"])
        },

        /*
        Detection rules
        */
        ruleNames:
            cleanArrayValue(record["Rule Names"]),

        /*
        Activity
        */
        channel:
            cleanValue(record["Channel"]),

        sourceActivity:
            cleanValue(record["Source Activity"]),

        actualAction:
            cleanValue(record["Actual Action"]),

        configuredAction:
            cleanValue(record["Configured Action"]),

        /*
        Data involved
        */
        dataType:
            cleanValue(record["Data Type"]),

        dataCategories:
            cleanArrayValue(record["Data Categories"]),

        /*
        Destination information.

        We intentionally do NOT copy:
        - email body
        - attachments
        - file contents
        - full URLs
        - detailed incident descriptions
        */
        destination: {

            name:
                cleanValue(record["Destination Name"]),

            domains:
                cleanArrayValue(record["Destination Domains"]),

            isPublic:
                cleanValue(record["Destinations Info Is Public"]),

            role:
                cleanValue(record["Destinations Info Roles Info Role"])
        },

        /*
        User context.

        Keep only fields that can support
        operational analytics.
        */
        user: {

            email:
                cleanValue(record["Identity Info Mail"]),

            displayName:
                cleanValue(record["Identity Info Display Name"]),

            department:
                cleanValue(record["Identity Info Department"]),

            jobTitle:
                cleanValue(record["Identity Info Job Title"]),

            officeLocation:
                cleanValue(record["Identity Info Office Location"])
        }

    };
}


/*
==========================================
Purview Normalization
==========================================
*/

function normalizePurviewAlert(record) {

    return {

        source: "purview",

        alertName:
            cleanValue(record["Alert name"]),

        severity:
            cleanValue(record["Severity"]),

        status:
            cleanValue(record["Status"]),

        timeDetected:
            cleanValue(record["Time detected"]),

        user:
            cleanValue(record["Users"]),

        location:
            cleanValue(record["Location"])

    };
}


/*
==========================================
Cyera Summary
==========================================
*/

function buildCyeraSummary(records) {

    return {

        total:
            records.length,

        bySeverity:
            countNormalized(
                records,
                record => record.severity
            ),

        byStatus:
            countNormalized(
                records,
                record => record.status
            ),

        byAssignedUser:
            countNormalized(
                records,
                record => record.assignedUserEmail
            ),

        byPolicy:
            countNormalized(
                records,
                record => record.policy?.name
            ),

        byChannel:
            countNormalized(
                records,
                record => record.channel
            ),

        byDataType:
            countNormalized(
                records,
                record => record.dataType
            )

    };
}


/*
==========================================
Purview Summary
==========================================
*/

function buildPurviewSummary(records) {

    return {

        total:
            records.length,

        bySeverity:
            countNormalized(
                records,
                record => record.severity
            ),

        byStatus:
            countNormalized(
                records,
                record => record.status
            ),

        byUser:
            countNormalized(
                records,
                record => record.user
            ),

        byLocation:
            countNormalized(
                records,
                record => record.location
            ),

        byAlertName:
            countNormalized(
                records,
                record => record.alertName
            )

    };
}


/*
==========================================
Combined Summary
==========================================
*/

function buildCombinedSummary(
    cyeraRecords,
    purviewRecords
) {

    const allRecords = [
        ...cyeraRecords,
        ...purviewRecords
    ];

    return {

        totalAlerts:
            allRecords.length,

        cyeraAlerts:
            cyeraRecords.length,

        purviewAlerts:
            purviewRecords.length,

        bySource: {

            cyera:
                cyeraRecords.length,

            purview:
                purviewRecords.length

        },

        bySeverity:
            countNormalized(
                allRecords,
                record => record.severity
            ),

        byStatus:
            countNormalized(
                allRecords,
                record => record.status
            )

    };
}


/*
==========================================
Build Daily Report Data
==========================================
*/

function buildDailyReportData(
    cyeraData,
    purviewData
) {

    const reportingWindow =
        generateReportingWindow();

    const cyeraRecords =
        cyeraData.map(normalizeCyeraAlert);

    const purviewRecords =
        purviewData.map(normalizePurviewAlert);

    /*
    Report ID is based on the reporting
    period rather than the time the user
    happened to click Generate.
    */

    const reportDate =
        formatReportDateForId(
            reportingWindow.to
        );

    return {

        schemaVersion: "1.0",

        report: {

            reportId:
                `REP-${reportDate}`,

            reportDate,

            reportingWindow: {

                from:
                    reportingWindow.from,

                to:
                    reportingWindow.to

            },

            generatedAt:
                new Date().toISOString(),

            generatorVersion:
                "2.0"

        },

        cyera: {

            recordCount:
                cyeraRecords.length,

            records:
                cyeraRecords,

            summary:
                buildCyeraSummary(
                    cyeraRecords
                )

        },

        purview: {

            recordCount:
                purviewRecords.length,

            records:
                purviewRecords,

            summary:
                buildPurviewSummary(
                    purviewRecords
                )

        },

        summary:
            buildCombinedSummary(
                cyeraRecords,
                purviewRecords
            )

    };
}


/*
==========================================
Report Date Helper
==========================================

Uses the existing reporting window and
converts the end date into YYYYMMDD.

Example:

2026-08-20
     ↓
20260820
==========================================
*/

/*
==========================================
Report Date Helper
==========================================

Converts the reporting-window end date
into YYYYMMDD.

Example:

20th August 2026, 02:00 AM IST
        ↓
20260820
==========================================
*/

function formatReportDateForId(dateString) {

    if (!dateString) {

        const now = new Date();

        return [
            now.getFullYear(),
            String(
                now.getMonth() + 1
            ).padStart(2, "0"),
            String(
                now.getDate()
            ).padStart(2, "0")
        ].join("");

    }


    const value =
        String(dateString);


    /*
    ==========================================
    Match formats such as:

    20th August 2026
    20 August 2026
    ==========================================
    */

    const match =
        value.match(
            /(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})/
        );


    if (match) {

        const day =
            String(
                parseInt(match[1], 10)
            ).padStart(2, "0");


        const monthNames = {

            january: "01",
            february: "02",
            march: "03",
            april: "04",
            may: "05",
            june: "06",
            july: "07",
            august: "08",
            september: "09",
            october: "10",
            november: "11",
            december: "12"

        };


        const month =
            monthNames[
                match[2].toLowerCase()
            ];


        const year =
            match[3];


        if (month) {

            return `${year}${month}${day}`;

        }

    }


    /*
    ==========================================
    Fallback for YYYY-MM-DD
    ==========================================
    */

    const isoMatch =
        value.match(
            /(\d{4})-(\d{2})-(\d{2})/
        );


    if (isoMatch) {

        return (
            `${isoMatch[1]}` +
            `${isoMatch[2]}` +
            `${isoMatch[3]}`
        );

    }


    /*
    ==========================================
    Do NOT silently create a wrong date
    ==========================================
    */

    throw new Error(
        `Unable to determine report date from: ${dateString}`
    );
}

export {
    buildDailyReportData
};