<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\FoClientFtth;
use App\Models\FoOdc;
use App\Models\FoOdp;
use App\Models\FoKabelOdc;
use App\Models\FoKabelCoreOdc;
use App\Models\FoKabelTubeOdc;
use Illuminate\Http\JsonResponse;

class FtthStatisticController extends Controller
{
    public function index(): JsonResponse
    {
        $data = [
            'id' => 1,
            'client_count' => FoClientFtth::count(),
            'odc_count' => FoOdc::count(),
            'odp_count' => FoOdp::count(),
            'kabel_odc_count' => FoKabelOdc::count(),
            'kabel_core_odc_count' => FoKabelCoreOdc::count(),
            'kabel_tube_odc_count' => FoKabelTubeOdc::count(),
        ];

        return response()->json(['data' => [$data]]);
    }
}
