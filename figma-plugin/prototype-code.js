figma.showUI(__html__, { width: 420, height: 360, themeColors: true });

const pendingMessages = [];
const bootstrapHandler = async message => {
  if (message && message.type === "install-exporter") {
    try {
      (0, eval)(message.source + "\n;figma.ui.onmessage = globalThis.__exporterHandler;");
      if (figma.ui.onmessage === bootstrapHandler) {
        throw new Error("Exporter runtime không hợp lệ: handler chưa được cài đặt.");
      }
      figma.ui.postMessage({ type: "ready" });
      while (pendingMessages.length) await figma.ui.onmessage(pendingMessages.shift());
    } catch (error) {
      figma.ui.postMessage({ type: "error", message: error && error.message ? error.message : String(error) });
    }
    return;
  }
  pendingMessages.push(message);
};

figma.ui.onmessage = bootstrapHandler;
