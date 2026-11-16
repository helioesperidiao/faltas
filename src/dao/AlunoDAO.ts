import { Collection, ObjectId, Filter, UpdateFilter, Document, OptionalId } from "mongodb";
import { Aluno } from "../models/Aluno";
import { MongoDatabase } from "../database/MongoDatabase";
import { Funcionario } from "@/models/Funcionario";
import { Auditoria } from "@/models/Auditoria";
// NOVO: logger (padrão de logs)
import { createLogger } from "../logging/Logger";

const log = createLogger("AlunoDAO");

export class AlunoDAO {
    private _database: MongoDatabase;

    constructor(dbInstance: MongoDatabase) {
        this._database = dbInstance;
    }

    private async getCollection(): Promise<Collection<Document>> {
        const db = await this._database.getDb();
        return db.collection("aluno");
    }

    public async create(aluno: Aluno, funcionarioLogado: Funcionario): Promise<Aluno> {
        log.debug("create()", { matricula: aluno.matricula, turma: aluno.turma });
        const collection = await this.getCollection();

        aluno.marcarCriadoPor(funcionarioLogado.idFuncionario);

        const doc: OptionalId<Document> = {
            matricula: aluno.matricula,
            alunoNome: aluno.alunoNome,
            turma: aluno.turma,
            curso: aluno.curso,
            serie: aluno.serie,
            situacao: aluno.situacao,
            ano: aluno.ano,
            turmaInicioEm: aluno.turmaInicioEm,
            historicoTurmas: aluno.historicoTurmas,
            dataNascimento: aluno.dataNascimento,
            alunoRG: aluno.alunoRG,
            alunoFone: aluno.alunoFone,
            alunoEmail: aluno.alunoEmail,
            alunoFoneCel: aluno.alunoFoneCel,
            paiNome: aluno.paiNome,
            paiFoneCel: aluno.paiFoneCel,
            paiFoneFixo: aluno.paiFoneFixo,
            paiFoneRecado: aluno.paiFoneRecado,
            paiEmail: aluno.paiEmail,
            maeNome: aluno.maeNome,
            maeFoneCel: aluno.maeFoneCel,
            maeFoneFixo: aluno.maeFoneFixo,
            maeFoneRecado: aluno.maeFoneRecado,
            maeEmail: aluno.maeEmail,
            finanNome: aluno.finanNome,
            finanFone: aluno.finanFone,
            legalNome: aluno.legalNome,
            legalFone: aluno.legalFone,
            auditoria: aluno.auditoria.toJSON()
        };

        const result = await collection.insertOne(doc);
        if (!result.insertedId) {
            log.error("falha ao inserir aluno", { matricula: aluno.matricula });
            throw new Error("Falha ao inserir aluno");
        }

        aluno.idAluno = result.insertedId.toString();
        log.info("aluno inserido", { idAluno: aluno.idAluno, matricula: aluno.matricula, turma: aluno.turma });
        return aluno;
    }

    public async delete(aluno: Aluno, funcionarioLogado: Funcionario): Promise<boolean> {
        log.debug("delete()", { idAluno: aluno.idAluno });
        const collection = await this.getCollection();
        aluno.marcarDeletadoPor(funcionarioLogado.idFuncionario);

        const filter: Filter<Document> = {
            _id: new ObjectId(aluno.idAluno),
            "auditoria.deletadoEm": null
        };
        const update: UpdateFilter<Document> = {
            $set: {
                "auditoria.deletadoPor": aluno.auditoria.deletadoPor,
                "auditoria.deletadoEm": aluno.auditoria.deletadoEm
            }
        };
        const result = await collection.updateOne(filter, update);
        const ok = result.modifiedCount > 0;
        if (ok) log.info("aluno removido", { idAluno: aluno.idAluno });
        else log.warn("aluno não encontrado para remoção", { idAluno: aluno.idAluno });
        return ok;
    }

    /** Desfaz a exclusão lógica de um aluno arquivado, preservando histórico e registros. */
    public async reativar(idAluno: string, funcionarioLogado: Funcionario): Promise<boolean> {
        log.debug("reativar()", { idAluno });
        const collection = await this.getCollection();
        const result = await collection.updateOne(
            { _id: new ObjectId(idAluno), "auditoria.deletadoEm": { $ne: null } },
            {
                $set: {
                    "auditoria.deletadoEm": null,
                    "auditoria.deletadoPor": "",
                    "auditoria.alteradoPor": funcionarioLogado.idFuncionario,
                    "auditoria.alteradoEm": new Date()
                }
            }
        );
        const ok = result.modifiedCount > 0;
        if (ok) log.info("aluno reativado", { idAluno });
        return ok;
    }

    public async update(aluno: Aluno, funcionarioLogado: Funcionario): Promise<boolean> {
        log.debug("update()", { idAluno: aluno.idAluno });
        const collection = await this.getCollection();
        aluno.marcarAlteradoPor(funcionarioLogado.idFuncionario);

        const filter: Filter<Document> = { _id: new ObjectId(aluno.idAluno) };
        const update: UpdateFilter<Document> = {
            $set: {
                alunoNome: aluno.alunoNome,
                turma: aluno.turma,
                curso: aluno.curso,
                serie: aluno.serie,
                situacao: aluno.situacao,
                ano: aluno.ano,
                turmaInicioEm: aluno.turmaInicioEm,
                historicoTurmas: aluno.historicoTurmas,
                dataNascimento: aluno.dataNascimento,
                alunoRG: aluno.alunoRG,
                alunoFone: aluno.alunoFone,
                alunoEmail: aluno.alunoEmail,
                alunoFoneCel: aluno.alunoFoneCel,
                paiNome: aluno.paiNome,
                paiFoneCel: aluno.paiFoneCel,
                paiFoneFixo: aluno.paiFoneFixo,
                paiFoneRecado: aluno.paiFoneRecado,
                paiEmail: aluno.paiEmail,
                maeNome: aluno.maeNome,
                maeFoneCel: aluno.maeFoneCel,
                maeFoneFixo: aluno.maeFoneFixo,
                maeFoneRecado: aluno.maeFoneRecado,
                maeEmail: aluno.maeEmail,
                finanNome: aluno.finanNome,
                finanFone: aluno.finanFone,
                legalNome: aluno.legalNome,
                legalFone: aluno.legalFone,
                "auditoria.alteradoPor": aluno.auditoria.alteradoPor,
                "auditoria.alteradoEm": aluno.auditoria.alteradoEm
            }
        };
        const result = await collection.updateOne(filter, update);
        const ok = result.modifiedCount > 0;
        if (ok) log.info("aluno atualizado", { idAluno: aluno.idAluno });
        else log.warn("aluno não encontrado para atualização", { idAluno: aluno.idAluno });
        return ok;
    }

    private toAluno(doc: any): Aluno {
        const corrigirAcentos = (valor: string): string => {
            if (!/[ÃÂ�]/.test(valor || '')) return valor || '';
            try {
                return decodeURIComponent(escape(valor));
            } catch {
                return valor || '';
            }
        };
        const aluno = new Aluno();
        aluno.idAluno = doc._id.toHexString();
        aluno.matricula = corrigirAcentos(doc.matricula);
        aluno.alunoNome = corrigirAcentos(doc.alunoNome);
        aluno.turma = corrigirAcentos(doc.turma);
        aluno.curso = corrigirAcentos(doc.curso);
        aluno.serie = corrigirAcentos(doc.serie);
        aluno.situacao = doc.situacao || 'Ativo';
        aluno.ano = doc.ano || '';
        aluno.turmaInicioEm = doc.turmaInicioEm ? new Date(doc.turmaInicioEm) : this.inicioAnoLetivo(doc.ano);
        aluno.historicoTurmas = Array.isArray(doc.historicoTurmas)
            ? doc.historicoTurmas.map((item: any) => ({
                turma: item.turma || '',
                curso: item.curso || '',
                serie: item.serie || '',
                ano: String(item.ano || ''),
                inicioEm: item.inicioEm ? new Date(item.inicioEm) : this.inicioAnoLetivo(item.ano),
                fimEm: item.fimEm ? new Date(item.fimEm) : new Date(),
                disponivelAte: item.disponivelAte ? new Date(item.disponivelAte) : new Date()
            }))
            : [];
        aluno.dataNascimento = doc.dataNascimento || '';
        aluno.alunoRG = doc.alunoRG || '';
        aluno.alunoFone = doc.alunoFone || '';
        aluno.alunoEmail = doc.alunoEmail || '';
        aluno.alunoFoneCel = doc.alunoFoneCel || '';
        aluno.paiNome = doc.paiNome || '';
        aluno.paiFoneCel = doc.paiFoneCel || '';
        aluno.paiFoneFixo = doc.paiFoneFixo || '';
        aluno.paiFoneRecado = doc.paiFoneRecado || '';
        aluno.paiEmail = doc.paiEmail || '';
        aluno.maeNome = doc.maeNome || '';
        aluno.maeFoneCel = doc.maeFoneCel || '';
        aluno.maeFoneFixo = doc.maeFoneFixo || '';
        aluno.maeFoneRecado = doc.maeFoneRecado || '';
        aluno.maeEmail = doc.maeEmail || '';
        aluno.finanNome = doc.finanNome || '';
        aluno.finanFone = doc.finanFone || '';
        aluno.legalNome = doc.legalNome || '';
        aluno.legalFone = doc.legalFone || '';
        if (doc.auditoria) {
            const auditoria = new Auditoria();
            auditoria.criadoPor = doc.auditoria.criadoPor || '';
            auditoria.criadoEm = doc.auditoria.criadoEm ? new Date(doc.auditoria.criadoEm) : new Date();
            auditoria.alteradoPor = doc.auditoria.alteradoPor || '';
            auditoria.alteradoEm = doc.auditoria.alteradoEm ? new Date(doc.auditoria.alteradoEm) : null;
            auditoria.deletadoPor = doc.auditoria.deletadoPor || '';
            auditoria.deletadoEm = doc.auditoria.deletadoEm ? new Date(doc.auditoria.deletadoEm) : null;
            aluno.auditoria = auditoria;
        }
        return aluno;
    }

    private inicioAnoLetivo(ano: unknown): Date {
        const anoNumerico = Number(ano);
        return new Date(Number.isInteger(anoNumerico) && anoNumerico >= 2000 ? anoNumerico : new Date().getFullYear(), 0, 1);
    }

    public async findById(idAluno: string): Promise<Aluno | null> {
        log.debug("findById()", { idAluno });
        const collection = await this.getCollection();
        const filter: Filter<Document> = {
            _id: new ObjectId(idAluno),
            "auditoria.deletadoEm": null
        };
        const doc = await collection.findOne(filter);
        return doc ? this.toAluno(doc) : null;
    }

    public async findAll(): Promise<Aluno[]> {
        log.debug("findAll()");
        const collection = await this.getCollection();
        const cursor = collection.find({ "auditoria.deletadoEm": null });
        const docs = await cursor.toArray();
        return docs.map(doc => this.toAluno(doc));
    }

    public async findAllDeleted(): Promise<Aluno[]> {
        log.debug("findAllDeleted()");
        const collection = await this.getCollection();
        const cursor = collection.find({ "auditoria.deletadoEm": { $ne: null } });
        const docs = await cursor.toArray();
        return docs.map(doc => this.toAluno(doc));
    }

    public async count(): Promise<number> {
        log.debug("count()");
        const collection = await this.getCollection();
        return await collection.countDocuments({ "auditoria.deletadoEm": null });
    }

    /**
     * Retorna alunos que estiveram na turma em qualquer parte do período.
     * Vínculos encerrados ficam disponíveis por 12 meses após a troca de turma.
     */
    public async findByTurmaNoPeriodo(turma: string, dataInicio: Date, dataFim: Date): Promise<Aluno[]> {
        log.debug("findByTurmaNoPeriodo()", { turma, dataInicio, dataFim });
        const alunos = await this.findAll();
        const agora = new Date();
        const diaUtc = (data: Date): number => Date.UTC(
            data.getUTCFullYear(),
            data.getUTCMonth(),
            data.getUTCDate()
        );
        const inicioConsulta = diaUtc(dataInicio);
        const fimConsulta = diaUtc(dataFim);
        const hoje = diaUtc(agora);

        return alunos.filter(aluno => {
            const inicioTurmaAtual = diaUtc(aluno.turmaInicioEm);
            const vinculoAtual = aluno.turma === turma && inicioTurmaAtual <= fimConsulta;
            const vinculoHistorico = aluno.historicoTurmas.some(historico =>
                historico.turma === turma &&
                diaUtc(historico.inicioEm) <= fimConsulta &&
                diaUtc(historico.fimEm) >= inicioConsulta &&
                diaUtc(historico.disponivelAte) >= hoje
            );
            return vinculoAtual || vinculoHistorico;
        });
    }

    public async atualizarEnturmacaoEmLote(alunos: Aluno[], funcionarioLogado: Funcionario): Promise<number> {
        log.debug("atualizarEnturmacaoEmLote()", { total: alunos.length });
        if (alunos.length === 0) {
            return 0;
        }

        const collection = await this.getCollection();
        const agora = new Date();
        const result = await collection.bulkWrite(alunos.map(aluno => ({
            updateOne: {
                filter: { _id: new ObjectId(aluno.idAluno), "auditoria.deletadoEm": null },
                update: {
                    $set: {
                        turma: aluno.turma,
                        serie: aluno.serie,
                        ano: aluno.ano,
                        turmaInicioEm: aluno.turmaInicioEm,
                        historicoTurmas: aluno.historicoTurmas,
                        "auditoria.alteradoPor": funcionarioLogado.idFuncionario,
                        "auditoria.alteradoEm": agora
                    }
                }
            }
        })));

        log.info("enturmação em lote atualizada", {
            totalSolicitado: alunos.length,
            totalModificado: result.modifiedCount,
        });
        return result.modifiedCount;
    }

    public async findByField(field: string, value: any): Promise<Aluno[]> {
        log.debug("findByField()", { field, value });
        const allowedFields = ["_id", "matricula", "turma"];
        if (!allowedFields.includes(field)) {
            log.warn("campo inválido para busca", { field });
            throw new Error(`Campo inválido para busca: ${field}`);
        }
        const collection = await this.getCollection();
        let filter: Filter<Document> = {};
        if (field === "_id") {
            filter = {
                _id: new ObjectId(value),
                "auditoria.deletadoEm": null
            };
        } else {
            filter = {
                [field]: value,
                "auditoria.deletadoEm": null
            };
        }
        const cursor = collection.find(filter);
        const docs = await cursor.toArray();
        return docs.map(doc => this.toAluno(doc));
    }
}