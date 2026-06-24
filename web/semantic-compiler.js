window.__compilerReady = (async function () {
  async function loadParts(prefix, count) {
    const arrays = [];
    let total = 0;
    for (let i = 1; i <= count; i += 1) {
      const response = await fetch(`${prefix}.part${i}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Không tải được ${prefix}.part${i}`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      arrays.push(bytes);
      total += bytes.length;
    }
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const bytes of arrays) {
      merged.set(bytes, offset);
      offset += bytes.length;
    }
    if (typeof DecompressionStream !== 'function') {
      throw new Error('Trình duyệt chưa hỗ trợ giải nén gzip.');
    }
    const stream = new Blob([merged]).stream().pipeThrough(new DecompressionStream('gzip'));
    const source = await new Response(stream).text();
    const moduleUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
    try {
      await import(moduleUrl);
    } finally {
      URL.revokeObjectURL(moduleUrl);
    }
  }
  await loadParts('semantic-compiler.js.gz', 7);
})();
