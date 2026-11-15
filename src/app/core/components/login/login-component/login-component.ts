import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  DestroyRef,
  ChangeDetectorRef,
  Component,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  HttpClient,
  HttpErrorResponse
} from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { VendorNotificationService } from '../../../services/vendor-notification.service';
import { FirebaseOtpAuthService } from '../../../services/firebase-otp-auth.service';

interface LoginResponse {
  message: string;
  accessToken: string;
  tokenType: string;
  profile: {
    fldId: number;
    fldFullName: string;
    fldContactNumber: string;
    fldUserType: 'Admin' | 'Vendor' | 'Customer';
  };
}

@Component({
  selector: 'app-green-basket-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './login-component.html',
  styleUrl: './login-component.css'
})
export class LoginComponent {

  mobileNumber = '';
  otp = '';

  otpSent = false;
  isLoading = false;
  isSendingOtp = false;

  /** Seconds left before the user may request a new OTP. */
  resendCooldown = 0;
  private resendTimer?: ReturnType<typeof setInterval>;
  private readonly resendSeconds = 30;

  /** Invisible reCAPTCHA container rendered next to the OTP forms. */
  readonly recaptchaContainerId = 'loginRecaptchaContainer';

  rememberMe = false;
  private readonly rememberedMobileKey = 'gbRememberedMobile';

  errorMessage = '';
  successMessage = '';

private readonly apiUrl =
    `${environment.apiBaseUrl}/api/Authenticate`;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID)
    private platformId: object,
    private cdr: ChangeDetectorRef,
    private vendorNotifications: VendorNotificationService,
    private destroyRef: DestroyRef,
    private firebaseOtp: FirebaseOtpAuthService
  ) {
    this.destroyRef.onDestroy(() => {
      this.stopResendCountdown();
      // Drop the in-memory Firebase session (and its ID token) with the screen.
      void this.firebaseOtp.reset();
    });

    // Runs only in the browser after hydration; no storage access during SSR.
    afterNextRender(() => {
      // Already authenticated? Return to the user's screen instead of
      // showing the login screen again on refresh / return.
      this.restoreSessionRedirect();

      this.restoreRememberedMobile();
    });
  }

  // ================================================================ //
  // OTP ENTRY (Firebase Phone Authentication)
  // ================================================================ //

  /** Sends the OTP through Firebase Phone Authentication. */
  sendOTP(): void {

    if (this.isSendingOtp || this.isLoading) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    const mobile = this.mobileNumber.trim();

    if (!/^[6-9]\d{9}$/.test(mobile)) {

      this.errorMessage =
        'Please enter a valid 10-digit mobile number.';

      return;
    }

    this.isSendingOtp = true;
    this.cdr.detectChanges();

    void this.firebaseOtp
      .sendOtp(mobile, this.recaptchaContainerId)
      .then(() => {

        this.isSendingOtp = false;
        this.otp = '';
        this.otpSent = true;

        // Remember the number as soon as the challenge is created,
        // without waiting for the user to finish verification.
        this.persistRememberedMobile(mobile);

        this.startResendCountdown();

        this.successMessage =
          `An OTP has been sent to ${this.firebaseOtp.countryCode} ${mobile}.`;

        this.cdr.detectChanges();

      })
      .catch((error: Error) => {
        this.isSendingOtp = false;
        this.errorMessage = error.message ||
          'Unable to send the OTP. Please try again.';
        this.cdr.detectChanges();
      });

  }

  /** Resend OTP, gated by the countdown so mail/SMS charges stay sane. */
  resendOTP(): void {

    if (this.resendCooldown > 0 || this.isSendingOtp || this.isLoading) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isSendingOtp = true;
    this.cdr.detectChanges();

    // The shared service resets and reuses the same reCAPTCHA widget,
    // keeping app verification stable across attempts.
    void this.firebaseOtp
      .sendOtp(
        this.mobileNumber.trim(),
        this.recaptchaContainerId
      )
      .then(() => {

        this.isSendingOtp = false;
        this.otp = '';

        this.startResendCountdown();

        this.successMessage =
          `A new OTP has been sent to ${this.firebaseOtp.countryCode} ${this.mobileNumber.trim()}.`;

        this.cdr.detectChanges();

      })
      .catch((error: Error) => {
        this.isSendingOtp = false;
        this.errorMessage = error.message ||
          'Unable to resend the OTP. Please try again.';
        this.cdr.detectChanges();
      });

  }

  onOtpChange(value: string): void {
    this.otp = value.replace(/\D/g, '').slice(0, 6);
  }

  /** Verifies the OTP with Firebase, then continues to the backend login. */
  verifyLogin(): void {

    if (this.isLoading || this.isSendingOtp) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    const mobile = this.mobileNumber.trim();
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      this.errorMessage = 'Please enter a valid 10-digit mobile number.';
      this.cdr.detectChanges();
      return;
    }

    const enteredOTP = this.otp.trim();
    if (!/^\d{6}$/.test(enteredOTP)) {
      this.errorMessage = 'Please enter a valid 6-digit OTP.';
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    void this.firebaseOtp
      .verifyOtp(enteredOTP)
      .then((result) => {

        // Firebase verified the number. The ID token stays in memory only.
        this.loginWithBackend(result.idToken, mobile);

      })
      .catch((error: Error) => {

        this.isLoading = false;
        // Keep the OTP on screen so the user can simply retry on typos.
        this.otp = error.message.includes('expired')
          ? ''
          : this.otp;

        this.errorMessage = error.message ||
          'OTP verification failed. Please try again.';

        this.cdr.detectChanges();

      });

  }

  /**
   * Sends the verified Firebase ID token to the Green Basket backend.
   *
   * BACKEND INTEGRATION PENDING: the endpoint/DTO below is the prepared
   * contract. The backend must accept the Firebase ID token, validate it,
   * and return the same LoginResponse shape used by the app today
   * (accessToken + profile with fldUserType). No backend change is
   * implemented as part of this task.
   */
  private loginWithBackend(idToken: string, mobile: string): void {

    const payload = {
      fldContactNumber: mobile,
      FldFirebaseIdToken: idToken
    };

    this.http.post<LoginResponse>(`${this.apiUrl}/ValidateFirebaseAndLogin`, payload)
      .subscribe({

        next: (response) => {

          this.isLoading = false;

          if (!response.accessToken || !response.profile) {

            this.errorMessage =
              'Invalid login response received.';

            this.cdr.detectChanges();

            return;
          }

          if (isPlatformBrowser(this.platformId)) {

            // Backend session tokens (not the Firebase ID token).
            sessionStorage.setItem(
              'gbAccessToken',
              response.accessToken
            );

            sessionStorage.setItem(
              'gbProfile',
              JSON.stringify(response.profile)
            );

            // A fresh login starts a fresh inactivity period.
            sessionStorage.setItem(
              'gbLastActivityAt',
              String(Date.now())
            );

            this.persistRememberedMobile(mobile);

            void this.vendorNotifications.refreshSession();

          }

          this.successMessage =
            'Login successful.';
          this.otp = '';

          // The Firebase state is no longer needed on this screen.
          void this.firebaseOtp.reset();
          this.stopResendCountdown();

          this.cdr.detectChanges();

          this.navigateAfterLogin(
            response.profile.fldUserType
          );

        },

        error: (error: HttpErrorResponse) => {

          this.isLoading = false;

          this.errorMessage =
            error.status === 404
              ? 'Mobile verification succeeded, but the backend login endpoint is not yet available.'
              : error.error?.message ||
              'Login failed after OTP verification. Please try again.';

          this.otp = '';

          this.cdr.detectChanges();

        }

      });

  }

  changeMobileNumber(): void {

    if (this.isLoading || this.isSendingOtp) {
      return;
    }

    this.otpSent = false;
    this.otp = '';

    this.errorMessage = '';
    this.successMessage = '';

    this.stopResendCountdown();

    // Drop the pending verification state with the previous number.
    void this.firebaseOtp.reset();

    this.cdr.detectChanges();

  }

  private startResendCountdown(): void {

    this.stopResendCountdown();

    this.resendCooldown = this.resendSeconds;

    this.resendTimer = setInterval(() => {

      if (this.resendCooldown > 0) {
        this.resendCooldown--;
        this.cdr.detectChanges();
      }

      if (this.resendCooldown <= 0) {
        this.stopResendCountdown();
      }

    }, 1000);

  }

  private stopResendCountdown(): void {
    clearInterval(this.resendTimer);
    this.resendTimer = undefined;
    this.resendCooldown = 0;
  }

  private navigateAfterLogin(
    userType: string
  ): void {

    switch (userType) {

      case 'Admin':
        this.router.navigateByUrl(
          '/mastertables/tblProfile'
        );
        break;

      case 'Vendor':
        this.router.navigateByUrl('/transactiontables/tblOrder');
        break;

      case 'Customer':
        this.router.navigateByUrl(
          '/transactiontables/tblOrder'
        );
        break;

      default:
        this.errorMessage =
          'Unable to identify your profile type.';
        break;

    }
  }

  onRememberMeChange(checked: boolean): void {

    this.rememberMe = checked;

    // Unchecking the option removes the saved number immediately.
    if (!checked && isPlatformBrowser(this.platformId)) {
      try {
        sessionStorage.removeItem(this.rememberedMobileKey);
      } catch {
        // Storage can be blocked; login still works.
      }
    }

  }

  private restoreRememberedMobile(): void {

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      // Remember me must outlive a single browser session, so the number is
      // kept in localStorage. sessionStorage (used by older builds) is
      // migrated once and then cleared.
      let saved =
        localStorage.getItem(this.rememberedMobileKey)?.trim() || '';

      if (!/^[6-9]\d{9}$/.test(saved)) {
        const sessionSaved =
          sessionStorage.getItem(this.rememberedMobileKey)?.trim() || '';
        if (/^[6-9]\d{9}$/.test(sessionSaved)) {
          saved = sessionSaved;
          try {
            localStorage.setItem(this.rememberedMobileKey, saved);
            sessionStorage.removeItem(this.rememberedMobileKey);
          } catch {
            // Keep using the sessionStorage value; login still works.
          }
        }
      }

      if (/^[6-9]\d{9}$/.test(saved)) {
        this.mobileNumber = saved;
        this.rememberMe = true;
      }
    } catch {
      // Ignore unavailable storage and let the user type the number.
    }

    this.cdr.detectChanges();

  }

  private persistRememberedMobile(mobile: string): void {

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      // Remember me is meant to outlive a single browser session, so the
      // number is kept in localStorage. The access token stays in
      // sessionStorage and is cleared by idle timeout / logout.
      if (this.rememberMe) {
        localStorage.setItem(this.rememberedMobileKey, mobile);
        sessionStorage.removeItem(this.rememberedMobileKey);
      } else {
        localStorage.removeItem(this.rememberedMobileKey);
        sessionStorage.removeItem(this.rememberedMobileKey);
      }
    } catch {
      // The login itself must not fail because storage is unavailable.
    }

  }

  /** If a session is already valid, skip the login screen on return / refresh. */
  private restoreSessionRedirect(): void {

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      const token = sessionStorage.getItem('gbAccessToken')?.trim();
      const profileRaw = sessionStorage.getItem('gbProfile');
      if (!token || !profileRaw) {
        return;
      }

      const profile = JSON.parse(profileRaw);
      const userType = profile?.fldUserType;
      if (!userType) {
        return;
      }

      switch (userType) {

        case 'Vendor':
        case 'Customer':
          this.router.navigateByUrl(
            '/transactiontables/tblOrder',
            { replaceUrl: true }
          );
          break;

        case 'Admin':
          this.router.navigateByUrl(
            '/mastertables/tblProfile',
            { replaceUrl: true }
          );
          break;

        default:
          // Unknown role: stay on the login screen.
          return;
      }
    } catch {
      // Stored session is corrupt; fall through to the normal login flow.
    }

  }

}
