/**
 * Thread-level playback coordinator.
 * Ensures that inside a chat thread, only ONE audio playback source is active at a time.
 * When a new audio source starts, any other playing audio is automatically paused.
 */

type AudioPlayListener = (playingId: string) => void;

class ThreadAudioCoordinator {
  private activeId: string | null = null;
  private listeners = new Set<AudioPlayListener>();

  public setActive(id: string) {
    this.activeId = id;
    this.listeners.forEach((listener) => {
      try {
        listener(id);
      } catch {
        // Safe listener dispatch
      }
    });
  }

  public clearActive(id?: string) {
    if (!id || this.activeId === id) {
      this.activeId = null;
    }
  }

  public subscribe(listener: AudioPlayListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const threadAudioCoordinator = new ThreadAudioCoordinator();
