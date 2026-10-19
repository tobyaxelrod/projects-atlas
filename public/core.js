export function needsAttention(p,today){return !p.hidden&&p.status!=='Archived'&&p.status!=='Done'&&(Boolean(p.attention)||p.priority==='High'||Boolean(p.deadline&&p.deadline<=today));}
export function familyOf(p,projects){let x=p;const seen=new Set();while(x.parent&&!seen.has(x.id)){seen.add(x.id);x=projects.find(y=>y.id===x.parent)||{...x,parent:''};}return x.id;}
export function legacyEdits(saved,baseline,current){
 const result=structuredClone(current),fields=['name','category','status','summary','next','detail','url','notes','focus'];let count=0;
 for(const p of saved){const old=baseline.find(x=>x.id===p.id),target=result.find(x=>x.id===p.id);if(!old){if(!target){result.push({...p,hidden:false,parent:'',priority:'Normal',attention:'',deadline:'',health:'Not checked',healthDetail:'Imported browser project.',checkedAt:'',observedAt:'',links:[],sources:[]});count++;}continue;}if(!target)continue;
 let changed=false;for(const f of fields){if(JSON.stringify(p[f])!==JSON.stringify(old[f])){target[f]=p[f];changed=true;}}if(changed)count++;
 }
 let focus=0;for(const p of result)if(p.focus&&p.status!=='Archived'&&++focus>2)p.focus=false;
 return {projects:result,count};
}
