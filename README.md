# Bolinho de Bacalhau — Sistema de Gestão

Backend Spring Boot + Frontend React + PostgreSQL.

## Rodar com Docker (recomendado)

### Pré-requisito
Docker Desktop instalado e **aberto/rodando**.

### 1 comando para subir tudo:
```bash
docker compose up -d
```

Aguarde ~3 minutos no primeiro build. Depois acesse:
- **Painel:** http://localhost:3000
- **Swagger:** http://localhost:8080/swagger-ui.html

### Usuários padrão
| Usuário | Senha       | Perfil       |
|---------|-------------|--------------|
| dono    | bolinho123  | Acesso total |
| gestor  | gestor123   | Estoque/compras |
| caixa   | caixa123    | Apenas PDV   |

### Comandos úteis
```bash
docker compose logs -f          # ver logs ao vivo
docker compose down             # parar
docker compose down -v          # parar e apagar banco
docker compose up -d --build    # rebuild após mudanças
```

## Deploy Railway
1. `git push` para o GitHub
2. Criar projeto no railway.app → conectar repo
3. Adicionar PostgreSQL
4. Configurar variáveis (ver README do guia)
5. Gerar domínio público para cada serviço
