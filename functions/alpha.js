export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url);
  const id = searchParams.get('id');

  // 1. Validation: Ensure an ID was passed in the URL
  if (!id) {
    return new Response(
      JSON.stringify({ error: "Missing parameter 'id'. Example: /alpha?id=9502" }), 
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Target streaming provider URL
  const targetUrl = `https://vidsrc.me/embed/movie?id=${id}`;

  try {
    // 2. Fetch the external webpage safely using Cloudflare's runtime fetch
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!response.ok) {
      throw new Error(`Target provider responded with status: ${response.status}`);
    }

    const html = await response.text();

    // 3. Extract Stream Links using Regular Expressions (Regex)
    // This looks for standard source paths, iframe links, or .m3u8/.mp4 stream manifests
    const streamRegex = /(https?:\/\/[^\s"'`<>]+(?:\.m3u8|\.mp4|embed|source)[^\s"'`<>]*)/g;
    const matchedLinks = html.match(streamRegex) || [];

    // Clean up matches: Filter duplicates and clean trailing syntax noise
    const uniqueLinks = [...new Set(matchedLinks)].map(link => {
      return link.replace(/[\\'\x22]/g, ''); // Removes escaped slashes or stray quotes
    });

    // 4. Return the extracted links as JSON
    return new Response(
      JSON.stringify({
        success: true,
        movieId: id,
        streams: uniqueLinks
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*" // Allows your frontend application to call this API safely
        }
      }
    );

  } catch (error) {
    // Catch fetch/processing failures cleanly without crashing the server
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
