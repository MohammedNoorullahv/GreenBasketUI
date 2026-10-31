import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID, afterNextRender, DestroyRef } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';
import { finalize, filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { VendorPushService } from '../../services/vendor-push.service';
import { HttpClient } from '@angular/common/http';
import { VendorNotificationService } from '../../services/vendor-notification.service';

type GreenBasketLanguage = "en" | "ta" | "ur";

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterOutlet, CommonModule, RouterLinkActive, TranslatePipe],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  styles: [`
    /* Header and logout stay visible; only the menu scrolls. */
    :host .sidebar {
      display: flex;
      flex-direction: column;
      height: 100vh;
      height: 100dvh;
      max-height: 100dvh;
      min-height: 0;
      overflow: hidden;
      box-sizing: border-box;
    }
    :host .sidebar > .sidebar-header { flex: 0 0 auto; }
    :host .sidebar > .sidebar-menu {
      flex: 1 1 0%;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      overscroll-behavior-y: contain;
      scrollbar-width: thin;
      padding-bottom: 12px;
    }
    :host .sidebar > .sidebar-menu > * { flex-shrink: 0; }
    :host .sidebar .vendor-push-settings { overflow-wrap: anywhere; }
    :host .sidebar > .sidebar-logout-footer {
      flex: 0 0 auto;
      padding: 12px 16px;
      padding-bottom: max(12px, env(safe-area-inset-bottom));
      border-top: 1px solid rgba(255, 255, 255, .18);
      background: inherit;
      box-sizing: border-box;
    }
    :host .sidebar .sidebar-logout-footer > .logout-btn {
      display: block;
      position: static;
      width: 100%;
      min-height: 44px;
      margin: 0;
      box-sizing: border-box;
    }
  `],
})

export class Navbar {
  readonly vendorPush = inject(VendorPushService);
  private readonly destroyRef = inject(DestroyRef);

  enableVendorNotifications(): void {
    if (this.isVendor) void this.vendorPush.enable();
  }

  disableVendorNotifications(): void {
    if (this.isVendor) void this.vendorPush.disable();
  }

  checkVendorNotifications(): void {
    this.loadLoggedInProfile();
    if (this.isVendor) void this.vendorPush.refreshStatus();
    else this.vendorPush.reset();
  }

  // 1. Define a state variable to track the active menu
  activeMenu: string | null = null;
  isSidebarCollapsed: boolean = true;
  selectedLanguage: GreenBasketLanguage = "en";

  hasSession = false;

  userType = '';

  profileId = 0;

  profileName = '';

  private readonly translate =
    inject(TranslateService);

  private readonly document =
    inject(DOCUMENT);

  private readonly platformId =
    inject(PLATFORM_ID);

  private readonly vendorNotifications =
    inject(VendorNotificationService);

  constructor(private router: Router, private http: HttpClient) {

    this.translate.addLangs([
      "en",
      "ta",
      "ur"
    ]);

    let initialLanguage: GreenBasketLanguage = "en";

    if (isPlatformBrowser(this.platformId)) {

      const savedLanguage =
        localStorage.getItem("greenBasketLanguage");

      if (
        savedLanguage === "en" ||
        savedLanguage === "ta" ||
        savedLanguage === "ur"
      ) {

        initialLanguage = savedLanguage;

      }

    }

    this.changeLanguage(initialLanguage);

    // Browser-only initialization, after hydration. Also handles a layout
    // that remains mounted across login and later route navigation.
    afterNextRender(() => {
      this.checkVendorNotifications();
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(() => this.checkVendorNotifications());

      const onVisible = () => {
        if (this.document.visibilityState === 'visible') {
          this.checkVendorNotifications();
        }
      };
      this.document.addEventListener('visibilitychange', onVisible);
      this.destroyRef.onDestroy(() =>
        this.document.removeEventListener('visibilitychange', onVisible));
    });

  }

  ngOnInit(): void {

    this.loadLoggedInProfile();

  }

  changeLanguage(
    language: GreenBasketLanguage
  ): void {

    this.selectedLanguage = language;

    this.translate.use(language);

    this.document.documentElement.lang = language;

    this.document.documentElement.dir =
      language === "ur" ? "rtl" : "ltr";

    if (isPlatformBrowser(this.platformId)) {

      localStorage.setItem(
        "greenBasketLanguage",
        language
      );

    }

  }

  onLanguageChange(event: Event): void {

    const select =
      event.target as HTMLSelectElement;

    const language = select.value;

    if (
      language === "en" ||
      language === "ta" ||
      language === "ur"
    ) {

      this.changeLanguage(language);

    }

  }


  toggleSidebar(): void {
    if (!this.hasSession) return;
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  // 2. Ensure this exact method is written inside the class
  isMenuOpen(menuName: string): boolean {
    return this.activeMenu === menuName;
  }

  // 3. Optional helper method to toggle the menus when clicked
  toggleMenu(menuName: string): void {
    this.activeMenu = this.activeMenu === menuName ? null : menuName;
  }

  isLoggingOut = false;

  logout(): void {

    if (this.isLoggingOut) {
      return;
    }

    const token =
      sessionStorage.getItem('gbAccessToken');

    if (!token) {

      this.clearLoginAndRedirect();

      return;
    }

    this.isLoggingOut = true;

    this.http.post(
      `${environment.apiBaseUrl}/api/Authenticate/Logout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
      .pipe(
        finalize(() => {
          this.isLoggingOut = false;
        })
      )
      .subscribe({

        next: () => {
          this.clearLoginAndRedirect();
        },

        error: (error) => {

          console.error(
            'Logout API error:',
            error
          );



          // Clear local credentials even if
          // the server request fails.
          this.clearLoginAndRedirect();

        }

      });

  }

  private clearLoginAndRedirect(): void {
    this.vendorPush.reset();

    sessionStorage.removeItem(
      'gbAccessToken'
    );

    sessionStorage.removeItem(
      'gbProfile'
    );

    sessionStorage.removeItem(
      'gbLastActivityAt'
    );

    void this.vendorNotifications.refreshSession();

    this.router.navigateByUrl('/login');

  }

  loadLoggedInProfile(): void {

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const token = sessionStorage.getItem('gbAccessToken');
    const storedProfile = token ? sessionStorage.getItem('gbProfile') : null;
    this.hasSession = false;

    if (!storedProfile) {

      this.userType = '';

      this.profileId = 0;

      this.profileName = '';

      return;
    }

    try {

      const profile =
        JSON.parse(storedProfile);

      this.userType =
        profile.fldUserType || '';

      this.profileId =
        profile.fldId || 0;

      this.profileName =
        profile.fldFullName || '';
      this.hasSession = this.profileId > 0 &&
        ['Admin', 'Vendor', 'Customer'].includes(this.userType);

    }
    catch {

      this.userType = '';

      this.profileId = 0;

      this.profileName = '';

    }

  }

  get isAdmin(): boolean {

    return this.userType === 'Admin';

  }

  get isVendor(): boolean {

    return this.userType === 'Vendor';

  }

  get isCustomer(): boolean {

    return this.userType === 'Customer';

  }

  get canManageInventory(): boolean {

    return this.isAdmin || this.isVendor;

  }

  get canManageOrders(): boolean {

    return this.isAdmin || this.isVendor;

  }

  get canShop(): boolean {

    return this.isCustomer;

  }

}
