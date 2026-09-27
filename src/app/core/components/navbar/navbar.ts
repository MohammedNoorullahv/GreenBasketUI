import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment.development';
import { finalize } from 'rxjs';
import { HttpClient } from '@angular/common/http';

type GreenBasketLanguage = "en" | "ta" | "ur";

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterOutlet, CommonModule, RouterLinkActive, TranslatePipe],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})

export class Navbar {
  // 1. Define a state variable to track the active menu
  activeMenu: string | null = null;
  isSidebarCollapsed: boolean = true;
  selectedLanguage: GreenBasketLanguage = "en";

  userType = '';

  profileId = 0;

  profileName = '';

  private readonly translate =
    inject(TranslateService);

  private readonly document =
    inject(DOCUMENT);

  private readonly platformId =
    inject(PLATFORM_ID);

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

    sessionStorage.removeItem(
      'gbAccessToken'
    );

    sessionStorage.removeItem(
      'gbProfile'
    );

    this.router.navigateByUrl('/login');

  }

  loadLoggedInProfile(): void {

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const storedProfile =
      sessionStorage.getItem('gbProfile');

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
