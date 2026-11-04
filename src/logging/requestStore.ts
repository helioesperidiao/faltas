// src/logging/requestStore.ts
import { AsyncLocalStorage } from "async_hooks";

export interface RequestStore {
    requestId: string;
    step: number;
}

/**
 * Mantém metadados da requisição disponíveis em chamadas assíncronas encadeadas
 * (controllers → services → DAOs), sem precisar passar requestId como parâmetro.
 *
 * AsyncLocalStorage do Node funciona como um "contexto de thread" para async/await:
 * tudo que rodar dentro do `requestStore.run(ctx, () => next())` herda o mesmo
 * contexto, mesmo passando por Promise.all, setTimeout, streams etc.
 */
export const requestStore = new AsyncLocalStorage<RequestStore>();