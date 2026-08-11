import { DispensaDAO } from "../dao/DispensaDAO";
import { Dispensa } from "../models/Dispensa";
import { ErrorResponse } from "../http/ErrorResponse";
import { Funcionario } from "@/models/Funcionario";

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

        const cargosPermitidos = ["Inspetor", "Coordenador"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode cadastrar dispensa.` }
            );
        }

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

        const cargosPermitidos = ["Inspetor", "Coordenador"];
        const cargoFuncionario = funcionarioLogado.cargo.nomeCargo;

        if (!cargosPermitidos.includes(cargoFuncionario)) {
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `Apenas ${cargosPermitidos.join(" ou ")} podem visualizar dispensas deletadas.` }
            );
        }

        return await this._dispensaDAO.findAllDeleted();
    };
    //modificar talvez os cargos permitidos

    //update
    public update = async (dispensa: Dispensa, funcionarioLogado: Funcionario): Promise<boolean> => {
        console.log("🟣 DispensaService.update()");

        const cargosPermitidos = ["Inspetor", "Coordenador"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode corrigir dispensas.` }
            );
        }

        return await this._dispensaDAO.update(dispensa, funcionarioLogado);
    };

    //delete
    public delete = async (dispensa: Dispensa, funcionarioLogado: Funcionario): Promise<boolean> => {
        console.log("🟣 DispensaService.delete()");

        const cargosPermitidos = ["Inspetor", "Coordenador"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode excluir dispensas.` }
            );
        }

        return await this._dispensaDAO.delete(dispensa, funcionarioLogado);
    };

    //count
    public count = async (): Promise<number> => {
        console.log("🟣 DispensaService.count()");
        return await this._dispensaDAO.count();
    };
}