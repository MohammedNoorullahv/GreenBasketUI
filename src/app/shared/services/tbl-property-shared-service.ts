// Replacement: src/app/shared/services/tbl-property-shared-service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable, Subject } from 'rxjs';
import { map, shareReplay, switchMap, takeUntil, tap } from 'rxjs/operators';
import { TblProperty } from '../../features/mastertables/tblProperty/models/tblProperty.model';
import { TblPropertyMaster } from '../../features/mastertables/tblPropertyMaster/models/tblPropertyMaster.model';
import { TblPropertyService } from '../../features/mastertables/tblProperty/services/tbl-property';
import { TblPropertyMasterService } from '../../features/mastertables/tblPropertyMaster/services/tbl-property-master';
import { TblPropertySlNoService } from './tbl-property-slno';

@Injectable({ providedIn: 'root' })
export class TblPropertySharedservice {
  private readonly properties$ = new BehaviorSubject<TblProperty[]>([]);
  private readonly masters$ = new BehaviorSubject<TblPropertyMaster[]>([]);
  private readonly reset$ = new Subject<void>();
  private loaded$?: Observable<void>;

  constructor(
    private tblPropertyService: TblPropertyService,
    private tblPropertyMasterService: TblPropertyMasterService,
    private slNo: TblPropertySlNoService
  ) {}

  // Concurrent subscribers share one initial load, including the serial-number seed.
  ensureReady(): Observable<void> {
    if (!this.loaded$) {
      this.loaded$ = forkJoin({
        properties: this.tblPropertyService.getActiveTblPropertys(),
        masters: this.tblPropertyMasterService.getActiveTblPropertyMasters(),
        serials: this.slNo.load()
      }).pipe(
        takeUntil(this.reset$),
        tap(data => {
          this.properties$.next(data.properties);
          this.masters$.next(data.masters);
        }),
        map(() => undefined),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.loaded$;
  }

  /** Existing login/init call remains supported. A failed load is retryable. */
  initProperties(): void {
    this.ensureReady().subscribe({ error: err => console.error('Property cache load failed', err) });
  }

  getAllProperties(): Observable<TblProperty[]> {
    return this.ensureReady().pipe(switchMap(() => this.properties$));
  }

  getPropertyMasters(): Observable<TblPropertyMaster[]> {
    return this.ensureReady().pipe(switchMap(() => this.masters$));
  }

  getPropertiesByType(type: string): Observable<TblProperty[]> {
    return this.ensureReady().pipe(switchMap(() =>
      this.masters$.pipe(switchMap(masters => {
        const id = masters.find(x => x.fldDescription === type)?.fldId;
        return this.properties$.pipe(map(rows => id === undefined ? [] :
          rows.filter(row => row.fldFKProperty === id)));
      }))
    ));
  }

  getNextPropertySlNo(parentId: number): number { return this.slNo.nextProperty(Number(parentId)); }
  getNextPropertyMasterSlNo(): number { return this.slNo.nextMaster(); }
  propertySaved(parentId: number, slNo: number): void { this.slNo.propertySaved(Number(parentId), slNo); }
  propertyMasterSaved(slNo: number): void { this.slNo.masterSaved(slNo); }

  // Called after successful writes: reload active dropdown data, NOT the serial seed.
  // Existing consumers receive updated arrays through the BehaviorSubjects.
  refreshProperties(): void {
    this.reset$.next();
    this.loaded$ = undefined;
    this.initProperties();
  }

  /** Logout / tenant change: the next load obtains a fresh seed as well. */
  clearCache(): void {
    this.reset$.next();
    this.loaded$ = undefined;
    this.properties$.next([]);
    this.masters$.next([]);
    this.slNo.clearCache();
  }
}
