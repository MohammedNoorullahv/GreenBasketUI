export interface TblDailyInventoryforStockEntry {
    fldId: number;
    fldFKVendorId: number;

    

    fldFKItemId: number;
    
    fldCategoryName: string;
    fldType: string;

    fldItemName: string;
    fldItemNameTamil: string;
    fldItemNameUrdu: string;
    fldBaseUnit: string;
    fldInventoryDate: Date;
    fldSellingRate: number;
    fldAvailableStock: number;
    fldNewStock: number;
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


// Complete Bulk Save request
export interface DailyStockEntrySaveRequest {

    fldInventoryDate: string;

    items: DailyStockEntrySaveRow[];

}