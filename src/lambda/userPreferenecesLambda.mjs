const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const handler = async (event) => {
    console.log("=== Lambda triggered ===");
    console.log("Raw event:", JSON.stringify(event, null, 2));

    const corsHeaders = {
        "Access-Control-Allow-Origin": "https://allergycondition.com", // restrict to your domain
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET,DELETE",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    try {
        const method = event.httpMethod;
        console.log("httpMethod received:", method);

        // --- Handle CORS preflight ---
        if (method === "OPTIONS") {
            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({ message: "CORS preflight OK" }),
            };
        }

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
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({ error: "Missing email or userPreference" }),
                };
            }

            const payload = [
                {
                    email,
                    userpreference: userPreference,
                    updated_at: new Date().toISOString(),
                },
            ];

            const supabaseUrl = `${SUPABASE_URL}/rest/v1/user_allergen_preferences?on_conflict=email`;
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

            const data = await response.json().catch(() => null);
            if (!response.ok) {
                return {
                    statusCode: 500,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        error: "Supabase request failed",
                        details: data,
                    }),
                };
            }

            return {
                statusCode: 200,
                headers: corsHeaders,
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

            if (!email) {
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({ error: "Missing email query parameter" }),
                };
            }

            const supabaseUrl = `${SUPABASE_URL}/rest/v1/user_allergen_preferences?email=eq.${encodeURIComponent(
                email
            )}`;
            const response = await fetch(supabaseUrl, {
                method: "GET",
                headers: {
                    apikey: SUPABASE_SERVICE_ROLE_KEY,
                    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                },
            });

            const data = await response.json().catch(() => null);
            if (!response.ok) {
                return {
                    statusCode: 500,
                    headers: corsHeaders,
                    body: JSON.stringify({ error: "Supabase GET failed", details: data }),
                };
            }

            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({ message: "Fetched successfully", data }),
            };
        }

        // --- DELETE: Remove by email ---
        if (method === "DELETE") {
            const email =
                event.queryStringParameters && event.queryStringParameters.email;

            if (!email) {
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({ error: "Missing email query parameter" }),
                };
            }

            const supabaseUrl = `${SUPABASE_URL}/rest/v1/user_allergen_preferences?email=eq.${encodeURIComponent(
                email
            )}`;
            const response = await fetch(supabaseUrl, {
                method: "DELETE",
                headers: {
                    apikey: SUPABASE_SERVICE_ROLE_KEY,
                    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                },
            });

            const data = await response.text(); // DELETE often returns empty body
            if (!response.ok) {
                return {
                    statusCode: 500,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        error: "Supabase DELETE failed",
                        details: data,
                    }),
                };
            }

            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({ message: "Deleted successfully" }),
            };
        }

        // --- Method not allowed ---
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ error: "Method Not Allowed" }),
        };
    } catch (err) {
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                error: "Internal Server Error",
                details: err.message,
            }),
        };
    }
};
