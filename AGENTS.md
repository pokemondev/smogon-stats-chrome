# Project Guidelines

## Architecture

- This repository is a Chrome extension for Pokemon Showdown that reads battle data from the active tab and renders Smogon usage and set data in the popup.
- Treat `src/` and `data/` as the source of truth. Treat `build/` as generated output from webpack unless a task explicitly asks for changes there.
- Keep popup behavior in `src/app.ts`, content-script behavior in `src/showdownExtensions.ts`, and shared domain logic under `src/core/`.
- Preserve the current data flow: Showdown DOM parsing -> `BattleInfo`/models -> Smogon data lookup -> Handlebars rendering.

## Build And Validation

- Install dependencies with `npm install`.
- Use `npm run build` to rebuild the extension bundle. This runs webpack in watch mode.
- There is no test suite or linter configured in this workspace. Validate changes with the webpack build and by checking that manifest entry points still match generated files under `build/`.
- `npm run build-release` references `webpack.config.production.js`; verify that file exists before relying on the release build command.

## Code Style

- Match the existing TypeScript style in the file you are editing. The codebase uses PascalCase for classes and interfaces, camelCase for methods and functions, and straightforward imperative logic.
- Keep changes minimal and local. Do not refactor unrelated code or introduce new abstractions unless the task requires them.
- Maintain compatibility with the current TypeScript configuration, especially the `es5` target and existing webpack module resolution.
- Follow existing naming conventions around Pokemon and format handling, including current normalization helpers such as `FormatHelper` and template helpers.

## Conventions

- Keep Handlebars templates in `src/templates/` and helper modules in `src/templates/helpers/`.
- Preserve the current Chrome extension structure in `manifest.json` unless the task is explicitly a manifest migration.
- When changing data-loading logic, keep file paths and naming aligned with the JSON layout under `data/smogon-stats/` and `data/smogon-sets/`.
- Avoid editing generated vendor assets under `build/js/` and copied static assets under `build/css/` by hand unless the user explicitly asks for it.