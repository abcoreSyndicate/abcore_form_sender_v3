/**
 * Abral Syndicate
 * FormSender2 - Vanilla JavaScript Version
 * Отправка форм без jQuery с использованием Fetch API
 * Сохраняет полную совместимость с оригинальным функционалом FormSender2
 *
 * Изменения v2.2.0:
 *  - Исправлена двойная отправка формы:
 *      * Добавлен re-entrance guard в sendForm / sendFormWithXHR
 *        (флаг form.dataset.fsSubmitting)
 *      * Добавлена защита setupForm от повторной инициализации
 *        (флаг form.dataset.fsInited)
 *  - Вспомогательные методы _isSubmitting / _markSubmitting
 *  - В sendFormWithXHR блокировка/разблокировка формы и снятие
 *    флага выполняются в единой функции finish() во всех ветках выхода
 */



// ============================================================
// FormSender Class
// ============================================================
class FormSender {

    constructor(classNameCon = '.fs') {
        // Callback функции по умолчанию
        this.FSuccess  = (e,f) => { console.log( f.id+' done'); };
        this.FError    = (e) => { console.log( f.id+' error'); };
        this.Fbefore   = (e) => { console.log( f.id+' prepare data...'); };
        this.FProgress = (e, form) => {};

        this.lastForm = null;
        this.classNameCon = classNameCon;

        // Crypto settings
        this.k_key = '';
        this.v_key = '';
        this.r_key = '';
        this.allow_crypto = 0;

        this.initForms();
    }

    // ============================================================
    // Public API
    // ============================================================

    /**
     * Set encryption keys.
     * @param {string} key1 - ключ для имён полей (k_key) и r_key по умолчанию
     * @param {string} [key2] - ключ для значений (v_key)
     * @param {string} [key3] - ключ для декодирования ответа (r_key)
     */
    setKey(key1, key2 = '', key3 = '') {
        this.k_key = key1;
        this.v_key = key2 || key1;
        this.r_key = key3 || key1;
    }

    /**
     * Enable or disable crypto encoding globally.
     * @param {number} value - 0 to disable, 1 to enable
     */
    setAllowCrypto(value) {
        this.allow_crypto = value;
    }

    // ============================================================
    // Private helpers — re-entrance guard
    // ============================================================

    /**
     * Is form currently submitting?
     * @param {HTMLFormElement} form
     * @returns {boolean}
     */
    _isSubmitting(form) {
        return form && form.dataset && form.dataset.fsSubmitting === '1';
    }

    /**
     * Mark form as submitting / not submitting.
     * @param {HTMLFormElement} form
     * @param {boolean} value
     */
    _markSubmitting(form, value) {
        if (!form || !form.dataset) return;
        if (value) {
            form.dataset.fsSubmitting = '1';
        } else {
            delete form.dataset.fsSubmitting;
        }
    }

    // ============================================================
    // Private helpers — callbacks / params
    // ============================================================

    /**
     * Resolve callbacks from form attributes (before/success/error) or fall back to defaults.
     * @param {HTMLFormElement} form
     * @returns {{Fbefore, FSuccess, FError, FProgress}}
     */
    _resolveCallbacks(form) {
        const cb = {
            Fbefore:   this.Fbefore,
            FSuccess:  this.FSuccess,
            FError:    this.FError,
            FProgress: this.FProgress
        };
        const beforeName  = form.getAttribute('before');
        const successName = form.getAttribute('success');
        const errorName   = form.getAttribute('error');

        if (beforeName  && typeof window[beforeName]  === 'function') cb.Fbefore  = window[beforeName];
        if (successName && typeof window[successName] === 'function') cb.FSuccess = window[successName];
        if (errorName   && typeof window[errorName]   === 'function') cb.FError   = window[errorName];

        return cb;
    }

    /**
     * Read submit-related params from the form.
     * @param {HTMLFormElement} form
     * @returns {{actionUrl, method, dataType, enctype}}
     */
    _getSubmitParams(form) {
        return {
            actionUrl: form.getAttribute('action'),
            method:    (form.getAttribute('method') || 'get').toLowerCase(),
            dataType:  form.getAttribute('dataType'),
            enctype:   form.getAttribute('enctype')
        };
    }

    /**
     * Run before-callback. Returns false if submission should be aborted.
     * @param {HTMLFormElement} form
     * @param {Function} Fbefore
     * @returns {boolean}
     */
    _runBefore(form, Fbefore) {
        if (!Fbefore) return true;
        return Fbefore(form) !== false;
    }

    // ============================================================
    // Private helpers — lock / unlock
    // ============================================================

    /**
     * Selector of all interactive controls inside a form
     * + controls bound via HTML5 form="id" attribute.
     */
    _controlsFor(form) {
        const linkedSelector = `input[form="${form.id}"], select[form="${form.id}"], textarea[form="${form.id}"], button[form="${form.id}"]`;
        return [
            ...form.querySelectorAll('input, select, textarea, button, checkbox, radio'),
            ...document.querySelectorAll(linkedSelector)
        ];
    }

    /**
     * Lock a single element if it isn't already locked.
     * - Already locked (.disabled class OR disabled property): mark with .no_may_undisabled
     * - Otherwise: disable it (.disabled + disabled = true + sentinel .fs-locked)
     * Idempotent — safe to call multiple times on the same element.
     */
    _lockElement(el) {
        if (el.classList.contains('fs-locked')) return; // already managed by us

        const wasDisabled = el.disabled || el.classList.contains('disabled');
        if (wasDisabled) {
            el.classList.add('no_may_undisabled');
        } else {
            el.classList.add('disabled', 'fs-locked');
            el.disabled = true;
        }
    }

    /**
     * Unlock a single element unless it was already disabled before submission.
     */
    _unlockElement(el) {
        if (el.classList.contains('no_may_undisabled')) {
            // Was disabled by someone else — keep state, just clear the marker
            el.classList.remove('no_may_undisabled');
            return;
        }
        if (el.classList.contains('fs-locked')) {
            el.classList.remove('disabled', 'fs-locked');
            el.disabled = false;
        }
    }

    /**
     * Lock all interactive controls in the form.
     */
    _lockForm(form) {
        this._controlsFor(form).forEach(el => this._lockElement(el));
    }

    /**
     * Unlock all interactive controls in the form.
     */
    _unlockForm(form) {
        this._controlsFor(form).forEach(el => this._unlockElement(el));
    }

    // ============================================================
    // Private helpers — spinner & external button
    // ============================================================

    /**
     * Show the spinner referenced by speener attribute.
     * @returns {HTMLElement|null}
     */
    _showSpinner(form) {
        const id = form.getAttribute('speener');
        if (!id) return null;
        const el = document.getElementById(id);
        if (el) el.style.opacity = '1';
        return el || null;
    }

    /**
     * @param {HTMLElement|null} el
     */
    _hideSpinner(el) {
        if (el) el.style.opacity = '0';
    }

    /**
     * Disable the external button referenced by btn-disable attribute.
     * Honors the same .no_may_undisabled rule.
     * @returns {HTMLElement|null}
     */
    _lockExternalButton(form) {
        const id = form.getAttribute('btn-disable');
        if (!id) return null;
        const btn = document.getElementById(id);
        if (!btn) return null;
        this._lockElement(btn);
        return btn;
    }

    /**
     * @param {HTMLElement|null} btn
     */
    _unlockExternalButton(btn) {
        if (!btn) return;
        this._unlockElement(btn);
    }

    // ============================================================
    // Private helpers — response parsing & fetch body
    // ============================================================

    /**
     * Parse response body according to crypto/dataType/content-type headers.
     * @param {Response} response
     * @param {string} dataType
     * @returns {Promise<*>}
     */
    async _parseResponse(response, dataType) {
        // Crypto-encoded response
        if (response.headers.get('X-Form-Crypto') === 'encoded') {
            const raw = await response.text();
            const decoded = this.ab_decode(raw, this.r_key);
            // ab_decode returns { text, salt, salt_len } — use .text
            return JSON.parse(decoded.text);
        }
        const ct = response.headers.get('content-type') || '';
        if (dataType === 'json' || ct.includes('application/json')) {
            return await response.json();
        }
        return await response.text();
    }

    /**
     * Build {headers, body} for a POST request based on crypto / multipart detection.
     * @param {HTMLFormElement} form
     * @param {FormData} formData
     * @returns {{headers?: object, body: *}}
     */
    _buildPostOptions(form, formData) {
        const hasFile    = form.querySelector('input[type="file"]');
        const isMultipart = form.getAttribute('enctype') === 'multipart/form-data' || !!hasFile;
        const useCrypto  = this._shouldUseCrypto(form);

        if (useCrypto && !isMultipart) {
            return {
                headers: {
                    'Content-Type':  'application/json',
                    'X-Form-Crypto': 'encoded'
                },
                body: JSON.stringify(this._encodeFormData(formData))
            };
        }
        if (isMultipart) {
            return { body: formData };
        }
        const params = new URLSearchParams();
        for (const [k, v] of formData.entries()) params.append(k, v);
        return {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        };
    }

    // ============================================================
    // Crypto
    // ============================================================

    /**
     * Check if crypto should be used for this form.
     */
    _shouldUseCrypto(form) {
        if (this.allow_crypto !== 1) return false;
        if (!form.getAttribute('use-crypto')) return false;
        if (!this.k_key) {
            console.warn('FS: use-crypto is set but k_key is empty');
            return false;
        }
        if (!this.v_key) this.v_key = this.k_key;
        return true;
    }

    /**
     * Encode form data keys and values using ab_encode.
     */
    _encodeFormData(formData) {
        const encoded = {};
        for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
                encoded[key] = value;
            } else {
                const encKey   = this.ab_encode(String(key),   this.k_key);
                const encValue = this.ab_encode(String(value), this.v_key);
                encoded[encKey.code] = encValue.code;
            }
        }
        return encoded;
    }

    generateRandomHex(length) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    ab_encode(w, sk) {
        if (w === '' || sk === '') {
            console.log('empty string?');
            return { original: w, code: '', key: sk };
        }

        const soap_len = Math.floor(Math.random() * (64 - 32 + 1)) + 32;
        const soap = this.generateRandomHex(soap_len);
        const w_s = w + soap + soap_len;

        const w_a  = Array.from(w_s);
        const sk_a = Array.from(sk);

        let it = -1;
        let isk = -1;
        const res = [];

        while (it < w_a.length - 1) {
            it++;
            isk++;
            if (isk >= sk_a.length) isk = 0;

            const ordS = w_a[it].charCodeAt(0);
            const ordk = sk_a[isk].charCodeAt(0);
            res.push(ordS + ordk);
        }

        return { original: w, code: res.join('.'), key: sk };
    }

    ab_decode(encoded, sk) {
        if (encoded === '' || sk === '') {
            throw new Error('empty string');
        }

        const w_a  = encoded.split('.');
        const sk_a = Array.from(sk);

        let it = -1;
        let isk = -1;
        const res = [];

        while (it < w_a.length - 1) {
            it++;
            isk++;
            if (isk >= sk_a.length) isk = 0;

            const ordE = parseInt(w_a[it], 10);
            const ordk = sk_a[isk].charCodeAt(0);
            res.push(String.fromCharCode(ordE - ordk));
        }

        const result = res.join('');

        const salt_len_str = result.slice(-2);
        const salt_len = parseInt(salt_len_str, 10);
        const salt_hex_len = salt_len * 2;
        const salt_with_len = salt_hex_len + 2;

        const original_text = result.slice(0, result.length - salt_with_len);
        const salt_part = result.slice(result.length - salt_with_len);
        const salt = salt_part.slice(0, salt_part.length - 2);

        return { text: original_text, salt: salt, salt_len: salt_len };
    }

    // ============================================================
    // Forms lifecycle
    // ============================================================

    initForms() {
        const forms = document.querySelectorAll(this.classNameCon);
        forms.forEach(form => this.setupForm(form));
    }

    setupForm(form) {
        if (!form.id) {
            form.id = 'sfForm' + Math.floor(Math.random() * 999999);
        }

        // ✅ Защита от повторной инициализации (предотвращает дублирование слушателей)
        if (form.dataset.fsInited) return;
        form.dataset.fsInited = '1';

        // Auto-id + label[for] link for input/select/textarea
        const all = form.querySelectorAll('input, select, textarea');
        all.forEach(el => {
            if (el.tagName === 'INPUT' && !el.getAttribute('type')) {
                el.setAttribute('type', 'text');
            }
            if (!el.id) {
                const newName = 'inp' + Math.floor(Math.random() * 999999);
                el.id = newName;
                const parent = el.parentElement;
                if (parent) {
                    const label = parent.querySelector('label[for]');
                    if (label) label.setAttribute('for', newName);
                }
            }
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendForm(form);
        });

        // Internal field change → fs-name logic
        form.querySelectorAll('input, textarea, select').forEach(field => {
            field.addEventListener('change', (e) => this.changesetNameImput(e, form));
        });

        // External fields bound via HTML5 form="id"
        document.querySelectorAll(
            `textarea[form="${form.id}"], input[form="${form.id}"], select[form="${form.id}"]`
        ).forEach(field => {
            field.addEventListener('change', (e) => this.changesetNameImput(e, form));
        });
    }

    /**
     * fs-name "radio-group" emulation + optional autosubmit.
     */
    changesetNameImput(event, form) {
        const target = event.target;
        const fsName = target.getAttribute('fs-name');
        if (!fsName) return;

        form.querySelectorAll('[fs-name]').forEach(field => {
            if (field.getAttribute('fs-name') === fsName) {
                field.removeAttribute('name');
            }
        });
        target.setAttribute('name', fsName);

        if (form.getAttribute('autosubmit')) {
            this.sendForm(form);
        }
    }

    /**
     * Clear .autoclean fields and remove name from [fs-name] fields after success.
     */
    defFunctionDone(form) {
        form.querySelectorAll('.autoclean').forEach(field => {
            field.value = '';
            if (field.type === 'checkbox' || field.type === 'radio') {
                field.checked = false;
            }
        });
        form.querySelectorAll('[fs-name]').forEach(field => field.removeAttribute('name'));
    }

    // ============================================================
    // Submission
    // ============================================================

    /**
     * Submit the form via Fetch API.
     */
    async sendForm(form) {
        // ✅ Re-entrance guard: пропускаем повторные вызовы, пока идёт отправка
        if (this._isSubmitting(form)) return;
        this._markSubmitting(form, true);

        this.lastForm = form;

        const callbacks   = this._resolveCallbacks(form);
        const spinner     = this._showSpinner(form);
        const externalBtn = this._lockExternalButton(form);
        this._lockForm(form);

        try {
            if (!this._runBefore(form, callbacks.Fbefore)) return;

            const params = this._getSubmitParams(form);
            if (!params.actionUrl) {
                console.log('FS error: not have any {action} in tag <Form>');
                return;
            }

            const formData = this.collectFormData(form);
            const fetchOptions = { method: params.method, credentials: 'include' };
            let response;

            if (params.method === 'get') {
                const urlParams = new URLSearchParams();
                for (const [k, v] of formData.entries()) urlParams.append(k, v);
                const url = params.actionUrl + (params.actionUrl.includes('?') ? '&' : '?') + urlParams.toString();
                response = await fetch(url, { method: 'GET', credentials: 'include' });
            } else {
                Object.assign(fetchOptions, this._buildPostOptions(form, formData));
                response = await fetch(params.actionUrl, fetchOptions);
            }

            const data = await this._parseResponse(response, params.dataType);
            if (callbacks.FSuccess) callbacks.FSuccess(data, form);
            this.defFunctionDone(form);
        } catch (error) {
            console.error('FormSender Error:', error);
            if (callbacks.FError) callbacks.FError(error);
        } finally {
            this._unlockForm(form);
            this._unlockExternalButton(externalBtn);
            this._hideSpinner(spinner);
            this._markSubmitting(form, false); // ✅ снимаем флаг всегда
        }
    }

    /**
     * Submit the form, choosing XHR (with progress for files) or Fetch.
     */
    sendFormWithProgress(form) {
        this.lastForm = form;
        if (form.querySelector('input[type="file"]')) {
            this.sendFormWithXHR(form);
        } else {
            this.sendForm(form);
        }
    }

    /**
     * Submit via XMLHttpRequest (needed for upload-progress events).
     */
    sendFormWithXHR(form) {
        // ✅ Re-entrance guard
        if (this._isSubmitting(form)) return;
        this._markSubmitting(form, true);

        this.lastForm = form;

        const callbacks   = this._resolveCallbacks(form);
        const spinner     = this._showSpinner(form);
        const externalBtn = this._lockExternalButton(form);
        this._lockForm(form);

        const finish = () => {
            this._unlockForm(form);
            this._unlockExternalButton(externalBtn);
            this._hideSpinner(spinner);
            this._markSubmitting(form, false); // ✅ единая точка снятия флага
        };

        if (!this._runBefore(form, callbacks.Fbefore)) {
            finish();
            return;
        }

        const params = this._getSubmitParams(form);
        if (!params.actionUrl) {
            console.log('FS error: not have any {action} in tag <Form>');
            finish();
            return;
        }

        const xhr = new XMLHttpRequest();
        const formData = this.collectFormData(form);

        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable && callbacks.FProgress) {
                const percent = Math.round((event.loaded / event.total) * 100);
                callbacks.FProgress({ count: event.loaded, total: event.total, percent }, form);
            }
        });

        xhr.addEventListener('load', () => {
            try {
                let data = xhr.response;
                try { data = JSON.parse(xhr.responseText); } catch (e) { /* keep as text */ }

                if (xhr.status >= 200 && xhr.status < 300) {
                    if (callbacks.FSuccess) callbacks.FSuccess(data, form);
                    this.defFunctionDone(form);
                } else if (callbacks.FError) {
                    callbacks.FError(xhr);
                }
            } finally {
                finish();
            }
        });

        xhr.addEventListener('error', () => {
            try {
                if (callbacks.FError) callbacks.FError(xhr);
            } finally {
                finish();
            }
        });

        xhr.open('POST', params.actionUrl);
        xhr.send(formData);
    }

    /**
     * Collect form data into FormData, honouring input types.
     */
    collectFormData(form) {
        const formData = new FormData();

        form.querySelectorAll('input').forEach(input => {
            const name = input.getAttribute('name');
            if (!name) return;
            const type = input.getAttribute('type') || 'text';

            if (type === 'file') {
                if (input.files.length > 0) {
                    if (input.multiple) {
                        Array.from(input.files).forEach(file => formData.append(name + '[]', file));
                    } else {
                        formData.append(name, input.files[0]);
                    }
                }
            } else if (type === 'checkbox') {
                formData.append(name, input.checked ? '1' : '0');
            } else if (type === 'radio') {
                if (input.checked) formData.append(name, input.value);
            } else {
                formData.append(name, input.value);
            }
        });

        form.querySelectorAll('textarea').forEach(textarea => {
            const name = textarea.getAttribute('name') || textarea.getAttribute('id');
            if (name) formData.append(name, textarea.value);
        });

        form.querySelectorAll('select').forEach(select => {
            const name = select.getAttribute('name') || select.getAttribute('id');
            if (name) formData.append(name, select.value);
        });

        return formData;
    }
}

// Автоматическая инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    window.FormSender = FormSender;
    window.fsInstance = new FormSender();
});

// Экспорт для модулей
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FormSender };
}
