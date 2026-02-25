/**
 * Abral Syndicate
 * FormSender2 - Vanilla JavaScript Version
 * Отправка форм без jQuery с использованием Fetch API
 * Сохраняет полную совместимость с оригинальным функционалом FormSender2
 */

class FormSender {
    constructor(classNameCon = '.fs') {
        // Callback функции
        this.FSuccess = (e) => {
            alert('done');
            console.log(e);
        };
        this.FError = (e) => {
            alert('error');
        };
        this.Fbefore = (e) => {
            alert('до запуска');
        };
        this.FProgress = (e, form) => {};

        this.lastForm = null;
        this.classNameCon = classNameCon;

        // Инициализация форм
        this.initForms();
    }

    /**
     * Инициализация всех форм с указанным классом
     */
    initForms() {
        const forms = document.querySelectorAll(this.classNameCon);
        
        forms.forEach(form => {
            this.setupForm(form);
        });
    }

    /**
     * Настройка отдельной формы
     */
    setupForm(form) {
        // Установка ID формы, если его нет
        if (!form.id) {
            form.id = 'sfForm' + Math.floor(Math.random() * 999999);
        }

        // Обработка полей ввода
        const inputs = form.querySelectorAll('input');
        const selects = form.querySelectorAll('select');
        const textareas = form.querySelectorAll('textarea');

        // Обработка input элементов
        inputs.forEach(input => {
            if (!input.getAttribute('type')) {
                input.setAttribute('type', 'text');
            }

            // Установка name, если его нет
            if (!input.getAttribute('name')) {
                if (!input.getAttribute('fs-name')) {
                    if (input.id) {
                        input.setAttribute('name', input.id);
                    }
                }
            }

            // Установка ID, если его нет
            if (!input.id) {
                const newName = 'inp' + Math.floor(Math.random() * 999999);
                input.id = newName;
                
                // Связь с label
                const parent = input.parentElement;
                if (parent) {
                    const label = parent.querySelector('label[for]');
                    if (label) {
                        label.setAttribute('for', newName);
                    }
                }
            }
        });

        // Обработка select элементов
        selects.forEach(select => {
            if (!select.id) {
                const newName = 'inp' + Math.floor(Math.random() * 999999);
                select.id = newName;
                
                const parent = select.parentElement;
                if (parent) {
                    const label = parent.querySelector('label[for]');
                    if (label) {
                        label.setAttribute('for', newName);
                    }
                }
            }
        });

        // Обработка textarea элементов
        textareas.forEach(textarea => {
            if (!textarea.id) {
                const newName = 'inp' + Math.floor(Math.random() * 999999);
                textarea.id = newName;
                
                const parent = textarea.parentElement;
                if (parent) {
                    const label = parent.querySelector('label[for]');
                    if (label) {
                        label.setAttribute('for', newName);
                    }
                }
            }
        });

        // Обработка отправки формы
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendForm(form);
        });

        // Обработка изменения полей для autosubmit
        const allFields = form.querySelectorAll('input, textarea, select');
        allFields.forEach(field => {
            field.addEventListener('change', (e) => {
                this._handleFieldChange(e, form);
            });
        });
    }

    /**
     * Обработка изменения имени поля (fs-name логика)
     */
    changesetNameImput(event, form) {
        const target = event.target;
        const fsName = target.getAttribute('fs-name');
        
        if (!fsName) return;

        const inputs = form.querySelectorAll('[fs-name]');

        inputs.forEach(field => {
            if (field.getAttribute('fs-name') === fsName) {
                field.setAttribute('name', fsName);
            }
        });

        // Автоматическая отправка формы
        if (form.getAttribute('autosubmit')) {
            this.sendForm(form);
        }
    }
    
    /**
     * Обработка изменения имени поля (fs-name логика) - алиас
     */
    _handleFieldChange(event, form) {
        const target = event.target;
        const fsName = target.getAttribute('fs-name');
        
        if (!fsName) return;

        const inputs = form.querySelectorAll('[fs-name]');

        inputs.forEach(field => {
            if (field.getAttribute('fs-name') === fsName) {
                field.setAttribute('name', fsName);
            }
        });

        // Автоматическая отправка формы
        if (form.getAttribute('autosubmit')) {
            this.sendForm(form);
        }
    }

    /**
     * Очистка формы после успешной отправки
     */
    defFunctionDone(form) {
        // Очистка полей с классом autoclean
        const autoCleanFields = form.querySelectorAll('.autoclean');
        autoCleanFields.forEach(field => {
            field.value = '';
            if (field.type === 'checkbox' || field.type === 'radio') {
                field.checked = false;
            }
        });

        // Удаление атрибута name у полей с fs-name
        const fsNameFields = form.querySelectorAll('[fs-name]');
        fsNameFields.forEach(field => {
            field.removeAttribute('name');
        });
    }

    /**
     * Отправка формы
     */
    async sendForm(form) {
        this.lastForm = form;

        // Получение callback функций
        let Fbefore = this.Fbefore;
        let FSuccess = this.FSuccess;
        let FError = this.FError;

        // Проверка атрибутов формы для переопределения callbacks
        if (form.getAttribute('before')) {
            Fbefore = window[form.getAttribute('before')];
        }
        if (form.getAttribute('success')) {
            FSuccess = window[form.getAttribute('success')];
        }
        if (form.getAttribute('error')) {
            FError = window[form.getAttribute('error')];
        }

        // Вызов before функции
        if (Fbefore) {
            const beforeResult = Fbefore(form);
            // Если before функция возвращает false, отмена отправки
            if (beforeResult === false) {
                return;
            }
        }

        // Сбор данных формы
        const formData = this.collectFormData(form);

        // Получение параметров запроса
        const actionUrl = form.getAttribute('action');
        const method = (form.getAttribute('method') || 'get').toLowerCase();
        const dataType = form.getAttribute('dataType');
        const enctype = form.getAttribute('enctype');

        if (!actionUrl) {
            console.log('FS error: not have any {action} in tag <Form>');
            return;
        }

        // Определение типа контента
        const hasFile = form.querySelector('input[type="file"]');
        const isMultipart = enctype === 'multipart/form-data' || hasFile;

        try {
            let response;
            let fetchOptions = {
                method: method,
                credentials: 'include'
            };

            if (method === 'get') {
                // Для GET запроса - преобразование в строку параметров
                const params = new URLSearchParams();
                for (const [key, value] of formData.entries()) {
                    params.append(key, value);
                }
                const url = actionUrl + (actionUrl.includes('?') ? '&' : '?') + params.toString();
                response = await fetch(url, {
                    method: 'GET',
                    credentials: 'include'
                });
            } else {
                // Для POST запроса
                if (isMultipart) {
                    // Multipart/form-data для файлов
                    fetchOptions.body = formData;
                } else {
                    // URL-encoded для обычных данных
                    fetchOptions.headers = {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    };
                    const params = new URLSearchParams();
                    for (const [key, value] of formData.entries()) {
                        params.append(key, value);
                    }
                    fetchOptions.body = params.toString();
                }

                response = await fetch(actionUrl, fetchOptions);
            }

            // Обработка ответа
            let data;
            if (dataType === 'json' || response.headers.get('content-type')?.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            // Вызов success функции
            if (FSuccess) {
                FSuccess(data, form);
            }

            // Очистка формы
            this.defFunctionDone(form);

        } catch (error) {
            console.error('FormSender Error:', error);
            // Вызов error функции
            if (FError) {
                FError(error);
            }
        }
    }

    /**
     * Сбор данных формы
     */
    collectFormData(form) {
        const formData = new FormData();

        // Обработка input элементов
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
            const name = input.getAttribute('name') || input.getAttribute('id');
            if (!name) return;

            const type = input.getAttribute('type') || 'text';

            if (type === 'file') {
                if (input.files.length > 0) {
                    if (input.multiple) {
                        Array.from(input.files).forEach(file => {
                            formData.append(name + '[]', file);
                        });
                    } else {
                        formData.append(name, input.files[0]);
                    }
                }
            } else if (type === 'checkbox') {
                formData.append(name, input.checked ? '1' : '0');
            } else if (type === 'radio') {
                if (input.checked) {
                    formData.append(name, input.value);
                }
            } else {
                // Текстовые поля и другие типы
                formData.append(name, input.value);
            }
        });

        // Обработка textarea элементов
        const textareas = form.querySelectorAll('textarea');
        textareas.forEach(textarea => {
            const name = textarea.getAttribute('name') || textarea.getAttribute('id');
            if (name) {
                formData.append(name, textarea.value);
            }
        });

        // Обработка select элементов
        const selects = form.querySelectorAll('select');
        selects.forEach(select => {
            const name = select.getAttribute('name') || select.getAttribute('id');
            if (name) {
                formData.append(name, select.value);
            }
        });

        return formData;
    }

    /**
     * Отправка формы с прогрессом (использует XMLHttpRequest для файлов)
     */
    sendFormWithProgress(form) {
        this.lastForm = form;

        // Получение callback функций
        let Fbefore = this.Fbefore;
        let FSuccess = this.FSuccess;
        let FError = this.FError;
        let FProgress = this.FProgress;

        // Проверка атрибутов формы
        if (form.getAttribute('before')) {
            Fbefore = window[form.getAttribute('before')];
        }
        if (form.getAttribute('success')) {
            FSuccess = window[form.getAttribute('success')];
        }
        if (form.getAttribute('error')) {
            FError = window[form.getAttribute('error')];
        }

        // Вызов before функции
        if (Fbefore) {
            const beforeResult = Fbefore(form);
            if (beforeResult === false) {
                return;
            }
        }

        const actionUrl = form.getAttribute('action');
        const method = (form.getAttribute('method') || 'get').toLowerCase();

        if (!actionUrl) {
            console.log('FS error: not have any {action} in tag <Form>');
            return;
        }

        // Проверка на наличие файлов
        const hasFile = form.querySelector('input[type="file"]');
        
        if (hasFile) {
            // Используем XMLHttpRequest для прогресса загрузки
            this.sendFormWithXHR(form);
        } else {
            // Используем Fetch API для обычных запросов
            this.sendForm(form);
        }
    }

    /**
     * Отправка с XMLHttpRequest (для прогресса загрузки файлов)
     */
    sendFormWithXHR(form) {
        const actionUrl = form.getAttribute('action');
        
        // Получение callback функций
        let FSuccess = this.FSuccess;
        let FError = this.FError;
        let FProgress = this.FProgress;

        if (form.getAttribute('success')) {
            FSuccess = window[form.getAttribute('success')];
        }
        if (form.getAttribute('error')) {
            FError = window[form.getAttribute('error')];
        }

        const xhr = new XMLHttpRequest();
        const formData = this.collectFormData(form);

        // Обработка прогресса загрузки
        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                if (FProgress) {
                    FProgress({
                        count: event.loaded,
                        total: event.total,
                        percent: percentComplete
                    }, form);
                }
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                let data = xhr.response;
                try {
                    data = JSON.parse(xhr.responseText);
                } catch (e) {
                    // Оставляем как текст
                }
                if (FSuccess) {
                    FSuccess(data, form);
                }
                this.defFunctionDone(form);
            } else {
                if (FError) {
                    FError(xhr);
                }
            }
        });

        xhr.addEventListener('error', () => {
            if (FError) {
                FError(xhr);
            }
        });

        xhr.open('POST', actionUrl);
        xhr.send(formData);
    }
}

// Автоматическая инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    window.FormSender = FormSender;
    // Создание глобального экземпляра
    window.fsInstance = new FormSender();
});

// Экспорт для модулей
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormSender;
}
