<?php

namespace App\Http\Controllers;

use App\Models\FoOdp;
use Illuminate\Http\Request;

class FoOdpController extends Controller
{
    protected $model = FoOdp::class;
    /**
     * List all ODP entries with pagination, filtering, sorting, and status.
     *
     * GET /api/v1/fo-odps
     *
     * Query string parameters (all optional):
     *   • page (int)
     *   • per_page (int)
     *   • filter (string)      // partial match on nama_odp
     *   • sort (string)        // format "column|asc" or "column|dsc"
     *   • status (string)      // comma-separated: "active,archived,deleted"
     */
    public function index(Request $request)
    {
        // 1) Parse 'status' parameter into an array
        $statusParam = $request->query('status', 'active');
        $requested = collect(explode(',', $statusParam))
            ->map(fn($s) => trim(strtolower($s)))
            ->filter()
            ->unique()
            ->values()
            ->all();

        $validStatuses = ['active', 'archived', 'deleted'];
        $statuses = array_values(array_intersect($requested, $validStatuses));
        if (empty($statuses)) {
            $statuses = ['active'];
        }

        // 2) Base query including soft-deleted rows
        $query = FoOdp::withTrashed();

        // 3) Filter by status
        $query->where(function ($q) use ($statuses) {
            // a) include soft-deleted if 'deleted' requested
            if (in_array('deleted', $statuses, true)) {
                $q->orWhereNotNull('deleted_at');
            }
            // b) include active/archived where deleted_at IS NULL
            $nonDeleted = array_values(array_intersect($statuses, ['active', 'archived']));
            if (!empty($nonDeleted)) {
                $q->orWhere(function ($sub) use ($nonDeleted) {
                    $sub->whereNull('deleted_at')
                        ->whereIn('status', $nonDeleted);
                });
            }
        });

        // 4) Optional text filtering on nama_odp
        if ($request->filled('filter')) {
            $term = $request->query('filter');
            $query->where('nama_odp', 'LIKE', "%{$term}%");
        }

        // 5) Optional sorting: "column|asc" or "column|dsc"
        if ($request->filled('sort')) {
            [$column, $dir] = array_pad(explode('|', $request->query('sort')), 2, null);
            $dir = (strtolower($dir) === 'dsc') ? 'desc' : 'asc';

            $allowedSorts = [
                'id',
                'nama_odp',
                'created_at',
                'updated_at',
                'status',
            ];
            if (in_array($column, $allowedSorts, true)) {
                $query->orderBy($column, $dir);
            }
        } else {
            // Default: newest first by id
            $query->orderBy('id', 'desc');
        }

        // 6) Pagination (default 15 per page)
        $perPage = (int) $request->query('per_page', 15);
        if ($perPage <= 0) {
            $perPage = 15;
        }

        // 7) Eager-load relationships and paginate
        $paginator = $query
            ->with(['lokasi', 'kabelCoreOdc', 'clientFtth'])
            ->paginate($perPage)
            ->appends($request->only(['filter', 'sort', 'per_page', 'status']));

        // 8) Transform each FoOdp into JSON structure
        $items = array_map(function ($o) {
            return [
                'id'                 => $o->id,
                'nama_odp'           => $o->nama_odp,
                // Nested Lokasi
                'lokasi'             => [
                    'id'            => $o->lokasi->id,
                    'nama_lokasi'   => $o->lokasi->nama_lokasi,
                    'latitude'      => $o->lokasi->latitude,
                    'longitude'     => $o->lokasi->longitude,
                ],
                // Nested Kabel Core ODC
                'kabel_core_odc'     => [
                    'id'            => $o->kabelCoreOdc->id,
                    'warna_tube'    => $o->kabelCoreOdc->warna_tube,
                    'warna_core'    => $o->kabelCoreOdc->warna_core,
                ],
                // Nested Client FTTH (may be null)
                'client_ftth'        => $o->clientFtth
                    ? [
                        'id'          => $o->clientFtth->id,
                        'nama_client' => $o->clientFtth->nama_client,
                        'alamat'      => $o->clientFtth->alamat,
                    ]
                    : null,
                'status'             => $o->status,
                'created_at'         => $o->created_at->toDateTimeString(),
                'updated_at'         => $o->updated_at->toDateTimeString(),
                'deleted_at'         => $o->deleted_at?->toDateTimeString(),
            ];
        }, $paginator->items());

        return response()->json([
            'status' => 'success',
            'data'   => $items,
            'meta'   => [
                'current_page' => $paginator->currentPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'last_page'    => $paginator->lastPage(),
                'from'         => $paginator->firstItem(),
                'to'           => $paginator->lastItem(),
            ],
        ], 200);
    }

    /**
     * Create a new ODP (default status = active).
     *
     * POST /api/v1/fo-odps
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'lokasi_id'            => 'required|exists:fo_lokasis,id',
            'kabel_core_odc_id'    => 'required|exists:fo_kabel_core_odcs,id',
            'nama_odp'             => 'required|string|max:255',
            'status'               => 'sometimes|in:active,archived',
        ]);

        if (!isset($data['status'])) {
            $data['status'] = 'active';
        }

        $o = FoOdp::create($data);
        $o->load(['lokasi', 'kabelCoreOdc', 'clientFtth']);

        return response()->json([
            'status'  => 'success',
            'data'    => [
                'id'                 => $o->id,
                'nama_odp'           => $o->nama_odp,
                'lokasi'             => [
                    'id'            => $o->lokasi->id,
                    'nama_lokasi'   => $o->lokasi->nama_lokasi,
                ],
                'kabel_core_odc'     => [
                    'id'            => $o->kabelCoreOdc->id,
                    'warna_tube'    => $o->kabelCoreOdc->warna_tube,
                    'warna_core'    => $o->kabelCoreOdc->warna_core,
                ],
                'client_ftth'        => $o->clientFtth
                    ? [
                        'id'          => $o->clientFtth->id,
                        'nama_client' => $o->clientFtth->nama_client,
                        'alamat'      => $o->clientFtth->alamat,
                    ]
                    : null,
                'status'             => $o->status,
                'created_at'         => $o->created_at->toDateTimeString(),
                'updated_at'         => $o->updated_at->toDateTimeString(),
            ],
            'message' => 'ODP created.',
        ], 201);
    }

    /**
     * Show a single ODP by ID (including soft-deleted).
     *
     * GET /api/v1/fo-odps/{id}
     */
    public function show($id)
    {
        $o = FoOdp::withTrashed()->findOrFail($id);
        $o->load(['lokasi', 'kabelCoreOdc', 'clientFtth']);

        return response()->json([
            'status' => 'success',
            'data'   => [
                'id'                 => $o->id,
                'nama_odp'           => $o->nama_odp,
                'lokasi'             => [
                    'id'            => $o->lokasi->id,
                    'nama_lokasi'   => $o->lokasi->nama_lokasi,
                ],
                'kabel_core_odc'     => [
                    'id'            => $o->kabelCoreOdc->id,
                    'warna_tube'    => $o->kabelCoreOdc->warna_tube,
                    'warna_core'    => $o->kabelCoreOdc->warna_core,
                ],
                'client_ftth'        => $o->clientFtth
                    ? [
                        'id'          => $o->clientFtth->id,
                        'nama_client' => $o->clientFtth->nama_client,
                        'alamat'      => $o->clientFtth->alamat,
                    ]
                    : null,
                'status'             => $o->status,
                'created_at'         => $o->created_at->toDateTimeString(),
                'updated_at'         => $o->updated_at->toDateTimeString(),
                'deleted_at'         => $o->deleted_at?->toDateTimeString(),
            ],
        ], 200);
    }

    /**
     * Update an existing ODP by ID (can also change status).
     *
     * PUT/PATCH /api/v1/fo-odps/{id}
     */
    public function update(Request $request, $id)
    {
        $o = FoOdp::withTrashed()->findOrFail($id);

        $data = $request->validate([
            'lokasi_id'            => 'sometimes|exists:fo_lokasis,id',
            'kabel_core_odc_id'    => 'sometimes|exists:fo_kabel_core_odcs,id',
            'nama_odp'             => 'sometimes|string|max:255',
            'status'               => 'sometimes|in:active,archived',
        ]);

        $o->update($data);
        $o->refresh()->load(['lokasi', 'kabelCoreOdc', 'clientFtth']);

        return response()->json([
            'status'  => 'success',
            'data'    => [
                'id'                 => $o->id,
                'nama_odp'           => $o->nama_odp,
                'lokasi'             => [
                    'id'            => $o->lokasi->id,
                    'nama_lokasi'   => $o->lokasi->nama_lokasi,
                ],
                'kabel_core_odc'     => [
                    'id'            => $o->kabelCoreOdc->id,
                    'warna_tube'    => $o->kabelCoreOdc->warna_tube,
                    'warna_core'    => $o->kabelCoreOdc->warna_core,
                ],
                'client_ftth'        => $o->clientFtth
                    ? [
                        'id'          => $o->clientFtth->id,
                        'nama_client' => $o->clientFtth->nama_client,
                        'alamat'      => $o->clientFtth->alamat,
                    ]
                    : null,
                'status'             => $o->status,
                'created_at'         => $o->created_at->toDateTimeString(),
                'updated_at'         => $o->updated_at->toDateTimeString(),
            ],
            'message' => 'ODP updated.',
        ], 200);
    }

    /**
     * Soft‐delete an ODP by ID.
     *
     * DELETE /api/v1/fo-odps/{id}
     */
    public function destroy($id)
    {
        $o = FoOdp::findOrFail($id);
        $o->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'ODP soft-deleted.',
        ], 200);
    }

    /**
     * Archive an ODP (set status = "archived").
     *
     * PATCH /api/v1/fo-odps/{id}/archive
     */
    public function archive($id)
    {
        $o = FoOdp::withTrashed()->findOrFail($id);
        $o->update(['status' => 'archived']);

        return response()->json([
            'status'  => 'success',
            'message' => 'ODP archived.',
        ], 200);
    }

    /**
     * Unarchive an ODP (set status = "active").
     *
     * PATCH /api/v1/fo-odps/{id}/unarchive
     */
    public function unarchive($id)
    {
        $o = FoOdp::withTrashed()->findOrFail($id);
        $o->update(['status' => 'active']);

        return response()->json([
            'status'  => 'success',
            'message' => 'ODP set to active.',
        ], 200);
    }

    /**
     * Restore a soft‐deleted ODP (deleted_at = NULL).
     *
     * PATCH /api/v1/fo-odps/{id}/restore
     */
    public function restore($id)
    {
        $o = FoOdp::onlyTrashed()->findOrFail($id);
        $o->restore();

        return response()->json([
            'status'  => 'success',
            'message' => 'ODP restored from deletion.',
        ], 200);
    }

    /**
     * Bulk operation: archive | delete | restore.
     *
     * POST /api/v1/…/bulk
     * {
     *   "action":  "archive"|"delete"|"restore",
     *   "ids":      [1,2,3]
     * }
     */
    public function bulk(Request $request)
    {
        $data = $request->validate([
            'action' => 'required|in:archive,delete,restore',
            'ids'    => 'required|array|min:1',
            'ids.*'  => 'integer|distinct',
        ]);

        $ids    = $data['ids'];
        $action = $data['action'];

        switch ($action) {
            case 'archive':
                // Set status = 'archived'
                $this->model::withTrashed()
                    ->whereIn('id', $ids)
                    ->update(['status' => 'archived']);
                $message = 'Items archived.';
                break;

            case 'delete':
                // Soft‐delete all (mark deleted_at)
                $this->model::whereIn('id', $ids)->delete();
                $message = 'Items soft‐deleted.';
                break;

            case 'restore':
                // First restore soft‐deleted
                $this->model::onlyTrashed()
                    ->whereIn('id', $ids)
                    ->restore();
                // Then set status back to 'active'
                $this->model::whereIn('id', $ids)
                    ->update(['status' => 'active']);
                $message = 'Items restored to active.';
                break;

            default:
                // Should never happen due to validation
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Invalid action.',
                ], 422);
        }

        return response()->json([
            'status'  => 'success',
            'message' => $message,
        ], 200);
    }
}
