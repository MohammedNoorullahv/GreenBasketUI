export interface TblOrderAdd {
	fldId: number;
	fldFKCustomerId: number;
	fldFKVendorId: number;
	fldOrderNumber: string;
	fldOrderDate: Date;
	fldItemSubTotal: number;
	fldDeliveryCharges: number;
	fldGrandTotal: number;
	fldOrderStatus: string;
	fldDeliveryGPSLocation: string;
	fldIsActive: boolean;
	fldCreatedBy: number;
	fldCreatedDt: Date;
}
