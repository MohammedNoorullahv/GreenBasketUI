import { normaliseName } from './voice-order-parser';
export interface SearchableItem { fldItemName?:string|null; fldItemNameTamil?:string|null; fldItemNameUrdu?:string|null; fldCategoryName?:string|null; }
function distance(a:string,b:string):number {
 const prev=Array.from({length:b.length+1},(_,i)=>i);
 for(let i=1;i<=a.length;i++){let diagonal=prev[0];prev[0]=i;
  for(let j=1;j<=b.length;j++){const old=prev[j];prev[j]=Math.min(prev[j]+1,prev[j-1]+1,diagonal+(a[i-1]===b[j-1]?0:1));diagonal=old;}
 }return prev[b.length];
}
function similarity(a:string,b:string):number {
 if(a===b)return 1;if(Math.min(a.length,b.length)<3)return 0;
 return 1-distance(a,b)/Math.max(a.length,b.length);
}
export function itemMatchScore(query:string,item:SearchableItem):number {
 const q=normaliseName(query);if(!q)return 0;let best=0;
 for(const raw of [item.fldItemName,item.fldItemNameTamil,item.fldItemNameUrdu]){
  if(!raw)continue;const name=normaliseName(raw);
  if(q===name){best=Math.max(best,100);continue;}
  if(q.length>=2&&name.includes(q)){best=Math.max(best,90);continue;}
  const qt=q.split(' '),nt=name.split(' ');
  const token=Math.max(...qt.map(a=>Math.max(...nt.map(b=>similarity(a,b)))));
  const full=similarity(q.replace(/\s/g,''),name.replace(/\s/g,''));
  const score=Math.max(full,token*.92);if(score>=.58)best=Math.max(best,Math.round(score*80));
 }
 if(item.fldCategoryName&&normaliseName(item.fldCategoryName).includes(q))best=Math.max(best,35);
 return best;
}
export function rankStock<T extends SearchableItem>(query:string,stock:T[],limit=30):T[]{
 if(!normaliseName(query))return [];
 return stock.map((item,index)=>({item,index,score:itemMatchScore(query,item)})).filter(x=>x.score>0)
 .sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,limit).map(x=>x.item);
}
