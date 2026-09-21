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
      }










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