<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FoTableSeeder extends Seeder
{
    public function run()
    {
        $this->disableForeignKeys();
        $this->truncateAll();
        $this->enableForeignKeys();

        $lokasis = $this->seedLokasis();
        $odcs = $this->seedOdcs($lokasis);
        $kabelOdcs = $this->seedKabelOdcs($odcs);
        $tubeOdcs = $this->seedKabelTubeOdcs($kabelOdcs);
        $coreOdcs = $this->seedKabelCoreOdcs($tubeOdcs);
        $odps = $this->seedOdps($lokasis, $coreOdcs);
        $this->seedClients($lokasis, $odps);

        $this->command->info('FoTableSeeder completed successfully.');
    }

    protected function disableForeignKeys()
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
    }

    protected function enableForeignKeys()
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
    }

    protected function truncateAll()
    {
        foreach (
            [
                'fo_client_ftths',
                'fo_odps',
                'fo_kabel_core_odcs',
                'fo_kabel_tube_odcs',
                'fo_kabel_odcs',
                'fo_odcs',
                'fo_lokasis',
            ] as $table
        ) {
            DB::table($table)->truncate();
        }
    }

    protected function seedLokasis(): array
    {
        $rows = [];
        for ($i = 1; $i <= 3; $i++) {
            $rows[] = [
                'id'           => $i,
                'nama_lokasi'  => "Lokasi {$i}",
                'deskripsi'    => "Deskripsi lokasi {$i}",
                'latitude'     => -6.2 + $i * 0.01,
                'longitude'    => 106.8 + $i * 0.01,
                'status'       => 'active',
                'deleted_at'   => null, // soft delete default
                'created_at'   => now(),
                'updated_at'   => now(),
            ];
        }
        DB::table('fo_lokasis')->insert($rows);
        return $rows;
    }

    protected function seedOdcs(array $lokasis): array
    {
        $rows = [];
        foreach ($lokasis as $lokasi) {
            for ($i = 1; $i <= 2; $i++) {
                $rows[] = [
                    'id'           => (($lokasi['id'] - 1) * 2) + $i,
                    'lokasi_id'    => $lokasi['id'],
                    'nama_odc'     => "ODC {$lokasi['id']}-{$i}",
                    'tipe_splitter' => collect(['1:2', '1:4', '1:8', '1:16', '1:32', '1:64', '1:128'])->random(),
                    'status'       => 'active',
                    'deleted_at'   => null,
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ];
            }
        }
        DB::table('fo_odcs')->insert($rows);
        return $rows;
    }

    protected function seedKabelOdcs(array $odcs): array
    {
        $rows = [];
        foreach ($odcs as $odc) {
            for ($i = 1; $i <= 2; $i++) {
                $jumlahTube       = rand(1, 6);
                $jumlahCoreInTube = rand(2, 12);
                $rows[] = [
                    'id'                 => count($rows) + 1,
                    'odc_id'             => $odc['id'],
                    'nama_kabel'         => "KabelODC {$odc['id']}-{$i}",
                    'tipe_kabel'         => collect(['singlecore', 'multicore'])->random(),
                    'panjang_kabel'      => rand(100, 500),
                    'jumlah_tube'        => $jumlahTube,
                    'jumlah_core_in_tube' => $jumlahCoreInTube,
                    'jumlah_total_core'  => $jumlahTube * $jumlahCoreInTube,
                    'status'             => 'active',
                    'deleted_at'         => null,
                    'created_at'         => now(),
                    'updated_at'         => now(),
                ];
            }
        }
        DB::table('fo_kabel_odcs')->insert($rows);
        return $rows;
    }

    protected function seedKabelTubeOdcs(array $kabelOdcs): array
    {
        $colors = ['biru', 'jingga', 'hijau', 'coklat', 'abu_abu', 'putih', 'merah', 'hitam', 'kuning', 'ungu', 'merah_muda', 'aqua'];
        $rows = [];
        foreach ($kabelOdcs as $kabel) {
            for ($i = 0; $i < $kabel['jumlah_tube']; $i++) {
                $rows[] = [
                    'id'             => count($rows) + 1,
                    'kabel_odc_id'   => $kabel['id'],
                    'warna_tube'     => $colors[$i % count($colors)],
                    'status'         => 'active',
                    'deleted_at'     => null,
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ];
            }
        }
        DB::table('fo_kabel_tube_odcs')->insert($rows);
        return $rows;
    }

    protected function seedKabelCoreOdcs(array $tubeOdcs): array
    {
        $colors = ['biru', 'jingga', 'hijau', 'coklat', 'abu_abu', 'putih', 'merah', 'hitam', 'kuning', 'ungu', 'merah_muda', 'aqua'];
        $rows = [];
        foreach ($tubeOdcs as $tube) {
            // Tetap random antara 2–12 core per tube, meski migrasi tidak memaksa jumlah pasti
            for ($i = 0; $i < rand(2, 12); $i++) {
                $rows[] = [
                    'id'               => count($rows) + 1,
                    'kabel_tube_odc_id' => $tube['id'],
                    'warna_core'       => $colors[$i % count($colors)],
                    'status'           => 'active',
                    'deleted_at'       => null,
                    'created_at'       => now(),
                    'updated_at'       => now(),
                ];
            }
        }
        DB::table('fo_kabel_core_odcs')->insert($rows);
        return $rows;
    }

    protected function seedOdps(array $lokasis, array $coreOdcs): array
    {
        $rows = [];
        foreach ($lokasis as $lokasi) {
            foreach ($coreOdcs as $core) {
                // Contoh logika relasi: kalau id core mod id lokasi == 0
                if ($core['id'] % $lokasi['id'] === 0) {
                    $rows[] = [
                        'id'                 => count($rows) + 1,
                        'kabel_core_odc_id'  => $core['id'],
                        'lokasi_id'          => $lokasi['id'],
                        'nama_odp'           => "ODP {$lokasi['id']}-{$core['id']}",
                        'status'             => 'active',
                        'deleted_at'         => null,
                        'created_at'         => now(),
                        'updated_at'         => now(),
                    ];
                }
            }
        }
        DB::table('fo_odps')->insert($rows);
        return $rows;
    }

    protected function seedClients(array $lokasis, array $odps): void
    {
        $rows = [];
        foreach ($lokasis as $lokasi) {
            foreach ($odps as $odp) {
                if ($odp['id'] % $lokasi['id'] === 0) {
                    $rows[] = [
                        'id'           => count($rows) + 1,
                        'lokasi_id'    => $lokasi['id'],
                        'odp_id'       => $odp['id'],
                        'nama_client'  => "Client {$lokasi['id']}-{$odp['id']}",
                        'alamat'       => "Jl. Dummy {$lokasi['id']}-{$odp['id']}",
                        'status'       => 'active',
                        'deleted_at'   => null,
                        'created_at'   => now(),
                        'updated_at'   => now(),
                    ];
                }
            }
        }
        DB::table('fo_client_ftths')->insert($rows);
    }
}
