/* ============================================
   The Legend of Abou Man — App Logic
   ============================================ */

const player = document.getElementById('player');
let currentChapter = null;
let currentSong = -1;
let chapters = [];

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNav();
  initScrollAnimations();
  initChapters();
});

/* ---- Theme ---- */
function initTheme() {
  const saved = localStorage.getItem('ab_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeIcon(theme);

  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('ab_theme', next);
      updateThemeIcon(next);
    });
  }
}

function updateThemeIcon(theme) {
  const icon = document.querySelector('.theme-icon');
  if (icon) icon.textContent = theme === 'dark' ? '🌙' : '☀️';
}

/* ---- Navigation ---- */
function initNav() {
  const header = document.getElementById('header');
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('navMenu');

  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navMenu.classList.toggle('open');
    });
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('open');
      });
    });
  }

  // Active nav on scroll
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      if (window.scrollY >= section.offsetTop - 200) {
        current = section.id;
      }
    });
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });
  }, { passive: true });
}

/* ---- Scroll Animations ---- */
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        if (el.parentElement && el.parentElement.classList.contains('chapters-grid')) {
          const siblings = Array.from(el.parentElement.children);
          el.style.transitionDelay = `${siblings.indexOf(el) * 0.08}s`;
        }
        el.classList.add('visible');
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.card, .animate-on-scroll').forEach(el => observer.observe(el));
}

/* ---- Chapters ---- */
async function initChapters() {
  await DB.init();
  chapters = DB.getChapters();
  renderChapters();
}

function renderChapters() {
  const grid = document.getElementById('chaptersGrid');
  if (!grid) return;

  grid.innerHTML = chapters.map(c => {
    const songCount = (c.songs || []).length;
    const img = c.songs?.[0]?.image || '';
    const imgHtml = img ? `<img src="${img}" alt="${c.name}" class="card-img" onerror="this.style.display='none'" loading="lazy">` : '';

    return `
      <div class="card" onclick="openChapter(${c.id})">
        ${imgHtml}
        <div class="num">${c.id}</div>
        <div class="name">${c.icon} ${c.name}</div>
        <div class="count">${songCount} ${songCount === 1 ? 'track' : 'tracks'}</div>
      </div>
    `;
  }).join('');

  // Re-observe new cards
  setTimeout(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const siblings = Array.from(el.parentElement.children);
          el.style.transitionDelay = `${siblings.indexOf(el) * 0.08}s`;
          el.classList.add('visible');
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    grid.querySelectorAll('.card').forEach(c => observer.observe(c));
  }, 100);
}

function openChapter(id) {
  currentChapter = chapters.find(c => c.id === id);
  if (!currentChapter) return;

  // Hide main sections
  ['hero', 'about', 'chapters', 'buySection', 'contact'].forEach(sId => {
    const el = document.getElementById(sId);
    if (el) el.style.display = 'none';
  });

  // Show songs view
  let sv = document.getElementById('songsView');
  if (!sv) {
    createSongsView();
    sv = document.getElementById('songsView');
  }
  sv.style.display = 'block';

  const chImg = currentChapter.songs?.[0]?.image || '';
  document.getElementById('chapterTitle').textContent = `${currentChapter.icon} ${currentChapter.name}`;

  const sl = document.getElementById('songsList');
  if (!currentChapter.songs || !currentChapter.songs.length) {
    sl.innerHTML = `
      <div class="empty">
        <div class="empty-icon">🎙️</div>
        <h3 style="margin-bottom:8px;">لا توجد أغاني بعد</h3>
        <p>سيتم إضافة الأغاني قريباً</p>
      </div>`;
  } else {
    sl.innerHTML = currentChapter.songs.map((s, i) => `
      <div class="song-card" id="sc-${i}" onclick="playSong(${i})">
        ${s.image ? `<img src="${s.image}" class="song-img" onerror="this.style.display='none'" loading="lazy">` : '<div class="song-img" style="background:var(--accent-soft);display:flex;align-items:center;justify-content:center;font-size:1.5rem;">🎵</div>'}
        <div class="song-info">
          <div class="song-title">${s.title}</div>
        </div>
        <button class="song-play" onclick="event.stopPropagation(); playSong(${i})">▶</button>
      </div>
    `).join('');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function createSongsView() {
  const sv = document.createElement('div');
  sv.id = 'songsView';
  sv.className = 'songs-view';
  sv.innerHTML = `
    <button class="back-btn" onclick="showHome()">← العودة للأبواب</button>
    <h2 id="chapterTitle" style="margin-bottom:24px;"></h2>
    <div id="songsList"></div>
  `;
  document.body.insertBefore(sv, document.querySelector('.np-bar'));
}

function showHome() {
  ['hero', 'about', 'chapters', 'contact'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = '';
  });

  // Show buy section if link exists
  const buyUrl = localStorage.getItem('ab_buyurl');
  const buySection = document.getElementById('buySection');
  if (buySection && buyUrl) buySection.style.display = '';

  const sv = document.getElementById('songsView');
  if (sv) sv.style.display = 'none';
  currentChapter = null;
}

/* ---- Player ---- */
function playSong(i) {
  if (!currentChapter || !currentChapter.songs || !currentChapter.songs[i]) return;
  currentSong = i;
  const s = currentChapter.songs[i];
  if (!s.audio) return;

  player.src = s.audio;
  player.play().catch(() => {});

  const npBar = document.getElementById('npBar');
  npBar.classList.add('show');
  document.getElementById('npTitle').textContent = s.title;
  document.getElementById('npSub').textContent = currentChapter.name;

  const npImg = document.getElementById('npImg');
  if (s.image) { npImg.src = s.image; npImg.style.display = 'block'; }
  else { npImg.style.display = 'none'; }

  document.getElementById('playBtn').textContent = '⏸';
  document.querySelectorAll('.song-card').forEach(c => c.classList.remove('playing'));
  document.getElementById('sc-' + i)?.classList.add('playing');
}

function togglePlay() {
  if (!player.src) return;
  if (player.paused) { player.play(); document.getElementById('playBtn').textContent = '⏸'; }
  else { player.pause(); document.getElementById('playBtn').textContent = '▶'; }
}

function closePlayer() {
  player.pause(); player.src = '';
  document.getElementById('npBar').classList.remove('show');
  document.querySelectorAll('.song-card').forEach(c => c.classList.remove('playing'));
}

function prevSong() {
  if (currentChapter && currentSong > 0) playSong(currentSong - 1);
}
function nextSong() {
  if (currentChapter && currentSong + 1 < currentChapter.songs.length) playSong(currentSong + 1);
}

// Progress bar
document.querySelector('.np-progress-mini')?.addEventListener('click', function(e) {
  const rect = this.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  if (player.duration) player.currentTime = pct * player.duration;
});

player?.addEventListener('timeupdate', () => {
  if (!player.duration) return;
  document.getElementById('npFill').style.width = (player.currentTime / player.duration * 100) + '%';
});

player?.addEventListener('ended', () => {
  if (currentChapter && currentSong + 1 < currentChapter.songs.length) playSong(currentSong + 1);
  else {
    document.getElementById('playBtn').textContent = '▶';
    document.querySelectorAll('.song-card').forEach(c => c.classList.remove('playing'));
  }
});
