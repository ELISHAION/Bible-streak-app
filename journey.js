/* ════════════════════════════════════════════════════════════
   BIBLE JOURNEY — Daily Manna
   A self-contained Canvas side-scrolling "run & discover" mini
   game. One reusable engine loads story data (obstacles, orbs,
   captions, quiz) so new stories can be added later by extending
   the STORIES array only — no engine changes needed.

   Isolated subsystem, same pattern as readaloud.js: exposes a
   single global, window.BibleJourney, with openHub()/togglePause()
   /confirmQuit(). It reads a few globals from app.js (totalXP,
   saveState, renderHome, getLevel) to award XP into the shared
   profile, but owns all of its own game state, canvas loop and
   localStorage persistence independently.
   ════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const BJ_KEY = 'dailyMannaJourney_v1';

  /* ────────────────────────────────────────────
     STORY DATA  (data-driven — add more stories here)
     All x values are world-space pixels along the level.
     ──────────────────────────────────────────── */
  const STORIES = [
    {
      id: 'creation',
      title: 'Creation & Eden',
      ref: 'Genesis 1–2',
      icon: '🌍',
      blurb: 'Run through the six days of creation and gather the light of each one.',
      badge: { icon: '🌟', name: 'Creation Explorer' },
      xp: 100,
      levelLength: 4400,
      skyFrom: '#050D1A', skyTo: '#174A82',
      groundColor: '#1B4D2E',
      /* WORLD — visual identity for this story only. The renderer below
         reads this generically so a future Noah/Moses/David world can
         supply its own palette and layer tuning without touching the
         drawing code. */
      world: {
        sky:   { top: '#0A1830', mid: '#1E3F63', bottom: '#3E6A8F' },
        sun:   { x: 0.78, y: 0.22, r: 46, color: 'rgba(255,236,190,0.9)', halo: 'rgba(255,225,160,0.35)' },
        mountains:  { color: '#233F58', color2: '#1A2F45', speed: 0.10 },
        hills:      { color: '#2C5540', color2: '#234630', speed: 0.24 },
        groundTop:  '#3E7A46',
        groundLow:  '#274F2E',
        haze: 'rgba(255,244,214,0.05)',
        clouds: { color: 'rgba(255,255,255,0.55)', speed: 0.05 },
        particles: { color: 'rgba(255,241,196,0.65)', density: 14 }
      },
      captions: [
        { x: 60,   text: '"In the beginning, God created the heavens and the earth."' },
        { x: 260,  text: 'Day 1 — "Let there be light."' },
        { x: 980,  text: 'Day 2 — The sky divides the waters.' },
        { x: 1760, text: 'Day 3 — Dry land, seas & plants appear.' },
        { x: 2540, text: 'Day 4 — Sun, moon & stars are set in the sky.' },
        { x: 3260, text: 'Day 5 — Creatures fill the sea and sky.' },
        { x: 3960, text: 'Day 6 — God forms man & woman in His image.' },
        { x: 4300, text: 'Day 7 — God rests, and calls it very good.' }
      ],
      obstacles: [
        { x: 520,  type: 'rock',   w: 34, h: 32 },
        { x: 860,  type: 'pit',    w: 68 },
        { x: 1280, type: 'rock',   w: 34, h: 32 },
        { x: 1620, type: 'branch', w: 64, h: 18 },
        { x: 2060, type: 'pit',    w: 78 },
        { x: 2420, type: 'rock',   w: 34, h: 32 },
        { x: 2860, type: 'branch', w: 64, h: 18 },
        { x: 3280, type: 'pit',    w: 70 },
        { x: 3640, type: 'rock',   w: 34, h: 32 },
        { x: 3980, type: 'branch', w: 64, h: 18 }
      ],
      orbs: [
        { x: 260,  label: 'Day 1 · Light' },
        { x: 980,  label: 'Day 2 · Sky' },
        { x: 1760, label: 'Day 3 · Land & Plants' },
        { x: 2540, label: 'Day 4 · Sun, Moon & Stars' },
        { x: 3260, label: 'Day 5 · Creatures' },
        { x: 3960, label: 'Day 6 · Mankind' }
      ],
      quiz: [
        { q: 'How many days did God take to create everything?', opts: ['5 days', '6 days', '7 days', '40 days'], ans: 1 },
        { q: 'What was the very first thing God created?', opts: ['Animals', 'Light', 'The sun', 'Man'], ans: 1 },
        { q: 'From what did God form man?', opts: ['Water', 'Dust of the ground', 'Clay from a river', 'Stone'], ans: 1 },
        { q: 'What did God call the garden He planted?', opts: ['Canaan', 'Eden', 'Zion', 'Ararat'], ans: 1 },
        { q: 'What did God do on the seventh day?', opts: ['Created more animals', 'Rested', 'Sent rain', 'Made the ark'], ans: 1 }
      ]
    }
  ];

  /* ────────────────────────────────────────────
     PERSISTENCE  (separate from the main app state)
     ──────────────────────────────────────────── */
  function loadProgress() {
    try {
      const raw = localStorage.getItem(BJ_KEY);
      if (!raw) return { completed: {} };
      const d = JSON.parse(raw);
      return (d && typeof d === 'object') ? Object.assign({ completed: {} }, d) : { completed: {} };
    } catch (e) { return { completed: {} }; }
  }
  function saveProgress() {
    try { localStorage.setItem(BJ_KEY, JSON.stringify(progress)); } catch (e) {}
  }
  let progress = loadProgress();

  function getEarnedBadges() {
    return STORIES.filter(s => progress.completed[s.id]).map(s => s.badge);
  }

  /* ── XP hook into the shared Daily Manna profile (app.js globals) ── */
  function grantXP(amount) {
    try {
      if (typeof totalXP !== 'undefined') {
        totalXP += amount;
        if (typeof saveState === 'function') saveState();
        if (typeof renderHome === 'function') renderHome();
      }
    } catch (e) { /* app.js globals not available yet — safe no-op */ }
  }

  /* ────────────────────────────────────────────
     ENGINE CONSTANTS
     ──────────────────────────────────────────── */
  const GROUND_Y   = 300;   // canvas-space y of the ground line
  const PLAYER_X   = 66;    // fixed screen-space x of the player
  const GRAVITY    = 0.62;
  const JUMP_V     = -12.2;
  const RUN_SPEED  = 3.1;   // world px per frame
  const SLIDE_MS   = 480;
  const HIT_INVULN_MS = 1000;
  const START_LIVES = 3;

  let canvas, ctx;
  let raf = null;
  let paused = false;
  let g = null; // live game state for the active run

  /* ────────────────────────────────────────────
     HUB
     ──────────────────────────────────────────── */
  function openHub() {
    cancelLoop();
    document.getElementById('bj-play-view').style.display = 'none';
    document.getElementById('bj-hub-view').style.display = '';
    renderHub();
  }

  function renderHub() {
    const list = document.getElementById('bj-story-list');
    if (!list) return;
    list.innerHTML = '';
    STORIES.forEach(s => {
      const done = !!progress.completed[s.id];
      const card = document.createElement('div');
      card.className = 'bj-story-card';
      card.innerHTML = `
        <div class="bj-story-icon">${s.icon}</div>
        <div class="bj-story-info">
          <div class="bj-story-title-row">
            <div class="bj-story-title">${s.title}</div>
            ${done ? '<span class="bj-story-done">✓ Done</span>' : ''}
          </div>
          <div class="bj-story-ref">${s.ref}</div>
          <div class="bj-story-blurb">${s.blurb}</div>
        </div>
        <button class="bj-play-btn">${done ? 'Replay' : 'Play'} ▶</button>`;
      card.querySelector('.bj-play-btn').addEventListener('click', () => startStory(s.id));
      list.appendChild(card);
    });
  }

  /* ────────────────────────────────────────────
     START / SETUP
     ──────────────────────────────────────────── */
  function startStory(id) {
    const story = STORIES.find(s => s.id === id);
    if (!story) return;

    canvas = document.getElementById('bj-canvas');
    ctx = canvas.getContext('2d');

    g = {
      story,
      worldX: 0,
      speed: RUN_SPEED,
      player: { y: GROUND_Y, vy: 0, state: 'run', slideUntil: 0, animT: 0, landFlash: 0, wasJump: false },
      lives: START_LIVES,
      invulnUntil: 0,
      collected: new Set(),
      captionShownFor: new Set(),
      captionUntil: 0,
      finished: false,
      lastTs: null,
      clouds: makeClouds(),
      grassPhase: 0
    };

    document.getElementById('bj-hub-view').style.display = 'none';
    document.getElementById('bj-play-view').style.display = '';
    document.getElementById('bj-overlay').style.display = 'none';
    document.getElementById('bj-caption').style.display = 'none';
    paused = false;
    document.getElementById('bj-pause-btn').textContent = '⏸';
    updateHUD();
    bindControlsOnce();
    raf = requestAnimationFrame(loop);
  }

  let controlsBound = false;
  function bindControlsOnce() {
    if (controlsBound) return;
    controlsBound = true;
    const jumpBtn = document.getElementById('bj-btn-jump');
    const slideBtn = document.getElementById('bj-btn-slide');
    jumpBtn.addEventListener('click', doJump);
    slideBtn.addEventListener('click', doSlide);
    canvas = document.getElementById('bj-canvas');
    canvas.addEventListener('pointerdown', doJump);
    window.addEventListener('keydown', (e) => {
      if (!g || paused || g.finished) return;
      if (document.getElementById('screen-journey') && !document.getElementById('screen-journey').classList.contains('active')) return;
      if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); doJump(); }
      else if (e.code === 'ArrowDown') { e.preventDefault(); doSlide(); }
    });
  }

  function doJump() {
    if (!g || paused || g.finished) return;
    const p = g.player;
    if (p.state === 'run') { p.state = 'jump'; p.vy = JUMP_V; }
  }
  function doSlide() {
    if (!g || paused || g.finished) return;
    const p = g.player;
    if (p.state === 'run') { p.state = 'slide'; p.slideUntil = performance.now() + SLIDE_MS; }
  }

  /* ────────────────────────────────────────────
     GAME LOOP
     ──────────────────────────────────────────── */
  function loop(ts) {
    if (!g) return;
    raf = requestAnimationFrame(loop);
    if (paused) return;
    if (g.lastTs == null) g.lastTs = ts;
    g.lastTs = ts;

    if (!g.finished) update(ts);
    draw(ts);
  }

  function cancelLoop() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    g = null;
  }

  function update(ts) {
    const p = g.player;

    // Physics
    if (p.state === 'jump') {
      p.wasJump = true;
      p.y += p.vy;
      p.vy += GRAVITY;
      if (p.y >= GROUND_Y) {
        p.y = GROUND_Y; p.vy = 0; p.state = 'run';
        if (p.wasJump) { p.landFlash = 1; p.wasJump = false; } // squash/stretch cue on landing
      }
    } else if (p.state === 'slide') {
      if (ts >= p.slideUntil) p.state = 'run';
    }
    if (p.landFlash > 0) p.landFlash = Math.max(0, p.landFlash - 0.08);
    p.animT += g.speed * 0.045; // drives the run-cycle leg/arm swing, independent of state

    // Advance world
    g.worldX += g.speed;
    g.grassPhase += 0.02;

    // Obstacle collisions (only near the player's fixed screen x)
    const invuln = ts < g.invulnUntil;
    if (!invuln) {
      g.story.obstacles.forEach(ob => {
        const screenX = ob.x - g.worldX + PLAYER_X;
        const width = ob.w || 40;
        if (screenX < PLAYER_X + 22 && screenX + width > PLAYER_X - 8) {
          let hit = false;
          if (ob.type === 'rock')   hit = p.state !== 'jump' || p.y > GROUND_Y - 18;
          if (ob.type === 'pit')    hit = p.state !== 'jump';
          if (ob.type === 'branch') hit = p.state !== 'slide';
          if (hit) onHit(ts);
        }
      });
    }

    // Orb collection
    g.story.orbs.forEach((orb, i) => {
      if (g.collected.has(i)) return;
      const screenX = orb.x - g.worldX + PLAYER_X;
      if (Math.abs(screenX - PLAYER_X) < 20) {
        g.collected.add(i);
        updateHUD();
      }
    });

    // Captions
    g.story.captions.forEach((c, i) => {
      const screenX = c.x - g.worldX + PLAYER_X;
      if (!g.captionShownFor.has(i) && screenX <= PLAYER_X + 40 && screenX > PLAYER_X - 40) {
        g.captionShownFor.add(i);
        showCaption(c.text);
      }
    });

    // Progress bar
    const pct = Math.min(100, (g.worldX / g.story.levelLength) * 100);
    const fill = document.getElementById('bj-progress-fill');
    if (fill) fill.style.width = pct + '%';

    // Finish
    if (g.worldX >= g.story.levelLength) {
      g.finished = true;
      setTimeout(() => showFinishOverlay(), 250);
    }
  }

  function onHit(ts) {
    g.lives -= 1;
    g.invulnUntil = ts + HIT_INVULN_MS;
    g.worldX = Math.max(0, g.worldX - 40); // small knockback
    updateHUD();
    if (g.lives <= 0) {
      g.finished = true;
      setTimeout(() => showGameOverOverlay(), 200);
    }
  }

  function showCaption(text) {
    const el = document.getElementById('bj-caption');
    if (!el) return;
    el.textContent = text;
    el.style.display = 'flex';
    el.classList.remove('bj-caption-pop');
    void el.offsetWidth;
    el.classList.add('bj-caption-pop');
    clearTimeout(showCaption._t);
    showCaption._t = setTimeout(() => { el.style.display = 'none'; }, 2600);
  }

  function updateHUD() {
    const heartsEl = document.getElementById('bj-hearts');
    const orbEl = document.getElementById('bj-orbcount');
    if (heartsEl) heartsEl.textContent = '❤️'.repeat(Math.max(0, g.lives)) + '🖤'.repeat(START_LIVES - Math.max(0, g.lives));
    if (orbEl) orbEl.textContent = `⭐ ${g.collected.size}/${g.story.orbs.length}`;
  }

  /* ────────────────────────────────────────────
     PROCEDURAL HELPERS  (clouds, terrain silhouettes)
     ──────────────────────────────────────────── */
  function makeClouds() {
    const arr = [];
    for (let i = 0; i < 6; i++) {
      arr.push({ seed: i, baseX: i * 220 + (i % 2) * 60, y: 30 + (i * 37) % 90, scale: 0.7 + (i % 3) * 0.22 });
    }
    return arr;
  }

  /** Deterministic pseudo-random in [0,1) from an integer seed — used so
   *  terrain bumps/rocks/grass tufts look organic but never change shape
   *  between frames (no per-frame Math.random, which would jitter). */
  function hashN(n) {
    const x = Math.sin(n * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }

  function drawCloud(cx, cy, scale, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 26 * scale, 12 * scale, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 20 * scale, cy + 4 * scale, 18 * scale, 10 * scale, 0, 0, Math.PI * 2);
    ctx.ellipse(cx - 20 * scale, cy + 5 * scale, 16 * scale, 9 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /** Rolling ridge line used for both the distant mountains and the
   *  mid-ground hills — same helper, different amplitude/color/speed so
   *  they read as separate depth layers under parallax. */
  function drawRidge(baseline, amplitude, wavelength, parallax, colorTop, colorBottom, w, h) {
    const offset = g.worldX * parallax;
    ctx.beginPath();
    ctx.moveTo(0, baseline);
    for (let x = 0; x <= w; x += 14) {
      const worldPos = x + offset;
      const y = baseline - amplitude * (0.5 + 0.5 * Math.sin(worldPos / wavelength) * Math.sin(worldPos / (wavelength * 2.3) + 1.7));
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
    const grad = ctx.createLinearGradient(0, baseline - amplitude, 0, h);
    grad.addColorStop(0, colorTop);
    grad.addColorStop(1, colorBottom);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  /* ────────────────────────────────────────────
     DRAW  — layered: sky → sun → clouds → mountains →
     hills → ground/terrain → obstacles → orbs → player →
     atmosphere particles. Each layer scrolls at its own
     parallax factor so the world reads with real depth.
     ──────────────────────────────────────────── */
  function draw(ts) {
    const w = canvas.width, h = canvas.height;
    const world = g.story.world;

    // Layer 1 — sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, world.sky.top);
    sky.addColorStop(0.55, world.sky.mid);
    sky.addColorStop(1, world.sky.bottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Sun with soft halo — fixed in screen space, gives a believable light source
    const sunX = w * world.sun.x, sunY = h * world.sun.y;
    const halo = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, world.sun.r * 2.6);
    halo.addColorStop(0, world.sun.halo);
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(sunX, sunY, world.sun.r * 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = world.sun.color;
    ctx.beginPath(); ctx.arc(sunX, sunY, world.sun.r, 0, Math.PI * 2); ctx.fill();

    // Layer 2 — clouds (very slow parallax)
    g.clouds.forEach(c => {
      const sx = ((c.baseX - g.worldX * world.clouds.speed) % (w + 220) + (w + 220)) % (w + 220) - 110;
      drawCloud(sx, c.y, c.scale, world.clouds.color);
    });

    // Layer 3 — distant mountains (slow parallax)
    drawRidge(GROUND_Y - 60, 70, 240, world.mountains.speed, world.mountains.color, world.mountains.color2, w, h);

    // Layer 4 — mid-ground hills/treeline (medium parallax)
    drawRidge(GROUND_Y + 6, 46, 140, world.hills.speed, world.hills.color, world.hills.color2, w, h);
    drawTreeline(world.hills.speed, w);

    // Atmospheric haze band near the horizon adds depth without any glow
    const hazeGrad = ctx.createLinearGradient(0, GROUND_Y - 40, 0, GROUND_Y + 20);
    hazeGrad.addColorStop(0, 'rgba(0,0,0,0)');
    hazeGrad.addColorStop(1, world.haze);
    ctx.fillStyle = hazeGrad;
    ctx.fillRect(0, GROUND_Y - 40, w, 60);

    // Layer 6 — ground with grass/dirt texture (full-speed parallax = worldX directly)
    drawGround(world, w, h);

    // Layer 5 — environment objects sitting on the ground (rocks/tufts), non-interactive dressing
    drawGroundDetail(w);

    // Obstacles (the interactive ones)
    g.story.obstacles.forEach(ob => drawObstacle(ob, w));

    // Orbs — soft glow kept subtle and warm rather than neon
    g.story.orbs.forEach((orb, i) => {
      if (g.collected.has(i)) return;
      const sx = orb.x - g.worldX + PLAYER_X;
      if (sx < -30 || sx > w + 30) return;
      const bob = Math.sin(ts / 260 + i) * 5;
      const gr = ctx.createRadialGradient(sx, GROUND_Y - 58 + bob, 2, sx, GROUND_Y - 58 + bob, 15);
      gr.addColorStop(0, '#FFF6CC');
      gr.addColorStop(1, 'rgba(244,185,66,0)');
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(sx, GROUND_Y - 58 + bob, 15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#F4B942';
      ctx.beginPath(); ctx.arc(sx, GROUND_Y - 58 + bob, 6, 0, Math.PI * 2); ctx.fill();
    });

    // Player shadow, then illustrated character
    drawPlayer(ts);

    // Foreground atmosphere — a few slow drifting motes for warmth, not sparkle-spam
    drawAtmosphereParticles(ts, world, w, h);
  }

  function drawTreeline(parallax, w) {
    const offset = g.worldX * parallax;
    const spacing = 96;
    ctx.fillStyle = 'rgba(20,40,28,0.55)';
    for (let x = -spacing; x < w + spacing; x += spacing) {
      const worldPos = x + offset;
      const seed = Math.floor(worldPos / spacing);
      const jitter = hashN(seed) * 18 - 9;
      const treeX = ((worldPos % spacing) + spacing) % spacing - spacing / 2 + x + jitter;
      const baseY = GROUND_Y - 4;
      const th = 30 + hashN(seed + 50) * 16;
      ctx.beginPath();
      ctx.moveTo(treeX, baseY);
      ctx.lineTo(treeX - 13, baseY - th * 0.55);
      ctx.lineTo(treeX + 13, baseY - th * 0.55);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(treeX, baseY - th * 0.35);
      ctx.lineTo(treeX - 10, baseY - th);
      ctx.lineTo(treeX + 10, baseY - th);
      ctx.closePath(); ctx.fill();
    }
  }

  function drawGround(world, w, h) {
    const topY = GROUND_Y + 26;
    const grad = ctx.createLinearGradient(0, topY, 0, h);
    grad.addColorStop(0, world.groundTop);
    grad.addColorStop(1, world.groundLow);
    ctx.fillStyle = grad;
    ctx.fillRect(0, topY, w, h - topY);
    // A subtle lit edge along the top of the ground line, like sunlight grazing the terrain
    ctx.strokeStyle = 'rgba(255,244,214,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, topY); ctx.lineTo(w, topY); ctx.stroke();

    // Grass tufts — gently swaying, deterministic placement scrolling at ground speed
    const spacing = 22;
    const offset = g.worldX % spacing;
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    for (let x = -spacing; x < w + spacing; x += spacing) {
      const seed = Math.floor((x + g.worldX) / spacing);
      const sway = Math.sin(g.grassPhase + seed) * 2.2;
      const gx = x - offset;
      const gh = 6 + hashN(seed) * 5;
      ctx.beginPath();
      ctx.moveTo(gx, topY);
      ctx.lineTo(gx + sway, topY - gh);
      ctx.stroke();
    }
  }

  function drawGroundDetail(w) {
    const spacing = 130;
    const offset = g.worldX;
    ctx.fillStyle = 'rgba(60,50,40,0.55)';
    for (let x = -spacing; x < w + spacing; x += spacing) {
      const seed = Math.floor((x + offset) / spacing);
      if (hashN(seed + 9) < 0.45) continue; // not every slot gets a pebble — avoids visual monotony
      const gx = ((x + offset) % spacing + spacing) % spacing - spacing / 2 + x - (offset % spacing);
      const topY = GROUND_Y + 26;
      const rw = 5 + hashN(seed) * 6;
      ctx.beginPath();
      ctx.ellipse(gx, topY + 3, rw, rw * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawObstacle(ob, w) {
    const sx = ob.x - g.worldX + PLAYER_X;
    if (sx < -100 || sx > w + 100) return;
    const topY = GROUND_Y + 26;
    if (ob.type === 'rock') {
      ctx.fillStyle = '#6B7B87';
      ctx.beginPath();
      ctx.moveTo(sx - ob.w / 2, topY);
      ctx.lineTo(sx - ob.w * 0.18, topY - ob.h);
      ctx.lineTo(sx + ob.w * 0.22, topY - ob.h * 0.9);
      ctx.lineTo(sx + ob.w / 2, topY);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath();
      ctx.moveTo(sx - ob.w * 0.18, topY - ob.h);
      ctx.lineTo(sx - ob.w * 0.02, topY - ob.h * 0.75);
      ctx.lineTo(sx - ob.w * 0.3, topY - ob.h * 0.55);
      ctx.closePath(); ctx.fill();
    } else if (ob.type === 'pit') {
      ctx.fillStyle = '#0A1424';
      ctx.fillRect(sx - ob.w / 2, topY, ob.w, canvas.height - topY);
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(sx - ob.w / 2, topY); ctx.lineTo(sx - ob.w / 2, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx + ob.w / 2, topY); ctx.lineTo(sx + ob.w / 2, canvas.height); ctx.stroke();
    } else if (ob.type === 'branch') {
      ctx.strokeStyle = '#5C3D22';
      ctx.lineWidth = ob.h * 0.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx - ob.w / 2, GROUND_Y - 44);
      ctx.quadraticCurveTo(sx, GROUND_Y - 52, sx + ob.w / 2, GROUND_Y - 40);
      ctx.stroke();
    }
  }

  /** Illustrated traveler character with a bob/limb-swing run cycle,
   *  landing squash, ducked silhouette on slide, and a soft ground
   *  shadow — replaces the earlier placeholder ellipse-and-circle. */
  function drawPlayer(ts) {
    const p = g.player;
    const flashHidden = ts < g.invulnUntil && Math.floor(ts / 100) % 2 === 0;
    if (flashHidden) return;

    const sliding = p.state === 'slide';
    const airborne = p.state === 'jump';
    const bob = sliding ? 0 : Math.sin(p.animT) * 2.4;
    const squash = 1 + p.landFlash * 0.28;      // landing squash/stretch
    const stretch = 1 - p.landFlash * 0.16;
    const baseY = p.y + 26; // canvas-space y of the feet
    const hipY = sliding ? baseY - 14 : baseY - 30 + bob;

    // Soft contact shadow — shrinks while airborne, communicates height off the ground
    const shadowScale = airborne ? Math.max(0.35, 1 - (GROUND_Y - p.y) / 90) : 1;
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(PLAYER_X, GROUND_Y + 27, 14 * shadowScale, 4.5 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(PLAYER_X, hipY);
    if (sliding) ctx.rotate(-0.28);
    ctx.scale(stretch, squash);

    const swing = sliding ? 0 : Math.sin(p.animT) * (airborne ? 0.35 : 1);
    const legLen = sliding ? 10 : 16;

    // Legs (two simple tapered strokes swinging opposite phase)
    ctx.strokeStyle = '#8A5A34';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(-3 + swing * 6, legLen); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(3, 0); ctx.lineTo(3 - swing * 6, legLen); ctx.stroke();

    // Robe/tunic torso — a simple trapezoid reads as clothing rather than a geometric blob
    ctx.fillStyle = '#C97B3D';
    ctx.beginPath();
    ctx.moveTo(-9, sliding ? -6 : -22);
    ctx.lineTo(9, sliding ? -6 : -22);
    ctx.lineTo(11, 2);
    ctx.lineTo(-11, 2);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.moveTo(-2, sliding ? -6 : -22); ctx.lineTo(2, sliding ? -6 : -22); ctx.lineTo(2, 2); ctx.lineTo(-2, 2);
    ctx.closePath(); ctx.fill(); // center seam/fold for a touch of garment detail

    if (!sliding) {
      // Arms swing opposite the legs
      ctx.strokeStyle = '#C97B3D';
      ctx.lineWidth = 4.5;
      ctx.beginPath(); ctx.moveTo(-8, -18); ctx.lineTo(-8 - swing * 5, -2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(8, -18); ctx.lineTo(8 + swing * 5, -2); ctx.stroke();
    }

    // Head + simple head-covering (reads as a biblical-era traveler, not a modern figure)
    const headY = sliding ? -12 : -30;
    ctx.fillStyle = '#E8B48A';
    ctx.beginPath(); ctx.arc(0, headY, 7.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#F4B942';
    ctx.beginPath();
    ctx.moveTo(-8, headY - 2);
    ctx.quadraticCurveTo(0, headY - 13, 8, headY - 2);
    ctx.quadraticCurveTo(6, headY + 3, 0, headY + 1);
    ctx.quadraticCurveTo(-6, headY + 3, -8, headY - 2);
    ctx.closePath(); ctx.fill();

    ctx.restore();
  }

  function drawAtmosphereParticles(ts, world, w, h) {
    ctx.fillStyle = world.particles.color;
    const n = world.particles.density;
    for (let i = 0; i < n; i++) {
      const seed = i * 97.13;
      const speed = 8 + hashN(i) * 10;
      const px = ((seed * 3 - g.worldX * 0.06 * (0.5 + hashN(i + 1))) % (w + 40) + (w + 40)) % (w + 40) - 20;
      const py = ((ts / (600 + speed * 40)) * h + seed * 5) % h;
      const r = 1 + hashN(i + 2) * 1.4;
      ctx.globalAlpha = 0.3 + 0.3 * Math.sin(ts / 900 + i);
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* ────────────────────────────────────────────
     OVERLAYS: finish → scripture → quiz → badge
     ──────────────────────────────────────────── */
  function showOverlay(html) {
    const el = document.getElementById('bj-overlay');
    el.innerHTML = html;
    el.style.display = 'flex';
  }
  function hideOverlay() {
    document.getElementById('bj-overlay').style.display = 'none';
  }

  function showFinishOverlay() {
    cancelLoop();
    const s = g && g.story ? g.story : null;
    const story = s || STORIES[0];
    const collectedCount = g ? g.collected.size : 0;
    showOverlay(`
      <div class="bj-card">
        <div class="bj-card-icon">🏁</div>
        <div class="bj-card-title">Journey Complete!</div>
        <div class="bj-card-sub">You gathered ${collectedCount}/${story.orbs.length} lights of creation.</div>
        <div class="bj-ref-pill">${story.ref}</div>
        <button class="bj-btn-primary" id="bj-to-quiz-btn">Take the Scripture Quiz →</button>
      </div>`);
    document.getElementById('bj-to-quiz-btn').addEventListener('click', () => startQuiz(story));
  }

  function showGameOverOverlay() {
    cancelLoop();
    showOverlay(`
      <div class="bj-card">
        <div class="bj-card-icon">💔</div>
        <div class="bj-card-title">Out of Hearts</div>
        <div class="bj-card-sub">Take heart — try the path again.</div>
        <button class="bj-btn-primary" id="bj-retry-btn">Try Again</button>
        <button class="bj-btn-secondary" id="bj-quit-btn2">Quit to Map</button>
      </div>`);
    const storyId = g.story.id;
    document.getElementById('bj-retry-btn').addEventListener('click', () => { hideOverlay(); startStory(storyId); });
    document.getElementById('bj-quit-btn2').addEventListener('click', () => { hideOverlay(); openHub(); });
  }

  let quizState = null;
  function startQuiz(story) {
    quizState = { story, idx: 0, correct: 0 };
    renderQuizQuestion();
  }
  function renderQuizQuestion() {
    const { story, idx } = quizState;
    const q = story.quiz[idx];
    showOverlay(`
      <div class="bj-card">
        <div class="bj-quiz-label">QUESTION ${idx + 1} OF ${story.quiz.length}</div>
        <div class="bj-quiz-q">${q.q}</div>
        <div class="bj-quiz-opts" id="bj-quiz-opts"></div>
      </div>`);
    const wrap = document.getElementById('bj-quiz-opts');
    q.opts.forEach((opt, i) => {
      const b = document.createElement('button');
      b.className = 'bj-quiz-opt';
      b.textContent = opt;
      b.addEventListener('click', () => answerQuiz(i, b));
      wrap.appendChild(b);
    });
  }
  function answerQuiz(i, btnEl) {
    const { story, idx } = quizState;
    const q = story.quiz[idx];
    const opts = document.querySelectorAll('.bj-quiz-opt');
    opts.forEach(o => o.classList.add('bj-quiz-disabled'));
    if (i === q.ans) {
      btnEl.classList.add('bj-quiz-correct');
      quizState.correct += 1;
    } else {
      btnEl.classList.add('bj-quiz-wrong');
      if (opts[q.ans]) opts[q.ans].classList.add('bj-quiz-correct');
    }
    setTimeout(() => {
      quizState.idx += 1;
      if (quizState.idx >= story.quiz.length) showBadgeOverlay(story, quizState.correct);
      else renderQuizQuestion();
    }, 1100);
  }

  function showBadgeOverlay(story, correctCount) {
    const alreadyDone = !!progress.completed[story.id];
    progress.completed[story.id] = true;
    saveProgress();
    if (!alreadyDone) grantXP(story.xp);

    showOverlay(`
      <div class="bj-card">
        <div class="bj-badge-icon">${story.badge.icon}</div>
        <div class="bj-card-title">${story.badge.name}</div>
        <div class="bj-card-sub">${correctCount}/${story.quiz.length} correct on the ${story.title} quiz.</div>
        ${alreadyDone
          ? '<div class="bj-ref-pill">Badge already earned</div>'
          : `<div class="bj-xp-pill">+${story.xp} XP</div>`}
        <button class="bj-btn-primary" id="bj-done-btn">Continue Journey 🏠</button>
      </div>`);
    document.getElementById('bj-done-btn').addEventListener('click', () => { hideOverlay(); openHub(); });
  }

  /* ────────────────────────────────────────────
     PAUSE / QUIT
     ──────────────────────────────────────────── */
  function togglePause() {
    if (!g || g.finished) return;
    paused = !paused;
    document.getElementById('bj-pause-btn').textContent = paused ? '▶' : '⏸';
    if (paused) {
      showOverlay(`
        <div class="bj-card">
          <div class="bj-card-icon">⏸</div>
          <div class="bj-card-title">Paused</div>
          <button class="bj-btn-primary" id="bj-resume-btn">Resume</button>
          <button class="bj-btn-secondary" id="bj-quit-btn3">Quit to Map</button>
        </div>`);
      document.getElementById('bj-resume-btn').addEventListener('click', () => { hideOverlay(); togglePause(); });
      document.getElementById('bj-quit-btn3').addEventListener('click', () => { hideOverlay(); openHub(); });
    } else {
      hideOverlay();
    }
  }
  function confirmQuit() {
    if (!g) { openHub(); return; }
    paused = true;
    showOverlay(`
      <div class="bj-card">
        <div class="bj-card-icon">🛑</div>
        <div class="bj-card-title">Leave this run?</div>
        <div class="bj-card-sub">Your progress in this attempt will be lost.</div>
        <button class="bj-btn-primary" id="bj-leave-yes">Quit to Map</button>
        <button class="bj-btn-secondary" id="bj-leave-no">Keep Playing</button>
      </div>`);
    document.getElementById('bj-leave-yes').addEventListener('click', () => { hideOverlay(); openHub(); });
    document.getElementById('bj-leave-no').addEventListener('click', () => { hideOverlay(); paused = false; });
  }

  window.BibleJourney = { openHub, togglePause, confirmQuit, getEarnedBadges };
})();
