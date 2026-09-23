export interface TblOrderDetailUpdate {
	fldId: number;
	fldFKOrderHeaderId: number;
	fldFKItemId: number;
	fldFKDailyInventoryId: number;
	fldQuantity: number;
	fldUnit: string;
	fldRate: number;
	fldFlatRupeeBookingValue: number;
	value: number;
}
