<?php

namespace App\Http\Controllers;

use App\Models\FoOdc;
use Illuminate\Http\Request;

class FoOdcController extends Controller
{
    protected $model = FoOdc::class;
    /**
     * List all ODC entries with pagination, filtering, sorting, and status.
     *
     * GET /api/v1/fo-odcs
     *
     * Query parameters (all optional):
     *   - page (int)
     *   - per_page (int)
     *   - filter (string)           // searches nama_odc OR tipe_splitter
     *   - sort (string)             // format "column|asc" or "column|dsc"
     *   - status (string)           // comma-separated: "active,archived,deleted"
     */
    public function index(Request $request)
    {
        // 1) Parse the `status` query param into an array
        $statusParam = $request->query('status', 'active');
        $requested   = collect(explode(',', $statusParam))
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

        // 2) Start a base query including soft‐deleted rows (withTrashed)
        $query = FoOdc::withTrashed();

        // 3) Filter by status
        $query->where(function ($q) use ($statuses) {
            // a) include soft‐deleted if "deleted" is requested
            if (in_array('deleted', $statuses, true)) {
                $q->orWhereNotNull('deleted_at');
            }
            // b) include active/archived rows where deleted_at IS NULL
            $nonDeleted = array_values(array_intersect($statuses, ['active', 'archived']));
            if (! empty($nonDeleted)) {
                $q->orWhere(function ($sub) use ($nonDeleted) {
                    $sub->whereNull('deleted_at')
                        ->whereIn('status', $nonDeleted);
                });
            }
        });

        // 4) Optional text filtering by nama_odc or tipe_splitter
        if ($request->filled('filter')) {
            $term = $request->query('filter');
            $query->where(function ($q) use ($term) {
                $q->where('nama_odc', 'LIKE', "%{$term}%")
                    ->orWhere('tipe_splitter', 'LIKE', "%{$term}%");
            });
        }

        // 5) Optional sorting: "column|asc" or "column|dsc"
        if ($request->filled('sort')) {
            [$column, $dir] = array_pad(explode('|', $request->query('sort')), 2, null);
            $dir = (strtolower($dir) === 'dsc') ? 'desc' : 'asc';

            $allowedSorts = ['id', 'nama_odc', 'tipe_splitter', 'created_at', 'updated_at', 'status'];
            if (in_array($column, $allowedSorts, true)) {
                $query->orderBy($column, $dir);
            }
        } else {
            // Default ordering: newest first by id
            $query->orderBy('id', 'desc');
        }

        // 6) Pagination: default 15 per page
        $perPage = (int) $request->query('per_page', 15);
        if ($perPage <= 0) {
            $perPage = 15;
        }

        // 7) Eager‐load relationships and paginate
        $paginator = $query
            ->with(['lokasi', 'kabelOdcs'])
            ->paginate($perPage)
            ->appends($request->only(['filter', 'sort', 'per_page', 'status']));

        // 8) Transform each FoOdc to the desired JSON structure
        $items = array_map(function ($o) {
            return [
                'id'            => $o->id,
                'lokasi_id'     => $o->lokasi_id,
                'lokasi'        => [
                    'id'           => $o->lokasi->id,
                    'nama_lokasi'  => $o->lokasi->nama_lokasi,
                    'latitude'     => $o->lokasi->latitude,
                    'longitude'    => $o->lokasi->longitude,
                ],
                'nama_odc'      => $o->nama_odc,
                'tipe_splitter' => $o->tipe_splitter,
                'status'        => $o->status,
                'kabel_odcs'    => $o->kabelOdcs->map(function ($k) {
                    return [
                        'id'             => $k->id,
                        'nama_kabel_odc' => $k->nama_kabel_odc,
                    ];
                })->toArray(),
                'created_at'    => $o->created_at->toDateTimeString(),
                'updated_at'    => $o->updated_at->toDateTimeString(),
                'deleted_at'    => $o->deleted_at?->toDateTimeString(),
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
     * Create a new ODC (default status = active).
     *
     * POST /api/v1/fo-odcs
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'lokasi_id'     => 'required|exists:fo_lokasis,id',
            'nama_odc'      => 'required|string|max:255',
            'tipe_splitter' => 'required|in:1:2,1:4,1:8,1:16,1:32,1:64,1:128',
            'status'        => 'sometimes|in:active,archived',
        ]);

        if (!isset($data['status'])) {
            $data['status'] = 'active';
        }

        $o = FoOdc::create($data);
        $o->load(['lokasi', 'kabelOdcs']);

        return response()->json([
            'status'  => 'success',
            'data'    => [
                'id'            => $o->id,
                'lokasi_id'     => $o->lokasi_id,
                'lokasi'        => [
                    'id'           => $o->lokasi->id,
                    'nama_lokasi'  => $o->lokasi->nama_lokasi,
                ],
                'nama_odc'      => $o->nama_odc,
                'tipe_splitter' => $o->tipe_splitter,
                'status'        => $o->status,
                'kabel_odcs'    => $o->kabelOdcs->map(function ($k) {
                    return [
                        'id'             => $k->id,
                        'nama_kabel_odc' => $k->nama_kabel_odc,
                    ];
                })->toArray(),
                'created_at'    => $o->created_at->toDateTimeString(),
                'updated_at'    => $o->updated_at->toDateTimeString(),
            ],
            'message' => 'ODC created.',
        ], 201);
    }

    /**
     * Show a single ODC by ID (including soft‐deleted).
     *
     * GET /api/v1/fo-odcs/{id}
     */
    public function show($id)
    {
        $o = FoOdc::withTrashed()->findOrFail($id);
        $o->load(['lokasi', 'kabelOdcs']);

        return response()->json([
            'status' => 'success',
            'data'   => [
                'id'            => $o->id,
                'lokasi_id'     => $o->lokasi_id,
                'lokasi'        => [
                    'id'           => $o->lokasi->id,
                    'nama_lokasi'  => $o->lokasi->nama_lokasi,
                ],
                'nama_odc'      => $o->nama_odc,
                'tipe_splitter' => $o->tipe_splitter,
                'status'        => $o->status,
                'kabel_odcs'    => $o->kabelOdcs->map(function ($k) {
                    return [
                        'id'             => $k->id,
                        'nama_kabel_odc' => $k->nama_kabel_odc,
                    ];
                })->toArray(),
                'created_at'    => $o->created_at->toDateTimeString(),
                'updated_at'    => $o->updated_at->toDateTimeString(),
                'deleted_at'    => $o->deleted_at?->toDateTimeString(),
            ],
        ], 200);
    }

    /**
     * Update an existing ODC by ID (can also change status).
     *
     * PUT/PATCH /api/v1/fo-odcs/{id}
     */
    public function update(Request $request, $id)
    {
        $o = FoOdc::withTrashed()->findOrFail($id);

        $data = $request->validate([
            'lokasi_id'     => 'sometimes|exists:fo_lokasis,id',
            'nama_odc'      => 'sometimes|string|max:255',
            'tipe_splitter' => 'sometimes|in:1:2,1:4,1:8,1:16,1:32,1:64,1:128',
            'status'        => 'sometimes|in:active,archived',
        ]);

        $o->update($data);
        $o->refresh()->load(['lokasi', 'kabelOdcs']);

        return response()->json([
            'status'  => 'success',
            'data'    => [
                'id'            => $o->id,
                'lokasi_id'     => $o->lokasi_id,
                'lokasi'        => [
                    'id'           => $o->lokasi->id,
                    'nama_lokasi'  => $o->lokasi->nama_lokasi,
                ],
                'nama_odc'      => $o->nama_odc,
                'tipe_splitter' => $o->tipe_splitter,
                'status'        => $o->status,
                'kabel_odcs'    => $o->kabelOdcs->map(function ($k) {
                    return [
                        'id'             => $k->id,
                        'nama_kabel_odc' => $k->nama_kabel_odc,
                    ];
                })->toArray(),
                'created_at'    => $o->created_at->toDateTimeString(),
                'updated_at'    => $o->updated_at->toDateTimeString(),
            ],
            'message' => 'ODC updated.',
        ], 200);
    }

    /**
     * Soft‐delete an ODC by ID.
     *
     * DELETE /api/v1/fo-odcs/{id}
     */
    public function destroy($id)
    {
        $o = FoOdc::findOrFail($id);
        $o->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'ODC soft-deleted.',
        ], 200);
    }

    /**
     * Archive an ODC (set status = "archived").
     *
     * PATCH /api/v1/fo-odcs/{id}/archive
     */
    public function archive($id)
    {
        $o = FoOdc::withTrashed()->findOrFail($id);
        $o->update(['status' => 'archived']);

        return response()->json([
            'status'  => 'success',
            'message' => 'ODC archived.',
        ], 200);
    }

    /**
     * Unarchive an ODC (set status = "active").
     *
     * PATCH /api/v1/fo-odcs/{id}/unarchive
     */
    public function unarchive($id)
    {
        $o = FoOdc::withTrashed()->findOrFail($id);
        $o->update(['status' => 'active']);

        return response()->json([
            'status'  => 'success',
            'message' => 'ODC set to active.',
        ], 200);
    }

    /**
     * Restore a soft‐deleted ODC (deleted_at = NULL).
     *
     * PATCH /api/v1/fo-odcs/{id}/restore
     */
    public function restore($id)
    {
        $o = FoOdc::onlyTrashed()->findOrFail($id);
        $o->restore();

        return response()->json([
            'status'  => 'success',
            'message' => 'ODC restored from deletion.',
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
