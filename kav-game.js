/* ============================================================
 *  KAV MOON CATCHER v4 — Vanilla JS Game Engine (PERFORMANCE + NEW FEATURES)
 *
 *  Performance optimizations:
 *    - KAV SVG cached (only rebuild on signature change)
 *    - Item DOM elements pooled (Map<id, HTMLElement>), reuse via style.transform
 *    - Particles drawn on canvas (not DOM) — 50+ dots, no jank
 *    - Floating texts pooled (Map<id, HTMLElement>)
 *    - HUD updated via textContent (no innerHTML rebuild)
 *    - Background parallax via transform on parent (GPU-accelerated)
 *    - will-change hints for animated layers
 *
 *  New features (v4):
 *    - Boss Hazard system (giant asteroid every 10 levels, health bar, 5 hits to defeat)
 *    - Lucky Clover item (random power-up)
 *    - Combo bar visual (fills toward 5x)
 *    - Damage flash overlay (red on hit)
 *    - Level-up burst (gold particles from KAV)
 *    - Speed lines (visible when speed > 2x)
 *    - Magnet visual lines (canvas-drawn)
 *    - Parallax background (3 layers of stars)
 *    - Animated nebula clouds + aurora + comets
 * ============================================================ */

(function () {
  'use strict'

  const buildKav = window.KAV.buildKavCharacter
  const buildRocket = window.KAV.buildKavRocket
  const OUTFIT_INFO = window.KAV.OUTFIT_INFO
  const sfx = window.KAV.getSfx()

  // === DOM refs ===
  const $ = (id) => document.getElementById(id)
  const els = {
    game: $('game'),
    bgGradient: $('bg-gradient'),
    bgParallaxFar: $('bg-parallax-far'),
    bgParallaxMid: $('bg-parallax-mid'),
    bgParallaxNear: $('bg-parallax-near'),
    bgNebula: $('bg-nebula'),
    bgComets: $('bg-comets'),
    bgPlanets: $('bg-planets'),
    // Performance layers
    particlesCanvas: $('particles-canvas'),
    magnetCanvas: $('magnet-canvas'),
    itemsLayer: $('items-layer'),
    textsLayer: $('texts-layer'),
    kavCharacter: $('kav-character'),
    comboTrail: $('combo-trail'),
    speedLines: $('speed-lines'),
    damageFlash: $('damage-flash'),
    levelupBurst: $('levelup-burst'),
    // HUD
    hud: $('hud'),
    scoreDisplay: $('score-display'),
    levelChip: $('level-chip'),
    outfitChip: $('outfit-chip'),
    waveChip: $('wave-chip'),
    speedChip: $('speed-chip'),
    livesDisplay: $('lives-display'),
    comboBadge: $('combo-badge'),
    comboBarFill: $('combo-bar-fill'),
    powerBar: $('power-bar'),
    pauseBtn: $('pause-btn'),
    // Boss
    bossBar: $('boss-bar'),
    bossHealthFill: $('boss-health-fill'),
    // Popups
    achievementPopup: $('achievement-popup'),
    outfitPopup: $('outfit-popup'),
    outfitPreview: $('outfit-preview'),
    waveAnnounce: $('wave-announce'),
    waveAnnounceLabel: $('wave-announce-label'),
    waveAnnounceNumber: $('wave-announce-number'),
    waveAnnounceTagline: $('wave-announce-tagline'),
    bottomHint: $('bottom-hint'),
    muteBtn: $('mute-btn'),
    // Touch controls + tutorial
    touchControls: $('touch-controls'),
    touchLeft: $('touch-left'),
    touchRight: $('touch-right'),
    touchZoneLeft: $('touch-zone-left'),
    touchZoneRight: $('touch-zone-right'),
    tutorial: $('tutorial'),
    tutorialText: $('tutorial-text'),
    tutorialControls: $('tutorial-controls'),
    tutorialClose: $('tutorial-close'),
    // Screens
    screenMenu: $('screen-menu'),
    screenPause: $('screen-pause'),
    screenGameover: $('screen-gameover'),
    screenNameentry: $('screen-nameentry'),
    screenLeaderboard: $('screen-leaderboard'),
    screenShare: $('screen-share'),
    // Menu
    menuKav: $('menu-kav'),
    playBtn: $('play-btn'),
    badgeBest: $('badge-best'),
    badgeAch: $('badge-ach'),
    badgeLeaderboard: $('badge-leaderboard'),
    dailyInfo: $('daily-info'),
    dailyDate: $('daily-date'),
    dailyStats: $('daily-stats'),
    // Pause
    resumeBtn: $('resume-btn'),
    restartBtn: $('restart-btn'),
    quitBtn: $('quit-btn'),
    // Game over
    gameoverKav: $('gameover-kav'),
    finalScore: $('final-score'),
    finalBest: $('final-best'),
    finalCatches: $('final-catches'),
    finalCombo: $('final-combo'),
    finalWave: $('final-wave'),
    finalSpeed: $('final-speed'),
    newHighBadge: $('new-high-badge'),
    playAgainBtn: $('play-again-btn'),
    shareBtn: $('share-btn'),
    viewLeaderboardBtn: $('view-leaderboard-btn'),
    backToMenuBtn: $('back-to-menu-btn'),
    // Name entry
    nameentryInfo: $('nameentry-info'),
    nameInput: $('name-input'),
    saveNameBtn: $('save-name-btn'),
    // Leaderboard
    leaderboardEntries: $('leaderboard-entries'),
    achCount: $('ach-count'),
    achGrid: $('ach-grid'),
    lbBackBtn: $('lb-back-btn'),
    // Share
    shareCanvas: $('share-canvas'),
    copyShareBtn: $('copy-share-btn'),
    downloadShareBtn: $('download-share-btn'),
    tweetShareBtn: $('tweet-share-btn'),
    closeShareBtn: $('close-share-btn'),
  }

  // === Item config (NEW: shooter theme — enemies + power-ups) ===
  const ITEM_CONFIG = {
    // ENEMIES (shoot to destroy)
    bear:     { emoji: '🐻', points: 10,  hazard: false, weight: 26, color: '#FFD93D', hp: 1, isEnemy: true },
    fud:      { emoji: '📉', points: 15,  hazard: false, weight: 16, color: '#FF6B6B', hp: 1, isEnemy: true },
    shitcoin: { emoji: '💩', points: 20,  hazard: false, weight: 8,  color: '#FFA040', hp: 1, isEnemy: true, erratic: true },
    clown:    { emoji: '🤡', points: 30,  hazard: false, weight: 5,  color: '#FF8FA3', hp: 2, isEnemy: true, zigzag: true },
    redcandle:{ emoji: '📊', points: 25,  hazard: false, weight: 6,  color: '#FF3030', hp: 1, isEnemy: true },
    whale:    { emoji: '🐋', points: 50,  hazard: false, weight: 3,  color: '#5DADE2', hp: 3, isEnemy: true, tanky: true },
    asteroid: { emoji: '☄️', points: 15,  hazard: true,  weight: 8,  color: '#888888', hp: 2, isEnemy: true },
    // POWER-UPS (shoot to activate)
    shield:   { emoji: '🛡️', points: 0,  hazard: false, weight: 3,  color: '#8DCFF2', power: 'shield' },
    magnet:   { emoji: '🧲', points: 0,  hazard: false, weight: 2,  color: '#FF6B6B', power: 'magnet' },
    slowmo:   { emoji: '⏱️', points: 0,  hazard: false, weight: 2,  color: '#B5E853', power: 'slowmo' },
    triple:   { emoji: '⚡', points: 0,  hazard: false, weight: 3,  color: '#FFE040', power: 'triple' },
    rapid:    { emoji: '🔥', points: 0,  hazard: false, weight: 3,  color: '#FF8030', power: 'rapid' },
    bomb:     { emoji: '💥', points: 0,  hazard: false, weight: 2,  color: '#FF8030', power: 'bomb' },
    rainbow:  { emoji: '🌈', points: 0,  hazard: false, weight: 1,  color: '#FF6B6B', power: 'rainbow' },
    clover:   { emoji: '🍀', points: 0,  hazard: false, weight: 1,  color: '#6EE768', power: 'clover' },
    boss:     { emoji: '💀', points: 200, hazard: true, weight: 0,  color: '#FF3030', isBoss: true, hp: 10 },
  }

  const POWER_UP_TYPES = ['shield', 'magnet', 'slowmo', 'triple', 'rapid', 'rainbow']

  const ACHIEVEMENTS = [
    { id: 'first-kill', title: 'FIRST BLOOD', desc: 'destroyed first enemy', emoji: '🐻' },
    { id: 'combo-3', title: 'ON FIRE', desc: '3x combo', emoji: '🔥' },
    { id: 'combo-5', title: 'GODLIKE', desc: 'max 5x combo', emoji: '⚡' },
    { id: 'whaler', title: 'WHALER', desc: 'took down a whale', emoji: '🐋' },
    { id: 'clown-killer', title: 'CIRCUS HUNTER', desc: 'took down a clown', emoji: '🤡' },
    { id: 'level-3', title: 'RISING STAR', desc: 'reached level 3', emoji: '⭐' },
    { id: 'level-5', title: 'GALAXY BRAIN', desc: 'reached level 5', emoji: '🌌' },
    { id: 'score-100', title: 'CENTURION', desc: '100 points', emoji: '💯' },
    { id: 'score-500', title: 'BIG TOMORROW', desc: '500 points', emoji: '👽' },
    { id: 'shield-save', title: 'SAVED', desc: 'shield blocked a hit', emoji: '🛡️' },
    { id: 'bomb-squad', title: 'BOMB SQUAD', desc: 'used a bomb', emoji: '💥' },
    { id: 'rainbow-road', title: 'RAINBOW ROAD', desc: 'activated rainbow mode', emoji: '🌈' },
    { id: 'galaxy-wave', title: 'GALAXY TRAVELER', desc: 'reached a galaxy wave', emoji: '🌠' },
    { id: 'boss-slayer', title: 'BOSS SLAYER', desc: 'defeated a boss whale', emoji: '💀' },
    { id: 'lucky-clover', title: 'LUCKY', desc: 'found a lucky clover', emoji: '🍀' },
    { id: 'sharpshooter', title: 'SHARPSHOOTER', desc: '50 enemies destroyed', emoji: '🎯' },
  ]

  // Difficulty presets
  const DIFFICULTIES = {
    easy:   { lives: 4, baseSpeed: 0.18, speedStep: 0.06, spawnBase: 1300, spawnStep: 90,  hazardBoost: 0.3, label: 'EASY' },
    normal: { lives: 3, baseSpeed: 0.22, speedStep: 0.08, spawnBase: 1100, spawnStep: 100, hazardBoost: 0.5, label: 'NORMAL' },
    hard:   { lives: 2, baseSpeed: 0.28, speedStep: 0.10, spawnBase: 900,  spawnStep: 110, hazardBoost: 0.7, label: 'HARD' },
    insane: { lives: 1, baseSpeed: 0.35, speedStep: 0.13, spawnBase: 700,  spawnStep: 120, hazardBoost: 1.0, label: 'INSANE' },
  }

  // Background palettes per wave
  const WAVE_PALETTES = [
    { name: 'COSMIC BLUE',    colors: ['#06061f', '#1a0a3e', '#06061f'] },
    { name: 'GALAXY PURPLE',  colors: ['#1a0822', '#3d1152', '#1a0822'] },
    { name: 'NEBULA TEAL',   colors: ['#062020', '#0a3a3a', '#062020'] },
    { name: 'MAGENTA HAZE',  colors: ['#220620', '#3a0a36', '#220620'] },
    { name: 'CRIMSON DRIFT', colors: ['#220608', '#3a0a14', '#220608'] },
    { name: 'EMERALD VOID',  colors: ['#062206', '#0a3a14', '#062206'] },
  ]

  // === Game state ===
  const state = {
    phase: 'menu',
    mode: 'classic',
    difficulty: 'normal',
    score: 0,
    lives: 3,
    level: 1,
    wave: 1,
    combo: 0,
    lastCatchTime: 0,
    outfit: 'default',
    items: [],          // item objects (enemies + power-ups)
    itemEls: new Map(), // item.id -> HTMLElement (pooled)
    bullets: [],        // bullet objects
    bulletEls: new Map(), // bullet.id -> HTMLElement (pooled)
    particles: [],      // particle objects (drawn on canvas)
    floatingTexts: [],
    textEls: new Map(), // text.id -> HTMLElement (pooled)
    kavX: 50,
    targetX: 50,
    activePowers: [],
    stats: { catches: 0, maxCombo: 0, hazardsHit: 0, startTime: 0, lastLifeLostTime: 0 },
    screenShake: 0,
    nextItemId: 1,
    nextParticleId: 1,
    nextTextId: 1,
    nextBulletId: 1,
    lastSpawn: 0,
    lastFire: 0,
    fireRate: 250,  // ms between shots (default)
    lastFrame: 0,
    comboTimeout: null,
    achievementTimeout: null,
    outfitTimeout: null,
    waveAnnounceTimeout: null,
    cometSpawnTimeout: null,
    rng: Math.random,
    dailySeed: 0,
    musicStarted: false,
    // KAV SVG signature cache
    kavSig: '',
    // Boss state
    boss: null,  // { id, x, y, vy, hp, maxHp } or null
    parallaxOffset: 0,
  }

  let rafId = null
  let kavExpressionEl = 'happy'
  let kavPoseEl = 'idle'
  let canvasW = 0, canvasH = 0  // particle canvas dimensions in CSS pixels
  let dpr = 1
  const ctx2d = els.particlesCanvas.getContext('2d')
  const magnetCtx = els.magnetCanvas.getContext('2d')

  // === Persistence ===
  const storage = {
    get(key, def) { try { return JSON.parse(localStorage.getItem(key)) ?? def } catch { return def } },
    set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)) } catch {} },
    getRaw(key, def) { try { return localStorage.getItem(key) || def } catch { return def } },
    setRaw(key, val) { try { localStorage.setItem(key, val) } catch {} },
  }

  function loadHighScore(diff) { return parseInt(storage.getRaw('kav-hs-' + diff, '0'), 10) || 0 }
  function saveHighScore(diff, score) { storage.setRaw('kav-hs-' + diff, String(score)) }
  function loadLeaderboard(diff) { return storage.get('kav-lb-' + diff, []) }
  function saveLeaderboard(diff, lb) { storage.set('kav-lb-' + diff, lb) }
  function loadAchievements() { return new Set(storage.get('kav-ach', [])) }
  function saveAchievements(set) { storage.set('kav-ach', [...set]) }

  const unlockedAchievements = loadAchievements()

  // === Seeded RNG ===
  function mulberry32(seed) {
    return function () {
      let t = (seed += 0x6D2B79F5)
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }

  function getDailySeed() {
    const now = new Date()
    const dateKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
    let hash = 0
    for (let i = 0; i < dateKey.length; i++) hash = (hash * 31 + dateKey.charCodeAt(i)) | 0
    return Math.abs(hash)
  }

  function getDailyDateString() {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }

  // === Game logic helpers ===
  function pickRandomItem(level, diff) {
    const cfg = DIFFICULTIES[diff]
    const hazardBoost = Math.min(level * cfg.hazardBoost, 12)
    const entries = Object.entries(ITEM_CONFIG).filter(([t]) => t !== 'boss')
    const weights = entries.map(([t, c]) => c.weight + (c.hazard ? hazardBoost : 0))
    const total = weights.reduce((s, w) => s + w, 0)
    let r = state.rng() * total
    for (let i = 0; i < entries.length; i++) {
      r -= weights[i]
      if (r <= 0) return entries[i][0]
    }
    return 'kav'
  }

  function getOutfitForScore(score) {
    if (score >= 500) return 'royal'
    if (score >= 250) return 'diamond'
    if (score >= 100) return 'astronaut'
    return 'default'
  }

  function getWaveInfo(level) {
    const wave = Math.floor((level - 1) / 5) + 1
    const isGalaxy = level % 5 === 0
    const palette = WAVE_PALETTES[(wave - 1) % WAVE_PALETTES.length]
    const isBossWave = level % 10 === 0
    return { wave, isGalaxy, palette, isBossWave }
  }

  function getSpeedMultiplier(level, diff) {
    const cfg = DIFFICULTIES[diff]
    return Math.min(1 + level * cfg.speedStep, 4)
  }

  function getSpawnInterval(level, diff) {
    const cfg = DIFFICULTIES[diff]
    return Math.max(250, cfg.spawnBase - level * cfg.spawnStep)
  }

  function getFallSpeed(level, diff) {
    const cfg = DIFFICULTIES[diff]
    return cfg.baseSpeed * getSpeedMultiplier(level, diff)
  }

  // === Background: parallax stars, nebula, comets ===
  function buildParallaxStars() {
    const far = []
    const mid = []
    const near = []
    for (let i = 0; i < 60; i++) {
      far.push({ x: state.rng() * 100, y: state.rng() * 100, size: state.rng() * 1 + 0.3, delay: state.rng() * 4, dur: state.rng() * 3 + 2 })
    }
    for (let i = 0; i < 40; i++) {
      mid.push({ x: state.rng() * 100, y: state.rng() * 100, size: state.rng() * 1.5 + 0.5, delay: state.rng() * 4, dur: state.rng() * 3 + 2, bright: state.rng() > 0.8 })
    }
    for (let i = 0; i < 25; i++) {
      near.push({ x: state.rng() * 100, y: state.rng() * 100, size: state.rng() * 2 + 1, delay: state.rng() * 4, dur: state.rng() * 3 + 2, bright: state.rng() > 0.7 })
    }
    els.bgParallaxFar.innerHTML = far.map(s => `<div class="star" style="left:${s.x}%;top:${s.y}%;width:${s.size}px;height:${s.size}px;animation-delay:${s.delay}s;animation-duration:${s.dur}s"></div>`).join('')
    els.bgParallaxMid.innerHTML = mid.map(s => `<div class="star" style="left:${s.x}%;top:${s.y}%;width:${s.size}px;height:${s.size}px;${s.bright ? 'box-shadow:0 0 6px rgba(255,255,200,0.8);' : ''}animation-delay:${s.delay}s;animation-duration:${s.dur}s"></div>`).join('')
    els.bgParallaxNear.innerHTML = near.map(s => `<div class="star" style="left:${s.x}%;top:${s.y}%;width:${s.size}px;height:${s.size}px;${s.bright ? 'box-shadow:0 0 8px rgba(255,255,255,0.9);' : ''}animation-delay:${s.delay}s;animation-duration:${s.dur}s"></div>`).join('')
  }

  function renderPlanets() {
    els.bgPlanets.innerHTML = `
      <div class="planet" style="left:8%;top:12%;width:60px;height:60px;--p-color:#FF8FA3;--p-glow:#FF8FA355"><div class="planet-ring"></div></div>
      <div class="planet" style="left:85%;top:18%;width:45px;height:45px;--p-color:#FFD93D;--p-glow:#FFD93D55"></div>
    `
  }

  function setBackground(colors) {
    els.bgGradient.style.background = `linear-gradient(135deg, ${colors.join(', ')})`
    els.bgGradient.style.backgroundSize = '400% 400%'
    els.game.style.background = `linear-gradient(135deg, ${colors.join(', ')})`
    els.game.style.backgroundSize = '400% 400%'
  }

  function spawnComet() {
    if (state.phase !== 'playing') return
    const comet = document.createElement('div')
    comet.className = 'comet'
    comet.style.top = (state.rng() * 60) + '%'
    els.bgComets.appendChild(comet)
    setTimeout(() => comet.remove(), 4500)
    // Schedule next comet
    state.cometSpawnTimeout = setTimeout(spawnComet, 8000 + state.rng() * 12000)
  }

  // === Particle canvas (high-performance) ===
  function resizeCanvas() {
    dpr = window.devicePixelRatio || 1
    canvasW = window.innerWidth
    canvasH = window.innerHeight
    els.particlesCanvas.width = canvasW * dpr
    els.particlesCanvas.height = canvasH * dpr
    els.particlesCanvas.style.width = canvasW + 'px'
    els.particlesCanvas.style.height = canvasH + 'px'
    ctx2d.scale(dpr, dpr)
    els.magnetCanvas.width = canvasW * dpr
    els.magnetCanvas.height = canvasH * dpr
    els.magnetCanvas.style.width = canvasW + 'px'
    els.magnetCanvas.style.height = canvasH + 'px'
    magnetCtx.scale(dpr, dpr)
  }

  function drawParticles() {
    ctx2d.clearRect(0, 0, canvasW, canvasH)
    for (const p of state.particles) {
      ctx2d.globalAlpha = p.life
      ctx2d.fillStyle = p.color
      ctx2d.shadowColor = p.color
      ctx2d.shadowBlur = p.size * 2
      ctx2d.beginPath()
      ctx2d.arc(p.x / 100 * canvasW, p.y / 100 * canvasH, p.size, 0, Math.PI * 2)
      ctx2d.fill()
    }
    ctx2d.globalAlpha = 1
    ctx2d.shadowBlur = 0
  }

  function drawMagnetLines() {
    magnetCtx.clearRect(0, 0, canvasW, canvasH)
    const hasMagnet = state.activePowers.some(p => p.type === 'magnet' && p.endsAt > Date.now())
    if (!hasMagnet) return
    const kavScreenX = state.kavX / 100 * canvasW
    const kavScreenY = canvasH * 0.85
    for (const item of state.items) {
      if (ITEM_CONFIG[item.type].hazard) continue
      const itemX = item.x / 100 * canvasW
      const itemY = item.y / 100 * canvasH
      const dx = kavScreenX - itemX
      const dy = kavScreenY - itemY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 200) {
        magnetCtx.strokeStyle = `rgba(255, 107, 107, ${0.4 * (1 - dist / 200)})`
        magnetCtx.lineWidth = 1.5
        magnetCtx.beginPath()
        magnetCtx.moveTo(itemX, itemY)
        magnetCtx.lineTo(kavScreenX, kavScreenY)
        magnetCtx.stroke()
      }
    }
  }

  // === Render: KAV character (cached signature) ===
  function renderKav() {
    const hasShield = state.activePowers.some(p => p.type === 'shield' && p.endsAt > Date.now())
    // Build signature to detect changes
    const sig = `${kavExpressionEl}|${kavPoseEl}|${state.outfit}|${hasShield}`
    if (sig === state.kavSig) return  // No change, skip rebuild
    state.kavSig = sig
    els.kavCharacter.innerHTML = buildKav({
      expression: kavExpressionEl,
      pose: kavPoseEl,
      outfit: state.outfit,
      shield: hasShield,
      size: 140,
      glow: true,
    })
  }

  // === Render: items (object pooling) ===
  function syncItemDOM() {
    const currentIds = new Set(state.items.map(i => i.id))
    // Boss is rendered as item if exists
    if (state.boss) currentIds.add(state.boss.id)
    // Remove DOM elements for items no longer present
    for (const [id, el] of state.itemEls.entries()) {
      if (!currentIds.has(id)) {
        el.remove()
        state.itemEls.delete(id)
      }
    }
    // Add/update DOM elements for current items
    const allItems = state.boss ? [...state.items, state.boss] : state.items
    for (const item of allItems) {
      let el = state.itemEls.get(item.id)
      const cfg = ITEM_CONFIG[item.type]
      if (!el) {
        el = document.createElement('div')
        el.className = 'falling-item'
        el.textContent = cfg.emoji
        el.style.fontSize = cfg.isBoss ? '120px' : (cfg.hazard ? '56px' : (cfg.power ? '60px' : '50px'))
        el.style.filter = `drop-shadow(0 0 8px ${cfg.color}88)`
        els.itemsLayer.appendChild(el)
        state.itemEls.set(item.id, el)
      }
      el.style.left = item.x + '%'
      el.style.top = item.y + '%'
      el.style.transform = `translate(-50%, -50%) rotate(${item.rotation}deg)`
    }
  }

  // === Render: floating texts (pooled) ===
  function syncTextDOM() {
    const currentIds = new Set(state.floatingTexts.map(t => t.id))
    for (const [id, el] of state.textEls.entries()) {
      if (!currentIds.has(id)) {
        el.remove()
        state.textEls.delete(id)
      }
    }
    for (const t of state.floatingTexts) {
      let el = state.textEls.get(t.id)
      if (!el) {
        el = document.createElement('div')
        el.className = 'floating-text'
        els.textsLayer.appendChild(el)
        state.textEls.set(t.id, el)
        // Auto-remove after animation
        setTimeout(() => {
          if (state.textEls.has(t.id)) {
            state.textEls.get(t.id).remove()
            state.textEls.delete(t.id)
          }
        }, 900)
      }
      el.textContent = t.text
      el.style.left = t.x + '%'
      el.style.top = t.y + '%'
      el.style.color = t.color
      el.style.textShadow = `0 0 8px ${t.color}`
      el.style.opacity = t.life
    }
  }

  // === Render: combo trail ===
  function renderComboTrail() {
    if (state.combo < 2) {
      if (els.comboTrail.innerHTML !== '') els.comboTrail.innerHTML = ''
      return
    }
    // Only rebuild if combo changed
    if (els.comboTrail.dataset.combo !== String(state.combo)) {
      els.comboTrail.dataset.combo = String(state.combo)
      const len = Math.min(state.combo * 20, 80)
      let html = ''
      for (let i = 0; i < len; i += 8) {
        html += `<div class="trail-dot" style="left:${-len + i}px;top:${Math.sin(i * 0.5) * 5}px;animation-delay:${i * 0.02}s"></div>`
      }
      els.comboTrail.innerHTML = html
    }
    els.comboTrail.style.left = state.kavX + '%'
  }

  // === Render: HUD (textContent updates only) ===
  function renderHUD() {
    els.scoreDisplay.textContent = state.score
    els.levelChip.innerHTML = `LVL <b>${state.level}</b>`
    els.outfitChip.textContent = OUTFIT_INFO[state.outfit].name.split(' ')[0]
    const waveInfo = getWaveInfo(state.level)
    els.waveChip.textContent = `WAVE ${waveInfo.wave}${waveInfo.isGalaxy ? ' ✦' : ''}`
    els.waveChip.classList.toggle('galaxy', waveInfo.isGalaxy)
    const speedMult = getSpeedMultiplier(state.level, state.difficulty)
    els.speedChip.textContent = `⚡ x${speedMult.toFixed(1)}`

    // Lives
    const diffLives = DIFFICULTIES[state.difficulty].lives
    let livesHtml = ''
    for (let i = 0; i < diffLives; i++) {
      livesHtml += `<span class="life ${i < state.lives ? '' : 'lost'}">${i < state.lives ? '💜' : '🖤'}</span>`
    }
    // Only update if changed
    if (els.livesDisplay.dataset.lives !== `${state.lives}-${diffLives}`) {
      els.livesDisplay.dataset.lives = `${state.lives}-${diffLives}`
      els.livesDisplay.innerHTML = livesHtml
    }

    // Combo badge
    if (state.combo > 1) {
      els.comboBadge.classList.remove('hidden')
      els.comboBadge.textContent = `${state.combo}x COMBO!`
    } else {
      els.comboBadge.classList.add('hidden')
    }

    // Combo bar fill (combo / 5)
    const comboPct = (state.combo / 5) * 100
    els.comboBarFill.style.width = comboPct + '%'

    // Powers (only rebuild if changed)
    const now = Date.now()
    const activePowers = state.activePowers.filter(p => p.endsAt > now)
    const powersSig = activePowers.map(p => `${p.type}:${Math.ceil((p.endsAt - now) / 100)}`).join('|')
    if (els.powerBar.dataset.sig !== powersSig) {
      els.powerBar.dataset.sig = powersSig
      let powersHtml = ''
      for (const p of activePowers) {
        const cfg = Object.values(ITEM_CONFIG).find(c => c.power === p.type)
        const totalDur = p.type === 'shield' ? 6000 : p.type === 'magnet' ? 5000 : p.type === 'slowmo' ? 4000 : p.type === 'score2x' ? 8000 : 5000
        const remaining = Math.max(0, p.endsAt - now)
        const pct = totalDur > 0 ? (remaining / totalDur) * 100 : 100
        powersHtml += `<div class="power-chip" style="--p-color:${cfg.color}">${cfg.emoji}<div class="timer-bar" style="width:${pct}%"></div></div>`
      }
      els.powerBar.innerHTML = powersHtml
    }

    // Speed lines toggle
    const showSpeedLines = speedMult >= 2
    els.speedLines.classList.toggle('active', showSpeedLines)
  }

  // === Render: boss bar ===
  function renderBossBar() {
    if (state.boss) {
      els.bossBar.classList.remove('hidden')
      const pct = (state.boss.hp / state.boss.maxHp) * 100
      els.bossHealthFill.style.width = pct + '%'
    } else {
      els.bossBar.classList.add('hidden')
    }
  }

  // === Spawn helpers ===
  function spawnFloatingText(x, y, text, color) {
    state.floatingTexts.push({ id: state.nextTextId++, x, y, text, color, life: 1 })
    setTimeout(() => {
      state.floatingTexts = state.floatingTexts.filter(t => t.id !== state.nextTextId - 1)
    }, 900)
  }

  function spawnParticles(x, y, color, count) {
    count = count || 8
    for (let i = 0; i < count; i++) {
      state.particles.push({
        id: state.nextParticleId++,
        x, y,
        vx: (state.rng() - 0.5) * 4,
        vy: (state.rng() - 1) * 3,
        life: 1,
        color,
        size: state.rng() * 4 + 2,
      })
    }
  }

  function spawnItem() {
    const itemType = pickRandomItem(state.level, state.difficulty)
    const cfg = ITEM_CONFIG[itemType]
    const fallSpeed = getFallSpeed(state.level, state.difficulty)
    // Tanky enemies (whales) fall slower, zigzag/clown normal, erratic faster
    let speedMod = 1
    if (cfg.tanky) speedMod = 0.6  // whales slower
    if (cfg.zigzag) speedMod = 0.85  // clowns slightly slower
    if (cfg.erratic) speedMod = 1.2  // shitcoin faster
    state.items.push({
      id: state.nextItemId++,
      type: itemType,
      x: 5 + state.rng() * 90,
      y: -10,
      vy: fallSpeed * speedMod + state.rng() * 0.1,
      rotation: state.rng() * 360,
      vr: (state.rng() - 0.5) * 5,
      size: cfg.isBoss ? 120 : (cfg.tanky ? 64 : (cfg.hazard ? 56 : (cfg.power ? 60 : 50))),
      hp: cfg.hp || 1,
      maxHp: cfg.hp || 1,
    })
  }

  // === Bullet DOM pooling ===
  function syncBulletDOM() {
    const currentIds = new Set(state.bullets.map(b => b.id))
    // Remove DOM elements for bullets no longer present
    for (const [id, el] of state.bulletEls.entries()) {
      if (!currentIds.has(id)) {
        el.remove()
        state.bulletEls.delete(id)
      }
    }
    // Add/update DOM elements for current bullets
    for (const bullet of state.bullets) {
      let el = state.bulletEls.get(bullet.id)
      if (!el) {
        el = document.createElement('div')
        el.className = 'bullet'
        els.itemsLayer.appendChild(el)
        state.bulletEls.set(bullet.id, el)
      }
      el.style.left = bullet.x + '%'
      el.style.top = bullet.y + '%'
    }
  }

  function spawnBoss() {
    state.boss = {
      id: state.nextItemId++,
      type: 'boss',
      x: 50,
      y: -15,
      vy: 0.08 + state.rng() * 0.05,
      rotation: 0,
      vr: 0.8,
      hp: 5,
      maxHp: 5,
    }
    showWaveAnnouncement(state.wave, false, true)
    sfx.play('wave')
  }

  // === Achievement ===
  function unlockAchievement(id) {
    if (unlockedAchievements.has(id)) return
    const ach = ACHIEVEMENTS.find(a => a.id === id)
    if (!ach) return
    unlockedAchievements.add(id)
    saveAchievements(unlockedAchievements)
    showAchievementPopup(ach)
    sfx.play('achievement')
  }

  function showAchievementPopup(ach) {
    els.achievementPopup.innerHTML = `<span class="ach-emoji">${ach.emoji}</span>
      <div>
        <div class="ach-label">// ACHIEVEMENT UNLOCKED</div>
        <div class="ach-title">${ach.title}</div>
        <div class="ach-desc">${ach.desc}</div>
      </div>`
    els.achievementPopup.classList.remove('hidden')
    if (state.achievementTimeout) clearTimeout(state.achievementTimeout)
    state.achievementTimeout = setTimeout(() => els.achievementPopup.classList.add('hidden'), 3000)
  }

  function showOutfitPopup(outfit) {
    els.outfitPreview.innerHTML = buildKav({
      expression: 'happy', pose: 'dance', outfit, size: 64, glow: true,
    })
    els.outfitPopup.querySelector('.outfit-name').textContent = OUTFIT_INFO[outfit].name
    els.outfitPopup.querySelector('.outfit-desc').textContent = OUTFIT_INFO[outfit].desc
    els.outfitPopup.classList.remove('hidden')
    if (state.outfitTimeout) clearTimeout(state.outfitTimeout)
    state.outfitTimeout = setTimeout(() => els.outfitPopup.classList.add('hidden'), 3500)
  }

  function showWaveAnnouncement(wave, isGalaxy, isBoss) {
    if (isBoss) {
      els.waveAnnounceLabel.textContent = '// BOSS WAVE'
      els.waveAnnounceNumber.textContent = wave
      els.waveAnnounceTagline.textContent = 'defeat the giant asteroid'
    } else {
      els.waveAnnounceLabel.textContent = isGalaxy ? '// GALAXY WAVE' : '// WAVE'
      els.waveAnnounceNumber.textContent = wave
      els.waveAnnounceTagline.textContent = isGalaxy ? 'faster · denser · brighter' : 'stepping up the pace'
    }
    els.waveAnnounce.classList.remove('hidden')
    sfx.play('wave')
    if (state.waveAnnounceTimeout) clearTimeout(state.waveAnnounceTimeout)
    state.waveAnnounceTimeout = setTimeout(() => els.waveAnnounce.classList.add('hidden'), 2500)
  }

  function showTouchRipple(x, y) {
    const ripple = document.createElement('div')
    ripple.style.cssText = `position:absolute;left:${x - 30}px;top:${y - 30}px;width:60px;height:60px;border:2px solid rgba(141,207,242,0.5);border-radius:50%;pointer-events:none;animation:kav-ripple 0.5s ease-out forwards;z-index:5`
    els.game.appendChild(ripple)
    setTimeout(() => ripple.remove(), 500)
  }

  function showDamageFlash() {
    els.damageFlash.classList.remove('flash')
    void els.damageFlash.offsetWidth  // Force reflow to restart animation
    els.damageFlash.classList.add('flash')
  }

  function showLevelupBurst() {
    // Spawn gold particle burst from KAV position
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2
      const dist = 60 + state.rng() * 40
      const bx = Math.cos(angle) * dist
      const by = -Math.sin(angle) * dist - 20
      const p = document.createElement('div')
      p.className = 'burst-particle'
      p.style.setProperty('--bx', bx + 'px')
      p.style.setProperty('--by', by + 'px')
      p.style.background = ['#FFD93D', '#FF6B6B', '#8DCFF2', '#5DADE2'][i % 4]
      p.style.boxShadow = `0 0 12px ${['#FFD93D', '#FF6B6B', '#8DCFF2', '#5DADE2'][i % 4]}`
      els.levelupBurst.appendChild(p)
      setTimeout(() => p.remove(), 900)
    }
  }

  function setKavExpression(exp, duration) {
    kavExpressionEl = exp
    state.kavSig = '' // Force rebuild next renderKav
    setTimeout(() => {
      if (kavExpressionEl === exp) {
        kavExpressionEl = 'happy'
        state.kavSig = ''
      }
    }, duration)
  }

  function setKavPoseTemp(pose, duration) {
    kavPoseEl = pose
    state.kavSig = ''
    setTimeout(() => {
      kavPoseEl = 'idle'
      state.kavSig = ''
    }, duration)
  }

  // === Game loop ===
  function loop(timestamp) {
    if (state.phase !== 'playing') return
    if (state.lastFrame === 0) state.lastFrame = timestamp
    const dt = Math.min(timestamp - state.lastFrame, 50)
    state.lastFrame = timestamp
    const now = Date.now()

    const hasSlowmo = state.activePowers.some(p => p.type === 'slowmo' && p.endsAt > now)
    const hasRainbow = state.activePowers.some(p => p.type === 'rainbow' && p.endsAt > now)
    const hasMagnet = state.activePowers.some(p => p.type === 'magnet' && p.endsAt > now)
    const hasShield = state.activePowers.some(p => p.type === 'shield' && p.endsAt > now)
    const hasScore2x = state.activePowers.some(p => p.type === 'score2x' && p.endsAt > now)

    const gameDtNorm = (dt / 16.67) * (hasSlowmo ? 0.4 : 1)
    const dtNorm = dt / 16.67

    // Move KAV
    const diff = state.targetX - state.kavX
    state.kavX += diff * 0.15
    els.kavCharacter.style.left = state.kavX + '%'

    // Update KAV pose based on powers
    let desiredPose = kavPoseEl
    if (hasMagnet) desiredPose = 'magnet'
    else if (hasShield) desiredPose = 'shield'
    else if (kavPoseEl === 'magnet' || kavPoseEl === 'shield' || kavPoseEl === 'fist') desiredPose = 'idle'
    if (desiredPose !== kavPoseEl) {
      kavPoseEl = desiredPose
      state.kavSig = ''
    }

    // Expire powers
    const expiredPowers = state.activePowers.filter(p => p.endsAt <= now)
    if (expiredPowers.length > 0) {
      state.activePowers = state.activePowers.filter(p => p.endsAt > now)
    }

    // Spawn items
    const spawnInterval = getSpawnInterval(state.level, state.difficulty)
    if (timestamp - state.lastSpawn > spawnInterval) {
      state.lastSpawn = timestamp
      spawnItem()
      // Galaxy wave = bonus item chance
      const waveInfo = getWaveInfo(state.level)
      if (waveInfo.isGalaxy && state.rng() < 0.3) {
        spawnItem()
      }
    }

    // Spawn boss on boss wave
    const waveInfo = getWaveInfo(state.level)
    if (waveInfo.isBossWave && !state.boss && state.items.length > 0) {
      spawnBoss()
    }

    // === Auto-fire bullets ===
    const hasRapid = state.activePowers.some(p => p.type === 'rapid' && p.endsAt > now)
    const hasTriple = state.activePowers.some(p => p.type === 'triple' && p.endsAt > now)
    const effectiveFireRate = hasRapid ? 100 : state.fireRate
    if (timestamp - state.lastFire > effectiveFireRate) {
      state.lastFire = timestamp
      // Spawn bullet(s) at KAV position
      const bx = state.kavX
      const by = 80  // y of KAV head
      if (hasTriple) {
        state.bullets.push({ id: state.nextBulletId++, x: bx, y: by, vx: -0.6, vy: -3, life: 1 })
        state.bullets.push({ id: state.nextBulletId++, x: bx, y: by, vx: 0, vy: -3, life: 1 })
        state.bullets.push({ id: state.nextBulletId++, x: bx, y: by, vx: 0.6, vy: -3, life: 1 })
      } else {
        state.bullets.push({ id: state.nextBulletId++, x: bx, y: by, vx: 0, vy: -3, life: 1 })
      }
      sfx.play(hasRapid ? 'rapid' : 'shoot')
    }

    // Set KAV pose to shoot when firing recently
    if (timestamp - state.lastFire < 200) {
      if (kavPoseEl !== 'shoot' && kavPoseEl !== 'magnet' && kavPoseEl !== 'shield') {
        kavPoseEl = 'shoot'
        state.kavSig = ''
      }
    } else {
      if (kavPoseEl === 'shoot' && !hasMagnet && !hasShield) {
        kavPoseEl = 'idle'
        state.kavSig = ''
      }
    }

    // === Update bullets + collision with items ===
    const toRemove = []  // DECLARED HERE — used by both bullet collision and item collision
    const bulletsRemaining = []
    const itemsShotByBullets = new Set()  // item.id set
    for (const bullet of state.bullets) {
      const newX = bullet.x + (bullet.vx || 0) * gameDtNorm
      const newY = bullet.y + bullet.vy * gameDtNorm
      bullet.life -= 0.01 * dtNorm

      // Check collision with items (use larger radius for forgiveness)
      let hit = false
      for (const item of state.items) {
        if (itemsShotByBullets.has(item.id)) continue  // already hit
        const dx = item.x - newX
        const dy = item.y - newY
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 7) {  // Larger collision radius for forgiveness
          itemsShotByBullets.add(item.id)
          item.hp = (item.hp || 1) - 1
          hit = true
          spawnParticles(newX, newY, '#FFD93D', 3)
          if (item.hp <= 0) {
            // Enemy destroyed
            const cfg = ITEM_CONFIG[item.type]
            toRemove.push({ item: { ...item, x: item.x, y: item.y, rotation: item.rotation }, shot: true, hitHazard: cfg.hazard })
            sfx.play('enemyDown')
            spawnParticles(item.x, item.y, cfg.color, 8)
          } else {
            // Just hit, not destroyed
            sfx.play('enemyHit')
          }
          break
        }
      }

      // Also check collision with boss
      if (state.boss && !hit) {
        const b = state.boss
        const dx = b.x - newX
        const dy = b.y - newY
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 12) {
          b.hp -= 1
          hit = true
          spawnParticles(newX, newY, '#FFD93D', 3)
          sfx.play('enemyHit')
          if (b.hp <= 0) {
            spawnFloatingText(b.x, b.y, '+200 BOSS!', '#FFD93D')
            state.score += 200
            spawnParticles(b.x, b.y, '#FF3030', 20)
            sfx.play('achievement')
            unlockAchievement('boss-slayer')
            state.boss = null
          }
        }
      }

      // Off-screen top or expired
      if (newY < -10 || bullet.life <= 0) {
        continue
      }
      bullet.x = newX
      bullet.y = newY
      bulletsRemaining.push(bullet)
    }
    state.bullets = bulletsRemaining

    // === Update items + collision with KAV (enemies reaching bottom) ===
    const remaining = []
    const kavHitX = state.kavX
    const kavHitY = 82

    for (const item of state.items) {
      // Skip items already destroyed by bullets (already in toRemove)
      let newY = item.y + item.vy * gameDtNorm
      let newX = item.x
      const newRot = item.rotation + item.vr * gameDtNorm

      // Erratic movement (shitcoin)
      if (ITEM_CONFIG[item.type] && ITEM_CONFIG[item.type].erratic) {
        newX += Math.sin(timestamp / 200 + item.id) * 0.3 * gameDtNorm
      }
      // Zigzag movement (clown)
      if (ITEM_CONFIG[item.type] && ITEM_CONFIG[item.type].zigzag) {
        newX += Math.sin(timestamp / 300 + item.id * 2) * 0.5 * gameDtNorm
      }

      // If item was destroyed by bullet, skip — it's already in toRemove
      if (itemsShotByBullets.has(item.id) && (item.hp || 1) <= 0) {
        continue
      }
      // If shot but still has HP, keep going (HP decremented in bullet loop)
      if (itemsShotByBullets.has(item.id)) {
        remaining.push({ ...item, x: newX, y: newY, rotation: newRot })
        continue
      }

      // Magnet pull for power-ups
      if (hasMagnet && ITEM_CONFIG[item.type].power) {
        const dxM = kavHitX - item.x
        const dyM = kavHitY - item.y
        const distM = Math.sqrt(dxM * dxM + dyM * dyM)
        if (distM > 5 && distM < 60) {
          const pull = 0.5 * (1 - distM / 60)
          newX += (dxM / distM) * pull * gameDtNorm
          newY += (dyM / distM) * pull * gameDtNorm
        }
      }

      // Check collision with KAV (enemy reached bottom)
      const cfg = ITEM_CONFIG[item.type]
      if (cfg.power) {
        // Power-up — can be caught by KAV too (touch = activate)
        const dx = newX - kavHitX
        const dy = newY - kavHitY
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 7 + 4) {
          toRemove.push({ item: { ...item, x: newX, y: newY, rotation: newRot }, caught: true, hitHazard: false })
          continue
        }
      } else if (cfg.isEnemy) {
        // Enemy reached KAV = lose life
        if (newY > 80 && Math.abs(newX - kavHitX) < 6) {
          toRemove.push({ item: { ...item, x: newX, y: newY, rotation: newRot }, caught: true, hitHazard: cfg.hazard })
          continue
        }
      }

      // Off bottom = lose life (for hazards) or just miss
      if (newY > 105) {
        if (cfg.isEnemy && !cfg.hazard) {
          // Missed enemy = lose life
          toRemove.push({ item: { ...item, x: newX, y: newY, rotation: newRot }, missed: true, hitHazard: false })
        } else if (cfg.power) {
          // Power-up missed = just disappear
          toRemove.push({ item: { ...item, x: newX, y: newY, rotation: newRot }, caught: false, hitHazard: false })
        } else {
          toRemove.push({ item: { ...item, x: newX, y: newY, rotation: newRot }, caught: false, hitHazard: false })
        }
        continue
      }

      remaining.push({ ...item, x: newX, y: newY, rotation: newRot })
    }

    // Update boss (if exists, not destroyed by bullet)
    let bossRemoved = false
    if (state.boss) {
      const b = state.boss
      b.y += b.vy * gameDtNorm
      b.rotation += b.vr * gameDtNorm
      // Bounce boss off side walls
      if (b.x < 15) { b.x = 15; b.vr = -b.vr }
      if (b.x > 85) { b.x = 85; b.vr = -b.vr }
      // Boss moves slowly horizontally
      b.x += Math.sin(timestamp / 1000) * 0.05 * gameDtNorm

      const dx = b.x - kavHitX
      const dy = b.y - kavHitY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 11 + 8) {
        // Boss hit KAV
        if (hasShield) {
          b.hp -= 1
          state.activePowers = state.activePowers.filter(p => p.type !== 'shield')
          spawnFloatingText(b.x, b.y, 'HIT!', '#8DCFF2')
          sfx.play('powerUp')
          state.screenShake = 10
          if (b.hp <= 0) {
            spawnFloatingText(b.x, b.y, '+200 BOSS!', '#FFD93D')
            state.score += 200
            spawnParticles(b.x, b.y, '#FF3030', 20)
            sfx.play('achievement')
            unlockAchievement('boss-slayer')
            bossRemoved = true
          }
        } else {
          state.lives -= 1
          state.screenShake = 15
          showDamageFlash()
          setKavPoseTemp('fist', 500)
          setKavExpression('angry', 500)
          sfx.play('hit')
          spawnFloatingText(b.x, b.y, '-1 LIFE!', '#FF3030')
          state.stats.lastLifeLostTime = now
          // Knock boss back up
          b.y = -15
          b.x = 5 + state.rng() * 90
          if (state.lives <= 0) {
            endGame()
          }
        }
      }
      // Boss off bottom = defeat (survival)
      if (b.y > 105) {
        spawnFloatingText(b.x, b.y, 'SURVIVED!', '#FFD93D')
        state.score += 50
        unlockAchievement('boss-slayer')
        bossRemoved = true
      }
      if (bossRemoved) {
        state.boss = null
      }
    }

    // Process catches (and shots, and misses)
    let scoreDelta = 0
    let livesDelta = 0
    let comboDelta = 0
    let catchesDelta = 0
    let newMaxCombo = state.stats.maxCombo
    const newParticles = []
    const newTexts = []
    const newPowers = []
    const achievementsToUnlock = []
    let shieldJustUsed = false

    for (const entry of toRemove) {
      const { item, caught, hitHazard, shot, missed } = entry
      const cfg = ITEM_CONFIG[item.type]

      // === SHOT (destroyed by bullet) ===
      if (shot) {
        // Power-up shot = activate
        if (cfg.power) {
          if (cfg.power === 'clover') {
            const randPower = POWER_UP_TYPES[Math.floor(state.rng() * POWER_UP_TYPES.length)]
            const duration = randPower === 'shield' ? 6000 : randPower === 'magnet' ? 5000 : randPower === 'slowmo' ? 4000 : randPower === 'triple' ? 8000 : randPower === 'rapid' ? 6000 : 5000
            newPowers.push({ type: randPower, endsAt: now + duration })
            newParticles.push({ x: item.x, y: item.y, color: cfg.color })
            newTexts.push({ x: item.x, y: item.y, text: 'LUCKY! ' + randPower.toUpperCase(), color: cfg.color })
            scoreDelta += 20
            sfx.play('powerUp')
            unlockAchievement('lucky-clover')
            setKavExpression('surprised', 500)
            continue
          }
          if (cfg.power === 'bomb') {
            const cleared = state.items.filter(i => ITEM_CONFIG[i.type].isEnemy).length
            state.items = state.items.filter(i => !ITEM_CONFIG[i.type].isEnemy)
            scoreDelta += cleared * 5
            newParticles.push({ x: 50, y: 50, color: '#FF8030' })
            newTexts.push({ x: 50, y: 50, text: `BOMB! +${cleared * 5}`, color: '#FF8030' })
            sfx.play('bomb')
            achievementsToUnlock.push('bomb-squad')
            setKavExpression('angry', 400)
            state.screenShake = 12
            continue
          }
          if (cfg.power === 'rainbow') achievementsToUnlock.push('rainbow-road')
          const duration = cfg.power === 'shield' ? 6000 : cfg.power === 'magnet' ? 5000 : cfg.power === 'slowmo' ? 4000 : cfg.power === 'triple' ? 8000 : cfg.power === 'rapid' ? 6000 : 5000
          newPowers.push({ type: cfg.power, endsAt: now + duration })
          newParticles.push({ x: item.x, y: item.y, color: cfg.color })
          newTexts.push({ x: item.x, y: item.y, text: cfg.power.toUpperCase() + '!', color: cfg.color })
          sfx.play('powerUp')
          setKavExpression('surprised', 500)
          continue
        }
        // Enemy destroyed by bullet
        catchesDelta += 1
        const comboWindow = now - state.lastCatchTime < 1500
        if (comboWindow) comboDelta = Math.max(comboDelta, 1)
        const comboMult = Math.min(state.combo + comboDelta, 5)
        let earned = cfg.points + Math.floor(comboMult * 2)
        scoreDelta += earned
        newParticles.push({ x: item.x, y: item.y, color: cfg.color })
        newTexts.push({ x: item.x, y: item.y, text: `+${earned}${comboMult > 1 ? ` x${comboMult + 1}` : ''}`, color: cfg.color })
        sfx.play('enemyDown')

        // Achievement triggers
        if (state.stats.catches === 0) achievementsToUnlock.push('first-kill')
        if (item.type === 'whale') achievementsToUnlock.push('whaler')
        if (item.type === 'clown') achievementsToUnlock.push('clown-killer')
        if (comboMult === 3) achievementsToUnlock.push('combo-3')
        if (comboMult === 5) achievementsToUnlock.push('combo-5')
        if (comboMult > newMaxCombo) newMaxCombo = comboMult
        if (state.stats.catches + catchesDelta >= 50) achievementsToUnlock.push('sharpshooter')
        continue
      }

      // === CAUGHT (power-up caught by touch) ===
      if (caught && !hitHazard) {
        // Same as shot logic — activate power-up
        if (cfg.power) {
          if (cfg.power === 'clover') {
            const randPower = POWER_UP_TYPES[Math.floor(state.rng() * POWER_UP_TYPES.length)]
            const duration = randPower === 'shield' ? 6000 : randPower === 'magnet' ? 5000 : randPower === 'slowmo' ? 4000 : randPower === 'triple' ? 8000 : randPower === 'rapid' ? 6000 : 5000
            newPowers.push({ type: randPower, endsAt: now + duration })
            newParticles.push({ x: item.x, y: item.y, color: cfg.color })
            newTexts.push({ x: item.x, y: item.y, text: 'LUCKY!', color: cfg.color })
            scoreDelta += 20
            sfx.play('powerUp')
            unlockAchievement('lucky-clover')
            setKavExpression('surprised', 500)
            continue
          }
          if (cfg.power === 'bomb') {
            const cleared = state.items.filter(i => ITEM_CONFIG[i.type].isEnemy).length
            state.items = state.items.filter(i => !ITEM_CONFIG[i.type].isEnemy)
            scoreDelta += cleared * 5
            newParticles.push({ x: 50, y: 50, color: '#FF8030' })
            newTexts.push({ x: 50, y: 50, text: `BOMB! +${cleared * 5}`, color: '#FF8030' })
            sfx.play('bomb')
            achievementsToUnlock.push('bomb-squad')
            state.screenShake = 12
            continue
          }
          if (cfg.power === 'rainbow') achievementsToUnlock.push('rainbow-road')
          const duration = cfg.power === 'shield' ? 6000 : cfg.power === 'magnet' ? 5000 : cfg.power === 'slowmo' ? 4000 : cfg.power === 'triple' ? 8000 : cfg.power === 'rapid' ? 6000 : 5000
          newPowers.push({ type: cfg.power, endsAt: now + duration })
          newParticles.push({ x: item.x, y: item.y, color: cfg.color })
          newTexts.push({ x: item.x, y: item.y, text: cfg.power.toUpperCase() + '!', color: cfg.color })
          sfx.play('powerUp')
          setKavExpression('surprised', 500)
          continue
        }
      }

      // === CAUGHT (enemy hit KAV) ===
      if (caught && hitHazard) {
        if (hasShield) {
          shieldJustUsed = true
          newParticles.push({ x: item.x, y: item.y, color: '#8DCFF2' })
          newTexts.push({ x: item.x, y: item.y, text: 'BLOCKED!', color: '#8DCFF2' })
          sfx.play('powerUp')
          achievementsToUnlock.push('shield-save')
          setKavExpression('surprised', 300)
        } else {
          livesDelta -= 1
          state.screenShake = 10
          showDamageFlash()
          setKavPoseTemp('fist', 500)
          setKavExpression('angry', 500)
          sfx.play('hit')
          newParticles.push({ x: item.x, y: item.y, color: '#FF3030' })
          newTexts.push({ x: item.x, y: item.y, text: '-1 LIFE', color: '#FF3030' })
          state.stats.lastLifeLostTime = now
        }
        continue
      }

      // === MISSED (enemy reached bottom) ===
      if (missed) {
        // Lose a life for missing enemies (hazards handled separately)
        if (!hasShield) {
          livesDelta -= 1
          state.screenShake = 6
          showDamageFlash()
          setKavExpression('angry', 400)
          sfx.play('hit')
          newTexts.push({ x: 50, y: 90, text: 'MISSED! -1 LIFE', color: '#FF3030' })
          state.stats.lastLifeLostTime = now
        } else {
          shieldJustUsed = true
          newParticles.push({ x: item.x, y: 100, color: '#8DCFF2' })
          newTexts.push({ x: item.x, y: 100, text: 'BLOCKED!', color: '#8DCFF2' })
          sfx.play('powerUp')
        }
        if (state.combo > 0) state.combo = 0
        continue
      }
    }

    // Apply shield removal
    if (shieldJustUsed) {
      state.activePowers = state.activePowers.filter(p => p.type !== 'shield')
    }

    // Add new powers
    if (newPowers.length > 0) {
      const newTypes = new Set(newPowers.map(p => p.type))
      const kept = state.activePowers.filter(p => !newTypes.has(p.type))
      state.activePowers = [...kept, ...newPowers]
    }

    // Apply score + level + outfit
    if (scoreDelta !== 0) {
      const oldOutfit = state.outfit
      const oldLevel = state.level
      state.score += scoreDelta
      const newLevel = Math.floor(state.score / 100) + 1
      if (newLevel > state.level) {
        const oldWave = getWaveInfo(state.level).wave
        state.level = newLevel
        const waveInfo = getWaveInfo(state.level)
        if (waveInfo.wave !== oldWave) {
          state.wave = waveInfo.wave
          showWaveAnnouncement(waveInfo.wave, waveInfo.isGalaxy, waveInfo.isBossWave)
          setBackground(waveInfo.palette.colors)
          if (waveInfo.isGalaxy) achievementsToUnlock.push('galaxy-wave')
        }
        sfx.play('levelUp')
        setKavExpression('surprised', 600)
        showLevelupBurst()
        spawnParticles(state.kavX, 80, '#FFD93D', 12)
        if (newLevel >= 3) achievementsToUnlock.push('level-3')
        if (newLevel >= 5) achievementsToUnlock.push('level-5')
      }
      // Outfit check
      const newOutfit = getOutfitForScore(state.score)
      if (newOutfit !== oldOutfit) {
        state.outfit = newOutfit
        showOutfitPopup(newOutfit)
        state.kavSig = ''  // Force KAV rebuild
      }
      if (state.score >= 100) achievementsToUnlock.push('score-100')
      if (state.score >= 500) achievementsToUnlock.push('score-500')
    }

    // Apply lives delta
    if (livesDelta !== 0) {
      state.lives = Math.max(0, Math.min(DIFFICULTIES[state.difficulty].lives, state.lives + livesDelta))
      if (state.lives === 0) {
        endGame()
      }
    }

    // Apply combo delta
    if (comboDelta !== 0) {
      state.combo = Math.min(5, state.combo + 1)
      state.lastCatchTime = now
      if (state.comboTimeout) clearTimeout(state.comboTimeout)
      state.comboTimeout = setTimeout(() => { state.combo = 0 }, 2000)
      sfx.play('combo')
    }

    // Stats
    if (catchesDelta !== 0 || newMaxCombo !== state.stats.maxCombo) {
      state.stats.catches += catchesDelta
      state.stats.maxCombo = Math.max(state.stats.maxCombo, newMaxCombo)
    }

    // Unlock achievements (defer to next tick)
    if (achievementsToUnlock.length > 0) {
      setTimeout(() => achievementsToUnlock.forEach(id => unlockAchievement(id)), 0)
    }

    // Spawn particles + texts in batch
    for (const p of newParticles) spawnParticles(p.x, p.y, p.color, 6)
    for (const t of newTexts) spawnFloatingText(t.x, t.y, t.text, t.color)

    // Update items
    state.items = remaining

    // Update particles (on canvas)
    state.particles = state.particles.filter(p => {
      p.x += p.vx * dtNorm
      p.y += p.vy * dtNorm
      p.vy += 0.15 * dtNorm
      p.life -= 0.04 * dtNorm
      return p.life > 0
    })

    // Clean up floating texts
    state.floatingTexts = state.floatingTexts.filter(t => {
      t.life -= 0.022 * dtNorm
      return t.life > 0
    })

    // Screen shake decay
    if (state.screenShake > 0) {
      state.screenShake = Math.max(0, state.screenShake - 0.5 * dtNorm)
      els.game.style.transform = `translate(${(state.rng() - 0.5) * state.screenShake}px, ${(state.rng() - 0.5) * state.screenShake}px)`
    } else if (els.game.style.transform) {
      els.game.style.transform = ''
    }

    // Parallax offset (moves stars based on game speed)
    state.parallaxOffset += dtNorm * getSpeedMultiplier(state.level, state.difficulty) * 0.5
    els.bgParallaxFar.style.transform = `translateY(${state.parallaxOffset * 0.3}px)`
    els.bgParallaxMid.style.transform = `translateY(${state.parallaxOffset * 0.6}px)`
    els.bgParallaxNear.style.transform = `translateY(${state.parallaxOffset * 1.0}px)`

    // Render only what changed
    syncItemDOM()
    syncBulletDOM()
    drawParticles()
    drawMagnetLines()
    syncTextDOM()
    renderComboTrail()
    renderHUD()
    renderKav()
    renderBossBar()

    rafId = requestAnimationFrame(loop)
  }

  // === Start / End game ===
  function startGame() {
    sfx.unlock()
    sfx.play('menu')
    if (!state.musicStarted) {
      sfx.startMusic()
      state.musicStarted = true
    }
    state.score = 0
    state.lives = DIFFICULTIES[state.difficulty].lives
    state.level = 1
    state.wave = 1
    state.combo = 0
    state.lastCatchTime = 0
    state.outfit = 'default'
    state.items = []
    state.bullets = []
    state.particles = []
    state.floatingTexts = []
    state.activePowers = []
    state.boss = null
    state.kavX = 50
    state.targetX = 50
    state.stats = { catches: 0, maxCombo: 0, hazardsHit: 0, startTime: Date.now(), lastLifeLostTime: Date.now() }
    state.screenShake = 0
    state.lastSpawn = 0
    state.lastFire = 0
    state.fireRate = 250
    state.lastFrame = 0
    state.parallaxOffset = 0
    kavExpressionEl = 'happy'
    kavPoseEl = 'idle'
    state.kavSig = ''

    // Clear pooled DOM elements (items + bullets + texts)
    for (const [, el] of state.itemEls.entries()) el.remove()
    state.itemEls.clear()
    for (const [, el] of state.bulletEls.entries()) el.remove()
    state.bulletEls.clear()
    for (const [, el] of state.textEls.entries()) el.remove()
    state.textEls.clear()
    els.itemsLayer.innerHTML = ''
    els.textsLayer.innerHTML = ''
    els.comboTrail.innerHTML = ''
    els.comboTrail.dataset.combo = ''
    ctx2d.clearRect(0, 0, canvasW, canvasH)
    magnetCtx.clearRect(0, 0, canvasW, canvasH)

    if (state.mode === 'daily') {
      state.dailySeed = getDailySeed()
      state.rng = mulberry32(state.dailySeed)
    } else {
      state.rng = Math.random
    }

    // Initial background
    const waveInfo = getWaveInfo(1)
    setBackground(waveInfo.palette.colors)
    buildParallaxStars()
    renderPlanets()

    // Resize canvas to current viewport
    resizeCanvas()

    // Render KAV
    state.kavSig = ''
    renderKav()
    els.kavCharacter.style.left = '50%'

    // Show HUD + hint, hide menu
    hideAllScreens()
    els.hud.classList.remove('hidden')
    els.bottomHint.classList.remove('hidden')
    els.muteBtn.classList.remove('hidden')
    showTouchControlsIfMobile()

    // Start comet spawner
    if (state.cometSpawnTimeout) clearTimeout(state.cometSpawnTimeout)
    state.cometSpawnTimeout = setTimeout(spawnComet, 5000)

    state.phase = 'playing'
    rafId = requestAnimationFrame(loop)
  }

  function endGame() {
    sfx.play('gameOver')
    state.phase = 'gameover'
    if (rafId) cancelAnimationFrame(rafId)
    rafId = null
    if (state.cometSpawnTimeout) clearTimeout(state.cometSpawnTimeout)

    const finalScore = state.score
    const finalLevel = state.level
    const finalWave = state.wave
    const finalSpeed = getSpeedMultiplier(finalLevel, state.difficulty)

    // Save high score
    const prevHigh = loadHighScore(state.difficulty)
    const isNewHigh = finalScore > prevHigh
    if (isNewHigh) saveHighScore(state.difficulty, finalScore)

    // Render game over screen
    els.gameoverKav.innerHTML = buildKav({ expression: 'sad', pose: 'idle', outfit: state.outfit, size: 150 })
    els.finalScore.textContent = finalScore
    els.finalBest.textContent = Math.max(prevHigh, finalScore)
    els.finalCatches.textContent = state.stats.catches
    els.finalCombo.textContent = state.stats.maxCombo + 'x'
    els.finalWave.textContent = finalWave
    els.finalSpeed.textContent = 'x' + finalSpeed.toFixed(1)
    els.newHighBadge.classList.toggle('hidden', !isNewHigh)

    // Show game over screen
    setTimeout(() => {
      els.hud.classList.add('hidden')
      els.bottomHint.classList.add('hidden')
      els.bossBar.classList.add('hidden')
      hideTouchControls()
      els.screenGameover.classList.remove('hidden')

      const lb = loadLeaderboard(state.difficulty)
      const qualifies = finalScore > 0 && (lb.length < 5 || finalScore > (lb[lb.length - 1]?.score || 0))
      if (qualifies) {
        setTimeout(() => {
          els.screenGameover.classList.add('hidden')
          els.nameentryInfo.textContent = `// score ${finalScore} · level ${finalLevel} · wave ${finalWave}`
          els.nameInput.value = storage.getRaw('kav-name', '')
          els.screenNameentry.classList.remove('hidden')
          els.nameInput.focus()
        }, 1500)
      }
    }, 100)
  }

  function hideAllScreens() {
    els.screenMenu.classList.add('hidden')
    els.screenPause.classList.add('hidden')
    els.screenGameover.classList.add('hidden')
    els.screenNameentry.classList.add('hidden')
    els.screenLeaderboard.classList.add('hidden')
    els.screenShare.classList.add('hidden')
  }

  function goMenu() {
    if (rafId) cancelAnimationFrame(rafId)
    rafId = null
    if (state.cometSpawnTimeout) clearTimeout(state.cometSpawnTimeout)
    state.phase = 'menu'
    state.items = []
    state.bullets = []
    state.particles = []
    state.floatingTexts = []
    state.activePowers = []
    state.boss = null
    // Clean pooled DOM (items + bullets + texts)
    for (const [, el] of state.itemEls.entries()) el.remove()
    state.itemEls.clear()
    for (const [, el] of state.bulletEls.entries()) el.remove()
    state.bulletEls.clear()
    for (const [, el] of state.textEls.entries()) el.remove()
    state.textEls.clear()
    ctx2d.clearRect(0, 0, canvasW, canvasH)
    magnetCtx.clearRect(0, 0, canvasW, canvasH)
    els.hud.classList.add('hidden')
    els.bottomHint.classList.add('hidden')
    els.bossBar.classList.add('hidden')
    hideTouchControls()
    hideAllScreens()
    els.screenMenu.classList.remove('hidden')
    refreshMenuStats()
  }

  function refreshMenuStats() {
    const best = loadHighScore(state.difficulty)
    els.badgeBest.textContent = `🏆 BEST: ${best}`
    els.badgeAch.textContent = `🎯 ${unlockedAchievements.size}/${ACHIEVEMENTS.length} ACHIEVEMENTS`
    els.menuKav.innerHTML = buildKav({ expression: 'happy', pose: 'wave', size: 200, glow: true })
    document.querySelectorAll('[data-outfit-render]').forEach(el => {
      el.innerHTML = buildKav({ expression: 'neutral', pose: 'idle', outfit: el.dataset.outfitRender, size: 40 })
    })
  }

  function renderAchievementsGrid() {
    els.achGrid.innerHTML = ACHIEVEMENTS.map(a => {
      const unlocked = unlockedAchievements.has(a.id)
      return `<div class="ach-cell ${unlocked ? 'unlocked' : 'locked'}" title="${a.title} — ${a.desc}">${a.emoji}</div>`
    }).join('')
    els.achCount.textContent = unlockedAchievements.size
  }

  function renderLeaderboard(diff) {
    const lb = loadLeaderboard(diff)
    if (lb.length === 0) {
      els.leaderboardEntries.innerHTML = '<div class="lb-empty">No scores yet. Be the first!</div>'
    } else {
      els.leaderboardEntries.innerHTML = lb.map((entry, i) => {
        const rank = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`
        const date = new Date(entry.date).toLocaleDateString()
        return `<div class="lb-entry rank-${i + 1}">
          <div class="lb-rank">${rank}</div>
          <div class="lb-info">
            <div class="lb-name">${escapeHTML(entry.name)}</div>
            <div class="lb-meta">LVL ${entry.level} · ${date}</div>
          </div>
          <div class="lb-score">${entry.score}</div>
        </div>`
      }).join('')
    }
    renderAchievementsGrid()
  }

  function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]))
  }

  // === Share score card ===
  function renderShareCard() {
    const canvas = els.shareCanvas
    const ctx = canvas.getContext('2d')
    const w = canvas.width, h = canvas.height

    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, '#1a0a3e')
    grad.addColorStop(0.5, '#06061f')
    grad.addColorStop(1, '#1a0a3e')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = 'white'
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * w
      const y = Math.random() * h
      const r = Math.random() * 1.5 + 0.5
      ctx.globalAlpha = Math.random() * 0.6 + 0.4
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1

    ctx.fillStyle = '#FFD93D'
    ctx.font = 'bold 14px "JetBrains Mono", monospace'
    ctx.textAlign = 'left'
    ctx.fillText('// KAV MOON CATCHER', 24, 32)

    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '12px "JetBrains Mono", monospace'
    ctx.textAlign = 'right'
    ctx.fillText(`${DIFFICULTIES[state.difficulty].label} · WAVE ${state.wave}`, w - 24, 32)

    ctx.fillStyle = '#FFD93D'
    ctx.font = 'bold 96px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(state.score, w / 2, 130)

    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '12px "JetBrains Mono", monospace'
    ctx.fillText('FINAL SCORE', w / 2, 150)

    const stats = [
      { label: 'LEVEL', value: state.level },
      { label: 'CATCHES', value: state.stats.catches },
      { label: 'MAX COMBO', value: state.stats.maxCombo + 'x' },
      { label: 'OUTFIT', value: OUTFIT_INFO[state.outfit].name.split(' ')[0] },
    ]
    stats.forEach((s, i) => {
      const x = (w / 4) * i + w / 8
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.font = '10px "JetBrains Mono", monospace'
      ctx.fillText(s.label, x, 200)
      ctx.fillStyle = '#5DADE2'
      ctx.font = 'bold 20px Inter, sans-serif'
      ctx.fillText(String(s.value), x, 225)
    })

    ctx.fillStyle = '#FFD93D'
    ctx.font = 'bold 16px Inter, sans-serif'
    ctx.fillText('👽 $KAV CATCHER', w / 2, 270)
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '11px "JetBrains Mono", monospace'
    ctx.fillText('same planet · brighter tomorrow', w / 2, 290)
  }

  function downloadShareCard() {
    renderShareCard()
    const link = document.createElement('a')
    link.download = `kav-score-${state.score}.png`
    link.href = els.shareCanvas.toDataURL('image/png')
    link.click()
  }

  async function copyShareCard() {
    renderShareCard()
    try {
      els.shareCanvas.toBlob(async (blob) => {
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
          alert('Score card copied! Paste it anywhere.')
        } catch (e) {
          alert('Clipboard API not supported. Use Download instead.')
        }
      })
    } catch (e) {
      alert('Could not copy. Use Download instead.')
    }
  }

  function tweetShare() {
    const text = `👽 Just scored ${state.score} in $KAV CATCHER! Level ${state.level}, wave ${state.wave}, max combo ${state.stats.maxCombo}x. Same planet, brighter tomorrow. 🚀💜`
    const url = encodeURIComponent(window.location.href)
    const t = encodeURIComponent(text)
    window.open(`https://twitter.com/intent/tweet?text=${t}&url=${url}`, '_blank')
  }

  // === Input handlers ===
  function handlePointer(clientX, clientY) {
    const rect = els.game.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * 100
    state.targetX = Math.max(6, Math.min(94, x))
    if (clientY > 0) {
      showTouchRipple(clientX - rect.left, clientY - rect.top)
    }
  }

  const keysDown = new Set()
  document.addEventListener('keydown', (e) => {
    keysDown.add(e.key.toLowerCase())
    if (e.key === ' ' || e.key === 'Enter') {
      if (state.phase === 'menu' || state.phase === 'gameover') {
        startGame()
        e.preventDefault()
      } else if (state.phase === 'playing') {
        pauseGame()
        e.preventDefault()
      } else if (state.phase === 'paused') {
        resumeGame()
        e.preventDefault()
      }
    }
    if (e.key === 'Escape' && state.phase === 'playing') pauseGame()
    if (e.key.toLowerCase() === 'm') toggleMute()
  })
  document.addEventListener('keyup', (e) => keysDown.delete(e.key.toLowerCase()))

  // Keyboard movement interval
  setInterval(() => {
    if (state.phase !== 'playing') return
    const left = keysDown.has('arrowleft') || keysDown.has('a')
    const right = keysDown.has('arrowright') || keysDown.has('d')
    if (left) state.targetX = Math.max(6, state.targetX - 1.5)
    if (right) state.targetX = Math.min(94, state.targetX + 1.5)
  }, 16)

  // Mouse + touch
  els.game.addEventListener('mousemove', (e) => {
    if (state.phase === 'playing') handlePointer(e.clientX, 0)
  })
  els.game.addEventListener('touchmove', (e) => {
    if (state.phase === 'playing' && e.touches.length > 0) {
      handlePointer(e.touches[0].clientX, e.touches[0].clientY)
      e.preventDefault()
    }
  }, { passive: false })

  // Resize handler (also handles mobile browser URL bar showing/hiding)
  window.addEventListener('resize', () => {
    resizeCanvas()
  })

  // VisualViewport API for proper mobile sizing (URL bar show/hide)
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', resizeCanvas)
  }

  // === Touch device detection ===
  const isTouchDevice = (('ontouchstart' in window) || navigator.maxTouchPoints > 0) &&
    window.matchMedia('(hover: none) and (pointer: coarse)').matches

  // === Touch controls (left/right buttons) for mobile ===
  if (isTouchDevice) {
    els.touchControls.classList.add('touch-device')
    // Add mobile-only tutorial control
    if (els.tutorialControls) {
      const mobileCtrl = document.createElement('div')
      mobileCtrl.className = 'tutorial-control mobile-only'
      mobileCtrl.innerHTML = '📱 <span>Tap left/right buttons</span>'
      els.tutorialControls.appendChild(mobileCtrl)
    }
  }

  let touchLeftActive = false
  let touchRightActive = false

  function setTouchLeft(active) {
    if (touchLeftActive === active) return
    touchLeftActive = active
    els.touchLeft.classList.toggle('pressed', active)
    els.touchZoneLeft.classList.toggle('active', active)
  }
  function setTouchRight(active) {
    if (touchRightActive === active) return
    touchRightActive = active
    els.touchRight.classList.toggle('pressed', active)
    els.touchZoneRight.classList.toggle('active', active)
  }

  // Touch button handlers
  function attachTouchButton(btnEl, setActive, isLeft) {
    btnEl.addEventListener('touchstart', (e) => {
      e.preventDefault()
      setActive(true)
    }, { passive: false })
    btnEl.addEventListener('touchend', (e) => {
      e.preventDefault()
      setActive(false)
    }, { passive: false })
    btnEl.addEventListener('touchcancel', () => setActive(false))
    btnEl.addEventListener('mousedown', (e) => {
      e.preventDefault()
      setActive(true)
    })
    btnEl.addEventListener('mouseup', () => setActive(false))
    btnEl.addEventListener('mouseleave', () => setActive(false))
  }
  attachTouchButton(els.touchLeft, setTouchLeft, true)
  attachTouchButton(els.touchRight, setTouchRight, false)

  // Add touch buttons to keyboard interval check
  const originalInterval = setInterval(() => {
    if (state.phase !== 'playing') return
    let left = keysDown.has('arrowleft') || keysDown.has('a')
    let right = keysDown.has('arrowright') || keysDown.has('d')
    if (touchLeftActive) left = true
    if (touchRightActive) right = true
    if (left) state.targetX = Math.max(6, state.targetX - 1.5)
    if (right) state.targetX = Math.min(94, state.targetX + 1.5)
  }, 16)

  // === Show touch controls when game starts (mobile only) ===
  function showTouchControlsIfMobile() {
    if (isTouchDevice && state.phase === 'playing') {
      els.touchControls.classList.add('visible')
      els.touchZoneLeft.style.opacity = '0.04'
      els.touchZoneRight.style.opacity = '0.04'
    }
  }
  function hideTouchControls() {
    els.touchControls.classList.remove('visible')
    els.touchZoneLeft.classList.remove('active')
    els.touchZoneRight.classList.remove('active')
  }

  // === First-time tutorial ===
  function showTutorialIfNeeded() {
    if (storage.getRaw('kav-tutorial-seen', '0') === '1') return
    els.tutorial.classList.remove('hidden')
    // Adapt tutorial text for touch devices
    if (isTouchDevice) {
      els.tutorialText.textContent = 'Tap the left/right buttons at the bottom to move KAV. Auto-fire is ON. Destroy enemies before they reach you!'
    } else {
      els.tutorialText.textContent = 'Move KAV left/right to aim. Auto-fire is ON. Destroy enemies before they reach you!'
    }
  }
  function dismissTutorial() {
    els.tutorial.classList.add('hidden')
    storage.setRaw('kav-tutorial-seen', '1')
    sfx.play('menu')
  }
  els.tutorialClose.addEventListener('click', dismissTutorial)

  // === Prevent context menu + double-tap zoom on mobile during gameplay ===
  document.addEventListener('contextmenu', (e) => {
    if (state.phase === 'playing') e.preventDefault()
  })
  let lastTouchTime = 0
  document.addEventListener('touchend', (e) => {
    const now = Date.now()
    if (now - lastTouchTime < 300) e.preventDefault()
    lastTouchTime = now
  }, { passive: false })

  function pauseGame() {
    if (state.phase !== 'playing') return
    state.phase = 'paused'
    if (rafId) cancelAnimationFrame(rafId)
    rafId = null
    els.screenPause.classList.remove('hidden')
  }

  function resumeGame() {
    if (state.phase !== 'paused') return
    state.phase = 'playing'
    els.screenPause.classList.add('hidden')
    state.lastFrame = 0
    rafId = requestAnimationFrame(loop)
  }

  function toggleMute() {
    const m = sfx.toggleMute()
    els.muteBtn.textContent = m ? '🔇' : '🔊'
    storage.setRaw('kav-muted', m ? '1' : '0')
  }

  // === Event listeners ===
  els.playBtn.addEventListener('click', startGame)
  els.pauseBtn.addEventListener('click', () => state.phase === 'playing' ? pauseGame() : resumeGame())
  els.resumeBtn.addEventListener('click', resumeGame)
  els.restartBtn.addEventListener('click', () => { els.screenPause.classList.add('hidden'); startGame() })
  els.quitBtn.addEventListener('click', goMenu)
  els.playAgainBtn.addEventListener('click', startGame)
  els.backToMenuBtn.addEventListener('click', goMenu)
  els.viewLeaderboardBtn.addEventListener('click', () => {
    els.screenGameover.classList.add('hidden')
    renderLeaderboard(state.difficulty)
    document.querySelectorAll('.lb-tab').forEach(t => t.classList.toggle('active', t.dataset.lbDiff === state.difficulty))
    els.screenLeaderboard.classList.remove('hidden')
  })
  els.lbBackBtn.addEventListener('click', () => {
    els.screenLeaderboard.classList.add('hidden')
    els.screenGameover.classList.remove('hidden')
  })
  els.badgeLeaderboard.addEventListener('click', () => {
    renderLeaderboard(state.difficulty)
    document.querySelectorAll('.lb-tab').forEach(t => t.classList.toggle('active', t.dataset.lbDiff === state.difficulty))
    hideAllScreens()
    els.screenLeaderboard.classList.remove('hidden')
  })

  // Save name
  els.saveNameBtn.addEventListener('click', () => {
    const name = (els.nameInput.value || 'ANON').slice(0, 12).toUpperCase()
    storage.setRaw('kav-name', name)
    const lb = loadLeaderboard(state.difficulty)
    lb.push({ name, score: state.score, level: state.level, date: new Date().toISOString() })
    lb.sort((a, b) => b.score - a.score)
    saveLeaderboard(state.difficulty, lb.slice(0, 5))
    els.screenNameentry.classList.add('hidden')
    renderLeaderboard(state.difficulty)
    document.querySelectorAll('.lb-tab').forEach(t => t.classList.toggle('active', t.dataset.lbDiff === state.difficulty))
    els.screenLeaderboard.classList.remove('hidden')
  })
  els.nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') els.saveNameBtn.click() })

  // Leaderboard tabs
  document.querySelectorAll('.lb-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'))
      tab.classList.add('active')
      renderLeaderboard(tab.dataset.lbDiff)
    })
  })

  // Mode + difficulty selectors
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      state.mode = btn.dataset.mode
      els.dailyInfo.classList.toggle('hidden', state.mode !== 'daily')
      if (state.mode === 'daily') {
        els.dailyDate.textContent = `// ${getDailyDateString()} · seeded run`
        const best = loadHighScore('daily')
        els.dailyStats.innerHTML = best > 0 ? `previous best: <b>${best}</b>` : 'first run today'
      }
    })
  })

  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      state.difficulty = btn.dataset.diff
      refreshMenuStats()
      if (state.mode === 'daily') {
        const best = loadHighScore('daily')
        els.dailyStats.innerHTML = best > 0 ? `previous best: <b>${best}</b>` : 'first run today'
      }
    })
  })

  els.muteBtn.addEventListener('click', toggleMute)

  // Share
  els.shareBtn.addEventListener('click', () => {
    els.screenGameover.classList.add('hidden')
    renderShareCard()
    els.screenShare.classList.remove('hidden')
  })
  els.copyShareBtn.addEventListener('click', copyShareCard)
  els.downloadShareBtn.addEventListener('click', downloadShareCard)
  els.tweetShareBtn.addEventListener('click', tweetShare)
  els.closeShareBtn.addEventListener('click', () => {
    els.screenShare.classList.add('hidden')
    els.screenGameover.classList.remove('hidden')
  })

  // === Init ===
  function init() {
    const m = storage.getRaw('kav-muted', '0') === '1'
    if (m) {
      sfx.setMuted(true)
      els.muteBtn.textContent = '🔇'
    }
    resizeCanvas()
    const waveInfo = getWaveInfo(1)
    setBackground(waveInfo.palette.colors)
    buildParallaxStars()
    renderPlanets()
    refreshMenuStats()
    els.screenMenu.classList.remove('hidden')
    // Show first-time tutorial (auto-dismissed on first interaction or click)
    showTutorialIfNeeded()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
