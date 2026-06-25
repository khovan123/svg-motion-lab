window.__compilerReady = (async function () {
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Không tải được ' + src));
      document.head.appendChild(script);
    });
  }

  async function loadPatchedSemantic8() {
    const response = await fetch('semantic-8.js', { cache: 'no-store' });
    if (!response.ok) throw new Error('Không tải được semantic-8.js');
    const source = await response.text();
    const expected = 'parsed=states.map(parseSvg)';
    const replacement = 'parsed=states.map(state=>parseSvg(state.svg,state))';
    if (!source.includes(expected)) {
      throw new Error('Không tìm thấy điểm vá parser trong semantic-8.js');
    }
    const script = document.createElement('script');
    script.textContent = source.replace(expected, replacement);
    document.head.appendChild(script);
  }

  for (let index = 1; index <= 9; index += 1) {
    if (index === 8) await loadPatchedSemantic8();
    else await loadScript('semantic-' + index + '.js');
  }
})();
