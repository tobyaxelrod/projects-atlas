import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {DatabaseSync} from 'node:sqlite';
import {needsAttention,familyOf,legacyEdits} from '../public/core.js';
const seed=JSON.parse(fs.readFileSync('lib/seed.json'));
const model=await import('data:text/javascript;base64,'+Buffer.from(ts.transpile(fs.readFileSync('lib/model.ts','utf8'),{module:ts.ModuleKind.ESNext})).toString('base64'));
let storedSeed=structuredClone(seed);
if(!storedSeed.projects.length){storedSeed.projects=[{id:'example',name:'Example',category:'Systems',status:'In progress',date:'2026-10-19',summary:'',next:'',detail:'',url:'',notes:'',focus:false,hidden:false,parent:'',priority:'Normal',attention:'',deadline:'',health:'Not checked',healthDetail:'',checkedAt:'',observedAt:'',links:[],sources:[]}];}
const sql=new DatabaseSync(':memory:');sql.exec(fs.readFileSync('drizzle/0000_messy_mockingbird.sql','utf8'));
globalThis.__env={DB:{prepare(query){return {bind(...args){const stmt=sql.prepare(query);return {async run(){const r=stmt.run(...args);return {meta:{changes:r.changes}}},async first(){return stmt.get(...args)}}}}}}};
globalThis.__seed=storedSeed;globalThis.__model=model;
let code=fs.readFileSync('app/api/state/route.ts','utf8').replace("import {env} from 'cloudflare:workers';",'const env=globalThis.__env;').replace("import seed from '../../../lib/seed.json';",'const seed=globalThis.__seed;').replace("import {validateProjects,changes} from '../../../lib/model';",'const {validateProjects,changes}=globalThis.__model;');
const api=await import('data:text/javascript;base64,'+Buffer.from(ts.transpile(code,{module:ts.ModuleKind.ESNext})).toString('base64'));
const post=(body,origin='https://atlas.test')=>api.POST(new Request('https://atlas.test/api/state',{method:'POST',headers:{'Content-Type':'application/json','Origin':origin},body:JSON.stringify(body)}));
test('save persists notes and hidden state, emits activity, rejects stale devices',async()=>{
 const first=await (await api.GET()).json();const next=structuredClone(first.projects);next[0].notes='Keep this note across devices';next[0].hidden=true;next[0].focus=false;
 const saved=await post({projects:next,revision:first.revision});assert.equal(saved.status,200);
 const second=await (await api.GET()).json();assert.equal(second.projects[0].hidden,true);assert.equal(second.projects[0].notes,next[0].notes);assert.equal(second.revision,first.revision+1);assert.match(second.events[0].message,/hidden/);
 assert.equal((await post({projects:first.projects,revision:first.revision})).status,409);
 assert.equal((await post({projects:next,revision:second.revision},'https://evil.test')).status,403);
});
test('validation prevents cyclic relationships, unsafe links and excessive focus',()=>{
 assert.doesNotThrow(()=>model.validateProjects(storedSeed.projects));
 let ps=structuredClone(storedSeed.projects);ps[0].parent=ps[0].id;assert.throws(()=>model.validateProjects(ps));
 ps=structuredClone(storedSeed.projects);ps[0].url='javascript:alert(1)';assert.throws(()=>model.validateProjects(ps));
 ps=Array.from({length:3},(_,i)=>({...storedSeed.projects[0],id:'x'+i,parent:'',focus:true}));assert.throws(()=>model.validateProjects(ps));
});
test('hidden cards leave attention queue; families and legacy edits preserve current evidence',()=>{
 const p={...storedSeed.projects[0],hidden:true,attention:'Blocked',status:'In progress'};assert.equal(needsAttention(p,'2026-10-19'),false);
 const old=[{id:'a',notes:'',next:'Old',focus:false}],saved=[{...old[0],notes:'My note'}],current=[{...old[0],next:'Verified new action',hidden:false}];
 const m=legacyEdits(saved,old,current);assert.equal(m.projects[0].notes,'My note');assert.equal(m.projects[0].next,'Verified new action');
 assert.equal(familyOf({id:'b',parent:'a'},[{id:'a',parent:''}]),'a');
});
test('UI renders main, hidden, activity and audit views without exceptions',()=>{
 const elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,{value:'',innerHTML:'',textContent:'',hidden:false,style:{},classList:{toggle(){},add(){},remove(){}},addEventListener(){},showModal(){this.open=true},close(){this.open=false}});return elements.get(id)};
 const context={document:{querySelector:el,addEventListener(){}},window:{addEventListener(){}},localStorage:{getItem(){return null}},setInterval(){},setTimeout(){},clearTimeout(){},console,structuredClone,URL,Date,Intl,crypto,needsAttention,familyOf,legacyEdits};
 vm.createContext(context);const script=fs.readFileSync('public/app.js','utf8').replace(/^import .*\n/,'').replace(/;sync\(\);\s*$/,';');vm.runInContext(script,context);
 context.fixture=structuredClone(storedSeed);context.fixture.projects[0].hidden=true;vm.runInContext("state={...fixture,revision:0};render();",context);assert.ok(!el('#grid').innerHTML.includes('data-hide="'+storedSeed.projects[0].id+'"'));
 vm.runInContext("view='Hidden';render();",context);assert.match(el('#grid').innerHTML,/Restore/);
 vm.runInContext("view='Recent changes';render();view='Coverage audit';render();",context);assert.ok(el('#audit').innerHTML.includes('Coverage')||el('#audit').innerHTML.includes('Last audit'));
});
