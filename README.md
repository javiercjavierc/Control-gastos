# Control de gastos — app del grupo familiar

App web para cargar **ingresos, gastos y ahorro** mes a mes, con resumen y estadísticas.
Es una sola página (sin servidor propio): se puede publicar gratis en **GitHub Pages**,
instalar en el celular como app (**PWA**) y, si querés, generar un **.apk** para compartir.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La app completa. |
| `manifest.webmanifest` | Hace que sea instalable como app. |
| `sw.js` | Service worker: permite usarla offline. |
| `icons/` | Íconos de la app. |
| `datos-historicos.json` | Tus 18 meses del Excel (may/25 → oct/26), listos para importar. |

## Dónde se guardan los datos: dos modos

- **Local (por defecto, sin configurar nada):** los datos se guardan en el dispositivo donde abrís la app. Sirve para probar, pero **no se comparte** entre celulares.
- **Nube con Firebase (recomendado para la familia):** los datos se guardan en Firebase y se **sincronizan**: todos los que entren con el mismo usuario ven y cargan lo mismo. Es gratis para este uso. Se activa pegando la config de Firebase en `index.html` (ver más abajo).

> **Importante:** GitHub aloja la *app* (el código), pero **no** guarda los datos que cargás. Los datos viven en el dispositivo (modo local) o en Firebase (modo nube). Son dos cosas distintas.

---

## 1) Publicar en GitHub Pages

1. Creá un repositorio en https://github.com/new (por ejemplo `control-gastos`). Puede ser **privado** si no querés que el código sea público (Pages igual funciona en cuentas con esa opción; si no, hacelo público — igual los **datos** no están en GitHub).
2. Subí **todos** los archivos de esta carpeta al repo (botón *Add file → Upload files*, arrastrá todo, *Commit*).
3. En el repo: **Settings → Pages**. En *Source* elegí **Deploy from a branch**, rama `main`, carpeta `/ (root)`, y *Save*.
4. Esperá un minuto. GitHub te da la dirección, del estilo:
   `https://TU-USUARIO.github.io/control-gastos/`
5. Abrí esa dirección. Ya funciona en **modo local**.

## 2) Cargar tus datos históricos

1. Abrí la app → menú (⋮, arriba a la derecha) → **Importar datos**.
2. Elegí el archivo `datos-historicos.json`.
3. Confirmá. Quedan cargados los 18 meses y la lista de conceptos (con **Ahorro** como categoría propia).

> Hacelo **una sola vez**. En modo nube, importá después de iniciar sesión, así los datos van a la nube.

## 3) Sincronizar con la familia (Firebase)

Esto es lo que hace que todos vean los mismos datos.

### a. Crear el proyecto
1. Entrá a https://console.firebase.google.com/ → **Agregar proyecto** (nombre libre, podés saltar Analytics).
2. Dentro del proyecto: ícono **web `</>`** → registrá una app (un nombre cualquiera). Firebase te muestra un bloque `firebaseConfig = { apiKey: "...", ... }`.
3. Copiá esos valores y pegalos en `index.html`, al principio del `<script>`, reemplazando el bloque:
   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "tu-proyecto.firebaseapp.com",
     projectId: "tu-proyecto",
     storageBucket: "tu-proyecto.appspot.com",
     messagingSenderId: "....",
     appId: "...."
   };
   ```
   Subí el `index.html` actualizado al repo. (Estos valores son seguros de publicar: la protección real son las reglas del paso d.)

### b. Activar el inicio de sesión
1. En Firebase: **Authentication → Comenzar → Sign-in method → Email/Password → Habilitar**.
2. **Authentication → Settings → Authorized domains → Agregar dominio:** poné `TU-USUARIO.github.io`.

### c. Crear la base de datos
1. **Firestore Database → Crear base de datos → modo producción** (la región más cercana).

### d. Reglas de seguridad (para que solo entre la familia)
En **Firestore → Rules**, pegá esto y publicá:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /households/{home}/{document=**} {
      allow read, write: if request.auth != null
        && request.auth.token.email in [
          "tucorreo@gmail.com",
          "viki@gmail.com"
        ];
    }
  }
}
```
Cambiá la lista por los correos de la familia. Así, aunque alguien tenga el link, no puede leer ni escribir si su correo no está en la lista.

### e. Crear las cuentas
1. Abrí la app (ya con la config pegada). Aparece la pantalla **Entrar**.
2. La primera vez, tocá **Crear cuenta** y creá una con uno de los correos de la lista (contraseña de 6+ caracteres). Repetí para cada integrante, o compartí un mismo usuario/contraseña entre todos (lo más simple).
3. Entrá, **importá** `datos-historicos.json` una vez, y listo: lo que cargue cualquiera se ve en todos los dispositivos.

## 4) Generar el .apk para compartir

Con la app ya publicada en GitHub Pages:

1. Entrá a **https://www.pwabuilder.com/** y pegá la URL de tu app (`https://TU-USUARIO.github.io/control-gastos/`).
2. *Start* → te analiza la PWA → **Android** → *Generate Package*.
3. Elegí **Signed** (firmado) para poder instalarlo directo; descargá el paquete. Adentro viene el **`.apk`**.
4. Pasales ese `.apk` a tu familia (WhatsApp, Drive, etc.). En el celular, al abrirlo Android pedirá permitir *"instalar apps de orígenes desconocidos"* una vez, y queda instalada como cualquier app.

> Alternativa sin .apk: desde el navegador del celular, abrir la URL y usar **"Agregar a pantalla de inicio"**. Queda el ícono y se abre a pantalla completa, igual que una app instalada.

> El `.apk` es solo la "cáscara" que abre tu web; los datos siguen viniendo de Firebase, así que todos los que instalen el apk e inicien sesión ven lo mismo.

---

## Notas

- **Neto = Ingresos − Gastos − Ahorro.** El ahorro está separado como categoría propia; cuando es negativo significa que ese mes se usó plata ahorrada.
- **Probar en tu compu:** abrí una terminal en esta carpeta y corré `python -m http.server 8000`, después entrá a `http://localhost:8000`. (Abrir el archivo con doble clic no alcanza para el service worker ni para Firebase.)
- **Backup:** menú → *Exportar copia (JSON)* guarda todo; *Importar datos* lo restaura. *Exportar CSV* arma la planilla concepto × mes como el Excel.
- **Actualizar la app:** cuando cambies archivos, subí la versión en `sw.js` (`control-gastos-v1` → `v2`) para que los celulares tomen la versión nueva.
