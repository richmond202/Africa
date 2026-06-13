/* ============================================
   AfricaLaunch - Main JavaScript
   ============================================ */

// ===== UTILITY FUNCTIONS =====
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);
function goTo(url) { window.location.href = url; }

function formatCurrency(n, symbol = '$') {
  if (n >= 1e9) return symbol + (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return symbol + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return symbol + (n / 1e3).toFixed(0) + 'K';
  return symbol + n;
}
function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function timeSince(d) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return days + ' days ago';
  return formatDate(d);
}
function pct(a, b) { return b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0; }

// ===== TOAST NOTIFICATIONS =====
function showToast(msg, type = 'info', duration = 3500) {
  const container = $('toastContainer');
  if (!container) return;
  const icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas ${icons[type] || icons.info} toast-icon"></i><span class="toast-msg">${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(20px)'; setTimeout(() => toast.remove(), 400); }, duration);
}

// ===== NAVIGATION =====
function toggleNav() {
  const links = $('navLinks');
  if (links) links.classList.toggle('open');
}
window.addEventListener('scroll', () => {
  const navbar = $('navbar');
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 20);
});
// Close nav on link click (mobile)
document.addEventListener('DOMContentLoaded', () => {
  $$('#navLinks .nav-link').forEach(link => {
    link.addEventListener('click', () => {
      const nl = $('navLinks');
      if (nl) nl.classList.remove('open');
    });
  });
});

// ===== HERO SEARCH =====
function handleHeroSearch() {
  const q = ($('heroSearch') || {}).value?.trim() || '';
  const cat = ($('searchCategory') || {}).value || 'all';
  if (!q) { showToast('Please enter a search term', 'error'); return; }
  if (cat === 'investors') { window.location.href = `investors.html?q=${encodeURIComponent(q)}`; }
  else if (cat === 'events') { window.location.href = `events.html?q=${encodeURIComponent(q)}`; }
  else { window.location.href = `startups.html?q=${encodeURIComponent(q)}`; }
}
$('heroSearch') && $('heroSearch').addEventListener('keypress', e => { if (e.key === 'Enter') handleHeroSearch(); });

// ===== LANGUAGE MODAL =====
function openLangModal() {
  const m = $('langModal');
  if (m) m.classList.add('open');
}
function closeLangModal(e) {
  if (!e || e.target === $('langModal')) {
    const m = $('langModal');
    if (m) m.classList.remove('open');
  }
}
function setLang(code) {
  const labels = { en: 'EN', fr: 'FR', ar: 'AR', pt: 'PT', sw: 'SW', ha: 'HA', am: 'AM', zu: 'ZU' };
  const greetings = {
    en: 'Language set to English 🇬🇧',
    fr: 'Langue définie sur Français 🇫🇷',
    ar: 'تم تعيين اللغة إلى العربية 🇸🇦',
    pt: 'Idioma definido para Português 🇧🇷',
    sw: 'Lugha imewekwa kwa Kiswahili 🌍',
    ha: 'Harshe an saita zuwa Hausa 🇳🇬',
    am: 'ቋንቋ ወደ አማርኛ ተቀናብሯል 🇪🇹',
    zu: 'Ulimi lusetelwe kuZulu 🇿🇦'
  };
  localStorage.setItem('lang', code);
  showToast(greetings[code] || 'Language updated', 'success');
  $$('.lang-option').forEach(b => b.classList.toggle('active', b.getAttribute('onclick')?.includes(`'${code}'`)));
  $$('.lang-flag').forEach(b => b.classList.toggle('active', b.getAttribute('onclick')?.includes(`'${code}'`)));
  closeLangModal();
}

// ===== AI CHAT =====
let chatOpen = false;
function toggleAIChat() {
  const panel = $('aiChatPanel');
  chatOpen = !chatOpen;
  if (panel) panel.classList.toggle('open', chatOpen);
}
function handleChatKey(e) { if (e.key === 'Enter') sendChatMessage(); }
function handlePanelChatKey(e) { if (e.key === 'Enter') sendPanelMessage(); }

const aiResponses = [
  { match: ['fintech', 'payment', 'banking'], reply: "💡 Top FinTech startups in our ecosystem include **PaySwift Africa** (Nigeria, Series B) and several others raising Seed rounds. Want me to show you their profiles or connect you with FinTech investors?" },
  { match: ['agritech', 'agriculture', 'farming', 'crops'], reply: "🌱 Africa's AgriTech sector is booming! **AgriSense AI** from Kenya is our Most Innovative Startup, using satellite AI for crop monitoring. The sector has attracted $320M+ in funding this year." },
  { match: ['investor', 'investment', 'funding', 'raise'], reply: "💰 We have 340+ active investors on the platform. Key players include AfricaVentures Capital, PanAfrica Fund, and GreenFuture Ventures. What stage are you raising at? I can filter investors for you!" },
  { match: ['event', 'hackathon', 'pitch', 'competition'], reply: "📅 Upcoming events: **AfricaLaunch Grand Pitch 2025** (July 15-17, Nairobi) with $500K in prizes, and **FinTech Africa Hackathon** (June 20-22, Lagos). Want to register?" },
  { match: ['healthtech', 'health', 'medical', 'telemedicine'], reply: "🏥 HealthTech is one of our fastest-growing categories! **MediConnect** from Ghana is leading telemedicine for rural communities. 12+ HealthTech startups are currently fundraising." },
  { match: ['cleantech', 'solar', 'energy', 'climate'], reply: "⚡ CleanTech is exploding in Africa! **SolarGrid** from Tanzania is our Fastest Growing Startup, powering 100K+ homes. Nadia Al-Rashid at GreenFuture Ventures is actively seeking CleanTech deals." },
  { match: ['idea', 'validate', 'validation', 'business'], reply: "🎯 Great question! To validate your startup idea: 1) Define your target customer 2) Identify the core problem 3) Build an MVP 4) Talk to 20+ potential customers 5) Measure willingness to pay. Want me to connect you with a mentor?" },
  { match: ['pitch deck', 'pitch', 'presentation'], reply: "📊 A great pitch deck should cover: Problem → Solution → Market Size → Business Model → Traction → Team → Financials → The Ask. Check our Marketplace for battle-tested pitch deck templates!" },
  { match: ['mentor', 'mentorship', 'advice', 'coach'], reply: "👨‍💼 We have 180+ verified mentors! Highlights: Dr. James Kariuki (FinTech, 4.9★), Aisha Diallo (Growth Marketing, 4.8★), Prof. Samuel Boateng (AI/ML, 4.7★). Visit the Incubator Hub to book a session!" },
  { match: ['accelerator', 'incubator', 'program'], reply: "🏢 We track 65+ accelerators across Africa, including Y Combinator Africa cohort, Techstars, and regional programs like Flat6Labs, MEST, and CcHUB. Visit our Incubator Hub for details and applications!" },
  { match: ['marketplace', 'template', 'tool', 'resource'], reply: "🛒 Our Marketplace has startup templates, SaaS tools, and courses. Popular items: Business Plan Template ($29), Pitch Deck Kit ($49), FinModel AI ($99/mo), Zero to Funded Course ($149). Check it out!" },
  { match: ['award', 'recognition', 'winner'], reply: "🏆 Current award winners: Startup of the Month → PaySwift Africa 🥇 | Most Innovative → AgriSense AI 💡 | Fastest Growing → SolarGrid ⚡ | People's Choice → MediConnect ❤️. Nominations open!" },
  { match: ['hello', 'hi', 'hey', 'help'], reply: "👋 Hello! I'm AfrikaBot, your AI guide to the African startup ecosystem. I can help you:\n• Discover top startups\n• Find the right investors\n• Explore upcoming events\n• Validate your business idea\n• Access mentors & resources\n\nWhat would you like to explore?" },
];

function getAIReply(msg) {
  const lower = msg.toLowerCase();
  for (const r of aiResponses) {
    if (r.match.some(k => lower.includes(k))) return r.reply;
  }
  return "🤔 Great question! I'm still learning about that specific topic. Try asking about: startups, investors, events, funding, mentors, or specific sectors like FinTech or AgriTech. You can also browse the platform directly!";
}

function appendChatMsg(containerId, text, role) {
  const el = $(containerId);
  if (!el) return;
  const now = new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;
  div.innerHTML = `<div class="msg-bubble">${text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}</div><span class="msg-time">${now}</span>`;
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

function sendChatMessage() {
  const inp = $('chatInput');
  if (!inp || !inp.value.trim()) return;
  const msg = inp.value.trim();
  inp.value = '';
  appendChatMsg('chatMessages', msg, 'user');
  setTimeout(() => {
    appendChatMsg('chatMessages', '<i class="fas fa-circle-notch fa-spin"></i> Thinking...', 'bot');
    setTimeout(() => {
      const msgs = $('chatMessages');
      if (msgs) msgs.lastChild.remove();
      appendChatMsg('chatMessages', getAIReply(msg), 'bot');
    }, 800);
  }, 200);
}

function sendPanelMessage() {
  const inp = $('panelChatInput');
  if (!inp || !inp.value.trim()) return;
  const msg = inp.value.trim();
  inp.value = '';
  appendChatMsg('panelMessages', msg, 'user');
  setTimeout(() => {
    appendChatMsg('panelMessages', '<i class="fas fa-circle-notch fa-spin"></i> Thinking...', 'bot');
    setTimeout(() => {
      const msgs = $('panelMessages');
      if (msgs) msgs.lastChild.remove();
      appendChatMsg('panelMessages', getAIReply(msg), 'bot');
    }, 800);
  }, 200);
}

// ===== NEWSLETTER =====
function subscribeNewsletter(e) {
  e.preventDefault();
  const email = ($('newsletterEmail') || {}).value;
  const role = ($('newsletterRole') || {}).value;
  if (!email) return;
  showToast(`🎉 Welcome aboard! You're subscribed as a ${role}.`, 'success');
  if ($('newsletterEmail')) $('newsletterEmail').value = '';
}

// ===== VOTING =====
const votedStartups = JSON.parse(localStorage.getItem('votedStartups') || '[]');
async function voteStartup(id, countEl) {
  if (votedStartups.includes(id)) {
    showToast('You already voted for this startup!', 'info');
    return;
  }
  try {
    const res = await fetch(`tables/startups/${id}`);
    const startup = await res.json();
    const newVotes = (startup.votes || 0) + 1;
    await fetch(`tables/startups/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ votes: newVotes })
    });
    votedStartups.push(id);
    localStorage.setItem('votedStartups', JSON.stringify(votedStartups));
    if (countEl) countEl.textContent = newVotes;
    showToast('Vote cast! Thank you 🗳️', 'success');
  } catch { showToast('Could not cast vote. Please try again.', 'error'); }
}

// ===== RENDER STARTUP CARD =====
function renderStartupCard(s, onClick) {
  const pctFunded = pct(s.funding_raised || 0, s.funding_goal || 1);
  const voted = votedStartups.includes(s.id);
  return `
    <article class="startup-card" onclick="${onClick || `goTo('startups.html?id=${s.id}')`}" role="button" tabindex="0">
      <div class="card-top">
        <img src="${s.logo_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(s.name) + '&background=7c3aed&color=fff&size=128'}" alt="${s.name} logo" class="startup-logo">
        <div class="card-badges">
          ${s.is_featured ? '<span class="badge badge-featured">⭐ Featured</span>' : ''}
          ${s.award ? '<span class="badge badge-award">🏆 ' + s.award.split(' ').slice(0,2).join(' ') + '</span>' : ''}
          <span class="badge badge-stage">${s.stage || 'Seed'}</span>
          <span class="badge badge-category">${s.category || 'Tech'}</span>
        </div>
      </div>
      <h3 class="startup-name">${s.name}</h3>
      <p class="startup-tagline">${s.tagline || ''}</p>
      <div class="startup-meta">
        <span class="meta-item"><i class="fas fa-map-marker-alt"></i>${s.city || ''}, ${s.country || ''}</span>
        <span class="meta-item"><i class="fas fa-users"></i>${s.team_size || 0} team</span>
        <span class="meta-item"><i class="fas fa-eye"></i>${(s.views || 0).toLocaleString()} views</span>
        ${s.revenue ? `<span class="meta-item"><i class="fas fa-chart-line"></i>${s.revenue}</span>` : ''}
      </div>
      <div class="startup-tags">${(s.tags || []).slice(0,4).map(t => `<span class="tag">${t}</span>`).join('')}</div>
      <div class="card-footer">
        <div class="funding-bar-wrap">
          <div class="funding-label">${formatCurrency(s.funding_raised || 0)} raised · ${pctFunded}% of ${formatCurrency(s.funding_goal || 0)}</div>
          <div class="funding-bar"><div class="funding-fill" style="width:${pctFunded}%"></div></div>
        </div>
        <div class="card-votes" onclick="event.stopPropagation()">
          <button class="vote-btn ${voted ? 'voted' : ''}" onclick="voteStartup('${s.id}', this.nextElementSibling)" title="Vote for this startup">
            <i class="fas fa-arrow-up"></i>
          </button>
          <span class="vote-count">${s.votes || 0}</span>
        </div>
      </div>
    </article>
  `;
}

// ===== RENDER EVENT CARD =====
function renderEventCard(e) {
  const d = new Date(e.date);
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const pctFull = pct(e.attendees || 0, e.max_attendees || 100);
  return `
    <article class="event-card" onclick="goTo('events.html?id=${e.id}')" role="button" tabindex="0">
      <div class="event-img-wrap">
        <img src="${e.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=300&fit=crop'}" alt="${e.title}">
        <span class="event-type-badge">${e.type || 'Event'}</span>
        ${e.is_online ? '<span class="event-online-badge">🌐 Online</span>' : ''}
      </div>
      <div class="event-body">
        <div class="event-date"><i class="fas fa-calendar-alt"></i>${dateStr}</div>
        <h3 class="event-title">${e.title}</h3>
        <p class="event-organizer"><i class="fas fa-building"></i> ${e.organizer}</p>
        <div class="event-footer">
          <span class="event-stat"><i class="fas fa-users"></i>${e.attendees || 0} attending</span>
          ${e.prize_pool > 0 ? `<span class="event-prize">🏆 ${formatCurrency(e.prize_pool)} prize</span>` : `<span class="event-stat"><i class="fas fa-map-marker-alt"></i>${e.location}</span>`}
        </div>
      </div>
    </article>
  `;
}

// ===== RENDER INVESTOR CARD =====
function renderInvestorCard(inv) {
  return `
    <article class="investor-card" onclick="goTo('investors.html?id=${inv.id}')" role="button" tabindex="0">
      <div class="investor-top">
        <img src="${inv.avatar_url}" alt="${inv.name}" class="investor-avatar">
        <div>
          <div class="investor-name">${inv.name}</div>
          <div class="investor-company">${inv.company}</div>
          ${inv.verified ? '<div class="investor-badge-verified"><i class="fas fa-check"></i> Verified</div>' : ''}
        </div>
      </div>
      <div class="investor-type-tag">${inv.type}</div>
      <div class="investor-focus">${(inv.investment_focus || []).map(f => `<span class="tag">${f}</span>`).join('')}</div>
      <div class="investor-range">Invests: <strong>${formatCurrency(inv.min_investment)} – ${formatCurrency(inv.max_investment)}</strong></div>
      <div class="investor-footer">
        <div class="portfolio-count"><strong>${inv.portfolio_count}</strong><br>Portfolio Companies</div>
        <a href="investors.html?id=${inv.id}" class="btn btn-sm btn-primary" onclick="event.stopPropagation()">
          <i class="fas fa-handshake"></i> Connect
        </a>
      </div>
    </article>
  `;
}

// ===== RENDER MARKETPLACE CARD =====
function renderMarketCard(item) {
  const discounted = item.discount > 0 ? (item.price * (1 - item.discount / 100)).toFixed(0) : null;
  return `
    <article class="market-card" onclick="window.open('${item.purchase_url || '#'}','_blank')" role="button" tabindex="0">
      ${item.discount > 0 ? `<div class="discount-tag">-${item.discount}%</div>` : ''}
      <div class="market-img"><img src="${item.image_url}" alt="${item.product_name}"></div>
      <div class="market-body">
        <div class="market-startup"><i class="fas fa-rocket"></i> ${item.startup_name}</div>
        <h3 class="market-name">${item.product_name}</h3>
        <span class="market-type">${item.type}</span>
        <div class="market-footer">
          <div class="market-price-wrap">
            <span class="market-price">$${discounted || item.price}</span>
            ${discounted ? `<span class="market-original">$${item.price}</span>` : ''}
          </div>
          <div class="market-rating">
            <i class="fas fa-star"></i>
            ${item.rating} (${item.reviews_count})
          </div>
        </div>
      </div>
    </article>
  `;
}

// ===== LOAD HOME PAGE DATA =====
async function loadHomePageData() {
  // Featured Startups
  const grid = $('featuredStartupsGrid');
  if (grid) {
    try {
      const res = await fetch('tables/startups?limit=6');
      const data = await res.json();
      const items = data.data || [];
      grid.innerHTML = items.length
        ? items.map(s => renderStartupCard(s)).join('')
        : '<p style="color:var(--text-muted);text-align:center;grid-column:1/-1">No startups found.</p>';
    } catch {
      grid.innerHTML = '<p style="color:var(--text-muted);text-align:center;grid-column:1/-1">Failed to load startups.</p>';
    }
  }

  // Events
  const evGrid = $('eventsGrid');
  if (evGrid) {
    try {
      const res = await fetch('tables/events?limit=4');
      const data = await res.json();
      evGrid.innerHTML = (data.data || []).map(renderEventCard).join('');
    } catch { evGrid.innerHTML = ''; }
  }

  // Investors
  const invGrid = $('investorsGrid');
  if (invGrid) {
    try {
      const res = await fetch('tables/investors?limit=4');
      const data = await res.json();
      invGrid.innerHTML = (data.data || []).map(renderInvestorCard).join('');
    } catch { invGrid.innerHTML = ''; }
  }

  // Leaderboard
  const tbdy = $('leaderboardTbody');
  const podium = $('leaderboardPodium');
  if (tbdy || podium) {
    try {
      const res = await fetch('tables/leaderboard?limit=10');
      const data = await res.json();
      const leaders = (data.data || []).sort((a, b) => (b.points || 0) - (a.points || 0));

      if (podium && leaders.length >= 3) {
        const order = [leaders[1], leaders[0], leaders[2]];
        const rankLabels = ['2', '1', '3'];
        const classes = ['podium-2', 'podium-1', 'podium-3'];
        podium.innerHTML = order.map((l, i) => `
          <div class="podium-item ${classes[i]}">
            <img src="${l.avatar_url}" alt="${l.user_name}" class="podium-avatar">
            <div class="podium-name">${l.user_name}</div>
            <div class="podium-points">${(l.points || 0).toLocaleString()} pts</div>
            <div class="podium-rank-bar">${rankLabels[i]}</div>
          </div>
        `).join('');
      }

      if (tbdy) {
        const rankColors = ['gold', 'silver', 'bronze', '', ''];
        tbdy.innerHTML = leaders.slice(0, 5).map((l, i) => `
          <tr>
            <td><span class="lb-rank ${rankColors[i] || ''}">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</span></td>
            <td>
              <div class="lb-user">
                <img src="${l.avatar_url}" alt="${l.user_name}" class="lb-avatar">
                <span class="lb-name">${l.user_name}</span>
              </div>
            </td>
            <td>${l.country || '—'}</td>
            <td><span class="level-badge level-${l.level}">${l.level || 'Explorer'}</span></td>
            <td><span class="points-val">${(l.points || 0).toLocaleString()}</span></td>
            <td><div class="badge-icons">${(l.badges || []).slice(0,3).map(() => '🏅').join('')}</div></td>
          </tr>
        `).join('');
      }
    } catch (err) { console.error('Leaderboard error', err); }
  }

  // Marketplace
  const mpGrid = $('marketplaceGrid');
  if (mpGrid) {
    try {
      const res = await fetch('tables/marketplace?limit=4');
      const data = await res.json();
      mpGrid.innerHTML = (data.data || []).map(renderMarketCard).join('');
    } catch { mpGrid.innerHTML = ''; }
  }
}

// ===== INTERSECTION OBSERVER FOR ANIMATIONS =====
function initAnimations() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  $$('.startup-card, .award-card, .event-card, .investor-card, .eco-card, .market-card, .notif-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
}

// ===== URL PARAM UTILITIES =====
function getParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

// ===== COUNTER ANIMATION =====
function animateCounter(el, target, duration = 1500) {
  if (!el) return;
  const start = 0;
  const step = target / (duration / 16);
  let current = start;
  const timer = setInterval(() => {
    current += step;
    if (current >= target) { current = target; clearInterval(timer); }
    el.textContent = Math.floor(current).toLocaleString() + '+';
  }, 16);
}

// ===== KEYBOARD ACCESSIBILITY =====
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeLangModal();
    if (chatOpen) toggleAIChat();
    const navLinks = $('navLinks');
    if (navLinks) navLinks.classList.remove('open');
  }
});

// ===== STARTUP DETAIL VIEW (modal-based) =====
function openStartupDetail(id) {
  window.location.href = `startups.html?id=${id}`;
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Scroll effect on load
  if (window.scrollY > 20) {
    const navbar = $('navbar');
    if (navbar) navbar.classList.add('scrolled');
  }
  // Load page data
  loadHomePageData().then(() => {
    setTimeout(initAnimations, 200);
  });
  injectAdminNavLink();
  // Active nav link
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  $$('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href !== '#' && currentPage.includes(href.replace('.html', ''))) {
      link.classList.add('active');
    }
  });
  // Language from storage
  const savedLang = localStorage.getItem('lang');
  if (savedLang) {
    $$('.lang-flag').forEach(b => b.classList.toggle('active', b.getAttribute('onclick')?.includes(`'${savedLang}'`)));
  }
});

function injectAdminNavLink() {
  const dropdownMenu = document.querySelector('.nav-dropdown .dropdown-menu');
  if (!dropdownMenu || dropdownMenu.querySelector('a[href="admin.html"]')) return;
  const item = document.createElement('li');
  item.innerHTML = '<a href="admin.html"><i class="fas fa-user-shield"></i> Admin</a>';
  dropdownMenu.appendChild(item);
}

function updateAdminNavLinkVisibility() {
  injectAdminNavLink();
}

