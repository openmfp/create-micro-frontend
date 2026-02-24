import path from "path";
import fs from "fs";
import os from "os";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AngularGenerator } from ".";
import { ProjectOptions } from "../../prompts";

const baseOptions: ProjectOptions = {
  projectName: "test-mfe",
  framework: "angular",
  includeExample: false,
};

const manifestPath = path.join(__dirname, "package.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as {
  dependencies: Record<string, string>;
};

describe("AngularGenerator", () => {
  let generator: AngularGenerator;

  beforeEach(() => {
    generator = new AngularGenerator(baseOptions);
  });

  it("installs base and Luigi/UI5 dependencies", async () => {
    const instance = generator as unknown as Record<string, any>;
    instance.runCommand = vi.fn().mockResolvedValue(undefined);

    await instance.installDependencies();

    const projectPath = path.join(process.cwd(), baseOptions.projectName);

    expect(instance.runCommand).toHaveBeenNthCalledWith(
      1,
      "npm",
      ["install"],
      projectPath
    );
    expect(instance.runCommand).toHaveBeenNthCalledWith(
      2,
      "npm",
      [
        "install",
        ...Object.entries(manifest.dependencies).map(([name, version]) => `${name}@${version}`),
      ],
      projectPath
    );
  });

  it("runs generation steps without example", async () => {
    const calls: string[] = [];
    const instance = generator as unknown as Record<string, any>;

    instance.createAngularProject = vi.fn(async () => calls.push("create"));
    instance.updateAngularConfigurations = vi.fn(async () => calls.push("updateAngularConfigurations"));
    instance.installDependencies = vi.fn(async () => calls.push("install"));
    instance.copyTemplateFiles = vi.fn(async () => calls.push("copyTemplates"));
    instance.copyExampleFiles = vi.fn(async () => calls.push("copyExample"));
    instance.finalizeProject = vi.fn(async () => calls.push("finalize"));

    await generator.generate();

    expect(calls).toEqual(["create", "updateAngularConfigurations", "install", "copyTemplates", "finalize"]);
    expect(instance.copyExampleFiles).not.toHaveBeenCalled();
  });

  it("runs generation steps with example", async () => {
    const generatorWithExample = new AngularGenerator({
      ...baseOptions,
      includeExample: true,
    });
    const calls: string[] = [];
    const instance = generatorWithExample as unknown as Record<string, any>;

    instance.createAngularProject = vi.fn(async () => calls.push("create"));
    instance.updateAngularConfigurations = vi.fn(async () => calls.push("updateAngularConfigurations"));
    instance.installDependencies = vi.fn(async () => calls.push("install"));
    instance.copyTemplateFiles = vi.fn(async () => calls.push("copyTemplates"));
    instance.copyExampleFiles = vi.fn(async () => calls.push("copyExample"));
    instance.finalizeProject = vi.fn(async () => calls.push("finalize"));

    await generatorWithExample.generate();

    expect(calls).toEqual([
      "create",
      "updateAngularConfigurations",
      "install",
      "copyTemplates",
      "copyExample",
      "finalize",
    ]);
  });

  it("updates existing initial production budget limits", async () => {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "angular-budget-update-"));
    const angularConfigPath = path.join(tmpRoot, "angular.json");
    const instance = generator as unknown as {
      projectPath: string;
      updateAngularConfigurations: () => Promise<void>;
    };
    instance.projectPath = tmpRoot;

    const config = {
      projects: {
        [baseOptions.projectName]: {
          targets: {
            build: {
              configurations: {
                production: {
                  budgets: [
                    { type: "initial", maximumWarning: "500kb", maximumError: "1mb" },
                    { type: "anyComponentStyle", maximumWarning: "5kb", maximumError: "10kb" },
                  ],
                },
              },
            },
          },
        },
      },
    };
    fs.writeFileSync(angularConfigPath, JSON.stringify(config, null, 2));

    try {
      await instance.updateAngularConfigurations();
      const updatedConfig = JSON.parse(fs.readFileSync(angularConfigPath, "utf-8")) as {
        projects: Record<string, { targets: { build: { configurations: { production: { budgets: Array<Record<string, string>> } } } } }>;
      };

      const budgets =
        updatedConfig.projects[baseOptions.projectName].targets.build.configurations.production.budgets;
      expect(budgets.find((budget) => budget.type === "initial")).toEqual({
        type: "initial",
        maximumWarning: "2mb",
        maximumError: "5mb",
      });
      expect(budgets.find((budget) => budget.type === "anyComponentStyle")).toEqual({
        type: "anyComponentStyle",
        maximumWarning: "5kb",
        maximumError: "10kb",
      });
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  });

  it("adds initial production budget limits when missing", async () => {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "angular-budget-add-"));
    const angularConfigPath = path.join(tmpRoot, "angular.json");
    const instance = generator as unknown as {
      projectPath: string;
      updateAngularConfigurations: () => Promise<void>;
    };
    instance.projectPath = tmpRoot;

    const config = {
      projects: {
        [baseOptions.projectName]: {
          architect: {
            build: {
              configurations: {
                production: {
                  budgets: [{ type: "anyScript", maximumWarning: "500kb", maximumError: "1mb" }],
                },
              },
            },
          },
        },
      },
    };
    fs.writeFileSync(angularConfigPath, JSON.stringify(config, null, 2));

    try {
      await instance.updateAngularConfigurations();
      const updatedConfig = JSON.parse(fs.readFileSync(angularConfigPath, "utf-8")) as {
        projects: Record<string, { architect: { build: { configurations: { production: { budgets: Array<Record<string, string>> } } } } }>;
      };
      const budgets =
        updatedConfig.projects[baseOptions.projectName].architect.build.configurations.production.budgets;

      expect(budgets.find((budget) => budget.type === "anyScript")).toEqual({
        type: "anyScript",
        maximumWarning: "500kb",
        maximumError: "1mb",
      });
      expect(budgets.find((budget) => budget.type === "initial")).toEqual({
        type: "initial",
        maximumWarning: "2mb",
        maximumError: "5mb",
      });
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  });

  it("copies the correct template set without example", async () => {
    const instance = generator as unknown as Record<string, any>;
    const copyDirectory = vi.fn();
    const copyFile = vi.fn();

    instance.copyDirectory = copyDirectory;
    instance.copyFile = copyFile;

    await instance.copyTemplateFiles();

    const templatesPath = path.join(__dirname, "templates");
    const projectPath = path.join(process.cwd(), baseOptions.projectName);

    expect(copyDirectory).toHaveBeenCalledWith(
      path.join(templatesPath, "src"),
      path.join(projectPath, "src"),
      ["example-page", "app-component-with-example", "app-component-no-example"]
    );

    expect(copyFile).toHaveBeenCalledWith(
      path.join(templatesPath, "public", "content-configuration.json"),
      path.join(projectPath, "public")
    );

    expect(copyDirectory).toHaveBeenCalledWith(
      path.join(templatesPath, "src", "app", "app-component-no-example"),
      path.join(projectPath, "src", "app"),
      []
    );
  });

  it("copies the example variant when requested", async () => {
    const generatorWithExample = new AngularGenerator({
      ...baseOptions,
      includeExample: true,
    });
    const instance = generatorWithExample as unknown as Record<string, any>;
    const copyDirectory = vi.fn();
    const copyFile = vi.fn();

    instance.copyDirectory = copyDirectory;
    instance.copyFile = copyFile;

    await instance.copyTemplateFiles();

    const templatesPath = path.join(__dirname, "templates");
    const projectPath = path.join(process.cwd(), baseOptions.projectName);

    expect(copyDirectory).toHaveBeenCalledWith(
      path.join(templatesPath, "src", "app", "app-component-with-example"),
      path.join(projectPath, "src", "app"),
      []
    );

    expect(copyFile).toHaveBeenCalledWith(
      path.join(templatesPath, "public", "content-configuration.json"),
      path.join(projectPath, "public")
    );
  });
});
