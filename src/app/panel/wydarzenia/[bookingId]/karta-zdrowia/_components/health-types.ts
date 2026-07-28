export interface HealthData {
  dietType: string;
  foodIntolerances: string[];
  foodNotes: string;
  chronicConditions: string;
  medications: string;
  injuries: string;
  allergies: string;
  emergencyName: string;
  emergencyPhone: string;
}

export const DIET_OPTIONS = [
  { value: "OMNIVORE", label: "Wszystkożerna" },
  { value: "VEGETARIAN", label: "Wegetariańska" },
  { value: "VEGAN", label: "Wegańska" },
  { value: "OTHER", label: "Inna" },
];

export const INTOLERANCE_OPTIONS = [
  "Gluten",
  "Laktoza",
  "Orzechy",
  "Jaja",
  "Ryby",
  "Owoce morza",
  "Soja",
];

export const EMPTY_HEALTH: HealthData = {
  dietType: "OMNIVORE",
  foodIntolerances: [],
  foodNotes: "",
  chronicConditions: "",
  medications: "",
  injuries: "",
  allergies: "",
  emergencyName: "",
  emergencyPhone: "",
};

export type SetField = <K extends keyof HealthData>(
  key: K,
  value: HealthData[K],
) => void;
