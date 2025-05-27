<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Chatbot;
use App\Services\WhatsApp\WhatsappService;
use App\Models\Device;
use App\Models\Message;
use App\Models\Client;


class WhatsAppWebhookController extends Controller
{

    public function handleMessage(Request $request, WhatsappService $wa)
    {
        $message = $request->input('message');
        $from = $request->input('from');
        $session = $request->input('session');

        $device = Device::where('name', $session)->first();
        $phoneNumber = str_replace('@s.whatsapp.net', '', $from);
        $client = Client::where('phone', $phoneNumber)->first();

        Message::create([
            'device_id' => $device->id,
            'client_id' => $client->id,
            'from' => $from,
            'message' => $message,
            'status' => 'received',
        ]);

        $chatbot = Chatbot::where('device_id', $device->id)
            ->whereRaw('LOWER(question) = ?', [strtolower(trim($message))])
            ->first();

        if ($chatbot) {
            $wa->sendMessage([
                'session' => $session,
                'to' => $from,
                'text' => $chatbot->answer,
            ]);
        }

        return response()->json(['status' => 'ok']);
    }

    public function getMessages(Request $request)
    {
        $query = Message::query();

        if ($request->has('session')) {
            $query->where('session', $request->input('session'));
        }

        return response()->json([
            'data' => $query->latest()->get()
        ]);
    }
}
