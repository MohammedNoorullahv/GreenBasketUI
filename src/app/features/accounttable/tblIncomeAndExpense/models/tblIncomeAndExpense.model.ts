// Path: src/app/features/accounttable/tblincomeandexpense/models/tblIncomeAndExpense.model.ts

import { TblProfile } from "../../../mastertables/tblProfile/models/tblProfile.model";
import { TblProperty } from "../../../mastertables/tblProperty/models/tblProperty.model";


export interface TblIncomeAndExpense {
  fldId: number;
  fldFKProfileId: number;
  fldTransactionDate: string;
  fldTransactionType: string;
  fldDescription: string;
  fldCurrencyCode: string;
  fldFKTransactionCategory: number;
  fldFKPaymentStatus: number;
  fldBillAmount: number;
  fldPaidorReceivedAmount: number;
  fldBalance2PayorReceive: number;
  fldIncome: number;
  fldExpenses: number;
  fldBalanceAmount: number;
  fldPaymentDate: string | null;
  fldPaymentMode: string | null;
  fldPaymentReference: string | null;
  fldPartyName: string | null;
  fldFKOrderId: number | null;
  fldInvoiceNumber: string | null;
  fldDocumentPath: string | null;
  fldServicePeriodFrom: string | null;
  fldServicePeriodTo: string | null;
  fldRemarks: string | null;
  fldFKTransactionId: number | null;
  fldIsActive: boolean | null;
  fldCreatedBy: number | null;
  fldCreatedDt: Date | null;
  fldModifiedBy: number | null;
  fldModifiedDt: Date | null;
  fldDeletedBy: number | null;
  fldDeletedDt: Date | null;
  tblProfileId: TblProfile | null;
  tblPropertyPaymentStatusId: TblProperty | null;
  tblPropertyTransactionCategoryId: TblProperty | null;
}

// DateOnly values remain ISO date strings on the wire, never JS Date objects.
export type IncomeExpenseDateField = 'fldTransactionDate' | 'fldPaymentDate' | 'fldServicePeriodFrom' | 'fldServicePeriodTo';
export const incomeExpenseDateFields: IncomeExpenseDateField[] =
  ['fldTransactionDate', 'fldPaymentDate', 'fldServicePeriodFrom', 'fldServicePeriodTo'];
