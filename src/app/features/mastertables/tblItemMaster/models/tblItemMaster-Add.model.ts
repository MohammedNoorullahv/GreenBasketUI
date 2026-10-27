// Path: src/app/features/mastertables/tblItemMaster/models/tblItemMaster-Add.model.ts
export interface TblItemMasterAdd {
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
}
