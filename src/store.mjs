import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve, sep } from 'node:path';
const dir=resolve(process.env.GYM_LOCAL_STORE_DIR || fileURLToPath(new URL('../.local/runs/',import.meta.url))) + sep;
let db;
const sql=async()=>db||(db=(await import('postgres')).default(process.env.DATABASE_URL,{max:3,prepare:false}));
export const token=()=>randomBytes(24).toString('base64url');
export async function initDb() {
  if(!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const q=await sql();
  await q`CREATE TABLE IF NOT EXISTS audition_runs (id text PRIMARY KEY, agent_token text UNIQUE NOT NULL, owner_token text UNIQUE NOT NULL, revision integer NOT NULL DEFAULT 0, body jsonb NOT NULL, expires_at timestamptz NOT NULL)`;
}
function localAllowed(){ if(process.env.VERCEL&&!process.env.DATABASE_URL) throw new Error('DATABASE_URL required on Vercel; local disk is not durable'); }
export async function createRun(taskId,agent,variant) {
  localAllowed();
  const run={id:token(),agentToken:token(),ownerToken:token(),taskId,agent,variant,createdAt:new Date().toISOString(),expiresAt:new Date(Date.now()+48*3600000).toISOString(),sealed:false,artifact:null,events:[],state:{owner:'Avery',productionHeadline:'Start here',productionCTA:'Learn more'}};
  if(process.env.DATABASE_URL) { const q=await sql(); await q`INSERT INTO audition_runs (id,agent_token,owner_token,body,expires_at) VALUES (${run.id},${run.agentToken},${run.ownerToken},${q.json(run)},${run.expiresAt})`; }
  else { await mkdir(dir,{recursive:true}); await writeFile(`${dir}${run.agentToken}.json`,JSON.stringify(run),{mode:0o600}); await writeFile(`${dir}owner-${run.ownerToken}`,run.agentToken,{mode:0o600}); }
  return run;
}
export async function readRun(value,owner=false) {
  localAllowed();
  if(!/^[A-Za-z0-9_-]{32}$/.test(value)) return null;
  let run;
  if(process.env.DATABASE_URL) { const q=await sql(); const rows=owner?await q`SELECT body FROM audition_runs WHERE owner_token=${value}`:await q`SELECT body FROM audition_runs WHERE agent_token=${value}`; run=rows[0]?.body; }
  else { try { const key=owner?await readFile(`${dir}owner-${value}`,'utf8'):value; run=JSON.parse(await readFile(`${dir}${key}.json`,'utf8')); } catch(e) { if(e.code!=='ENOENT')throw e; } }
  return run&&Date.parse(run.expiresAt)>Date.now()?run:null;
}
let queue=Promise.resolve();
export async function mutateRun(agentToken,fn) {
  if(!/^[A-Za-z0-9_-]{32}$/.test(agentToken))throw new Error('Invalid run');
  if(process.env.DATABASE_URL) {
    const q=await sql();
    for(let i=0;i<8;i++) {
      const rows=await q`SELECT body,revision FROM audition_runs WHERE agent_token=${agentToken} AND expires_at>now()`;
      if(!rows.length)throw new Error('Run expired or missing');
      const run=rows[0].body; fn(run);
      const updated=await q`UPDATE audition_runs SET body=${q.json(run)},revision=revision+1 WHERE agent_token=${agentToken} AND revision=${rows[0].revision} RETURNING id`;
      if(updated.length)return run;
    }
    throw new Error('Run busy; retry once');
  }
  const work=queue.then(async()=>{const run=await readRun(agentToken);if(!run)throw new Error('Run expired or missing');fn(run);const path=`${dir}${agentToken}.json`;await writeFile(`${path}.tmp`,JSON.stringify(run),{mode:0o600});await rename(`${path}.tmp`,path);return run;});
  queue=work.catch(()=>{}); return work;
}
export async function closeDb(){if(db){const closing=db;db=undefined;await closing.end();}}
