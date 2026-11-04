import { ConfiguracaoAlertaFalta, ConfiguracaoAlertaFaltaDAO } from "@/dao/ConfiguracaoAlertaFaltaDAO";
import { ErrorResponse } from "@/http/ErrorResponse";
import { Funcionario } from "@/models/Funcionario";
// NOVO: logger (padrão de logs)
import { createLogger } from "../logging/Logger";

const log = createLogger("ConfiguracaoAlertaFaltaService");

export class ConfiguracaoAlertaFaltaService {
    constructor(private readonly dao: ConfiguracaoAlertaFaltaDAO) {}

    private validarAcesso(funcionario: Funcionario): void {
        if (funcionario.cargo.nomeCargo !== "Processo Pedagógico") {
            log.warn("acesso a configurações de alerta negado", {
                motivo: "cargo não autorizado",
                cargoAtor: funcionario.cargo.nomeCargo,
            });
            throw new ErrorResponse(403, "Não autorizado", { message: "Apenas Processo Pedagógico pode administrar alertas de faltas." });
        }
    }

    private validarValores(carga: number, limite: number): void {
        if (!Number.isInteger(carga) || carga <= 0 || !Number.isInteger(limite) || limite <= 0) {
            throw new ErrorResponse(400, "Informe minutos semanais e limite de faltas como números inteiros positivos.");
        }
    }

    public async findAll(funcionario: Funcionario): Promise<ConfiguracaoAlertaFalta[]> {
        log.debug("findAll()");
        this.validarAcesso(funcionario);
        return this.dao.findAll();
    }

    public async create(carga: number, limite: number, funcionario: Funcionario): Promise<ConfiguracaoAlertaFalta> {
        log.debug("create()", { carga, limite });
        this.validarAcesso(funcionario);
        this.validarValores(carga, limite);
        if ((await this.dao.findAll()).some(configuracao => configuracao.cargaHorariaSemanalMinutos === carga)) {
            throw new ErrorResponse(400, "Já existe uma regra para essa carga semanal.");
        }
        const criada = await this.dao.create(carga, limite, funcionario);
        log.info("configuração de alerta criada", {
            idConfiguracao: criada.idConfiguracao,
            carga,
            limite,
            criadaPor: funcionario.email,
        });
        return criada;
    }

    public async update(id: string, carga: number, limite: number, funcionario: Funcionario): Promise<boolean> {
        log.debug("update()", { id, carga, limite });
        this.validarAcesso(funcionario);
        this.validarValores(carga, limite);
        if ((await this.dao.findAll()).some(configuracao =>
            configuracao.idConfiguracao !== id && configuracao.cargaHorariaSemanalMinutos === carga
        )) {
            throw new ErrorResponse(400, "Já existe uma regra para essa carga semanal.");
        }
        const atualizou = await this.dao.update(id, carga, limite, funcionario);
        if (atualizou) {
            log.info("configuração de alerta atualizada", {
                idConfiguracao: id,
                atualizadaPor: funcionario.email,
            });
        }
        return atualizou;
    }

    public async delete(id: string, funcionario: Funcionario): Promise<boolean> {
        log.debug("delete()", { id });
        this.validarAcesso(funcionario);
        const excluiu = await this.dao.delete(id, funcionario);
        if (excluiu) {
            log.info("configuração de alerta excluída", {
                idConfiguracao: id,
                excluidaPor: funcionario.email,
            });
        }
        return excluiu;
    }
}