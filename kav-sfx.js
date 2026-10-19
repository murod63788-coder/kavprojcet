/* ============================================================
 *  KAV SFX + Music — Web Audio API synthesized audio engine
 *  100% self-contained, no audio files needed.
 *  Provides:
 *    - 9 SFX effects (catch, hit, levelup, etc)
 *    - Background music (lofi cosmic loop, procedural)
 *    - Master volume + mute toggle
 * ============================================================ */

(function (global) {
  'use strict'

  class KavSfx {
    constructor() {
      this.ctx = null
      this.master = null
      this.musicGain = null
      this.muted = false
      this.musicPlaying = false
      this.musicScheduler = null
      this.musicStep = 0
      this.musicEnabled = true
    }

    ensureCtx() {
      if (typeof window === 'undefined') return null
      if (!this.ctx) {
        try {
          const AudioCtx = window.AudioContext || window.webkitAudioContext
          if (!AudioCtx) return null
          this.ctx = new AudioCtx()
          this.master = this.ctx.createGain()
          this.master.gain.value = this.muted ? 0 : 0.18
          this.master.connect(this.ctx.destination)
          this.musicGain = this.ctx.createGain()
          this.musicGain.gain.value = 0.06
          this.musicGain.connect(this.master)
        } catch (e) {
          return null
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(function () {})
      }
      return this.ctx
    }

    unlock() { this.ensureCtx() }
    isMuted() { return this.muted }
    setMuted(m) {
      this.muted = m
      if (this.master) this.master.gain.value = m ? 0 : 0.18
    }
    toggleMute() { this.setMuted(!this.muted); return this.muted }

    play(name) {
      const ctx = this.ensureCtx()
      if (!ctx || !this.master || this.muted) return
      switch (name) {
        case 'catch': this.catchSound(ctx); break
        case 'catchHigh': this.catchHighSound(ctx); break
        case 'hit': this.hitSound(ctx); break
        case 'levelUp': this.levelUpSound(ctx); break
        case 'powerUp': this.powerUpSound(ctx); break
        case 'achievement': this.achievementSound(ctx); break
        case 'gameOver': this.gameOverSound(ctx); break
        case 'combo': this.comboSound(ctx); break
        case 'menu': this.menuSound(ctx); break
        case 'wave': this.waveSound(ctx); break
        case 'bomb': this.bombSound(ctx); break
        case 'shoot': this.shootSound(ctx); break
        case 'rapid': this.rapidSound(ctx); break
        case 'enemyHit': this.enemyHitSound(ctx); break
        case 'enemyDown': this.enemyDownSound(ctx); break
      }
    }

    /* === SFX === */
    catchSound(ctx) {
      const t = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(660, t)
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.08)
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.5, t + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18)
      osc.connect(gain); gain.connect(this.master)
      osc.start(t); osc.stop(t + 0.2)
    }

    catchHighSound(ctx) {
      const t = ctx.currentTime
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        const freq = 880 + i * 220
        osc.frequency.setValueAtTime(freq, t + i * 0.04)
        gain.gain.setValueAtTime(0.0001, t + i * 0.04)
        gain.gain.exponentialRampToValueAtTime(0.35, t + i * 0.04 + 0.005)
        gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.04 + 0.2)
        osc.connect(gain); gain.connect(this.master)
        osc.start(t + i * 0.04); osc.stop(t + i * 0.04 + 0.22)
      }
    }

    hitSound(ctx) {
      const t = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(220, t)
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.18)
      gain.gain.setValueAtTime(0.6, t)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25)
      osc.connect(gain); gain.connect(this.master)
      osc.start(t); osc.stop(t + 0.3)

      const bufferSize = ctx.sampleRate * 0.15
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
      const noise = ctx.createBufferSource()
      noise.buffer = buffer
      const noiseGain = ctx.createGain()
      noiseGain.gain.value = 0.3
      noise.connect(noiseGain); noiseGain.connect(this.master)
      noise.start(t)
    }

    levelUpSound(ctx) {
      const notes = [523.25, 659.25, 783.99, 1046.5]
      const t = ctx.currentTime
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'square'
        osc.frequency.setValueAtTime(freq, t + i * 0.08)
        gain.gain.setValueAtTime(0.0001, t + i * 0.08)
        gain.gain.exponentialRampToValueAtTime(0.3, t + i * 0.08 + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.08 + 0.18)
        osc.connect(gain); gain.connect(this.master)
        osc.start(t + i * 0.08); osc.stop(t + i * 0.08 + 0.2)
      })
    }

    powerUpSound(ctx) {
      const t = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, t)
      osc.frequency.exponentialRampToValueAtTime(1760, t + 0.35)
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.4, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4)
      osc.connect(gain); gain.connect(this.master)
      osc.start(t); osc.stop(t + 0.45)
      for (let i = 1; i <= 3; i++) {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.type = 'triangle'
        o.frequency.setValueAtTime(880 * i, t + 0.15 + i * 0.04)
        g.gain.setValueAtTime(0.0001, t + 0.15 + i * 0.04)
        g.gain.exponentialRampToValueAtTime(0.15, t + 0.15 + i * 0.04 + 0.01)
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15 + i * 0.04 + 0.15)
        o.connect(g); g.connect(this.master)
        o.start(t + 0.15 + i * 0.04); o.stop(t + 0.15 + i * 0.04 + 0.18)
      }
    }

    achievementSound(ctx) {
      const notes = [659.25, 783.99, 1046.5, 1318.51]
      const t = ctx.currentTime
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'square'
        osc.frequency.setValueAtTime(freq, t + i * 0.12)
        gain.gain.setValueAtTime(0.0001, t + i * 0.12)
        gain.gain.exponentialRampToValueAtTime(0.32, t + i * 0.12 + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.12 + 0.3)
        osc.connect(gain); gain.connect(this.master)
        osc.start(t + i * 0.12); osc.stop(t + i * 0.12 + 0.32)
      })
    }

    gameOverSound(ctx) {
      const notes = [523.25, 440, 349.23, 261.63]
      const t = ctx.currentTime
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(freq, t + i * 0.18)
        gain.gain.setValueAtTime(0.0001, t + i * 0.18)
        gain.gain.exponentialRampToValueAtTime(0.3, t + i * 0.18 + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.18 + 0.4)
        osc.connect(gain); gain.connect(this.master)
        osc.start(t + i * 0.18); osc.stop(t + i * 0.18 + 0.42)
      })
    }

    comboSound(ctx) {
      const t = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(880, t)
      osc.frequency.exponentialRampToValueAtTime(1320, t + 0.08)
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.005)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1)
      osc.connect(gain); gain.connect(this.master)
      osc.start(t); osc.stop(t + 0.12)
    }

    menuSound(ctx) {
      const t = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, t)
      osc.frequency.exponentialRampToValueAtTime(660, t + 0.05)
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.15, t + 0.005)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08)
      osc.connect(gain); gain.connect(this.master)
      osc.start(t); osc.stop(t + 0.1)
    }

    waveSound(ctx) {
      // Galaxy wave announce — big chord with shimmer
      const t = ctx.currentTime
      const chord = [261.63, 329.63, 392.0, 523.25]
      chord.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, t)
        gain.gain.setValueAtTime(0.0001, t)
        gain.gain.exponentialRampToValueAtTime(0.18, t + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.5)
        osc.connect(gain); gain.connect(this.master)
        osc.start(t); osc.stop(t + 1.6)
      })
      // Shimmer on top
      for (let i = 0; i < 4; i++) {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.type = 'triangle'
        o.frequency.setValueAtTime(1046.5 + i * 100, t + i * 0.1)
        g.gain.setValueAtTime(0.0001, t + i * 0.1)
        g.gain.exponentialRampToValueAtTime(0.1, t + i * 0.1 + 0.01)
        g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.1 + 0.6)
        o.connect(g); g.connect(this.master)
        o.start(t + i * 0.1); o.stop(t + i * 0.1 + 0.65)
      }
    }

    bombSound(ctx) {
      // Big explosion
      const t = ctx.currentTime
      const bufferSize = ctx.sampleRate * 0.5
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2)
      }
      const noise = ctx.createBufferSource()
      noise.buffer = buffer
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(2000, t)
      filter.frequency.exponentialRampToValueAtTime(100, t + 0.4)
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.5, t)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5)
      noise.connect(filter); filter.connect(gain); gain.connect(this.master)
      noise.start(t)

      // Low boom
      const osc = ctx.createOscillator()
      const oscGain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(80, t)
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.3)
      oscGain.gain.setValueAtTime(0.6, t)
      oscGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4)
      osc.connect(oscGain); oscGain.connect(this.master)
      osc.start(t); osc.stop(t + 0.45)
    }

    /* === Shooter SFX === */
    shootSound(ctx) {
      // Laser pew — short ascending sweep
      const t = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(880, t)
      osc.frequency.exponentialRampToValueAtTime(1760, t + 0.06)
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.08, t + 0.005)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08)
      osc.connect(gain); gain.connect(this.master)
      osc.start(t); osc.stop(t + 0.1)
    }

    rapidSound(ctx) {
      // Faster, higher pitched pew
      const t = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(1320, t)
      osc.frequency.exponentialRampToValueAtTime(2640, t + 0.04)
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.06, t + 0.003)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06)
      osc.connect(gain); gain.connect(this.master)
      osc.start(t); osc.stop(t + 0.08)
    }

    enemyHitSound(ctx) {
      // Quick metallic ping — bullet impact
      const t = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(440, t)
      osc.frequency.exponentialRampToValueAtTime(220, t + 0.05)
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.12, t + 0.005)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08)
      osc.connect(gain); gain.connect(this.master)
      osc.start(t); osc.stop(t + 0.1)
    }

    enemyDownSound(ctx) {
      // Enemy destroyed — descending tone with noise
      const t = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(660, t)
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.2)
      gain.gain.setValueAtTime(0.2, t)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25)
      osc.connect(gain); gain.connect(this.master)
      osc.start(t); osc.stop(t + 0.3)

      // Noise burst
      const bufferSize = ctx.sampleRate * 0.1
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) * 0.5
      const noise = ctx.createBufferSource()
      noise.buffer = buffer
      const noiseGain = ctx.createGain()
      noiseGain.gain.value = 0.15
      noise.connect(noiseGain); noiseGain.connect(this.master)
      noise.start(t)
    }

    /* === Background music — procedural lofi cosmic loop === */
    startMusic() {
      const ctx = this.ensureCtx()
      if (!ctx || this.musicPlaying || !this.musicEnabled) return
      this.musicPlaying = true
      this.musicStep = 0
      this.scheduleMusicStep()
    }

    stopMusic() {
      this.musicPlaying = false
      if (this.musicScheduler) {
        clearTimeout(this.musicScheduler)
        this.musicScheduler = null
      }
    }

    setMusicEnabled(enabled) {
      this.musicEnabled = enabled
      if (!enabled) this.stopMusic()
    }

    scheduleMusicStep() {
      if (!this.musicPlaying || !this.ctx) return
      const ctx = this.ctx
      const t = ctx.currentTime + 0.05
      const step = this.musicStep % 16

      // Pentatonic-ish progression in A minor pentatonic
      const bassNotes = [110, 130.81, 146.83, 110, 98, 110, 130.81, 110] // bass line
      const melodyNotes = [440, 523.25, 587.33, 523.25, 392, 440, 523.25, 440] // melody
      const padFreqs = [[220, 277.18], [261.63, 329.63], [293.66, 369.99], [220, 277.18]] // pads per 4-bar

      // Bass note on beats 0, 4, 8, 12
      if (step % 4 === 0) {
        const bassIdx = Math.floor(step / 4) % bassNotes.length
        this.playMusicNote(ctx, t, bassNotes[bassIdx], 0.4, 0.6, 'sine')
      }

      // Melody note on every other beat
      if (step % 2 === 0) {
        const melIdx = Math.floor(step / 2) % melodyNotes.length
        this.playMusicNote(ctx, t, melodyNotes[melIdx], 0.25, 0.3, 'triangle', 0.05)
      }

      // Pad chord on beats 0, 8
      if (step === 0 || step === 8) {
        const padIdx = Math.floor(step / 8) % padFreqs.length
        padFreqs[padIdx].forEach(freq => {
          this.playMusicNote(ctx, t, freq, 1.5, 0.15, 'sine', 0)
        })
      }

      // Soft hi-hat on every beat
      if (step % 2 === 1) {
        const bufferSize = ctx.sampleRate * 0.05
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
        const data = buffer.getChannelData(0)
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) * 0.5
        const noise = ctx.createBufferSource()
        noise.buffer = buffer
        const filter = ctx.createBiquadFilter()
        filter.type = 'highpass'
        filter.frequency.value = 5000
        const gain = ctx.createGain()
        gain.gain.value = 0.08
        noise.connect(filter); filter.connect(gain); gain.connect(this.musicGain)
        noise.start(t)
      }

      this.musicStep++
      this.musicScheduler = setTimeout(() => this.scheduleMusicStep(), 250)
    }

    playMusicNote(ctx, t, freq, dur, vol, type, delay) {
      delay = delay || 0
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, t + delay)
      gain.gain.setValueAtTime(0.0001, t + delay)
      gain.gain.exponentialRampToValueAtTime(vol, t + delay + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + dur)
      osc.connect(gain); gain.connect(this.musicGain)
      osc.start(t + delay); osc.stop(t + delay + dur + 0.1)
    }
  }

  // Singleton
  let _instance = null
  function getSfx() {
    if (!_instance) _instance = new KavSfx()
    return _instance
  }

  global.KAV = global.KAV || {}
  global.KAV.KavSfx = KavSfx
  global.KAV.getSfx = getSfx
})(window)
