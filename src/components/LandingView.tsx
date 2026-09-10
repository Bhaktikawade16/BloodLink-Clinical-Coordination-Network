import React, { useState, useRef, useEffect } from 'react';
import { PortalRoute } from '../types';
import { ArrowRight, RotateCcw } from 'lucide-react';

interface LandingViewProps {
  onNavigate: (route: PortalRoute) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate }) => {
  // Default directly to the permanent video stored in /landing-video.mp4
  const [videoSrc, setVideoSrc] = useState<string>('/landing-video.mp4');
  const [videoEnded, setVideoEnded] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Auto-play safely across all browsers on mount
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        // Handled silently if browser requires gesture
      });
    }
  }, [videoSrc]);

  const handleStart = () => {
    onNavigate('portal-selection');
  };

  const handleReplayVideo = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
      setVideoEnded(false);
      setCurrentTime(0);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#f8fafc] flex items-center justify-center select-none font-sans">
      {/* Full, Unedited Video Player */}
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay
        muted
        playsInline
        preload="auto"
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
          // Clicking the video when button is active or video has finished navigates to portal
          if (currentTime >= 2.5 || videoEnded) {
            handleStart();
          }
        }}
      />

      {/* Interactive "Let's Get Started" Button */}
      {/* Appears in sync with the video's red button at the conclusion */}
      <div
        className={`absolute bottom-[14%] sm:bottom-[16%] left-1/2 -translate-x-1/2 z-30 transition-all duration-300 ${
          currentTime >= 2.6 || videoEnded
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

      {/* Replay Control in Corner */}
      <div className="absolute bottom-4 right-5 z-40">
        <button
          onClick={handleReplayVideo}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-slate-950 text-xs font-semibold shadow-sm border border-slate-200 transition-all cursor-pointer backdrop-blur-xs hover:shadow"
          title="Watch video again from the beginning"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Replay Video</span>
        </button>
      </div>
    </div>
  );
};
