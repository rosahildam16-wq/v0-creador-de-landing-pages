// Web Audio API sound generators - no external files needed

let audioCtx: AudioContext | null = null

function getCtx() {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

// Resume audio context (must be called from user interaction)
export function resumeAudio() {
  try {
    const ctx = getCtx()
    if (ctx.state === "suspended") {
      ctx.resume()
    }
    // Mobile double-unlock: play a silent buffer
    const buffer = ctx.createBuffer(1, 1, 22050)
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    source.start(0)
  } catch (e) {
    console.error("Audio unlock error", e)
  }
}

// Simple beep tone
function playTone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.15) {
  try {
    const ctx = getCtx()
    if (ctx.state === "suspended") {
      ctx.resume()
    }
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.value = volume
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch {
    // Silently fail if audio context is not available
  }
}

// === RINGTONE (iPhone-style repeating tri-tone) ===
let ringtoneInterval: ReturnType<typeof setInterval> | null = null

export function startRingtone() {
  resumeAudio()

  // iPhone "Opening" style synthesized marimba
  const playPattern = () => {
    const ctx = getCtx()
    const now = ctx.currentTime

    // Sequence of notes (Approximate Opening theme)
    const notes = [
      { f: 659.25, t: 0 },    // E5
      { f: 880.00, t: 0.15 }, // A5
      { f: 987.77, t: 0.30 }, // B5
      { f: 1318.51, t: 0.45 }, // E6
      { f: 987.77, t: 0.70 }, // B5
      { f: 1318.51, t: 0.85 }  // E6
    ]

    notes.forEach(n => {
      setTimeout(() => {
        // Dual oscillator for marimba effect
        playTone(n.f, 0.4, "sine", 0.1)
        playTone(n.f * 2, 0.2, "sine", 0.03)
      }, n.t * 1000)
    })
  }

  playPattern()
  ringtoneInterval = setInterval(playPattern, 2500)
}

export function stopRingtone() {
  if (ringtoneInterval) {
    clearInterval(ringtoneInterval)
    ringtoneInterval = null
  }
}

// === CALL CONNECTED SOUND ===
export function playCallConnected() {
  resumeAudio()
  playTone(800, 0.1, "sine", 0.1)
  setTimeout(() => playTone(1000, 0.15, "sine", 0.1), 120)
}

// === CALL END SOUND ===
export function playCallEnd() {
  resumeAudio()
  playTone(500, 0.3, "sine", 0.1)
  setTimeout(() => playTone(350, 0.4, "sine", 0.1), 200)
}

// === QUIZ: option click ===
export function playQuizClick() {
  resumeAudio()
  playTone(600, 0.08, "triangle", 0.08)
}

// === QUIZ: result reveal ===
export function playQuizResult() {
  resumeAudio()
  playTone(400, 0.2, "sine", 0.08)
  setTimeout(() => playTone(500, 0.2, "sine", 0.08), 150)
  setTimeout(() => playTone(650, 0.3, "sine", 0.08), 300)
}

// === TERMINAL: keystroke ===
export function playTerminalKey() {
  resumeAudio()
  const freq = 200 + Math.random() * 100
  playTone(freq, 0.04, "square", 0.04)
}

// === TERMINAL: access granted ===
export function playAccessGranted() {
  resumeAudio()
  playTone(523, 0.15, "sine", 0.1)
  setTimeout(() => playTone(659, 0.15, "sine", 0.1), 150)
  setTimeout(() => playTone(784, 0.25, "sine", 0.1), 300)
}

// === WHATSAPP: message received ===
export function playMessageReceived() {
  resumeAudio()
  playTone(900, 0.08, "sine", 0.1)
  setTimeout(() => playTone(1100, 0.1, "sine", 0.1), 80)
}

// === WHATSAPP: typing sound (subtle click) ===
export function playTypingSound() {
  resumeAudio()
  const freq = 150 + Math.random() * 50
  playTone(freq, 0.05, "sine", 0.02)
}

// === GENERAL: restricted access alert ===
export function playRestrictedAlert() {
  resumeAudio()
  playTone(200, 0.2, "square", 0.05)
  setTimeout(() => playTone(150, 0.3, "square", 0.05), 200)
}

// === WHATSAPP: voice note (synthesized speech-like sound ~4 seconds) ===
export function generateVoiceNoteBuffer(): Promise<AudioBuffer | null> {
  try {
    const ctx = getCtx()
    const sampleRate = ctx.sampleRate
    const duration = 4.5
    const length = Math.floor(sampleRate * duration)
    const buffer = ctx.createBuffer(1, length, sampleRate)
    const data = buffer.getChannelData(0)

    // Create a speech-like waveform with varying amplitude and frequency
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate
      // Varying fundamental frequency to simulate speech cadence
      const f0 = 140 + 30 * Math.sin(t * 2.5) + 20 * Math.sin(t * 0.7)
      // Formant frequencies
      const f1 = 500 + 200 * Math.sin(t * 3.2)
      const f2 = 1500 + 400 * Math.sin(t * 1.8)
      // Amplitude envelope with pauses (like speech)
      const speechEnv =
        (0.5 + 0.5 * Math.sin(t * 4.0)) *
        (0.4 + 0.6 * Math.abs(Math.sin(t * 1.5))) *
        (t < 0.1 ? t / 0.1 : 1) *
        (t > duration - 0.3 ? (duration - t) / 0.3 : 1)
      // Mix harmonics
      const sample =
        0.3 * Math.sin(2 * Math.PI * f0 * t) +
        0.2 * Math.sin(2 * Math.PI * f1 * t) +
        0.1 * Math.sin(2 * Math.PI * f2 * t) +
        0.05 * (Math.random() * 2 - 1) // slight noise for breathiness
      data[i] = sample * speechEnv * 0.15
    }
    return Promise.resolve(buffer)
  } catch {
    return Promise.resolve(null)
  }
}

export function playVoiceNote(onEnded?: () => void): { stop: () => void } | null {
  resumeAudio()
  try {
    const ctx = getCtx()
    let source: AudioBufferSourceNode | null = null

    generateVoiceNoteBuffer().then((buffer) => {
      if (!buffer) return
      source = ctx.createBufferSource()
      source.buffer = buffer
      const gain = ctx.createGain()
      gain.gain.value = 0.8
      source.connect(gain)
      gain.connect(ctx.destination)
      source.onended = () => {
        onEnded?.()
      }
      source.start()
    })

    return {
      stop: () => {
        try {
          source?.stop()
        } catch {
          // ignore
        }
        onEnded?.()
      },
    }
  } catch {
    return null
  }
}

// === LOGIN: keystroke ===
export function playLoginKey() {
  resumeAudio()
  const freq = 300 + Math.random() * 100
  playTone(freq, 0.03, "triangle", 0.05)
}

// === LOGIN: access verified ===
export function playLoginSuccess() {
  resumeAudio()
  playTone(440, 0.12, "sine", 0.1)
  setTimeout(() => playTone(550, 0.12, "sine", 0.1), 130)
  setTimeout(() => playTone(660, 0.2, "sine", 0.12), 260)
}

// === FEED: swipe sound ===
export function playSwipe() {
  resumeAudio()
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "sine"
    osc.frequency.value = 300
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15)
    gain.gain.value = 0.06
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.15)
  } catch {
    // Silently fail
  }
}

// === GENERAL: ambient low drone (for dramatic moments) ===
let droneOsc: OscillatorNode | null = null
let droneGain: GainNode | null = null

export function startDrone() {
  resumeAudio()
  try {
    const ctx = getCtx()
    droneOsc = ctx.createOscillator()
    droneGain = ctx.createGain()
    droneOsc.type = "sine"
    droneOsc.frequency.value = 60
    droneGain.gain.value = 0.03
    droneOsc.connect(droneGain)
    droneGain.connect(ctx.destination)
    droneOsc.start()
  } catch {
    // Silently fail
  }
}

export function stopDrone() {
  try {
    if (droneGain) {
      droneGain.gain.exponentialRampToValueAtTime(0.001, getCtx().currentTime + 0.5)
    }
    if (droneOsc) {
      droneOsc.stop(getCtx().currentTime + 0.6)
      droneOsc = null
      droneGain = null
    }
  } catch {
    // Silently fail
  }
}
