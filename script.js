// --- INICIALIZACIÓN DE FIREBASE ---

// 1. Pega aquí el objeto de configuración que copiaste de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAJwPnmjM1RCn5tr60tq_vwLUoRqsmwHzU",
    authDomain: "codigopenal-app.firebaseapp.com",
    projectId: "codigopenal-app",
    storageBucket: "codigopenal-app.firebasestorage.app",
    messagingSenderId: "293989113735",
    appId: "1:293989113735:web:a9515149fc06e7471efd22"
  };

// 2. Inicializa Firebase y obtén referencias a los servicios
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(); // Referencia a la base de datos Firestore
const auth = firebase.auth();   // Referencia a la autenticación



// --- DICCIONARIOS ---
const DICCIONARIO_TITULOS = {
    10: "Título I. Del homicidio y sus formas",
    20: "Título II. Del aborto",
    30: "Título III. De las lesiones",
    40: "Título IV. De las lesiones al feto",
    50: "Título V. Delitos relativos a la manipulación genética",
    60: "Título VI. Delitos contra la libertad",
    70: "Título VII. De las torturas y otros delitos contra la integridad moral",
    72: "Título VII bis. De la trata de seres humanos",
    80: "Título VIII. Delitos contra la libertad sexual",
    90: "Título IX. De la omisión del deber de socorro",
    100: "Título X. Delitos contra la intimidad, el derecho a la propia imagen y la inviolabilidad del domicilio",
    110: "Título XI. Delitos contra el honor",
    120: "Título XII. Delitos contra las relaciones familiares",
    130: "Título XIII. Delitos contra el patrimonio",
    132: "Título XIII bis. De los delitos de financiación ilegal de los partidos políticos",
    140: "Título XIV De los delitos contra la Hacienda Pública y contra la Seguridad Social",
    150: "Título XV. De los delitos contra los derechos de los trabajadores",
    152: "Título XV bis. Delitos contra los derechos de los ciudadanos extranjeros",
    160: "Título XVI. De los delitos relativos a la ordenación del territorio y el urbanismo, la protección del patrimonio histórico y el medio ambiente",
    162: "Título XVI bis. De los delitos contra los animales",
    170: "Título XVII. Delitos contra la seguridad colectiva",
    180: "Título XVIII. De las falsedades",
    190: "Título XIX. Delitos contra la Administración Pública",
    200: "Título XX. Delitos contra la administración de justicia",
    210: "Título XXI. Delitos contra la Constitución",
    220: "Título XXII. Delitos contra el orden público",
    230: "Título XXIII. De los delitos de traición y contra la paz o la independencia del Estado y relativos a la Defensa Nacional",
    240: "Título XXIV. Delitos contra la Comunidad Internacional"
};
const DICCIONARIO_CAPITULOS = {
    1301: "Capítulo I. De los hurtos",
	1302: "Capítulo II. De los robos",
    603: "Capítulo III. De las coacciones",
    1704: "Capítulo IV. De los delitos contra la Seguridad Vial"
};
const DICCIONARIO_SECCIONES = {
    130201: "Sección 1ª. Del robo con fuerza en las cosas"
};
const DICCIONARIO_SUBSECCIONES = {}; // Listo para el futuro

// --- ELEMENTOS DEL DOM Y ESTADO GLOBAL ---
let delitos = [];
let filtroActivoSidebar = { level: 'all' };
const sidebarContainer = document.getElementById('sidebar');
const contentContainer = document.getElementById('delitos-container');
const filtroGravedadSelect = document.getElementById('filtroGravedad');
const placeholder = "__base__";
const body = document.body;
const menuToggleBtn = document.getElementById('menu-toggle-btn');
const backdrop = document.getElementById('backdrop');

// --- FUNCIONES AUXILIARES SIMPLIFICADAS ---
// YA NO NECESITAMOS: BAREMOS_PENAS_EN_DIAS, convertirADias, clasificarPenaIndividual, determinarGravedadGeneral.
function extraerNumeroArticulo(articuloStr) {
    if (!articuloStr) return 0;
    // Busca el primer número (puede incluir un punto para los apartados)
    const match = articuloStr.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[0]) : 0;
}

// --- FUNCIONES AUXILIARES SIMPLIFICADAS ---
function formatearDuracion(d) { if (!d) return "N/A"; const p = []; if (d.años > 0) p.push(`${d.años} año${d.años !== 1 ? 's' : ''}`); if (d.meses > 0) p.push(`${d.meses} mes${d.meses !== 1 ? 'es' : ''}`); if (d.dias > 0) p.push(`${d.dias} día${d.dias !== 1 ? 's' : ''}`); return p.length > 0 ? p.join(' y ') : "N/A"; }
function getIconForPena(t) { /* Tu función de iconos completa aquí */ return `<svg class="pena-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10,10-4.48,10-10S17.52,2,12,2z M13,17h-2v-2h2V17z M13,13h-2V7h2V13z"/></svg>`; }

// REEMPLAZA ESTA FUNCIÓN EN TU script.js

function formatearPenasDelito(delito) {
    // 1. Mapeamos cada opción alternativa a su propio bloque HTML
    const opcionesStr = (delito.penasAlternativas || []).map(opcionObj => {
        const penasEnOpcionStr = (opcionObj.penas || []).map(p => 
            `<div class="pena-detalle">${getIconForPena(p.tipo)}<div><strong>${p.tipo}</strong><br><span>de ${formatearDuracion(p.durMin)} a ${formatearDuracion(p.durMax)}</span></div></div>`
        ).join('<div class="operador-y">Y</div>');
        
        // Devolvemos cada grupo de penas ya envuelto en su "cajón"
        return `<div class="opcion-pena-bloque">${penasEnOpcionStr}</div>`;
    }).join('<div class="operador-o">O</div>'); // Unimos los cajones con el operador "O"
    
    // 2. Procesamos las penas obligatorias
    const obligatoriasStr = (delito.penasObligatorias || []).map(p => `<div class="pena-detalle">${getIconForPena(p.tipo)}<div><strong>${p.tipo}</strong><br><span>de ${formatearDuracion(p.durMin)} a ${formatearDuracion(p.durMax)}</span></div></div>`).join('<div class="operador-y">Y</div>');
    
    // 3. Unimos todo el resultado
    let resultado = '';
    if (opcionesStr) {
        resultado += opcionesStr;
    }

    if (obligatoriasStr) {
        // Si ya había opciones, añadimos el separador "Y (en todo caso)"
        if (resultado) {
            resultado += `<div class="penas-obligatorias-sep">Y (en todo caso)</div>`;
        }
        // Envolvemos las penas obligatorias en su propio "cajón"
        resultado += `<div class="opcion-pena-bloque">${obligatoriasStr}</div>`;
    }

    return resultado || 'No especificado';
}

// --- LÓGICA DE LA APLICACIÓN ---

function agruparDelitosParaSidebar(todosLosDelitos) {
    const grupos = {};
    todosLosDelitos.forEach(delito => {
        const { titulo, capitulo, seccion, subseccion } = delito.clasificacion;
        if (!titulo) return;
        if (!grupos[titulo]) grupos[titulo] = {};
        const c = capitulo || placeholder;
        if (!grupos[titulo][c]) grupos[titulo][c] = {};
        const s = seccion || placeholder;
        if (!grupos[titulo][c][s]) grupos[titulo][c][s] = {};
        const ss = subseccion || placeholder;
        if (!grupos[titulo][c][s][ss]) grupos[titulo][c][s][ss] = [];
    });
    return grupos;
}

function buildSidebar() {
    
    const treeContainer = document.getElementById('navigation-tree');
    const grupos = agruparDelitosParaSidebar(delitos);
    let html = `<li><span class="nav-item nav-titulo active-nav" data-filter-level="all">Ver Todos</span></li>`;
    const iconHTML = `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>`;

    Object.keys(grupos).sort((a, b) => a - b).forEach(tituloKey => {
        let capitulosHTML = '';
        Object.keys(grupos[tituloKey]).sort((a, b) => a - b).forEach(capituloKey => {
            if (capituloKey === placeholder) return;
            let seccionesHTML = '';
            Object.keys(grupos[tituloKey][capituloKey]).sort((a, b) => a - b).forEach(seccionKey => {
                if (seccionKey === placeholder) return;
                const nombreSeccion = DICCIONARIO_SECCIONES[seccionKey] || `Sección ${seccionKey}`;
                seccionesHTML += `<li><span class="nav-item nav-seccion" data-filter-level="seccion" data-filter-value="${seccionKey}">${nombreSeccion}</span></li>`;
            });
            const nombreCapitulo = DICCIONARIO_CAPITULOS[capituloKey] || `Capítulo ${capituloKey}`;
            capitulosHTML += `<li><span class="nav-item nav-capitulo" data-filter-level="capitulo" data-filter-value="${capituloKey}">${seccionesHTML ? iconHTML : '<span class="nav-icon"></span>'} ${nombreCapitulo}</span>${seccionesHTML ? `<ul class="nav-submenu">${seccionesHTML}</ul>` : ''}</li>`;
        });
        const nombreTitulo = DICCIONARIO_TITULOS[tituloKey] || `Título ${tituloKey}`;
        html += `<li><span class="nav-item nav-titulo" data-filter-level="titulo" data-filter-value="${tituloKey}">${capitulosHTML ? iconHTML : '<span class="nav-icon"></span>'} ${nombreTitulo}</span>${capitulosHTML ? `<ul class="nav-submenu">${capitulosHTML}</ul>` : ''}</li>`;
    });
    treeContainer.innerHTML = html;
}

function renderDelitos(delitosAMostrar) {
    contentContainer.innerHTML = "";
    delitosAMostrar.sort((a, b) => (a.articulo || "").localeCompare(b.articulo || "", undefined, { numeric: true }));

    if (delitosAMostrar.length === 0) {
        contentContainer.innerHTML = `<p style="text-align:center; font-size: 1.2em; color: var(--color-muted-text);">No hay delitos que coincidan con los filtros seleccionados.</p>`;
        return;
    }

    delitosAMostrar.forEach(d => {
        const gravedad = d.gravedad || "No clasificada";
        const gravedadClass = gravedad.toLowerCase().replace(" ", "-");
        const card = document.createElement("div");
        card.className = `delito-card ${gravedadClass}`;
        const rutaClasificacion = [ DICCIONARIO_TITULOS[d.clasificacion.titulo], DICCIONARIO_CAPITULOS[d.clasificacion.capitulo], DICCIONARIO_SECCIONES[d.clasificacion.seccion] ].filter(Boolean).join(' &gt; ');
        card.innerHTML = `<div class="card-header"><div class="info-principal"><span class="articulo">${d.articulo}</span><h4>${d.nombre}</h4></div><div style="display: flex; align-items: center;"><div class="gravedad-badge ${gravedadClass}">${gravedad}</div><svg class="expand-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="9 18 15 12 9 6"></polyline></svg></div></div><div class="card-collapsible-content"><div class="card-body"><div class="descripcion"><h5>Descripción de la conducta</h5>${window.marked ? marked.parse(d.descripcion) : d.descripcion}</div><div class="penas-aplicables"><h5>Penas Aplicables</h5>${formatearPenasDelito(d)}</div></div><div class="card-footer"><div class="clasificacion-ruta"><strong>Clasificación:</strong> ${rutaClasificacion}</div><div class="info-denuncia"><strong>Persecución:</strong> ${d.requiereDenuncia ? 'Requiere denuncia' : 'De oficio'}</div></div></div>`;
        contentContainer.appendChild(card);
    });
}

function aplicarFiltrosYRenderizar() {
    const filtroGrav = filtroGravedadSelect.value;
    let delitosResultantes = delitos;
    const { level, value } = filtroActivoSidebar;

    // Lógica de filtrado simplificada gracias a los IDs únicos.
    if (level !== 'all') {
        delitosResultantes = delitosResultantes.filter(d => 
            d.clasificacion[level] === parseInt(value)
        );
    }
    
    // Filtro de gravedad usa la propiedad directa 'gravedad'.
    if (filtroGrav) {
        delitosResultantes = delitosResultantes.filter(d => d.gravedad === filtroGrav);
    }
    renderDelitos(delitosResultantes);
}


// --- MANEJO DE EVENTOS ---
sidebarContainer.addEventListener('click', function(event) {
    const itemClicked = event.target.closest('.nav-item');
    if (!itemClicked) return;
    if (event.target.closest('.nav-icon')) {
        itemClicked.parentElement.classList.toggle('expanded');
    } else {
        filtroActivoSidebar = { ...itemClicked.dataset };
        document.querySelectorAll('.nav-item.active-nav').forEach(el => el.classList.remove('active-nav'));
        itemClicked.classList.add('active-nav');
        aplicarFiltrosYRenderizar();
        if (window.innerWidth <= 900) {
            body.classList.remove('sidebar-visible');
        }
    }
});

contentContainer.addEventListener('click', function(event) {
    const cardHeader = event.target.closest('.card-header');
    if (cardHeader) cardHeader.closest('.delito-card').classList.toggle('expanded');
});

filtroGravedadSelect.addEventListener('change', aplicarFiltrosYRenderizar);

menuToggleBtn.addEventListener('click', () => {
    body.classList.toggle('sidebar-visible');
});

backdrop.addEventListener('click', () => {
    body.classList.remove('sidebar-visible');
});

// --- INICIALIZACIÓN DE LA APLICACIÓN ---
document.addEventListener("DOMContentLoaded", () => {
    // Lectura desde la colección "Delitos2" de Firestore
    db.collection("Delitos2").get()
        .then((querySnapshot) => {
            console.log(`Se han encontrado ${querySnapshot.size} delitos en Firebase.`);
            delitos = [];
            querySnapshot.forEach((doc) => {
                delitos.push(doc.data());
            });
            console.log("Datos cargados en la variable 'delitos':", delitos);
            buildSidebar();
            aplicarFiltrosYRenderizar();
        })
        .catch(error => {
            console.error('Error al cargar los delitos desde Firestore:', error);
            contentContainer.innerHTML = `<p style="text-align:center; color: var(--color-accent-red);">Error: No se pudo conectar a la base de datos.</p>`;
        });
});