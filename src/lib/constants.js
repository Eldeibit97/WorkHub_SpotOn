const STORAGE_KEY = 'workhub_reservations';

const PARKING_SPACES = {
  A: Array.from({ length: 20 }, (_, i) => `A${i + 1}`),
  B: Array.from({ length: 20 }, (_, i) => `B${i + 1}`)
};

const OFFICE_SPACES = {
  1: Array.from({ length: 15 }, (_, i) => `P1-${String(i + 1).padStart(2, '0')}`),
  2: Array.from({ length: 15 }, (_, i) => `P2-${String(i + 1).padStart(2, '0')}`)
};

export function getReservations() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveReservations(reservations) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

export function getSpaceStatus(reservations, tipo, espacio, fecha) {
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

export { STORAGE_KEY, PARKING_SPACES, OFFICE_SPACES };
