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
import { finalize } from 'rxjs';
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

          console.log(
            'Generate OTP Response:',
            response
          );

          this.isLoading = false;

          this.otp = '';

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

  verifyOTP(): void {

    if (this.isLoading) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    const enteredOTP = this.otp.trim();

    if (!/^\d{6}$/.test(enteredOTP)) {

      this.errorMessage =
        'Please enter a valid 6-digit OTP.';

      this.cdr.detectChanges();

      return;
    }

    this.isLoading = true;

    const payload = {

      fldContactNumber: this.mobileNumber.trim(),

      fldOTP: enteredOTP

    };

    this.http.post<LoginResponse>(
      `${this.apiUrl}/ValidateOTPAndLogin`,
      payload
    )
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
            'Mobile number verified successfully.';

          this.cdr.detectChanges();

          this.navigateAfterLogin(
            response.profile.fldUserType
          );

        },

        error: (error: HttpErrorResponse) => {

          this.isLoading = false;

          this.errorMessage =
            error.status === 400 || error.status === 401
              ? 'Invalid OTP. Please try again.'
              : error.error?.message ||
              'OTP verification failed. Please try again.';

          this.otp = '';

          this.cdr.detectChanges();

        }

      });

  }

  changeMobileNumber(): void {

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