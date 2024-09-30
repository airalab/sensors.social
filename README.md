# Open Map for Altruist Civil Station

This repository contains the source code for the interface of Robonomics Sensor Network and Altruist Civil Station. The interface is a map with sensors located according to their coordinates. Data is aggregated in real-time via IPFS pub-sub. To obtain a historical data summary, the [RoSeMAN](https://github.com/airalab/RoSeMAN) long-term storage module is used.

## Connect to Your Connectivity

You need to add your IPFS ID into `src/agents.json` if you have deployed your own [Sensors Connectivity module](https://github.com/airalab/sensors-connectivity/).

## Setup Your Map

To deploy your own instance of the map using GitHub Pages, start by forking the [repository](https://github.com/airalab/sensors.social) and cloning it. To enable GitHub Actions, go to the repository page, click on the `Actions` tab, and set up a workflow if you haven't done so already. To successfully deploy the map, you will need to modify certain files.

### Option 1: You don't have a domain

1. In `.github/workflows/main.yaml`, remove `cname: sensors.social`.

2. Add the following code right below `runs-on: ubuntu-latest` in `.github/workflows/main.yaml`:

```
permissions:
    contents: write
```

3. In `vite.config.js`, add `base: "/<repository_name>/"` to the `defineConfig` object just above the `plugins` section, replacing `<repository_name>` with the name of your fork (default will be `sensors.social`).


### Option 2: You have a domain

1. In `.github/workflows/main.yaml`, change `cname: sensors.social` to your `CNAME`.
2. Add the following code right below `runs-on: ubuntu-latest` in `.github/workflows/main.yaml`:

```
permissions:
    contents: write
```

### Manage GitHub Pages

After making modifications to the files, you can deploy your instance of the map by following these steps:

1. Commit and push the changes to your forked repository.
2. Wait until the actions have successfully completed.
3. Go to the `Pages` section of your repository `Settings`.
4. Enable GitHub Pages by selecting `Deploy from a branch` as the source.
5. Choose the `gh-pages` branch and the `root` folder.
6. Save the settings, and GitHub Pages will deploy your instance of the map.
7. Access it using the provided GitHub Pages URL.

> If you don't see the GitHub Pages URL, try reloading the page.


## Project setup

```
yarn install
```

### Compiles and hot-reloads for development

```
yarn dev
```

### Compiles and minifies for production

```
yarn build
```

### Lints and fixes files

```
yarn lint
```

### Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).
