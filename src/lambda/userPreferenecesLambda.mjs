const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const handler = async (event) => {
    console.log("=== Lambda triggered ===");
    console.log("Raw event:", JSON.stringify(event, null, 2));
    console.log("Environment SUPABASE_URL:", SUPABASE_URL);
    console.log(
        "Environment SUPABASE_SERVICE_ROLE_KEY (length only):",
        SUPABASE_SERVICE_ROLE_KEY ? SUPABASE_SERVICE_ROLE_KEY.length : "NOT SET"
    );

    try {
        const method = event.httpMethod;
        console.log("httpMethod received:", method);

        // --- POST: Insert or Update (Upsert) ---
        if (method === "POST") {
            console.log("Raw event.body:", event.body);
            const body =
                typeof event.body === "string" ? JSON.parse(event.body) : event.body;
            console.log("Parsed body:", JSON.stringify(body, null, 2));

            const { email, userPreference } = body;
            console.log("Extracted email:", email);
            console.log(
                "Extracted userPreference:",
                JSON.stringify(userPreference, null, 2)
            );

            if (!email || !userPreference) {
                console.error("Validation failed: Missing email or userPreference");
                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        error: "Missing email or userPreference",
                    }),
                };
            }

            const payload = [
                {
                    email,
                    userpreference: userPreference,
                    updated_at: new Date().toISOString(),
                },
            ];
            console.log("Payload to Supabase:", JSON.stringify(payload, null, 2));

            const supabaseUrl = `${SUPABASE_URL}/rest/v1/user_allergen_preferences?on_conflict=email`;
            console.log("Supabase URL:", supabaseUrl);

            const response = await fetch(supabaseUrl, {
                method: "POST",
                headers: {
                    apikey: SUPABASE_SERVICE_ROLE_KEY,
                    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    "Content-Type": "application/json",
                    Prefer: "resolution=merge-duplicates,return=representation",
                },
                body: JSON.stringify(payload),
            });

            console.log("Supabase response status:", response.status);
            const data = await response.json().catch(() => null);
            console.log("Supabase response body:", JSON.stringify(data, null, 2));

            if (!response.ok) {
                console.error("Supabase error:", data);
                return {
                    statusCode: 500,
                    body: JSON.stringify({
                        error: "Supabase request failed",
                        details: data,
                    }),
                };
            }

            console.log("=== Success (POST) ===");
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: "User allergen preferences saved successfully",
                    data,
                }),
            };
        }

        // --- GET: Fetch by email ---
        if (method === "GET") {
            const email =
                event.queryStringParameters && event.queryStringParameters.email;
            console.log("GET request for email:", email);

            if (!email) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: "Missing email query parameter" }),
                };
            }

            const supabaseUrl = `${SUPABASE_URL}/rest/v1/user_allergen_preferences?email=eq.${encodeURIComponent(
                email
            )}`;
            console.log("Supabase URL (GET):", supabaseUrl);

            const response = await fetch(supabaseUrl, {
                method: "GET",
                headers: {
                    apikey: SUPABASE_SERVICE_ROLE_KEY,
                    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                },
            });

            console.log("Supabase response status:", response.status);
            const data = await response.json().catch(() => null);
            console.log("Supabase response body:", JSON.stringify(data, null, 2));

            if (!response.ok) {
                console.error("Supabase error:", data);
                return {
                    statusCode: 500,
                    body: JSON.stringify({ error: "Supabase GET failed", details: data }),
                };
            }

            return {
                statusCode: 200,
                body: JSON.stringify({ message: "Fetched successfully", data }),
            };
        }

        // --- DELETE: Remove by email ---
        if (method === "DELETE") {
            const email =
                event.queryStringParameters && event.queryStringParameters.email;
            console.log("DELETE request for email:", email);

            if (!email) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: "Missing email query parameter" }),
                };
            }

            const supabaseUrl = `${SUPABASE_URL}/rest/v1/user_allergen_preferences?email=eq.${encodeURIComponent(
                email
            )}`;
            console.log("Supabase URL (DELETE):", supabaseUrl);

            const response = await fetch(supabaseUrl, {
                method: "DELETE",
                headers: {
                    apikey: SUPABASE_SERVICE_ROLE_KEY,
                    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                },
            });

            console.log("Supabase response status:", response.status);
            const data = await response.text(); // DELETE often returns empty body
            console.log("Supabase response body:", data);

            if (!response.ok) {
                console.error("Supabase error:", data);
                return {
                    statusCode: 500,
                    body: JSON.stringify({
                        error: "Supabase DELETE failed",
                        details: data,
                    }),
                };
            }

            return {
                statusCode: 200,
                body: JSON.stringify({ message: "Deleted successfully" }),
            };
        }

        // --- Method not allowed ---
        console.warn("Unsupported httpMethod:", method);
        return {
            statusCode: 405,
            body: JSON.stringify({ error: "Method Not Allowed" }),
        };
    } catch (err) {
        console.error("Lambda error caught:", err);
        console.error("Stack trace:", err.stack);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Internal Server Error",
                details: err.message,
            }),
        };
    }
};
