const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const indexPath = path.join(root, 'docs', 'index.html');
const cssPath = path.join(root, 'docs', 'css', 'styles.css');
const jsPath = path.join(root, 'docs', 'js', 'game.js');

for (const filePath of [indexPath, cssPath, jsPath]) {
  assert.ok(fs.existsSync(filePath), `${filePath} should exist`);
}

const index = fs.readFileSync(indexPath, 'utf8');
assert.ok(index.includes('<script src="./js/game.js"></script>'), 'index should load the static game script');
assert.ok(index.includes('<link rel="stylesheet" href="./css/styles.css">'), 'index should load relative static CSS');
assert.ok(!index.includes('/socket.io/'), 'static build must not reference Socket.io');
assert.ok(!index.includes('http://localhost'), 'static build must not reference localhost');

const js = fs.readFileSync(jsPath, 'utf8');
assert.ok(!js.includes('io('), 'static game must not create a Socket.io client');
assert.ok(js.includes('CUSTOMER_SPAWN_MS'), 'static game should include local customer spawning');

console.log('static-build.test.js passed');
