# Smogon Stats - Chrome Extension ![Smogon Stats](https://cdn.discordapp.com/avatars/610945850557988894/2680da85a519a5d856e7a90cc449ef4e.png?size=64 "Smogon Stats")
[![Join to the community at https://discord.com/invite/BM7ZRNB](https://img.shields.io/badge/Discord-Join%20the%20community-blueviolet?logo=discord)](https://discord.com/invite/BM7ZRNB)

[Join Smogon Stats Support Server](https://discord.com/invite/BM7ZRNB) to try out the bot and talk to the devs!

## Overview
Chrome Extension to help Pokemon Showdown players with Smogon usage statistics.

It automatically gets opponent's team and display usage data from PokemonShowdown.

### Get it on Chrome Store:
[![Chrome Store pic](res/smogon-stats-chrome-store-pic.png)](https://chrome.google.com/webstore/detail/smogon-stats/fcgfhfnffkjocaebpeakjojffnccglfp)

### Explore oppoments team usage stats
![Demo](res/smogon-stats-chrome-demo.gif)

## Features
* Pending...

## Development

### Requirements

* Node.js 18.20 or newer
* npm
* Google Chrome or another Chromium-based browser for loading the unpacked extension

### Install

```bash
npm install
```

### Build

```bash
npm run build
```

Builds the extension into the `build/` folder using the shared webpack configuration in development mode.

### Watch

```bash
npm run build:watch
```

Rebuilds the extension bundle when files change.

### Production Build

```bash
npm run build:prod
```

For compatibility with earlier automation, `npm run build-release` remains available and delegates to the production build.

### Type Check

```bash
npm run typecheck
```

Runs the TypeScript compiler without emitting files.

### Load The Extension

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Choose Load unpacked.
4. Select the repository root folder.

The manifest points at the generated files under `build/`, so rebuild after source changes before reloading the extension.

