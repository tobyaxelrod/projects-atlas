import {env} from 'cloudflare:workers';
import seed from '../../../lib/seed.json';
import {validateProjects,changes} from '../../../lib/model';
export const dynamic='force-dynamic';
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
// Shared register: access is enforced by Sites' owner-only private policy.
// Service callers must pass dispatch authentication; no credentials in browser code.
async function read(){
 if(!env.DB)throw Error('Database unavailable');
 await env.DB.prepare('INSERT OR IGNORE INTO atlas_state(id,revision,payload) VALUES(?,0,?)').bind('atlas',JSON.stringify(seed)).run();
 return (await env.DB.prepare('SELECT revision,payload FROM atlas_state WHERE id=?').bind('atlas').first()) as {revision:number;payload:string};
}
export async function GET(){try{const row=await read();return json({...JSON.parse(row.payload),revision:row.revision});}catch{return json({error:'Storage unavailable. Please retry.'},503);}}
export async function POST(request:Request){
 const origin=request.headers.get('origin');if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')return json({error:'Origin rejected'},403);
 if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'JSON required'},415);
 try{
 const text=await request.text();if(text.length>1000000)return json({error:'Payload too large'},413);
 const input=JSON.parse(text);const projects=validateProjects(input.projects);if(!Number.isInteger(input.revision))return json({error:'Revision required'},400);
 const row=await read();if(row.revision!==input.revision)return json({error:'Changed on another device. Reload before saving.'},409);
 const old=JSON.parse(row.payload);if(old.projects.some((p:any)=>!projects.some(x=>x.id===p.id)))return json({error:'Archive projects instead of removing them'},400);
 const next={...old,projects,events:[...changes(old.projects,projects,new Date().toISOString()),...old.events].slice(0,1000)};
 const result=await env.DB!.prepare('UPDATE atlas_state SET payload=?,revision=revision+1 WHERE id=? AND revision=?').bind(JSON.stringify(next),'atlas',input.revision).run();
 if(!result.meta.changes)return json({error:'Changed on another device. Reload before saving.'},409);
 return json({...next,revision:row.revision+1});
 }catch(e){return json({error:e instanceof SyntaxError?'Invalid JSON':e instanceof Error?e.message:'Unable to save'},400);}
}
