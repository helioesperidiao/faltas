import { AbonoDAO } from "../dao/AbonoDAO";
import { Abono } from "../models/Abono";
import { ErrorResponse } from "../http/ErrorResponse";
import { Funcionario } from "@/models/Funcionario";

export class AbonoService {
    private _abonoDAO: AbonoDAO;

    constructor(abonoDAODependency: AbonoDAO) {
        console.log("⬆️  AbonoService.constructor()");
        this._abonoDAO = abonoDAODependency;
    }

    public create = async (abono: Abono, funcionarioLogado: Funcionario): Promise<Abono> => {
        console.log("🟣 AbonoService.create()");

        const cargosPermitidos = ["Inspetor", "Coordenador"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode cadastrar abonos.` }
            );
        }

        return await this._abonoDAO.create(abono, funcionarioLogado);
    };

    public findAll = async (): Promise<Abono[]> => {
        console.log("🟣 AbonoService.findAll()");
        return await this._abonoDAO.findAll();
    };

    public findById = async (idAbono: string): Promise<Abono | null> => {
        console.log("🟣 AbonoService.findById()");
        const abono = new Abono();
        abono.idAbono = idAbono;
        return await this._abonoDAO.findById(abono.idAbono);
    };

    public findAllDeleted = async (funcionarioLogado: Funcionario): Promise<Abono[]> => {
        console.log("🟣 AbonoService.findAllDeleted()");

        const cargosPermitidos = ["Inspetor", "Coordenador"];
        const cargoFuncionario = funcionarioLogado.cargo.nomeCargo;

        if (!cargosPermitidos.includes(cargoFuncionario)) {
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `Apenas ${cargosPermitidos.join(" ou ")} podem visualizar abonos deletados.` }
            );
        }

        return await this._abonoDAO.findAllDeleted();
    };

    public update = async (abono: Abono, funcionarioLogado: Funcionario): Promise<boolean> => {
        console.log("🟣 AbonoService.update()");

        const cargosPermitidos = ["Inspetor", "Coordenador"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode corrigir abonos.` }
            );
        }

        return await this._abonoDAO.update(abono, funcionarioLogado);
    };

    public delete = async (abono: Abono, funcionarioLogado: Funcionario): Promise<boolean> => {
        console.log("🟣 AbonoService.delete()");

        const cargosPermitidos = ["Inspetor", "Coordenador"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode excluir abonos.` }
            );
        }

        return await this._abonoDAO.delete(abono, funcionarioLogado);
    };

    public count = async (): Promise<number> => {
        console.log("🟣 AbonoService.count()");
        return await this._abonoDAO.count();
    };
}
