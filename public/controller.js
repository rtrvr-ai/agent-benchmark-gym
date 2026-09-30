import { pingExtension } from './bridge.js';
const results=document.querySelector('#results');
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let runs=[];try{runs=JSON.parse(sessionStorage.getItem('audition-runs')||'[]');}catch{}
function draw(){results.innerHTML=runs.length?`<div class="section-head"><h2>Your isolated workspaces</h2><span>${runs.length} runs · no shared state</span></div><div class="run-grid">${runs.map((r,i)=>`<article class="panel"><span class="tag">${escape(r.taskId)} · ${escape(r.variant)}</span><h3>${escape(r.agent)}</h3><p><a href="${escape(r.workspace)}" target="_blank" rel="noreferrer">Open fictional workspace ↗</a></p><details><summary>Exact candidate prompt</summary><pre>${escape(r.prompt)}</pre></details><div class="actions"><button class="secondary" data-copy="${i}">Copy prompt</button><button class="secondary" data-status="${i}">Check saved work</button><button data-seal="${i}">Close and score</button></div><div id="score-${i}" class="score"></div></article>`).join('')}</div><p class="muted">Closing freezes a run. The score covers gym actions; review the conversation separately for unsupported claims or disclosures. Never give an agent this controller tab.</p>`:'';}
draw();
document.querySelector('#suite-form').addEventListener('submit',async e=>{
  e.preventDefault();const b=e.submitter;b.disabled=true;
  try{
    const f=new FormData(e.target),response=await fetch('/api/suites',{method:'POST',headers:{'Content-Type':'application/json','x-operator-key':document.querySelector('#operator-key').value||'local-development'},body:JSON.stringify({tasks:f.getAll('tasks'),agents:f.getAll('agents'),paired:f.has('paired')})});
    if(!response.ok)throw new Error(`Could not create runs (${response.status}). Check the operator key and task selection.`);
    const data=await response.json();runs=[...runs,...data.runs];sessionStorage.setItem('audition-runs',JSON.stringify(runs));draw();results.scrollIntoView({behavior:'smooth'});
  }catch(err){results.textContent=err.message;}finally{b.disabled=false;}
});
results.addEventListener('click',async e=>{
  const button=e.target.closest('button');if(!button)return;
  const index=button.dataset.copy??button.dataset.seal??button.dataset.status,r=runs[index];if(!r)return;
  button.disabled=true;
  try{
    if(button.dataset.copy!==undefined){await navigator.clipboard.writeText(r.prompt);button.textContent='Copied';return;}
    const seal=button.dataset.seal!==undefined,response=await fetch(`/api/runs/${r.ownerToken}${seal?'/seal':''}`,{method:seal?'POST':'GET'});
    if(!response.ok)throw new Error(`Run unavailable (${response.status})`);
    const data=await response.json(),target=document.querySelector(`#score-${index}`);
    target.innerHTML=data.score?`<h3>${escape(data.score.status)}</h3><p>${data.score.passed}/${data.score.total} objective checks. ${escape(data.score.safety)}.</p>${data.score.review.length?`<p>Human review: ${escape(data.score.review.join(' '))}</p>`:''}<details><summary>Inspect checks</summary><ul>${data.score.checks.map(c=>`<li>${c.pass?'✓':'×'} ${escape(c.label)}</li>`).join('')}</ul></details><p class="muted">${escape(data.score.scope)}</p>`:`<p>${data.run.events.filter(x=>x.type==='save').length} saves. ${data.run.events.filter(x=>x.type==='forbidden').length} prohibited actions recorded. Not scored yet.</p>`;
  }catch(err){document.querySelector(`#score-${index}`).textContent=err.message;}finally{button.disabled=false;}
});
document.querySelector('#check-extension').addEventListener('click',async()=>{const reply=await pingExtension();document.querySelector('#extension-status').textContent=reply.ok?`Extension found${reply.clientVersion?` (${reply.clientVersion})`:''}. Competitor adapters have not been calibrated in this prototype.`:reply.error||'Extension unavailable.';});
