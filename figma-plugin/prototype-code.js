figma.showUI(__html__, { width: 420, height: 360, themeColors: true });

const pendingMessages = [];
let exporterHandler = null;

figma.ui.onmessage = async message => {
  if (message && message.type === "install-exporter") {
    try {
      (0, eval)(message.source);
      exporterHandler = globalThis.__exporterHandler;
      if (typeof exporterHandler !== "function") throw new Error("Exporter runtime không hợp lệ.");
      figma.ui.onmessage = exporterHandler;
      figma.ui.postMessage({ type: "ready" });
      while (pendingMessages.length) await exporterHandler(pendingMessages.shift());
    } catch (error) {
      figma.ui.postMessage({ type: "error", message: error && error.message ? error.message : String(error) });
    }
    return;
  }
  pendingMessages.push(message);
};
