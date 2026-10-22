import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom, from, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';

interface PushPayload {
  endpoint: string;
  p256dh: string;
  auth: string;
  deviceName: string;
}

@Injectable({ providedIn: 'root' })
export class VendorPushService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly swPush = inject(SwPush);
  private readonly http = inject(HttpClient);
  private revision = 0;

  readonly busy = signal(false);
  readonly saved = signal(false);
  readonly checked = signal(false);
  readonly status = signal('');

  private readonly api =
    `${environment.apiBaseUrl.replace(/\/+$/, '')}/api/VendorPush`;

  // Reset only the UI. Logout intentionally retains background alerts.
  reset(): void {
    this.revision++;
    this.busy.set(false);
    this.saved.set(false);
    this.checked.set(false);
    this.status.set('');
  }

  private sessionToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      const profile = JSON.parse(sessionStorage.getItem('gbProfile') || 'null');
      return profile?.fldUserType === 'Vendor'
        ? sessionStorage.getItem('gbAccessToken')
        : null;
    } catch {
      return null;
    }
  }

  private available(): boolean {
    return isPlatformBrowser(this.platformId) &&
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      this.swPush.isEnabled;
  }

  private current(revision: number, token: string): boolean {
    return revision === this.revision && this.sessionToken() === token;
  }

  private async registration(): Promise<ServiceWorkerRegistration> {
    return firstValueFrom(
      from(navigator.serviceWorker.ready).pipe(timeout(35000))
    );
  }

  private payload(subscription: PushSubscription): PushPayload {
    const data = subscription.toJSON();
    const p256dh = data.keys?.['p256dh'];
    const auth = data.keys?.['auth'];
    if (!data.endpoint || !p256dh || !auth) {
      throw new Error('The browser returned an incomplete subscription.');
    }
    return {
      endpoint: data.endpoint,
      p256dh,
      auth,
      deviceName: navigator.userAgent.slice(0, 150)
    };
  }

  private async post<T>(
    action: string, payload: PushPayload, token: string
  ): Promise<T> {
    return firstValueFrom(this.http.post<T>(
      `${this.api}/${action}`, payload,
      { headers: { Authorization: `Bearer ${token}` } }
    ).pipe(timeout(15000)));
  }

  // Read-only: never requests permission or re-enables a disabled record.
  async refreshStatus(): Promise<void> {
    const token = this.sessionToken();
    if (!token) { this.reset(); return; }
    if (this.busy()) return;
    const revision = ++this.revision;
    this.busy.set(true);
    this.saved.set(false);
    this.checked.set(false);
    this.status.set('Checking notifications...');
    try {
      if (!this.available()) {
        this.status.set('Notifications are unavailable in this browser or build.');
        return;
      }
      if (Notification.permission !== 'granted') {
        this.status.set(Notification.permission === 'denied'
          ? 'Notifications are blocked in browser settings.'
          : 'Notifications are not enabled for this browser.');
        return;
      }
      const registration = await this.registration();
      if (!this.current(revision, token)) return;
      const subscription = await registration.pushManager.getSubscription();
      if (!this.current(revision, token)) return;
      if (!subscription) {
        this.status.set('Notifications are not enabled for this browser.');
        return;
      }
      const result = await this.post<{ enabled: boolean }>(
        'Status', this.payload(subscription), token
      );
      if (!this.current(revision, token)) return;
      this.saved.set(result.enabled);
      this.status.set(result.enabled
        ? 'Notifications enabled for this browser.'
        : 'Notifications are off or not registered for this vendor.');
    } catch (error) {
      if (this.current(revision, token)) {
        this.status.set('Could not verify notification status. Click Check status to retry.');
      }
    } finally {
      if (this.current(revision, token)) {
        this.checked.set(true);
        this.busy.set(false);
      }
    }
  }

  async enable(): Promise<void> {
    const token = this.sessionToken();
    if (!token || this.busy()) return;
    if (!this.available()) {
      this.status.set('Notifications are unavailable in this browser or build.');
      return;
    }
    const revision = ++this.revision;
    this.busy.set(true);
    this.status.set('Enabling notifications...');
    try {
      // Permission is requested only after the vendor clicks Enable.
      const permission = await Notification.requestPermission();
      if (!this.current(revision, token)) return;
      if (permission !== 'granted') {
        this.saved.set(false);
        this.status.set('Allow notifications in browser site settings, then try again.');
        return;
      }
      const result = await firstValueFrom(this.http.get<{ publicKey: string }>(
        `${this.api}/PublicKey`,
        { headers: { Authorization: `Bearer ${token}` } }
      ).pipe(timeout(15000)));
      if (!this.current(revision, token)) return;
      await this.registration();
      if (!this.current(revision, token)) return;
      const subscription = await firstValueFrom(from(
        this.swPush.requestSubscription({ serverPublicKey: result.publicKey })
      ).pipe(timeout(45000)));
      if (!this.current(revision, token)) return;
      await this.post('Subscribe', this.payload(subscription), token);
      if (!this.current(revision, token)) return;
      this.saved.set(true);
      this.status.set('Notifications enabled for this browser.');
    } catch (error) {
      if (this.current(revision, token)) {
        this.saved.set(false);
        this.status.set(this.errorMessage(error));
      }
    } finally {
      if (this.current(revision, token)) {
        this.checked.set(true);
        this.busy.set(false);
      }
    }
  }

  async disable(): Promise<void> {
    const token = this.sessionToken();
    if (!token || this.busy() || !this.available()) return;
    const revision = ++this.revision;
    this.busy.set(true);
    this.status.set('Disabling notifications...');
    try {
      const registration = await this.registration();
      if (!this.current(revision, token)) return;
      const subscription = await registration.pushManager.getSubscription();
      if (!this.current(revision, token)) return;
      if (!subscription) {
        this.saved.set(false);
        this.status.set('No browser subscription exists. No change was made to API records.');
        return;
      }
      // Disable only this vendor's record for this browser.
      // Retain the browser subscription so repeated disable/enable
      // updates the same database row and requires no permission prompt.
      await this.post('Disable', this.payload(subscription), token);
      if (!this.current(revision, token)) return;
      this.saved.set(false);
      this.status.set('Order notifications disabled for this browser.');
    } catch (error) {
      if (this.current(revision, token)) {
        this.status.set('Could not disable notifications. ' + this.errorMessage(error));
      }
    } finally {
      if (this.current(revision, token)) {
        this.checked.set(true);
        this.busy.set(false);
      }
    }
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message || error.error?.detail ||
        `API request failed (${error.status}).`;
    }
    return error instanceof Error ? error.message : 'Please try again.';
  }
}
