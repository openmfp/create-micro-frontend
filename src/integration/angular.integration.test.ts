import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { afterAll, describe, expect, it } from "vitest";
import { AngularGenerator } from "../generators/angular";
import { ProjectOptions } from "../prompts";

type CommandResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), "create-micro-frontend-it-"));

function extractConflictDetails(output: string): string[] {
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) =>
      /(ERESOLVE|Could not resolve dependency|Conflicting peer dependency|peer dep|while resolving|Found: |node_modules\/)/i.test(
        line
      )
    )
    .slice(0, 30);
}

function formatFailure(params: {
  step: string;
  command: string;
  args: string[];
  cwd: string;
  result: CommandResult;
  generatorDependencies: Record<string, string>;
  generatorDevDependencies: Record<string, string>;
}): string {
  const joinedOutput = `${params.result.stdout}\n${params.result.stderr}`;
  const conflicts = extractConflictDetails(joinedOutput);

  return [
    `Integration step failed: ${params.step}`,
    `Command: ${params.command} ${params.args.join(" ")}`,
    `Working directory: ${params.cwd}`,
    `Exit code: ${params.result.exitCode}`,
    `Generator dependencies: ${JSON.stringify(params.generatorDependencies)}`,
    `Generator devDependencies: ${JSON.stringify(params.generatorDevDependencies)}`,
    "Captured stdout:",
    params.result.stdout || "<empty>",
    "Captured stderr:",
    params.result.stderr || "<empty>",
    conflicts.length > 0 ? "Detected npm conflict lines:" : "Detected npm conflict lines: <none>",
    conflicts.length > 0 ? conflicts.join("\n") : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function runCommand(command: string, args: string[], cwd: string): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: "pipe" });
    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (exitCode) => {
      resolve({
        exitCode: exitCode ?? -1,
        stdout,
        stderr,
      });
    });
  });
}

describe("Angular generator integration", () => {
  afterAll(() => {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  });

  it(
    "creates a buildable project artifact",
    async () => {
      const projectName = `angular-it-${Date.now()}`;
      const options: ProjectOptions = {
        projectName,
        framework: "angular",
        includeExample: false,
      };

      const generatorManifestPath = path.join(__dirname, "..", "generators", "angular", "package.json");
      const generatorManifest = JSON.parse(fs.readFileSync(generatorManifestPath, "utf-8")) as {
        dependencies: Record<string, string>;
        devDependencies: Record<string, string>;
      };

      const generator = new AngularGenerator(options, { cwd: outputRoot });
      try {
        await generator.generate();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown generator failure during generate step";
        throw new Error(
          [
            "Integration step failed: generate",
            "Command: AngularGenerator.generate()",
            `Working directory: ${outputRoot}`,
            `Generator dependencies: ${JSON.stringify(generatorManifest.dependencies)}`,
            `Generator devDependencies: ${JSON.stringify(generatorManifest.devDependencies)}`,
            "Captured error:",
            message,
          ].join("\n")
        );
      }

      const generatedProjectPath = path.join(outputRoot, projectName);
      expect(fs.existsSync(generatedProjectPath)).toBe(true);
      expect(fs.existsSync(path.join(generatedProjectPath, "package.json"))).toBe(true);

      const installResult = await runCommand("npm", ["install"], generatedProjectPath);
      if (installResult.exitCode !== 0) {
        throw new Error(
          formatFailure({
            step: "install",
            command: "npm",
            args: ["install"],
            cwd: generatedProjectPath,
            result: installResult,
            generatorDependencies: generatorManifest.dependencies,
            generatorDevDependencies: generatorManifest.devDependencies,
          })
        );
      }

      const buildResult = await runCommand("npm", ["run", "build"], generatedProjectPath);
      if (buildResult.exitCode !== 0) {
        throw new Error(
          formatFailure({
            step: "build",
            command: "npm",
            args: ["run", "build"],
            cwd: generatedProjectPath,
            result: buildResult,
            generatorDependencies: generatorManifest.dependencies,
            generatorDevDependencies: generatorManifest.devDependencies,
          })
        );
      }

      expect(fs.existsSync(path.join(generatedProjectPath, "dist"))).toBe(true);
    },
    600000
  );
});
