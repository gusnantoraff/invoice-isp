<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use App\Models\Chatbot;
use App\Services\WhatsApp\WhatsappService;
use App\Models\Device;
use App\Models\Message;
use App\Models\Client;
use App\Models\Invoice;
use Carbon\Carbon;


class WhatsAppWebhookController extends Controller
{
    public function handleMessage(Request $request, WhatsappService $wa)
    {
        Carbon::setLocale('id');

        $message = $request->input('message');
        $from = $request->input('from');
        $session = $request->input('session');

        $device = Device::where('name', $session)->first();
        $phoneNumber = str_replace('@s.whatsapp.net', '', $from);

        $client = Client::where('phone', $phoneNumber)->first();

        Message::create([
            'device_id' => $device->id,
            'client_id' => $client ? $client->id : null,
            'from' => $from,
            'message' => $message,
            'status' => 'received',
        ]);

        if (Cache::get("complaint:$from") === 'waiting') {
            $ticketNumber = 'TICKET-' . strtoupper(Str::random(6));

            $wa->sendMessage([
                'session' => $session,
                'to' => $from,
                'text' => "Terima kasih atas keluhan Anda.\nNomor tiket Anda: *$ticketNumber*.\nAdmin akan segera membalas anda.",
            ]);

            $adminPhone = '6282290110155@s.whatsapp.net';
            $wa->sendMessage([
                'session' => $session,
                'to' => $adminPhone,
                'text' => "📨 *Keluhan Baru!*\nDari: *$phoneNumber*\nNomor Tiket: *$ticketNumber*\nIsi: $message",
            ]);

            Cache::forget("complaint:$from");
            return response()->json(['status' => 'complaint_received']);
        }

        if (strtolower(trim($message)) === 'hubungi admin') {
            $wa->sendMessage([
                'session' => $session,
                'to' => $from,
                'text' => "Silakan sampaikan keluhan Anda secara detail.",
            ]);

            Cache::put("complaint:$from", 'waiting', now()->addMinutes(10));
            return response()->json(['status' => 'waiting_complaint']);
        }

        $chatbots = Chatbot::where('device_id', $device->id)->get();

        $matchedChatbot = $chatbots->first(function ($chatbot) use ($message) {
            $msg = strtolower(trim($message));
            $q = strtolower(trim($chatbot->question));

            similar_text($msg, $q, $percent);
            return $percent >= 80 || str_contains($msg, $q) || str_contains($q, $msg);
        });


        $invoice = null;
        if ($client) {
            $invoice = Invoice::where('client_id', $client->id)->latest()->first();
        }

        if ($matchedChatbot) {
            $template = $matchedChatbot->answer;

            if ($client) {
                $invoice = Invoice::where('client_id', $client->id)->latest()->first();

                if ($invoice) {
                    $status = ($invoice->status_id == 4) ? 'Sudah Lunas' : 'Belum Lunas';

                    $answer = str_replace('{{name}}', $client->name, $template);
                    $answer = str_replace('{{bulan}}', Carbon::parse($invoice->due_date)->translatedFormat('F Y'), $answer);
                    $answer = str_replace('{{amount}}', number_format($invoice->amount, 0, ',', '.'), $answer);
                    $answer = str_replace('{{due_date}}', Carbon::parse($invoice->due_date)->translatedFormat('j F Y'), $answer);
                    $answer = str_replace('{{status}}', $status, $answer);
                } else {
                    $answer = "Halo {$client->name}, Anda tidak memiliki tagihan/sudah melunasinya bulan ini.";
                }
            } else {
                $answer = "Halo Pelanggan, Anda tidak memiliki tagihan/sudah melunasinya bulan ini.";
            }
        } else {
            $answer = "Halo, selamat datang. Ini adalah *balasan otomatis* dari sistem kami.\n" .
                "Ada yang bisa kami bantu?\n\n" .
                "Ketik *menu* untuk melihat pilihan layanan.";
        }


        $wa->sendMessage([
            'session' => $session,
            'to' => $from,
            'text' => $answer,
        ]);

        return response()->json(['status' => 'ok']);
    }
}
