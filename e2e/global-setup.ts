import { config as loadEnv } from "dotenv";
import path from "node:path";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });

const testPort = process.env.PLAYWRIGHT_PORT ?? "3010";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${testPort}`;
const secret = process.env.E2E_TEST_SECRET ?? "local-e2e-secret";

export default async function globalSetup() {
  try {
    const response = await fetch(`${baseURL}/api/e2e/sign-in`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-e2e-secret": secret,
      },
      body: JSON.stringify({ email: "e2e-preflight@fshdesign.local" }),
    });

    const body = await response.text();

    if (response.status === 403 && body.includes("E2E sign-in disabled")) {
      throw new Error(
        [
          "E2E sign-in is disabled on the dev server.",
          "Add E2E_TEST_SECRET to .env.local and restart `npm run dev`, then rerun tests.",
        ].join(" "),
      );
    }

    if (response.status === 404 && body.includes("User not found")) {
      return;
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("E2E sign-in is disabled")) {
      throw error;
    }

    throw new Error(
      `Cannot reach ${baseURL}. Start the app with \`npm run dev\` before running Playwright tests.`,
    );
  }
}
