const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Simple Blockchain ---
class Block {
  constructor(index, timestamp, data, previousHash = '', nonce = 0) {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.nonce = nonce;
    this.hash = this.computeHash();
  }

  computeHash() {
    return crypto.createHash('sha256')
      .update(this.index + this.previousHash + this.timestamp + JSON.stringify(this.data) + this.nonce)
      .digest('hex');
  }

  mine(difficulty) {
    const target = '0'.repeat(difficulty);
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.computeHash();
    }
    return this.hash;
  }
}

class Blockchain {
  constructor(difficulty = 3) {
    this.chain = [this.createGenesis()];
    this.difficulty = difficulty;
  }

  createGenesis() {
    return new Block(0, new Date().toISOString(), { info: 'genesis block' }, '0');
  }

  getLatest() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(newBlock) {
    newBlock.previousHash = this.getLatest().hash;
    newBlock.hash = newBlock.computeHash();
    // mine according to difficulty
    newBlock.mine(this.difficulty);
    this.chain.push(newBlock);
  }

  isValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const cur = this.chain[i];
      const prev = this.chain[i - 1];
      if (cur.hash !== cur.computeHash()) return false;
      if (cur.previousHash !== prev.hash) return false;
    }
    return true;
  }
}

const blockchain = new Blockchain(3);

// --- API ---
app.get('/api/chain', (req, res) => {
  res.json({ chain: blockchain.chain, valid: blockchain.isValid() });
});

app.post('/api/mine', (req, res) => {
  const { data } = req.body || {};
  const index = blockchain.chain.length;
  const blockData = data || { tx: `sample transaction ${index}`, timestamp: new Date().toISOString() };
  const newBlock = new Block(index, new Date().toISOString(), blockData);
  const start = Date.now();
  blockchain.addBlock(newBlock);
  const elapsed = Date.now() - start;
  res.json({ success: true, minedBlock: newBlock, timeMs: elapsed });
});

app.post('/api/set-difficulty', (req, res) => {
  const { difficulty } = req.body || {};
  const d = parseInt(difficulty);
  if (isNaN(d) || d < 0 || d > 6) return res.status(400).json({ error: 'difficulty must be number 0-6' });
  blockchain.difficulty = d;
  res.json({ success: true, difficulty: blockchain.difficulty });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Toy Blockchain Explorer running on http://localhost:${PORT}`));
