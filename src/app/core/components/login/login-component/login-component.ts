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
import { environment } from '../../../../../environments/environment.development';
// import { environment } from '../../../environments/environment.development';

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
  verificationMethod: 'OTP' | 'MPIN' = 'OTP';
  readonly mpinLength = 6; // Match this to your backend MPIN policy.
  showMPIN = false;

  otpSent = false;
  isLoading = false;

  errorMessage = '';
  successMessage = '';

  private readonly apiUrl =
    `${environment.apiBaseUrl}/api/Authenticate`;

  showIntroVideo = true;

  introVideoCompleted = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID)
    private platformId: object,
    private cdr: ChangeDetectorRef
  ) { }

  onIntroVideoEnded(): void {

    this.showIntroVideo = false;

    this.introVideoCompleted = true;

    this.cdr.detectChanges();

  }

  onIntroVideoError(): void {

    console.error(
      'Unable to load Green Basket introduction video.'
    );

    // Allow login even if the video fails.
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
          this.verificationMethod = 'OTP';
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
    console.log("01. OTP/MPIN LENGTH");
    const expectedLength = method === 'OTP' ? 6 : this.mpinLength;
    if (!new RegExp(`^\\d{${expectedLength}}$`).test(credential)) {
      this.errorMessage = `Please enter a valid ${expectedLength}-digit ${method}.`;
      this.cdr.detectChanges();
      return;
    }
    this.isLoading = true;
    console.log("02. OTP/MPIN LENGTH");

    

    // At least one credential is compulsory.
    if (!enteredOTP && !enteredMPIN) {
      this.errorMessage = 'Please enter OTP or MPIN.';
      this.cdr.detectChanges();
      return;
    }

    

    console.log("03. OTP/MPIN LENGTH");
    if (!/^\d{6}$/.test(credential)) {
      this.errorMessage =
        `Please enter a valid 6-digit ${method}.`;

      this.cdr.detectChanges();
      return;
    }
    console.log("04. OTP/MPIN LENGTH");

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
    console.log("05. Payload", payload);
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
    this.verificationMethod = 'OTP';

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