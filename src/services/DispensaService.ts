import { DispensaDAO } from "../dao/DispensaDAO";
import { Dispensa } from "../models/Dispensa";
import { ErrorResponse } from "../http/ErrorResponse";
import { Funcionario } from "@/models/Funcionario";

const CARGOS_ACESSO_TOTAL = ["Processo Pedagógico"];

export class DispensaService {
    private _dispensaDAO: DispensaDAO;

    //construtor
    constructor(dispensaDAODependency: DispensaDAO){
        console.log("⬆️  DispensaService.constructor()");
        this._dispensaDAO = dispensaDAODependency;
    }

    //create
    public create = async (dispensa: Dispensa, funcionarioLogado: Funcionario): Promise<Dispensa> => {
        console.log("🟣 DispensaService.create()");
        return await this._dispensaDAO.create(dispensa, funcionarioLogado);
    };

    //findAll
    public findAll = async (): Promise<Dispensa[]> => {
        console.log("🟣 DispensaService.findAll()");
        return await this._dispensaDAO.findAll();
    };

    //findById
    public findById = async (idDispensa: string): Promise<Dispensa | null> => {
        console.log("🟣 DispensaService.findById()");
        const dispensa = new Dispensa();
        dispensa.idDispensa = idDispensa;
        return await this._dispensaDAO.findById(dispensa.idDispensa);
    };

    //findAllDeleted
    public findAllDeleted = async (funcionarioLogado: Funcionario): Promise<Dispensa[]> => {
        console.log("🟣 DispensaService.findAllDeleted()");

        const cargoFuncionario = funcionarioLogado.cargo.nomeCargo;

        if (!CARGOS_ACESSO_TOTAL.includes(cargoFuncionario)) {
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `Apenas ${CARGOS_ACESSO_TOTAL.join(", ")} podem visualizar dispensas deletadas.` }
            );
        }

        return await this._dispensaDAO.findAllDeleted();
    };

    //update
    public update = async (dispensa: Dispensa, funcionarioLogado: Funcionario): Promise<boolean> => {
        console.log("🟣 DispensaService.update()");
        return await this._dispensaDAO.update(dispensa, funcionarioLogado);
    };

    //delete
    public delete = async (dispensa: Dispensa, funcionarioLogado: Funcionario): Promise<boolean> => {
        console.log("🟣 DispensaService.delete()");
        return await this._dispensaDAO.delete(dispensa, funcionarioLogado);
    };

    //count
    public count = async (): Promise<number> => {
        console.log("🟣 DispensaService.count()");
        return await this._dispensaDAO.count();
    };
}
