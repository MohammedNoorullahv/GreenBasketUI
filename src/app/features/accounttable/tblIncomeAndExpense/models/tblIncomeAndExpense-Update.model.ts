// Path: src/app/features/accounttable/tblincomeandexpense/models/tblIncomeAndExpense-Update.model.ts
export interface TblIncomeAndExpenseUpdate {
  fldId: number;
  fldFKProfileId?: number;
  fldTransactionDate?: string;
  fldTransactionType?: string;
  fldDescription?: string;
  fldCurrencyCode?: string;
  fldFKTransactionCategory?: number;
  fldFKPaymentStatus?: number;
  fldBillAmount?: number;
  fldPaidorReceivedAmount?: number;
  fldBalance2PayorReceive?: number;
  fldIncome?: number;
  fldExpenses?: number;
  fldBalanceAmount?: number;
  fldPaymentDate?: string | null;
  fldPaymentMode?: string | null;
  fldPaymentReference?: string | null;
  fldPartyName?: string | null;
  fldFKOrderId?: number | null;
  fldInvoiceNumber?: string | null;
  fldDocumentPath?: string | null;
  fldServicePeriodFrom?: string | null;
  fldServicePeriodTo?: string | null;
  fldRemarks?: string | null;
  fldFKTransactionId?: number | null;
  fldIsActive?: boolean | null;
  fldCreatedBy?: number | null;
  fldCreatedDt?: Date | null;
  fldModifiedBy?: number | null;
  fldModifiedDt?: Date | null;
}
