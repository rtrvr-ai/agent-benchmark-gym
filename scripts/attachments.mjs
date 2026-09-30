import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { getTask, VERSION } from '../src/tasks.mjs';

// A single-page, text-native PDF using standard fonts. No API or build dependency.
function resumePdf(resume) {
  const escape = text => String(text).replace(/[\\()]/g, '\\$&');
  const text = (value, x, y, size = 12, bold = false) => `BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${y} Td (${escape(value)}) Tj ET`;
  const stream = [
    '0.12 0.2 0.17 rg', text(resume.name, 56, 728, 28, true),
    text('Frontend engineer', 56, 696, 15), text(`${resume.email}  |  ${resume.location}`, 56, 669),
    '0.75 0.8 0.76 RG 56 645 m 556 645 l S',
    text('EXPERIENCE', 56, 612, 11, true), text(`${resume.experienceYears} years of frontend engineering experience`, 56, 587, 13),
    text('SKILLS', 56, 540, 11, true), text(resume.skills.join('  /  '), 56, 515, 13),
    text('WORK AUTHORIZATION', 56, 468, 11, true), text(`Sponsorship requirement: ${resume.sponsorship}`, 56, 443, 13),
    '0.4 0.45 0.42 rg', text('Source: resume', 56, 64, 10),
  ].join('\n');
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`];
  let pdf = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object,index) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${index+1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.slice(1).map(offset=>`${String(offset).padStart(10,'0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf);
}

export async function buildAttachments(dist) {
  const folder = new URL('attachments/',dist); await mkdir(folder,{recursive:true});
  const resume = getTask('L3').sources.find(source=>source.id==='resume').data;
  const resumeText = `${resume.name}\nFrontend engineer\n${resume.email} | ${resume.location}\n\nEXPERIENCE\n${resume.experienceYears} years of frontend engineering experience\n\nSKILLS\n${resume.skills.join(', ')}\n\nWORK AUTHORIZATION\nSponsorship requirement: ${resume.sponsorship}\n\nSource: resume\n`;
  const files = [
    { taskId:'L3', name:'avery-example-resume.pdf', mimeType:'application/pdf', bytes:resumePdf(resume) },
    { taskId:'L3', name:'avery-example-resume.txt', mimeType:'text/plain', bytes:Buffer.from(resumeText) },
  ];
  for (const name of ['a.txt','a-copy.txt','b.txt','c.txt','d.txt']) files.push({taskId:'W6',name,mimeType:'text/plain',bytes:await readFile(new URL(`files/W6/a/${name}`,dist))});
  for (const file of files) await writeFile(new URL(file.name,folder),file.bytes);
  await writeFile(new URL('manifest.json',folder),JSON.stringify({version:VERSION,files:files.map(({bytes,...file})=>({...file,sizeBytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')}))},null,2));
}
