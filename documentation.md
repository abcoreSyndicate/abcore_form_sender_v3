# FormSender2 Vanilla JS

## Улучшенная версия без jQuery с использованием Fetch API

---

FormSender2 Vanilla JS — это легковесная библиотека для отправки HTML-форм через AJAX без использования jQuery. Библиотека использует современный Fetch API для HTTP-запросов и нативный JavaScript для манипуляции DOM-элементами. Благодаря этому решению значительно снижается размер подключаемых зависимостей и улучшается производительность веб-приложений.

---

## Подключение

Для начала работы с библиотекой необходимо скачать файл `formSender2-vanilla.js` и подключить его к HTML-странице. Подключение рекомендуется размещать в конце документа перед закрывающим тегом `</body>` для обеспечения загрузки всех DOM-элементов. После подключения скрипта библиотека автоматически инициализируется и начинает обрабатывать все формы с классом `.fs`.

```html
<script src='formSender2-vanilla.js'></script>
<script>
    var FS = new FormSender();
</script>
```

Добавьте класс `fs` к тегу `form` и заглушите стандартную отправку формы с помощью атрибута `onsubmit='return false'`. Это предотвратит перезагрузку страницы при нажатии на кнопку отправки и позволит библиотеке перехватить событие submit.

```html
<form id='exampleFormId' action='echo.php' method='post' class='fs' onsubmit='return false'>
    <!-- ANY INPUT -->
</form>
```

---

## Callback-функции

Библиотека предоставляет четыре основные callback-функции, которые вызываются на различных этапах обработки формы. Эти функции позволяют контролировать процесс отправки данных, обрабатывать результаты и ошибки, а также отслеживать прогресс загрузки файлов. По умолчанию все функции выводят простые уведомления через alert, однако вы можете переопределить их для реализации собственной логики обработки.

### FSuccess — Успешная отправка

Функция FSuccess вызывается при успешном завершении AJAX-запроса, когда сервер возвращает статус 2xx. В качестве параметров функция получает данные от сервера и ссылку на отправленную форму. Это идеальное место для обработки ответа сервера, вывода сообщений пользователю и выполнения дополнительных действий после успешной отправки.

```javascript
var FS = new FormSender();

FS.FSuccess = function(data, form) {
    console.log('Успешная отправка:', data);
    console.log('Форма:', form);
    
    // Пример вывода сообщения
    var messageDiv = form.querySelector('.message');
    if (messageDiv) {
        messageDiv.textContent = 'Данные успешно отправлены!';
        messageDiv.classList.add('success');
    }
};
```

### Fbefore — Перед отправкой

Функция Fbefore выполняется непосредственно перед отправкой данных на сервер. Это позволяет реализовать дополнительную валидацию, модифицировать отправляемые данные или выполнить подготовительные действия. Если функция возвращает значение false, отправка формы будет отменена.

```javascript
FS.Fbefore = function(form) {
    console.log('Начинается отправка формы');
    
    // Пример валидации
    var nameInput = form.querySelector('input[name="name"]');
    if (nameInput && nameInput.value.length < 2) {
        alert('Имя должно содержать минимум 2 символа');
        return false; // Отмена отправки
    }
    
    // Пример добавления дополнительных данных
    // Примечание: для модификации данных используйте атрибут before на форме
    return true; // Продолжение отправки
};
```

### FError — Обработка ошибок

Функция FError вызывается при возникновении ошибки в процессе AJAX-запроса. Это может быть сетевая ошибка, ошибка сервера (статусы 4xx или 5xx) или другие исключительные ситуации. Функция получает объект ошибки в качестве параметра, что позволяет проанализировать причину сбоя и уведомить пользователя.

```javascript
FS.FError = function(error) {
    console.error('Ошибка при отправке:', error);
    
    // Пример обработки разных типов ошибок
    if (error instanceof TypeError) {
        alert('Ошибка сети. Проверьте подключение к интернету.');
    } else if (error.status) {
        alert('Ошибка сервера: ' + error.status);
    } else {
        alert('Произошла неизвестная ошибка');
    }
};
```

### FProgress — Прогресс загрузки

Функция FProgress предоставляет информацию о процессе загрузки данных на сервер. Особенно полезна при отправке файлов больших размеров. Функция получает объект с информацией о загруженных байтах, общем размере и проценте выполнения. Данная функция использует XMLHttpRequest для отправки файлов, поскольку Fetch API не поддерживает события прогресса нативно.

```javascript
FS.FProgress = function(e, form) {
    console.log('Загружено:', e.count, 'из', e.total);
    console.log('Процент:', e.percent + '%');
    
    // Пример обновления прогресс-бара
    var progressBar = form.querySelector('.progress-bar');
    var progressPercent = form.querySelector('.progress-percent');
    
    if (progressBar) {
        progressBar.style.width = e.percent + '%';
    }
    
    if (progressPercent) {
        progressPercent.textContent = e.percent + '%';
    }
};
```

---

## Собственные обработчики для форм

Для каждой конкретной формы можно определить индивидуальные функции обработки событий через атрибуты тега form. Это особенно удобно, когда на одной странице используется несколько форм с разной логикой обработки. Атрибуты success, before и error позволяют указать имена функций, которые будут вызваны для конкретной формы.

```html
<form 
    id='exampleFormId' 
    action='echo.php' 
    method='post' 
    class='fs' 
    onsubmit='return false' 
    
    success='mySuccessFun' 
    before='myBeforeFun' 
    error='myErrorFun'
>
    <input type='text' name='username' class='autoclean' />
    <button type='submit'>Отправить</button>
</form>

<script>
    function myBeforeFun(form) {
        console.log('Собственный обработчик before для этой формы');
        return true;
    }
    
    function mySuccessFun(data, form) {
        console.log('Ответ сервера:', data);
        console.log('Форма отправлена:', form.id);
    }
    
    function myErrorFun(error) {
        console.log('Ошибка:', error);
    }
</script>
```

---

## Автоматическая очистка полей

После успешной отправки формы библиотека автоматически очищает значения полей, помеченных классом `autoclean`. Это удобно для полей ввода комментариев, сообщений и других данных, которые не должны сохраняться после отправки. Очистка выполняется только для полей с указанным классом, поэтому важные данные можно сохранить.

```html
<input class='form-control autoclean' name='new_input' value='' placeholder='Введите текст' />
<textarea class='form-control autoclean' name='message' placeholder='Ваше сообщение'></textarea>
```

---

## Отправка только изменённых полей

Библиотека поддерживает функционал отправки только тех полей, которые были изменены пользователем. Для этого используется атрибут `fs-name`, который позволяет связать визуальное поле ввода со скрытым полем. При изменении значения визуального поля обработчик автоматически активирует скрытое поле для включения в данные формы.

```html
<!-- Скрытое поле для отправки -->
<input type='hidden' fs-name='userEmail' name='' value='' />

<!-- Визуальное поле для ввода -->
<input type='email' fs-name='userEmail' placeholder='Ваш email' />
```

При изменении значения любого поля с атрибутом `fs-name` библиотека автоматически находит все связанные поля с таким же значением `fs-name` и устанавливает им атрибут `name` для включения в отправляемые данные. Это позволяет реализовать сценарии, когда данные отправляются только после фактического изменения пользователем.

---

## Автоматическая отправка формы

Функция автоматической отправки формы активируется атрибутом `autosubmit`. При добавлении этого атрибута к форме библиотека будет автоматически отправлять данные каждый раз, когда пользователь изменяет значение любого поля формы. Это идеально подходит для форм фильтрации, поиска в реальном времени и динамических списков.

```html
<form action='filter.php' method='post' class='fs' autosubmit>
    <select name='category'>
        <option value=''>Все категории</option>
        <option value='1'>Электроника</option>
        <option value='2'>Одежда</option>
        <option value='3'>Книги</option>
    </select>
    
    <label>
        <input type='checkbox' name='in_stock' value='1' /> Только в наличии
    </label>
    
    <label>
        <input type='radio' name='sort' value='price' checked /> По цене
    </label>
    <label>
        <input type='radio' name='sort' value='name' /> По названию
    </label>
</form>
```

---

## Загрузка файлов

Библиотека полностью поддерживает загрузку файлов через форму без дополнительной настройки. При обнаружении поля с типом `file` библиотека автоматически использует объект FormData для корректной передачи файлов на сервер. Важно помнить, что загрузка файлов возможна только при использовании метода POST, поскольку протокол HTTP не поддерживает передачу файлов методом GET.

### Базовая загрузка файла

```html
<form action='upload.php' method='post' class='fs' onsubmit='return false'>
    <input type='file' name='attachment' />
    <button type='submit'>Загрузить</button>
</form>
```

### Множественная загрузка файлов

Для загрузки нескольких файлов одновременно используется атрибут `multiple`. Библиотека автоматически обрабатывает массив файлов и отправляет их на сервер в правильном формате с добавлением квадратных скобок к имени поля.

```html
<form action='upload.php' method='post' class='fs' onsubmit='return false'>
    <input type='file' name='attachments[]' multiple />
    <button type='submit'>Загрузить несколько файлов</button>
</form>
```

### Автоматическая отправка при выборе файла

Комбинация атрибутов `autosubmit` и `fs-name` позволяет автоматически отправлять форму сразу после выбора файла пользователем. Это удобно для реализации функционала мгновенной загрузки аватарок или документов.

```html
<form action='upload.php' method='post' class='fs' onsubmit='return false' autosubmit>
    <input type='file' name='avatar' fs-name='avatarFile' />
    <div class='progress-bar' style='width: 0%'></div>
</form>

<script>
    var FS = new FormSender();
    
    FS.FProgress = function(e, form) {
        var progressBar = form.querySelector('.progress-bar');
        progressBar.style.width = e.percent + '%';
    };
</script>
```

---

## Примеры форм

### Пример формы GET

```html
<form id='exampleFormId' action='echo.php' method='get' class='fs' onsubmit='return false'>
    <div class='mb-3'>
        <label>Пример ввода</label>
        <input class='form-control autoclean' name='new_input' value='' placeholder='Введите текст' />
    </div>

    <button type='submit' class='btn btn-primary'>Отправить</button>
</form>

<script>
    var FS = new FormSender();
    
    FS.FSuccess = function(data, form) {
        console.log('GET запрос выполнен:', data);
    };
</script>
```

### Пример формы POST

```html
<form id='postForm' action='echo.php' method='post' class='fs' onsubmit='return false'>
    <div class='form-group'>
        <label>Имя</label>
        <input type='text' name='name' class='autoclean' required />
    </div>
    
    <div class='form-group'>
        <label>Email</label>
        <input type='email' name='email' class='autoclean' required />
    </div>
    
    <div class='form-group'>
        <label>Сообщение</label>
        <textarea name='message' class='autoclean' rows='4'></textarea>
    </div>
    
    <div class='form-group'>
        <label>Выбор цвета</label>
        <select name='color' class='autoclean'>
            <option value='red'>Красный</option>
            <option value='green'>Зелёный</option>
            <option value='blue'>Синий</option>
        </select>
    </div>
    
    <div class='form-group'>
        <label>Переключатель</label>
        <label><input type='radio' name='option' value='1' /> Вариант 1</label>
        <label><input type='radio' name='option' value='2' /> Вариант 2</label>
        <label><input type='radio' name='option' value='3' /> Вариант 3</label>
    </div>
    
    <div class='form-group'>
        <label>
            <input type='checkbox' name='agree' value='1' /> Согласен с условиями
        </label>
    </div>
    
    <button type='submit'>Отправить</button>
</form>

<script>
    var FS = new FormSender();
    
    FS.FSuccess = function(data, form) {
        console.log('POST данные отправлены:', data);
    };
    
    FS.Fbefore = function(form) {
        console.log('Начинается POST отправка');
    };
</script>
```

### Пример с прогресс-баром

```html
<form id='uploadForm' action='upload.php' method='post' class='fs' onsubmit='return false' enctype='multipart/form-data'>
    <div class='form-group'>
        <label>Выберите файл</label>
        <input type='file' name='document' />
    </div>
    
    <div class='progress-container'>
        <div class='progress-bar' style='width: 0%; transition: width 0.3s;'></div>
        <span class='progress-text'>0%</span>
    </div>
    
    <button type='submit'>Загрузить с прогрессом</button>
</form>

<script>
    var FS = new FormSender();
    
    FS.FProgress = function(e, form) {
        var progressBar = form.querySelector('.progress-bar');
        var progressText = form.querySelector('.progress-text');
        
        progressBar.style.width = e.percent + '%';
        progressText.textContent = e.percent + '% (' + (e.count / 1024).toFixed(1) + ' KB / ' + (e.total / 1024).toFixed(1) + ' KB)';
    };
    
    FS.FSuccess = function(data, form) {
        alert('Файл успешно загружен!');
        console.log('Ответ сервера:', data);
    };
</script>
```

---

## Типы запросов

### GET-запрос

При использовании метода GET данные формы автоматически преобразуются в строку параметров URL и добавляются к адресу обработчика после знака вопроса. Этот метод подходит для поисковых запросов, фильтрации данных и других операций, не требующих отправки конфиденциальной информации.

```html
<form action='search.php' method='get' class='fs' onsubmit='return false'>
    <input type='text' name='query' placeholder='Поиск...' />
    <button type='submit'>Найти</button>
</form>
```

### POST-запрос

Метод POST отправляет данные в теле HTTP-запроса. Этот метод рекомендуется использовать для отправки больших объёмов данных, файлов и конфиденциальной информации. Библиотека автоматически выбирает правильный тип содержимого в зависимости от наличия файловых полей.

```html
<form action='submit.php' method='post' class='fs' onsubmit='return false'>
    <textarea name='content'></textarea>
    <button type='submit'>Сохранить</button>
</form>
```

---

## Конструктор класса

Конструктор класса FormSender принимает один необязательный параметр — селектор для поиска форм. По умолчанию используется класс `.fs`, но вы можете указать любой другой селектор для обработки форм с другими классами или атрибутами.

```javascript
// Использование селектора по умолчанию (класс .fs)
var FS1 = new FormSender();

// Использование кастомного селектора
var FS2 = new FormSender('#myForm');
var FS3 = new FormSender('[data-ajax="true"]');
var FS4 = new FormSender('.ajax-form');
```

---

## Особенности реализации

### Fetch API и XMLHttpRequest

Библиотека использует Fetch API как основной метод отправки данных благодаря его современному и удобному интерфейсу. Однако для обеспечения функциональности отслеживания прогресса загрузки файлов библиотека автоматически переключается на XMLHttpRequest при обнаружении полей с типом file. Это позволяет сохранить все преимущества Fetch API для обычных запросов и обеспечить точную индикацию прогресса при загрузке файлов.

### Нативный JavaScript

Все операции с DOM выполняются с использованием стандартных методов нативного JavaScript без сторонних библиотек. Это обеспечивает высокую производительность, минимальный размер библиотеки и современный синтаксис кода. Библиотека использует современные возможности ES6+, включая классы, стрелочные функции и async/await.

### Автоматическая инициализация

Библиотека автоматически инициализируется при загрузке документа благодаря обработчику события DOMContentLoaded. После загрузки DOM все формы с указанным классом автоматически настраиваются и получают обработчики событий. Вы также можете создать экземпляр класса вручную после загрузки страницы.

---

## Скачать

Скачать актуальную версию библиотеки formSender2-vanilla.js вы можете по следующей ссылке. Файл распространяется в исходном коде и готов к использованию без дополнительной компиляции.

[Скачать formSender2-vanilla.js](./formSender2-vanilla.js)

---

Abral Core Syndicate 2026
