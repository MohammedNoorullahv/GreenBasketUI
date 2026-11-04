export interface TblDailyInventoryforStockEntry {
    fldId: number;
    fldFKVendorId: number;



    fldFKItemId: number;

    fldCategoryName: string;
    // Item type may come from the stock API or be joined client-side from item master.
    fldType?: string | null;
    fldItemType?: string | null;

    fldItemName: string;
    fldItemNameTamil: string;
    fldItemNameUrdu: string;
    fldBaseUnit: string;
    fldInventoryDate: Date;
    fldSellingRate: number;
    fldAvailableStock: number;
    fldNewStock: number | null;
    fldCurrentStock: number;
    fldInitialStock: number;

    fldAllowFractionalQuantity: boolean;
    fldMinOrderQuantityStep: number;
    fldIsAvailable: boolean;
    fldIsActive: boolean;
    fldCreatedBy: number;
    fldCreatedDt: Date;
    fldModifiedBy: number;
    fldModifiedDt: Date;
    fldDeletedBy: number;
    fldDeletedDt: Date;

    fldItemImagePath: string;

    fldSlNo: number;
    fldSubSlNo: number;
    fldFKItemMasterId: number;

    fldIsAddMore: boolean;
    fldIsDisplay: boolean;
}


// Reuse your existing API response model
export type StockEntryItem =
    TblDailyInventoryforStockEntry;


// Grid model with additional UI properties
export interface StockEntryRow extends StockEntryItem {

    fldIsAvailable: boolean;

    isChanged: boolean;

    originalSellingRate: number;

    originalNewStock: number;

    originalIsAvailable: boolean;

    quantityEdited: boolean;
    rateEdited: boolean;
    availabilityEdited: boolean;


}


// Individual row sent to Bulk Save API
export interface DailyStockEntrySaveRow {

    fldFKItemMasterId: number;

    fldNewStock: number;

    fldSellingRate: number;

    fldIsAvailable: boolean;

}


export interface DailyStockEntrySaveRequest {

    fldInventoryDate: string;

    items: DailyStockEntrySaveRow[];

}

// Vendor chip on the stock-entry screen: scopes the entry list to one vendor.
export interface StockVendorOption {
    fldId: number;
    fldDescription: string;
    /** Display rows (per vendor) shown on the chip. */
    itemCount: number;
    /** Display rows with unsaved changes, highlighted on the chip. */
    changedCount: number;
}