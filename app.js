const KEY = 'libros_registro_v1';
let datos = [];

function cargar() {
  try { datos = JSON.parse(localStorage.getItem(KEY)) || []; } catch { datos = []; }
}

function guardar() {
  localStorage.setItem(KEY, JSON.stringify(datos));
}

function hoy() {
  return new Date().toISOString().split('T')[0];
}

function registrar() {
  const nombre = document.getElementById('inp-nombre').value.trim();
  if (!nombre) { toast('El nombre es obligatorio'); return; }

  const email = document.getElementById('inp-email').value.trim();
  const monto = parseFloat(document.getElementById('inp-monto').value) || 0;
  const fecha = document.getElementById('inp-fecha').value || hoy();
  const nota  = document.getElementById('inp-nota').value.trim();

  datos.unshift({ id: Date.now(), nombre, email, monto, fecha, nota });
  guardar();
  limpiar();
  renderTabla();
  actualizarStats();
  toast('✅ Persona registrada');
}

function eliminar(id) {
  if (!confirm('¿Eliminar este registro?')) return;
  datos = datos.filter(d => d.id !== id);
  guardar();
  renderTabla();
  actualizarStats();
  toast('Registro eliminado');
}

function limpiar() {
  ['inp-nombre', 'inp-email', 'inp-monto', 'inp-nota'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('inp-fecha').value = hoy();
  document.getElementById('inp-nombre').focus();
}

function filtrar() {
  const q = document.getElementById('search').value.toLowerCase();
  if (!q) return datos;
  return datos.filter(d =>
    d.nombre.toLowerCase().includes(q) ||
    d.email.toLowerCase().includes(q) ||
    (d.nota || '').toLowerCase().includes(q)
  );
}

function renderTabla() {
  const lista = filtrar();
  document.getElementById('count-visible').textContent = lista.length;
  const wrap = document.getElementById('tabla-wrap');

  if (lista.length === 0) {
    const msg = datos.length
      ? 'Sin resultados para esa búsqueda.'
      : 'Aún no hay registros. ¡Agrega la primera persona!';
    wrap.innerHTML = `<div class="empty"><div class="icon">📋</div><p>${msg}</p></div>`;
    return;
  }

  wrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Correo</th>
          <th>Fecha</th>
          <th>Donación</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${lista.map(d => `
          <tr>
            <td>
              <strong>${esc(d.nombre)}</strong>
              ${d.nota ? `<div class="note-text">${esc(d.nota)}</div>` : ''}
            </td>
            <td style="color:var(--gray-600)">${esc(d.email) || '—'}</td>
            <td style="color:var(--gray-400);white-space:nowrap">${formatFecha(d.fecha)}</td>
            <td>
              ${d.monto > 0
                ? `<span class="badge">$${d.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>`
                : `<span class="badge badge-none">Sin donación</span>`}
            </td>
            <td><button class="btn-delete" onclick="eliminar(${d.id})">Eliminar</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
}

function actualizarStats() {
  const total    = datos.length;
  const monto    = datos.reduce((s, d) => s + (d.monto || 0), 0);
  const donaron  = datos.filter(d => d.monto > 0).length;
  document.getElementById('stat-total').textContent    = total;
  document.getElementById('stat-monto').textContent    = '$' + monto.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  document.getElementById('stat-donantes').textContent = donaron;
}

function exportarCSV() {
  if (!datos.length) { toast('No hay datos para exportar'); return; }
  const header = ['Nombre', 'Correo', 'Fecha', 'Donacion MXN', 'Nota'];
  const rows = datos.map(d =>
    [d.nombre, d.email, d.fecha, d.monto || 0, d.nota || '']
      .map(v => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  );
  const csv = [header.join(','), ...rows].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `libros-registro-${hoy()}.csv`;
  a.click();
  toast('CSV descargado');
}

function formatFecha(s) {
  if (!s) return '—';
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

// Init
cargar();
document.getElementById('inp-fecha').value = hoy();
renderTabla();
actualizarStats();
