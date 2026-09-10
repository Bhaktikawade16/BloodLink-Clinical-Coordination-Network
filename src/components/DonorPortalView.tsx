import React, { useState, useEffect } from 'react';
import { BloodGroup } from '../types';
import { useBloodLink } from '../context/BloodLinkContext';
import { CampCard } from './CampCard';
import { DonorRewardsView } from './DonorRewardsView';
import { BloodLinkVerificationCard } from './BloodLinkVerificationCard';
import { GoogleAuthButton } from './GoogleAuthButton';
import { GoogleDetailsBanner } from './GoogleDetailsBanner';
import {
  Heart,
  Calendar,
  Bell,
  User,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Gift,
  Award,
  Sparkles,
  Shirt,
  Coffee,
  AlertTriangle,
  Building2
} from 'lucide-react';

export const DonorPortalView: React.FC = () => {
  const {
    currentDonor,
    loginDonor,
    logoutDonor,
    registerDonor,
    updateDonorAvailability,
    camps,
    campRegistrations,
    registerForCamp,
    notifications,
    activeRequests,
    currentUser,
    loginUser,
    loginWithGoogle,
    registerUser,
    updateVerificationStatus
  } = useBloodLink();

  // Screen state when not logged in: 'login' | 'register' | 'forgot'
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot'>('login');

  // Google & Gmail Extracted Details State
  const [extractedGoogleDetails, setExtractedGoogleDetails] = useState<any | null>(null);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState<number | ''>(28);
  const [gender, setGender] = useState('Female');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [lastDonationDate, setLastDonationDate] = useState('');
  const [donationCount, setDonationCount] = useState<number | ''>(0);
  const [isAvailable, setIsAvailable] = useState(true);
  const [regError, setRegError] = useState('');

  const handleGoogleSuccess = async (data: {
    extracted: any;
    isExistingUser: boolean;
    existingUserData?: any;
  }) => {
    if (data.isExistingUser) {
      const res = await loginWithGoogle({
        email: data.extracted.email,
        name: data.extracted.name,
        role: 'donor'
      });
      if (!res.success) {
        setLoginError(res.error || 'Unable to log in with Google account.');
      }
    } else {
      setExtractedGoogleDetails(data.extracted);
      setFullName(data.extracted.name || '');
      setEmail(data.extracted.email || '');
      if (data.extracted.phone) setPhone(data.extracted.phone);
      if (data.extracted.city) setCity(data.extracted.city);
      if (data.extracted.bloodGroup && bloodGroups.includes(data.extracted.bloodGroup as any)) {
        setBloodGroup(data.extracted.bloodGroup as any);
      }
      if (!password) {
        const autoPass = `Donor@${data.extracted.email.split('@')[0]}2026`;
        setPassword(autoPass);
        setConfirmPassword(autoPass);
      }
      setAuthView('register');
    }
  };

  // Dashboard active tab: 'camps' | 'rewards' | 'requests' | 'history' | 'notifications' | 'profile'
  const [activeTab, setActiveTab] = useState<'camps' | 'rewards' | 'requests' | 'history' | 'notifications' | 'profile'>('camps');

  // Campaign monthly filter: 'all' | 'this-month'
  const [campMonthFilter, setCampMonthFilter] = useState<'all' | 'this-month'>('all');

  // Slot registration dialog
  const [bookingCampId, setBookingCampId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState('10:00 AM - 11:00 AM');
  const [selectedTshirtSize, setSelectedTshirtSize] = useState('L');
  const [selectedSnack, setSelectedSnack] = useState('Gourmet High-Protein Box');
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  // Listen to cross-component tab triggers (e.g. from Sidebar)
  useEffect(() => {
    const handleTabChange = (e: any) => {
      if (e.detail && ['camps', 'rewards', 'requests', 'history', 'notifications', 'profile'].includes(e.detail)) {
        setActiveTab(e.detail);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('bloodlink:set-donor-tab' as any, handleTabChange);
    return () => window.removeEventListener('bloodlink:set-donor-tab' as any, handleTabChange);
  }, []);

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginIdentifier.trim()) {
      setLoginError('Please enter your email or phone number.');
      return;
    }
    const res = await loginUser(loginIdentifier, loginPassword, 'donor');
    if (!res.success) {
      const fallback = loginDonor(loginIdentifier);
      if (!fallback) {
        setLoginError(res.error || 'No donor account found with this email or phone. Please register.');
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
    if (!age || age < 18) {
      setRegError('Donors must be at least 18 years of age.');
      return;
    }

    const res = await registerUser({
      role: 'donor',
      name: fullName,
      email,
      phone,
      password,
      city: city || 'Metro City',
      area: area || 'Central',
      blood_group: bloodGroup,
      gender,
      age: Number(age),
      date_of_birth: new Date(Date.now() - Number(age) * 365.25 * 86400000).toISOString().split('T')[0],
      last_donation_date: lastDonationDate || null,
      donation_count: Number(donationCount) || 0,
      weight_kg: 65,
      is_available: isAvailable
    });

    if (!res.success) {
      setRegError(res.error || 'Registration failed. Please check your inputs.');
    }
  };

  const handleConfirmSlotBooking = (campId: string) => {
    if (!currentDonor) return;
    if (currentDonor.verificationStatus !== 'Verified') {
      alert('Verification required: Only verified donors can reserve camp slots.');
      return;
    }
    const ok = registerForCamp(
      campId,
      currentDonor.fullName,
      currentDonor.phone,
      currentDonor.bloodGroup,
      selectedSlot,
      selectedTshirtSize,
      selectedSnack
    );
    if (ok) {
      setBookingSuccess(`🎉 Registration Confirmed! Your ${selectedTshirtSize} Hero Tee & ${selectedSnack} are reserved. Your Hero Pass is ready below!`);
      setBookingCampId(null);
      setActiveTab('rewards');
      setTimeout(() => setBookingSuccess(null), 6000);
    }
  };

  // -------------------------------------------------------------
  // AUTHENTICATION VIEW (If no donor is currently signed in)
  // -------------------------------------------------------------
  if (!currentDonor) {
    return (
      <div className="w-full max-w-xl mx-auto py-10 px-4">
        {/* Card Container */}
        <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6 sm:p-8 shadow-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
              <Heart className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
              Welcome, donor.
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              {authView === 'login'
                ? 'Sign in to access your donation dashboard and mobile camps.'
                : authView === 'register'
                ? 'Register to join the verified voluntary donor directory.'
                : 'Recover access to your donor account.'}
            </p>
          </div>

          {/* LOGIN FORM */}
          {authView === 'login' && (
            <div className="space-y-4">
              <GoogleAuthButton
                mode="login"
                role="donor"
                onGoogleSuccess={handleGoogleSuccess}
              />

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  or continue with credentials
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
                    Email or Phone Number
                  </label>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="name@example.com or (555) 000-0000"
                    className="w-full h-11 px-3.5 rounded-lg bg-surface-container-low border border-surface-container focus:border-primary focus:bg-surface-container-lowest outline-none text-sm text-on-surface transition-all"
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
                  className="w-full h-11 px-3.5 rounded-lg bg-surface-container-low border border-surface-container focus:border-primary focus:bg-surface-container-lowest outline-none text-sm text-on-surface transition-all"
                />
              </div>

              <div className="pt-2 space-y-2.5">
                <button
                  type="submit"
                  className="w-full h-11 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-semibold text-sm shadow-xs transition-colors cursor-pointer"
                >
                  SIGN IN
                </button>

                {/* Quick login with Railway Database Donor */}
                <button
                  type="button"
                  onClick={() => {
                    setLoginIdentifier('9999999999');
                    setLoginPassword('donor123');
                    loginDonor('9999999999');
                  }}
                  className="w-full py-2 px-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-800 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>Quick Sign In: Test User (O+, 9999999999)</span>
                  <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded font-mono">Railway DB</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthView('register');
                    setLoginError('');
                  }}
                  className="w-full h-11 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-sm transition-colors cursor-pointer"
                >
                  CREATE DONOR ACCOUNT
                </button>
              </div>
            </form>
          </div>
        )}

          {/* FORGOT PASSWORD */}
          {authView === 'forgot' && (
            <div className="space-y-4">
              <p className="text-sm text-on-surface-variant">
                Enter your registered email address and we will dispatch a verification PIN to reset your password.
              </p>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Registered Email
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="w-full h-11 px-3.5 rounded-lg bg-surface-container-low border border-surface-container focus:border-primary outline-none text-sm text-on-surface"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  alert('Password recovery link dispatched.');
                  setAuthView('login');
                }}
                className="w-full h-11 rounded-lg bg-primary text-on-primary font-semibold text-sm cursor-pointer"
              >
                DISPATCH RESET PIN
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

          {/* REGISTER FORM */}
          {authView === 'register' && (
            <div className="space-y-4">
              <GoogleAuthButton
                mode="register"
                role="donor"
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
                  or complete registration details
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
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Elena Rostova"
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
                    placeholder="elena@example.com"
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-sm text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 019-2834"
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-sm text-on-surface"
                  />
                </div>
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

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                    Age *
                  </label>
                  <input
                    type="number"
                    min={18}
                    max={75}
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-sm text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                    Gender *
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-sm text-on-surface"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                    Blood Group *
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-sm text-on-surface font-bold text-primary"
                  >
                    {bloodGroups.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Springfield"
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-sm text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                    Area / Locality *
                  </label>
                  <input
                    type="text"
                    required
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. Westside"
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-sm text-on-surface"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                    Last Donation Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={lastDonationDate}
                    onChange={(e) => setLastDonationDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-sm text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                    Donation Count (Optional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={donationCount}
                    onChange={(e) => setDonationCount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-sm text-on-surface"
                  />
                </div>
              </div>

              {/* Availability Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low border border-surface-container">
                <div>
                  <span className="block text-xs font-semibold text-on-surface">
                    Initial Availability Status
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    {isAvailable ? 'Available for donation calls' : 'Temporarily unavailable'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAvailable(!isAvailable)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                    isAvailable
                      ? 'bg-secondary text-on-secondary'
                      : 'bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  {isAvailable ? 'Available' : 'Unavailable'}
                </button>
              </div>

              {/* Medical Disclaimer */}
              <div className="p-3 rounded-lg bg-surface-container-low border border-surface-container flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  <strong>Medical Disclaimer:</strong> Final donor eligibility is determined by qualified medical personnel at the donation site.
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  className="w-full h-11 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-semibold text-sm shadow-xs transition-colors cursor-pointer"
                >
                  REGISTER AS DONOR
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
  // VERIFICATION CARD (If donor is Pending or Rejected)
  // -------------------------------------------------------------
  if (currentDonor.verificationStatus === 'Pending' || currentDonor.verificationStatus === 'Rejected') {
    return (
      <div className="w-full max-w-3xl mx-auto py-8 px-4 space-y-6">
        <BloodLinkVerificationCard
          role="donor"
          userName={currentDonor.fullName}
          userEmail={currentDonor.email}
          userPhone={currentDonor.phone}
          verificationStatus={currentDonor.verificationStatus}
          eligibilityStatus={currentDonor.eligibilityStatus}
          roleDetails={[
            { label: 'Blood Group', value: currentDonor.bloodGroup },
            { label: 'City & District', value: `${currentDonor.city} (${currentDonor.area || 'Metro Area'})` },
            { label: 'Age & Gender', value: `${currentDonor.age || 26} yrs • ${currentDonor.gender || 'Not specified'}` },
            { label: 'Donation History', value: `${currentDonor.donationCount || 0} donations • Last: ${currentDonor.lastDonationDate || 'None recorded'}` }
          ]}
          onSignOut={logoutDonor}
          onQuickVerify={async () => {
            await updateVerificationStatus('donor', currentDonor.phone, 'Verified');
          }}
          onQuickReject={async () => {
            await updateVerificationStatus('donor', currentDonor.phone, 'Rejected');
          }}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // DONOR DASHBOARD (When signed in and verified)
  // -------------------------------------------------------------
  const donorRegisteredCamps = campRegistrations.filter((r) => r.donorPhone === currentDonor.phone || r.donorName === currentDonor.fullName);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Medical Disclaimer Banner */}
      <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container flex items-center justify-between gap-3 text-xs text-on-surface-variant">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-secondary shrink-0" />
          <span>
            <strong>Medical Notice:</strong> Final donor eligibility is determined by qualified medical personnel at the donation site.
          </span>
        </div>
        <button
          onClick={logoutDonor}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium cursor-pointer transition-colors shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {bookingSuccess && (
        <div className="p-4 rounded-xl bg-secondary/15 text-secondary border border-secondary/30 text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{bookingSuccess}</span>
        </div>
      )}

      {/* Header Profile Summary */}
      <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
              Voluntary Donor Account
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-on-surface mt-0.5">
              Welcome, {currentDonor.fullName}
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Donor ID: {currentDonor.id} • {currentDonor.city}, {currentDonor.area}
            </p>
          </div>

          {/* Availability Toggle */}
          <div className="flex flex-col sm:items-end gap-2">
            <span className="text-xs font-semibold text-on-surface-variant">Emergency Availability Status</span>
            <div className="inline-flex rounded-xl bg-surface-container-low p-1 border border-surface-container gap-1">
              <button
                type="button"
                onClick={() => updateDonorAvailability(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentDonor.isAvailable
                    ? 'bg-secondary text-on-secondary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Available for emergency blood donation
              </button>
              <button
                type="button"
                onClick={() => updateDonorAvailability(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !currentDonor.isAvailable
                    ? 'bg-surface-container-highest text-on-surface shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Not available for emergency blood donation
              </button>
            </div>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-surface-container/60">
          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container/60">
            <span className="text-xs font-medium text-on-surface-variant block">Blood Group</span>
            <span className="text-2xl font-bold text-primary mt-1 block">
              {currentDonor.bloodGroup}
            </span>
            <span className="text-xs text-on-surface-variant mt-0.5 block">Verified Marker</span>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container/60">
            <span className="text-xs font-medium text-on-surface-variant block">Availability Status</span>
            <span className={`text-sm font-bold mt-2 block ${currentDonor.isAvailable ? 'text-secondary' : 'text-on-surface-variant'}`}>
              {currentDonor.isAvailable ? 'Available' : 'Temporarily Unavailable'}
            </span>
            <span className="text-xs text-on-surface-variant mt-0.5 block">Status Live</span>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container/60">
            <span className="text-xs font-medium text-on-surface-variant block">Last Donation</span>
            <span className="text-sm font-bold text-on-surface mt-2 block">
              {currentDonor.lastDonationDate || 'None recorded'}
            </span>
            <span className="text-xs text-on-surface-variant mt-0.5 block">Clinical Cooldown</span>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container/60">
            <span className="text-xs font-medium text-on-surface-variant block">Total Donations</span>
            <span className="text-2xl font-bold text-on-surface mt-1 block">
              {currentDonor.donationCount}
            </span>
            <span className="text-xs text-on-surface-variant mt-0.5 block">Contributions</span>
          </div>
        </div>
      </div>

      {/* Main Options Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-container overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('camps')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'camps'
              ? 'bg-surface-container-lowest text-primary border-b-2 border-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Exciting Blood Camps ({camps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rewards')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'rewards'
              ? 'bg-surface-container-lowest text-primary border-b-2 border-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Gift className="w-4 h-4 text-emerald-600" />
          <span>My Freebies &amp; Passes ({donorRegisteredCamps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'requests'
              ? 'bg-surface-container-lowest text-primary border-b-2 border-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-primary" />
          <span>Emergency Calls ({activeRequests.filter(r => (r.urgency === 'CRITICAL' || r.urgency === 'URGENT') && (r.bloodGroup === currentDonor.bloodGroup || currentDonor.bloodGroup === 'O-')).length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-surface-container-lowest text-primary border-b-2 border-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Donation History ({donorRegisteredCamps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'notifications'
              ? 'bg-surface-container-lowest text-primary border-b-2 border-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifications ({notifications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-surface-container-lowest text-primary border-b-2 border-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile</span>
        </button>
      </div>

      {/* TAB: FIND BLOOD CAMPS */}
      {activeTab === 'camps' && (() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonthNumber = String(now.getMonth() + 1).padStart(2, '0');
        const currentYearMonth = `${currentYear}-${currentMonthNumber}`;
        const currentMonthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

        const displayedCamps = camps.filter((camp) => {
          if (campMonthFilter === 'this-month') {
            return camp.date.startsWith(currentYearMonth) || camp.date.includes(now.toLocaleString('default', { month: 'short' }));
          }
          return true;
        });

        return (
          <div className="space-y-6">
            {/* Filter Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-surface-container-lowest border border-surface-container rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-on-surface-variant">Filter Campaigns:</span>
                <div className="inline-flex rounded-lg bg-surface-container-low p-0.5 border border-surface-container text-xs">
                  <button
                    type="button"
                    onClick={() => setCampMonthFilter('all')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                      campMonthFilter === 'all'
                        ? 'bg-surface-container-lowest text-primary shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    All Drives ({camps.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCampMonthFilter('this-month')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                      campMonthFilter === 'this-month'
                        ? 'bg-surface-container-lowest text-primary shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Happening This Month ({currentMonthName})
                  </button>
                </div>
              </div>

              <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active Community Drives with Freebie Packages</span>
              </div>
            </div>

            {displayedCamps.length === 0 ? (
              <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-12 text-center">
                <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mx-auto mb-3">
                  <Calendar className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-on-surface">No upcoming blood camps found.</h3>
                <p className="text-sm text-on-surface-variant max-w-sm mx-auto mt-1">
                  {campMonthFilter === 'this-month'
                    ? `There are no campaigns scheduled during ${currentMonthName}. Switch to view all upcoming campaigns.`
                    : 'There are currently no active donation drives scheduled in your vicinity. Check back soon.'}
                </p>
                {campMonthFilter === 'this-month' && (
                  <button
                    type="button"
                    onClick={() => setCampMonthFilter('all')}
                    className="mt-4 px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold cursor-pointer"
                  >
                    Show All Upcoming Campaigns
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayedCamps.map((camp) => {
                  const isRegistered = donorRegisteredCamps.some((r) => r.campId === camp.id);
                  return (
                    <CampCard
                      key={camp.id}
                      camp={camp}
                      isRegistered={isRegistered}
                      onBook={(id) => setBookingCampId(id)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* TAB: REWARDS & GIFTS */}
      {activeTab === 'rewards' && <DonorRewardsView />}

      {/* TAB: EMERGENCY CALLS (Patient Blood Requests) */}
      {activeTab === 'requests' && (() => {
        const urgentRequests = activeRequests.filter(
          (r) => (r.urgency === 'CRITICAL' || r.urgency === 'URGENT') && (r.bloodGroup === currentDonor.bloodGroup || currentDonor.bloodGroup === 'O-')
        );

        return (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-on-surface">
                  Urgent Regional Hospital Requisitions for Group {currentDonor.bloodGroup}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                  These verified clinical facilities currently have patients awaiting compatible blood transfusions. If you are eligible and available, please respond directly to support hospital repositories.
                </p>
              </div>
            </div>

            {urgentRequests.length === 0 ? (
              <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                <h4 className="text-base font-bold text-on-surface">No immediate emergency hospital calls.</h4>
                <p className="text-xs text-on-surface-variant max-w-md mx-auto mt-1">
                  Local blood repositories are currently meeting baseline targets. Join an exciting blood donation camp above to keep reserves well-stocked!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {urgentRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-5 rounded-2xl bg-surface-container-lowest border border-red-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white uppercase">
                          {req.urgency}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface-container text-on-surface">
                          Group: <strong className="text-primary">{req.bloodGroup}</strong>
                        </span>
                        <span className="text-xs text-on-surface-variant">
                          Units Needed: {req.units} ({req.component})
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-on-surface flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        <span>{req.hospitalName}</span>
                      </h4>
                      <p className="text-xs text-on-surface-variant">
                        Patient Case: {req.patientDiagnosis || req.patientId || 'Trauma / Surgical Care'} • Location: {req.location || 'Regional Clinical Center'} • Requested: {req.timestamp}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          alert(`Contacting ${req.hospitalName} dispatch desk. Thank you for your willingness to donate!`);
                        }}
                        className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Respond to Hospital</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* TAB: DONATION HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {donorRegisteredCamps.length === 0 ? (
            <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mx-auto mb-3">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-on-surface">No donation history yet.</h3>
              <p className="text-sm text-on-surface-variant max-w-sm mx-auto mt-1">
                Your past and scheduled blood camp appointments will be recorded here.
              </p>
            </div>
          ) : (
            <div className="bg-surface-container-lowest border border-surface-container rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-surface-container font-semibold text-sm text-on-surface flex items-center justify-between">
                <span>Scheduled Appointments &amp; Registrations</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('rewards')}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  View Digital Passes →
                </button>
              </div>
              <div className="divide-y divide-surface-container">
                {donorRegisteredCamps.map((reg) => (
                  <div key={reg.id} className="p-4 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-on-surface">{reg.campName}</span>
                      <span className="block text-xs text-on-surface-variant mt-0.5">
                        Slot: {reg.slotTime} • Registered: {reg.registeredAt} • Pass: {reg.voucherCode || 'ACTIVE'}
                      </span>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-secondary/10 text-secondary font-semibold">
                      Confirmed
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mx-auto mb-3">
                <Bell className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-on-surface">No notifications.</h3>
              <p className="text-sm text-on-surface-variant max-w-sm mx-auto mt-1">
                Emergency regional alerts or camp updates will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 rounded-xl border bg-surface-container-lowest flex items-start justify-between gap-3 ${
                    notif.isUrgent ? 'border-primary/50' : 'border-surface-container'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-on-surface">{notif.title}</h4>
                      {notif.isUrgent && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-primary text-on-primary">
                          Urgent
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant">{notif.message}</p>
                  </div>
                  <span className="text-xs text-on-surface-variant whitespace-nowrap">{notif.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-bold text-on-surface">Donor Profile Details</h3>
            <p className="text-xs text-on-surface-variant">Review your contact and clinical eligibility markers.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container/60">
              <span className="text-xs text-on-surface-variant block">Full Legal Name</span>
              <span className="font-semibold text-on-surface mt-0.5 block">{currentDonor.fullName}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container/60">
              <span className="text-xs text-on-surface-variant block">Blood Group</span>
              <span className="font-bold text-primary mt-0.5 block">{currentDonor.bloodGroup}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container/60">
              <span className="text-xs text-on-surface-variant block">Email</span>
              <span className="font-semibold text-on-surface mt-0.5 block">{currentDonor.email}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container/60">
              <span className="text-xs text-on-surface-variant block">Phone</span>
              <span className="font-semibold text-on-surface mt-0.5 block">{currentDonor.phone}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container/60">
              <span className="text-xs text-on-surface-variant block">Age &amp; Gender</span>
              <span className="font-semibold text-on-surface mt-0.5 block">
                {currentDonor.age} years • {currentDonor.gender}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container/60">
              <span className="text-xs text-on-surface-variant block">City &amp; Area</span>
              <span className="font-semibold text-on-surface mt-0.5 block">
                {currentDonor.city}, {currentDonor.area}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ENHANCED SLOT & FREEBIE SELECTION MODAL */}
      {bookingCampId && (() => {
        const targetCamp = camps.find((c) => c.id === bookingCampId);
        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 my-8">
              <div>
                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-primary uppercase tracking-wider mb-1">
                  <Gift className="w-3.5 h-3.5" />
                  <span>Exclusive Participation Freebies Included</span>
                </div>
                <h3 className="text-xl font-bold text-on-surface">
                  Register for {targetCamp?.name || 'Blood Donation Drive'}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Reserve your appointment slot and customize your complimentary gift pack.
                </p>
              </div>

              {/* Step 1: Select Appointment Slot */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-on-surface">
                  1. Choose Arrival Time Window
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {['09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM', '01:00 PM - 02:00 PM', '02:00 PM - 03:00 PM', '03:00 PM - 04:00 PM'].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold cursor-pointer transition-all ${
                        selectedSlot === slot
                          ? 'border-primary bg-primary/10 text-primary shadow-2xs'
                          : 'border-surface-container bg-surface-container-low text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Choose T-Shirt Size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <Shirt className="w-4 h-4 text-primary" />
                    <span>2. Select "LifeSaver Hero" Dri-Fit Tee Size (Free Gift)</span>
                  </label>
                  <span className="text-[11px] text-emerald-600 font-bold">100% Complimentary</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {['S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedTshirtSize(size)}
                      className={`py-2 rounded-xl border text-center text-xs font-bold cursor-pointer transition-all ${
                        selectedTshirtSize === size
                          ? 'border-primary bg-primary text-on-primary shadow-xs'
                          : 'border-surface-container bg-surface-container-low text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Choose Recovery Snack Pack */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <Coffee className="w-4 h-4 text-primary" />
                    <span>3. Choose Post-Donation Gourmet Snack Kit</span>
                  </label>
                  <span className="text-[11px] text-emerald-600 font-bold">Included</span>
                </div>
                <div className="space-y-1.5">
                  {[
                    { id: 'Gourmet High-Protein Box', label: 'Gourmet High-Protein Box (Boiled Egg / Paneer, Trail Mix, Fresh Juice)' },
                    { id: 'Nut & Fruit Power Pack', label: 'Nut & Fruit Power Pack (Dried Figs, Almonds, Electrolyte Drink)' },
                    { id: 'Clinical Electrolyte Kit', label: 'Clinical Electrolyte Kit (Glucose Cookies, Citrus Juice, Energy Bar)' }
                  ].map((snack) => (
                    <button
                      key={snack.id}
                      type="button"
                      onClick={() => setSelectedSnack(snack.id)}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs font-medium cursor-pointer transition-all ${
                        selectedSnack === snack.id
                          ? 'border-primary bg-primary/10 text-primary font-semibold shadow-2xs'
                          : 'border-surface-container bg-surface-container-low text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      {snack.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Perk Summary Preview */}
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs space-y-1 text-emerald-950">
                <span className="font-bold flex items-center gap-1 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Instant Perks Reserved:</span>
                </span>
                <p className="text-[11px] text-emerald-900 leading-relaxed">
                  Size <strong>{selectedTshirtSize}</strong> Hero Tee + <strong>{selectedSnack}</strong> + Free 5-Point Health Screen ($65 Value) + Certificate of Honor.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setBookingCampId(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmSlotBooking(bookingCampId)}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Gift className="w-4 h-4" />
                  <span>Confirm &amp; Generate Hero Pass</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
