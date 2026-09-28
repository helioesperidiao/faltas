export declare class ErrorResponse extends Error {
    private _httpCode;
    private _error;
    private _name;
    constructor(httpCode: number, message: string, error?: any);
    get httpCode(): number;
    get error(): any;
    get name(): string;
}
//# sourceMappingURL=ErrorResponse.d.ts.map