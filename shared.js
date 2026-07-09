/* ==========================================================================
   shared.js
   Configuración de Firebase, menú de navegación y guard de sesión por rol,
   compartidos por todas las páginas de la intranet. Cargar después del SDK
   de Firebase y antes del <script> propio de cada página.

   Para cambiar una norma de acceso (quién ve/edita qué) o el menú, se edita
   este único archivo en vez de las 9 páginas.
   ========================================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyC2YAldQ3Ple_ZFN9rr74B6XXFjTFwkzYM",
  authDomain: "checklist-830bc.firebaseapp.com",
  projectId: "checklist-830bc",
  storageBucket: "checklist-830bc.firebasestorage.app",
  messagingSenderId: "1041357310906",
  appId: "1:1041357310906:web:721e48a5430a00cee96b83"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

/* ---------- Menú de navegación ----------
   adminOnly:true = el enlace nace oculto (clase nav-admin-only) y solo se
   muestra si el usuario logueado tiene rol admin. Añadir/quitar una página
   del menú, o cambiar quién puede verla, se hace aquí. */
const NAV_LINKS = [
  { href:'index.html',               icon:'🏠', label:'Inicio' },
  { href:'produccion-guaracha.html', icon:'📋', label:'Producción Guaracha' },
  { href:'produccion-corrala.html',  icon:'📋', label:'Producción Corrala' },
  { href:'compra-guaracha.html',     icon:'🛒', label:'Compra Guaracha' },
  { href:'compra-corrala.html',      icon:'🛒', label:'Compra Corrala' },
  { href:'horario.html',             icon:'🗓', label:'Horario de personal', adminOnly:true },
  { href:'proveedores.html',         icon:'🏢', label:'Proveedores' },
  { href:'usuarios.html',            icon:'👥', label:'Usuarios',            adminOnly:true }
];

function renderNav(activeHref){
  const container = document.getElementById('nav');
  if(!container) return;
  container.innerHTML = NAV_LINKS.map(link=>{
    const classes = [];
    if(link.href === activeHref) classes.push('active');
    if(link.adminOnly) classes.push('nav-admin-only');
    return `<a href="${link.href}" class="${classes.join(' ')}">${link.icon} ${link.label}</a>`;
  }).join('');
}

function revealAdminOnly(){
  document.querySelectorAll('.nav-admin-only').forEach(el=> el.classList.remove('nav-admin-only'));
}

/* ---------- Guard de sesión ----------
   Exige login + usuario activo. Con requireAdmin:true, redirige a index.html
   si el rol no es admin (para páginas enteras solo-admin, como horario.html
   o usuarios.html). Revela cualquier elemento .nav-admin-only si es admin.
   onReady(info) recibe { role, sede, email, uid } para que cada página haga
   su inicialización propia (cargar datos, activar modo solo lectura, etc). */
function initAuthGuard({ requireAdmin=false, onReady }={}){
  auth.onAuthStateChanged(async (user)=>{
    if(!user){
      window.location.href = 'login.html';
      return;
    }
    try{
      const snap = await db.collection('usuarios').doc(user.uid).get();
      if(!snap.exists || snap.data().activo !== true){
        await auth.signOut();
        window.location.href = 'login.html';
        return;
      }
      const data = snap.data();
      const role = data.rol === 'admin' ? 'admin' : 'empleado';
      const sede = data.sede || 'ambos';

      if(requireAdmin && role !== 'admin'){
        window.location.href = 'index.html';
        return;
      }
      if(role === 'admin') revealAdminOnly();

      const emailLabel = document.getElementById('userEmailLabel');
      if(emailLabel) emailLabel.textContent = user.email || '';
      document.body.classList.remove('checking-auth');

      if(typeof onReady === 'function') onReady({ role, sede, email: user.email, uid: user.uid });
    }catch(e){
      console.error(e);
      window.location.href = 'login.html';
    }
  });

  const logoutBtn = document.getElementById('btnLogout');
  if(logoutBtn){
    logoutBtn.addEventListener('click', async ()=>{
      await auth.signOut();
      window.location.href = 'login.html';
    });
  }
}

/* ---------- Helpers de escape usados por varias páginas ---------- */
function escapeHtml(str){
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}
function escapeAttr(str){
  return String(str||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
