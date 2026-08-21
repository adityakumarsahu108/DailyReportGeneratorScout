/*
==========================================
Daily Report Generator
api.js
Version 1.0

Purpose:
- Handle communication with the backend API.
- Does NOT contain report-generation logic.
- Keeps API configuration isolated.
==========================================
*/


const API_CONFIG = {

    /*
    Leave empty until our Cloudflare API
    is ready.
    */
    endpoint: "https://dailyreportgenbackend.adityakumarsahu108.workers.dev/api/v1/reports",

    /*
    Disabled until the backend exists.
    */
    enabled: true,

    /*
    Will be used later for authentication.
    */
    apiKey: ""

};


/*
==========================================
Send Daily Report
==========================================
*/

async function sendDailyReport(data) {

    /*
    API disabled during development.
    */

    if (!API_CONFIG.enabled) {

        console.log(
            "API sync is currently disabled."
        );

        console.log(
            "Payload that would be sent:",
            data
        );

        return {

            success: true,

            synced: false,

            reason: "API disabled"

        };

    }


    /*
    Validate endpoint
    */

    if (!API_CONFIG.endpoint) {

        throw new Error(
            "API endpoint is not configured."
        );

    }


    /*
    Prepare headers
    */

    const headers = {

        "Content-Type":
            "application/json"

    };


    /*
    Add authentication when configured.
    */

    if (API_CONFIG.apiKey) {

        headers["Authorization"] =
            `Bearer ${API_CONFIG.apiKey}`;

    }


    /*
    Send request
    */

    const response =
        await fetch(
            API_CONFIG.endpoint,
            {

                method: "POST",

                headers,

                body:
                    JSON.stringify(data)

            }
        );


    /*
    Handle failed HTTP response.
    */

  if (!response.ok) {

    let errorData = null;

    try {

        errorData = await response.json();

    } catch (error) {


    }

    throw new Error(
        errorData?.error ||
        errorData?.message ||
        `API request failed: ${response.status}`
    );
}


    /*
    Parse successful response.
    */

    const result =
        await response.json();


    return {

        success: true,

        synced: true,

        response: result

    };

}


/*
==========================================
Export
==========================================
*/

export {

    sendDailyReport,

    API_CONFIG

};