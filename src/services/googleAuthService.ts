import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const firebaseAuth = getAuth(app);

// Provider factory for Google Auth
export const createGoogleProvider = (includeGmail = false): GoogleAuthProvider => {
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/userinfo.email');
  provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
  if (includeGmail) {
    provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
  }
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
};

// In-memory token cache (never stored in local/sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

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
  error?: string;
}> {
  try {
    isSigningIn = true;
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
        error: 'Google sign-in popup was closed.'
      };
    }
    if (error?.code === 'auth/popup-blocked') {
      console.info('Google Sign-in popup was blocked by browser.');
      return {
        success: false,
        cancelled: true,
        error: 'Sign-in popup was blocked by your browser. Please allow popups or use instant sign-in.'
      };
    }
    console.warn('Google Sign-in encountered an issue:', error?.message || error);
    return {
      success: false,
      error: error?.message || 'Unable to connect to Google account.'
    };
  } finally {
    isSigningIn = false;
  }
}

/**
 * Access token getter
 */
export async function getGoogleAccessToken(): Promise<string | null> {
  return cachedAccessToken;
}

/**
 * Sign out from Google Auth
 */
export async function logoutGoogle(): Promise<void> {
  await signOut(firebaseAuth);
  cachedAccessToken = null;
}
