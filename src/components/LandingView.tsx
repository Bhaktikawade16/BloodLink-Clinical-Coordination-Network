import React, { useEffect, useState } from 'react';
import { PortalRoute } from '../types';
import {
  ArrowRight,
  Droplet,
  ShieldCheck,
  HeartHandshake,
  CalendarDays,
  Database,
  Building2
} from 'lucide-react';

interface LandingViewProps {
  onNavigate: (route: PortalRoute) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const roles = [
    {
      id: 'donor',
      title: 'Donor Login',
      role: 'DONOR',
      desc: 'Donate blood, manage availability for emergencies, and register for community camps.',
      route: 'donor-portal' as PortalRoute,
      icon: HeartHandshake,
      badge: 'Voluntary Giver'
    },
    {
      id: 'blood-camp',
      title: 'Blood Camp Manager Login',
      role: 'ORGANIZER',
      desc: 'Organize blood donation camps, publish schedules, and manage donor registrations.',
      route: 'blood-camp-portal' as PortalRoute,
      icon: CalendarDays,
      badge: 'Camp Coordinator'
    },
    {
      id: 'blood-bank',
      title: 'Blood Bank Login',
      role: 'BLOOD BANK',
      desc: 'Manage cold-chain inventory, monitor expiry dates, and supply units to hospitals.',
      route: 'blood-bank-portal' as PortalRoute,
      icon: Database,
      badge: 'Storage Hub'
    },
    {
      id: 'hospital',
      title: 'Hospital Login',
      role: 'HOSPITAL',
      desc: 'Submit emergency blood requests to nearby blood banks and search emergency donors.',
      route: 'hospital-portal' as PortalRoute,
      icon: Building2,
      badge: 'Clinical Facility'
    }
  ];

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-4rem)] items-center justify-center relative overflow-hidden select-none px-4 sm:px-6 py-12">
      {/* Ambient Lighting Background */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-primary/10 via-primary/5 to-transparent blur-3xl opacity-70 transform -translate-y-6"></div>
      </div>

      {/* Hero Content Stage */}
      <div
        className={`relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto transition-all duration-700 ease-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* Droplet Logo Emblem */}
        <div className="mb-4 relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-container-lowest shadow-sm flex items-center justify-center text-primary relative border border-surface-container">
            <Droplet className="w-8 h-8 text-primary fill-primary/20" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full animate-ping opacity-60"></span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full"></span>
          </div>
        </div>

        {/* Display Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl text-on-surface tracking-tight font-extrabold mb-2">
          BLOOD<span className="text-primary">LINK</span>
        </h1>

        {/* Divider with Subtitle */}
        <div className="flex items-center gap-3 text-on-surface-variant mb-6">
          <span className="h-px w-6 bg-surface-container-high"></span>
          <p className="text-base sm:text-lg tracking-wide text-on-surface-variant font-normal">
            Connecting Blood. Connecting Lives.
          </p>
          <span className="h-px w-6 bg-surface-container-high"></span>
        </div>

        <p className="text-sm sm:text-base text-on-surface-variant max-w-2xl mb-8 leading-relaxed">
          A unified community-based blood management and emergency coordination platform linking donors, camp organizers, accredited blood banks, and emergency trauma hospitals in real-time.
        </p>

        {/* Role Portals Grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 text-left">
          {roles.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.route)}
                className="group p-5 rounded-2xl bg-surface-container-lowest border border-surface-container hover:border-primary/50 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors duration-200">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                      {item.role}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors">
                    {item.title}
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-surface-container/60 flex items-center justify-between text-xs font-semibold text-primary">
                  <span>Sign In / Enter</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Primary Action Button */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => onNavigate('portal-selection')}
            className="group relative inline-flex items-center justify-center gap-2.5 px-8 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm tracking-wider uppercase shadow-sm hover:shadow-md hover:bg-primary-container transition-all duration-200 active:scale-[0.99] cursor-pointer"
          >
            <span>EXPLORE ALL PORTALS</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </div>

        {/* Medical Disclaimer Callout */}
        <div className="mt-10 p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container text-xs text-on-surface-variant max-w-lg flex items-center gap-2.5 text-left">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <span>
            <strong>Medical Disclaimer:</strong> BloodLink is a coordination platform and does not replace medical professionals, blood testing, compatibility testing or blood-bank procedures.
          </span>
        </div>
      </div>
    </div>
  );
};

