import { execSync } from "child_process";

try {
  const result = execSync(
    'npx @biomejs/biome check --write "apps/web/src/app/(public)/(landing)/_components/*.tsx"',
    { cwd: "/vercel/share/v0-project", encoding: "utf-8", stdio: "pipe" }
  );
  console.log(result);
} catch (e) {
  console.log("STDOUT:", e.stdout);
  console.log("STDERR:", e.stderr);
  console.log("Exit code:", e.status);
}
