import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Bookmark, 
  Sparkles, 
  Activity, 
  Clock, 
  FileText,
  Volume2
} from 'lucide-react';
import { useGcs } from '../contexts/GcsContext';
import { REPLAY_EVENT_BOOKMARKS } from '../constants';

export const MissionReplayPage: React.FC = () => {
  const { replayTimeline, activeBookmark, seekReplayTime, isPlaying, playReplay, pauseReplay, playbackSpeed, setPlaybackSpeed } = useGcs();
  const [selectedEventId, setSelectedEventId] = useState<string>('bm-2');

  const speeds = [0.5, 1.0, 2.0, 5.0, 10.0];

  return (
    <div id="mission-replay-controller" className="p-4 space-y-4 max-w-[1920px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-bold text-xl text-slate-100">
              Black-Box Telemetry Replay & AI Narrative Commentary (Innovation #6)
            </h1>
            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono-code font-bold">
              FLIGHT SORTIE #DRDO-2026-08
            </span>
          </div>
          <p className="text-xs font-mono-code text-slate-400 mt-0.5">
            Synchronized frame-by-frame aero piston engine forensic replay with generative tactical incident reconstruction
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs font-mono-code">
          <button
            onClick={() => seekReplayTime(0)}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Reset to T+00:00"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {isPlaying ? (
            <button
              onClick={pauseReplay}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors"
            >
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={playReplay}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-colors"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Play</span>
            </button>
          )}

          {/* Speed Selector */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
            {speeds.map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-1 rounded text-[10px] font-bold ${
                  playbackSpeed === spd
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrubber Timeline Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono-code">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>MISSION TIME: <strong className="text-cyan-300">{replayTimeline.currentTimestamp}</strong> / {replayTimeline.totalDuration}</span>
          </div>
          <span className="text-slate-400">FRAME {replayTimeline.currentFrame} OF {replayTimeline.totalFrames}</span>
        </div>

        {/* Timeline Range Input */}
        <div className="relative pt-2 pb-4">
          <input
            type="range"
            min="0"
            max={replayTimeline.totalFrames}
            value={replayTimeline.currentFrame}
            onChange={(e) => seekReplayTime(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-950 rounded-lg"
          />

          {/* Bookmark Pins on Timeline */}
          <div className="absolute top-6 inset-x-0 flex justify-between px-2 pointer-events-none">
            {REPLAY_EVENT_BOOKMARKS.map((bm) => (
              <div key={bm.id} className="flex flex-col items-center">
                <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-900" />
                <span className="text-[9px] font-mono-code text-slate-400 mt-0.5">{bm.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Narrative Commentary & Incident Telemetry Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 7 Cols: Generative AI Forensic Commentary (Innovation #6) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="font-heading font-bold text-sm text-slate-100">
                  AI Forensic Narrative Commentary
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-mono-code font-bold">
                GENERATIVE RECONSTRUCTION
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/90 border border-indigo-900/40 text-xs leading-relaxed space-y-3 font-mono-code">
              <div className="text-cyan-300 font-bold flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span>ACTIVE TIME INTERVAL ANALYSIS:</span>
              </div>
              <p className="text-slate-200">
                {activeBookmark ? activeBookmark.aiNarrativeSummary : 'Replay engine is synchronized with MALE UAV black-box recording.'}
              </p>
              <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/60 text-[11px] text-indigo-200">
                <strong>DRDO FORENSIC RECOMMENDATION:</strong> All telemetry frames verified against thermodynamic model without sensor dropouts or packet loss.
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono-code text-slate-400">
            <span>EXPORT FORMAT: DEFENCE STANAG-4609 / CSV</span>
            <button className="text-cyan-400 hover:underline">Download Audit Log →</button>
          </div>
        </div>

        {/* Right 5 Cols: Bookmark Incident Navigator */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-amber-400" />
              <h3 className="font-heading font-bold text-sm text-slate-100">
                Incident Bookmarks & Key Events
              </h3>
            </div>
            <span className="text-[10px] font-mono-code text-slate-400">{REPLAY_EVENT_BOOKMARKS.length} EVENTS</span>
          </div>

          <div className="space-y-2">
            {REPLAY_EVENT_BOOKMARKS.map((bm) => (
              <div
                key={bm.id}
                onClick={() => {
                  setSelectedEventId(bm.id);
                  seekReplayTime(bm.frameIndex);
                }}
                className={`p-3 rounded-xl border text-xs font-mono-code cursor-pointer transition-all ${
                  replayTimeline.currentFrame === bm.frameIndex
                    ? 'bg-amber-950/40 border-amber-500/80 text-amber-100 shadow-md'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between font-bold mb-1">
                  <span className="text-amber-400">{bm.timestamp}</span>
                  <span className="text-[10px] text-slate-400">{bm.eventCategory}</span>
                </div>
                <div className="font-bold text-slate-100">{bm.title}</div>
                <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">{bm.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
