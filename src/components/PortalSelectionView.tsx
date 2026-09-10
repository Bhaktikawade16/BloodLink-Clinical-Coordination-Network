import React, { useState } from 'react';
import { PortalRoute } from '../types';
import { useBloodLink } from '../context/BloodLinkContext';
import {
  HeartHandshake,
  Building2,
  Database,
  CalendarDays,
  ArrowRight,
  Shield,
  Heart,
  LogOut,
  AlertCircle
} from 'lucide-react';

interface PortalSelectionViewProps {
  onNavigate: (route: PortalRoute) => void;
}

export const PortalSelectionView: React.FC<PortalSelectionViewProps> = ({ onNavigate }) => {
  const { currentDonor, logoutDonor } = useBloodLink();
  const [restrictionNotice, setRestrictionNotice] = useState<string | null>(null);

  const portals = [
    {
      id: 'donor',
      name: 'DONOR',
      desc: 'Donate blood, find exciting blood donation camps with free gifts, and track lives saved.',
      route: 'donor-portal' as PortalRoute,
      icon: HeartHandshake,
      badge: 'Individual Giver'
    },
    {
      id: 'hospital',
      name: 'HOSPITAL',
      desc: 'Request and coordinate blood during emergencies.',
      route: 'hospital-portal' as PortalRoute,
      icon: Building2,
      badge: 'Clinical Facility'
    },
    {
      id: 'blood-bank',
      name: 'BLOOD BANK',
      desc: 'Manage blood inventory and respond to requests.',
      route: 'blood-bank-portal' as PortalRoute,
      icon: Database,
      badge: 'Repository Center'
    },
    {
      id: 'blood-camp',
      name: 'BLOOD CAMP',
      desc: 'Organize blood donation camps and manage registrations.',
      route: 'blood-camp-portal' as PortalRoute,
      icon: CalendarDays,
      badge: 'Community Organizer'
    }
  ];

  const handlePortalClick = (portal: typeof portals[0]) => {
    if (currentDonor && portal.route !== 'donor-portal') {
      setRestrictionNotice(
        `Access to ${portal.name} is restricted. You are registered as a Donor (${currentDonor.fullName}). Donors cannot access clinical or institutional portals. Please sign out of your donor account if you represent medical staff.`
      );
      return;
    }
    onNavigate(portal.route);
  };

  return (
    <div className="w-full min-h-[calc(100vh-8rem)] flex flex-col justify-center py-12 md:py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* If Active Donor Session Notice */}
      {currentDonor && (
        <div className="mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold shrink-0">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface">
                Active Donor Session: {currentDonor.fullName} ({currentDonor.bloodGroup})
              </h3>
              <p className="text-xs text-on-surface-variant">
                You are registered as a Hero Donor. Hospital and administrative portals are restricted to verified medical personnel.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => onNavigate('donor-portal')}
              className="flex-1 sm:flex-initial px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold hover:bg-primary-container transition-colors"
            >
              Open Donor Portal
            </button>
            <button
              onClick={() => {
                logoutDonor();
                setRestrictionNotice(null);
              }}
              className="flex-1 sm:flex-initial px-3 py-2 bg-surface-container text-on-surface rounded-xl text-xs font-semibold hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Restriction Warning Alert if Donor attempted clicking hospital/admin */}
      {restrictionNotice && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{restrictionNotice}</p>
          </div>
          <button
            onClick={() => setRestrictionNotice(null)}
            className="text-red-500 hover:text-red-700 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
        <h1 className="text-3xl md:text-4xl font-bold text-on-surface tracking-tight mb-3">
          Choose your portal
        </h1>
        <p className="text-base md:text-lg text-on-surface-variant">
          Select the account type that matches your role.
        </p>
      </div>

      {/* Exactly 4 Portal Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {portals.map((portal) => {
          const Icon = portal.icon;
          const isRestrictedForDonor = Boolean(currentDonor && portal.route !== 'donor-portal');

          return (
            <button
              key={portal.id}
              onClick={() => handlePortalClick(portal)}
              className={`group relative flex flex-col justify-between text-left p-6 md:p-7 rounded-2xl bg-surface-container-lowest border shadow-xs transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                isRestrictedForDonor
                  ? 'opacity-60 border-surface-container bg-surface-container-low/40 hover:opacity-80'
                  : 'border-surface-container hover:border-primary/40 hover:shadow-md hover:-translate-y-1'
              }`}
            >
              <div>
                {/* Simple Icon */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-200 mb-6 ${
                    isRestrictedForDonor
                      ? 'bg-surface-container text-on-surface-variant'
                      : 'bg-surface-container text-primary group-hover:bg-primary group-hover:text-on-primary'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>

                {/* Portal Name */}
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-on-surface tracking-wider uppercase">
                    {portal.name}
                  </h2>
                  {isRestrictedForDonor && (
                    <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                      Locked
                    </span>
                  )}
                </div>

                {/* One Short Description */}
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {portal.desc}
                </p>
              </div>

              {/* Arrow */}
              <div
                className={`mt-8 pt-4 border-t border-surface-container/60 flex items-center justify-between font-semibold text-sm ${
                  isRestrictedForDonor ? 'text-on-surface-variant' : 'text-primary'
                }`}
              >
                <span>{isRestrictedForDonor ? 'Staff Only' : 'Enter Portal'}</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Discreet Institutional Verification Portal Link */}
      {!currentDonor && (
        <div className="mt-14 text-center">
          <button
            onClick={() => onNavigate('admin-portal')}
            className="inline-flex items-center gap-2 text-xs font-medium text-on-surface-variant hover:text-primary transition-colors py-2 px-3 rounded-lg hover:bg-surface-container cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Administrative &amp; Institutional Verification Desk</span>
          </button>
        </div>
      )}
    </div>
  );
};
