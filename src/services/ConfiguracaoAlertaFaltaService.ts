import { ConfiguracaoAlertaFalta, ConfiguracaoAlertaFaltaDAO } from "@/dao/ConfiguracaoAlertaFaltaDAO";
import { ErrorResponse } from "@/http/ErrorResponse";
import { Funcionario } from "@/models/Funcionario";

export class ConfiguracaoAlertaFaltaService {
    constructor(private readonly dao: ConfiguracaoAlertaFaltaDAO) {}

    private validarAcesso(funcionario: Funcionario): void {
        if (funcionario.cargo.nomeCargo !== "Processo Pedagógico") {
            throw new ErrorResponse(403, "Não autorizado", { message: "Apenas Processo Pedagógico pode administrar alertas de faltas." });
        }
    }

    private validarValores(carga: number, limite: number): void {
        if (!Number.isInteger(carga) || carga <= 0 || !Number.isInteger(limite) || limite <= 0) {
            throw new ErrorResponse(400, "Informe minutos semanais e limite de faltas como números inteiros positivos.");
        }
    }

    public async findAll(funcionario: Funcionario): Promise<ConfiguracaoAlertaFalta[]> {
        this.validarAcesso(funcionario);
        return this.dao.findAll();
    }

    public async create(carga: number, limite: number, funcionario: Funcionario): Promise<ConfiguracaoAlertaFalta> {
        this.validarAcesso(funcionario);
        this.validarValores(carga, limite);
        if ((await this.dao.findAll()).some(configuracao => configuracao.cargaHorariaSemanalMinutos === carga)) {
            throw new ErrorResponse(400, "Já existe uma regra para essa carga semanal.");
        }
        return this.dao.create(carga, limite, funcionario);
    }

    public async update(id: string, carga: number, limite: number, funcionario: Funcionario): Promise<boolean> {
        this.validarAcesso(funcionario);
        this.validarValores(carga, limite);
        if ((await this.dao.findAll()).some(configuracao =>
            configuracao.idConfiguracao !== id && configuracao.cargaHorariaSemanalMinutos === carga
        )) {
            throw new ErrorResponse(400, "Já existe uma regra para essa carga semanal.");
        }
        return this.dao.update(id, carga, limite, funcionario);
    }

    public async delete(id: string, funcionario: Funcionario): Promise<boolean> {
        this.validarAcesso(funcionario);
        return this.dao.delete(id, funcionario);
    }
}
