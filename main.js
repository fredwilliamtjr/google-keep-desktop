// Verifica se é um evento do Squirrel (instalação/desinstalação)
if (require('electron-squirrel-startup')) return;

// Importa os módulos necessários do Electron
const { app, BrowserWindow, Tray, Menu, shell, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Variáveis globais
let mainWindow;
let tray;

// Função removida para evitar conflito com configurações do Squirrel
// A criação de atalhos agora é controlada inteiramente pelo forge.config.js

function createWindow() {
  // Cria a janela do navegador.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    // Define um ícone para a janela (opcional, mas recomendado)
    // Crie um arquivo 'icon.png' na raiz do projeto
    icon: path.join(__dirname, 'icon.png'),
    // Remove o ícone da barra de tarefas - fica apenas no tray
    skipTaskbar: true,
    webPreferences: {
      // ESSENCIAL: Define um User-Agent de um navegador real para garantir que o login do Google funcione.
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
    }
  });

  // Carrega a URL do Google Keep na janela.
  mainWindow.loadURL('https://keep.google.com' );

  // Opcional: Remove o menu padrão do Electron (Arquivo, Editar, etc.)
  mainWindow.setMenu(null);

  // Adiciona atalho de teclado para recarregar (F5 ou Ctrl+R)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F5' || (input.control && input.key === 'r')) {
      event.preventDefault();
      mainWindow.webContents.reload();
    }
  });

  // Quando a janela for minimizada, esconde ela em vez de minimizar
  mainWindow.on('minimize', function(event){
    event.preventDefault();
    mainWindow.hide();
  });

  // Previne que a janela seja fechada, apenas esconde
  mainWindow.on('close', function (event) {
    if(!app.isQuiting){
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });

  // Opcional: Abre o DevTools (ferramentas de desenvolvedor) para depuração.
  // mainWindow.webContents.openDevTools();
}

function createTray() {
  // Cria o ícone na área de notificação
  const defaultIconPath = path.join(__dirname, 'icon.png');
  const macColorIconPathPt = path.join(__dirname, 'icone-macos.jpg');
  const macColorIconPathEn = path.join(__dirname, 'icon-macos.jpg');
  let trayImage = nativeImage.createFromPath(defaultIconPath);

  if (process.platform === 'darwin') {
    // Preferir 'icone-macos.jpg' (PT), depois 'icon-macos.jpg' (EN), senão usar padrão
    if (fs.existsSync(macColorIconPathPt)) {
      trayImage = nativeImage.createFromPath(macColorIconPathPt);
    } else if (fs.existsSync(macColorIconPathEn)) {
      trayImage = nativeImage.createFromPath(macColorIconPathEn);
    }
    trayImage = trayImage.resize({ width: 16, height: 16 });
  }
  tray = new Tray(trayImage);
  
  // Define o menu de contexto do tray
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Mostrar Google Keep',
      click: function(){
        mainWindow.show();
      }
    },
    {
      label: 'Esconder',
      click: function(){
        mainWindow.hide();
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Recarregar',
      click: function(){
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.reload();
        }
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Sair',
      click: function(){
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);
  
  // Define o menu de contexto
  tray.setContextMenu(contextMenu);
  
  // Define o tooltip
  tray.setToolTip('Google Keep Desktop');
  
  // Quando clica no ícone do tray, mostra/esconde a janela
  tray.on('click', function(){
    if(mainWindow.isVisible()){
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
}

// Este método será chamado quando o Electron terminar a inicialização
// e estiver pronto para criar janelas do navegador.
app.whenReady().then(() => {
  createWindow();
  createTray();
  
  // Criação de atalhos removida - agora controlada pelo Squirrel via forge.config.js

  // Gerencia o comportamento no macOS
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Modifica o comportamento de fechamento - agora o app fica no tray
app.on('window-all-closed', function () {
  // No Windows, o aplicativo continuará rodando no tray mesmo com todas as janelas fechadas
  // Para sair completamente, use o menu do tray
  if (process.platform === 'darwin') {
    app.quit();
  }
});
