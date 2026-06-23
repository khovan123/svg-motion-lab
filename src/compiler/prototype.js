"use strict";
const { finite } = require("./utils");

function actionList(reaction) {
  if (!reaction) return [];
  if (Array.isArray(reaction.actions)) return reaction.actions;
  return reaction.action ? [reaction.action] : [];
}

function destinationOf(action) {
  return action && (action.destinationStateId || action.destinationId) || null;
}

function transitionOf(action, fallback) {
  return action && action.transition || fallback || {
    type: "SMART_ANIMATE",
    duration: 0.3,
    easing: { type: "EASE_OUT" }
  };
}

function fallbackReactions(manifest) {
  return (manifest.transitions || []).map((transition, index) => ({
    id: `legacy-${index}`,
    sourceStateId: transition.from,
    sourceNodeId: transition.sourceLayerId || transition.from,
    sourceLayerKey: null,
    trigger: transition.trigger || { type: "AFTER_TIMEOUT", timeout: 0 },
    actions: [{
      type: "NODE",
      destinationStateId: transition.to,
      destinationId: transition.to,
      navigation: transition.navigation || "NAVIGATE",
      transition: transition.transition
    }]
  }));
}

function buildPrototypeIR(manifest, states) {
  const stateIds = new Set(states.map(state => state.id));
  const prototype = manifest.prototype || {};
  const sourceReactions = Array.isArray(prototype.reactions)
    ? prototype.reactions
    : fallbackReactions(manifest);
  const reactions = sourceReactions.map((reaction, index) => ({
    id: reaction.id || `reaction-${index}`,
    sourceStateId: reaction.sourceStateId,
    sourceNodeId: reaction.sourceNodeId || null,
    sourceLayerKey: reaction.sourceLayerKey || null,
    trigger: reaction.trigger || { type: "ON_CLICK" },
    actions: actionList(reaction).map(action => ({ ...action }))
  })).filter(reaction => stateIds.has(reaction.sourceStateId));

  let startStateId = prototype.startStateId || manifest.startNodeId || states[0].id;
  if (!stateIds.has(startStateId)) startStateId = states[0].id;

  return {
    version: 1,
    startStateId,
    stateOrder: states.map(state => state.id),
    flowStartingPoints: prototype.flowStartingPoints || [],
    reactions,
    variables: prototype.variables || [],
    variableCollections: prototype.variableCollections || [],
    unsupportedActions: collectUnsupported(reactions)
  };
}

function collectUnsupported(reactions) {
  const supported = new Set(["NODE", "BACK", "CLOSE", "SET_VARIABLE", "SET_VARIABLE_MODE", "CONDITIONAL"]);
  const result = [];
  for (const reaction of reactions) {
    for (const action of reaction.actions) {
      if (action && !supported.has(action.type)) result.push({ reactionId: reaction.id, type: action.type });
    }
  }
  return result;
}

function autoReactionFor(ir, stateId) {
  return ir.reactions.find(reaction => {
    if (reaction.sourceStateId !== stateId) return false;
    if (!reaction.trigger || reaction.trigger.type !== "AFTER_TIMEOUT") return false;
    return reaction.actions.some(action => destinationOf(action));
  }) || null;
}

function nodeAction(reaction) {
  return actionList(reaction).find(action => destinationOf(action)) || null;
}

function buildAutoplay(states, ir, cfg) {
  const byId = new Map(states.map(state => [state.id, state]));
  const stateIds = [];
  const segments = [];
  const seen = new Set();
  let current = ir.startStateId;
  let cursor = 0;

  while (byId.has(current) && !seen.has(current)) {
    seen.add(current);
    stateIds.push(current);
    const reaction = autoReactionFor(ir, current);
    if (!reaction) break;
    const action = nodeAction(reaction);
    const destination = destinationOf(action);
    if (!byId.has(destination)) break;
    const hold = Math.max(0, finite(reaction.trigger.timeout, cfg.defaultHold));
    const transition = transitionOf(action);
    const duration = Math.max(0.001, finite(transition.duration, cfg.defaultDuration));
    segments.push({
      from: current,
      to: destination,
      transitionStart: cursor + hold,
      transitionEnd: cursor + hold + duration,
      duration,
      easing: transition.easing || { type: "EASE_OUT" },
      reactionId: reaction.id
    });
    cursor += hold + duration;
    current = destination;
  }

  if (!stateIds.length) stateIds.push(states[0].id);
  const looped = current === stateIds[0] && segments.length > 0;
  return {
    stateIds,
    segments,
    totalDuration: Math.max(cursor, 0.001),
    looped
  };
}

module.exports = {
  actionList,
  destinationOf,
  transitionOf,
  buildPrototypeIR,
  buildAutoplay
};
