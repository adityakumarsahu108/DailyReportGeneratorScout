/*
==========================================
Daily Report Generator
dataBuilder.js
Version 0.3
==========================================

Purpose:
- Convert Cyera and Purview CSV records into a
  normalized structured data object.
- Support both OLD and NEW Cyera CSV formats.
- Keep optional fields flexible so future Cyera
  format changes do not immediately break the app.
- Preserve useful alert-level information.
- Generate summaries for analytics.

IMPORTANT:
- "Assigned User Email" and "Assignee" are treated
  as DIFFERENT fields.
- Assignee may contain a system/workspace name
  rather than an email address.
==========================================
*/


/*
==========================================
Basic Cleaning Helpers
==========================================
*/

function cleanValue(value) {
    if (value === undefined || value === null) {
        return null;
    }

    const cleaned = String(value).trim();

    if (
        cleaned === "" ||
        cleaned.toLowerCase() === "nan" ||
        cleaned.toLowerCase() === "null" ||
        cleaned.toLowerCase() === "undefined"
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


/*
==========================================
Field Resolver
==========================================

Allows the application to support multiple
CSV schemas.

Example:

getField(record, [
    "ID",
    "Alert ID"
]);

This means either the old "ID" field OR
the new "Alert ID" field can be used.
==========================================
*/

function getField(record, aliases) {

    if (!record || !aliases) {
        return null;
    }

    for (const alias of aliases) {

        if (
            Object.prototype.hasOwnProperty.call(record, alias)
        ) {

            const value = cleanValue(record[alias]);

            if (value !== null) {
                return value;
            }
        }
    }

    return null;
}


/*
==========================================
Case-Insensitive Field Resolver

Useful for future Cyera exports where
capitalization may change.

Example:

"Alert ID"
"alert id"
"ALERT ID"

will all be treated as the same field.
==========================================
*/

function getFieldInsensitive(record, aliases) {

    if (!record || !aliases) {
        return null;
    }

    const keys = Object.keys(record);

    for (const alias of aliases) {

        const normalizedAlias = alias
            .trim()
            .toLowerCase();

        const matchingKey = keys.find(key =>
            key.trim().toLowerCase() === normalizedAlias
        );

        if (matchingKey) {

            const value = cleanValue(record[matchingKey]);

            if (value !== null) {
                return value;
            }
        }
    }

    return null;
}


/*
==========================================
Combined Resolver

First checks exact names.

Then performs case-insensitive lookup.
==========================================
*/

function resolveField(record, aliases) {

    const exact = getField(record, aliases);

    if (exact !== null) {
        return exact;
    }

    return getFieldInsensitive(record, aliases);
}


/*
==========================================
Array Resolver
==========================================
*/

function resolveArrayField(record, aliases) {

    const value = resolveField(record, aliases);

    if (!value) {
        return [];
    }

    return value
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);
}


/*
==========================================
Count Helpers
==========================================
*/

function countBy(records, key) {

    const counts = {};

    records.forEach(record => {

        const value = cleanValue(record[key]);

        if (!value) {
            return;
        }

        counts[value] = (counts[value] || 0) + 1;
    });

    return counts;
}


function countNormalized(records, key) {

    const counts = {};

    records.forEach(record => {

        const raw = cleanValue(record[key]);

        if (!raw) {
            return;
        }

        const value = raw.toLowerCase();

        counts[value] = (counts[value] || 0) + 1;
    });

    return counts;
}


/*
==========================================
CYERA NORMALIZER
==========================================

Supports:

OLD FORMAT
-----------
ID
Name
Timestamp
Updated At
Original Analysis Severity
External Severity
Status
Status Updated At
Assigned User Email
Assigned User ID
Triggering User
Policy ID
Policy Name
Policy Type
Policy Action
Rule Names
Channel
Source Activity
Actual Action
Configured Action
Data Type
Data Categories
Destination Name
Destination Domains
...

NEW FORMAT
-----------
Alert ID
Alert Name
Time
Severity
Status
What Happened
Alert Action
Actor Name
Actor Email
Actor Job Title
Actor Reports To
Destination Names
Destination Recipients
Alert Type
Agent Data Summary
Topics
Channel
Policy Name
Assignee
Provider
==========================================
*/

function normalizeCyeraAlert(record) {

    /*
    ------------------------------------------
    Core Alert Information
    ------------------------------------------
    */

    const id = resolveField(record, [
        "ID",
        "Alert ID"
    ]);

    const name = resolveField(record, [
        "Name",
        "Alert Name"
    ]);

    const timestamp = resolveField(record, [
        "Timestamp",
        "Time"
    ]);

    const updatedAt = resolveField(record, [
        "Updated At",
        "Updated",
        "Last Updated"
    ]);


    /*
    ------------------------------------------
    Severity
    ------------------------------------------
    */

    const severity = resolveField(record, [
        "Severity",
        "Original Analysis Severity",
        "Original Severity"
    ]);

    const originalSeverity = resolveField(record, [
        "Original Analysis Severity",
        "Original Severity"
    ]);

    const externalSeverity = resolveField(record, [
        "External Severity",
        "External Severity Level"
    ]);


    /*
    ------------------------------------------
    Status
    ------------------------------------------
    */

    const status = resolveField(record, [
        "Status"
    ]);

    const statusUpdatedAt = resolveField(record, [
        "Status Updated At",
        "Status Updated",
        "Status Change Time"
    ]);


    /*
    ------------------------------------------
    Assignment
    ------------------------------------------

    IMPORTANT:

    Old format:
        Assigned User Email

    New format:
        Assignee

    These are NOT assumed to be the same thing.
    ------------------------------------------
    */

    const assignedUserEmail = resolveField(record, [
        "Assigned User Email"
    ]);

    const assignedUserId = resolveField(record, [
        "Assigned User ID"
    ]);

    const assignee = resolveField(record, [
        "Assignee"
    ]);


    /*
    ------------------------------------------
    Actor / User Information
    ------------------------------------------
    */

    const triggeringUser = resolveField(record, [
        "Triggering User",
        "Actor Name"
    ]);

    const actorEmail = resolveField(record, [
        "Actor Email"
    ]);

    const authenticatedUser = resolveField(record, [
        "Authenticated User"
    ]);


    /*
    ------------------------------------------
    Actor Details - NEW FORMAT
    ------------------------------------------
    */

    const actorJobTitle = resolveField(record, [
        "Actor Job Title"
    ]);

    const actorReportsTo = resolveField(record, [
        "Actor Reports To"
    ]);


    /*
    ------------------------------------------
    Policy
    ------------------------------------------
    */

    const policyId = resolveField(record, [
        "Policy ID"
    ]);

    const policyName = resolveField(record, [
        "Policy Name"
    ]);

    const policyType = resolveField(record, [
        "Policy Type"
    ]);

    const policyAction = resolveField(record, [
        "Policy Action",
        "Alert Action"
    ]);


    /*
    ------------------------------------------
    Rules
    ------------------------------------------
    */

    const ruleNames = resolveArrayField(record, [
        "Rule Names"
    ]);


    /*
    ------------------------------------------
    Channel / Activity
    ------------------------------------------
    */

    const channel = resolveField(record, [
        "Channel"
    ]);

    const sourceActivity = resolveField(record, [
        "Source Activity"
    ]);

    const actualAction = resolveField(record, [
        "Actual Action",
        "Alert Action"
    ]);

    const configuredAction = resolveField(record, [
        "Configured Action"
    ]);


    /*
    ------------------------------------------
    Data Information
    ------------------------------------------
    */

    const dataType = resolveField(record, [
        "Data Type"
    ]);

    const dataCategories = resolveArrayField(record, [
        "Data Categories",
        "Topics"
    ]);


    /*
    ------------------------------------------
    Destination
    ------------------------------------------

    Old:
        Destination Name
        Destination Domains
        Destinations Info Is Public
        Destinations Info Roles Info Role

    New:
        Destination Names
        Destination Recipients
    ------------------------------------------
    */

    const destinationName = resolveField(record, [
        "Destination Name",
        "Destination Names"
    ]);

    const destinationRecipients = resolveField(record, [
        "Destination Recipients"
    ]);

    const destinationDomains = resolveArrayField(record, [
        "Destination Domains"
    ]);

    const destinationIsPublic = resolveField(record, [
        "Destinations Info Is Public"
    ]);

    const destinationRole = resolveField(record, [
        "Destinations Info Roles Info Role"
    ]);


    /*
    ------------------------------------------
    Identity Information
    ------------------------------------------
    */

    const identityEmail = resolveField(record, [
        "Identity Info Mail"
    ]);

    const identityDisplayName = resolveField(record, [
        "Identity Info Display Name"
    ]);

    const identityDepartment = resolveField(record, [
        "Identity Info Department"
    ]);

    const identityJobTitle = resolveField(record, [
        "Identity Info Job Title"
    ]);

    const identityOfficeLocation = resolveField(record, [
        "Identity Info Office Location"
    ]);


    /*
    ------------------------------------------
    New Cyera Descriptive Fields
    ------------------------------------------
    */

    const whatHappened = resolveField(record, [
        "What Happened"
    ]);

    const agentDataSummary = resolveField(record, [
        "Agent Data Summary"
    ]);

    const alertType = resolveField(record, [
        "Alert Type"
    ]);

    const provider = resolveField(record, [
        "Provider"
    ]);


    /*
    ------------------------------------------
    Return Normalized Object
    ------------------------------------------
    */

    return {

        /*
        Core
        */
        id,
        name,
        timestamp,
        updatedAt,

        /*
        Severity
        */
        severity,
        originalSeverity,
        externalSeverity,

        /*
        Status
        */
        status,
        statusUpdatedAt,

        /*
        Assignment
        */
        assignedUserEmail,
        assignedUserId,
        assignee,

        /*
        Actor
        */
        triggeringUser,
        actorEmail,
        authenticatedUser,
        actorJobTitle,
        actorReportsTo,

        /*
        Policy
        */
        policy: {
            id: policyId,
            name: policyName,
            type: policyType,
            action: policyAction
        },

        /*
        Rules
        */
        ruleNames,

        /*
        Activity
        */
        channel,
        sourceActivity,
        actualAction,
        configuredAction,

        /*
        Data
        */
        dataType,
        dataCategories,

        /*
        Destination
        */
        destination: {
            name: destinationName,
            recipients: destinationRecipients,
            domains: destinationDomains,
            isPublic: destinationIsPublic,
            role: destinationRole
        },

        /*
        Identity
        */
        user: {
            email: identityEmail,
            displayName: identityDisplayName,
            department: identityDepartment,
            jobTitle: identityJobTitle,
            officeLocation: identityOfficeLocation
        },

        /*
        New format fields
        */
        whatHappened,
        agentDataSummary,
        alertType,
        provider
    };
}


/*
==========================================
PURVIEW NORMALIZER
==========================================
*/

function normalizePurviewAlert(record) {

    return {

        alertName: resolveField(record, [
            "Alert name",
            "Alert Name",
            "Name"
        ]),

        severity: resolveField(record, [
            "Severity"
        ]),

        status: resolveField(record, [
            "Status"
        ]),

        timeDetected: resolveField(record, [
            "Time detected",
            "Time Detected",
            "Timestamp"
        ]),

        users: resolveField(record, [
            "Users",
            "User"
        ]),

        location: resolveField(record, [
            "Location"
        ])
    };
}


/*
==========================================
CYERA SUMMARY
==========================================
*/

function summarizeCyeraAlerts(records) {

    const normalizedRecords = records.map(normalizeCyeraAlert);


    /*
    ------------------------------------------
    Assigned User

    Prefer email when available.

    If new format has no email, fall back
    to Assignee.
    ------------------------------------------
    */

    const assignedUserRecords = normalizedRecords.map(record => {

        return {
            assignedUser:
                record.assignedUserEmail ||
                record.assignee ||
                "Unassigned"
        };

    });


    /*
    ------------------------------------------
    Policy
    ------------------------------------------
    */

    const policyRecords = normalizedRecords.map(record => {

        return {
            policy:
                record.policy.name ||
                "Unknown"
        };

    });


    /*
    ------------------------------------------
    Channel
    ------------------------------------------
    */

    const channelRecords = normalizedRecords.map(record => {

        return {
            channel:
                record.channel ||
                "Unknown"
        };

    });


    /*
    ------------------------------------------
    Data Type
    ------------------------------------------
    */

    const dataTypeRecords = normalizedRecords.map(record => {

        return {
            dataType:
                record.dataType ||
                "Unknown"
        };

    });


    /*
    ------------------------------------------
    Severity / Status
    ------------------------------------------
    */

    const severityRecords = normalizedRecords.map(record => {

        return {
            severity:
                record.severity ||
                "Unknown"
        };

    });


    const statusRecords = normalizedRecords.map(record => {

        return {
            status:
                record.status ||
                "Unknown"
        };

    });


    /*
    ------------------------------------------
    Return Summary
    ------------------------------------------
    */

    return {

        total: normalizedRecords.length,

        bySeverity: countBy(
            severityRecords,
            "severity"
        ),

        byStatus: countNormalized(
            statusRecords,
            "status"
        ),

        byAssignedUser: countBy(
            assignedUserRecords,
            "assignedUser"
        ),

        byPolicy: countBy(
            policyRecords,
            "policy"
        ),

        byChannel: countBy(
            channelRecords,
            "channel"
        ),

        byDataType: countBy(
            dataTypeRecords,
            "dataType"
        )
    };
}


/*
==========================================
PURVIEW SUMMARY
==========================================
*/

function summarizePurviewAlerts(records) {

    const normalizedRecords = records.map(
        normalizePurviewAlert
    );


    return {

        total: normalizedRecords.length,

        bySeverity: countBy(
            normalizedRecords.map(record => ({
                severity:
                    record.severity || "Unknown"
            })),
            "severity"
        ),

        byStatus: countNormalized(
            normalizedRecords.map(record => ({
                status:
                    record.status || "Unknown"
            })),
            "status"
        )
    };
}


/*
==========================================
COMBINED SUMMARY
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

        totalAlerts: allRecords.length,

        cyeraAlerts: cyeraRecords.length,

        purviewAlerts: purviewRecords.length,

        bySource: {
            Cyera: cyeraRecords.length,
            Purview: purviewRecords.length
        },

        bySeverity: countBy(
            allRecords.map(record => ({
                severity:
                    record.severity || "Unknown"
            })),
            "severity"
        ),

        byStatus: countNormalized(
            allRecords.map(record => ({
                status:
                    record.status || "Unknown"
            })),
            "status"
        )
    };
}


/*
==========================================
BUILD DAILY REPORT DATA
==========================================
*/

function buildDailyReportData(
    cyeraData,
    purviewData
) {

    /*
    ------------------------------------------
    Normalize source data
    ------------------------------------------
    */

    const cyeraRecords = (cyeraData || [])
        .map(normalizeCyeraAlert);

    const purviewRecords = (purviewData || [])
        .map(normalizePurviewAlert);


    /*
    ==========================================
    Reporting metadata
    ==========================================
    */

    const today = getToday();

    const todayDate =
        today instanceof Date
            ? today
            : new Date(today);

    const reportDate =
        formatDisplayDate(todayDate);

    const reportId =
        "REP-" +
        todayDate
            .toISOString()
            .slice(0, 10)
            .replace(/-/g, "");

    const generatedAt =
        new Date().toISOString();


    /*
    ==========================================
    Reporting window
    ==========================================
    */

    const reportingWindow =
        generateReportingWindow();


    /*
    ------------------------------------------
    Build final report object
    ------------------------------------------
    */

    return {

        schemaVersion: "1.0",

        report: {

            reportId,

            reportDate,

            reportingWindow,

            generatedAt,

            generatorVersion: "2.0"
        },


        /*
        ------------------------------------------
        Cyera
        ------------------------------------------
        */

        cyera: {

            recordCount:
                cyeraRecords.length,

            records:
                cyeraRecords,

            summary:
                summarizeCyeraAlerts(
                    cyeraData || []
                )
        },


        /*
        ------------------------------------------
        Purview
        ------------------------------------------
        */

        purview: {

            recordCount:
                purviewRecords.length,

            records:
                purviewRecords,

            summary:
                summarizePurviewAlerts(
                    purviewData || []
                )
        },


        /*
        ------------------------------------------
        Combined
        ------------------------------------------
        */

        combined:
            buildCombinedSummary(
                cyeraRecords,
                purviewRecords
            )
    };
}
export {
    buildDailyReportData
};