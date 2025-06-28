import React, { useEffect, useState } from 'react';
import { Card } from '$app/components/cards/Card';
import { Spinner } from '$app/components/Spinner';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { request } from '$app/common/helpers/request';
import { endpoint } from '$app/common/helpers';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

function getStatusCounts(data: any[], statusField = 'status') {
  const counts: Record<string, number> = {};
  data.forEach((item) => {
    const status = item[statusField] || 'unknown';
    counts[status] = (counts[status] || 0) + 1;
  });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

export default function Status() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [odcStatus, setOdcStatus] = useState<any[]>([]);
  const [odpStatus, setOdpStatus] = useState<any[]>([]);
  const [kabelStatus, setKabelStatus] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    odc: 0,
    odp: 0,
    kabel: 0,
    odcStatus: {} as Record<string, number>,
    odpStatus: {} as Record<string, number>,
    kabelStatus: {} as Record<string, number>,
  });

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      request('GET', endpoint('/api/v1/fo-odcs')),
      request('GET', endpoint('/api/v1/fo-odps')),
      request('GET', endpoint('/api/v1/fo-kabel-odcs')),
    ])
      .then(([odcRes, odpRes, kabelRes]) => {
        setOdcStatus(getStatusCounts(odcRes.data.data));
        setOdpStatus(getStatusCounts(odpRes.data.data));
        setKabelStatus(getStatusCounts(kabelRes.data.data));
        setSummary({
          odc: odcRes.data.data.length,
          odp: odpRes.data.data.length,
          kabel: kabelRes.data.data.length,
          odcStatus: Object.fromEntries(getStatusCounts(odcRes.data.data).map(s => [s.name, s.value])),
          odpStatus: Object.fromEntries(getStatusCounts(odpRes.data.data).map(s => [s.name, s.value])),
          kabelStatus: Object.fromEntries(getStatusCounts(kabelRes.data.data).map(s => [s.name, s.value])),
        });
      })
      .catch(() => setError('Failed to load status data.'))
      .finally(() => setLoading(false));
  }, []);

  // Export CSV
  const handleExportCSV = () => {
    const csvRows = [
      ['Entity', 'Total', 'Active', 'Archived', 'Deleted', 'Other'],
      [
        'ODC',
        summary.odc,
        summary.odcStatus['active'] || 0,
        summary.odcStatus['archived'] || 0,
        summary.odcStatus['deleted'] || 0,
        Object.entries(summary.odcStatus).filter(([k]) => !['active','archived','deleted'].includes(k)).map(([k,v]) => `${k}:${v}`).join('; ')
      ],
      [
        'ODP',
        summary.odp,
        summary.odpStatus['active'] || 0,
        summary.odpStatus['archived'] || 0,
        summary.odpStatus['deleted'] || 0,
        Object.entries(summary.odpStatus).filter(([k]) => !['active','archived','deleted'].includes(k)).map(([k,v]) => `${k}:${v}`).join('; ')
      ],
      [
        'Kabel ODC',
        summary.kabel,
        summary.kabelStatus['active'] || 0,
        summary.kabelStatus['archived'] || 0,
        summary.kabelStatus['deleted'] || 0,
        Object.entries(summary.kabelStatus).filter(([k]) => !['active','archived','deleted'].includes(k)).map(([k,v]) => `${k}:${v}`).join('; ')
      ],
    ];
    const csvContent = csvRows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ftth-status.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export PDF
  const handleExportPDF = async () => {
    const input = document.getElementById('ftth-status-dashboard');
    if (!input) return;
    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape' });
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('ftth-status.pdf');
  };

  if (loading) return <Spinner />;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <div className="flex justify-end gap-2 mb-2">
        <button onClick={handleExportCSV} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Export CSV</button>
        <button onClick={handleExportPDF} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">Export PDF</button>
      </div>
      <div id="ftth-status-dashboard">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card title="ODC Total" childrenClassName="flex justify-center items-center text-2xl font-bold min-h-[2.5rem]">{summary.odc}</Card>
          <Card title="ODP Total" childrenClassName="flex justify-center items-center text-2xl font-bold min-h-[2.5rem]">{summary.odp}</Card>
          <Card title="Kabel ODC Total" childrenClassName="flex justify-center items-center text-2xl font-bold min-h-[2.5rem]">{summary.kabel}</Card>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <Card title="ODC Status">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={odcStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {odcStatus.map((entry, idx) => (
                    <Cell key={`cell-odc-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
          <Card title="ODP Status">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={odpStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {odpStatus.map((entry, idx) => (
                    <Cell key={`cell-odp-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Kabel ODC Status">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={kabelStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {kabelStatus.map((entry, idx) => (
                    <Cell key={`cell-kabel-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </div>
  );
}
