import { ProjectOptions } from '../prompts';

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

