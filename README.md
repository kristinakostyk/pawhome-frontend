# PawHome — Frontend

PawHome — вебсайт, який допомагає людям знаходити собак і котів із притулків та дарувати їм новий дім.

Це клієнтська частина проєкту PawHome, яка отримує інформацію про тварин із Django REST API.

## Можливості

- Перегляд каталогу тварин.
- Пошук за ім'ям або породою.
- Фільтрація за видом тварини та містом.
- Перегляд інформації про тварин.
- Адаптивне оформлення для різних екранів.

## Використані технології

- HTML
- CSS
- JavaScript
- REST API
- JSON

## Як запустити проєкт

Для роботи сайту потрібно запустити Backend і Frontend окремо.

### 1. Запуск Backend

Відкрити термінал у папці `pawhome-api`:

```bash
cd ~/pawhome-api
source .venv/bin/activate
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Backend працюватиме за адресою:

http://127.0.0.1:8000

API для отримання тварин:

http://127.0.0.1:8000/api/animals

### 2. Запуск Frontend

Відкрити інший термінал:

```bash
cd ~/pawhome-frontend
python3.13 -m http.server 3000
```

Відкрити сайт у браузері:

http://127.0.0.1:3000

Обидва сервери повинні працювати одночасно.

## Зв'язок із Backend

Frontend використовує `fetch()` для надсилання GET-запитів до Django REST API.

Дані надходять у форматі JSON, після чого JavaScript створює картки тварин на сторінці.

Для взаємодії між портами 3000 та 8000 на Backend налаштовано CORS.

## Backend-репозиторій

https://github.com/kristinakostyk/pawhome-api

---

PawHome — допомагаємо тваринкам знайти дім! 🐾
