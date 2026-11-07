// Path: src/app/features/accounttable/tblincomeandexpense/tbl-income-and-expense-add/tbl-income-and-expense-add.ts
import { Component, ChangeDetectorRef, ElementRef, Inject, OnDestroy, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, combineLatest, forkJoin, take } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { TblIncomeAndExpense, IncomeExpenseDateField, incomeExpenseDateFields } from '../models/tblIncomeAndExpense.model';
import { TblIncomeAndExpenseAdd } from '../models/tblIncomeAndExpense-Add.model';
import { TblIncomeAndExpenseUpdate } from '../models/tblIncomeAndExpense-Update.model';
import { TblIncomeAndExpenseService } from '../services/tbl-income-and-expense';

import { TblPropertySharedservice } from '../../../../shared/services/tbl-property-shared-service';
import { TblProfile } from '../../../mastertables/tblProfile/models/tblProfile.model';
import { TblProperty } from '../../../mastertables/tblProperty/models/tblProperty.model';
import { TblProfileService } from '../../../mastertables/tblProfile/services/tbl-profile';

@Component({
  selector: 'app-tbl-income-and-expense-add', standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tbl-income-and-expense-add.html', styleUrl: './tbl-income-and-expense-add.css'
})
export class TblIncomeAndExpenseAddComponent implements OnInit, OnDestroy {
  model: TblIncomeAndExpenseAdd = this.newModel();
  private newModel(): TblIncomeAndExpenseAdd {
    return {
      fldFKProfileId: 0,
      fldTransactionDate: this.todayIso(),
      fldTransactionType: 'Income',
      fldDescription: '',
      fldCurrencyCode: 'INR',
      fldFKTransactionCategory: 0,
      fldFKPaymentStatus: 0,
      fldBillAmount: 0,
      fldPaidorReceivedAmount: 0,
      fldBalance2PayorReceive: 0,
      fldIncome: 0,
      fldExpenses: 0,
      fldBalanceAmount: 0,
      fldPaymentDate: null,
      fldPaymentMode: null,
      fldPaymentReference: null,
      fldPartyName: null,
      fldFKOrderId: null,
      fldInvoiceNumber: null,
      fldDocumentPath: null,
      fldServicePeriodFrom: null,
      fldServicePeriodTo: null,
      fldRemarks: null,
      fldFKTransactionId: null,
      fldIsActive: true,
      fldCreatedBy: 0,
      fldCreatedDt: new Date(),
    };
  }

  @ViewChild('form') form?: NgForm;
  @ViewChild('firstInput') firstInput?: ElementRef<HTMLInputElement>;
  private readonly subscriptions = new Subscription();
  private choiceSubscription?: Subscription;
  private writeSubscription?: Subscription;
  private focusTimer?: ReturnType<typeof setTimeout>;
  isSaving = false;
  isLoadingChoices = true;
  choiceError = '';
  profiles: TblProfile[] = [];
  paymentStatuses: TblProperty[] = [];
  paymentStatusName = 'Current payment status';
  hasPaymentStatus(): boolean { return this.paymentStatuses.some(p => p.fldId === this.model.fldFKPaymentStatus); }

  transactionCategories: TblProperty[] = [];
  transactionCategoryName = 'Transaction Category';
  hasTransactionCategory(): boolean { return this.transactionCategories.some(p => p.fldId === this.model.fldFKTransactionCategory); }

  profileName = '';
  profilePickerOpen = false;
  profileSearch = '';
  dateText: Record<IncomeExpenseDateField, string> = {
    fldTransactionDate: '', fldPaymentDate: '', fldServicePeriodFrom: '', fldServicePeriodTo: ''
  };
  dateErrors: Partial<Record<IncomeExpenseDateField, string>> = {};
  private readonly months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  private todayIso(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  private formatDate(value: string | null | undefined): string {
    if (!value) return '';
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return '';
    return `${match[3]}-${this.months[Number(match[2]) - 1]}-${match[1]}`;
  }
  private parseDate(value: string): string | null | undefined {
    if (!value.trim()) return null;
    const match = /^(\d{2})-([A-Za-z]{3})-(\d{4})$/.exec(value.trim());
    if (!match) return undefined;
    const day = Number(match[1]); const year = Number(match[3]);
    const month = this.months.findIndex(x => x.toLowerCase() === match[2].toLowerCase());
    if (month < 0 || year < 1) return undefined;
    const d = new Date(0); d.setUTCFullYear(year, month, day); d.setUTCHours(0, 0, 0, 0);
    if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month || d.getUTCDate() !== day) return undefined;
    return `${match[3]}-${String(month + 1).padStart(2, '0')}-${match[1]}`;
  }
  setDate(field: IncomeExpenseDateField, value: string): void {
    this.dateText[field] = value;
    const iso = this.parseDate(value);
    if (iso === undefined || (field === 'fldTransactionDate' && !iso)) {
      this.dateErrors[field] = 'Enter a valid date as dd-MMM-yyyy.';
    } else {
      delete this.dateErrors[field];
      if (field === 'fldTransactionDate') this.model.fldTransactionDate = iso ?? '';
      else this.model[field] = iso;
    }
  }
  private syncDateText(): void {
    this.dateErrors = {};
    for (const field of incomeExpenseDateFields) this.dateText[field] = this.formatDate(this.model[field]);
  }
  recalculate(): void {
    const amount = Number(this.model.fldBillAmount) || 0;
    this.model.fldIncome = this.model.fldTransactionType === 'Income' ? amount : 0;
    this.model.fldExpenses = this.model.fldTransactionType === 'Expense' ? amount : 0;
  }
  loadChoices(): void {
    this.choiceSubscription?.unsubscribe();
    this.isLoadingChoices = true; this.choiceError = '';
    this.choiceSubscription = forkJoin({
      profiles: this.profileService.getActiveLeanTblProfiles(),
      paymentStatuses: this.tblPropertySharedService.getPropertiesByType('Payment Status').pipe(take(1)),
      transactionCategories: this.tblPropertySharedService.getPropertiesByType('Transaction Category').pipe(take(1))
    }).subscribe({
      next: data => {
        this.profiles = data.profiles; this.paymentStatuses = data.paymentStatuses; this.transactionCategories = data.transactionCategories;
        this.isLoadingChoices = false;
        if (!this.profileName) this.profileName = this.profiles.find(x => x.fldId === this.model.fldFKProfileId)?.fldFullName ?? '';
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingChoices = false; this.choiceError = 'Unable to load profiles or payment statuses. Please retry.';
        this.cdr.markForCheck();
      }
    });
  }
  get filteredProfiles(): TblProfile[] {
    const q = this.profileSearch.trim().toLowerCase();
    return this.profiles.filter(x => !q || `${x.fldFullName ?? ''} ${x.fldContactNumber ?? ''} ${x.fldUserType ?? ''}`.toLowerCase().includes(q));
  }
  selectProfile(profile: TblProfile): void {
    this.model.fldFKProfileId = profile.fldId; this.profileName = profile.fldFullName;
    this.profilePickerOpen = false; this.form?.controls['profileName']?.markAsTouched();
  }
  isFormValid(form: NgForm): boolean {
    for (const field of incomeExpenseDateFields) this.setDate(field, this.dateText[field]);
    if (form.invalid || Object.keys(this.dateErrors).length) return false;
    if (!Number.isInteger(this.model.fldFKProfileId) || (this.model.fldFKProfileId ?? 0) <= 0) return false;
    if (!Number.isInteger(this.model.fldFKPaymentStatus) || (this.model.fldFKPaymentStatus ?? 0) <= 0) return false;
    if (!this.model.fldDescription?.trim() || !this.model.fldCurrencyCode?.trim() || !this.model.fldTransactionDate) return false;
    if (this.model.fldTransactionType !== 'Income' && this.model.fldTransactionType !== 'Expense') return false;
    for (const amount of [this.model.fldBillAmount, this.model.fldPaidorReceivedAmount, this.model.fldBalance2PayorReceive, this.model.fldBalanceAmount]) {
      if (amount === null || amount === undefined || !Number.isFinite(amount) || amount < 0 || amount > 9999999999999999.99 ||
          Math.abs(amount * 100 - Math.round(amount * 100)) > 0.001) return false;
    }
    if ((this.model.fldBillAmount ?? 0) < 0.01) return false;
    for (const id of [this.model.fldFKOrderId, this.model.fldFKTransactionId])
      if (id !== null && id !== undefined && (!Number.isInteger(id) || id < 1 || id > 2147483647)) return false;
    if (this.model.fldServicePeriodFrom && this.model.fldServicePeriodTo && this.model.fldServicePeriodFrom > this.model.fldServicePeriodTo) return false;
    return true;
  }
  private showError(error: HttpErrorResponse): void {
    const message = typeof error.error?.message === 'string' ? error.error.message : 'Unable to complete the request. Please review your entries and retry.';
    this.toastr.error(message, 'Error', { toastClass: 'ngx-toastr custom-toast error-toast' });
  }
  backToHome(): void { void this.router.navigateByUrl('/accounttable/tblincomeandexpense'); }
  private focusFirst(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.focusTimer) clearTimeout(this.focusTimer);
    this.focusTimer = setTimeout(() => {
      this.form?.controls['fldTransactionDate']?.markAsTouched(); this.firstInput?.nativeElement.focus();
      this.cdr.markForCheck();
    });
  }
  constructor(private service: TblIncomeAndExpenseService, private profileService: TblProfileService,
    private tblPropertySharedService: TblPropertySharedservice, private router: Router,
    private route: ActivatedRoute, private toastr: ToastrService, private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: object) {}
  ngOnInit(): void { this.syncDateText(); this.loadChoices(); this.focusFirst(); }
  resetForm(): void {
    this.model = this.newModel(); this.profileName = ''; this.profileSearch = '';
    this.syncDateText(); this.form?.resetForm({ ...this.model, ...this.dateText, profileName: '' }); this.focusFirst();
  }
  OnFormSubmit(form: NgForm, action: 'SaveAndAddNew' | 'SaveAndClose'): void {
    console.log("Saving Model :", this.model);
    if (this.isSaving || this.isLoadingChoices || this.choiceError) return;
    form.control.markAllAsTouched(); this.recalculate();
    if (!this.isFormValid(form)) {
      this.toastr.error('Please complete the required fields, use valid dates, and enter amounts with at most two decimal places.', 'Validation', { toastClass: 'ngx-toastr custom-toast error-toast' });
      return;
    }
    this.isSaving = true;
    // AUTH-STAGE-2: omit user stamp fields; the server will supply the current user.
    const payload = { ...this.model, fldCreatedBy: 0, fldCreatedDt: new Date() };
    this.writeSubscription = this.service.createTblIncomeAndExpense(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.toastr.success('Record saved successfully!', 'Success', { toastClass: 'ngx-toastr custom-toast' });
        if (action === 'SaveAndAddNew') this.resetForm(); else this.backToHome();
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => { this.isSaving = false; this.showError(error); this.cdr.markForCheck(); }
    });
  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe(); this.choiceSubscription?.unsubscribe(); this.writeSubscription?.unsubscribe();
    if (this.focusTimer) clearTimeout(this.focusTimer);
  }
}
