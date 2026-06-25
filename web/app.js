window.__compilerReady.then(async function () {
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Không tải được ' + src));
      document.head.appendChild(script);
    });
  }
  await loadScript('semantic-11.js');
  await loadScript('semantic-12.js');
  await loadScript('semantic-13.js');
  await loadScript('semantic-14.js');
  await loadScript('semantic-15.js');
  await loadScript('app-core.js');
  await loadScript('app-actions-hybrid.js');
}).catch(function (error) {
  const status = document.querySelector('#status');
  if (status) status.textContent = 'Khởi tạo ứng dụng lỗi: ' + error.message;
});
