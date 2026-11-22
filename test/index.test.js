import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Slave } from '../node.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workerPath = join(__dirname, 'worker.js');

let slave;

test('setup', async () => {
  slave = new Slave(workerPath);
});

test('GET with param', async () => {
  const res = await slave.fetch('/hello/world', { method: 'GET' });
  assert.equal(res.body, 'hello world');
});

test('POST with body', async () => {
  const res = await slave.fetch('/echo', { method: 'POST', body: { msg: 'hi' } });
  assert.deepEqual(res.body, { msg: 'hi' });
});

test('GET with multiple params', async () => {
  const res = await slave.fetch('/sum/3/4', { method: 'GET' });
  assert.equal(res.body, 7);
});

test('kill rejects pending', async () => {
  const p = slave.fetch('/hello/never');
  slave.kill();
  await assert.rejects(p, /worker terminated/);
});

test('fetch after kill throws', () => {
  assert.throws(() => slave.fetch('/x'), /not a function/);
});