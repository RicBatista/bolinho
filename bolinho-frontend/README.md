# Bolinho de Bacalhau — Frontend React

Painel de gestão completo com React 18 + Vite + Recharts.

## Como rodar

### Pré-requisitos
- Node.js 18+
- API Spring Boot rodando em `localhost:8080`

### Instalação e início
```bash
npm install
npm run dev
```

Acesse: **http://localhost:3000**

O Vite faz proxy automático de `/api` para `http://localhost:8080` — não precisa configurar CORS.

---

## Telas

| Tela | Rota | Descrição |
|---|---|---|
| Dashboard | `/` | KPIs, gráficos de faturamento e alertas |
| PDV | `/pdv` | Ponto de Venda — registrar vendas rapidamente |
| Produtos | `/produtos` | Gerenciar o cardápio por categoria |
| Estoque | `/estoque` | Ingredientes, níveis e alertas de estoque mínimo |
| Fornecedores | `/fornecedores` | CRUD de fornecedores |
| Compras | `/compras` | Compras de insumos e pagamento de contas |
| Notificações | `/notificacoes` | Histórico e testes de notificações WhatsApp |

---

## Deploy junto com o backend (Spring Boot)

Para produção, faça o build e sirva os arquivos estáticos pelo próprio Spring Boot:

```bash
# 1. Build do frontend
npm run build

# 2. Copie a pasta dist/ para o Spring Boot
cp -r dist/* ../bolinho-bacalhau/src/main/resources/static/
```

O Spring Boot serve automaticamente arquivos estáticos de `src/main/resources/static/`.
Adicione ao `application.properties`:
```properties
spring.web.resources.static-locations=classpath:/static/
```

Assim você tem frontend + backend num único JAR para o Railway/Render!

---

## Estrutura

```
src/
├── main.jsx              # Entrypoint
├── App.jsx               # Router principal
├── index.css             # Design system completo
├── services/
│   └── api.js            # Todas as chamadas à API
├── components/
│   ├── Sidebar.jsx       # Navegação lateral + TopBar
│   └── Modal.jsx         # Modal reutilizável
└── pages/
    ├── Dashboard.jsx     # KPIs + gráficos
    ├── PDV.jsx           # Ponto de Venda
    ├── Produtos.jsx      # Gestão do cardápio
    ├── Estoque.jsx       # Controle de ingredientes
    ├── Fornecedores.jsx  # Cadastro de fornecedores
    ├── Compras.jsx       # Compras e contas a pagar
    └── Notificacoes.jsx  # WhatsApp e histórico
```
