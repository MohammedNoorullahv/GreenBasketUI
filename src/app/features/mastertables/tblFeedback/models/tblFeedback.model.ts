// Path: src/app/features/mastertables/tblFeedback/models/tblFeedback.model.ts
export interface TblFeedback {
  fldId: number;
  fldFKProfileId: number;
  fldUserType: string;
  fldCategory: string;
  fldFeedbackType: string;
  fldMenuName?: string;
  fldFeatureName?: string;
  fldSubject: string;
  fldDescription: string;
  fldAttachmentPath?: string;
  fldAppVersion?: string;
  fldStatus: string;
  fldAdminResponse?: string;
  fldRespondedBy?: number;
  fldRespondedDt?: Date;
  fldIsActive: boolean;
  fldCreatedBy: number;
  fldCreatedDt: Date;
  fldModifiedBy?: number;
  fldModifiedDt?: Date;
  fldDeletedBy?: number;
  fldDeletedDt?: Date;
}
