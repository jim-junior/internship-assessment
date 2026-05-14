import { API_BASE } from "./constants";

export async function apiFetch<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "API request failed");
  }
  return res.json() as Promise<T>;
}

export async function transcribeAudio(file: File): Promise<string> {
  const form = new FormData();
  form.append("audio", file);
  const data = await apiFetch<{ transcription: string }>("/transcribe", {
    method: "POST",
    body: form,
  });
  return data.transcription;
}

export async function summariseText(text: string): Promise<string> {
  const data = await apiFetch<{ summary: string }>("/summarise", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return data.summary;
}

export async function translateText(
  text: string,
  language: string,
): Promise<string> {
  const data = await apiFetch<{ translation: string }>("/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  });
  return data.translation;
}

export async function synthesiseSpeech(
  text: string,
  language: string,
): Promise<string> {
  const data = await apiFetch<{ audio_url: string }>("/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  });
  return data.audio_url;
}

export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
