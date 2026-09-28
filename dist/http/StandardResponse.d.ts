export declare class StandardResponse {
    private _success;
    private _message;
    private _data;
    private _error;
    private _httpCode;
    private constructor();
    get success(): boolean;
    get httpCode(): number;
    get message(): string;
    get data(): any;
    get error(): any;
    toJSON(): any;
    send(res: any): any;
    static success(message: string, data?: any, httpCode?: number): StandardResponse;
    static error(message: string, error?: any, httpCode?: number): StandardResponse;
    static created(message: string, data?: any): StandardResponse;
    static noContent(): StandardResponse;
    static notFound(message?: string, error?: any): StandardResponse;
    static unauthorized(message?: string, error?: any): StandardResponse;
    static forbidden(message?: string, error?: any): StandardResponse;
    static internalError(message?: string, error?: any): StandardResponse;
}
//# sourceMappingURL=StandardResponse.d.ts.map