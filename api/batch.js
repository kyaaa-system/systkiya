// GET /api/batch?range=5d&symbols=BBCA,BBRI,...  ->  { BBCA: <chart Yahoo>, BBRI: <chart Yahoo>, ... }
// Ticker IDX otomatis diberi akhiran .JK. Simbol yang gagal dilewati (klien akan mencoba rute lain).
const { fetchChart, chartUrl, httpError } = require("./_yahoo");

module.exports = async (req, res) => {
  try {
    const q = new URL(req.url, "http://localhost").searchParams;
    const range = q.get("range") || "5d";
    const syms = (q.get("symbols") || "").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
    if (!syms.length) throw httpError(400, "parameter symbols wajib");
    if (syms.length > 30) throw httpError(400, "maksimal 30 simbol per permintaan");
    if (syms.some((s) => !/^\^?[A-Z0-9.\-]{1,12}$/.test(s))) throw httpError(400, "simbol tidak valid");
    const out = {};
    await Promise.all(syms.map(async (t) => {
      try { out[t] = await fetchChart(chartUrl(t.startsWith("^") ? t : t.replace(/\.JK$/, "") + ".JK", range)); }
      catch { /* dilewati */ }
    }));
    res.setHeader("Cache-Control", range === "5d" ? "s-maxage=15, stale-while-revalidate=60" : "s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).json(out);
  } catch (e) {
    res.status(e.status || 502).json({ error: e.message });
  }
};
