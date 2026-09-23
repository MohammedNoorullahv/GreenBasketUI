import { TblItemMaster } from "../../../mastertables/tblItemMaster/models/tblItemMaster.model";
import { TblDailyInventory } from "../../tblDailyInventory/models/tblDailyInventory.model";
import { TblOrder } from "../../tblOrder/models/tblOrder.model";

export interface TblOrderDetail {
	fldId: number;
	fldFKOrderHeaderId: number;
tblOrderId: TblOrder;
	fldFKItemId: number;
tblItemMasterId: TblItemMaster;
	fldFKDailyInventoryId: number;
tblDailyInventoryId: TblDailyInventory;
	fldQuantity: number;
	fldUnit: string;
	fldRate: number;
	fldFlatRupeeBookingValue: number;
	value: number;
}
