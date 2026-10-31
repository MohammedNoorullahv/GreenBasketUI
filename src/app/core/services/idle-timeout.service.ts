import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { VendorNotificationService } from './vendor-notification.service';
import { VendorPushService } from './vendor-push.service';

type IdleState = 'active' | 'warning' | 'logging-out';

/**
 * Signs an authenticated user out after a long period without any interaction.
 *
 * Safety rules:
 * - The user always gets a visible countdown before being signed out.
 * - Countdowns are paused while the tab is hidden and restart when it becomes
 *   visible, so a user never loses work without seeing the warning.
 * - Any pointer, keyboard, wheel, touch or scroll activity resets the timer.
 */
@Injectable({ providedIn: 'root' })
export class IdleTimeoutService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly vendorPush = inject(VendorPushService);
  private readonly vendorNotifications = inject(VendorNotificationService);

  /** Change this value to adjust how long a session may stay idle. */
  readonly idleTimeoutMinutes = 30;

  /** Length of the visible warning before the automatic sign-out. */
  readonly warningSeconds = 60;

  readonly warningOpen = signal(false);
  readonly secondsRemaining = signal(this.warningSeconds);

  private readonly idleTimeoutMs = this.idleTimeoutMinutes * 60 * 1000;
  private readonly warningMs = this.warningSeconds * 1000;
  private readonly checkIntervalMs = 10_000;
  private readonly activityWriteIntervalMs = 5_000;

  private readonly activityEvents = [
    'pointerdown',
    'pointermove',
    'keydown',
    'wheel',
    'touchstart',
    'scroll'
  ];

  private initialized = false;
  private state: IdleState = 'active';
  private lastActivityAt = 0;
  private lastPersistedActivityAt = 0;
  private warningDeadline = 0;
  private remainingMs = this.warningMs;
  private checkTimer?: ReturnType<typeof setInterval>;
  private warningTimer?: ReturnType<typeof setInterval>;

  initialize(): void {
    if (!isPlatformBrowser(this.platformId) || this.initialized) {
      return;
    }

    this.initialized = true;

    for (const eventName of this.activityEvents) {
      this.document.addEventListener(
        eventName,
        this.onActivity,
        { capture: true, passive: true }
      );
    }

    this.document.addEventListener(
      'visibilitychange',
      this.onVisibilityChange
    );

    this.lastActivityAt = this.readLastActivity();

    this.checkTimer = setInterval(
      () => this.checkIdle(),
      this.checkIntervalMs
    );
  }

  /** The user chose to keep working, so restart the inactivity period. */
  staySignedIn(): void {
    if (this.state !== 'warning') {
      return;
    }

    this.closeWarning();
    this.state = 'active';
    this.recordActivity(true);
  }

  /** The user chose to sign out immediately from the warning. */
  logoutNow(): void {
    if (this.state === 'logging-out') {
      return;
    }

    this.logoutForIdle();
  }

  private readonly onActivity = (): void => {
    // Ignore activity on public screens (for example, the login page).
    if (this.state !== 'active' || this.lastActivityAt === 0) {
      return;
    }

    this.recordActivity(false);
  };

  private readonly onVisibilityChange = (): void => {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (this.document.visibilityState === 'hidden') {
      if (this.state === 'warning') {
        // Do not sign out behind a hidden tab; keep the time the user had left.
        this.remainingMs = Math.max(
          0,
          this.warningDeadline - Date.now()
        );
        this.stopWarningTicker();
      }

      return;
    }

    if (this.state === 'warning') {
      if (this.remainingMs <= 0) {
        this.logoutForIdle();
        return;
      }

      this.warningDeadline = Date.now() + this.remainingMs;
      this.updateWarningCountdown();
      this.startWarningTicker();
      return;
    }

    this.checkIdle();
  };

  private recordActivity(force: boolean): void {
    const now = Date.now();
    this.lastActivityAt = now;

    if (
      !force &&
      now - this.lastPersistedActivityAt < this.activityWriteIntervalMs
    ) {
      return;
    }

    this.lastPersistedActivityAt = now;

    try {
      sessionStorage.setItem('gbLastActivityAt', String(now));
    } catch {
      // The in-memory timestamp still keeps the timer accurate for this tab.
    }
  }

  private readLastActivity(): number {
    try {
      const stored = Number(
        sessionStorage.getItem('gbLastActivityAt')
      );

      if (Number.isFinite(stored) && stored > 0) {
        this.lastPersistedActivityAt = stored;
        return stored;
      }
    } catch {
      // Fall through to a fresh start.
    }

    return this.hasSession() ? Date.now() : 0;
  }

  private checkIdle(): void {
    if (
      !isPlatformBrowser(this.platformId) ||
      this.state !== 'active' ||
      this.document.visibilityState !== 'visible'
    ) {
      return;
    }

    if (!this.hasSession()) {
      this.lastActivityAt = 0;

      if (this.warningOpen()) {
        this.closeWarning();
      }

      return;
    }

    // Pick up a fresh login timestamp written after this service last checked.
    this.syncLastActivityFromStorage();

    if (!this.lastActivityAt) {
      this.recordActivity(true);
      return;
    }

    if (Date.now() - this.lastActivityAt >= this.idleTimeoutMs) {
      this.openWarning();
    }
  }

  private syncLastActivityFromStorage(): void {
    try {
      const stored = Number(
        sessionStorage.getItem('gbLastActivityAt')
      );

      if (Number.isFinite(stored) && stored > this.lastActivityAt) {
        this.lastActivityAt = stored;
        this.lastPersistedActivityAt = stored;
      }
    } catch {
      // Keep using the in-memory timestamp when storage is unavailable.
    }
  }

  private openWarning(): void {
    if (this.state !== 'active') {
      return;
    }

    this.state = 'warning';
    this.remainingMs = this.warningMs;
    this.warningDeadline = Date.now() + this.warningMs;
    this.secondsRemaining.set(this.warningSeconds);
    this.warningOpen.set(true);
    this.startWarningTicker();
  }

  private startWarningTicker(): void {
    this.stopWarningTicker();
    this.warningTimer = setInterval(
      () => this.updateWarningCountdown(),
      1000
    );
  }

  private stopWarningTicker(): void {
    if (this.warningTimer) {
      clearInterval(this.warningTimer);
      this.warningTimer = undefined;
    }
  }

  private updateWarningCountdown(): void {
    if (this.state !== 'warning') {
      return;
    }

    this.remainingMs = Math.max(
      0,
      this.warningDeadline - Date.now()
    );

    this.secondsRemaining.set(
      Math.ceil(this.remainingMs / 1000)
    );

    if (this.remainingMs <= 0) {
      this.logoutForIdle();
    }
  }

  private closeWarning(): void {
    this.stopWarningTicker();
    this.warningOpen.set(false);
    this.secondsRemaining.set(this.warningSeconds);
  }

  private logoutForIdle(): void {
    if (this.state === 'logging-out') {
      return;
    }

    this.state = 'logging-out';
    this.closeWarning();

    const token = this.readToken();

    // Clear the local session immediately so no protected screen stays open.
    this.clearLocalSession();

    this.vendorPush.reset();
    void this.vendorNotifications.refreshSession();
    void this.router.navigateByUrl('/login', { replaceUrl: true });

    if (!token) {
      this.state = 'active';
      return;
    }

    // Best effort: also end the server session, but never block the sign-out.
    this.http.post(
      `${environment.apiBaseUrl}/api/Authenticate/Logout`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .pipe(timeout(10_000))
      .subscribe({
        next: () => this.finishIdleLogout(),
        error: () => this.finishIdleLogout()
      });
  }

  private finishIdleLogout(): void {
    this.state = 'active';
    this.lastActivityAt = 0;
    this.lastPersistedActivityAt = 0;
  }

  private clearLocalSession(): void {
    this.lastActivityAt = 0;
    this.lastPersistedActivityAt = 0;

    try {
      sessionStorage.removeItem('gbAccessToken');
      sessionStorage.removeItem('gbProfile');
      sessionStorage.removeItem('gbLastActivityAt');
    } catch {
      // Navigation still protects the current view.
    }
  }

  private hasSession(): boolean {
    return this.readToken() !== null;
  }

  private readToken(): string | null {
    try {
      const token =
        sessionStorage.getItem('gbAccessToken')?.trim();

      return token ? token : null;
    } catch {
      return null;
    }
  }
}
