// ============================================================
// cocina.js — Módulo de cocina
// Lee pedidos del localStorage compartido con index.html
// Depende de: storage.js
// ============================================================

let intervaloRefresh = null;

document.addEventListener('DOMContentLoaded', () => {
    renderizarCocina();
    iniciarReloj();
    // Auto-refresh cada 3 segundos para sensación de tiempo real
    intervaloRefresh = setInterval(renderizarCocina, 3000);
});

// Recarga los pedidos desde localStorage (por si index.html actualizó)
function recargarPedidos() {
    pedidos = JSON.parse(localStorage.getItem('pizza_pedidos')) || [];
}

function renderizarCocina() {
    recargarPedidos();

    const contenedor = document.getElementById('contenedor-cocina');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    // Cocina solo ve Pendiente y Preparando (Borrador y Listo no se muestran aquí)
    const pedidosCocina = pedidos
        .filter(p => p.estado === 'Pendiente' || p.estado === 'Preparando')
        .sort((a, b) => (a.horaEntradaMs || 0) - (b.horaEntradaMs || 0)); // FIFO

    // Actualizar contadores en el header
    const cntPendiente  = pedidos.filter(p => p.estado === 'Pendiente').length;
    const cntPreparando = pedidos.filter(p => p.estado === 'Preparando').length;
    const elPend  = document.getElementById('cnt-pendientes');
    const elPrep  = document.getElementById('cnt-preparando');
    if (elPend)  elPend.textContent  = cntPendiente  + ' pendiente'  + (cntPendiente  !== 1 ? 's' : '');
    if (elPrep)  elPrep.textContent  = cntPreparando + ' preparando' + (cntPreparando !== 1 ? '' : '');

    if (pedidosCocina.length === 0) {
        contenedor.innerHTML = `
            <div class="cocina-vacia">
                <span class="icono">✅</span>
                No hay pedidos pendientes.<br>
                <small style="font-size:16px; color:var(--texto-secundario);">La cocina está al día.</small>
            </div>`;
        return;
    }

    pedidosCocina.forEach(p => {
        const tarjeta = document.createElement('div');
        tarjeta.className = `tarjeta-cocina ${p.estado.toLowerCase()}`;

        const badgeMod = p.modalidad === 'Delivery'
            ? '<span class="cocina-badge delivery">🚀 Delivery</span>'
            : '<span class="cocina-badge retiro">🛍️ Retiro</span>';

        // Separar pizzas de extras (todo lo que no es pizza ni servicio)
        const pizzas  = p.items.filter(i => i.categoria === 'Pizzas');
        const extras  = p.items.filter(i => i.categoria !== 'Pizzas' && i.categoria !== 'Servicios');

        const pizzasHTML = pizzas.map(i => `
            <div class="item-cocina pizza">
                <span class="cant">${i.cantidad}x</span>${i.nombre}
            </div>`).join('');

        const extrasHTML = extras.length > 0
            ? `<div class="cocina-extras-titulo">+ Extras</div>` +
              extras.map(i => `<div class="item-cocina extra"><span class="cant">${i.cantidad}x</span>${i.nombre}</div>`).join('')
            : '';

        // Tiempo transcurrido desde entrada
        let tiempoHTML = '';
        if (p.horaEntradaMs) {
            const mins = Math.round((Date.now() - p.horaEntradaMs) / 60000);
            const alerta = mins >= 20 ? ' alerta' : '';
            tiempoHTML = `<div class="cocina-tiempo${alerta}">⏱ Hace ${mins} min</div>`;
        }

        const btnAccion = p.estado === 'Pendiente'
            ? `<button class="btn-cocina btn-preparando" onclick="pasarAPreparando('${p.id}')">🔥 Empezar a Preparar</button>`
            : `<button class="btn-cocina btn-listo" onclick="pasarAListo('${p.id}')">✅ Listo para Entregar</button>`;

        tarjeta.innerHTML = `
            <div class="cocina-card-header">
                <span class="cocina-codigo">${p.codigo || '—'}</span>
                ${badgeMod}
            </div>
            <div class="cocina-cliente-nombre">${p.cliente}</div>
            ${tiempoHTML}
            <div class="cocina-items">
                ${pizzasHTML || '<em style="color:var(--texto-secundario); font-size:16px;">Sin pizzas</em>'}
                ${extrasHTML}
            </div>
            ${btnAccion}`;

        contenedor.appendChild(tarjeta);
    });
}

function pasarAPreparando(id) {
    recargarPedidos();
    const index = pedidos.findIndex(p => p.id === id);
    if (index !== -1 && pedidos[index].estado === 'Pendiente') {
        pedidos[index].estado = 'Preparando';
        guardarPedidosEnStorage();
    }
    renderizarCocina();
}

function pasarAListo(id) {
    recargarPedidos();
    const index = pedidos.findIndex(p => p.id === id);
    if (index !== -1 && pedidos[index].estado === 'Preparando') {
        pedidos[index].estado = 'Listo';
        guardarPedidosEnStorage();
    }
    renderizarCocina();
}

// Reloj en tiempo real en el header de cocina
function iniciarReloj() {
    const el = document.getElementById('cocina-reloj');
    if (!el) return;
    const actualizar = () => {
        el.textContent = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };
    actualizar();
    setInterval(actualizar, 1000);
}
