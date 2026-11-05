// Path: src/app/features/transactiontables/tblFeature/models/tblFeature-Add.model.ts
export interface TblFeatureAdd {
  fldFKProfileId: number;
  fldUserType: string;
  fldCategory: string;
  fldFeatureType: string;
  fldMenuName: string | null;
  fldFeatureName: string | null;
  fldSubject: string;
  fldDescription: string;
  fldAttachmentPath: string | null;
  fldAppVersion: string | null;
  fldStatus: string;
  fldAdminResponse: string | null;
  fldRespondedBy: number | null;
  fldRespondedDt: Date | null;
  fldIsActive: boolean;
  fldCreatedBy: number;
  fldCreatedDt: Date;
}
