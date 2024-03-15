require('dotenv').config();
const { Bot, GrammyError, HttpError} = require('grammy');

const { setupWebhook, deleteWebhook  } = require('./telegramWebhook');
const fetchData = require('./fetchData');
const aboutData = require('./about.json');
const bot = new Bot(process.env.BOT_API_KEY);

(async () => {
    try {
        // Удаляем существующий вебхук (если есть)
        await deleteWebhook(bot);

        // Устанавливаем новый вебхук
        const WEBHOOK_URL = process.env.WEBHOOK_URL;
        await setupWebhook(bot, WEBHOOK_URL);

        // Ваш остальной код здесь
    } catch (error) {
        console.error('Failed to set up webhook:', error);
    }
})();

bot.api.setMyCommands([
    {
        command: 'start', 
        description: 'Запустить бота',
    },
    {
        command: 'menu', 
        description: 'Показать меню',
    },
    {
        command: 'search', 
        description: 'Найти книгу',
    },
    {
        command: 'about_lucciola', 
        description: 'О нас',
    },
]);

bot.command('start', async (ctx) => {
    const message = "Привет! Я бот книжного магазина Lucciola Books🤖📚";
    
    await ctx.reply(message);
    await showMenu(ctx);
});

bot.on('callback_query:data', async (ctx) => {
    const data = ctx.callbackQuery.data;
    
    switch (data) {
        case 'about_shop':
            await aboutShop(ctx);
            break;
        case 'about_library':
            await aboutLibrary(ctx);
            break;
        case 'about_preorder':
            await aboutPreorder(ctx);
            break;
        case 'about_delivery':
            await aboutDelivery(ctx);
            break;
        case 'return_to_menu':
            await showMenu(ctx);
            break;
        case 'pre_order':
            await askForPreOrder(ctx);
            break;
        case 'about_lucciola':
            await aboutLucciolaBooks(ctx);
            break;
        default:
            break;
    }
});

bot.command('menu', async (ctx) => {
    await showMenu(ctx);
});

bot.command('search', async (ctx) => {
    await askForBook(ctx);
});

bot.command('about_lucciola', async (ctx) => {
    await aboutLucciolaBooks(ctx);
});

async function showMenu(ctx) {
    const menuKeyboard = {
        keyboard: [
            [{ text: 'Найти книгу 📖' }],
            [{ text: 'Узнать о Lucciola Books 👀' }],
            [{ text: 'Оформить предзаказ 📦' }],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
    };

    await ctx.reply("Могу найти нужную книгу, рассказать подробнее про наш сервис или оформлю предзаказ.\n\n" +
    "Чем могу помочь?", {
        reply_markup: menuKeyboard,
    });
}

bot.on('message', async (ctx) => {
    const text = ctx.message.text;

    console.log("Получено сообщение:", text);

    switch (text) {
        case 'Найти книгу 📖':
            await askForBook(ctx);
            break;
        case 'Узнать о Lucciola Books 👀':
            await aboutLucciolaBooks(ctx);
            break;
        case 'Оформить предзаказ 📦':
            await askForPreOrder(ctx); 
            break;
        default:
            await searchBooks(ctx, text);
            break;
    }
});

// Кейс -- найти книгу

async function askForBook(ctx) {
    await ctx.reply("Напиши название или автора книги, а я узнаю, есть ли она в наличии 🔍");
}

bot.command('search', async (ctx) => {
    ctx.session = ctx.session || {};
    
    if (!ctx.session.state || ctx.session.state !== 'awaitingBookInfo') {
        await askForBook(ctx);
        ctx.session.state = 'awaitingBookInfo';
        console.log("Состояние:", ctx.session.state);
    }
});

bot.on('callback_query:data', async (ctx) => {
    if (ctx.callbackQuery.data === 'search') {
        await askForBook(ctx);
    }
});

bot.on('message', async (ctx) => {
    const text = ctx.message.text;

    console.log("Получено сообщение:", text);
    console.log("Вызов функции searchBooks");

    ctx.session = ctx.session || {};
    ctx.session.state = 'awaitingBookInfo';

    if (ctx.session && ctx.session.state === 'awaitingBookInfo') {
        
        await searchBooks(ctx, text);
        console.log("Состояние внутри message:", ctx.session.state);

        // Сбрасываем состояние ожидания информации о книге
        delete ctx.session.state;
        console.log("Состояние после удаления:", ctx.session.state);
    }
});

async function searchBooks(ctx, searchText) {
    try {
        const allBooks = await fetchData();
  
        const foundBooks = allBooks.filter(book => {
        return book.stock > 0 && 
               book.title.toLowerCase().includes(searchText.toLowerCase()) || 
               book.author.toLowerCase().includes(searchText.toLowerCase());
      });

      console.log("Найденные книги после фильтрации:", foundBooks);
  
      if (foundBooks.length > 0) {
        const booksInfo = foundBooks.map(book => {
            let info = `📚 Название: _${book.title}_\n👨‍💼 Автор: _${book.author}_\n`;
                info += `💰 Цена: _${book.price} GEL_`;
                if (book.rentPrice !== null) {
                    info += `\n🔖 Цена за аренду: _${book.rentPrice} GEL_`;
                }
                if (book.condition === 'Новая') {
                    info += `\n[🔗 Ссылка](https://lucciola-books.vercel.app/shop/${book.id})`;
                } else if (book.condition === 'Б/У') {
                    info += `\n[🔗 Ссылка](https://lucciola-books.vercel.app/library/${book.id})`;
                }
                return info;
        }).join('\n\n');

        console.log("Информация о книгах для отправки:", booksInfo);

        await ctx.reply(`*Найденные книги:*\n\n${booksInfo}`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📍 В меню', callback_data: 'return_to_menu' }]
                ]
            },
            parse_mode: 'Markdown'
        });
    } else {
        await ctx.reply("Книги с таким названием или автором не найдены 😢\nПроверь запрос на ошибки или попробуй поискать по-другому.\n\nЕсли книги нет в наличии, мы можем оформить предзаказ!", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '✍🏻 Предзаказ', callback_data: 'pre_order' },
                    { text: '📍 В меню', callback_data: 'return_to_menu' }]
                ]
            }
        });
    }

    } catch (error) {
      console.error("Ошибка при поиске книги:", error);
      await ctx.reply("Произошла ошибка при поиске книги. Пожалуйста, попробуйте позже.");
    }
};

// кейс -- Узнать о Lucciola Books 

async function aboutLucciolaBooks(ctx) {
    const aboutText = "[Lucciola Books](https://lucciola-books.vercel.app/) — это библиотека в Тбилиси и онлайн-магазин книг с доставкой по Грузии.\n\n Выбери раздел, о котором хочешь узнать подоробнее: ";
    await ctx.reply(aboutText, {
        reply_markup: {
            inline_keyboard: [
                [   { text: '📚 О магазине', callback_data: 'about_shop' },
                    { text: '📖 О библиотеке', callback_data: 'about_library' }],
                [   { text: '✍🏻 О предзаказе', callback_data: 'about_preorder' },
                    { text: '📦 О доставке', callback_data: 'about_delivery' }],
                [
                    { text: '📍 В меню', callback_data: 'return_to_menu' }]
            ]
        },
        parse_mode: 'Markdown'
    });
}

async function aboutShop(ctx) {
    const shopData = aboutData.shop;

    let message = '';
    for (const item of shopData) {
        if (item.question) {
            parse_mode: 'Markdown',
            message += `*${item.question}*\n\n`;
        }
        if (item.answer) {
            message += `${item.answer}\n\n`;
        }
    }

    await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔙 Назад', callback_data: 'about_lucciola' },
                 { text: '📍 В меню', callback_data: 'return_to_menu' }]
            ]
        }
    });
}


async function aboutLibrary(ctx) {
    const libraryData = aboutData.library;

    let message = '';
    for (const item of libraryData) {
        if (item.question) {
            parse_mode: 'Markdown',
            message += `*${item.question}*\n\n`;
        }
        if (item.answer) {
            message += `${item.answer}\n\n`;
        }
    }

    await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔙 Назад', callback_data: 'about_lucciola' },
                 { text: '📍 В меню', callback_data: 'return_to_menu' }]
            ]
        }
    });
}

async function aboutPreorder(ctx) {
    const preorderData = aboutData.preorder;

    let message = '';
    for (const item of preorderData) {
        if (item.question) {
            parse_mode: 'Markdown',
            message += `*${item.question}*\n\n`;
        }
        if (item.answer) {
            message += `${item.answer}\n\n`;
        }
    }

    await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔙 Назад', callback_data: 'about_lucciola' },
                 { text: '📍 В меню', callback_data: 'return_to_menu' }]
            ]
        }
    });
}

async function aboutDelivery(ctx) {
    const deliveryData = aboutData.delivery;

    let message = '';
    for (const item of deliveryData) {
        if (item.question) {
            message += `*${item.question}*\n\n`;
        }
        if (item.answer) {
            parse_mode: 'Markdown',
            message += `${item.answer}\n\n`;
        }
    }

    await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔙 Назад', callback_data: 'about_lucciola' },
                 { text: '📍 В меню', callback_data: 'return_to_menu' }]
            ]
        }
    });
}

// Кейс предзаказ

async function askForPreOrder(ctx) {
    const preOrderText = "Заполни [форму](https://lucciola-books.vercel.app/preorder) на сайте, и мы закажем нужную книгу. Как только она окажется в наличии, мы тебе сообщим 📫\n\n P.S. предзаказ бесплатный 🤓";
    await ctx.reply(preOrderText, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '📍 В меню', callback_data: 'return_to_menu' }]
            ]
        },
        parse_mode: 'Markdown'
    });
}



// Отработка ошибок 

bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handing update ${ctx.update.update_id}:`);
    const e = err.error;

    if (e instanceof GrammyError) {
        console.error('Error in request:', e.description);
    } else if (e instanceof HttpError) {
        console.e('Could not contact Telegram:', e);
    } else {
        console.error('Unknown error:', e);
    }
}); 


// bot.start();

(async () => {
    try {
        // Удаляем существующий вебхук (если есть)
        await deleteWebhook(bot);

        // Запускаем бота
        await bot.start();
    } catch (error) {
        console.error('Failed to start bot:', error);
    }
})();

