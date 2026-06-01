export interface ServiceStats {
  ordersActive: number;
  ordersPaid: number;
  ordersPending: number;
  revenuePaid: number;
  buyers: number;
}

export interface CampService {
  id: string;
  name: string;
  duration: number;
  price: number;
  description: string | null;
  image: string | null;
  sourceServiceId: string | null;
  isLinked: boolean;
  linkedCampsCount: number;
  stats: ServiceStats;
}

export interface CatalogService {
  id: string;
  name: string;
  duration: number;
  price: number;
  description: string | null;
  image: string | null;
  inCamp: boolean;
}

export interface ShopStats {
  servicesCount: number;
  totalSold: number;
  pendingCount: number;
  totalRevenue: number;
  distinctBuyers: number;
  topService: { name: string; sold: number } | null;
}

export interface ShopData {
  services: CampService[];
  catalog: CatalogService[];
  stats: ShopStats;
}

export const formatPLN = (amount: number) =>
  new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
  }).format(amount);

// Upload zdjęcia usługi do Vercel Blob. Zwraca publiczny URL lub null.
export async function uploadServiceImage(file: File): Promise<string | null> {
  const res = await fetch(
    `/api/admin/wyjazdy/service-image?filename=${encodeURIComponent(file.name)}`,
    { method: "POST", body: file },
  );
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data?.url ?? null;
}
