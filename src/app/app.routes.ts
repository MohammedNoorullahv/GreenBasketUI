import { Routes } from '@angular/router';
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

// import { TblCityorTownMasterListComponent }
//   from './features/mastertables/tblCityorTownMaster/tbl-cityor-town-master-list/tbl-cityor-town-master-list';

export const routes: Routes = [
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
      { path: 'transactiontables/tblOrder/shop', component: TblOrderShoppingComponent }
















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