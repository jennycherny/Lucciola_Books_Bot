async function setupWebhook(bot, webhookUrl) {
    try {
        await bot.api.deleteWebhook();

        await bot.api.setWebhook(webhookUrl);
    } catch (error) {
        throw new Error('Failed to delete or set webhook: ' + error.message);
    }
}

async function deleteWebhook(bot) {
    try {
        await bot.api.deleteWebhook();
    } catch (error) {
        console.error('Failed to delete webhook:', error);
    }
}

module.exports = { setupWebhook, deleteWebhook };




// const express = require('express');
// const bodyParser = require('body-parser');
// const { Bot } = require('grammy');

// const app = express();
// const bot = new Bot(process.env.BOT_API_KEY);

// // Мидлвэр для обработки JSON-тела запроса
// app.use(bodyParser.json());

// // Установка пути для вебхука
// const WEBHOOK_PATH = '/webhook';

// // Обработка POST-запросов на путь вебхука
// app.post(WEBHOOK_PATH, (req, res) => {
//   bot.handleUpdate(req.body, res);
// });

// // Старт сервера и установка вебхука
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
//   deleteWebhookAndSetWebhook();
// });

// async function deleteWebhookAndSetWebhook() {
//   try {
//     await bot.api.deleteWebhook();
//     console.log('Webhook deleted successfully');
//     await bot.api.setWebhook(process.env.WEBHOOK_URL + WEBHOOK_PATH);
//     console.log('Webhook set successfully');
//   } catch (error) {
//     console.error('Failed to delete or set webhook:', error);
//   }
// }

// module.exports.setupWebhook = setupWebhook;