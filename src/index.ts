// ============================================================================
// src/index.ts
// PONTO DE ENTRADA DA APLICAÇÃO
// ============================================================================

// Carrega as variáveis de ambiente do arquivo .env antes de qualquer outro módulo
import dotenv from 'dotenv';
dotenv.config(); // Deve ser o primeiro comando para garantir que process.env esteja populado

// Importa a classe principal do servidor (depende de process.env)
import { Server } from "./Server";

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
 * exibe uma mensagem no console e encerra o processo com código de erro (1).
 * 
 * @example
 * // Execução padrão
 * await startServer();
 * 
 * @returns {Promise<void>} Não retorna valor.
 * 
 * @throws {Error} Em caso de falha na inicialização, o processo é encerrado.
 */
const startServer = async (): Promise<void> => {
    try {
        // Define a porta: prioriza a variável de ambiente PORT, senão usa 3000
        // Garante que PORT seja um number (ou fallback para 3000 se inválido)
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
        // Em caso de erro, exibe mensagem e encerra o processo
        console.error("❌ Falha ao iniciar o servidor:", error);
        process.exit(1); // Código 1 indica erro
    }
};

// Executa a função de inicialização (top-level await em módulos ES é permitido)
startServer();