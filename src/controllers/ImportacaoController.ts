import { Request, Response } from "express";
import { PDFParse } from "pdf-parse";
import { StandardResponse } from "@/http/StandardResponse";
import { ErrorResponse } from "@/http/ErrorResponse";

/** Extrai o texto de uma planilha que foi disponibilizada em PDF. */
export class ImportacaoController {
    public lerPdf = async (request: Request, response: Response): Promise<void> => {
        const arquivo = request.file;
        if (!arquivo) {
            throw new ErrorResponse(400, "Selecione um arquivo PDF para importar.");
        }

        const leitor = new PDFParse({ data: arquivo.buffer });
        try {
            const resultado = await leitor.getText();
            const texto = resultado.text.replace(/^\uFEFF/, '').trim();
            if (!texto) {
                throw new ErrorResponse(400, "O PDF não possui texto selecionável. Exporte a planilha em PDF com texto ou use CSV/Excel.");
            }
            StandardResponse.success("PDF lido com sucesso", { texto, paginas: resultado.total }).send(response);
        } finally {
            await leitor.destroy();
        }
    };
}
