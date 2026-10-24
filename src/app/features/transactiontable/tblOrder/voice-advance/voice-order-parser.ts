// Pure parsing helpers. Recognition is a suggestion: every line remains editable.
export interface VoiceLine { name: string; quantity: number | null; unit: string; transcript: string; itemId?: number; stockId?: number; }
export function normaliseName(s: string): string {
  return s.normalize('NFKC').toLocaleLowerCase().replace(/[\u064b-\u065f\u0670]/g, '').replace(/\p{P}/gu, ' ').replace(/\s+/g, ' ').trim();
}
export function canonicalUnit(s: string): string {
  const u = normaliseName(s);
  const groups: Record<string, string[]> = {
    kg: ['kg','kgs','kilo','kilos','kilogram','kilograms','கிலோ','கிலோகிராம்','کلو','کلوگرام'],
    g: ['g','gm','gms','gram','grams','கிராம்','گرام'],
    l: ['l','ltr','ltrs','litre','liter','litres','liters','லிட்டர்','لیٹر'],
    ml: ['ml','millilitre','milliliter','மில்லி','ملی لیٹر'],
    pcs: ['pc','pcs','piece','pieces','no','nos','number','numbers','எண்ணிக்கை','عدد']
  };
  return Object.keys(groups).find(k => groups[k].includes(u)) ?? u;
}
export function convertQuantity(n: number, from: string, to: string): number | null {
  const a = canonicalUnit(from), b = canonicalUnit(to);
  if (a === b) return n;
  if ((a === 'g' && b === 'kg') || (a === 'ml' && b === 'l')) return n / 1000;
  if ((a === 'kg' && b === 'g') || (a === 'l' && b === 'ml')) return n * 1000;
  return null;
}
const numbers: Record<string, number> = {
  one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,
  half:0.5,quarter:0.25,'ஒன்று':1,'ஒரு':1,'இரண்டு':2,'மூன்று':3,'நான்கு':4,'ஐந்து':5,
  'ஆறு':6,'ஏழு':7,'எட்டு':8,'ஒன்பது':9,'பத்து':10,'அரை':0.5,'கால்':0.25,
  'ایک':1,'دو':2,'تین':3,'چار':4,'پانچ':5,'چھ':6,'سات':7,'آٹھ':8,'نو':9,'دس':10,'آدھا':0.5,'آدھی':0.5,'پاؤ':0.25
};
export function parseVoiceLine(transcript: string): VoiceLine {
  let text = transcript.normalize('NFKC').replace(/[٠-٩۰-۹௦-௯]/g, c => {
    const n = c.charCodeAt(0); return String(n >= 0x0be6 ? n-0x0be6 : n >= 0x06f0 ? n-0x06f0 : n-0x0660);
  }).replace(/(\d)([A-Za-z])/g,'$1 $2');
  const tokens = text.trim().split(/\s+/);
  let quantity: number | null = null, unit = '', numberIndex = -1;
  for (let i=0;i<tokens.length;i++) {
    const t = tokens[i].toLowerCase().replace(/[،,;.!?؟]+$/,'');
    const n = /^\d+(?:\.\d+)?$/.test(t) ? Number(t) : numbers[t];
    if (n !== undefined) {
      if (numberIndex !== -1) return { name: transcript.trim(), quantity:null, unit:'', transcript }; // ambiguous: don't guess
      quantity = n; numberIndex=i;
    }
  }
  const kept: string[]=[];
  tokens.forEach((token,i) => {
    const t = token.replace(/[،,;.!?؟]+$/,''); const u = canonicalUnit(t);
    if (['kg','g','l','ml','pcs'].includes(u)) { if (!unit) unit=u; else kept.push(t); }
    else if (i !== numberIndex) kept.push(t);
  });
  return { name: kept.join(' ').trim(), quantity, unit, transcript };
}
export function validQuantity(n: number | null, fractional: boolean, step: number): boolean {
  return n !== null && Number.isFinite(n) && n > 0 && n <= 1000000 &&
    Math.abs(n * 100 - Math.round(n * 100)) < 1e-7 && (fractional || Number.isInteger(n)) &&
    step > 0 && Math.abs(n / step - Math.round(n / step)) < 1e-7;
}
