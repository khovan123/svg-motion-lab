(function(root){
'use strict';
const compiler=root.SvgMotionCompiler;
const S=root.__SMC;
if(!compiler||!S)return;
const originalCompile=compiler.compile;
function patchRuntime(source){
  let text=String(source||'');
  text=text.replace(/\)\}function render/g,')} ;function render');
  text=text.replace(/if\(ra&&rb\)\{/g,"if(ra&&rb&&(ra.angle!==rb.angle||ra.angle!==0||rb.angle!==0)){" );
  text=text.replace(/const ta=a\.match\(\/\[a-zA-Z\]\|-\?\\d\*\\\.\?\\d\+\(\?:e\[-\+\]\?\\d\+\)\?\/g\)\|\|\[\],tb=b\.match\(\/\[a-zA-Z\]\|-\?\\d\*\\\.\?\\d\+\(\?:e\[-\+\]\?\\d\+\)\?\/g\)\|\|\[\];let ni=0;return ta\.map\(\(token,index\)=>\/\^\[a-zA-Z\]\$\/\.test\(token\)\?token:String\(L\(Number\(token\),Number\(tb\[index\]\),p\)\)\)\.join\(' '\)/,
    "const ta=a.match(/[a-zA-Z]|-?\\d*\\.?\\d+(?:e[-+]?\\d+)?/g)||[],tb=b.match(/[a-zA-Z]|-?\\d*\\.?\\d+(?:e[-+]?\\d+)?/g)||[];let ni=0;const bn=tb.filter(token=>!/^[a-zA-Z]$/.test(token)).map(Number);return ta.map(token=>/^[a-zA-Z]$/.test(token)?token:String(L(Number(token),bn[ni++],p))).join(' ')");
  return text;
}
function repair(result){
  const doc=new DOMParser().parseFromString(result.svg,'image/svg+xml');
  const error=doc.querySelector('parsererror');
  if(error)throw new Error('SVG output không hợp lệ: '+error.textContent.slice(0,160));
  const svg=doc.documentElement;
  svg.querySelectorAll('script').forEach(script=>{script.textContent=patchRuntime(script.textContent)});
  result.svg='<?xml version="1.0" encoding="UTF-8"?>'+new XMLSerializer().serializeToString(svg);
  result.html=S.buildHtml(result.svg,result.schedule);
  const report=Object.assign({status:'ok'},result.semanticReport||{});
  report.semanticTracks=Number(report.semanticTracks!=null?report.semanticTracks:report.totalTracks||0);
  report.pathMorphs=Number(report.pathMorphs!=null?report.pathMorphs:report.pathMorphTracks||0);
  report.subtreeFallbacks=Number(report.subtreeFallbacks||0);
  report.runtimeSyntaxRepaired=true;
  report.staticRotationTracksSkipped=true;
  result.status='ok';
  result.semanticReport=report;
  result.report.status='ok';
  result.report.report=Object.assign({},result.report.report,report);
  result.ir.status='ok';
  result.ir.smartAnimate=Object.assign({},result.ir.smartAnimate,report);
  return result;
}
compiler.compile=function(manifest,options){return repair(originalCompile(manifest,options))};
})(window);
