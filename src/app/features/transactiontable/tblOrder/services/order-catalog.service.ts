import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, concat, of, throwError } from 'rxjs';
import { catchError, shareReplay, tap, timeout } from 'rxjs/operators';
import { isPlatformServer } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { OrderStockItem } from '../models/tbl-order-shopping.model';

/** Wire shape returned by GetAvailableStockForOrderofAllVendor. */
export type VendorOrderStockItemDto = OrderStockItem & {
  fldCurrentStock?: number;
  fldFKItemMasterId?: number;
};

export interface VendorOrderStockDto {
  fldId: number;
  fldFKVendorId: number;
  fldVendorName: string | null;
  fldStockItemCount: number;
  fldStockItems: VendorOrderStockItemDto[] | null;
}

/**
 * Persisted snapshot of the vendor catalogue.
 *
 * Every Azure API call costs money, so the catalogue is downloaded at most
 * ONCE per browser session and replayed from this snapshot on every other
 * visit to the shop screen (including full page refreshes).
 */
interface CatalogCache {
  savedAt: number;
  data: VendorOrderStockDto[] | null;
}

@Injectable({ providedIn: 'root' })
export class OrderCatalogService {
  private readonly apiRoot = environment.apiBaseUrl
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/api$/i, '');

  private readonly catalogUrl =
    `${this.apiRoot}/api/TblDailyInventory/GetAvailableStockForOrderofAllVendor`;

  private readonly cacheKey = 'gbCatalogCache';

  /** Raised the first time the network is hit; the rest of the SPA session reads the cache. */
  private sessionFetchStarted = false;

  /** Shared in-flight request so concurrent callers trigger a single HTTP call. */
  private inFlight?: Observable<VendorOrderStockDto[] | null>;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  /**
   * Cache-first catalogue stream.
   *
   * - Cached copy exists  -> it is emitted immediately (instant paint), then a
   *   single background refresh runs IF the network was not hit yet in this
   *   browser session; the cache is updated with the fresh response.
   * - No cached copy      -> the stream emits once the single fetch completes.
   * - Network already used this session -> the cache is served with ZERO API
   *   calls, no matter how often the shop screen is re-entered or refreshed.
   *
   * The stream may therefore emit once (cache only / fetch only) or twice
   * (cache first, fresh data next).
   */
  getAvailableStockForOrderofAllVendor(): Observable<VendorOrderStockDto[] | null> {
    const cached = this.readCache();

    // Network already consumed this session: cache only, never the API again.
    if (this.sessionFetchStarted) {
      if (cached) return of(cached.data);
      // First load failed earlier (no cache to fall back on) and the user
      // asked again — allow one retry through the shared in-flight request.
      return this.fetchOnce();
    }

    this.sessionFetchStarted = true;

    if (!cached) {
      return this.fetchOnce();
    }

    // Paint the cache instantly, then refresh exactly once in the background.
    // If the refresh fails the cached emission is already on screen, so the
    // failure is swallowed instead of wiping a good catalogue.
    const refresh = this.fetchOnce().pipe(
      catchError(err => {
        console.error('Catalogue refresh failed; keeping cached products.', err);
        return of(cached.data);
      })
    );

    return concat(of(cached.data), refresh);
  }

  /** A fresh explicit fetch is wanted (e.g. manual retry after a first-load failure). */
  private fetchOnce(): Observable<VendorOrderStockDto[] | null> {
    if (this.inFlight) {
      return this.inFlight;
    }

    const request$ = this.http
      .get<VendorOrderStockDto[] | null>(this.catalogUrl)
      .pipe(
        timeout({ first: 30000 }),
        tap(data => this.writeCache(data)),
        catchError(err => {
          // Free the slot so a later retry can open a new request.
          if (this.inFlight === request$) {
            this.inFlight = undefined;
          }
          return throwError(() => err);
        }),
        // Late subscribers replay the same response instead of re-fetching.
        shareReplay({ bufferSize: 1, refCount: false })
      );

    this.inFlight = request$;
    return request$;
  }

  // ================================================================
  // CACHE STORAGE (browser only)
  // ================================================================

  private readCache(): CatalogCache | null {
    if (isPlatformServer(this.platformId)) return null;

    try {
      const raw = localStorage.getItem(this.cacheKey);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as Partial<CatalogCache> | null;
      if (!parsed || typeof parsed.savedAt !== 'number' || !Number.isFinite(parsed.savedAt)) {
        return null;
      }
      // A non-array payload (or a valid "empty catalogue" null) is accepted as-is.
      if (parsed.data !== null && !Array.isArray(parsed.data)) {
        return null;
      }
      return { savedAt: parsed.savedAt, data: parsed.data ?? null };
    } catch {
      // Corrupt / blocked storage behaves like "no cache".
      return null;
    }
  }

  private writeCache(data: VendorOrderStockDto[] | null): void {
    if (isPlatformServer(this.platformId)) return;

    // Never cache a malformed payload over a good snapshot.
    if (data !== null && !Array.isArray(data)) return;

    try {
      const cache: CatalogCache = { savedAt: Date.now(), data };
      localStorage.setItem(this.cacheKey, JSON.stringify(cache));
    } catch {
      // Storage unavailable or quota exceeded; the app still works, it just
      // needs the network on the next session.
    }
  }
}
