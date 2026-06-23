"use strict";
const fs=require("fs"),path=require("path");
const{orderStates,buildSchedule,sampleSpring,easingSpline}=require("./compiler/timeline");
const{tracks,renderTrack}=require("./compiler/render");
const{shouldUseSnapshotMode,renderSnapshots}=require("./compiler/snapshot");
const html=require("./compiler/html");
const{finite,fmt}=require("./compiler/utils");
const DEFAULTS={defaultHold:.7,defaultDuration:.4,springSamples:36,precision:4,loop:true,renderMode:"auto"};
function validate(m){if(!m||!Array.isArray(m.states)||!m.states.length)throw new Error("Manifest phải có ít nhất một state.");for(const s of m.states)if(!s.id||!Array.isArray(s.layers))throw new Error(`State không hợp lệ: ${s&&s.name||"unknown"}`)}
function compileManifest(m,opt={}){validate(m);const cfg={...DEFAULTS,...(m.calibration||{}),...opt},states=orderStates(m),schedule=buildSchedule(states,m.transitions||[],cfg),defs=[],body=[],report={matchedLayers:0,fallbackLayers:0,gradientTracks:0,pathMorphs:0,snapshotStates:0,renderMode:"semantic",warnings:[]};if(shouldUseSnapshotMode(states,cfg))body.push(renderSnapshots(states,schedule,cfg,report));else for(const t of tracks(states)){const x=renderTrack(t,schedule,cfg,defs,report);if(x)body.push(x)}const first=states[0],w=finite(first.width,355),h=finite(first.height,240),d=schedule.totalDuration,svg=['<?xml version="1.0" encoding="UTF-8"?>',`<svg id="motion-svg" viewBox="0 0 ${fmt(w)} ${fmt(h)}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Figma calibrated SVG animation" data-duration="${fmt(d)}" data-render-mode="${report.renderMode}">`,'<defs>',...defs,'</defs>',`<g id="motion-scene">${body.join("")}</g>`,'</svg>',''].join('\n');return{svg,html:html(svg,d),report,schedule}}
function compileFile(file,opt={}){return compileManifest(JSON.parse(fs.readFileSync(path.resolve(file),"utf8")),opt)}
module.exports={DEFAULTS,compileManifest,compileFile,orderStates,buildSchedule,sampleSpring,easingToSpline:easingSpline};
