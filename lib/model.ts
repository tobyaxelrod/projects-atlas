export const categories=['Property','Markets','Systems','Ventures','Creative','Family','Learning','Personal'];
export const statuses=['In progress','Needs review','Idea','Backlog','Done','Archived'];
export type Project={id:string;name:string;category:string;status:string;date:string;summary:string;next:string;detail:string;url:string;notes:string;focus:boolean;hidden:boolean;parent:string;priority:string;attention:string;deadline:string;health:string;healthDetail:string;checkedAt:string;observedAt:string;links:{label:string;url:string}[];sources:{label:string;url:string;date:string}[]};
export type Event={id:string;at:string;projectId:string;name:string;message:string;url:string};
export function validateProjects(input:unknown):Project[]{
 if(!Array.isArray(input)||input.length>500)throw Error('Invalid project list');
 const ids=new Set<string>();
 for(const p of input){
  if(!p||typeof p!=='object'||typeof p.id!=='string'||!p.id||p.id.length>100||ids.has(p.id))throw Error('Invalid or duplicate ID');ids.add(p.id);
  for(const f of ['name','category','status','date','summary','next','detail','url','notes','parent','priority','attention','deadline','health','healthDetail','checkedAt','observedAt'])if(typeof p[f]!=='string'||p[f].length>12000)throw Error('Invalid field: '+f);
  if(!p.name.trim()||!categories.includes(p.category)||!statuses.includes(p.status)||typeof p.focus!=='boolean'||typeof p.hidden!=='boolean')throw Error('Invalid project');
  if(!['Low','Normal','High'].includes(p.priority)||!['','Decision','Blocked','Follow-up'].includes(p.attention))throw Error('Invalid priority or attention');
  if(!['Not checked','Not applicable','Published','Run failed','Checks passed','Run skipped','Needs review'].includes(p.health))throw Error('Invalid health');
  for(const f of ['date','deadline'])if(p[f]&&!/^\d{4}-\d{2}-\d{2}$/.test(p[f]))throw Error('Invalid date');
  for(const f of ['links','sources']){if(!Array.isArray(p[f])||p[f].length>20)throw Error('Too many links');for(const l of p[f]){if(typeof l.label!=='string'||l.label.length>500||typeof l.url!=='string')throw Error('Invalid link');if(l.url&&!/^https?:\/\//.test(l.url))throw Error('Use HTTP(S) links');}}
  if(p.url&&!/^https?:\/\//.test(p.url))throw Error('Use HTTP(S) links');
 }
 if(input.filter(p=>p.focus&&p.status!=='Archived').length>2)throw Error('Choose at most two focus projects');
 for(const p of input){let parent=p.parent;const seen=new Set([p.id]);while(parent){if(seen.has(parent)||!ids.has(parent))throw Error('Invalid project relationship');seen.add(parent);parent=input.find(x=>x.id===parent).parent;}}
 return input;
}
export function changes(before:Project[],after:Project[],at:string):Event[]{
 return after.flatMap(p=>{const prev=before.find(x=>x.id===p.id);if(prev&&JSON.stringify(prev)===JSON.stringify(p))return [];
 const fields=prev?Object.keys(p).filter(k=>JSON.stringify((p as any)[k])!==JSON.stringify((prev as any)[k])):[];
 return [{id:crypto.randomUUID(),at,projectId:p.id,name:p.name,message:prev?'Updated '+fields.join(', '):'Added project',url:p.url||p.links[0]?.url||''}];});
}
