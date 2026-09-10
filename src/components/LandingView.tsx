import React, { useState, useRef, useEffect } from 'react';
import { PortalRoute } from '../types';
import { ArrowRight } from 'lucide-react';

interface LandingViewProps {
  onNavigate: (route: PortalRoute) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate }) => {
  const [videoEnded, setVideoEnded] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Auto-play immediately with muted property explicitly set for mobile and desktop browser policies
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.currentTime = 0;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // If browser policy requires user gesture, clicking anywhere on screen triggers play
        });
      }
    }
  }, []);

  const handleStart = () => {
    onNavigate('portal-selection');
  };

  return (
    <div
      onClick={() => {
        // Fallback: If video was paused by browser policy, first tap plays it; if ended/active, advances
        if (videoRef.current && videoRef.current.paused && !videoEnded) {
          videoRef.current.play().catch(() => {});
        } else if (currentTime >= 2.4 || videoEnded) {
          handleStart();
        }
      }}
      className="relative w-full h-screen overflow-hidden bg-[#f8fafc] flex items-center justify-center select-none font-sans cursor-pointer"
    >
      {/* Full, Unedited Video Player */}
      <video
        ref={videoRef}
        src="/landing-video.mp4"
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
        className="w-full h-full max-h-screen object-contain bg-[#f8fafc]"
      />

      {/* Interactive "Let's Get Started" Button */}
      {/* Appears precisely at the final scene where the video shows its red button */}
      <div
        className={`absolute bottom-[14%] sm:bottom-[16%] left-1/2 -translate-x-1/2 z-30 transition-all duration-300 ${
          currentTime >= 2.5 || videoEnded
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <button
          id="lets-get-started-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleStart();
          }}
          className="group relative inline-flex items-center justify-center gap-2.5 px-8 py-3.5 sm:px-10 sm:py-4 rounded-full bg-[#d32f2f] hover:bg-[#b71c1c] text-white font-semibold text-base sm:text-lg shadow-[0_10px_28px_rgba(211,47,47,0.45)] hover:shadow-[0_14px_36px_rgba(211,47,47,0.6)] transition-all duration-300 active:scale-95 cursor-pointer"
        >
          <span>Let's Get Started</span>
          <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1 inline-block" />
        </button>
      </div>
    </div>
  );
};
