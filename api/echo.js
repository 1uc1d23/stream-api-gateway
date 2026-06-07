export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { type, id, season, episode } = req.query;

  const finalServer = "oneroom";
  const finalType = type || "movie";

  if (!id) {
    return res.status(400).json({ error: "Missing content ID parameter" });
  }

  try {
    let targetUrl = `https://max.popembed.net/movie-tv/${finalServer}/${finalType}/${id}`;

    if (finalType === "tv" && season && episode) {
      targetUrl += `/${season}/${episode}`;
    }

    const apiResponse = await fetch(targetUrl);

    if (!apiResponse.ok) {
      return res.status(apiResponse.status).json({ error: "Failed fetching target API" });
    }

    const data = await apiResponse.json();
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
