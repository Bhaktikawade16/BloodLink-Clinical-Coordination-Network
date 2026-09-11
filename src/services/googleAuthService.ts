import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

declare global {
  interface Window {
    google?: any;
  }
}

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const firebaseAuth = getAuth(app);

// Provider factory for Google Auth
export const createGoogleProvider = (includeGmail = false): GoogleAuthProvider => {
  const provider = new GoogleAuthProvider();
  // Firebase GoogleAuthProvider requests 'email' and 'profile' by default.
  // We avoid redundant custom scopes that can trigger internal OAuth errors in Identity Toolkit.
  if (includeGmail) {
    provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
  }
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
};

// In-memory token cache (never stored in local/sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

/**
 * Attempt to obtain an access token via Google Identity Services (GSI).
 * This connects directly to Google OAuth without requiring Firebase's cross-origin authDomain iframe,
 * which avoids the notorious auth/internal-error in embedded preview iframes.
 */
export async function requestGsiAccessToken(
  clientId: string,
  includeGmail = false
): Promise<string | null> {
  if (typeof window === 'undefined' || !clientId) return null;

  // Poll briefly for window.google.accounts.oauth2 if script is loading
  if (!window.google?.accounts?.oauth2) {
    await new Promise((resolve) => {
      let checks = 0;
      const interval = setInterval(() => {
        checks++;
        if (window.google?.accounts?.oauth2 || checks > 15) {
          clearInterval(interval);
          resolve(null);
        }
      }, 100);
    });
  }

  if (!window.google?.accounts?.oauth2) return null;

  return new Promise((resolve) => {
    try {
      const scope = includeGmail
        ? 'email profile openid https://www.googleapis.com/auth/gmail.readonly'
        : 'email profile openid';

      let resolved = false;
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope,
        prompt: 'select_account',
        callback: (resp: any) => {
          if (!resolved) {
            resolved = true;
            if (resp && resp.access_token) {
              resolve(resp.access_token);
            } else {
              resolve(null);
            }
          }
        },
        error_callback: (err: any) => {
          console.warn('GSI client notice:', err);
          if (!resolved) {
            resolved = true;
            resolve(null);
          }
        }
      });
      client.requestAccessToken();
    } catch (err) {
      console.warn('GSI initialization notice:', err);
      resolve(null);
    }
  });
}

// Initialize auth state listener
export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthSignedOut?: () => void
) => {
  return onAuthStateChanged(firebaseAuth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else if (!user) {
      cachedAccessToken = null;
      if (onAuthSignedOut) onAuthSignedOut();
    }
  });
};

export interface ExtractedEmailDetails {
  email: string;
  name: string;
  photoUrl?: string;
  phone?: string;
  city?: string;
  bloodGroup?: string;
  organization?: string;
  messagesAnalyzed: number;
  sources: string[];
  snippetHighlights: string[];
}

/**
 * Intelligent parser to extract contact, location, and blood details from Gmail snippets and text
 */
function extractDetailsFromSnippets(snippets: string[]): {
  phone?: string;
  city?: string;
  bloodGroup?: string;
  organization?: string;
  highlights: string[];
} {
  const highlights: string[] = [];
  let phone: string | undefined;
  let city: string | undefined;
  let bloodGroup: string | undefined;
  let organization: string | undefined;

  // Indian and Metro Cities list
  const knownCities = [
    'Pune',
    'Mumbai',
    'Nagpur',
    'Nashik',
    'Thane',
    'Navi Mumbai',
    'Aurangabad',
    'Kolhapur',
    'Solapur',
    'Delhi',
    'New Delhi',
    'Bengaluru',
    'Bangalore',
    'Hyderabad',
    'Chennai',
    'Kolkata',
    'Ahmedabad',
    'Surat',
    'Jaipur',
    'Lucknow',
    'Indore',
    'Chandigarh'
  ];

  // Regex for Phone (+91 or standard 10-digit Indian numbers)
  const phoneRegex = /(?:\+?91[\s\-]?)?([6-9]\d{9})\b/;

  // Regex for Blood Groups
  const bloodGroupRegex = /\b(A|B|AB|O)\s*(\+|\-|Positive|Negative)\b/i;

  // Regex for Organization / Hospital keywords
  const orgRegex = /(?:Hospital|Medical Center|Clinic|Blood Bank|Trust|Red Cross|Foundation|Rotary)/i;

  for (const snippet of snippets) {
    // 1. Phone number
    if (!phone) {
      const pMatch = snippet.match(phoneRegex);
      if (pMatch && pMatch[1]) {
        phone = pMatch[1];
        highlights.push(`Found contact number in email: +91 ${phone}`);
      }
    }

    // 2. City
    if (!city) {
      for (const c of knownCities) {
        const cRegex = new RegExp(`\\b${c}\\b`, 'i');
        if (cRegex.test(snippet)) {
          city = c;
          highlights.push(`Detected city location in email: ${c}`);
          break;
        }
      }
    }

    // 3. Blood Group
    if (!bloodGroup) {
      const bgMatch = snippet.match(bloodGroupRegex);
      if (bgMatch) {
        const type = bgMatch[1].toUpperCase();
        const sign = bgMatch[2].toLowerCase().includes('neg') || bgMatch[2] === '-' ? '-' : '+';
        bloodGroup = `${type}${sign}`;
        highlights.push(`Found blood group mention in email: ${bloodGroup}`);
      }
    }

    // 4. Organization
    if (!organization && orgRegex.test(snippet)) {
      // Find sentence or fragment containing the org
      const parts = snippet.split(/[.,;\n]/);
      for (const part of parts) {
        if (orgRegex.test(part) && part.length < 60) {
          organization = part.trim();
          highlights.push(`Detected organization mention: ${organization}`);
          break;
        }
      }
    }
  }

  return { phone, city, bloodGroup, organization, highlights };
}

/**
 * Sign in with Google Popup, obtain OAuth Access Token, and auto-retrieve details from Google profile & optional Gmail
 */
export async function signInWithGoogleAndExtractDetails(options?: {
  includeGmail?: boolean;
}): Promise<{
  success: boolean;
  cancelled?: boolean;
  user?: User;
  accessToken?: string;
  extracted?: ExtractedEmailDetails;
  errorCode?: string;
  domain?: string;
  error?: string;
}> {
  try {
    isSigningIn = true;
    cachedAccessToken = null;

    const clientId = (firebaseConfig as any)?.oAuthClientId;

    // 1. Try Google Identity Services (GSI) first if client ID is configured
    // This directly opens Google's OAuth popup without requiring Firebase's cross-origin authDomain iframe,
    // avoiding the notorious auth/internal-error in embedded preview iframes.
    if (clientId) {
      try {
        const gsiToken = await requestGsiAccessToken(clientId, options?.includeGmail ?? false);
        if (gsiToken) {
          cachedAccessToken = gsiToken;

          // Fetch Google user profile directly
          const userProfileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${gsiToken}` }
          });

          if (userProfileRes.ok) {
            const profileData = await userProfileRes.json();
            const extracted: ExtractedEmailDetails = {
              email: profileData.email || '',
              name: profileData.name || profileData.given_name || profileData.email?.split('@')[0] || 'Google User',
              photoUrl: profileData.picture || undefined,
              phone: undefined,
              messagesAnalyzed: 0,
              sources: ['Google Account Profile (GSI)'],
              snippetHighlights: []
            };

            // Attempt non-blocking Firebase credential link
            try {
              const cred = GoogleAuthProvider.credential(null, gsiToken);
              await signInWithCredential(firebaseAuth, cred);
            } catch (fbErr) {
              console.info('Firebase credential link in iframe skipped (non-fatal):', fbErr);
            }

            // Inspect Gmail if requested
            if (options?.includeGmail) {
              try {
                const messagesRes = await fetch(
                  'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10',
                  {
                    headers: { Authorization: `Bearer ${gsiToken}` }
                  }
                );
                if (messagesRes.ok) {
                  const data = await messagesRes.json();
                  const messages = data.messages || [];
                  extracted.messagesAnalyzed = messages.length;
                  if (messages.length > 0) {
                    extracted.sources.push(`Gmail Inbox (${messages.length} messages analyzed)`);
                    const messageFetches = messages.slice(0, 6).map((m: { id: string }) =>
                      fetch(
                        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
                        {
                          headers: { Authorization: `Bearer ${gsiToken}` }
                        }
                      )
                        .then((r) => (r.ok ? r.json() : null))
                        .catch(() => null)
                    );
                    const messageResults = await Promise.all(messageFetches);
                    const snippets: string[] = [];
                    for (const msg of messageResults) {
                      if (msg) {
                        if (msg.snippet) snippets.push(msg.snippet);
                        if (msg.payload?.headers) {
                          const sub = msg.payload.headers.find((h: any) => h.name === 'Subject')?.value;
                          if (sub) snippets.push(sub);
                        }
                      }
                    }
                    const parsed = extractDetailsFromSnippets(snippets);
                    if (parsed.phone && !extracted.phone) extracted.phone = parsed.phone;
                    if (parsed.city && !extracted.city) extracted.city = parsed.city;
                    if (parsed.bloodGroup && !extracted.bloodGroup) extracted.bloodGroup = parsed.bloodGroup;
                    if (parsed.organization && !extracted.organization) extracted.organization = parsed.organization;
                    extracted.snippetHighlights = parsed.highlights;
                  }
                }
              } catch (gmailErr) {
                console.warn('Gmail inspection skipped:', gmailErr);
              }
            }

            return {
              success: true,
              user: firebaseAuth.currentUser || undefined,
              accessToken: gsiToken,
              extracted
            };
          }
        }
      } catch (gsiErr) {
        console.info('GSI attempt completed with fallback to Firebase:', gsiErr);
      }
    }

    // 2. Fallback to Firebase signInWithPopup
    // NOTE: Do not invoke signOut() right before signInWithPopup() as prompt: 'select_account'
    // already forces account picking, while signOut() causes an IndexedDB race condition triggering auth/internal-error.
    const provider = createGoogleProvider(options?.includeGmail ?? false);
    const result = await signInWithPopup(firebaseAuth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    const accessToken = credential?.accessToken || '';
    cachedAccessToken = accessToken;
    const user = result.user;

    const extracted: ExtractedEmailDetails = {
      email: user.email || '',
      name: user.displayName || user.email?.split('@')[0] || 'Google User',
      photoUrl: user.photoURL || undefined,
      phone: user.phoneNumber || undefined,
      messagesAnalyzed: 0,
      sources: ['Google Account Profile'],
      snippetHighlights: []
    };

    // Call Gmail API to inspect messages only if requested and accessToken exists
    if (options?.includeGmail && accessToken) {
      try {
        const messagesRes = await fetch(
          'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10',
          {
            headers: {
              Authorization: `Bearer ${cachedAccessToken}`
            }
          }
        );

        if (messagesRes.ok) {
          const data = await messagesRes.json();
          const messages = data.messages || [];
          extracted.messagesAnalyzed = messages.length;

          if (messages.length > 0) {
            extracted.sources.push(`Gmail Inbox (${messages.length} messages analyzed)`);

            // Fetch snippets in parallel (capped at 6)
            const messageFetches = messages.slice(0, 6).map((m: { id: string }) =>
              fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
                {
                  headers: {
                    Authorization: `Bearer ${cachedAccessToken}`
                  }
                }
              )
                .then((r) => (r.ok ? r.json() : null))
                .catch(() => null)
            );

            const messageResults = await Promise.all(messageFetches);
            const snippets: string[] = [];

            for (const msg of messageResults) {
              if (msg) {
                if (msg.snippet) snippets.push(msg.snippet);
                if (msg.payload?.headers) {
                  const sub = msg.payload.headers.find((h: any) => h.name === 'Subject')?.value;
                  if (sub) snippets.push(sub);
                }
              }
            }

            const parsed = extractDetailsFromSnippets(snippets);
            if (parsed.phone && !extracted.phone) extracted.phone = parsed.phone;
            if (parsed.city && !extracted.city) extracted.city = parsed.city;
            if (parsed.bloodGroup && !extracted.bloodGroup) extracted.bloodGroup = parsed.bloodGroup;
            if (parsed.organization && !extracted.organization) extracted.organization = parsed.organization;
            extracted.snippetHighlights = parsed.highlights;
          }
        }
      } catch (gmailErr) {
        console.warn('Gmail details inspection encountered a non-fatal error:', gmailErr);
        // Fallback gracefully to Google Profile details
      }
    }

    return {
      success: true,
      user,
      accessToken: cachedAccessToken,
      extracted
    };
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request'
    ) {
      console.info('Google Sign-in was dismissed or closed by the user.');
      return {
        success: false,
        cancelled: true,
        errorCode: error?.code,
        error: 'Sign-in window was closed. Please try again.'
      };
    }
    if (error?.code === 'auth/popup-blocked') {
      console.info('Google Sign-in popup was blocked by browser.');
      return {
        success: false,
        cancelled: true,
        errorCode: error?.code,
        error: 'The sign-in popup was blocked by your browser. Please allow popups for this site and try again.'
      };
    }
    if (error?.code === 'auth/unauthorized-domain') {
      const domain = typeof window !== 'undefined' ? window.location.hostname : '';
      return {
        success: false,
        errorCode: 'auth/unauthorized-domain',
        domain,
        error: `Google Sign-In is currently unavailable for this application domain (${domain}). Please add this domain to Firebase Console > Authentication > Settings > Authorized Domains.`
      };
    }
    if (
      error?.code === 'auth/internal-error' ||
      error?.message?.includes('auth/internal-error')
    ) {
      console.warn('Firebase auth/internal-error caught:', error);
      return {
        success: false,
        errorCode: 'auth/internal-error',
        error:
          'Firebase Authentication encountered an internal error (auth/internal-error). This is usually caused by preview iframe restrictions blocking cross-site OAuth storage. You can open the application in a new tab or use fast Google email sign-in.'
      };
    }
    if (error?.code === 'auth/network-request-failed') {
      return {
        success: false,
        errorCode: error?.code,
        error: 'Network issue detected. Please check your connection.'
      };
    }
    console.warn('Google Sign-in encountered an issue:', error?.message || error);
    return {
      success: false,
      errorCode: error?.code,
      error: getFriendlyAuthErrorMessage(error)
    };
  } finally {
    isSigningIn = false;
  }
}

/**
 * Helper to identify the current running domain dynamically (never hardcoded)
 */
export function getCurrentDomain(): string {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.hostname;
  }
  return '';
}

/**
 * Human-friendly error messages matching BloodLink specifications
 */
export function getFriendlyAuthErrorMessage(error: any): string {
  const code = error?.code || '';
  const domain = getCurrentDomain();
  switch (code) {
    case 'auth/unauthorized-domain':
      return `Google Sign-In is currently unavailable for this application domain (${domain}). Please add this domain to Firebase Console > Authentication > Settings > Authorized Domains.`;
    case 'auth/internal-error':
      return 'Firebase Authentication encountered an internal error (auth/internal-error). This is usually caused by browser preview iframe restrictions blocking cross-site OAuth storage. You can open the application in a new tab or use fast Google email sign-in.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in window was closed. Please try again.';
    case 'auth/cancelled-popup-request':
      return 'Authentication was cancelled. Please try again.';
    case 'auth/network-request-failed':
      return 'Network issue detected. Please check your connection.';
    case 'auth/popup-blocked':
      return 'The sign-in popup was blocked by your browser. Please allow popups for this site and try again.';
    case 'auth/operation-not-allowed':
      return 'Google Sign-In is not enabled for this Firebase project. Please enable Google under Authentication > Sign-in method in Firebase Console.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact administrator.';
    default:
      return error?.message || 'Unable to connect to Google account.';
  }
}

/**
 * Access token getter
 */
export async function getGoogleAccessToken(): Promise<string | null> {
  return cachedAccessToken;
}

/**
 * Sign out from Google Auth cleanly
 */
export async function logoutGoogle(): Promise<void> {
  try {
    await signOut(firebaseAuth);
  } catch (err) {
    console.warn('Firebase signOut non-fatal:', err);
  }
  cachedAccessToken = null;
}
