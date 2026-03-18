class NotificationSoundManager {
  constructor() {
    this.enabled = localStorage.getItem('notificationSound') !== 'false';
    this.audioContext = null;
    this.sounds = {
      message: null,
      call: null,
      callEnd: null,
      notification: null,
      voice: null
    };
    this.initialized = false;
  }

  // Initialize audio context (must be called after user interaction)
  initAudio() {
    if (this.audioContext || !this.enabled) return;

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
      console.log('✅ Audio context initialized');
    } catch (error) {
      console.log('❌ Audio not available:', error);
    }
  }

  // Play a beep sound
  playBeep(type = 'notification') {
    if (!this.enabled || !this.audioContext) {
      this.initAudio();
      return;
    }

    try {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Different sounds for different types
      switch(type) {
        case 'message':
          oscillator.frequency.value = 800;
          gainNode.gain.value = 0.1;
          oscillator.start();
          oscillator.stop(this.audioContext.currentTime + 0.15);
          break;

        case 'call':
          // Two-tone ring
          oscillator.frequency.value = 600;
          gainNode.gain.value = 0.15;
          oscillator.start();
          oscillator.stop(this.audioContext.currentTime + 0.3);
          
          // Second tone after a short delay
          setTimeout(() => {
            if (this.enabled && this.audioContext) {
              const osc2 = this.audioContext.createOscillator();
              const gain2 = this.audioContext.createGain();
              osc2.connect(gain2);
              gain2.connect(this.audioContext.destination);
              osc2.frequency.value = 800;
              gain2.gain.value = 0.15;
              osc2.start();
              osc2.stop(this.audioContext.currentTime + 0.3);
            }
          }, 400);
          break;

        case 'callEnd':
          oscillator.frequency.value = 400;
          gainNode.gain.value = 0.1;
          oscillator.start();
          oscillator.stop(this.audioContext.currentTime + 0.1);
          break;

        case 'voice':
          oscillator.frequency.value = 700;
          gainNode.gain.value = 0.1;
          oscillator.start();
          oscillator.stop(this.audioContext.currentTime + 0.2);
          break;

        case 'notification':
        default:
          oscillator.frequency.value = 500;
          gainNode.gain.value = 0.08;
          oscillator.start();
          oscillator.stop(this.audioContext.currentTime + 0.1);
      }
    } catch (error) {
      console.log('🔇 Error playing sound:', error);
    }
  }

  // Play message sound
  playMessage() {
    this.playBeep('message');
  }

  // Play call sound
  playCall() {
    this.playBeep('call');
  }

  // Play call end sound
  playCallEnd() {
    this.playBeep('callEnd');
  }

  // Play voice note sound
  playVoiceNote() {
    this.playBeep('voice');
  }

  // Play notification sound
  playNotification() {
    this.playBeep('notification');
  }

  // Toggle sound on/off
  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('notificationSound', this.enabled.toString());
    
    if (this.enabled && !this.audioContext) {
      this.initAudio();
    }
    
    return this.enabled;
  }

  // Enable sound
  enable() {
    this.enabled = true;
    localStorage.setItem('notificationSound', 'true');
    this.initAudio();
  }

  // Disable sound
  disable() {
    this.enabled = false;
    localStorage.setItem('notificationSound', 'false');
  }

  // Preload sounds (if using actual audio files)
  async preloadSounds() {
    // This is for future implementation if you want to use actual audio files
    // For now, we use Web Audio API which doesn't need preloading
    return Promise.resolve();
  }

  // Check if browser supports audio
  isAudioSupported() {
    return !!(window.AudioContext || window.webkitAudioContext);
  }

  // Get sound status
  getStatus() {
    return {
      enabled: this.enabled,
      supported: this.isAudioSupported(),
      initialized: this.initialized,
      contextState: this.audioContext?.state || 'uninitialized'
    };
  }
}

// Create singleton instance
const NotificationSounds = new NotificationSoundManager();

export default NotificationSounds;