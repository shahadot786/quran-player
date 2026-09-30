let audio: HTMLAudioElement | null = null;

export function getAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!audio) {
    audio = new Audio();
    audio.preload = "metadata";
  }
  return audio;
}
