<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\FoOdc;
use App\Models\FoKabelTubeOdc;

class FoKabelOdc extends Model
{
    use SoftDeletes;

    protected $table = 'fo_kabel_odcs';

    protected $fillable = [
        'odc_id',
        'nama_kabel',
        'tipe_kabel',
        'panjang_kabel',
        'jumlah_tube',
        'jumlah_core_in_tube',
        'jumlah_total_core',
        'status',    // allow "active" or "archived"
    ];

    protected $casts = [
        'panjang_kabel'        => 'float',
        'status'               => 'string',
        'deleted_at'           => 'datetime',
    ];

    /**
     * Each KabelOdc belongs to one ODC.
     */
    public function odc()
    {
        return $this->belongsTo(FoOdc::class, 'odc_id');
    }

    /**
     * Each KabelOdc can have many KabelTubeOdcs.
     */
    public function kabelTubeOdcs()
    {
        return $this->hasMany(FoKabelTubeOdc::class, 'kabel_odc_id');
    }
}
