// New file: src/app/shared/services/tbl-property-slno.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { shareReplay, takeUntil, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface PropertySlNoState {
  propertyMasterLastSlNo: number;
  properties: { fldFKProperty: number; lastSlNo: number }[];
}

@Injectable({ providedIn: 'root' })
export class TblPropertySlNoService {
  private state$?: Observable<PropertySlNoState>;
  private readonly reset$ = new Subject<void>();
  private propertyLast = new Map<number, number>();
  private masterLast = 0;
  private ready = false;

  constructor(private http: HttpClient) {}

  // apiBaseUrl must be the API root, e.g. https://localhost:7082/api
  load(): Observable<PropertySlNoState> {
    if (!this.state$) {
      this.state$ = this.http.get<PropertySlNoState>(
        `${environment.apiBaseUrl.replace(/\/$/, '')}/api/TblProperty/GetSlNoState`
      ).pipe(
        takeUntil(this.reset$),
        tap(state => {
          this.masterLast = Math.max(this.masterLast, state.propertyMasterLastSlNo);
          for (const row of state.properties) {
            this.propertyLast.set(row.fldFKProperty,
              Math.max(this.propertyLast.get(row.fldFKProperty) ?? 0, row.lastSlNo));
          }
          this.ready = true;
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.state$;
  }

  nextProperty(parentId: number): number {
    this.assertReady();
    return parentId > 0 ? (this.propertyLast.get(parentId) ?? 0) + 1 : 0;
  }

  nextMaster(): number {
    this.assertReady();
    return this.masterLast + 1;
  }

  // Advance only AFTER a successful POST. Failed/cancelled forms consume nothing.
  propertySaved(parentId: number, slNo: number): void {
    this.assertReady();
    this.propertyLast.set(parentId, Math.max(this.propertyLast.get(parentId) ?? 0, slNo));
  }

  masterSaved(slNo: number): void {
    this.assertReady();
    this.masterLast = Math.max(this.masterLast, slNo);
  }

  clearCache(): void {
    this.reset$.next();
    this.state$ = undefined;
    this.propertyLast.clear();
    this.masterLast = 0;
    this.ready = false;
  }

  private assertReady(): void {
    if (!this.ready) throw new Error('Serial-number cache has not loaded.');
  }
}
