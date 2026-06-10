  export default async function onRequest(context) {
    // 1. Setup CORS Headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
  
    // 2. Handle Browser Preflight Options Request
    if (context.request.method === "OPTIONS") {
      return new Response(null, { 
        status: 200, 
        headers: corsHeaders 
      });
    }
  
    try {
      // 3. Extract query parameters from Cloudflare request URL
      const urlObj = new URL(context.request.url);
      const id = urlObj.searchParams.get("id");
      const s = urlObj.searchParams.get("s");
      const e = urlObj.searchParams.get("e");
  
      // 4. Data Validation Guard
      if (!id) {
        return new Response(JSON.stringify({ error: "missing id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
  
      // 5. Dynamic URL Construction
      const targetUrl = s && e
        ? `https://movish.net/moviebox-embed/tv/${id}/${s}/${e}`
        : `https://movish.net/moviebox-embed/movie/${id}`;
  
      // 6. Fetch Target Page Content with Spoofed User-Agent
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    const html = await response.text();
  
      // 7. Extract STREAMS array using Regular Expression
      const match = html.match(/const\s+STREAMS\s*=\s*(\[[\s\S]*?\]);/);
  
      if (!match) {
        return new Response(JSON.stringify({ error: "not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
  
      // 8. Parse JSON and clean escaped slashes (\/) from the URLs
      const streams = JSON.parse(match[1]);
  
      return new Response(JSON.stringify({ streams }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
  
    } catch (err) {
      // 9. Global Exception Safety Net
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
