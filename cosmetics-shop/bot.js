const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const app = express();

// Ваши данные
const token = '8529167440:AAGHOPEtGMm0XwaiRqCaidZCCQk0wt1fGA0';
const MANAGER_CHAT_ID = '207347486';
const WEB_APP_URL = process.env.WEB_APP_URL || 'https://ваш-сайт.vercel.app';

const bot = new TelegramBot(token, { polling: true });

console.log('🤖 Бот Luxe Cosmetics запущен!');
console.log(`👑 Менеджер: ${MANAGER_CHAT_ID}`);

// Премиум приветствие
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  
  const welcomeText = `⚜️ *Добро пожаловать в Luxe Cosmetics* ⚜️

*Оригинальная премиальная косметика из Европы*

🎁 100% оригинальная продукция
✈️ Доставка из Франции, Швейцарии, Италии
💎 Люксовые бренды: La Mer, Chanel, Dior, La Prairie
👑 Персональный консультант для каждого клиента

*Наши преимущества:*
✅ Официальные поставки
✅ Сертификаты подлинности  
✅ Бесплатная доставка от 50 000 ₽
✅ Подарочная упаковка`;

  const keyboard = {
    inline_keyboard: [[
      {
        text: '🛍️ Открыть каталог',
        web_app: { url: WEB_APP_URL }
      }
    ], [
      {
        text: '💬 Консультация стилиста',
        callback_data: 'consultation'
      }
    ]]
  };

  bot.sendMessage(chatId, welcomeText, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
});

// Обработка консультации
bot.on('callback_query', (query) => {
  if (query.data === 'consultation') {
    bot.sendMessage(query.message.chat.id,
      `👑 *Персональная консультация*\n\nНаш стилист поможет:\n• Подобрать косметику для вашего типа кожи\n• Создать индивидуальный beauty-ритуал\n• Выбрать аромат по вашему характеру\n\nНапишите ваш вопрос, и мы свяжем вас с экспертом в течение 15 минут.`,
      { parse_mode: 'Markdown' }
    );
  }
});

// Обработка заказов из Mini-App
bot.on('message', (msg) => {
  if (msg.web_app_data) {
    try {
      const order = JSON.parse(msg.web_app_data.data);
      const orderNumber = `LC${Date.now().toString().slice(-6)}`;
      
      console.log('📦 Новый заказ:', orderNumber);

      // Форматируем заказ для менеджера
      const orderText = `🆕 *НОВЫЙ ЗАКАЗ LUXE COSMETICS* 🆕

*Номер заказа:* #${orderNumber}
*Клиент:* ${order.name || 'Не указано'}
*Телефон:* ${order.phone || 'Не указано'}
*Email:* ${order.email || 'Не указано'}

*Адрес доставки:*
${order.address || 'Не указано'}

*Способ доставки:* ${order.shipping || 'Не указано'}

*Состав заказа:*
${order.items ? order.items.map(item => `• ${item.brand || ''} ${item.name || ''} - ${item.price || ''}`).join('\n') : 'Нет товаров'}

*Общая сумма:* ${order.total || 0}
*Комментарий:* ${order.comments || 'Нет комментариев'}

💎 *Премиум клиент* 💎`;

      // Отправляем менеджеру (вам)
      bot.sendMessage(MANAGER_CHAT_ID, orderText, { parse_mode: 'Markdown' })
        .then(() => {
          console.log('✅ Заказ отправлен менеджеру');
        })
        .catch(error => {
          console.error('❌ Ошибка отправки менеджеру:', error);
        });
      
      // Подтверждение клиенту
      bot.sendMessage(msg.chat.id,
        `👑 *Ваш заказ принят!* 👑\n\n*Номер заказа:* #${orderNumber}\n*Сумма:* ${order.total || 0}\n\n💎 Наш персональный менеджер свяжется с вами в течение 15 минут для подтверждения заказа и согласования деталей доставки.\n\nБлагодарим за выбор Luxe Cosmetics!`,
        { parse_mode: 'Markdown' }
      );
      
    } catch (error) {
      console.error('❌ Ошибка обработки заказа:', error);
      bot.sendMessage(msg.chat.id, '❌ Произошла ошибка при обработке заказа. Пожалуйста, попробуйте еще раз.');
    }
  }
});

// Обработка обычных сообщений
bot.on('message', (msg) => {
  // Игнорируем служебные сообщения и команды
  if (msg.text && !msg.text.startsWith('/') && !msg.web_app_data) {
    console.log('💬 Сообщение от пользователя:', msg.text);
    
    // Пересылаем сообщение менеджеру
    bot.forwardMessage(MANAGER_CHAT_ID, msg.chat.id, msg.message_id)
      .then(() => {
        bot.sendMessage(msg.chat.id, '💎 Ваше сообщение передано менеджеру. Мы ответим вам в ближайшее время.');
      })
      .catch(error => {
        console.error('Ошибка пересылки:', error);
      });
  }
});

// Простой веб-сервер для Vercel
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Luxe Cosmetics Bot is running!',
    manager: MANAGER_CHAT_ID
  });
});

// Маршрут для проверки статуса
app.get('/status', (req, res) => {
  res.json({
    bot: 'running',
    manager: MANAGER_CHAT_ID,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`👑 Менеджер: ${MANAGER_CHAT_ID}`);
  console.log(`🌐 Web App URL: ${WEB_APP_URL}`);
});

module.exports = app;