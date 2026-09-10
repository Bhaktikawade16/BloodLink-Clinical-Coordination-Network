import React from 'react';
import { ASSETS } from '../data/mockData';
import { ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-surface-container-lowest shadow-[0_-1px_8px_rgba(0,0,0,0.02)] mt-16 border-t border-surface-container">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            alt="BloodLink Logo"
            className="h-6 w-auto object-contain"
            src={ASSETS.logo}
          />
          <span className="text-sm font-bold text-on-surface">
            BloodLink
          </span>
          <span className="text-xs text-on-surface-variant">
            | Clinical Care Logistics Network
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-on-surface-variant text-center md:text-right max-w-xl">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0 hidden sm:block" />
          <span>
            BloodLink is a coordination platform and does not replace medical professionals, blood testing, compatibility testing or blood-bank procedures.
          </span>
        </div>
      </div>
    </footer>
  );
};
