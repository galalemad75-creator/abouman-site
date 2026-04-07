/* ============================================
   The Legend of Ip Man — Main Application
   ============================================ */

const player = document.getElementById('player');
const themePlayer = document.getElementById('themePlayer');
let currentChapter = null;
let currentSong = -1;
let chapters = [];
let themeStarted = false;
let openingDone = false;

document.addEventListener('DOMContentLoaded', () => {
  initOpeningCredits();
  initTheme();
  initNav();
  initParticles();
  initScrollAnimations();
  initChapters();
  initThemeSong();
});

/* ══════════ OPENING CREDITS ══════════ */
let ocTimer = null;
let ocPhase = 1;

function initOpeningCredits() {
  // Create sparkle particles
  const ocP = document.getElementById('ocParticles');
  if (ocP) {
    for (let i = 0; i < 30; i++) {
      const sp = document.createElement('div');
      sp.className = 'oc-sparkle';
      sp.style.cssText = `
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation-delay: ${Math.random() * 4}s;
        animation-duration: ${3 + Math.random() * 4}s;
        width: ${1 + Math.random() * 2}px;
        height: ${1 + Math.random() * 2}px;
      `;
      ocP.appendChild(sp);
    }
  }
  
  startOpeningPhase(1);
}

function startOpeningPhase(phase) {
  ocPhase = phase;
  document.querySelectorAll('.oc-phase').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('ocPhase' + phase);
  if (el) el.classList.add('active');
  
  const durations = { 1: 2500, 2: 3500, 3: 3500, 4: 3000 };
  
  if (phase < 4) {
    ocTimer = setTimeout(() => startOpeningPhase(phase + 1), durations[phase]);
  } else {
    ocTimer = setTimeout(() => finishOpening(), durations[phase]);
  }
}

function finishOpening() {
  if (openingDone) return;
  openingDone = true;
  const oc = document.getElementById('openingCredits');
  if (oc) {
    oc.classList.add('done');
    setTimeout(() => { oc.style.display = 'none'; }, 1500);
  }
  // Start theme music after opening finishes
  setTimeout(() => {
    if (!themeStarted) {
      themePlayer.src = 'audio/theme.mp3';
      themePlayer.volume = 0.3;
      themePlayer.loop = true;
      themePlayer.play().then(() => { themeStarted = true; }).catch(() => {});
    }
  }, 500);
}

function skipOpening() {
  clearTimeout(ocTimer);
  finishOpening();
}

/* ---- Theme Song (auto-play on first interaction) ---- */
function initThemeSong() {
  themePlayer.src = 'audio/theme.mp3';
  themePlayer.volume = 0.3;
  themePlayer.loop = true;

  // Try to play after opening credits finish OR after user interaction
  const startTheme = () => {
    if (!themeStarted && openingDone) {
      themePlayer.play().then(() => { themeStarted = true; }).catch(() => {});
    }
  };
  document.addEventListener('click', startTheme, { once: false });
  document.addEventListener('touchstart', startTheme, { once: true });
}

/* ---- Theme (Dark/Light) ---- */
function initTheme() {
  const saved = localStorage.getItem('ipman_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeIcon(theme);

  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('ipman_theme', next);
      updateThemeIcon(next);
    });
  }
}

function updateThemeIcon(theme) {
  const icon = document.querySelector('.theme-icon');
  if (icon) icon.textContent = theme === 'dark' ? '🌙' : '☀️';
}

/* ---- Particles ---- */
function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  for (let i = 0; i < 15; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = 3 + Math.random() * 6;
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      width: ${size}px; height: ${size}px;
      animation-delay: ${Math.random() * 8}s;
      animation-duration: ${10 + Math.random() * 15}s;
      opacity: ${0.1 + Math.random() * 0.25};
    `;
    container.appendChild(p);
  }
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

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Active nav on scroll
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      if (window.scrollY >= section.offsetTop - 200) current = section.id;
    });
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) link.classList.add('active');
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

  // Update stats
  const totalSongs = chapters.reduce((s, c) => s + (c.songs?.length || 0), 0);
  document.getElementById('chCount').textContent = chapters.length;
  document.getElementById('epCount').textContent = totalSongs;

  // Show buy button if URL exists
  const buyUrl = localStorage.getItem('ipman_buyurl');
  if (buyUrl) {
    ['buyBtnHero', 'buyBtnAbout', 'buyBtnCTA'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.href = buyUrl; el.style.display = ''; }
    });
    const buySection = document.getElementById('buySection');
    if (buySection) buySection.style.display = 'block';
  }
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
        <div class="count">${songCount} ${songCount === 1 ? '首曲目' : '首曲目'}</div>
      </div>
    `;
  }).join('');

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

  // Pause theme song when opening a chapter
  if (themeStarted && !themePlayer.paused) {
    themePlayer.pause();
  }

  // Hide main sections
  ['hero', 'about', 'chapters', 'buySection'].forEach(sId => {
    const el = document.getElementById(sId);
    if (el) el.style.display = 'none';
  });

  // Show songs view
  let sv = document.getElementById('songsView');
  if (!sv) { createSongsView(); sv = document.getElementById('songsView'); }
  sv.style.display = 'block';

  document.getElementById('chapterTitle').textContent = `${currentChapter.icon} ${currentChapter.name}`;

  const sl = document.getElementById('songsList');
  if (!currentChapter.songs || !currentChapter.songs.length) {
    sl.innerHTML = `<div class="empty"><div class="empty-icon">🎙️</div><h3 style="margin-bottom:8px;">暂无曲目</h3><p>曲目即将上线</p></div>`;
  } else {
    sl.innerHTML = currentChapter.songs.map((s, i) => `
      <div class="song-card" id="sc-${i}" onclick="playSong(${i})">
        ${s.image ? `<img src="${s.image}" class="song-img" onerror="this.style.display='none'" loading="lazy">` : '<div class="song-img" style="background:var(--accent-soft);display:flex;align-items:center;justify-content:center;font-size:1.5rem;">🎵</div>'}
        <div class="song-info"><div class="song-title">${s.title}</div></div>
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
    <button class="back-btn" onclick="showHome()">← 返回章节</button>
    <h2 id="chapterTitle" style="margin-bottom:24px;"></h2>
    <div id="songsList"></div>
  `;
  document.body.insertBefore(sv, document.querySelector('.np-bar'));
}

function showHome() {
  ['hero', 'about', 'chapters'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = '';
  });
  const buyUrl = localStorage.getItem('ipman_buyurl');
  const buySection = document.getElementById('buySection');
  if (buySection && buyUrl) buySection.style.display = '';
  const sv = document.getElementById('songsView');
  if (sv) sv.style.display = 'none';
  currentChapter = null;

  // Resume theme song
  if (themeStarted) {
    themePlayer.play().catch(() => {});
  }
}

/* ---- Player ---- */
function playSong(i) {
  if (!currentChapter || !currentChapter.songs || !currentChapter.songs[i]) return;
  currentSong = i;
  const s = currentChapter.songs[i];
  if (!s.audio) return;

  // Pause theme song
  if (themeStarted && !themePlayer.paused) themePlayer.pause();

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
  // Resume theme song
  if (themeStarted) themePlayer.play().catch(() => {});
}

function prevSong() { if (currentChapter && currentSong > 0) playSong(currentSong - 1); }
function nextSong() { if (currentChapter && currentSong + 1 < currentChapter.songs.length) playSong(currentSong + 1); }

// Progress bar
document.getElementById('npProgress')?.addEventListener('click', function(e) {
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

// Preloader
window.addEventListener('load', () => {
  setTimeout(() => {
    const preloader = document.getElementById('preloader');
    if (preloader) { preloader.classList.add('hide'); setTimeout(() => preloader.style.display = 'none', 600); }
  }, 800);
});
