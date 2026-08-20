const SOUND_CONFIG = {
  ENABLED_KEY: 'typemind-sound-enabled',
  RIGHT_VOLUME: 0.80,
  WRONG_VOLUME: 0.95,
};

class TypingSoundService {
  constructor() {
    this.enabled = true;
    
    // Initialize base audio elements
    this.rightAudio = new Audio('/sounds/rightsound.mp3');
    this.wrongAudio = new Audio('/sounds/wrongsound.mp3');
    
    // Set volumes
    this.rightAudio.volume = SOUND_CONFIG.RIGHT_VOLUME;
    this.wrongAudio.volume = SOUND_CONFIG.WRONG_VOLUME;

    // Load preference from local storage
    this.loadPreference();
  }

  loadPreference() {
    try {
      const stored = localStorage.getItem(SOUND_CONFIG.ENABLED_KEY);
      if (stored !== null) {
        this.enabled = stored === 'true';
      }
    } catch (e) {
      console.warn('Failed to access localStorage for typing sounds');
    }
  }

  toggleEnabled() {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem(SOUND_CONFIG.ENABLED_KEY, this.enabled.toString());
    } catch (e) {
      console.warn('Failed to write to localStorage for typing sounds');
    }
    return this.enabled;
  }

  getIsEnabled() {
    return this.enabled;
  }

  preload() {
    // Force browser to cache the audio data
    this.rightAudio.preload = 'auto';
    this.wrongAudio.preload = 'auto';
  }

  playCorrect() {
    if (!this.enabled) return;
    try {
      // cloneNode(true) creates a lightweight copy that can overlap seamlessly
      const sound = this.rightAudio.cloneNode(true);
      sound.volume = SOUND_CONFIG.RIGHT_VOLUME;
      sound.play().catch(() => {});
    } catch (e) {
      // Fallback
    }
  }

  playWrong() {
    if (!this.enabled) return;
    try {
      const sound = this.wrongAudio.cloneNode(true);
      sound.volume = SOUND_CONFIG.WRONG_VOLUME;
      sound.play().catch(() => {});
    } catch (e) {
      // Fallback
    }
  }
}

// Export as a singleton
const typingSoundService = new TypingSoundService();
export default typingSoundService;
