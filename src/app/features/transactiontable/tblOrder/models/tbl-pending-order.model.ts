import { TblPendingOrderDetailDto } from "./tbl-pending-order-detail.model";

export interface TblPendingOrderDto {
  fldFKCustomerId: number;
  fldFKVendorId: number;
  fldOrderNumber?: string;
  fldOrderDate: Date | string;
  fldItemSubTotal: number;
  fldDeliveryCharges: number;
  fldGrandTotal: number;
  fldOrderStatus?: string;
  fldDeliveryGPSLocation?: string;
  fldIsActive: boolean;
  fldOrderOption?: string;
  fldRequestedDeliveryDate: Date | string;
  fldOrderType?: string;
  fldPriceChangeOption?: string;
  fldOrderGeneratedAt: Date | string;
  fldAcceptedAt?: Date | string;
  fldOutForDeliveryAt?: Date | string;
  fldDeliveredAt?: Date | string;
  fldCancelledAt?: Date | string;

  fldVendorUserType?: string; // Default: "Vendor"
  fldVendorContactNumber?: string;
  fldVendorAlternateContactNumber?: string;
  fldVendorFullName?: string;
  fldVendorComplexOrBuildingName?: string;
  fldVendorDoorNo?: string;
  fldVendorStreetName?: string;
  fldVendorGPSLocation?: string;
  fldVendorHouseImagePath?: string;

  fldCustomerUserType?: string; // Default: "Customer"
  fldCustomerContactNumber?: string;
  fldCustomerAlternateContactNumber?: string;
  fldCustomerFullName?: string;
  fldCustomerComplexOrBuildingName?: string;
  fldCustomerDoorNo?: string;
  fldCustomerStreetName?: string;
  fldCustomerGPSLocation?: string;
  fldCustomerHouseImagePath?: string;

  pendingOrderdtls: TblPendingOrderDetailDto[];
}