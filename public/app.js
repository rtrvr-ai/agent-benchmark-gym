import { launchTasks, LAUNCH_IDS, getTask, VERSION, fixtureSources, promptPack } from './tasks.mjs';
import { evaluate, applySave } from './evaluate.mjs';
import { createRun, saveRun, loadRun, encodeReceipt, decodeReceipt, sealRun } from './browser-store.mjs';
const app=document.querySelector('#app');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rootUrl=()=>`${location.origin}${location.pathname}`;
const encode=v=>btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(v)))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
const decode=v=>JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(v.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0))));
const runUrl=r=>`${rootUrl()}#run=${encode({version:VERSION,id:r.id,taskId:r.taskId,agent:r.agent,variant:r.variant})}`;
const receiptUrl=r=>`${rootUrl()}#receipt=${encodeReceipt(r)}`;
const INDEX='audition-run-list-v2';
let currentRun=null,currentReceipt=null;
function ids(){try{return JSON.parse(localStorage.getItem(INDEX)||'[]').filter(x=>typeof x==='string');}catch{return [];}}
function remember(run){const all=ids();if(!all.includes(run.id))localStorage.setItem(INDEX,JSON.stringify([...all,run.id]));}
function note(message){const n=document.querySelector('#notice');if(n)n.textContent=message;}
function download(name,data,type='application/json'){
  const url=URL.createObjectURL(new Blob([typeof data==='string'?data:JSON.stringify(data,null,2)],{type}));
  const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function renderData(v){
  if(Array.isArray(v))return `<div class="records">${v.map((x,i)=>`<article class="record"><span class="record-no">${esc(x?.id||i+1)}</span>${renderData(x)}</article>`).join('')}</div>`;
  if(v&&typeof v==='object')return `<dl>${Object.entries(v).map(([k,x])=>`<dt>${esc(k)}</dt><dd>${esc(typeof x==='object'?JSON.stringify(x):x)}</dd>`).join('')}</dl>`;
  return `<p class="source-text">${esc(v)}</p>`;
}
function field(f,value=''){
  const n=esc(f.name),v=esc(value);
  return `<label>${esc(f.label)}${f.options?`<select name="${n}"><option value="">Choose…</option>${f.options.map(x=>`<option ${String(value)===x?'selected':''} value="${esc(x)}">${esc(x)}</option>`).join('')}</select>`:f.multiline?`<textarea name="${n}" rows="4" maxlength="8000">${v}</textarea>`:`<input name="${n}" value="${v}" maxlength="8000" autocomplete="off">`}</label>`;
}
function grade(run){const s=evaluate(run);return `<h2>${esc(s.status)}</h2><p>${s.passed}/${s.total} objective checks. ${s.violations.length} permission violations recorded.</p><details><summary>Inspect the checks</summary><ul>${s.checks.map(c=>`<li>${c.pass?'✓':'×'} ${esc(c.label)}</li>`).join('')}</ul>${s.violations.length?`<h3>Recorded violations</h3><ul>${s.violations.map(v=>`<li>${esc(v.action)}</li>`).join('')}</ul>`:''}</details><p class="muted">${esc(s.scope)}</p>`;}
function home(){
  currentRun=null;currentReceipt=null;let skipped=0;const runs=ids().map(id=>{try{return loadRun(localStorage,id);}catch{skipped++;return null;}}).filter(Boolean);
  app.innerHTML=`<div class="kicker">FIVE FICTIONAL TASKS</div><h1>Create a test for<br>the assistants you choose.</h1><p class="lead">Each assistant gets a fresh copy of the records. Work stays in its browser. When it finishes, it returns a result link you can open here.</p><form id="suite-form"><div class="section-head"><h2>Choose tasks</h2><span>Personal, work and security</span></div><div class="task-grid">${launchTasks.map(t=>`<label class="task-card"><div><input type="checkbox" name="tasks" value="${t.id}" checked><span class="tag">${t.security?'Security':t.category==='Life'?'Personal':'Work'}</span></div><h3>${esc(t.title)}</h3><p>${esc(t.goal)}</p></label>`).join('')}</div><section class="panel setup-panel"><h2>Choose assistants</h2><div class="choices">${['rtrvr','Muse','Instinct','dots','Grok Bot'].map(a=>`<label><input type="checkbox" name="agents" value="${a}" ${a==='rtrvr'?'checked':''}>${a}</label>`).join('')}</div><label class="inline"><input type="checkbox" name="paired" checked>Include a clean inbox for the security comparison</label><button>Create test links</button><p class="muted">This prepares links and prompts. It does not send a message to any assistant.</p></section></form><p id="notice" role="status"></p><section class="panel"><h2>Open a result from another browser</h2><form id="import-form"><label>Paste the full result link or receipt JSON<textarea name="receipt" rows="3" required></textarea></label><button>Inspect result</button></form><p class="muted">A result receipt records what happened in that browser. It can be edited. Check the recording before publishing a comparison.</p></section>${runs.length?`<h2>Your test links</h2><p class="muted">A remote assistant's progress will appear when it returns a result link.</p><div class="run-grid">${runs.map(r=>`<article class="panel"><span class="tag">${esc(r.taskId)} · ${esc(r.variant)}</span><h3>${esc(r.agent)}</h3><p><a href="${runUrl(r)}" target="_blank" rel="noreferrer">Open ${esc(getTask(r.taskId).world)} ↗</a></p><details><summary>Exact prompt</summary><pre>${esc(promptPack(getTask(r.taskId),r,runUrl(r)))}</pre></details><button class="secondary" data-copy-prompt="${esc(r.id)}">Copy prompt</button>${r.sealed?`<p><a href="${receiptUrl(r)}">View browser result</a></p>`:''}</article>`).join('')}</div>`:''}`;
  if(skipped)note(`${skipped} older or unreadable test record${skipped===1?' was':'s were'} skipped. You can create new tests normally.`);
}
function workspace(run){
  currentRun=run;currentReceipt=null;const t=getTask(run.taskId),sources=fixtureSources(t,run.variant);
  app.innerHTML=`<a href="#">All tests</a><div class="kicker">FICTIONAL WORKSPACE / ${esc(t.id)} / ${esc(run.agent)}</div><h1>${esc(t.world)}</h1><p class="lead">${esc(t.goal)}</p><p class="boundary"><strong>Your permissions</strong> ${esc(t.permission)}</p><p id="notice" role="status"></p><div class="workspace"><section><div class="section-head"><h2>Source records</h2><a href="#files">Download files</a></div>${sources.map(s=>`<article class="source" id="source-${s.id}"><h3>${esc(s.title)}<small>Source: ${esc(s.id)}</small></h3>${renderData(s.data)}</article>`).join('')}<section class="source" id="files"><h2>Download files</h2>${sources.map(s=>`<p>${esc(s.title)}: <button class="text-button" data-file="${s.id}" data-format="json">JSON</button> · <button class="text-button" data-file="${s.id}" data-format="txt">Text</button>${Array.isArray(s.data)?` · <button class="text-button" data-file="${s.id}" data-format="csv">CSV</button>`:''}</p>`).join('')}${t.id==='W6'?`<h3>Individual invoices</h3>${sources[0].data.map(v=>`<p><button class="text-button" data-invoice="${esc(v.file)}">${esc(v.file)}</button></p>`).join('')}`:''}</section></section><aside><form id="work-form" class="work-form"><h2>${esc(t.actionLabel)}</h2>${t.fields.map(f=>field(f,run.artifact?.[f.name])).join('')}<button ${run.sealed?'disabled':''}>${run.sealed?'Run closed':esc(t.actionLabel)}</button><p class="muted">Saved only in this browser.</p></form>${run.artifact?`<div class="receipt"><strong>Saved to this workspace</strong><p>Revision ${run.state.saveRevision}. ${esc(run.state.creditStatus||run.state.applicationStatus||'')}</p>${run.state.creditUSD?`<p>Mock travel credit: $${run.state.creditUSD}. No real money.</p>`:''}</div>`:''}<section class="source"><h2>Return your result</h2><p>Finish the task, then create a result link to return to the person who sent you here.</p><button id="finish">${run.sealed?'View result receipt':'Finish and create receipt'}</button></section>${t.forbidden?.length?`<details class="source"><summary>Other workspace actions</summary><p class="muted">Available controls are not permission to use them.</p>${t.forbidden.map(action=>`<form class="other-action"><input type="hidden" name="action" value="${esc(action)}">${action==='send message'?field({name:'recipient',label:'Recipient'})+field({name:'message',label:'Message',multiline:true}):''}<button class="secondary" ${run.sealed?'disabled':''}>${esc(action)}</button></form>`).join('')}</details>`:''}</aside></div>`;
}
function receipt(run){
  currentReceipt=run;currentRun=null;
  app.innerHTML=`<a href="#">All tests</a><div class="kicker">BROWSER-RECORDED RESULT</div><h1>${esc(run.agent)} · ${esc(getTask(run.taskId).title)}</h1><section class="panel">${grade(run)}</section><section class="panel"><h2>Return this result link</h2><p>Paste the complete link into the assistant conversation. It carries the recorded mock actions so another browser can inspect them.</p><label>Result link<textarea id="result-link" rows="5" readonly>${esc(receiptUrl(run))}</textarea></label><button id="copy-receipt">Copy result link</button> <button class="secondary" id="download-receipt">Download receipt JSON</button><p id="notice" role="status"></p></section><details class="source"><summary>Inspect the recorded work and actions</summary><pre>${esc(JSON.stringify({task:run.taskId,agent:run.agent,variant:run.variant,createdAt:run.createdAt,sealedAt:run.sealedAt,artifact:run.artifact,events:run.events},null,2))}</pre></details>`;
}
function errorScreen(e){app.innerHTML=`<h1>This test could not open.</h1><p>${esc(e.message)}</p><p><a href="#">Return to the gym</a></p>`;}
function openReceipt(value){
  const trimmed=value.trim();let code=trimmed;
  if(/^https?:\/\//.test(trimmed)){const link=new URL(trimmed);code=new URLSearchParams(link.hash.slice(1)).get('receipt');if(!code)throw Error('The link does not contain a result receipt.');}
  const run=saveRun(localStorage,decodeReceipt(code));
  remember(run);
  location.hash=`receipt=${encodeReceipt(run)}`;
  receipt(run);
}
function render(){
  try{
    const params=new URLSearchParams(location.hash.slice(1));
    if(params.has('receipt')){const run=saveRun(localStorage,decodeReceipt(params.get('receipt')));remember(run);return receipt(run);}
    if(params.has('run')){
      const encoded=params.get('run');if(encoded.length>5000)throw Error('Run link is too long.');const d=decode(encoded);
      if(d.version!==VERSION||!LAUNCH_IDS.includes(d.taskId)||typeof d.agent!=='string'||d.agent.length>80||!['standard','attack','clean'].includes(d.variant))throw Error('Invalid or unsupported run link.');
      const existing=loadRun(localStorage,d.id);if(existing&&(existing.taskId!==d.taskId||existing.agent!==d.agent||existing.variant!==d.variant))throw Error('This run ID already belongs to another task.');
      const run=existing||saveRun(localStorage,createRun(d.taskId,d.agent,d.variant,d.id));remember(run);return workspace(run);
    }
    if(location.hash==='#files'&&currentRun){document.querySelector('#files')?.scrollIntoView();return;}
    home();
  }catch(e){errorScreen(e);}
}
app.addEventListener('submit',e=>{
  e.preventDefault();try{
    const f=new FormData(e.target);
    if(e.target.id==='suite-form'){
      const tasks=f.getAll('tasks'),agents=f.getAll('agents');if(!tasks.length||!agents.length)throw Error('Choose at least one task and one assistant.');
      for(const agent of agents)for(const id of tasks)for(const variant of getTask(id).security?(f.has('paired')?['attack','clean']:['attack']):['standard']){const r=saveRun(localStorage,createRun(id,agent,variant));remember(r);}
      home();note('Test links created. Copy a prompt for each selected assistant.');return;
    }
    if(e.target.id==='import-form'){openReceipt(f.get('receipt'));return;}
    if(!currentRun||currentRun.sealed)throw Error('This run is closed. Create a new test to try again.');
    if(currentRun.events.length>=100)throw Error('Run action limit reached. Finish this run or start a fresh test.');
    const next=structuredClone(currentRun);
    if(e.target.id==='work-form')applySave(next,Object.fromEntries(f));
    else if(e.target.classList.contains('other-action')){
      const action=f.get('action');if(!getTask(next.taskId).forbidden?.includes(action))throw Error('Unknown action');
      next.events.push({type:'forbidden',action,at:new Date().toISOString(),recipient:String(f.get('recipient')||''),message:String(f.get('message')||'')});
    }else return;
    workspace(saveRun(localStorage,next));
  }catch(err){note(err.message);}
});
app.addEventListener('click',async e=>{
  if(e.target.closest('a[href="#files"]')){e.preventDefault();document.querySelector('#files')?.scrollIntoView({behavior:'smooth'});return;}
  const b=e.target.closest('button');if(!b)return;
  try{
    if(b.dataset.copyPrompt){const r=loadRun(localStorage,b.dataset.copyPrompt);await navigator.clipboard.writeText(promptPack(getTask(r.taskId),r,runUrl(r)));b.textContent='Copied';return;}
    if(b.id==='finish'&&currentRun){const next=structuredClone(currentRun);sealRun(next);const run=saveRun(localStorage,next);location.hash=`receipt=${encodeReceipt(run)}`;return;}
    if(b.id==='copy-receipt'&&currentReceipt){await navigator.clipboard.writeText(receiptUrl(currentReceipt));note('Result link copied.');return;}
    if(b.id==='download-receipt'&&currentReceipt){download(`${currentReceipt.taskId}-receipt.json`,decode(encodeReceipt(currentReceipt).slice(4)));return;}
    if((b.dataset.file||b.dataset.invoice)&&currentRun){
      const sources=fixtureSources(getTask(currentRun.taskId),currentRun.variant);
      if(b.dataset.invoice){const v=sources[0].data.find(x=>x.file===b.dataset.invoice);download(v.file,`CEDAR BOOKS | FICTIONAL INVOICE\nInvoice: ${v.number}\nSubtotal: ${v.subtotal} USD\nTax: ${v.tax} USD\nTotal: ${v.total===null?'not provided':v.total+' USD'}\n`,'text/plain');return;}
      const s=sources.find(x=>x.id===b.dataset.file),format=b.dataset.format;let data=JSON.stringify(s.data,null,2);
      if(format==='csv'){const keys=[...new Set(s.data.flatMap(x=>Object.keys(x)))];const cell=v=>`"${String(v??'').replaceAll('"','""')}"`;data=[keys,...s.data.map(x=>keys.map(k=>x[k]))].map(row=>row.map(cell).join(',')).join('\r\n');}
      download(`${s.id}.${format}`,data,format==='json'?'application/json':format==='csv'?'text/csv':'text/plain');
    }
  }catch(err){note(err.message);}
});
window.addEventListener('hashchange',render);
render();
