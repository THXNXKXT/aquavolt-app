/**
 * Seed initial admin user for Better-Auth.
 * Usage: npx tsx src/db/seed-auth.ts
 */
import "dotenv/config";
import { auth } from "@/lib/auth";

async function main() {
  const email = "admin@aquavolt.com";
  const password = "admin123";
  const name = "Admin";

  console.log(`Creating admin user: ${email}`);

  try {
    await auth.api.signUpEmail({
      body: { email, password, name },
    });
  } catch (e) {
    console.error("Failed:", e instanceof Error ? e.message : e);
    process.exit(1);
  }

  console.log("✓ Admin user created successfully");
  console.log(`  Email: ${email}`);
  console.log(`  Password: ${password}`);
  console.log("\nChange this password after first login!");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
