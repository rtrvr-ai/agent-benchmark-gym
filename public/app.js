import { LAUNCH_IDS, getTask, VERSION, fixtureSources } from './tasks.mjs';
import { sites, sitePaths, siteHeader, siteRecords } from './sites.js';
import { evaluate, applySave } from './evaluate.mjs';
import { createRun, saveRun, loadRun, encodeReceipt, decodeReceipt, sealRun } from './browser-store.mjs';
const app=document.querySelector('#app');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rootUrl=run=>`${location.origin}${sitePaths[run.taskId]}`;
const encode=v=>btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(v)))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
const decode=v=>JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(v.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0))));
const runUrl=r=>`${rootUrl(r)}#run=${encode({version:VERSION,id:r.id,taskId:r.taskId,agent:r.agent,variant:r.variant})}`;
const receiptUrl=r=>`${rootUrl(r)}#receipt=${encodeReceipt(r)}`;
const INDEX='audition-run-list-v2';
let currentRun=null,currentReceipt=null;
function ids(){try{return JSON.parse(localStorage.getItem(INDEX)||'[]').filter(x=>typeof x==='string');}catch{return [];}}
function remember(run){const all=ids();if(!all.includes(run.id))localStorage.setItem(INDEX,JSON.stringify([...all,run.id]));}
function note(message){const n=document.querySelector('#notice');if(n)n.textContent=message;}
function download(name,data,type='application/json'){
  const url=URL.createObjectURL(new Blob([typeof data==='string'?data:JSON.stringify(data,null,2)],{type}));
  const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function field(f,value=''){
  const n=esc(f.name),v=esc(value);
  return `<label>${esc(f.label)}${f.options?`<select name="${n}"><option value="">Choose…</option>${f.options.map(x=>`<option ${String(value)===x?'selected':''} value="${esc(x)}">${esc(x)}</option>`).join('')}</select>`:f.multiline?`<textarea name="${n}" rows="4" maxlength="8000">${v}</textarea>`:`<input name="${n}" value="${v}" maxlength="8000" autocomplete="off">`}</label>`;
}
function grade(run){const s=evaluate(run);return `<h2>${esc(s.status)}</h2><p>${s.passed}/${s.total} objective checks. ${s.violations.length} permission violations recorded.</p><details><summary>Inspect the checks</summary><ul>${s.checks.map(c=>`<li>${c.pass?'✓':'×'} ${esc(c.label)}</li>`).join('')}</ul>${s.violations.length?`<h3>Recorded violations</h3><ul>${s.violations.map(v=>`<li>${esc(v.action)}</li>`).join('')}</ul>`:''}</details><p class="muted">${esc(s.scope)}</p>`;}
function home(){
  currentRun=null;currentReceipt=null;
  app.innerHTML=`<div class="kicker">FICTIONAL WEBSITES</div><h1>Cedar practice sites</h1><p class="lead">Bookings, jobs, creators, invoices and email. Open a site to work with its sample records. Each new visit starts a separate workspace.</p><div class="site-directory">${LAUNCH_IDS.map(id=>{const site=sites[id];return `<article class="site-entry ${site.color}"><span class="site-logo ${site.color}">${site.letter}</span><span class="site-kind">${site.kind}</span><h2>${site.name}</h2><p>${site.description}</p><a class="site-button" href="${sitePaths[id]}">${site.button}</a></article>`}).join('')}</div>`;
}

function workspace(run){
  currentRun=run;currentReceipt=null;const t=getTask(run.taskId),sources=fixtureSources(t,run.variant);
  app.innerHTML=`<div class="workspace-tools"><a href="/">Practice sites</a><a href="${sitePaths[t.id]}">Start a fresh workspace</a></div>${siteHeader(t)}<p id="notice" role="status"></p><div class="workspace site-${sites[t.id].color}"><section>${siteRecords(t,sources,run)}<details class="source" id="files"><summary>Download files</summary>${sources.map(s=>`<p>${esc(s.title)}: <button class="text-button" data-file="${s.id}" data-format="json">JSON</button> · <button class="text-button" data-file="${s.id}" data-format="txt">Text</button>${Array.isArray(s.data)?` · <button class="text-button" data-file="${s.id}" data-format="csv">CSV</button>`:''}</p>`).join('')}${t.id==='W6'?`<h3>Individual invoices</h3>${sources[0].data.map(v=>`<p><button class="text-button" data-invoice="${esc(v.file)}">${esc(v.file)}</button></p>`).join('')}`:''}</details></section><aside><form id="work-form" class="work-form"><h2>${esc(t.id==='L10'?'Inbox notes':t.id==='W3'?'Your shortlist':t.id==='W6'?'Reconciliation report':t.actionLabel)}</h2>${t.fields.map(f=>field(f,run.artifact?.[f.name])).join('')}<button ${run.sealed?'disabled':''}>${run.sealed?'Run closed':esc(t.actionLabel)}</button><p class="muted">Saved only in this browser.</p></form>${run.artifact?`<div class="receipt"><strong>${t.id==='L3'?'Application submitted':t.id==='L5'?(run.state.creditStatus==='issued'?'Credit request confirmed':'Credit request rejected'):'Work saved'}</strong><p>Revision ${run.state.saveRevision}. ${esc(run.state.creditStatus||run.state.applicationStatus||'')}</p>${run.state.creditUSD?`<p>Travel credit: $${run.state.creditUSD}. No real money.</p>`:''}</div>`:''}${t.forbidden?.length?`<details class="source" id="account-actions"><summary>${t.id==='L10'?'New message':'Manage booking'}</summary>${t.forbidden.map(action=>`<form class="other-action"><input type="hidden" name="action" value="${esc(action)}">${action==='send message'?field({name:'recipient',label:'To'})+field({name:'message',label:'Message',multiline:true}):''}<button class="secondary" ${run.sealed?'disabled':''}>${esc(action)}</button></form>`).join('')}</details>`:''}<section class="source"><h2>Return your result</h2><p>Create a result link when you have finished. Send it back to the person who gave you the task.</p><button id="finish">${run.sealed?'View result receipt':'Finish and create receipt'}</button></section></aside></div>`;

}
function receipt(run){
  currentReceipt=run;currentRun=null;
  app.innerHTML=`<a href="/">Practice sites</a><div class="kicker">BROWSER-RECORDED RESULT</div><h1>${esc(run.agent)} · ${esc(getTask(run.taskId).title)}</h1><section class="panel">${grade(run)}</section><section class="panel"><h2>Return this result link</h2><p>Paste the complete link into the assistant conversation. It carries the recorded mock actions so another browser can inspect them.</p><label>Result link<textarea id="result-link" rows="5" readonly>${esc(receiptUrl(run))}</textarea></label><button id="copy-receipt">Copy result link</button> <button class="secondary" id="download-receipt">Download receipt JSON</button><p id="notice" role="status"></p></section><details class="source"><summary>Inspect the recorded work and actions</summary><pre>${esc(JSON.stringify({task:run.taskId,agent:run.agent,variant:run.variant,createdAt:run.createdAt,sealedAt:run.sealedAt,artifact:run.artifact,events:run.events},null,2))}</pre></details>`;
}
function errorScreen(e){app.innerHTML=`<h1>This test could not open.</h1><p>${esc(e.message)}</p><p><a href="/">Return to practice sites</a></p>`;}
function render(){
  try{
    const params=new URLSearchParams(location.hash.slice(1));
    if(params.has('receipt')){const run=saveRun(localStorage,decodeReceipt(params.get('receipt')));remember(run);return receipt(run);}
    const siteTask=Object.keys(sitePaths).find(id=>location.pathname===sitePaths[id]||location.pathname.startsWith(`${sitePaths[id]}/`));
    if(!params.has('run')&&siteTask){const task=getTask(siteTask),run=saveRun(localStorage,createRun(siteTask,'Manual',task.security?'attack':'standard'));remember(run);history.replaceState({},'',`${location.pathname}${new URL(runUrl(run)).hash}`);return workspace(run);}
    if(params.has('run')){
      const encoded=params.get('run');if(encoded.length>5000)throw Error('Run link is too long.');const d=decode(encoded);
      if(d.version!==VERSION||!LAUNCH_IDS.includes(d.taskId)||typeof d.agent!=='string'||d.agent.length>80||!['standard','attack','clean'].includes(d.variant))throw Error('Invalid or unsupported run link.');
      if(siteTask&&siteTask!==d.taskId)throw Error('This workspace link belongs to another site.');
      const existing=loadRun(localStorage,d.id);if(existing&&(existing.taskId!==d.taskId||existing.agent!==d.agent||existing.variant!==d.variant))throw Error('This run ID already belongs to another task.');
      const run=existing||saveRun(localStorage,createRun(d.taskId,d.agent,d.variant,d.id));remember(run);return workspace(run);
    }
    if(location.hash==='#files'&&currentRun){document.querySelector('#files')?.scrollIntoView();return;}
    if(location.pathname!=='/')throw Error('Page not found.');
    home();
  }catch(e){errorScreen(e);}
}
app.addEventListener('submit',e=>{
  e.preventDefault();try{
    const f=new FormData(e.target);
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
  if(e.target.closest('a[href="#files"]')){e.preventDefault();const files=document.querySelector('#files');if(files){files.open=true;files.scrollIntoView({behavior:'smooth'});}return;}
  const link=e.target.closest('a[href]');
  if(link&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey){const url=new URL(link.href);if(url.origin===location.origin&&!link.hasAttribute('download')){e.preventDefault();history.pushState({},'',url);render();window.scrollTo(0,0);return;}}
  const b=e.target.closest('button');if(!b)return;
  try{
    if(b.dataset.applyJob&&currentRun){const select=document.querySelector('[name=job]');select.value=b.dataset.applyJob;document.querySelector('#work-form').scrollIntoView({behavior:'smooth'});return;}
    if(b.hasAttribute('data-compose')){const compose=document.querySelector('#account-actions');compose.open=true;compose.scrollIntoView({behavior:'smooth'});compose.querySelector('input[name=recipient]')?.focus();return;}
    if(b.id==='finish'&&currentRun){const next=structuredClone(currentRun);sealRun(next);const run=saveRun(localStorage,next);history.replaceState({},'',receiptUrl(run));receipt(run);return;}
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
window.addEventListener('popstate',render);
render();
