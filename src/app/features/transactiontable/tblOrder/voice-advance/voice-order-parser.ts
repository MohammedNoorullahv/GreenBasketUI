// Pure parsing helpers. Recognition is a suggestion: every line remains editable.
export interface VoiceLine { name: string; quantity: number | null; unit: string; transcript: string; itemId?: number; stockId?: number; }
export function normaliseName(s: string): string {
  return s.normalize('NFKC').toLocaleLowerCase().replace(/[\u064b-\u065f\u0670]/g, '').replace(/\p{P}/gu, ' ').replace(/\s+/g, ' ').trim();
}
const unitAliases: Record<string, string[]> = {
 kg:['kg','kgs','kilo','kilos','kilogram','kilograms','kilo gram','kilo grams','கிலோ','கிலோகிராம்','கிலோ கிராம்','کیلو','کلو','کلوگرام','کلو گرام'],
 g:['g','gm','gms','gram','grams','கிராம்','گرام'],
 l:['l','lt','ltr','ltrs','litre','liter','litres','liters','லிட்டர்','لیٹر'],
 ml:['ml','millilitre','milliliter','millilitres','milliliters','milli litre','milli liter','மில்லி','மில்லி லிட்டர்','ملی لیٹر'],
 pcs:['pc','pcs','piece','pieces','no','nos','number','numbers','எண்ணிக்கை','பீஸ்','عدد','پیس'],
 bunch:['bunch','bunches','கட்டு','گڈی'],
 packet:['packet','packets','pack','packs','பாக்கெட்','پیکٹ']
};
export function canonicalUnit(s: string): string {
 const u=normaliseName(s).replace(/\s+/g,'');
 return Object.keys(unitAliases).find(k=>unitAliases[k].some(v=>normaliseName(v).replace(/\s+/g,'')===u))??normaliseName(s);
}
export function convertQuantity(n: number, from: string, to: string): number | null {
  const a = canonicalUnit(from), b = canonicalUnit(to);
  if (a === b) return n;
  if ((a === 'g' && b === 'kg') || (a === 'ml' && b === 'l')) return n / 1000;
  if ((a === 'kg' && b === 'g') || (a === 'l' && b === 'ml')) return n * 1000;
  return null;
}
const numbers: Record<string,number> = {
 zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,
 eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,
 twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90,
 half:.5,quarter:.25,'ஒன்று':1,'ஒரு':1,'இரண்டு':2,'ரெண்டு':2,'மூன்று':3,'நான்கு':4,'ஐந்து':5,'ஆறு':6,
 'ஏழு':7,'எட்டு':8,'ஒன்பது':9,'பத்து':10,'அரை':.5,'கால்':.25,'ஒன்றரை':1.5,'இரண்டரை':2.5,
 'நூறு':100,'இருநூறு':200,'ஐந்நூறு':500,'ایک':1,'دو':2,'تین':3,'چار':4,'پانچ':5,'چھ':6,'سات':7,
 'آٹھ':8,'نو':9,'دس':10,'آدھا':.5,'آدھی':.5,'آدھے':.5,'پاؤ':.25,'ڈیڑھ':1.5,'ڈھائی':2.5,'سو':100
};
function readNumber(words:string[]):number|null {
 const s=words.join(' ');if(/^\d+(?:\.\d+)?$/.test(s))return Number(s);
 if(numbers[s]!==undefined)return numbers[s];
 if(words.length===2 && ['a','an'].includes(words[0]) && ['half','quarter'].includes(words[1]))return numbers[words[1]];
 // Explicit phrases only; unrelated multiple quantities remain ambiguous.
 const mixed=s.match(/^(\d+|one|two|three|four|five) and (?:a )?(half|quarter)$/);
 if(mixed)return (numbers[mixed[1]]??Number(mixed[1]))+numbers[mixed[2]];
 const fraction=s.match(/^(\d+)\/(\d+)$/);if(fraction&&Number(fraction[2])>0)return Number(fraction[1])/Number(fraction[2]);
 const decimal=s.match(/^(\d+|one|two|three|four|five|zero) point (\d+|one|two|three|four|five|six|seven|eight|nine)$/);
 if(decimal)return Number(`${numbers[decimal[1]]??decimal[1]}.${numbers[decimal[2]]??decimal[2]}`);
 if(words.length===2&&numbers[words[0]]>=20&&numbers[words[0]]%10===0&&numbers[words[1]]>0&&numbers[words[1]]<10)return numbers[words[0]]+numbers[words[1]];
 const hundred=s.match(/^(one|two|three|four|five|six|seven|eight|nine) hundred$/);
 if(hundred)return numbers[hundred[1]]*100;
 const tamil=s.match(/^(இருநூற்று|ஐந்நூற்று) (ஐம்பது)$/);if(tamil)return (tamil[1]==='இருநூற்று'?200:500)+50;
 const urdu=s.match(/^(ایک|دو|تین|چار|پانچ) سو$/);if(urdu)return numbers[urdu[1]]*100;
 return null;
}
export function parseVoiceLine(transcript:string):VoiceLine {
 const text=transcript.normalize('NFKC').replace(/[٠-٩۰-۹௦-௯]/g,c=>{
  const n=c.charCodeAt(0);return String(n>=0x0be6?n-0x0be6:n>=0x06f0?n-0x06f0:n-0x0660);
 }).replace(/(\d)([\p{L}])/gu,'$1 $2').replace(/([\p{L}])(\d)/gu,'$1 $2')
   .replace(/[،,;!?؟۔]+/g,' ').replace(/\.(?!\d)/g,' ').replace(/-/g,' ');
 const tokens=text.trim().split(/\s+/).filter(Boolean),lower=tokens.map(t=>t.toLowerCase());
 let unit='',unitAt=-1,unitLength=0;
 for(let i=0;i<tokens.length;i++){
  for(let len=Math.min(3,tokens.length-i);len>0;len--){
   const u=canonicalUnit(tokens.slice(i,i+len).join(' '));
   if(Object.keys(unitAliases).includes(u)){
    if(unitAt!==-1)return {name:transcript.trim(),quantity:null,unit:'',transcript};
    unit=u;unitAt=i;unitLength=len;i+=len-1;break;
   }
  }
 }
 let quantity:number|null=null,start=-1,length=0;
 // Prefer a number phrase immediately before the detected unit.
 if(unitAt>0){for(let len=Math.min(5,unitAt);len>0;len--){const n=readNumber(lower.slice(unitAt-len,unitAt));if(n!==null){quantity=n;start=unitAt-len;length=len;break;}}}
 if(start<0){for(let i=0;i<tokens.length;i++){if(i>=unitAt&&i<unitAt+unitLength)continue;
  for(let len=Math.min(5,tokens.length-i);len>0;len--){
   if(unitAt>=i&&unitAt<i+len)continue;
   const n=readNumber(lower.slice(i,i+len));if(n!==null){quantity=n;start=i;length=len;break;}
  }if(start>=0)break;
 }}
 const kept=tokens.filter((_,i)=>!(i>=start&&i<start+length)&&!(i>=unitAt&&i<unitAt+unitLength));
 // Never interpret a second number as another item or silently use the first quantity.
 if(kept.some(t=>readNumber([t.toLowerCase()])!==null))return {name:transcript.trim(),quantity:null,unit:'',transcript};
 return {name:kept.join(' ').trim(),quantity,unit,transcript};
}
export function validQuantity(n: number | null, fractional: boolean, step: number): boolean {
  return n !== null && Number.isFinite(n) && n > 0 && n <= 1000000 &&
    Math.abs(n * 100 - Math.round(n * 100)) < 1e-7 && (fractional || Number.isInteger(n)) &&
    step > 0 && Math.abs(n / step - Math.round(n / step)) < 1e-7;
}
