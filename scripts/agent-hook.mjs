import { execSync } from "node:child_process";
import fs from "node:fs";

async function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => {
      resolve(data);
    });
    if (process.stdin.isTTY) {
      resolve("");
    }
  });
}

async function main() {
  const mode = process.argv[2] ?? "post-edit";
  const rawInput = await readStdin();
  let payload = {};
  if (rawInput.trim()) {
    try {
      payload = JSON.parse(rawInput);
    } catch {
      // Non-JSON input
    }
  }

  if (mode === "post-edit") {
    // Run fast formatter/linter on changed file only
    const filePath =
      payload.tool_input?.file_path ||
      payload.arguments?.filePath ||
      payload.arguments?.path ||
      process.argv[3];
    if (filePath && fs.existsSync(filePath)) {
      try {
        execSync(`bunx biome check --write "${filePath}"`, {
          stdio: "inherit",
          timeout: 5000,
        });
      } catch {
        // Do not block agent on formatting warnings
      }
    }
    process.exit(0);
  }

  if (mode === "stop") {
    // Anti-loop safeguard: check harness flag and local marker
    const markerFile = ".git/agent-hook-stop-blocked";
    if (payload.stop_hook_active === true || fs.existsSync(markerFile)) {
      if (fs.existsSync(markerFile)) {
        try {
          fs.unlinkSync(markerFile);
        } catch {}
      }
      process.exit(0);
    }

    try {
      execSync("bun run check", { stdio: "inherit", timeout: 120000 });
      if (fs.existsSync(markerFile)) {
        try {
          fs.unlinkSync(markerFile);
        } catch {}
      }
      process.exit(0);
    } catch (_err) {
      // Create marker to prevent consecutive block loop
      try {
        fs.writeFileSync(markerFile, Date.now().toString());
      } catch {}

      const msg = "Verification check failed. Fix errors before finishing turn.";
      console.error(msg);
      process.stdout.write(`${JSON.stringify({ decision: "block", reason: msg })}\n`);
      process.exit(2);
    }
  }
}

main().catch(() => process.exit(0));
