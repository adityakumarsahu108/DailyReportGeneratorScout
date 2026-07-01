/*
==========================================
Daily Report Generator
utils.js
Version 0.1
==========================================
*/


/*
==========================================
Read CSV File
==========================================
*/

function readCSV(file) {

    return new Promise((resolve, reject) => {

        if (!file) {
            reject("No file selected.");
            return;
        }

        const reader = new FileReader();

        reader.onload = function (event) {

            try {

                const csv = event.target.result;

                const rows = csv
                    .replace(/\r/g, "")
                    .split("\n")
                    .filter(row => row.trim() !== "");

                if (rows.length <= 1) {
                    reject("CSV contains no data.");
                    return;
                }

                const delimiter =
                    rows[0].includes("\t") ? "\t" : ",";

                const headers = parseCSVLine(rows[0], delimiter);

                const data = [];

                for (let i = 1; i < rows.length; i++) {

                    const values = parseCSVLine(rows[i], delimiter);
                    const obj = {};

                    headers.forEach((header, index) => {

                        const cleanHeader = header
                            .replace(/^\uFEFF/, "")
                            .trim();

                        obj[cleanHeader] = values[index]
                            ? values[index].trim()
                            : "";

                    });

                    data.push(obj);

                }
                console.log("Detected delimiter:", delimiter);
                console.log("Headers:", headers);
                console.log("First record:", data[0]);
                resolve(data);

            } catch (e) {

                reject("Unable to read CSV.");

            }

        };

        reader.onerror = () => {

            reject("Unable to read file.");

        };

        reader.readAsText(file);

    });

}



/*
==========================================
Parse CSV / TSV Line
Handles commas or tabs inside quotes
==========================================
*/

function parseCSVLine(line, delimiter = ",") {

    const result = [];

    let current = "";

    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {

        const char = line[i];

        if (char === '"') {

            insideQuotes = !insideQuotes;
            continue;

        }

        if (char === delimiter && !insideQuotes) {

            result.push(current);
            current = "";
            continue;

        }

        current += char;

    }

    result.push(current);

    return result;

}

/*
==========================================
Today's Date
==========================================
*/

function getToday() {

    return new Date();

}



/*
==========================================
Yesterday
==========================================
*/

function getYesterday() {

    const date = new Date();

    date.setDate(date.getDate() - 1);

    return date;

}



/*
==========================================
Month Name
==========================================
*/

function getMonthName(month) {

    const months = [

        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"

    ];

    return months[month];

}



/*
==========================================
Ordinal
1st
2nd
3rd
==========================================
*/

function getOrdinal(day) {

    if (day > 3 && day < 21) return "th";

    switch (day % 10) {

        case 1:
            return "st";

        case 2:
            return "nd";

        case 3:
            return "rd";

        default:
            return "th";

    }

}



/*
==========================================
24th June 2026
==========================================
*/

function formatDisplayDate(date) {

    const day = date.getDate();

    const month = getMonthName(date.getMonth());

    const year = date.getFullYear();

    return `${day}${getOrdinal(day)} ${month} ${year}`;

}



/*
==========================================
Email Subject
==========================================
*/

function generateSubject() {

    return `Daily Report | ${formatDisplayDate(getYesterday())}`;

}



/*
==========================================
Reporting Window
==========================================
*/

function generateReportingWindow() {

    const yesterday = formatDisplayDate(getYesterday());

    const today = formatDisplayDate(getToday());

    return {

        from: `${yesterday}, 00:00 AM IST`,

        to: `${today}, 02:00 AM IST`

    };

}



/*
==========================================
Escape HTML
==========================================
*/

function escapeHTML(text) {

    if (!text) return "";

    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}



/*
==========================================
Copy HTML
==========================================
*/

async function copyHTML(html) {

    try {

        await navigator.clipboard.write([

            new ClipboardItem({

                "text/html": new Blob([html], {

                    type: "text/html"

                })

            })

        ]);

        return true;

    } catch {

        return false;

    }

}



/*
==========================================
Progress Indicator
==========================================
*/

function setProgress(step) {

    const upload = document.getElementById("progressUpload");

    const generate = document.getElementById("progressGenerate");

    const copy = document.getElementById("progressCopy");

    upload.classList.remove("active");

    generate.classList.remove("active");

    copy.classList.remove("active");

    if (step >= 1) upload.classList.add("active");

    if (step >= 2) generate.classList.add("active");

    if (step >= 3) copy.classList.add("active");

}



/*
==========================================
Status Text
==========================================
*/

function setStatus(id, text, type = "success") {

    const element = document.getElementById(id);

    element.className = "";

    element.classList.add(type);

    element.textContent = text;

}



/*
==========================================
Preview
==========================================
*/

function setPreview(html) {

    document.getElementById("preview").innerHTML = html;

}