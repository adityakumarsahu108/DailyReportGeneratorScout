import { supabase } from "./supabase.js";

class Tracker {

    constructor() {

        this.userId = null;
        this.sessionId = null;

        this.heartbeatInterval = null;
        this.sessionStart = null;

    }

    async init() {

        this.generateUserId();

        this.generateSessionId();

        await this.registerUser();

        console.log("User:", this.userId);

        console.log("Session:", this.sessionId);

        await this.registerSession();
        this.sessionStart = Date.now();

        this.startHeartbeat();

        window.addEventListener("beforeunload", () => {
            this.setOffline();
        });
        window.addEventListener("beforeunload", () => {
            this.endSession();
        });

        window.addEventListener("error", (event) => {

            this.trackError({

                message: event.message,

                filename: event.filename,

                lineno: event.lineno,

                colno: event.colno,

                stack: event.error?.stack || null

            });

        });

        window.addEventListener("unhandledrejection", (event) => {

            this.trackError({

                message: event.reason?.message || String(event.reason),

                filename: "",

                lineno: null,

                colno: null,

                stack: event.reason?.stack || null

            });

        });


    }

    async track(eventName, details = {}) {

        const now = new Date().toISOString();

        const { error } = await supabase
            .from("events")
            .insert({
                event: eventName,
                details: details,
                anonymous_id: this.userId,
                session_id: this.sessionId,
                created_at: now
            });

        if (error) {
            console.error("❌ Event tracking failed:", error);
        } else {
            console.log("✅ Event tracked:", eventName);
        }

        // Update user's last activity
        await supabase
            .from("users")
            .update({
                last_activity: now
            })
            .eq("anonymous_id", this.userId);

    }


    generateUserId() {

        let id = localStorage.getItem("anonymousUserId");

        if (!id) {

            id = crypto.randomUUID();

            localStorage.setItem(
                "anonymousUserId",
                id
            );

        }

        this.userId = id;

    }
    generateSessionId() {

        this.sessionId = crypto.randomUUID();

    }

    getBrowser() {

        const ua = navigator.userAgent;

        if (ua.includes("Edg")) return "Microsoft Edge";
        if (ua.includes("Chrome")) return "Google Chrome";
        if (ua.includes("Firefox")) return "Firefox";
        if (ua.includes("Safari")) return "Safari";

        return "Unknown";

    }

    getPlatform() {

        return navigator.platform;

    }
    async registerUser() {

        const now = new Date().toISOString();

        const { error } = await supabase
            .from("users")
            .upsert(
                {
                    anonymous_id: this.userId,
                    first_seen: now,
                    last_seen: now,
                    last_activity: now,
                    browser: this.getBrowser(),
                    platform: this.getPlatform(),
                    version: "1.0.0",
                    session_id: this.sessionId,
                    is_online: true
                },
                {
                    onConflict: "anonymous_id"
                }
            );

        if (error) {
            console.error("Register User Error:", error);
        } else {
            console.log("✅ User Synced");
        }

    }
    startHeartbeat() {

        this.heartbeatInterval = setInterval(async () => {

            const now = new Date().toISOString();

            // Update user
            await supabase
                .from("users")
                .update({
                    last_activity: now
                })
                .eq("anonymous_id", this.userId);

            // Update session
            await supabase
                .from("sessions")
                .update({
                    last_activity: now
                })
                .eq("session_id", this.sessionId);

        }, 60000);

    }

    async setOffline() {

        const { error } = await supabase
            .from("users")
            .update({
                is_online: false
            })
            .eq("anonymous_id", this.userId);

        if (error) {
            console.error("Failed to set offline", error);
        } else {
            console.log("👋 User went offline");
        }

    }

    async registerSession() {

        const { error } = await supabase
            .from("sessions")
            .insert({
                anonymous_id: this.userId,
                session_id: this.sessionId,
                browser: this.getBrowser(),
                platform: this.getPlatform(),
                app_version: "1.0.0"
            });

        if (error) {
            console.error("Session registration failed", error);
        } else {
            console.log("🟢 Session started");
        }

    }

    async endSession() {

        const duration = Math.floor(
            (Date.now() - this.sessionStart) / 1000
        );

        const { error } = await supabase
            .from("sessions")
            .update({
                ended_at: new Date().toISOString(),
                duration_seconds: duration
            })
            .eq("session_id", this.sessionId);

        if (error) {
            console.error(error);
        }

    }
    async trackError(errorInfo) {

        const { error } = await supabase
            .from("errors")
            .insert({

                anonymous_id: this.userId,
                session_id: this.sessionId,

                browser: this.getBrowser(),
                platform: this.getPlatform(),

                message: errorInfo.message,

                filename: errorInfo.filename,

                lineno: errorInfo.lineno,

                colno: errorInfo.colno,

                stack: errorInfo.stack

            });

        if (error) {
            console.error("Error logging failed", error);
        } else {
            console.log("🚨 Error logged");
        }

    }
}

export const tracker = new Tracker();