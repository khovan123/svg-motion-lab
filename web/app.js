window.__compilerReady.then(async function () {
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src + '?v=' + Date.now();
      script.onload = resolve;
      script.onerror = () => reject(new Error('Không tải được ' + src));
      document.head.appendChild(script);
    });
  }
  for (const src of ['semantic-11.js','semantic-12.js','semantic-15.js','semantic-13.js','semantic-14.js','semantic-16.js','semantic-runtime-fix.js','app-core.js','app-actions-hybrid.js']) {
    await loadScript(src);
  }
}).catch(function (error) {
  const status = document.querySelector('#status');
  if (status) status.textContent = 'Khởi tạo ứng dụng lỗi: ' + error.message;
});
