# j-identity

O **J-Identity** será um serviço de identidade e autenticação centralizado, hospedado online, que poderá ser reutilizado por projetos independentes.

Cada aplicação poderá consumir o serviço através da API, sem precisar implementar seu próprio sistema de autenticação.

O objetivo do projeto é, além de criar uma solução reutilizável, compreender na prática como funciona a arquitetura de um serviço de identidade.

## Responsabilidades

O J-Identity será responsável por:

* cadastro de usuários;
* login;
* validação de credenciais;
* armazenamento seguro de senhas através de hash;
* autenticação através de JWT;
* refresh tokens;
* gerenciamento de sessões;
* logout;
* confirmação de e-mail;
* recuperação de senha;
* posteriormente, autorização;
* posteriormente, roles e permissions.

Informações específicas de cada aplicação, como avatar, preferências e outros dados de perfil, não serão responsabilidade do J-Identity.

## Segurança e acesso

O J-Identity será um serviço de uso pessoal.

O acesso deverá ser controlado para impedir que terceiros utilizem a infraestrutura livremente.

Serão estudadas e implementadas estratégias como:

* API Keys;
* credenciais de aplicações;
* registro de aplicações autorizadas;
* whitelist quando aplicável;
* CORS como mecanismo de controle de origem, mas não como mecanismo principal de segurança;
* rate limiting;
* posteriormente, outras medidas de segurança conforme a arquitetura evoluir.

## Tecnologias

* Node.js
* TypeScript
* Express
* Prisma
* PostgreSQL
* Supabase

## Arquitetura

O fluxo geral da aplicação será:

```text
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
```

### Responsabilidades

**Middleware**

Executa lógica durante o pipeline da requisição, como autenticação, autorização, logging e validações específicas.

**Routes**

Define os endpoints disponíveis e direciona cada requisição para o controller correspondente.

**Controllers**

Responsáveis por lidar com HTTP: receber `Request`, chamar a camada apropriada e construir a `Response`.

**Services**

Contêm as regras de negócio da aplicação.

**Repositories**

Responsáveis pelo acesso aos dados e pela comunicação com o Prisma.

**Prisma**

ORM utilizado para fazer a comunicação entre a aplicação TypeScript e o PostgreSQL.

**PostgreSQL**

Banco de dados responsável pela persistência dos dados.

## Infraestrutura

O PostgreSQL será hospedado no **Supabase**.

O J-Identity será uma aplicação independente e hospedada online.

Os projetos consumidores não precisarão estar no mesmo repositório ou diretório.

A integração futura poderá ser feita diretamente pela API ou através de um SDK próprio.

## SDK futuro

Após a API estar funcional e os conceitos de autenticação estarem consolidados, será desenvolvido um SDK TypeScript, por exemplo:

```text
@jeancelin/auth
```

O SDK terá como objetivo esconder detalhes de implementação da autenticação dos projetos consumidores.

Exemplo conceitual:

```ts
const auth = new AuthClient({
  apiUrl: "https://identity.example.com",
});

await auth.login(email, password);

const user = await auth.me();

await auth.logout();
```

O SDK será uma camada de consumo da API. O serviço J-Identity continuará existindo independentemente dele.

## Estado atual

Já implementado:

* projeto Node.js;
* Express;
* servidor HTTP;
* rota de health check;
* middleware inicial;
* controllers;
* services;
* estrutura inicial de repositories;
* PostgreSQL no Supabase;
* Prisma 6;
* primeira modelagem do `User`;
* primeira migration;
* tabela `User` criada no PostgreSQL.

### Modelo atual

```prisma
model User {
  id            String   @id @default(uuid())
  name          String
  email         String   @unique
  passwordHash  String
  emailVerified Boolean  @default(false)
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### Próximo passo

Aprender e configurar o **Prisma Client**, criando a conexão entre a aplicação e o banco.

Depois disso, começaremos a implementar o primeiro fluxo real do sistema:

```text
Cadastro
   ↓
Validação
   ↓
Hash da senha
   ↓
Repository
   ↓
Prisma
   ↓
PostgreSQL
```

A autenticação propriamente dita será construída gradualmente depois que a persistência de usuários estiver funcionando.
