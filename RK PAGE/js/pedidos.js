// ============================================================
// pedidos.js — Carrito, toma de pedidos, borradores y pedidos activos
// Depende de: storage.js, menu.js, app.js (renderizarTodo)
// ============================================================

// --- Estado del carrito y modal mitad y mitad ---
let carrito   = [];
let mitadPaso = 1;
let mitad1    = null;
let mitad2    = null;

// Sincroniza el array pedidos desde localStorage antes de cualquier escritura.
// Evita que index.html sobreescriba cambios de estado hechos por cocina.html
// (ej: Pendiente → Preparando) que solo existen en localStorage.
function sincronizarPedidos() {
    pedidos = JSON.parse(localStorage.getItem('pizza_pedidos')) || [];
}

// ============================================================
// MODAL MITAD Y MITAD
// ============================================================

function abrirModalMitad() {
    mitadPaso = 1;
    mitad1    = null;
    mitad2    = null;
    renderizarModalMitad();
    document.getElementById('modal-mitad').classList.add('activo');
}

function cerrarModalMitad() {
    document.getElementById('modal-mitad').classList.remove('activo');
    mitadPaso = 1;
    mitad1    = null;
    mitad2    = null;
}

function renderizarModalMitad() {
    const titulo      = document.getElementById('modal-mitad-titulo');
    const subtitulo   = document.getElementById('modal-mitad-subtitulo');
    const lista       = document.getElementById('modal-lista-pizzas');
    const btnConfirmar = document.getElementById('btn-confirmar-mitad');

    const pizzas = productos.filter(p => p.categoria === 'Pizzas');

    if (mitadPaso === 1) {
        titulo.textContent    = '🍕 Mitad y Mitad';
        subtitulo.textContent = 'Elegí la PRIMERA mitad';
        btnConfirmar.textContent = 'Siguiente →';
        btnConfirmar.disabled = !mitad1;
    } else {
        subtitulo.innerHTML = `Primera mitad: <strong>${mitad1.nombre}</strong><br>Elegí la SEGUNDA mitad`;
        btnConfirmar.textContent = 'Agregar al pedido ✔';
        btnConfirmar.disabled = !mitad2;
    }

    lista.innerHTML = '';
    pizzas.forEach(p => {
        const div = document.createElement('div');
        div.className = 'opcion-pizza';
        const seleccionada = (mitadPaso === 1 && mitad1 && mitad1.id === p.id) ||
                             (mitadPaso === 2 && mitad2 && mitad2.id === p.id);
        if (seleccionada) div.classList.add('seleccionada');
        div.innerHTML = `<span class="piz-nombre">${p.nombre}</span><span class="piz-precio">$${p.precio.toLocaleString('es-AR')}</span>`;
        div.onclick = () => {
            if (mitadPaso === 1) { mitad1 = p; }
            else                 { mitad2 = p; }
            renderizarModalMitad();
        };
        lista.appendChild(div);
    });
}

function confirmarMitad() {
    if (mitadPaso === 1) {
        if (!mitad1) return;
        mitadPaso = 2;
        mitad2    = null;
        renderizarModalMitad();
        return;
    }
    // Paso 2: construir el item compuesto
    if (!mitad1 || !mitad2) return;

    const precioFinal    = Math.max(mitad1.precio, mitad2.precio);
    const nombreCombinado = `½ ${mitad1.nombre} / ½ ${mitad2.nombre}`;
    const productoMitad  = {
        id:        'MITAD-' + Date.now(),
        nombre:    nombreCombinado,
        categoria: 'Pizzas',
        precio:    precioFinal,
        esMitad:   true,
        mitad1:    mitad1.nombre,
        mitad2:    mitad2.nombre
    };
    agregarAlCarrito(productoMitad);
    cerrarModalMitad();
}

// ============================================================
// CARRITO
// ============================================================

function agregarAlCarrito(producto) {
    if (producto.esMitad) {
        carrito.push({
            productoId: producto.id,
            nombre:     producto.nombre,
            precio:     producto.precio,
            cantidad:   1,
            categoria:  'Pizzas',
            esMitad:    true,
            mitad1:     producto.mitad1,
            mitad2:     producto.mitad2
        });
    } else {
        const itemExistente = carrito.find(item => item.productoId === producto.id);
        if (itemExistente) {
            itemExistente.cantidad++;
        } else {
            carrito.push({
                productoId: producto.id,
                nombre:     producto.nombre,
                precio:     producto.precio,
                cantidad:   1,
                categoria:  producto.categoria
            });
        }
    }
    renderizarCarrito();
}

function cambiarCantidadCarrito(idx, delta) {
    carrito[idx].cantidad += delta;
    if (carrito[idx].cantidad <= 0) {
        carrito.splice(idx, 1);
    }
    renderizarCarrito();
}

function renderizarCarrito() {
    const contenedor = document.getElementById('carrito-items');
    const totalTxt   = document.getElementById('carrito-total');
    if (!contenedor) return;

    contenedor.innerHTML = '';

    if (carrito.length === 0) {
        contenedor.innerHTML = `<p style="text-align:center; color:var(--texto-secundario); padding:20px;">El pedido está vacío.</p>`;
        if (totalTxt) totalTxt.innerText = '$0';
        return;
    }

    let totalCalculado = 0;

    carrito.forEach((item, idx) => {
        const subtotal = item.precio * item.cantidad;
        totalCalculado += subtotal;

        const linea = document.createElement('div');
        linea.className = 'item-linea';
        linea.innerHTML = `
            <span style="flex:1; font-size:14px;">${item.nombre}</span>
            <div class="item-controles">
                <button class="btn-cant" onclick="cambiarCantidadCarrito(${idx}, -1)">−</button>
                <span class="cant-numero">${item.cantidad}</span>
                <button class="btn-cant" onclick="cambiarCantidadCarrito(${idx}, 1)">+</button>
                <span style="min-width:80px; text-align:right; font-size:14px;">$${subtotal.toLocaleString('es-AR')}</span>
            </div>`;
        contenedor.appendChild(linea);
    });

    // Delivery: mostrar en la lista y sumar al total si no está ya en el carrito
    const modalidadSel = document.getElementById('pedido-modalidad');
    if (modalidadSel && modalidadSel.value === 'Delivery') {
        const prodDelivery = productos.find(p => p.categoria === 'Servicios' && p.nombre === 'Delivery');
        if (prodDelivery) {
            const yaEnCarrito = carrito.find(i => i.productoId === prodDelivery.id);
            if (!yaEnCarrito) {
                totalCalculado += prodDelivery.precio;
                const lineaDelivery = document.createElement('div');
                lineaDelivery.className = 'item-linea';
                lineaDelivery.style.cssText = 'border-left:3px solid #9C0000;';
                lineaDelivery.innerHTML = `
                    <span style="flex:1; font-size:13px;">🛵 Delivery</span>
                    <span style="font-size:13px; font-weight:bold;">$${prodDelivery.precio.toLocaleString('es-AR')}</span>`;
                contenedor.appendChild(lineaDelivery);
            }
        }
    }

    if (totalTxt) totalTxt.innerText = `$${totalCalculado.toLocaleString('es-AR')}`;
}

// ============================================================
// CONFIRMAR PEDIDO
// ============================================================

function confirmarPedido() {
    sincronizarPedidos();
    const nombreCliente = document.getElementById('cliente-nombre').value.trim();
    const modalidad     = document.getElementById('pedido-modalidad').value;
    const formaPago     = document.getElementById('pedido-pago').value;
    const idEdicion     = document.getElementById('editando-pedido-id').value;

    if (!nombreCliente) {
        alert('Por favor, ingresá el nombre del cliente.');
        return;
    }
    if (carrito.length === 0) {
        alert('El pedido debe contener al menos un producto.');
        return;
    }

    let totalPedido  = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    let carritoFinal = [...carrito];

    if (modalidad === 'Delivery') {
        const prodDelivery = productos.find(p => p.categoria === 'Servicios' && p.nombre === 'Delivery');
        if (prodDelivery) {
            const yaIncluido = carritoFinal.find(i => i.productoId === prodDelivery.id);
            if (!yaIncluido) {
                carritoFinal.push({ productoId: prodDelivery.id, nombre: 'Delivery', precio: prodDelivery.precio, cantidad: 1, categoria: 'Servicios' });
                totalPedido += prodDelivery.precio;
            }
        }
    }

    if (idEdicion) {
        const index = pedidos.findIndex(p => p.id === idEdicion);
        if (index !== -1) {
            pedidos[index].cliente   = nombreCliente;
            pedidos[index].modalidad = modalidad;
            pedidos[index].formaPago = formaPago;
            pedidos[index].items     = carritoFinal;
            pedidos[index].total     = totalPedido;

            // Si era un Borrador, convertirlo a Pendiente asignando código y hora
            if (pedidos[index].estado === 'Borrador') {
                const numeroFormateado = 'P' + proximoNumeroPedido.toString().padStart(3, '0');
                const _ahora = new Date();
                pedidos[index].codigo        = numeroFormateado;
                pedidos[index].estado        = 'Pendiente';
                pedidos[index].horaEntrada   = _ahora.toTimeString().slice(0, 5);
                pedidos[index].horaEntradaMs = _ahora.getTime();
                proximoNumeroPedido++;
            }
        }
        cancelarEdicion();
    } else {
        const numeroFormateado = 'P' + proximoNumeroPedido.toString().padStart(3, '0');
        const _ahora = new Date();
        const nuevoPedido = {
            id:           'PED-' + Date.now(),
            codigo:       numeroFormateado,
            cliente:      nombreCliente,
            modalidad:    modalidad,
            formaPago:    formaPago,
            items:        carritoFinal,
            total:        totalPedido,
            estado:       'Pendiente',
            horaEntrada:  _ahora.toTimeString().slice(0, 5),
            horaEntradaMs: _ahora.getTime(),
            horaSalida:   null,
            horaSalidaMs: null
        };
        pedidos.push(nuevoPedido);
        proximoNumeroPedido++;
    }

    guardarPedidosEnStorage();
    limpiarFormularioPedido();
    renderizarTodo();
}

// ============================================================
// GUARDAR COMO BORRADOR
// ============================================================

function guardarBorrador() {
    if (carrito.length === 0) {
        alert('El pedido está vacío. Agregá al menos un producto antes de guardar el borrador.');
        return;
    }

    sincronizarPedidos();
    const nombreCliente = document.getElementById('cliente-nombre').value.trim();
    const modalidad     = document.getElementById('pedido-modalidad').value;
    const formaPago     = document.getElementById('pedido-pago').value;
    const idEdicion     = document.getElementById('editando-pedido-id').value;

    // Calcular total real incluyendo delivery si corresponde
    let itemsFinal = [...carrito];
    let totalCarrito = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    if (modalidad === 'Delivery') {
        const prodDelivery = productos.find(p => p.categoria === 'Servicios' && p.nombre === 'Delivery');
        if (prodDelivery && !itemsFinal.find(i => i.productoId === prodDelivery.id)) {
            itemsFinal.push({ productoId: prodDelivery.id, nombre: 'Delivery', precio: prodDelivery.precio, cantidad: 1, categoria: 'Servicios' });
            totalCarrito += prodDelivery.precio;
        }
    }

    if (idEdicion) {
        const index = pedidos.findIndex(p => p.id === idEdicion);
        if (index !== -1 && pedidos[index].estado === 'Borrador') {
            pedidos[index].cliente   = nombreCliente || 'Sin confirmar';
            pedidos[index].modalidad = modalidad;
            pedidos[index].formaPago = formaPago;
            pedidos[index].items     = itemsFinal;
            pedidos[index].total     = totalCarrito;
        }
    } else {
        const nuevoBorrador = {
            id:           'PED-' + Date.now(),
            codigo:       null,
            cliente:      nombreCliente || 'Sin confirmar',
            modalidad:    modalidad,
            formaPago:    formaPago,
            items:        itemsFinal,
            total:        totalCarrito,
            estado:       'Borrador',
            horaEntrada:  null,
            horaEntradaMs: null,
            horaSalida:   null,
            horaSalidaMs: null
        };
        pedidos.push(nuevoBorrador);
    }

    guardarPedidosEnStorage();
    limpiarFormularioPedido();
    renderizarTodo();
}

// Confirmar borrador directamente (sin pasar por el formulario de edición)
function confirmarDesdeBorrador(id) {
    sincronizarPedidos();
    const index = pedidos.findIndex(p => p.id === id);
    if (index === -1) return;

    const p = pedidos[index];
    if (p.cliente === 'Sin confirmar') {
        if (!confirm('Este borrador no tiene nombre de cliente. ¿Confirmarlo de todas formas?')) return;
    }

    const numeroFormateado = 'P' + proximoNumeroPedido.toString().padStart(3, '0');
    const _ahora = new Date();
    pedidos[index].codigo        = numeroFormateado;
    pedidos[index].estado        = 'Pendiente';
    pedidos[index].horaEntrada   = _ahora.toTimeString().slice(0, 5);
    pedidos[index].horaEntradaMs = _ahora.getTime();
    proximoNumeroPedido++;

    guardarPedidosEnStorage();
    renderizarTodo();
}

// ============================================================
// FORMULARIO
// ============================================================

function limpiarFormularioPedido() {
    document.getElementById('cliente-nombre').value      = '';
    document.getElementById('pedido-modalidad').value    = 'Delivery';
    document.getElementById('pedido-pago').value         = 'Efectivo';
    document.getElementById('editando-pedido-id').value  = '';
    document.getElementById('titulo-pedido-actual').innerText = 'Nuevo Pedido';
    document.getElementById('btn-confirmar-pedido').innerText = 'Confirmar Pedido';
    document.getElementById('btn-cancelar-edicion').classList.add('oculto');
    carrito = [];
    renderizarCarrito();
}

// ============================================================
// PEDIDOS ACTIVOS (Módulo 3)
// ============================================================

function renderizarBorradores() {
    const seccion    = document.getElementById('seccion-borradores');
    const contenedor = document.getElementById('contenedor-borradores');
    if (!seccion || !contenedor) return;

    const borradores = pedidos.filter(p => p.estado === 'Borrador');

    if (borradores.length === 0) {
        seccion.classList.add('oculto');
        return;
    }

    seccion.classList.remove('oculto');
    contenedor.innerHTML = '';

    borradores.forEach(p => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta-pedido borrador';

        const badgeMod     = p.modalidad === 'Delivery'
            ? '<span class="badge delivery">🚀 Delivery</span>'
            : '<span class="badge retiro">🛍️ Retiro</span>';
        const detalleTexto = p.items.length > 0
            ? p.items.map(i => `${i.cantidad}x ${i.nombre}`).join(', ')
            : 'Sin productos';

        tarjeta.innerHTML = `
            <div class="tarjeta-encabezado">
                <span>📝 ${p.cliente}</span>
                <span>$${p.total.toLocaleString('es-AR')}</span>
            </div>
            <div class="tarjeta-detalles">
                <div style="margin-bottom:8px; display:flex; gap:5px;">${badgeMod}</div>
                <p style="color:var(--texto-secundario); font-size:13px;">${detalleTexto}</p>
                <p style="margin-top:5px; font-size:12px; font-weight:bold; color:#C0956B;">BORRADOR — Sin confirmar</p>
            </div>
            <div class="tarjeta-acciones" style="grid-template-columns: repeat(3,1fr);">
                <button class="btn-tarjeta btn-info" onclick="iniciarEdicionPedido('${p.id}')">✏️ Editar</button>
                <button class="btn-tarjeta btn-agregar" onclick="confirmarDesdeBorrador('${p.id}')">✅ Confirmar</button>
                <button class="btn-tarjeta btn-cancelar" onclick="cancelarPedido('${p.id}')">🗑️ Descartar</button>
            </div>`;
        contenedor.appendChild(tarjeta);
    });
}

function renderizarPedidosActivos() {
    const contenedor = document.getElementById('contenedor-pedidos-activos');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    renderizarBorradores();

    const coloresEstado = {
        'Pendiente':  'var(--primario)',
        'Preparando': '#FF9800',
        'Listo':      '#00BCD4',
        'Entregado':  'var(--exito)',
        'Cancelado':  'var(--peligro)'
    };

    const pedidosVisibles = pedidos.filter(p => p.estado !== 'Cancelado' && p.estado !== 'Borrador');

    if (pedidosVisibles.length === 0) {
        contenedor.innerHTML = `<p style="color:var(--texto-secundario); padding:10px;">No hay pedidos activos actualmente.</p>`;
        return;
    }

    const pedidosOrdenados = [...pedidosVisibles].reverse();
    pedidosOrdenados.forEach(p => {
        const tarjeta = document.createElement('div');
        tarjeta.className = `tarjeta-pedido ${p.estado.toLowerCase()}`;

        const badgeMod  = p.modalidad === 'Delivery'
            ? '<span class="badge delivery">🚀 Delivery</span>'
            : '<span class="badge retiro">🛍️ Retiro</span>';
        const badgePago = p.formaPago === 'Efectivo'
            ? '<span class="badge efectivo">💵 Efec</span>'
            : '<span class="badge transferencia">📱 Transf</span>';

        const detalleTexto = p.items.map(i => `${i.cantidad}x ${i.nombre}`).join(', ');
        const _horaTag     = p.horaEntrada
            ? ` <span style="font-size:11px;color:var(--texto-secundario);">⏱ ${p.horaEntrada}</span>`
            : '';

        const colorEstado  = coloresEstado[p.estado] || 'var(--texto-secundario)';
        const puedeEntregar = ['Pendiente', 'Preparando', 'Listo'].includes(p.estado);
        const botonEntregar = puedeEntregar
            ? `<button class="btn-tarjeta btn-agregar" onclick="marcarEntregado('${p.id}')">⚡Entregar</button>`
            : `<span style="text-align:center; color:var(--exito); align-self:center; font-size:12px;">✓ Pagado</span>`;

        tarjeta.innerHTML = `
            <div class="tarjeta-encabezado">
                <span>${p.codigo} - ${p.cliente}${_horaTag}</span>
                <span>$${p.total.toLocaleString('es-AR')}</span>
            </div>
            <div class="tarjeta-detalles">
                <div style="margin-bottom:8px; display:flex; gap:5px;">${badgeMod} ${badgePago}</div>
                <p style="color:var(--texto-secundario); font-size:13px;">${detalleTexto}</p>
                <p style="margin-top:5px; font-size:12px; font-weight:bold; color:${colorEstado}">Estado: ${p.estado.toUpperCase()}</p>
            </div>
            <div class="tarjeta-acciones" style="grid-template-columns: repeat(4, 1fr);">
                ${botonEntregar}
                <button class="btn-tarjeta btn-info" onclick="iniciarEdicionPedido('${p.id}')">✏️ Editar</button>
                <button class="btn-tarjeta" style="background:#5B3421; color:#f5f5f5; font-size:11px;" onclick="editarHorariosPedido('${p.id}')">⏱ Horarios</button>
                <button class="btn-tarjeta btn-cancelar" onclick="cancelarPedido('${p.id}')">❌ Cancelar</button>
            </div>`;
        contenedor.appendChild(tarjeta);
    });
}

function marcarEntregado(id) {
    sincronizarPedidos();
    const index = pedidos.findIndex(p => p.id === id);
    if (index !== -1) {
        const _sal = new Date();
        pedidos[index].estado        = 'Entregado';
        pedidos[index].horaSalida    = _sal.toTimeString().slice(0, 5);
        pedidos[index].horaSalidaMs  = _sal.getTime();
        guardarPedidosEnStorage();
        renderizarTodo();
    }
}

function cancelarPedido(id) {
    sincronizarPedidos();
    const esBorrador = pedidos.find(p => p.id === id)?.estado === 'Borrador';
    const msg = esBorrador
        ? '¿Descartar este borrador? Se eliminará sin afectar el balance.'
        : '¿Estás seguro de que deseas CANCELAR este pedido? Se removerá de las cajas activas y totales.';
    if (confirm(msg)) {
        const index = pedidos.findIndex(p => p.id === id);
        if (index !== -1) {
            pedidos[index].estado = 'Cancelado';
            guardarPedidosEnStorage();
            renderizarTodo();
        }
    }
}

function iniciarEdicionPedido(id) {
    const pedido = pedidos.find(p => p.id === id);
    if (!pedido) return;

    document.getElementById('titulo-pedido-actual').innerText   = pedido.estado === 'Borrador'
        ? `Editando Borrador — ${pedido.cliente}`
        : `Editando Pedido ${pedido.codigo}`;
    document.getElementById('editando-pedido-id').value         = pedido.id;
    document.getElementById('cliente-nombre').value             = pedido.cliente === 'Sin confirmar' ? '' : pedido.cliente;
    document.getElementById('pedido-modalidad').value           = pedido.modalidad;
    document.getElementById('pedido-pago').value                = pedido.formaPago;
    document.getElementById('btn-confirmar-pedido').innerText   = pedido.estado === 'Borrador'
        ? 'Confirmar Pedido'
        : 'Guardar Cambios';
    document.getElementById('btn-cancelar-edicion').classList.remove('oculto');

    carrito = [...pedido.items];
    renderizarCarrito();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelarEdicion() {
    limpiarFormularioPedido();
}

function editarHorariosPedido(id) {
    sincronizarPedidos();
    const p = pedidos.find(x => x.id === id);
    if (!p) return;

    const entradaActual = p.horaEntrada || '';
    const salidaActual  = p.horaSalida  || '';
    const nuevaEntrada  = prompt(`Pedido ${p.codigo} — Hora de ENTRADA (HH:MM):\n(Dejar vacío para no cambiar)`, entradaActual);
    if (nuevaEntrada === null) return;
    const nuevaSalida   = prompt(`Pedido ${p.codigo} — Hora de SALIDA/ENTREGA (HH:MM):\n(Dejar vacío para no cambiar)`, salidaActual);
    if (nuevaSalida === null) return;

    const validarHora = h => /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(h.trim());

    const index = pedidos.findIndex(x => x.id === id);
    if (index === -1) return;

    if (nuevaEntrada.trim() !== '') {
        if (!validarHora(nuevaEntrada)) { alert('Hora de entrada inválida. Usá el formato HH:MM.'); return; }
        const [hh, mm] = nuevaEntrada.trim().split(':').map(Number);
        const base = new Date();
        base.setHours(hh, mm, 0, 0);
        pedidos[index].horaEntrada   = nuevaEntrada.trim();
        pedidos[index].horaEntradaMs = base.getTime();
    }
    if (nuevaSalida.trim() !== '') {
        if (!validarHora(nuevaSalida)) { alert('Hora de salida inválida. Usá el formato HH:MM.'); return; }
        const [hh2, mm2] = nuevaSalida.trim().split(':').map(Number);
        const base2 = new Date();
        base2.setHours(hh2, mm2, 0, 0);
        pedidos[index].horaSalida   = nuevaSalida.trim();
        pedidos[index].horaSalidaMs = base2.getTime();
    }

    guardarPedidosEnStorage();
    renderizarTodo();
}
