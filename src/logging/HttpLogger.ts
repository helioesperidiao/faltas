// src/logging/HttpLogger.ts
import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { createLogger } from "./Logger";
import { requestStore } from "./requestStore";

const log = createLogger("HTTP");

// Extensões que consideramos "assets estáticos" — não logamos cada arquivo
// servido, senão o log vira ruído com HTML/CSS/JS/imagens do frontend.
const STATIC_EXTENSIONS = /\.(html?|css|js|mjs|map|ico|png|jpe?g|gif|svg|webp|woff2?|ttf|eot|otf|pdf|txt|xml|json)$/i;

/**
 * Identifica assets estáticos para não registrar cada arquivo servido pelo site.
 * Só considera GET/HEAD; um POST para uma URL com extensão ainda é logado.
 */
const isStaticAsset = (req: Request): boolean => {
    if (req.method !== "GET" && req.method !== "HEAD") return false;
    return STATIC_EXTENSIONS.test(req.path);
};

/**
 * Middleware global de log HTTP.
 *
 * Deve ser registrado ANTES de qualquer outro middleware de rota,
 * para que o requestId já exista quando cors/json/controllers executarem.
 *
 * Fluxo:
 * 1. Gera um requestId curto (8 hex chars).
 * 2. Devolve-o no header `X-Request-Id` (o cliente pode usar para suporte).
 * 3. Marca o início via relógio monotônico (mais preciso que Date.now()).
 * 4. Abre o contexto no AsyncLocalStorage com `requestStore.run(...)`.
 * 5. Quando a resposta termina (`finish`), grava uma linha com status + duração.
 *
 * O handler de `finish` é registrado DENTRO do `requestStore.run(...)`.
 * Isso é importante: se o `res.end()` vier de fora de uma rota (redirect,
 * timeout de socket, error handler global, encerramento forçado), o
 * AsyncLocalStorage continua ativo quando o evento é emitido — e o log
 * final herda o requestId/step. Registrar o `on('finish')` fora do run
 * fazia o log perder esses campos nesses casos.
 */
export const httpLogger = (req: Request, res: Response, next: NextFunction): void => {
    // Requisições de assets (imagens, CSS, JS do front) não são logadas
    if (isStaticAsset(req)) {
        return next();
    }

    const requestId = randomUUID().slice(0, 8);
    res.setHeader("X-Request-Id", requestId);

    // Relógio monotônico: mais preciso para medir duração do que Date.now()
    const start = process.hrtime.bigint();

    // Abre o contexto — tudo que rodar a partir de next() vê o mesmo requestId
    requestStore.run({ requestId, step: 0 }, () => {
        res.on("finish", () => {
            const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
            const meta = {
                method: req.method,
                url: req.originalUrl,
                status: res.statusCode,
                durationMs: Number(durationMs.toFixed(2)),
            };

            // Nível do log depende do status HTTP
            if (res.statusCode >= 500) log.error("request failed", meta);
            else if (res.statusCode >= 400) log.warn("request error", meta);
            else log.http("request", meta);
        });

        next();
    });
};