import { TblItemMaster } from "../../../mastertables/tblItemMaster/models/tblItemMaster.model";
import { TblProfile } from "../../../mastertables/tblProfile/models/tblProfile.model";

export interface TblDailyInventory {
    fldId: number;
    fldFKVendorId: number;
    tblProfileId: TblProfile;
    fldFKItemId: number;
    tblItemMasterId: TblItemMaster;
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
    fldModifiedBy: number;
    fldModifiedDt: Date;
    fldDeletedBy: number;
    fldDeletedDt: Date;
}
