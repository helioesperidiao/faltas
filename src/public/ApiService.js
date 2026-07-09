/**
 * Classe ApiService para facilitar chamadas HTTP (GET, POST, PUT, DELETE) a APIs RESTful.
 * Suporta autenticação via token Bearer e fornece métodos reutilizáveis para diferentes tipos de requisições.
 */
export default class ApiService {
    #token;  // Atributo privado para armazenar o token de autenticação

    /**
     * Construtor da classe ApiService.
     * @param {string|null} token - Token de autenticação opcional para incluir no header Authorization.
     */
    constructor(token = null) {
        this.#token = token;
        console.log('[ApiService] Instância criada com token:', token ? '✅ Presente' : '❌ Não fornecido');
    }

    /**
     * Método auxiliar para montar os headers padrão.
     * @param {boolean} multipart - Indica se deve usar multipart/form-data (não implementado).
     * @returns {Object} Objeto com os headers configurados.
     */
    _getHeaders() {
        const headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        };
        if (this.#token) {
            headers["Authorization"] = `Bearer ${this.#token}`;
        }
        return headers;
    }

    /**
     * Método interno para registrar logs detalhados da requisição e resposta.
     * @param {string} method - Método HTTP (GET, POST, etc.)
     * @param {string} url - URL da requisição
     * @param {Object} options - Opções da requisição (headers, body, etc.)
     * @param {Object} response - Objeto de resposta (opcional)
     * @param {Object} responseBody - Corpo da resposta (opcional)
     * @param {Error} error - Erro (opcional)
     */
    _logRequest(method, url, options = {}, response = null, responseBody = null, error = null) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            method,
            url,
            headers: { ...options.headers },
            body: options.body ? JSON.parse(options.body) : undefined
        };

        // Oculta parte do token por segurança
        if (logEntry.headers && logEntry.headers.Authorization) {
            const token = logEntry.headers.Authorization.replace('Bearer ', '');
            logEntry.headers.Authorization = `Bearer ${token.slice(0, 6)}...${token.slice(-4)}`;
        }

        if (error) {
            console.error(`[ApiService] ❌ ERRO ${method} ${url}:`, {
                ...logEntry,
                error: {
                    message: error.message,
                    stack: error.stack
                }
            });
            return;
        }

        if (response) {
            console.log(`[ApiService] 📡 ${method} ${url} → ${response.status} ${response.statusText}`);
            console.log(`[ApiService] 📤 Requisição:`, logEntry);
            if (responseBody) {
                console.log(`[ApiService] 📥 Resposta:`, responseBody);
            }
        } else {
            console.log(`[ApiService] 📤 ${method} ${url}`, logEntry);
        }
    }

    /**
     * Método para fazer uma requisição GET simples sem headers adicionais.
     * Útil para APIs públicas que não requerem autenticação.
     * @param {string} uri - URL do recurso para a requisição GET.
     * @returns {Promise<Object|Array>} Retorna o JSON obtido da resposta ou array vazio em caso de erro.
     */
    async simpleGet(uri) {
        console.log(`[ApiService] 🔍 simpleGet() iniciado para: ${uri}`);
        try {
            const response = await fetch(uri);
            const jsonObj = await response.json();
            this._logRequest('GET', uri, {}, response, jsonObj);
            return jsonObj;
        } catch (error) {
            this._logRequest('GET', uri, {}, null, null, error);
            return [];
        }
    }

    /**
     * Método para requisição GET com headers, incluindo token se presente.
     * Usado para APIs que exigem autenticação ou headers customizados.
     * @param {string} uri - URL do recurso para a requisição GET.
     * @returns {Promise<Object|Array>} Retorna JSON da resposta ou array vazio em caso de erro.
     */
    async get(uri) {
        console.log(`[ApiService] 🔍 get() iniciado para: ${uri}`);
        try {
            const headers = this._getHeaders();
            const options = { method: "GET", headers };
            const response = await fetch(uri, options);
            const jsonObj = await response.json();
            this._logRequest('GET', uri, options, response, jsonObj);
            return jsonObj;
        } catch (error) {
            this._logRequest('GET', uri, {}, null, null, error);
            return [];
        }
    }

    /**
     * Método para buscar um recurso específico pelo ID via GET.
     * Monta a URL com o ID no final e faz a requisição.
     * @param {string} uri - URL base do recurso.
     * @param {string|number} id - Identificador do recurso a ser buscado.
     * @returns {Promise<Object|null>} Retorna JSON do recurso ou null em caso de erro.
     */
    async getById(uri, id) {
        const fullUri = `${uri}/${id}`;
        console.log(`[ApiService] 🔍 getById() iniciado para: ${fullUri}`);
        try {
            const headers = this._getHeaders();
            const options = { method: "GET", headers };
            const response = await fetch(fullUri, options);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} - ${response.statusText}`);
            }
            const jsonObj = await response.json();
            this._logRequest('GET', fullUri, options, response, jsonObj);
            return jsonObj;
        } catch (error) {
            this._logRequest('GET', fullUri, {}, null, null, error);
            return null;
        }
    }

    /**
     * Método para enviar dados via POST para criar um novo recurso.
     * Envia o objeto JSON serializado no corpo da requisição.
     * @param {string} uri - URL do endpoint para POST.
     * @param {Object} jsonObject - Objeto a ser enviado como corpo JSON.
     * @returns {Promise<Object|Array>} Retorna JSON da resposta ou array vazio em caso de erro.
     */
    async post(uri, jsonObject) {
        console.log(`[ApiService] 📤 post() iniciado para: ${uri}`);
        try {
            const headers = this._getHeaders();
            const options = {
                method: "POST",
                headers,
                body: JSON.stringify(jsonObject)
            };
            const response = await fetch(uri, options);
            const jsonObj = await response.json();
            this._logRequest('POST', uri, options, response, jsonObj);
            return jsonObj;
        } catch (error) {
            this._logRequest('POST', uri, { body: JSON.stringify(jsonObject) }, null, null, error);
            return [];
        }
    }

    /**
     * Método para atualizar um recurso via PUT usando ID e objeto JSON.
     * @param {string} uri - URL base do recurso.
     * @param {string|number} id - ID do recurso a ser atualizado.
     * @param {Object} jsonObject - Dados atualizados a serem enviados no corpo da requisição.
     * @returns {Promise<Object|null>} Retorna JSON da resposta ou null em caso de erro.
     */
    async put(uri, id, jsonObject) {
        const fullUri = `${uri}/${id}`;
        console.log(`[ApiService] 📤 put() iniciado para: ${fullUri}`);
        try {
            const headers = this._getHeaders();
            const options = {
                method: "PUT",
                headers,
                body: JSON.stringify(jsonObject)
            };
            const response = await fetch(fullUri, options);
            const jsonObj = await response.json();
            this._logRequest('PUT', fullUri, options, response, jsonObj);
            return jsonObj;
        } catch (error) {
            this._logRequest('PUT', fullUri, { body: JSON.stringify(jsonObject) }, null, null, error);
            return null;
        }
    }

    /**
     * Método para deletar um recurso via DELETE usando ID.
     * @param {string} uri - URL base do recurso.
     * @param {string|number} id - ID do recurso a ser deletado.
     * @returns {Promise<Object|null>} Retorna JSON da resposta ou null se não houver corpo ou erro.
     */
    async delete(uri, id) {
        const fullUri = `${uri}/${id}`;
        console.log(`[ApiService] 🗑️ delete() iniciado para: ${fullUri}`);
        try {
            const headers = this._getHeaders();
            const options = { method: "DELETE", headers };
            const response = await fetch(fullUri, options);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} - ${response.statusText}`);
            }
            // DELETE pode não ter corpo, então tentamos parsear JSON ou retornar null
            let jsonObj = null;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                jsonObj = await response.json();
            }
            this._logRequest('DELETE', fullUri, options, response, jsonObj);
            return jsonObj;
        } catch (error) {
            this._logRequest('DELETE', fullUri, {}, null, null, error);
            return null;
        }
    }

    /**
     * Getter para o token privado.
     * @returns {string|null} Retorna o token atual.
     */
    get token() {
        return this.#token;
    }

    /**
     * Setter para atualizar o token privado.
     * @param {string} value - Novo token a ser setado.
     */
    set token(value) {
        this.#token = value;
        console.log('[ApiService] 🔑 Token atualizado');
    }
}