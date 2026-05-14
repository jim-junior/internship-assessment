"use client";

import { useState, useRef } from "react";
import {
  Mic,
  FileText,
  Upload,
  Loader2,
  ChevronRight,
  Languages,
  AlignLeft,
  AudioLines,
  X,
} from "lucide-react";
import {
  InputMode,
  LANGUAGES,
  PipelineResult,
  PipelineStep,
  StepStatus,
  STEP_DEFINITIONS,
} from "./constants";
import { StepIndicator, ResultBlock, AudioPlayer } from "./components";
import {
  transcribeAudio,
  summariseText,
  translateText,
  synthesiseSpeech,
} from "./utils";

export default function Home() {
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [textInput, setTextInput] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateStep = (
    id: string,
    status: StepStatus,
    setter: React.Dispatch<React.SetStateAction<PipelineStep[]>>,
  ) => {
    setter((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  };

  const runPipeline = async () => {
    if (inputMode === "text" && !textInput.trim()) return;
    if (inputMode === "audio" && !audioFile) return;

    setRunning(true);
    setError(null);
    setResult(null);

    const isAudio = inputMode === "audio";
    const initialSteps = STEP_DEFINITIONS(isAudio);
    setSteps(initialSteps);

    const newResult: PipelineResult = {};

    try {
      let workingText = textInput;

      if (isAudio && audioFile) {
        setSteps((prev) =>
          prev.map((s) =>
            s.id === "transcribe" ? { ...s, status: "loading" } : s,
          ),
        );
        workingText = await transcribeAudio(audioFile);
        newResult.transcription = workingText;
        setSteps((prev) =>
          prev.map((s) =>
            s.id === "transcribe" ? { ...s, status: "done" } : s,
          ),
        );
        setResult({ ...newResult });
      }

      setSteps((prev) =>
        prev.map((s) =>
          s.id === "summarise" ? { ...s, status: "loading" } : s,
        ),
      );
      const summary = await summariseText(workingText);
      newResult.summary = summary;
      setSteps((prev) =>
        prev.map((s) => (s.id === "summarise" ? { ...s, status: "done" } : s)),
      );
      setResult({ ...newResult });

      setSteps((prev) =>
        prev.map((s) =>
          s.id === "translate" ? { ...s, status: "loading" } : s,
        ),
      );
      const translation = await translateText(summary, language);
      newResult.translation = translation;
      setSteps((prev) =>
        prev.map((s) => (s.id === "translate" ? { ...s, status: "done" } : s)),
      );
      setResult({ ...newResult });

      setSteps((prev) =>
        prev.map((s) =>
          s.id === "synthesise" ? { ...s, status: "loading" } : s,
        ),
      );
      const audioUrl = await synthesiseSpeech(translation, language);
      newResult.audioUrl = audioUrl;
      setSteps((prev) =>
        prev.map((s) => (s.id === "synthesise" ? { ...s, status: "done" } : s)),
      );
      setResult({ ...newResult });
    } catch (err: any) {
      setError(err.message);
      setSteps((prev) =>
        prev.map((s) =>
          s.status === "loading" ? { ...s, status: "error" } : s,
        ),
      );
    } finally {
      setRunning(false);
    }
  };

  const reset = () => {
    setResult(null);
    setSteps([]);
    setError(null);
    setTextInput("");
    setAudioFile(null);
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-black flex items-center justify-center">
              <div className="w-3.5 h-3.5 bg-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold tracking-tight text-black uppercase">
                  Sunbird AI
                </span>
                <span className="text-stone-300">·</span>
                <span className="font-mono text-xs text-stone-400 uppercase tracking-widest">
                  Internship Assessment · 2026
                </span>
              </div>
              <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest mt-0.5">
                Speech · Language · Synthesis
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-stone-400 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 bg-green-400 inline-block" />
            <span>Built by Beingana Jim Junior</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6">
        {/* Title block */}
        <div className="mb-6 border-l-4 border-amber-400 pl-5">
          <h1 className="text-2xl font-serif font-bold text-black tracking-tight leading-tight">
            Text & Audio Intelligence Pipeline
          </h1>
          <p className="text-stone-500 text-sm mt-2 leading-relaxed max-w-xl">
            Transcribe, summarise, translate into Ugandan languages, and
            generate speech powered by the Sunflower LLM and Sunbird speech
            APIs.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Input Panel */}
          <div className="lg:col-span-2 space-y-4">
            {/* Mode toggle + Language — same row */}
            <div className="flex gap-3">
              {/* Mode toggle */}
              <div className="flex-1">
                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400 mb-2">
                  Input Mode
                </label>
                <div className="flex border border-stone-200 bg-white h-9">
                  {(["text", "audio"] as InputMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setInputMode(mode);
                        reset();
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-widest transition-colors duration-150 ${
                        inputMode === mode
                          ? "bg-black text-white"
                          : "text-stone-500 hover:bg-stone-50"
                      }`}
                    >
                      {mode === "text" ? (
                        <FileText size={11} />
                      ) : (
                        <Mic size={11} />
                      )}
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language select */}
              <div className="flex-1">
                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400 mb-2">
                  Select Target Language
                </label>
                <div className="relative h-9">
                  <Languages
                    size={11}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none z-10"
                  />
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full h-full appearance-none border border-stone-200 bg-white pl-8 pr-8 text-xs font-mono font-semibold text-stone-700 uppercase tracking-widest focus:outline-none focus:border-black transition-colors duration-150 cursor-pointer"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                  <ChevronRight
                    size={10}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none rotate-90"
                  />
                </div>
              </div>
            </div>

            {/* Text input */}
            {inputMode === "text" && (
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400 mb-2">
                  Input Text
                </label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste or type your text here…"
                  rows={6}
                  className="w-full border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 placeholder-stone-300 font-serif leading-relaxed resize-none focus:outline-none focus:border-black transition-colors duration-150"
                />
              </div>
            )}

            {/* Audio input */}
            {inputMode === "audio" && (
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400 mb-2">
                  Audio File
                </label>
                {!audioFile ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-stone-200 bg-white hover:border-amber-400 hover:bg-amber-50 transition-colors duration-200 flex flex-col items-center justify-center py-10 gap-3"
                  >
                    <Upload size={20} className="text-stone-300" />
                    <span className="text-xs font-mono text-stone-400 uppercase tracking-widest">
                      Click to upload audio
                    </span>
                    <span className="text-[10px] font-mono text-stone-300 uppercase">
                      .mp3 · .wav · .m4a · .ogg
                    </span>
                  </button>
                ) : (
                  <div className="border border-stone-200 bg-white px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AudioLines size={14} className="text-amber-500" />
                      <div>
                        <p className="text-xs font-mono font-semibold text-black truncate max-w-[160px]">
                          {audioFile.name}
                        </p>
                        <p className="text-[10px] font-mono text-stone-400">
                          {(audioFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setAudioFile(null)}
                      className="text-stone-300 hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                />
              </div>
            )}

            {/* Run button */}
            <button
              onClick={runPipeline}
              disabled={
                running ||
                (inputMode === "text" && !textInput.trim()) ||
                (inputMode === "audio" && !audioFile)
              }
              className="w-full bg-black text-white py-3 text-xs font-mono font-bold uppercase tracking-widest hover:bg-amber-500 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {running ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  Submit
                  <ChevronRight size={12} />
                </>
              )}
            </button>

            {result && !running && (
              <button
                onClick={reset}
                className="w-full border border-stone-200 text-stone-500 py-2.5 text-xs font-mono uppercase tracking-widest hover:border-stone-400 hover:text-black transition-colors duration-150"
              >
                Reset
              </button>
            )}
          </div>

          {/* Output Panel */}
          <div className="lg:col-span-3 space-y-5">
            {/* Pipeline progress */}
            {steps.length > 0 && (
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400 mb-3">
                  Pipeline Progress
                </label>
                <StepIndicator steps={steps} />
              </div>
            )}

            {/* Idle state */}
            {!result && steps.length === 0 && (
              <div className="border border-dashed border-stone-200 bg-white flex flex-col items-center justify-center py-20 gap-4 text-center">
                <div className="w-10 h-10 border border-stone-200 flex items-center justify-center">
                  <AudioLines size={18} className="text-stone-300" />
                </div>
                <div>
                  <p className="text-xs font-mono font-bold uppercase tracking-widest text-stone-400">
                    Awaiting Input
                  </p>
                  <p className="text-[11px] font-mono text-stone-300 mt-1">
                    Configure input and run the pipeline
                  </p>
                </div>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-xs font-mono text-red-600 uppercase tracking-widest font-bold">
                  Error
                </p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="space-y-4">
                {/* Original input */}
                <ResultBlock
                  icon={FileText}
                  label="Original Input"
                  tag={
                    inputMode === "audio" ? "Audio · Uploaded" : "Text · Direct"
                  }
                  content={
                    inputMode === "text"
                      ? textInput
                      : result.transcription
                        ? "See transcription below"
                        : "Processing…"
                  }
                />

                {/* Transcription (audio mode only) */}
                {result.transcription && (
                  <ResultBlock
                    icon={Mic}
                    label="Transcription"
                    tag="ASR · Sunbird"
                    content={result.transcription}
                  />
                )}

                {/* Summary */}
                {result.summary && (
                  <ResultBlock
                    icon={AlignLeft}
                    label="Summary"
                    tag={`LLM · Sunflower`}
                    content={result.summary}
                  />
                )}

                {/* Translation */}
                {result.translation && (
                  <ResultBlock
                    icon={Languages}
                    label={`Translation — ${language}`}
                    tag={`LLM · Sunflower`}
                    content={result.translation}
                  />
                )}

                {/* Audio */}
                {result.audioUrl && <AudioPlayer src={result.audioUrl} />}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 mt-16">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-[10px] font-mono text-stone-300 uppercase tracking-widest">
            Built by Beingana Jim Junior
          </span>
          <span className="text-[10px] font-mono text-stone-300 uppercase tracking-widest">
            Internship Assessment · 2026
          </span>
        </div>
      </footer>
    </div>
  );
}
