# Create open sensors networks without centralization problems

Decentralized Open Sensors Map. Don't forget to your IFPS ID into `src/agents.json` in case you set up your own [Sensors Connectivity module](https://github.com/airalab/sensors-connectivity/tree/master).

## Setup your own Map

To deploy your own instance of the map using GitHub Pages, start by forking the [repository](https://github.com/airalab/sensors.robonomics.network)/ and clone it. To successfully deploy the map, you will need to modify certain files:

### Option 1: you don't have CNAME

1. In `.github/workflows/main.yaml` remove `cname: sensors.robonomics.network`.
2.  Add the following code right below `runs-on: ubuntu-latest` in `.github/workflows/main.yaml`: 
```
permissions: 
    contents: write
```
3. In `vite.config.js` add `base: "/<repository name>/",` to the `defineConfig` object just above the `plugins` section , replacing `<repository_name>` with the name of your fork (default will be `sensors.robonomics.network`)

### Option 2: you have CNAME

1. In `.github/workflows/main.yaml` change `cname: sensors.robonomics.network` to your `CNAME`.
2.  Add the following code right below `runs-on: ubuntu-latest` in `.github/workflows/main.yaml`: 
```
permissions: 
    contents: write
```

After making modifications to the files, you can deploy your instance of the map by following these steps:

1. Commit and push the changes to your forked repository. 
2. Go to the `Pages` section of your repository settings.
3. Enable GitHub Pages by selecting `Deploy from a branch` as the source
4. Choose the `gh-pages` branch and the `root` folder.
4. Save the settings, and GitHub Pages will deploy your instance of the map. 
5. Access it using the provided GitHub Pages URL. 

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
