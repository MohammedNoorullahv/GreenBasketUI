import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

@Injectable({ providedIn: 'root' })
export class OrderCatalogService {
  private readonly apiRoot = environment.apiBaseUrl
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/api$/i, '');

  constructor(private http: HttpClient) {}

  getAvailableStockForOrderofAllVendor(): Observable<VendorOrderStockDto[] | null> {
    return this.http.get<VendorOrderStockDto[] | null>(
      `${this.apiRoot}/api/TblDailyInventory/GetAvailableStockForOrderofAllVendor`
    );
  }
}
