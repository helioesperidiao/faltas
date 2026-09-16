"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlunoController = void 0;
const Aluno_1 = require("@/models/Aluno");
const StandardResponse_1 = require("@/http/StandardResponse");
const BaseController_1 = require("./BaseController");
class AlunoController extends BaseController_1.BaseController {
    _alunoService;
    constructor(alunoServiceDependency) {
        super();
        console.log("⬆️  AlunoController.constructor()");
        this._alunoService = alunoServiceDependency;
    }
    create = async (request, response) => {
        console.log("🔵 AlunoController.create()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const novoAluno = new Aluno_1.Aluno();
        novoAluno.matricula = request.body.aluno.matricula;
        novoAluno.alunoNome = request.body.aluno.alunoNome;
        novoAluno.turma = request.body.aluno.turma;
        novoAluno.curso = request.body.aluno.curso;
        novoAluno.serie = request.body.aluno.serie;
        novoAluno.situacao = request.body.aluno.situacao;
        novoAluno.ano = request.body.aluno.ano;
        novoAluno.dataNascimento = request.body.aluno.dataNascimento;
        novoAluno.alunoRG = request.body.aluno.alunoRG;
        novoAluno.alunoFone = request.body.aluno.alunoFone;
        novoAluno.alunoEmail = request.body.aluno.alunoEmail;
        novoAluno.alunoFoneCel = request.body.aluno.alunoFoneCel;
        novoAluno.paiNome = request.body.aluno.paiNome;
        novoAluno.paiFoneCel = request.body.aluno.paiFoneCel;
        novoAluno.paiFoneFixo = request.body.aluno.paiFoneFixo;
        novoAluno.paiFoneRecado = request.body.aluno.paiFoneRecado;
        novoAluno.paiEmail = request.body.aluno.paiEmail;
        novoAluno.maeNome = request.body.aluno.maeNome;
        novoAluno.maeFoneCel = request.body.aluno.maeFoneCel;
        novoAluno.maeFoneFixo = request.body.aluno.maeFoneFixo;
        novoAluno.maeFoneRecado = request.body.aluno.maeFoneRecado;
        novoAluno.maeEmail = request.body.aluno.maeEmail;
        novoAluno.finanNome = request.body.aluno.finanNome;
        novoAluno.finanFone = request.body.aluno.finanFone;
        novoAluno.legalNome = request.body.aluno.legalNome;
        novoAluno.legalFone = request.body.aluno.legalFone;
        const resultado = await this._alunoService.create(novoAluno, funcionarioLogado);
        StandardResponse_1.StandardResponse.created("Aluno cadastrado com sucesso", {
            alunos: [resultado]
        }).send(response);
    };
    findAll = async (_request, response) => {
        console.log("🔵 AlunoController.findAll()");
        const arrayAlunos = await this._alunoService.findAll();
        StandardResponse_1.StandardResponse.success("Busca realizada com sucesso", {
            alunos: arrayAlunos
        }).send(response);
    };
    findAllDeleted = async (request, response) => {
        console.log("🔵 AlunoController.findAllDeleted()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const alunosDeletados = await this._alunoService.findAllDeleted(funcionarioLogado);
        StandardResponse_1.StandardResponse.success("Busca de alunos deletados realizada com sucesso", {
            alunos: alunosDeletados
        }).send(response);
    };
    findById = async (request, response) => {
        console.log("🔵 AlunoController.findById()");
        const idAluno = request.params.idAluno.toString();
        const aluno = await this._alunoService.findById(idAluno);
        StandardResponse_1.StandardResponse.success("Executado com sucesso", {
            alunos: aluno
        }).send(response);
    };
    findByMatricula = async (request, response) => {
        console.log("🔵 AlunoController.findByMatricula()");
        const matricula = request.params.matricula.toString();
        const aluno = await this._alunoService.findByMatricula(matricula);
        if (!aluno) {
            StandardResponse_1.StandardResponse.notFound("Aluno não encontrado", {
                message: `Não existe aluno com matrícula ${matricula}`
            }).send(response);
            return;
        }
        StandardResponse_1.StandardResponse.success("Executado com sucesso", {
            alunos: [aluno]
        }).send(response);
    };
    findByTurma = async (request, response) => {
        console.log("🔵 AlunoController.findByTurma()");
        const turma = request.params.turma.toString();
        const alunos = await this._alunoService.findByTurma(turma);
        StandardResponse_1.StandardResponse.success("Executado com sucesso", {
            alunos
        }).send(response);
    };
    update = async (request, response) => {
        console.log("🔵 AlunoController.update()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const aluno = new Aluno_1.Aluno();
        aluno.idAluno = request.params.idAluno.toString();
        aluno.alunoNome = request.body.aluno.alunoNome;
        aluno.turma = request.body.aluno.turma;
        aluno.curso = request.body.aluno.curso;
        aluno.serie = request.body.aluno.serie;
        aluno.situacao = request.body.aluno.situacao;
        aluno.ano = request.body.aluno.ano;
        aluno.dataNascimento = request.body.aluno.dataNascimento;
        aluno.alunoRG = request.body.aluno.alunoRG;
        aluno.alunoFone = request.body.aluno.alunoFone;
        aluno.alunoEmail = request.body.aluno.alunoEmail;
        aluno.alunoFoneCel = request.body.aluno.alunoFoneCel;
        aluno.paiNome = request.body.aluno.paiNome;
        aluno.paiFoneCel = request.body.aluno.paiFoneCel;
        aluno.paiFoneFixo = request.body.aluno.paiFoneFixo;
        aluno.paiFoneRecado = request.body.aluno.paiFoneRecado;
        aluno.paiEmail = request.body.aluno.paiEmail;
        aluno.maeNome = request.body.aluno.maeNome;
        aluno.maeFoneCel = request.body.aluno.maeFoneCel;
        aluno.maeFoneFixo = request.body.aluno.maeFoneFixo;
        aluno.maeFoneRecado = request.body.aluno.maeFoneRecado;
        aluno.maeEmail = request.body.aluno.maeEmail;
        aluno.finanNome = request.body.aluno.finanNome;
        aluno.finanFone = request.body.aluno.finanFone;
        aluno.legalNome = request.body.aluno.legalNome;
        aluno.legalFone = request.body.aluno.legalFone;
        const atualizou = await this._alunoService.update(aluno, funcionarioLogado);
        if (atualizou) {
            StandardResponse_1.StandardResponse.success("Atualizado com sucesso", {
                alunos: [aluno]
            }).send(response);
        }
        else {
            StandardResponse_1.StandardResponse.notFound("Aluno não encontrado para atualização", {
                alunos: [aluno]
            }).send(response);
        }
    };
    promoverTurma = async (request, response) => {
        console.log("🔵 AlunoController.promoverTurma()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const turmaOrigem = String(request.body.turmaOrigem || '').trim();
        const turmaDestino = String(request.body.turmaDestino || '').trim();
        const anoDestino = String(request.body.anoDestino || new Date().getFullYear()).trim();
        const serieDestino = String(request.body.serieDestino || '').trim();
        if (!turmaOrigem || !turmaDestino) {
            StandardResponse_1.StandardResponse.error("Informe a turma atual e a nova turma", null, 400).send(response);
            return;
        }
        if (turmaOrigem === turmaDestino) {
            StandardResponse_1.StandardResponse.error("A nova turma deve ser diferente da turma atual", null, 400).send(response);
            return;
        }
        const total = await this._alunoService.promoverTurma(turmaOrigem, turmaDestino, anoDestino, serieDestino, funcionarioLogado);
        StandardResponse_1.StandardResponse.success("Turma atualizada e histórico anual preservado", { total }).send(response);
    };
    delete = async (request, response) => {
        console.log("🔵 AlunoController.delete()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const aluno = new Aluno_1.Aluno();
        aluno.idAluno = request.params.idAluno.toString();
        const excluiu = await this._alunoService.delete(aluno, funcionarioLogado);
        if (excluiu) {
            StandardResponse_1.StandardResponse.noContent().send(response);
        }
        else {
            StandardResponse_1.StandardResponse.notFound("Aluno não encontrado para exclusão", {
                alunos: [{ idAluno: aluno.idAluno }]
            }).send(response);
        }
    };
    count = async (_request, response) => {
        console.log("🔵 AlunoController.count()");
        const total = await this._alunoService.count();
        StandardResponse_1.StandardResponse.success("Total de alunos obtido", { total }).send(response);
    };
}
exports.AlunoController = AlunoController;
//# sourceMappingURL=AlunoController.js.map