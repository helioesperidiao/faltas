from pathlib import Path

# Pasta onde o script está (o TXT será salvo aqui)
PASTA_SCRIPT = Path(__file__).resolve().parent

# Pasta de onde os arquivos serão lidos (mude se quiser outra)
PASTA_ORIGEM = PASTA_SCRIPT

# Caminho completo do arquivo de saída
ARQUIVO_SAIDA = PASTA_SCRIPT / "consolidado.txt"

# Extensões de arquivos binários que NÃO fazem sentido ler como texto
IGNORAR = {".exe", ".dll", ".zip", ".rar", ".7z",
           ".jpg", ".jpeg", ".png", ".gif", ".bmp",
           ".mp3", ".mp4", ".avi", ".mov", ".pdf",
           ".docx", ".xlsx", ".pptx",".py"}

with open(ARQUIVO_SAIDA, "w", encoding="utf-8") as saida:
    for arquivo in PASTA_ORIGEM.rglob("*"):
        if not arquivo.is_file():
            continue
        if arquivo.resolve() == ARQUIVO_SAIDA.resolve():
            continue  # não inclui o próprio TXT de saída
        if arquivo.suffix.lower() in IGNORAR:
            continue

        # Cabeçalho com o caminho relativo
        saida.write("\n" + "=" * 70 + "\n")
        saida.write(f"ARQUIVO: {arquivo.relative_to(PASTA_ORIGEM)}\n")
        saida.write("=" * 70 + "\n")

        # Lê o CONTEÚDO do arquivo
        try:
            conteudo = arquivo.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            conteudo = arquivo.read_text(encoding="latin-1", errors="ignore")

        saida.write(conteudo)
        if not conteudo.endswith("\n"):
            saida.write("\n")

print(f"Pronto! Conteúdo salvo em: {ARQUIVO_SAIDA}")