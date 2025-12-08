import { Command } from "commander";

export interface CliOptions {
  projectName?: string;
  framework: string;
  skipExample: boolean;
  yes: boolean;
}

export function parseCliArgs(program: Command): CliOptions {
  program
    .name("create-micro-frontend")
    .description("CLI tool to scaffold micro frontend projects for portal integration")
    .version("1.0.0")
    .argument("[project-name]", "Name of the micro frontend project", "my-micro-frontend")
    .option(
      "-f, --framework <framework>",
      "Framework to use (angular, react, vue)",
      "angular"
    )
    .option("--skip-example", "Skip creating the example page", false)
    .option("-y, --yes", "Skip all prompts and use default values", false)
    .parse(process.argv);

  const args = program.args;
  const opts = program.opts();

  return {
    projectName: args[0],
    framework: opts.framework,
    skipExample: opts.skipExample,
    yes: opts.yes,
  };
}
