const fs=require('fs'),vm=require('vm'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'image-compressor.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
function harness(){
 const ids=['file','format','quality','value','hint','compress','status','download','preview'];
 const elements=Object.fromEntries(ids.map(id=>[id,{value:'',hidden:false,disabled:false,files:[],textContent:'',removeAttribute(k){delete this[k]}}]));
 elements.format.value='image/jpeg';elements.quality.value='80';elements.download.hidden=true;elements.preview.hidden=true;
 const pending=[],blobs=new Map();let serial=0;
 const context={document:{getElementById:id=>elements[id],createElement:()=>({getContext:()=>({fillRect(){},drawImage(){}}),toBlob(cb,type,quality){pending.push({cb,type,quality})}})},URL:{createObjectURL(blob){const url='blob:'+ ++serial;blobs.set(url,blob);return url},revokeObjectURL(url){blobs.delete(url)}},Image:class{naturalWidth=100;naturalHeight=100;async decode(){if(blobs.get(this.src)?.bad)throw Error('invalid')}},console};
 vm.runInNewContext(script,context);
 return {e:elements,pending,blobs,async select(name='original.png',bad=false){elements.file.files=[{name,type:'image/png',size:10000,bad}];await elements.file.onchange()},complete(blob={size:5000}){pending.shift().cb(blob)},snapshot(){return {format:elements.format.value,quality:elements.quality.value,downloadVisible:!elements.download.hidden,downloadName:elements.download.download||null,downloadType:blobs.get(elements.download.href)?.type||null,status:elements.status.textContent,buttonDisabled:elements.compress.disabled}}};
}
(async()=>{
 const results=[];
 for(const control of ['quality','format']){const h=harness();await h.select();const job=h.e.compress.onclick();h.complete({size:5000,type:'image/jpeg'});await job;const before=h.e.status.textContent;if(control==='quality'){h.e.quality.value='10';h.e.quality.oninput()}else{h.e.format.value='image/png';h.e.format.onchange()}results.push({case:'change-'+control+'-after-completion',observed:h.snapshot(),misleadingOldStatus:h.e.download.hidden&&h.e.status.textContent===before})}
 {const h=harness();await h.select();const job=h.e.compress.onclick();const encoding={...h.pending[0]};delete encoding.cb;h.e.format.value='image/png';h.e.format.onchange();h.complete({size:5000,type:'image/jpeg'});await job;results.push({case:'change-format-during-encoding',encoding,observed:h.snapshot(),staleResult:!h.e.download.hidden&&h.blobs.get(h.e.download.href).type!==h.e.format.value})}
 {const h=harness();await h.select();const job=h.e.compress.onclick();const encoding={...h.pending[0]};delete encoding.cb;h.e.quality.value='20';h.e.quality.oninput();h.complete({size:5000,type:'image/jpeg'});await job;results.push({case:'change-quality-during-encoding',encoding,observed:h.snapshot(),staleResult:!h.e.download.hidden&&encoding.quality!==Number(h.e.quality.value)/100})}
 {const h=harness();await h.select();const job=h.e.compress.onclick();await h.select('new.png');h.complete({size:5000,type:'image/jpeg'});await job;results.push({case:'change-file-during-encoding',observed:h.snapshot(),oldResultVisible:!h.e.download.hidden})}
 {const h=harness();await h.select();const job=h.e.compress.onclick();h.complete(null);await job;results.push({case:'encoding-failure',observed:h.snapshot(),failureHandled:h.e.download.hidden&&!h.e.compress.disabled&&h.e.status.textContent.includes('压缩失败')})}
 {const h=harness();await h.select();const job=h.e.compress.onclick();await h.select('broken.png',true);h.complete({size:5000,type:'image/jpeg'});await job;results.push({case:'change-to-invalid-file-during-encoding',observed:h.snapshot(),failureHandled:h.e.download.hidden&&h.e.compress.disabled&&h.e.status.textContent.includes('无法读取')})}
 fs.writeFileSync(path.join(__dirname,'logic-test-results.json'),JSON.stringify({testType:'Node VM with minimal DOM and Canvas stubs; not browser interaction',results},null,2));console.log(JSON.stringify(results,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
