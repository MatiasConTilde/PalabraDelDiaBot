const config = require('./config.js')

const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(config.API_KEY, {
  polling: true
});

const request = require('request');

const schedule = require('node-schedule');
let schedules = {};

const fs = require('fs');

bot.onText(/^(\/start|\/help)/, msg => bot.sendMessage(msg.chat.id, 'Este bot manda la palabra del día cuando escribes /palabra. Para recibir la palabra del día cada día, manda /suscribir y /cancelar para cancelar tu suscripción.'));

const sendWord = id => {
  request('http://dle.rae.es/srv/wotd', (err, res, body) => {
    const word = /(">)(.+)(\.<\/a>)/.exec(body)[2];
    const link = /(<a href=")(.+)(">)/.exec(body)[2];
    bot.sendMessage(id, `La palabra del día de hoy es [${word}](http://dle.rae.es/?${link})`, {
      parse_mode: 'Markdown'
    });
  });
};

bot.onText(/^\/palabra/, msg => sendWord(msg.chat.id));

bot.onText(/^\/suscribir/, msg => bot.sendMessage(msg.chat.id, 'Vale, ahora manda la hora'));

bot.onText(/^[0-2]?[0-9]:[0-5][0-9]$/, (msg, match) => {
  let times = JSON.parse(fs.readFileSync('db.json').toString());
  times[msg.chat.id] = match.input;
  fs.writeFileSync('db.json', JSON.stringify(times));

  startSchedule(msg.chat.id, match.input);

  bot.sendMessage(msg.chat.id, 'Vale, el tiempo se ha registrado');
});

bot.onText(/^\/cancelar/, msg => {
  let times = JSON.parse(fs.readFileSync('db.json').toString());
  if (times[msg.chat.id]) delete times[msg.chat.id];
  fs.writeFileSync('db.json', JSON.stringify(times));

  if (schedules[msg.chat.id]) {
    schedules[msg.chat.id].cancel();
    delete schedules[msg.chat.id];
    bot.sendMessage(msg.chat.id, 'Vale, ya no recibirás más palabras del día diarias');
  } else {
    bot.sendMessage(msg.chat.id, 'Ni si quiera estás suscrito lol');
  }
});

const startSchedule = (id, time) => {
  const colonIndex = time.indexOf(':');

  const rule = new schedule.RecurrenceRule();
  rule.hour = Number(time.substr(0, colonIndex));
  rule.minute = Number(time.substr(colonIndex + 1));

  if (schedules[id]) {
    schedules[id].reschedule(rule);
  } else {
    schedules[id] = schedule.scheduleJob(rule, sendWord.bind(null, id));
  }
};

const times = JSON.parse(fs.readFileSync('db.json').toString());
for (let id in times) {
  startSchedule(id, times[id]);
}
