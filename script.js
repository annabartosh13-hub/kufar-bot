require('dotenv').config();
const fetch = require('node-fetch');

// Переменные из .env
const TELEGRAM_BOT_TOKEN = '8626549975:AAFsR2Bl3jXMEuDHeKz0lAF5dWb8jY249w8';  // вставь сюда свой токен из .env
const TELEGRAM_USER_IDS = [
    '297879535',   // твой ID
    '1242880325'   // второй ID
];


// Ссылка на API Куфара (ты её уже нашёл через F12)
const KUFAR_API_URL = 'https://api.kufar.by/search-api/v2/search/rendered-paginated?cat=1010&cur=BYR&gtsy=country-belarus~province-grodnenskaja_oblast~locality-grodno&lang=ru&prc=r%3A0%2C60000&size=30&typ=let&sort=lst.d';

// Тут храним ID объявлений, которые уже видели, чтобы не спамить
const seenAds = new Set();

// Функция отправки сообщений в Telegram
async function sendTelegramMessage(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    for (const chatId of TELEGRAM_USER_IDS) {
        try {
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, text: message })
            });
        } catch (error) {
            console.error(`Ошибка отправки в Telegram (${chatId}):`, error.message);
        }
    }
}
// Основная функция проверки Куфара
async function checkKufar() {
    console.log('Проверяем Куфар...');
    try {
        const response = await fetch(KUFAR_API_URL);
        const data = await response.json();
        
        const ads = data.ads || [];
        
        for (const ad of ads) {
            if (!seenAds.has(ad.ad_id)) {
                seenAds.add(ad.ad_id);
                
                const adUrl = `https://re.kufar.by/vi/${ad.ad_id}`;
                const priceByn = ad.price_byn ? (parseInt(ad.price_byn) / 100) : null;
const message = `Новое объявление!\n${ad.subject}\nЦена: ${priceByn ? priceByn + ' BYN' : 'не указана'}\n${adUrl}`;
                
                console.log(`Найдено новое: ${ad.ad_id}`);
                await sendTelegramMessage(message);
            }
        }
    } catch (error) {
        console.error('Ошибка при проверке Куфара:', error.message);
    }
}

// Запуск: первая проверка через 5 секунд, потом каждые 30 секунд
setTimeout(() => {
    checkKufar();
    setInterval(checkKufar, 30000);
}, 5000);

console.log('Скрипт запущен. Проверка каждые 30 секунд.');
sendTelegramMessage('Лёгкий бот запущен!');
