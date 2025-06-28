<?php

namespace App\Http\Controllers;

use App\Models\FoClientFtth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Utils\Traits\MakesHash;

class FoClientFtthController extends Controller
{
    use MakesHash;
    protected $model = FoClientFtth::class;
    protected $table = 'fo_client_ftths';
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
        $companyId = auth()->user()->getCompany()?->id;

        // 1) Parse status param
        $statusParam = $request->query('status', 'active');
        $requested = collect(explode(',', $statusParam))
            ->map(fn($s) => trim(strtolower($s)))
            ->filter()
            ->unique()
            ->all();

        $validStatuses = ['active', 'archived', 'deleted'];
        $statuses = array_intersect($requested, $validStatuses);
        if (empty($statuses)) {
            $statuses = ['active'];
        }

        // 2) Start query: include trashed to handle "deleted" status
        $query = FoClientFtth::withTrashed()
            ->with(['lokasi', 'odp.kabelCoreOdc.kabelTubeOdc.kabelOdc.odc', 'client', 'company'])
            ->where('company_id', $companyId);

        // 3) Apply status filtering
        $query->where(function($q) use ($statuses) {
            if (in_array('deleted', $statuses, true)) {
                $q->orWhereNotNull('deleted_at');
            }
            $nonDeleted = array_intersect($statuses, ['active','archived']);
            if (!empty($nonDeleted)) {
                $q->orWhere(function($sub) use ($nonDeleted) {
                    $sub->whereNull('deleted_at')
                        ->whereIn('status', $nonDeleted);
                });
            }
        });

        // 4) Optional text filter on nama_client or alamat
        if ($request->filled('filter')) {
            $term = "%{$request->query('filter')}%";
            $query->where(function($q) use ($term) {
                $q->where('nama_client', 'LIKE', $term)
                  ->orWhere('alamat', 'LIKE', $term);
            });
        }

        // 5) Optional sort param: column|asc or column|dsc
        if ($request->filled('sort')) {
            [$column, $dir] = array_pad(explode('|', $request->query('sort')), 2, null);
            $dir = (strtolower($dir)==='dsc') ? 'desc' : 'asc';
            $allowed = ['id','nama_client','created_at','updated_at','status'];
            if (in_array($column, $allowed, true)) {
                $query->orderBy($column, $dir);
            }
        } else {
            $query->orderBy('id','desc');
        }

        // 6) Pagination
        $perPage = max(1, (int)$request->query('per_page', 15));
        $p = $query->paginate($perPage)
                   ->appends($request->only(['filter','sort','per_page','status']));

        // 7) Transform result
        $items = $p->map(fn($c) => [
            'id'          => $c->id,
            'nama_client' => $c->nama_client,
            'lokasi'      => $c->lokasi ? [
                'id'           => $c->lokasi->id,
                'nama_lokasi'  => $c->lokasi->nama_lokasi,
            ] : null,
            'odp'         => $c->odp ? [
                'id'       => $c->odp->id,
                'nama_odp' => $c->odp->nama_odp,
            ] : null,
            'odc'         => $c->odp?->kabelCoreOdc?->kabelTubeOdc?->kabelOdc?->odc ? [
                'id'       => $c->odp->kabelCoreOdc->kabelTubeOdc->kabelOdc->odc->id,
                'nama_odc' => $c->odp->kabelCoreOdc->kabelTubeOdc->kabelOdc->odc->nama_odc,
            ] : null,
            'client'      => $c->client ? [
                'id'   => $this->encodePrimaryKey($c->client->id),
                'name' => $c->client->name,
                'phone' => $c->client->phone,
            ] : null,
            'company'     => $c->company ? [
                'id'   => $c->company->id,
                'name' => $c->company->present()->name(),
            ] : null,
            'alamat'      => $c->alamat,
            'status'      => $c->status,
            'created_at'  => $c->created_at?->toDateTimeString(),
            'updated_at'  => $c->updated_at?->toDateTimeString(),
            'deleted_at'  => $c->deleted_at?->toDateTimeString(),
        ])->all();

        return response()->json([
            'status' => 'success',
            'data'   => $items,
            'meta'   => [
                'current_page' => $p->currentPage(),
                'per_page'     => $p->perPage(),
                'total'        => $p->total(),
                'last_page'    => $p->lastPage(),
                'from'         => $p->firstItem(),
                'to'           => $p->lastItem(),
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
        $companyId = auth()->user()->getCompany()?->id;
        $data = $request->validate([
            'lokasi_id'    => 'required|exists:fo_lokasis,id',
            'odp_id'       => 'required|exists:fo_odps,id',
            'client_id'    => 'nullable',
            'nama_client'  => 'nullable|string|max:255',
            'alamat'       => 'nullable|string|max:255',
            'status'       => 'sometimes|in:active,archived',
        ]);

        // Auto-set company_id from authenticated user
        $data['company_id'] = $companyId;

        // Decode hashed client_id if provided
        if (isset($data['client_id']) && $data['client_id'] !== null) {
            $data['client_id'] = $this->decodePrimaryKey($data['client_id']);

            // Ensure the selected client belongs to the user's company
            $client = \App\Models\Client::where('id', $data['client_id'])
                ->where('company_id', $companyId)
                ->first();
            if (!$client) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Selected client does not belong to your company.',
                ], 422);
            }
        } else {
            // Set to null if not provided
            $data['client_id'] = null;
        }

        \Log::info('User company_id: ' . $companyId);
        if ($data['client_id']) {
            \Log::info('Client company_id: ' . $client->company_id);
        }

        if (!isset($data['status'])) {
            $data['status'] = 'active';
        }

        $c = FoClientFtth::create($data);
        $c->load(['lokasi', 'odp.kabelCoreOdc.kabelTubeOdc.kabelOdc.odc', 'client', 'company']);

        return response()->json([
            'status'  => 'success',
            'data'    => [
                'id'           => $c->id,
                'nama_client'  => $c->nama_client,
                'lokasi'       => $c->lokasi ? [
                    'id'           => $c->lokasi->id,
                    'nama_lokasi'  => $c->lokasi->nama_lokasi,
                ] : null,
                'odp'          => $c->odp ? [
                    'id'           => $c->odp->id,
                    'nama_odp'     => $c->odp->nama_odp,
                ] : null,
                'odc'          => $c->odp?->kabelCoreOdc?->kabelTubeOdc?->kabelOdc?->odc ? [
                    'id'           => $c->odp->kabelCoreOdc->kabelTubeOdc->kabelOdc->odc->id,
                    'nama_odc'     => $c->odp->kabelCoreOdc->kabelTubeOdc->kabelOdc->odc->nama_odc,
                ] : null,
                'client'       => $c->client ? [
                    'id'           => $this->encodePrimaryKey($c->client->id),
                    'name'         => $c->client->name,
                ] : null,
                'company'      => $c->company ? [
                    'id'           => $c->company->id,
                    'name'         => $c->company->present()->name(),
                ] : null,
                'alamat'       => $c->alamat,
                'status'       => $c->status,
                'created_at'   => $c->created_at ? $c->created_at->toDateTimeString() : null,
                'updated_at'   => $c->updated_at ? $c->updated_at->toDateTimeString() : null,
                'deleted_at'   => $c->deleted_at ? $c->deleted_at->toDateTimeString() : null,
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
        $companyId = auth()->user()->getCompany()?->id;
        $c = FoClientFtth::withTrashed()->where('company_id', $companyId)->findOrFail($id);
        $c->load(['lokasi', 'odp.kabelCoreOdc.kabelTubeOdc.kabelOdc.odc', 'client', 'company']);

        return response()->json([
            'status' => 'success',
            'data'   => [
                'id'           => $c->id,
                'nama_client'  => $c->nama_client,
                'lokasi'       => $c->lokasi ? [
                    'id'           => $c->lokasi->id,
                    'nama_lokasi'  => $c->lokasi->nama_lokasi,
                ] : null,
                'odp'          => $c->odp ? [
                    'id'           => $c->odp->id,
                    'nama_odp'     => $c->odp->nama_odp,
                ] : null,
                'odc'          => $c->odp?->kabelCoreOdc?->kabelTubeOdc?->kabelOdc?->odc ? [
                    'id'           => $c->odp->kabelCoreOdc->kabelTubeOdc->kabelOdc->odc->id,
                    'nama_odc'     => $c->odp->kabelCoreOdc->kabelTubeOdc->kabelOdc->odc->nama_odc,
                ] : null,
                'client'       => $c->client ? [
                    'id'           => $this->encodePrimaryKey($c->client->id),
                    'name'         => $c->client->name,
                ] : null,
                'company'      => $c->company ? [
                    'id'           => $c->company->id,
                    'name'         => $c->company->present()->name(),
                ] : null,
                'alamat'       => $c->alamat,
                'status'       => $c->status,
                'created_at'   => $c->created_at ? $c->created_at->toDateTimeString() : null,
                'updated_at'   => $c->updated_at ? $c->updated_at->toDateTimeString() : null,
                'deleted_at'   => $c->deleted_at ? $c->deleted_at->toDateTimeString() : null,
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
        $companyId = auth()->user()->getCompany()?->id;
        $c = FoClientFtth::withTrashed()->where('company_id', $companyId)->findOrFail($id);

        $data = $request->validate([
            'lokasi_id'    => 'sometimes|exists:fo_lokasis,id',
            'odp_id'       => 'sometimes|exists:fo_odps,id',
            'client_id'    => 'nullable',
            'nama_client'  => 'nullable|string|max:255',
            'alamat'       => 'nullable|string|max:255',
            'status'       => 'sometimes|in:active,archived',
        ]);

        // If client_id is being updated, decode hashed client_id if provided
        if (array_key_exists('client_id', $data)) {
            if ($data['client_id'] !== null) {
                $data['client_id'] = $this->decodePrimaryKey($data['client_id']);
                $client = \App\Models\Client::where('id', $data['client_id'])
                    ->where('company_id', $companyId)
                    ->first();
                if (!$client) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Selected client does not belong to your company.',
                    ], 422);
                }
            } else {
                // Set to null if explicitly set to null
                $data['client_id'] = null;
            }
        }

        $c->update($data);
        $c->refresh()->load(['lokasi', 'odp.kabelCoreOdc.kabelTubeOdc.kabelOdc.odc', 'client', 'company']);

        return response()->json([
            'status'  => 'success',
            'data'    => [
                'id'           => $c->id,
                'nama_client'  => $c->nama_client,
                'lokasi'       => $c->lokasi ? [
                    'id'           => $c->lokasi->id,
                    'nama_lokasi'  => $c->lokasi->nama_lokasi,
                ] : null,
                'odp'          => $c->odp ? [
                    'id'           => $c->odp->id,
                    'nama_odp'     => $c->odp->nama_odp,
                ] : null,
                'odc'          => $c->odp?->kabelCoreOdc?->kabelTubeOdc?->kabelOdc?->odc ? [
                    'id'           => $c->odp->kabelCoreOdc->kabelTubeOdc->kabelOdc->odc->id,
                    'nama_odc'     => $c->odp->kabelCoreOdc->kabelTubeOdc->kabelOdc->odc->nama_odc,
                ] : null,
                'client'       => $c->client ? [
                    'id'           => $this->encodePrimaryKey($c->client->id),
                    'name'         => $c->client->name,
                ] : null,
                'company'      => $c->company ? [
                    'id'           => $c->company->id,
                    'name'         => $c->company->present()->name(),
                ] : null,
                'alamat'       => $c->alamat,
                'status'       => $c->status,
                'created_at'   => $c->created_at ? $c->created_at->toDateTimeString() : null,
                'updated_at'   => $c->updated_at ? $c->updated_at->toDateTimeString() : null,
                'deleted_at'   => $c->deleted_at ? $c->deleted_at->toDateTimeString() : null,
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
        $companyId = auth()->user()->getCompany()?->id;
        $c = FoClientFtth::where('company_id', $companyId)->findOrFail($id);
        $c->delete();

        return response()->json([
            'status'  => 'success',
            'data'    => [
                'id' => $c->id,
            ],
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
        $companyId = auth()->user()->getCompany()?->id;
        $c = FoClientFtth::withTrashed()->where('company_id', $companyId)->findOrFail($id);
        $c->update(['status' => 'archived']);
        $c->refresh()->load(['lokasi', 'odp.kabelCoreOdc.kabelTubeOdc.kabelOdc.odc', 'client', 'company']);

        return response()->json([
            'status'  => 'success',
            'data'    => [
                'id'           => $c->id,
                'nama_client'  => $c->nama_client,
                'lokasi'       => $c->lokasi ? [
                    'id'           => $c->lokasi->id,
                    'nama_lokasi'  => $c->lokasi->nama_lokasi,
                ] : null,
                'odp'          => $c->odp ? [
                    'id'           => $c->odp->id,
                    'nama_odp'     => $c->odp->nama_odp,
                ] : null,
                'odc'          => $c->odp?->kabelCoreOdc?->kabelTubeOdc?->kabelOdc?->odc ? [
                    'id'           => $c->odp->kabelCoreOdc->kabelTubeOdc->kabelOdc->odc->id,
                    'nama_odc'     => $c->odp->kabelCoreOdc->kabelTubeOdc->kabelOdc->odc->nama_odc,
                ] : null,
                'client'       => $c->client ? [
                    'id'           => $this->encodePrimaryKey($c->client->id),
                    'name'         => $c->client->name,
                ] : null,
                'company'      => $c->company ? [
                    'id'           => $c->company->id,
                    'name'         => $c->company->present()->name(),
                ] : null,
                'alamat'       => $c->alamat,
                'status'       => $c->status,
                'created_at'   => $c->created_at ? $c->created_at->toDateTimeString() : null,
                'updated_at'   => $c->updated_at ? $c->updated_at->toDateTimeString() : null,
                'deleted_at'   => $c->deleted_at ? $c->deleted_at->toDateTimeString() : null,
            ],
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
        $companyId = auth()->user()->getCompany()?->id;
        $c = FoClientFtth::withTrashed()->where('company_id', $companyId)->findOrFail($id);
        $c->update(['status' => 'active']);
        $c->refresh()->load(['lokasi', 'odp.kabelCoreOdc.kabelTubeOdc.kabelOdc.odc', 'client', 'company']);

        return response()->json([
            'status'  => 'success',
            'data'    => [
                'id'           => $c->id,
                'nama_client'  => $c->nama_client,
                'lokasi'       => $c->lokasi ? [
                    'id'           => $c->lokasi->id,
                    'nama_lokasi'  => $c->lokasi->nama_lokasi,
                ] : null,
                'odp'          => $c->odp ? [
                    'id'           => $c->odp->id,
                    'nama_odp'     => $c->odp->nama_odp,
                ] : null,
                'odc'          => $c->odp?->kabelCoreOdc?->kabelTubeOdc?->kabelOdc?->odc ? [
                    'id'           => $c->odp->kabelCoreOdc->kabelTubeOdc->kabelOdc->odc->id,
                    'nama_odc'     => $c->odp->kabelCoreOdc->kabelTubeOdc->kabelOdc->odc->nama_odc,
                ] : null,
                'client'       => $c->client ? [
                    'id'           => $this->encodePrimaryKey($c->client->id),
                    'name'         => $c->client->name,
                ] : null,
                'company'      => $c->company ? [
                    'id'           => $c->company->id,
                    'name'         => $c->company->present()->name(),
                ] : null,
                'alamat'       => $c->alamat,
                'status'       => $c->status,
                'created_at'   => $c->created_at ? $c->created_at->toDateTimeString() : null,
                'updated_at'   => $c->updated_at ? $c->updated_at->toDateTimeString() : null,
                'deleted_at'   => $c->deleted_at ? $c->deleted_at->toDateTimeString() : null,
            ],
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
        $companyId = auth()->user()->getCompany()?->id;
        $c = FoClientFtth::onlyTrashed()->where('company_id', $companyId)->findOrFail($id);
        $c->restore();
        $c->refresh()->load(['lokasi', 'odp.kabelCoreOdc.kabelTubeOdc.kabelOdc.odc', 'client', 'company']);

        return response()->json([
            'status'  => 'success',
            'data'    => [
                'id'           => $c->id,
                'nama_client'  => $c->nama_client,
                'lokasi'       => $c->lokasi ? [
                    'id'           => $c->lokasi->id,
                    'nama_lokasi'  => $c->lokasi->nama_lokasi,
                ] : null,
                'odp'          => $c->odp ? [
                    'id'           => $c->odp->id,
                    'nama_odp'     => $c->odp->nama_odp,
                ] : null,
                'odc'          => $c->odp?->kabelCoreOdc?->kabelTubeOdc?->kabelOdc?->odc ? [
                    'id'           => $c->odp->kabelCoreOdc->kabelTubeOdc->kabelOdc->odc->id,
                    'nama_odc'     => $c->odp->kabelCoreOdc->kabelTubeOdc->kabelOdc->odc->nama_odc,
                ] : null,
                'client'       => $c->client ? [
                    'id'           => $this->encodePrimaryKey($c->client->id),
                    'name'         => $c->client->name,
                ] : null,
                'company'      => $c->company ? [
                    'id'           => $c->company->id,
                    'name'         => $c->company->present()->name(),
                ] : null,
                'alamat'       => $c->alamat,
                'status'       => $c->status,
                'created_at'   => $c->created_at ? $c->created_at->toDateTimeString() : null,
                'updated_at'   => $c->updated_at ? $c->updated_at->toDateTimeString() : null,
                'deleted_at'   => $c->deleted_at ? $c->deleted_at->toDateTimeString() : null,
            ],
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
        $companyId = auth()->user()->getCompany()?->id;
        $data = $request->validate([
            'action' => 'required|in:archive,delete,restore',
            'ids'    => 'required|array|min:1',
            'ids.*'  => 'integer|distinct',
        ]);

        $ids    = $data['ids'];
        $action = $data['action'];
        $message = '';
        $affected = [];

        switch ($action) {
            case 'archive':
                // Set status = 'archived'
                FoClientFtth::withTrashed()
                    ->where('company_id', $companyId)
                    ->whereIn('id', $ids)
                    ->update(['status' => 'archived']);
                $affected = FoClientFtth::withTrashed()->where('company_id', $companyId)->whereIn('id', $ids)->get();
                $message = 'Items archived.';
                break;

            case 'delete':
                // Soft‐delete all (mark deleted_at)
                FoClientFtth::where('company_id', $companyId)
                    ->whereIn('id', $ids)->delete();
                $affected = FoClientFtth::withTrashed()->where('company_id', $companyId)->whereIn('id', $ids)->get();
                $message = 'Items soft‐deleted.';
                break;

            case 'restore':
                // First restore soft‐deleted
                FoClientFtth::onlyTrashed()
                    ->where('company_id', $companyId)
                    ->whereIn('id', $ids)
                    ->restore();
                // Then set status back to 'active'
                FoClientFtth::where('company_id', $companyId)
                    ->whereIn('id', $ids)
                    ->update(['status' => 'active']);
                $affected = FoClientFtth::withTrashed()->where('company_id', $companyId)->whereIn('id', $ids)->get();
                $message = 'Items restored to active.';
                break;

            default:
                // Should never happen due to validation
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Invalid action.',
                ], 422);
        }

        $data = $affected->map(function ($c) {
            return [
                'id'           => $c->id,
                'nama_client'  => $c->nama_client,
                'lokasi'       => $c->lokasi ? [
                    'id'           => $c->lokasi->id,
                    'nama_lokasi'  => $c->lokasi->nama_lokasi,
                ] : null,
                'odp'          => $c->odp ? [
                    'id'           => $c->odp->id,
                    'nama_odp'     => $c->odp->nama_odp,
                ] : null,
                'odc'          => $c->odp?->kabelCoreOdc?->kabelTubeOdc?->kabelOdc?->odc ? [
                    'id'           => $c->odp->kabelCoreOdc->kabelTubeOdc->kabelOdc->odc->id,
                    'nama_odc'     => $c->odp->kabelCoreOdc->kabelTubeOdc->kabelOdc->odc->nama_odc,
                ] : null,
                'client'       => $c->client ? [
                    'id'           => $this->encodePrimaryKey($c->client->id),
                    'name'         => $c->client->name,
                ] : null,
                'company'      => $c->company ? [
                    'id'           => $c->company->id,
                    'name'         => $c->company->present()->name(),
                ] : null,
                'alamat'       => $c->alamat,
                'status'       => $c->status,
                'created_at'   => $c->created_at ? $c->created_at->toDateTimeString() : null,
                'updated_at'   => $c->updated_at ? $c->updated_at->toDateTimeString() : null,
                'deleted_at'   => $c->deleted_at ? $c->deleted_at->toDateTimeString() : null,
            ];
        });

        return response()->json([
            'status'  => 'success',
            'data'    => $data,
            'message' => $message,
        ], 200);
    }
}
