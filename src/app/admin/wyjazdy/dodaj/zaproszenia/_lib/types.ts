export interface Highlight {
  emoji: string;
  label: string;
}

export interface TagDef {
  name: string;
  label: string;
  bg: string;
  color: string;
  border: string;
}

export interface TripContext {
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
}
