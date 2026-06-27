'use strict';
function compileCurrent(){
  try{
    outputs=SvgMotionCompiler.compile(manifest,{baseSchedule,customSegments,infinite:ui.infinite.checked});
    ui.preview.srcdoc=outputs.html;
    ui.preview.hidden=false;
    ui.empty.hidden=true;
    const report=outputs.semanticReport||{};
    const mode=report.renderMode||'unknown';
    ui.renderMode.textContent=mode;
    ui.renderMode.className='pill '+((mode==='hybrid-smart-animate'||mode==='semantic')?'success':'warning');
    ui.previewLabel.textContent=manifest.states.length+' states · '+outputs.schedule.totalDuration.toFixed(3)+'s · '+(outputs.schedule.infinite?'infinite':'play once');
    [ui.html,ui.svg,ui.ir,ui.report].forEach(button=>button.disabled=false);
    const semantic=Number(report.semanticTracks||0);
    const total=Number(report.totalTracks!=null?report.totalTracks:(report.tracks||0));
    const paths=Number(report.pathMorphs||0);
    const fallback=Number(report.subtreeFallbacks!=null?report.subtreeFallbacks:(report.unsupportedTracks||0));
    ui.status.textContent='Compile thành công · '+semantic+'/'+total+' layer semantic · '+paths+' path morph · '+fallback+' subtree fallback.';
  }catch(error){
    console.error(error);
    ui.status.textContent='Compile lỗi: '+(error&&error.stack?error.stack:error&&error.message?error.message:String(error));
  }
}
function invalidateOutputs(){outputs=null;[ui.html,ui.svg,ui.ir,ui.report].forEach(button=>button.disabled=true);ui.status.textContent='Timing đã thay đổi. Bấm Compile & Preview để cập nhật.'}
function resetOutputs(){outputs=null;[ui.html,ui.svg,ui.ir,ui.report].forEach(button=>button.disabled=true);ui.preview.hidden=true;ui.preview.removeAttribute('srcdoc');ui.empty.hidden=false;ui.previewLabel.textContent='Chưa compile';ui.renderMode.textContent='waiting';ui.renderMode.className='pill'}
function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type})),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function number(value,fallback=0){const parsed=Number(value);return Number.isFinite(parsed)?parsed:fallback}
function escapeHtml(value){return String(value==null?'':value).replace(/[&<>"']/g,function(character){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]})}
