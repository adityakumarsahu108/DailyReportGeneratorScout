/*
==========================================
Daily Report Generator
app.js
Version 1.0
==========================================
*/

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

/*
==========================================
Initialize
==========================================
*/

generateBtn.disabled = true;
copyBtn.disabled = true;
excelBtn.disabled = true;
setProgress(0);

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
Cyera Upload
==========================================
*/

cyeraInput.addEventListener("change", async () => {

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
Remove Buttons
==========================================
*/

removeCyeraBtn.addEventListener("click", () => {

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

    const cyeraPivotObject =
        generateCyeraPivot(cyeraData);

    const purviewPivotObject =
        generatePurviewPivot(purviewData);

    const report = {

        subject: generateSubject(),

        reportFrom: generateReportingWindow().from,

        reportTo: generateReportingWindow().to,

        sharePointLink:
            sharePointInput.value.trim(),

        cyeraPivotObject,

        purviewPivotObject,

        cyeraTable:
            pivotToHTML(cyeraPivotObject),

        purviewTable:
            pivotToHTML(purviewPivotObject),

        wizImage: wizImageURL

    };

    generatedHTML = generateReport(report);

    setPreview(generatedHTML);

    window.currentReport = report;

    copyBtn.disabled = false;
    excelBtn.disabled = false;

    setProgress(2);

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
            "Preview not found."
        );

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
                "Unable to copy report."
            );

            return;

        }
        const toRecipients = getToRecipients();

        if (toRecipients.length === 0) {

            alert(
                "Please add at least one To recipient in Settings before sending the report."
            );

            document
                .getElementById("settingsOverlay")
                .classList.add("open");

            return;
        }

        const to = toRecipients.join(";");
        const cc = getCCRecipients().join(";");
        const subject = generateSubject();

        setTimeout(() => {

            window.location.href =

                `mailto:${to}?cc=${encodeURIComponent(cc)}&subject=${encodeURIComponent(subject)}`;

        }, 300);

        setProgress(3);

        showSavedIndicator(

            "Outlook Opened",

            "Report copied successfully.\nPress Ctrl + V in Outlook and click Send."

        );

    }

    catch (err) {

        console.error(err);

        showSavedIndicator(
            "Error",
            "Unable to copy report."
        );

    }

});
excelBtn.addEventListener("click", () => {

    if (!window.currentReport) {

        alert(

            "Generate report first."

        );

        return;

    }

    exportSharePointExcel(

        window.currentReport

    );

});