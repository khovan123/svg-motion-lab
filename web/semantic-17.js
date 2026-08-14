(function(root){
'use strict';
const compiler=root.SvgMotionCompiler;
const S=root.__SMC;
if(!compiler||!S)return;
const previousCompile=compiler.compile;
const SVG_NS='http://www.w3.org/2000/svg';
const EPS=1e-9;
const SAMPLE_STEPS=8;

function round(value){
  const n=Number(value)||0;
  return Math.round(n*1000000)/1000000;
}
function clamp(value){return Math.max(0,Math.min(1,Number(value)||0))}
function lerp(a,b,p){return (Number(a)||0)+((Number(b)||0)-(Number(a)||0))*p}
function smooth(p){p=clamp(p);return p*p*(3-2*p)}
function sameValues(values){return values.length>0&&values.every(value=>String(value)===String(values[0]))}
function pick(values,index){
  if(!Array.isArray(values))return null;
  if(values[index]!=null)return values[index];
  for(let i=index-1;i>=0;i--)if(values[i]!=null)return values[i];
  for(let i=0;i<values.length;i++)if(values[i]!=null)return values[i];
  return null;
}
function uniqueSorted(values){
  const sorted=values.filter(Number.isFinite).sort((a,b)=>a-b),out=[];
  sorted.forEach(value=>{if(!out.length||Math.abs(value-out[out.length-1])>EPS)out.push(value)});
  return out;
}
function sampleTimes(data){
  const total=Math.max(.001,Number(data&&data.duration)||.001),times=[0,total];
  (data&&data.segments||[]).forEach(segment=>{
    const start=Math.max(0,Math.min(total,Number(segment.start)||0));
    const end=Math.max(start,Math.min(total,Number(segment.end)||start));
    times.push(start,end);
    if(end-start>EPS){
      for(let step=1;step<SAMPLE_STEPS;step++)times.push(start+(end-start)*(step/SAMPLE_STEPS));
    }
  });
  return uniqueSorted(times);
}
function timelineAt(data,time){
  const segments=data&&data.segments||[];
  let active=0;
  for(const segment of segments){
    const start=Number(segment.start)||0;
    const end=Math.max(start+EPS,Number(segment.end)||start+EPS);
    if(time<start-EPS)return{from:active,to:active,p:0,active};
    if(time<=end+EPS){
      const raw=clamp((time-start)/(end-start));
      return{from:Number(segment.from)||0,to:Number(segment.to)||0,p:smooth(raw),active:Number(segment.from)||0};
    }
    active=Number(segment.to)||0;
  }
  return{from:active,to:active,p:0,active};
}
function opacityForIndex(data,index,time){
  const q=timelineAt(data,time);
  if(q.from===q.to)return q.from===index?1:0;
  if(q.from===index)return 1-q.p;
  if(q.to===index)return q.p;
  return 0;
}
function extractRuntimeData(scriptText){
  const match=String(scriptText||'').match(/const D=(\{[\s\S]*?\}),svg=/);
  if(!match)return null;
  try{return JSON.parse(match[1])}catch(_error){return null}
}
function appendAnimate(element,attributeName,times,data,values,calcMode){
  if(!element||!times.length||!values.length||sameValues(values))return;
  const total=Math.max(.001,Number(data.duration)||.001);
  const animate=element.ownerDocument.createElementNS(SVG_NS,'animate');
  animate.setAttribute('attributeName',attributeName);
  animate.setAttribute('dur',String(round(total))+'s');
  animate.setAttribute('repeatCount',data.infinite?'indefinite':'1');
  animate.setAttribute('fill','freeze');
  animate.setAttribute('calcMode',calcMode||'linear');
  animate.setAttribute('keyTimes',times.map(time=>round(time/total)).join(';'));
  animate.setAttribute('values',values.map(value=>String(value)).join(';'));
  element.appendChild(animate);
}
function appendRotateAnimate(element,times,data,values){
  if(!element||!times.length||!values.length||sameValues(values))return;
  const total=Math.max(.001,Number(data.duration)||.001);
  const animate=element.ownerDocument.createElementNS(SVG_NS,'animateTransform');
  animate.setAttribute('attributeName','transform');
  animate.setAttribute('type','rotate');
  animate.setAttribute('dur',String(round(total))+'s');
  animate.setAttribute('repeatCount',data.infinite?'indefinite':'1');
  animate.setAttribute('fill','freeze');
  animate.setAttribute('calcMode','linear');
  animate.setAttribute('keyTimes',times.map(time=>round(time/total)).join(';'));
  animate.setAttribute('values',values.join(';'));
  element.appendChild(animate);
}
function parseColor(value,svg){
  if(Array.isArray(value)&&value.length>=3)return value.slice(0,3).map(Number);
  const text=String(value||'').trim();
  let match;
  if((match=text.match(/^#([0-9a-f]{6})$/i))){
    return[parseInt(match[1].slice(0,2),16),parseInt(match[1].slice(2,4),16),parseInt(match[1].slice(4,6),16)];
  }
  if((match=text.match(/^#([0-9a-f]{3})$/i))){
    return match[1].split('').map(ch=>parseInt(ch+ch,16));
  }
  if((match=text.match(/^rgb\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/i)))return match.slice(1).map(Number);
  if(text.toLowerCase()==='white')return[255,255,255];
  if(text.toLowerCase()==='black')return[0,0,0];
  if((match=text.match(/^url\(#([^)]+)\)$/))&&svg){
    const def=svg.querySelector('#'+match[1]);
    if(def){
      const colors=[...def.querySelectorAll('stop')].map(stop=>parseColor(stop.getAttribute('stop-color'),svg)).filter(Boolean);
      if(colors.length){
        const sum=colors.reduce((acc,color)=>[acc[0]+color[0],acc[1]+color[1],acc[2]+color[2]],[0,0,0]);
        return sum.map(value=>value/colors.length);
      }
    }
  }
  return null;
}
function colorValue(a,b,p,svg,interpolateRefs){
  if(a==null&&b==null)return null;
  if(a==null)return b;
  if(b==null)return a;
  const ca=parseColor(a,svg),cb=parseColor(b,svg);
  if((Array.isArray(a)&&Array.isArray(b))||(interpolateRefs&&ca&&cb)){
    const left=ca||a,right=cb||b;
    return'rgb('+[0,1,2].map(index=>Math.round(lerp(left[index],right[index],p))).join(',')+')';
  }
  return p<.5?a:b;
}
function interpolatePath(a,b,p){
  if(!a||!b)return a||b||'';
  const left=String(a).match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g)||[];
  const rightNumbers=(String(b).match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g)||[]).filter(token=>!/^[a-zA-Z]$/.test(token)).map(Number);
  let index=0;
  return left.map(token=>/^[a-zA-Z]$/.test(token)?token:String(round(lerp(Number(token),rightNumbers[index++],p)))).join(' ');
}
function multiplyAffine(a,b){
  return[
    a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],
    a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],
    a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]
  ];
}
function rotationMatrix(angle,cx,cy){
  const rad=(Number(angle)||0)*Math.PI/180,c=Math.cos(rad),s=Math.sin(rad),x=Number(cx)||0,y=Number(cy)||0;
  return[c,s,-s,c,x-c*x+s*y,y-s*x-c*y];
}
function transformValue(track,q){
  const ma=pick(track.transforms,q.from),mb=pick(track.transforms,q.to);
  let matrix=null;
  if(ma&&mb)matrix=ma.map((value,index)=>lerp(value,mb[index],q.p));
  else if(ma)matrix=ma.slice();
  else if(mb)matrix=mb.slice();
  const ra=pick(track.rotations,q.from),rb=pick(track.rotations,q.to);
  if(ra&&rb){
    let a=Number(ra.angle)||0,b=Number(rb.angle)||0;
    while(b-a>180)b-=360;
    while(a-b>180)b+=360;
    const angle=lerp(a,b,q.p),cx=lerp(ra.cx,rb.cx,q.p),cy=lerp(ra.cy,rb.cy,q.p);
    const rotation=rotationMatrix(angle,cx,cy);
    matrix=matrix?multiplyAffine(matrix,rotation):rotation;
  }
  if(!matrix)return null;
  return'matrix('+matrix.map(round).join(' ')+')';
}
function trackOpacity(track,q){
  const pa=Boolean(track.present&&track.present[q.from]),pb=Boolean(track.present&&track.present[q.to]);
  if(!pa&&!pb)return 0;
  if(pa&&!pb)return 1-q.p;
  if(!pa&&pb)return q.p;
  const na=pick(track.numeric,q.from)||{},nb=pick(track.numeric,q.to)||{};
  if(na.opacity!=null||nb.opacity!=null)return lerp(na.opacity,nb.opacity,q.p);
  return 1;
}
function buildMotionMap(scene){
  const map=new Map();
  scene.querySelectorAll('[data-motion-id]').forEach(element=>{
    const id=element.getAttribute('data-motion-id');
    if(id&&!map.has(id))map.set(id,element);
  });
  return map;
}
function applyMainTracks(svg,data){
  const scene=svg.querySelector('#motion-scene')||svg;
  const motionMap=buildMotionMap(scene),times=sampleTimes(data);
  (data.tracks||[]).forEach(track=>{
    const element=motionMap.get(track.id);
    if(!element)return;
    if(element.hasAttribute('data-refresh-rotor')||element.hasAttribute('data-exact-ring')||element.getAttribute('data-static-connector')==='true')return;
    if(element.closest&&element.closest('[data-refresh-rotor],[data-exact-ring]')&&element.closest('[data-refresh-rotor],[data-exact-ring]')!==element)return;
    element.setAttribute('visibility','visible');

    const numericNames=(data.numeric||[]).filter(name=>name!=='opacity');
    numericNames.forEach(name=>{
      const hasValue=(track.numeric||[]).some(values=>values&&values[name]!=null);
      if(!hasValue)return;
      const values=times.map(time=>{
        const q=timelineAt(data,time),a=pick(track.numeric,q.from)||{},b=pick(track.numeric,q.to)||{};
        return round(lerp(a[name],b[name],q.p));
      });
      appendAnimate(element,name,times,data,values,'linear');
    });

    const opacityValues=times.map(time=>trackOpacity(track,timelineAt(data,time))).map(round);
    if(!sameValues(opacityValues)||Number(opacityValues[0])!==1){
      element.setAttribute('opacity',String(opacityValues[0]));
      appendAnimate(element,'opacity',times,data,opacityValues,'linear');
    }

    (data.colors||[]).forEach(name=>{
      const hasValue=(track.colors||[]).some(values=>values&&values[name]!=null);
      if(!hasValue)return;
      const values=times.map(time=>{
        const q=timelineAt(data,time),a=(pick(track.colors,q.from)||{})[name],b=(pick(track.colors,q.to)||{})[name];
        return colorValue(a,b,q.p,svg,Boolean(data.referencedColorInterpolation));
      }).map(value=>value==null?'none':value);
      const discrete=values.some(value=>/^url\(/.test(String(value)));
      appendAnimate(element,name,times,data,values,discrete?'discrete':'linear');
    });

    if(Array.isArray(track.paths)&&track.paths.some(Boolean)){
      const values=times.map(time=>{
        const q=timelineAt(data,time),a=pick(track.paths,q.from),b=pick(track.paths,q.to);
        if(track.pathMode)return interpolatePath(a,b,q.p);
        return q.p<.5?(a||b||''):(b||a||'');
      });
      appendAnimate(element,'d',times,data,values,track.pathMode?'linear':'discrete');
    }

    if((track.transforms||[]).some(Boolean)||(track.rotations||[]).some(Boolean)){
      const values=times.map(time=>transformValue(track,timelineAt(data,time))).map(value=>value||'matrix(1 0 0 1 0 0)');
      appendAnimate(element,'transform',times,data,values,'linear');
    }
  });

  scene.querySelectorAll('[data-fallback-index]').forEach(group=>{
    [...group.children].forEach(child=>{
      const index=Number(child.getAttribute('data-state-index'));
      if(!Number.isFinite(index))return;
      child.setAttribute('visibility','visible');
      const values=times.map(time=>round(opacityForIndex(data,index,time)));
      child.setAttribute('opacity',String(values[0]));
      appendAnimate(child,'opacity',times,data,values,group.getAttribute('data-fallback-mode')==='swap'?'discrete':'linear');
    });
  });
}
function applyExactRing(svg,data){
  const rootRing=svg.querySelector('[data-exact-ring]');
  if(!rootRing||!data)return;
  const times=sampleTimes(data);
  rootRing.querySelectorAll(':scope > [data-ring-state]').forEach(child=>{
    const index=Number(child.getAttribute('data-ring-state'));
    if(!Number.isFinite(index))return;
    child.setAttribute('visibility','visible');
    const values=times.map(time=>round(opacityForIndex(data,index,time)));
    child.setAttribute('opacity',String(values[0]));
    appendAnimate(child,'opacity',times,data,values,'linear');
  });
}
function applyRefreshRotor(svg,data){
  const rotor=svg.querySelector('[data-refresh-rotor]');
  if(!rotor||!data||!Array.isArray(data.angles))return;
  const times=sampleTimes(data);
  const values=times.map(time=>{
    const q=timelineAt(data,time);
    let a=Number(data.angles[q.from])||0,b=Number(data.angles[q.to])||0;
    while(b-a>180)b-=360;
    while(a-b>180)b+=360;
    return round(lerp(a,b,q.p))+' '+round(data.cx)+' '+round(data.cy);
  });
  rotor.setAttribute('transform','rotate('+values[0]+')');
  appendRotateAnimate(rotor,times,data,values);
}
function sanitizeSvg(svg){
  svg.querySelectorAll('script').forEach(node=>node.remove());
  [svg,...svg.querySelectorAll('*')].forEach(node=>{
    if(!node.attributes)return;
    [...node.attributes].forEach(attr=>{
      const name=String(attr.name||''),value=String(attr.value||'');
      if(/^on/i.test(name))node.removeAttribute(name);
      if((name==='href'||name==='xlink:href')&&/^\s*javascript:/i.test(value))node.removeAttribute(name);
    });
  });
}
function buildDeclarativeSvg(runtimeSvg){
  const doc=new DOMParser().parseFromString(String(runtimeSvg||''),'image/svg+xml');
  const error=doc.querySelector('parsererror');
  if(error)throw new Error('Không thể chuyển runtime SVG sang SMIL: '+error.textContent.slice(0,160));
  const svg=doc.documentElement,scripts=[...svg.querySelectorAll('script')],datasets=scripts.map(script=>extractRuntimeData(script.textContent)).filter(Boolean);
  const main=datasets.find(data=>Array.isArray(data.tracks));
  if(!main)throw new Error('Không tìm thấy smart-animate track data để tạo standalone SVG.');
  const refresh=datasets.find(data=>Array.isArray(data.angles));
  const ring=datasets.find(data=>!Array.isArray(data.tracks)&&!Array.isArray(data.angles)&&Array.isArray(data.segments));
  applyMainTracks(svg,main);
  applyExactRing(svg,ring);
  applyRefreshRotor(svg,refresh);
  sanitizeSvg(svg);
  svg.setAttribute('data-render-mode','standalone-smil-smart-animate');
  svg.setAttribute('data-script-free','true');
  return'<?xml version="1.0" encoding="UTF-8"?>'+new XMLSerializer().serializeToString(svg);
}

function sanitizeSnapshot(state){
  const doc=new DOMParser().parseFromString(String(state&&state.svg||''),'image/svg+xml');
  const error=doc.querySelector('parsererror');
  if(error)throw new Error('Không thể tạo fallback standalone SVG từ state '+String(state&&state.name||state&&state.id||'unknown')+': '+error.textContent.slice(0,160));
  sanitizeSvg(doc.documentElement);
  return doc.documentElement;
}
function snapshotDataUri(svg){return'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(svg))}
function buildSnapshotFallback(manifest,schedule){
  const stateById=new Map((manifest.states||[]).map(state=>[state.id,state])),stateIds=(schedule.stateIds||[]).filter(id=>stateById.has(id));
  if(!stateIds.length)throw new Error('Standalone SVG không có state hợp lệ để render.');
  const firstState=stateById.get(stateIds[0]),firstSvg=sanitizeSnapshot(firstState),viewBox=String(firstSvg.getAttribute('viewBox')||'').trim();
  const parts=viewBox.split(/[\s,]+/).map(Number),validViewBox=parts.length===4&&parts.every(Number.isFinite);
  const width=validViewBox?parts[2]:(Number(firstSvg.getAttribute('width'))||Number(firstState.width)||355),height=validViewBox?parts[3]:(Number(firstSvg.getAttribute('height'))||Number(firstState.height)||240),x=validViewBox?parts[0]:0,y=validViewBox?parts[1]:0;
  const doc=document.implementation.createDocument(SVG_NS,'svg',null),svg=doc.documentElement,scene=doc.createElementNS(SVG_NS,'g');
  svg.setAttribute('id','motion-svg');svg.setAttribute('viewBox',validViewBox?viewBox:'0 0 '+round(width)+' '+round(height));svg.setAttribute('width',String(round(width)));svg.setAttribute('height',String(round(height)));svg.setAttribute('data-render-mode','standalone-smil-crossfade');svg.setAttribute('data-duration',String(round(schedule.totalDuration)));svg.setAttribute('data-infinite',String(Boolean(schedule.infinite)));svg.setAttribute('data-script-free','true');scene.setAttribute('id','motion-scene');scene.setAttribute('style','isolation:isolate');svg.appendChild(scene);
  const data={duration:schedule.totalDuration,infinite:schedule.infinite,segments:(schedule.segments||[]).map(segment=>({from:stateIds.indexOf(segment.from),to:stateIds.indexOf(segment.to),start:segment.transitionStart,end:segment.transitionEnd}))},times=sampleTimes(data);
  stateIds.forEach((stateId,index)=>{
    const group=doc.createElementNS(SVG_NS,'g'),image=doc.createElementNS(SVG_NS,'image'),stateSvg=index===0?firstSvg:sanitizeSnapshot(stateById.get(stateId)),values=times.map(time=>round(opacityForIndex(data,index,time)));
    group.setAttribute('data-smil-state',String(index));group.setAttribute('data-state-id',String(stateId));group.setAttribute('opacity',String(values[0]));
    image.setAttribute('x',String(round(x)));image.setAttribute('y',String(round(y)));image.setAttribute('width',String(round(width)));image.setAttribute('height',String(round(height)));image.setAttribute('preserveAspectRatio','xMidYMid meet');image.setAttribute('href',snapshotDataUri(stateSvg));group.appendChild(image);appendAnimate(group,'opacity',times,data,values,'linear');scene.appendChild(group);
  });
  return'<?xml version="1.0" encoding="UTF-8"?>'+new XMLSerializer().serializeToString(svg);
}

compiler.compile=function(manifest,options){
  const result=previousCompile(manifest,options),runtimeSvg=result.svg;
  let standaloneSvg,standaloneRenderMode='standalone-smil-smart-animate',fallbackReason=null;
  try{standaloneSvg=buildDeclarativeSvg(runtimeSvg)}catch(error){standaloneSvg=buildSnapshotFallback(manifest,result.schedule);standaloneRenderMode='standalone-smil-crossfade';fallbackReason=String(error&&error.message||error)}
  result.runtimeSvg=runtimeSvg;
  result.svg=standaloneSvg;
  result.html=S.buildHtml(standaloneSvg,result.schedule);
  const compatibility={standaloneSvg:true,standaloneRenderMode,standaloneHasScripts:false,htmlRuntime:true};
  if(fallbackReason)compatibility.standaloneFallbackReason=fallbackReason;
  result.semanticReport=Object.assign({},result.semanticReport||{},compatibility);
  if(result.report&&result.report.report)result.report.report=Object.assign({},result.report.report,compatibility);
  if(result.ir&&result.ir.smartAnimate)result.ir.smartAnimate=Object.assign({},result.ir.smartAnimate,compatibility);
  return result;
};
})(window);
