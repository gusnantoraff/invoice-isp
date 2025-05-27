<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Services\WhatsApp\WhatsappService;
use Illuminate\Http\Request;
use App\Models\Client;
use App\Models\Device;
use App\Models\MessageTemplate;


class MessagesController extends Controller
{
    protected $wa;

    public function __construct(WhatsappService $wa)
    {
        $this->wa = $wa;
    }

    public function sendMessage(Request $request)
    {
        $validated = $request->validate([
            'device_id' => 'required|exists:devices,id',
            'client_id' => 'required|exists:clients,id',
            'text' => 'nullable|string',
            'message_template_id' => 'nullable|exists:message_templates,id',
            'is_group' => 'nullable|boolean',
            'image_url' => 'nullable|url',
            'document_url' => 'nullable|url',
            'document_name' => 'nullable|string|required_with:document_url',
            'chatbot_id' => 'nullable|exists:chatbots,id',
        ]);

        $device = Device::findOrFail($validated['device_id']);
        $client = Client::findOrFail($validated['client_id']);
        $session = $device->name;
        $phoneNumber = $client->phone;

        if (isset($validated['message_template_id'])) {
            $template = MessageTemplate::findOrFail($validated['message_template_id']);
            $text = str_replace('{{name}}', $client->name, $template->content);
        } else {
            $text = $validated['text'] ?? '';
        }
        
        $payload = [
            'session' => $session,
            'to' => $phoneNumber,
            'text' => $text,
            'is_group' => $request->boolean('is_group', false),
        ];

        if (isset($validated['image_url'])) {
            $payload['image_url'] = $validated['image_url'];
        }
        if (isset($validated['document_url'])) {
            $payload['document_url'] = $validated['document_url'];
            $payload['document_name'] = $validated['document_name'];
        }

        $response = $this->wa->sendMessage($payload);
        $status = $response['status'];

        Message::create([
            'device_id' => $device->id,
            'client_id' => $client->id,
            'chatbot_id' => $validated['chatbot_id'] ?? null,
            'message_template_id' => $validated['message_template_id'] ?? null,
            'message' => $text,
            'file' => $validated['document_name'] ?? null,
            'url' => $validated['document_url'] ?? ($validated['image_url'] ?? null),
            'status' => $status,
        ]);

        return response()->json([
            'success' => $status === 'sent',
            'message' => $status === 'sent' ? 'Pesan berhasil dikirim' : 'Gagal mengirim pesan',
            'whatsapp_response' => $response,
        ]);
    }
}