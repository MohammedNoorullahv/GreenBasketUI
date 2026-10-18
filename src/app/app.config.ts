import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay, } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors, HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../environments/environment';
import { provideToastr } from "ngx-toastr";

import {
  provideTranslateService
} from "@ngx-translate/core";

import {
  provideTranslateHttpLoader
} from "@ngx-translate/http-loader";
import { provideAnimations } from '@angular/platform-browser/animations';

// Send the session token only to this application's configured API.
// Keep the environment import aligned with the environment used by login/services.
const authInterceptor: HttpInterceptorFn = (request, next) => {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) return next(request);

  let isApiRequest = false;
  try {
    const api = new URL(environment.apiBaseUrl, window.location.origin);
    const target = new URL(request.url, window.location.origin);
    const basePath = api.pathname.replace(/\/+$/, '');
    isApiRequest = target.origin === api.origin &&
      (target.pathname === basePath || target.pathname.startsWith(basePath + '/'));
  } catch {
    return next(request);
  }

  if (!isApiRequest || request.headers.has('Authorization')) return next(request);

  let token: string | null = null;
  try {
    token = sessionStorage.getItem('gbAccessToken')?.trim() || null;
  } catch {
    return next(request);
  }
  if (!token) return next(request);

  return next(request.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  }));
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes), provideClientHydration(withEventReplay()),
    // Required for API communication
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    ),

    provideToastr({
      timeOut: 3000,
      positionClass: "toast-top-right",
      preventDuplicates: true,
      closeButton: true,
      progressBar: true,
    }),

    provideTranslateService({
      fallbackLang: "en",
      loader: provideTranslateHttpLoader({
        prefix: "/i18n/",
        suffix: ".json"
      })
    }),
    provideAnimations(),
    
  ]
};
