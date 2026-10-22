// Path: src/app/features/mastertables/tblMenuMaster/models/tblMenuMaster-Add.model.ts
export interface TblMenuMasterAdd {
  fldTableOrView: string;
  fldFKCategory: number;
  fldCategory: string;
  fldMenuName: string;
  fldTableOrViewName: string;
  fldCondition: string;
  fldRoleOfTheMenu: string;
  fldControllerName: string;
  fldIcon: string;
  fldIsProcessProgram: boolean;
  fldIsActive: boolean;
  fldCreatedBy: number;
  fldCreatedDt: Date;
}
