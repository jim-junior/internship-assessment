export type InputMode = "text" | "audio";
export type StepStatus = "idle" | "loading" | "done" | "error";

export interface PipelineStep {
  id: string;
  label: string;
  status: StepStatus;
}

export interface PipelineResult {
  transcription?: string;
  summary?: string;
  translation?: string;
  audioUrl?: string;
}

export const LANGUAGES = [
  "Luganda",
  "Runyankole",
  "Ateso",
  "Lugbara",
  "Acholi",
];

export const STEP_DEFINITIONS = (hasAudio: boolean): PipelineStep[] =>
  [
    hasAudio
      ? { id: "transcribe", label: "Transcription", status: "idle" as const }
      : null,
    { id: "summarise", label: "Summary", status: "idle" as const },
    { id: "translate", label: "Translation", status: "idle" as const },
    { id: "synthesise", label: "Speech Synthesis", status: "idle" as const },
  ].filter(Boolean) as PipelineStep[];

export const API_BASE = process.env.NEXT_PUBLIC_API_HOST;
