# J-Identity API

API centralizada de identidade e autenticação para aplicações clientes. A responsabilidade principal da API é gerenciar cadastro de usuários, autenticação, sessões, tokens e proteção de rotas.

A API pode ser consumida diretamente via HTTP ou através do projeto complementar `j-identity-sdk`.

## Visão geral

A aplicação expõe suas rotas de autenticação sob o prefixo `/auth` e fornece um endpoint de saúde em `/health`.

Fluxo principal:

1. Uma aplicação cliente é criada por um administrador
2. Usuário se registra em `/auth/register` usando as credenciais da aplicação
3. Faz login em `/auth/login` usando as credenciais da aplicação
4. Recebe um Access Token na resposta
5. O Refresh Token é armazenado em cookie HttpOnly
6. Usa o Access Token no header `Authorization: Bearer <token>`
7. Renova a autenticação via `/auth/refresh`
8. Finaliza a sessão em `/auth/logout`

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

Rotas administrativas são expostas sob o prefixo `/admin` e exigem um Access
Token válido de um usuário com papel `ADMIN`.

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

## Autenticação

### Access Token

O Access Token é um JWT utilizado para autenticar requisições protegidas.

Características:

- curta duração
- expiração atual de 15 minutos
- enviado através do header:

```http
Authorization: Bearer <accessToken>
```

O token contém o identificador do usuário no claim `sub`.

O Access Token é mantido pelo cliente e não é persistido pela API.

### Refresh Token

O Refresh Token é utilizado exclusivamente para renovar a autenticação.

Características:

- gerado usando valores aleatórios criptograficamente seguros
- nunca armazenado em texto puro no banco
- armazenado apenas como hash SHA-256
- expiração atual de 30 dias
- enviado ao cliente através de cookie HttpOnly

O navegador envia o Refresh Token automaticamente quando a configuração de cookies permite.

### Credenciais da aplicação cliente

As rotas `/auth/register` e `/auth/login` exigem `clientId` e `clientSecret`
de uma aplicação cliente ativa. O segredo é validado contra o hash armazenado
na API e não é persistido em texto puro.

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

A nova sessão permanece associada à mesma `familyId`.

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

A reutilização é tratada como um evento de segurança.

A informação detalhada sobre reuse detection é mantida internamente. A API não precisa expor ao cliente que uma reutilização específica foi detectada.

## Endpoints

| Método | Rota                         | Descrição                          |
| ------ | ---------------------------- | ---------------------------------- |
| `POST` | `/auth/register`             | Cria um usuário                    |
| `POST` | `/auth/login`                | Autentica o usuário                |
| `GET`  | `/auth/me`                   | Retorna o usuário autenticado      |
| `POST` | `/auth/refresh`              | Renova o Access Token              |
| `POST` | `/auth/logout`               | Finaliza a sessão                  |
| `POST` | `/admin/client-applications` | Cria uma aplicação cliente (ADMIN) |
| `GET`  | `/health`                    | Verifica a saúde da API            |

## Exemplos de uso

### Cadastro

```http
POST /auth/register
Content-Type: application/json

{
  "name": "Jean",
  "email": "jean@example.com",
      "password": "senhaSegura123",
      "clientId": "<clientId>",
      "clientSecret": "<clientSecret>"
}
```

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "jean@example.com",
      "password": "senhaSegura123",
      "clientId": "<clientId>",
      "clientSecret": "<clientSecret>"
}
```

Resposta:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

O Refresh Token é enviado separadamente através de um cookie HttpOnly.

### Requisição autenticada

```http
GET /auth/me
Authorization: Bearer <accessToken>
```

### Refresh

```http
POST /auth/refresh
```

O servidor lê o Refresh Token, valida a sessão e executa a rotação.

Uma nova sessão e um novo Refresh Token são criados.

### Logout

```http
POST /auth/logout
```

O logout revoga a sessão associada ao Refresh Token atual e remove o cookie.

O fluxo é idempotente: tentar fazer logout novamente não deve produzir erro para o cliente.

### Criação de aplicação cliente

A criação de aplicações é restrita a usuários com papel `ADMIN` e exige um
Access Token no header `Authorization`.

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
    "clientSecret": "...",
    "isActive": true,
    "createdAt": "..."
  }
}
```

O `clientSecret` é retornado somente na criação. A API armazena apenas o hash
desse segredo.

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

- senhas protegidas com `bcrypt`
- Refresh Tokens armazenados apenas como hash
- Refresh Token enviado em cookie `HttpOnly`
- Access Token separado do Refresh Token
- Refresh Token Rotation
- Reuse Detection
- revogação de famílias de sessão
- validação de dados com Zod
- tratamento centralizado de erros
- proteção de rotas via JWT
- controle de acesso por papel (`USER` e `ADMIN`)
- cadastro administrativo de aplicações clientes
- segredos de aplicações clientes armazenados apenas como hash
- bloqueio de usuários inativos nos fluxos de autenticação
- tratamento de condição de corrida para emails únicos

## Cookies e CORS

A API utiliza cookies para transportar o Refresh Token em clientes web.

A configuração atual considera:

- `httpOnly`
- `secure`
- `sameSite`
- `path`
- `maxAge`

A configuração definitiva depende da arquitetura de deployment.

Por exemplo, aplicações hospedadas em subdomínios do mesmo domínio podem ter requisitos diferentes de aplicações hospedadas em sites distintos.

O CORS também deve ser configurado explicitamente para permitir apenas origens autorizadas quando `credentials` estiver habilitado.

## Integração com SDK

O projeto possui um SDK complementar, `j-identity-sdk`, responsável por facilitar o consumo da API por aplicações clientes.

O SDK abstrai operações como:

- registro
- login
- obtenção do usuário autenticado
- refresh
- logout

Exemplo conceitual:

```ts
import { createAuthClient } from "j-identity-sdk";

const auth = createAuthClient({
  apiUrl: "https://j-identity.jeancelin.dev",
  platform: "web",
});

await auth.login("user@example.com", "password");
```

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

- cadastro de usuários
- validação de aplicação cliente no cadastro e login
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
- rota administrativa para criação de aplicações clientes
- script para criação do primeiro administrador
- validação de requisições
- tratamento centralizado de erros
- bloqueio de usuários inativos

Recursos como recuperação de senha, confirmação de email, OAuth e permissões
granulares ainda não fazem parte da implementação atual.

## Objetivo

O J-Identity funciona como um serviço reutilizável de identidade.

A proposta é permitir que diferentes aplicações deleguem autenticação e gerenciamento de sessões a uma API centralizada, mantendo a lógica de segurança relacionada à identidade em um único serviço.
