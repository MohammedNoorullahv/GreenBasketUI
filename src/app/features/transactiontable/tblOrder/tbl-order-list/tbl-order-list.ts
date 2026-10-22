import { renderOrderReceipt } from './order-receipt';
import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Observable, Subscription, timeout, finalize } from 'rxjs';
import { CommonModule, AsyncPipe, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ColumnFilterIconComponent } from '../../../../shared/components/column-filter-icon/column-filter-icon.component';
import { ColumnFilterPipe } from '../../../../shared/pipes/column-filter.pipe';
import { TblOrder } from '../models/tblOrder.model';
import { TblOrderService } from '../services/tbl-order';



@Component({
  selector: 'app-tbl-order-list',
  imports: [AsyncPipe, CommonModule, FormsModule, RouterLink, ColumnFilterPipe, ColumnFilterIconComponent],
  templateUrl: './tbl-order-list.html',
  styleUrl: './tbl-order-list.css',
})

export class TblOrderListComponent implements OnInit, OnDestroy {
tblOrder$?: Observable<TblOrder[]>;
actionType: string = '';
submitAction: 'Load All' | 'Active Only' = 'Load All'; // default to Load All
filters: Record<string, string> = {};

constructor(private tblOrderService: TblOrderService, @Inject(PLATFORM_ID) private platformId: object, private cdr: ChangeDetectorRef) {
}
ngOnInit(): void {
	this.actionType = 'Load All';
	this.tblOrder$ = this.tblOrderService.getAllTblOrders();
}
OnFormSubmit(action: string): void {
	if (action === 'Load All')
	{
		this.actionType = "Load All";
		this.tblOrder$ = this.tblOrderService.getAllTblOrders();
	}
	else
	{
		this.actionType = "Active Only";
		this.tblOrder$ = this.tblOrderService.getActiveTblOrders();
	}
}
  receiptError = '';
  printingOrderId: number | null = null;
  private receiptRequest?: Subscription;

  printReceipt(order: TblOrder): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.receiptRequest?.unsubscribe();
    this.printingOrderId = null;
    this.receiptError = '';
    // Open synchronously so the browser does not block the preview after an API call.
    const preview = window.open('', '_blank', 'width=900,height=800');
    if (!preview) {
      this.receiptError = 'Allow pop-ups for this site to open the receipt.';
      return;
    }
    preview.opener = null;
    preview.document.title = 'Order Receipt';
    preview.document.body.textContent = 'Loading saved order items…';
    const data = order as unknown as Record<string, any>;
    const lines = data['tblOrderDetails'] ?? data['orderDetails'] ?? data['details'] ?? data['items'];
    if (Array.isArray(lines) && lines.length) {
      renderOrderReceipt(preview, order);
      return;
    }
    // Existing API in the supplied shopping component. A dedicated get-by-ID
    // API including details is preferable, especially for completed orders.
    const vendorId = Number(data['fldFKVendorId'] ?? data['tblProfileVendorId']?.['fldId']);
    if (!vendorId) {
      preview.close();
      this.receiptError = 'The order does not contain vendor ID or saved items. Return order details from the order API.';
      return;
    }
    this.printingOrderId = order.fldId;
    this.receiptRequest = this.tblOrderService.getPrintOrder('Vendor', vendorId, order.fldId).pipe(
      timeout(15000),
      finalize(() => {
        this.printingOrderId = null;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: orders => {
        this.printingOrderId = null;
        const full = orders.find(o => Number(o.fldOrderId) === Number(order.fldId));
        if (!full) {
          if (!preview.closed) preview.document.body.textContent = 'Receipt unavailable. Return to the order list for the error message.';
          this.receiptError = 'Order details unavailable in the pending-order API. Completed orders need a get-by-ID API that includes saved items.';
          return;
        }
        if (!preview.closed) renderOrderReceipt(preview, { ...data, ...full });
      },
      error: () => {
        this.printingOrderId = null;
        if (!preview.closed) preview.document.body.textContent = 'Receipt unavailable. Return to the order list for the error message.';
        this.receiptError = 'Unable to load receipt details within 15 seconds. Check the order API and try again.';
      }
    });
  }

  ngOnDestroy(): void {
    this.receiptRequest?.unsubscribe();
  }
}

