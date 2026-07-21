import { supabase } from "./supabase.js";

class Tracker {

    constructor() {

        this.userId = null;
        this.sessionId = null;

    }

  async init() {

    this.generateUserId();

    this.generateSessionId();

    await this.registerUser();

    console.log("Tracker initialized");

    console.log("User:", this.userId);

    console.log("Session:", this.sessionId);

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

    // Check if user already exists
    const { data: existingUser, error } = await supabase
        .from("users")
        .select("*")
        .eq("anonymous_id", this.userId)
        .maybeSingle();

    if (error) {
        console.error("Error checking user:", error);
        return;
    }

    if (!existingUser) {

        // First time user
        const { error: insertError } = await supabase
            .from("users")
            .insert({
                anonymous_id: this.userId,
                first_seen: now,
                last_seen: now,
                last_activity: now,
                browser: this.getBrowser(),
                platform: this.getPlatform(),
                version: "1.0.0",
                session_id: this.sessionId,
                is_online: true
            });

        if (insertError) {
            console.error("Insert failed:", insertError);
        } else {
            console.log("✅ New user registered");
        }

    } else {

        // Existing user
        const { error: updateError } = await supabase
            .from("users")
            .update({
                last_seen: now,
                last_activity: now,
                browser: this.getBrowser(),
                platform: this.getPlatform(),
                session_id: this.sessionId,
                is_online: true
            })
            .eq("anonymous_id", this.userId);

        if (updateError) {
            console.error("Update failed:", updateError);
        } else {
            console.log("✅ Existing user updated");
        }
    }
}

}

export const tracker = new Tracker();