const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');
const folder = path.join(__dirname, 'current');
for (const file of ['task-a.html', 'task-b.html', 'task-c.html']) {
  const html = fs.readFileSync(path.join(folder, file), 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  new Function(script);
  console.log(file + ': JavaScript syntax OK');
}
const source = fs.readFileSync(path.join(folder, 'task-c.html'), 'utf8');
const pure = source.match(/^function (?:planDeletion|planRestore|planExpiry)\(.*$/gm).join('\n');
const { planDeletion, planRestore, planExpiry } = new Function(pure + '\nreturn {planDeletion,planRestore,planExpiry};')();
let checks = 0;
function check(name, test) { test(); checks++; console.log('PASS ' + name); }
const originals = [{ id: 'a', name: '第一课', order: 1 }, { id: 'b', name: '第二课', order: 2 }, { id: 'c', name: '第三课', order: 3 }];
const base = { items: originals, pending: [] };
const deleted = planDeletion(base, new Set(['a', 'c']), 1000, 'group-1');
check('只删除选中的资料，原状态不变', () => {
  assert.deepEqual(deleted.items.map(item => item.id), ['b']);
  assert.deepEqual(base.items.map(item => item.id), ['a', 'b', 'c']);
  assert.deepEqual(deleted.pending[0].items.map(item => item.id), ['a', 'c']);
});
check('30 秒期限的边界准确', () => {
  assert.equal(deleted.pending[0].expires, 31000);
  assert.ok(planRestore(deleted, 'group-1', 30999));
  assert.equal(planRestore(deleted, 'group-1', 31000), null);
  assert.equal(planRestore(deleted, 'group-1', 31001), null);
});
check('撤销保留删除后新增的资料与原顺序', () => {
  const augmented = { items: deleted.items.concat({ id: 'd', name: '新课', order: 4 }), pending: deleted.pending };
  const restored = planRestore(augmented, 'group-1', 1200);
  assert.deepEqual(restored.items.slice().sort((a, b) => a.order - b.order).map(item => item.id), ['a', 'b', 'c', 'd']);
  assert.equal(restored.pending.length, 0);
});
check('多次删除分别撤销，互不覆盖', () => {
  const twice = planDeletion(deleted, new Set(['b']), 2000, 'group-2');
  const restored = planRestore(twice, 'group-1', 2500);
  assert.deepEqual(restored.items.map(item => item.id), ['a', 'c']);
  assert.deepEqual(restored.pending.map(group => group.id), ['group-2']);
  assert.deepEqual(planRestore(restored, 'group-2', 2600).items.map(item => item.id).sort(), ['a', 'b', 'c']);
});
check('到期只清除过期撤销组，保留其他组和现有资料', () => {
  const twice = planDeletion(deleted, new Set(['b']), 2000, 'group-2');
  const expired = planExpiry(twice, 31000);
  assert.deepEqual(expired.pending.map(group => group.id), ['group-2']);
  assert.equal(expired.items, twice.items);
  assert.equal(planRestore(expired, 'group-1', 31000), null);
});
check('序列化后保留剩余撤销期限', () => {
  const loaded = JSON.parse(JSON.stringify(deleted));
  assert.ok(planRestore(loaded, 'group-1', 20000));
  assert.equal(planRestore(loaded, 'group-1', 31000), null);
});
check('撤销不重复插入已有同 ID 资料', () => {
  const duplicate = { items: deleted.items.concat(originals[0]), pending: deleted.pending };
  assert.equal(planRestore(duplicate, 'group-1', 1200).items.filter(item => item.id === 'a').length, 1);
});
console.log(checks + ' course data checks passed.');
