# Dispensas

O cadastro de dispensa vincula o registro ao identificador do aluno. Esse identificador aceita os 24 caracteres usados pelo ObjectId do MongoDB, permitindo associar a dispensa aos alunos cadastrados no sistema. A verificação da dispensa vigente ocorre ao gravar a chamada; registros dispensados seguem as regras descritas em [Entradas, saídas e arquivos CSV](fechamento-diario.md).
