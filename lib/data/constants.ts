/**
 * Shared demo configuration: Lao provinces/districts, outlet categories,
 * audience presets and the fixed totals used by the dashboard KPIs.
 *
 * All values here are illustrative demo data for the prototype.
 */

export const COMPANY = {
  name: "Lao Brewery Co., Ltd.",
  group: "Carlsberg Group",
  programme: "Partner Club",
  country: "Laos",
  countryCode: "LA",
  dialCode: "+856",
};

export interface ProvinceInfo {
  name: string;
  region: "North" | "Central" | "South";
  /** Relative share of outlets used by the demo data generator. */
  weight: number;
  districts: string[];
}

export const PROVINCES: ProvinceInfo[] = [
  {
    name: "Vientiane Capital",
    region: "Central",
    weight: 0.262,
    districts: [
      "Chanthabouly",
      "Sikhottabong",
      "Xaysetha",
      "Sisattanak",
      "Naxaithong",
      "Hadxaifong",
      "Sangthong",
      "Pak Ngum",
      "Mayparkngum",
    ],
  },
  {
    name: "Savannakhet",
    region: "South",
    weight: 0.113,
    districts: [
      "Kaysone Phomvihane",
      "Outhoumphone",
      "Atsaphangthong",
      "Phine",
      "Xephon",
      "Songkhone",
      "Champhone",
      "Thapangthong",
      "Nong",
      "Xayboury",
      "Vilaboury",
      "Phalanxay",
      "Sepone",
    ],
  },
  {
    name: "Champasack",
    region: "South",
    weight: 0.094,
    districts: [
      "Pakse",
      "Sanasomboun",
      "Batiengchaleunsouk",
      "Paksong",
      "Pathoumphon",
      "Phonthong",
      "Champasack",
      "Sukhuma",
      "Mounlapamok",
      "Khong",
    ],
  },
  {
    name: "Luang Prabang",
    region: "North",
    weight: 0.072,
    districts: [
      "Luang Prabang",
      "Xieng Ngeun",
      "Nan",
      "Pak Ou",
      "Nambak",
      "Ngoi",
      "Pakxeng",
      "Phonxay",
      "Chomphet",
      "Viengkham",
    ],
  },
  {
    name: "Khammouane",
    region: "Central",
    weight: 0.063,
    districts: [
      "Thakhek",
      "Mahaxay",
      "Nongbok",
      "Hinboun",
      "Nhommalath",
      "Bualapha",
      "Nakai",
      "Xebangfay",
      "Xaybuathong",
    ],
  },
  {
    name: "Vientiane Province",
    region: "Central",
    weight: 0.052,
    districts: [
      "Phonhong",
      "Thoulakhom",
      "Keo Oudom",
      "Kasi",
      "Vangvieng",
      "Feuang",
      "Xanakharm",
      "Meun",
      "Viengkham",
    ],
  },
  {
    name: "Bokeo",
    region: "North",
    weight: 0.043,
    districts: ["Huayxai", "Tonpheung", "Meung", "Pha Oudom", "Paktha"],
  },
  {
    name: "Oudomxay",
    region: "North",
    weight: 0.041,
    districts: ["Xay", "La", "Namor", "Nga", "Beng", "Houn", "Pakbeng"],
  },
  {
    name: "Xayabouly",
    region: "North",
    weight: 0.04,
    districts: [
      "Xayabouly",
      "Khop",
      "Hongsa",
      "Ngeun",
      "Xienghone",
      "Phiang",
      "Paklai",
      "Kenethao",
      "Botene",
      "Thongmyxay",
    ],
  },
  {
    name: "Bolikhamxay",
    region: "Central",
    weight: 0.039,
    districts: [
      "Pakkading",
      "Thaphabath",
      "Pakxan",
      "Borikhan",
      "Khamkeuth",
      "Viengthong",
      "Xaychamphone",
    ],
  },
  {
    name: "Luang Namtha",
    region: "North",
    weight: 0.031,
    districts: ["Luang Namtha", "Sing", "Long", "Viengphoukha", "Nalae"],
  },
  {
    name: "Xieng Khouang",
    region: "North",
    weight: 0.03,
    districts: ["Pek", "Kham", "Nong Het", "Khoune", "Phaxay", "Phou Kout", "Thathom"],
  },
  {
    name: "Houaphanh",
    region: "North",
    weight: 0.027,
    districts: [
      "Xam Neua",
      "Xiengkhor",
      "Hiam",
      "Viengxay",
      "Huameuang",
      "Samtai",
      "Sophbao",
      "Et",
      "Kuan",
      "Xone",
    ],
  },
  {
    name: "Salavan",
    region: "South",
    weight: 0.026,
    districts: [
      "Salavan",
      "Ta Oy",
      "Toomlarn",
      "Lakhonepheng",
      "Vapy",
      "Khongsedone",
      "Lao Ngam",
      "Samuoi",
    ],
  },
  {
    name: "Attapeu",
    region: "South",
    weight: 0.025,
    districts: ["Samakkhixay", "Samaysy", "Phouvong", "Xanxay", "Sanamxay"],
  },
  {
    name: "Phongsaly",
    region: "North",
    weight: 0.022,
    districts: ["Phongsaly", "May", "Khoua", "Samphanh", "Boun Neua", "Nhot Ou", "Boun Tay"],
  },
  {
    name: "Xekong",
    region: "South",
    weight: 0.017,
    districts: ["Lamam", "Kaleum", "Dakchung", "Thateng"],
  },
  {
    name: "Xaisomboun",
    region: "Central",
    weight: 0.013,
    districts: ["Anouvong", "Longcheng", "Thathom", "Hom", "Longsane"],
  },
];

export const PROVINCE_NAMES = PROVINCES.map((province) => province.name) as [
  string,
  ...string[],
];

export function districtsFor(province: string): string[] {
  return PROVINCES.find((item) => item.name === province)?.districts ?? [];
}

export const REGIONS = ["North", "Central", "South"] as const;

/** Fixed demo totals. Related metrics are kept arithmetically consistent. */
export const DEMO_TOTALS = {
  outlets: 12_480,
  eligibleContacts: 10_860,
  consentedContacts: 10_320,
  missingPhone: 96,
  invalidPhone: 288,
  duplicatePhoneRecords: 84,
  campaignsThisMonth: 18,
  monthAttempted: 44_062,
  monthSent: 43_842,
  monthDelivered: 42_650,
  monthFailed: 1_412,
} as const;

/**
 * Messages that never left the queue are counted as failed attempts, so
 * `attempted = sent + failed`. Delivered is always a subset of sent.
 */
export const MONTH_DELIVERY = {
  attempted: DEMO_TOTALS.monthAttempted,
  sent: DEMO_TOTALS.monthSent,
  delivered: DEMO_TOTALS.monthDelivered,
  failed: DEMO_TOTALS.monthFailed,
  undelivered: DEMO_TOTALS.monthSent - DEMO_TOTALS.monthDelivered,
  deliveryRate: DEMO_TOTALS.monthDelivered / DEMO_TOTALS.monthSent,
};

/** Campaign objectives aligned with the Partner Club programme. */
export const CAMPAIGN_OWNERS = [
  "Khamla Sisouphan",
  "Bounmy Phommaly",
  "Somsanith Vongsa",
  "Malee Inthavong",
  "Anousone Chantavong",
] as const;

export const CURRENT_USER = {
  name: "Khamla Sisouphan",
  email: "khamla.sisouphan@laobrewery-demo.la",
  role: "Marketing Manager" as const,
  initials: "KS",
};

export const WHATSAPP_CONNECTION = {
  status: "demo" as "demo" | "connected" | "disconnected",
  businessAccount: "Not connected",
  phoneNumberId: null as string | null,
  displayName: null as string | null,
  lastSync: null as string | null,
  note: "No WhatsApp Business Platform credentials are configured. Campaign sends are simulated in the browser only.",
};

export const OUTLET_DATABASE_CONNECTION = {
  status: "demo" as "demo" | "connected" | "disconnected",
  name: "Partner Club outlet register (demo)",
  note: "Outlets are generated locally from the demo dataset. No database connection is configured.",
};

export const PRICING = {
  configured: false,
  currency: "USD",
  note: "Conversation pricing has not been configured, so campaign cost estimates are unavailable.",
};
