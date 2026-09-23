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
        const dados = request.body.aluno;
        const matricula = typeof dados?.matricula === "string" ? dados.matricula.trim() : "";
        const alunoNome = typeof dados?.alunoNome === "string" ? dados.alunoNome.trim() : "";
        const turma = typeof dados?.turma === "string" ? dados.turma.trim() : "";
        if (!matricula || matricula.length > 8 || !alunoNome || !turma) {
            StandardResponse_1.StandardResponse.error("Dados inválidos. Matrícula (até 8 caracteres), nome e turma são obrigatórios.", null, 400).send(response);
            return;
        }
        const novoAluno = new Aluno_1.Aluno();
        novoAluno.matricula = matricula;
        novoAluno.alunoNome = alunoNome;
        novoAluno.turma = turma;
        novoAluno.curso = dados.curso;
        novoAluno.serie = dados.serie;
        novoAluno.situacao = dados.situacao;
        novoAluno.ano = dados.ano;
        novoAluno.dataNascimento = dados.dataNascimento;
        novoAluno.alunoRG = dados.alunoRG;
        novoAluno.alunoFone = dados.alunoFone;
        novoAluno.alunoEmail = dados.alunoEmail;
        novoAluno.alunoFoneCel = dados.alunoFoneCel;
        novoAluno.paiNome = dados.paiNome;
        novoAluno.paiFoneCel = dados.paiFoneCel;
        novoAluno.paiFoneFixo = dados.paiFoneFixo;
        novoAluno.paiFoneRecado = dados.paiFoneRecado;
        novoAluno.paiEmail = dados.paiEmail;
        novoAluno.maeNome = dados.maeNome;
        novoAluno.maeFoneCel = dados.maeFoneCel;
        novoAluno.maeFoneFixo = dados.maeFoneFixo;
        novoAluno.maeFoneRecado = dados.maeFoneRecado;
        novoAluno.maeEmail = dados.maeEmail;
        novoAluno.finanNome = dados.finanNome;
        novoAluno.finanFone = dados.finanFone;
        novoAluno.legalNome = dados.legalNome;
        novoAluno.legalFone = dados.legalFone;
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