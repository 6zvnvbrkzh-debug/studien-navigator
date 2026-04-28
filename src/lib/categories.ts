export const EXPENSE_CATEGORIES = ["rent", "food", "transport", "leisure", "education", "health", "other"] as const;
export const INCOME_CATEGORIES = ["salary", "bafoeg", "parents", "side_job", "other"] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  rent: "hsl(217 91% 55%)",
  food: "hsl(0 84% 60%)",
  transport: "hsl(38 92% 50%)",
  leisure: "hsl(280 70% 60%)",
  education: "hsl(142 71% 45%)",
  health: "hsl(190 80% 50%)",
  other: "hsl(215 16% 47%)",
  salary: "hsl(142 71% 45%)",
  bafoeg: "hsl(217 91% 55%)",
  parents: "hsl(280 70% 60%)",
  side_job: "hsl(38 92% 50%)",
};