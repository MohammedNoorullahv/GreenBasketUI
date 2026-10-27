// Path: src/app/features/mastertables/tblItemMaster/models/tblItemMaster-Update.model.ts
export interface TblItemMasterUpdate {
	fldId: number;
	fldItemName: string;
	fldItemNameUrdu: string;
	fldItemNameTamil: string;
	fldItemType: string;
	fldCategoryName: string;
	fldBaseUnit: string;
	fldAllowFractionalQuantity: boolean;
	fldFractionalUnit: string;
	fldSubUnitLabel: string;
	fldAllowFlatRupeeValueBooking: boolean;
	fldMinOrderQuantityStep: number;
	fldItemImagePath: string;
	fldFKItem: number;
	fldFKItemType: number;
	fldFKCategoryName: number;
	fldFKBaseUnit: number;
	fldFKFractionalUnit: number;
	fldIsOpenPackingItem: boolean;
	fldFKGroupId: number;
	fldConversionRatetoBaseUnit: number;
	fldIsActive: boolean;
	fldCreatedBy: number;
	fldCreatedDt: Date;
	fldModifiedBy: number;
	fldModifiedDt: Date;
}
