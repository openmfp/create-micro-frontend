import inquirer from "inquirer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runPrompts } from "./prompts";

const promptMock = vi.hoisted(() => vi.fn());
const registerPromptMock = vi.hoisted(() => vi.fn());
const restoreDefaultPromptsMock = vi.hoisted(() => vi.fn());
const promptsMock = vi.hoisted(() => ({}));

vi.mock("inquirer", () => ({
  default: {
    prompt: promptMock,
    registerPrompt: registerPromptMock,
    restoreDefaultPrompts: restoreDefaultPromptsMock,
    prompts: promptsMock,
  },
  prompt: promptMock,
  registerPrompt: registerPromptMock,
  restoreDefaultPrompts: restoreDefaultPromptsMock,
  prompts: promptsMock,
}));

beforeEach(() => {
  promptMock.mockReset();
});

afterEach(() => {
  promptMock.mockReset();
});

describe("runPrompts", () => {
  it("returns defaults when yes flag provided", async () => {
    const result = await runPrompts({
      projectName: "app",
      framework: "angular",
      skipExample: false,
      yes: true,
    });

    expect(result).toEqual({
      projectName: "app",
      framework: "angular",
      includeExample: true,
    });
  });

  it("asks for missing fields and uses answers", async () => {
    promptMock.mockResolvedValue({
      projectName: "named-app",
      framework: "angular",
      includeExample: false,
    });

    const result = await runPrompts({
      projectName: undefined,
      framework: "angular",
      skipExample: false,
      yes: false,
    });

    expect(result).toEqual({
      projectName: "named-app",
      framework: "angular",
      includeExample: false,
    });
    expect(inquirer.prompt).toHaveBeenCalled();
  });

  it("forces includeExample to false when skipExample flag set", async () => {
    promptMock.mockResolvedValue({
      projectName: "skipped-app",
      framework: "angular",
    });

    const result = await runPrompts({
      projectName: undefined,
      framework: "angular",
      skipExample: true,
      yes: false,
    });

    expect(result).toEqual({
      projectName: "skipped-app",
      framework: "angular",
      includeExample: false,
    });
  });
});
