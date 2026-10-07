export interface District {
  name: string;
}

export interface Region {
  name: string;
  districts: string[];
}

export const TZ_ADMIN_AREAS: Region[] = [
  {
    name: 'Dar es Salaam',
    districts: ['Ilala', 'Kinondoni', 'Temeke', 'Ubungo', 'Kigamboni', 'Nyingine'],
  },
  {
    name: 'Arusha',
    districts: ['Arusha City', 'Arusha DC', 'Meru', 'Karatu', 'Longido', 'Ngorongoro', 'Nyingine'],
  },
  {
    name: 'Mwanza',
    districts: ['Ilemela', 'Nyamagana', 'Misungwi', 'Magu', 'Kwimba', 'Sengerema', 'Ukerewe', 'Nyingine'],
  },
  {
    name: 'Other / Nyingine',
    districts: ['Nyingine'],
  },
];
