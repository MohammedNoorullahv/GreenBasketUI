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

    fldvVendorName?: string;
    fldvAllowAdvanceOrder?: boolean;
    fldvADEndTime?: string;
    fldvADCharges?: number;
    fldvRegularDeliveryStartTime?: string;
    fldvRDCharges?: number;
    fldvAcceptingPriortyOrder?: boolean;
    fldvPDDuration?: string;
    fldvPDCharges?: number;
    fldvCoveredRadius?: number;
    fldvAdditionalChargesPerKm?: number;
    fldvMaxCoveredRadius?: number;
    fldvUPIId?: string | null;
    fldvUPIPayeeName?: string | null;

    fldEmailId?: string | null;
    fldPasswordHash?: string | null;
}
