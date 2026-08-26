<!-- # j-identity

O **J-Identity** será um serviço de identidade e autenticação centralizado, hospedado online, que poderá ser reutilizado por projetos independentes.

Cada aplicação poderá consumir o serviço através da API, sem precisar implementar seu próprio sistema de autenticação.

O objetivo do projeto é, além de criar uma solução reutilizável, compreender na prática como funciona a arquitetura de um serviço de identidade.

## Responsabilidades

O J-Identity será responsável por:

- cadastro de usuários;
- login;
- validação de credenciais;
- armazenamento seguro de senhas através de hash;
- autenticação através de JWT;
- access tokens;
- refresh tokens;
- refresh token rotation;
- detecção de reutilização de refresh tokens;
- gerenciamento de sessões;
- agrupamento de sessões através de token families;
- revogação de sessões;
- revogação de uma família de sessões;
- logout;
- confirmação de e-mail;
- recuperação de senha;
- posteriormente, autorização;
- posteriormente, roles e permissions.

Informações específicas de cada aplicação, como avatar, preferências e outros dados de perfil, não serão responsabilidade do J-Identity.

## Segurança e acesso

O J-Identity será um serviço de uso pessoal.

O acesso deverá ser controlado para impedir que terceiros utilizem a infraestrutura livremente.

Serão estudadas e implementadas estratégias como:

- API Keys;
- credenciais de aplicações;
- registro de aplicações autorizadas;
- whitelist quando aplicável;
- CORS como mecanismo de controle de origem, mas não como mecanismo principal de segurança;
- rate limiting;
- posteriormente, outras medidas de segurança conforme a arquitetura evoluir.

## Tecnologias

- Node.js
- TypeScript
- Express
- Prisma
- PostgreSQL
- Supabase
- JWT
- bcrypt
- Zod

## Arquitetura

O fluxo geral da aplicação será:

Cliente
   ↓
Express
   ↓
Middleware
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


## Responsabilidades
Middleware

Executa lógica durante o pipeline da requisição, como autenticação, autorização, logging e validações específicas.

Routes

Define os endpoints disponíveis e direciona cada requisição para o controller correspondente.

Controllers

Responsáveis por lidar com HTTP: receber Request, chamar a camada apropriada e construir a Response.

Services

Contêm as regras de negócio da aplicação.

Repositories

Responsáveis pelo acesso aos dados e pela comunicação com o Prisma.

Prisma

ORM utilizado para fazer a comunicação entre a aplicação TypeScript e o PostgreSQL.

PostgreSQL

Banco de dados responsável pela persistência dos dados.

## Infraestrutura

O PostgreSQL será hospedado no Supabase.

O J-Identity será uma aplicação independente e hospedada online.

Os projetos consumidores não precisarão estar no mesmo repositório ou diretório.

A integração futura poderá ser feita diretamente pela API ou através de um SDK próprio.

## Autenticação

O fluxo de autenticação utiliza dois tipos principais de token:

Access Token

O access token é um JWT de curta duração utilizado para autenticar requisições protegidas.

Atualmente possui duração de:

15 minutos

O token contém o identificador do usuário através da claim sub.

Exemplo conceitual:

{
  "sub": "user-id"
}

As requisições protegidas utilizam o header:

Authorization: Bearer <accessToken>

O middleware de autenticação valida:

existência do header Authorization;
esquema Bearer;
existência do token;
assinatura do JWT;
validade do token;
existência de um sub válido.


## Refresh Token

O refresh token é um token aleatório criptograficamente seguro utilizado para obter novos access tokens.

Os refresh tokens são gerados utilizando crypto.randomBytes().

O token original não é armazenado no banco de dados.

Em vez disso, é armazenado um hash SHA-256 do refresh token:

Refresh Token
      ↓
SHA-256
      ↓
Refresh Token Hash
      ↓
Banco de dados

Quando o cliente envia um refresh token, o servidor gera novamente o hash e procura a sessão correspondente.

## Sessions

Cada refresh token possui uma Session associada.

A sessão possui, entre outras informações:

id;
userId;
familyId;
refreshTokenHash;
expiresAt;
revokedAt;
createdAt.

## Refresh Token Rotation
O J-Identity utiliza Refresh Token Rotation.


## Endpoints atuais

POST /auth/register
POST /auth/login
GET  /auth/me
POST /auth/refresh
POST /auth/logout

## Objetivo do projeto

O objetivo principal do J-Identity não é apenas criar uma API de autenticação.

O projeto está sendo utilizado para compreender e implementar, na prática, conceitos de engenharia de software e segurança envolvidos em um serviço de identidade real, incluindo:

arquitetura em camadas;
autenticação stateless;
JWT;
access tokens;
refresh tokens;
hashing;
gerenciamento de sessões;
refresh token rotation;
token families;
detecção de reutilização;
revogação;
transações;
consistência de dados;
segurança de credenciais;
separação de responsabilidades;
integração entre aplicação, ORM e banco de dados.

A implementação será evoluída gradualmente, mantendo o foco em compreender o motivo de cada decisão arquitetural antes de adicionar novas funcionalidades. -->