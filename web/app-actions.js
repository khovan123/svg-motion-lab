'use strict';
function compileCurrent(){
  try{
    outputs=SvgMotionCompiler.compile(manifest,{baseSchedule,customSegments,infinite:ui.infinite.checked});
    ui.preview.srcdoc=outputs.html;
    ui.preview.hidden=false;ui.empty.hidden=true;
    const mode=outputs.semanticReport.renderMode;
    ui.renderMode.textContent=mode;
    ui.renderMode.className='pill '+(mode==='semantic'?'success':'warning');
    ui.previewLabel.textContent=manifest.states.length+' states · '+outputs.schedule.totalDuration.toFixed(3)+'s · '+(outputs.schedule.infinite?'infinite':'play once');
    [ui.html,ui.svg,ui.ir,ui.report].forEach(b=>b.disabled=false);
    const report=outputs.semanticReport;
    ui.status.textContent='Compile thành công · '+report.semanticTracks+'/'+report.tracks+' layer semantic · '+report.pathMorphs+' path morph · '+report.unsupportedTracks+' fallback.';
  }catch(error){ui.status.textContent='Compile lỗi: '+error.message}
}
function invalidateOutputs(){outputs=null;[ui.html,ui.svg,ui.ir,ui.report].forEach(b=>b.disabled=true);ui.status.textContent='Timing đã thay đổi. Bấm Compile & Preview để cập nhật.'}
function resetOutputs(){outputs=null;[ui.html,ui.svg,ui.ir,ui.report].forEach(b=>b.disabled=true);ui.preview.hidden=true;ui.preview.removeAttribute('srcdoc');ui.empty.hidden=false;ui.previewLabel.textContent='Chưa compile';ui.renderMode.textContent='waiting';ui.renderMode.className='pill'}
function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function number(value,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback}
function escapeHtml(value){return String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
