import { TblCityorTownMaster } from "../../tblCityorTownMaster/models/tblCityorTownMaster.model";

export interface TblStreetMaster {
    fldId: number;
    fldFKCity: number;
    tblCityorTownMasterId: TblCityorTownMaster;
    fldStreetName: string;
    fldIsActive: boolean;
    fldCreatedBy: number;
    fldCreatedDt: Date;
    fldModifiedBy: number;
    fldModifiedDt: Date;
    fldDeletedBy: number;
    fldDeletedDt: Date;
}
