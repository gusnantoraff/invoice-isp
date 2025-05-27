import { useState } from "react";
import { Default } from "$app/components/layouts/Default";
import { Page } from "$app/components/Breadcrumbs";
import { useTranslation } from 'react-i18next';

interface Chat {
  id: number;
  device: string;
  phoneNumber: string;
  lastMessage: string;
  timestamp: string;
}

export default function WAChat() {
  const [t] = useTranslation();

  const pages: Page[] = [
    { name: t('WhatsApp Gateway'), href: '/wa-gateway' },
    { name: t('Chats'), href: '/wa-gateway/chats' },
  ];

  const [chats, setChats] = useState<Chat[]>([
    {
      id: 1,
      device: '628909788099',
      phoneNumber: '+6281234567890',
      lastMessage: 'Halo, tagihan anda tanggal...',
      timestamp: '2025-04-18 10:05',
    },
    {
      id: 2,
      device: '628909788099',
      phoneNumber: '+6289876543210',
      lastMessage: 'Terima Halo, tagihan anda tanggal...',
      timestamp: '2025-04-18 09:45',
    },
  ]);

  return (
    <Default title={t("Daftar Chat")} breadcrumbs={pages}>
      <div className="p-4">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3">Device</th>
                <th className="p-3">No. HP Client</th>
                <th className="p-3">Pesan Terkirim</th>
                <th className="p-3">Waktu</th>
              </tr>
            </thead>
            <tbody>
              {chats.map((chat) => (
                <tr key={chat.id} className="border-t">
                  <td className="p-3">{chat.device}</td>
                  <td className="p-3">{chat.phoneNumber}</td>
                  <td className="p-3">{chat.lastMessage}</td>
                  <td className="p-3">{chat.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Default>
  );
}
