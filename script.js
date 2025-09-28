// --- DICCIONARIOS ---
const DICCIONARIO_TITULOS = {
    6: "Título VI: Delitos contra la libertad",
    13: "Título XIII: Delitos contra el patrimonio",
    17: "Título XVII: Delitos contra la seguridad colectiva"
};
const DICCIONARIO_CAPITULOS = {
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

// --- FUNCIONES AUXILIARES (Lógica de negocio, sin cambios) ---
const BAREMOS_PENAS_EN_DIAS = { "Prisión": { leve_max: 0, menos_grave_max: 1825 }, "Multa": { leve_max: 90, menos_grave_max: Infinity }, "Trabajos en beneficio de la comunidad": { leve_max: 30, menos_grave_max: 365 }, "Privación del derecho a conducir": { leve_max: 365, menos_grave_max: 2920 }, "Privación del derecho a la tenencia de armas": {leve_max: 365, menos_grave_max: 2930 } };
function convertirADias(d) { if (!d) return 0; return (d.años * 365) + (d.meses * 30) + (d.dias || 0); }
function clasificarPenaIndividual(p) { const { tipo: t, durMin: min, durMax: max } = p; const b = BAREMOS_PENAS_EN_DIAS[t]; if (!b) return "No clasificada"; const minD = convertirADias(min); const maxD = convertirADias(max); if (maxD > b.menos_grave_max && minD <= b.menos_grave_max) return "Grave"; if (maxD > b.leve_max && minD <= b.leve_max) return "Leve"; if (maxD > b.menos_grave_max) return "Grave"; if (maxD > b.leve_max) return "Menos grave"; return "Leve"; }
function determinarGravedadGeneral(d) { const penas = [...d.opcionesDePena.flat(), ...d.penasObligatorias]; if (penas.length === 0) return "No clasificada"; const clasif = penas.map(p => clasificarPenaIndividual(p)); if (clasif.includes("Leve")) return "Leve"; if (clasif.includes("Grave")) return "Grave"; return "Menos grave"; }
function formatearDuracion(d) { if (!d) return "N/A"; const p = []; if (d.años > 0) p.push(`${d.años} año${d.años !== 1 ? 's' : ''}`); if (d.meses > 0) p.push(`${d.meses} mes${d.meses !== 1 ? 'es' : ''}`); if (d.dias > 0) p.push(`${d.dias} día${d.dias !== 1 ? 's' : ''}`); return p.length > 0 ? p.join(' y ') : "N/A"; }
function getIconForPena(t) { /* Tu función de iconos aquí */ return `<svg class="pena-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10,10-4.48,10-10S17.52,2,12,2z M13,17h-2v-2h2V17z M13,13h-2V7h2V13z"/></svg>`; }
function formatearPenasDelito(d) { const op = d.opcionesDePena.map(o => o.map(p => `<div class="pena-detalle">${getIconForPena(p.tipo)}<div><strong>${p.tipo}</strong><br><span>de ${formatearDuracion(p.durMin)} a ${formatearDuracion(p.durMax)}</span></div></div>`).join('<div class="operador-y">Y</div>')).join('<div class="operador-o">O</div>'); const ob = d.penasObligatorias.map(p => `<div class="pena-detalle">${getIconForPena(p.tipo)}<div><strong>${p.tipo}</strong><br><span>de ${formatearDuracion(p.durMin)} a ${formatearDuracion(p.durMax)}</span></div></div>`).join('<div class="operador-y">Y</div>'); let r = ''; if (op) r += op; if (ob) { r += r ? `<div class="penas-obligatorias"><strong>Y (en todo caso)</strong>${ob}</div>` : ob; } return r || 'No especificado'; }
function agruparDelitos(delitosParaAgrupar) { const grupos = {}; delitosParaAgrupar.forEach(d => { const { titulo, capitulo, seccion, subseccion } = d.clasificacion; const t = titulo || placeholder; const c = capitulo || placeholder; const s = seccion || placeholder; const ss = subseccion || placeholder; if (!grupos[t]) grupos[t] = {}; if (!grupos[t][c]) grupos[t][c] = {}; if (!grupos[t][c][s]) grupos[t][c][s] = {}; if (!grupos[t][c][s][ss]) grupos[t][c][s][ss] = []; grupos[t][c][s][ss].push(d); }); return grupos; }

// --- LÓGICA DE LA APLICACIÓN (REESCRITA) ---

/**
 * Construye el menú jerárquico completo en la sidebar.
 */
// REEMPLAZA TU FUNCIÓN buildSidebar CON ESTA
function buildSidebar() {
    sidebarContainer.innerHTML = '<h1>Índice</h1><ul id="navigation-tree"></ul>';
    const treeContainer = document.getElementById('navigation-tree');
    const grupos = agruparDelitos(delitos);
    let html = `<li><span class="nav-item nav-titulo active-nav" data-filter-level="all">Ver Todos</span></li>`;
    const iconHTML = `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>`;

    Object.keys(grupos).sort((a, b) => a - b).forEach(tituloKey => {
        if (tituloKey === placeholder) return;
        let capitulosHTML = '';
        Object.keys(grupos[tituloKey]).sort((a, b) => a - b).forEach(capituloKey => {
            if (capituloKey === placeholder) return;
            let seccionesHTML = '';
            Object.keys(grupos[tituloKey][capituloKey]).sort((a, b) => a - b).forEach(seccionKey => {
                if (seccionKey === placeholder) return;
                // Lógica de subsecciones (si se añaden en el futuro) iría aquí
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

/**
 * Renderiza una lista plana de tarjetas de delito.
 */
function renderDelitos(delitosAMostrar) {
    contentContainer.innerHTML = "";
    if (delitosAMostrar.length === 0) {
        contentContainer.innerHTML = `<p style="text-align:center; font-size: 1.2em; color: var(--color-muted-text);">No hay delitos que coincidan con los filtros seleccionados.</p>`;
        return;
    }
    delitosAMostrar.forEach(d => {
        const gravedad = determinarGravedadGeneral(d);
        const gravedadClass = gravedad.toLowerCase().replace(" ", "-");
        const card = document.createElement("div");
        card.className = `delito-card ${gravedadClass}`;
        const nombreTitulo = DICCIONARIO_TITULOS[d.clasificacion.titulo] || `Título ${d.clasificacion.titulo}`;
        const nombreCapitulo = DICCIONARIO_CAPITULOS[d.clasificacion.capitulo] || `Capítulo ${d.clasificacion.capitulo}`;
        card.innerHTML = `<div class="card-header"><div class="info-principal"><span class="articulo">${d.articulo}</span><h4>${d.nombre}</h4></div><div style="display: flex; align-items: center;"><div class="gravedad-badge ${gravedadClass}">${gravedad}</div><svg class="expand-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="9 18 15 12 9 6"></polyline></svg></div></div><div class="card-collapsible-content"><div class="card-body"><div class="descripcion"><h5>Descripción de la conducta</h5><p>${d.descripcion}</p></div><div class="penas-aplicables"><h5>Penas Aplicables</h5>${formatearPenasDelito(d)}</div></div><div class="card-footer"><div class="clasificacion-ruta"><strong>Clasificación:</strong> ${nombreTitulo} > ${nombreCapitulo}</div><div class="info-denuncia"><strong>Persecución:</strong> ${d.requiereDenuncia ? 'Requiere denuncia' : 'De oficio'}</div></div></div>`;
        contentContainer.appendChild(card);
    });
}

/**
 * Aplica los filtros activos y vuelve a renderizar el contenido.
 */
function aplicarFiltrosYRenderizar() {
    const filtroGrav = filtroGravedadSelect.value;
    let delitosResultantes = delitos;

    // Desestructuramos el objeto del filtro activo
    const { level, value, titulo, capitulo, seccion } = filtroActivoSidebar;

    if (level !== 'all') {
        delitosResultantes = delitosResultantes.filter(d => {
            // Cada nivel de filtro comprueba también a sus padres para ser preciso
            if (level === 'titulo') {
                return d.clasificacion.titulo === parseInt(value);
            }
            if (level === 'capitulo') {
                return d.clasificacion.titulo === parseInt(titulo) && 
                       d.clasificacion.capitulo === parseInt(value);
            }
            if (level === 'seccion') {
                return d.clasificacion.titulo === parseInt(titulo) && 
                       d.clasificacion.capitulo === parseInt(capitulo) && 
                       d.clasificacion.seccion === parseInt(value);
            }
            // Lógica para subsección iría aquí
            return true;
        });
    }

    // El filtro de gravedad se aplica sobre el resultado anterior
    if (filtroGrav) {
        delitosResultantes = delitosResultantes.filter(d => 
            determinarGravedadGeneral(d) === filtroGrav
        );
    }
    renderDelitos(delitosResultantes);
}

// --- MANEJO DE EVENTOS ---
sidebarContainer.addEventListener('click', function(event) {
    const iconClicked = event.target.closest('.nav-icon');
    const itemClicked = event.target.closest('.nav-item');
    if (!itemClicked) return;

    if (iconClicked) {
        itemClicked.classList.toggle('expanded');
        return;
    }
    
    // Capturamos todos los data-attributes del elemento clicado
    filtroActivoSidebar = { ...itemClicked.dataset };

    document.querySelectorAll('.nav-item.active-nav').forEach(el => el.classList.remove('active-nav'));
    itemClicked.classList.add('active-nav');
    
    aplicarFiltrosYRenderizar();
});

contentContainer.addEventListener('click', function(event) {
    const cardHeader = event.target.closest('.card-header');
    if (cardHeader) cardHeader.closest('.delito-card').classList.toggle('expanded');
});

filtroGravedadSelect.addEventListener('change', aplicarFiltrosYRenderizar);

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