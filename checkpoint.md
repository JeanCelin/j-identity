# Checkpoint do Projeto — J-Identity

## 1. Visão geral

**Nome do projeto:** J-Identity

**Tipo:** Identity Service / Authentication Service

O J-Identity será um serviço centralizado de identidade e autenticação, hospedado online, que poderá ser utilizado por diferentes aplicações independentes.

O objetivo é evitar que cada novo projeto precise implementar seu próprio sistema de autenticação.

Exemplo conceitual:

```text
Aplicação A ─────┐
                 │
Aplicação B ─────┼──→ J-Identity
                 │
Aplicação C ─────┘
```

Cada aplicação conhecerá as regras e endpoints do J-Identity, mas não precisará conhecer a implementação interna de autenticação.

O projeto também possui um objetivo educacional: construir o sistema gradualmente e compreender o funcionamento de autenticação, banco de dados, sessões, tokens, cookies e segurança.

---

# 2. Objetivo principal

O primeiro objetivo é construir um sistema capaz de:

* cadastrar usuários;
* armazenar senhas com segurança;
* validar credenciais;
* realizar login;
* identificar usuários autenticados;
* utilizar JWT;
* utilizar Refresh Tokens;
* realizar logout;
* controlar sessões.

Posteriormente:

* confirmação de e-mail;
* recuperação de senha;
* gerenciamento de sessões;
* login social;
* roles e permissions;
* registro de aplicações;
* controle de acesso das aplicações;
* rate limiting;
* SDK TypeScript.

---

# 3. Arquitetura desejada

O J-Identity será um serviço independente.

Não será utilizado monorepo.

Cada projeto poderá estar em um repositório completamente separado.

Exemplo:

```text
finance-app/
event-app/
book-app/
portfolio-admin/
mobile-app/
```

Todos poderão utilizar:

```text
https://identity.seudominio.com
```

como serviço de autenticação.

A arquitetura conceitual será:

```text
┌───────────────────────┐
│  Aplicações clientes  │
│                       │
│ Next.js / React Native│
│ Node / outras         │
└───────────┬───────────┘
            │
            │ HTTP
            ▼
┌───────────────────────┐
│      J-Identity       │
│     Identity API      │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│        Prisma         │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ PostgreSQL / Supabase │
└───────────────────────┘
```

No futuro poderá existir um SDK:

```bash
npm install @jeancelin/auth
```

que simplificará o consumo da API.

O SDK, entretanto, será apenas uma camada de conveniência. A API continuará sendo o núcleo do sistema.

---

# 4. Controle de acesso

O serviço não tem como objetivo ser uma plataforma pública de autenticação.

A intenção é que somente aplicações autorizadas pelo proprietário possam utilizá-lo.

Ainda será estudada a melhor estratégia para isso.

Possibilidades:

* API Keys;
* registro de aplicações;
* whitelist;
* client credentials;
* controle de CORS;
* rate limiting;
* identificação da aplicação cliente.

Essa parte será implementada posteriormente.

Não devemos confundir CORS com autenticação da aplicação. CORS controla quais origens podem realizar determinadas requisições através de navegadores; ele não é uma barreira de segurança suficiente para impedir que um cliente não autorizado consuma uma API.

---

# 5. Stack atual

## Backend

* Node.js
* Express 5
* TypeScript

## Banco de dados

* PostgreSQL

## Hospedagem do banco

* Supabase

O Supabase será utilizado principalmente como PostgreSQL gerenciado.

Não utilizaremos o Supabase Auth neste projeto.

A autenticação será implementada pelo próprio J-Identity para fins de aprendizado e reutilização.

## ORM

* Prisma 6

## Validação

* Zod

## Password hashing

* bcrypt

---

# 6. Package.json atual

```json
{
  "name": "identity-api",
  "version": "1.0.0",
  "description": "Identity service for Jean platform",
  "main": "dist/server.js",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "@prisma/client": "^6.19.3",
    "bcrypt": "...",
    "cors": "^2.8.6",
    "dotenv": "^17.4.2",
    "express": "^5.2.1",
    "prisma": "^6.19.3",
    "zod": "..."
  },
  "devDependencies": {
    "@types/bcrypt": "...",
    "@types/express": "^5.0.6",
    "@types/node": "^26.1.2",
    "tsx": "^4.23.1",
    "typescript": "^7.0.2"
  }
}
```

As versões de `bcrypt`, `@types/bcrypt` e `zod` não são fixadas neste documento porque foram instaladas posteriormente e devem ser consideradas conforme o `package.json` atual do projeto.

---

# 7. Estrutura atual

A estrutura conceitual atual é:

```text
identity-api/
│
├── prisma/
│   ├── migrations/
│   └── schema.prisma
│
├── src/
│   ├── controllers/
│   │   └── auth.controller.ts
│   │
│   ├── lib/
│   │   └── prisma.ts
│   │
│   ├── middlewares/
│   │
│   ├── repositories/
│   │   └── user.repository.ts
│   │
│   ├── routes/
│   │   └── auth.routes.ts
│   │
│   ├── schemas/
│   │   └── auth.schema.ts
│   │
│   ├── services/
│   │   └── auth.service.ts
│   │
│   └── server.ts
│
├── .env
├── package.json
└── tsconfig.json
```

A estrutura poderá evoluir conforme novas responsabilidades forem introduzidas.

Não devemos criar pastas, classes ou abstrações antes de existir uma necessidade concreta para elas.

---

# 8. Arquitetura em camadas

Foi definida a seguinte separação:

```text
Cliente
   ↓
Routes
   ↓
Controller
   ↓
Service
   ↓
Repository
   ↓
Prisma
   ↓
PostgreSQL
```

## Routes

Responsáveis por registrar os endpoints.

Exemplo:

```ts
router.post("/register", register);
```

Não devem conter regras de negócio.

---

## Controllers

Responsáveis pela comunicação HTTP.

Recebem:

```ts
Request
Response
```

Responsabilidades:

* ler dados da requisição;
* validar/encaminhar os dados de entrada;
* chamar Services;
* definir a resposta HTTP.

Os Controllers serão implementados como funções.

---

## Services

Responsáveis pelas regras de negócio.

Exemplos:

```text
registerUser()
loginUser()
refreshSession()
logoutUser()
```

Services não devem depender de Express.

---

## Repositories

Responsáveis pela persistência.

Toda comunicação com Prisma deve ser concentrada nessa camada.

Exemplos:

```text
findUserByEmail()
createUser()
```

O Repository não deve conter regras de autenticação.

---

# 9. Express

O servidor foi criado e está funcionando na porta:

```text
3001
```

A aplicação possui:

```http
GET /health
```

Resposta:

```json
{
  "status": "ok"
}
```

Também foi configurado:

```ts
app.use(express.json());
```

Isso é necessário para que o Express faça o parsing de requisições contendo JSON e disponibilize os dados através de:

```ts
req.body
```

---

# 10. Middleware

Foi estudado o conceito de middleware do Express.

Foi implementado um middleware inicial de logging.

Conceitos estudados:

* pipeline de requisição;
* ordem dos middlewares;
* `Request`;
* `Response`;
* `next()`.

O conceito principal aprendido foi:

```text
Request
   ↓
Middleware
   ↓
next()
   ↓
próximo middleware/handler
```

---

# 11. Prisma

Foi escolhido o Prisma 6.

O projeto inicialmente foi criado utilizando uma configuração mais recente do Prisma, mas encontramos mudanças incompatíveis com a abordagem que está sendo utilizada neste estudo.

Foi feito downgrade para:

```text
Prisma 6.19.3
```

Atualmente:

```text
@prisma/client: 6.19.3
prisma: 6.19.3
```

O Prisma Client é atualmente gerado em:

```text
node_modules/@prisma/client
```

e pode ser importado através de:

```ts
import { PrismaClient } from "@prisma/client";
```

Foi criado:

```text
src/lib/prisma.ts
```

com uma instância compartilhada:

```ts
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
```

---

# 12. PostgreSQL e Supabase

Foi criada uma instância PostgreSQL no Supabase.

O banco está hospedado no Supabase.

Região escolhida:

```text
Canada (Central)
```

O J-Identity utiliza o PostgreSQL do Supabase como banco de dados remoto.

A aplicação Node conecta-se ao PostgreSQL através do Prisma.

Fluxo:

```text
J-Identity
    ↓
Prisma
    ↓
PostgreSQL
    ↓
Supabase
```

---

# 13. Model User

A entidade inicial do sistema é:

```prisma
model User {
  id             String   @id @default(uuid())
  name           String
  email          String   @unique
  passwordHash   String
  emailVerified  Boolean  @default(false)
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

## Campos

### id

Identificador único do usuário.

```prisma
@id @default(uuid())
```

---

### name

Nome do usuário.

---

### email

Endereço de e-mail.

```prisma
@unique
```

O e-mail não pode ser duplicado no banco.

---

### passwordHash

Hash da senha.

A senha original nunca deve ser armazenada.

---

### emailVerified

Indica se o usuário confirmou o endereço de e-mail.

Inicialmente:

```text
false
```

O processo de confirmação será implementado posteriormente.

---

### isActive

Indica se a conta está habilitada.

Uma conta desativada não deverá conseguir autenticar.

---

### createdAt

Data de criação do usuário.

---

### updatedAt

Data da última alteração do registro.

---

# 14. Migration

A primeira migration foi criada e executada com sucesso.

O SQL gerado criou:

```sql
CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
```

Também foi criado um índice único:

```sql
CREATE UNIQUE INDEX "User_email_key"
ON "User"("email");
```

Foi estudado que:

```text
schema.prisma
      ↓
migration
      ↓
SQL
      ↓
PostgreSQL
```

Migration representa uma alteração versionada na estrutura do banco.

---

# 15. Zod

Foi introduzido o Zod para validação em runtime.

Foi criado:

```text
src/schemas/auth.schema.ts
```

Com o schema de cadastro:

```ts
export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});
```

Foi estudada a diferença entre:

```text
TypeScript
```

e:

```text
Runtime validation
```

TypeScript não garante que dados externos respeitem os tipos declarados.

Como as requisições HTTP vêm de clientes externos, os dados precisam ser validados durante a execução.

---

# 16. bcrypt

Foi introduzido o bcrypt para armazenamento seguro de senhas.

Fluxo:

```text
senha original
      ↓
bcrypt.hash()
      ↓
passwordHash
      ↓
PostgreSQL
```

Para verificar uma senha:

```text
senha fornecida
      +
passwordHash armazenado
      ↓
bcrypt.compare()
      ↓
true / false
```

Foi estudado:

* diferença entre hash e criptografia;
* por que senhas não devem ser criptografadas de forma reversível;
* por que SHA-256 não é apropriado como mecanismo direto de armazenamento de senhas;
* conceito de salt;
* cost factor;
* comparação através de `bcrypt.compare()`.

Foi realizado um teste prático com sucesso.

Exemplo obtido:

```text
Hash: $2b$12$j3o1Bu7R1aMiO8BzKeEb0eC0juv8qLp1HX0pDVtRQlTFTPQT3/hNS
Senha correta: true
Senha errada: false
```

O arquivo utilizado para o teste foi removido após a validação.

---

# 17. Cadastro de usuário

O primeiro fluxo real do J-Identity foi implementado:

```http
POST /auth/register
```

Fluxo:

```text
POST /auth/register
        ↓
express.json()
        ↓
Route
        ↓
Controller
        ↓
Zod
        ↓
Auth Service
        ↓
bcrypt
        ↓
User Repository
        ↓
Prisma
        ↓
PostgreSQL
```

---

# 18. Register Controller

O Controller recebe a requisição e utiliza o schema do Zod para validar os dados antes de chamar o Service.

Responsabilidade:

```text
HTTP
 ↓
validação
 ↓
Service
 ↓
resposta HTTP
```

O Controller não deve conter a regra de negócio do cadastro.

---

# 19. Auth Service

Foi implementado o fluxo de cadastro.

Conceitualmente:

```text
registerUser()
      ↓
procura usuário pelo e-mail
      ↓
usuário já existe?
      ↓
sim → rejeita
      ↓
não
      ↓
gera passwordHash
      ↓
cria usuário
```

O Service contém a regra:

> Um usuário não pode ser cadastrado novamente utilizando um e-mail já existente.

---

# 20. User Repository

Foi criado:

```text
src/repositories/user.repository.ts
```

Responsável pelas operações relacionadas ao usuário no banco.

Operações atuais:

```text
findUserByEmail()
createUser()
```

O Repository utiliza Prisma.

Exemplo conceitual:

```ts
prisma.user.findUnique(...)
```

e:

```ts
prisma.user.create(...)
```

O Service não precisa conhecer os detalhes da consulta SQL ou do Prisma.

---

# 21. Segurança do passwordHash

O cadastro foi implementado de forma que o cliente não receba o `passwordHash`.

O fluxo é:

```text
Request
   ↓
password
   ↓
bcrypt.hash()
   ↓
passwordHash
   ↓
database
```

Quando o usuário é retornado:

```text
passwordHash
```

é removido da resposta.

A senha original nunca é persistida.

---

# 22. Testes realizados

O cadastro foi testado com sucesso.

## Cadastro válido

Resultado:

```text
usuário criado
```

---

## E-mail inválido

Exemplo:

```text
email = "banana"
```

Resultado:

```text
Zod rejeitou
```

---

## Senha inválida

Senha abaixo do tamanho definido pelo schema.

Resultado:

```text
Zod rejeitou
```

---

## E-mail duplicado

Tentativa de cadastrar novamente o mesmo e-mail.

Resultado:

```text
erro
```

Existem duas proteções:

```text
Service
 ↓
verificação de usuário existente

+

PostgreSQL
 ↓
UNIQUE(email)
```

A constraint `UNIQUE` do banco permanece necessária mesmo com a verificação realizada no Service, pois protege a integridade dos dados e também cobre condições de corrida.

---

# 23. Conceitos importantes aprendidos

Até agora foram estudados:

### HTTP / Express

* Request;
* Response;
* rotas;
* middleware;
* `next()`;
* `express.json()`;
* status HTTP.

### Arquitetura

* separação de responsabilidades;
* Controller;
* Service;
* Repository;
* fluxo entre camadas.

### Banco de dados

* PostgreSQL;
* Supabase;
* tabela;
* primary key;
* unique constraint;
* migration.

### Prisma

* ORM;
* model;
* Prisma Client;
* `findUnique`;
* `create`;
* migration;
* conexão com PostgreSQL.

### Segurança

* password hashing;
* bcrypt;
* salt;
* cost factor;
* `bcrypt.hash`;
* `bcrypt.compare`;
* não armazenar senhas;
* não retornar `passwordHash`.

### Validação

* diferença entre TypeScript e validação em runtime;
* Zod;
* schema de validação.

---

# 24. Decisões de segurança

## Senhas

Nunca armazenar:

```text
password
```

Somente:

```text
passwordHash
```

---

## Estado de autenticação

Não haverá:

```text
authenticated = true
```

A autenticação será determinada posteriormente pela validade de uma credencial de autenticação, como um token/sessão.

---

## User enumeration

No login, não devemos revelar separadamente:

```text
usuário não existe
```

ou:

```text
senha incorreta
```

A resposta deverá utilizar uma mensagem genérica de credenciais inválidas.

---

## Database constraints

Regras importantes de integridade também deverão existir no banco.

Exemplo:

```text
email UNIQUE
```

A aplicação não deve depender exclusivamente da validação feita no Service.

---

# 25. Tratamento de erros — estado atual

Ainda não foi implementado um sistema estruturado de erros.

Atualmente existem erros simples, como:

```ts
throw new Error("User already exists");
```

O tratamento de erros HTTP ainda precisa ser melhorado.

Posteriormente será estudada uma estratégia própria para diferenciar:

```text
400 Bad Request
409 Conflict
401 Unauthorized
403 Forbidden
404 Not Found
500 Internal Server Error
```

Não foi criado ainda um `AppError` ou sistema semelhante.

---

# 26. Próximo objetivo imediato

O cadastro está concluído.

O próximo fluxo será:

```http
POST /auth/login
```

O login deverá:

1. receber e validar e-mail e senha;
2. procurar o usuário;
3. verificar se a conta existe;
4. comparar a senha utilizando `bcrypt.compare()`;
5. verificar `isActive`;
6. rejeitar credenciais inválidas;
7. retornar os dados públicos do usuário.

Inicialmente o login será implementado **sem JWT**.

Isso é proposital.

Primeiro vamos separar dois conceitos:

```text
Autenticação das credenciais
```

e:

```text
Persistência da autenticação
```

O primeiro será resolvido pelo login.

O segundo será resolvido posteriormente através de tokens/sessões.

---

# 27. Próxima sequência de aulas

A sequência planejada a partir deste ponto será dividida em aulas menores.

## Aula seguinte — Login: busca e verificação de credenciais

Objetivo:

```text
POST /auth/login
        ↓
buscar usuário
        ↓
bcrypt.compare()
        ↓
credenciais válidas ou inválidas
```

Sem JWT.

---

## Depois — Tratamento de erros HTTP

Vamos corrigir o tratamento atual e aprender a diferenciar:

```text
erro de validação
erro de regra de negócio
erro de autenticação
erro interno
```

Incluindo quando utilizar `400`, `401`, `409` e `500`.

---

## Depois — O que significa "estar autenticado"?

Vamos analisar o problema que surge imediatamente após o login:

```text
O usuário fez login.
Como a próxima requisição sabe disso?
```

Esse será o ponto de entrada para JWT e/ou sessão.

---

## Depois — JWT

Estudaremos:

* payload;
* header;
* assinatura;
* secret/private key;
* expiração;
* validação;
* o que JWT resolve;
* o que JWT não resolve.

---

## Depois — Access Token

Vamos transformar o login em um mecanismo real de autenticação entre requisições.

---

## Depois — Refresh Token

Vamos entender por que existe uma segunda credencial e por que não devemos simplesmente criar um JWT de longa duração.

---

## Depois — Cookies e segurança

Como você já estudou cookies, CORS e preflight anteriormente, vamos conectar esses conceitos ao sistema que estamos construindo:

```text
HttpOnly
Secure
SameSite
CORS
credentials
```

---

# 28. Estado atual resumido

```text
J-Identity
│
├── Express                         ✅
├── Middleware                      ✅
├── Arquitetura em camadas         ✅
├── PostgreSQL / Supabase           ✅
├── Prisma 6                        ✅
├── Prisma Client                   ✅
├── Migration                       ✅
├── User model                      ✅
├── Zod                             ✅
├── bcrypt                          ✅
├── POST /auth/register             ✅
│
├── POST /auth/login                ⏳
├── Tratamento de erros             ⏳
├── JWT                             ⏳
├── Access Token                    ⏳
├── Refresh Token                   ⏳
├── Logout                          ⏳
├── Sessões                         ⏳
├── Confirmação de e-mail           ⏳
├── Recuperação de senha            ⏳
├── Autorização / RBAC              ⏳
├── Aplicações autorizadas          ⏳
└── SDK @jeancelin/auth             ⏳
```

---

# 29. Filosofia do projeto

O J-Identity não deve ser desenvolvido simplesmente copiando uma implementação pronta.

Cada etapa deve responder a três perguntas:

```text
O que estamos construindo?

Por que isso é necessário?

Qual problema essa decisão resolve?
```

A implementação será incremental.

Não serão introduzidas abstrações, classes, padrões ou componentes arquiteturais apenas porque são comuns em projetos grandes.

Cada nova camada deverá surgir quando houver uma responsabilidade concreta para ela.

O objetivo final é que Jean consiga olhar para o sistema e compreender o caminho completo:

```text
HTTP Request
    ↓
Express
    ↓
Route
    ↓
Controller
    ↓
Validation
    ↓
Service
    ↓
Repository
    ↓
Prisma
    ↓
PostgreSQL
```

e, posteriormente:

```text
Login
    ↓
Credential Verification
    ↓
Access Token
    ↓
Refresh Token
    ↓
Cookie / Secure Storage
    ↓
Authenticated Request
    ↓
Middleware
    ↓
Identity
```

O sistema deverá ser suficientemente independente para ser utilizado por aplicações futuras sem que elas precisem conhecer ou reproduzir sua implementação interna.
