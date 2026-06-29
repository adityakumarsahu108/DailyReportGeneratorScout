/*
==========================================
Daily Report Generator
reportTemplate.js
Version 1.0
==========================================
*/

const REPORT_TEMPLATE = `
<div class="email-container">

    <div class="email-subject">

        <strong>{{SUBJECT}}</strong>

    </div>

    <br>

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

        Below is the pivot table pulled from Cyera,
        reflecting the report and the work completed so far.

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

                <td>NA</td>

                <td>NA</td>

            </tr>

        </tbody>

    </table>

</div>
`;