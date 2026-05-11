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

## Support

For questions and support, please open an issue on the GitHub repository.

## About this project

create-micro-frontend is part of the open-source initiative under the [NeoNephos](https://neonephos.eu/) project of the [Linux Foundation Europe](https://linuxfoundation.eu/).

<p align="center"><img alt="Bundesministerium für Wirtschaft und Energie (BMWE)-EU funding logo" src="https://apeirora.eu/assets/img/BMWK-EU.png" width="400"/></p>
