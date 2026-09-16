"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlunoService = void 0;
const Aluno_1 = require("../models/Aluno");
const ErrorResponse_1 = require("../http/ErrorResponse");
class AlunoService {
    _alunoDAO;
    constructor(alunoDAODependency) {
        console.log("⬆️  AlunoService.constructor()");
        this._alunoDAO = alunoDAODependency;
    }
    create = async (aluno, funcionarioLogado) => {
        console.log("🟣 AlunoService.create()");
        const cargosPermitidos = ["Processo Pedagógico"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse_1.ErrorResponse(403, "Não autorizado", { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode cadastrar alunos.` });
        }
        const jaExiste = await this._alunoDAO.findByField("matricula", aluno.matricula);
        if (jaExiste && jaExiste.length > 0) {
            throw new ErrorResponse_1.ErrorResponse(400, "Já existe um aluno com esta matrícula");
        }
        return await this._alunoDAO.create(aluno, funcionarioLogado);
    };
    findAll = async () => {
        console.log("🟣 AlunoService.findAll()");
        return await this._alunoDAO.findAll();
    };
    findById = async (idAluno) => {
        console.log("🟣 AlunoService.findById()");
        const aluno = new Aluno_1.Aluno();
        aluno.idAluno = idAluno;
        return await this._alunoDAO.findById(aluno.idAluno);
    };
    findByMatricula = async (matricula) => {
        console.log("🟣 AlunoService.findByMatricula()");
        const resultado = await this._alunoDAO.findByField("matricula", matricula);
        return resultado.length > 0 ? resultado[0] : null;
    };
    findByTurma = async (turma) => {
        console.log("🟣 AlunoService.findByTurma()");
        return await this._alunoDAO.findByField("turma", turma);
    };
    findAllDeleted = async (funcionarioLogado) => {
        console.log("🟣 AlunoService.findAllDeleted()");
        const cargosPermitidos = ["Processo Pedagógico"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse_1.ErrorResponse(403, "Não autorizado", { message: `Apenas ${cargosPermitidos.join(" ou ")} podem visualizar alunos deletados.` });
        }
        return await this._alunoDAO.findAllDeleted();
    };
    update = async (aluno, funcionarioLogado) => {
        console.log("🟣 AlunoService.update()");
        const cargosPermitidos = ["Processo Pedagógico"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse_1.ErrorResponse(403, "Não autorizado", { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode alterar alunos.` });
        }
        const alunoAnterior = await this._alunoDAO.findById(aluno.idAluno);
        if (!alunoAnterior) {
            return false;
        }
        aluno.historicoTurmas = alunoAnterior.historicoTurmas;
        aluno.turmaInicioEm = alunoAnterior.turmaInicioEm;
        if (this.alterouEnturmacao(alunoAnterior, aluno)) {
            aluno.historicoTurmas = [
                ...alunoAnterior.historicoTurmas,
                this.criarHistorico(alunoAnterior)
            ];
            aluno.turmaInicioEm = new Date();
        }
        return await this._alunoDAO.update(aluno, funcionarioLogado);
    };
    promoverTurma = async (turmaOrigem, turmaDestino, anoDestino, serieDestino, funcionarioLogado) => {
        if (funcionarioLogado.cargo.nomeCargo !== "Processo Pedagógico") {
            throw new ErrorResponse_1.ErrorResponse(403, "Não autorizado", {
                message: "Apenas Processo Pedagógico pode executar a virada anual de turma."
            });
        }
        const alunos = await this._alunoDAO.findByField("turma", turmaOrigem);
        for (const aluno of alunos) {
            aluno.historicoTurmas = [...aluno.historicoTurmas, this.criarHistorico(aluno)];
            aluno.turma = turmaDestino;
            aluno.ano = anoDestino;
            if (serieDestino) {
                aluno.serie = serieDestino;
            }
            aluno.turmaInicioEm = new Date();
        }
        return await this._alunoDAO.atualizarEnturmacaoEmLote(alunos, funcionarioLogado);
    };
    alterouEnturmacao(anterior, atualizado) {
        return anterior.turma !== atualizado.turma ||
            anterior.curso !== atualizado.curso ||
            anterior.serie !== atualizado.serie ||
            anterior.ano !== atualizado.ano;
    }
    criarHistorico(aluno) {
        const fimEm = new Date();
        const disponivelAte = new Date(fimEm);
        disponivelAte.setFullYear(disponivelAte.getFullYear() + 1);
        return {
            turma: aluno.turma,
            curso: aluno.curso,
            serie: aluno.serie,
            ano: aluno.ano,
            inicioEm: aluno.turmaInicioEm,
            fimEm,
            disponivelAte
        };
    }
    delete = async (aluno, funcionarioLogado) => {
        console.log("🟣 AlunoService.delete()");
        const cargosPermitidos = ["Processo Pedagógico"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse_1.ErrorResponse(403, "Não autorizado", { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode excluir alunos.` });
        }
        return await this._alunoDAO.delete(aluno, funcionarioLogado);
    };
    count = async () => {
        console.log("🟣 AlunoService.count()");
        return await this._alunoDAO.count();
    };
}
exports.AlunoService = AlunoService;
//# sourceMappingURL=AlunoService.js.map