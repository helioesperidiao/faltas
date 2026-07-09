// src/index.ts
import { Server } from "./Server";

/**
 * Ponto de entrada da aplicação.
 * 
 * Inicializa o servidor Express com todas as dependências
 * e começa a escutar na porta definida.
 */
const startServer = async (): Promise<void> => {
    try {
        // Porta definida por variável de ambiente ou padrão 8080
        const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
        
        const server = new Server(PORT);
        await server.init(); // Conecta ao banco e configura middlewares/rotas
        server.run(); // Inicia o servidor HTTP
    } catch (error) {
        console.error("❌ Falha ao iniciar o servidor:", error);
        process.exit(1); // Encerra o processo com erro
    }
};

// Executa a inicialização
startServer();