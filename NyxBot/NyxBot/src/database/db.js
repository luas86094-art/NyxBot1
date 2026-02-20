import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Database {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
    this.files = {
      users: 'users.json',
      groups: 'groups.json',
      pets: 'pets.json',
      shop: 'shop.json',
      blacklist: 'blacklist.json',
      settings: 'settings.json',
      teamranks: 'teamranks.json',
      afk: 'afk.json',
      rewards: 'rewards.json',
      sessions: 'sessions.json',
      joinRequests: 'joinRequests.json',
      linkAllowances: 'linkAllowances.json',
      messageDesign: 'messageDesign.json',
      commandTexts: 'commandTexts.json',
      viewOnceMessages: 'viewOnceMessages.json',
      warnings: 'warnings.json',
      groupWarnSettings: 'groupWarnSettings.json',
      tasks: 'tasks.json'
    };
    
    this.initializeFiles();
  }

  initializeFiles() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    Object.entries(this.files).forEach(([key, filename]) => {
      const filepath = path.join(this.dataDir, filename);
      if (!fs.existsSync(filepath)) {
        const initialData = this.getInitialData(key);
        fs.writeFileSync(filepath, JSON.stringify(initialData, null, 2));
      }
    });
  }

  getInitialData(type) {
    const defaults = {
      users: {},
      groups: {},
      pets: {},
      shop: {
        items: [
          { id: 'dog_food', name: 'Dog Food', price: 50, category: 'pet' },
          { id: 'cat_food', name: 'Cat Food', price: 50, category: 'pet' },
          { id: 'bird_food', name: 'Bird Food', price: 30, category: 'pet' },
          { id: 'fish_food', name: 'Fish Food', price: 25, category: 'pet' },
          { id: 'dog', name: 'Dog', price: 500, category: 'pet_purchase' },
          { id: 'cat', name: 'Cat', price: 450, category: 'pet_purchase' },
          { id: 'bird', name: 'Bird', price: 300, category: 'pet_purchase' },
          { id: 'fish', name: 'Fish', price: 200, category: 'pet_purchase' }
        ]
      },
      blacklist: [],
      settings: {
        owner: '12297281611',
        ownerLid: '78808992460905',
        botName: 'NyxBot🐍',
        defaultLanguage: 'en',
        defaultPrefix: '/'
      },
      teamranks: {
        ranks: ['Supporter', 'Moderator', 'Hoster', 'Programmierer', 'Designer', 'Manager', 'Tester', 'Owner', 'Over Owner']
      },
      messageDesign: {
        global: {
          header: '',
          footer: '> NyxBot🐍',
          template: null
        },
        commands: {}
      },
      commandTexts: {},
      viewOnceMessages: {},
      warnings: {},
      groupWarnSettings: {},
      afk: {},
      rewards: {},
      sessions: {},
      joinRequests: {},
      linkAllowances: {},
      tasks: {
        list: []
      }
    };
    return defaults[type] || {};
  }

  read(type) {
    const filepath = path.join(this.dataDir, this.files[type]);
    try {
      if (!fs.existsSync(filepath)) {
        return this.getInitialData(type);
      }
      const content = fs.readFileSync(filepath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`Error reading ${type}:`, error);
      return this.getInitialData(type);
    }
  }

  write(type, data) {
    const filepath = path.join(this.dataDir, this.files[type]);
    try {
      fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(`Error writing ${type}:`, error);
      return false;
    }
  }

  getUser(lid) {
    const users = this.read('users');
    if (!users[lid]) {
      users[lid] = {
        lid,
        registered: false,
        name: '',
        age: 0,
        level: 1,
        xp: 0,
        money: 100,
        inventory: [],
        pets: [],
        teamRanks: [],
        vip: false,
        registeredAt: null,
        lastDaily: null,
        lastWeekly: null,
        lastMonthly: null,
        lastYearly: null,
        lastBonus: null,
        stats: {
          messages: 0,
          commands: 0
        }
      };
      this.write('users', users);
    }
    if (users[lid].vip === undefined) {
      users[lid].vip = false;
    }
    
    if (users[lid].teamRank !== undefined) {
      if (users[lid].teamRank === null) {
        users[lid].teamRanks = [];
      } else {
        users[lid].teamRanks = [users[lid].teamRank];
      }
      delete users[lid].teamRank;
      this.write('users', users);
    }
    
    if (users[lid].teamRanks === undefined) {
      users[lid].teamRanks = [];
      this.write('users', users);
    }
    
    return users[lid];
  }

  updateUser(lid, data) {
    const users = this.read('users');
    users[lid] = { ...users[lid], ...data };
    this.write('users', users);
    return users[lid];
  }

  getGroup(groupId) {
    const groups = this.read('groups');
    if (!groups[groupId]) {
      groups[groupId] = {
        id: groupId,
        prefix: '/',
        language: 'en',
        welcome: {
          enabled: false,
          message: 'Welcome @user to the group!'
        },
        goodbye: {
          enabled: false,
          message: 'Goodbye @user!'
        },
        kick: {
          enabled: false,
          message: '@user was kicked!'
        },
        antilink: false
      };
      this.write('groups', groups);
    }
    return groups[groupId];
  }

  updateGroup(groupId, data) {
    const groups = this.read('groups');
    groups[groupId] = { ...groups[groupId], ...data };
    this.write('groups', groups);
    return groups[groupId];
  }

  addXP(lid, amount) {
    const user = this.getUser(lid);
    user.xp += amount;
    
    const xpNeeded = user.level * 100;
    if (user.xp >= xpNeeded) {
      user.level += 1;
      user.xp = user.xp - xpNeeded;
      user.money += user.level * 50;
    }
    
    this.updateUser(lid, user);
    return user;
  }

  isBlacklisted(phoneNumber) {
    const blacklist = this.read('blacklist');
    return blacklist.includes(phoneNumber);
  }

  addToBlacklist(phoneNumber) {
    const blacklist = this.read('blacklist');
    if (!blacklist.includes(phoneNumber)) {
      blacklist.push(phoneNumber);
      this.write('blacklist', blacklist);
    }
  }

  removeFromBlacklist(phoneNumber) {
    let blacklist = this.read('blacklist');
    blacklist = blacklist.filter(num => num !== phoneNumber);
    this.write('blacklist', blacklist);
  }

  getSettings() {
    return this.read('settings');
  }

  getPet(lid) {
    const pets = this.read('pets');
    return pets[lid] || null;
  }

  updatePet(lid, petData) {
    const pets = this.read('pets');
    pets[lid] = petData;
    this.write('pets', pets);
  }

  getLinkAllowance(groupId, lid) {
    const allowances = this.read('linkAllowances');
    const key = `${groupId}_${lid}`;
    return allowances[key] || 0;
  }

  setLinkAllowance(groupId, lid, amount) {
    const allowances = this.read('linkAllowances');
    const key = `${groupId}_${lid}`;
    allowances[key] = amount;
    this.write('linkAllowances', allowances);
  }

  decreaseLinkAllowance(groupId, lid) {
    const allowances = this.read('linkAllowances');
    const key = `${groupId}_${lid}`;
    if (allowances[key] && allowances[key] > 0) {
      allowances[key] -= 1;
      this.write('linkAllowances', allowances);
      return allowances[key];
    }
    return 0;
  }

  getGroupJoinRequests(groupId) {
    const joinRequests = this.read('joinRequests');
    if (!joinRequests[groupId]) {
      joinRequests[groupId] = [];
      this.write('joinRequests', joinRequests);
    }
    return joinRequests[groupId];
  }

  addGroupJoinRequest(groupId, requestData) {
    const joinRequests = this.read('joinRequests');
    if (!joinRequests[groupId]) {
      joinRequests[groupId] = [];
    }
    joinRequests[groupId].push(requestData);
    this.write('joinRequests', joinRequests);
  }

  removeGroupJoinRequest(groupId, phoneNumber) {
    const joinRequests = this.read('joinRequests');
    if (joinRequests[groupId]) {
      joinRequests[groupId] = joinRequests[groupId].filter(
        r => r.phoneNumber !== phoneNumber
      );
      this.write('joinRequests', joinRequests);
    }
  }

  clearGroupJoinRequests(groupId) {
    const joinRequests = this.read('joinRequests');
    if (joinRequests[groupId]) {
      joinRequests[groupId] = [];
      this.write('joinRequests', joinRequests);
    }
  }

  getMessageDesign() {
    const design = this.read('messageDesign');
    if (typeof design.global === 'string') {
      return {
        header: '',
        footer: design.global,
        template: null
      };
    }
    return design.global;
  }

  setMessageDesign(type, text) {
    const design = this.read('messageDesign');
    if (typeof design.global === 'string') {
      design.global = {
        header: '',
        footer: design.global,
        template: null
      };
    }
    
    if (type === 'header') {
      design.global.header = text;
      design.global.template = null;
    } else if (type === 'footer') {
      design.global.footer = text;
      design.global.template = null;
    } else if (type === 'template') {
      design.global.template = text;
    }
    
    this.write('messageDesign', design);
  }

  resetMessageDesign() {
    const design = this.read('messageDesign');
    design.global = {
      header: '',
      footer: '> NyxBot🐍',
      template: null
    };
    this.write('messageDesign', design);
  }

  getCommandDesign(commandName, chatId) {
    const design = this.read('messageDesign');
    const key = chatId ? `${chatId}_${commandName}` : commandName;
    return design.commands[key] || null;
  }

  setCommandDesign(commandName, type, text, chatId = null) {
    const design = this.read('messageDesign');
    const key = chatId ? `${chatId}_${commandName}` : commandName;
    
    if (!design.commands[key]) {
      design.commands[key] = {
        header: '',
        footer: '',
        template: null
      };
    }
    
    if (typeof design.commands[key] === 'string') {
      design.commands[key] = {
        header: '',
        footer: design.commands[key],
        template: null
      };
    }
    
    if (type === 'header') {
      design.commands[key].header = text;
      design.commands[key].template = null;
    } else if (type === 'footer') {
      design.commands[key].footer = text;
      design.commands[key].template = null;
    } else if (type === 'template') {
      design.commands[key].template = text;
    }
    
    this.write('messageDesign', design);
  }

  removeCommandDesign(commandName, chatId = null) {
    const design = this.read('messageDesign');
    const key = chatId ? `${chatId}_${commandName}` : commandName;
    delete design.commands[key];
    this.write('messageDesign', design);
  }

  getCommandText(commandName) {
    const texts = this.read('commandTexts');
    return texts[commandName] || null;
  }

  setCommandText(commandName, text) {
    const texts = this.read('commandTexts');
    texts[commandName] = text;
    this.write('commandTexts', texts);
  }

  removeCommandText(commandName) {
    const texts = this.read('commandTexts');
    delete texts[commandName];
    this.write('commandTexts', texts);
  }

  saveViewOnceMessage(messageId, data) {
    const messages = this.read('viewOnceMessages');
    messages[messageId] = {
      ...data,
      savedAt: Date.now()
    };
    this.write('viewOnceMessages', messages);
  }

  getViewOnceMessage(messageId) {
    const messages = this.read('viewOnceMessages');
    return messages[messageId] || null;
  }

  cleanupOldViewOnceMessages() {
    const messages = this.read('viewOnceMessages');
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    
    Object.keys(messages).forEach(key => {
      if (now - messages[key].savedAt > maxAge) {
        delete messages[key];
      }
    });
    
    this.write('viewOnceMessages', messages);
  }

  addWarning(chatId, phoneNumber, reason = '') {
    const warnings = this.read('warnings');
    if (!warnings[chatId]) {
      warnings[chatId] = {};
    }
    if (!warnings[chatId][phoneNumber]) {
      warnings[chatId][phoneNumber] = {
        count: 0,
        reasons: [],
        lastWarned: null
      };
    }
    
    warnings[chatId][phoneNumber].count++;
    warnings[chatId][phoneNumber].reasons.push({
      reason,
      timestamp: Date.now()
    });
    warnings[chatId][phoneNumber].lastWarned = Date.now();
    
    this.write('warnings', warnings);
    return warnings[chatId][phoneNumber].count;
  }

  getWarnings(chatId, phoneNumber = null) {
    const warnings = this.read('warnings');
    if (!warnings[chatId]) return phoneNumber ? null : {};
    if (phoneNumber) {
      return warnings[chatId][phoneNumber] || null;
    }
    return warnings[chatId];
  }

  removeWarnings(chatId, phoneNumber, amount = null) {
    const warnings = this.read('warnings');
    if (!warnings[chatId] || !warnings[chatId][phoneNumber]) {
      return false;
    }

    if (amount === null || amount >= warnings[chatId][phoneNumber].count) {
      delete warnings[chatId][phoneNumber];
    } else {
      warnings[chatId][phoneNumber].count -= amount;
      warnings[chatId][phoneNumber].reasons = warnings[chatId][phoneNumber].reasons.slice(amount);
    }

    this.write('warnings', warnings);
    return true;
  }

  setGroupWarnLimit(chatId, limit) {
    const settings = this.read('groupWarnSettings');
    settings[chatId] = limit;
    this.write('groupWarnSettings', settings);
  }

  getGroupWarnLimit(chatId) {
    const settings = this.read('groupWarnSettings');
    return settings[chatId] || 3;
  }
}

export default new Database();
