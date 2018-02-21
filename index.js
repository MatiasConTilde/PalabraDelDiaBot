const config = require('./config.js')

const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(config.API_KEY, {
  polling: true
});

const request = require('request');

const schedule = require('node-schedule');
let schedules = {};

bot.onText(/^(\/start|\/help)$/, msg => {
  bot.sendMessage(msg.chat.id, 'Este bot manda la palabra del día cuando escribes /palabra. Para recibir la palabra del día cada día, manda /suscribir y /cancelar para cancelar tu suscripción.');
});

const sendWord = id => {
  request('http://dle.rae.es/srv/wotd', (err, res, body) => {
    const word = /(">)(.+)(\.<\/a>)/.exec(body)[2];
    const link = /(<a href=")(.+)(">)/.exec(body)[2];
    bot.sendMessage(id, `La palabra del día de hoy es [${word}](http://dle.rae.es/?${link})`, {
      parse_mode: 'Markdown'
    });
  });
};

bot.onText(/^\/palabra$/, msg => {
  sendWord(msg.chat.id);
});

bot.onText(/^\/suscribir$/, msg => {
  bot.sendMessage(msg.chat.id, 'Vale, ahora manda la hora');
});

bot.onText(/^[0-2]?[0-9]:[0-5][0-9]$/, (msg, match) => {
  const rule = new schedule.RecurrenceRule();
  const colonIndex = match.input.indexOf(':');
  rule.hour = Number(match.input.substr(0, colonIndex));
  rule.minute = Number(match.input.substr(colonIndex + 1));
  schedules[msg.chat.id] = schedule.scheduleJob(rule, sendWord.bind(null, msg.chat.id));
  bot.sendMessage(msg.chat.id, 'Vale, el tiempo se ha registrado');
});

bot.onText(/^\/cancelar$/, msg => {
  schedules[msg.chat.id].cancel();
  bot.sendMessage(msg.chat.id, 'Vale, ya no recibirás más palabras del día diarias');
});
