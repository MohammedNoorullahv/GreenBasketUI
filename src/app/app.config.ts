import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay, } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideToastr } from "ngx-toastr";

import {
  provideTranslateService
} from "@ngx-translate/core";

import {
  provideTranslateHttpLoader
} from "@ngx-translate/http-loader";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes), provideClientHydration(withEventReplay()),
    // Required for API communication
    provideHttpClient(
      withFetch()
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
    
  ]
};
