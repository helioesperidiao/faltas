import { Request, Response } from "express";
import { AlunoService } from "../services/AlunoService";
import { Aluno } from "@/models/Aluno";
import { StandardResponse } from "@/http/StandardResponse";
import { Funcionario } from "@/models/Funcionario";
import { BaseController } from "./BaseController";

export class AlunoController extends BaseController {
    private _alunoService: AlunoService;

    constructor(alunoServiceDependency: AlunoService) {
        super();
        console.log("⬆️  AlunoController.constructor()");
        this._alunoService = alunoServiceDependency;
    }

    public create = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 AlunoController.create()");

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);

        const novoAluno = new Aluno();
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

        StandardResponse.created("Aluno cadastrado com sucesso", {
            alunos: [resultado]
        }).send(response);
    };

    public findAll = async (_request: Request, response: Response): Promise<void> => {
        console.log("🔵 AlunoController.findAll()");

        const arrayAlunos = await this._alunoService.findAll();

        StandardResponse.success("Busca realizada com sucesso", {
            alunos: arrayAlunos
        }).send(response);
    };

    public findAllDeleted = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 AlunoController.findAllDeleted()");

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);
        const alunosDeletados = await this._alunoService.findAllDeleted(funcionarioLogado);

        StandardResponse.success("Busca de alunos deletados realizada com sucesso", {
            alunos: alunosDeletados
        }).send(response);
    };

    public findById = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 AlunoController.findById()");

        const idAluno = request.params.idAluno.toString();
        const aluno = await this._alunoService.findById(idAluno);

        StandardResponse.success("Executado com sucesso", {
            alunos: aluno
        }).send(response);
    };

    public findByMatricula = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 AlunoController.findByMatricula()");

        const matricula = request.params.matricula.toString();
        const aluno = await this._alunoService.findByMatricula(matricula);

        if (!aluno) {
            StandardResponse.notFound("Aluno não encontrado", {
                message: `Não existe aluno com matrícula ${matricula}`
            }).send(response);
            return;
        }

        StandardResponse.success("Executado com sucesso", {
            alunos: [aluno]
        }).send(response);
    };

    public findByTurma = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 AlunoController.findByTurma()");

        const turma = request.params.turma.toString();
        const alunos = await this._alunoService.findByTurma(turma);

        StandardResponse.success("Executado com sucesso", {
            alunos
        }).send(response);
    };

    public update = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 AlunoController.update()");

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);

        const aluno = new Aluno();
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
            StandardResponse.success("Atualizado com sucesso", {
                alunos: [aluno]
            }).send(response);
        } else {
            StandardResponse.notFound("Aluno não encontrado para atualização", {
                alunos: [aluno]
            }).send(response);
        }
    };

    public promoverTurma = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 AlunoController.promoverTurma()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const turmaOrigem = String(request.body.turmaOrigem || '').trim();
        const turmaDestino = String(request.body.turmaDestino || '').trim();
        const anoDestino = String(request.body.anoDestino || new Date().getFullYear()).trim();
        const serieDestino = String(request.body.serieDestino || '').trim();

        if (!turmaOrigem || !turmaDestino) {
            StandardResponse.error("Informe a turma atual e a nova turma", null, 400).send(response);
            return;
        }
        if (turmaOrigem === turmaDestino) {
            StandardResponse.error("A nova turma deve ser diferente da turma atual", null, 400).send(response);
            return;
        }

        const total = await this._alunoService.promoverTurma(
            turmaOrigem,
            turmaDestino,
            anoDestino,
            serieDestino,
            funcionarioLogado
        );

        StandardResponse.success("Turma atualizada e histórico anual preservado", { total }).send(response);
    };

    public delete = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 AlunoController.delete()");

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);

        const aluno = new Aluno();
        aluno.idAluno = request.params.idAluno.toString();

        const excluiu = await this._alunoService.delete(aluno, funcionarioLogado);

        if (excluiu) {
            StandardResponse.noContent().send(response);
        } else {
            StandardResponse.notFound("Aluno não encontrado para exclusão", {
                alunos: [{ idAluno: aluno.idAluno }]
            }).send(response);
        }
    };

    public count = async (_request: Request, response: Response): Promise<void> => {
        console.log("🔵 AlunoController.count()");

        const total = await this._alunoService.count();

        StandardResponse.success("Total de alunos obtido", { total }).send(response);
    };
}
