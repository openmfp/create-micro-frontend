import inquirer, { DistinctQuestion } from 'inquirer';
import { CliOptions } from './cli';

export interface ProjectOptions {
  projectName: string;
  framework: string;
  includeExample: boolean;
}

export async function runPrompts(cliOptions: CliOptions): Promise<ProjectOptions> {
  if (cliOptions.yes) {
    return {
      projectName: cliOptions.projectName || "my-micro-frontend",
      framework: cliOptions.framework,
      includeExample: !cliOptions.skipExample,
    };
  }

  const questions: DistinctQuestion[] = [];

  if (!cliOptions.projectName) {
    questions.push({
      type: "input",
      name: "projectName",
      message: "What is the name of your micro frontend?",
      default: "my-micro-frontend",
      validate: (input: string) => {
        if (/^[a-z][a-z0-9-]*$/.test(input)) {
          return true;
        }
        return "Project name must start with a letter and contain only lowercase letters, numbers, and hyphens";
      },
    });
  }

  questions.push({
    type: "select",
    name: "framework",
    message: "Which framework would you like to use?",
    choices: [
      { name: "Angular (recommended)", value: "angular" },
      { name: "React (coming soon)", value: "react", disabled: true },
      { name: "Vue (coming soon)", value: "vue", disabled: true },
    ],
    default: cliOptions.framework,
  });

  if (!cliOptions.skipExample) {
    questions.push({
      type: "confirm",
      name: "includeExample",
      message: "Would you like to include an example Object Page?",
      default: true,
    });
  }

  const answers = await inquirer.prompt(questions);

  return {
    projectName: cliOptions.projectName || answers.projectName,
    framework: answers.framework || cliOptions.framework,
    includeExample: cliOptions.skipExample ? false : answers.includeExample ?? true,
  };
}
