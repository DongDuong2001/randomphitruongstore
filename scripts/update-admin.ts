import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { PrismaClient } from "@prisma/client";
import { hashAdminPassword } from "../src/lib/admin-password";

const prisma = new PrismaClient();

async function main() {
  const newEmail = process.argv[2]?.trim().toLowerCase();
  if (!newEmail) {
    console.error("Usage: npx tsx scripts/update-admin.ts <new-email>");
    process.exit(1);
  }

  const rl = readline.createInterface({ input, output });
  const newPassword = await rl.question("New password: ");
  rl.close();

  if (!newPassword || newPassword.length < 8) {
    console.error("Password must be at least 8 characters");
    process.exit(1);
  }

  const admins = await prisma.adminUser.findMany({ select: { id: true, email: true, role: true } });
  if (admins.length === 0) {
    console.error("No admin users found in database");
    process.exit(1);
  }

  // Update owner/first admin
  const target = admins.find(a => a.role === "OWNER") ?? admins[0];

  await prisma.adminUser.update({
    where: { id: target.id },
    data: {
      email: newEmail,
      passwordHash: hashAdminPassword(newPassword),
    },
  });

  console.log(`✓ Updated admin: ${target.email} → ${newEmail}`);
}

main().finally(() => prisma.$disconnect());
