import { Routes } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Navbar } from './core/components/navbar/navbar';
import { TblCityorTownMasterListComponent } from './features/mastertables/tblCityorTownMaster/tbl-cityor-town-master-list/tbl-cityor-town-master-list';
import { TblCityorTownMasterAddComponent } from './features/mastertables/tblCityorTownMaster/tbl-cityor-town-master-add/tbl-cityor-town-master-add';
import { TblCityorTownMasterUpdateComponent } from './features/mastertables/tblCityorTownMaster/tbl-cityor-town-master-update/tbl-cityor-town-master-update';
import { TblStreetMasterListComponent } from './features/mastertables/tblStreetMaster/tbl-street-master-list/tbl-street-master-list';
import { TblStreetMasterAddComponent } from './features/mastertables/tblStreetMaster/tbl-street-master-add/tbl-street-master-add';
import { TblStreetMasterUpdateComponent } from './features/mastertables/tblStreetMaster/tbl-street-master-update/tbl-street-master-update';
import { TblProfileListComponent } from './features/mastertables/tblProfile/tbl-profile-list/tbl-profile-list';
import { TblProfileAddComponent } from './features/mastertables/tblProfile/tbl-profile-add/tbl-profile-add';
import { TblItemMasterListComponent } from './features/mastertables/tblItemMaster/tbl-item-master-list/tbl-item-master-list';
import { TblItemMasterAddComponent } from './features/mastertables/tblItemMaster/tbl-item-master-add/tbl-item-master-add';
import { TblItemMasterUpdateComponent } from './features/mastertables/tblItemMaster/tbl-item-master-update/tbl-item-master-update';
import { TblDailyInventoryListComponent } from './features/transactiontable/tblDailyInventory/tbl-daily-inventory-list/tbl-daily-inventory-list';
import { TblDailyInventoryAddComponent } from './features/transactiontable/tblDailyInventory/tbl-daily-inventory-add/tbl-daily-inventory-add';
import { TblOrderListComponent } from './features/transactiontable/tblOrder/tbl-order-list/tbl-order-list';
import { TblOrderAddComponent } from './features/transactiontable/tblOrder/tbl-order-add/tbl-order-add';
import { TblOrderUpdateComponent } from './features/transactiontable/tblOrder/tbl-order-update/tbl-order-update';
import { TblOrderDetailListComponent } from './features/transactiontable/tblOrderDetail/tbl-order-detail-list/tbl-order-detail-list';
import { TblOrderDetailAddComponent } from './features/transactiontable/tblOrderDetail/tbl-order-detail-add/tbl-order-detail-add';
import { TblOrderDetailUpdateComponent } from './features/transactiontable/tblOrderDetail/tbl-order-detail-update/tbl-order-detail-update';
import { TblOrderShoppingComponent } from './features/transactiontable/tblOrder/tbl-order-list/tbl-order-shopping';
import { LoginComponent } from './core/components/login/login-component/login-component';
import { TblProfileUpdateComponent } from './features/mastertables/tblProfile/tbl-profile-update/tbl-profile-update';
import { TblPropertyMasterListComponent } from './features/mastertables/tblPropertyMaster/tbl-property-master-list/tbl-property-master-list';
import { TblPropertyMasterAddComponent } from './features/mastertables/tblPropertyMaster/tbl-property-master-add/tbl-property-master-add';
import { TblPropertyMasterUpdateComponent } from './features/mastertables/tblPropertyMaster/tbl-property-master-update/tbl-property-master-update';
import { TblPropertyListComponent } from './features/mastertables/tblProperty/tbl-property-list/tbl-property-list';
import { TblPropertyAddComponent } from './features/mastertables/tblProperty/tbl-property-add/tbl-property-add';
import { TblPropertyUpdateComponent } from './features/mastertables/tblProperty/tbl-property-update/tbl-property-update';
import { TblMenuMasterListComponent } from './features/mastertables/tblMenuMaster/tbl-menu-master-list/tbl-menu-master-list';
import { TblMenuMasterAddComponent } from './features/mastertables/tblMenuMaster/tbl-menu-master-add/tbl-menu-master-add';
import { TblMenuMasterUpdateComponent } from './features/mastertables/tblMenuMaster/tbl-menu-master-update/tbl-menu-master-update';
import { TblFeedbackListComponent } from './features/mastertables/tblFeedback/tbl-feedback-list/tbl-feedback-list';
import { TblFeedbackAddComponent } from './features/mastertables/tblFeedback/tbl-feedback-add/tbl-feedback-add';
import { TblFeedbackUpdateComponent } from './features/mastertables/tblFeedback/tbl-feedback-update/tbl-feedback-update';


// import { TblCityorTownMasterListComponent }
//   from './features/mastertables/tblCityorTownMaster/tbl-cityor-town-master-list/tbl-cityor-town-master-list';

export const routes: Routes = [

  // Default page: Login
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  // Login page
  {
    path: 'login',
    component: LoginComponent
  },

  // Public registration has no application sidebar/layout.
  {
    path: 'register',
    component: TblProfileAddComponent,
    data: { publicRegistration: true }
  },

  // Existing application layout
  {
    path: '',
    component: Navbar,

    children: [
      {
        path: 'mastertables/tblCityorTownMaster',
        component: TblCityorTownMasterListComponent
      },
      {
        path: 'mastertables/tblCityorTownMaster/add',
        component: TblCityorTownMasterAddComponent,
      },
      {
        path: 'mastertables/tblCityorTownMaster/Edit/:id',
        component: TblCityorTownMasterUpdateComponent,
      },
      {
        path: 'mastertables/tblStreetMaster',
        component: TblStreetMasterListComponent,
      },
      {
        path: 'mastertables/tblStreetMaster/add',
        component: TblStreetMasterAddComponent,
      },
      {
        path: 'mastertables/tblStreetMaster/Edit/:id',
        component: TblStreetMasterUpdateComponent,
      },
      {
        path: 'mastertables/tblProfile',
        component: TblProfileListComponent,
      },
      {
        path: 'mastertables/tblProfile/add',
        component: TblProfileAddComponent,
        canActivate: [() => {
          const router = inject(Router);
          const browser = isPlatformBrowser(inject(PLATFORM_ID));
          if (!browser) return true;
          try {
            return sessionStorage.getItem('gbAccessToken')
              ? true : router.parseUrl('/register');
          } catch { return router.parseUrl('/register'); }
        }],
      },
      {
        path: 'mastertables/tblProfile/Edit/:id',
        component: TblProfileUpdateComponent,
      },
      {
        path: 'mastertables/tblItemMaster',
        component: TblItemMasterListComponent,
      },
      {
        path: 'mastertables/tblItemMaster/add',
        component: TblItemMasterAddComponent,
      },
      {
        path: 'mastertables/tblItemMaster/Edit/:id',
        component: TblItemMasterUpdateComponent,
      },
      {
        path: 'transactiontables/tblDailyInventory',
        component: TblDailyInventoryListComponent,
      },
      {
        path: 'transactiontables/tblDailyInventory/add',
        component: TblDailyInventoryAddComponent,
      },
      {
        path: 'transactiontables/tblOrder',
        component: TblOrderShoppingComponent,
        // component: TblOrderListComponent,
      },
      {
        path: 'transactiontables/tblOrderList',
        component: TblOrderListComponent,
      },
      {
        path: 'transactiontables/tblOrder/add',
        component: TblOrderAddComponent,
      },
      {
        path: 'transactiontables/tblOrder/Edit/:id',
        component: TblOrderUpdateComponent,
      },
      {
        path: 'transactiontables/tblOrderDetail',
        component: TblOrderDetailListComponent,
      },
      {
        path: 'transactiontables/tblOrderDetail/add',
        component: TblOrderDetailAddComponent,
      },
      {
        path: 'transactiontables/tblOrderDetail/Edit/:id',
        component: TblOrderDetailUpdateComponent,
      },
      { path: 'transactiontables/tblOrder/shop', component: TblOrderShoppingComponent },
      { path: 'mastertables/tblPropertyMaster', component: TblPropertyMasterListComponent },
      // AUTH-STAGE-2: canActivate: [menuGuard]
      { path: 'mastertables/tblPropertyMaster/add', component: TblPropertyMasterAddComponent },
      // AUTH-STAGE-2: canActivate: [menuGuard]
      { path: 'mastertables/tblPropertyMaster/edit/:id', component: TblPropertyMasterUpdateComponent },
      { path: 'mastertables/tblProperty', component: TblPropertyListComponent },
      // AUTH-STAGE-2: canActivate: [menuGuard]
      { path: 'mastertables/tblProperty/add', component: TblPropertyAddComponent },
      // AUTH-STAGE-2: canActivate: [menuGuard]
      { path: 'mastertables/tblProperty/edit/:id', component: TblPropertyUpdateComponent },
      // AUTH-STAGE-2: canActivate: [menuGuard]
      { path: 'mastertables/tblMenuMaster', component: TblMenuMasterListComponent },
      // AUTH-STAGE-2: canActivate: [menuGuard]
      { path: 'mastertables/tblMenuMaster/add', component: TblMenuMasterAddComponent },
      // AUTH-STAGE-2: canActivate: [menuGuard]
      { path: 'mastertables/tblMenuMaster/edit/:id', component: TblMenuMasterUpdateComponent },
      // entries:
      { path: 'mastertables/tblFeedback', component: TblFeedbackListComponent },
      // AUTH-STAGE-2: canActivate: [menuGuard]
      { path: 'mastertables/tblFeedback/add', component: TblFeedbackAddComponent },
      // AUTH-STAGE-2: canActivate: [menuGuard]
      { path: 'mastertables/tblFeedback/edit/:id', component: TblFeedbackUpdateComponent },
      // AUTH-STAGE-2: canActivate: [menuGuard]
















    ]

  }

  // {
  //   path: '',
  //   redirectTo: 'mastertables/tblCityorTownMaster',
  //   pathMatch: 'full'
  // },

  // {
  //   path: 'mastertables/tblCityorTownMaster',
  //   component: TblCityorTownMasterListComponent
  // }

];