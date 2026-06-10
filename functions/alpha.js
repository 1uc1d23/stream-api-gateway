export async function onRequest(context) {
  // Handle Preflight CORS Requests (OPTIONS)
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    });
  }

  const { searchParams } = new URL(context.request.url);
  const id = searchParams.get('id');
  const s = searchParams.get('s'); // Season number
  const e = searchParams.get('e'); // Episode number

  // Common response headers for JSON and CORS
  const responseHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  };

  // 1. Validation: Ensure an ID was passed in the URL
  if (!id) {
    return new Response(
      JSON.stringify({ error: "missing id" }), 
      { status: 400, headers: responseHeaders }
    );
  }

  // 2. Dynamic URL Construction for Movish.net
  const targetUrl = (s && e)
    ? `https://movish.net/moviebox-embed/tv/${id}/${s}/${e}`
    : `https://movish.net/moviebox-embed/movie/${id}`;

  try {
    // 3. Fetch Target Content with Browser Headers
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
      }
    });

    if (!response.ok) {
      throw new Error(`Target provider responded with status: ${response.status}`);
    }

    const html = await response.text();

    // 4. Extract STREAMS array using Regular Expression
    const match = html.match(/const\s+STREAMS\s*=\s*(\[[\s\S]*?\]);/);

    if (!match) {
      return new Response(
        JSON.stringify({ 
          error: "STREAMS array not found in HTML source.",
          snippet: html.slice(0, 300) // Returns a snippet to help you debug in the client if blocked
        }), 
        { status: 404, headers: responseHeaders }
      );
    }

    // 5. Parse the extracted block and return it
    const streams = JSON.parse(match[1]);

    return new Response(
      JSON.stringify({
        success: true,
        movieId: id,
        season: s || null,
        episode: e || null,
        streams: streams
      }),
      { status: 200, headers: responseHeaders }
    );

  } catch (error) {
    // Catch fetch/processing failures cleanly
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: responseHeaders }
    );
  }
}
