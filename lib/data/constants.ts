/**
 * Reference data shared across the dashboard.
 *
 * Lao provinces and districts are static reference data used by the outlet
 * form, the filter toolbars and the segment builder. Everything that used to be
 * demo configuration here (company profile, connection status, pricing, the
 * fixed demo totals) now comes from the API.
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
  /** Approximate share of the national outlet base. */
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
