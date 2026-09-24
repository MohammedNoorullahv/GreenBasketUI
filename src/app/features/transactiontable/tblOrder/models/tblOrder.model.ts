import { TblProfile } from "../../../mastertables/tblProfile/models/tblProfile.model";

export interface TblOrder {
	fldId: number;
	fldFKCustomerId: number;
	tblCustomerProfileId: TblProfile;
	fldFKVendorId: number;
	tblVendorProfileId: TblProfile;
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
