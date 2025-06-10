<?php

namespace App\Http\Controllers;

use App\Models\FoClientFtth;
use Illuminate\Http\Request;

class FoClientFtthController extends Controller
{
    protected $model = FoClientFtth::class;
    /**
     * List all FTTH clients with pagination, filtering, sorting, and status.
     *
     * GET /api/v1/fo-client-ftths
     *
     * Query parameters (all optional):
     *   • page (int)
     *   • per_page (int)
     *   • filter (string)      // searches nama_client OR alamat
     *   • sort (string)        // format "column|asc" or "column|dsc"
     *   • status (string)      // comma-separated: "active,archived,deleted"
     */
    public function index(Request $request)
    {
        // 1) Parse the 'status' parameter into an array
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

        // 2) Base query including soft-deleted rows
        $query = FoClientFtth::withTrashed();

        // 3) Filter by status
        $query->where(function ($q) use ($statuses) {
            // a) include soft-deleted rows if 'deleted' is requested
            if (in_array('deleted', $statuses, true)) {
                $q->orWhereNotNull('deleted_at');
            }
            // b) include active/archived rows where deleted_at IS NULL
            $nonDeleted = array_values(array_intersect($statuses, ['active', 'archived']));
            if (!empty($nonDeleted)) {
                $q->orWhere(function ($sub) use ($nonDeleted) {
                    $sub->whereNull('deleted_at')
                        ->whereIn('status', $nonDeleted);
                });
            }
        });

        // 4) Optional text filtering on nama_client OR alamat
        if ($request->filled('filter')) {
            $term = $request->query('filter');
            $query->where(function ($q) use ($term) {
                $q->where('nama_client', 'LIKE', "%{$term}%")
                    ->orWhere('alamat', 'LIKE', "%{$term}%");
            });
        }

        // 5) Optional sorting: "column|asc" or "column|dsc"
        if ($request->filled('sort')) {
            [$column, $dir] = array_pad(explode('|', $request->query('sort')), 2, null);
            $dir = (strtolower($dir) === 'dsc') ? 'desc' : 'asc';

            $allowedSorts = [
                'id',
                'nama_client',
                'alamat',
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

        // 7) Eager-load 'lokasi' and 'odp', then paginate
        $paginator = $query
            ->with(['lokasi', 'odp'])
            ->paginate($perPage)
            ->appends($request->only(['filter', 'sort', 'per_page', 'status']));

        // 8) Transform results into the JSON structure
        $items = array_map(function ($c) {
            return [
                'id'           => $c->id,
                'nama_client'  => $c->nama_client,
                // Nested Lokasi
                'lokasi'       => [
                    'id'           => $c->lokasi->id,
                    'nama_lokasi'  => $c->lokasi->nama_lokasi,
                    'latitude'     => $c->lokasi->latitude,
                    'longitude'    => $c->lokasi->longitude,
                ],
                // Nested ODP
                'odp'          => [
                    'id'           => $c->odp->id,
                    'nama_odp'     => $c->odp->nama_odp,
                ],
                'alamat'       => $c->alamat,
                'status'       => $c->status,
                'created_at'   => $c->created_at->toDateTimeString(),
                'updated_at'   => $c->updated_at->toDateTimeString(),
                'deleted_at'   => $c->deleted_at?->toDateTimeString(),
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
     * Create a new FTTH client (default status = active).
     *
     * POST /api/v1/fo-client-ftths
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'lokasi_id'    => 'required|exists:fo_lokasis,id',
            'odp_id'       => 'required|exists:fo_odps,id',
            'nama_client'  => 'required|string|max:255',
            'alamat'       => 'required|string|max:255',
            'status'       => 'sometimes|in:active,archived',
        ]);

        if (!isset($data['status'])) {
            $data['status'] = 'active';
        }

        $c = FoClientFtth::create($data);
        $c->load(['lokasi', 'odp']);

        return response()->json([
            'status'  => 'success',
            'data'    => [
                'id'           => $c->id,
                'nama_client'  => $c->nama_client,
                'lokasi'       => [
                    'id'           => $c->lokasi->id,
                    'nama_lokasi'  => $c->lokasi->nama_lokasi,
                ],
                'odp'          => [
                    'id'           => $c->odp->id,
                    'nama_odp'     => $c->odp->nama_odp,
                ],
                'alamat'       => $c->alamat,
                'status'       => $c->status,
                'created_at'   => $c->created_at->toDateTimeString(),
                'updated_at'   => $c->updated_at->toDateTimeString(),
            ],
            'message' => 'FTTH client created.',
        ], 201);
    }

    /**
     * Show a single FTTH client by ID (including soft-deleted).
     *
     * GET /api/v1/fo-client-ftths/{id}
     */
    public function show($id)
    {
        $c = FoClientFtth::withTrashed()->findOrFail($id);
        $c->load(['lokasi', 'odp']);

        return response()->json([
            'status' => 'success',
            'data'   => [
                'id'           => $c->id,
                'nama_client'  => $c->nama_client,
                'lokasi'       => [
                    'id'           => $c->lokasi->id,
                    'nama_lokasi'  => $c->lokasi->nama_lokasi,
                ],
                'odp'          => [
                    'id'           => $c->odp->id,
                    'nama_odp'     => $c->odp->nama_odp,
                ],
                'alamat'       => $c->alamat,
                'status'       => $c->status,
                'created_at'   => $c->created_at->toDateTimeString(),
                'updated_at'   => $c->updated_at->toDateTimeString(),
                'deleted_at'   => $c->deleted_at?->toDateTimeString(),
            ],
        ], 200);
    }

    /**
     * Update an existing FTTH client by ID (can also change status).
     *
     * PUT/PATCH /api/v1/fo-client-ftths/{id}
     */
    public function update(Request $request, $id)
    {
        $c = FoClientFtth::withTrashed()->findOrFail($id);

        $data = $request->validate([
            'lokasi_id'    => 'sometimes|exists:fo_lokasis,id',
            'odp_id'       => 'sometimes|exists:fo_odps,id',
            'nama_client'  => 'sometimes|string|max:255',
            'alamat'       => 'sometimes|string|max:255',
            'status'       => 'sometimes|in:active,archived',
        ]);

        $c->update($data);
        $c->refresh()->load(['lokasi', 'odp']);

        return response()->json([
            'status'  => 'success',
            'data'    => [
                'id'           => $c->id,
                'nama_client'  => $c->nama_client,
                'lokasi'       => [
                    'id'           => $c->lokasi->id,
                    'nama_lokasi'  => $c->lokasi->nama_lokasi,
                ],
                'odp'          => [
                    'id'           => $c->odp->id,
                    'nama_odp'     => $c->odp->nama_odp,
                ],
                'alamat'       => $c->alamat,
                'status'       => $c->status,
                'created_at'   => $c->created_at->toDateTimeString(),
                'updated_at'   => $c->updated_at->toDateTimeString(),
            ],
            'message' => 'FTTH client updated.',
        ], 200);
    }

    /**
     * Soft‐delete a FTTH client by ID.
     *
     * DELETE /api/v1/fo-client-ftths/{id}
     */
    public function destroy($id)
    {
        $c = FoClientFtth::findOrFail($id);
        $c->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'FTTH client soft-deleted.',
        ], 200);
    }

    /**
     * Archive a FTTH client (set status = "archived").
     *
     * PATCH /api/v1/fo-client-ftths/{id}/archive
     */
    public function archive($id)
    {
        $c = FoClientFtth::withTrashed()->findOrFail($id);
        $c->update(['status' => 'archived']);

        return response()->json([
            'status'  => 'success',
            'message' => 'FTTH client archived.',
        ], 200);
    }

    /**
     * Unarchive a FTTH client (set status = "active").
     *
     * PATCH /api/v1/fo-client-ftths/{id}/unarchive
     */
    public function unarchive($id)
    {
        $c = FoClientFtth::withTrashed()->findOrFail($id);
        $c->update(['status' => 'active']);

        return response()->json([
            'status'  => 'success',
            'message' => 'FTTH client set to active.',
        ], 200);
    }

    /**
     * Restore a soft‐deleted FTTH client (deleted_at = NULL).
     *
     * PATCH /api/v1/fo-client-ftths/{id}/restore
     */
    public function restore($id)
    {
        $c = FoClientFtth::onlyTrashed()->findOrFail($id);
        $c->restore();

        return response()->json([
            'status'  => 'success',
            'message' => 'FTTH client restored from deletion.',
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
