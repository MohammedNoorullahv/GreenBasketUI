// Path: src/app/features/mastertables/tblProperty/models/tblProperty-Add.model.ts
export interface TblPropertyAdd {
  fldFKProperty: number;
  fldSlNo: number;
  fldDescription: string;
  fldShortName: string;
  fldSetAsDefault: boolean;
  fldIsActive: boolean;
  fldCreatedBy: number;
  fldCreatedDt: Date;
}
