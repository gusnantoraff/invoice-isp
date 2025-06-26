import React, { useEffect, useState } from 'react';
import { Card } from '$app/components/cards/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { Spinner } from '$app/components/Spinner';
import { request } from '$app/common/helpers/request';
import { endpoint } from '$app/common/helpers';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

export default function Overview() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    lokasi: 0,
    odc: 0,
    odp: 0,
    kabel: 0,
    kabelLength: 0,
    clientFtth: 0,
    tubes: 0,
    cores: 0,
    odpUtilization: 0,
    kabelUtilization: 0,
  });
  const [odpsPerOdc, setOdpsPerOdc] = useState<any[]>([]);
  const [clientsPerOdp, setClientsPerOdp] = useState<any[]>([]);
  const [odpStatusPie, setOdpStatusPie] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      request('GET', endpoint('/api/v1/fo-lokasis')),
      request('GET', endpoint('/api/v1/fo-odcs')),
      request('GET', endpoint('/api/v1/fo-odps')),
      request('GET', endpoint('/api/v1/fo-client-ftths')),
      request('GET', endpoint('/api/v1/fo-kabel-odcs')),
      request('GET', endpoint('/api/v1/fo-kabel-tube-odcs')),
      request('GET', endpoint('/api/v1/fo-kabel-core-odcs')),
    ])
      .then(([lokasiRes, odcRes, odpRes, clientFtthRes, kabelOdcRes, tubeOdcRes, coreOdcRes]) => {
        // Summary
        const lokasi = lokasiRes.data.data.length;
        const odc = odcRes.data.data.length;
        const odp = odpRes.data.data.length;
        const kabel = kabelOdcRes.data.data.length;
        const kabelLength = kabelOdcRes.data.data.reduce((sum: number, k: any) => sum + (k.panjang_kabel || 0), 0);
        const clientFtth = clientFtthRes.data.data.length;
        const tubes = tubeOdcRes.data.data.length;
        const cores = coreOdcRes.data.data.length;
        const odpUtilization = odpRes.data.data.length > 0 ? Math.round((clientFtthRes.data.data.length / odpRes.data.data.length) * 100) : 0;
        const kabelUtilization = kabelOdcRes.data.data.length > 0 ? Math.round((tubeOdcRes.data.data.length / kabelOdcRes.data.data.length) * 100) : 0;
        setSummary({ lokasi, odc, odp, kabel, kabelLength, clientFtth, tubes, cores, odpUtilization, kabelUtilization });

        // ODPs per ODC (bar chart)
        const odpsByOdc: Record<string, number> = {};
        odpRes.data.data.forEach((odp: any) => {
          const odcName = odp.odc?.nama_odc || 'Unknown';
          odpsByOdc[odcName] = (odpsByOdc[odcName] || 0) + 1;
        });
        setOdpsPerOdc(Object.entries(odpsByOdc).map(([name, count]) => ({ name, ODPs: count })));

        // Clients per ODP (bar chart)
        const clientsByOdp: Record<string, number> = {};
        clientFtthRes.data.data.forEach((client: any) => {
          const odpName = client.odp?.nama_odp || 'Unknown';
          clientsByOdp[odpName] = (clientsByOdp[odpName] || 0) + 1;
        });
        setClientsPerOdp(Object.entries(clientsByOdp).map(([name, count]) => ({ name, Clients: count })));

        // ODP status pie
        const statusCounts: Record<string, number> = {};
        odpRes.data.data.forEach((o: any) => {
          statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
        });
        setOdpStatusPie(Object.entries(statusCounts).map(([name, value]) => ({ name, value })));
      })
      .catch((err) => {
        setError('Failed to load FTTH data.');
      })
      .finally(() => setLoading(false));
  }, []);

  // Export CSV
  const handleExportCSV = () => {
    const csvRows = [
      ['Total Lokasi', summary.lokasi],
      ['Total ODC', summary.odc],
      ['Total ODP', summary.odp],
      ['Total Kabel ODC', summary.kabel],
      ['Total Kabel Length (m)', summary.kabelLength],
      ['Total Tubes', summary.tubes],
      ['Total Cores', summary.cores],
      ['Total Client FTTH', summary.clientFtth],
      ['ODP Utilization (%)', summary.odpUtilization],
      ['Kabel Utilization (%)', summary.kabelUtilization],
    ];
    const csvContent = csvRows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ftth-overview.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export PDF
  const handleExportPDF = async () => {
    const input = document.getElementById('ftth-overview-dashboard');
    if (!input) return;
    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape' });
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('ftth-overview.pdf');
  };

  if (loading) return <Spinner />;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <div className="flex justify-end gap-2 mb-2">
        <button onClick={handleExportCSV} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Export CSV</button>
        <button onClick={handleExportPDF} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">Export PDF</button>
      </div>
      <div id="ftth-overview-dashboard">
        <div className="grid grid-cols-1 md:grid-cols-5 lg:grid-cols-7 gap-4 mb-8">
          <Card title="Total Lokasi" childrenClassName="flex justify-center items-center text-3xl font-bold min-h-[2.5rem]">{summary.lokasi}</Card>
          <Card title="Total ODC" childrenClassName="flex justify-center items-center text-3xl font-bold min-h-[2.5rem]">{summary.odc}</Card>
          <Card title="Total ODP" childrenClassName="flex justify-center items-center text-3xl font-bold min-h-[2.5rem]">{summary.odp}</Card>
          <Card title="Total Kabel ODC" childrenClassName="flex justify-center items-center text-3xl font-bold min-h-[2.5rem]">{summary.kabel}</Card>
          <Card title="Total Kabel Length (m)" childrenClassName="flex justify-center items-center text-3xl font-bold min-h-[2.5rem]">{summary.kabelLength}</Card>
          <Card title="Total Tubes" childrenClassName="flex justify-center items-center text-3xl font-bold min-h-[2.5rem]">{summary.tubes}</Card>
          <Card title="Total Cores" childrenClassName="flex justify-center items-center text-3xl font-bold min-h-[2.5rem]">{summary.cores}</Card>
          <Card title="Total Client FTTH" childrenClassName="flex justify-center items-center text-3xl font-bold min-h-[2.5rem]">{summary.clientFtth}</Card>
          <Card title="ODP Utilization (%)" childrenClassName="flex justify-center items-center text-2xl font-semibold min-h-[2.5rem]">{summary.odpUtilization}%</Card>
          <Card title="Kabel Utilization (%)" childrenClassName="flex justify-center items-center text-2xl font-semibold min-h-[2.5rem]">{summary.kabelUtilization}%</Card>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="col-span-1">
            <h2 className="text-lg font-semibold mb-2">ODPs per ODC</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={odpsPerOdc}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="ODPs" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="col-span-1">
            <h2 className="text-lg font-semibold mb-2">Clients per ODP</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={clientsPerOdp}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="Clients" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="col-span-1">
            <h2 className="text-lg font-semibold mb-2">ODP Status Breakdown</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={odpStatusPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {odpStatusPie.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={["#8884d8", "#82ca9d", "#ffc658"][idx % 3]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Future: Client growth line chart here if data available */}
      </div>
    </div>
  );
}
