const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.API_KEY, {
  polling: true
});

const request = require('request');

bot.onText(/^(\/start|\/help)$/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Este bot manda la palabra del día cuando escribes /palabra');
});

bot.onText(/^\/palabra$/, (msg) => {
  request('https://dle.rae.es/srv/wotd', function (error, response, body) {
    const word = /(">)(.+)(\.<\/a>)/.exec(body)[2];
    const link = /(<a href=")(.+)(">)/.exec(body)[2];
    bot.sendMessage(msg.chat.id, `La palabra del día es:\n[*${word}*](https://dle.rae.es/?${link})`, {
      parse_mode: 'Markdown'
    });
  });
});
