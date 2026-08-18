// 1. Известные RSS-источники
const RSS_SOURCES = [
  "https://www.cisa.gov/cybersecurity-advisories/all.xml",
  "https://feeds.feedburner.com/TheHackersNews",
  "https://habr.com/ru/rss/hub/cybersecurity/all/?fl=ru",
  "https://www.bleepingcomputer.com/feed/",
  "https://securelist.com/feed/"
];

// 2. Глобальный поток, агрегирующий 500+ вендоров (Microsoft, Apple, Linux, Cisco...)
const GLOBAL_CVE_AGGREGATOR = "https://cve.assurestart.co/api/feed.xml";

// Вспомогательная функция проверки периода времени
function isWithinTimeRange(dateStr, timePeriod = 'all') {
  if (timePeriod === 'all' || !timePeriod) {
    return { isValid: true, dateStr: formatDate(dateStr) };
  }

  try {
    const pubDate = new Date(dateStr);
    if (isNaN(pubDate.getTime())) {
      return { isValid: true, dateStr: "Дата не указана" };
    }

    const now = new Date();
    const pastLimit = new Date();
    const days = parseInt(timePeriod, 10);
    pastLimit.setDate(now.getDate() - days);

    const isValid = pubDate >= pastLimit && pubDate <= now;
    return { isValid, dateStr: formatDate(dateStr) };
  } catch (e) {
    return { isValid: true, dateStr: formatDate(dateStr) };
  }
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toISOString().split('T')[0];
  } catch (e) {
    return dateStr;
  }
}

// Загрузка по списку RSS (включая агрегатор 500+ вендоров)
async function fetchRssItems(query, timePeriod = 'all') {
  const items = [];
  const sourcesToFetch = [...RSS_SOURCES, GLOBAL_CVE_AGGREGATOR];

  for (const feedUrl of sourcesToFetch) {
    try {
      const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(apiUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const data = await response.json();
      if (data.status !== 'ok' || !data.items) continue;

      for (const entry of data.items) {
        const title = entry.title || "";
        const description = entry.description || entry.content || "";
        const pubDateRaw = entry.pubDate || new Date().toISOString();

        const { isValid, dateStr } = isWithinTimeRange(pubDateRaw, timePeriod);
        if (!isValid) continue;

        const queryLower = query ? query.toLowerCase() : "";
        if (!query || title.toLowerCase().includes(queryLower) || description.toLowerCase().includes(queryLower)) {
          let domain = "source";
          try { domain = new URL(entry.link).hostname; } catch(e){}

          items.push({
            title: title.replace(/<[^>]*>?/gm, '').trim(),
            content: description.replace(/<[^>]*>?/gm, '').slice(0, 500).trim(),
            url: entry.link,
            date: dateStr,
            domain: domain,
            platform: feedUrl === GLOBAL_CVE_AGGREGATOR ? "Global CVE Hub (500+ Vendors)" : "RSS Feed"
          });
        }
      }
    } catch (e) {
      console.warn("Ошибка или таймаут загрузки RSS:", feedUrl, e);
    }
  }
  return items;
}

// Поиск по глобальному веб-индексу (миллионы сайтов)
async function fetchGlobalWebSearch(query, timePeriod = 'all') {
  if (!query) return [];
  
  const targetUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query + " cybersecurity threat exploit")}&format=json&no_html=1&skip_disambig=1`;
  
  try {
    const res = await fetch(targetUrl);
    if (!res.ok) return [];
    const data = await res.json();
    const articles = [];

    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      data.RelatedTopics.forEach(item => {
        if (item.FirstURL && item.Text) {
          try {
            const domain = new URL(item.FirstURL).hostname;
            articles.push({
              title: item.Text.split(' - ')[0] || item.Text,
              content: item.Text,
              url: item.FirstURL,
              date: "Индекс глобального поиска",
              domain: domain,
              platform: "Global Web Search"
            });
          } catch (e) {}
        }
      });
    }
    return articles;
  } catch (e) {
    return [];
  }
}

// Главная функция сканирования
async function fetchAllSources(query, timePeriod = 'all') {
  const [rssResults, webResults] = await Promise.all([
    fetchRssItems(query, timePeriod),
    fetchGlobalWebSearch(query, timePeriod)
  ]);

  // Объединяем и убираем дубликаты по URL
  const combined = [...rssResults, ...webResults];
  const uniqueItems = Array.from(new Map(combined.map(item => [item.url, item])).values());

  return uniqueItems;
}