// WorkHub MTY - Mock-up app
const STORAGE_KEY = 'workhub_reservations';

// Espacios fijos
const PARKING_SPACES = {
  A: Array.from({ length: 20 }, (_, i) => `A${i + 1}`),
  B: Array.from({ length: 20 }, (_, i) => `B${i + 1}`)
};

const OFFICE_SPACES = {
  1: Array.from({ length: 15 }, (_, i) => `P1-${String(i + 1).padStart(2, '0')}`),
  2: Array.from({ length: 15 }, (_, i) => `P2-${String(i + 1).padStart(2, '0')}`)
};

// Estado
let selectedParkingSpace = null;
let selectedOfficeSpace = null;

// Helpers
function getReservations() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveReservations(reservations) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function formatDateStr(date) {
  return date.toISOString().split('T')[0];
}

function getTodayStr() {
  return formatDateStr(new Date());
}

// Lógica de disponibilidad
function getSpaceStatus(tipo, espacio, fecha) {
  const reservations = getReservations();
  const vigente = reservations.find(
    r => r.tipo === tipo && r.espacio === espacio && r.fecha === fecha && r.estado === 'vigente'
  );
  const liberado = reservations.find(
    r => r.tipo === tipo && r.espacio === espacio && r.fecha === fecha && r.estado === 'liberado'
  );
  if (vigente) return 'occupied';
  if (liberado) return 'claimable';
  return 'available';
}

// Navegación
function showView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const view = document.getElementById(`view-${viewId}`);
  const link = document.querySelector(`[data-view="${viewId}"]`);
  if (view) view.classList.add('active');
  if (link) link.classList.add('active');

  if (viewId === 'home') {
    updateHomeStats();
  } else if (viewId === 'my-reservations') {
    renderMyReservations();
  }
}

function initNavigation() {
  document.querySelectorAll('.nav-link, .btn[data-view]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const view = el.dataset.view;
      if (view) showView(view);
    });
  });
}

// Home
function updateHomeStats() {
  const today = getTodayStr();
  let parkingCount = 0;
  let officeCount = 0;
  ['A', 'B'].forEach(zone => {
    PARKING_SPACES[zone].forEach(space => {
      if (getSpaceStatus('estacionamiento', space, today) !== 'occupied') parkingCount++;
    });
  });
  [1, 2].forEach(floor => {
    OFFICE_SPACES[floor].forEach(space => {
      if (getSpaceStatus('oficina', space, today) !== 'occupied') officeCount++;
    });
  });
  const total = parkingCount + officeCount;
  document.getElementById('available-today').textContent = total;
}

// Parking
function renderParkingSpaces() {
  const dateInput = document.getElementById('parking-date');
  const zoneSelect = document.getElementById('parking-zone');
  const container = document.getElementById('parking-spaces');
  const form = document.getElementById('parking-form');

  const date = dateInput.value || getTodayStr();
  const zone = zoneSelect.value;
  const spaces = PARKING_SPACES[zone] || [];

  container.innerHTML = '';
  selectedParkingSpace = null;
  form.classList.add('hidden');

  spaces.forEach(spaceId => {
    const status = getSpaceStatus('estacionamiento', spaceId, date);
    const card = document.createElement('div');
    card.className = `space-card ${status}`;
    card.dataset.space = spaceId;
    card.innerHTML = `
      <span class="space-label">${spaceId}</span>
      <span class="space-status">${status === 'available' ? 'Disponible' : status === 'claimable' ? 'Claim' : 'Ocupado'}</span>
    `;
    if (status !== 'occupied') {
      card.addEventListener('click', () => selectParkingSpace(spaceId, status));
    }
    container.appendChild(card);
  });
}

function selectParkingSpace(spaceId, status) {
  selectedParkingSpace = { id: spaceId, status };
  document.querySelectorAll('#parking-spaces .space-card').forEach(c => c.classList.remove('selected'));
  const card = document.querySelector(`#parking-spaces [data-space="${spaceId}"]`);
  if (card) card.classList.add('selected');

  const form = document.getElementById('parking-form');
  document.getElementById('parking-selected-space').textContent = spaceId;
  form.classList.remove('hidden');
}

function confirmParkingReservation() {
  if (!selectedParkingSpace) return;
  const name = document.getElementById('parking-name').value.trim();
  const email = document.getElementById('parking-email').value.trim();
  const date = document.getElementById('parking-date').value || getTodayStr();
  const zone = document.getElementById('parking-zone').value;

  if (!name || !email) {
    alert('Ingresa nombre y email.');
    return;
  }

  const reservations = getReservations();
  const isClaim = selectedParkingSpace.status === 'claimable';

  if (isClaim) {
    const lib = reservations.find(r =>
      r.tipo === 'estacionamiento' && r.espacio === selectedParkingSpace.id &&
      r.fecha === date && r.estado === 'liberado'
    );
    if (lib) lib.estado = 'reclamado';
  }

  const newRes = {
    id: generateId(),
    tipo: 'estacionamiento',
    espacio: selectedParkingSpace.id,
    fecha: date,
    zona: zone,
    nombre: name,
    email: email,
    estado: 'vigente'
  };
  reservations.push(newRes);
  saveReservations(reservations);

  selectedParkingSpace = null;
  document.getElementById('parking-form').classList.add('hidden');
  document.getElementById('parking-name').value = '';
  document.getElementById('parking-email').value = '';
  renderParkingSpaces();
  showView('my-reservations');
}

// Offices
function renderOfficeSpaces() {
  const dateInput = document.getElementById('office-date');
  const floorSelect = document.getElementById('office-floor');
  const container = document.getElementById('office-spaces');
  const form = document.getElementById('office-form');

  const date = dateInput.value || getTodayStr();
  const floor = parseInt(floorSelect.value, 10);
  const spaces = OFFICE_SPACES[floor] || [];

  container.innerHTML = '';
  selectedOfficeSpace = null;
  form.classList.add('hidden');

  spaces.forEach(spaceId => {
    const status = getSpaceStatus('oficina', spaceId, date);
    const card = document.createElement('div');
    card.className = `space-card ${status}`;
    card.dataset.space = spaceId;
    card.innerHTML = `
      <span class="space-label">${spaceId}</span>
      <span class="space-status">${status === 'available' ? 'Disponible' : status === 'claimable' ? 'Claim' : 'Ocupado'}</span>
    `;
    if (status !== 'occupied') {
      card.addEventListener('click', () => selectOfficeSpace(spaceId, status));
    }
    container.appendChild(card);
  });
}

function selectOfficeSpace(spaceId, status) {
  selectedOfficeSpace = { id: spaceId, status };
  document.querySelectorAll('#office-spaces .space-card').forEach(c => c.classList.remove('selected'));
  const card = document.querySelector(`#office-spaces [data-space="${spaceId}"]`);
  if (card) card.classList.add('selected');

  const form = document.getElementById('office-form');
  document.getElementById('office-selected-space').textContent = spaceId;
  form.classList.remove('hidden');
}

function confirmOfficeReservation() {
  if (!selectedOfficeSpace) return;
  const name = document.getElementById('office-name').value.trim();
  const email = document.getElementById('office-email').value.trim();
  const date = document.getElementById('office-date').value || getTodayStr();
  const floor = document.getElementById('office-floor').value;

  if (!name || !email) {
    alert('Ingresa nombre y email.');
    return;
  }

  const reservations = getReservations();
  const isClaim = selectedOfficeSpace.status === 'claimable';

  if (isClaim) {
    const lib = reservations.find(r =>
      r.tipo === 'oficina' && r.espacio === selectedOfficeSpace.id &&
      r.fecha === date && r.estado === 'liberado'
    );
    if (lib) lib.estado = 'reclamado';
  }

  const newRes = {
    id: generateId(),
    tipo: 'oficina',
    espacio: selectedOfficeSpace.id,
    fecha: date,
    piso: floor,
    nombre: name,
    email: email,
    estado: 'vigente'
  };
  reservations.push(newRes);
  saveReservations(reservations);

  selectedOfficeSpace = null;
  document.getElementById('office-form').classList.add('hidden');
  document.getElementById('office-name').value = '';
  document.getElementById('office-email').value = '';
  renderOfficeSpaces();
  showView('my-reservations');
}

// My reservations
function renderMyReservations() {
  const container = document.getElementById('reservations-list');
  const reservations = getReservations().filter(r => r.estado === 'vigente');

  if (reservations.length === 0) {
    container.innerHTML = '<p class="empty-state">No tienes reservas activas.</p>';
    return;
  }

  container.innerHTML = reservations.map(r => `
    <div class="reservation-card vigente" data-id="${r.id}">
      <div class="reservation-info">
        <p><strong>${r.tipo === 'estacionamiento' ? 'Estacionamiento' : 'Oficina'}</strong> - ${r.espacio}</p>
        <p>Fecha: ${r.fecha}</p>
        <p>${r.nombre} (${r.email})</p>
      </div>
      <div class="reservation-actions">
        <button class="btn btn-secondary btn-cancelar" data-id="${r.id}">Cancelar</button>
        <button class="btn btn-secondary btn-liberar" data-id="${r.id}">Liberar (no asistí)</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.btn-liberar').forEach(btn => {
    btn.addEventListener('click', () => liberarReserva(btn.dataset.id));
  });
  container.querySelectorAll('.btn-cancelar').forEach(btn => {
    btn.addEventListener('click', () => cancelarReserva(btn.dataset.id));
  });
}

function cancelarReserva(id) {
  const reservations = getReservations();
  const r = reservations.find(x => x.id === id);
  if (!r) return;
  r.estado = 'cancelado';
  saveReservations(reservations);
  renderMyReservations();
}

function liberarReserva(id) {
  const reservations = getReservations();
  const r = reservations.find(x => x.id === id);
  if (!r) return;
  r.estado = 'liberado';
  saveReservations(reservations);
  renderMyReservations();
  showView(r.tipo === 'estacionamiento' ? 'parking' : 'offices');
  if (r.tipo === 'estacionamiento') {
    document.getElementById('parking-date').value = r.fecha;
    document.getElementById('parking-zone').value = r.zona || 'A';
    renderParkingSpaces();
  } else {
    document.getElementById('office-date').value = r.fecha;
    document.getElementById('office-floor').value = r.piso || '1';
    renderOfficeSpaces();
  }
}

// Init
function init() {
  const today = getTodayStr();
  document.getElementById('parking-date').value = today;
  document.getElementById('office-date').value = today;

  initNavigation();
  renderParkingSpaces();
  renderOfficeSpaces();
  updateHomeStats();

  document.getElementById('parking-search').addEventListener('click', renderParkingSpaces);
  document.getElementById('office-search').addEventListener('click', renderOfficeSpaces);

  document.getElementById('parking-confirm').addEventListener('click', confirmParkingReservation);
  document.getElementById('parking-cancel-form').addEventListener('click', () => {
    selectedParkingSpace = null;
    document.getElementById('parking-form').classList.add('hidden');
    document.querySelectorAll('#parking-spaces .space-card').forEach(c => c.classList.remove('selected'));
  });

  document.getElementById('office-confirm').addEventListener('click', confirmOfficeReservation);
  document.getElementById('office-cancel-form').addEventListener('click', () => {
    selectedOfficeSpace = null;
    document.getElementById('office-form').classList.add('hidden');
    document.querySelectorAll('#office-spaces .space-card').forEach(c => c.classList.remove('selected'));
  });
}

document.addEventListener('DOMContentLoaded', init);
