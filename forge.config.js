const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const path = require('path');

module.exports = {
  packagerConfig: {
    asar: true,
    icon: './icon', // Electron irá procurar por icon.ico no Windows automaticamente
    name: 'Google Keep Desktop',
    executableName: 'google-keep-desktop',
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'google-keep-desktop',
        title: 'Google Keep Desktop',
        description: 'Cliente desktop para Google Keep',
        setupIcon: './icon.ico',
        loadingGif: './icon.png',
        setupExe: 'Google Keep Desktop Setup.exe',
        noMsi: true,
        remoteReleases: false,
        createDesktopShortcut: true,
        createStartMenuShortcut: true,
        shortcutName: 'Google Keep Desktop',
        exe: 'google-keep-desktop.exe',
        skipUpdateIcon: false
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
