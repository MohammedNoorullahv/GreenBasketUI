// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-login-component',
//   imports: [],
//   templateUrl: './login-component.html',
//   styleUrl: './login-component.css',
// })
// export class LoginComponent {

// }


import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  DestroyRef,
  ElementRef,
  ViewChild,
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
// import { environment } from '../../../environments/environment';

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
  mpin = '';
  verificationMethod: 'OTP' | 'MPIN' = 'MPIN';
  readonly mpinLength = 6; // Match this to your backend MPIN policy.
  showMPIN = false;

  otpSent = false;
  isLoading = false;

  errorMessage = '';
  successMessage = '';

  private readonly apiUrl =
    `${environment.apiBaseUrl}/api/Authenticate`;

  showIntroVideo = false;
  private readonly introSessionKey = 'gb.introShown.v1';
  private introWatchdog?: ReturnType<typeof setTimeout>;
  private introElement?: HTMLVideoElement;
  private introDestroyed = false;

  @ViewChild('introVideo')
  set introVideoRef(ref: ElementRef<HTMLVideoElement> | undefined) {
    this.introElement = ref?.nativeElement;
    if (!this.introElement || !this.showIntroVideo) return;
    const video = this.introElement;
    video.muted = true;
    // Catch blocked autoplay as well as unsupported media.
    void Promise.resolve().then(() => {
      if (!this.introDestroyed && this.showIntroVideo && this.introElement === video) {
        return video.play();
      }

      return undefined;
    }).catch(() => this.finishIntro());
  }


  introVideoCompleted = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID)
    private platformId: object,
    private cdr: ChangeDetectorRef,
    private vendorNotifications: VendorNotificationService,
    private destroyRef: DestroyRef
  ) {
    this.destroyRef.onDestroy(() => {
      this.introDestroyed = true;
      clearTimeout(this.introWatchdog);
      this.introElement?.pause();
    });

    // Runs only in the browser after hydration; no storage access during SSR.
    afterNextRender(() => {
      try {
        if (sessionStorage.getItem(this.introSessionKey)) {
          this.introVideoCompleted = true;
          return;
        }
        // Record BEFORE playback: refreshing mid-video must still show login.
        sessionStorage.setItem(this.introSessionKey, '1');
      } catch {
        // If storage is blocked, keep login accessible instead of replaying.
        this.introVideoCompleted = true;
        return;
      }
      this.showIntroVideo = true;
      this.onIntroVideoProgress();
      this.cdr.detectChanges();
    });
  }

  skipIntro(): void {
    this.finishIntro();
  }

  onIntroVideoEnded(): void {
    this.finishIntro();
  }

  onIntroVideoError(): void {
    this.finishIntro();
  }

  onIntroVideoProgress(): void {
    if (this.introDestroyed || !this.showIntroVideo) return;
    clearTimeout(this.introWatchdog);
    // Loading or playback that makes no progress for 8 seconds cannot block login.
    this.introWatchdog = setTimeout(() => this.finishIntro(), 8000);
  }

  private finishIntro(): void {
    if (this.introDestroyed) return;
    clearTimeout(this.introWatchdog);
    this.introElement?.pause();
    this.showIntroVideo = false;
    this.introVideoCompleted = true;
    this.cdr.detectChanges();
  }

  sendOTP(): void {

    if (this.isLoading) {
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

    this.isLoading = true;

    this.http.post<any>(
      `${this.apiUrl}/GenerateOTP`,
      null,
      {
        params: {
          fldContactNumber: mobile
        }
      }
    )
      .subscribe({

        next: (response) => {

          // Do not log authentication responses or verification codes.

          this.isLoading = false;

          this.otp = '';

          this.mpin = '';
          this.showMPIN = false;
          this.verificationMethod = 'MPIN';
          this.otpSent = true;

          this.successMessage =
            'OTP generated successfully. Please enter your OTP.';

          this.cdr.detectChanges();

        },

        error: (error: HttpErrorResponse) => {

          this.isLoading = false;

          this.errorMessage =
            error.error?.message ||
            'Unable to generate OTP. Please try again.';

          this.cdr.detectChanges();

        }

      });

  }

  selectVerificationMethod(method: 'OTP' | 'MPIN'): void {
    if (this.isLoading) return;
    this.verificationMethod = method;
    this.otp = '';
    this.mpin = '';
    this.showMPIN = false;
    this.errorMessage = '';
    this.successMessage = '';
  }

  onMPINChange(value: string): void {
    this.mpin = value.replace(/\D/g, '').slice(0, this.mpinLength);
  }

  verifyOTP(): void {
    this.verifyLogin();
  }

  verifyLogin(): void {

    if (this.isLoading) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    const method = this.verificationMethod;
    const mobile = this.mobileNumber.trim();
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      this.errorMessage = 'Please enter a valid 10-digit mobile number.';
      return;
    }

    const enteredOTP =
      method === 'OTP' ? this.otp.trim() : '';

    const enteredMPIN =
      method === 'MPIN' ? this.mpin.trim() : '';

    // The selected credential must contain exactly six digits.
    const credential = enteredOTP || enteredMPIN;
    //const credential = method === 'OTP' ? this.otp.trim() : this.mpin.trim();

    const expectedLength = method === 'OTP' ? 6 : this.mpinLength;
    if (!new RegExp(`^\\d{${expectedLength}}$`).test(credential)) {
      this.errorMessage = `Please enter a valid ${expectedLength}-digit ${method}.`;
      this.cdr.detectChanges();
      return;
    }
    this.isLoading = true;




    // At least one credential is compulsory.
    if (!enteredOTP && !enteredMPIN) {
      this.errorMessage = 'Please enter OTP or MPIN.';
      this.cdr.detectChanges();
      return;
    }




    if (!/^\d{6}$/.test(credential)) {
      this.errorMessage =
        `Please enter a valid 6-digit ${method}.`;

      this.cdr.detectChanges();
      return;
    }


    const payload = {
      FldContactNumber: mobile,
      FldOTP: enteredOTP,
      FldMPIN: enteredMPIN
    };

    this.isLoading = true;

    // const payload = method === 'OTP'
    //   ? { fldContactNumber: mobile, fldOTP: credential }
    //   : { fldContactNumber: mobile, fldMPIN: credential };
    // // Integration contract: confirm this endpoint/DTO with AuthenticateController.
    // // MPIN must be validated on the server, returning the same LoginResponse as OTP.
    //const endpoint = method === 'OTP' ? 'ValidateOTPAndLogin' : 'ValidateMPINAndLogin';
    const endpoint = method === 'OTP' ? 'ValidateOTPAndLogin' : 'ValidateOTPAndLogin';

    this.http.post<LoginResponse>(`${this.apiUrl}/${endpoint}`, payload)
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

            sessionStorage.setItem(
              'gbAccessToken',
              response.accessToken
            );

            sessionStorage.setItem(
              'gbProfile',
              JSON.stringify(response.profile)
            );

            void this.vendorNotifications.refreshSession();

          }



          this.successMessage =
            'Login successful.';
          this.otp = '';
          this.mpin = '';
          this.showMPIN = false;

          this.cdr.detectChanges();

          this.navigateAfterLogin(
            response.profile.fldUserType
          );

        },

        error: (error: HttpErrorResponse) => {

          this.isLoading = false;

          this.errorMessage =
            error.status === 400 || error.status === 401
              ? `Invalid ${method}. Please try again.`
              : error.error?.message ||
              (error.status === 404 && method === 'MPIN'
                ? 'MPIN login endpoint is unavailable. Please use OTP.'
                : `${method} verification failed. Please try again.`);

          this.otp = '';
          this.mpin = '';
          this.showMPIN = false;

          this.cdr.detectChanges();

        }

      });

  }

  changeMobileNumber(): void {
    if (this.isLoading) return;
    this.mpin = '';
    this.showMPIN = false;
    this.verificationMethod = 'MPIN';

    this.otpSent = false;
    this.otp = '';

    this.errorMessage = '';
    this.successMessage = '';

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

  onOTPChange(value: string): void {

    this.otp = value
      .replace(/\D/g, '')
      .slice(0, 6);

  }

  testOTPScreen(): void {

    this.otpSent = true;

    this.isLoading = false;

    this.successMessage = 'OTP screen test successful.';

    console.log(
      'OTP Screen Test:',
      this.otpSent,
      this.isLoading
    );

    this.cdr.detectChanges();

  }

}