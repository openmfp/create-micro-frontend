import { spawn } from "child_process";
import * as fs from "fs";
import ora from "ora";
import * as path from "path";
import { ProjectOptions } from "../../prompts";
import { logger } from "../../utils/logger";
import { BaseGenerator } from "../base";

export class AngularGenerator extends BaseGenerator {
  private projectPath: string;
  private templatesPath: string;

  constructor(options: ProjectOptions) {
    super(options);
    this.projectPath = path.join(process.cwd(), options.projectName);
    this.templatesPath = path.join(__dirname, "templates");
  }

  async generate(): Promise<void> {
    const totalSteps = this.options.includeExample ? 5 : 4;
    let currentStep = 1;

    logger.step(currentStep++, totalSteps, "Creating Angular project...");
    await this.createAngularProject();

    logger.step(currentStep++, totalSteps, "Installing dependencies...");
    await this.installDependencies();

    logger.step(currentStep++, totalSteps, "Configuring project...");
    await this.copyTemplateFiles();

    if (this.options.includeExample) {
      logger.step(currentStep++, totalSteps, "Creating example Object Page...");
      await this.copyExampleFiles();
    }

    logger.step(currentStep, totalSteps, "Finalizing project...");
    await this.finalizeProject();
  }

  private runCommand(command: string, args: string[], cwd?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const fullCommand = [command, ...args].join(" ");
      const proc = spawn(fullCommand, [], {
        cwd,
        stdio: "pipe",
        shell: true,
      });

      let stderr = "";
      proc.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      proc.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(stderr || `Command failed with code ${code}`));
        }
      });

      proc.on("error", reject);
    });
  }

  private async createAngularProject(): Promise<void> {
    const spinner = ora("Running ng new...").start();

    try {
      await this.runCommand("npx", [
        "@angular/cli@20",
        "new",
        this.options.projectName,
        "--style=scss",
        "--routing=false",
        "--skip-git",
        "--skip-install",
        "--standalone",
      ]);

      spinner.succeed("Angular project created");
    } catch (error) {
      spinner.fail("Failed to create Angular project");
      throw error;
    }
  }

  private async installDependencies(): Promise<void> {
    const spinner = ora("Installing npm packages...").start();

    try {
      await this.runCommand("npm", ["install"], this.projectPath);

      await this.runCommand(
        "npm",
        [
          "install",
          "@luigi-project/client",
          "@luigi-project/client-support-angular@20",
          "@ui5/webcomponents-ngx",
        ],
        this.projectPath
      );

      spinner.succeed("Dependencies installed");
    } catch (error) {
      spinner.fail("Failed to install dependencies");
      throw error;
    }
  }

  private async copyTemplateFiles(): Promise<void> {
    const spinner = ora("Copying template files...").start();

    try {
      const skipDirs = [
        "object-page",
        "app-component-with-example",
        "app-component-no-example",
      ];

      this.copyDirectory(
        path.join(this.templatesPath, "src"),
        path.join(this.projectPath, "src"),
        skipDirs
      );

      this.copyFile(
        path.join(this.templatesPath, "public", "content-configuration.json"),
        path.join(this.projectPath, "public")
      );

      const appVariantFolder = this.options.includeExample
        ? "app-component-with-example"
        : "app-component-no-example";

      this.copyDirectory(
        path.join(this.templatesPath, "src", "app", appVariantFolder),
        path.join(this.projectPath, "src", "app"),
        []
      );

      spinner.succeed("Project configured");
    } catch (error) {
      spinner.fail("Failed to configure project");
      throw error;
    }
  }

  private async copyExampleFiles(): Promise<void> {
    const spinner = ora("Creating Object Page example...").start();

    try {
      this.copyDirectory(
        path.join(this.templatesPath, "src", "app", "object-page"),
        path.join(this.projectPath, "src", "app", "object-page"),
        []
      );

      spinner.succeed("Example Object Page created");
    } catch (error) {
      spinner.fail("Failed to create example page");
      throw error;
    }
  }

  private copyDirectory(source: string, destination: string, skipDirs: string[]): void {
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
    }

    const items = fs.readdirSync(source);

    for (const item of items) {
      const sourcePath = path.join(source, item);
      const stat = fs.statSync(sourcePath);

      if (stat.isDirectory()) {
        if (skipDirs.includes(item)) {
          continue;
        }
        this.copyDirectory(sourcePath, path.join(destination, item), skipDirs);
      } else {
        this.copyFile(sourcePath, destination);
      }
    }
  }

  private copyFile(sourcePath: string, destDir: string): void {
    const fileName = path.basename(sourcePath);
    const destPath = path.join(destDir, fileName);
    let content = fs.readFileSync(sourcePath, "utf-8");
    content = this.processTemplateVariables(content);
    fs.writeFileSync(destPath, content);
  }

  private processTemplateVariables(content: string): string {
    return content.replace(/__PROJECT_NAME__/g, this.options.projectName);
  }

  private async finalizeProject(): Promise<void> {
    const filesToRemove = [
      path.join(this.projectPath, "src", "app", "app.component.spec.ts"),
      path.join(this.projectPath, "src", "app", "app.component.scss"),
      path.join(this.projectPath, "src", "app", "app.component.html"),
      path.join(this.projectPath, "src", "app", "app.ts"),
      path.join(this.projectPath, "src", "app", "app.html"),
      path.join(this.projectPath, "src", "app", "app.scss"),
      path.join(this.projectPath, "src", "app", "app.spec.ts"),
    ];

    for (const file of filesToRemove) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    }
  }
}
