import { ProjectOptions } from '../prompts.js';

export interface Generator {
  generate(): Promise<void>;
}

export abstract class BaseGenerator implements Generator {
  protected options: ProjectOptions;

  constructor(options: ProjectOptions) {
    this.options = options;
  }

  abstract generate(): Promise<void>;
}

