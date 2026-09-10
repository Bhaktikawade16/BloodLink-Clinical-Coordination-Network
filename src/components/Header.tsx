import React from 'react';
import { PortalRoute } from '../types';
import { ASSETS } from '../data/mockData';
import { User, Shield, Database, RefreshCw, LogOut, Gift } from 'lucide-react';
import { useBloodLink } from '../context/BloodLinkContext';

interface HeaderProps {
  currentRoute: PortalRoute;
  onNavigate: (route: PortalRoute) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentRoute, onNavigate }) => {
  const { isRailwayConnected, isSyncing, railwayLatency, syncWithRailway, currentDonor, logoutDonor } = useBloodLink();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/90 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container/60">
      <div className="h-16 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo & Network Identity */}
        <button
          onClick={() => {
            if (currentDonor) {
              onNavigate('donor-portal');
            } else {
              onNavigate('landing');
            }
          }}
          className="flex items-center gap-3 text-left focus:outline-none group cursor-pointer"
        >
          <img
            alt="BloodLink Logo"
            className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
            src={ASSETS.logo}
          />
          <div className="flex flex-col">
            <span className="text-base font-bold text-on-surface tracking-tight leading-none">
              BloodLink
            </span>
            <span className="text-xs text-on-surface-variant leading-tight mt-0.5">
              {currentDonor ? 'Donor Network' : 'Clinical Coordination Network'}
            </span>
          </div>
        </button>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-2">
          {currentDonor ? (
            /* Restricted Navigation for Logged-In Donor */
            <>
              <button
                onClick={() => onNavigate('donor-portal')}
                className="px-3 py-1.5 transition-colors rounded-lg text-xs font-semibold cursor-pointer bg-primary/10 text-primary"
              >
                Donor Portal
              </button>
              <button
                onClick={() => {
                  onNavigate('donor-portal');
                  window.dispatchEvent(new CustomEvent('bloodlink:set-donor-tab', { detail: 'camps' }));
                }}
                className="px-3 py-1.5 transition-colors rounded-lg text-xs font-semibold cursor-pointer text-on-surface-variant hover:text-on-surface hover:bg-surface-container flex items-center gap-1"
              >
                <Gift className="w-3.5 h-3.5 text-primary" />
                <span>Blood Camps & Freebies</span>
              </button>
            </>
          ) : (
            /* Public Navigation for Medical Staff & Visitors */
            <>
              <button
                onClick={() => onNavigate('landing')}
                className={`px-3 py-1.5 transition-colors rounded-lg text-xs font-semibold cursor-pointer ${
                  currentRoute === 'landing'
                    ? 'bg-surface-container-high text-on-surface'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => onNavigate('portal-selection')}
                className={`px-3 py-1.5 transition-colors rounded-lg text-xs font-semibold cursor-pointer ${
                  currentRoute === 'portal-selection'
                    ? 'bg-surface-container-high text-on-surface'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                Access Portals
              </button>
              <button
                onClick={() => onNavigate('admin-portal')}
                className={`px-3 py-1.5 transition-colors rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${
                  currentRoute === 'admin-portal'
                    ? 'bg-surface-container-high text-on-surface'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Verification Desk</span>
              </button>
            </>
          )}
        </nav>

        {/* Right Action, Database Status & Profile Button */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Live Railway Database Badge */}
          <button
            onClick={() => syncWithRailway()}
            disabled={isSyncing}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
              isRailwayConnected
                ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-800 border-amber-500/30 hover:bg-amber-500/20'
            }`}
            title="Railway PostgreSQL API Database. Click to synchronize now."
          >
            <Database className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Railway DB</span>
            <span
              className={`w-2 h-2 rounded-full ${
                isRailwayConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            {railwayLatency !== null && (
              <span className="text-[10px] font-mono opacity-80 hidden lg:inline">
                {railwayLatency}ms
              </span>
            )}
            <RefreshCw
              className={`w-3 h-3 ml-0.5 text-on-surface-variant/70 ${
                isSyncing ? 'animate-spin text-primary' : ''
              }`}
            />
          </button>

          {currentDonor ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('donor-portal')}
                className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary transition-all text-xs font-semibold cursor-pointer shadow-xs gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span>{currentDonor.fullName.split(' ')[0]} ({currentDonor.bloodGroup})</span>
              </button>
              <button
                onClick={() => {
                  logoutDonor();
                  onNavigate('landing');
                }}
                className="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 border border-red-200 transition-colors cursor-pointer"
                title="Sign Out Donor"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => onNavigate('portal-selection')}
                className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary transition-all text-xs font-semibold cursor-pointer shadow-xs"
              >
                Select Portal
              </button>
              <button
                onClick={() => onNavigate('donor-portal')}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors cursor-pointer"
                title="Donor Gateway"
              >
                <User className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
