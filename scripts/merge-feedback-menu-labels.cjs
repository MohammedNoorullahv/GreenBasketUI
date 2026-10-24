'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const root=path.resolve(__dirname,'..');
const labels={en:'Feedback',ta:'கருத்துகள்',ur:'رائے'};
const changes=Object.entries(labels).map(([lang,value])=>{
 const file=path.join(root,'public','i18n',lang+'.json');
 const json=JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
 if(!json || typeof json!=='object'||Array.isArray(json))throw new Error('Invalid language JSON: '+file);
 if(json.MENU!==undefined&&(!json.MENU||typeof json.MENU!=='object'||Array.isArray(json.MENU)))throw new Error('MENU must be an object: '+file);
 json.MENU={...(json.MENU||{}),FEEDBACK:value};return {file,json};
});
const backup=fs.mkdtempSync(path.join(os.tmpdir(),'gb-feedback-labels-'));
for(const {file,json} of changes){fs.copyFileSync(file,path.join(backup,path.basename(file)));fs.writeFileSync(file,JSON.stringify(json,null,2)+'\n','utf8');}
console.log('MENU.FEEDBACK updated in en/ta/ur. Backups: '+backup);
