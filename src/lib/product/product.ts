export type ProductEdition = "demo" | "commercial" | "enterprise";
export type LicenseStatus = "DEMO" | "TRIAL" | "ACTIVE" | "EXPIRED" | "SUSPENDED";
export type LicenseScope = "individual" | "team" | "organization" | "enterprise";
export type MemberRole = "owner" | "administrator" | "designer" | "editor" | "reviewer" | "viewer";

export interface FeatureEntitlements {
  maxProjects: number | null;
  maxPagesPerProject: number | null;
  premiumTemplates: boolean;
  advancedExports: boolean;
  brandKit: boolean;
  organizationWorkspace: boolean;
  collaboration: boolean;
  dataImport: boolean;
}

export interface LicenseRecord {
  id: string;
  edition: ProductEdition;
  scope: LicenseScope;
  status: LicenseStatus;
  customerName?: string;
  organizationName?: string;
  expiresAt?: string;
  maxUsers?: number;
  entitlements: FeatureEntitlements;
  /** Server-issued records should replace this local demo record in production. */
  source: "demo-local" | "server";
}

export interface OrganizationProfile {
  id: string;
  name: string;
  roles: MemberRole[];
  createdAt: string;
}

export interface BrandKit {
  organizationName: string;
  logoSrc?: string;
  secondaryLogoSrc?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  arabicFont: string;
  englishFont: string;
  headerStyle: "minimal" | "official" | "band";
  footerStyle: "simple" | "official" | "none";
  tableStyle: "clean" | "striped" | "formal";
  chartStyle: "flat" | "accent" | "formal";
  pageSize: "a4-portrait" | "a4-landscape" | "custom";
}

export const DEMO_LICENSE: LicenseRecord = {
  id: "demo-local",
  edition: "demo",
  scope: "individual",
  status: "DEMO",
  entitlements: {
    maxProjects: 3,
    maxPagesPerProject: 12,
    premiumTemplates: false,
    advancedExports: true,
    brandKit: true,
    organizationWorkspace: false,
    collaboration: false,
    dataImport: false,
  },
  source: "demo-local",
};

export const DEFAULT_BRAND_KIT: BrandKit = {
  organizationName: "",
  primaryColor: "#0c3d2c",
  secondaryColor: "#145c42",
  accentColor: "#c6a05a",
  arabicFont: "Tajawal",
  englishFont: "IBM Plex Sans",
  headerStyle: "official",
  footerStyle: "official",
  tableStyle: "formal",
  chartStyle: "formal",
  pageSize: "a4-portrait",
};

export function hasFeature(license: LicenseRecord, feature: keyof FeatureEntitlements): boolean {
  const value = license.entitlements[feature];
  return typeof value === "boolean" ? value : value === null || value > 0;
}

export function demoModeFromLocation(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("demo") === "1";
}
