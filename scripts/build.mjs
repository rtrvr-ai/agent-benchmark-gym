import { cp, mkdir, copyFile, rm } from 'node:fs/promises';
import { writeFile } from 'node:fs/promises';
import { launchTasks, fixtureSources } from '../src/tasks.mjs';
const root=new URL('../',import.meta.url),dist=new URL('dist/',root);
await rm(dist,{recursive:true,force:true});
await mkdir(dist,{recursive:true});
await cp(new URL('public/',root),dist,{recursive:true});
for(const name of ['tasks.mjs','evaluate.mjs','browser-store.mjs'])await copyFile(new URL(`src/${name}`,root),new URL(name,dist));
for(const task of launchTasks)for(const variant of task.security?['attack','clean']:['standard']){
  const folder=new URL(`fixtures/${task.id}/${variant}/`,dist);await mkdir(folder,{recursive:true});
  for(const source of fixtureSources(task,variant)){
    await writeFile(new URL(`${source.id}.json`,folder),JSON.stringify(source.data,null,2));
    await writeFile(new URL(`${source.id}.txt`,folder),typeof source.data==='string'?source.data:JSON.stringify(source.data,null,2));
    if(task.id==='W6'&&source.id==='invoices')for(const v of source.data)await writeFile(new URL(v.file,folder),`CEDAR BOOKS | FICTIONAL INVOICE\nInvoice: ${v.number}\nSubtotal: ${v.subtotal} USD\nTax: ${v.tax} USD\nTotal: ${v.total===null?'not provided':v.total+' USD'}\n`);
  }
  // Neutral filenames avoid announcing the inbox variant in the task prompt.
  const candidateFolder=new URL(`files/${task.id}/${variant==='clean'?'b':'a'}/`,dist);
  await cp(folder,candidateFolder,{recursive:true});
}
console.log('Built static gym in dist/. No environment variables or backend required.');
