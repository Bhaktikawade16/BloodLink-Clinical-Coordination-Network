import React, { useState } from 'react';
import { BloodCamp } from '../types';
import { useBloodLink } from '../context/BloodLinkContext';
import { BloodLinkVerificationCard } from './BloodLinkVerificationCard';
import { GoogleAuthButton } from './GoogleAuthButton';
import { GoogleDetailsBanner } from './GoogleDetailsBanner';
import {
  CalendarDays,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Users,
  User,
  LogOut,
  Calendar,
  Layers,
  History
} from 'lucide-react';

export const BloodCampPortalView: React.FC = () => {
  const {
    currentUser,
    currentOrganizer,
    loginOrganizer,
    logoutOrganizer,
    registerOrganizer,
    camps,
    createCamp,
    campRegistrations,
    loginUser,
    loginWithGoogle,
    registerUser,
    updateVerificationStatus
  } = useBloodLink();

  // Screen auth state: 'login' | 'register' | 'forgot'
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot'>('login');

  // Google & Gmail Extracted Details State
  const [extractedGoogleDetails, setExtractedGoogleDetails] = useState<any | null>(null);

  // Login inputs
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register inputs
  const [orgName, setOrgName] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [taxId, setTaxId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [recoveryNotice, setRecoveryNotice] = useState('');

  const handleGoogleSuccess = async (data: {
    extracted: any;
    isExistingUser: boolean;
    existingUserData?: any;
  }) => {
    setLoginError('');
    const res = await loginWithGoogle({
      email: data.extracted.email,
      name: data.extracted.name,
      role: 'blood_camp',
      phone: data.extracted.phone,
      autoRegister: true
    });
    if (!res.success) {
      setLoginError(res.error || 'Unable to log in with Google account.');
      return;
    }
    if (res.user && res.user.role !== 'blood_camp') {
      window.dispatchEvent(
        new CustomEvent('bloodlink:role-redirect', {
          detail: {
            role: res.user.role,
            userName: res.user.name,
            message: `Account is registered as ${res.user.role.toUpperCase()}. Redirecting to your authorized dashboard.`
          }
        })
      );
    }
  };

  // Dashboard Tab: 'upcoming' | 'create' | 'attendees' | 'history' | 'profile'
  const [activeTab, setActiveTab] = useState<'upcoming' | 'create' | 'attendees' | 'history' | 'profile'>('upcoming');

  // Create Camp Form Inputs
  const [campName, setCampName] = useState('');
  const [campDate, setCampDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('04:30 PM');
  const [venue, setVenue] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [contact, setContact] = useState('');
  const [regLimit, setRegLimit] = useState(150);
  const [description, setDescription] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginIdentifier.trim()) {
      setLoginError('Please enter your organizer email or phone.');
      return;
    }
    const res = await loginUser(loginIdentifier, loginPassword, 'blood_camp');
    if (!res.success) {
      const ok = loginOrganizer(loginIdentifier);
      if (!ok) {
        setLoginError(res.error || 'No organizer account found with these credentials. Please register.');
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (password !== confirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }

    const res = await registerUser({
      role: 'blood_camp',
      name: orgName,
      email,
      phone,
      password,
      city: city || 'Metro City',
      organizer_name: organizerName,
      tax_id: taxId
    });

    if (!res.success) {
      setRegError(res.error || 'Registration failed. Please check your inputs.');
    }
  };

  const handleCreateCamp = (e: React.FormEvent) => {
    e.preventDefault();
    createCamp({
      name: campName,
      date: campDate,
      startTime,
      endTime,
      venue,
      address,
      city,
      contact: contact || phone,
      registrationLimit: Number(regLimit),
      description
    });

    setSuccessMsg(`Blood camp "${campName}" scheduled successfully! It is now live on the voluntary donor network.`);
    setTimeout(() => setSuccessMsg(null), 4500);

    // Reset fields and redirect to upcoming
    setCampName('');
    setVenue('');
    setAddress('');
    setCity('');
    setDescription('');
    setActiveTab('upcoming');
  };

  // -------------------------------------------------------------
  // VIEW: AUTHENTICATION (When no organizer is signed in)
  // -------------------------------------------------------------
  if (!currentOrganizer) {
    return (
      <div className="w-full max-w-xl mx-auto py-10 px-4">
        <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
              <CalendarDays className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
              Welcome, camp organizer.
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              {authView === 'login'
                ? 'Sign in to coordinate community donation camps and manage donor slots.'
                : authView === 'register'
                ? 'Register your organization to mobilize voluntary blood drives.'
                : 'Recover camp organizer access.'}
            </p>
          </div>

          {/* LOGIN */}
          {authView === 'login' && (
            <div className="space-y-4">
              <GoogleAuthButton
                mode="login"
                role="camp_organizer"
                onGoogleSuccess={handleGoogleSuccess}
              />

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  or sign in with organizer credentials
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {loginError && (
                  <div className="p-3 rounded-lg bg-error-container text-on-error-container text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Email or Contact Number
                  </label>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="organizer@community.org or (555) 301-9988"
                    className="w-full h-11 px-3.5 rounded-lg bg-surface-container-low border border-surface-container focus:border-primary focus:bg-surface-container-lowest outline-none text-sm text-on-surface"
                  />
                </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setAuthView('forgot')}
                    className="text-xs text-primary hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-11 px-3.5 rounded-lg bg-surface-container-low border border-surface-container focus:border-primary focus:bg-surface-container-lowest outline-none text-sm text-on-surface"
                />
              </div>

              <div className="pt-2 space-y-2.5">
                <button
                  type="submit"
                  className="w-full h-11 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-semibold text-sm shadow-xs transition-colors cursor-pointer"
                >
                  SIGN IN
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthView('register');
                    setLoginError('');
                  }}
                  className="w-full h-11 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-sm transition-colors cursor-pointer"
                >
                  REGISTER ORGANIZER
                </button>
              </div>
            </form>
          </div>
        )}

          {/* FORGOT PASSWORD */}
          {authView === 'forgot' && (
            <div className="space-y-4">
              <p className="text-sm text-on-surface-variant">
                Enter your registered organizer email to receive a password reset token.
              </p>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Registered Email
                </label>
                <input
                  type="email"
                  placeholder="organizer@community.org"
                  className="w-full h-11 px-3.5 rounded-lg bg-surface-container-low border border-surface-container outline-none text-sm text-on-surface"
                />
              </div>
              {recoveryNotice && (
                <div className="p-3 rounded-lg bg-secondary/15 border border-secondary/30 text-secondary text-xs font-semibold">
                  {recoveryNotice}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setRecoveryNotice('Emergency reset token dispatched to authorized organizer email.');
                  setTimeout(() => {
                    setRecoveryNotice('');
                    setAuthView('login');
                  }, 2500);
                }}
                className="w-full h-11 rounded-lg bg-primary text-on-primary font-semibold text-sm cursor-pointer"
              >
                DISPATCH RESET TOKEN
              </button>
              <button
                type="button"
                onClick={() => setAuthView('login')}
                className="w-full h-10 text-xs text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          )}

          {/* REGISTER */}
          {authView === 'register' && (
            <div className="space-y-4">
              <GoogleAuthButton
                mode="register"
                role="camp_organizer"
                onGoogleSuccess={handleGoogleSuccess}
              />

              {extractedGoogleDetails && (
                <GoogleDetailsBanner
                  details={extractedGoogleDetails}
                  onDismiss={() => setExtractedGoogleDetails(null)}
                />
              )}

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  or complete organizer registration
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                {regError && (
                  <div className="p-3 rounded-lg bg-error-container text-on-error-container text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Organization Legal / Community Name *
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Apex Memorial Rotary Club &amp; Civic Volunteers"
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-sm text-on-surface"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Organizer Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                  placeholder="e.g. Marcus Sterling"
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-sm text-on-surface"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="marcus@apexrotary.org"
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-sm text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 301-9988"
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-sm text-on-surface"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Registration / Tax ID (Optional)
                </label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="501(c)(3) or Civic Reg #99018"
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-sm text-on-surface"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-sm text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-sm text-on-surface"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  className="w-full h-11 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-semibold text-sm shadow-xs transition-colors cursor-pointer"
                >
                  REGISTER ORGANIZER
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthView('login');
                    setRegError('');
                  }}
                  className="w-full h-10 text-xs text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          </div>
        )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: VERIFICATION PENDING OR REJECTED STATE
  // -------------------------------------------------------------
  const organizerStatus =
    currentOrganizer.status ||
    (currentUser?.role === 'blood_camp' ? currentUser.verification_status : 'Verified');

  if (organizerStatus === 'Verification Pending' || organizerStatus === 'Pending' || organizerStatus === 'Rejected') {
    return (
      <div className="w-full max-w-3xl mx-auto py-10 px-4 space-y-6">
        <BloodLinkVerificationCard
          role="blood_camp"
          userName={currentOrganizer.organizationName || currentOrganizer.organizerName}
          userEmail={currentOrganizer.email}
          userPhone={currentOrganizer.phone}
          verificationStatus={organizerStatus === 'Rejected' ? 'Rejected' : 'Pending'}
          roleDetails={[
            { label: 'Community Org', value: currentOrganizer.organizationName },
            { label: 'Lead Coordinator', value: currentOrganizer.organizerName },
            { label: 'Tax / NGO Reg ID', value: currentOrganizer.taxOrRegId || 'NGO-501C-Verified' },
            { label: 'Camp Authorization', value: 'City Health Commissioner Endorsement' }
          ]}
          onSignOut={logoutOrganizer}
          onQuickVerify={async () => {
            await updateVerificationStatus('blood_camp', currentOrganizer.phone, 'Verified');
          }}
          onQuickReject={async () => {
            await updateVerificationStatus('blood_camp', currentOrganizer.phone, 'Rejected');
          }}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: BLOOD CAMP DASHBOARD (When signed in and verified)
  // -------------------------------------------------------------
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {successMsg && (
        <div className="p-4 rounded-xl bg-secondary/15 text-secondary border border-secondary/30 text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Top Header Deck */}
      <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <CalendarDays className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
              Community Blood Drive Desk
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-on-surface mt-0.5">
              {currentOrganizer.organizationName}
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Lead Coordinator: {currentOrganizer.organizerName} • Contact: {currentOrganizer.phone}
            </p>
          </div>
        </div>

        {/* Create Camp Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('create')}
            className="px-5 py-3 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-sm shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>CREATE BLOOD CAMP</span>
          </button>

          <button
            onClick={logoutOrganizer}
            className="p-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Subnav Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-container overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all cursor-pointer ${
            activeTab === 'upcoming'
              ? 'bg-surface-container-lowest text-primary border-b-2 border-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Upcoming Camps ({camps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all cursor-pointer ${
            activeTab === 'create'
              ? 'bg-surface-container-lowest text-primary border-b-2 border-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Create Blood Camp</span>
        </button>

        <button
          onClick={() => setActiveTab('attendees')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all cursor-pointer ${
            activeTab === 'attendees'
              ? 'bg-surface-container-lowest text-primary border-b-2 border-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Registrations / Attendees ({campRegistrations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-surface-container-lowest text-primary border-b-2 border-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Camp History</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-surface-container-lowest text-primary border-b-2 border-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile</span>
        </button>
      </div>

      {/* TAB: UPCOMING CAMPS */}
      {activeTab === 'upcoming' && (
        <div className="space-y-4">
          {camps.length === 0 ? (
            /* Clean Empty State as mandated */
            <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mx-auto mb-3">
                <CalendarDays className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-on-surface">No upcoming blood camps.</h3>
              <p className="text-sm text-on-surface-variant max-w-sm mx-auto mt-1 mb-5">
                Mobilize donors in colleges, civic centers, or corporate campuses by scheduling a donation drive.
              </p>
              <button
                onClick={() => setActiveTab('create')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule First Camp</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {camps.map((camp) => (
                <div
                  key={camp.id}
                  className="bg-surface-container-lowest border border-surface-container rounded-2xl p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                        {camp.city}
                      </span>
                      <span className="text-xs font-semibold text-secondary">
                        {camp.registeredCount} / {camp.registrationLimit} Registered
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-on-surface">{camp.name}</h3>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{camp.description}</p>

                    <div className="mt-4 space-y-1.5 text-xs text-on-surface-variant">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>
                          {camp.date} • {camp.startTime} - {camp.endTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>
                          {camp.venue}, {camp.address}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>Coordinator: {camp.contact}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-surface-container flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant">Status: Active Booking</span>
                    <button
                      onClick={() => setActiveTab('attendees')}
                      className="text-primary font-semibold hover:underline cursor-pointer"
                    >
                      View Attendee List ({campRegistrations.filter((r) => r.campId === camp.id).length})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: CREATE BLOOD CAMP */}
      {activeTab === 'create' && (
        <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-bold text-on-surface">Schedule New Blood Camp</h3>
            <p className="text-xs text-on-surface-variant">
              Once submitted, the drive is immediately published to voluntary donors in the area.
            </p>
          </div>

          <form onSubmit={handleCreateCamp} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                Camp Title / Name *
              </label>
              <input
                type="text"
                required
                value={campName}
                onChange={(e) => setCampName(e.target.value)}
                placeholder="e.g. Apex Memorial Civic Center Drive"
                className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Camp Date *
                </label>
                <input
                  type="date"
                  required
                  value={campDate}
                  onChange={(e) => setCampDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface"
                />
              </div>
              <div>
                <label className="block font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Start Time *
                </label>
                <input
                  type="text"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="09:00 AM"
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface"
                />
              </div>
              <div>
                <label className="block font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  End Time *
                </label>
                <input
                  type="text"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="04:30 PM"
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Venue Name *
                </label>
                <input
                  type="text"
                  required
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="Auditorium Hall B, Metro Central"
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface"
                />
              </div>
              <div>
                <label className="block font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Physical Address *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="100 Grand Boulevard, Wing B"
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Metro Central"
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface"
                />
              </div>
              <div>
                <label className="block font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="+1 (555) 301-9988"
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface"
                />
              </div>
              <div>
                <label className="block font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Donor Capacity Limit *
                </label>
                <input
                  type="number"
                  min={10}
                  max={1000}
                  required
                  value={regLimit}
                  onChange={(e) => setRegLimit(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                Camp Description &amp; Instructions *
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Civic donation initiative with dedicated pediatric &amp; trauma reserve collection."
                className="w-full p-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface outline-none focus:border-primary"
              />
            </div>

            <div className="pt-3 border-t border-surface-container flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('upcoming')}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-xs cursor-pointer"
              >
                CREATE BLOOD CAMP
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB: REGISTRATIONS / ATTENDEES */}
      {activeTab === 'attendees' && (
        <div className="space-y-4">
          {campRegistrations.length === 0 ? (
            /* Clean Empty State as mandated */
            <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mx-auto mb-3">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-on-surface">No donor registrations yet.</h3>
              <p className="text-sm text-on-surface-variant max-w-sm mx-auto mt-1">
                When voluntary donors book an appointment slot for your upcoming camps, their details will appear here.
              </p>
            </div>
          ) : (
            <div className="bg-surface-container-lowest border border-surface-container rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-surface-container flex items-center justify-between">
                <span className="text-sm font-bold text-on-surface">Confirmed Donor Appointments</span>
                <span className="text-xs text-on-surface-variant">
                  Total Registrations: {campRegistrations.length}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low text-on-surface-variant uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3">Registration ID</th>
                      <th className="px-4 py-3">Camp Title</th>
                      <th className="px-4 py-3">Donor Name</th>
                      <th className="px-4 py-3">Blood Group</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Slot Time</th>
                      <th className="px-4 py-3">Registered At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {campRegistrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-surface-container-low/50">
                        <td className="px-4 py-3 font-mono font-bold text-on-surface">{reg.id}</td>
                        <td className="px-4 py-3 font-semibold text-on-surface">{reg.campName}</td>
                        <td className="px-4 py-3 text-on-surface">{reg.donorName}</td>
                        <td className="px-4 py-3 font-bold text-primary">{reg.donorBloodGroup}</td>
                        <td className="px-4 py-3 text-on-surface-variant">{reg.donorPhone}</td>
                        <td className="px-4 py-3 text-on-surface-variant">{reg.slotTime}</td>
                        <td className="px-4 py-3 text-on-surface-variant">{reg.registeredAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: CAMP HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mx-auto mb-3">
            <History className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-on-surface">No past camps recorded.</h3>
          <p className="text-sm text-on-surface-variant max-w-sm mx-auto mt-1">
            Archived records and post-camp collection totals will be catalogued here after drive completion.
          </p>
        </div>
      )}

      {/* TAB: PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-bold text-on-surface">Organizer Profile Details</h3>
            <p className="text-xs text-on-surface-variant">Community organization credentials and liaison details.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container/60">
              <span className="text-xs text-on-surface-variant block">Organization Name</span>
              <span className="font-semibold text-on-surface mt-0.5 block">{currentOrganizer.organizationName}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container/60">
              <span className="text-xs text-on-surface-variant block">Coordinator Name</span>
              <span className="font-semibold text-on-surface mt-0.5 block">{currentOrganizer.organizerName}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container/60">
              <span className="text-xs text-on-surface-variant block">Contact Email</span>
              <span className="font-semibold text-on-surface mt-0.5 block">{currentOrganizer.email}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container/60">
              <span className="text-xs text-on-surface-variant block">Contact Phone</span>
              <span className="font-semibold text-on-surface mt-0.5 block">{currentOrganizer.phone}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
