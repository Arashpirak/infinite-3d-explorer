// Audio Manager - Handles text-to-speech, volume, speed, and background music

class AudioManager {
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private backgroundAudio: HTMLAudioElement | null = null

  constructor() {
    if (typeof window !== "undefined") {
      this.backgroundAudio = new Audio("/music/background-music.mp3")
      this.backgroundAudio.loop = true
      this.backgroundAudio.volume = 0.15 // Default volume
    }
  }

  /**
   * Speaks text with specified volume and speed
   */
  speak(text: string, volume: number, speed: number, onEnd?: () => void): void {
    this.stopSpeech()

    this.currentUtterance = new SpeechSynthesisUtterance(text)
    this.currentUtterance.volume = volume
    this.currentUtterance.rate = speed
    this.currentUtterance.pitch = 1

    if (onEnd) {
      this.currentUtterance.onend = onEnd
    }

    speechSynthesis.speak(this.currentUtterance)
  }

  /**
   * Stops current speech
   */
  stopSpeech(): void {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel()
    }
    this.currentUtterance = null
  }

  /**
   * Starts background music
   */
  startBackgroundMusic(): void {
    if (this.backgroundAudio) {
      // The play() method returns a Promise which can be useful for handling autoplay policies
      this.backgroundAudio.play().catch((error) => {
        console.error("Background music playback failed:", error)
      })
    }
  }

  /**
   * Stops background music
   */
  stopBackgroundMusic(): void {
    if (this.backgroundAudio) {
      this.backgroundAudio.pause()
      this.backgroundAudio.currentTime = 0 // Reset to the beginning
    }
  }

  /**
   * Sets background music volume
   */
  setBackgroundVolume(volume: number): void {
    if (this.backgroundAudio) {
      this.backgroundAudio.volume = Math.max(0, Math.min(1, volume))
    }
  }

  /**
   * Cleanup all audio resources
   */
  cleanup(): void {
    this.stopSpeech()
    this.stopBackgroundMusic()
  }
}

export const audioManager = new AudioManager()
