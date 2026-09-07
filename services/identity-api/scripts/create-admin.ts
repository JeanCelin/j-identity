import "dotenv/config";
import bcrypt from "bcrypt";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { prisma } from "../src/lib/prisma.js";

const rl = createInterface({
  input,
  output,
});

async function main() {
  try {
    const name = await rl.question("Nome do administrador: ");
    const email = await rl.question("Email do administrador: ");
    const password = await rl.question("Senha do administrador: ");

    if (!name || !email || !password) {
      console.error("Todos os campos são obrigatórios.");
      process.exitCode = 1;
      return;
    }

    if (password.length < 8) {
      console.error("A senha deve ter pelo menos 8 caracteres.");
      process.exitCode = 1;
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      console.error("Já existe um usuário com esse email.");
      process.exitCode = 1;
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "ADMIN",
      },
    });

    console.log(`\nAdministrador criado com sucesso!`);
    console.log(`ID: ${admin.id}`);
    console.log(`Email: ${admin.email}`);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  console.error("\nErro ao criar administrador:", error);
  await prisma.$disconnect();
  process.exitCode = 1;
});