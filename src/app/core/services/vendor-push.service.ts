import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom, from, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VendorPushService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly swPush = inject(SwPush);
  private readonly http = inject(HttpClient);

  readonly busy = signal(false);
  readonly saved = signal(false);
  readonly status = signal('');

  private readonly api =
    `${environment.apiBaseUrl.replace(/\/+$/, '')}/api/VendorPush`;

  async enable(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || this.busy()) {
      return;
    }

    if (
      !('Notification' in window) ||
      !('PushManager' in window) ||
      !this.swPush.isEnabled
    ) {
      this.status.set(
        'Push is unavailable. Open the application with its service worker enabled.'
      );
      return;
    }

    this.busy.set(true);
    this.status.set('');

    try {
      // Request permission directly from the button click.
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        this.status.set(
          'Notifications were not allowed. Enable them in Chrome site settings.'
        );
        return;
      }

      const result = await firstValueFrom(
        this.http.get<{ publicKey: string }>(
          `${this.api}/PublicKey`
        ).pipe(timeout(15000))
      );

      const subscription = await firstValueFrom(
        from(this.swPush.requestSubscription({
          serverPublicKey: result.publicKey
        })).pipe(timeout(45000))
      );

      const data = subscription.toJSON();

      if (!data.endpoint || !data.keys?.['p256dh'] || !data.keys?.['auth']) {
        throw new Error('The browser returned an incomplete subscription.');
      }

      await firstValueFrom(
        this.http.post(`${this.api}/Subscribe`, {
          endpoint: data.endpoint,
          p256dh: data.keys['p256dh'],
          auth: data.keys['auth'],
          deviceName: navigator.userAgent.slice(0, 150)
        }).pipe(timeout(15000))
      );

      this.saved.set(true);
      this.status.set('Notifications enabled for this browser.');
    } catch (error) {
      this.saved.set(false);

      const message =
        error instanceof HttpErrorResponse
          ? error.error?.message ||
            error.error?.detail ||
            `API request failed (${error.status}).`
          : error instanceof Error
            ? error.message
            : 'Could not enable notifications.';

      this.status.set(message);
      console.error('Push subscription failed:', error);
    } finally {
      this.busy.set(false);
    }
  }
}