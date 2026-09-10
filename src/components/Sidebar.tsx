import React from 'react';
import { PortalRoute } from '../types';
import { ASSETS } from '../data/mockData';
import { useBloodLink } from '../context/BloodLinkContext';
import {
  HeartHandshake,
  Building2,
  Database,
  CalendarDays,
  Shield,
  ArrowLeftRight,
  X,
  Gift,
  Award,
  AlertTriangle,
  UserCheck,
  LogOut,
  Droplet
} from 'lucide-react';

interface SidebarProps {
  currentRoute: PortalRoute;
  onNavigate: (route: PortalRoute) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  mobileOpen = false,
  onCloseMobile
}) => {
  const { currentDonor, logoutDonor, currentUser, logoutUser } = useBloodLink();

  const handleSignOut = () => {
    if (currentDonor) logoutDonor();
    if (currentUser) logoutUser();
    onNavigate('landing');
    onCloseMobile?.();
  };
  // No hospital, blood bank, or admin portals are accessible or visible.
  const donorNavItems = [
    {
      tab: 'camps',
      label: 'Blood Camps & Freebies',
      icon: Gift,
      badge: 'Perks'
    },
    {
      tab: 'rewards',
      label: 'Donor Pass & Rewards',
      icon: Award,
      badge: 'Gifts'
    },
    {
      tab: 'requests',
      label: 'Emergency Calls',
      icon: AlertTriangle,
      badge: 'Live'
    },
    {
      tab: 'history',
      label: 'Donation History',
      icon: Droplet
    },
    {
      tab: 'profile',
      label: 'My Donor Profile',
      icon: UserCheck
    }
  ];

  const standardNavItems = [
    {
      route: 'donor-portal' as PortalRoute,
      label: 'Donor Portal',
      icon: HeartHandshake
    },
    {
      route: 'hospital-portal' as PortalRoute,
      label: 'Hospital Portal',
      icon: Building2
    },
    {
      route: 'blood-bank-portal' as PortalRoute,
      label: 'Blood Bank Portal',
      icon: Database
    },
    {
      route: 'blood-camp-portal' as PortalRoute,
      label: 'Blood Camp Portal',
      icon: CalendarDays
    },
    {
      route: 'admin-portal' as PortalRoute,
      label: 'Verification Desk',
      icon: Shield
    }
  ];

  const handleDonorTabClick = (tab: string) => {
    if (currentRoute !== 'donor-portal') {
      onNavigate('donor-portal');
    }
    // Dispatch event to switch tab inside DonorPortalView
    window.dispatchEvent(new CustomEvent('bloodlink:set-donor-tab', { detail: tab }));
    onCloseMobile?.();
  };

  const handleSignOutDonor = () => {
    logoutDonor();
    onNavigate('portal-selection');
    onCloseMobile?.();
  };

  const content = (
    <div className="h-full flex flex-col justify-between py-6">
      <div className="flex flex-col gap-5">
        {/* Brand Header */}
        <div className="px-6 flex items-center justify-between">
          <div
            onClick={() => {
              if (!currentDonor) {
                onNavigate('landing');
              } else {
                handleDonorTabClick('camps');
              }
              onCloseMobile?.();
            }}
            className="flex items-center gap-3 cursor-pointer group"
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
              <span className="text-xs text-primary font-semibold leading-tight mt-0.5">
                {currentDonor ? 'Donor Hero Hub' : 'Clinical Core'}
              </span>
            </div>
          </div>
          {mobileOpen && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface lg:hidden cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* If Active Donor: Show Donor Profile Badge */}
        {currentDonor && (
          <div className="mx-4 p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary text-on-primary font-extrabold flex items-center justify-center shrink-0 text-sm shadow-xs">
              {currentDonor.bloodGroup}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-on-surface truncate">
                {currentDonor.fullName}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active LifeSaver
              </span>
            </div>
          </div>
        )}

        {/* Portal Links or Donor Dedicated Navigation */}
        <nav className="flex flex-col px-3 gap-1">
          {currentDonor ? (
            <>
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
                Donor Navigation
              </div>
              {donorNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.tab}
                    onClick={() => handleDonorTabClick(item.tab)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-xs font-semibold text-left cursor-pointer text-on-surface-variant hover:bg-surface-container hover:text-on-surface group"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-primary group-hover:scale-110 transition-transform shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </>
          ) : (
            standardNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.route;
              return (
                <button
                  key={item.route}
                  onClick={() => {
                    onNavigate(item.route);
                    onCloseMobile?.();
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-xs font-semibold text-left cursor-pointer ${
                    isActive
                      ? 'bg-primary/10 text-primary shadow-xs'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })
          )}
        </nav>
      </div>

      {/* Footer Action: Sign Out for any logged-in user OR Switch Portal */}
      <div className="px-4">
        {currentDonor || currentUser ? (
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-all text-xs font-bold cursor-pointer border border-red-200 shadow-xs"
            title="Sign out from your account"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out ({currentUser?.name || currentDonor?.fullName || 'Account'})</span>
          </button>
        ) : (
          <button
            onClick={() => {
              onNavigate('portal-selection');
              onCloseMobile?.();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container transition-all text-xs font-semibold cursor-pointer border border-surface-container"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Switch Portal</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex-col border-r border-surface-container">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-surface-container-lowest shadow-xl z-50">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
