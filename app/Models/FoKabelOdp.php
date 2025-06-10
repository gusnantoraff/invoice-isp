<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FoKabelOdp extends Model
{
    protected $table = 'fo_kabel_odps';

    protected $fillable = [
        'odp_id',
        'nama_kabel_odp',
        'tipe_kabel',
        'panjang_kabel',
        'jumlah_tube',
        'jumlah_core',
    ];

    /**
     * Relation back to FoOdp.
     */
    public function odp()
    {
        return $this->belongsTo(FoOdp::class, 'odp_id');
    }
}
