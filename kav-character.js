/* ============================================================
 *  KAV Character — vanilla JS SVG builder
 *  Builds the KAV alien SVG based on expression/pose/outfit/shield.
 *  Returns an SVG string. Caller inserts via innerHTML.
 * ============================================================ */

(function (global) {
  'use strict'

  const EXPRESSIONS = ['neutral', 'happy', 'surprised', 'wink', 'cool', 'sad', 'angry', 'wow']
  const POSES = ['idle', 'wave', 'float', 'thinking', 'fist', 'point', 'hold-flag', 'ride-rocket', 'sit', 'dance', 'magnet', 'shield', 'shoot']
  const OUTFITS = ['default', 'astronaut', 'diamond', 'royal']

  const OUTFIT_PALETTES = {
    default:   { body: '#2D7DD2', skin: '#5DADE2' },
    astronaut: { body: '#E8E8E8', skin: '#5DADE2' },
    diamond:   { body: '#8DCFF2', skin: '#5DADE2' },
    royal:     { body: '#7B2D8E', skin: '#5DADE2' },
  }

  const OUTFIT_INFO = {
    default:   { name: 'CIVILIAN KAV',  unlockAt: 0,   desc: 'where it all begins' },
    astronaut: { name: 'ASTRO KAV',     unlockAt: 100, desc: 'suit up · moon mission active' },
    diamond:   { name: 'DIAMOND KAV',   unlockAt: 250, desc: 'diamond hands · diamond skin' },
    royal:     { name: 'ROYAL KAV',     unlockAt: 500, desc: 'crowned · emperor of the galaxy' },
  }

  function getPoseConfig(pose) {
    switch (pose) {
      case 'wave': return { leftArm: 'rotate(-25 70 215)', rightArm: 'rotate(-130 170 215)', leftLeg: 'rotate(0 103 296)', rightLeg: 'rotate(0 137 296)', head: 'rotate(-3 120 130)', legYOff: 0 }
      case 'float': return { leftArm: 'rotate(-50 70 215)', rightArm: 'rotate(50 170 215)', leftLeg: 'rotate(-12 103 296)', rightLeg: 'rotate(12 137 296)', head: 'rotate(0 120 130)', legYOff: 0 }
      case 'thinking': return { leftArm: 'rotate(15 70 215)', rightArm: 'rotate(-110 170 215)', leftLeg: 'rotate(0 103 296)', rightLeg: 'rotate(0 137 296)', head: 'rotate(8 120 130)', legYOff: 0 }
      case 'fist': return { leftArm: 'rotate(-100 70 215)', rightArm: 'rotate(100 170 215)', leftLeg: 'rotate(-5 103 296)', rightLeg: 'rotate(5 137 296)', head: 'rotate(0 120 130)', legYOff: 0 }
      case 'point': return { leftArm: 'rotate(-15 70 215)', rightArm: 'rotate(-95 170 215)', leftLeg: 'rotate(0 103 296)', rightLeg: 'rotate(0 137 296)', head: 'rotate(-5 120 130)', legYOff: 0 }
      case 'hold-flag': return { leftArm: 'rotate(-35 70 215)', rightArm: 'rotate(45 170 215)', leftLeg: 'rotate(0 103 296)', rightLeg: 'rotate(0 137 296)', head: 'rotate(0 120 130)', legYOff: 0 }
      case 'sit': return { leftArm: 'rotate(20 70 215)', rightArm: 'rotate(-20 170 215)', leftLeg: 'rotate(0 103 296)', rightLeg: 'rotate(0 137 296)', head: 'rotate(0 120 130)', legYOff: 24 }
      case 'dance': return { leftArm: 'rotate(-90 70 215)', rightArm: 'rotate(90 170 215)', leftLeg: 'rotate(-15 103 296)', rightLeg: 'rotate(15 137 296)', head: 'rotate(-8 120 130)', legYOff: 0 }
      case 'magnet': return { leftArm: 'rotate(-70 70 215)', rightArm: 'rotate(70 170 215)', leftLeg: 'rotate(-8 103 296)', rightLeg: 'rotate(8 137 296)', head: 'rotate(0 120 130)', legYOff: 0 }
      case 'shield': return { leftArm: 'rotate(-60 70 215)', rightArm: 'rotate(60 170 215)', leftLeg: 'rotate(-5 103 296)', rightLeg: 'rotate(5 137 296)', head: 'rotate(0 120 130)', legYOff: 0 }
      case 'shoot': return { leftArm: 'rotate(-110 70 215)', rightArm: 'rotate(-90 170 215)', leftLeg: 'rotate(-3 103 296)', rightLeg: 'rotate(3 137 296)', head: 'rotate(-3 120 130)', legYOff: 0 }
      default: return { leftArm: 'rotate(0 70 215)', rightArm: 'rotate(0 170 215)', leftLeg: 'rotate(0 103 296)', rightLeg: 'rotate(0 137 296)', head: 'rotate(0 120 130)', legYOff: 0 }
    }
  }

  function renderEyes(expression, id) {
    const eyeGrad = `url(#eye-${id})`
    switch (expression) {
      case 'happy':
        return `<path d="M 70 130 Q 86 110 102 130" fill="none" stroke="#0A0A0A" stroke-width="9" stroke-linecap="round"/>
                <path d="M 138 130 Q 154 110 170 130" fill="none" stroke="#0A0A0A" stroke-width="9" stroke-linecap="round"/>`
      case 'neutral':
        return `<ellipse cx="86" cy="130" rx="14" ry="22" fill="${eyeGrad}"/>
                <ellipse cx="154" cy="130" rx="14" ry="22" fill="${eyeGrad}"/>
                <ellipse cx="82" cy="122" rx="4.5" ry="7" fill="#FFFFFF" opacity="0.95"/>
                <ellipse cx="150" cy="122" rx="4.5" ry="7" fill="#FFFFFF" opacity="0.95"/>
                <circle cx="90" cy="138" r="2.2" fill="#FFFFFF" opacity="0.7"/>
                <circle cx="158" cy="138" r="2.2" fill="#FFFFFF" opacity="0.7"/>`
      case 'surprised':
        return `<ellipse cx="86" cy="128" rx="17" ry="24" fill="${eyeGrad}"/>
                <ellipse cx="154" cy="128" rx="17" ry="24" fill="${eyeGrad}"/>
                <ellipse cx="82" cy="120" rx="5" ry="8" fill="#FFFFFF" opacity="0.95"/>
                <ellipse cx="150" cy="120" rx="5" ry="8" fill="#FFFFFF" opacity="0.95"/>`
      case 'wow':
        return `<ellipse cx="86" cy="128" rx="19" ry="26" fill="${eyeGrad}"/>
                <ellipse cx="154" cy="128" rx="19" ry="26" fill="${eyeGrad}"/>
                <ellipse cx="80" cy="118" rx="6" ry="9" fill="#FFFFFF" opacity="0.95"/>
                <ellipse cx="148" cy="118" rx="6" ry="9" fill="#FFFFFF" opacity="0.95"/>`
      case 'wink':
        return `<ellipse cx="86" cy="130" rx="14" ry="22" fill="${eyeGrad}"/>
                <ellipse cx="82" cy="122" rx="4.5" ry="7" fill="#FFFFFF" opacity="0.95"/>
                <circle cx="90" cy="138" r="2.2" fill="#FFFFFF" opacity="0.7"/>
                <path d="M 140 132 Q 154 122 168 132" fill="none" stroke="#0A0A0A" stroke-width="9" stroke-linecap="round"/>`
      case 'cool':
        return `<rect x="68" y="124" width="36" height="14" rx="7" fill="#0A0A0A"/>
                <rect x="136" y="124" width="36" height="14" rx="7" fill="#0A0A0A"/>
                <line x1="104" y1="131" x2="136" y2="131" stroke="#0A0A0A" stroke-width="3"/>
                <ellipse cx="80" cy="128" rx="6" ry="2" fill="#FFFFFF" opacity="0.4"/>
                <ellipse cx="148" cy="128" rx="6" ry="2" fill="#FFFFFF" opacity="0.4"/>`
      case 'sad':
        return `<ellipse cx="86" cy="135" rx="13" ry="18" fill="${eyeGrad}"/>
                <ellipse cx="154" cy="135" rx="13" ry="18" fill="${eyeGrad}"/>
                <ellipse cx="82" cy="128" rx="4" ry="6" fill="#FFFFFF" opacity="0.9"/>
                <ellipse cx="150" cy="128" rx="4" ry="6" fill="#FFFFFF" opacity="0.9"/>
                <path d="M 72 112 L 100 122" stroke="#1A3F6E" stroke-width="3" stroke-linecap="round"/>
                <path d="M 140 122 L 168 112" stroke="#1A3F6E" stroke-width="3" stroke-linecap="round"/>`
      case 'angry':
        return `<ellipse cx="86" cy="135" rx="13" ry="18" fill="${eyeGrad}"/>
                <ellipse cx="154" cy="135" rx="13" ry="18" fill="${eyeGrad}"/>
                <ellipse cx="82" cy="128" rx="4" ry="6" fill="#FFFFFF" opacity="0.9"/>
                <ellipse cx="150" cy="128" rx="4" ry="6" fill="#FFFFFF" opacity="0.9"/>
                <path d="M 68 118 L 100 128" stroke="#1A3F6E" stroke-width="5" stroke-linecap="round"/>
                <path d="M 140 128 L 172 118" stroke="#1A3F6E" stroke-width="5" stroke-linecap="round"/>`
      default: return ''
    }
  }

  function renderMouth(expression) {
    switch (expression) {
      case 'neutral': return `<path d="M 110 178 Q 120 184 130 178" fill="none" stroke="#0E2A4D" stroke-width="2.5" stroke-linecap="round"/>`
      case 'happy': return `<path d="M 108 175 Q 120 192 132 175 Q 120 184 108 175 Z" fill="#0E2A4D" stroke="#0E2A4D" stroke-width="2"/>`
      case 'surprised': return `<ellipse cx="120" cy="184" rx="6" ry="8" fill="#0E2A4D"/>`
      case 'wow': return `<ellipse cx="120" cy="186" rx="9" ry="11" fill="#0E2A4D"/>`
      case 'wink': return `<path d="M 108 178 Q 120 188 132 178" fill="#0E2A4D" stroke="#0E2A4D" stroke-width="2"/>`
      case 'cool': return `<path d="M 110 182 Q 120 188 130 182" fill="none" stroke="#0E2A4D" stroke-width="2.5" stroke-linecap="round"/>`
      case 'sad': return `<path d="M 110 188 Q 120 180 130 188" fill="none" stroke="#0E2A4D" stroke-width="2.5" stroke-linecap="round"/>`
      case 'angry': return `<path d="M 108 188 L 116 182 L 124 188 L 132 182" fill="none" stroke="#0E2A4D" stroke-width="2.5" stroke-linecap="round"/>`
      default: return ''
    }
  }

  function renderOutfitExtras(outfit) {
    if (outfit === 'astronaut') {
      return `<g>
        <circle cx="120" cy="130" r="92" fill="rgba(180, 220, 255, 0.15)" stroke="rgba(255, 255, 255, 0.4)" stroke-width="2"/>
        <ellipse cx="92" cy="100" rx="18" ry="26" fill="#FFFFFF" opacity="0.25"/>
        <ellipse cx="120" cy="220" rx="78" ry="14" fill="#0E2A4D"/>
        <ellipse cx="120" cy="220" rx="74" ry="10" fill="#1A5FAB"/>
        <rect x="100" y="240" width="40" height="14" rx="2" fill="#FFFFFF" opacity="0.9"/>
        <text x="120" y="251" text-anchor="middle" font-family="'Arial Black', sans-serif" font-weight="900" font-size="8" fill="#0E2A4D">$KAV</text>
      </g>`
    }
    if (outfit === 'diamond') {
      const pts = [[70, 130], [170, 100], [180, 200], [60, 220], [120, 80]]
      const sparkles = pts.map(([cx, cy], i) => {
        return `<g>
          <path d="M ${cx} ${cy - 6} L ${cx + 3} ${cy} L ${cx} ${cy + 6} L ${cx - 3} ${cy} Z" fill="#8DCFF2">
            <animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="${2 + i}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.5;1;0.5" dur="${1.5 + i * 0.2}s" repeatCount="indefinite"/>
          </path>
        </g>`
      }).join('')
      return `<g opacity="0.9">${sparkles}</g>
        <path d="M 88 200 L 96 192 L 104 200 L 112 192 L 120 200 L 128 192 L 136 200 L 144 192 L 152 200 L 144 210 L 96 210 Z" fill="#8DCFF2" stroke="#5DADE2" stroke-width="1" opacity="0.9"/>`
    }
    if (outfit === 'royal') {
      return `<g>
        <path d="M 78 50 L 88 30 L 96 50 L 108 25 L 120 50 L 132 25 L 144 50 L 152 30 L 162 50 L 162 62 L 78 62 Z" fill="#FFD93D" stroke="#B89000" stroke-width="2"/>
        <circle cx="96" cy="42" r="3" fill="#FF6B6B"/>
        <circle cx="120" cy="38" r="4" fill="#5DADE2"/>
        <circle cx="144" cy="42" r="3" fill="#FF6B6B"/>
        <path d="M 60 200 L 50 280 L 60 285 L 75 240 Z" fill="#7B2D8E" opacity="0.7"/>
        <path d="M 180 200 L 190 280 L 180 285 L 165 240 Z" fill="#7B2D8E" opacity="0.7"/>
        <path d="M 76 200 L 60 290 L 100 295 L 120 280 L 140 295 L 180 290 L 164 200 Z" fill="#9B3DAA" opacity="0.45"/>
      </g>`
    }
    return ''
  }

  /**
   * Build the KAV character SVG.
   * @param {Object} opts
   * @param {string} opts.expression - one of EXPRESSIONS
   * @param {string} opts.pose - one of POSES
   * @param {string} opts.outfit - one of OUTFITS
   * @param {boolean} opts.shield - render shield bubble
   * @param {number} opts.size - SVG width in px
   * @param {boolean} opts.glow - drop shadow glow
   * @returns {string} SVG markup
   */
  function buildKavCharacter(opts) {
    const opts_ = opts || {}
    const expression = opts_.expression || 'neutral'
    const pose = opts_.pose || 'idle'
    const outfit = opts_.outfit || 'default'
    const shield = !!opts_.shield
    const size = opts_.size || 320
    const glow = !!opts_.glow

    const palette = OUTFIT_PALETTES[outfit] || OUTFIT_PALETTES.default
    const pc = getPoseConfig(pose)
    const id = 'k' + Math.random().toString(36).slice(2, 9)

    const filter = glow ? `filter: drop-shadow(0 0 24px rgba(93, 173, 226, 0.55));` : ''
    const eyes = renderEyes(expression, id)
    const mouth = renderMouth(expression)
    const outfitExtras = renderOutfitExtras(outfit)

    return `<svg viewBox="0 0 240 360" width="${size}" height="${size * (360 / 240)}" style="overflow: visible; ${filter}" role="img" aria-label="KAV alien character, ${expression} expression, ${pose} pose">
      <defs>
        <radialGradient id="skin-${id}" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stop-color="#8DCFF2"/>
          <stop offset="55%" stop-color="${palette.skin}"/>
          <stop offset="100%" stop-color="#2E7BB0"/>
        </radialGradient>
        <linearGradient id="body-${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${palette.body}"/>
          <stop offset="100%" stop-color="#1A5FAB"/>
        </linearGradient>
        <linearGradient id="pants-${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1A5FAB"/>
          <stop offset="100%" stop-color="#0E3D70"/>
        </linearGradient>
        <radialGradient id="eye-${id}" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#1a1a1a"/>
          <stop offset="100%" stop-color="#000000"/>
        </radialGradient>
        <radialGradient id="cheek-${id}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FF8FA3" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#FF8FA3" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="shield-${id}" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stop-color="#8DCFF2" stop-opacity="0.4"/>
          <stop offset="70%" stop-color="#5DADE2" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#5DADE2" stop-opacity="0"/>
        </radialGradient>
      </defs>

      ${shield ? `<g>
        <circle cx="120" cy="180" r="120" fill="url(#shield-${id})"/>
        <circle cx="120" cy="180" r="118" fill="none" stroke="#8DCFF2" stroke-width="3" stroke-opacity="0.7" stroke-dasharray="8 4">
          <animateTransform attributeName="transform" type="rotate" from="0 120 180" to="360 120 180" dur="6s" repeatCount="indefinite"/>
        </circle>
        <circle cx="60" cy="120" r="2" fill="#FFFFFF"><animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite"/></circle>
        <circle cx="180" cy="180" r="2" fill="#FFFFFF"><animate attributeName="opacity" values="1;0.3;1" dur="1.8s" repeatCount="indefinite"/></circle>
        <circle cx="100" cy="260" r="2" fill="#FFFFFF"><animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/></circle>
      </g>` : ''}

      ${pose === 'magnet' ? `<g>
        <circle cx="120" cy="180" r="100" fill="none" stroke="#FF6B6B" stroke-width="2" stroke-opacity="0.5" stroke-dasharray="4 6">
          <animate attributeName="r" values="100;130;100" dur="2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="120" cy="180" r="80" fill="none" stroke="#FFD93D" stroke-width="1.5" stroke-opacity="0.4" stroke-dasharray="2 4">
          <animate attributeName="r" values="80;100;80" dur="1.5s" repeatCount="indefinite"/>
        </circle>
      </g>` : ''}

      ${outfitExtras}

      <ellipse cx="120" cy="346" rx="58" ry="7" fill="rgba(0,0,0,0.28)"/>

      <g transform="translate(0, ${pc.legYOff})">
        <rect x="92" y="296" width="22" height="36" rx="6" fill="url(#pants-${id})" transform="${pc.leftLeg}" style="transition: transform 0.4s"/>
        <rect x="126" y="296" width="22" height="36" rx="6" fill="url(#pants-${id})" transform="${pc.rightLeg}" style="transition: transform 0.4s"/>
        <ellipse cx="103" cy="336" rx="16" ry="9" fill="#0E2A4D" transform="${pc.leftLeg}"/>
        <ellipse cx="137" cy="336" rx="16" ry="9" fill="#0E2A4D" transform="${pc.rightLeg}"/>
        <ellipse cx="103" cy="339" rx="16" ry="3" fill="#061629" transform="${pc.leftLeg}"/>
        <ellipse cx="137" cy="339" rx="16" ry="3" fill="#061629" transform="${pc.rightLeg}"/>
      </g>

      <path d="M 76 200 Q 70 200 66 222 L 60 272 Q 60 286 74 286 L 96 286 L 96 296 L 144 296 L 144 286 L 166 286 Q 180 286 180 272 L 174 222 Q 170 200 164 200 Z" fill="url(#body-${id})"/>
      <path d="M 84 208 Q 88 222 92 240 L 92 280" stroke="rgba(255,255,255,0.18)" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M 96 200 Q 120 222 144 200" fill="none" stroke="#0E3D70" stroke-width="2.5"/>

      <g transform="${pc.leftArm}" style="transition: transform 0.4s ease; transform-origin: 70px 215px">
        <ellipse cx="62" cy="245" rx="13" ry="32" fill="url(#skin-${id})" transform="rotate(8 62 245)"/>
        <circle cx="58" cy="278" r="12" fill="url(#skin-${id})"/>
      </g>
      <g transform="${pc.rightArm}" style="transition: transform 0.4s ease; transform-origin: 170px 215px">
        <ellipse cx="178" cy="245" rx="13" ry="32" fill="url(#skin-${id})" transform="rotate(-8 178 245)"/>
        <circle cx="182" cy="278" r="12" fill="url(#skin-${id})"/>
      </g>

      <g transform="${pc.head}" style="transition: transform 0.4s ease; transform-origin: 120px 130px">
        <line x1="120" y1="42" x2="120" y2="22" stroke="#1A5FAB" stroke-width="3.5" stroke-linecap="round"/>
        <circle cx="120" cy="18" r="6" fill="#FFD93D">
          <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="120" cy="18" r="3" fill="#FFE873" opacity="0.9"/>

        <ellipse cx="120" cy="130" rx="78" ry="86" fill="url(#skin-${id})"/>
        <ellipse cx="92" cy="95" rx="26" ry="18" fill="#B3E0F5" opacity="0.55"/>
        <ellipse cx="155" cy="170" rx="14" ry="22" fill="#2E7BB0" opacity="0.25"/>
        <ellipse cx="68" cy="158" rx="14" ry="10" fill="url(#cheek-${id})"/>
        <ellipse cx="172" cy="158" rx="14" ry="10" fill="url(#cheek-${id})"/>

        <g>
          <rect x="92" y="58" width="56" height="22" rx="4" fill="#0E2A4D" opacity="0.85"/>
          <text x="120" y="75" text-anchor="middle" font-family="'Arial Black', 'Inter', sans-serif" font-weight="900" font-size="16" fill="#FFD93D" letter-spacing="2">KAV</text>
        </g>

        ${eyes}
        ${mouth}

        <ellipse cx="92" cy="95" rx="14" ry="8" fill="#FFFFFF" opacity="0.18"/>
      </g>

      ${pose === 'hold-flag' ? `<g>
        <line x1="58" y1="278" x2="58" y2="160" stroke="#3A2E1A" stroke-width="4" stroke-linecap="round"/>
        <path d="M 58 162 L 110 168 L 105 184 L 110 200 L 58 194 Z" fill="#FFD93D" stroke="#B89000" stroke-width="2"/>
        <text x="84" y="183" text-anchor="middle" font-family="'Arial Black', sans-serif" font-weight="900" font-size="14" fill="#0E2A4D">$KAV</text>
      </g>` : ''}
    </svg>`
  }

  function buildKavRocket(size, glow) {
    const id = 'r' + Math.random().toString(36).slice(2, 9)
    size = size || 320
    const filter = glow !== false ? 'drop-shadow(0 0 30px rgba(255, 180, 60, 0.6))' : ''
    return `<svg viewBox="0 0 240 360" width="${size}" height="${size * (360 / 240)}" style="overflow: visible; filter: ${filter}" role="img" aria-label="KAV rocket">
      <defs>
        <linearGradient id="rocket-${id}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#E6E6E6"/>
          <stop offset="50%" stop-color="#FFFFFF"/>
          <stop offset="100%" stop-color="#B0B0B0"/>
        </linearGradient>
        <linearGradient id="tip-${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FF6B6B"/>
          <stop offset="100%" stop-color="#C92A2A"/>
        </linearGradient>
      </defs>
      <g>
        <path d="M 100 320 Q 120 360 140 320 Q 130 345 120 350 Q 110 345 100 320 Z" fill="#FFD93D">
          <animate attributeName="d" dur="0.25s" repeatCount="indefinite"
            values="M 100 320 Q 120 360 140 320 Q 130 345 120 350 Q 110 345 100 320 Z;
                    M 95 320 Q 120 380 145 320 Q 132 348 120 354 Q 108 348 95 320 Z;
                    M 100 320 Q 120 360 140 320 Q 130 345 120 350 Q 110 345 100 320 Z"/>
        </path>
        <path d="M 110 320 Q 120 345 130 320 Q 125 335 120 338 Q 115 335 110 320 Z" fill="#FF6B6B">
          <animate attributeName="opacity" values="0.7;1;0.7" dur="0.2s" repeatCount="indefinite"/>
        </path>
      </g>
      <path d="M 120 100 Q 90 100 90 180 L 90 290 Q 90 320 100 320 L 140 320 Q 150 320 150 290 L 150 180 Q 150 100 120 100 Z" fill="url(#rocket-${id})"/>
      <path d="M 90 180 Q 90 100 120 60 Q 150 100 150 180 Z" fill="url(#tip-${id})"/>
      <path d="M 90 250 L 70 290 L 90 290 Z" fill="#C92A2A"/>
      <path d="M 150 250 L 170 290 L 150 290 Z" fill="#C92A2A"/>
      <circle cx="120" cy="200" r="22" fill="#0E2A4D" stroke="#FFFFFF" stroke-width="4"/>
      <circle cx="120" cy="200" r="18" fill="#5DADE2"/>
      <ellipse cx="120" cy="200" rx="14" ry="16" fill="#8DCFF2"/>
      <ellipse cx="114" cy="200" rx="3" ry="5" fill="#000"/>
      <ellipse cx="126" cy="200" rx="3" ry="5" fill="#000"/>
      <rect x="90" y="240" width="60" height="8" fill="#C92A2A"/>
      <rect x="90" y="260" width="60" height="4" fill="#0E2A4D" opacity="0.5"/>
      <text x="120" y="285" text-anchor="middle" font-family="'Arial Black', sans-serif" font-weight="900" font-size="14" fill="#0E2A4D" letter-spacing="1.5">$KAV</text>
    </svg>`
  }

  // Export to global namespace
  global.KAV = global.KAV || {}
  global.KAV.buildKavCharacter = buildKavCharacter
  global.KAV.buildKavRocket = buildKavRocket
  global.KAV.EXPRESSIONS = EXPRESSIONS
  global.KAV.POSES = POSES
  global.KAV.OUTFITS = OUTFITS
  global.KAV.OUTFIT_INFO = OUTFIT_INFO
})(window)
