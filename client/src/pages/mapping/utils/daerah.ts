export interface Daerah {
  nama: string;
  zona_latitude: [number, number];
  zona_longitude: [number, number];
}

export const daerahJawa: Daerah[] = [
  // Jawa Timur
  {
    nama: 'Surabaya',
    zona_latitude: [-7.35, -7.1],
    zona_longitude: [112.5, 112.8],
  },
  {
    nama: 'Malang',
    zona_latitude: [-8.05, -7.95],
    zona_longitude: [112.55, 112.7],
  },
  {
    nama: 'Kediri',
    zona_latitude: [-7.9, -7.75],
    zona_longitude: [111.95, 112.1],
  },
  {
    nama: 'Jember',
    zona_latitude: [-8.25, -8.1],
    zona_longitude: [113.55, 113.75],
  },

  // Jawa Tengah
  {
    nama: 'Semarang',
    zona_latitude: [-7.05, -6.9],
    zona_longitude: [110.3, 110.5],
  },
  {
    nama: 'Surakarta',
    zona_latitude: [-7.6, -7.5],
    zona_longitude: [110.75, 110.85],
  },
  {
    nama: 'Tegal',
    zona_latitude: [-6.9, -6.85],
    zona_longitude: [109.1, 109.2],
  },
  {
    nama: 'Pekalongan',
    zona_latitude: [-6.95, -6.85],
    zona_longitude: [109.6, 109.7],
  },

  // DI Yogyakarta
  {
    nama: 'Yogyakarta',
    zona_latitude: [-7.85, -7.75],
    zona_longitude: [110.3, 110.45],
  },

  // Jawa Barat
  {
    nama: 'Bandung',
    zona_latitude: [-6.95, -6.85],
    zona_longitude: [107.55, 107.65],
  },
  {
    nama: 'Bogor',
    zona_latitude: [-6.65, -6.55],
    zona_longitude: [106.75, 106.85],
  },
  {
    nama: 'Cirebon',
    zona_latitude: [-6.8, -6.7],
    zona_longitude: [108.5, 108.6],
  },

  {
    nama: 'Serang',
    zona_latitude: [-6.15, -6.05],
    zona_longitude: [106.1, 106.2],
  },
  {
    nama: 'Tangerang',
    zona_latitude: [-6.25, -6.1],
    zona_longitude: [106.55, 106.75],
  },
];
