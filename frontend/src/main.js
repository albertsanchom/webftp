import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import '@fortawesome/fontawesome-free/css/all.css'
import utilities from './services/utilities'
import VueClipboard from 'vue-clipboard2'
//import { jwtDecode } from 'jwt-js-decode';

const i18n = createI18n({
  allowComposition: true, // you need to specify that!
  messages : { 
    "ca": {
      "login": "GICAR",
      "google-login": "Google",
      "deleted" : "Esborrat",
      "deleting" : "Esborrant",
      "uploaded" : "Pujat",
      "uploading" : "Pujant",
      "downloaded" : "Descarregat",
      "downloading" : "Descarregant",
      "created" : "Creat",
      "creating" : "Creant",
      "drag" : "Arrossega contingut o clica aquí",
      "uploadingDrag" : "Pujant...",
      "uploadDrag" : "Puja",
      "sure" : "Estàs segur?",
      "folder" : "Nom del directori a crear",
      "startSearch" : "cerca en aquest directori",
      "copy" : "Copia la url pública",
      "copied" : "copiada",
      "notcopied" : "No s'ha pogut copiar",
      "actionAdd" : "Afegeix un directori",
      "actionDelete" : "Elimina",
      "actionDownload" : "Descarrega",
      "actionRefresh" : "Refresca",
      "actionLogout" : "Surt de l'aplicació",      
      "authError" : "Probablement no tinguis permisos",
      "fetchError" : "S'ha produït un error en recuperar les dades. Si us plau, torna a fer la petició"
    },
    "es": {
      "login": "GICAR",
      "google-login": "Google",
      "deleted" : "Eliminado",
      "deleting" : "Eliminando",
      "uploaded" : "Subido",
      "uploading" : "Subiendo",
      "downloaded" : "Descargado",
      "downloading" : "Descargando",
      "created" : "Creado",
      "creating" : "Creando",
      "drag" : "Arrastra contenido o clica aquí",
      "uploadingDrag" : "Subiendo...",
      "uploadDrag" : "Sube",
      "sure" : "¿Estás seguro?",
      "folder" : "Nombre del directorio a crear",
      "startSearch" : "busca en este directorio",
      "copy" : "Copia la url pública",
      "copied" : "copiada",
      "notcopied" : "No se ha podido copiar",
      "actionAdd" : "Añade un directorio",
      "actionDelete" : "Elimina",
      "actionDownload" : "Descarga",
      "actionRefresh" : "Refresca",
      "actionLogout" : "Sal de la aplicación",      
      "authError" : "Probablemente no tengas permisos",
      "fetchError" : "Se ha producido un error al recuperar los datos. Por favor, vuelve a solicitar los datos"
    },
    "en": {
      "login": "GICAR",
      "google-login": "Google",
      "deleted" : "Deleted",
      "deleting" : "Deleting",
      "uploaded" : "Uploaded",
      "uploading" : "Uploading",
      "downloaded" : "Downloaded",
      "downloading" : "Downloading",
      "created" : "Created",
      "creating" : "Creating",
      "drag" : "Drag content or click here",
      "uploadingDrag" : "Uploading...",
      "uploadDrag" : "Upload",
      "sure" : "Are you sure?",
      "folder" : "Folder name",
      "startSearch" : "search in this folder",
      "copy" : "Copy public url",
      "copied" : "copied",
      "notcopied" : "Can't be copied",
      "actionAdd" : "Add a folder",
      "actionDelete" : "Delete",
      "actionDownload" : "Download",
      "actionRefresh" : "Refresh",
      "actionLogout" : "Logout",      
      "authError" : "you don't have permissions",
      "fetchError" : "an error ocurred while fetching data. Please refresh"
    }
   } 
})

createApp(App)
  .use(utilities)
  .use(i18n)
//  .use(jwtDecode)
  .use(VueClipboard)
  .mount('#app');