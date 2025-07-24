// Verifica se é um evento do Squirrel (instalação/desinstalação)
if (require('electron-squirrel-startup')) return;

// Importa os módulos necessários do Electron
const { app, BrowserWindow, Tray, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Variáveis globais
let mainWindow;
let tray;

// Função para criar atalhos automaticamente
function createShortcuts() {
  if (process.platform !== 'win32') return;
  
  try {
    // Verifica se os atalhos já existem
    const desktopPath = path.join(os.homedir(), 'Desktop');
    const desktopShortcut = path.join(desktopPath, 'Google Keep Desktop.lnk');
    
    const startMenuPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs');
    const startMenuShortcut = path.join(startMenuPath, 'Google Keep Desktop.lnk');
    
    // Se já existem, não faz nada
    if (fs.existsSync(desktopShortcut) && fs.existsSync(startMenuShortcut)) {
      return;
    }
    
    // Detecta se está executando da instalação
    const updateExe = path.join(path.dirname(process.execPath), '..', 'Update.exe');
    const isInstalled = fs.existsSync(updateExe);
    
    if (isInstalled) {
      const appName = path.basename(process.execPath);
      
      // Cria um arquivo batch temporário para executar o Update.exe com flags específicos
      const tempBat = path.join(os.tmpdir(), 'create_shortcuts.bat');
      const batContent = `@echo off
"${updateExe}" --createShortcut="${appName}" --shortcut-locations=Desktop,StartMenu
del "%~f0"`;
      
      fs.writeFileSync(tempBat, batContent);
      
      // Executa o arquivo batch
      const { exec } = require('child_process');
      exec(`"${tempBat}"`, (error, stdout, stderr) => {
        if (error) {
          console.log('Erro ao criar atalhos:', error);
        } else {
          console.log('Atalhos criados automaticamente');
        }
      });
    }
  } catch (error) {
    console.log('Erro ao criar atalhos:', error);
  }
}

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
  tray = new Tray(path.join(__dirname, 'icon.png'));
  
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
  
  // Cria os atalhos automaticamente na primeira execução
  createShortcuts();

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
