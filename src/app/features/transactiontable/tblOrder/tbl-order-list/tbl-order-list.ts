import { MenuCaptionPipe as GbMenuCaptionPipe } from '../../../../shared/pipes/menu-caption.pipe';
import { TranslatePipe as GbPageTranslatePipe } from '@ngx-translate/core';
import { renderOrderReceipt } from './order-receipt';
import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { Observable, Subscription, timeout, finalize, map, of, catchError } from 'rxjs';
import { CommonModule, AsyncPipe, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ColumnFilterIconComponent } from '../../../../shared/components/column-filter-icon/column-filter-icon.component';
import { ColumnFilterPipe } from '../../../../shared/pipes/column-filter.pipe';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { TblOrder } from '../models/tblOrder.model';
import { TblOrderUpdate } from '../models/tblOrder-Update.model';
import { TblPendingOrderDto } from '../models/tbl-pending-order.model';
import { TblProfile } from '../../../mastertables/tblProfile/models/tblProfile.model';
import { TblOrderService } from '../services/tbl-order';



@Component({
  selector: 'app-tbl-order-list',
  imports: [AsyncPipe, CommonModule, FormsModule, RouterLink, ColumnFilterPipe, ColumnFilterIconComponent, GbPageTranslatePipe, GbMenuCaptionPipe, ConfirmDialogComponent],
  templateUrl: './tbl-order-list.html',
  styleUrl: './tbl-order-list.css',
})

export class TblOrderListComponent implements OnInit, OnDestroy {
tblOrder$?: Observable<TblOrder[]>;
actionType: string = '';
submitAction: 'Load All' | 'Active Only' = 'Load All'; // default to Load All
filters: Record<string, string> = {};
profileId = 0;
userType = '';

@ViewChild('deleteDialog') deleteDialog!: ConfirmDialogComponent;

deleteTargetLabel = '';
private pendingDeleteRequest?: TblOrderUpdate;

constructor(private tblOrderService: TblOrderService, private toastr: ToastrService, @Inject(PLATFORM_ID) private platformId: object, private cdr: ChangeDetectorRef) {
}
ngOnInit(): void {
	this.actionType = 'Load All';
	this.readLoggedInProfile();
	this.loadOrders();
}

OnFormSubmit(action: string): void {
	this.actionType = action;
	this.loadOrders();
}

private readLoggedInProfile(): void {
	this.profileId = 0;
	this.userType = '';

	if (!isPlatformBrowser(this.platformId)) {
		return;
	}

	const storedProfile = sessionStorage.getItem('gbProfile');
	if (!storedProfile) {
		return;
	}

	try {
		const profile = JSON.parse(storedProfile);
		this.profileId = Number(profile?.fldId ?? 0);
		this.userType = String(profile?.fldUserType ?? '');
	} catch (error) {
		console.error('Unable to read the logged-in profile.', error);
	}
}

private loadOrders(): void {
	if (this.profileId <= 0 || !this.userType) {
		this.tblOrder$ = of([]);
		return;
	}

	// Order History must only load the logged-in profile's orders.
	this.tblOrder$ = this.tblOrderService
		.getTblPendingOrderBys(this.userType, this.profileId)
		.pipe(
			map(orders => this.normalizePendingOrders(orders).map(order => this.mapPendingOrder(order))),
			catchError(error => {
				console.error('Unable to load order history:', error);
				return of([]);
			})
		);
}

private normalizePendingOrders(response: unknown): TblPendingOrderDto[] {
	if (response == null) return [];
	if (Array.isArray(response)) {
		return response.filter(order => order != null && typeof order === 'object') as TblPendingOrderDto[];
	}
	if (typeof response === 'object' && 'message' in response) {
		const message = String((response as { message?: unknown }).message ?? '').trim().toLowerCase().replace(/[.!]+$/, '');
		if (message === 'no records found' || message === 'no pending orders' || message === 'no orders found') return [];
	}
	return [];
}

private mapPendingOrder(order: TblPendingOrderDto): TblOrder {
	const orderDate = order.fldOrderGeneratedAt ?? order.fldOrderDate;
	const customer = {
		fldId: Number(order.fldFKCustomerId ?? 0),
		fldUserType: order.fldCustomerUserType ?? 'Customer',
		fldFullName: order.fldCustomerFullName ?? '',
		fldContactNumber: order.fldCustomerContactNumber ?? '',
		fldStreetName: order.fldCustomerStreetName ?? '',
	} as TblProfile;
	const vendor = {
		fldId: Number(order.fldFKVendorId ?? 0),
		fldUserType: order.fldVendorUserType ?? 'Vendor',
		fldFullName: order.fldVendorFullName ?? '',
		fldContactNumber: order.fldVendorContactNumber ?? '',
		fldStreetName: order.fldVendorStreetName ?? '',
	} as TblProfile;
	const mapped: TblOrder & { pendingOrderdtls?: unknown } = {
		fldId: Number(order.fldOrderId ?? order.fldId ?? 0),
		fldFKCustomerId: Number(order.fldFKCustomerId ?? 0),
		tblProfileCustomerId: customer,
		fldFKVendorId: Number(order.fldFKVendorId ?? 0),
		tblProfileVendorId: vendor,
		fldOrderNumber: order.fldOrderNumber ?? '',
		fldOrderDate: orderDate as Date,
		fldItemSubTotal: Number(order.fldItemSubTotal ?? 0),
		fldDeliveryCharges: Number(order.fldDeliveryCharges ?? 0),
		fldGrandTotal: Number(order.fldGrandTotal ?? 0),
		fldOrderStatus: order.fldOrderStatus ?? '',
		fldDeliveryGPSLocation: order.fldDeliveryGPSLocation ?? '',
		fldIsActive: order.fldIsActive ?? true,
		fldCreatedBy: 0,
		fldCreatedDt: orderDate as Date,
		fldModifiedBy: 0,
		fldModifiedDt: orderDate as Date,
		fldDeletedBy: 0,
		fldDeletedDt: null as unknown as Date,
	};
	mapped.pendingOrderdtls = order.pendingOrderdtls;
	return mapped;
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
    const lines = data['pendingOrderdtls'] ?? data['tblOrderDetails'] ?? data['orderDetails'] ?? data['details'] ?? data['items'];
    if (Array.isArray(lines) && lines.length) {
      renderOrderReceipt(preview, order);
      return;
    }
    // Existing API in the supplied shopping component. A dedicated get-by-ID
    // API including details is preferable, especially for completed orders.
    const profileType = this.userType || 'Vendor';
    const profileId = this.profileId || Number(data['fldFKVendorId'] ?? data['tblProfileVendorId']?.['fldId']);
    if (!profileId) {
      preview.close();
      this.receiptError = 'The order does not contain a profile ID or saved items. Return order details from the order API.';
      return;
    }
    this.printingOrderId = order.fldId;
    this.receiptRequest = this.tblOrderService.getPrintOrder(profileType, profileId, order.fldId).pipe(
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

  /** Opens the delete confirmation dialog from the row delete icon only. */
  askDelete(order: TblOrder): void {
    this.deleteTargetLabel = order.fldOrderNumber ? `order ${order.fldOrderNumber}` : `order #${order.fldId}`;
    this.pendingDeleteRequest = {
      fldId: order.fldId,
      fldFKCustomerId: order.fldFKCustomerId ?? 0,
      fldFKVendorId: order.fldFKVendorId ?? 0,
      fldOrderNumber: order.fldOrderNumber ?? '',
      fldOrderDate: order.fldOrderDate ?? new Date(),
      fldItemSubTotal: order.fldItemSubTotal ?? 0,
      fldDeliveryCharges: order.fldDeliveryCharges ?? 0,
      fldGrandTotal: order.fldGrandTotal ?? 0,
      fldOrderStatus: order.fldOrderStatus ?? '',
      fldDeliveryGPSLocation: order.fldDeliveryGPSLocation ?? '',
      fldIsActive: order.fldIsActive ?? true,
      fldCreatedBy: order.fldCreatedBy ?? 0,
      fldCreatedDt: order.fldCreatedDt ?? new Date(),
      fldModifiedBy: order.fldModifiedBy ?? 0,
      fldModifiedDt: order.fldModifiedDt ?? new Date(),
    };
    this.deleteDialog.show();
  }

  confirmDelete(): void {
    if (!this.pendingDeleteRequest) {
      this.deleteDialog.close();
      return;
    }

    this.deleteDialog.busy = true;

    this.tblOrderService.deleteTblOrder(this.pendingDeleteRequest).subscribe({
      next: (response) => {
        this.deleteDialog.busy = false;
        this.deleteDialog.close();
        this.pendingDeleteRequest = undefined;

        if (response.status === 200) {
          this.toastr.success('Record deleted successfully!', 'Success', {
            toastClass: 'ngx-toastr custom-toast'
          });

          this.loadOrders();
        }
      },
      error: (err) => {
        this.deleteDialog.busy = false;

        const errorMsg = err?.error?.message || err?.error || 'An unexpected error occurred';

        this.toastr.error(errorMsg, 'Error', {
          toastClass: 'ngx-toastr custom-toast error-toast'
        });

        console.error('Delete Error:', err);
      }
    });
  }

  cancelDelete(): void {
    this.pendingDeleteRequest = undefined;
  }

  ngOnDestroy(): void {
    this.receiptRequest?.unsubscribe();
  }
}

