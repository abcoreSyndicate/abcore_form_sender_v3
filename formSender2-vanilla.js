/**
 * Abral Syndicate
 * FormSender2 - Vanilla JavaScript Version
 * Отправка форм без jQuery с использованием Fetch API
 * Сохраняет полную совместимость с оригинальным функционалом FormSender2
 * @version 2.0.0 - With Crypto Support
 */

// ============================================================
// FormSender Class
// ============================================================
class FormSender {

    constructor(classNameCon = '.fs') {
        // Callback функции
        this.FSuccess = (e) => { alert('done'); console.log(e); };
        this.FError = (e) => { alert('error'); };
        this.Fbefore = (e) => { alert('до запуска'); };
        this.FProgress = (e, form) => {};

        this.lastForm = null;
        this.classNameCon = classNameCon;

        // Crypto settings
        this.k_key = '';           // Secret key for encryption
        this.v_key = '';           // Secret key for encryption
        this.r_key = '';           // Secret key for encryption
        this.allow_crypto = 0;     // Global crypto switch (0 = disabled, 1 = enabled)

        // Инициализация форм
        this.initForms();
    }

    /**
     * Set encryption key
     * @param {string} key - Secret key for encoding
     */
    setKey(key1, key2 = '', key3 = '') {
        this.k_key = key1;
        if( key2 ){ this.v_key = key2; }else{ this.v_key = key1; }
        if( key3 ){ this.r_key = key3; }else{ this.r_key = key1; }
    }

    /**
     * Enable or disable crypto encoding
     * @param {number} value - 0 to disable, 1 to enable
     */
    setAllowCrypto(value) {
        this.allow_crypto = value;
    }

    /**
     * Check if crypto should be used for this form
     * @param {HTMLFormElement} form - The form element
     * @returns {boolean}
     */
    _shouldUseCrypto(form) {
        // Check if global crypto is enabled
        if (this.allow_crypto !== 1) {
            return false;
        }

        // Check if form has use-crypto attribute
        if (!form.getAttribute('use-crypto')) {
            return false;
        }

        // Check if k_key is not empty
        if (!this.k_key || this.k_key === '') {
            console.warn('FS: use-crypto is set but k_key is empty');
            return false;
        }
		
		if ( !this.v_key ){
			this.v_key = this.k_key;
		}

        return true;
    }

    /**
     * Encode form data keys and values using ab_encode
     * @param {FormData} formData - Original form data
     * @returns {Object} - Object with encoded keys and values
     */
    _encodeFormData(formData) {
        const encodedData = {

        };

        for (const [key, value] of formData.entries()) {
            // Skip files (can't encode File objects)
            if (value instanceof File) {
                encodedData[key] = value;
            } else {
                // Encode both key and value
                const encodedKey = this.ab_encode(String(key), this.k_key);
                const encodedValue = this.ab_encode(String(value), this.v_key);
                encodedData[encodedKey.code] = encodedValue.code;

            }
        }

        return encodedData;
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
                this.changesetNameImput(e, form);
            });
        });
		
		const allFieldsOutForm = document.querySelectorAll('textarea[form="'+form.id+'"], input[form="'+form.id+'"], select[form="'+form.id+'"]');
		
        allFieldsOutForm.forEach(field => {
            field.addEventListener('change', (e) => {
                this.changesetNameImput(e, form);
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
                field.removeAttribute('name');
            }
        });
		target.setAttribute('name', fsName);

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
		
		if (form.getAttribute('speener')) {
            var Speener = document.getElementById( form.getAttribute('speener') );
			Speener.classList.remove( 'd-none' );
        }
		
		if (form.getAttribute('btn-disable')) {
            var btnDisable = document.getElementById( form.getAttribute('btn-disable') );
			btnDisable.classList.add( 'disabled' );
			btnDisable.disabled = true;
        }
		
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

        // Проверка на использование криптографии
        const useCrypto = this._shouldUseCrypto(form);
		
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
                if ( useCrypto ) {
					if( !isMultipart ){
						// Использование криптографии для POST (без файлов)
						const encodedData = this._encodeFormData(formData);

						fetchOptions.headers = {
							'Content-Type': 'application/json',
							'X-Form-Crypto': 'encoded'  // Header indicating crypto is used
						};
						fetchOptions.body = JSON.stringify(encodedData);
					}
                } else if (isMultipart) {
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
			
			if( response.headers.get('X-Form-Crypto') == 'encoded' ){
				TR = await response.text();
				TR = this.ab_decode( TR, this.r_key );
				data = JSON.parse( TR );
			}else{
				if (dataType === 'json' || response.headers.get('content-type')?.includes('application/json')) {
					data = await response.json();
				} else {
					data = await response.text();
				}
			}

            // Вызов success функции
            if (FSuccess) {
                FSuccess(data, form);
            }

            // Очистка формы
            this.defFunctionDone(form);
			if( Speener ){
				Speener.classList.add( 'd-none' );
			}
			if( btnDisable ){
				btnDisable.classList.remove( 'disabled' );
				btnDisable.disabled = false;
			}

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
            const name = input.getAttribute('name');
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
                    FProgress({ count: event.loaded, total: event.total, percent: percentComplete }, form);
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
	
	// ============================================================
	// Helper Functions for Random Hex Generation
	// ============================================================
	generateRandomHex(length) {
		const array = new Uint8Array(length);
		crypto.getRandomValues(array);
		return Array.from(array)
			.map(b => b.toString(16).padStart(2, '0'))
			.join('');
	}

	// ============================================================
	// ab_encode - Encode string with salt and key
	// ============================================================
	
	ab_encode(w, sk) {
    if (w === '' || sk === '') {
        console.log( 'empty string?' );
		return {
        original: w,
        code: '',
        key: sk
		};
    }

    // Generate random soap (salt) - length between 32-64
    const soap_len = Math.floor(Math.random() * (64 - 32 + 1)) + 32;
    const soap = this.generateRandomHex(soap_len);

    // Combine word, soap, and soap_len
    const w_s = w + soap + soap_len;

    // Split into arrays of characters (Unicode-safe)
    const w_a = Array.from(w_s);
    const sk_a = Array.from(sk);

    let it = -1;
    let isk = -1;
    const res = [];

    while (it < w_a.length - 1) {
        it++;
        isk++;
        if (isk >= sk_a.length) {
            isk = 0;
        }

        const ordS = w_a[it].charCodeAt(0);
        const ordk = sk_a[isk].charCodeAt(0);
        const sword = ordS + ordk;
        res.push(sword);
    }

    return {
        original: w,
        code: res.join('.'),
        key: sk
    };
}

	// ============================================================
	// ab_decode - Decode string with salt and key
	// ============================================================
	ab_decode(encoded, sk) {
    if (encoded === '' || sk === '') {
        throw new Error('empty string');
    }

    // Split encoded string by '.'
    const w_a = encoded.split('.');
    const sk_a = Array.from(sk);

    let it = -1;
    let isk = -1;
    const res = [];

    while (it < w_a.length - 1) {
        it++;
        isk++;
        if (isk >= sk_a.length) {
            isk = 0;
        }

        const ordE = parseInt(w_a[it], 10);
        const ordk = sk_a[isk].charCodeAt(0);
        const sword = ordE - ordk;

        res.push(String.fromCharCode(sword));
    }

    const result = res.join('');

    // Extract salt length from the end of the string
    // The last 2 characters are the salt_len value
    const salt_len_str = result.slice(-2);
    const salt_len = parseInt(salt_len_str, 10);

    // Calculate total length of salt part (hex salt + length indicator)
    const salt_hex_len = salt_len * 2; // Each byte = 2 hex chars
    const salt_with_len = salt_hex_len + 2;

    // Extract original text (before salt+length) and salt
    const original_text = result.slice(0, result.length - salt_with_len);
    const salt_part = result.slice(result.length - salt_with_len);
    const salt = salt_part.slice(0, salt_part.length - 2);

    return {
        text: original_text,
        salt: salt,
        salt_len: salt_len
    };
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
    module.exports = { FormSender };
}
