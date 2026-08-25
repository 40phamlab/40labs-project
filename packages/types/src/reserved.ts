// Reserved-but-inert fields for surfaces not built yet (aMob, public Web App).
// These types exist so no re-registration or migration is needed when those
// surfaces ship — but nothing in core-desktop should import or render these
// beyond storing the dormant profile record at Business registration time.

export interface DormantAmobProfile {
  business_id: string;
  storefront_enabled: boolean; // always false until aMob ships
  display_name: string | null;
  availability_hours: { open: string; close: string } | null;
  availability_days: string[] | null;
  service_modes: {
    e_pharmacy: boolean;
    advice: boolean;
    education: boolean;
    consultancy: boolean;
    delivery: boolean;
  };
}

export interface DormantWebAppListing {
  business_id: string;
  listing_enabled: boolean; // always false until Web App ships
  verification_badges: {
    forty_labs_verified: boolean;
    tmda_registered: boolean;
  };
}