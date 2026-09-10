import React, { useEffect, useState, useRef } from 'react';
import { PortalRoute } from '../types';
import { ArrowRight, Upload, RotateCcw, CheckCircle2, Film } from 'lucide-react';

interface LandingViewProps {
  onNavigate: (route: PortalRoute) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate }) => {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoEnded, setVideoEnded] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Fallback procedural animation state if video is not yet loaded
  const [animStage, setAnimStage] = useState<number>(0);
  const [replayKey, setReplayKey] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // 1. Check if public/landing-video.mp4 exists on the server
  useEffect(() => {
    fetch('/api/landing-video-status')
      .then((res) => res.json())
      .then((data) => {
        if (data.exists && data.url) {
          setVideoSrc(data.url);
        }
      })
      .catch(() => {
        // Fallback to procedural sequence
      });
  }, []);

  // 2. Procedural animation timeline (used only as fallback)
  useEffect(() => {
    if (videoSrc) return;

    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setAnimStage(0);

    const t1 = setTimeout(() => setAnimStage(1), 1000);
    const t2 = setTimeout(() => setAnimStage(2), 2200);
    const t3 = setTimeout(() => setAnimStage(3), 3200);
    const t4 = setTimeout(() => setAnimStage(4), 4200);
    const t5 = setTimeout(() => setAnimStage(5), 5200);

    timeoutsRef.current = [t1, t2, t3, t4, t5];

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, [videoSrc, replayKey]);

  // Handle local video file drop or selection
  const handleProcessVideoFile = async (file: File) => {
    if (!file) return;

    // Immediately play local object URL for zero latency
    const objectUrl = URL.createObjectURL(file);
    setVideoSrc(objectUrl);
    setVideoEnded(false);
    setCurrentTime(0);

    // Save to server so it becomes the permanent landing page on public/landing-video.mp4
    setIsUploading(true);
    try {
      const res = await fetch('/api/upload-landing-video', {
        method: 'POST',
        headers: { 'Content-Type': file.type || 'video/mp4' },
        body: file,
      });
      const data = await res.json();
      if (data.success) {
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 4000);
      }
    } catch (err) {
      console.warn('Could not persist video to server storage, playing locally:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessVideoFile(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessVideoFile(file);
    }
  };

  const handleStart = () => {
    onNavigate('portal-selection');
  };

  const handleReplayVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setVideoEnded(false);
      setCurrentTime(0);
    } else {
      setReplayKey((k) => k + 1);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative w-full min-h-screen overflow-hidden bg-[#f8fafc] flex flex-col items-center justify-center select-none font-sans"
    >
      {/* Hidden file input to upload the video */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Drag Overlay Notice */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-red-600/20 backdrop-blur-sm border-4 border-dashed border-red-500 flex flex-col items-center justify-center text-red-900 pointer-events-none">
          <Upload className="w-16 h-16 animate-bounce text-red-600 mb-2" />
          <p className="text-2xl font-bold">Drop your video file here!</p>
          <p className="text-sm text-red-800">It will play full screen from the start</p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CASE A: FULL VIDEO DISPLAY (Plays from 00:00 to end without any editing)  */}
      {/* ========================================================================= */}
      {videoSrc ? (
        <div className="relative w-full h-screen flex items-center justify-center bg-[#f8fafc] overflow-hidden">
          {/* Unedited Native Video: Edge-to-edge / Centered cleanly */}
          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay
            muted
            playsInline
            onTimeUpdate={() => {
              if (videoRef.current) {
                setCurrentTime(videoRef.current.currentTime);
              }
            }}
            onEnded={() => {
              setVideoEnded(true);
            }}
            className="w-full h-full max-h-screen object-contain bg-[#f8fafc] cursor-pointer"
            onClick={() => {
              // Clicking the video when button is visible or video finished navigates
              if (currentTime >= 2.5 || videoEnded) {
                handleStart();
              }
            }}
          />

          {/* Interactive "Let's Get Started" Hotspot / Overlay Button */}
          {/* In the video, the button appears at ~00:03 - 00:04. */}
          {/* This provides a responsive, high-contrast click target matching the video's button */}
          <div
            className={`absolute bottom-[14%] sm:bottom-[16%] left-1/2 -translate-x-1/2 z-30 transition-all duration-300 ${
              currentTime >= 2.8 || videoEnded
                ? 'opacity-100 scale-100 pointer-events-auto'
                : 'opacity-0 scale-95 pointer-events-none'
            }`}
          >
            <button
              id="lets-get-started-btn"
              onClick={handleStart}
              className="group relative inline-flex items-center justify-center gap-2.5 px-8 py-3.5 sm:px-10 sm:py-4 rounded-full bg-[#d32f2f] hover:bg-[#b71c1c] text-white font-semibold text-base sm:text-lg shadow-[0_10px_28px_rgba(211,47,47,0.45)] hover:shadow-[0_14px_36px_rgba(211,47,47,0.6)] transition-all duration-300 active:scale-95 cursor-pointer"
            >
              <span>Let's Get Started</span>
              <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1 inline-block" />
            </button>
          </div>

          {/* Unobtrusive Bottom Corner Controls: Replay & Change */}
          <div className="absolute bottom-4 right-5 z-40 flex items-center gap-2.5">
            <button
              onClick={handleReplayVideo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-slate-950 text-xs font-semibold shadow-sm border border-slate-200 transition-all cursor-pointer backdrop-blur-xs"
              title="Watch video again from start"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Replay</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-slate-950 text-xs font-semibold shadow-sm border border-slate-200 transition-all cursor-pointer backdrop-blur-xs"
              title="Select another video file"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Change Video</span>
            </button>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* CASE B: PROMPT TO LOAD THE VIDEO FILE (with live fallback animation)      */
        /* ========================================================================= */
        <div className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden">
          
          {/* Hospital Clinic Visual Background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-64 bg-radial from-white via-white/80 to-transparent blur-2xl opacity-90" />
            <div className="absolute top-[48%] left-0 right-0 h-2 bg-gradient-to-r from-slate-200/50 via-slate-300/70 to-slate-200/50 blur-[0.5px]" />
            <div className="absolute top-[50%] inset-x-0 bottom-0 bg-gradient-to-b from-[#ffffff] via-[#f8fafc] to-[#f1f5f9]" />
            <div className="absolute bottom-20 right-[12%] text-rose-300/60 text-2xl animate-pulse font-serif">
              ✦
            </div>
          </div>

          {/* Floating Blood Cell Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
            {[
              { left: '12%', size: 36, delay: '0s', duration: '9s' },
              { left: '25%', size: 22, delay: '2s', duration: '8s' },
              { left: '42%', size: 44, delay: '1s', duration: '11s' },
              { left: '58%', size: 20, delay: '3.5s', duration: '7.5s' },
              { left: '75%', size: 32, delay: '0.5s', duration: '9.5s' },
              { left: '88%', size: 26, delay: '2.5s', duration: '8.8s' },
            ].map((p, idx) => (
              <div
                key={idx}
                className="absolute rounded-full animate-float-cells"
                style={{
                  left: p.left,
                  bottom: '-50px',
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  background: 'radial-gradient(circle, rgba(244,63,94,0.55) 0%, rgba(225,29,72,0.2) 65%, transparent 100%)',
                  animationDelay: p.delay,
                  animationDuration: p.duration,
                }}
              />
            ))}
          </div>

          {/* Fallback Scene Animation corresponding to 00:00 - 00:04 */}
          <div className="relative z-20 flex flex-col items-center justify-center w-full max-w-xl mx-auto px-4 mt-6">
            
            {/* 00:00 - 00:01: 3 Droplets Falling */}
            {animStage === 1 && (
              <div className="absolute top-[28%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 flex items-center justify-center gap-10">
                <div className="animate-drop-side-left">
                  <div className="w-5 h-8 bg-red-600 rounded-full blur-[0.5px]" />
                </div>
                <div className="animate-drop-main">
                  <svg viewBox="0 0 100 120" className="w-24 h-32 drop-shadow-[0_18px_30px_rgba(185,28,28,0.55)]">
                    <defs>
                      <linearGradient id="mainDropGrad" x1="15%" y1="0%" x2="85%" y2="100%">
                        <stop offset="0%" stopColor="#f87171" />
                        <stop offset="35%" stopColor="#dc2626" />
                        <stop offset="85%" stopColor="#991b1b" />
                      </linearGradient>
                    </defs>
                    <path d="M 50 8 C 50 8, 88 56, 88 80 A 38 38 0 0 1 12 80 C 12 56, 50 8, 50 8 Z" fill="url(#mainDropGrad)" />
                    <path d="M 44 60 H 56 V 70 H 66 V 82 H 56 V 92 H 44 V 82 H 34 V 70 H 44 Z" fill="#ffffff" />
                  </svg>
                </div>
                <div className="animate-drop-side-right">
                  <div className="w-5 h-8 bg-red-600 rounded-full blur-[0.5px]" />
                </div>
              </div>
            )}

            {/* 00:01 - 00:02: Splash Rebound & Liquid Ripples */}
            {animStage >= 2 && (
              <div className="relative w-80 sm:w-[420px] h-60 flex items-center justify-center pointer-events-none mb-3">
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'rotateX(70deg)' }}>
                  <div className="absolute rounded-full border-[3px] border-rose-400/90 bg-radial from-rose-300/60 via-rose-200/30 to-transparent animate-surface-ripple-1" style={{ width: '90px', height: '90px' }} />
                  <div className="absolute rounded-full border-[2.5px] border-rose-300/80 animate-surface-ripple-2" style={{ width: '150px', height: '150px' }} />
                  <div className="absolute rounded-full border-2 border-slate-300/70 animate-surface-ripple-3" style={{ width: '220px', height: '220px' }} />
                </div>

                {/* 00:02: Circular Medallion Badge */}
                <div className={`relative z-30 flex items-center justify-center transition-all duration-700 ease-out transform ${animStage >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-60'}`}>
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white flex items-center justify-center shadow-[0_14px_35px_rgba(225,29,72,0.22)] border-[3.5px] border-rose-200/95 relative p-3">
                    <svg viewBox="0 0 100 120" className="w-16 h-20 sm:w-18 sm:h-22 drop-shadow-[0_4px_12px_rgba(185,28,28,0.35)]">
                      <defs>
                        <linearGradient id="badgeDrop" x1="20%" y1="0%" x2="80%" y2="100%">
                          <stop offset="0%" stopColor="#f87171" />
                          <stop offset="35%" stopColor="#dc2626" />
                          <stop offset="85%" stopColor="#991b1b" />
                        </linearGradient>
                      </defs>
                      <path d="M 50 12 C 50 12, 85 55, 85 78 A 35 35 0 0 1 15 78 C 15 55, 50 12, 50 12 Z" fill="url(#badgeDrop)" />
                      <path d="M 45 62 H 55 V 70 H 63 V 80 H 55 V 88 H 45 V 80 H 37 V 70 H 45 Z" fill="#ffffff" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* 00:03: Tagline */}
            <div className={`transition-all duration-700 ease-out text-center mt-3 sm:mt-5 ${animStage >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
              <p className="text-xl sm:text-2xl font-semibold text-[#334155] tracking-tight">
                Connecting Lives. One Drop at a Time.
              </p>
            </div>

            {/* 00:04: "Let's Get Started →" Button */}
            <div className={`transition-all duration-700 ease-out mt-6 ${animStage >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
              <button
                onClick={handleStart}
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#d32f2f] hover:bg-[#b71c1c] text-white font-semibold text-base sm:text-lg shadow-[0_10px_28px_rgba(211,47,47,0.4)] transition-all active:scale-95 cursor-pointer"
              >
                <span>Let's Get Started</span>
                <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Prominent Video Selector Banner (Floating at Top/Center so user can load their exact video file with 1 click) */}
          <div className="relative z-30 mt-8 mb-4 max-w-md w-full px-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-4 rounded-2xl bg-white/95 border-2 border-dashed border-rose-300 hover:border-rose-500 shadow-xl backdrop-blur-md cursor-pointer transition-all hover:scale-[1.02] flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors shrink-0">
                <Film className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <span>Use Your Exact Video File (.mp4)</span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click to select or drag & drop your video here to play it in full from start to finish
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-600 text-white shadow-sm shrink-0">
                Select Video
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Uploading Notification Toast */}
      {isUploading && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-medium">
          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Saving your video permanently to the server...</span>
        </div>
      )}

      {/* Success Notification Toast */}
      {uploadSuccess && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4" />
          <span>Video saved! It is now the permanent landing page.</span>
        </div>
      )}

      {/* Keyframe Styles */}
      <style>{`
        @keyframes dropMain {
          0% { transform: translateY(-240px) scale(0.85); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(70px) scale(1.15, 0.7); opacity: 0.95; }
        }
        .animate-drop-main {
          animation: dropMain 1.2s cubic-bezier(0.45, 0.05, 0.55, 0.95) forwards;
        }

        @keyframes dropSideL {
          0% { transform: translateY(-200px) scale(0.7); opacity: 0; }
          25% { opacity: 0.8; }
          100% { transform: translateY(50px) scale(1, 0.6); opacity: 0.8; }
        }
        .animate-drop-side-left {
          animation: dropSideL 1.1s cubic-bezier(0.45, 0.05, 0.55, 0.95) 0.1s forwards;
        }

        @keyframes dropSideR {
          0% { transform: translateY(-220px) scale(0.7); opacity: 0; }
          25% { opacity: 0.8; }
          100% { transform: translateY(50px) scale(1, 0.6); opacity: 0.8; }
        }
        .animate-drop-side-right {
          animation: dropSideR 1.15s cubic-bezier(0.45, 0.05, 0.55, 0.95) 0.15s forwards;
        }

        @keyframes surfaceRipple1 {
          0% { transform: scale(0.2); opacity: 0.95; }
          100% { transform: scale(2.6); opacity: 0; }
        }
        .animate-surface-ripple-1 {
          animation: surfaceRipple1 2.2s cubic-bezier(0.15, 0.45, 0.25, 1) infinite;
        }

        @keyframes surfaceRipple2 {
          0% { transform: scale(0.25); opacity: 0.85; }
          100% { transform: scale(3.1); opacity: 0; }
        }
        .animate-surface-ripple-2 {
          animation: surfaceRipple2 2.4s cubic-bezier(0.15, 0.45, 0.25, 1) 0.25s infinite;
        }

        @keyframes surfaceRipple3 {
          0% { transform: scale(0.35); opacity: 0.7; }
          100% { transform: scale(3.6); opacity: 0; }
        }
        .animate-surface-ripple-3 {
          animation: surfaceRipple3 2.6s cubic-bezier(0.15, 0.45, 0.25, 1) 0.5s infinite;
        }

        @keyframes floatCells {
          0% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-50vh) translateX(15px); }
          100% { transform: translateY(-115vh) translateX(-10px); }
        }
        .animate-float-cells {
          animation-name: floatCells;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  );
};
