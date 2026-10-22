// Path: src/app/shared/services/tbl-property-shared.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TblProperty } from '../../features/mastertables/tblProperty/models/tblProperty.model';
import { TblPropertyService } from '../../features/mastertables/tblProperty/services/tbl-property';
import { TblPropertyMasterService } from '../../features/mastertables/tblPropertyMaster/services/tbl-property-master';

@Injectable({
  providedIn: 'root',
})

export class TblPropertySharedservice {
  private propertyAll$?: Observable<TblProperty[]>;
  private cacheReady$ = new BehaviorSubject<boolean>(false);
  private propertyMasterCache: { [key: string]: number } = {};

  constructor(
    private tblPropertyService: TblPropertyService,
    private tblPropertyMasterService: TblPropertyMasterService
  ) { }

  /** Call once at login/init */
  initProperties(): void {
    this.propertyAll$ = this.tblPropertyService.getActiveTblPropertys();

    this.tblPropertyMasterService.getActiveTblPropertyMasters().subscribe(ids => {


      ids.forEach(x => {
        this.propertyMasterCache[x.fldDescription] = x.fldId;
      });

    });
  }

  /** Get all properties */
  getAllProperties(): Observable<TblProperty[]> | undefined {
    return this.propertyAll$;
  }

  /** Called explicitly when new property data is added */
  refreshProperties(): void {
    this.initProperties();
  }

  /** Get filtered properties by description (uses cached IDs) */
  getPropertiesByType(type: string): Observable<TblProperty[]> {
    const typeId = this.propertyMasterCache[type];

    if (!this.propertyAll$ || !typeId) {
      return new Observable<TblProperty[]>(observer => observer.next([]));
    }

    return this.propertyAll$.pipe(
      map(props =>
        props.filter(
          p => p.fldFKProperty === typeId
        )
      )
    );
  }

  /** Clear cache on logout */
  clearCache(): void {
    this.propertyMasterCache = {};
    this.propertyAll$ = undefined;
  }

}
