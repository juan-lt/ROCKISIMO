// ============================================================
// balance.js — Resumen del turno, estadísticas y cierre
// Depende de: storage.js
// ============================================================

function calcularYRenderizarBalance() {
    // BUG FIX: usar getFechaTurno() en lugar de new Date()
    // La jornada empieza ~21hs y puede terminar después de medianoche;
    // siempre pertenece al día de inicio del turno.
    const hoy      = getFechaTurno();
    const diasSemana = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const meses      = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const fechaStr   = `${diasSemana[hoy.getDay()]} ${hoy.getDate()} de ${meses[hoy.getMonth()]} de ${hoy.getFullYear()}`;
    const fechaEl    = document.getElementById('fecha-jornada');
    if (fechaEl) fechaEl.innerHTML = `📅 Jornada: <strong>${fechaStr}</strong>`;

    let totalEfectivo     = 0;
    let totalTransferencia = 0;
    let totalGeneral      = 0;
    let rankingProductos  = {};

    // Excluir Cancelados Y Borradores del balance
    const pedidosValidos = pedidos.filter(p => p.estado !== 'Cancelado' && p.estado !== 'Borrador');

    pedidosValidos.forEach(p => {
        if (p.formaPago === 'Efectivo')      totalEfectivo      += p.total;
        else if (p.formaPago === 'Transferencia') totalTransferencia += p.total;
        totalGeneral += p.total;

        p.items.forEach(item => {
            const prodCatalogo = productos.find(pr => pr.id === item.productoId || pr.nombre === item.nombre);
            const categoria    = prodCatalogo ? prodCatalogo.categoria : (item.categoria || 'Otros');

            if (item.esMitad && item.mitad1 && item.mitad2) {
                [item.mitad1, item.mitad2].forEach(nombreMitad => {
                    const pizzaMitad  = productos.find(pr => pr.nombre === nombreMitad);
                    const precioMitad = pizzaMitad ? pizzaMitad.precio : item.precio;
                    if (rankingProductos[nombreMitad]) {
                        rankingProductos[nombreMitad].cantidad += 0.5 * item.cantidad;
                        rankingProductos[nombreMitad].monto    += (precioMitad / 2) * item.cantidad;
                    } else {
                        rankingProductos[nombreMitad] = { cantidad: 0.5 * item.cantidad, monto: (precioMitad / 2) * item.cantidad, categoria: 'Pizzas' };
                    }
                });
            } else {
                if (rankingProductos[item.nombre]) {
                    rankingProductos[item.nombre].cantidad += item.cantidad;
                    rankingProductos[item.nombre].monto    += item.precio * item.cantidad;
                } else {
                    rankingProductos[item.nombre] = { cantidad: item.cantidad, monto: item.precio * item.cantidad, categoria };
                }
            }
        });
    });

    document.getElementById('balance-efectivo').innerText      = `$${totalEfectivo.toLocaleString('es-AR')}`;
    document.getElementById('balance-transferencia').innerText = `$${totalTransferencia.toLocaleString('es-AR')}`;
    document.getElementById('balance-total').innerText         = `$${totalGeneral.toLocaleString('es-AR')}`;

    const listaRanking = document.getElementById('balance-ranking');
    listaRanking.innerHTML = '';

    if (Object.keys(rankingProductos).length === 0) {
        listaRanking.innerHTML = `<li class="ranking-item" style="color:var(--texto-secundario);">No se registraron ventas en este turno todavía.</li>`;
        document.getElementById('total-pizzas-banner').style.display = 'none';
    } else {
        let totalPizzas = 0;
        Object.entries(rankingProductos).forEach(([, datos]) => {
            if (datos.categoria === 'Pizzas') totalPizzas += datos.cantidad;
        });

        const bannerPizzas = document.getElementById('total-pizzas-banner');
        if (totalPizzas > 0) {
            bannerPizzas.style.display = 'block';
            document.getElementById('total-pizzas-num').textContent = Number.isInteger(totalPizzas) ? totalPizzas : totalPizzas.toFixed(1);
        } else {
            bannerPizzas.style.display = 'none';
        }

        const todasCats     = [...new Set(productos.map(p => p.categoria))];
        const categoriasOrden = [
            ...todasCats.filter(c => c === 'Pizzas'),
            ...todasCats.filter(c => c !== 'Pizzas' && c !== 'Servicios'),
            ...todasCats.filter(c => c === 'Servicios')
        ];

        categoriasOrden.forEach(cat => {
            const liCat = document.createElement('li');
            liCat.style.cssText = 'list-style:none; padding:6px 5px 3px; font-size:12px; color:var(--texto-secundario); text-transform:uppercase; letter-spacing:1px; border-bottom:1px solid var(--borde); margin-bottom:3px;';
            liCat.innerHTML = `${getIconoCategoria(cat)} ${cat}`;
            listaRanking.appendChild(liCat);

            const prodsCat = productos.filter(p => p.categoria === cat);
            prodsCat.forEach(prod => {
                const datos = rankingProductos[prod.nombre];
                if (!datos) return;
                const cant = Number.isInteger(datos.cantidad) ? datos.cantidad : datos.cantidad.toFixed(1);
                const li   = document.createElement('li');
                li.className = 'ranking-item';
                li.innerHTML = `
                    <span style="padding-left:8px;"><strong>${prod.nombre}</strong></span>
                    <span style="display:flex; gap:20px; align-items:center;">
                        <span style="color:var(--texto-secundario); font-weight:bold;">${cant} u.</span>
                        <strong style="color:#ff9800;">$${datos.monto.toLocaleString('es-AR')}</strong>
                    </span>`;
                listaRanking.appendChild(li);
            });

            // Productos eliminados del catálogo
            Object.entries(rankingProductos).forEach(([nombre, datos]) => {
                if (datos.categoria === cat && !prodsCat.find(p => p.nombre === nombre) && !datos.esMitad) {
                    const cant = Number.isInteger(datos.cantidad) ? datos.cantidad : datos.cantidad.toFixed(1);
                    const li   = document.createElement('li');
                    li.className = 'ranking-item';
                    li.innerHTML = `
                        <span style="padding-left:8px;"><strong>${nombre}</strong></span>
                        <span style="display:flex; gap:20px; align-items:center;">
                            <span style="color:var(--texto-secundario); font-weight:bold;">${cant} u.</span>
                            <strong style="color:#ff9800;">$${datos.monto.toLocaleString('es-AR')}</strong>
                        </span>`;
                    listaRanking.appendChild(li);
                }
            });
        });
    }

    // Tabla de auditoría — solo pedidos NO cancelados y NO borradores
    const tablaPedidos = document.getElementById('balance-tabla-pedidos');
    tablaPedidos.innerHTML = '';

    const pedidosAuditoria = pedidos.filter(p => p.estado !== 'Borrador' && p.estado !== 'Cancelado');

    if (pedidosAuditoria.length === 0) {
        tablaPedidos.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--texto-secundario);">Ningún pedido cargado en el turno.</td></tr>`;
    } else {
        calcularStatsHorarios(pedidosValidos);
        const colorEstadoMap = {
            'Pendiente': 'var(--primario)', 'Preparando': '#FF9800',
            'Listo': '#00BCD4', 'Entregado': 'var(--exito)'
        };
        pedidosAuditoria.forEach(p => {
            const tr = document.createElement('tr');
            const _tEntrada = p.horaEntrada || '-';
            const _tSalida  = p.horaSalida  || '-';
            let _tDem = '-';
            if (p.horaEntradaMs && p.horaSalidaMs) {
                _tDem = Math.round((p.horaSalidaMs - p.horaEntradaMs) / 60000) + ' min';
            }
            tr.innerHTML = `
                <td><strong>${p.codigo || '—'}</strong></td>
                <td>${p.cliente}</td>
                <td>${p.modalidad}</td>
                <td>${p.formaPago}</td>
                <td>$${p.total.toLocaleString('es-AR')}</td>
                <td style="font-size:12px; color:var(--texto-secundario);">${_tEntrada} → ${_tSalida}<br><strong style="color:var(--texto-principal);">${_tDem}</strong></td>
                <td style="font-weight:bold; color:${colorEstadoMap[p.estado] || 'var(--texto-secundario)'};">${p.estado}</td>`;
            tablaPedidos.appendChild(tr);
        });
    }

    // Sección de pedidos cancelados — separada, para control interno
    renderizarCanceladosEnBalance();
}

function renderizarCanceladosEnBalance() {
    const contenedor = document.getElementById('seccion-cancelados-balance');
    if (!contenedor) return;

    const cancelados = pedidos.filter(p => p.estado === 'Cancelado');

    if (cancelados.length === 0) {
        contenedor.style.display = 'none';
        return;
    }

    contenedor.style.display = 'block';
    const lista = document.getElementById('cancelados-lista');
    if (!lista) return;
    lista.innerHTML = '';

    cancelados.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${p.codigo || '—'}</strong></td>
            <td>${p.cliente}</td>
            <td>${p.modalidad}</td>
            <td>$${p.total.toLocaleString('es-AR')}</td>
            <td>
                <button onclick="reactivarPedido('${p.id}')"
                        style="padding:4px 10px; font-size:12px; background:#FF9800; color:#000; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">
                    ↩ Reactivar
                </button>
            </td>`;
        lista.appendChild(tr);
    });
}

function reactivarPedido(id) {
    if (!confirm('¿Reactivar este pedido? Volverá al estado Pendiente.')) return;
    sincronizarPedidosBalance();
    const index = pedidos.findIndex(p => p.id === id);
    if (index !== -1 && pedidos[index].estado === 'Cancelado') {
        pedidos[index].estado = 'Pendiente';
        guardarPedidosEnStorage();
        calcularYRenderizarBalance();
    }
}

// Sync desde localStorage para operaciones de balance que modifican pedidos
function sincronizarPedidosBalance() {
    pedidos = JSON.parse(localStorage.getItem('pizza_pedidos')) || [];
}

function calcularStatsHorarios(pedidosValidos) {
    const contenedor = document.getElementById('stats-horarios');
    if (!contenedor) return;

    const pedidosConHora = pedidosValidos.filter(p => p.horaEntradaMs);
    if (pedidosConHora.length === 0) {
        contenedor.innerHTML = '<p style="color:var(--texto-secundario); font-size:13px;">Sin datos de horarios registrados aún. Los horarios se registran automáticamente al cargar cada pedido.</p>';
        return;
    }

    const franjas = {};
    pedidosConHora.forEach(p => {
        const h     = new Date(p.horaEntradaMs).getHours();
        const label = String(h).padStart(2,'0') + ':00 - ' + String(h).padStart(2,'0') + ':59';
        franjas[label] = (franjas[label] || 0) + 1;
    });
    const franjasArr = Object.entries(franjas).sort((a, b) => b[1] - a[1]);
    const top3   = franjasArr.slice(0, 3);
    const flojo3 = [...franjasArr].sort((a, b) => a[1] - b[1]).slice(0, 3);

    const conTiempo = pedidosValidos.filter(p => p.horaEntradaMs && p.horaSalidaMs && p.estado === 'Entregado');
    let htmlEntrega = '<p style="color:var(--texto-secundario); font-size:13px; margin-top:8px;">Sin entregas completadas con tiempo registrado aún.</p>';
    if (conTiempo.length > 0) {
        const tiempos = conTiempo.map(p => Math.round((p.horaSalidaMs - p.horaEntradaMs) / 60000));
        const prom = Math.round(tiempos.reduce((a,b) => a+b, 0) / tiempos.length);
        const max  = Math.max(...tiempos);
        const min  = Math.min(...tiempos);
        htmlEntrega = `<div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px;">
            <div style="flex:1; min-width:90px; background:var(--bg-input); border-radius:8px; padding:10px; text-align:center;">
                <div style="font-size:11px; color:var(--texto-secundario); margin-bottom:4px;">⏱ PROMEDIO</div>
                <div style="font-size:22px; font-weight:bold;">${prom} min</div>
            </div>
            <div style="flex:1; min-width:90px; background:var(--bg-input); border-radius:8px; padding:10px; text-align:center;">
                <div style="font-size:11px; color:var(--texto-secundario); margin-bottom:4px;">🐌 MÁS LENTO</div>
                <div style="font-size:22px; font-weight:bold; color:var(--peligro);">${max} min</div>
            </div>
            <div style="flex:1; min-width:90px; background:var(--bg-input); border-radius:8px; padding:10px; text-align:center;">
                <div style="font-size:11px; color:var(--texto-secundario); margin-bottom:4px;">⚡ MÁS RÁPIDO</div>
                <div style="font-size:22px; font-weight:bold; color:var(--exito);">${min} min</div>
            </div>
        </div>`;
    }

    const mkFranjas = (lista, emoji) => lista.map((f, i) =>
        `<div style="display:flex; justify-content:space-between; align-items:center; padding:7px 10px; background:var(--bg-input); border-radius:6px; margin-bottom:5px;">
            <span style="font-size:13px;">${emoji} ${i+1}° ${f[0]}</span>
            <strong>${f[1]} pedido${f[1]>1?'s':''}</strong>
        </div>`
    ).join('');

    contenedor.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
            <div>
                <p style="font-size:12px; color:var(--texto-secundario); margin-bottom:8px;">🔥 FRANJAS MÁS OCUPADAS</p>
                ${mkFranjas(top3, '🔴')}
            </div>
            <div>
                <p style="font-size:12px; color:var(--texto-secundario); margin-bottom:8px;">😌 FRANJAS MÁS TRANQUILAS</p>
                ${mkFranjas(flojo3, '🟢')}
            </div>
        </div>
        <div>
            <p style="font-size:12px; color:var(--texto-secundario); margin-top:12px; margin-bottom:4px;">🚀 TIEMPOS DE ENTREGA</p>
            ${htmlEntrega}
        </div>`;
}

// ============================================================
// CIERRE DE TURNO
// ============================================================

function cerrarTurno() {
    const borradores = pedidos.filter(p => p.estado === 'Borrador');
    let mensaje = '⚠️ ATENCIÓN: ¿Estás seguro de que querés CERRAR EL TURNO de la noche? Se borrarán todos los pedidos activos y el contador volverá a P001. Asegurate de haber impreso o guardado el resumen.';
    if (borradores.length > 0) {
        mensaje += `\n\n📝 Hay ${borradores.length} pedido(s) en BORRADOR que también se eliminarán.`;
    }
    if (confirm(mensaje)) {
        pedidos = [];
        proximoNumeroPedido = 1;
        localStorage.removeItem('pizza_fecha_turno');
        guardarPedidosEnStorage();
        limpiarFormularioPedido();
        cancelarEdicion();
        cambiarVista('pedidos');
        renderizarTodo();
        alert('Turno cerrado con éxito. Aplicación lista para recibir nuevos pedidos.');
    }
}

// ============================================================
// COMPARTIR RESUMEN (WhatsApp / Web Share)
// ============================================================

function generarTextoResumen() {
    // Usar la fecha de INICIO del turno, no la hora actual
    const hoy       = getFechaTurno();
    const diasSemana = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const meses      = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const fechaTexto = `${diasSemana[hoy.getDay()]} ${hoy.getDate()} de ${meses[hoy.getMonth()]} de ${hoy.getFullYear()}`;
    const horaTexto  = hoy.toTimeString().slice(0, 5);

    // Excluir Cancelados y Borradores del resumen
    const pedidosValidos = pedidos.filter(p => p.estado !== 'Cancelado' && p.estado !== 'Borrador');
    let totalGeneral = 0, totalEfectivo = 0, totalTransferencia = 0;
    let rankingTexto  = {};
    let totalDeliveries = 0;

    pedidosValidos.forEach(p => {
        totalGeneral += p.total;
        if (p.formaPago === 'Efectivo')      totalEfectivo      += p.total;
        else if (p.formaPago === 'Transferencia') totalTransferencia += p.total;
        if (p.modalidad === 'Delivery') totalDeliveries++;

        p.items.forEach(item => {
            if (item.categoria === 'Servicios') return;
            if (item.esMitad && item.mitad1 && item.mitad2) {
                [item.mitad1, item.mitad2].forEach(nombreMitad => {
                    const pizzaRef = productos.find(pr => pr.nombre === nombreMitad);
                    rankingTexto[nombreMitad] = rankingTexto[nombreMitad] || { cantidad: 0, precio: pizzaRef ? pizzaRef.precio : 0, cat: 'Pizzas' };
                    rankingTexto[nombreMitad].cantidad += 0.5 * item.cantidad;
                });
            } else {
                const prodCat = productos.find(pr => pr.nombre === item.nombre);
                const cat     = prodCat ? prodCat.categoria : 'Otros';
                rankingTexto[item.nombre] = rankingTexto[item.nombre] || { cantidad: 0, precio: item.precio, cat };
                rankingTexto[item.nombre].cantidad += item.cantidad;
            }
        });
    });

    const fmt = n => Number.isInteger(n) ? n : n.toFixed(1);

    const pizzas  = Object.entries(rankingTexto).filter(([,d]) => d.cat === 'Pizzas');
    const bebidas = Object.entries(rankingTexto).filter(([,d]) => d.cat === 'Bebidas');
    const dips    = Object.entries(rankingTexto).filter(([,d]) => d.cat === 'Dips');

    const totalPizzas  = pizzas.reduce((acc,  [,d]) => acc + d.cantidad, 0);
    const totalBebidas = bebidas.reduce((acc, [,d]) => acc + d.cantidad, 0);
    const totalDips    = dips.reduce((acc,    [,d]) => acc + d.cantidad, 0);

    let texto = `*📋 RESUMEN*\n`;
    texto += `📅 ${fechaTexto} | ${horaTexto} hs\n\n`;
    texto += `💰 *Total General: $${totalGeneral.toLocaleString('es-AR')}*\n`;
    texto += `💵 Efectivo: $${totalEfectivo.toLocaleString('es-AR')}\n`;
    texto += `📱 Transferencia: $${totalTransferencia.toLocaleString('es-AR')}\n`;

    if (pizzas.length > 0) {
        texto += `\n🍕 *Pizzas: ${fmt(totalPizzas)}*\n`;
        pizzas.forEach(([nombre, datos]) => {
            texto += `  · ${nombre}: ${fmt(datos.cantidad)} ($${datos.precio.toLocaleString('es-AR')} c/u)\n`;
        });
    }
    if (dips.length > 0) {
        texto += `\n🫙 *Dips: ${fmt(totalDips)}*\n`;
        dips.forEach(([nombre, datos]) => {
            texto += `  · ${nombre}: ${fmt(datos.cantidad)} ($${datos.precio.toLocaleString('es-AR')} c/u)\n`;
        });
    }
    if (bebidas.length > 0) {
        texto += `\n🥤 *Bebidas: ${fmt(totalBebidas)}*\n`;
        bebidas.forEach(([nombre, datos]) => {
            texto += `  · ${nombre}: ${fmt(datos.cantidad)} ($${datos.precio.toLocaleString('es-AR')} c/u)\n`;
        });
    }

    texto += `\n🛵 Deliveries: ${totalDeliveries}`;
    texto += `\n📦 Pedidos totales: ${pedidosValidos.length}`;

    return texto;
}

function compartirResumen() {
    const texto = generarTextoResumen();
    if (navigator.share) {
        navigator.share({ title: 'Resumen Rockísimo', text: texto }).catch(() => {});
    } else {
        const encoded = encodeURIComponent(texto);
        window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
}
