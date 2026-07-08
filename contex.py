from pathlib import Path

# Pasta onde o script está
BASE_DIR = Path(__file__).parent.resolve()

# Nome do arquivo de saída
OUTPUT_FILE = BASE_DIR / "contexto_projeto.txt"

# Pastas ignoradas
IGNORE_DIRS = {
    ".git",
    "node_modules",
    "dist",
    "build",
    "__pycache__",
    ".idea",
    ".vscode",
    ".next",
    "coverage",
    ".venv",
    "venv",
}

# Arquivos ignorados
IGNORE_FILES = {
    OUTPUT_FILE.name,
    Path(__file__).name,
}

# Extensões consideradas binárias
BINARY_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico",
    ".pdf", ".zip", ".rar", ".7z",
    ".exe", ".dll", ".so",
    ".mp3", ".wav", ".mp4", ".avi", ".mov",
    ".ttf", ".woff", ".woff2",
    ".db", ".sqlite",
}


def should_ignore(path: Path) -> bool:
    if path.name in IGNORE_FILES:
        return True

    if any(part in IGNORE_DIRS for part in path.parts):
        return True

    if path.suffix.lower() in BINARY_EXTENSIONS:
        return True

    return False


def main():
    arquivos = sorted(
        [
            p
            for p in BASE_DIR.rglob("*")
            if p.is_file() and not should_ignore(p)
        ]
    )

    with OUTPUT_FILE.open("w", encoding="utf-8") as output:
        output.write("=" * 80 + "\n")
        output.write("CONTEXTO DO PROJETO\n")
        output.write("=" * 80 + "\n\n")

        for arquivo in arquivos:
            relativo = arquivo.relative_to(BASE_DIR)

            output.write("\n")
            output.write("=" * 80 + "\n")
            output.write(f"ARQUIVO: {relativo}\n")
            output.write("=" * 80 + "\n\n")

            try:
                conteudo = arquivo.read_text(encoding="utf-8")
                output.write(conteudo)
            except UnicodeDecodeError:
                output.write("[Arquivo não é texto UTF-8. Ignorado.]")
            except Exception as e:
                output.write(f"[Erro ao ler arquivo: {e}]")

            output.write("\n\n")

    print(f"Arquivo gerado com sucesso: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()