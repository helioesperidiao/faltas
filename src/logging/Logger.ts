// src/logging/Logger.ts
import 'dotenv/config';
import winston from "winston";
import { requestStore } from "./requestStore";

const isProduction = process.env.NODE_ENV === "production";
const logLevel = process.env.LOG_LEVEL || (isProduction ? "info" : "debug");

// O colorize do winston só conhece os níveis do npm (error, warn, info, ...).
// Como criamos um nível customizado ("http"), precisamos registrar a cor dele
// antes de criar o logger. Sem isso, "http" sai sem cor em algumas versões.
winston.addColors({
    error: "red",
    warn: "yellow",
    info: "green",
    http: "cyan",
    debug: "gray",
});

// Injeta requestId + número de sequência em cada linha do request.
// AsyncLocalStorage permite amarrar todas as chamadas do mesmo request
// mesmo passando por async/await em camadas diferentes.
const injectRequestId = winston.format((info) => {
    const ctx = requestStore.getStore();
    if (ctx) {
        info.requestId = ctx.requestId;
        ctx.step += 1;
        info.step = String(ctx.step).padStart(2, "0");
    }
    return info;
});

export const Logger = winston.createLogger({
    level: logLevel,
    // Níveis customizados (o padrão do winston não tem "http"):
    levels: { error: 0, warn: 1, info: 2, http: 3, debug: 4 },
    format: isProduction
        // Em produção: JSON estruturado (para Datadog/CloudWatch/ELK)
        ? winston.format.combine(
              injectRequestId(),
              winston.format.timestamp(),
              winston.format.errors({ stack: true }),
              winston.format.json()
          )
        // Em desenvolvimento: colorido e legível no terminal
        : winston.format.combine(
              injectRequestId(),
              winston.format.colorize({ level: true }),
              winston.format.timestamp({ format: "HH:mm:ss.SSS" }),
              winston.format.printf((info: any) => {
                  const { level, message, timestamp, layer, requestId, step, ...meta } = info;
                  const rid = requestId ? `[${requestId}] ` : "";
                  const stepTag = step ? `#${step} ` : "";
                  const layerTag = layer ? `[${layer}]` : "";
                  const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
                  return `${timestamp} ${level} ${rid}${stepTag}${layerTag} ${message}${extra}`;
              })
          ),
    transports: [
        // ⚠️ level explícito em cada transport: sem isso, eles herdam "info"
        // e descartam TODAS as linhas debug() e http(), que é a maioria
        // dos logs de diagnóstico e o log de request bem-sucedido.
        new winston.transports.Console({ level: logLevel }),
        new winston.transports.File({ filename: "logs/app.log", level: logLevel }),
        new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    ],
    exitOnError: false,
});

/**
 * Cria um logger com o nome da camada incluído em cada registro.
 * Cada arquivo cria um `log` no topo usando o próprio nome de classe.
 *
 * @example
 * const log = createLogger("CargoController");
 * log.debug("create()");  // → 14:32:15.123 debug [a3b8f1c2] #01 [CargoController] create()
 */
export const createLogger = (layer: string) => Logger.child({ layer });