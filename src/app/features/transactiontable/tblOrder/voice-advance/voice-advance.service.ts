import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { OrderStockItem } from '../models/tbl-order-shopping.model';
export interface CatalogItem { id: number; name: string; tamil?: string; urdu?: string; unit: string; fractional: boolean; step: number; }
export interface RequestHeader {
  fldId: string; fldFKCustomerId: number; fldFKVendorId: number; fldRequestedDeliveryDate: string;
  fldStatus: string; fldVersion: number; fldMinimumValue: number | null; fldItemSubTotal: number | null;
  fldOriginalDeliveryCharges: number | null; fldDeliverySavings: number | null; fldDeliveryCharges: number | null;
  fldGrandTotal: number | null; fldCancellationReason: string | null; fldFKOrderId: number | null; fldCreatedDt: string;
}
export interface RequestLine {
  fldId: number; fldFKItemId: number | null; fldRequestedName: string; fldRequestedQuantity: number; fldUnit: string;
  fldDecision: string; fldOfferedItemId: number | null; fldOfferedName: string | null;
  fldOfferedQuantity: number | null; fldRate: number | null; fldReason: string | null; fldFKDailyInventoryId: number | null;
}
export interface AdvanceRequest { header: RequestHeader; lines: RequestLine[]; }
@Injectable({providedIn:'root'})
export class VoiceAdvanceService {
  private readonly url = `${environment.apiBaseUrl.replace(/\/$/,'')}/api/TblAdvanceOrderRequest`;
  constructor(private http: HttpClient) {}
  search(q: string) { return this.http.get<CatalogItem[]>(`${this.url}/SearchItems`, {params:new HttpParams().set('q',q)}); }
  mine() { return this.http.get<AdvanceRequest[]>(`${this.url}/Mine`); }
  create(dto: unknown) { return this.http.post<{id:string}>(`${this.url}/Create`,dto); }
  action(action: 'Quote'|'Accept'|'Ready'|'Cancel', dto: unknown) { return this.http.post(`${this.url}/${action}`,dto); }
  stocks(vendor: number) { return this.http.get<(OrderStockItem & {fldCurrentStock?:number;fldFKItemMasterId?:number})[]>(
    `${environment.apiBaseUrl}/api/TblDailyInventory/GetAvailableStockForOrder`,{params:new HttpParams().set('FldFKVendorId',vendor)}); }
  place(dto: unknown) { return this.http.post(`${environment.apiBaseUrl}/api/TblOrder/CreateTblOrderHeaderAndDetail`,dto); }
}
