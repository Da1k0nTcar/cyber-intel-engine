const serverDatabase = [
  // --- ROLEPLAY (RP / РП) И ГОРОДА ---
  { 
    ip: 'subshield.ru', 
    port: 25565, 
    region: 'СНГ 🇷🇺', 
    category: 'RolePlay / Города', 
    description: 'SubShield — Известный приватный RolePlay сервер: постройка городов, суды, экономика и отыгрыш персонажей.' 
  },
  { 
    ip: 'mc.hypixel.net', 
    port: 25565, 
    region: 'США 🇺🇸', 
    category: 'Housing / RP', 
    description: 'Hypixel Housing — Кастомные RP-миры, созданные игроками (школы, города, отели и сюжетные карты).' 
  },

  // --- МОДЫ & HITECH ---
  { 
    ip: 'mc.mcskill.net', 
    port: 25565, 
    region: 'СНГ 🇷🇺', 
    category: 'Моды / HiTech', 
    description: 'McSkill — Крупный лаунчерный проект с модами: IndustrialCraft, Thaumcraft, DivineRPG, автошахты и космос.' 
  },
  { 
    ip: 'cristalix.gg', 
    port: 25565, 
    region: 'СНГ 🇷🇺', 
    category: 'Кастомные Моды / РП', 
    description: 'Cristalix — Сервер с уникальным клиентом, включающим собственные моды, кастомные мини-игры и РП-режимы.' 
  },
  { 
    ip: 'hub.mc-complex.com', 
    port: 25565, 
    region: 'США 🇺🇸', 
    category: 'Pixelmon / Моды', 
    description: 'Complex Gaming — Топовый международный сервер с модом Pixelmon (покемоны в Minecraft) и Towny.' 
  },

  // --- АНАРХИЯ И ГРИФ ---
  { 
    ip: 'mc.funtime.su', 
    port: 25565, 
    region: 'СНГ 🇷🇺', 
    category: 'Анархия / Ивенты', 
    description: 'FunTime — Популярная Анархия: аирдропы, клановые битвы за ресурсы, кастомные талисманы и боссы.' 
  },
  { 
    ip: 'mc.reallyworld.ru', 
    port: 25565, 
    region: 'СНГ 🇷🇺', 
    category: 'Анархия / Гриф', 
    description: 'ReallyWorld — Гриферский сервер и Анархия с кланами, скупщиком предметов и уникальным оружием.' 
  },
  { 
    ip: 'play.holyworld.ru', 
    port: 25565, 
    region: 'СНГ 🇷🇺', 
    category: 'Анархия', 
    description: 'HolyWorld — Суровая Анархия с прокачкой умений, кастомными крафтами и ежедневными ивентами.' 
  },
  { 
    ip: '2b2t.org', 
    port: 25565, 
    region: 'США 🇺🇸', 
    category: 'Мировая Анархия', 
    description: '2B2T — Старейший анархия-сервер в мире без правил, приватных зон и банов.' 
  },

  // --- МИНИ-ИГРЫ, BEDWARS, SKYWARS И ROYALE ---
  { 
    ip: 'play.hypixel.net', 
    port: 25565, 
    region: 'США 🇺🇸', 
    category: 'BedWars / SkyWars / Royale', 
    description: 'Hypixel — Главный проект с BedWars, SkyWars, Survival Games (Королевская битва) и SkyBlock.' 
  },
  { 
    ip: 'mc.lastcraft.ru', 
    port: 25565, 
    region: 'СНГ 🇷🇺', 
    category: 'BedWars / Мини-игры', 
    description: 'LastCraft — СНГ сервер с BedWars, SkyWars, паркуром и классическими мини-играми.' 
  },

  // --- МИРНОЕ ВЫЖИВАНИЕ ---
  { 
    ip: 'mc.dexland.ru', 
    port: 25565, 
    region: 'СНГ 🇷🇺', 
    category: 'Мирное выживание', 
    description: 'DexLand — Уютное выживание с надежной защитой построек, экономикой и мирной торговлей.' 
  },

  // --- PVP И ДУЭЛИ ---
  { 
    ip: 'eu.pvp.land', 
    port: 25565, 
    region: 'Европа 🇪🇺', 
    category: 'PvP Тренировка', 
    description: 'PvP Land — Отработка аима, комбо и клик-таймингов на тренировочных ботах и в дуэлях.' 
  },
  { 
    ip: 'minemen.club', 
    port: 25565, 
    region: 'США / ЕС 🌐', 
    category: 'PvP Академия', 
    description: 'Minemen Club — Мировая арена для дуэлей, застройки мостов и улучшения PvP-навыков.' 
  }
];

let loadedServers = [];
let currentFilter = 'ALL';
let searchQuery = '';

async function loadServers() {
  const listDiv = document.getElementById('server-list');
  listDiv.innerHTML = '<p style="text-align:center; color: var(--text-muted); padding: 40px;">Синхронизация и проверка статуса серверов...</p>';

  const requests = serverDatabase.map(async (srv) => {
    try {
      const response = await fetch(`https://api.mcsrvstat.us/3/${srv.ip}`);
      const data = await response.json();
      return {
        ...srv,
        online: data.online ? (data.players?.online || 'Онлайн') : 'Доступен'
      };
    } catch {
      return { ...srv, online: 'Доступен' };
    }
  });

  loadedServers = await Promise.all(requests);
  renderServers();
}

function renderServers() {
  const listDiv = document.getElementById('server-list');
  listDiv.innerHTML = '';

  const filtered = loadedServers.filter(srv => {
    const matchesRegion = currentFilter === 'ALL' || srv.region.includes(currentFilter);
    const matchesQuery = srv.ip.toLowerCase().includes(searchQuery) ||
                         srv.category.toLowerCase().includes(searchQuery) ||
                         srv.description.toLowerCase().includes(searchQuery);
    return matchesRegion && matchesQuery;
  });

  if (filtered.length === 0) {
    listDiv.innerHTML = '<p style="text-align:center; color: var(--text-muted); padding: 40px;">Серверов по данному запросу не найдено.</p>';
    return;
  }

  filtered.forEach(srv => {
    const categoryLower = srv.category.toLowerCase();
    let badgeClass = 'badge-pvp';
    
    if (categoryLower.includes('анархия')) {
      badgeClass = 'badge-category';
    } else if (categoryLower.includes('rp') || categoryLower.includes('рп') || categoryLower.includes('моды')) {
      badgeClass = 'badge-rp';
    }

    const card = document.createElement('div');
    card.className = 'server-card';
    card.innerHTML = `
      <div class="server-info">
        <div class="server-header">
          <span class="ip-address">${srv.ip}:${srv.port}</span>
          <span class="badge badge-region">${srv.region}</span>
          <span class="badge ${badgeClass}">${srv.category}</span>
        </div>
        <div class="online-status">
          <span class="status-dot"></span>
          <span>Игроков: ${srv.online}</span>
        </div>
        <div class="desc">${srv.description}</div>
      </div>
      <button class="copy-btn" onclick="copyIp('${srv.ip}:${srv.port}', this)">Скопировать IP</button>
    `;
    listDiv.appendChild(card);
  });
}

function filterRegion(region, btn) {
  currentFilter = region;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderServers();
}

function handleSearch() {
  searchQuery = document.getElementById('search-input').value.toLowerCase().trim();
  renderServers();
}

function copyIp(text, btn) {
  navigator.clipboard.writeText(text);
  const original = btn.innerText;
  btn.innerText = 'Скопировано! ✓';
  setTimeout(() => { btn.innerText = original; }, 1500);
}

loadServers();