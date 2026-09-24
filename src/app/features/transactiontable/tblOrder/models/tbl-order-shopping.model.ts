// Customer-facing projection returned by the NEW vendor-specific order-stock endpoint.
// fldId is TblDailyInventory.FldId, NOT TblItemMaster.FldId.
export interface OrderStockItem {
  fldId: number;
  fldFKVendorId: number;
  fldFKItemId: number;
  fldItemName: string;
  fldItemNameTamil?: string | null;
  fldCategoryName?: string | null;
  fldItemImagePath?: string | null;
  fldBaseUnit: string;
  fldSellingRate: number;
  fldAvailableStock: number;
  fldAllowFractionalQuantity: boolean;
  fldMinOrderQuantityStep: number;
  fldIsAvailable: boolean;
  fldIsActive: boolean;
  fldAllowFlatRupeeValueBooking: boolean;
}

export interface OrderVendorOption {
  fldId: number;
  fldDescription: string;
  // Add delivery policy / time estimates to vendor API later.
}

export interface OrderCartLine {
  stock: OrderStockItem;
  quantity: number;
  flatRupeeBookingValue: number;
}

export interface OrderShoppingRequest {
  orderHeader: {
    fldFKCustomerId: number;
    fldFKVendorId: number;
    fldOrderDate: string;
    fldOrderOption: 'Current Day Order' | 'Advance Order';
    fldRequestedDeliveryDate: string;
    fldOrderType: 'Self Pickup' | 'Normal Delivery' | 'Priority Delivery' | 'Advance Delivery';
    fldPriceChangeOption: 'Auto Apply' | 'Get Confirmation' | null;
    fldItemSubTotal: number;
    fldDeliveryCharges: number;
    fldGrandTotal: number;
    fldOrderStatus: 'Pending';
    // Preview-only until supported by Order Header save DTO and database.
    fldPaymentMethod?: 'COD' | 'UPI';
    fldPaymentStatus?: 'Pending Collection' | 'Pending Verification';
    fldUPITransactionReference?: string | null;
    fldDeliveryAddress?: string | null;
    fldHouseImagePath?: string | null;
  };
  orderDetails: {
    fldFKItemId: number;
    fldFKDailyInventoryId: number;
    fldQuantity: number;
    fldUnit: string;
    fldRate: number;
    fldFlatRupeeBookingValue: number;
    value: number;
  }[];
}
