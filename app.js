const KEY       = 'libros_registro_v1';
const ADMIN_PASS = 'libros2024'; // cambia esta contraseña

let datos        = [];
let adminMode    = false;
let editandoId   = null;

function cargar() {
  try { datos = JSON.parse(localStorage.getItem(KEY)) || []; } catch { datos = []; }
}

function guardar() {
  localStorage.setItem(KEY, JSON.stringify(datos));
}

function hoy() {
  return new Date().toISOString().split('T')[0];
}

// ── Admin ────────────────────────────────────────────────────────────────────

function toggleAdmin() {
  if (adminMode) {
    salirAdmin();
  } else {
    document.getElementById('modal-overlay').style.display = 'flex';
    setTimeout(() => document.getElementById('inp-pass').focus(), 50);
  }
}

function verificarPass() {
  const val = document.getElementById('inp-pass').value;
  if (val === ADMIN_PASS) {
    adminMode = true;
    document.getElementById('modal-overlay').style.display = 'none';
    document.getElementById('inp-pass').value = '';
    document.getElementById('pass-error').style.display = 'none';
    document.getElementById('admin-badge').style.display = 'inline-block';
    document.getElementById('btn-admin-toggle').textContent = 'Salir';
    document.getElementById('btn-admin-toggle').classList.add('btn-admin-exit');
    renderTabla();
    toast('Modo admin activado');
  } else {
    document.getElementById('pass-error').style.display = 'block';
    document.getElementById('inp-pass').value = '';
    document.getElementById('inp-pass').focus();
  }
}

function salirAdmin() {
  adminMode = false;
  limpiar();
  document.getElementById('admin-badge').style.display = 'none';
  document.getElementById('btn-admin-toggle').textContent = 'Admin';
  document.getElementById('btn-admin-toggle').classList.remove('btn-admin-exit');
  renderTabla();
  toast('Modo admin desactivado');
}

function cerrarModal(e) {
  if (e && e.target !== document.getElementById('modal-overlay')) return;
  document.getElementById('modal-overlay').style.display = 'none';
  document.getElementById('inp-pass').value = '';
  document.getElementById('pass-error').style.display = 'none';
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

function registrar() {
  const nombre = document.getElementById('inp-nombre').value.trim();
  if (!nombre) { toast('El nombre es obligatorio'); return; }

  const email = document.getElementById('inp-email').value.trim();
  const monto = parseInt(document.getElementById('inp-monto').value) || 0;
  const fecha = document.getElementById('inp-fecha').value || hoy();
  const nota  = document.getElementById('inp-nota').value.trim();

  if (editandoId !== null) {
    const idx = datos.findIndex(d => d.id === editandoId);
    if (idx !== -1) datos[idx] = { id: editandoId, nombre, email, monto, fecha, nota };
    editandoId = null;
    document.getElementById('form-title').textContent = 'Registrar persona';
    document.getElementById('btn-guardar').textContent = 'Registrar persona';
    toast('✅ Registro actualizado');
  } else {
    datos.unshift({ id: Date.now(), nombre, email, monto, fecha, nota });
    toast('✅ Persona registrada');
  }

  guardar();
  limpiar();
  renderTabla();
  actualizarStats();
}

function editar(id) {
  const d = datos.find(d => d.id === id);
  if (!d) return;
  editandoId = id;
  document.getElementById('inp-nombre').value = d.nombre;
  document.getElementById('inp-email').value  = d.email || '';
  document.getElementById('inp-monto').value  = d.monto || '';
  document.getElementById('inp-fecha').value  = d.fecha || hoy();
  document.getElementById('inp-nota').value   = d.nota || '';
  document.getElementById('form-title').textContent  = 'Editando registro';
  document.getElementById('btn-guardar').textContent = 'Guardar cambios';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function eliminar(id) {
  if (!confirm('¿Eliminar este registro?')) return;
  datos = datos.filter(d => d.id !== id);
  if (editandoId === id) limpiar();
  guardar();
  renderTabla();
  actualizarStats();
  toast('Registro eliminado');
}

function limpiar() {
  editandoId = null;
  ['inp-nombre', 'inp-email', 'inp-monto', 'inp-nota'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('inp-fecha').value = hoy();
  document.getElementById('form-title').textContent  = 'Registrar persona';
  document.getElementById('btn-guardar').textContent = 'Registrar persona';
  document.getElementById('inp-nombre').focus();
}

// ── Render ───────────────────────────────────────────────────────────────────

function filtrar() {
  const q = document.getElementById('search').value.toLowerCase();
  if (!q) return datos;
  return datos.filter(d =>
    d.nombre.toLowerCase().includes(q) ||
    (d.email || '').toLowerCase().includes(q) ||
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

  const accionesCol = adminMode ? '<th></th>' : '';

  wrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Correo</th>
          <th>Fecha</th>
          <th>Artículos</th>
          ${accionesCol}
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
                ? `<span class="badge">${d.monto} artículo${d.monto !== 1 ? 's' : ''}</span>`
                : `<span class="badge badge-none">Sin artículos</span>`}
            </td>
            ${adminMode ? `
            <td>
              <div class="row-actions">
                <button class="btn-edit" onclick="editar(${d.id})">Editar</button>
                <button class="btn-delete" onclick="eliminar(${d.id})">Eliminar</button>
              </div>
            </td>` : ''}
          </tr>
        `).join('')}
      </tbody>
    </table>`;
}

function actualizarStats() {
  const total   = datos.length;
  const monto   = datos.reduce((s, d) => s + (d.monto || 0), 0);
  const donaron = datos.filter(d => d.monto > 0).length;
  document.getElementById('stat-total').textContent    = total;
  document.getElementById('stat-monto').textContent    = monto.toLocaleString('es-MX');
  document.getElementById('stat-donantes').textContent = donaron;
}

function exportarCSV() {
  if (!datos.length) { toast('No hay datos para exportar'); return; }
  const header = ['Nombre', 'Correo', 'Fecha', 'Articulos recibidos', 'Nota'];
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

// ── Utils ────────────────────────────────────────────────────────────────────

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

// ── Init ─────────────────────────────────────────────────────────────────────
cargar();
document.getElementById('inp-fecha').value = hoy();
renderTabla();
actualizarStats();
