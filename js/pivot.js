/*
==========================================
Daily Report Generator
pivot.js
Version 2.0
==========================================
*/
 
/*
==========================================
Preferred Column Orders
==========================================
*/
 
const COLUMN_ORDER = {
 
    cyera: [
        "open",
        "riskAccepted",
        "closed"
    ],
 
    purview: [
        "Critical",
        "High",
        "Medium",
        "Low",
        "Informational"
    ]
 
};
 
 
/*
==========================================
Generic Pivot Builder
==========================================
*/
 
function createPivot(
    data,
    rowField,
    columnField,
    preferredColumns = []
) {
 
    const rows = {};
 
    const discoveredColumns = new Set();
 
    data.forEach(record => {
 
        let rowValue =
            (record[rowField] || "")
                .trim();
 
        let columnValue =
            (record[columnField] || "")
                .trim();
 
        if (!rowValue)
            rowValue = "Unassigned";
 
        if (!columnValue)
            columnValue = "Unknown";
 
        discoveredColumns.add(columnValue);
 
        if (!rows[rowValue]) {
 
            rows[rowValue] = {};
 
        }
 
        rows[rowValue][columnValue] =
            (rows[rowValue][columnValue] || 0) + 1;
 
    });
 
    const columns =
        sortColumns(
            Array.from(discoveredColumns),
            preferredColumns
        );
 
    return {
 
        rows,
 
        columns
 
    };
 
}
 
 
/*
==========================================
Sort Columns
==========================================
*/
 
function sortColumns(
    discovered,
    preferred
) {
 
    const ordered = [];
 
    preferred.forEach(col => {
 
        if (discovered.includes(col)) {
 
            ordered.push(col);
 
        }
 
    });
 
    discovered.forEach(col => {
 
        if (!ordered.includes(col)) {
 
            ordered.push(col);
 
        }
 
    });
 
    return ordered;
 
}
 
 
/*
==========================================
Sort Row Labels
==========================================
*/
 
function getSortedRows(rows) {
 
    return Object.keys(rows).sort((a, b) => {
 
        if (a === "Unassigned")
            return 1;
 
        if (b === "Unassigned")
            return -1;
 
        return a.localeCompare(b);
 
    });
 
}
 
 
/*
==========================================
Cyera Pivot
==========================================
*/
 
function generateCyeraPivot(data) {
 
    return createPivot(
 
        data,
 
        "Assigned User Email",
 
        "Status",
 
        COLUMN_ORDER.cyera
 
    );
 
}
 
 
/*
==========================================
Purview Pivot
==========================================
*/
 
function generatePurviewPivot(data) {
 
    return createPivot(
 
        data,
 
        "Users",
 
        "Severity",
 
        COLUMN_ORDER.purview
 
    );
 
}
 
/*
==========================================
Convert Pivot To HTML
==========================================
*/
/*
==========================================
Format Column Name
==========================================
*/
 
function formatColumnName(column) {
 
    if (!column) return "";
 
    return column
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, str => str.toUpperCase());
 
}
 
 
/*
==========================================
Convert Pivot To HTML
==========================================
*/
 
function pivotToHTML(pivot) {
 
    const rows = pivot.rows;
    const columns = pivot.columns;
 
    const grandTotals = {};
    let overallTotal = 0;
 
    let html = `
 
<table class="pivot-table">
 
<thead>
 
<tr>
 
<th class="pivot-row-label">Row Labels</th>
 
`;
 
    columns.forEach(column => {
 
        grandTotals[column] = 0;
 
        html += `
 
<th class="pivot-header">
 
${escapeHTML(formatColumnName(column))}
 
</th>
 
`;
 
    });
 
    html += `
 
<th class="pivot-header">
 
Grand Total
 
</th>
 
</tr>
 
</thead>
 
<tbody>
 
`;
 
    getSortedRows(rows).forEach(row => {
 
        let rowTotal = 0;
 
        const displayRow =
            row === "Unassigned"
                ? "Unassigned Alerts"
                : row;
 
        html += `
 
<tr>
 
<td class="pivot-row-label">
 
${escapeHTML(displayRow)}
 
</td>
 
`;
 
        columns.forEach(column => {
 
            const value = rows[row][column] || 0;
 
            rowTotal += value;
 
            overallTotal += value;
 
            grandTotals[column] += value;
 
            html += `
 
<td class="pivot-number">
 
${value === 0 ? "" : value}
 
</td>
 
`;
 
        });
 
        html += `
 
<td class="grand-total-cell">
 
<strong>
 
${rowTotal}
 
</strong>
 
</td>
 
</tr>
 
`;
 
    });
 
    html += `
 
<tr class="grand-total-row">
 
<th class="pivot-total">
 
Grand Total
 
</th>
 
`;
 
    columns.forEach(column => {
 
        html += `
 
<th class="pivot-total">
 
${grandTotals[column]}
 
</th>
 
`;
 
    });
 
    html += `
 
<th class="pivot-total">
 
${overallTotal}
 
</th>
 
</tr>
 
`;
 
    html += `
 
</tbody>
 
</table>
 
`;
 
    return html;
 
}
 
/*
==========================================
Pivot Statistics
==========================================
*/
 
function getPivotStatistics(pivot){
 
    let total = 0;
 
    let users = 0;
 
    Object.keys(pivot.rows).forEach(user=>{
 
        users++;
 
        Object.values(pivot.rows[user]).forEach(count=>{
 
            total += count;
 
        });
 
    });
 
    return{
 
        users,
 
        total
 
    };
 
}
 
/*
==========================================
Export Helpers
==========================================
*/
 
function getCyeraSummary(data){
 
    const pivot = generateCyeraPivot(data);
 
    return{
 
        pivot,
 
        stats:getPivotStatistics(pivot)
 
    };
 
}
 
function getPurviewSummary(data){
 
    const pivot = generatePurviewPivot(data);
 
    return{
 
        pivot,
 
        stats:getPivotStatistics(pivot)
 
    };
 
}