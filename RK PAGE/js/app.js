// ============================================================
// app.js — Inicialización, navegación y renderizado general
// Depende de: storage.js, menu.js, pedidos.js, balance.js
// ============================================================

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
    // Cargar productos por defecto si el catálogo está vacío (primera experiencia)
    if (productos.length === 0) {
        productos = [
            { id: 1,  nombre: 'Mozzarella',   categoria: 'Pizzas',    precio: 10000 },
            { id: 2,  nombre: 'Margarita',     categoria: 'Pizzas',    precio: 10500 },
            { id: 3,  nombre: 'Calabresa',     categoria: 'Pizzas',    precio: 12000 },
            { id: 4,  nombre: 'J&M',           categoria: 'Pizzas',    precio: 12000 },
            { id: 5,  nombre: 'Choclo',        categoria: 'Pizzas',    precio: 12000 },
            { id: 6,  nombre: 'Cuatro Quesos', categoria: 'Pizzas',    precio: 13000 },
            { id: 7,  nombre: 'Coca-Cola',     categoria: 'Bebidas',   precio: 5000  },
            { id: 8,  nombre: 'Aquarius',      categoria: 'Bebidas',   precio: 3500  },
            { id: 9,  nombre: 'Manaos',        categoria: 'Bebidas',   precio: 2500  },
            { id: 10, nombre: 'Dip',           categoria: 'Dips',      precio: 1500  },
            { id: 11, nombre: 'Delivery',      categoria: 'Servicios', precio: 500   }
        ];
        guardarProductosEnStorage();
    }
    renderizarTodo();
});

// --- Navegación entre vistas ---
function cambiarVista(vista) {
    ['pedidos', 'menu', 'balance'].forEach(v => {
        document.getElementById(`seccion-${v}`).classList.add('oculto');
        document.getElementById(`btn-vista-${v}`).classList.remove('activo');
    });

    document.getElementById(`seccion-${vista}`).classList.remove('oculto');
    document.getElementById(`btn-vista-${vista}`).classList.add('activo');

    if (vista === 'balance') {
        calcularYRenderizarBalance();
    }
}

// --- Renderizado general ---
function renderizarTodo() {
    renderizarMenuAdministracion();
    renderizarMenuBotonesOperador();
    renderizarCarrito();
    renderizarPedidosActivos();
    actualizarPanelDelivery();
    renderizarPanelColores();
}
