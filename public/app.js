async function fetchChain() {
  const r = await fetch('/api/chain');
  return r.json();
}

function renderChain(data) {
  const container = document.getElementById('blocks');
  container.innerHTML = '';
  data.chain.forEach(block => {
    const el = document.createElement('div');
    el.className = 'card block';
    el.innerHTML = `
      <strong>Block #${block.index}</strong> <span class="small">(${new Date(block.timestamp).toLocaleString()})</span>
      <div class="small">prev: ${block.previousHash.slice(0,20)}...</div>
      <div class="small">hash: ${block.hash.slice(0,40)}...</div>
      <pre>${JSON.stringify(block.data, null, 2)}</pre>
      <div class="small">nonce: ${block.nonce}</div>
    `;
    container.appendChild(el);
  });
  document.getElementById('info').innerText = `Chain length: ${data.chain.length} — valid: ${data.valid}`;
}

async function refresh() {
  const d = await fetchChain();
  renderChain(d);
}

document.getElementById('refreshBtn').addEventListener('click', refresh);
document.getElementById('mineBtn').addEventListener('click', async () => {
  const raw = document.getElementById('dataInput').value.trim();
  let payload;
  try {
    payload = raw ? JSON.parse(raw) : undefined;
  } catch (e) {
    alert('Invalid JSON in data field');
    return;
  }
  const diff = parseInt(document.getElementById('difficulty').value);
  await fetch('/api/set-difficulty', {
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({difficulty: diff})
  });

  const res = await fetch('/api/mine', {
    method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({data: payload})
  });
  const result = await res.json();
  if (result.success) {
    alert(`Mined block #${result.minedBlock.index} in ${result.timeMs} ms`);
    refresh();
  } else {
    alert('Mining failed');
  }
});

window.addEventListener('load', refresh);
