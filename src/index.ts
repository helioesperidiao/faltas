// ============================================================================
// src/index.ts
// PONTO DE ENTRADA DA APLICAÇÃO
// ============================================================================

// Side-effect import: carrega .env como o PRIMEIRO módulo avaliado.
// Em ESM, todos os imports são hoisted e executados em ordem antes do corpo
// do módulo. `import 'dotenv/config'` garante que process.env já esteja
// populado quando Server.ts (e seus dependentes) forem avaliados.
// Não troque por `import dotenv from 'dotenv'; dotenv.config();` no corpo:
// nesse caso o `import { Server }` acima seria hoisted e rodaria ANTES
// do dotenv.config(), fazendo o log/MongoDatabase lerem envs vazias.
import 'dotenv/config';

import { Server } from "./Server";
import { createLogger } from "./logging/Logger";

const log = createLogger("Bootstrap");

/**
 * Função assíncrona que inicializa e inicia o servidor.
 *
 * Este é o ponto de entrada da aplicação. Ela:
 * 1. Define a porta com base na variável de ambiente PORT ou fallback para 3000.
 * 2. Instancia o servidor com a porta definida.
 * 3. Aguarda a inicialização completa do servidor (conexão com banco, middlewares, rotas).
 * 4. Inicia a escuta HTTP.
 *
 * Caso ocorra qualquer erro durante a inicialização, a função captura a exceção,
 * registra no log e encerra o processo com código de erro (1).
 *
 * @returns {Promise<void>} Não retorna valor.
 */
const startServer = async (): Promise<void> => {
    try {
        // Segredos não têm valor de reserva no código: sem eles o servidor não sobe.
        const faltando = ["JWT_SECRET"].filter(nome => !process.env[nome]);
        if (faltando.length > 0) {
            throw new Error(`Variáveis ausentes no .env: ${faltando.join(", ")}. Copie .env.example para .env e preencha.`);
        }

        // Define a porta: prioriza a variável de ambiente PORT, senão usa 3000.
        // Garante que PORT seja um number (ou fallback para 3000 se inválido).
        const rawPort = process.env.PORT;
        const parsedPort = rawPort ? parseInt(rawPort, 10) : NaN;
        const PORT: number = !Number.isNaN(parsedPort) ? parsedPort : 3000;

        // Instancia o servidor com a porta configurada
        const server = new Server(PORT);

        // Inicializa o servidor (conecta ao banco, configura middlewares, rotas, etc.)
        await server.init();

        // Inicia o servidor HTTP na porta definida
        server.run();
    } catch (error) {
        // Em caso de erro, registra no log estruturado e encerra o processo
        // Um Error vira {} ao ser serializado: a mensagem e a pilha vão explícitas,
        // senão o motivo da falha (Mongo fora do ar, variável ausente) não aparece no log.
        const erro = error instanceof Error ? error : new Error(String(error));
        log.error(`falha ao iniciar o servidor: ${erro.message}`, { stack: erro.stack });
        process.exit(1); // Código 1 indica erro
    }
};

// Executa a função de inicialização
startServer();