import { CommonModule,  DOCUMENT,   isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

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

  private readonly translate =
    inject(TranslateService);

  private readonly document =
    inject(DOCUMENT);

  private readonly platformId =
    inject(PLATFORM_ID);
  
  constructor() {

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



}
