import { Injectable, PLATFORM_ID, inject } from '@angular/core';
// import { environment } from '../../../environments/environment';

/**
 * Type-only imports: they are erased at build time, so importing them is
 * safe even while prerendering on the server (no firebase/auth code runs
 * during SSR).
 */
import type { Auth, AuthError, ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';
import { environment } from '../../../environments/environment';

/** Shape returned after a successful OTP verification. */
export interface OtpVerificationResult {
  /** Firebase ID token for the signed-in user (session only; never persisted). */
  idToken: string;
  /** Phone number Firebase reports for the signed-in user (E.164 format). */
  phoneNumber: string;
}

/**
 * Robust, well-logged error thrown by this service so screens can surface
 * a friendly message while the console keeps the raw details.
 */
export class FirebaseOtpError extends Error {
  constructor(
    message: string,
    /** Lowercased Firebase error code without the "auth/" prefix, if any. */
    readonly code: string,
    /** Context label, e.g. "sending OTP" / "verifying OTP". */
    readonly context: string
  ) {
    super(message);
  }
}

/**
 * Shared Firebase Phone-Authentication (OTP) service.
 *
 * Keeps every screen out of Firebase plumbing details:
 *  - Sends an OTP to an Indian (+91) mobile number using an invisible
 *    reCAPTCHA verifier rendered in the calling component.
 *  - Verifies the OTP entered by the user and exposes the Firebase ID
 *    token so callers can pass it to the Green Basket backend.
 *
 * Lifecycle: each send uses a fresh child element inside the caller's
 * container. Sends and resets are serialized; the verifier is cleared
 * after each completed attempt. Firebase app verification stays enabled.
 *
 * Security notes:
 *  - The ID token is held in memory only. It is deliberately NOT stored
 *    in localStorage / sessionStorage. OTPs are never stored anywhere.
 *  - Firebase initializes lazily via dynamic imports, so the firebase SDK
 *    never executes during server-side rendering.
 */
@Injectable({ providedIn: 'root' })
export class FirebaseOtpAuthService {

  /** Console prefix used for every diagnostic log of this service. */
  private static readonly LOG_PREFIX = '[FirebaseOtpAuth]';

  /** Fixed dialing code used for number entry in this app. */
  readonly countryCode = '+91';

  private readonly platformId = inject(PLATFORM_ID);

  /** Memoized promise that resolves to the browser-only Auth instance. */
  private authPromise?: Promise<Auth>;

  /**
   * Result returned by signInWithPhoneNumber; holds the ability to verify
   * the OTP. Kept in memory only.
   */
  private confirmation: ConfirmationResult | null = null;

  /**
   * ID token captured at the moment the OTP was verified successfully.
   * Some flows tear the Firebase session down right after verification
   * (e.g. registration screens), so this in-memory copy is what allows
   * `getIdToken()` to still hand the token to the caller at submit time.
   * Memory only; never persisted and cleared by `reset()`.
   */
  private lastVerifiedToken: string | null = null;

  /**
   * Invisible reCAPTCHA widget owned by the current send attempt.
   */
  private verifier: RecaptchaVerifier | null = null;

  /** Container id the current verifier is bound to. */

  /** Guards against two phone-auth requests racing through one widget. */
  private sending = false;

  private nextSendAllowedAt = 0;

  private operationQueue: Promise<void> = Promise.resolve();
  private verifierElement: HTMLElement | null = null;

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.operationQueue.then(operation);
    this.operationQueue = result.then(() => undefined, () => undefined);
    return result;
  }

  // ================================================================== //
  // Public API
  // ================================================================== //

  /**
   * Sends an OTP to the given 10-digit Indian mobile number.
   *
   * @param mobileNumber 10-digit number, without the country code.
   * @param recaptchaContainerId id of the <div> rendered by the caller
   *                             that Firebase uses for invisible
   *                             reCAPTCHA verification. The container
   *                             must exist in the DOM at call time.
   */
  async sendOtp(
    mobileNumber: string,
    recaptchaContainerId: string
  ): Promise<void> {
    this.assertBrowser();

    if (this.sending) {
      throw new FirebaseOtpError(
        'An OTP request is already in progress. Please wait.',
        'already-in-progress',
        'sending OTP'
      );
    }

    const mobile = mobileNumber.trim();
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      throw new FirebaseOtpError(
        'Please enter a valid 10-digit mobile number.',
        'invalid-phone-number',
        'sending OTP'
      );
    }

    const remainingSeconds = Math.ceil(
      (this.nextSendAllowedAt - Date.now()) / 1000
    );

    if (remainingSeconds > 0) {
      throw new FirebaseOtpError(
        `Please wait ${remainingSeconds} seconds before requesting another OTP.`,
        'resend-cooldown',
        'sending OTP'
      );
    }

    // App-level protection against rapid repeat requests.
    // This does not represent Firebase's own blocking duration.
    this.nextSendAllowedAt = Date.now() + 60_000;

    this.sending = true;
    try {
      await this.enqueue(async () => {
        this.confirmation = null;
        this.lastVerifiedToken = null;
        try {
          const auth = await this.loadAuth();
          const { signInWithPhoneNumber, RecaptchaVerifier } =
            await import('firebase/auth');
          const verifier = await this.ensureVerifier(
            auth, recaptchaContainerId, RecaptchaVerifier
          );

          this.log('info', 'Requesting OTP via invisible reCAPTCHA.');
          this.confirmation = await signInWithPhoneNumber(
            auth, `${this.countryCode}${mobile}`, verifier
          );
        } catch (error) {
          if (error instanceof FirebaseOtpError) {
            throw error;
          }
          throw this.toFriendlyError(error, 'sending OTP');
        } finally {
          await this.disposeVerifier();
        }
      });
    } finally {
      this.sending = false;
    }
  }

  /**
   * Verifies the 6-digit OTP entered by the user.
   *
   * On success Firebase has signed the user in and we return the ID token
   * (in memory only).
   */
  async verifyOtp(otp: string): Promise<OtpVerificationResult> {

    this.assertBrowser();

    if (!this.confirmation) {
      throw new FirebaseOtpError(
        'The OTP session has expired. Please request a new OTP.',
        'no-active-confirmation',
        'verifying OTP'
      );
    }

    try {

      const credential = await this.confirmation.confirm(otp);
      const user = credential.user;
      const idToken = await user.getIdToken();

      // Remember the token verified here so a later getIdToken() can still
      // return it even if the Firebase session is signed out in between.
      this.lastVerifiedToken = idToken;

      this.log('info', 'OTP verified successfully by Firebase.');

      return {
        idToken,
        phoneNumber: user.phoneNumber || ''
      };

    } catch (error) {
      // confirmationResult stays reusable: the user can correct a typo and
      // retry, or request a new OTP after a code-expired error.
      throw this.toFriendlyError(error, 'verifying OTP');
    }

  }

  /**
   * Returns the current Firebase user's ID token. When the session has
   * already been signed out (registration screens do this right after
   * verification), falls back to the token captured during `verifyOtp()`.
   * Returns null only when neither is available. Never persisted anywhere.
   */
  async getIdToken(): Promise<string | null> {

    if (!this.isBrowser()) {
      return null;
    }

    const auth = await this.loadAuth();
    const { onAuthStateChanged } = await import('firebase/auth');

    return new Promise<string | null>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe();
        if (!user) {
          resolve(this.lastVerifiedToken);
          return;
        }
        try {
          resolve(await user.getIdToken());
        } catch {
          resolve(this.lastVerifiedToken);
        }
      });
    });

  }

  /**
   * Removes the signed-in Firebase session, the pending OTP verification
   * and the reCAPTCHA widget (widget teardown only — app verification is
   * never bypassed).
   */
  async reset(): Promise<void> {
    if (!this.isBrowser()) {
      return;
    }

    // Queue teardown behind an active send; a later send waits for teardown.
    await this.enqueue(async () => {
      this.confirmation = null;
      this.lastVerifiedToken = null;
      await this.disposeVerifier();
      try {
        if (this.authPromise) {
          const auth = await this.authPromise;
          const { signOut } = await import('firebase/auth');
          await signOut(auth);
        }
      } catch {
        // Teardown must not throw into the caller's UI flow.
      }
    });
  }

  // ================================================================== //
  // reCAPTCHA widget lifecycle
  // ================================================================== //

  private async ensureVerifier(
    auth: Auth,
    containerId: string,
    verifierCtor: new (
      auth: Auth,
      container: string | HTMLElement,
      options?: { size?: 'invisible' | 'normal'; callback?: () => void }
    ) => RecaptchaVerifier
  ): Promise<RecaptchaVerifier> {
    await this.disposeVerifier();

    const container = document.getElementById(containerId);
    if (!container || !container.isConnected) {
      throw new FirebaseOtpError(
        'The verification widget is unavailable. Reload the page and try again.',
        'recaptcha-container-missing',
        'preparing reCAPTCHA'
      );
    }

    // Keep Angular's host div. Never bind another widget to the same
    // element: Google's registry may retain it after clear()/DOM cleanup.
    const widgetElement = document.createElement('div');
    container.replaceChildren(widgetElement);
    this.verifierElement = widgetElement;

    try {
      const verifier = new verifierCtor(
        auth, widgetElement, { size: 'invisible' }
      );
      this.verifier = verifier;
      // signInWithPhoneNumber renders/verifies it; do not render it twice.
      return verifier;
    } catch (error) {
      await this.disposeVerifier();
      throw this.toFriendlyError(error, 'preparing reCAPTCHA');
    }
  }

  private async disposeVerifier(): Promise<void> {
    const verifier = this.verifier;
    const element = this.verifierElement;
    this.verifier = null;
    this.verifierElement = null;

    try {
      verifier?.clear();
    } catch {
      this.log('warn', 'reCAPTCHA cleanup failed; removing its owned element.');
    } finally {
      element?.remove();
    }
  }

  // ================================================================== //
  // Diagnostics
  // ================================================================== //

  private log(
    level: 'info' | 'warn' | 'error',
    message: string,
    detail?: unknown
  ): void {
    const tag = `${FirebaseOtpAuthService.LOG_PREFIX} ${message}`;
    if (level === 'error') {
      console.error(tag, detail ?? '');
    } else if (level === 'warn') {
      console.warn(tag, detail ?? '');
    } else {
      console.info(tag);
    }
  }

  /**
   * Maps Firebase AuthError codes to user-friendly, non-technical messages
   * (returned to the UI) while logging the raw code plus a concrete
   * remediation checklist to the console. Never leaks OTPs or tokens.
   */
  toFriendlyError(error: unknown, context: string): FirebaseOtpError {

    const errorCode = (error as AuthError)?.code?.startsWith?.('auth/')
      ? (error as AuthError).code
      : 'unknown-error';
    const rawMessage =
      (error as AuthError)?.message ||
      (error instanceof Error ? error.message : String(error));

    const messages: Record<string, string> = {
      'auth/invalid-phone-number':
        'Please enter a valid 10-digit mobile number.',
      'auth/missing-phone-number':
        'Please enter your mobile number and try again.',
      'auth/invalid-verification-code':
        'Incorrect OTP. Please check the code and try again.',
      'auth/missing-verification-code':
        'Please enter the 6-digit OTP.',
      'auth/code-expired':
        'This OTP has expired. Please click on Resend OTP to get a new code.',
      'auth/too-many-requests':
        'Too many attempts. Please wait a while before trying again.',
      'auth/quota-exceeded':
        'SMS quota has been reached for now. Please try again later.',
      'auth/captcha-check-failed':
        'reCAPTCHA verification failed. Please retry sending the OTP.',
      'auth/unauthorized-domain':
        'Mobile sign-in is not allowed for this website domain yet.',
      'auth/invalid-app-credential':
        'App verification failed on Google\u2019s side. Please tap Send OTP once more \u2014 if it keeps failing, check that this site\u2019s address is added as an Authorized domain in Firebase (see browser console for details).',
      'auth/billing-not-enabled':
        'Phone authentication requires billing to be enabled on the Firebase project.',
      'auth/operation-not-allowed':
        'Phone authentication is not enabled for this Firebase project.',
      'auth/network-request-failed':
        'Network problem. Please check your connection and try again.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/internal-error': 'A temporary Firebase problem occurred. Please try again.'
    };

    const friendly =
      messages[errorCode] ||
      'Mobile verification failed. Please try again.';

    const remediation: Record<string, string[]> = {
      'auth/invalid-app-credential': [
        'Firebase rejected app verification. Retry manually; no automatic SMS retry is performed.',
        `Current origin: ${typeof location !== 'undefined' ? location.origin : 'unknown'} \u2014 this EXACT origin must be reachable:`,
        '1. Confirm localhost is listed in Firebase Authorized domains; if you open the app via a LAN IP (http://192.168.x.x:4200), ngrok or another preview URL, add that exact host to Firebase console > Authentication > Sign-in method > Authorized domains, or test using http://localhost:4200 instead.',
        '2. Common transient cause: a shared/spent reCAPTCHA state. Close the browser tab and open a fresh one, then send again.',
        '3. Browser extensions (ad-blockers, VPN, privacy tools) block google.com/recaptcha; try an incognito window with extensions off.',
        '4. Firebase console > Authentication > Sign-in method > Phone provider must be enabled, and Project Settings > General must match apiKey/projectId/appId in environment.*.ts for this exact project.',
        '5. Google Cloud console > APIs & Services > Credentials: API key HTTP-referrer restrictions must include the current origin, and the Identity Toolkit API must be enabled.'
      ],
      'auth/captcha-check-failed': [
        'The reCAPTCHA check failed at Firebase (invalid/cross-domain/security policy).',
        '1. Make sure the reCAPTCHA container div is rendered statically, not toggled by @if/*ngIf at send time.',
        '2. Common causes: locked-down Firebase project, browser extensions blocking reCAPTCHA, or a service-worker/CDN interfering with google.com/recaptcha requests.'
      ],
      'auth/unauthorized-domain': [
        `Add the current domain to Firebase console > Authentication > Sign-in method > Authorized domains.`,
      ],
      'auth/operation-not-allowed': [
        'Enable the "Phone" provider under Firebase console > Authentication > Sign-in method.'
      ],
      'auth/quota-exceeded': [
        'Phone auth quota/billing: check Firebase console usage limits.'
      ]
    };

    this.log('error',
      `${context} failed.`,
      {
        code: errorCode,
        firebaseMessage: rawMessage,
        userAgent: navigator.userAgent,
        currentDomain: location.host,
        tips: remediation[errorCode] ?? 'No additional hints; compare google/identitytoolkit network calls for details.'
      });

    // Keep the raw code on the thrown error; internal callers can log it.
    return new FirebaseOtpError(friendly, errorCode.replace(/^auth\//, ''), context);

  }

  // ---------------------------------------------------------------- //
  // Internals
  // ---------------------------------------------------------------- //

  /** Lazily initialize Firebase (browser only) exactly once. */
  private loadAuth(): Promise<Auth> {

    if (!this.authPromise) {
      this.authPromise = (async () => {
        const { initializeApp, getApps, getApp } =
          await import('firebase/app');

        const { getAuth } = await import('firebase/auth');

        try {
          const app = getApps().length
            ? getApp()
            : initializeApp(environment.firebase);

          const auth = getAuth(app);

          // Enable fictional-number testing only during local development.
          // auth.settings.appVerificationDisabledForTesting =
          //   !environment.production &&
          //   ['localhost', '127.0.0.1'].includes(
          //     window.location.hostname
          //   );

          auth.settings.appVerificationDisabledForTesting = false;

          return auth;

        } catch (error) {
          this.log(
            'error',
            'Firebase initialization failed. Check environment.*.ts firebase config.',
            error
          );

          this.authPromise = undefined;
          throw error;
        }
      })();
    }

    return this.authPromise;
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' &&
      typeof document !== 'undefined' &&
      this.platformId !== 'server';
  }

  private assertBrowser(): void {
    if (!this.isBrowser()) {
      throw new FirebaseOtpError(
        'Phone verification must run in a browser environment.',
        'ssr-unsupported',
        'browser check'
      );
    }
  }
}
