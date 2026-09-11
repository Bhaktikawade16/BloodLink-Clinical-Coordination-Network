import React, { useState } from 'react';
import {
  BloodGroup,
  BloodComponent,
  UrgencyLevel,
  EmergencyRequisition,
  RequisitionStatus
} from '../types';
import { useBloodLink } from '../context/BloodLinkContext';
import { BloodLinkVerificationCard } from './BloodLinkVerificationCard';
main
import {
  Building2,
  AlertCircle,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  Send,
  Database,
  Bell,
  User,
  LogOut,
  UploadCloud,
  FileCheck,
  ShieldCheck,
  Zap,
  Activity,
  ChevronRight,
  HeartHandshake,
  Truck,
  Search,
  Phone,
  MapPin,
  Check
} from 'lucide-react';

export const HospitalPortalView: React.FC = () => {
  const {
    hospitals,
    currentHospital,
    loginHospital,
    logoutHospital,
    registerHospital,
    approveEntity,
    bloodBanks,
    inventory,
    activeRequests,
    createEmergencyRequest,
    notifications,
    donors,
    confirmHospitalReceipt,
    contactEmergencyDonor,
    loginUser,
    loginWithGoogle,
    registerUser,
    updateVerificationStatus,
    verifyRequisition,
    rejectRequisitionVerification
  } = useBloodLink();

  // Authentication view: 'login' | 'register' | 'forgot'
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot'>('login');

  // Google & Gmail Extracted Details State
  const [extractedGoogleDetails, setExtractedGoogleDetails] = useState<any | null>(null);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register form state
  const [hospName, setHospName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [licenceNumber, setLicenceNumber] = useState('');
  const [licenceDoc, setLicenceDoc] = useState<string | null>(null);
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
      role: 'hospital',
      phone: data.extracted.phone,
      city: data.extracted.city,
      autoRegister: true
    });
    if (!res.success) {
      setLoginError(res.error || 'Unable to log in with Google account.');
      return;
    }
    if (res.user && res.user.role !== 'hospital') {
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

  // Dashboard Tab: 'active' | 'history' | 'bloodbanks' | 'donors' | 'notifications' | 'profile'
  const [dashTab, setDashTab] = useState<'active' | 'history' | 'bloodbanks' | 'donors' | 'notifications' | 'profile'>('active');

  // Emergency Donor Search filters
  const [donorGroupFilter, setDonorGroupFilter] = useState<BloodGroup | 'ALL'>('ALL');
  const [donorCitySearch, setDonorCitySearch] = useState('');
  const [donorContactedToast, setDonorContactedToast] = useState<string | null>(null);

  // 5-Step Emergency Request Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [reqStep, setReqStep] = useState(1);
  const [selectedGroup, setSelectedGroup] = useState<BloodGroup>('O-');
  const [selectedComponent, setSelectedComponent] = useState<BloodComponent>('Packed Red Blood Cells (PRBC)');
  const [unitCount, setUnitCount] = useState<number>(3);
  const [selectedUrgency, setSelectedUrgency] = useState<UrgencyLevel>('CRITICAL');
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);

  // Verified Emergency Requisition Clinical Fields
  const [patientId, setPatientId] = useState('');
  const [patientDiagnosis, setPatientDiagnosis] = useState('');
  const [wardDepartment, setWardDepartment] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorAuthorizedPerson, setDoctorAuthorizedPerson] = useState('');
  const [requisitionDocName, setRequisitionDocName] = useState<string | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [selectedRequisitionForModal, setSelectedRequisitionForModal] = useState<EmergencyRequisition | null>(null);

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const components: { title: BloodComponent; desc: string }[] = [
    { title: 'Packed Red Blood Cells (PRBC)', desc: 'Acute hemorrhage, trauma resuscitation' },
    { title: 'Whole Blood', desc: 'Exsanguinating surgery, mass transfusion' },
    { title: 'Platelets (RDP/SDP)', desc: 'Thrombocytopenia, severe bleeding' },
    { title: 'Fresh Frozen Plasma (FFP)', desc: 'Coagulopathy correction, clotting factors' },
    { title: 'Cryoprecipitate', desc: 'Fibrinogen deficiency, Factor VIII replacement' }
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginIdentifier.trim()) {
      setLoginError('Please enter your institutional email or emergency phone.');
      return;
    }
    const res = await loginUser(loginIdentifier, loginPassword, 'hospital');
    if (!res.success) {
      const fallback = loginHospital(loginIdentifier);
      if (!fallback.success) {
        setLoginError(res.error || fallback.message || 'Hospital not found. Please register.');
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
      role: 'hospital',
      name: hospName,
      email,
      phone,
      password,
      city: city || 'Metro City',
      address: address || `${city}, ${state}`,
      registration_number: licenceNumber || `REG-${Date.now()}`
    });

    if (!res.success) {
      setRegError(res.error || 'Registration failed. Please review your inputs.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLicenceDoc(e.target.files[0].name);
    }
  };

  const handleConfirmEmergencyRequisition = () => {
    if (!currentHospital) return;
    createEmergencyRequest({
      hospitalName: currentHospital.name,
      bloodGroup: selectedGroup,
      component: selectedComponent,
      units: unitCount,
      urgency: selectedUrgency,
      patientId: patientId.trim() || `PT-${Math.floor(1000 + Math.random() * 9000)}`,
      patientDiagnosis: patientDiagnosis.trim() || 'Acute blood volume deficit / Trauma resuscitation',
      wardDepartment: wardDepartment.trim() || 'Emergency / Trauma OT',
      doctorName: doctorName.trim() || currentHospital.contactPerson || 'Dr. On-Duty Specialist',
      doctorAuthorizedPerson: doctorAuthorizedPerson.trim() || 'Hospital Transfusion Committee',
      requisitionDocName: requisitionDocName || 'Hospital_Signed_Requisition.pdf',
      additionalNotes: additionalNotes.trim() || ''
    });
    setModalOpen(false);
    setRequestSuccess(`Emergency order for ${unitCount} units of ${selectedGroup} logged and initialized in matching pipeline.`);
    setTimeout(() => setRequestSuccess(null), 6000);
    setDashTab('active');
  };

  // -------------------------------------------------------------
  // VIEW: AUTHENTICATION (When no hospital is logged in)
  // -------------------------------------------------------------
  if (!currentHospital) {
    return (
      <div className="w-full max-w-xl mx-auto py-10 px-4">
        <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
              Welcome, hospital.
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              {authView === 'login'
                ? 'Clinical access gateway for acute transfusion coordination.'
                : authView === 'register'
                ? 'Register your clinical facility for verification and emergency requisition dispatch.'
                : 'Recover hospital clinical access credentials.'}
            </p>
          </div>

          {/* SIGN IN */}
          {authView === 'login' && (
            <div className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                {loginError && (
                  <div className="p-3 rounded-lg bg-error-container text-on-error-container text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Hospital Email or Emergency Contact
                  </label>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="trauma@hospital.org or (555) 019-2834"
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

                {/* Quick login with Railway Database Hospital */}
                <button
                  type="button"
                  onClick={() => {
                    setLoginIdentifier('Ruby Hall Clinic');
                    setLoginPassword('hospital123');
                    loginHospital('Ruby Hall Clinic');
                  }}
                  className="w-full py-2 px-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-800 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>Quick Sign In: Ruby Hall Clinic</span>
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
                  REGISTER HOSPITAL
                </button>
              </div>
            </form>
          </div>
        )}

          {/* FORGOT PASSWORD */}
          {authView === 'forgot' && (
            <div className="space-y-4">
              <p className="text-sm text-on-surface-variant">
                Enter your institutional email address to receive an emergency password reset token.
              </p>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Institutional Email
                </label>
                <input
                  type="email"
                  placeholder="trauma@hospital.org"
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
                  setRecoveryNotice('Emergency reset token dispatched to authorized institutional email.');
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

          {/* REGISTRATION */}
          {authView === 'register' && (
            <div className="space-y-4">
              <form onSubmit={handleRegister} className="space-y-4">
                {regError && (
                  <div className="p-3 rounded-lg bg-error-container text-on-error-container text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Hospital Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={hospName}
                  onChange={(e) => setHospName(e.target.value)}
                  placeholder="e.g. Metro Health Trauma & Surgical Center"
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-sm text-on-surface"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Authorized Contact Person *
                </label>
                <input
                  type="text"
                  required
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. Dr. Arthur Vance (Chief Medical Officer)"
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
                    placeholder="director@hospital.org"
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-sm text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                    24/7 Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 304-9821"
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-sm text-on-surface"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Hospital Physical Address *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="742 Medical Center Boulevard"
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
                  Licence / Registration Number *
                </label>
                <input
                  type="text"
                  required
                  value={licenceNumber}
                  onChange={(e) => setLicenceNumber(e.target.value)}
                  placeholder="MED-LIC-2024-88910-C"
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-sm text-on-surface"
                />
              </div>

              {/* Upload Licence Document */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Upload Licence Document (PDF, JPG, PNG) *
                </label>
                <label className="border border-dashed border-surface-container rounded-xl p-4 flex flex-col items-center justify-center text-center bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <UploadCloud className="w-6 h-6 text-primary mb-1" />
                  <span className="text-xs font-semibold text-on-surface">
                    {licenceDoc ? `Attached: ${licenceDoc}` : 'Click or Drag to Upload Accreditation Certificate'}
                  </span>
                  <span className="text-[11px] text-on-surface-variant mt-0.5">
                    Official Form 26-G/28-C clinical drug licence
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
                  SUBMIT REGISTRATION
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
  // VIEW: VERIFICATION PENDING STATE
  // -------------------------------------------------------------
  if (
    currentHospital.status === 'Verification Pending' ||
    (currentHospital.status as string) === 'Pending' ||
    currentHospital.status === 'Rejected'
  ) {
    return (
      <div className="w-full max-w-3xl mx-auto py-10 px-4 space-y-6">
        <BloodLinkVerificationCard
          role="hospital"
          userName={currentHospital.name}
          userEmail={currentHospital.email}
          userPhone={currentHospital.phone}
          verificationStatus={currentHospital.status === 'Rejected' ? 'Rejected' : 'Pending'}
          roleDetails={[
            { label: 'Hospital Facility', value: currentHospital.name },
            { label: 'Licence / Reg No.', value: currentHospital.licenceNumber },
            { label: 'Authorized Officer', value: currentHospital.contactPerson },
            { label: 'Clinical Address', value: `${currentHospital.address || 'Central Clinic'}, ${currentHospital.city}` }
          ]}
          onSignOut={logoutHospital}
          onQuickVerify={async () => {
            const rawId = currentHospital.id.replace('HOSP-', '');
            await updateVerificationStatus('hospital', rawId, 'Verified');
            approveEntity('hospital', currentHospital.id);
          }}
          onQuickReject={async () => {
            const rawId = currentHospital.id.replace('HOSP-', '');
            await updateVerificationStatus('hospital', rawId, 'Rejected');
          }}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: HOSPITAL DASHBOARD (Verified State)
  // -------------------------------------------------------------
  const hospitalRequests = activeRequests.filter((r) => r.hospitalName === currentHospital.name);
  const verifiedBloodBanksList = bloodBanks.filter((b) => b.status === 'Verified');

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {requestSuccess && (
        <div className="p-4 rounded-xl bg-secondary/15 text-secondary border border-secondary/30 text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{requestSuccess}</span>
        </div>
      )}

      {/* Verified Hospital Top Deck */}
      <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-on-surface">
                {currentHospital.name}
              </h1>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified Clinical Facility
              </span>
            </div>
            <p className="text-sm text-on-surface-variant mt-1">
              Licence: {currentHospital.licenceNumber} • {currentHospital.city}, {currentHospital.state} • Contact: {currentHospital.phone}
            </p>
          </div>
        </div>

        {/* PROMINENT REQUEST BLOOD BUTTON */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setReqStep(1);
              setModalOpen(true);
            }}
            className="px-6 py-3.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-base shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex items-center gap-2.5 cursor-pointer"
          >
            <Zap className="w-5 h-5 animate-pulse" />
            <span>REQUEST BLOOD</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={logoutHospital}
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
          onClick={() => setDashTab('active')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all cursor-pointer ${
            dashTab === 'active'
              ? 'bg-surface-container-lowest text-primary border-b-2 border-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Active Requests ({hospitalRequests.filter((r) => r.status !== 'Received').length})</span>
        </button>

        <button
          onClick={() => setDashTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all cursor-pointer ${
            dashTab === 'history'
              ? 'bg-surface-container-lowest text-primary border-b-2 border-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Request History ({hospitalRequests.filter((r) => r.status === 'Received').length})</span>
        </button>

        <button
          onClick={() => setDashTab('bloodbanks')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all cursor-pointer ${
            dashTab === 'bloodbanks'
              ? 'bg-surface-container-lowest text-primary border-b-2 border-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Verified Blood Banks ({verifiedBloodBanksList.length})</span>
        </button>

        <button
          onClick={() => setDashTab('donors')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all cursor-pointer ${
            dashTab === 'donors'
              ? 'bg-surface-container-lowest text-primary border-b-2 border-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <HeartHandshake className="w-4 h-4 text-primary" />
          <span>Emergency Donors ({donors.filter((d) => (d.isAvailable ?? d.availableForEmergency)).length})</span>
        </button>

        <button
          onClick={() => setDashTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all cursor-pointer ${
            dashTab === 'notifications'
              ? 'bg-surface-container-lowest text-primary border-b-2 border-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifications ({notifications.length})</span>
        </button>

        <button
          onClick={() => setDashTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all cursor-pointer ${
            dashTab === 'profile'
              ? 'bg-surface-container-lowest text-primary border-b-2 border-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile</span>
        </button>
      </div>

      {/* TAB: ACTIVE REQUESTS */}
      {dashTab === 'active' && (
        <div className="space-y-4">
          {hospitalRequests.filter((r) => r.status !== 'Received').length === 0 ? (
            /* Clean Empty State as mandated */
            <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mx-auto mb-3">
                <Send className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-on-surface">No active requests.</h3>
              <p className="text-sm text-on-surface-variant max-w-sm mx-auto mt-1 mb-5">
                Your hospital currently has no active emergency blood requisitions in transit.
              </p>
              <button
                onClick={() => {
                  setReqStep(1);
                  setModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Zap className="w-4 h-4" />
                <span>Create Emergency Request</span>
              </button>
            </div>
          ) : (
            hospitalRequests
              .filter((r) => r.status !== 'Received')
              .map((req) => (
                <div
                  key={req.id}
                  className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6 shadow-xs space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-container">
                    <div>
                      <div className="flex items-center gap-2">
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
                      </div>
                      <h3 className="text-lg font-bold text-on-surface mt-1">
                        {req.units} Units of {req.bloodGroup} • {req.component}
                      </h3>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-on-surface-variant block">{req.timestamp}</span>
                      <span className="text-sm font-bold text-primary block mt-0.5">
                        Current Status: {req.status}
                      </span>
                    </div>
                  </div>

                  {/* Pipeline Status Stepper */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                      Coordination Pipeline
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
                      {[
                        'Submitted',
                        'Matching',
                        'Confirmed',
                        'Reserved',
                        'Approved',
                        'Dispatched',
                        'Received'
                      ].map((stepName, idx) => {
                        const statuses: RequisitionStatus[] = [
                          'Submitted',
                          'Matching',
                          'Confirmed',
                          'Reserved',
                          'Approved',
                          'Dispatched',
                          'Received'
                        ];
                        const currentIdx = statuses.indexOf(req.status);
                        const isDone = currentIdx >= idx;
                        const isCurrent = currentIdx === idx;

                        return (
                          <div
                            key={stepName}
                            className={`p-2 rounded-lg border transition-all ${
                              isCurrent
                                ? 'border-primary bg-primary/10 text-primary font-bold'
                                : isDone
                                ? 'border-secondary/40 bg-secondary/10 text-secondary font-medium'
                                : 'border-surface-container bg-surface-container-low text-on-surface-variant opacity-60'
                            }`}
                          >
                            <span className="block text-[10px] uppercase opacity-75">
                              {idx + 1}
                            </span>
                            <span className="truncate block font-semibold">{stepName}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Clinical Details & Transfusion Reference */}
                  <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Patient / Case</span>
                      <span className="font-semibold text-on-surface">{req.patientId || 'Pending Patient Ref'}</span>
                      <span className="text-[11px] text-on-surface-variant block truncate">{req.patientDiagnosis || 'Emergency Blood Deficit'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Ward / Doctor</span>
                      <span className="font-semibold text-on-surface">{req.wardDepartment || 'Emergency / Trauma'}</span>
                      <span className="text-[11px] text-on-surface-variant block truncate">{req.doctorName || currentHospital.contactPerson || 'Specialist On-Duty'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Clinical Verification</span>
                      {req.verificationStatus === 'Verified' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-secondary">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Doctor Authorized</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          <span>Pending Verification</span>
                        </span>
                      )}
                      <span className="text-[10px] text-on-surface-variant block">
                        {req.cascadeStage ? `Cascade: ${req.cascadeStage}` : 'Direct Match Engine'}
                      </span>
                    </div>
                  </div>

                  {/* BLOOD SUPPLY / FULFILLMENT BANNER & PIPELINE BUTTONS */}
                  <div className="pt-2 border-t border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    {req.assignedBloodBankName ? (
                      <div className="flex items-center gap-2 text-secondary">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>
                          Assigned to <strong>{req.assignedBloodBankName}</strong> •{' '}
                          {req.deliveryStatus || req.status}
                          {req.trackingNumber ? ` (Waybill: ${req.trackingNumber})` : ''}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <Activity className="w-4 h-4 shrink-0 animate-pulse" />
                        <span>
                          Broadcasting to regional blood banks. 7-min reserve window and donor standby armed.
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* View Matches & Pipeline Modal */}
                      <button
                        type="button"
                        onClick={() => setSelectedRequisitionForModal(req)}
                        className="px-3.5 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container text-on-surface text-xs font-bold transition-all cursor-pointer border border-surface-container flex items-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5 text-primary" />
                        <span>View Matching &amp; 7-Min Pipeline</span>
                      </button>

                      {/* Doctor Sign-off if pending verification */}
                      {req.verificationStatus === 'Pending Verification' && (
                        <button
                          type="button"
                          onClick={async () => {
                            await verifyRequisition(req.id, currentHospital.contactPerson || 'Dr. On-Duty Specialist', 'Authorized by hospital emergency trauma desk');
                            setRequestSuccess(`Requisition ${req.id} clinically authorized. Smart matching locked.`);
                            setTimeout(() => setRequestSuccess(null), 5000);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Authorize (Doctor Sign-off)</span>
                        </button>
                      )}

                      {/* If dispatched, hospital can confirm receipt to close request */}
                      {req.status === 'Dispatched' && (
                        <button
                          type="button"
                          onClick={() => {
                            confirmHospitalReceipt(req.id);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-secondary hover:opacity-90 text-on-secondary text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirm Blood Delivery Receipt</span>
                        </button>
                      )}

                      {/* If not accepted yet, provide Emergency Donor Search shortcut */}
                      {!req.assignedBloodBankName && (
                        <button
                          type="button"
                          onClick={() => {
                            setDonorGroupFilter(req.bloodGroup);
                            setDashTab('donors');
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <HeartHandshake className="w-3.5 h-3.5 text-primary" />
                          <span>Standby Donors ({req.bloodGroup})</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {/* TAB: REQUEST HISTORY */}
      {dashTab === 'history' && (
        <div className="space-y-4">
          {hospitalRequests.filter((r) => r.status === 'Received').length === 0 ? (
            /* Clean Empty State */
            <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mx-auto mb-3">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-on-surface">No request history.</h3>
              <p className="text-sm text-on-surface-variant max-w-sm mx-auto mt-1">
                Completed requisitions and archived deliveries will appear here.
              </p>
            </div>
          ) : (
            <div className="bg-surface-container-lowest border border-surface-container rounded-2xl overflow-hidden shadow-xs">
              <div className="divide-y divide-surface-container">
                {hospitalRequests
                  .filter((r) => r.status === 'Received')
                  .map((req) => (
                    <div key={req.id} className="p-4 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-bold text-on-surface">
                          {req.units} Units • {req.bloodGroup} {req.component}
                        </span>
                        <span className="block text-xs text-on-surface-variant mt-0.5">
                          ID: {req.id} • Urgency: {req.urgency}
                        </span>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-secondary/10 text-secondary font-semibold">
                        Received &amp; Transfused
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: VERIFIED BLOOD BANKS */}
      {dashTab === 'bloodbanks' && (
        <div className="space-y-4">
          {verifiedBloodBanksList.length === 0 ? (
            /* Clean Empty State */
            <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mx-auto mb-3">
                <Database className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-on-surface">No verified blood banks registered yet.</h3>
              <p className="text-sm text-on-surface-variant max-w-sm mx-auto mt-1">
                When certified blood banks register and complete admin audit, their live stock readiness will display here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {verifiedBloodBanksList.map((bank) => {
                const availableUnitsInBank = inventory.filter((u) => u.status === 'Available').length;
                return (
                  <div
                    key={bank.id}
                    className="bg-surface-container-lowest border border-surface-container rounded-2xl p-5 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary">
                          Verified Repository
                        </span>
                        <span className="text-xs font-mono text-on-surface-variant">
                          {bank.licenceNumber}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-on-surface">{bank.name}</h3>
                      <p className="text-xs text-on-surface-variant mt-1">
                        {bank.address}, {bank.city}, {bank.state}
                      </p>

                      <div className="mt-4 pt-3 border-t border-surface-container flex items-center justify-between text-xs">
                        <span className="text-on-surface-variant">Phone: {bank.phone}</span>
                        <span className="font-semibold text-primary">
                          {availableUnitsInBank} Units in Stock
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: EMERGENCY DONOR SEARCH */}
      {dashTab === 'donors' && (
        <div className="space-y-5">
          {donorContactedToast && (
            <div className="p-4 rounded-xl bg-secondary/15 text-secondary border border-secondary/30 text-sm font-medium flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{donorContactedToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setDonorContactedToast(null)}
                className="text-xs font-bold hover:underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Search and Filter Panel */}
          <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                  <HeartHandshake className="w-5 h-5 text-primary" />
                  <span>Emergency Community Donor Directory</span>
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Direct coordination with voluntary donors available for immediate transfusion when local blood banks have zero inventory.
                </p>
              </div>

              {/* City search */}
              <div className="w-full md:w-64">
                <input
                  type="text"
                  placeholder="Filter by city or district..."
                  value={donorCitySearch}
                  onChange={(e) => setDonorCitySearch(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface"
                />
              </div>
            </div>

            {/* Blood Group Filter Chips */}
            <div className="space-y-1.5 pt-2 border-t border-surface-container">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">
                Filter by Blood Group:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setDonorGroupFilter('ALL')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                    donorGroupFilter === 'ALL'
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  All Donors
                </button>
                {bloodGroups.map((bg) => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setDonorGroupFilter(bg)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                      donorGroupFilter === bg
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Filtered Donors Grid */}
          {(() => {
            const emergencyDonors = donors.filter((d) => {
              const isEligible = d.isAvailable ?? d.availableForEmergency;
              if (!isEligible) return false;
              if (donorGroupFilter !== 'ALL' && d.bloodGroup !== donorGroupFilter) return false;
              if (
                donorCitySearch.trim() &&
                !d.city.toLowerCase().includes(donorCitySearch.trim().toLowerCase()) &&
                !(d.area && d.area.toLowerCase().includes(donorCitySearch.trim().toLowerCase()))
              ) {
                return false;
              }
              return true;
            });

            if (emergencyDonors.length === 0) {
              return (
                <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-12 text-center shadow-xs">
                  <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mx-auto mb-3">
                    <HeartHandshake className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-on-surface">No emergency donors found.</h3>
                  <p className="text-sm text-on-surface-variant max-w-sm mx-auto mt-1">
                    No verified donors matching your criteria have flagged active emergency readiness in this region.
                  </p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {emergencyDonors.map((donor) => (
                  <div
                    key={donor.id}
                    className="bg-surface-container-lowest border border-surface-container rounded-2xl p-5 shadow-xs space-y-4 hover:border-primary/30 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-base font-bold text-on-surface">{donor.fullName}</h4>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-secondary/15 text-secondary">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                              Emergency Ready
                            </span>
                          </div>
                          <span className="text-xs text-on-surface-variant block mt-0.5">
                            Age: {donor.age} • Gender: {donor.gender}
                          </span>
                        </div>

                        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base border border-primary/20 shrink-0">
                          {donor.bloodGroup}
                        </div>
                      </div>

                      <div className="text-xs space-y-1 text-on-surface-variant pt-2 border-t border-surface-container">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
                          <span>
                            {donor.area ? `${donor.area}, ${donor.city}` : donor.city}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
                          <span>{donor.phone}</span>
                        </div>
                      </div>

                      {/* Donation Track Record */}
                      <div className="grid grid-cols-2 gap-2 text-xs p-2.5 rounded-xl bg-surface-container-low border border-surface-container">
                        <div>
                          <span className="text-on-surface-variant block text-[10px] uppercase">
                            Total Donations
                          </span>
                          <span className="font-bold text-on-surface">
                            {donor.donationCount ?? donor.totalDonations ?? 0} Sessions
                          </span>
                        </div>
                        <div>
                          <span className="text-on-surface-variant block text-[10px] uppercase">
                            Last Donation
                          </span>
                          <span className="font-semibold text-on-surface">
                            {donor.lastDonationDate || 'First-time volunteer'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-surface-container flex items-center justify-between gap-3">
                      <span className="text-[11px] text-on-surface-variant">
                        {donor.bloodGroup === 'O-' ? '★ Universal Red Blood Cell Donor' : 'Standard Compatibility'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          contactEmergencyDonor(donor.id, currentHospital.name, donor.bloodGroup, 2);
                          setDonorContactedToast(
                            `Emergency mobilization alert sent directly to ${donor.fullName} (${donor.bloodGroup}).`
                          );
                        }}
                        className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Mobilize Donor Alert</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

        </div>
      )}
      {dashTab === 'notifications' && (
        <div className="space-y-4">
          {notifications.length === 0 ? (
            /* Clean Empty State */
            <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mx-auto mb-3">
                <Bell className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-on-surface">No notifications.</h3>
              <p className="text-sm text-on-surface-variant max-w-sm mx-auto mt-1">
                Transfusion dispatch notices and stock alerts will appear here.
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
                    <h4 className="text-sm font-bold text-on-surface">{notif.title}</h4>
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
      {dashTab === 'profile' && (
        <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-bold text-on-surface">Hospital Profile Details</h3>
            <p className="text-xs text-on-surface-variant">Institutional credentialing and emergency dispatch routing information.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container/60">
              <span className="text-xs text-on-surface-variant block">Hospital Legal Name</span>
              <span className="font-semibold text-on-surface mt-0.5 block">{currentHospital.name}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container/60">
              <span className="text-xs text-on-surface-variant block">Licence Number</span>
              <span className="font-semibold text-on-surface mt-0.5 block">{currentHospital.licenceNumber}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container/60">
              <span className="text-xs text-on-surface-variant block">Signatory Officer</span>
              <span className="font-semibold text-on-surface mt-0.5 block">{currentHospital.contactPerson}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container/60">
              <span className="text-xs text-on-surface-variant block">24/7 Phone</span>
              <span className="font-semibold text-on-surface mt-0.5 block">{currentHospital.phone}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container/60">
              <span className="text-xs text-on-surface-variant block">Email</span>
              <span className="font-semibold text-on-surface mt-0.5 block">{currentHospital.email}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container/60">
              <span className="text-xs text-on-surface-variant block">Physical Location</span>
              <span className="font-semibold text-on-surface mt-0.5 block">
                {currentHospital.address}, {currentHospital.city}, {currentHospital.state}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5-STEP EMERGENCY REQUEST MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-surface-container rounded-2xl max-w-xl w-full shadow-2xl p-6 sm:p-7 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-surface-container">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Step {reqStep} of 5
                </span>
                <h3 className="text-xl font-bold text-on-surface">Emergency Blood Requisition</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-xs font-semibold text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* STEP 1: Blood Group */}
            {reqStep === 1 && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-on-surface">Step 1: Select Required Blood Group</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Choose recipient or uncrossmatched emergency group.
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {bloodGroups.map((bg) => {
                    const isSelected = selectedGroup === bg;
                    return (
                      <button
                        key={bg}
                        type="button"
                        onClick={() => setSelectedGroup(bg)}
                        className={`p-3.5 rounded-xl border text-center font-bold text-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary text-on-primary shadow-xs'
                            : 'border-surface-container bg-surface-container-low text-on-surface hover:bg-surface-container'
                        }`}
                      >
                        {bg}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: Component */}
            {reqStep === 2 && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-on-surface">Step 2: Select Blood Component</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Specify physiological fraction required for clinical procedure.
                  </p>
                </div>
                <div className="space-y-2">
                  {components.map((c) => {
                    const isSelected = selectedComponent === c.title;
                    return (
                      <button
                        key={c.title}
                        type="button"
                        onClick={() => setSelectedComponent(c.title)}
                        className={`w-full p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary shadow-xs'
                            : 'border-surface-container bg-surface-container-low text-on-surface hover:bg-surface-container'
                        }`}
                      >
                        <span className="block text-sm font-bold">{c.title}</span>
                        <span className="block text-xs text-on-surface-variant mt-0.5">{c.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: Units Required */}
            {reqStep === 3 && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-on-surface">Step 3: Units Required</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Indicate dosage required for bedside arrival.
                  </p>
                </div>
                <div className="p-8 rounded-2xl bg-surface-container-low border border-surface-container flex flex-col items-center justify-center gap-4">
                  <div className="flex items-center gap-6">
                    <button
                      type="button"
                      onClick={() => setUnitCount(Math.max(1, unitCount - 1))}
                      className="w-12 h-12 rounded-full bg-surface-container-lowest border border-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container cursor-pointer active:scale-95"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <div className="text-center w-24">
                      <span className="text-4xl font-extrabold text-primary">{unitCount}</span>
                      <span className="block text-xs text-on-surface-variant font-semibold">UNITS</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUnitCount(Math.min(12, unitCount + 1))}
                      className="w-12 h-12 rounded-full bg-surface-container-lowest border border-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container cursor-pointer active:scale-95"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <span className="text-xs text-on-surface-variant text-center max-w-xs">
                    Mass transfusion protocol triggers if &gt; 6 units requested.
                  </span>
                </div>
              </div>
            )}

            {/* STEP 4: Urgency & Clinical Requisition Details */}
            {reqStep === 4 && (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                <div>
                  <h4 className="text-sm font-bold text-on-surface">Step 4: Clinical Urgency & Patient Details</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Enter clinical context and attending physician sign-off for protocol compliance.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Dispatch Priority *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['CRITICAL', 'URGENT', 'ROUTINE'] as UrgencyLevel[]).map((level) => {
                      const isSelected = selectedUrgency === level;
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setSelectedUrgency(level)}
                          className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                              : 'border-surface-container bg-surface-container-low text-on-surface hover:bg-surface-container text-xs'
                          }`}
                        >
                          <span className="block text-xs uppercase">{level}</span>
                          <span className="block text-[10px] text-on-surface-variant mt-0.5">
                            {level === 'CRITICAL' ? '< 25m TAT' : level === 'URGENT' ? '< 2h TAT' : '< 24h'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                      Patient Reference / MRN *
                    </label>
                    <input
                      type="text"
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                      placeholder="e.g. PT-2026-9842"
                      className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                      Ward / Department / OT *
                    </label>
                    <input
                      type="text"
                      value={wardDepartment}
                      onChange={(e) => setWardDepartment(e.target.value)}
                      placeholder="e.g. Emergency OT #2 / Trauma ICU"
                      className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                      Attending Doctor Name *
                    </label>
                    <input
                      type="text"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      placeholder={currentHospital?.contactPerson || 'e.g. Dr. A. Sharma'}
                      className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                      Transfusion Authority / Sign-off
                    </label>
                    <input
                      type="text"
                      value={doctorAuthorizedPerson}
                      onChange={(e) => setDoctorAuthorizedPerson(e.target.value)}
                      placeholder="e.g. Chief of Anesthesiology / Trauma Lead"
                      className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Clinical Indication / Diagnosis
                  </label>
                  <input
                    type="text"
                    value={patientDiagnosis}
                    onChange={(e) => setPatientDiagnosis(e.target.value)}
                    placeholder="e.g. Severe polytrauma, massive hemorrhagic shock"
                    className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Signed Clinical Requisition Form (PDF or Scanned Slip)
                  </label>
                  <label className="border border-dashed border-surface-container rounded-xl p-3 flex items-center justify-center gap-2 bg-surface-container-low hover:bg-surface-container cursor-pointer transition-colors text-xs text-on-surface-variant">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setRequisitionDocName(e.target.files[0].name);
                        }
                      }}
                      className="hidden"
                    />
                    <UploadCloud className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-semibold text-on-surface truncate">
                      {requisitionDocName ? `Attached: ${requisitionDocName}` : 'Attach signed doctor slip or blood requisition order (optional)'}
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* STEP 5: Confirm Request */}
            {reqStep === 5 && (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                <div>
                  <h4 className="text-sm font-bold text-on-surface">Step 5: Confirm &amp; Initiate Smart Match Pipeline</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Review clinical parameters before broadcasting to blood bank cold-chains and standby donors.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-surface-container">
                    <span className="text-on-surface-variant">Requesting Hospital</span>
                    <span className="font-semibold text-on-surface">{currentHospital.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-surface-container">
                    <span className="text-on-surface-variant">Blood Group</span>
                    <span className="font-bold text-primary text-sm">{selectedGroup}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-surface-container">
                    <span className="text-on-surface-variant">Component</span>
                    <span className="font-semibold text-on-surface">{selectedComponent}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-surface-container">
                    <span className="text-on-surface-variant">Dosage</span>
                    <span className="font-bold text-on-surface">{unitCount} Units</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-surface-container">
                    <span className="text-on-surface-variant">Urgency</span>
                    <span className="font-bold uppercase text-primary">{selectedUrgency}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-surface-container">
                    <span className="text-on-surface-variant">Patient Reference</span>
                    <span className="font-mono text-on-surface">{patientId || 'Pending MRN'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-surface-container">
                    <span className="text-on-surface-variant">Ward / OT</span>
                    <span className="text-on-surface">{wardDepartment || 'Emergency Resuscitation'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-on-surface-variant">Attending Doctor</span>
                    <span className="font-semibold text-on-surface">{doctorName || currentHospital.contactPerson || 'Specialist On-Duty'}</span>
                  </div>
                </div>

                {/* Matching Blood Banks check */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Automated Smart Matching Pipeline
                  </span>
                  {(() => {
                    const matchingUnits = inventory.filter(
                      (u) => u.status === 'Available' && u.bloodGroup === selectedGroup
                    );
                    if (matchingUnits.length === 0) {
                      return (
                        <div className="p-3 rounded-lg bg-surface-container-low text-xs text-on-surface-variant border border-surface-container">
                          No instant repository stock. System will immediately arm 5km cascade and mobilize verified standby donors.
                        </div>
                      );
                    }
                    return (
                      <div className="p-3 rounded-lg bg-secondary/10 text-xs text-secondary font-medium border border-secondary/20">
                        Smart Match located {matchingUnits.length} verified {selectedGroup} units in local repositories. 7-minute reservation lock will engage upon authorization.
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-surface-container">
              <button
                type="button"
                disabled={reqStep === 1}
                onClick={() => setReqStep(Math.max(1, reqStep - 1))}
                className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                  reqStep === 1 ? 'opacity-40 cursor-not-allowed' : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                }`}
              >
                Back
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  Cancel
                </button>
                {reqStep < 5 ? (
                  <button
                    type="button"
                    onClick={() => setReqStep(Math.min(5, reqStep + 1))}
                    className="px-5 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleConfirmEmergencyRequisition}
                    className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>SUBMIT EMERGENCY REQUEST</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Smart Match & 7-Minute Reservation Pipeline Modal */}
      {selectedRequisitionForModal && (
        <RequisitionMatchModal
          requisition={selectedRequisitionForModal}
          onClose={() => setSelectedRequisitionForModal(null)}
        />
      )}
    </div>
  );
};
