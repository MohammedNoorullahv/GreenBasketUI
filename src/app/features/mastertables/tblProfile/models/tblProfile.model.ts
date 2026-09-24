import { TblStreetMaster } from "../../tblStreetMaster/models/tblStreetMaster.model";

export interface TblProfile {
    fldId: number;
    fldUserType: string;
    fldContactNumber: string;
    fldAlternateContactNumber: string;
    fldFullName: string;
    fldComplexOrBuildingName: string;
    fldDoorNo: string;
    fldFKStreetId: number;
    tblStreetMasterId: TblStreetMaster;
    fldStreetName: string;
    fldGPSLocation: string;
    fldHouseImagePath: string;
    fldIsTermsAgreed: boolean;
    fldIsActive: boolean;
    fldCreatedBy: number;
    fldCreatedDt: Date;
    fldModifiedBy: number;
    fldModifiedDt: Date;
    fldDeletedBy: number;
    fldDeletedDt: Date;

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

    // Vendor payment configuration: also add these fields to the API DTO / database.
    fldUPIId?: string | null;
    fldUPIPayeeName?: string | null;
}
