export declare class Server {
    private _porta;
    private _app;
    private _cargoRouter;
    private _funcionarioRouter;
    private _registroRouter;
    private _dispensaRouter;
    private _abonoRouter;
    private _alunoRouter;
    private _gradeHorarioRouter;
    private _relatorioRouter;
    private _configuracaoAlertaFaltaRouter;
    private _dataBase;
    constructor(porta?: number);
    init(): Promise<void>;
    private setupErrorMiddleware;
    run(): void;
}
//# sourceMappingURL=Server.d.ts.map