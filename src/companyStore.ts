function randomCompanyId() {
  
  const s4 = () => Math.random().toString(16).slice(2, 6);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

export type Company = {
  companyId: string;
  companyName: string;
  email: string;
  region: string;
};

export function getCompany(): Company | null {
  const companyId = localStorage.getItem("companyId");
  if (!companyId) return null;

  return {
    companyId,
    companyName: localStorage.getItem("companyName") || "rama",
    email: localStorage.getItem("email") || "lab@copm.jo",
    region: localStorage.getItem("region") || "Jordan",
  };
}

export function requireCompany(): Company {
  const c = getCompany();
  if (!c) {
    window.location.href = "/#/company-setup";
    throw new Error("Company not set");
  }
  return c;
}

export function saveCompany(input: Omit<Company, "companyId">) {
  let companyId = localStorage.getItem("companyId");
  if (!companyId) {
    companyId = randomCompanyId();
    localStorage.setItem("companyId", companyId);
  }
  localStorage.setItem("companyName", input.companyName.trim());
  localStorage.setItem("email", input.email.trim());
  localStorage.setItem("region", input.region.trim());
}

export function resetCompany() {
  localStorage.removeItem("companyId");
  localStorage.removeItem("companyName");
  localStorage.removeItem("email");
  localStorage.removeItem("region");
  window.location.href = "/#/company-setup";
}
