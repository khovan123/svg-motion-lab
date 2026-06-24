(function(root){
'use strict';
const S=root.__SMC;
function buildIr(manifest,schedule,report){
  return {
    version:2,
    startStateId:schedule.stateIds[0],
    stateOrder:schedule.stateIds.slice(),
    flowStartingPoints:manifest.prototype.flowStartingPoints||[],
    reactions:manifest.prototype.reactions||[],
    variables:manifest.prototype.variables||[],
    variableCollections:manifest.prototype.variableCollections||[],
    playback:{infinite:schedule.infinite,totalDuration:schedule.totalDuration,segments:schedule.segments.map(s=>({from:s.from,to:s.to,hold:s.hold,duration:s.duration}))},
    semantic:report
  };
}
function compile(manifest,options){
  options=options||{};
  S.validate(manifest);
  const base=options.baseSchedule||S.buildBaseSchedule(manifest);
  const schedule=S.customSchedule(base,options.customSegments,options.infinite);
  const semantic=S.buildSemanticSvg(manifest,schedule);
  let svg;
  if(S.requiresFidelity(manifest))svg=S.buildFidelitySvg(manifest,schedule,semantic.report);
  else svg=semantic.svg||S.buildFidelitySvg(manifest,schedule,semantic.report);
  const html=S.buildHtml(svg,schedule);
  const ir=buildIr(manifest,schedule,semantic.report);
  const report={report:{manifestSchema:manifest.schema,prototypeReady:true,snapshotsReady:true,renderMode:semantic.report.renderMode,semanticTracks:semantic.report.semanticTracks,totalTracks:semantic.report.tracks,pathMorphs:semantic.report.pathMorphs,unsupportedTracks:semantic.report.unsupportedTracks,infinite:schedule.infinite,customDuration:schedule.totalDuration},schedule:schedule};
  return {svg:svg,html:html,ir:ir,report:report,schedule:schedule,semanticReport:semantic.report};
}
root.SvgMotionCompiler={validate:S.validate,buildBaseSchedule:S.buildBaseSchedule,compile:compile};
})(window);
