// --- DICCIONARIOS ---
const DICCIONARIO_TITULOS = {
    6: "Título VI: Delitos contra la libertad",
    13: "Título XIII: Delitos contra el patrimonio",
    17: "Título XVII: Delitos contra la seguridad colectiva"
};
const DICCIONARIO_CAPITULOS = {
    1301: "Capítulo I. De los hurtos",
	1302: "Capítulo II: De los robos",
    603: "Capítulo III: De las coacciones",
    1704: "Capítulo IV: De los delitos contra la Seguridad Vial"
};
const DICCIONARIO_SECCIONES = {
    130201: "Sección 1ª: Del robo con fuerza en las cosas"
};
const DICCIONARIO_SUBSECCIONES = {}; // Listo para el futuro

// --- ELEMENTOS DEL DOM Y ESTADO GLOBAL ---
let delitos = [];
let filtroActivoSidebar = { level: 'all' };
const sidebarContainer = document.getElementById('sidebar');
const contentContainer = document.getElementById('delitos-container');
const filtroGravedadSelect = document.getElementById('filtroGravedad');
const placeholder = "__base__";

// --- FUNCIONES AUXILIARES SIMPLIFICADAS ---
// YA NO NECESITAMOS: BAREMOS_PENAS_EN_DIAS, convertirADias, clasificarPenaIndividual, determinarGravedadGeneral.
function extraerNumeroArticulo(articuloStr) {
    if (!articuloStr) return 0;
    // Busca el primer número (puede incluir un punto para los apartados)
    const match = articuloStr.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[0]) : 0;
}
function formatearDuracion(d) { if (!d) return "N/A"; const p = []; if (d.años > 0) p.push(`${d.años} año${d.años !== 1 ? 's' : ''}`); if (d.meses > 0) p.push(`${d.meses} mes${d.meses !== 1 ? 'es' : ''}`); if (d.dias > 0) p.push(`${d.dias} día${d.dias !== 1 ? 's' : ''}`); return p.length > 0 ? p.join(' y ') : "N/A"; }
function getIconForPena(t) { /* Tu función de iconos completa aquí */ return `<svg class="pena-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10,10-4.48,10-10S17.52,2,12,2z M13,17h-2v-2h2V17z M13,13h-2V7h2V13z"/></svg>`; }
function formatearPenasDelito(d) { const op = d.opcionesDePena.map(o => o.map(p => `<div class="pena-detalle">${getIconForPena(p.tipo)}<div><strong>${p.tipo}</strong><br><span>de ${formatearDuracion(p.durMin)} a ${formatearDuracion(p.durMax)}</span></div></div>`).join('<div class="operador-y">Y</div>')).join('<div class="operador-o">O</div>'); const ob = d.penasObligatorias.map(p => `<div class="pena-detalle">${getIconForPena(p.tipo)}<div><strong>${p.tipo}</strong><br><span>de ${formatearDuracion(p.durMin)} a ${formatearDuracion(p.durMax)}</span></div></div>`).join('<div class="operador-y">Y</div>'); let r = ''; if (op) r += op; if (ob) { r += r ? `<div class="penas-obligatorias"><strong>Y (en todo caso)</strong>${ob}</div>` : ob; } return r || 'No especificado'; }

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
    });
    return grupos;
}

function buildSidebar() {
    sidebarContainer.innerHTML = '<h1>Índice</h1><ul id="navigation-tree"></ul>';
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
                seccionesHTML += `<li><span class="nav-item nav-seccion" data-filter-level="seccion" data-filter-value="${seccionKey}" data-titulo="${tituloKey}" data-capitulo="${capituloKey}">${nombreSeccion}</span></li>`;
            });
            const nombreCapitulo = DICCIONARIO_CAPITULOS[capituloKey] || `Capítulo ${capituloKey}`;
            capitulosHTML += `<li><span class="nav-item nav-capitulo" data-filter-level="capitulo" data-filter-value="${capituloKey}" data-titulo="${tituloKey}">${seccionesHTML ? iconHTML : '<span class="nav-icon"></span>'} ${nombreCapitulo}</span>${seccionesHTML ? `<ul class="nav-submenu">${seccionesHTML}</ul>` : ''}</li>`;
        });
        const nombreTitulo = DICCIONARIO_TITULOS[tituloKey] || `Título ${tituloKey}`;
        html += `<li><span class="nav-item nav-titulo" data-filter-level="titulo" data-filter-value="${tituloKey}">${capitulosHTML ? iconHTML : '<span class="nav-icon"></span>'} ${nombreTitulo}</span>${capitulosHTML ? `<ul class="nav-submenu">${capitulosHTML}</ul>` : ''}</li>`;
    });
    treeContainer.innerHTML = html;
}

function renderDelitos(delitosAMostrar) {
    contentContainer.innerHTML = "";

    // Ordenamos la lista por artículo
    delitosAMostrar.sort((a, b) => extraerNumeroArticulo(a.articulo) - extraerNumeroArticulo(b.articulo));
    
    if (delitosAMostrar.length === 0) {
        contentContainer.innerHTML = `<p style="text-align:center; font-size: 1.2em; color: var(--color-muted-text);">No hay delitos que coincidan con los filtros seleccionados.</p>`;
        return;
    }

    // Variables para llevar un registro del grupo actual
    let currentTituloId = null;
    let currentCapituloId = null;

    delitosAMostrar.forEach(d => {
        const clasificacion = d.clasificacion;
        
        // --- LÓGICA PARA INSERTAR ENCABEZADOS DE CONTEXTO ---

        // ¿Hemos cambiado de Título?
        if (clasificacion.titulo !== currentTituloId) {
            currentTituloId = clasificacion.titulo;
            const nombreTitulo = DICCIONARIO_TITULOS[currentTituloId] || `Título ${currentTituloId}`;
            const headerDiv = document.createElement('div');
            headerDiv.className = 'context-header titulo-header';
            headerDiv.innerHTML = `<h2>${nombreTitulo}</h2>`;
            contentContainer.appendChild(headerDiv);
            currentCapituloId = null; // Reseteamos el capítulo al cambiar de título
        }

        // ¿Hemos cambiado de Capítulo (y existe)?
        if (clasificacion.capitulo && clasificacion.capitulo !== currentCapituloId) {
            currentCapituloId = clasificacion.capitulo;
            const nombreCapitulo = DICCIONARIO_CAPITULOS[currentCapituloId] || `Capítulo ${currentCapituloId}`;
            const headerDiv = document.createElement('div');
            headerDiv.className = 'context-header capitulo-header';
            headerDiv.innerHTML = `<h3>${nombreCapitulo}</h3>`;
            contentContainer.appendChild(headerDiv);
        }
        
        // --- RENDERIZADO DE LA TARJETA DE DELITO (sin cambios) ---
        const gravedad = d.gravedad || "No clasificada";
        const gravedadClass = gravedad.toLowerCase().replace(" ", "-");
        const card = document.createElement("div");
        card.className = `delito-card ${gravedadClass}`;
        
        const rutaClasificacion = [
            DICCIONARIO_TITULOS[clasificacion.titulo],
            DICCIONARIO_CAPITULOS[clasificacion.capitulo],
            DICCIONARIO_SECCIONES[clasificacion.seccion]
        ].filter(Boolean).join(' &gt; ');

        card.innerHTML = `<div class="card-header"><div class="info-principal"><span class="articulo">${d.articulo}</span><h4>${d.nombre}</h4></div><div style="display: flex; align-items: center;"><div class="gravedad-badge ${gravedadClass}">${gravedad}</div><svg class="expand-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="9 18 15 12 9 6"></polyline></svg></div></div><div class="card-collapsible-content"><div class="card-body"><div class="descripcion"><h5>Descripción de la conducta</h5>${marked.parse(d.descripcion)}</div><div class="penas-aplicables"><h5>Penas Aplicables</h5>${formatearPenasDelito(d)}</div></div><div class="card-footer"><div class="clasificacion-ruta"><strong>Clasificación:</strong> ${rutaClasificacion}</div><div class="info-denuncia"><strong>Persecución:</strong> ${d.requiereDenuncia ? 'Requiere denuncia' : 'De oficio'}</div></div></div>`;
        contentContainer.appendChild(card);
    });
}

function aplicarFiltrosYRenderizar() {
    const filtroGrav = filtroGravedadSelect.value;
    let delitosResultantes = delitos;
    const { level, value, titulo, capitulo, seccion } = filtroActivoSidebar;

    if (level !== 'all') {
        delitosResultantes = delitosResultantes.filter(d => {
            if (level === 'titulo') return d.clasificacion.titulo === parseInt(value);
            if (level === 'capitulo') return d.clasificacion.capitulo === parseInt(value);
            if (level === 'seccion') return d.clasificacion.seccion === parseInt(value);
            return true;
        });
    }
    
    // MODIFICACIÓN: El filtro de gravedad ahora usa la propiedad directa 'gravedad'.
    if (filtroGrav) {
        delitosResultantes = delitosResultantes.filter(d => d.gravedad === filtroGrav);
    }
    renderDelitos(delitosResultantes);
}

// --- MANEJO DE EVENTOS ---
sidebarContainer.addEventListener('click', function(event) {
    const itemClicked = event.target.closest('.nav-item');
    
    if (!itemClicked) return; // Si el clic no fue en un item, no hacemos nada

    // Verificamos si el clic fue específicamente en el icono de la flecha
    if (event.target.closest('.nav-icon')) {
        // --- ACCIÓN 1: DESPLEGAR / CONTRAER ---
        // Si se hizo clic en el icono, solo se gestiona el desplegable.
        itemClicked.parentElement.classList.toggle('expanded');
    } else {
        // --- ACCIÓN 2: FILTRAR ---
        // Si se hizo clic en cualquier otra parte del item (el texto), solo se filtra.
        
        // Asignamos explícitamente los datos para evitar errores con los nombres
        filtroActivoSidebar = {
            level: itemClicked.dataset.filterLevel,
            value: itemClicked.dataset.filterValue,
            titulo: itemClicked.dataset.titulo,
            capitulo: itemClicked.dataset.capitulo,
            seccion: itemClicked.dataset.seccion
        };

        // Actualizamos el estilo del item activo
        document.querySelectorAll('.nav-item.active-nav').forEach(el => el.classList.remove('active-nav'));
        itemClicked.classList.add('active-nav');
        
        // Llamamos a la función para que filtre y renderice el contenido
        aplicarFiltrosYRenderizar();

        // --- MEJORA AÑADIDA PARA MÓVILES ---
        // Si estamos en una pantalla pequeña, cerramos la barra lateral después de hacer clic en un filtro.
        if (window.innerWidth <= 900) {
            document.body.classList.remove('sidebar-visible');
        }
    }
});

contentContainer.addEventListener('click', function(event) {
    const cardHeader = event.target.closest('.card-header');
    if (cardHeader) cardHeader.closest('.delito-card').classList.toggle('expanded');
});

filtroGravedadSelect.addEventListener('change', aplicarFiltrosYRenderizar);
// --- AÑADE ESTO ANTES DE LA INICIALIZACIÓN EN SCRIPT.JS ---

// --- MANEJO DE LA INTERFAZ MÓVIL ---
const menuToggleBtn = document.getElementById('menu-toggle-btn');
const backdrop = document.getElementById('backdrop');
const body = document.body;

menuToggleBtn.addEventListener('click', () => {
    body.classList.toggle('sidebar-visible');
});

backdrop.addEventListener('click', () => {
    body.classList.remove('sidebar-visible');
});

// --- INICIALIZACIÓN ---
document.addEventListener("DOMContentLoaded", () => {
    fetch('delitos.json')
        .then(response => response.ok ? response.json() : Promise.reject(response.statusText))
        .then(data => {
            delitos = data;
            buildSidebar();
            aplicarFiltrosYRenderizar();
        })
        .catch(error => {
            console.error('Error al cargar o procesar el archivo de delitos:', error);
            contentContainer.innerHTML = `<p style="text-align:center; color: var(--color-accent-red);">Error: No se pudo cargar la base de datos.</p>`;
        });
});