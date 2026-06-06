// ============================================================
// storage.js — Estado global y persistencia en localStorage
// ============================================================

// Estado global de la aplicación (compartido entre todos los módulos)
let productos = JSON.parse(localStorage.getItem('pizza_productos')) || [];
let pedidos   = JSON.parse(localStorage.getItem('pizza_pedidos'))   || [];
let proximoNumeroPedido = parseInt(localStorage.getItem('pizza_proximo_numero')) || 1;
let coloresCategorias   = JSON.parse(localStorage.getItem('pizza_colores_cat')) || {
    'Pizzas':    '#7B1A1A',
    'Bebidas':   '#1A4A6B',
    'Dips':      '#2E5E1A',
    'Servicios': '#3a3a3a'
};

// Fecha de inicio del turno: se guarda la primera vez y persiste hasta cerrar turno.
// La jornada empieza ~21hs y puede terminar pasada la medianoche; siempre
// pertenece al día de inicio.
if (!localStorage.getItem('pizza_fecha_turno')) {
    localStorage.setItem('pizza_fecha_turno', new Date().toISOString());
}

function getFechaTurno() {
    return new Date(localStorage.getItem('pizza_fecha_turno') || new Date().toISOString());
}

function guardarColoresCat() {
    localStorage.setItem('pizza_colores_cat', JSON.stringify(coloresCategorias));
}

function getColorCategoria(cat) {
    return coloresCategorias[cat] || '#3a3330';
}

function guardarProductosEnStorage() {
    localStorage.setItem('pizza_productos', JSON.stringify(productos));
}

function guardarPedidosEnStorage() {
    localStorage.setItem('pizza_pedidos', JSON.stringify(pedidos));
    localStorage.setItem('pizza_proximo_numero', proximoNumeroPedido.toString());
}

// ============================================================
// Estructuras de datos de referencia
//
// Producto:
//   { id: number, nombre: string, categoria: string, precio: number }
//
// Pedido:
//   { id: string, codigo: string|null, cliente: string,
//     modalidad: 'Delivery'|'Retiro', formaPago: 'Efectivo'|'Transferencia',
//     items: ItemPedido[], total: number,
//     estado: 'Borrador'|'Pendiente'|'Preparando'|'Listo'|'Entregado'|'Cancelado',
//     horaEntrada: string|null, horaEntradaMs: number|null,
//     horaSalida: string|null,  horaSalidaMs: number|null }
//
// ItemPedido:
//   { productoId: number, nombre: string, precio: number, cantidad: number,
//     categoria: string,
//     esMitad?: boolean, mitad1?: string, mitad2?: string }
// ============================================================
