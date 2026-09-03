/*
==========================================
Daily Report Generator
app.js
Version 1.1
==========================================
*/
import { tracker } from "./tracker.js";
import { buildDailyReportData } from "./dataBuilder.js";
import {
    sendDailyReport
} from "./api.js";
const cyeraInput = document.getElementById("cyeraFile");
const purviewInput = document.getElementById("purviewFile");
const wizInput = document.getElementById("wizImage");

const removeCyeraBtn = document.getElementById("removeCyera");
const removePurviewBtn = document.getElementById("removePurview");
const removeWizBtn = document.getElementById("removeWiz");

const generateBtn = document.getElementById("generateBtn");
const copyBtn = document.getElementById("copyBtn");
const excelBtn =
    document.getElementById("excelBtn");

const sharePointInput = document.getElementById("sharepointLink");

let cyeraData = [];
let purviewData = [];

let cyeraValid = false;
let purviewValid = false;

let generatedHTML = "";
let wizImageURL = "";

// Stale-report guard: once a report has been generated, changing any
// source (a file, or the SharePoint link) should re-lock Copy/Export
// rather than let someone send a report that no longer matches what's
// uploaded.
let reportIsCurrent = false;

/*
==========================================
Initialize
==========================================
*/

generateBtn.disabled = true;
copyBtn.disabled = true;
excelBtn.disabled = true;
setProgress(0);
setPreviewState("Not generated", "idle");
await tracker.init();

/*
==========================================
Enable Generate Button
==========================================
*/

function updateGenerateButton() {

    generateBtn.disabled = !(cyeraValid && purviewValid);

    if (cyeraValid && purviewValid) {

        setProgress(1);

    } else {

        setProgress(0);

    }

}

/*
==========================================
Stale-report guard

Called any time a source changes (file swapped/removed, SharePoint
link edited). If a report was already generated from the old
sources, lock Copy/Export back down until it's regenerated.
==========================================
*/

function markReportStale() {

    if (!reportIsCurrent) return;

    reportIsCurrent = false;

    copyBtn.disabled = true;
    excelBtn.disabled = true;

    setPreviewState("Needs regeneration", "stale");

    showSavedIndicator(
        "Report out of date",
        "A source changed after this report was generated. Regenerate before sending.",
        "warning"
    );

}

/*
==========================================
Drag & Drop

The .file-drop label already has drag-over styling in style.css —
this wires up the matching behavior. Dropped files are pushed
through the same "change" event the existing listeners already
handle, so validation logic doesn't need to change.
==========================================
*/

function attachDragAndDrop(fileInput) {

    const dropLabel = fileInput.closest(".file-drop");

    if (!dropLabel) return;

    ["dragenter", "dragover"].forEach(eventName => {

        dropLabel.addEventListener(eventName, (e) => {

            e.preventDefault();
            e.stopPropagation();

            dropLabel.classList.add("drag-over");

        });

    });

    ["dragleave", "dragend"].forEach(eventName => {

        dropLabel.addEventListener(eventName, (e) => {

            e.preventDefault();
            e.stopPropagation();

            dropLabel.classList.remove("drag-over");

        });

    });

    dropLabel.addEventListener("drop", (e) => {

        e.preventDefault();
        e.stopPropagation();

        dropLabel.classList.remove("drag-over");

        const file = e.dataTransfer.files && e.dataTransfer.files[0];

        if (!file) return;

        // Can't assign a dropped FileList directly to an <input>, so
        // rebuild one via DataTransfer, then dispatch "change" so the
        // existing upload handlers run exactly as if the user had
        // picked the file through the file browser.
        const transfer = new DataTransfer();

        transfer.items.add(file);

        fileInput.files = transfer.files;

        fileInput.dispatchEvent(new Event("change", { bubbles: true }));

    });

}

attachDragAndDrop(cyeraInput);
attachDragAndDrop(purviewInput);
attachDragAndDrop(wizInput);

/*
==========================================
Cyera Upload
==========================================
*/

cyeraInput.addEventListener("change", async () => {

    markReportStale();

    if (!cyeraInput.files.length)
        return;

    try {

        cyeraData = await readCSV(cyeraInput.files[0]);

        const validation = validateCyeraCSV(cyeraData);

        cyeraValid = validation.valid;

        setStatus(
            "cyeraStatus",
            validation.message,
            validation.valid ? "success" : "error"
        );

    } catch (err) {

        cyeraValid = false;

        setStatus(
            "cyeraStatus",
            err,
            "error"
        );

    }

    updateGenerateButton();

});

/*
==========================================
Purview Upload
==========================================
*/

purviewInput.addEventListener("change", async () => {

    markReportStale();

    if (!purviewInput.files.length)
        return;

    try {

        purviewData = await readCSV(purviewInput.files[0]);

        const validation = validatePurviewCSV(purviewData);

        purviewValid = validation.valid;

        setStatus(
            "purviewStatus",
            validation.message,
            validation.valid ? "success" : "error"
        );

    } catch (err) {

        purviewValid = false;

        setStatus(
            "purviewStatus",
            err,
            "error"
        );

    }

    updateGenerateButton();

});

/*
==========================================
Wiz Upload
==========================================
*/

wizInput.addEventListener("change", () => {

    markReportStale();

    if (!wizInput.files.length) {

        wizImageURL = "";

        setStatus(
            "wizStatus",
            "No Screenshot",
            "warning"
        );

        return;

    }

    const reader = new FileReader();

    reader.onload = function () {

        wizImageURL = reader.result;

        setStatus(
            "wizStatus",
            "✔ Screenshot Ready",
            "success"
        );

    };

    reader.readAsDataURL(wizInput.files[0]);

});

/*
==========================================
SharePoint link
==========================================
*/

sharePointInput.addEventListener("input", () => {

    markReportStale();

});

/*
==========================================
Remove Buttons
==========================================
*/

removeCyeraBtn.addEventListener("click", () => {

    markReportStale();

    cyeraInput.value = "";

    cyeraData = [];

    cyeraValid = false;

    setStatus(
        "cyeraStatus",
        "Waiting for CSV...",
        "warning"
    );

    updateGenerateButton();

});

removePurviewBtn.addEventListener("click", () => {

    markReportStale();

    purviewInput.value = "";

    purviewData = [];

    purviewValid = false;

    setStatus(
        "purviewStatus",
        "Waiting for CSV...",
        "warning"
    );

    updateGenerateButton();

});

removeWizBtn.addEventListener("click", () => {

    markReportStale();

    wizInput.value = "";

    wizImageURL = "";

    setStatus(
        "wizStatus",
        "No Screenshot",
        "warning"
    );

});

/*
==========================================
Generate Report
==========================================
*/

generateBtn.addEventListener("click", () => {

    /*
    ==========================================
    NEW:
    Build structured data first.
    
    This is independent from the Outlook
    presentation.
    ==========================================
    */

    const dailyReportData =
        buildDailyReportData(
            cyeraData,
            purviewData
        );


    /*
    ==========================================
    Existing Pivot Logic
    ==========================================
    */

    const cyeraPivotObject =
        generateCyeraPivot(cyeraData);

    const purviewPivotObject =
        generatePurviewPivot(purviewData);


    /*
    ==========================================
    Existing Outlook Report Object
    ==========================================
    */

    const report = {

        subject:
            generateSubject(),

        reportFrom:
            generateReportingWindow().from,

        reportTo:
            generateReportingWindow().to,

        sharePointLink:
            sharePointInput.value.trim(),

        cyeraPivotObject,

        purviewPivotObject,

        cyeraTable:
            pivotToHTML(
                cyeraPivotObject
            ),

        purviewTable:
            pivotToHTML(
                purviewPivotObject
            ),

        wizImage:
            wizImageURL

    };


    /*
    ==========================================
    Existing Outlook HTML generation
    ==========================================
    */

    generatedHTML =
        generateReport(report);

    setPreview(generatedHTML);


    /*
    ==========================================
    NEW:
    Store structured data separately.
    ==========================================
    */

    window.currentDailyReportData =
        dailyReportData;

    window.currentReport =
        report;

    /*
    ==========================================
    API Sync
    ==========================================
    */

    sendDailyReport(dailyReportData)
        .then(result => {

            console.log(
                "API Sync Result:",
                result
            );

        })
        .catch(error => {

            console.error(
                "API Sync Failed:",
                error
            );

        });
    /*
    ==========================================
    Existing button handling
    ==========================================
    */

    reportIsCurrent = true;

    copyBtn.disabled = false;
    excelBtn.disabled = false;

    setPreviewState("Ready to send", "ready");

    setProgress(2);


    /*
    ==========================================
    DEVELOPMENT DEBUG
    ==========================================
    */

    console.log(
        "Daily Report Data:",
        dailyReportData
    );

    console.log(
        "Daily Report JSON:",
        JSON.stringify(
            dailyReportData,
            null,
            2
        )
    );

});
/*
==========================================
Copy Report
==========================================
*/
copyBtn.addEventListener("click", () => {

    const preview = document.getElementById("preview");

    if (!preview) {

        showSavedIndicator(
            "Error",
            "Preview not found.",
            "error"
        );

        return;

    }

    const toRecipients = getToRecipients();

    if (toRecipients.length === 0) {

        showSavedIndicator(
            "Add a recipient first",
            "Open Settings and add at least one To recipient before sending.",
            "warning"
        );

        document
            .getElementById("settingsOverlay")
            .classList.add("open");

        return;
    }

    try {

        const selection = window.getSelection();

        selection.removeAllRanges();

        const range = document.createRange();

        range.selectNodeContents(preview);

        selection.addRange(range);

        const successful = document.execCommand("copy");

        selection.removeAllRanges();

        if (!successful) {

            showSavedIndicator(
                "Error",
                "Unable to copy report.",
                "error"
            );

            return;

        }

        const to = toRecipients.join(";");
        const cc = getCCRecipients().join(";");
        const subject = generateSubject();
        tracker.track("open_outlook");
        setTimeout(() => {

            window.location.href =

                `mailto:${to}?cc=${encodeURIComponent(cc)}&subject=${encodeURIComponent(subject)}`;

        }, 300);

        setProgress(3);

        showSavedIndicator(

            "Outlook Opened",

            "Report copied successfully.\nPress Ctrl + V in Outlook and click Send.",

            "success"

        );



    }

    catch (err) {

        console.error(err);

        showSavedIndicator(
            "Error",
            "Unable to copy report.",
            "error"
        );

    }

});

excelBtn.addEventListener("click", () => {

    if (!window.currentReport) {

        showSavedIndicator(
            "Nothing to export",
            "Generate report first.",
            "warning"
        );

        return;

    }

    exportSharePointExcel(

        window.currentReport

    );
    tracker.track("download_excel");

});