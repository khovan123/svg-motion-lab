'use strict';
const q=s=>document.querySelector(s);
const ui={
  drop:q('#drop'),file:q('#file'),summary:q('#summary'),schema:q('#schema'),states:q('#states'),reactions:q('#reactions'),snapshots:q('#snapshots'),originalDuration:q('#originalDuration'),custom:q('#custom'),totalDuration:q('#totalDuration'),computedDuration:q('#computedDuration'),infinite:q('#infinite'),timingList:q('#timingList'),resetTiming:q('#resetTiming'),compile:q('#compile'),html:q('#downloadHtml'),svg:q('#downloadSvg'),ir:q('#downloadIr'),report:q('#downloadReport'),status:q('#status'),preview:q('#preview'),empty:q('#empty'),previewLabel:q('#previewLabel'),heroStates:q('#heroStates'),heroDuration:q('#heroDuration'),renderMode:q('#renderMode')
};
let manifest=null,baseSchedule=null,customSegments=[],outputs=null,updatingTotal=false;

ui.file.addEventListener('change',e=>loadFile(e.target.files[0]));
['dragenter','dragover'].forEach(name=>ui.drop.addEventListener(name,e=>{e.preventDefault();ui.drop.classList.add('drag')}));
['dragleave','drop'].forEach(name=>ui.drop.addEventListener(name,e=>{e.preventDefault();ui.drop.classList.remove('drag')}));
ui.drop.addEventListener('drop',e=>loadFile(e.dataTransfer.files[0]));
ui.compile.addEventListener('click',compileCurrent);
ui.resetTiming.addEventListener('click',resetTiming);
ui.totalDuration.addEventListener('change',scaleToTotalDuration);
ui.infinite.addEventListener('change',invalidateOutputs);
ui.html.addEventListener('click',()=>download('animation.html',outputs.html,'text/html'));
ui.svg.addEventListener('click',()=>download('animation.svg',outputs.svg,'image/svg+xml'));
ui.ir.addEventListener('click',()=>download('prototype-ir.json',JSON.stringify(outputs.ir,null,2),'application/json'));
ui.report.addEventListener('click',()=>download('calibration-report.json',JSON.stringify(outputs.report,null,2),'application/json'));

async function loadFile(file){
  resetOutputs();
  if(!file)return;
  try{
    const parsed=JSON.parse(await file.text());
    const info=SvgMotionCompiler.validate(parsed);
    manifest=parsed;
    baseSchedule=SvgMotionCompiler.buildBaseSchedule(parsed);
    customSegments=baseSchedule.segments.map(s=>({hold:s.hold,duration:s.duration}));
    ui.summary.classList.add('show');ui.custom.classList.add('show');
    ui.schema.textContent=parsed.schema;ui.states.textContent=String(info.states);ui.reactions.textContent=String(info.reactions);ui.snapshots.textContent=info.snapshots+'/'+info.states;ui.snapshots.className='ok';ui.originalDuration.textContent=baseSchedule.totalDuration.toFixed(3)+'s';ui.heroStates.textContent=String(info.states);
    renderTimingControls();syncTotalDuration();ui.compile.disabled=false;ui.status.textContent='Manifest hợp lệ. Có thể custom timing rồi compile.';
  }catch(error){
    manifest=null;baseSchedule=null;customSegments=[];ui.compile.disabled=true;ui.custom.classList.remove('show');ui.status.textContent='Lỗi: '+error.message;
  }
}

function names(){return new Map((manifest&&manifest.states||[]).map(s=>[s.id,s.name||s.id]))}
function renderTimingControls(){
  const label=names();ui.timingList.innerHTML='';
  baseSchedule.segments.forEach((segment,index)=>{
    const values=customSegments[index]||segment;
    const row=document.createElement('div');row.className='timing-row';
    row.innerHTML='<div class="route" title="'+escapeHtml(label.get(segment.from))+' → '+escapeHtml(label.get(segment.to))+'">'+escapeHtml(label.get(segment.from))+' → '+escapeHtml(label.get(segment.to))+'</div><div class="timing-field"><label>Hold</label><input data-index="'+index+'" data-field="hold" type="number" min="0" step="0.05" value="'+Number(values.hold).toFixed(3)+'"></div><div class="timing-field"><label>Transition</label><input data-index="'+index+'" data-field="duration" type="number" min="0.001" step="0.05" value="'+Number(values.duration).toFixed(3)+'"></div>';
    ui.timingList.appendChild(row);
  });
  ui.timingList.querySelectorAll('input').forEach(input=>input.addEventListener('change',onTimingChange));
}
function onTimingChange(e){
  const index=Number(e.target.dataset.index),field=e.target.dataset.field,min=field==='hold'?0:.001;
  customSegments[index][field]=Math.max(min,number(e.target.value,min));e.target.value=customSegments[index][field].toFixed(3);syncTotalDuration();invalidateOutputs();
}
function currentTotal(){return customSegments.reduce((sum,s)=>sum+number(s.hold)+number(s.duration),0)}
function syncTotalDuration(){const total=currentTotal();updatingTotal=true;ui.totalDuration.value=total.toFixed(3);ui.computedDuration.textContent=total.toFixed(3)+'s';ui.heroDuration.textContent=total.toFixed(1)+'s';updatingTotal=false}
function scaleToTotalDuration(){
  if(updatingTotal||!customSegments.length)return;
  const target=Math.max(.1,number(ui.totalDuration.value,currentTotal())),current=currentTotal();if(current<=0)return;
  const ratio=target/current;customSegments=customSegments.map(s=>({hold:s.hold*ratio,duration:Math.max(.001,s.duration*ratio)}));renderTimingControls();syncTotalDuration();invalidateOutputs();
}
function resetTiming(){if(!baseSchedule)return;customSegments=baseSchedule.segments.map(s=>({hold:s.hold,duration:s.duration}));ui.infinite.checked=true;renderTimingControls();syncTotalDuration();invalidateOutputs()}
