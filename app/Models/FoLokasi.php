<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\FoOdc;
use App\Models\FoOdp;
use App\Models\FoClientFtth;

class FoLokasi extends Model
{
    use SoftDeletes;

    protected $table = 'fo_lokasis';

    protected $fillable = [
        'nama_lokasi',
        'deskripsi',
        'latitude',
        'longitude',
        'status', // 'active' or 'archived'
    ];

    protected $casts = [
        'latitude'   => 'float',
        'longitude'  => 'float',
        'status'     => 'string',
        'deleted_at' => 'datetime',
    ];

    public function odcs()
    {
        return $this->hasMany(FoOdc::class, 'lokasi_id');
    }

    public function odps()
    {
        return $this->hasMany(FoOdp::class, 'lokasi_id');
    }

    public function clientFtths()
    {
        return $this->hasMany(FoClientFtth::class, 'lokasi_id');
    }
}
