import { spawn } from "child_process";
import * as fs from "fs";
import ora from "ora";
import * as path from "path";
import { ProjectOptions } from "../../prompts";
import { logger } from "../../utils/logger";
import { BaseGenerator } from "../base";

type DependencyMap = Record<string, string>;

interface GeneratorManifest {
  dependencies: DependencyMap;
  devDependencies: DependencyMap;
}

interface AngularGeneratorRuntimeOptions {
  cwd?: string;
}

export class AngularGenerator extends BaseGenerator {
  private projectPath: string;
  private templatesPath: string;
  private readonly manifest: GeneratorManifest;
  private readonly budgetMaximumWarning = "2mb";
  private readonly budgetMaximumError = "5mb";

  constructor(options: ProjectOptions, runtimeOptions: AngularGeneratorRuntimeOptions = {}) {
    super(options);
    const basePath = runtimeOptions.cwd ?? process.cwd();
    this.projectPath = path.join(basePath, options.projectName);
    this.templatesPath = path.join(__dirname, "templates");
    this.manifest = this.readGeneratorManifest();
  }

  async generate(): Promise<void> {
    const totalSteps = this.options.includeExample ? 6 : 5;
    let currentStep = 1;

    logger.step(currentStep++, totalSteps, "Creating Angular project...");
    await this.createAngularProject();

    logger.step(currentStep++, totalSteps, "Updating Angular build budgets...");
    await this.updateAngularConfigurations();

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
      const proc = spawn(command, args, {
        cwd,
        stdio: "pipe",
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
      const angularCliPackage = this.getAngularCliPackage();
      await this.runCommand("npx", [
        angularCliPackage,
        "new",
        this.options.projectName,
        "--style=scss",
        "--routing=false",
        "--skip-git",
        "--skip-install",
        "--standalone",
      ], path.dirname(this.projectPath));

      spinner.succeed("Angular project created");
    } catch (error) {
      spinner.fail("Failed to create Angular project");
      throw error;
    }
  }

  private async updateAngularConfigurations(): Promise<void> {
    const spinner = ora("Updating Angular configurations...").start();
    const angularConfigPath = path.join(this.projectPath, "angular.json");

    try {
      const rawConfig = fs.readFileSync(angularConfigPath, "utf-8");
      const parsedConfig = JSON.parse(rawConfig) as { projects?: Record<string, unknown> };

      const projects = parsedConfig.projects;
      if (!this.isObjectRecord(projects)) {
        throw new Error("Invalid Angular workspace configuration: missing projects");
      }

      const namedProject = projects[this.options.projectName];
      const fallbackProject = Object.values(projects).find((project) => this.isObjectRecord(project));
      const projectConfig = this.isObjectRecord(namedProject) ? namedProject : fallbackProject;
      if (!projectConfig) {
        throw new Error("Invalid Angular workspace configuration: missing project entry");
      }

      const targetsConfig = this.isObjectRecord(projectConfig.targets)
        ? projectConfig.targets
        : this.isObjectRecord(projectConfig.architect)
          ? projectConfig.architect
          : undefined;
      if (!targetsConfig) {
        throw new Error("Invalid Angular workspace configuration: missing targets/architect");
      }

      const buildTarget = targetsConfig.build;
      if (!this.isObjectRecord(buildTarget)) {
        throw new Error("Invalid Angular workspace configuration: missing build target");
      }

      const configurations = buildTarget.configurations;
      if (!this.isObjectRecord(configurations)) {
        throw new Error("Invalid Angular workspace configuration: missing build configurations");
      }

      const productionConfig = configurations.production;
      if (!this.isObjectRecord(productionConfig)) {
        throw new Error("Invalid Angular workspace configuration: missing production configuration");
      }

      const budgets = Array.isArray(productionConfig.budgets) ? [...productionConfig.budgets] : [];
      const initialBudget = budgets.find(
        (budget): budget is Record<string, unknown> =>
          this.isObjectRecord(budget) && budget.type === "initial"
      );

      if (initialBudget) {
        initialBudget.maximumWarning = this.budgetMaximumWarning;
        initialBudget.maximumError = this.budgetMaximumError;
      } else {
        budgets.push({
          type: "initial",
          maximumWarning: this.budgetMaximumWarning,
          maximumError: this.budgetMaximumError,
        });
      }

      productionConfig.budgets = budgets;
      fs.writeFileSync(angularConfigPath, `${JSON.stringify(parsedConfig, null, 2)}\n`);
      spinner.succeed("Angular build budgets updated");
    } catch (error) {
      spinner.fail("Failed to update Angular build budgets");
      throw error;
    }
  }

  private isObjectRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  private async installDependencies(): Promise<void> {
    const spinner = ora("Installing npm packages...").start();

    try {
      const generatorDependencies = this.getInstallableDependencies();
      await this.runCommand("npm", ["install"], this.projectPath);

      await this.runCommand("npm", ["install", ...generatorDependencies], this.projectPath);

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
        "example-page",
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
        path.join(this.templatesPath, "src", "app", "example-page"),
        path.join(this.projectPath, "src", "app", "example-page"),
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

  private readGeneratorManifest(): GeneratorManifest {
    const manifestPath = path.join(__dirname, "package.json");
    const rawManifest = fs.readFileSync(manifestPath, "utf-8");
    const parsedManifest = JSON.parse(rawManifest) as Partial<GeneratorManifest>;

    if (!parsedManifest.dependencies || !parsedManifest.devDependencies) {
      throw new Error(`Invalid generator manifest at ${manifestPath}`);
    }

    return {
      dependencies: parsedManifest.dependencies,
      devDependencies: parsedManifest.devDependencies,
    };
  }

  private getAngularCliPackage(): string {
    const cliVersion = this.manifest.devDependencies["@angular/cli"];

    if (!cliVersion) {
      throw new Error("Missing @angular/cli version in generator manifest");
    }

    return `@angular/cli@${cliVersion}`;
  }

  private getInstallableDependencies(): string[] {
    const entries = Object.entries(this.manifest.dependencies);

    if (entries.length === 0) {
      throw new Error("No dependencies declared in generator manifest");
    }

    return entries.map(([name, version]) => `${name}@${version}`);
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
