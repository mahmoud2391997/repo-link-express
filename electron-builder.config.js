module.exports = {
  appId: "com.zone14.gaming-center",
  productName: "Zone 14 Gaming Center",
  directories: {
    output: "release",
    buildResources: "build"
  },
  files: [
    "dist/**/*",
    "main.cjs",
    "preload.cjs",
    "src/services/localDbService.js",
    "package.json",
    "!node_modules/{.cache,.vite,esbuild,typescript}/**/*",
    "node_modules/better-sqlite3/**/*",
    "node_modules/knex/**/*"
  ],
  extraResources: [
    {
      from: "node_modules/better-sqlite3/build/Release/better_sqlite3.node",
      to: "app.asar.unpacked/node_modules/better-sqlite3/build/Release/"
    }
  ],
  win: {
    target: [
      {
        target: "nsis",
        arch: ["x64"]
      }
    ],
    icon: "public/favicon.ico",
    publisherName: "Zone 14 Gaming Center",
    verifyUpdateCodeSignature: false
  },
  mac: {
    target: [
      {
        target: "dmg",
        arch: ["x64", "arm64"]
      }
    ],
    icon: "public/favicon.ico",
    category: "public.app-category.business"
  },
  linux: {
    target: [
      {
        target: "AppImage",
        arch: ["x64"]
      }
    ],
    icon: "public/favicon.ico",
    category: "Office"
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    allowElevation: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: "Zone 14 Gaming Center"
  },
  dmg: {
    title: "Zone 14 Gaming Center",
    icon: "public/favicon.ico"
  },
  compression: "maximum",
  removePackageScripts: true,
  nodeGypRebuild: false,
  buildDependenciesFromSource: false
};