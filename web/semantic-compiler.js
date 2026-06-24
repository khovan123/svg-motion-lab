window.__compilerReady = (async function () {
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Không tải được ${src}`));
      document.head.appendChild(script);
    });
  }
  for (let index = 1; index <= 8; index += 1) {
    await loadScript(`semantic-${index}.js`);
  }
})();
