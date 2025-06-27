<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Services\WhatsApp\WhatsappService;
use Illuminate\Http\Request;
use App\Models\Client;
use App\Models\Device;
use App\Models\Invoice;
use App\Models\MessageTemplate;
use App\Utils\Traits\MakesHash;
use Carbon\Carbon;

class MessagesController extends Controller
{
    use MakesHash;
    protected $wa;

    public function __construct(WhatsappService $wa)
    {
        $this->wa = $wa;
    }

    public function getMessages(Request $request)
    {
        $query = Message::with(['device', 'client']);

        if ($request->has('session')) {
            $query->where('session', $request->input('session'));
        }

        return response()->json([
            'data' => $query->latest()->get()
        ]);
    }

    public function showMessages($id)
    {
        $message = Message::with(['device', 'client'])->find($id);

        if (!$message) {
            return response()->json([
                'error' => 'Message not found'
            ], 404);
        }

        return response()->json([
            'data' => $message
        ]);
    }

    public function getMessagesByDevice($deviceId)
    {
        $messages = Message::with(['device', 'client'])
            ->where('device_id', $deviceId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $messages
        ]);
    }

    public function sendMessage(Request $request)
    {
        $validated = $request->validate([
            'device_id' => 'required|exists:devices,id',
            'client_id' => 'required|array|min:1',
            'client_id.*' => 'required|string',
            'text' => 'nullable|string',
            'message_template_id' => 'nullable|exists:message_templates,id',
            'is_group' => 'nullable|boolean',
            'image_url' => 'nullable|url',
            'document_url' => 'nullable|url',
            'document_name' => 'nullable|string|required_with:document_url',
        ]);

        $decodedClientIds = array_map(
            fn($hashedId) => $this->decodePrimaryKey($hashedId),
            $validated['client_id']
        );

        if (in_array(null, $decodedClientIds, true)) {
            return response()->json(['message' => 'Invalid client ID detected'], 422);
        }

        $device = Device::findOrFail($validated['device_id']);
        $session = $device->name;

        if ($device->status !== 'connected') {
            foreach ($decodedClientIds as $clientId) {
                if (!$clientId)
                    continue;

                Message::create([
                    'device_id' => $device->id,
                    'client_id' => $clientId,
                    'message_template_id' => $validated['message_template_id'] ?? null,
                    'message' => $validated['text'] ?? '',
                    'file' => $validated['document_name'] ?? null,
                    'url' => $validated['document_url'] ?? ($validated['image_url'] ?? null),
                    'status' => 'failed',
                ]);
            }

            return response()->json([
                'success' => false,
                'error' => 'Device is not connected.',
                'results' => [],
            ], 400);
        }

        $clients = Client::whereIn('id', $decodedClientIds)->get();

        $isGroup = $request->boolean('is_group', false);
        $templateText = null;

        if (isset($validated['message_template_id'])) {
            $template = MessageTemplate::findOrFail($validated['message_template_id']);
            $templateText = $template->content;
        }

        $results = [];

        foreach ($clients as $client) {
            $invoice = Invoice::where('client_id', $client->id)->latest()->first();

            $amount = $invoice ? number_format($invoice->amount, 0, ',', '.') : '0';
            if ($invoice && $invoice->due_date) {
                Carbon::setLocale('id');
                $due = Carbon::parse($invoice->due_date);
                $dueDate = $due->translatedFormat('d F Y');
                $bulan = $due->translatedFormat('F Y');
            } else {
                $dueDate = 'N/A';
                $bulan = 'N/A';
            }


            $extraData = [
                'amount' => $amount,
                'due_date' => $dueDate,
                'bulan' => $bulan,
            ];

            if ($templateText) {
                $text = $this->replacePlaceholders($templateText, $client, $extraData);
            } else {
                $text = $validated['text'] ?? '';
            }

            $payload = [
                'session' => $session,
                'to' => $client->phone,
                'text' => $text,
                'is_group' => $isGroup,
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
                'message_template_id' => $validated['message_template_id'] ?? null,
                'message' => $text,
                'file' => $validated['document_name'] ?? null,
                'url' => $validated['document_url'] ?? ($validated['image_url'] ?? null),
                'status' => $status,
            ]);

            $results[] = [
                'client_id' => $client->id,
                'status' => $status,
                'whatsapp_response' => $response,
            ];
        }

        return response()->json([
            'success' => collect($results)->every(fn($r) => $r['status'] === 'sent'),
            'results' => $results,
        ]);
    }
    private function replacePlaceholders(string $template, Client $client, array $extraData = []): string
    {
        $replacements = array_merge([
            '{{name}}' => $client->name,
        ], [
            '{{amount}}' => $extraData['amount'] ?? '',
            '{{due_date}}' => $extraData['due_date'] ?? '',
            '{{bulan}}' => $extraData['bulan'] ?? '',
        ]);

        return str_replace(array_keys($replacements), array_values($replacements), $template);
    }
}
