export interface TblOrder {
	fldId: number;
	fldFKCustomerId: number;
tblProfileId: TblProfile;
	fldFKVendorId: number;
tblProfileId: TblProfile;
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
	fldModifiedBy: number;
	fldModifiedDt: Date;
	fldDeletedBy: number;
	fldDeletedDt: Date;
}
