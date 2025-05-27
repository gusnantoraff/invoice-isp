<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Chatbot extends Model
{
    protected $fillable = [
        'question',
        'answer',
        'client_id',
        'device_id'
    ];

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

}
