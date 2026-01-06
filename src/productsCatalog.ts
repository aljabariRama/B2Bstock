export const PRODUCTS = [
  { productId: "P1", name: "DNA Kit", tag: "Genetics", icon: "🧬" },
  { productId: "P2", name: "Blood Kit", tag: "Lab", icon: "🩸" },
  { productId: "P3", name: "Microbiome", tag: "Microbiology", icon: "🦠" },
] as const;

export type ProductId = (typeof PRODUCTS)[number]["productId"];
