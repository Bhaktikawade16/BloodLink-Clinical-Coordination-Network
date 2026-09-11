/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PortalRoute } from './types';
import { BloodLinkProvider, useBloodLink } from './context/BloodLinkContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { LandingView } from './components/LandingView';
import { PortalSelectionView } from './components/PortalSelectionView';
import { HospitalPortalView } from './components/HospitalPortalView';
import { BloodBankPortalView } from './components/BloodBankPortalView';
import { DonorPortalView } from './components/DonorPortalView';
import { BloodCampPortalView } from './components/BloodCampPortalView';
import { AdminPortalView } from './components/AdminPortalView';
import { Menu, LogOut, ShieldAlert, Heart } from 'lucide-react';

function AppContent() {
  const { currentDonor, currentUser, logoutUser } = useBloodLink();
  // Always start at the landing page when opening the website URL
  const [currentRoute, setCurrentRoute] = useState<PortalRoute>('landing');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleRedirectNotice, setRoleRedirectNotice] = useState<string | null>(null);

  // Listen for cross-role redirect events
  useEffect(() => {
    const handleRoleRedirect = (e: any) => {
      if (e.detail?.message) {
        setRoleRedirectNotice(e.detail.message);
        setTimeout(() => setRoleRedirectNotice(null), 7000);
      } else if (e.detail?.role) {
        setRoleRedirectNotice(
          `Welcome back! Your account is registered as ${e.detail.role.replace('_', ' ').toUpperCase()}. Redirecting to your authorized dashboard.`
        );
        setTimeout(() => setRoleRedirectNotice(null), 7000);
      }
    };
    window.addEventListener('bloodlink:role-redirect' as any, handleRoleRedirect);
    return () => window.removeEventListener('bloodlink:role-redirect' as any, handleRoleRedirect);
  }, []);

  // Strict role-based portal protection and redirection
  useEffect(() => {
    if (currentRoute === 'landing') {
      return; // Landing page is always displayed until user clicks Get Started
    }

    if (currentUser) {
      const allowedPortalMap: Record<string, PortalRoute> = {
        donor: 'donor-portal',
        hospital: 'hospital-portal',
        blood_bank: 'blood-bank-portal',
        blood_camp: 'blood-camp-portal',
        admin: 'admin-portal'
      };
      const targetPortal = allowedPortalMap[currentUser.role];
      if (targetPortal && currentRoute !== targetPortal && currentRoute !== 'portal-selection') {
        setCurrentRoute(targetPortal);
      }
    } else if (currentDonor) {
      if (
        currentRoute === 'hospital-portal' ||
        currentRoute === 'blood-bank-portal' ||
        currentRoute === 'blood-camp-portal' ||
        currentRoute === 'admin-portal'
      ) {
        setCurrentRoute('donor-portal');
      }
    }
  }, [currentUser, currentDonor, currentRoute]);

  // Determine if current screen uses the dedicated persistent portal sidebar
  const isPortalView =
    currentRoute === 'donor-portal' ||
    currentRoute === 'hospital-portal' ||
    currentRoute === 'blood-bank-portal' ||
    currentRoute === 'blood-camp-portal' ||
    currentRoute === 'admin-portal';

  const handleSignOutUser = async () => {
    await logoutUser();
    setCurrentRoute('landing');
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface antialiased">
      {/* Public Header (Portal Selection) */}
      {!isPortalView && currentRoute !== 'landing' && (
        <Header
          currentRoute={currentRoute}
          onNavigate={(route) => {
            // Guard: If registered as donor, cannot navigate to clinical or admin portals
            if (currentDonor && route !== 'donor-portal' && route !== 'landing') {
              setCurrentRoute('donor-portal');
            } else {
              setCurrentRoute(route);
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* Main Layout Area */}
      {isPortalView ? (
        <div className="flex flex-1 w-full relative">
          {/* Persistent Sidebar */}
          <Sidebar
            currentRoute={currentRoute}
            onNavigate={(route) => {
              // Guard: If registered as donor, restrict to donor-portal
              if (currentDonor && route !== 'donor-portal') {
                setCurrentRoute('donor-portal');
              } else {
                setCurrentRoute(route);
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            mobileOpen={mobileMenuOpen}
            onCloseMobile={() => setMobileMenuOpen(false)}
          />

          {/* Portal Content Container */}
          <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
            {/* Mobile Top Bar */}
            <div className="lg:hidden h-14 bg-surface-container-lowest border-b border-surface-container flex items-center justify-between px-4 sticky top-0 z-40 shadow-xs">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-1.5 rounded-lg text-on-surface hover:bg-surface-container cursor-pointer flex items-center gap-2"
              >
                <Menu className="w-5 h-5" />
                <span className="text-sm font-semibold">
                  {currentDonor ? 'Donor Menu' : 'Portals'}
                </span>
              </button>
              {currentDonor || currentUser ? (
                <button
                  onClick={handleSignOutUser}
                  className="text-xs text-red-600 font-bold flex items-center gap-1.5 cursor-pointer bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg border border-red-200"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  onClick={() => setCurrentRoute('portal-selection')}
                  className="text-xs text-primary font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Switch Portal</span>
                </button>
              )}
            </div>

            {/* Portal Notice Banner */}
            <div className="bg-surface-container-low/80 border-b border-surface-container px-4 py-2 text-[11px] text-on-surface-variant flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {currentUser ? (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>
                      <strong>Active Portal Session:</strong> Logged in as{' '}
                      <strong>{currentUser.name}</strong> ({currentUser.role.replace('_', ' ').toUpperCase()}) • Status:{' '}
                      <span className="font-semibold text-secondary">{currentUser.verification_status}</span>
                    </span>
                  </>
                ) : currentDonor ? (
                  <>
                    <Heart className="w-3.5 h-3.5 text-primary shrink-0 fill-primary/30" />
                    <span>
                      <strong>Donor Session Active:</strong> Logged in as{' '}
                      <strong>{currentDonor.fullName}</strong> ({currentDonor.bloodGroup}).
                      Clinical portals are restricted to authorized medical personnel.
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>
                      <strong>Clinical Notice:</strong> BloodLink is a coordination platform and does
                      not replace medical professionals, blood testing, or blood-bank procedures.
                    </span>
                  </>
                )}
              </div>
              {currentDonor || currentUser ? (
                <button
                  onClick={handleSignOutUser}
                  className="hidden sm:inline-flex text-red-600 hover:text-red-700 font-semibold hover:underline cursor-pointer shrink-0 text-xs"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => setCurrentRoute('portal-selection')}
                  className="hidden sm:inline-flex text-primary font-semibold hover:underline cursor-pointer shrink-0"
                >
                  Switch Role
                </button>
              )}
            </div>

            {/* Role Redirect Toast Notification */}
            {roleRedirectNotice && (
              <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 p-3.5 bg-blue-50/95 border border-blue-200 text-blue-900 rounded-xl text-xs flex items-center justify-between shadow-xs animate-fadeIn">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-medium">{roleRedirectNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRoleRedirectNotice(null)}
                  className="text-blue-500 hover:text-blue-800 font-bold ml-3 cursor-pointer text-sm"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Main Portal Viewport */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
              {currentRoute === 'hospital-portal' && <HospitalPortalView />}

              {currentRoute === 'blood-bank-portal' && <BloodBankPortalView />}

              {currentRoute === 'donor-portal' && <DonorPortalView />}

              {currentRoute === 'blood-camp-portal' && <BloodCampPortalView />}

              {currentRoute === 'admin-portal' && <AdminPortalView />}
            </main>
          </div>
        </div>
      ) : (
        /* Public Layout Area (Landing and Portal Selection) */
        <main className={`flex-1 flex flex-col ${currentRoute !== 'landing' ? 'pt-16' : ''}`}>
          {currentRoute === 'landing' && (
            <LandingView
              onNavigate={(route) => {
                if (currentUser) {
                  if (currentUser.role === 'donor') setCurrentRoute('donor-portal');
                  else if (currentUser.role === 'hospital') setCurrentRoute('hospital-portal');
                  else if (currentUser.role === 'blood_bank') setCurrentRoute('blood-bank-portal');
                  else if (currentUser.role === 'blood_camp') setCurrentRoute('blood-camp-portal');
                  else setCurrentRoute('portal-selection');
                } else if (currentDonor) {
                  setCurrentRoute('donor-portal');
                } else {
                  setCurrentRoute(route);
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {currentRoute === 'portal-selection' && (
            <>
              <PortalSelectionView
                onNavigate={(route) => {
                  if (currentDonor && route !== 'donor-portal') {
                    setCurrentRoute('donor-portal');
                  } else {
                    setCurrentRoute(route);
                  }
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
              <Footer />
            </>
          )}
        </main>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BloodLinkProvider>
      <AppContent />
    </BloodLinkProvider>
  );
}
