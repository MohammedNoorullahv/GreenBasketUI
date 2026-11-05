// Path: src/app/features/transactiontables/tblFeature/models/tblFeature-Update.model.ts
export interface TblFeatureUpdate {
  fldId: number;
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
  fldModifiedBy: number | null;
  fldModifiedDt: Date | null;
}
