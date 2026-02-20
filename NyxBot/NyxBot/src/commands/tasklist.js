import { formatMessage, isOwner } from '../utils/helpers.js';
import db from '../database/db.js';

export default {
  name: 'tasklist',
  registrationRequired: false,
  description: 'Manage owner tasks (owner only)',
  
  async execute({ sock, chatId, phoneNumber, args, lang }) {
    if (!isOwner(lid, phoneNumber)) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Nur der Owner kann diesen Befehl nutzen!' :
          '❌ Only the owner can use this command!', 'tasklist', chatId)
      });
      return;
    }

    const tasks = db.read('tasks');
    const subcommand = args[0]?.toLowerCase();

    if (subcommand === 'add') {
      const description = args.slice(1).join(' ');
      if (!description) {
        await sock.sendMessage(chatId, {
          text: formatMessage(lang === 'de' ? 
            '❌ Nutze: .tasklist add [beschreibung]' :
            '❌ Use: .tasklist add [description]', 'tasklist', chatId)
        });
        return;
      }

      const newTask = {
        id: Date.now(),
        description,
        done: false,
        createdAt: new Date().toISOString()
      };

      tasks.list.push(newTask);
      db.write('tasks', tasks);

      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `✅ Task hinzugefügt!\n\n📋 #${tasks.list.length}: ${description}` :
          `✅ Task added!\n\n📋 #${tasks.list.length}: ${description}`, 'tasklist', chatId)
      });
      return;
    }

    if (subcommand === 'done') {
      const taskNumber = parseInt(args[1]);
      if (isNaN(taskNumber) || taskNumber < 1 || taskNumber > tasks.list.length) {
        await sock.sendMessage(chatId, {
          text: formatMessage(lang === 'de' ? 
            '❌ Ungültige Task-Nummer!' :
            '❌ Invalid task number!', 'tasklist', chatId)
        });
        return;
      }

      tasks.list[taskNumber - 1].done = true;
      db.write('tasks', tasks);

      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `✅ Task #${taskNumber} als erledigt markiert!` :
          `✅ Task #${taskNumber} marked as done!`, 'tasklist', chatId)
      });
      return;
    }

    if (subcommand === 'remove') {
      const taskNumber = parseInt(args[1]);
      if (isNaN(taskNumber) || taskNumber < 1 || taskNumber > tasks.list.length) {
        await sock.sendMessage(chatId, {
          text: formatMessage(lang === 'de' ? 
            '❌ Ungültige Task-Nummer!' :
            '❌ Invalid task number!', 'tasklist', chatId)
        });
        return;
      }

      const removed = tasks.list.splice(taskNumber - 1, 1)[0];
      db.write('tasks', tasks);

      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `🗑️ Task entfernt: ${removed.description}` :
          `🗑️ Task removed: ${removed.description}`, 'tasklist', chatId)
      });
      return;
    }

    if (subcommand === 'clear') {
      const doneTasks = tasks.list.filter(t => t.done);
      tasks.list = tasks.list.filter(t => !t.done);
      db.write('tasks', tasks);

      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `🗑️ ${doneTasks.length} erledigte Tasks gelöscht!` :
          `🗑️ ${doneTasks.length} completed tasks deleted!`, 'tasklist', chatId)
      });
      return;
    }

    if (tasks.list.length === 0) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '📋 *Taskliste*\n\nKeine Tasks vorhanden!\n\n*Befehle:*\n.tasklist add [beschreibung] - Task hinzufügen\n.tasklist done [nummer] - Task erledigen\n.tasklist remove [nummer] - Task löschen\n.tasklist clear - Erledigte löschen' :
          '📋 *Task List*\n\nNo tasks available!\n\n*Commands:*\n.tasklist add [description] - Add task\n.tasklist done [number] - Mark done\n.tasklist remove [number] - Remove task\n.tasklist clear - Clear completed', 'tasklist', chatId)
      });
      return;
    }

    let taskText = lang === 'de' ? '📋 *Taskliste*\n\n' : '📋 *Task List*\n\n';
    
    tasks.list.forEach((task, index) => {
      const status = task.done ? '✅' : '⬜';
      const strikethrough = task.done ? '~' : '';
      taskText += `${status} #${index + 1}: ${strikethrough}${task.description}${strikethrough}\n`;
    });

    const pendingCount = tasks.list.filter(t => !t.done).length;
    const doneCount = tasks.list.filter(t => t.done).length;

    taskText += lang === 'de' ? 
      `\n📊 ${pendingCount} offen, ${doneCount} erledigt\n\n*Befehle:*\n.tasklist add [text]\n.tasklist done [nr]\n.tasklist remove [nr]\n.tasklist clear` :
      `\n📊 ${pendingCount} pending, ${doneCount} done\n\n*Commands:*\n.tasklist add [text]\n.tasklist done [nr]\n.tasklist remove [nr]\n.tasklist clear`;

    await sock.sendMessage(chatId, {
      text: formatMessage(taskText, 'tasklist', chatId)
    });
  }
};
