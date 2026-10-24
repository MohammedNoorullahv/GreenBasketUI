// Path: src/app/features/mastertables/tblFeedback/tbl-feedback-list/tbl-feedback-list.ts
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { TblFeedback } from '../models/tblFeedback.model';
import { TblFeedbackService } from '../services/tbl-feedback';

@Component({
  selector: 'app-tbl-feedback-list',
  imports: [AsyncPipe, CommonModule, RouterLink],
  templateUrl: './tbl-feedback-list.html',
  styleUrl: './tbl-feedback-list.css',
})
export class TblFeedbackListComponent implements OnInit {
  tblFeedback$?: Observable<TblFeedback[]>;
  actionType: string = '';
  submitAction: 'Load All' | 'Active Only' = 'Load All'; // default to Load All

  constructor(private tblFeedbackService: TblFeedbackService) {
  }

  ngOnInit(): void {
    this.actionType = 'Load All';
    this.tblFeedback$ = this.tblFeedbackService.getAllTblFeedbacks();
  }

  OnFormSubmit(action: string): void {
    if (action === 'Load All') {
      this.actionType = 'Load All';
      this.tblFeedback$ = this.tblFeedbackService.getAllTblFeedbacks();
    }
    else {
      this.actionType = 'Active Only';
      this.tblFeedback$ = this.tblFeedbackService.getActiveTblFeedbacks();
    }
  }
}
