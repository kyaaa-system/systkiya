// GET /api/yahoo?url=<URL chart Yahoo yang di-encode>  ->  JSON chart Yahoo apa adanya.
const { fetchChart } = require("./_yahoo");

module.exports = async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost").searchParams.get("url");
    if (!url) throw Object.assign(new Error("parameter url wajib"), { status: 400 });
    const d = await fetchChart(url);
    res.setHeader("Cache-Control", "s-maxage=15, stale-while-revalidate=60");
    res.status(200).json(d);
  } catch (e) {
    res.status(e.status || 502).json({ error: e.message });
  }
};
