/* ============================================================
   pivot.js
   Report Studio - Pivot Tables
   ============================================================ */

/* ------------------------------------------------------------
   Preferred column order
------------------------------------------------------------ */

const COLUMN_ORDER = {
    cyera: [
        "open",
        "riskAccepted",
        "closed",
        "resolved"
    ],

    purview: [
        "Critical",
        "High",
        "Medium",
        "Low",
        "Informational"
    ]
};


/* ============================================================
   Generic helpers
   ============================================================ */

/**
 * Get a field from an object using case-insensitive matching.
 * This allows the pivot to work with both raw CSV data and
 * normalized report data.
 */
function getPivotField(record, aliases) {
    if (!record || typeof record !== "object") {
        return "";
    }

    const keys = Object.keys(record);

    for (const alias of aliases) {
        const exactKey = keys.find(
            key => key === alias
        );

        if (exactKey) {
            return record[exactKey];
        }

        const insensitiveKey = keys.find(
            key => key.trim().toLowerCase() === alias.trim().toLowerCase()
        );

        if (insensitiveKey) {
            return record[insensitiveKey];
        }
    }

    return "";
}


/**
 * Convert a value into a clean string.
 */
function cleanPivotValue(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value).trim();
}


/* ============================================================
   Cyera status normalization
------------------------------------------------------------ */

/**
 * Normalize Cyera statuses so that different spellings/
 * capitalizations end up in the same pivot column.
 */
function normalizeCyeraStatus(value) {
    const status = cleanPivotValue(value).toLowerCase();

    if (!status) {
        return "open";
    }

    if (
        status === "riskaccepted" ||
        status === "risk accepted" ||
        status === "risk_accept" ||
        status === "risk accepted alert"
    ) {
        return "riskAccepted";
    }

    if (
        status === "closed" ||
        status === "close"
    ) {
        return "closed";
    }

    if (
        status === "resolved" ||
        status === "resolve"
    ) {
        return "resolved";
    }

    if (
        status === "open" ||
        status === "opened" ||
        status === "in progress" ||
        status === "in_progress"
    ) {
        return "open";
    }

    /*
     * Unknown statuses are kept as-is rather than silently
     * changing the underlying data.
     */
    return cleanPivotValue(value);
}


/* ============================================================
   Cyera engineer resolution
------------------------------------------------------------ */

/**
 * Determine which engineer should appear against a Cyera alert.
 *
 * For completed alerts:
 *   1. Status Updated By User Email
 *   2. Assigned User Email
 *   3. Assignee
 *
 * For active/open alerts:
 *   1. Assigned User Email
 *   2. Assignee
 *
 * IMPORTANT:
 * Actor Email / Triggering User is intentionally NOT used.
 * That represents the person whose activity triggered the
 * alert, not necessarily the DLP engineer handling it.
 */
function getCyeraEngineer(record) {
    if (!record || typeof record !== "object") {
        return "Unassigned";
    }

    const statusRaw = getPivotField(record, [
        "Status",
        "status"
    ]);

    const status = normalizeCyeraStatus(statusRaw);

    const statusUpdatedBy = cleanPivotValue(
        getPivotField(record, [
            "Status Updated By User Email",
            "statusUpdatedByUserEmail"
        ])
    );

    const assignedUser = cleanPivotValue(
        getPivotField(record, [
            "Assigned User Email",
            "assignedUserEmail"
        ])
    );

    const assignee = cleanPivotValue(
        getPivotField(record, [
            "Assignee",
            "assignee"
        ])
    );

    /*
     * Completed alerts:
     * Prefer the person who actually changed the status.
     */
    if (
        status === "closed" ||
        status === "resolved" ||
        status === "riskAccepted"
    ) {
        if (statusUpdatedBy) {
            return statusUpdatedBy;
        }

        if (assignedUser) {
            return assignedUser;
        }

        if (assignee) {
            return assignee;
        }

        return "Unassigned";
    }

    /*
     * Open/active alerts:
     * Use the currently assigned engineer.
     */
    if (assignedUser) {
        return assignedUser;
    }

    if (assignee) {
        return assignee;
    }

    return "Unassigned";
}


/* ============================================================
   Generic pivot creator
------------------------------------------------------------ */

function createPivot(
    data,
    rowField,
    columnField,
    preferredColumns = []
) {
    const rows = {};
    const discoveredColumns = new Set();

    if (!Array.isArray(data)) {
        return {
            rows: {},
            columns: []
        };
    }

    data.forEach(record => {
        let rowValue = cleanPivotValue(
            getPivotField(record, [rowField])
        );

        let columnValue = cleanPivotValue(
            getPivotField(record, [columnField])
        );

        if (!rowValue) {
            rowValue = "Unassigned";
        }

        if (!columnValue) {
            columnValue = "Unknown";
        }

        discoveredColumns.add(columnValue);

        if (!rows[rowValue]) {
            rows[rowValue] = {};
        }

        rows[rowValue][columnValue] =
            (rows[rowValue][columnValue] || 0) + 1;
    });

    const columns = sortColumns(
        Array.from(discoveredColumns),
        preferredColumns
    );

    return {
        rows,
        columns
    };
}


/* ============================================================
   Column sorting
------------------------------------------------------------ */

function sortColumns(columns, preferredColumns = []) {
    const preferredIndex = new Map(
        preferredColumns.map((column, index) => [
            column,
            index
        ])
    );

    return [...columns].sort((a, b) => {

        const aIndex = preferredIndex.has(a)
            ? preferredIndex.get(a)
            : Infinity;

        const bIndex = preferredIndex.has(b)
            ? preferredIndex.get(b)
            : Infinity;

        if (aIndex !== bIndex) {
            return aIndex - bIndex;
        }

        return String(a).localeCompare(
            String(b),
            undefined,
            {
                sensitivity: "base"
            }
        );
    });
}


/* ============================================================
   Cyera pivot
------------------------------------------------------------ */

/**
 * Cyera pivot:
 *
 * Engineer | Open | Risk Accepted | Closed | Resolved | Total
 *
 * The engineer is resolved using getCyeraEngineer().
 */
function generateCyeraPivot(data) {
    const rows = {};
    const discoveredColumns = new Set();

    if (!Array.isArray(data)) {
        return {
            rows: {},
            columns: []
        };
    }

    data.forEach(record => {

        const engineer = getCyeraEngineer(record);

        const statusRaw = getPivotField(record, [
            "Status",
            "status"
        ]);

        const status = normalizeCyeraStatus(statusRaw);

        discoveredColumns.add(status);

        if (!rows[engineer]) {
            rows[engineer] = {};
        }

        rows[engineer][status] =
            (rows[engineer][status] || 0) + 1;
    });

    const columns = sortColumns(
        Array.from(discoveredColumns),
        COLUMN_ORDER.cyera
    );

    return {
        rows,
        columns
    };
}


/* ============================================================
   Purview pivot
------------------------------------------------------------ */

/**
 * Purview pivot:
 *
 * User | Critical | High | Medium | Low | Informational | Total
 *
 * IMPORTANT:
 * Purview rows represent USERS, NOT ENGINEERS.
 */
function generatePurviewPivot(data) {

    const rows = {};
    const discoveredColumns = new Set();

    if (!Array.isArray(data)) {
        return {
            rows: {},
            columns: []
        };
    }

    data.forEach(record => {

        const user = cleanPivotValue(
            getPivotField(record, [
                "Users",
                "User",
                "users",
                "user"
            ])
        );

        const severity = cleanPivotValue(
            getPivotField(record, [
                "Severity",
                "severity"
            ])
        );

        const rowValue = user || "Unassigned";
        const columnValue = severity || "Unknown";

        discoveredColumns.add(columnValue);

        if (!rows[rowValue]) {
            rows[rowValue] = {};
        }

        rows[rowValue][columnValue] =
            (rows[rowValue][columnValue] || 0) + 1;
    });

    const columns = sortColumns(
        Array.from(discoveredColumns),
        COLUMN_ORDER.purview
    );

    return {
        rows,
        columns
    };
}


/* ============================================================
   Pivot HTML generator
------------------------------------------------------------ */

function pivotToHTML(
    pivot,
    firstColumnLabel = "Engineer"
) {
    if (
        !pivot ||
        !pivot.rows ||
        !pivot.columns
    ) {
        return `
            <table class="pivot-table">
                <thead>
                    <tr>
                        <th>${firstColumnLabel}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>No data available</td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    const rowNames = Object.keys(pivot.rows);

    if (rowNames.length === 0) {
        return `
            <table class="pivot-table">
                <thead>
                    <tr>
                        <th>${escapePivotHTML(firstColumnLabel)}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>No data available</td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    let html = `
        <table class="pivot-table">
            <thead>
                <tr>
                    <th>${escapePivotHTML(firstColumnLabel)}</th>
    `;

    pivot.columns.forEach(column => {
        html += `
                    <th>${escapePivotHTML(
                        formatPivotColumnName(column)
                    )}</th>
        `;
    });

    html += `
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
    `;

    let grandTotal = 0;

    const columnTotals = {};

    pivot.columns.forEach(column => {
        columnTotals[column] = 0;
    });

    rowNames.forEach(rowName => {

        const row = pivot.rows[rowName];

        let rowTotal = 0;

        pivot.columns.forEach(column => {
            rowTotal += Number(row[column] || 0);
        });

        grandTotal += rowTotal;

        html += `
            <tr>
                <td class="pivot-row-label">
                    ${escapePivotHTML(
                        rowName === "Unassigned"
                            ? "Unassigned Alerts"
                            : rowName
                    )}
                </td>
        `;

        pivot.columns.forEach(column => {

            const value = Number(
                row[column] || 0
            );

            columnTotals[column] += value;

            html += `
                <td>
                    ${value > 0 ? value : ""}
                </td>
            `;
        });

        html += `
                <td class="pivot-total">
                    ${rowTotal}
                </td>
            </tr>
        `;
    });

    /*
     * Grand total row
     */
    html += `
        <tr class="pivot-grand-total">
            <td>
                Grand Total
            </td>
    `;

    pivot.columns.forEach(column => {
        html += `
            <td>
                ${columnTotals[column]}
            </td>
        `;
    });

    html += `
            <td>
                ${grandTotal}
            </td>
        </tr>
    `;

    html += `
            </tbody>
        </table>
    `;

    return html;
}


/* ============================================================
   Column display names
------------------------------------------------------------ */

function formatPivotColumnName(column) {

    const value = String(column);

    switch (value) {

        case "riskAccepted":
            return "Risk Accepted";

        case "open":
            return "Open";

        case "closed":
            return "Closed";

        case "resolved":
            return "Resolved";

        default:
            return value;
    }
}


/* ============================================================
   HTML escaping
------------------------------------------------------------ */

function escapePivotHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ============================================================
   Cyera summary
------------------------------------------------------------ */

function getCyeraSummary(data) {

    const summary = {
        total: 0,
        open: 0,
        riskAccepted: 0,
        closed: 0,
        resolved: 0,
        unassigned: 0
    };

    if (!Array.isArray(data)) {
        return summary;
    }

    data.forEach(record => {

        summary.total++;

        const status = normalizeCyeraStatus(
            getPivotField(record, [
                "Status",
                "status"
            ])
        );

        if (status === "open") {
            summary.open++;
        }
        else if (status === "riskAccepted") {
            summary.riskAccepted++;
        }
        else if (status === "closed") {
            summary.closed++;
        }
        else if (status === "resolved") {
            summary.resolved++;
        }

        const engineer = getCyeraEngineer(record);

        if (
            !engineer ||
            engineer === "Unassigned"
        ) {
            summary.unassigned++;
        }
    });

    return summary;
}


/* ============================================================
   Purview summary
------------------------------------------------------------ */

function getPurviewSummary(data) {

    const summary = {
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        informational: 0,
        unassigned: 0
    };

    if (!Array.isArray(data)) {
        return summary;
    }

    data.forEach(record => {

        summary.total++;

        const severity = cleanPivotValue(
            getPivotField(record, [
                "Severity",
                "severity"
            ])
        ).toLowerCase();

        switch (severity) {

            case "critical":
                summary.critical++;
                break;

            case "high":
                summary.high++;
                break;

            case "medium":
                summary.medium++;
                break;

            case "low":
                summary.low++;
                break;

            case "informational":
            case "info":
                summary.informational++;
                break;
        }

        const user = cleanPivotValue(
            getPivotField(record, [
                "Users",
                "User",
                "users",
                "user"
            ])
        );

        if (!user) {
            summary.unassigned++;
        }
    });

    return summary;
}


/* ============================================================
   Convenience functions
------------------------------------------------------------ */

/**
 * Generate Cyera HTML directly.
 */
function generateCyeraPivotHTML(data) {

    const pivot = generateCyeraPivot(data);

    return pivotToHTML(
        pivot,
        "Engineer"
    );
}


/**
 * Generate Purview HTML directly.
 *
 * Notice:
 * "User" is deliberately used instead of "Engineer".
 */
function generatePurviewPivotHTML(data) {

    const pivot = generatePurviewPivot(data);

    return pivotToHTML(
        pivot,
        "User"
    );
}


/* ============================================================
   Optional exports
------------------------------------------------------------ */

/*
 * Keep these exports if your project uses ES modules.
 * If your project uses normal <script> tags, they can remain
 * commented out.
 */

// export {
//     createPivot,
//     generateCyeraPivot,
//     generatePurviewPivot,
//     pivotToHTML,
//     generateCyeraPivotHTML,
//     generatePurviewPivotHTML,
//     getCyeraSummary,
//     getPurviewSummary,
//     getCyeraEngineer,
//     normalizeCyeraStatus
// };