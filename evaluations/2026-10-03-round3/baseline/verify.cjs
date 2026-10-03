const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
for (const task of ['a', 'b', 'c']) {
  const file = path.join(__dirname, `task-${task}.html`);
  const html = fs.readFileSync(file, 'utf8');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  for (const [index, script] of scripts.entries()) new vm.Script(script[1], { filename: `${file}:script-${index}` });
  if (!html.includes('lang="zh-CN"')) throw new Error(`Missing Chinese language: ${task}`);
  if (/<(?:script|link)[^>]+(?:src|href)="https?:/i.test(html)) throw new Error(`External dependency: ${task}`);
  console.log(`PASS task-${task}: JavaScript syntax, Chinese document language, no external scripts/styles`);
}

const assert = require('node:assert/strict');
class Element {
  constructor() { this.value = ''; this.textContent = ''; this.children = []; this.handlers = {}; this.hidden = false; this.disabled = false; this.checked = false; this.attrs = {}; this.classList = { toggle() {} }; }
  addEventListener(name, fn) { this.handlers[name] = fn; }
  replaceChildren(...children) { this.children = children; }
  append(...children) { this.children.push(...children); }
  setAttribute(name, value) { this.attrs[name] = value; }
  focus() {}
  select() {}
  setSelectionRange() {}
  querySelectorAll(tag) { return this.children.filter(child => child.tag === tag); }
  querySelector() { return this.children.find(child => !child.disabled); }
}
const storage = new Map();
let now = Date.UTC(2026, 9, 3, 4);
class ClockDate extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } }
function setup(task) {
  const elements = new Map();
  const document = {
    getElementById(key) { if (!elements.has(key)) elements.set(key, new Element()); return elements.get(key); },
    createElement(tag) { const element = new Element(); element.tag = tag; return element; },
    createTextNode(text) { return { textContent: text }; },
    execCommand() { return true; },
  };
  const context = vm.createContext({ document, Date: ClockDate, Intl, crypto: { randomUUID: () => `${now}-${Math.random()}` }, localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) }, setInterval() {}, navigator: {}, window: { isSecureContext: false } });
  const html = fs.readFileSync(path.join(__dirname, `task-${task}.html`), 'utf8');
  for (const match of html.matchAll(/\bid="([^"]+)"/g)) document.getElementById(match[1]);
  if (task === 'a') document.getElementById('indent').value = '2';
  vm.runInContext([...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1], context);
  return { run: source => vm.runInContext(source, context), elements };
}
const a = setup('a');
a.run(`input.value='{"a":[1,true,null]}'; formatJson()`);
assert.equal(a.elements.get('output').value, JSON.stringify({ a: [1, true, null] }, null, 2));
a.run(`input.value='{"a":1,}'; formatJson()`);
assert.equal(a.elements.get('output').value, '');
assert.equal(a.elements.get('copy').disabled, true);
assert.match(a.elements.get('notice').textContent, /再次点击/);
a.run(`input.value='';formatJson()`);
assert.match(a.elements.get('notice').textContent, /先粘贴/);
console.log('PASS task-a logic: valid formatting; invalid JSON removes stale output and copy; empty input gives continuation');

const b = setup('b');
assert.equal(b.run('validDate()'), true);
assert.equal(b.elements.get('slots').children.filter(slot => slot.disabled).length, 1);
const previousDate = b.elements.get('date').value;
b.run(`selectedSlot='09:00';dateInput.value=addDays(dateInput.value,1);renderSlots()`);
assert.equal(b.run('selectedSlot'), '');
b.elements.get('name').value = ' 测试来宾 ';
b.elements.get('email').value = 'demo@example.com';
b.run(`selectedSlot='10:30';document.getElementById('booking').handlers.submit({preventDefault(){}})`);
assert.equal(b.elements.get('booking').hidden, true);
assert.equal(b.elements.get('confirmation').hidden, false);
assert.equal(b.elements.get('summary-name').textContent, '测试来宾');
b.run(`dateInput.value='2026-10-03'`);
assert.equal(b.run('validDate()'), false);
console.log('PASS task-b logic: date range, one unavailable slot, date changes clear selection, demo confirmation');

const c = setup('c');
function add(name) { c.elements.get('new-name').value = name; c.run(`document.getElementById('add-form').handlers.submit({preventDefault(){}})`); now += 1; }
add('测试资料甲'); add('测试资料乙');
assert.equal(c.run('items.length'), 2);
c.elements.get('search').value = '甲';
assert.equal(c.run('visibleItems().length'), 1);
c.elements.get('search').value = '';
c.run(`items.forEach(item=>selected.add(item.id));deleteButton.handlers.click()`);
assert.equal(c.run('items.length'), 0);
assert.equal(c.run('trash[0].items.length'), 2);
now += 29000;
c.run(`undo(trash[0].id)`);
assert.equal(c.run('items.length'), 2);
assert.equal(c.run('trash.length'), 0);
c.run(`items.forEach(item=>selected.add(item.id));deleteButton.handlers.click()`);
const reloaded = setup('c');
assert.equal(reloaded.run('items.length'), 0);
assert.equal(reloaded.run('trash.length'), 1);
now += 30000;
reloaded.run(`undo(trash[0].id)`);
assert.equal(reloaded.run('items.length'), 0);
assert.equal(reloaded.run('trash.length'), 0);
assert.equal(setup('c').run('trash.length'), 0);
console.log('PASS task-c logic: add/search, batch deletion, 29-second undo, pending deletion survives reload, deadline cannot restore');
console.log('These checks use an in-memory DOM stub and simulated clock. They do not substitute for browser UI verification.');
