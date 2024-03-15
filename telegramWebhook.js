// telegramWebhook.js

const express = require('express');
const bodyParser = require('body-parser');
const { Bot } = require('grammy');

const app = express();
const bot = new Bot(process.env.BOT_API_KEY);

// Мидлвэр для обработки JSON-тела запроса
app.use(bodyParser.json());

// Установка пути для вебхука
const WEBHOOK_PATH = '/webhook';

// Обработка POST-запросов на путь вебхука
app.post(WEBHOOK_PATH, (req, res) => {
  bot.handleUpdate(req.body, res);
});

// Старт сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Экспорт функции для настройки вебхука
module.exports = function setupWebhook() {
  bot.api.setWebhook(process.env.WEBHOOK_URL + WEBHOOK_PATH);
};
