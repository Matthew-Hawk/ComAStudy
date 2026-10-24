// A short local oscillator; no audio files, network calls, or autoplay.
export function completionSound() {
  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.025, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.1);
    oscillator.frequency.value = 660;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.1);
    oscillator.onended = () => {
      void context.close();
    };
  } catch {
    /* Sound is optional; unavailable audio never blocks learning. */
  }
}
