export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { id, s, e } = req.query;

    if (!id) {
      return res.status(400).json({ error: "missing id" });
    }

    const url =
      s && e
        ? `https://movish.net/moviebox-embed/tv/${id}/${s}/${e}`
        : `https://movish.net/moviebox-embed/movie/${id}`;

    const response = await fetch(url);
    const html = await response.text();

    const match = html.match(/<video[^>]+src="([^"]+)"/i);

    if (!match) {
      return res.status(404).json({ error: "not found" });
    }

    return res.status(200).json({
      url: match[1]
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
