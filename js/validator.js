/*
==========================================
Daily Report Generator
validator.js
Version 0.1
==========================================
*/


/*
==========================================
Required Columns
==========================================
*/

const CYERA_REQUIRED_COLUMNS = [
    "Assigned User Email",
    "Status"
];

const PURVIEW_REQUIRED_COLUMNS = [
    "Users",
    "Severity"
];


/*
==========================================
Check Required Columns
==========================================
*/

function hasRequiredColumns(headers, requiredColumns) {

    return requiredColumns.every(column =>
        headers.includes(column)
    );

}


/*
==========================================
Detect CSV Type
==========================================
*/

function detectCSVType(headers) {

    const isCyera = hasRequiredColumns(
        headers,
        CYERA_REQUIRED_COLUMNS
    );

    const isPurview = hasRequiredColumns(
        headers,
        PURVIEW_REQUIRED_COLUMNS
    );

    if (isCyera)
        return "cyera";

    if (isPurview)
        return "purview";

    return "unknown";

}


/*
==========================================
Validate Cyera CSV
==========================================
*/

function validateCyeraCSV(data) {

    if (!data || data.length === 0) {

        return {

            valid: false,

            message: "CSV contains no data."

        };

    }

    const headers = Object.keys(data[0]);

    const type = detectCSVType(headers);

    if (type === "purview") {

        return {

            valid: false,

            message: "This looks like a Purview CSV."

        };

    }

    if (type === "unknown") {

        return {

            valid: false,

            message: "Invalid Cyera CSV."

        };

    }

    return {

        valid: true,

        message: "✔ Valid Cyera CSV"

    };

}


/*
==========================================
Validate Purview CSV
==========================================
*/

function validatePurviewCSV(data) {

    if (!data || data.length === 0) {

        return {

            valid: false,

            message: "CSV contains no data."

        };

    }

    const headers = Object.keys(data[0]);

    const type = detectCSVType(headers);

    if (type === "cyera") {

        return {

            valid: false,

            message: "This looks like a Cyera CSV."

        };

    }

    if (type === "unknown") {

        return {

            valid: false,

            message: "Invalid Purview CSV."

        };

    }

    return {

        valid: true,

        message: "✔ Valid Purview CSV"

    };

}


/*
==========================================
Future Expansion

Here we can later add:

• Date validation
• Duplicate detection
• Empty row removal
• Corrupted CSV detection
• Export version detection

without changing app.js

==========================================
*/