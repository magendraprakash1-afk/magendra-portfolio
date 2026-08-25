const fs = require('fs');
const vm = require('vm');
const path = require('path');

const scriptPath = path.resolve(__dirname, '../shared/data-store.js');
const script = fs.readFileSync(scriptPath, 'utf8');

const localStorage = {
  store: {},
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  },
  setItem(key, value) {
    this.store[key] = String(value);
  },
  removeItem(key) {
    delete this.store[key];
  }
};

const CustomEventStub = class CustomEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.detail = options.detail;
  }
};

const windowObj = { dispatchEvent() {} };

global.window = windowObj;
global.localStorage = localStorage;
global.CustomEvent = CustomEventStub;
vm.runInNewContext(script, {
  window: windowObj,
  localStorage,
  console,
  JSON,
  Date,
  setTimeout,
  clearTimeout,
  CustomEvent: CustomEventStub
});

localStorage.setItem('portfolio_data', JSON.stringify({ profile: { name: 'Updated Name' } }));
const data = windowObj.PortfolioStore.getPublishedData();
console.log(JSON.stringify({ name: data.profile.name, title: data.profile.title }));
if (data.profile.title !== 'AI Founder & Builder') {
  throw new Error('Default portfolio fields were lost after partial data save');
}
