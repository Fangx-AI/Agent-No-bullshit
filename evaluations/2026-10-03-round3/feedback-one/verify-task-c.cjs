const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname,'task-c.html'),'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]);
assert.equal(scripts.length,1);
new vm.Script(scripts[0],{filename:'task-c.html:inline-script'});
console.log('PASS JavaScript syntax: full inline script');
const script = scripts[0];
const model = script.slice(script.indexOf('// MODEL START'),script.indexOf('// MODEL END'));
function between(start,end) {
  const from = script.indexOf(start), to = script.indexOf(end,from);
  assert.ok(from >= 0 && to > from,`source section: ${start}`);
  return script.slice(from,to);
}
const persist = between('function persist(next)','function filteredItems()');
const mutation = between('function mutate(operation,onSuccess)',"ui['add-form'].addEventListener");
const expiry = between('function expire()','function mutate(operation,onSuccess)');
const invalidate = between('function invalidateRetry()','function persist(next)');
const sandbox = {assert,console};
vm.createContext(sandbox);
vm.runInContext(`${model}
let checks = 0;
function test(name,body) { body(); checks++; console.log('PASS ' + name); }
const at = 1000000;
test('blank names rejected; names trimmed; original state unchanged',() => {
  const initial = emptyState();
  assert.throws(() => addMaterial(initial,'   ',at,'a'),/请输入资料名/);
  const next = addMaterial(initial,'  第一课资料  ',at,'a');
  assert.equal(next.items[0].name,'第一课资料');
  assert.equal(initial.items.length,0);
});
test('120 character name limit and literal HTML name',() => {
  assert.throws(() => addMaterial(emptyState(),'字'.repeat(121),at,'a'),/最多/);
  const literal = '<img src=x onerror=alert(1)>';
  assert.equal(addMaterial(emptyState(),literal,at,'a').items[0].name,literal);
});
let base = addMaterial(emptyState(),'第一课资料',at,'a');
base = addMaterial(base,'第二课资料',at+1,'b');
base = addMaterial(base,'第三课资料',at+2,'c');
test('bulk delete affects only selected IDs; no duplicate deletion',() => {
  const removed = deleteMaterials(base,['a','c','a','missing'],at+10,'batch1');
  assert.equal(JSON.stringify(removed.items.map(item => item.id)),JSON.stringify(['b']));
  assert.equal(removed.pending[0].items.length,2);
  assert.equal(base.items.length,3);
});
test('undo works at 29,999 ms and restores original order',() => {
  const removed = deleteMaterials(base,['a','c'],at+10,'batch1');
  const restored = undoMaterials(removed,'batch1',at+10+29999);
  assert.equal(JSON.stringify(restored.items.map(item => item.id)),JSON.stringify(['c','b','a']));
  assert.equal(restored.pending.length,0);
});
test('undo fails at exactly 30,000 ms; expired data purged',() => {
  const removed = deleteMaterials(base,['a','c'],at+10,'batch1');
  assert.throws(() => undoMaterials(removed,'batch1',at+10+30000),/无法恢复/);
  const expired = expireBatches(removed,at+10+30000);
  assert.equal(expired.pending.length,0);
  assert.equal(JSON.stringify(expired).includes('第一课资料'),false);
  assert.equal(JSON.stringify(expired).includes('第三课资料'),false);
});
test('multiple deletion batches have independent deadlines',() => {
  let multi = deleteMaterials(base,['a'],at,'first');
  multi = deleteMaterials(multi,['b'],at+10000,'second');
  const expired = expireBatches(multi,at+30000);
  assert.equal(expired.pending.length,1);
  assert.equal(expired.pending[0].id,'second');
  assert.throws(() => undoMaterials(expired,'first',at+30000),/无法恢复/);
  const restored = undoMaterials(expired,'second',at+30000);
  assert.equal(restored.items.length,2);
});
test('undo batches in either order without duplicate IDs',() => {
  let multi = deleteMaterials(base,['a'],at,'first');
  multi = deleteMaterials(multi,['b'],at+1000,'second');
  multi = undoMaterials(multi,'first',at+2000);
  multi = undoMaterials(multi,'second',at+3000);
  assert.equal(JSON.stringify(multi.items.map(item => item.id)),JSON.stringify(['c','b','a']));
  assert.equal(new Set(multi.items.map(item => item.id)).size,3);
});
test('new material added during undo window keeps correct order',() => {
  let next = deleteMaterials(base,['b'],at,'first');
  next = addMaterial(next,'第四课资料',at+500,'d');
  next = undoMaterials(next,'first',at+1000);
  assert.equal(JSON.stringify(next.items.map(item => item.id)),JSON.stringify(['d','c','b','a']));
});
test('serialization preserves deadline across reload; expired reload stays deleted',() => {
  const removed = deleteMaterials(base,['a'],at,'first');
  const reloaded = readState(JSON.stringify(removed));
  assert.equal(reloaded.pending[0].expiresAt,at+30000);
  const expired = expireBatches(reloaded,at+30001);
  assert.equal(expired.items.some(item => item.id === 'a'),false);
  assert.equal(expired.pending.length,0);
});
test('empty, corrupt and incompatible persisted states handled',() => {
  assert.equal(readState(null).items.length,0);
  assert.throws(() => readState('{broken'));
  assert.throws(() => readState(JSON.stringify({version:2,items:[],pending:[],nextOrder:0})));
  const duplicate = {...base,items:[...base.items,base.items[0]]};
  assert.throws(() => readState(JSON.stringify(duplicate)),/记录无效/);
  const badDeadline = deleteMaterials(base,['a'],at,'bad');
  badDeadline.pending[0].expiresAt++;
  assert.throws(() => readState(JSON.stringify(badDeadline)),/删除记录无效/);
});
test('unknown batch and empty selection cannot fabricate success',() => {
  assert.throws(() => undoMaterials(base,'unknown',at),/无法恢复/);
  assert.throws(() => deleteMaterials(base,[],at,'none'),/请先勾选/);
});

// The actual storage transaction functions are tested without any browser or DOM.
const STORAGE_KEY = 'test';
let stored = null, writeFails = false, readFails = false, time = at;
const localStorage = {
  getItem() { if (readFails) throw new Error('read blocked'); return stored; },
  setItem(key,value) { if (writeFails) throw new Error('write blocked'); stored = value; }
};
const Date = {now:() => time};
let state = emptyState(), loaded = true, lastRaw = null, dirty = false, failedOperation = null;
const completed = new Map();
let error = null, rendered = 0, undoRendered = 0, announcement = '';
function clearStorageError() { error = null; }
function showStorageError(message) { error = message; }
function render() { rendered++; }
function renderUndo() { undoRendered++; }
function updateCountdowns() {}
function announce(message) { announcement = message; }
function load() { state = expireBatches(readState(stored),time); lastRaw = stored; failedOperation = null; }
${invalidate}
${persist}
${expiry}
${mutation}
function reset(next = emptyState()) { state = next; stored = null; lastRaw = null; loaded = true; dirty = false; failedOperation = null; error = null; writeFails = false; readFails = false; time = at; rendered = 0; undoRendered = 0; completed.clear(); }
test('failed save leaves state and input completion unchanged; real retry succeeds',() => {
  reset(); writeFails = true; let completedAdds = 0;
  const operation = current => addMaterial(current,'待新增资料',time,'new');
  assert.equal(mutate(operation,() => completedAdds++),false);
  assert.equal(state.items.length,0); assert.equal(stored,null); assert.equal(completedAdds,0); assert.ok(failedOperation);
  writeFails = false;
  const retry = failedOperation;
  assert.equal(mutate(retry.operation,retry.onSuccess),true);
  assert.equal(state.items.length,1); assert.equal(readState(stored).items.length,1); assert.equal(completedAdds,1); assert.equal(failedOperation,null);
});
test('input or selection change invalidates stale retry',() => {
  reset(); writeFails = true;
  mutate(current => addMaterial(current,'旧输入',time,'old'));
  assert.ok(failedOperation); invalidateRetry();
  assert.equal(failedOperation,null); assert.equal(error,null);
  writeFails = false;
  mutate(current => addMaterial(current,'新输入',time,'new'));
  assert.equal(state.items[0].name,'新输入');
});
test('failed bulk delete preserves all selected data and creates no undo record',() => {
  reset(base); persist(base); writeFails = true;
  assert.equal(mutate(current => deleteMaterials(current,['a','b'],time,'failed')),false);
  assert.equal(state.items.length,3); assert.equal(state.pending.length,0); assert.equal(readState(stored).items.length,3);
});
test('failed undo preserves deletion; retry restores real data once',() => {
  const removed = deleteMaterials(base,['a','b'],at,'undo');
  reset(removed); persist(removed); time = at+1000; writeFails = true; let success = 0;
  assert.equal(mutate(current => undoMaterials(current,'undo',time),() => success++),false);
  assert.equal(state.items.length,1); assert.equal(state.pending.length,1); assert.equal(success,0);
  writeFails = false; const retry = failedOperation;
  assert.equal(mutate(retry.operation,retry.onSuccess),true);
  assert.equal(state.items.length,3); assert.equal(state.pending.length,0); assert.equal(success,1);
});
test('expired failed undo retry cannot claim recovery',() => {
  const removed = deleteMaterials(base,['a'],at,'undo');
  reset(removed); persist(removed); time = at+1000; writeFails = true; let success = 0;
  mutate(current => undoMaterials(current,'undo',time),() => success++);
  const retry = failedOperation; writeFails = false; time = at+30000;
  assert.equal(mutate(retry.operation,retry.onSuccess),false);
  assert.equal(success,0); assert.equal(state.items.length,2); assert.equal(state.pending.length,0);
  assert.equal(completed.get('undo').type,'expired');
});
test('expiry remains final when storage cleanup fails; cleanup can retry',() => {
  const removed = deleteMaterials(base,['a'],at,'expiry');
  reset(removed); persist(removed); writeFails = true; time = at+30000; expire();
  assert.equal(state.pending.length,0); assert.equal(dirty,true); assert.equal(state.items.some(item => item.id === 'a'),false);
  assert.throws(() => undoMaterials(state,'expiry',time),/无法恢复/);
  writeFails = false; mutate(current => current);
  assert.equal(readState(stored).pending.length,0); assert.equal(dirty,false);
});
test('another tab update aborts stale mutation instead of overwriting data',() => {
  reset(); const other = addMaterial(emptyState(),'另一页面资料',at,'other'); stored = JSON.stringify(other);
  let success = 0;
  assert.equal(mutate(current => addMaterial(current,'过期页面资料',at,'stale'),() => success++),false);
  assert.equal(state.items.length,1); assert.equal(state.items[0].id,'other'); assert.equal(readState(stored).items.length,1); assert.equal(success,0);
});
console.log('Pure logic and storage transaction checks: ' + checks + ' passed.');
`,sandbox,{filename:'task-c:pure-logic-and-storage-tests'});
assert.ok(html.includes('删除后可在 30 秒内撤销，超时无法恢复。'));
assert.ok(!/<(?:script|link)[^>]+(?:src|href)=/i.test(html),'single file must not load external assets');
assert.ok(script.includes('name.textContent = item.name'),'material names rendered as text');
assert.ok(script.includes("ui.search.addEventListener('input',renderList)"),'search updates rendered results');
console.log('PASS Static requirements: pre-delete consequence, text-safe names, reactive search, no external assets');
console.log('Browser interactions and visual layout: not tested here; assigned to the main agent.');
