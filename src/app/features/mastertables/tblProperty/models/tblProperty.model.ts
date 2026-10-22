// Path: src/app/features/mastertables/tblProperty/models/tblProperty.model.ts
import { TblPropertyMaster } from '../../tblPropertyMaster/models/tblPropertyMaster.model';

export interface TblProperty {
  fldId: number;
  fldFKProperty: number;
  tblPropertyMasterId: TblPropertyMaster;
  fldSlNo: number;
  fldDescription: string;
  fldShortName: string;
  fldSetAsDefault: boolean;
  fldIsActive: boolean;
  fldCreatedBy: number;
  fldCreatedDt: Date;
  fldModifiedBy: number;
  fldModifiedDt: Date;
  fldDeletedBy: number;
  fldDeletedDt: Date;
}
