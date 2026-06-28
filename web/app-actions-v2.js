'use strict';
function compileCurrent(){
  try{
    outputs=SvgMotionCompiler.compile(manifest,{baseSchedule,customSegments,infinite:ui.infinite.checked});
    ui.preview.srcdoc=outputs.html;
    ui.preview.hidden=false;
    ui.empty.hidden=true;
    const report=outputs.semanticReport||{};
    const mode=report.renderMode||'unknown';
    const status=report.status||outputs.status||'ok';
    ui.renderMode.textContent=mode+' · '+status;
    ui.renderMode.className='pill '+(mode==='multi-track-smart-animate'?'success':'warning');
    ui.previewLabel.textContent=manifest.states.length+' states · '+outputs.schedule.totalDuration.toFixed(3)+'s · '+(outputs.schedule.infinite?'infinite':'play once');
    [ui.html,ui.svg,ui.ir,ui.report].forEach(function(button){button.disabled=false});
    const total=Number(report.totalTracks||0);
    const semantic=Number(report.semanticTracks!=null?report.semanticTracks:total);
    const paths=Number(report.pathMorphs!=null?report.pathMorphs:(report.pathMorphTracks||0));
    const transforms=Number(report.transformTracks||0);
    const rotations=Number(report.rotationTracks||0);
    const presence=Number(report.presenceTracks||0);
    const fallback=Number(report.subtreeFallbacks||0);
    ui.status.textContent='Compile thành công · '+semantic+'/'+total+' semantic · '+paths+' path · '+transforms+' transform · '+rotations+' rotation · '+presence+' presence · '+fallback+' fallback.';
  }catch(error){
    console.error(error);
    ui.status.textContent='Compile lỗi: '+(error&&error.stack?error.stack:error&&error.message?error.message:String(error));
  }
}
function invalidateOutputs(){outputs=null;[ui.html,ui.svg,ui.ir,ui.report].forEach(function(button){button.disabled=true});ui.status.textContent='Timing đã thay đổi. Bấm Compile & Preview để cập nhật.'}
function resetOutputs(){outputs=null;[ui.html,ui.svg,ui.ir,ui.report].forEach(function(button){button.disabled=true});ui.preview.hidden=true;ui.preview.removeAttribute('srcdoc');ui.empty.hidden=false;ui.previewLabel.textContent='Chưa compile';ui.renderMode.textContent='waiting';ui.renderMode.className='pill'}
function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type:type}));const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(function(){URL.revokeObjectURL(url)},1000)}
function number(value,fallback){const parsed=Number(value);return Number.isFinite(parsed)?parsed:(fallback||0)}
function escapeHtml(value){return String(value==null?'':value)}
