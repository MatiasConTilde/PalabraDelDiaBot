const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.API_KEY, {
  polling: true
});

const request = require('request');

bot.onText(/(\/start|\/help)/, (msg) => {
  bot.sendMessage(msg.chat.id, "Este bot manda la palabra del día cuando escribes /palabra");
});

bot.onText(/\/palabra/, (msg) => {
  request('http://dle.rae.es/srv/wotd', function (error, response, body) {
    let word = body.substring(body.lastIndexOf('">')+2,body.length-5);
    let link = "dle.rae.es/?" + body.substring(body.lastIndexOf('href="')+6,body.lastIndexOf('">'));
    bot.sendMessage(msg.chat.id, "La palabra del día es:\n" + word + "\n\n" + link);
  });
});
