import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Type-only imports: they are erased at build time, so importing them is
 * safe even while prerendering on the server (no firebase/auth code runs
 * during SSR).
 */
import type { Auth, AuthError, ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';

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
 * Design notes (important for `auth/invalid-app-credential` reliability):
 *  - A reCAPTCHA token is single-use. In firebase v13 the public
 *    reset() was removed, so the correct lifecycle is: clear() the spent
 *    widget after EVERY attempt (success or failure), defensively wipe
 *    any reCAPTCHA markup left in the container, and bind a fresh widget
 *    on the next attempt. Rendering a new widget over stale markup, or
 *    stacking widgets, leaves invalid app-verification state that
 *    Firebase rejects as INVALID_APP_CREDENTIAL.
 *      Reference: Firebase web docs create the verifier, and call
 *      clear() to remove it before a new attempt; the JS SDK's own
 *      reCAPTCHA migration notes describe clearing/recaptcha markup
 *      cleanup between attempts for the same container.
 *  - The reCAPTCHA container must exist in the DOM before a verifier is
 *    bound to it; each watch is checked and missing containers fail
 *    loudly (console + friendy error) instead of failing silently.
 *  - All Firebase failures are logged raw (code + message + remediation)
 *    under the [FirebaseOtpAuth] console prefix.
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
   * Invisible reCAPTCHA widget, created once per container and reused
   * (reset) between OTP attempts.
   */
  private verifier: RecaptchaVerifier | null = null;

  /** Container id the current verifier is bound to. */
  private verifierContainerId: string | null = null;

  /** Guards against two phone-auth requests racing through one widget. */
  private sending = false;

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

    try {
      await this.sendOtpOnce(mobileNumber, recaptchaContainerId);
    } catch (error) {

      // A reCAPTCHA token is single-use and app verification is validated
      // every send. Google rejects the *occasional* token as invalid even
      // when the environment is configured correctly (spent/staled widget
      // state, e.g. after a previous attempt, a refresh raced, or a
      // transient bot-scoring flake). Firebase's own guidance is to retry
      // with a fresh widget, so retries ONCE internally, from a fully
      // reinstated reCAPTCHA state, before surfacing the failure.
      const isRejectedVerification =
        error instanceof FirebaseOtpError &&
        (error.code === 'invalid-app-credential' ||
          error.code === 'captcha-check-failed');

      if (!isRejectedVerification) {
        throw error;
      }

      this.log(
        'warn',
        'App verification was rejected once; retrying with a fresh reCAPTCHA widget.',
        error.code
      );

      // Full teardown of the spent widget before the retry; ensureVerifier
      // then re-runs the same clean -> create -> verify cycle it always
      // does, ending with a completely fresh reCAPTCHA state.
      await this.disposeVerifier();

      // Give reCAPTCHA a beat; immediate recreation over a just-cleared
      // container is exactly the state Google rejects.
      await new Promise((resolve) => setTimeout(resolve, 800));

      await this.sendOtpOnce(mobileNumber, recaptchaContainerId);

    }

  }

  /**
   * One app-verification attempt, from the caller-provided state.
   * Retries (when needed) are orchestrated by {@link sendOtp}.
   */
  private async sendOtpOnce(
    mobileNumber: string,
    recaptchaContainerId: string
  ): Promise<void> {

    if (this.sending) {
      throw new FirebaseOtpError(
        'An OTP request is already in progress. Please wait a moment.',
        'already-in-progress',
        'sending OTP'
      );
    }

    this.assertBrowser();

    this.sending = true;

    await this.loadAuth().then(async (auth) => {

      const { signInWithPhoneNumber, RecaptchaVerifier } =
        await import('firebase/auth');

      try {

        const verifier = await this.ensureVerifier(
          auth,
          recaptchaContainerId,
          RecaptchaVerifier
        );

        const e164Number = `${this.countryCode}${mobileNumber}`;

        this.log(
          'info',
          `Requesting OTP for ${e164Number} via invisible reCAPTCHA.`
        );

        this.confirmation = await signInWithPhoneNumber(
          auth,
          e164Number,
          verifier
        );

        // A reCAPTCHA token is single-use, so the widget is spent after
        // every attempt. In firebase v13 the verifier has no public
        // reset() — the only correct reuse pattern is clear() (which we
        // follow up with defensive container cleanup) and a fresh widget
        // on the next attempt.
        await this.disposeVerifier();

      } catch (error) {
        // Never leave a spent widget behind after a failed attempt.
        await this.disposeVerifier();
        throw this.toFriendlyError(error, 'sending OTP');
      }

    }).finally(() => {
      this.sending = false;
    });

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

    this.confirmation = null;
    this.lastVerifiedToken = null;

    await this.disposeVerifier();

    if (!this.isBrowser()) {
      return;
    }

    try {
      const auth = await this.loadAuth();
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
    } catch {
      // Reset must never throw into the caller's UI flow.
    }

  }

  // ================================================================== //
  // reCAPTCHA widget lifecycle
  // ================================================================== //

  /**
   * Returns a FRESH widget for the given container. A reCAPTCHA token is
   * single-use, so in firebase v13 (where the public reset() was removed
   * in favour of internal _reset) the correct app-credential-safe
   * lifecycle is: clear() the previous widget, wipe any recaptcha markup
   * the container still holds, then render a new invisible widget:
   *   clear + cleanup -> signInWithPhoneNumber -> clear + cleanup -> ...
   * Rendering a second widget over stale markup is what Firebase rejects
   * as invalid app verification (INVALID_APP_CREDENTIAL).
   */
  private async ensureVerifier(
    auth: Auth,
    containerId: string,
    verifierCtor: new (
      auth: Auth,
      container: string | HTMLElement,
      options?: { size?: 'invisible' | 'normal'; callback?: () => void }
    ) => RecaptchaVerifier
  ): Promise<RecaptchaVerifier> {

    // The container must be attached to the DOM when the widget is bound:
    // widgets on a detached <div> render nothing and verification fails.
    const container = document.getElementById(containerId);
    if (!container) {
      const message =
        `reCAPTCHA container "#${containerId}" was not found in the DOM. ` +
        'Render it statically inside the component template (not inside an @if / *ngIf that is currently hidden).';
      this.log('error', message);
      throw new FirebaseOtpError(
        'The app verification widget could not be initialised. Please reload the page and try again.',
        'recaptcha-container-missing',
        'preparing reCAPTCHA'
      );
    }

    // Always start from a clean container: tear down any previous widget
    // and remove leftover markup before binding a new one.
    if (this.verifier) {
      await this.disposeVerifier();
    }

    this.log('info', `Creating invisible reCAPTCHA verifier on "#${containerId}".`);

    try {
      this.verifier = new verifierCtor(
        auth,
        container,
        { size: 'invisible' }
      );
      this.verifierContainerId = containerId;
    } catch (error) {
      this.verifier = null;
      this.verifierContainerId = null;
      await this.clearContainerMarkup(container);
      throw this.toFriendlyError(error, 'preparing reCAPTCHA');
    }

    return this.verifier;

  }

  /** Puts the old widget down and clears the container (fails silently). */
  private async disposeVerifier(): Promise<void> {
    const verifier = this.verifier;
    const containerId = this.verifierContainerId;
    this.verifier = null;
    this.verifierContainerId = null;
    try {
      // clear() both removes the widget and resets reCAPTCHA state.
      await verifier?.clear();
      this.log('info', 'reCAPTCHA widget cleared.');
    } catch (error) {
      this.log('warn', 'reCAPTCHA widget clear() failed; forcing container cleanup.', error);
    }
    if (containerId) {
      const container = document.getElementById(containerId);
      if (container) {
        await this.clearContainerMarkup(container);
      }
    }
  }

  /**
   * Defensive cleanup: if any reCAPTCHA iframe/markup survives in the
   * container after clear(), remove it so a fresh widget never collides
   * with stale markup (a classic cause of invalid app verification).
   */
  private async clearContainerMarkup(container: HTMLElement): Promise<void> {
    try {
      if (container.childElementCount > 0) {
        this.log(
          'warn',
          `reCAPTCHA container "#${container.id}" still contains markup; clearing it.`,
          container
        );
        container.replaceChildren();
      }
    } catch {
      // Never break the OTP flow because of cleanup.
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
        'The reCAPTCHA/app verification result Firebase received was rejected. One retry with a fresh widget is done automatically in code; if the SECOND send still fails, check the following.',
        `Current origin: ${typeof location !== 'undefined' ? location.origin : 'unknown'} \u2014 this EXACT origin must be reachable:`,
        '1. When testing from localhost (http://localhost:4200) the default Firebase settings work; if you open the app via a LAN IP (http://192.168.x.x:4200), ngrok or another preview URL, add that exact host to Firebase console > Authentication > Sign-in method > Authorized domains, or test using http://localhost:4200 instead.',
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

    // Never memoize a rejection: a transient network error during first
    // initialization would otherwise fail every later attempt.
    if (!this.authPromise) {
      this.authPromise = (async () => {
        const { initializeApp, getApps, getApp } =
          await import('firebase/app');
        const { getAuth } = await import('firebase/auth');

        try {
          const app = getApps().length
            ? getApp()
            : initializeApp(environment.firebase);

          return getAuth(app);
        } catch (error) {
          this.log('error',
            'Firebase initialization failed. Check environment.*.ts firebase config.',
            error);
          this.authPromise = undefined; // allow a retry
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
