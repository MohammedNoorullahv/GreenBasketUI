export interface TblProfileAdd {
	fldId: number;
	fldUserType: string;
	fldContactNumber: string;
	fldAlternateContactNumber: string;
	fldFullName: string;
	fldComplexOrBuildingName: string;
	fldDoorNo: string;
	fldFKStreetId: number;
	fldStreetName: string;
	fldGPSLocation: string;
	fldHouseImagePath: string;
	fldIsTermsAgreed: boolean;
	fldIsActive: boolean;
	fldCreatedBy: number;
	fldCreatedDt: Date;

	fldAllowAdvanceOrder?: boolean;
	fldADEndTime?: string;
	fldADCharges?: number;
	fldRegularDeliveryStartTime?: string;
	fldRDCharges?: number;
	fldAcceptingPriortyOrder?: boolean;
	fldPDDuration?: string;
	fldPDCharges?: number;
	fldCoveredRadius?: number;
	fldAdditionalChargesPerKm?: number;
	fldMaxCoveredRadius?: number;
}
