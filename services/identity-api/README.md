# J-Identity API

API centralizada de identidade e autenticação para aplicações clientes. A responsabilidade principal da API é gerenciar cadastro de usuários, autenticação, sessões, tokens e proteção de rotas.

A API pode ser consumida diretamente via HTTP ou através do projeto complementar `j-identity-sdk`.

## Visão geral

A aplicação fornece autenticação administrativa sob o prefixo `/admin`, autenticação de usuários de aplicações clientes sob `/auth` e um endpoint de saúde em `/health`.

O fluxo geral possui duas etapas:

**Bootstrap administrativo:**

```text
create-admin → /admin/login → /admin/client-applications
```

O administrador é criado pelo script, autentica-se diretamente com email e
senha em `/admin/login` e usa o Access Token retornado para criar a primeira
`ClientApplication`. A `ClientApplication` não é necessária para o login
administrativo; essa separação evita uma dependência circular no bootstrap.

**Fluxo de uma aplicação cliente:**

```text
clientId + clientSecret
  ↓
/auth/register
  ↓
/auth/login
  ↓
Access Token + Refresh Token
  ↓
/auth/me
  ↓
/auth/refresh
  ↓
/auth/logout
```

As rotas `/auth/*` exigem as credenciais da `ClientApplication` e as sessões
normais ficam vinculadas a ela.

## Arquitetura

A API segue uma arquitetura em camadas:

- `routes/` — definição dos endpoints HTTP
- `controllers/` — comunicação entre HTTP e regras de negócio
- `services/` — regras de negócio e fluxos de autenticação
- `repositories/` — acesso ao banco de dados
- `middleware/` — autenticação e tratamento de requisições
- `schemas/` — validação de dados com Zod
- `errors/` — contrato e tratamento centralizado de erros
- `config/` — configurações como cookies e CORS
- `prisma/` — schema e migrations do banco de dados

Rotas administrativas são expostas sob o prefixo `/admin` e, quando protegidas,
exigem um Access Token JWT válido de um usuário com papel `ADMIN`. O endpoint
`/admin/login` é uma exceção intencional: ele é público por ser o ponto de
entrada da autenticação administrativa, mas somente credenciais de um usuário
`ADMIN` permitem obter o token.

A separação tem como objetivo evitar que regras de negócio fiquem acopladas diretamente ao Express ou ao banco de dados.

## Stack

- Node.js
- TypeScript
- Express
- Prisma
- PostgreSQL
- JWT
- bcrypt
- Zod
- CORS

## Instalação

### Pré-requisitos

Antes de instalar o J-Identity API, você precisa ter:

- Node.js instalado
- npm instalado
- Um banco de dados compatível com o Prisma
- Git, caso esteja clonando o repositório

A implementação atual utiliza PostgreSQL.

### 1. Clonar o projeto

```bash

git clone https://github.com/JeanCelin/j-identity.git

cd j-identity/services/identity-api

```

### 2. Instalar as dependências

```bash

npm install

```

### 3. Configurar as variáveis de ambiente

Crie um arquivo .env na pasta services/identity-api:

```env

DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"

JWT_SECRET="uma-chave-secreta-forte"

NODE_ENV=development

CORS_ORIGINS="http://localhost:3000,http://localhost:5173"

 PORT=3001

```

Nunca compartilhe o arquivo .env ou publique seus valores reais.

### 4. Configurar o banco de dados

A API utiliza Prisma para acesso ao banco de dados.

```bash

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")

}

```

Depois de configurar o DATABASE_URL, execute:

```bash

npx prisma migrate deploy

```

Para desenvolvimento, quando forem necessárias novas migrations:

```bash

npx prisma migrate dev

```

Depois gere o Prisma Client:

```bash

npx prisma generate

```

### Usando outro banco de dados

O J-Identity utiliza Prisma, portanto o projeto pode ser adaptado para outros
providers suportados pela versão do Prisma utilizada, desde que o schema e as
migrations sejam compatíveis. A implementação atual e as migrations incluídas
utilizam PostgreSQL.

Para trocar o banco:

1. Altere o provider em prisma/schema.prisma.
2. Altere o DATABASE_URL no .env para a URL do novo banco.
3. Verifique se o schema Prisma é compatível com o novo provider.
4. Crie novas migrations para o banco escolhido.
5. Gere novamente o Prisma Client.

```bash

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

```

E no .env adicione: DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE"

A API não acessa o banco diretamente através das rotas. O acesso é feito através do Prisma, portanto a camada de persistência fica concentrada no repositories/ e no schema do Prisma.

### 5. Criar o primeiro administrador

Depois que o banco estiver configurado:

```bash

npm run create-admin

```

O script solicitará:

- nome
- email
- senha

A senha deve possuir pelo menos 8 caracteres.

O usuário criado receberá o papel: ADMIN

### 6. Iniciar a API

Para desenvolvimento rode: npm run dev
A API será iniciada na porta configurada em "PORT" no .env
por padrão http://localhost:3001

Você pode verificar se a API está funcionando através de GET /health.
A resposta esperada é {"status": "ok"}

### 7. Criar uma aplicação cliente

Depois de criar o administrador e iniciar a API, obtenha um Access Token
administrativo autenticando-o em `/admin/login`. A `ClientApplication` não é
necessária para esse login.
Em seguida, faça uma requisição:

```http

POST /admin/client-applications
Authorization: Bearer <adminAccessToken>
Content-Type: application/json

{
  "name": "Minha aplicação"
}

```

A API retornará:

```json
{
  "client": {
    "id": "...",
    "name": "Minha aplicação",
    "clientId": "...",
    "clientSecret": "...",
    "isActive": true,
    "createdAt": "..."
  }
}
```

O clientSecret deve ser armazenado com segurança pela aplicação cliente.

Ele é exibido somente no momento da criação e não é armazenado em texto puro pela API.

### 8. Usar a API

Com o clientId e o clientSecret, uma aplicação pode realizar o cadastro e login de usuários.
Exemplo:

```http
POST /auth/login
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "senhaSegura123",
  "clientId": "clientId",
  "clientSecret": "clientSecret"
}

```

A resposta contém:

```json
{
  "accessToken": "...",
  "refreshToken": "..."
}
```

A partir desse ponto, a aplicação cliente é responsável por armazenar os tokens de acordo com sua própria arquitetura.

## Bootstrap inicial

O bootstrap não depende de uma `ClientApplication`. Execute os passos a seguir
na pasta `services/identity-api`:

1. Configure o `.env` e o `DATABASE_URL`.
2. Execute as migrations com `npx prisma migrate deploy` e gere o cliente com
   `npx prisma generate`.
3. Crie o primeiro administrador com `npm run create-admin`.
4. Inicie a API com `npm run dev`.
5. Faça login administrativo:

```http
POST /admin/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "senhaSegura123"
}
```

Resposta:

```json
{
  "accessToken": "eyJ..."
}
```

6. Use o Access Token administrativo para criar a primeira aplicação:

```http
POST /admin/client-applications
Authorization: Bearer <adminAccessToken>
Content-Type: application/json

{
  "name": "Minha aplicação"
}
```

7. Guarde o `clientId` e o `clientSecret` retornados. O segredo é exibido
   somente nessa criação e deve ser mantido em segredo pela aplicação
   consumidora.
8. Use essas credenciais nas rotas `/auth/register`, `/auth/login`,
   `/auth/refresh` e `/auth/logout`.

### 9. Usar o SDK (Opcional)

Para aplicações server-side, também é possível utilizar o j-identity-sdk.
O SDK precisa ser configurado com:

```TypeScript

const auth = createAuthClient({
  apiUrl: "https://sua-api.com",
  clientId: process.env.J_IDENTITY_CLIENT_ID!,
  clientSecret: process.env.J_IDENTITY_CLIENT_SECRET!,
});

```

O clientSecret nunca deve ser enviado para o navegador ou para uma aplicação mobile.

O SDK foi projetado para executar no ambiente server-side da aplicação consumidora.
O fluxo administrativo é realizado diretamente contra `/admin/login`; o SDK
não é um mecanismo de login administrativo.

## Modelo de dados

### User

Representa uma identidade da aplicação.

- `id` — identificador do usuário
- `name` — nome
- `email` — único
- `passwordHash` — senha armazenada como hash
- `emailVerified` — status de verificação do email
- `isActive` — estado ativo/inativo da conta
- `role` — papel do usuário (`USER` ou `ADMIN`)
- `createdAt`
- `updatedAt`

### Session

Representa uma sessão associada a um Refresh Token.

- `id` — identificador da sessão
- `userId` — usuário proprietário
- `clientApplicationId` — aplicação cliente associada à sessão
- `familyId` — identificador da família de tokens
- `refreshTokenHash` — hash do Refresh Token
- `expiresAt` — data de expiração
- `revokedAt` — data de revogação
- `createdAt`

### ClientApplication

Representa uma aplicação cliente autorizada a consumir a API.

- `id` — identificador da aplicação
- `name` — nome da aplicação
- `clientId` — identificador público único
- `clientSecretHash` — hash do segredo da aplicação
- `isActive` — estado ativo/inativo da aplicação
- `createdAt`
- `updatedAt`

O `clientId` e o `clientSecret` são gerados pela API quando a aplicação é
criada. O `clientSecret` é retornado somente nessa resposta e a API armazena
apenas seu hash.

## Autenticação

### Access Token

O Access Token é um JWT utilizado para autenticar requisições protegidas, tanto
no fluxo administrativo quanto no fluxo das aplicações clientes. O login
administrativo em `/admin/login` retorna apenas um Access Token; não existe
Refresh Token administrativo.

Características:

- curta duração
- expiração atual de 15 minutos
- enviado através do header:

```http
Authorization: Bearer <accessToken>
```

O token contém o identificador do usuário no claim `sub`.

O `authenticateMiddleware` consulta o usuário pelo `sub`, verifica se ele está
ativo e recupera seu papel atual (`USER` ou `ADMIN`) antes de permitir o acesso.
O `requireAdminMiddleware` restringe as rotas administrativas protegidas aos
usuários com papel `ADMIN`. O Access Token é mantido pelo cliente e não é
persistido pela API.

### Refresh Token

O Refresh Token é utilizado exclusivamente para renovar a autenticação.

Características:

- gerado usando valores aleatórios criptograficamente seguros
- nunca armazenado em texto puro no banco
- armazenado apenas como hash SHA-256
- expiração atual de 30 dias
- retornado no corpo JSON das respostas de login e refresh
- deve ser armazenado e enviado explicitamente pela aplicação consumidora

O transporte atual não utiliza cookie. A configuração de cookie existente está
desativada; o uso de cookie HttpOnly permanece uma possibilidade futura e não
faz parte do contrato atual da API.

### Credenciais da aplicação cliente

As rotas `/auth/register`, `/auth/login`, `/auth/refresh` e `/auth/logout`
exigem `clientId` e `clientSecret` de uma aplicação cliente ativa no corpo da
requisição. O segredo é validado contra o hash armazenado na API e não é
persistido em texto puro.

## Refresh Token Rotation

Cada utilização válida de um Refresh Token gera uma rotação:

```text
Refresh Token A
      ↓
Session A
      ↓
revoga Session A
      ↓
gera Refresh Token B
      ↓
cria Session B
```

A nova sessão permanece associada à mesma `familyId` e à mesma
`clientApplicationId`.

Dessa forma, um Refresh Token antigo deixa de ser válido após ser utilizado.

## Reuse Detection

Se um Refresh Token que já foi utilizado for reutilizado:

```text
Refresh Token antigo
      ↓
Session já revogada
      ↓
possível reutilização detectada
      ↓
revoga toda a família
```

A reutilização é tratada como um evento de segurança e revoga as sessões não
revogadas da família. A API responde genericamente com `UNAUTHORIZED`, sem
expor ao cliente que a reutilização foi detectada.

A informação detalhada sobre reuse detection é mantida internamente. A API não precisa expor ao cliente que uma reutilização específica foi detectada.

## Endpoints

| Método | Rota                         | Descrição                         |
| ------ | ---------------------------- | --------------------------------- |
| `POST` | `/admin/login`               | Autentica o administrador         |
| `POST` | `/admin/client-applications` | Cria uma aplicação, somente ADMIN |
| `POST` | `/auth/register`             | Cria um usuário                   |
| `POST` | `/auth/login`                | Autentica o usuário               |
| `GET`  | `/auth/me`                   | Retorna o usuário autenticado     |
| `POST` | `/auth/refresh`              | Renova os tokens                  |
| `POST` | `/auth/logout`               | Revoga a sessão                   |
| `GET`  | `/health`                    | Verifica a saúde da API           |

## Exemplos de uso

### Login administrativo

O login administrativo não exige `clientId` nem `clientSecret`. O usuário deve
existir, estar ativo e possuir o papel `ADMIN`.

```http
POST /admin/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "senhaSegura123"
}
```

Resposta:

```json
{
  "accessToken": "eyJ..."
}
```

Envie esse token aos endpoints administrativos protegidos:

```http
Authorization: Bearer <accessToken>
```

### Cadastro

```http
POST /auth/register
Content-Type: application/json

{
  "name": "Jean",
  "email": "jean@example.com",
  "password": "senhaSegura123",
  "clientId": "<clientId>",
  "clientSecret": "client-secret-exemplo"
}
```

Resposta: `201 Created`, com o usuário criado no campo `user`. O
`passwordHash` não é retornado.

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "jean@example.com",
  "password": "senhaSegura123",
  "clientId": "<clientId>",
  "clientSecret": "client-secret-exemplo"
}
```

Resposta:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "refresh-token-exemplo"
}
```

O `refreshToken` é retornado no JSON. O cliente deve armazená-lo e enviá-lo
explicitamente nos endpoints de refresh e logout.

### Requisição autenticada

```http
GET /auth/me
Authorization: Bearer <accessToken>
```

### Refresh

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh-token-exemplo",
  "clientId": "<clientId>",
  "clientSecret": "client-secret-exemplo"
}
```

O servidor valida as credenciais da aplicação, o Refresh Token e a sessão e
executa a rotação.

Uma nova sessão e um novo Refresh Token são criados.

### Logout

```http
POST /auth/logout
Content-Type: application/json

{
  "refreshToken": "refresh-token-exemplo",
  "clientId": "<clientId>",
  "clientSecret": "client-secret-exemplo"
}
```

O logout revoga a sessão associada ao Refresh Token atual. Se o token já tiver
sido revogado, a família também é revogada; se a sessão não existir, a operação
continua sendo tratada como sucesso.

O fluxo é idempotente: tentar fazer logout novamente não deve produzir erro para o cliente.

### Criação de aplicação cliente

A criação de aplicações ocorre depois do bootstrap do administrador. É restrita
a usuários com papel `ADMIN` e exige o Access Token retornado por
`/admin/login` no header `Authorization`. A API gera o `clientId` e o
`clientSecret`, retorna o segredo somente nessa resposta e armazena apenas o
hash dele.

```http
POST /admin/client-applications
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "name": "Minha aplicação"
}
```

Resposta:

```json
{
  "client": {
    "id": "...",
    "name": "Minha aplicação",
    "clientId": "...",
    "clientSecret": "client-secret-gerado-pela-api",
    "isActive": true,
    "createdAt": "..."
  }
}
```

O `clientId` e o `clientSecret` são retornados somente na criação. O valor usado
no exemplo é fictício; a API armazena apenas o hash do segredo.

### Criação do primeiro administrador

Para criar o primeiro usuário administrador, execute o script interativo na
pasta `services/identity-api`:

```bash
npm run create-admin
```

O script solicita nome, email e senha. A senha deve ter pelo menos 8
caracteres e o email não pode estar cadastrado.

## Contrato de erros

A API utiliza um formato padronizado para respostas de erro:

```json
{
  "error": "ERROR_CODE",
  "message": "Mensagem amigável"
}
```

Os códigos definidos no contrato são:

- `VALIDATION_ERROR` — dados da requisição inválidos
- `INVALID_CREDENTIALS` — credenciais inválidas
- `UNAUTHORIZED` — autenticação não permitida
- `FORBIDDEN` — usuário autenticado sem permissão para o recurso
- `TOKEN_EXPIRED` — Access Token expirado
- `INVALID_TOKEN` — token inválido ou malformado
- `INVALID_CLIENT` — aplicação cliente inexistente, inativa ou com segredo inválido
- `SESSION_NOT_FOUND` — sessão não encontrada
- `SESSION_EXPIRED` — sessão expirada
- `SESSION_REVOKED` — sessão revogada
- `REFRESH_TOKEN_REUSED` — Refresh Token reutilizado
- `USER_NOT_FOUND` — usuário não encontrado
- `USER_INACTIVE` — usuário inativo
- `EMAIL_ALREADY_EXISTS` — email já cadastrado
- `INTERNAL_SERVER_ERROR` — erro inesperado

Condições sensíveis de autenticação podem ser normalizadas como `UNAUTHORIZED`
para não expor detalhes internos do fluxo de sessão.

Erros internos ou detalhes operacionais não devem ser expostos ao cliente.

## Segurança

A implementação atual inclui:

- autenticação administrativa em `/admin/login`, sem dependência de
  `ClientApplication`
- criação do primeiro administrador pelo script `create-admin`
- criação de aplicações restrita a usuários com papel `ADMIN`
- `/admin/client-applications` protegido por Access Token e pelo
  `requireAdminMiddleware`
- `clientSecret` retornado somente na criação e armazenado apenas como hash
- credenciais `clientId` e `clientSecret` exigidas nas rotas `/auth/*`
- senhas protegidas com `bcrypt`
- Refresh Tokens armazenados apenas como hash
- Refresh Token retornado em JSON e armazenado pelo consumidor
- Access Token separado do Refresh Token
- Refresh Token Rotation
- Reuse Detection
- revogação de famílias de sessão
- validação de dados com Zod
- tratamento centralizado de erros
- proteção de rotas via JWT
- controle de acesso por papel (`USER` e `ADMIN`)
- bloqueio de usuários inativos nos fluxos administrativo e de aplicações
- sessões de aplicações clientes vinculadas à `ClientApplication`
- tratamento de condição de corrida para emails únicos

## Cookies e CORS

A API atualmente não utiliza cookies para transportar o Refresh Token. O
`cookie-parser` e a configuração de cookie estão desativados, e os tokens são
transportados no corpo JSON.

Existe uma configuração preparada, mas não ativa, que considera:

- `httpOnly`
- `secure`
- `sameSite`
- `path`
- `maxAge`

A configuração definitiva depende da arquitetura de deployment.

Por exemplo, aplicações hospedadas em subdomínios do mesmo domínio podem ter requisitos diferentes de aplicações hospedadas em sites distintos.

O CORS está configurado para permitir apenas as origens listadas em
`CORS_ORIGINS` e mantém `credentials: true`. Isso não altera o contrato atual
de tokens em JSON.

## Integração com SDK

O projeto possui um SDK complementar, `j-identity-sdk`, responsável por facilitar o consumo da API por aplicações clientes.

O SDK abstrai operações como:

- registro
- login
- obtenção do usuário autenticado
- refresh
- logout

Exemplo:

```ts
import { createAuthClient } from "j-identity-sdk";

const auth = createAuthClient({
  apiUrl: "https://j-identity.jeancelin.dev",
  clientId: "client-id-exemplo",
  clientSecret: "client-secret-exemplo",
});

await auth.login("user@example.com", "password");
```

O SDK funciona server-side: `clientId` e `clientSecret` devem permanecer no
ambiente server-side da aplicação consumidora. Ele envia essas credenciais no
corpo de registro, login, refresh e logout. Os tokens são passados
explicitamente aos métodos que precisam deles; o SDK não armazena tokens nem
mantém sessões automaticamente.

A API permanece independente do SDK e pode ser consumida diretamente via HTTP.

## Variáveis de ambiente

```env
DATABASE_URL="postgresql://user:password@host:5432/database"

JWT_SECRET="chave-secreta"

PORT=3001

NODE_ENV="development"

CORS_ORIGINS="http://localhost:3000"
```

## Status atual

A implementação atual cobre o núcleo do ciclo de autenticação:

- bootstrap do primeiro administrador via `npm run create-admin`
- autenticação administrativa via `/admin/login`
- separação entre o fluxo administrativo e o fluxo de autenticação das
  aplicações clientes
- criação protegida de `ClientApplication` por usuários `ADMIN`
- cadastro de usuários
- validação de aplicação cliente no cadastro, login, refresh e logout
- login
- Access Token
- Refresh Token
- sessões persistidas
- Refresh Token Rotation
- Reuse Detection
- Session Revocation
- Logout idempotente
- proteção de rotas
- papéis de usuário (`USER` e `ADMIN`)
- aplicações clientes com `clientId` e `clientSecret`
- sessões vinculadas à aplicação cliente por `clientApplicationId`
- validação de requisições
- tratamento centralizado de erros
- bloqueio de usuários inativos

O transporte de Refresh Token por cookie HttpOnly, recuperação de senha,
confirmação de email, OAuth e permissões granulares ainda não fazem parte da
implementação atual.

## Objetivo

O J-Identity funciona como um serviço reutilizável de identidade.

A proposta é permitir que diferentes aplicações deleguem autenticação e gerenciamento de sessões a uma API centralizada, mantendo a lógica de segurança relacionada à identidade em um único serviço.
