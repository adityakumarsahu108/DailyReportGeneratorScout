/*
==========================================
Daily Report Generator
validator.js
Version 0.2
==========================================

Purpose:
- Detect Cyera and Purview CSV files
- Support OLD and NEW Cyera formats
- Avoid depending on exact Cyera column names
- Allow optional columns to change without
  breaking the importer
- Provide useful validation messages

IMPORTANT:
Cyera detection uses multiple signals.
We do NOT rely on only:
    "Assigned User Email"
    "Status"

This allows newer Cyera exports such as:
    Alert ID
    Alert Name
    Time
    Severity
    Status
    What Happened
    Alert Action
    Actor Name
    ...
==========================================
*/


/*
==========================================
Required / Core Signals
==========================================
*/


/*
------------------------------------------
Purview

Purview has a relatively recognizable
structure around Users + Severity.

We still require both so that a random CSV
containing only "Severity" isn't detected
as Purview.
------------------------------------------
*/

const PURVIEW_REQUIRED_COLUMNS = [
    [
        "Users"
    ],
    [
        "Severity"
    ]
];


/*
------------------------------------------
Cyera Core Signals

Each group represents an equivalent concept.

For example:

ID:
    ID
    Alert ID

Name:
    Name
    Alert Name

Assignment:
    Assigned User Email
    Assignee

We do NOT require every group.
------------------------------------------
*/

const CYERA_SIGNAL_GROUPS = {

    /*
    ------------------------------------------
    Alert identity
    ------------------------------------------
    */

    id: [
        "ID",
        "Alert ID"
    ],

    name: [
        "Name",
        "Alert Name"
    ],

    severity: [
        "Severity",
        "Original Analysis Severity",
        "Original Severity"
    ],

    status: [
        "Status"
    ],

    /*
    ------------------------------------------
    Policy / Detection context
    ------------------------------------------
    */

    policy: [
        "Policy Name",
        "Policy ID"
    ],

    provider: [
        "Provider"
    ],

    channel: [
        "Channel"
    ],

    /*
    ------------------------------------------
    Actor / user context
    ------------------------------------------
    */

    actor: [
        "Triggering User",
        "Actor Name",
        "Actor Email"
    ],

    /*
    ------------------------------------------
    Destination context
    ------------------------------------------
    */

    destination: [
        "Destination Name",
        "Destination Names",
        "Destination Recipients"
    ],

    /*
    ------------------------------------------
    Action context
    ------------------------------------------
    */

    action: [
        "Policy Action",
        "Alert Action",
        "Actual Action",
        "Configured Action"
    ],

    /*
    ------------------------------------------
    Time
    ------------------------------------------
    */

    time: [
        "Timestamp",
        "Time",
        "Updated At"
    ],

    /*
    ------------------------------------------
    Description / explanation
    ------------------------------------------
    */

    description: [
        "What Happened",
        "Agent Data Summary"
    ],

    /*
    ------------------------------------------
    Assignment
    ------------------------------------------
    */

    assignment: [
        "Assigned User Email",
        "Assigned User ID",
        "Assignee"
    ]
};


/*
==========================================
Header Normalization
==========================================

This makes:

"Alert ID"
" alert id "
"ALERT ID"

all comparable.

It also removes BOM characters.
==========================================
*/

function normalizeHeader(header) {

    if (header === undefined || header === null) {
        return "";
    }

    return String(header)
        .replace(/^\uFEFF/, "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}


/*
==========================================
Build Normalized Header Set
==========================================
*/

function getNormalizedHeaders(headers) {

    return headers.map(header =>
        normalizeHeader(header)
    );
}


/*
==========================================
Check If Header Exists
==========================================
*/

function hasHeader(headers, aliases) {

    const normalizedHeaders =
        getNormalizedHeaders(headers);

    return aliases.some(alias => {

        const normalizedAlias =
            normalizeHeader(alias);

        return normalizedHeaders.includes(
            normalizedAlias
        );
    });
}


/*
==========================================
Find Matching Header
==========================================
*/

function findMatchingHeader(headers, aliases) {

    const normalizedHeaders =
        getNormalizedHeaders(headers);

    for (const alias of aliases) {

        const normalizedAlias =
            normalizeHeader(alias);

        const index =
            normalizedHeaders.indexOf(
                normalizedAlias
            );

        if (index !== -1) {
            return headers[index];
        }
    }

    return null;
}


/*
==========================================
PURVIEW DETECTION
==========================================
*/

function detectPurview(headers) {

    const hasUsers =
        hasHeader(headers, [
            "Users"
        ]);

    const hasSeverity =
        hasHeader(headers, [
            "Severity"
        ]);

    return hasUsers && hasSeverity;
}


/*
==========================================
CYERA DETECTION
==========================================

We calculate a score instead of requiring
specific columns.

This makes the importer resilient to
Cyera changing its export format.

Strong signals:
    ID / Alert ID
    Name / Alert Name
    Severity
    Status
    Policy
    Provider

Supporting signals:
    Actor
    Destination
    Action
    Time
    Description
    Assignment
    Channel
==========================================
*/

function detectCyera(headers) {

    const matches = [];

    /*
    ------------------------------------------
    Strong signals
    ------------------------------------------
    */

    const strongSignals = [
        "id",
        "name",
        "severity",
        "status",
        "policy",
        "provider"
    ];


    /*
    ------------------------------------------
    Supporting signals
    ------------------------------------------
    */

    const supportingSignals = [
        "actor",
        "destination",
        "action",
        "time",
        "description",
        "assignment",
        "channel"
    ];


    let strongScore = 0;
    let supportingScore = 0;


    /*
    ------------------------------------------
    Check strong signals
    ------------------------------------------
    */

    for (const signal of strongSignals) {

        const aliases =
            CYERA_SIGNAL_GROUPS[signal];

        if (hasHeader(headers, aliases)) {

            strongScore++;

            matches.push({
                signal,
                type: "strong",
                header:
                    findMatchingHeader(
                        headers,
                        aliases
                    )
            });
        }
    }


    /*
    ------------------------------------------
    Check supporting signals
    ------------------------------------------
    */

    for (const signal of supportingSignals) {

        const aliases =
            CYERA_SIGNAL_GROUPS[signal];

        if (hasHeader(headers, aliases)) {

            supportingScore++;

            matches.push({
                signal,
                type: "supporting",
                header:
                    findMatchingHeader(
                        headers,
                        aliases
                    )
            });
        }
    }


    /*
    ------------------------------------------
    Minimum confidence
    ------------------------------------------

    We want at least:

        3 strong signals

    OR:

        2 strong + 2 supporting

    This prevents random CSV files from
    being treated as Cyera.
    ------------------------------------------
    */

    const strongEnough =
        strongScore >= 3;

    const mixedEnough =
        strongScore >= 2 &&
        supportingScore >= 2;


    const isCyera =
        strongEnough ||
        mixedEnough;


    return {

        isCyera,

        score:
            strongScore +
            supportingScore,

        strongScore,

        supportingScore,

        matches
    };
}


/*
==========================================
GENERAL CSV TYPE DETECTION
==========================================
*/

function detectCSVType(headers) {

    if (!headers || headers.length === 0) {
        return "unknown";
    }


    /*
    ------------------------------------------
    Detect Purview
    ------------------------------------------

    We check this separately because Purview
    has a very specific Users + Severity
    combination.
    ------------------------------------------
    */

    const isPurview =
        detectPurview(headers);


    /*
    ------------------------------------------
    Detect Cyera
    ------------------------------------------
    */

    const cyeraDetection =
        detectCyera(headers);


    /*
    ------------------------------------------
    Conflict Handling
    ------------------------------------------

    If a file somehow looks like both,
    prefer Cyera only when it has strong
    Cyera-specific evidence.
    ------------------------------------------
    */

    if (
        isPurview &&
        cyeraDetection.isCyera
    ) {

        if (
            cyeraDetection.strongScore >= 4
        ) {
            return "cyera";
        }

        return "purview";
    }


    if (cyeraDetection.isCyera) {
        return "cyera";
    }


    if (isPurview) {
        return "purview";
    }


    return "unknown";
}


/*
==========================================
GET DETECTION DETAILS
==========================================

Useful for debugging and future format
changes.
==========================================
*/

function getCSVDetectionDetails(headers) {

    const cyera =
        detectCyera(headers);

    const purview =
        detectPurview(headers);


    return {

        type:
            detectCSVType(headers),

        cyera: {

            detected:
                cyera.isCyera,

            score:
                cyera.score,

            strongScore:
                cyera.strongScore,

            supportingScore:
                cyera.supportingScore,

            matches:
                cyera.matches
        },

        purview: {

            detected:
                purview
        },

        headers
    };
}


/*
==========================================
VALIDATE CYERA CSV
==========================================
*/

function validateCyeraCSV(data) {

    /*
    ------------------------------------------
    Empty CSV
    ------------------------------------------
    */

    if (!data || data.length === 0) {

        return {
            valid: false,
            message: "CSV contains no data.",
            type: "unknown"
        };
    }


    /*
    ------------------------------------------
    Get headers
    ------------------------------------------
    */

    const headers =
        Object.keys(data[0]);


    /*
    ------------------------------------------
    Detect
    ------------------------------------------
    */

    const detection =
        detectCyera(headers);


    const type =
        detectCSVType(headers);


    /*
    ------------------------------------------
    Purview detected
    ------------------------------------------
    */

    if (type === "purview") {

        return {

            valid: false,

            type: "purview",

            message:
                "This looks like a Purview CSV. Please upload a Cyera CSV.",

            details:
                getCSVDetectionDetails(headers)
        };
    }


    /*
    ------------------------------------------
    Unknown
    ------------------------------------------
    */

    if (!detection.isCyera) {

        return {

            valid: false,

            type: "unknown",

            message:
                "Invalid Cyera CSV. The file does not contain enough recognizable Cyera alert fields.",

            details:
                getCSVDetectionDetails(headers)
        };
    }


    /*
    ------------------------------------------
    Valid
    ------------------------------------------
    */

    return {

        valid: true,

        type: "cyera",

        message:
            "✔ Valid Cyera CSV",

        details:
            getCSVDetectionDetails(headers)
    };
}


/*
==========================================
VALIDATE PURVIEW CSV
==========================================
*/

function validatePurviewCSV(data) {

    /*
    ------------------------------------------
    Empty CSV
    ------------------------------------------
    */

    if (!data || data.length === 0) {

        return {

            valid: false,

            message:
                "CSV contains no data.",

            type:
                "unknown"
        };
    }


    /*
    ------------------------------------------
    Headers
    ------------------------------------------
    */

    const headers =
        Object.keys(data[0]);


    /*
    ------------------------------------------
    Detection
    ------------------------------------------
    */

    const type =
        detectCSVType(headers);


    /*
    ------------------------------------------
    Cyera detected
    ------------------------------------------
    */

    if (type === "cyera") {

        return {

            valid: false,

            type: "cyera",

            message:
                "This looks like a Cyera CSV. Please upload a Purview CSV.",

            details:
                getCSVDetectionDetails(headers)
        };
    }


    /*
    ------------------------------------------
    Purview validation
    ------------------------------------------
    */

    const isPurview =
        detectPurview(headers);


    if (!isPurview) {

        return {

            valid: false,

            type: "unknown",

            message:
                "Invalid Purview CSV. Required Purview fields were not detected.",

            details:
                getCSVDetectionDetails(headers)
        };
    }


    /*
    ------------------------------------------
    Valid
    ------------------------------------------
    */

    return {

        valid: true,

        type: "purview",

        message:
            "✔ Valid Purview CSV",

        details:
            getCSVDetectionDetails(headers)
    };
}


/*
==========================================
OPTIONAL DEBUG FUNCTION
==========================================

You can run this from the browser console:

debugCSVHeaders(data);

It will print exactly what the validator
detected.
==========================================
*/

function debugCSVHeaders(data) {

    if (!data || !data.length) {

        console.log(
            "No CSV data available."
        );

        return;
    }


    const headers =
        Object.keys(data[0]);


    const details =
        getCSVDetectionDetails(headers);


    console.group(
        "CSV Detection Debug"
    );

    console.log(
        "Detected Type:",
        details.type
    );

    console.log(
        "Headers:",
        headers
    );

    console.log(
        "Cyera Detection:",
        details.cyera
    );

    console.log(
        "Purview Detection:",
        details.purview
    );

    console.groupEnd();


    return details;
}