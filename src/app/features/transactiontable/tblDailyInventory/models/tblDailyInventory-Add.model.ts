export interface TblDailyInventoryAdd {
	fldId: number;
	fldFKVendorId: number;
	fldFKItemId: number;
	fldItemName: string;
	fldBaseUnit: string;
	fldInventoryDate: Date;
	fldSellingRate: number;
	fldAvailableStock: number;
	fldInitialStock: number;
	fldIsAvailable: boolean;
	fldIsActive: boolean;
	fldCreatedBy: number;
	fldCreatedDt: Date;
}
