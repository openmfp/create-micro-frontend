# @openmfp/create-micro-frontend

CLI for quickly scaffolding a micro frontend ready for OpenMFP Portal integration (Luigi + UI5 Web Components). 

## Overview

`create-micro-frontend` generates an app with:
- Choosen framework starting files
- Preinstalled `@luigi-project/client` and `@ui5/webcomponents`
- Ready-to-use Luigi content configuration
- Optional demo Object Page built with UI5 components

## Frameworks and libs

- Angular (available): full template, Luigi context wiring, UI5 Web Components, optional demo Object Page.
- React (planned): will provide Luigi wiring and UI5 component setup once released.
- Vue (planned): will provide Luigi wiring and UI5 component setup once released.

## Prerequisites

- Node.js ≥ 20.0.0
- npm ≥ 10 (11 recommended)

## Installation & Usage

Run with interactive defaults:

```bash
npx create-micro-frontend
```

Set a project name:

```bash
npx create-micro-frontend my-mfe
```

## CLI Flags

- `-f, --framework <angular|react|vue>` — only Angular is supported today; React/Vue are planned
- `--skip-example` — omit the demo Object Page
- `-y, --yes` — skip prompts and use defaults

## Troubleshooting

- Target directory exists: choose another name or remove the folder.
- Dependency install failed: run manually:
  ```bash
  cd my-mf
  npm install
  ```
- Angular CLI missing / npx timeout: ensure `npx` and network access; run `npm cache verify` if needed and retry.

## Testing

- Run all tests: `npm test`
- Run unit tests only: `npm run test:unit`
- Run integration tests only: `npm run test:integration`

## Repository

- GitHub: https://github.com/openmfp/create-micro-frontend
- npm: https://www.npmjs.com/package/@openmfp/create-micro-frontend

## Contributing

Please refer to the [CONTRIBUTING](CONTRIBUTING.md) file in this repository for instructions on how to contribute to openMFP.

## Code of Conduct

Please refer to the [CODE_OF_CONDUCT.md](https://github.com/openmfp/create-portal?tab=coc-ov-file) of NeoNephos for information on the expected Code of Conduct for contributing to openMFP.

## Licensing

Please see our [LICENSE](https://github.com/openmfp/create-portal?tab=Apache-2.0-1-ov-file) for copyright and license information. Detailed information including third-party components and their licensing/copyright information is available [via the REUSE tool](https://api.reuse.software/info/github.com/openmfp/create-portal).

## Support

For questions and support, please open an issue on the GitHub repository.
