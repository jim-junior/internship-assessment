import { Loader2, CheckCircle2, AudioLines, Pause, Play } from "lucide-react";
import { useRef, useState } from "react";
import { PipelineStep } from "./constants";
import { formatTime } from "./utils";

export function StepIndicator({ steps }: { steps: PipelineStep[] }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-semibold tracking-widest uppercase border transition-all duration-300 ${
              step.status === "done"
                ? "bg-amber-400 border-amber-400 text-black"
                : step.status === "loading"
                  ? "bg-black border-black text-white"
                  : step.status === "error"
                    ? "bg-red-600 border-red-600 text-white"
                    : "bg-transparent border-stone-300 text-stone-400"
            }`}
          >
            {step.status === "loading" ? (
              <Loader2 size={10} className="animate-spin" />
            ) : step.status === "done" ? (
              <CheckCircle2 size={10} />
            ) : (
              <span className="w-2.5 h-2.5 rounded-full border border-current inline-block" />
            )}
            {step.label}
          </div>
          {i < steps.length - 1 && (
            <div
              className={`h-px w-6 transition-all duration-300 ${
                step.status === "done" ? "bg-amber-400" : "bg-stone-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function ResultBlock({
  icon: Icon,
  label,
  tag,
  content,
  mono = false,
}: {
  icon: React.ElementType;
  label: string;
  tag: string;
  content: string;
  mono?: boolean;
}) {
  return (
    <div className="border border-stone-200 bg-white group hover:border-stone-400 transition-colors duration-200">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-200 bg-stone-50">
        <div className="flex items-center gap-2">
          <Icon size={13} className="text-amber-500" />
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-stone-500">
            {label}
          </span>
        </div>
        <span className="text-[10px] font-mono text-stone-300 uppercase tracking-widest">
          {tag}
        </span>
      </div>
      <p
        className={`px-4 py-4 text-sm leading-relaxed text-stone-700 ${mono ? "font-mono" : "font-serif"}`}
      >
        {content}
      </p>
    </div>
  );
}

export function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0–100
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Keep progress bar in sync with audio playback
  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    setCurrentTime(audio.currentTime);
    setProgress((audio.currentTime / audio.duration) * 100);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  // Seek: click anywhere on the track bar
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const track = trackRef.current;
    if (!audio || !track || !audio.duration) return;
    const rect = track.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    audio.currentTime = ratio * audio.duration;
  };

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().catch(() => {});
      setPlaying(true);
    }
  };

  return (
    <div className="border border-stone-200 bg-white hover:border-stone-400 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-200 bg-stone-50">
        <div className="flex items-center gap-2">
          <AudioLines size={13} className="text-amber-500" />
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-stone-500">
            Generated Audio
          </span>
        </div>
        <span className="text-[10px] font-mono text-stone-300 uppercase tracking-widest">
          TTS · Sunbird
        </span>
      </div>

      {/* Player body */}
      <div className="px-4 py-4 flex items-center gap-4">
        {/* Play / Pause */}
        <button
          onClick={toggle}
          className="w-9 h-9 bg-black text-white flex items-center justify-center hover:bg-amber-500 transition-colors duration-150 flex-shrink-0"
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>

        {/* Track + timestamps */}
        <div className="flex-1 min-w-0">
          {/* Clickable progress track */}
          <div
            ref={trackRef}
            onClick={handleSeek}
            className="relative h-1 bg-stone-200 w-full cursor-pointer group/track"
          >
            {/* Filled portion */}
            <div
              className="absolute inset-y-0 left-0 bg-amber-400 transition-none"
              style={{ width: `${progress}%` }}
            />
            {/* Scrubber thumb — square to match the design */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-black border border-black opacity-0 group-hover/track:opacity-100 transition-opacity duration-100"
              style={{ left: `${progress}%` }}
            />
          </div>

          {/* Timestamps */}
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] font-mono text-stone-400">
              {formatTime(currentTime)}
            </span>
            <span className="text-[10px] font-mono text-stone-300">
              {duration > 0 ? formatTime(duration) : "--:--"}
            </span>
          </div>
        </div>

        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          src={src}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => {
            setPlaying(false);
            setProgress(100);
          }}
          className="hidden"
        />
      </div>
    </div>
  );
}
