# FormSender2 Vanilla JS

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![JavaScript](https://img.shields.io/badge/javascript-vanilla-yellow.svg)](https://developer.mozilla.org/ru/docs/Web/JavaScript)

Легковесная библиотека для отправки HTML-форм через AJAX без использования jQuery. Использует современный Fetch API и нативный JavaScript для валидации, отправки и обработки ответов сервера.

## Особенности

- **Без зависимостей** — не требует jQuery или других библиотек
- **Fetch API** — современный подход к HTTP-запросам
- **Поддержка файлов** — удобная загрузка файлов с индикацией прогресса
- **Гибкая настройка** — множество callback-функций для контроля процесса
- **Автоматизация** — автоочистка полей, автоотправка при изменении
- **Небольшой размер** — минимальный footprint для вашего проекта

## Установка

### Через NPM

```bash
npm install form-sender2-vanilla
```

### Через CDN

```html
<script src="https://cdn.example.com/formSender2-vanilla.js"></script>
```

### Скачать напрямую

[Скачать formSender2-vanilla.js](./src/formSender2-vanilla.js)

## Быстрый старт

```html
<!-- Подключение библиотеки -->
<script src='formSender2-vanilla.js'></script>

<!-- HTML форма -->
<form action='handler.php' method='post' class='fs' onsubmit='return false'>
    <input type='text' name='username' class='autoclean' placeholder='Имя' />
    <input type='email' name='email' class='autoclean' placeholder='Email' />
    <button type='submit'>Отправить</button>
</form>

<!-- Инициализация -->
<script>
    var FS = new FormSender();
    
    FS.FSuccess = function(data, form) {
        console.log('Успешно:', data);
        alert('Форма отправлена!');
    };
    
    FS.FError = function(error) {
        console.error('Ошибка:', error);
    };
</script>
```

## Callback-функции

Библиотека предоставляет четыре основные callback-функции:

### FSuccess — Успешная отправка

```javascript
FS.FSuccess = function(data, form) {
    console.log('Ответ сервера:', data);
};
```

### Fbefore — Перед отправкой

```javascript
FS.Fbefore = function(form) {
    console.log('Начинается отправка');
    // Верните false для отмены отправки
};
```

### FError — Обработка ошибок

```javascript
FS.FError = function(error) {
    console.error('Ошибка:', error);
};
```

### FProgress — Прогресс загрузки

```javascript
FS.FProgress = function(e, form) {
    console.log('Прогресс:', e.percent + '%');
};
```

## Возможности

### Автоматическая очистка полей

Добавьте класс `autoclean` к полям, которые нужно очистить после успешной отправки:

```html
<input class='autoclean' name='message' placeholder='Сообщение' />
```

### Автоматическая отправка

Добавьте атрибут `autosubmit` для отправки формы при изменении любого поля:

```html
<form action='filter.php' class='fs' autosubmit>
    <select name='category'>
        <option value='1'>Категория 1</option>
        <option value='2'>Категория 2</option>
    </select>
</form>
```

### Загрузка файлов

Библиотека автоматически определяет файловые поля и использует правильный формат:

```html
<form action='upload.php' method='post' class='fs'>
    <input type='file' name='attachment' />
    <button type='submit'>Загрузить</button>
</form>
```

### Множественная загрузка

```html
<input type='file' name='files[]' multiple />
```

### Собственные обработчики для форм

```html
<form success='mySuccess' before='myBefore' error='myError'>
    ...
</form>

<script>
    function myBefore(form) { /* ... */ }
    function mySuccess(data, form) { /* ... */ }
    function myError(error) { /* ... */ }
</script>
```

## Документация

Подробная документация доступна на странице [docs/index.html](./docs/index.html) или в формате Markdown [docs/documentation.md](./docs/documentation.md).

## Конструктор

```javascript
// Селектор по умолчанию (класс .fs)
var FS1 = new FormSender();

// Кастомный селектор
var FS2 = new FormSender('#myForm');
var FS3 = new FormSender('[data-ajax="true"]');
```

## Поддержка браузеров

- Chrome 42+
- Firefox 39+
- Safari 10+
- Edge 14+
- Opera 29+

## Лицензия

Распространяется по лицензии MIT. Подробности в файле [LICENSE](./LICENSE).

## Автор

Abral Core Syndicate

## Версии

- **2.0.0** — Текущая версия без jQuery с Fetch API
- **1.x** — Оригинальная версия с jQuery

---

*Abral Core Syndicate 2026*
