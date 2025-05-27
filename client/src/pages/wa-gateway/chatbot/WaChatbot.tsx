import { useState } from "react";
import { Default } from "$app/components/layouts/Default";
import { Page } from "$app/components/Breadcrumbs";
import { useTranslation } from 'react-i18next';

interface Chat {
  id: number;
  device: string;
  question: string;
  answer: string;
}

export default function WAChatbot() {
  const [t] = useTranslation();

  const pages: Page[] = [
    { name: t('WhatsApp Gateway'), href: '/wa-gateway' },
    { name: t('Chatbot'), href: '/wa-gateway/chatbot' },
  ];

  const [chats, setChats] = useState<Chat[]>([
    {
      id: 1,
      device: '628909788099',
      question: 'Halo',
      answer: 'Selamat datang di ISP kami...'
    },
    {
      id: 2,
      device: '628909788099',
      question: 'Berapa Invoice Saya?',
      answer: 'Tagihan anda sebesar...'
    },
  ]);

  return (
    <Default title={t("Daftar Chat")} breadcrumbs={pages}>
      <div className="p-4">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
          <button className="primary-btn">
            + Add Template
          </button>
        </div>
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3">Device</th>
                <th className="p-3">Pertanyaan</th>
                <th className="p-3">Jawaban</th>
                <th className="p-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {chats.map((chat) => (
                <tr key={chat.id} className="border-t">
                  <td className="p-3">{chat.device}</td>
                  <td className="p-3">{chat.question}</td>
                  <td className="p-3">{chat.answer}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:underline">Edit</button>
                      <button className="text-red-600 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <style>
          {`
          .primary-btn {
              background-color: #007bff;
              color: white;
              padding: 10px 16px;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              transition: background 0.2s ease;
              font-size: 14px;
            }
          `}
        </style>
      </div>
    </Default>

  );
}
