import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, "../.env") });

import { PrismaClient } from "../app/generated/prisma/client.ts";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

const libsql = createClient({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@arhatiya.com" },
    update: {},
    create: {
      name: "Arhatiya Admin",
      email: "admin@arhatiya.com",
      password: hashedPassword,
      firmName: "Ram Lal & Sons",
      mandiName: "Karnal Mandi",
      address: "Shop No. 12, Grain Market, Karnal, Haryana",
      mobile: "9812345678",
    },
  });

  const defaults = [
    { key: "commission_rate", value: "2.5" },
    { key: "market_fee_rate", value: "2" },
    { key: "rdf_rate", value: "2" },
    { key: "labour_rate", value: "30" },
    { key: "current_season", value: "Rabi 2025-26" },
    { key: "firm_name", value: "Ram Lal & Sons" },
    { key: "mandi_name", value: "Karnal Mandi" },
    { key: "mandi_code", value: "KNL" },
  ];

  for (const s of defaults) {
    await prisma.settings.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }

  const farmers = [
    { name: "Ramesh Kumar", village: "Nilokheri", mobile: "9812111111", tehsil: "Nilokheri" },
    { name: "Suresh Singh", village: "Gharaunda", mobile: "9812222222", tehsil: "Gharaunda" },
    { name: "Mahesh Yadav", village: "Taraori", mobile: "9812333333", tehsil: "Karnal" },
  ];

  for (const f of farmers) {
    await prisma.farmer.create({ data: f });
  }

  const traders = [
    { name: "Vijay Bansal", firmName: "Vijay Rice Mills", mobile: "9812444444", licenseNo: "HAR/KNL/001" },
    { name: "Anil Gupta", firmName: "Gupta Flour Mill", mobile: "9812555555", licenseNo: "HAR/KNL/002" },
  ];

  for (const t of traders) {
    await prisma.trader.create({ data: t });
  }

  console.log("✅ Seed data created successfully");
  console.log("📧 Login: admin@arhatiya.com");
  console.log("🔑 Password: admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
