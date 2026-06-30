/*
==========================================
Daily Report Generator
Excel Generator
Version 3.0
==========================================
*/

async function exportSharePointExcel(report){

    const workbook = new ExcelJS.Workbook();

    workbook.creator = "Daily Report Generator";

    workbook.created = new Date();

    const sheet = workbook.addWorksheet(

        "Daily Report",

        {

            views:[

                {

                    state:"frozen",

                    ySplit:1

                }

            ]

        }

    );

    /*
    ==========================================
    Default Font
    ==========================================
    */

    sheet.properties.defaultRowHeight = 22;

    sheet.columns = [

        {width:35},

        {width:18},

        {width:18},

        {width:18},

        {width:18},

        {width:20},

        {width:35}

    ];

    /*
    ==========================================
    Report Title
    ==========================================
    */

    sheet.mergeCells("A1:G1");

    const title = sheet.getCell("A1");

    title.value = report.subject;

    title.font = {

        bold:true,

        size:18,

        color:{argb:"FFFFFF"}

    };

    title.alignment = {

        horizontal:"center",

        vertical:"middle"

    };

    title.fill = {

        type:"pattern",

        pattern:"solid",

        fgColor:{argb:"1F4E78"}

    };

    sheet.getRow(1).height = 30;
    let currentRow = 3;

currentRow = addPurviewSection(
    sheet,
    currentRow,
    report.purviewPivotObject
);

currentRow = addCyeraSection(
    sheet,
    currentRow,
    report
);

    /*
    ==========================================
    Save Workbook
    ==========================================
    */

    const buffer = await workbook.xlsx.writeBuffer();

    const blob = new Blob(

        [buffer],

        {

            type:

            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

        }

    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download = `${report.subject}.xlsx`;

    a.click();

    URL.revokeObjectURL(url);

}
/*
==========================================
Purview Section
==========================================
*/

function addPurviewSection(sheet,row,pivot){

    /*
    Section Heading
    */

    sheet.mergeCells(`A${row}:G${row}`);

    const heading = sheet.getCell(`A${row}`);

    heading.value = "PURVIEW ALERTS";

    heading.font = {

        bold:true,

        color:{argb:"FFFFFF"},

        size:14

    };

    heading.fill = {

        type:"pattern",

        pattern:"solid",

        fgColor:{argb:"5B9BD5"}

    };

    heading.alignment = {

        horizontal:"left",

        vertical:"middle"

    };

    row += 2;

row = addPivotTable(

    sheet,

    row,

    pivot

);

row = addPurviewTicketTable(

    sheet,

    row

);

return row;

}

/*
==========================================
Cyera Section
==========================================
*/

function addCyeraSection(sheet,row,report){

    sheet.mergeCells(`A${row}:G${row}`);

    const heading = sheet.getCell(`A${row}`);

    heading.value = "CYERA DLP";

    heading.font = {

        bold:true,

        color:{argb:"FFFFFF"},

        size:14

    };

    heading.fill = {

        type:"pattern",

        pattern:"solid",

        fgColor:{argb:"5B9BD5"}

    };

    heading.alignment = {

        horizontal:"left",

        vertical:"middle"

    };

    row += 2;

    sheet.mergeCells(`A${row}:G${row}`);

    sheet.getCell(`A${row}`).value =
        `Below is the pivot table generated from Cyera, reflecting all alerts reviewed and work completed during the reporting period from ${report.reportFrom} to ${report.reportTo}.`;

    sheet.getCell(`A${row}`).alignment = {

        wrapText:true,

        vertical:"top"

    };

    row += 2;

    row = addPivotTable(

        sheet,

        row,

        report.cyeraPivotObject

    );

    row = addCyeraTicketTable(

        sheet,

        row

    );

    return row;

}
/*
==========================================
Pivot Table
==========================================
*/

function addPivotTable(sheet,row,pivot){

    const columns = pivot.columns;

    const rows = pivot.rows;

    /*
    Header
    */

    let header = [

        "Row Labels",

        ...columns,

        "Grand Total"

    ];

    let excelRow = sheet.getRow(row);

    excelRow.values = header;

    excelRow.eachCell(cell=>{

        cell.font={bold:true};

        cell.fill={

            type:"pattern",

            pattern:"solid",

            fgColor:{argb:"D9EAF7"}

        };

        cell.alignment={

            horizontal:"center",

            vertical:"middle"

        };

        cell.border={

            top:{style:"thin"},

            left:{style:"thin"},

            right:{style:"thin"},

            bottom:{style:"thin"}

        };

    });

    row++;

    let grandTotals={};

    let overall=0;

    Object.keys(rows).sort().forEach(user=>{

        let current=[];

        current.push(user);

        let rowTotal=0;

        columns.forEach(col=>{

            const value=rows[user][col]||0;

            current.push(value);

            rowTotal+=value;

            overall+=value;

            grandTotals[col]=(grandTotals[col]||0)+value;

        });

        current.push(rowTotal);

        excelRow=sheet.getRow(row);

        excelRow.values=current;

        excelRow.eachCell((cell,index)=>{

            cell.border={

                top:{style:"thin"},

                left:{style:"thin"},

                right:{style:"thin"},

                bottom:{style:"thin"}

            };

            if(index===1){

                cell.alignment={horizontal:"left"};

            }

            else{

                cell.alignment={horizontal:"center"};

            }

        });

        row++;

    });

    let total=["Grand Total"];

    columns.forEach(col=>{

        total.push(

            grandTotals[col]||0

        );

    });

    total.push(overall);

    excelRow=sheet.getRow(row);

    excelRow.values=total;

    excelRow.eachCell(cell=>{

        cell.font={bold:true};

        cell.fill={

            type:"pattern",

            pattern:"solid",

            fgColor:{argb:"D9EAF7"}

        };

        cell.border={

            top:{style:"thin"},

            left:{style:"thin"},

            right:{style:"thin"},

            bottom:{style:"thin"}

        };

        cell.alignment={

            horizontal:"center"

        };

    });

    return row+2;

}
/*
==========================================
Purview Ticket Table
==========================================
*/

function addPurviewTicketTable(sheet,row){

    sheet.mergeCells(`A${row}:G${row}`);

    let title = sheet.getCell(`A${row}`);

    title.value = "Tickets Raised if any";

    title.font = {

        bold:true,

        size:12,

        color:{argb:"000000"}

    };

    row += 2;

    const headers=[

        "Issue Severity",

        "Alert Name",

        "Ticket",

        "Status",

        "Date & Time",

        "Comment"

    ];

    let excelRow = sheet.getRow(row);

    excelRow.values=headers;

    excelRow.eachCell(cell=>{

        cell.font={

            bold:true

        };

        cell.fill={

            type:"pattern",

            pattern:"solid",

            fgColor:{argb:"D9EAF7"}

        };

        cell.border={

            top:{style:"thin"},

            left:{style:"thin"},

            right:{style:"thin"},

            bottom:{style:"thin"}

        };

        cell.alignment={

            horizontal:"center",

            vertical:"middle"

        };

    });

    row++;

const data = [

    ["High", "N/A", "N/A", "N/A", "N/A", "N/A"],

    ["Medium", "N/A", "N/A", "N/A", "N/A", "N/A"],

    ["Low", "N/A", "N/A", "N/A", "N/A", "N/A"]

];

    data.forEach(r=>{

        excelRow=sheet.getRow(row);

        excelRow.values=r;

        excelRow.eachCell((cell,index)=>{

            cell.border={

                top:{style:"thin"},

                left:{style:"thin"},

                right:{style:"thin"},

                bottom:{style:"thin"}

            };

            if(index===1){

                cell.font={bold:true};

                cell.alignment={horizontal:"center"};

            }

            else{

                cell.alignment={horizontal:"center"};

            }

        });

        row++;

    });

    return row+2;

}
/*
==========================================
Cyera Ticket Table
==========================================
*/

function addCyeraTicketTable(sheet,row){

    sheet.mergeCells(`A${row}:G${row}`);

    sheet.getCell(`A${row}`).value="Tickets Raised if any";

    sheet.getCell(`A${row}`).font={

        bold:true,

        size:12

    };

    row+=2;

    const headers=[

        "Issue Severity",

        "Rule Name",

        "Ticket",

        "Status",

        "Date & Time",

        "Comment"

    ];

    let excelRow=sheet.getRow(row);

    excelRow.values=headers;

    excelRow.eachCell(cell=>{

        cell.font={bold:true};

        cell.fill={

            type:"pattern",

            pattern:"solid",

            fgColor:{argb:"D9EAF7"}

        };

        cell.border={

            top:{style:"thin"},

            left:{style:"thin"},

            right:{style:"thin"},

            bottom:{style:"thin"}

        };

        cell.alignment={

            horizontal:"center"

        };

    });

    row++;

    [

        ["Critical","N/A","N/A","N/A","N/A","N/A"],

        ["High","N/A","N/A","N/A","N/A","N/A"]

    ].forEach(r=>{

        excelRow=sheet.getRow(row);

        excelRow.values=r;

        excelRow.eachCell(cell=>{

            cell.border={

                top:{style:"thin"},

                left:{style:"thin"},

                right:{style:"thin"},

                bottom:{style:"thin"}

            };

            cell.alignment={

                horizontal:"center"

            };

        });

        row++;

    });

    return row+2;

}