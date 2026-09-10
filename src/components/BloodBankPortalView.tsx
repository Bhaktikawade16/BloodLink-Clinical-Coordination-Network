import React, { useState } from 'react';
import { BloodGroup, BloodComponent, BloodUnit, RequisitionStatus } from '../types';
import { useBloodLink } from '../context/BloodLinkContext';
import { BloodLinkVerificationCard } from './BloodLinkVerificationCard';
import { GoogleAuthButton } from './GoogleAuthButton';
import { GoogleDetailsBanner } from './GoogleDetailsBanner';
import {
  Database,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  Building2,
  Trash2,
  User,
  LogOut,
  UploadCloud,
  Layers,
  Activity,
  PackageCheck,
  Truck,
  AlertTriangle,
  Check
} from 'lucide-react';

export const BloodBankPortalView: React.FC = () => {
  const {
    bloodBanks,
    currentBloodBank,
    loginBloodBank,
    logoutBloodBank,
    registerBloodBank,
    approveEntity,
    inventory,
    addBloodUnit,
    removeBloodUnit,
    toggleUnitStatus,
    activeRequests,
    updateRequestStatus,
    acceptHospitalRequest,
    rejectHospitalRequest,
    allocateUnitsForRequest,
    dispatchBloodSupply,
    loginUser,
    loginWithGoogle,
    registerUser,
    updateVerificationStatus
  } = useBloodLink();

  // Screen auth state: 'login' | 'register' | 'forgot'
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot'>('login');

  // Google & Gmail Extracted Details State
  const [extractedGoogleDetails, setExtractedGoogleDetails] = useState<any | null>(null);

  // Inventory Filter: 'all' | 'expiring-soon' | 'available'
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'expiring-soon' | 'available'>('all');

  // Dispatch Courier Modal
  const [dispatchModalReqId, setDispatchModalReqId] = useState<string | null>(null);
  const [courierTrackingInput, setCourierTrackingInput] = useState('');

  // Login inputs
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Registration inputs
  const [bankName, setBankName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [licenceNumber, setLicenceNumber] = useState('');
  const [certificateDoc, setCertificateDoc] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
        role: 'blood_bank'
      });
      if (!res.success) {
        setLoginError(res.error || 'Unable to log in with Google account.');
      }
    } else {
      setExtractedGoogleDetails(data.extracted);
      setContactPerson(data.extracted.name || '');
      setEmail(data.extracted.email || '');
      if (data.extracted.organization) {
        setBankName(data.extracted.organization);
      } else if (!bankName) {
        setBankName(`${data.extracted.name} Blood Bank`);
      }
      if (data.extracted.phone) setPhone(data.extracted.phone);
      if (data.extracted.city) {
        setCity(data.extracted.city);
        if (!address) setAddress(`${data.extracted.city} Regional Depot`);
      }
      if (!licenceNumber) setLicenceNumber(`BB-LIC-${Math.floor(1000 + Math.random() * 9000)}`);
      if (!password) {
        const autoPass = `Bank@${data.extracted.email.split('@')[0]}2026`;
        setPassword(autoPass);
        setConfirmPassword(autoPass);
      }
      setAuthView('register');
    }
  };

  // Dashboard Tab: 'inventory' | 'requests' | 'history' | 'profile'
  const [activeTab, setActiveTab] = useState<'inventory' | 'requests' | 'history' | 'profile'>('inventory');

  // Add Unit Modal state
  const [addUnitModal, setAddUnitModal] = useState(false);
  const [newGroup, setNewGroup] = useState<BloodGroup>('O+');
  const [newComponent, setNewComponent] = useState<BloodComponent>('Packed Red Blood Cells (PRBC)');
  const [newVolume, setNewVolume] = useState(450);
  const [newCollectionDate, setNewCollectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [newExpiryDate, setNewExpiryDate] = useState(
    new Date(Date.now() + 42 * 86400000).toISOString().split('T')[0]
  );
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const components: BloodComponent[] = [
    'Packed Red Blood Cells (PRBC)',
    'Whole Blood',
    'Platelets (RDP/SDP)',
    'Fresh Frozen Plasma (FFP)',
    'Cryoprecipitate'
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginIdentifier.trim()) {
      setLoginError('Please enter your blood bank email or contact number.');
      return;
    }
    const res = await loginUser(loginIdentifier, loginPassword, 'blood_bank');
    if (!res.success) {
      const fallback = loginBloodBank(loginIdentifier);
      if (!fallback.success) {
        setLoginError(res.error || fallback.message || 'Blood bank not found. Please register.');
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
      role: 'blood_bank',
      name: bankName,
      email,
      phone,
      password,
      city: city || 'Metro City',
      address: address || `${city}, ${state}`,
      license_number: licenceNumber || `LIC-${Date.now()}`
    });

    if (!res.success) {
      setRegError(res.error || 'Registration failed. Please review your inputs.');
    }
  };

  const handleAddUnit = (e: React.FormEvent) => {
    e.preventDefault();
    addBloodUnit({
      bloodGroup: newGroup,
      component: newComponent,
      volume: Number(newVolume),
      collectionDate: newCollectionDate,
      expiryDate: newExpiryDate
    });
    setAddUnitModal(false);
    setSuccessMsg(`1 Unit of ${newGroup} (${newComponent}) catalogued into inventory.`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // -------------------------------------------------------------
  // VIEW: AUTHENTICATION (When no blood bank is signed in)
  // -------------------------------------------------------------
  if (!currentBloodBank) {
    return (
      <div className="w-full max-w-xl mx-auto py-10 px-4">
        <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
              <Database className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
              Welcome, blood bank.
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              {authView === 'login'
                ? 'Sign in to manage cold-chain inventory and respond to hospital requisitions.'
                : authView === 'register'
                ? 'Register your blood repository center for institutional verification.'
                : 'Recover blood bank portal access.'}
            </p>
          </div>

          {/* LOGIN */}
          {authView === 'login' && (
            <div className="space-y-4">
              <GoogleAuthButton
                mode="login"
                role="blood_bank"
                onGoogleSuccess={handleGoogleSuccess}
              />

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  or sign in with bank credentials
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
                    Blood Bank Email or Contact
                  </label>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="contact@bloodcenter.org or (555) 012-3456"
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

                {/* Quick login with Railway Database Blood Bank */}
                <button
                  type="button"
                  onClick={() => {
                    setLoginIdentifier('Sahyadri Blood Bank');
                    setLoginPassword('bank123');
                    loginBloodBank('Sahyadri Blood Bank');
                  }}
                  className="w-full py-2 px-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-800 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>Quick Sign In: Sahyadri Blood Bank</span>
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
                  REGISTER BLOOD BANK
                </button>
              </div>
            </form>
          </div>
        )}

          {/* FORGOT PASSWORD */}
          {authView === 'forgot' && (
            <div className="space-y-4">
              <p className="text-sm text-on-surface-variant">
                Enter your registered blood bank email to receive an audit reset PIN.
              </p>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Registered Email
                </label>
                <input
                  type="email"
                  placeholder="director@bloodcenter.org"
                  className="w-full h-11 px-3.5 rounded-lg bg-surface-container-low border border-surface-container outline-none text-sm text-on-surface"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  alert('Reset PIN dispatched.');
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

          {/* REGISTRATION */}
          {authView === 'register' && (
            <div className="space-y-4">
              <GoogleAuthButton
                mode="register"
                role="blood_bank"
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
                  or complete blood bank registration
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
                  Blood Bank Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. Central Regional Red Cross Transfusion Center"
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-sm text-on-surface"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Authorized Officer / Director *
                </label>
                <input
                  type="text"
                  required
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. Dr. Marianne Cole (Lab Director)"
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-sm text-on-surface"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                    Institutional Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="director@bloodbank.org"
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-sm text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                    Dispatch Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 441-9021"
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-sm text-on-surface"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Address *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="100 Cold Chain Parkway, Suite 400"
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-sm text-on-surface"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Springfield"
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-sm text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="IL"
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-sm text-on-surface"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Blood Bank Licence / Drug Control Reg Number *
                </label>
                <input
                  type="text"
                  required
                  value={licenceNumber}
                  onChange={(e) => setLicenceNumber(e.target.value)}
                  placeholder="BB-LIC-9921-X"
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-sm text-on-surface"
                />
              </div>

              {/* Upload Certificate */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Upload Accreditation Certificate *
                </label>
                <label className="border border-dashed border-surface-container rounded-xl p-4 flex flex-col items-center justify-center text-center bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setCertificateDoc(e.target.files[0].name);
                      }
                    }}
                    className="hidden"
                  />
                  <UploadCloud className="w-6 h-6 text-primary mb-1" />
                  <span className="text-xs font-semibold text-on-surface">
                    {certificateDoc ? `Attached: ${certificateDoc}` : 'Upload NABH or State Blood Bank Accreditation'}
                  </span>
                </label>
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
                  REGISTER BLOOD BANK
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
  if (
    currentBloodBank.status === 'Verification Pending' ||
    (currentBloodBank.status as string) === 'Pending' ||
    currentBloodBank.status === 'Rejected'
  ) {
    return (
      <div className="w-full max-w-3xl mx-auto py-10 px-4 space-y-6">
        <BloodLinkVerificationCard
          role="blood_bank"
          userName={currentBloodBank.name}
          userEmail={currentBloodBank.email}
          userPhone={currentBloodBank.phone}
          verificationStatus={currentBloodBank.status === 'Rejected' ? 'Rejected' : 'Pending'}
          roleDetails={[
            { label: 'Bank Name', value: currentBloodBank.name },
            { label: 'Licence / Accreditation', value: currentBloodBank.licenceNumber },
            { label: 'Nodal Officer', value: currentBloodBank.contactPerson },
            { label: 'Depot Address', value: `${currentBloodBank.address || 'Regional Blood Center'}, ${currentBloodBank.city}` }
          ]}
          onSignOut={logoutBloodBank}
          onQuickVerify={async () => {
            const rawId = currentBloodBank.id.replace('BANK-', '');
            await updateVerificationStatus('blood_bank', rawId, 'Verified');
            approveEntity('blood-bank', currentBloodBank.id);
          }}
          onQuickReject={async () => {
            const rawId = currentBloodBank.id.replace('BANK-', '');
            await updateVerificationStatus('blood_bank', rawId, 'Rejected');
          }}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: BLOOD BANK DASHBOARD (Verified State)
  // -------------------------------------------------------------
  const getDaysUntilExpiry = (expiryDate: string) => {
    const diff = new Date(expiryDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const expiringSoonCount = inventory.filter((u) => {
    const d = getDaysUntilExpiry(u.expiryDate);
    return d <= 7 && d > 0;
  }).length;

  const filteredInventory = inventory.filter((unit) => {
    if (inventoryFilter === 'expiring-soon') {
      const days = getDaysUntilExpiry(unit.expiryDate);
      return days <= 7 && days > 0;
    }
    if (inventoryFilter === 'available') {
      return unit.status === 'Available';
    }
    return true;
  });

  const pendingRequests = activeRequests.filter((r) => r.status !== 'Received');
  const fulfilledRequests = activeRequests.filter((r) => r.status === 'Received');

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
            <Database className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-on-surface">
                {currentBloodBank.name}
              </h1>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified Repository
              </span>
            </div>
            <p className="text-sm text-on-surface-variant mt-1">
              Licence: {currentBloodBank.licenceNumber} • {currentBloodBank.city}, {currentBloodBank.state} • Phone: {currentBloodBank.phone}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAddUnitModal(true)}
            className="px-5 py-3 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-sm shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>ADD BLOOD UNIT</span>
          </button>

          <button
            onClick={logoutBloodBank}
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
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all cursor-pointer ${
            activeTab === 'inventory'
              ? 'bg-surface-container-lowest text-primary border-b-2 border-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Inventory Management ({inventory.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all cursor-pointer ${
            activeTab === 'requests'
              ? 'bg-surface-container-lowest text-primary border-b-2 border-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Active Emergency Requests ({pendingRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-surface-container-lowest text-primary border-b-2 border-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          <span>Fulfillment History ({fulfilledRequests.length})</span>
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

      {/* TAB: INVENTORY MANAGEMENT */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {inventory.length === 0 ? (
            /* Clean Empty State as mandated */
            <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mx-auto mb-3">
                <Database className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-on-surface">No blood inventory has been added yet.</h3>
              <p className="text-sm text-on-surface-variant max-w-sm mx-auto mt-1 mb-5">
                Register clinical whole blood or component units into cold-chain storage to fulfill regional hospital demands.
              </p>
              <button
                onClick={() => setAddUnitModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Blood Unit</span>
              </button>
            </div>
          ) : (
            <div className="bg-surface-container-lowest border border-surface-container rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-sm font-bold text-on-surface">Cold-Chain Storage Units</span>
                  <span className="text-xs text-on-surface-variant block">
                    Total Active Units: {inventory.length} • Tracking collection &amp; 7-day expiry thresholds
                  </span>
                </div>

                {/* Filter Toolbar */}
                <div className="inline-flex rounded-lg bg-surface-container-low p-0.5 border border-surface-container text-xs">
                  <button
                    type="button"
                    onClick={() => setInventoryFilter('all')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                      inventoryFilter === 'all'
                        ? 'bg-surface-container-lowest text-primary shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    All ({inventory.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setInventoryFilter('expiring-soon')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      inventoryFilter === 'expiring-soon'
                        ? 'bg-surface-container-lowest text-amber-700 dark:text-amber-300 shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span>Expiring Soon ({expiringSoonCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInventoryFilter('available')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                      inventoryFilter === 'available'
                        ? 'bg-surface-container-lowest text-secondary shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Available Only ({inventory.filter((u) => u.status === 'Available').length})
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low text-on-surface-variant uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3">Unit ID</th>
                      <th className="px-4 py-3">Blood Group</th>
                      <th className="px-4 py-3">Component</th>
                      <th className="px-4 py-3">Volume</th>
                      <th className="px-4 py-3">Collection Date</th>
                      <th className="px-4 py-3">Expiry Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {filteredInventory.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-on-surface-variant">
                          No units match the selected filter.
                        </td>
                      </tr>
                    ) : (
                      filteredInventory.map((unit) => {
                        const daysLeft = getDaysUntilExpiry(unit.expiryDate);
                        const isExpired = daysLeft <= 0;
                        const isExpiringSoon = daysLeft > 0 && daysLeft <= 7;

                        return (
                          <tr key={unit.id} className="hover:bg-surface-container-low/50">
                            <td className="px-4 py-3.5 font-mono font-bold text-on-surface">{unit.id}</td>
                            <td className="px-4 py-3.5 font-bold text-primary text-sm">{unit.bloodGroup}</td>
                            <td className="px-4 py-3.5 text-on-surface">{unit.component}</td>
                            <td className="px-4 py-3.5 text-on-surface-variant">{unit.volume} mL</td>
                            <td className="px-4 py-3.5 text-on-surface-variant">{unit.collectionDate}</td>
                            <td className="px-4 py-3.5">
                              {isExpired ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-error-container text-on-error-container">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Expired</span>
                                </span>
                              ) : isExpiringSoon ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/70 dark:text-amber-200">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  <span>Expires in {daysLeft}d</span>
                                </span>
                              ) : (
                                <span className="text-on-surface-variant font-mono">
                                  {unit.expiryDate} ({daysLeft}d left)
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              <button
                                onClick={() => toggleUnitStatus(unit.id)}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                                  unit.status === 'Available'
                                    ? 'bg-secondary/15 text-secondary'
                                    : 'bg-surface-container-high text-on-surface-variant'
                                }`}
                              >
                                {unit.status}
                              </button>
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <button
                                onClick={() => removeBloodUnit(unit.id)}
                                className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/20 cursor-pointer"
                                title="Discard / Transfused"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB: ACTIVE EMERGENCY REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {pendingRequests.length === 0 ? (
            /* Clean Empty State as mandated */
            <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mx-auto mb-3">
                <Activity className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-on-surface">No active emergency requests.</h3>
              <p className="text-sm text-on-surface-variant max-w-sm mx-auto mt-1">
                Regional hospital emergency orders and trauma requisitions will populate here instantly.
              </p>
            </div>
          ) : (
            pendingRequests.map((req) => {
              const matchingInventoryUnits = inventory.filter(
                (u) => u.status === 'Available' && u.bloodGroup === req.bloodGroup
              );
              const isAssignedToThis = req.assignedBloodBankId === currentBloodBank.id;
              const isAssignedToOther = Boolean(
                req.assignedBloodBankId && req.assignedBloodBankId !== currentBloodBank.id
              );
              const isDeclinedByThis = Boolean(
                req.rejectedByBloodBankIds?.includes(currentBloodBank.id)
              );

              return (
                <div
                  key={req.id}
                  className={`bg-surface-container-lowest border rounded-2xl p-6 shadow-xs space-y-4 transition-all ${
                    isAssignedToThis
                      ? 'border-primary/40 ring-1 ring-primary/20'
                      : isAssignedToOther
                      ? 'border-surface-container opacity-70'
                      : 'border-surface-container'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-container">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-on-surface-variant">
                          {req.id}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            req.urgency === 'CRITICAL'
                              ? 'bg-primary text-on-primary'
                              : 'bg-surface-container-high text-on-surface'
                          }`}
                        >
                          {req.urgency}
                        </span>
                        <span className="text-xs text-on-surface-variant">
                          Hospital: <strong>{req.hospitalName}</strong>
                        </span>

                        {isAssignedToThis && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-secondary/15 text-secondary border border-secondary/30">
                            Assigned to Your Blood Bank
                          </span>
                        )}
                        {isAssignedToOther && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                            Fulfilled by {req.assignedBloodBankName}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-on-surface mt-1">
                        {req.units} Units of {req.bloodGroup} • {req.component}
                      </h3>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-on-surface-variant block">{req.timestamp}</span>
                      <span className="text-sm font-bold text-primary block mt-0.5">
                        Status: {req.status}
                      </span>
                    </div>
                  </div>

                  {/* Stock matching indicator */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs p-3 rounded-xl bg-surface-container-low border border-surface-container">
                    <span className="text-on-surface-variant">
                      In-Stock Matches ({req.bloodGroup}):{' '}
                      <strong className={matchingInventoryUnits.length >= req.units ? 'text-secondary font-bold' : 'text-amber-600 font-bold'}>
                        {matchingInventoryUnits.length} available units
                      </strong>{' '}
                      {matchingInventoryUnits.length >= req.units
                        ? '(Sufficient inventory for full fulfillment)'
                        : '(Partial or below requested quantity)'}
                    </span>

                    {/* ACTIONS BASED ON BLOOD REQUEST FLOW */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Case 1: Assigned to ANOTHER blood bank */}
                      {isAssignedToOther && (
                        <span className="text-xs text-on-surface-variant italic">
                          Order accepted by {req.assignedBloodBankName} (withdrawn from your facility)
                        </span>
                      )}

                      {/* Case 2: Declined by this blood bank */}
                      {!isAssignedToOther && isDeclinedByThis && (
                        <span className="text-xs text-on-surface-variant italic">
                          Declined by your facility
                        </span>
                      )}

                      {/* Case 3: Unassigned -> Blood Bank can Accept or Decline */}
                      {!isAssignedToOther && !isDeclinedByThis && !isAssignedToThis && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              acceptHospitalRequest(req.id, currentBloodBank.id, currentBloodBank.name);
                              setSuccessMsg(`Accepted request ${req.id}. Order locked to ${currentBloodBank.name}.`);
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept Request (Lock Order)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              rejectHospitalRequest(req.id, currentBloodBank.id);
                            }}
                            className="px-3 py-1.5 rounded-lg border border-surface-container hover:bg-surface-container-high text-on-surface-variant text-xs font-medium transition-all cursor-pointer"
                          >
                            Decline
                          </button>
                        </>
                      )}

                      {/* Case 4: ASSIGNED TO THIS BLOOD BANK -> Progress Supply Stages */}
                      {isAssignedToThis && (
                        <>
                          {/* Sub-stage A: Confirmed -> Need to Allocate Units */}
                          {(req.status === 'Confirmed' || req.deliveryStatus === 'Accepted') && (
                            <button
                              type="button"
                              onClick={() => {
                                allocateUnitsForRequest(req.id, currentBloodBank.id, req.units);
                                setSuccessMsg(`Allocated ${req.units} units of ${req.bloodGroup} from cold storage.`);
                              }}
                              className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                            >
                              <Layers className="w-3.5 h-3.5" />
                              <span>Allocate {req.units} Blood Units</span>
                            </button>
                          )}

                          {/* Sub-stage B: Units Allocated / Reserved -> Ready to Dispatch */}
                          {(req.deliveryStatus === 'Units Allocated' || req.status === 'Reserved' || req.status === 'Approved') && (
                            <button
                              type="button"
                              onClick={() => {
                                setDispatchModalReqId(req.id);
                                setCourierTrackingInput(`CC-EXP-${Math.floor(100000 + Math.random() * 900000)}`);
                              }}
                              className="px-3.5 py-1.5 rounded-lg bg-secondary hover:opacity-90 text-on-secondary text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Dispatch Cold-Chain Courier</span>
                            </button>
                          )}

                          {/* Sub-stage C: In Transit / Dispatched */}
                          {req.status === 'Dispatched' && (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 text-xs font-semibold">
                                <Truck className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                                <span>In Cold-Chain Transit ({req.trackingNumber || 'Active'})</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  updateRequestStatus(req.id, 'Received');
                                  setSuccessMsg(`Marked request ${req.id} as received at ${req.hospitalName}.`);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container text-on-surface text-xs font-medium cursor-pointer"
                              >
                                Mark Delivered
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}


      {/* TAB: FULFILLMENT HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {fulfilledRequests.length === 0 ? (
            /* Clean Empty State */
            <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mx-auto mb-3">
                <PackageCheck className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-on-surface">No fulfillment history.</h3>
              <p className="text-sm text-on-surface-variant max-w-sm mx-auto mt-1">
                Completed requisitions fulfilled by your blood bank will be logged here.
              </p>
            </div>
          ) : (
            <div className="bg-surface-container-lowest border border-surface-container rounded-2xl overflow-hidden shadow-xs">
              <div className="divide-y divide-surface-container">
                {fulfilledRequests.map((req) => (
                  <div key={req.id} className="p-4 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-on-surface">
                        {req.hospitalName} • {req.units} Units of {req.bloodGroup}
                      </span>
                      <span className="block text-xs text-on-surface-variant mt-0.5">
                        Order ID: {req.id} • Component: {req.component}
                      </span>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-secondary/10 text-secondary font-semibold">
                      Fulfilled &amp; Received
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-bold text-on-surface">Blood Bank Profile Details</h3>
            <p className="text-xs text-on-surface-variant">Repository certification and regional cold-chain details.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container/60">
              <span className="text-xs text-on-surface-variant block">Blood Bank Name</span>
              <span className="font-semibold text-on-surface mt-0.5 block">{currentBloodBank.name}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container/60">
              <span className="text-xs text-on-surface-variant block">Licence Number</span>
              <span className="font-semibold text-on-surface mt-0.5 block">{currentBloodBank.licenceNumber}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container/60">
              <span className="text-xs text-on-surface-variant block">Medical Director</span>
              <span className="font-semibold text-on-surface mt-0.5 block">{currentBloodBank.contactPerson}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container/60">
              <span className="text-xs text-on-surface-variant block">Dispatch Phone</span>
              <span className="font-semibold text-on-surface mt-0.5 block">{currentBloodBank.phone}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container/60">
              <span className="text-xs text-on-surface-variant block">Email</span>
              <span className="font-semibold text-on-surface mt-0.5 block">{currentBloodBank.email}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container/60">
              <span className="text-xs text-on-surface-variant block">Facility Location</span>
              <span className="font-semibold text-on-surface mt-0.5 block">
                {currentBloodBank.address}, {currentBloodBank.city}, {currentBloodBank.state}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ADD BLOOD UNIT MODAL */}
      {addUnitModal && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-surface-container rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Inventory Intake
                </span>
                <h3 className="text-xl font-bold text-on-surface">Add Blood Unit</h3>
              </div>
              <button
                onClick={() => setAddUnitModal(false)}
                className="text-xs font-semibold text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleAddUnit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Blood Group *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {bloodGroups.map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setNewGroup(bg)}
                      className={`p-2.5 rounded-lg border text-center font-bold text-sm cursor-pointer ${
                        newGroup === bg
                          ? 'border-primary bg-primary text-on-primary'
                          : 'border-surface-container bg-surface-container-low text-on-surface'
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Blood Component *
                </label>
                <select
                  value={newComponent}
                  onChange={(e) => setNewComponent(e.target.value as BloodComponent)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface font-medium"
                >
                  {components.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                    Volume (mL) *
                  </label>
                  <input
                    type="number"
                    required
                    min={50}
                    max={600}
                    value={newVolume}
                    onChange={(e) => setNewVolume(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                    Collection Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newCollectionDate}
                    onChange={(e) => setNewCollectionDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newExpiryDate}
                    onChange={(e) => setNewExpiryDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setAddUnitModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-xs cursor-pointer"
                >
                  Confirm &amp; Store Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DISPATCH COLD-CHAIN COURIER */}
      {dispatchModalReqId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6 max-w-md w-full shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Cold-Chain Logistics
                </span>
                <h3 className="text-lg font-bold text-on-surface">Dispatch Blood Supply</h3>
              </div>
              <button
                type="button"
                onClick={() => setDispatchModalReqId(null)}
                className="text-xs font-semibold text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-on-surface-variant">
              Confirm cold-chain temperature packaging (2°C – 6°C) and assign a carrier tracking number for Order <strong>{dispatchModalReqId}</strong>.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Courier / Ambulance Waybill Tracking ID *
                </label>
                <input
                  type="text"
                  required
                  value={courierTrackingInput}
                  onChange={(e) => setCourierTrackingInput(e.target.value)}
                  placeholder="e.g. CC-EXP-847291"
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container space-y-1.5">
                <span className="font-semibold text-on-surface flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-secondary" />
                  Thermal Container Verification
                </span>
                <p className="text-[11px] text-on-surface-variant">
                  Insulated thermal box with calibrated PCM (phase change material) temperature datalogger attached.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-container">
              <button
                type="button"
                onClick={() => setDispatchModalReqId(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  dispatchBloodSupply(dispatchModalReqId, courierTrackingInput || undefined);
                  setSuccessMsg(`Supply order ${dispatchModalReqId} dispatched in cold-chain transit.`);
                  setDispatchModalReqId(null);
                }}
                className="px-5 py-2 rounded-lg bg-secondary hover:opacity-90 text-on-secondary text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Confirm Dispatch</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
