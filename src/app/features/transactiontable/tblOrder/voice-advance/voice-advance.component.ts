import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, firstValueFrom, timeout } from 'rxjs';
import { OrderStockItem } from '../models/tbl-order-shopping.model';
import { AdvanceRequest, CatalogItem, RequestLine, VoiceAdvanceService } from './voice-advance.service';
import { rankStock } from './voice-item-match';
import { VoiceLine, canonicalUnit, convertQuantity, normaliseName, parseVoiceLine, validQuantity } from './voice-order-parser';
interface ReviewLine extends VoiceLine { catalog?: CatalogItem; choices: OrderStockItem[]; search: string; results: CatalogItem[]; }
interface QuoteLine { id:number; decision:string; itemId:number|null; quantity:number; rate:number; reason:string; inventoryId:number; search:string; results:CatalogItem[]; }
interface RecognitionResult { isFinal:boolean; [index:number]:{transcript:string}; }
interface RecognitionEvent { resultIndex:number; results:{length:number;[index:number]:RecognitionResult}; }
interface Recognition {
  lang:string; continuous:boolean; interimResults:boolean; maxAlternatives:number;
  onresult:((e:RecognitionEvent)=>void)|null; onerror:((e:{error:string})=>void)|null; onend:(()=>void)|null;
  start():void; stop():void; abort():void;
}
@Component({
 selector:'app-voice-advance', standalone:true, imports:[CommonModule,FormsModule],
 templateUrl:'./voice-advance.component.html',styleUrl:'./voice-advance.component.css'
})
export class VoiceAdvanceComponent implements OnInit, OnChanges, OnDestroy {
 @Input() vendorId=0; @Input() customerId=0; @Input() userType=''; @Input() stock:OrderStockItem[]=[];
 @Input() advanceAllowed=false;
 @Output() reviewedStock = new EventEmitter<{item:OrderStockItem;quantity:number}[]>();
 @Output() orderPlaced = new EventEmitter<void>();
 liveTranscript='';
 private silenceTimer?:ReturnType<typeof setTimeout>;
 private captureTimer?:ReturnType<typeof setTimeout>;
 language='en-IN'; text=''; lines:ReviewLine[]=[]; message=''; busy=false; listening=false; microphoneAvailable=false;
 advance=false; date=''; requests:AdvanceRequest[]=[]; selected:AdvanceRequest|null=null;
 quotes:QuoteLine[]=[]; arranged:OrderStockItem[]=[]; loadingRequests=false;
 private recognition:Recognition|null=null; private polling?:ReturnType<typeof setInterval>; private requestSub?:Subscription;
 private requestId=''; private generation=0; private destroyed=false; private previousVendor=0;
 constructor(private api:VoiceAdvanceService,@Inject(PLATFORM_ID) private platform:object,private zone:NgZone,private cdr:ChangeDetectorRef) {}
 get customer(){return this.userType==='Customer';} get vendor(){return this.userType==='Vendor';}
 get tomorrow(){const d=new Date(); d.setDate(d.getDate()+1); return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);}
 ngOnInit(){
  this.date=this.tomorrow;
  if(!isPlatformBrowser(this.platform))return;
  const w=window as unknown as {SpeechRecognition?:new()=>Recognition;webkitSpeechRecognition?:new()=>Recognition};
  this.microphoneAvailable=!!(w.SpeechRecognition||w.webkitSpeechRecognition);
  this.refresh(); this.polling=setInterval(()=>{if(document.visibilityState==='visible')this.refresh();},30000);
 }
 ngOnChanges(){
  if(this.previousVendor!==this.vendorId){
   this.generation++;this.stopVoice(true);this.liveTranscript='';this.lines=[];this.text='';this.requestId='';this.advance=false;this.previousVendor=this.vendorId;
  }
 }
 ngOnDestroy(){this.destroyed=true;this.generation++;this.stopVoice(true);if(this.polling)clearInterval(this.polling);this.requestSub?.unsubscribe();}
 private update(){if(!this.destroyed)this.cdr.markForCheck();}
 private error(e:unknown):string {
  const x=e as {error?:{message?:string}|string;message?:string};
  return typeof x?.error==='string'?x.error:x?.error?.message??'Unable to complete this action. Refresh and try again.';
 }
 private async run(work:()=>Promise<unknown>,success:string){
  if(this.busy)return;this.busy=true;this.message='';
  try{await work();if(this.destroyed)return;this.message=success;this.selected=null;this.refresh();}
  catch(e){this.message=this.error(e);}finally{this.busy=false;this.update();}
 }
 refresh(){
  if(!isPlatformBrowser(this.platform)||(!this.customer&&!this.vendor)||this.loadingRequests)return;
  this.loadingRequests=true;
  this.requestSub=this.api.mine().subscribe({next:r=>{this.requests=r;this.loadingRequests=false;this.update();},
   error:e=>{this.loadingRequests=false;this.message=this.error(e);this.update();}});
 }
 private clearVoiceTimers(){
  if(this.silenceTimer)clearTimeout(this.silenceTimer);
  if(this.captureTimer)clearTimeout(this.captureTimer);
 }
 private appendTranscript(value:string){const t=value.trim();if(t)this.text+=(this.text?'\n':'')+t;}
 startVoice(){
  if(this.busy||this.listening||!this.customer||!this.vendorId)return;
  this.stopVoice(true);this.liveTranscript='';
  const w=window as unknown as {SpeechRecognition?:new()=>Recognition;webkitSpeechRecognition?:new()=>Recognition};
  const ctor=w.SpeechRecognition||w.webkitSpeechRecognition;
  if(!ctor){this.message='Speech recognition is unavailable. Type the list below.';return;}
  const epoch=this.generation,r=new ctor();this.recognition=r;
  const current=()=>epoch===this.generation&&!this.destroyed&&this.recognition===r;
  r.lang=this.language;r.continuous=false;r.interimResults=true;r.maxAlternatives=1;
  r.onresult=e=>this.zone.run(()=>{
   if(!current())return;
   const results=Array.from({length:e.results.length},(_,i)=>e.results[i]);
   this.liveTranscript=results.map(x=>x[0].transcript).join(' ').trim();
   if(this.silenceTimer)clearTimeout(this.silenceTimer);
   if(results.length&&results.every(x=>x.isFinal)){
    this.appendTranscript(this.liveTranscript);this.liveTranscript='';this.stopVoice(true);
    this.message='Speech captured. Record the next item or click Review list.';
   }else this.silenceTimer=setTimeout(()=>this.zone.run(()=>{if(current())this.stopVoice();}),2200);
   this.update();
  });
  r.onerror=e=>this.zone.run(()=>{
   if(!current())return;this.stopVoice(true);
   this.message=e.error==='not-allowed'?'Microphone permission denied. Allow microphone access or type the list.':
    `Recognition stopped (${e.error}). You can use the draft below, retry or type.`;this.update();
  });
  r.onend=()=>this.zone.run(()=>{
   if(!current())return;this.clearVoiceTimers();this.listening=false;this.recognition=null;
   this.message=this.liveTranscript?'Recognition ended. Review the draft and click Use captured text, or retry.':'No speech result received. Check microphone and selected speech language, or type the item.';this.update();
  });
  try{r.start();this.listening=true;this.message='Listening: say one item, quantity and unit.';
   this.captureTimer=setTimeout(()=>this.zone.run(()=>{
    if(current()){this.stopVoice(true);this.message='Recognition timed out. Use any captured draft below, retry or type.';this.update();}
   }),18000);
  }catch{this.stopVoice(true);this.message='Microphone could not start. Retry or type the list.';}
 }
 stopVoice(cancel=false):void {
  if(!this.recognition){this.listening=false;return;}
  if(cancel){
   const r=this.recognition;this.recognition=null;this.clearVoiceTimers();
   r.onresult=null;r.onerror=null;r.onend=null;r.abort();this.listening=false;
  }else{try{this.recognition.stop();this.message='Finishing recognition… You may use the captured draft below.';}catch{this.stopVoice(true);}}
 }
 useCapturedText():void {
  const t=this.liveTranscript;this.stopVoice(true);this.appendTranscript(t);this.liveTranscript='';
  this.message='Draft added for review. Correct the item, quantity and unit before adding to cart.';
 }
 review(){
  const parts=this.text.split(/[\n;,،]+/).map(x=>x.trim()).filter(Boolean);
  if(parts.length>50){this.message='Use at most 50 request lines. Nothing was removed; shorten the text and review again.';return;}
  this.stopVoice(true);this.lines=parts.map(t=>{
   const p=parseVoiceLine(t);const line:ReviewLine={...p,choices:[],search:p.name,results:[]};this.match(line);return line;
  });this.requestId='';this.message='Review every item, quantity, unit and price row. Nothing has been ordered.';
 }
 match(l:ReviewLine){
  l.stockId=undefined;l.itemId=undefined;l.catalog=undefined;
  l.choices=rankStock(l.name,this.stock);
  // Suggestions are never selected automatically; the customer chooses item and price.

 }
 chooseStock(l:ReviewLine,id:number|string){
  const s=this.stock.find(x=>x.fldId===Number(id));
  if(!s){l.stockId=undefined;l.itemId=undefined;l.catalog=undefined;return;}
  const converted=l.quantity!==null&&l.unit?convertQuantity(l.quantity,l.unit,s.fldBaseUnit):null;
  if(converted!==null)l.quantity=converted;
  // Missing or incompatible units are deliberately not guessed.
  const compatible=!l.unit||canonicalUnit(l.unit)===canonicalUnit(s.fldBaseUnit)||converted!==null;
  l.stockId=s.fldId;l.itemId=s.fldFKItemId;l.name=s.fldItemName;
  if(compatible)l.unit=s.fldBaseUnit;
  l.catalog={id:s.fldFKItemId,name:s.fldItemName,unit:s.fldBaseUnit,fractional:s.fldAllowFractionalQuantity,step:Number(s.fldMinOrderQuantityStep)||1};
 }
 urduName(s:OrderStockItem):string{return (s as OrderStockItem & {fldItemNameUrdu?:string|null}).fldItemNameUrdu??'';}
 availability(l:ReviewLine):string{
  const s=this.stock.find(x=>x.fldId===l.stockId);
  if(!s)return l.choices.length?'Select a suggested item and price':'No similar stock found. Edit the name or request advance delivery';
  if(canonicalUnit(l.unit)!==canonicalUnit(s.fldBaseUnit))return 'Unit does not match the item';
  if(!validQuantity(l.quantity,s.fldAllowFractionalQuantity,Number(s.fldMinOrderQuantityStep)||1))return 'Correct the quantity / quantity step';
  if(l.quantity!>s.fldAvailableStock)return `Only ${s.fldAvailableStock} ${s.fldBaseUnit} available`;
  return 'Available';
 }
 get allAvailable(){return this.lines.length>0&&this.lines.every(l=>this.availability(l)==='Available');}
 addToCart(){
  if(!this.allAvailable||this.busy)return;
  this.reviewedStock.emit(this.lines.map(l=>({item:this.stock.find(s=>s.fldId===l.stockId)!,quantity:l.quantity!})));
  this.message='Reviewed quantities sent to the cart. Check the cart and delivery type before saving.';
 }
 beginAdvance(){this.advance=true;this.message='Search Item Master only for advance requests, or retain an unmatched name for vendor clarification. Prices await quotation.';}
 async search(l:ReviewLine){
  const q=l.search.trim();if(q.length<2)return; const epoch=this.generation;
  try{const r=await firstValueFrom(this.api.search(q).pipe(timeout(15000)));if(epoch===this.generation&&!this.destroyed)l.results=r;}
  catch(e){this.message=this.error(e);}this.update();
 }
 chooseMaster(l:ReviewLine,item:CatalogItem){
  const n=l.quantity!==null&&l.unit?convertQuantity(l.quantity,l.unit,item.unit):null;
  if(n!==null)l.quantity=n;
  l.itemId=item.id;l.catalog=item;l.name=item.name;
  if(!l.unit||n!==null||canonicalUnit(l.unit)===canonicalUnit(item.unit))l.unit=item.unit;
  l.stockId=undefined;l.results=[];
 }
 clearMatch(l:ReviewLine){this.match(l);}
 submitRequest(){
  if(!this.advanceAllowed||!this.advance||!this.vendorId||!this.lines.length)return;
  for(const l of this.lines){
   if(!l.name.trim()||!l.unit.trim()||l.unit.length>20||!validQuantity(l.quantity,l.catalog?.fractional??true,l.catalog?Number(l.catalog.step)||1:0.01)){
    this.message='Correct each name, unit and quantity before submitting.';return;
   }
   if(l.catalog&&canonicalUnit(l.unit)!==canonicalUnit(l.catalog.unit)){this.message='Use the selected item’s base unit.';return;}
  }
  if(!this.requestId)this.requestId=crypto.randomUUID();
  const dto={id:this.requestId,vendorId:this.vendorId,date:this.date,lines:this.lines.map(l=>({itemId:l.itemId??null,name:l.name.trim(),quantity:l.quantity,unit:l.unit.trim()}))};
  void this.run(async()=>{await firstValueFrom(this.api.create(dto).pipe(timeout(30000)));this.lines=[];this.text='';this.advance=false;this.requestId='';},'Advance request sent. Await vendor quotation in the request list below. No payment is due yet.');
 }
 open(r:AdvanceRequest){
  if(this.busy)return;this.selected=r;this.arranged=[];
  this.quotes=r.lines.map(l=>({id:l.fldId,decision:l.fldDecision==='Pending'?'CanSupply':l.fldDecision,
   itemId:l.fldOfferedItemId??l.fldFKItemId,quantity:l.fldOfferedQuantity??l.fldRequestedQuantity,
   rate:l.fldRate??0,reason:l.fldReason??'',inventoryId:l.fldFKDailyInventoryId??0,search:l.fldRequestedName,results:[]}));
  if(this.vendor)void this.loadArranged();
 }
 async searchQuote(q:QuoteLine){try{q.results=await firstValueFrom(this.api.search(q.search).pipe(timeout(15000)));}catch(e){this.message=this.error(e);}this.update();}
 async loadArranged(){if(!this.selected)return;const requestId=this.selected.header.fldId;try{
  const stock=await firstValueFrom(this.api.stocks(this.selected.header.fldFKVendorId).pipe(timeout(15000)));
  if(this.destroyed||this.selected?.header.fldId!==requestId)return;
  this.arranged=stock.map(x=>({...x,fldAvailableStock:Number(x.fldCurrentStock??x.fldAvailableStock??0),fldFKItemId:Number(x.fldFKItemMasterId??x.fldFKItemId)}));
 }catch(e){this.message=this.error(e);}this.update();}
 eligible(q:QuoteLine){return this.arranged.filter(s=>s.fldFKItemId===q.itemId&&Number(s.fldSellingRate)===Number(q.rate)&&s.fldAvailableStock>=q.quantity);}
 version(){const h=this.selected!.header;return {id:h.fldId,version:h.fldVersion};}
 quote(){void this.run(()=>firstValueFrom(this.api.action('Quote',{...this.version(),lines:this.quotes})), 'Quote sent. The customer can review each supplied / unavailable item.');}
 accept(){void this.run(()=>firstValueFrom(this.api.action('Accept',this.version())), 'Quote accepted. Await the vendor arranging stock.');}
 ready(){void this.run(()=>firstValueFrom(this.api.action('Ready',{...this.version(),lines:this.quotes.filter(x=>x.decision==='CanSupply').map(x=>({id:x.id,inventoryId:Number(x.inventoryId)}))})), 'Arranged stock linked. The customer must explicitly place the order.');}
 cancel(){const reason=prompt('Reason for cancelling this request (shown to the other person):');if(reason?.trim())void this.run(()=>firstValueFrom(this.api.action('Cancel',{...this.version(),reason:reason.trim()})), 'Request cancelled.');}
 place(){
  const r=this.selected;if(!r||r.header.fldStatus!=='Ready')return;
  if(!confirm('Place an advance order for the agreed supply items and displayed total?'))return;
  const h=r.header;
  const dto={advanceRequestId:h.fldId,advanceRequestVersion:h.fldVersion,
   orderHeader:{fldFKCustomerId:this.customerId,fldFKVendorId:h.fldFKVendorId,fldOrderDate:new Date().toISOString().slice(0,10),
    fldOrderOption:'Advance Order',fldOrderType:'Advance Delivery',fldRequestedDeliveryDate:h.fldRequestedDeliveryDate,
    fldPriceChangeOption:'Get Confirmation',fldItemSubTotal:h.fldItemSubTotal,fldDeliveryCharges:h.fldDeliveryCharges,
    fldOriginalDeliveryCharges:h.fldOriginalDeliveryCharges,fldDeliverySavings:h.fldDeliverySavings,
    fldGrandTotal:h.fldGrandTotal,fldOrderStatus:'Pending',fldPaymentMethod:'COD'},
   orderDetails:r.lines.filter(l=>l.fldDecision==='CanSupply').map(l=>({fldFKItemId:l.fldOfferedItemId,
    fldFKDailyInventoryId:l.fldFKDailyInventoryId,fldQuantity:l.fldOfferedQuantity,fldUnit:l.fldUnit,fldRate:l.fldRate,
    fldFlatRupeeBookingValue:0,value:Math.round(l.fldOfferedQuantity!*l.fldRate!*100)/100}))};
  void this.run(async()=>{await firstValueFrom(this.api.place(dto).pipe(timeout(45000)));this.orderPlaced.emit();},'Order placed. Continue with the existing order tracking and bill.');
 }
}
