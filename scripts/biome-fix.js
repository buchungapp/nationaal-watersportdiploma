import { execSync } from "child_process";

try {
  const result = execSync("cd /vercel/share/v0-project && npx @biomejs/biome check ./apps/web/src/app/\\(public\\)/\\(landing\\)/ --write 2>&1", {
    encoding: "utf-8",
    timeout: 30000,
  });
  console.log(result);
} catch (e) {
  console.log("STDOUT:", e.stdout);
  console.log("STDERR:", e.stderr);
  console.log("Exit code:", e.status);
}
