"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const Server_1 = require("./Server");
const startServer = async () => {
    try {
        const rawPort = process.env.PORT;
        const parsedPort = rawPort ? parseInt(rawPort, 10) : NaN;
        const PORT = !Number.isNaN(parsedPort) ? parsedPort : 3000;
        const server = new Server_1.Server(PORT);
        await server.init();
        server.run();
    }
    catch (error) {
        console.error("❌ Falha ao iniciar o servidor:", error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=index.js.map