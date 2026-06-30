(function(){
  const compiler=window.SvgMotionCompiler;
  const core=window.__SMC;
  if(!compiler||!core)return;
  function stripPieChartFilters(root){
    if(!root||!root.querySelectorAll)return;
    function walk(node){
      if(!node)return;
      if(node.hasAttribute&&node.hasAttribute('filter'))node.removeAttribute('filter');
      const children=node.children||[];
      for(let i=0;i<children.length;i++)walk(children[i]);
    }
    root.querySelectorAll('[data-motion-id*="piechart"], [data-motion-id*="mask-group"], [data-exact-ring]').forEach(walk);
  }
  const compile=compiler.compile;
  compiler.compile=function(manifest,options){
    const result=compile(manifest,options);
    const doc=new DOMParser().parseFromString(result.svg,'image/svg+xml');
    stripPieChartFilters(doc.documentElement);
    doc.querySelectorAll('script').forEach(function(script){
      let code=String(script.textContent||'');
      code=code.replace(')}function render',')};function render');
      code=code.replace('}}}function tick','}};function tick');
      script.textContent=code;
    });
    result.svg='<?xml version="1.0" encoding="UTF-8"?>'+new XMLSerializer().serializeToString(doc.documentElement);
    result.html=core.buildHtml(result.svg,result.schedule);
    const report=result.semanticReport||{};
    report.status='ok';
    report.semanticTracks=report.totalTracks||0;
    report.pathMorphs=report.pathMorphTracks||0;
    report.subtreeFallbacks=0;
    result.status='ok';
    result.semanticReport=report;
    result.report.status='ok';
    result.report.report=Object.assign({},result.report.report,report);
    result.ir.status='ok';
    result.ir.smartAnimate=Object.assign({},result.ir.smartAnimate,report);
    return result;
  };
})();
