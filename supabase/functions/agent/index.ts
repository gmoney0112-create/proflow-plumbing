import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

const API_CATALOG_URL = "https://horqwtdcsfynbjhxbsrv.supabase.co/functions/v1/api-catalog";

const tools = [
  {
    name: "search_api_catalog",
    description:
      "Search the API catalog for APIs matching a query. Returns a list of APIs with name, category, description, homepage URL, and auth type.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search term to find relevant APIs" },
        category: { type: "string", description: "Optional category filter" },
        limit: { type: "number", description: "Max results (default 10)" },
      },
      required: ["query"],
    },
  },
];

async function searchApiCatalog(query: string, category?: string, limit = 10) {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  if (category) params.set("category", category);
  const res = await fetch(`${API_CATALOG_URL}/apis?${params}`);
  if (!res.ok) throw new Error(`API catalog error ${res.status}: ${await res.text()}`);
  return res.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not set in Edge Function secrets" }),
        { status: 500, headers: corsHeaders }
      );
    }

    let body: { message?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON. Send: {"message":"your question"}' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const userMessage = body.message;
    if (!userMessage || typeof userMessage !== "string") {
      return new Response(
        JSON.stringify({ error: 'Missing field: message' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const messages: Array<{ role: string; content: unknown }> = [
      { role: "user", content: userMessage },
    ];
    let finalResponse = "";

    for (let i = 0; i < 5; i++) {
      const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          system:
            "You are a helpful API discovery assistant. Use search_api_catalog to find relevant APIs and provide clear recommendations with name, description, and URL.",
          tools,
          messages,
        }),
      });

      if (!claudeRes.ok) {
        const errText = await claudeRes.text();
        return new Response(
          JSON.stringify({ error: `Anthropic API error ${claudeRes.status}: ${errText}` }),
          { status: 500, headers: corsHeaders }
        );
      }

      const data = await claudeRes.json();

      if (data.stop_reason === "end_turn") {
        finalResponse =
          data.content?.find((b: { type: string }) => b.type === "text")?.text ?? "No response.";
        break;
      }

      if (data.stop_reason === "tool_use") {
        const toolUses =
          data.content?.filter((b: { type: string }) => b.type === "tool_use") ?? [];
        if (!toolUses.length) {
          finalResponse = "No tool use found.";
          break;
        }
        messages.push({ role: "assistant", content: data.content });
        const results = [];
        for (const tu of toolUses) {
          let content: string;
          try {
            const inp = tu.input as { query: string; category?: string; limit?: number };
            content = JSON.stringify(await searchApiCatalog(inp.query, inp.category, inp.limit));
          } catch (e) {
            content = JSON.stringify({ error: e instanceof Error ? e.message : String(e) });
          }
          results.push({ type: "tool_result", tool_use_id: tu.id, content });
        }
        messages.push({ role: "user", content: results });
      } else {
        finalResponse =
          data.content?.find((b: { type: string }) => b.type === "text")?.text ??
          `stop_reason: ${data.stop_reason}`;
        break;
      }
    }

    if (!finalResponse) finalResponse = "Max iterations reached.";
    return new Response(JSON.stringify({ response: finalResponse }), { headers: corsHeaders });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: corsHeaders }
    );
  }
});
