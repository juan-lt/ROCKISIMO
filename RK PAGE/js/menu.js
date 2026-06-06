// ============================================================
// menu.js — Gestión del catálogo de productos (Módulo 1)
// Depende de: storage.js, app.js (renderizarTodo)
// ============================================================

// --- Panel de precio de Delivery ---

function actualizarPanelDelivery() {
    const prod = productos.find(p => p.categoria === 'Servicios' && p.nombre === 'Delivery');
    const txt  = document.getElementById('delivery-precio-txt');
    if (txt && prod) txt.innerText = '$' + prod.precio.toLocaleString('es-AR');
}

function editarDelivery() {
    const prod = productos.find(p => p.categoria === 'Servicios' && p.nombre === 'Delivery');
    if (!prod) { alert('No se encontró el producto Delivery en el menú.'); return; }
    document.getElementById('delivery-nuevo-precio').value = prod.precio;
    document.getElementById('delivery-vista').style.display   = 'none';
    document.getElementById('delivery-edicion').style.display = 'flex';
}

function cancelarEditarDelivery() {
    document.getElementById('delivery-vista').style.display   = 'flex';
    document.getElementById('delivery-edicion').style.display = 'none';
}

function guardarPrecioDelivery() {
    const nuevo = parseFloat(document.getElementById('delivery-nuevo-precio').value);
    if (isNaN(nuevo) || nuevo < 0) { alert('Ingresá un precio válido.'); return; }
    const index = productos.findIndex(p => p.categoria === 'Servicios' && p.nombre === 'Delivery');
    if (index !== -1) {
        productos[index].precio = nuevo;
        guardarProductosEnStorage();
        actualizarPanelDelivery();
        cancelarEditarDelivery();
        alert('✅ Precio de Delivery actualizado a $' + nuevo.toLocaleString('es-AR'));
    }
}

// --- Alta de categorías ---

function agregarNuevaCategoria() {
    const input    = document.getElementById('nueva-categoria-input');
    const nuevaCat = input.value.trim();
    if (!nuevaCat) { alert('Ingresá el nombre de la nueva categoría.'); return; }
    const select = document.getElementById('prod-categoria');
    const existe = Array.from(select.options).some(o => o.value === nuevaCat);
    if (existe) { alert('Esa categoría ya existe.'); return; }
    const option = document.createElement('option');
    option.value = nuevaCat;
    option.text  = nuevaCat;
    select.appendChild(option);
    select.value = nuevaCat;
    input.value  = '';
}

// --- Alta / baja de productos ---

function guardarProducto() {
    const nombre    = document.getElementById('prod-nombre').value.trim();
    const categoria = document.getElementById('prod-categoria').value;
    const precio    = parseFloat(document.getElementById('prod-precio').value);

    if (!nombre || isNaN(precio) || precio < 0) {
        alert('Por favor, ingresá un nombre válido y un precio correcto.');
        return;
    }

    const nuevoProducto = {
        id:        Date.now(),
        nombre:    nombre,
        categoria: categoria,
        precio:    precio
    };

    productos.push(nuevoProducto);
    guardarProductosEnStorage();

    document.getElementById('prod-nombre').value = '';
    document.getElementById('prod-precio').value = '';

    renderizarTodo();
}

function eliminarProducto(id) {
    if (confirm('¿Seguro querés eliminar este producto del catálogo? No afectará a los pedidos ya tomados.')) {
        productos = productos.filter(p => p.id !== id);
        guardarProductosEnStorage();
        renderizarTodo();
    }
}

// --- Colores por categoría ---

function renderizarPanelColores() {
    const contenedor = document.getElementById('panel-colores-cat');
    if (!contenedor) return;
    contenedor.innerHTML = '';
    const cats = [...new Set(productos.map(p => p.categoria))];
    cats.forEach(cat => {
        const colorActual = getColorCategoria(cat);
        const div = document.createElement('div');
        div.style.cssText = 'display:flex; align-items:center; gap:8px; background:#252525; padding:8px 12px; border-radius:8px;';
        div.innerHTML = `
            <span style="font-size:14px; color:var(--texto-principal);">${cat}</span>
            <input type="color" value="${colorActual}"
                   style="width:36px; height:28px; padding:0; border:none; border-radius:4px; cursor:pointer; background:none;"
                   onchange="cambiarColorCategoria('${cat}', this.value)">
        `;
        contenedor.appendChild(div);
    });
}

function cambiarColorCategoria(cat, color) {
    coloresCategorias[cat] = color;
    guardarColoresCat();
    renderizarMenuBotonesOperador();
}

// --- Tabla de administración del menú ---

let editandoProductoId = null;

function renderizarMenuAdministracion() {
    const tbody = document.getElementById('tabla-menu-cuerpo');
    if (!tbody) return;
    tbody.innerHTML = '';

    productos.forEach(p => {
        const tr = document.createElement('tr');
        if (editandoProductoId === p.id) {
            const cats = [...new Set(productos.map(x => x.categoria))];
            let optsCat = cats.map(c => `<option value="${c}" ${c === p.categoria ? 'selected' : ''}>${c}</option>`).join('');
            tr.innerHTML = `
                <td><input type="text" id="edit-nombre-${p.id}" value="${p.nombre}" style="width:100%;"></td>
                <td><select id="edit-categoria-${p.id}" style="width:100%;">${optsCat}</select></td>
                <td><input type="number" id="edit-precio-${p.id}" value="${p.precio}" min="0" style="width:90px;"></td>
                <td style="text-align:center;">
                    <button class="btn-accion btn-agregar" onclick="guardarEdicionProducto(${p.id})" style="padding:6px 12px; font-size:13px;">✔ Guardar</button>
                    <button class="btn-accion btn-cancelar" onclick="cancelarEdicionProducto()" style="padding:6px 10px; font-size:13px; margin-left:4px;">✖</button>
                </td>`;
        } else {
            tr.innerHTML = `
                <td>${p.nombre}</td>
                <td>${p.categoria}</td>
                <td>$${p.precio.toLocaleString('es-AR')}</td>
                <td style="text-align:center;">
                    <button class="btn-accion btn-info" onclick="iniciarEdicionProducto(${p.id})" style="padding:6px 12px; font-size:13px;">✏️ Editar</button>
                    <button class="btn-accion btn-cancelar" onclick="eliminarProducto(${p.id})" style="padding:6px 10px; font-size:13px; margin-left:4px;">🗑️</button>
                </td>`;
        }
        tbody.appendChild(tr);
    });
}

function iniciarEdicionProducto(id) {
    editandoProductoId = id;
    renderizarMenuAdministracion();
}

function cancelarEdicionProducto() {
    editandoProductoId = null;
    renderizarMenuAdministracion();
}

function guardarEdicionProducto(id) {
    const nombre    = document.getElementById(`edit-nombre-${id}`).value.trim();
    const categoria = document.getElementById(`edit-categoria-${id}`).value;
    const precio    = parseFloat(document.getElementById(`edit-precio-${id}`).value);

    if (!nombre || isNaN(precio) || precio < 0) {
        alert('Datos inválidos. Verificá el nombre y el precio.');
        return;
    }

    const index = productos.findIndex(p => p.id === id);
    if (index !== -1) {
        productos[index].nombre    = nombre;
        productos[index].categoria = categoria;
        productos[index].precio    = precio;
    }

    editandoProductoId = null;
    guardarProductosEnStorage();
    renderizarTodo();
}

// --- Menú de botones para el operador ---

function getIconoCategoria(cat) {
    const iconos = { 'Pizzas': '🍕', 'Bebidas': '🥤', 'Dips': '🫙', 'Servicios': '🛵' };
    return iconos[cat] || '📦';
}

function renderizarMenuBotonesOperador() {
    const contenedor = document.getElementById('contenedor-menu-operaciones');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    const categorias = [...new Set(productos.map(p => p.categoria))].filter(c => c !== 'Servicios');

    categorias.forEach(cat => {
        const productosFiltrados = productos.filter(p => p.categoria === cat);

        const grupoDiv = document.createElement('div');
        grupoDiv.className = 'grupo-categoria';

        grupoDiv.innerHTML = `<h3 class="titulo-categoria">${getIconoCategoria(cat)} ${cat}</h3>`;

        const grilla = document.createElement('div');
        grilla.className = 'grilla-productos';

        // Botón mitad y mitad (solo en Pizzas)
        if (cat === 'Pizzas') {
            const btnMitad = document.createElement('button');
            btnMitad.className = 'btn-mitad';
            btnMitad.innerHTML = `<span class="mitad-icono">🍕🍕</span><span class="mitad-label">½ y ½</span>`;
            btnMitad.onclick = abrirModalMitad;
            grilla.appendChild(btnMitad);
        }

        productosFiltrados.forEach(prod => {
            const btn = document.createElement('button');
            btn.className = 'btn-producto';
            const colorCat = getColorCategoria(cat);
            btn.style.cssText = `background:${colorCat}; border-color:${colorCat};`;
            btn.innerHTML = `<span class="nombre">${prod.nombre}</span><span class="precio">$${prod.precio.toLocaleString('es-AR')}</span>`;
            btn.onclick = () => agregarAlCarrito(prod);
            grilla.appendChild(btn);
        });

        grupoDiv.appendChild(grilla);
        contenedor.appendChild(grupoDiv);
    });
}
