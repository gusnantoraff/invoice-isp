<?php

namespace App\Http\Controllers;

use App\Models\FoKabelOdp;
use Illuminate\Http\Request;

class FoKabelOdpController extends Controller
{
    /**
     * List all kabel‐odp entries.
     */
    public function index()
    {
        $items = FoKabelOdp::with('odp')->get()->map(function ($k) {
            return [
                'id'               => $k->id,
                'odp_id'           => $k->odp_id,
                'odp'              => [
                    'id'      => $k->odp->id,
                    'nama_odp' => $k->odp->nama_odp,
                ],
                'nama_kabel_odp'   => $k->nama_kabel_odp,
                'tipe_kabel'       => $k->tipe_kabel,
                'panjang_kabel'    => $k->panjang_kabel,
                'jumlah_tube'      => $k->jumlah_tube,
                'jumlah_core'      => $k->jumlah_core,
                'created_at'       => $k->created_at->toDateTimeString(),
                'updated_at'       => $k->updated_at->toDateTimeString(),
            ];
        });

        return response()->json([
            'status' => 'success',
            'data'   => $items,
        ], 200);
    }

    /**
     * Create a new kabel‐odp.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'odp_id'            => 'required|exists:fo_odps,id',
            'nama_kabel_odp'    => 'required|string|max:255',
            'tipe_kabel'        => 'required|in:singlecore,multicore',
            'panjang_kabel'     => 'required|integer',
            'jumlah_tube'       => 'required|integer',
            'jumlah_core'       => 'required|integer',
        ]);

        $k = FoKabelOdp::create($data);

        return response()->json([
            'status'  => 'success',
            'data'    => [
                'id'               => $k->id,
                'odp_id'           => $k->odp_id,
                'nama_kabel_odp'   => $k->nama_kabel_odp,
                'tipe_kabel'       => $k->tipe_kabel,
                'panjang_kabel'    => $k->panjang_kabel,
                'jumlah_tube'      => $k->jumlah_tube,
                'jumlah_core'      => $k->jumlah_core,
                'created_at'       => $k->created_at->toDateTimeString(),
                'updated_at'       => $k->updated_at->toDateTimeString(),
            ],
            'message' => 'Kabel ODP created.',
        ], 201);
    }

    /**
     * Show a single kabel‐odp.
     */
    public function show(FoKabelOdp $foKabelOdp)
    {
        $foKabelOdp->load('odp');

        return response()->json([
            'status' => 'success',
            'data'   => [
                'id'               => $foKabelOdp->id,
                'odp_id'           => $foKabelOdp->odp_id,
                'odp'              => [
                    'id'      => $foKabelOdp->odp->id,
                    'nama_odp' => $foKabelOdp->odp->nama_odp,
                ],
                'nama_kabel_odp'   => $foKabelOdp->nama_kabel_odp,
                'tipe_kabel'       => $foKabelOdp->tipe_kabel,
                'panjang_kabel'    => $foKabelOdp->panjang_kabel,
                'jumlah_tube'      => $foKabelOdp->jumlah_tube,
                'jumlah_core'      => $foKabelOdp->jumlah_core,
                'created_at'       => $foKabelOdp->created_at->toDateTimeString(),
                'updated_at'       => $foKabelOdp->updated_at->toDateTimeString(),
            ],
        ], 200);
    }

    /**
     * Update an existing kabel‐odp.
     */
    public function update(Request $request, FoKabelOdp $foKabelOdp)
    {
        $data = $request->validate([
            'odp_id'            => 'sometimes|exists:fo_odps,id',
            'nama_kabel_odp'    => 'sometimes|string|max:255',
            'tipe_kabel'        => 'sometimes|in:singlecore,multicore',
            'panjang_kabel'     => 'sometimes|integer',
            'jumlah_tube'       => 'sometimes|integer',
            'jumlah_core'       => 'sometimes|integer',
        ]);

        $foKabelOdp->update($data);

        return response()->json([
            'status'  => 'success',
            'data'    => [
                'id'               => $foKabelOdp->id,
                'odp_id'           => $foKabelOdp->odp_id,
                'nama_kabel_odp'   => $foKabelOdp->nama_kabel_odp,
                'tipe_kabel'       => $foKabelOdp->tipe_kabel,
                'panjang_kabel'    => $foKabelOdp->panjang_kabel,
                'jumlah_tube'      => $foKabelOdp->jumlah_tube,
                'jumlah_core'      => $foKabelOdp->jumlah_core,
                'created_at'       => $foKabelOdp->created_at->toDateTimeString(),
                'updated_at'       => $foKabelOdp->updated_at->toDateTimeString(),
            ],
            'message' => 'Kabel ODP updated.',
        ], 200);
    }

    /**
     * Delete a kabel‐odp.
     */
    public function destroy(FoKabelOdp $foKabelOdp)
    {
        $foKabelOdp->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Kabel ODP deleted.',
        ], 200);
    }
}
