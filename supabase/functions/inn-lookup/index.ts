import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const DADATA_URL =
  "https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { inn } = await req.json();

    if (!inn || typeof inn !== "string" || !/^\d{10,12}$/.test(inn)) {
      return new Response(
        JSON.stringify({ error: "INN must be 10 or 12 digits" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("DADATA_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "DaData API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch(DADATA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Token ${apiKey}`,
      },
      body: JSON.stringify({ query: inn, branch_type: "MAIN" }),
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "DaData request failed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const suggestion = data.suggestions?.[0];

    if (!suggestion) {
      return new Response(
        JSON.stringify({ found: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        found: true,
        name: suggestion.data?.name?.short_with_opf || suggestion.value || "",
        full_name: suggestion.data?.name?.full_with_opf || "",
        kpp: suggestion.data?.kpp || "",
        inn: suggestion.data?.inn || inn,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
