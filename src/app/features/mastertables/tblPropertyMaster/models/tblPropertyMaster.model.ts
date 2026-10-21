// Path: src/app/features/mastertables/tblPropertyMaster/models/tblPropertyMaster.model.ts
export interface TblPropertyMaster {
  fldId: number;
  fldSlNo: number;
  fldDescription: string;
  fldShortName: string;
  fldIsActive: boolean;
  fldCreatedBy: number;
  fldCreatedDt: Date;
  fldModifiedBy: number;
  fldModifiedDt: Date;
  fldDeletedBy: number;
  fldDeletedDt: Date;
}
