#!/usr/bin/env node

import { program } from "commander";
import { parseCliArgs } from "./cli";
import { AngularGenerator } from "./generators/angular";
import { runPrompts } from "./prompts";
import { logger } from "./utils/logger";

async function main() {
  const cliOptions = parseCliArgs(program);

  const options = await runPrompts(cliOptions);

  logger.info(`Creating micro frontend: ${options.projectName}`);
  logger.info(`Framework: ${options.framework}`);
  logger.info(`Include example: ${options.includeExample}`);

  if (options.framework === "angular") {
    const generator = new AngularGenerator(options);
    await generator.generate();
  } else {
    logger.error(
      `Framework "${options.framework}" is not yet supported. Currently only "angular" is available.`
    );
    process.exit(1);
  }

  logger.success(`\nMicro frontend "${options.projectName}" created successfully!`);
  logger.info(`\nNext steps:`);
  logger.info(`  cd ${options.projectName}`);
  logger.info(`  npm start`);
}

main().catch((error) => {
  logger.error(error.message);
  process.exit(1);
});
