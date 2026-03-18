import NotificationSounds from './notificationSounds';

class SoundManager {
  constructor() {
    this.enabled = localStorage.getItem('notificationSound') !== 'false';
    this.notificationSounds = NotificationSounds;
    this.notificationSounds.enabled = this.enabled;
  }

  // Initialize audio (call after user interaction)
  initAudio() {
    this.notificationSounds.initAudio();
  }

  // Play message sound
  playMessage() {
    if (this.enabled) {
      this.notificationSounds.playMessage();
    }
  }

  // Play call sound
  playCall() {
    if (this.enabled) {
      this.notificationSounds.playCall();
    }
  }

  // Play call end sound
  playCallEnd() {
    if (this.enabled) {
      this.notificationSounds.playCallEnd();
    }
  }

  // Play voice note sound
  playVoiceNote() {
    if (this.enabled) {
      this.notificationSounds.playVoiceNote();
    }
  }

  // Play generic beep
  playBeep(type = 'notification') {
    if (this.enabled) {
      this.notificationSounds.playBeep(type);
    }
  }

  // Toggle sound
  toggle() {
    this.enabled = this.notificationSounds.toggle();
    return this.enabled;
  }

  // Enable sound
  enable() {
    this.notificationSounds.enable();
    this.enabled = true;
  }

  // Disable sound
  disable() {
    this.notificationSounds.disable();
    this.enabled = false;
  }

  // Get sound status
  getStatus() {
    return this.notificationSounds.getStatus();
  }

  // Check if audio is supported
  isSupported() {
    return this.notificationSounds.isAudioSupported();
  }
}

// Create singleton instance
const soundManager = new SoundManager();

export default soundManager;