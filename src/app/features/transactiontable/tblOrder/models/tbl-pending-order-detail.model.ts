export interface TblPendingOrderDetailDto {
  fldFKItemId: number;
  fldFKDailyInventoryId: number;
  fldQuantity: number;
  fldUnit?: string;
  fldRate: number;
  fldFlatRupeeBookingValue: number;
  fldvalue: number;
  fldCategoryName?: string;
  fldItemType?: string;
  fldItemName?: string;
  fldItemNameUrdu?: string;
  fldItemNameTamil?: string;
  fldItemImagePath?: string;
}