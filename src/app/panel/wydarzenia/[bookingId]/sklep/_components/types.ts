export interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  image?: string | null;
}

export interface BlockServiceCapacity {
  serviceId: string;
  capacity: number;
  spotsTaken: number;
  spotsAvailable: number;
}

// Aktywne (niezanulowane) rezerwacje w bloku — potrzebne do liczenia overlap dla sub-slotów.
export interface BlockOrderRange {
  startTime: string;
  endTime: string;
  serviceId: string;
  isMine: boolean;
}

export interface SpaBlock {
  id: string;
  startTime: string;
  endTime: string;
  capacity: number;
  spotsTaken: number;
  spotsAvailable: number;
  isMine: boolean;
  isOpen: boolean;
  serviceCapacities: BlockServiceCapacity[];
  orders: BlockOrderRange[];
}

export interface SubSlot {
  startTime: string; // ISO
  endTime: string; // ISO
}

export interface ShopData {
  services: Service[];
  blocks: SpaBlock[];
}

export function blockDurationMinutes(block: SpaBlock): number {
  return Math.round(
    (new Date(block.endTime).getTime() -
      new Date(block.startTime).getTime()) /
      60000,
  );
}

// Sub-sloty w bloku otwartym dla konkretnej usługi.
// Siatka co SLOT_STEP minut od startu bloku.
// Slot [t, t+D] jest dostępny gdy w żadnym momencie wewnątrz tego przedziału liczba
// aktywnych rezerwacji nie przekracza block.capacity - 1 (zostawiamy miejsce dla nowej).
const SLOT_STEP_MINUTES = 15;

export function computeOpenBlockSubSlots(
  block: SpaBlock,
  service: Service,
): SubSlot[] {
  if (!block.isOpen) return [];
  const blockStart = new Date(block.startTime).getTime();
  const blockEnd = new Date(block.endTime).getTime();
  const stepMs = SLOT_STEP_MINUTES * 60_000;
  const durationMs = service.duration * 60_000;
  const slots: SubSlot[] = [];

  for (let t = blockStart; t + durationMs <= blockEnd; t += stepMs) {
    const nStart = t;
    const nEnd = t + durationMs;
    if (!fitsCapacity(block, nStart, nEnd)) continue;
    slots.push({
      startTime: new Date(nStart).toISOString(),
      endTime: new Date(nEnd).toISOString(),
    });
  }
  return slots;
}

// Czy nowa rezerwacja [nStart, nEnd] zmieści się przy zachowaniu block.capacity?
// Zliczamy max liczbę nakładających się aktywnych rezerwacji w tym przedziale (sweep line).
function fitsCapacity(
  block: SpaBlock,
  nStart: number,
  nEnd: number,
): boolean {
  const events: { t: number; delta: number }[] = [];
  for (const o of block.orders) {
    const oStart = new Date(o.startTime).getTime();
    const oEnd = new Date(o.endTime).getTime();
    if (oStart >= nEnd || oEnd <= nStart) continue; // no overlap
    events.push({ t: Math.max(oStart, nStart), delta: 1 });
    events.push({ t: Math.min(oEnd, nEnd), delta: -1 });
  }
  events.sort((a, b) => a.t - b.t || a.delta - b.delta);
  let cur = 0;
  let max = 0;
  for (const e of events) {
    cur += e.delta;
    if (cur > max) max = cur;
  }
  return max + 1 <= block.capacity;
}

// Czy dana usługa może być zarezerwowana w tym bloku?
// - wolny blok: istnieje przynajmniej jeden dostępny sub-slot (siatka + capacity)
// - whitelist: usługa musi być na liście + ma wolne per-service miejsce
// Nie sprawdza isMine — to filtrujemy osobno w UI.
export function canBookServiceInBlock(
  service: Service,
  block: SpaBlock,
): boolean {
  if (block.isOpen) {
    if (service.duration > blockDurationMinutes(block)) return false;
    return computeOpenBlockSubSlots(block, service).length > 0;
  }
  const sc = block.serviceCapacities.find(
    (s) => s.serviceId === service.id,
  );
  return !!sc && sc.spotsAvailable > 0;
}
