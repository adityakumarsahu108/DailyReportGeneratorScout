/*
==========================================
Daily Report Generator
wordGenerator.js
Part 1
==========================================
*/

const {

    Document,
    Paragraph,
    HeadingLevel,
    TextRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    AlignmentType,
    ImageRun,
    Packer

} = docx;

/*
==========================================
Main Function
==========================================
*/

async function exportWordReport(report) {

    const children = [];

    // Subject
    children.push(createSubject(report.subject));

    // Greeting
    children.push(createGreeting());

    // Intro
    children.push(
        createIntro(
            report.reportFrom,
            report.reportTo
        )
    );

    // SharePoint
    if (report.sharePointLink) {

        children.push(
            createSharePointSection(
                report.sharePointLink
            )
        );

    }

    // Purview

    children.push(
        createHeading("Purview Alerts")
    );

    children.push(
        createPivotTable(
            report.purviewPivotObject
        )
    );

    children.push(
        createPurviewTicketTable()
    );

    // Cyera

    children.push(
        createHeading("Cyera DLP")
    );

    children.push(
        createCyeraDescription()
    );

    children.push(
        createPivotTable(
            report.cyeraPivotObject
        )
    );

    // Wiz

    children.push(
        createHeading("Wiz.io Dashboard")
    );

    if (report.wizImage) {

        children.push(
            await createWizImage(
                report.wizImage
            )
        );

    }

    children.push(
        createWizTicketTable()
    );

    const doc = new Document({

        sections: [

            {

                children

            }

        ]

    });

    const blob =
        await Packer.toBlob(doc);

    downloadBlob(

        blob,

        `${report.subject}.docx`

    );

}

/*
==========================================
Download
==========================================
*/

function downloadBlob(blob, filename) {

    const url =
        URL.createObjectURL(blob);

    const a =
        document.createElement("a");

    a.href = url;

    a.download = filename;

    a.click();

    URL.revokeObjectURL(url);

}

/*
==========================================
Heading
==========================================
*/

function createHeading(text) {

    return new Paragraph({

        heading: HeadingLevel.HEADING_2,

        children: [

            new TextRun({

                text,

                bold: true

            })

        ]

    });

}

/*
==========================================
Subject
==========================================
*/

function createSubject(subject) {

    return new Paragraph({

        heading: HeadingLevel.HEADING_1,

        spacing: {

            after: 300

        },

        children: [

            new TextRun({

                text: subject,

                bold: true

            })

        ]

    });

}

/*
==========================================
Greeting
==========================================
*/

function createGreeting() {

    return new Paragraph({

        spacing: {

            after: 250

        },

        children: [

            new TextRun({

                text: "Hi Eric,"

            })

        ]

    });

}

/*
==========================================
Intro
==========================================
*/

function createIntro(

    from,

    to

) {

    return new Paragraph({

        spacing: {

            after: 250

        },

        children: [

            new TextRun({

                text:
                    "Please find attached the daily report covering the period from "

            }),

            new TextRun({

                text: from,

                bold: true

            }),

            new TextRun({

                text: " to "

            }),

            new TextRun({

                text: to,

                bold: true

            }),

            new TextRun({

                text: "."

            })

        ]

    });

}

/*
==========================================
SharePoint
==========================================
*/

function createSharePointSection(link){

    return new Paragraph({

        spacing:{
            after:250
        },

        children:[

            new TextRun({

                text:
                "In addition, data has been successfully uploaded at SharePoint site.\n",

            }),

            new TextRun({

                text:link,

                underline:{},

                color:"0563C1"

            })

        ]

    });

}
/*
==========================================
Pivot Table
==========================================
*/

function createPivotTable(pivot) {

    if (!pivot) {
        return new Paragraph({
            children: [
                new TextRun("No Data")
            ]
        });
    }

    const rows = [];

    // Header
    rows.push(

        new TableRow({

            tableHeader: true,

            children: [

                createHeaderCell("Row Labels"),

                ...pivot.columns.map(column =>
                    createHeaderCell(column)
                ),

                createHeaderCell("Grand Total")

            ]

        })

    );

    const grandTotals = {};

    let overallTotal = 0;

    Object.keys(pivot.rows)
        .sort()
        .forEach(rowLabel => {

            const cells = [];

            let rowTotal = 0;

            cells.push(
                createCell(rowLabel, true)
            );

            pivot.columns.forEach(column => {

                const value =
                    pivot.rows[rowLabel][column] || 0;

                rowTotal += value;

                overallTotal += value;

                grandTotals[column] =
                    (grandTotals[column] || 0) + value;

                cells.push(
                    createCell(
                        value === 0 ? "" : value.toString()
                    )
                );

            });

            cells.push(
                createCell(
                    rowTotal.toString(),
                    true
                )
            );

            rows.push(

                new TableRow({

                    children: cells

                })

            );

        });

    // Grand Total Row

    const totalCells = [];

    totalCells.push(
        createHeaderCell("Grand Total")
    );

    pivot.columns.forEach(column => {

        totalCells.push(

            createHeaderCell(

                (grandTotals[column] || 0).toString()

            )

        );

    });

    totalCells.push(

        createHeaderCell(

            overallTotal.toString()

        )

    );

    rows.push(

        new TableRow({

            children: totalCells

        })

    );

    return new Table({

        width: {

            size: 100,

            type: WidthType.PERCENTAGE

        },

        rows

    });

}

/*
==========================================
Header Cell
==========================================
*/

function createHeaderCell(text) {

    return new TableCell({

        shading: {

            fill: "D9EAD3"

        },

        children: [

            new Paragraph({

                children: [

                    new TextRun({

                        text,

                        bold: true

                    })

                ]

            })

        ]

    });

}

/*
==========================================
Normal Cell
==========================================
*/

function createCell(text, bold = false) {

    return new TableCell({

        children: [

            new Paragraph({

                children: [

                    new TextRun({

                        text,

                        bold

                    })

                ]

            })

        ]

    });

}
/*
==========================================
Cyera Description
==========================================
*/

function createCyeraDescription() {

    return new Paragraph({

        spacing: {
            before: 200,
            after: 200
        },

        children: [

            new TextRun({

                text:
                    "Below is the pivot table pulled from Cyera, reflecting the report and the work completed so far.",

            })

        ]

    });

}

/*
==========================================
Purview Ticket Table
==========================================
*/

function createPurviewTicketTable() {

    return createTicketTable(

        [
            "Issue Severity",
            "Alert Name",
            "Ticket",
            "Status",
            "Date & Time",
            "Comment"
        ],

        [

            ["High", "NA", "NA", "NA", "NA", "NA"],

            ["Medium", "NA", "NA", "NA", "NA", "NA"],

            ["Low", "NA", "NA", "NA", "NA", "NA"]

        ]

    );

}

/*
==========================================
Wiz Ticket Table
==========================================
*/

function createWizTicketTable() {

    return createTicketTable(

        [
            "Issue Severity",
            "Rule Name",
            "Ticket",
            "Status",
            "Date & Time",
            "Comment"
        ],

        [

            ["Critical", "NA", "None", "NA", "NA", "NA"],

            ["High", "NA", "None", "NA", "NA", "NA"]

        ]

    );

}

/*
==========================================
Generic Ticket Table
==========================================
*/

function createTicketTable(headers, rows) {

    const tableRows = [];

    tableRows.push(

        new TableRow({

            tableHeader: true,

            children:

                headers.map(header =>

                    createHeaderCell(header)

                )

        })

    );

    rows.forEach(row => {

        tableRows.push(

            new TableRow({

                children:

                    row.map(value =>

                        createCell(value)

                    )

            })

        );

    });

    return new Table({

        width: {

            size: 100,

            type: WidthType.PERCENTAGE

        },

        rows: tableRows

    });

}
/*
==========================================
Create Wiz Image
==========================================
*/

async function createWizImage(imageUrl) {

    const response = await fetch(imageUrl);

    const buffer = await response.arrayBuffer();

    return new Paragraph({

        spacing: {
            before: 200,
            after: 200
        },

        alignment: AlignmentType.CENTER,

        children: [

            new ImageRun({

                data: buffer,

                transformation: {

                    width: 650,

                    height: 360

                }

            })

        ]

    });

}

/*
==========================================
Table Borders
==========================================
*/

const DEFAULT_BORDERS = {

    top: {
        style: BorderStyle.SINGLE,
        size: 1,
        color: "BFBFBF"
    },

    bottom: {
        style: BorderStyle.SINGLE,
        size: 1,
        color: "BFBFBF"
    },

    left: {
        style: BorderStyle.SINGLE,
        size: 1,
        color: "BFBFBF"
    },

    right: {
        style: BorderStyle.SINGLE,
        size: 1,
        color: "BFBFBF"
    },

    insideHorizontal: {
        style: BorderStyle.SINGLE,
        size: 1,
        color: "D9D9D9"
    },

    insideVertical: {
        style: BorderStyle.SINGLE,
        size: 1,
        color: "D9D9D9"
    }

};

/*
==========================================
Override createCell
Replace the previous createCell()
==========================================
*/

function createCell(text, bold = false) {

    return new TableCell({

        borders: DEFAULT_BORDERS,

        verticalAlign: "center",

        children: [

            new Paragraph({

                alignment:
                    isNaN(text) || text === ""
                        ? AlignmentType.LEFT
                        : AlignmentType.CENTER,

                children: [

                    new TextRun({

                        text: String(text),

                        bold

                    })

                ]

            })

        ]

    });

}

/*
==========================================
Override createHeaderCell
Replace the previous version
==========================================
*/

function createHeaderCell(text) {

    return new TableCell({

        borders: DEFAULT_BORDERS,

        shading: {

            fill: "E2F0D9"

        },

        children: [

            new Paragraph({

                alignment: AlignmentType.CENTER,

                children: [

                    new TextRun({

                        text,

                        bold: true

                    })

                ]

            })

        ]

    });

}