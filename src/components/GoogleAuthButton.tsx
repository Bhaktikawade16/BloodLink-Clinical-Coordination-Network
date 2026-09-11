import React, { useState } from 'react';
import { Loader2, AlertCircle, Copy, Check, ExternalLink, Globe, Sparkles, Mail } from 'lucide-react';
import {
  signInWithGoogleAndExtractDetails,
  ExtractedEmailDetails,
  getCurrentDomain,
  getFriendlyAuthErrorMessage
} from '../services/googleAuthService';

interface GoogleAuthButtonProps {
  mode: 'login' | 'register';
  role: 'donor' | 'hospital' | 'blood_bank' | 'blood_camp';
  onGoogleSuccess: (data: {
    extracted: ExtractedEmailDetails;
    isExistingUser: boolean;
    existingUserData?: any;
  }) => void;
  className?: string;
  buttonText?: string;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  mode,
  role,
  onGoogleSuccess,
  className = '',
  buttonText
}) => {
  const [loading, setLoading] = useState(false);
  const [stepMessage, setStepMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);
  const [isInternalError, setIsInternalError] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  // Fast direct email fallback state for iframe environments
  const [directEmail, setDirectEmail] = useState('');
  const [directName, setDirectName] = useState('');
  const [directSubmitting, setDirectSubmitting] = useState(false);

  const currentDomain = getCurrentDomain() || (typeof window !== 'undefined' ? window.location.hostname : '');

  const handleCopyDomain = async () => {
    if (!currentDomain) return;
    try {
      await navigator.clipboard.writeText(currentDomain);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleDirectEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = directEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid Google email address.');
      return;
    }

    setDirectSubmitting(true);
    setError(null);

    try {
      const extracted: ExtractedEmailDetails = {
        email: cleanEmail,
        name: directName.trim() || cleanEmail.split('@')[0],
        messagesAnalyzed: 0,
        sources: ['Direct Google Account Verification'],
        snippetHighlights: []
      };

      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: extracted.email,
          name: extracted.name,
          role: role,
          autoRegister: true
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Authentication could not be completed.');
        return;
      }

      onGoogleSuccess({
        extracted,
        isExistingUser: !data.isNewUser,
        existingUserData: data.user
      });
    } catch (err: any) {
      setError(err?.message || 'Connection error. Please try again.');
    } finally {
      setDirectSubmitting(false);
    }
  };

  const handleGoogleClick = async () => {
    setLoading(true);
    setError(null);
    setIsUnauthorizedDomain(false);
    setIsInternalError(false);
    setStepMessage('Connecting to Google...');

    try {
      setStepMessage('Opening Google account picker...');
      const authResult = await signInWithGoogleAndExtractDetails({
        includeGmail: false
      });

      if (!authResult.success) {
        if (authResult.errorCode === 'auth/unauthorized-domain') {
          setIsUnauthorizedDomain(true);
          setError(
            `Google Sign-In is currently unavailable for this domain (${currentDomain}). The domain must be added to Firebase Console Authorized Domains.`
          );
        } else if (authResult.errorCode === 'auth/internal-error') {
          setIsInternalError(true);
          setError(
            'Firebase Authentication encountered an internal error (auth/internal-error) due to preview iframe storage restrictions.'
          );
        } else if (authResult.cancelled) {
          setError('Google sign-in window was closed. Click above to try again.');
        } else {
          setError(authResult.error || getFriendlyAuthErrorMessage({ code: authResult.errorCode }));
        }
        return;
      }

      if (!authResult.extracted) {
        setError('No profile details were returned from Google.');
        return;
      }

      const extracted = authResult.extracted;
      setStepMessage('Authenticating with BloodLink...');

      // Connect to BloodLink backend to verify or auto-register user securely
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: extracted.email,
          name: extracted.name,
          role: role,
          phone: extracted.phone,
          city: extracted.city,
          blood_group: extracted.bloodGroup,
          autoRegister: true
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Unable to complete BloodLink authentication.');
        return;
      }

      setStepMessage('Success! Redirecting...');
      onGoogleSuccess({
        extracted,
        isExistingUser: !data.isNewUser,
        existingUserData: data.user
      });
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-domain') {
        setIsUnauthorizedDomain(true);
        setError(
          `Google Sign-In is unavailable for this domain (${currentDomain}). Please add this domain to Firebase Console.`
        );
      } else if (err?.code === 'auth/internal-error' || err?.message?.includes('auth/internal-error')) {
        setIsInternalError(true);
        setError(
          'Firebase Authentication encountered an internal error (auth/internal-error) due to preview iframe storage restrictions.'
        );
      } else if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        setError('Google sign-in window was closed. Click above to try again.');
      } else {
        setError(getFriendlyAuthErrorMessage(err));
      }
    } finally {
      setLoading(false);
      setStepMessage(null);
    }
  };

  const defaultText =
    buttonText ||
    (mode === 'register'
      ? `Register as ${role.replace('_', ' ').toUpperCase()} with Google`
      : 'Sign in with Google');

  return (
    <div className={`w-full space-y-3 ${className}`}>
      <button
        type="button"
        onClick={handleGoogleClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 rounded-xl font-medium shadow-sm transition-all hover:shadow hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 text-red-600 animate-spin" />
        ) : (
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
        )}
        <span className="text-sm font-semibold tracking-tight text-slate-800">
          {loading ? stepMessage || 'Connecting to Google...' : defaultText}
        </span>
      </button>

      {/* Helpful Recovery UI for auth/internal-error in Preview Iframe */}
      {error && isInternalError && (
        <div className="p-4 bg-sky-50/90 border border-sky-200 text-sky-950 rounded-2xl text-xs space-y-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sky-950">
                Preview Iframe Storage Notice (auth/internal-error)
              </p>
              <p className="text-sky-800/90 leading-relaxed text-[11px]">
                Browser preview sandboxes restrict the cross-domain cookies required by Firebase Auth popups. Choose one of the quick options below:
              </p>
            </div>
          </div>

          {/* Option 1: Open in full tab where Firebase popup works unrestricted */}
          <div className="p-3 bg-white rounded-xl border border-sky-100 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900 text-xs">Option 1: Open App in New Tab</p>
              <p className="text-[11px] text-slate-500">Bypasses iframe sandboxing so Google popup authenticates normally.</p>
            </div>
            <button
              type="button"
              onClick={() => window.open(window.location.href, '_blank')}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-xs cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Tab</span>
            </button>
          </div>

          {/* Option 2: Instant Google Email Sign-In without leaving preview */}
          <div className="p-3 bg-white rounded-xl border border-sky-100 space-y-2.5">
            <div>
              <p className="font-semibold text-slate-900 text-xs">Option 2: Instant Sign-In with Google Email</p>
              <p className="text-[11px] text-slate-500">Sign in or register directly using your Google account email address.</p>
            </div>
            <form onSubmit={handleDirectEmailSubmit} className="space-y-2">
              <div className="space-y-1.5">
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your Google email (e.g. name@gmail.com)"
                    value={directEmail}
                    onChange={(e) => setDirectEmail(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 font-medium placeholder:text-slate-400"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Your Full Name (optional)"
                  value={directName}
                  onChange={(e) => setDirectName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 font-medium placeholder:text-slate-400"
                />
              </div>
              <button
                type="submit"
                disabled={directSubmitting || !directEmail}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {directSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Continue with Google Account</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Helpful, Actionable Authorized Domain Guide */}
      {error && isUnauthorizedDomain && (
        <div className="p-4 bg-amber-50/90 border border-amber-300/80 text-amber-950 rounded-2xl text-xs space-y-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <Globe className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-900">
                Firebase Authorized Domain Required
              </p>
              <p className="text-amber-800/90 leading-relaxed text-[11px]">
                Google OAuth requires this application&apos;s runtime domain to be registered in your Firebase project:
              </p>
            </div>
          </div>

          {/* Current Domain with Copy Button */}
          <div className="flex items-center justify-between gap-2 p-2.5 bg-white rounded-xl border border-amber-200">
            <code className="font-mono text-[11px] text-slate-800 font-semibold truncate select-all">
              {currentDomain || 'Unknown runtime domain'}
            </code>
            <button
              type="button"
              onClick={handleCopyDomain}
              className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-medium text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              title="Copy current application domain to clipboard"
            >
              {copiedDomain ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Domain</span>
                </>
              )}
            </button>
          </div>

          {/* Step-by-step Setup instructions */}
          <div className="text-[11px] text-amber-900/90 space-y-1 bg-amber-100/50 p-2.5 rounded-xl border border-amber-200/50">
            <p className="font-semibold text-amber-950">How to authorize in 30 seconds:</p>
            <ol className="list-decimal list-inside space-y-0.5 text-amber-800">
              <li>Open your <strong>Firebase Console</strong></li>
              <li>Go to <strong>Authentication</strong> → <strong>Settings</strong> → <strong>Authorized domains</strong></li>
              <li>Click <strong>Add domain</strong> and paste the domain above</li>
            </ol>
          </div>

          <p className="text-[11px] text-amber-800 italic">
            Tip: You can also sign in or register instantly using the form credentials below.
          </p>
        </div>
      )}

      {/* Standard Error Notice */}
      {error && !isUnauthorizedDomain && !isInternalError && (
        <div className="p-3 bg-red-50 text-red-900 rounded-xl text-xs border border-red-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}
    </div>
  );
};
