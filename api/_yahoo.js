// Helper bersama untuk proxy Yahoo Finance. File berawalan "_" tidak dijadikan endpoint oleh Vercel.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const HOSTS = ["query1.finance.yahoo.com", "query2.finance.yahoo.com"];

const httpError = (status, message) => Object.assign(new Error(message), { status });

// Sama dengan fungsi cq() di index.html: range 1/2/5/10y dipakai langsung, selain itu pakai period1/period2.
function rangeQuery(r) {
  const m = /^(\d{1,2})y$/.exec(r);
  if (m && ![1, 2, 5, 10].includes(+m[1])) {
    const n = Math.floor(Date.now() / 1e3);
    return `period1=${n - Math.round(+m[1] * 365.25 * 86400)}&period2=${n + 86400}&interval=1d`;
  }
  if (!/^(\d{1,2}(d|mo|y)|max|ytd)$/.test(r)) throw httpError(400, "range tidak valid");
  return `range=${r}&interval=1d`;
}

// Ambil JSON chart Yahoo. Hanya host dan path Yahoo yang diizinkan (supaya bukan open proxy).
async function fetchChart(url) {
  let u;
  try { u = new URL(url); } catch { throw httpError(400, "URL tidak valid"); }
  if (u.protocol !== "https:" || !HOSTS.includes(u.hostname) || !u.pathname.startsWith("/v8/finance/chart/"))
    throw httpError(400, "URL tidak diizinkan");
  let lastErr;
  for (const host of [u.hostname, ...HOSTS.filter((h) => h !== u.hostname)]) {
    const target = new URL(u.href); target.hostname = host;
    const ctl = new AbortController();
    const tm = setTimeout(() => ctl.abort(), 20000);
    try {
      const r = await fetch(target.href, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: ctl.signal });
      const d = await r.json().catch(() => null);
      // Yahoo memakai 404 + {chart:{error}} untuk simbol tak dikenal: teruskan apa adanya agar klien bisa membacanya.
      if (d && d.chart) return d;
      lastErr = httpError(502, "Yahoo membalas HTTP " + r.status);
    } catch (e) {
      lastErr = httpError(502, e.name === "AbortError" ? "Yahoo timeout" : "Yahoo tidak terjangkau");
    } finally { clearTimeout(tm); }
  }
  throw lastErr;
}

const chartUrl = (sym, range) =>
  `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?${rangeQuery(range)}`;

module.exports = { fetchChart, chartUrl, httpError };
