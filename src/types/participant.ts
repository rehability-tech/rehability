// Typ danych uczestnika zwracany przez /api/admin/wyjazdy/[id]/uczestnicy/[participantId]

export interface HealthProfileData {
  dietType?: string | null;
  allergies?: string | null;
  chronicConditions?: string | null;
  medications?: string | null;
  injuries?: string | null;
  foodIntolerances?: string[] | null;
  foodNotes?: string | null;
  emergencyName?: string | null;
  emergencyPhone?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ParticipantUserData {
  id?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  image?: string | null;
  healthProfile?: HealthProfileData | null;
}

export interface ServiceOrderData {
  id: string;
  status: string;
  price: number | string;
  startTime?: string | null;
  paidAt?: string | null;
  createdAt?: string | null;
  service?: { name?: string | null } | null;
  spaBlock?: { startTime?: string | null } | null;
}

export interface ParticipantData {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  amountPaid?: number | null;
  amountTotal?: number | null;
  createdAt?: string | null;
  depositPaidAt?: string | null;
  remainderPaidAt?: string | null;
  user?: ParticipantUserData | null;
  serviceOrders?: ServiceOrderData[] | null;
}
