/*
==========================================
Daily Report Generator
report.js
Version 1.0
==========================================
*/
 
function generateReport(reportData) {
 
    let html = `
<div class="email-container">

 
    <p>Hi Eric,</p>
 
    <p>
 
        Please find attached the daily report covering the period from
<strong>{{REPORT_FROM}}</strong>
        to
<strong>{{REPORT_TO}}</strong>.
 
    </p>
 
    {{SHAREPOINT_SECTION}}
 
    <br>
 
    <h2>Purview Alerts</h2>
 
    {{PURVIEW_TABLE}}
 
    <br>
 
    <h3>Tickets raised if any -</h3>
 
    <table class="ticket-table">
 
        <thead>
 
            <tr>
 
                <th>Issue Severity</th>
 
                <th>Alert Name</th>
 
                <th>Ticket</th>
 
                <th>Status</th>
 
                <th>Date & Time</th>
 
                <th>Comment</th>
 
            </tr>
 
        </thead>
 
        <tbody>
 
            <tr>
 
                <td>High</td>
 
                <td>NA</td>
 
                <td>NA</td>
 
                <td>NA</td>
 
                <td>NA</td>
 
                <td>NA</td>
 
            </tr>
 
            <tr>
 
                <td>Medium</td>
 
                <td>NA</td>
 
                <td>NA</td>
 
                <td>NA</td>
 
                <td>NA</td>
 
                <td>NA</td>
 
            </tr>
 
            <tr>
 
                <td>Low</td>
 
                <td>NA</td>
 
                <td>NA</td>
 
                <td>NA</td>
 
                <td>NA</td>
 
                <td>NA</td>
 
            </tr>
 
        </tbody>
 
    </table>
 
    <br>
 
    <h2>Cyera DLP</h2>
 
<p>
 
    Below is the pivot table pulled from Cyera, reflecting the report and the work completed so far for the period from
<strong>{{REPORT_FROM}}</strong>
    to
<strong>{{REPORT_TO}}</strong>.
 
</p>
 
    {{CYERA_TABLE}}
 
    <br>
 
    <h2>Wiz.io Dashboard</h2>
 
    {{WIZ_SECTION}}
 
    <br>
 
    <h3>Tickets raised if any -</h3>
 
    <table class="ticket-table">
 
        <thead>
 
            <tr>
 
                <th>Issue Severity</th>
 
                <th>Rule Name</th>
 
                <th>Ticket</th>
 
                <th>Status</th>
 
                <th>Date & Time</th>
 
                <th>Comment</th>
 
            </tr>
 
        </thead>
 
        <tbody>
 
            <tr>
 
                <td>Critical</td>
 
                <td>NA</td>
 
                <td>None</td>
 
                <td>NA</td>
 
                <td>NA</td>
 
                <td>NA</td>
 
            </tr>
 
            <tr>
 
                <td>High</td>
 
                <td>NA</td>
 
                <td>None</td>
 
                <td>NA</td>
s
<td>NA</td>
 
                <td>NA</td>
 
            </tr>
 
        </tbody>
 
    </table>
 
</div>
`;
 
    // Subject
    html = html.replace(
        "{{SUBJECT}}",
        escapeHTML(reportData.subject)
    );
 
    // Report Dates
    html = html.replaceAll(
        "{{REPORT_FROM}}",
        escapeHTML(reportData.reportFrom)
    );
 
    html = html.replaceAll(
        "{{REPORT_TO}}",
        escapeHTML(reportData.reportTo)
    );
 
    // SharePoint
    html = html.replace(
        "{{SHAREPOINT_SECTION}}",
        buildSharePointSection(reportData.sharePointLink)
    );
 
    // Purview Pivot
    html = html.replace(
        "{{PURVIEW_TABLE}}",
        reportData.purviewTable
    );
 
    // Cyera Pivot
    html = html.replace(
        "{{CYERA_TABLE}}",
        reportData.cyeraTable
    );
 
    // Wiz
    html = html.replace(
        "{{WIZ_SECTION}}",
        buildWizSection(reportData.wizImage)
    );
 
    return html;
 
}
 
 
/*
==========================================
SharePoint Section
==========================================
*/
 
function buildSharePointSection(link){
 
    if(!link || link.trim()===""){
 
        return "";
 
    }
 
    return `
 
<p>
 
In addition, data has been successfully uploaded at
SharePoint site.
 
</p>
 
<p>
 
<a href="${escapeHTML(link)}">
 
Daily Report
 
</a>
 
</p>
 
`;
 
}
 
 
/*
==========================================
Wiz Section
==========================================
*/
 
function buildWizSection(image){
 
    if(!image){
 
        return "<p>No Wiz screenshot provided.</p>";
 
    }
 
    return `
 
<img
 
src="${image}"
 
style="
 
max-width:100%;
 
border:1px solid #ccc;
 
border-radius:8px;
 
margin-top:10px;
 
">
 
`;
 
}
 
 
/*
==========================================
Create Report Object
==========================================
*/
 
function createReportObject(
    cyeraTable,
    purviewTable,
    sharePointLink,
    wizImage
){
 
    const window = generateReportingWindow();
 
    return {
 
        subject: generateSubject(),
 
        reportFrom: window.from,
 
        reportTo: window.to,
 
        sharePointLink,
 
        cyeraTable,
 
        purviewTable,
 
        wizImage
 
    };
 
}
 
 
/*
==========================================
Generate Preview
==========================================
*/
 
function showReport(report){
 
    const html = generateReport(report);
 
    setPreview(html);
 
}