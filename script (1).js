// Стабильные RSS-источники
const RSS_SOURCES = [
  "https://www.cisa.gov/cybersecurity-advisories/all.xml",
  "https://feeds.feedburner.com/TheHackersNews",
  "https://habr.com/ru/rss/hub/cybersecurity/all/?fl=ru"
];

// Используем надежный RSS-to-JSON сервис
async function fetchRssItems(query) {
  const items = [];

  for (const feedUrl of RSS_SOURCES) {
    try {
      // Запрос к RSS2JSON API (обходит CORS и парсит XML на сервере)
      const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // Таймаут 5 секунд на источник

      const response = await fetch(apiUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const data = await response.json();
      if (data.status !== 'ok' || !data.items) continue;

      for (const entry of data.items) {
        const title = entry.title || "";
        const description = entry.description || entry.content || "";
        const pubDateRaw = entry.pubDate || new Date().toISOString();
        
        const { isValid, dateStr } = isWithinLast3Months(pubDateRaw);
        if (!isValid) continue;

        const queryLower = query.toLowerCase();
        if (!query || title.toLowerCase().includes(queryLower) || description.toLowerCase().includes(queryLower)) {
          // Получаем чистый домен из ссылки
          let domain = "source";
          try { domain = new URL(entry.link).hostname; } catch(e){}

          items.push({
            title: title.replace(/<[^>]*>?/gm, '').trim(),
            content: description.replace(/<[^>]*>?/gm, '').slice(0, 500).trim(),
            url: entry.link,
            date: dateStr,
            domain: domain,
            platform: "RSS Feed"
          });
        }
      }
    } catch (e) {
      console.warn("Ошибка или таймаут загрузки RSS:", feedUrl, e);
    }
  }
  return items;
}