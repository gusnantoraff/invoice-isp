import React, { useEffect, useState } from 'react';
import { Card } from '$app/components/cards/Card';
import { Spinner } from '$app/components/Spinner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { request } from '$app/common/helpers/request';
import { endpoint } from '$app/common/helpers';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

export default function Utilization() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coreUtil, setCoreUtil] = useState<any[]>([]);
  const [tubeUtil, setTubeUtil] = useState<any[]>([]);
  const [odpUtil, setOdpUtil] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalCores: 0,
    assignedCores: 0,
    totalTubes: 0,
    usedTubes: 0,
    totalOdps: 0,
    withClient: 0,
  });

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      request('GET', endpoint('/api/v1/fo-kabel-core-odcs')),
      request('GET', endpoint('/api/v1/fo-kabel-tube-odcs')),
      request('GET', endpoint('/api/v1/fo-odps')),
    ])
      .then(([coreRes, tubeRes, odpRes]) => {
        // Core utilization: assigned (has odp) vs unassigned
        const totalCores = coreRes.data.data.length;
        const assignedCores = coreRes.data.data.filter((c: any) => c.odp !== null).length;
        setCoreUtil([
          { name: 'Assigned', value: assignedCores },
          { name: 'Unassigned', value: totalCores - assignedCores },
        ]);
        // Tube utilization: count tubes with at least one assigned core
        const tubeMap: Record<string, number> = {};
        coreRes.data.data.forEach((c: any) => {
          if (c.kabel_tube_odc_id) {
            tubeMap[c.kabel_tube_odc_id] = (tubeMap[c.kabel_tube_odc_id] || 0) + 1;
          }
        });
        const totalTubes = tubeRes.data.data.length;
        const usedTubes = Object.keys(tubeMap).length;
        setTubeUtil([
          { name: 'Used', value: usedTubes },
          { name: 'Unused', value: totalTubes - usedTubes },
        ]);
        // ODP utilization: ODPs with client vs without
        const totalOdps = odpRes.data.data.length;
        const withClient = odpRes.data.data.filter((o: any) => o.client_ftth !== null).length;
        setOdpUtil([
          { name: 'With Client', value: withClient },
          { name: 'No Client', value: totalOdps - withClient },
        ]);
        setSummary({ totalCores, assignedCores, totalTubes, usedTubes, totalOdps, withClient });
      })
      .catch(() => setError('Failed to load utilization data.'))
      .finally(() => setLoading(false));
  }, []);

  // Export CSV
  const handleExportCSV = () => {
    const csvRows = [
      ['Total Cores', summary.totalCores],
      ['Assigned Cores', summary.assignedCores],
      ['Total Tubes', summary.totalTubes],
      ['Used Tubes', summary.usedTubes],
      ['Total ODPs', summary.totalOdps],
      ['ODPs with Client', summary.withClient],
      ['Core Utilization (%)', summary.totalCores > 0 ? Math.round((summary.assignedCores / summary.totalCores) * 100) : 0],
      ['Tube Utilization (%)', summary.totalTubes > 0 ? Math.round((summary.usedTubes / summary.totalTubes) * 100) : 0],
      ['ODP Utilization (%)', summary.totalOdps > 0 ? Math.round((summary.withClient / summary.totalOdps) * 100) : 0],
    ];
    const csvContent = csvRows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ftth-utilization.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export PDF
  const handleExportPDF = async () => {
    const input = document.getElementById('ftth-utilization-dashboard');
    if (!input) return;
    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape' });
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('ftth-utilization.pdf');
  };

  if (loading) return <Spinner />;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <div className="flex justify-end gap-2 mb-2">
        <button onClick={handleExportCSV} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Export CSV</button>
        <button onClick={handleExportPDF} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">Export PDF</button>
      </div>
      <div id="ftth-utilization-dashboard">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <Card title="Total Cores" childrenClassName="flex justify-center items-center text-2xl font-bold min-h-[2.5rem]">{summary.totalCores}</Card>
          <Card title="Assigned Cores" childrenClassName="flex justify-center items-center text-2xl font-bold min-h-[2.5rem]">{summary.assignedCores}</Card>
          <Card title="Total Tubes" childrenClassName="flex justify-center items-center text-2xl font-bold min-h-[2.5rem]">{summary.totalTubes}</Card>
          <Card title="Used Tubes" childrenClassName="flex justify-center items-center text-2xl font-bold min-h-[2.5rem]">{summary.usedTubes}</Card>
          <Card title="Total ODPs" childrenClassName="flex justify-center items-center text-2xl font-bold min-h-[2.5rem]">{summary.totalOdps}</Card>
          <Card title="ODPs with Client" childrenClassName="flex justify-center items-center text-2xl font-bold min-h-[2.5rem]">{summary.withClient}</Card>
          <Card title="Core Utilization (%)" childrenClassName="flex justify-center items-center text-xl font-semibold min-h-[2.5rem]">{summary.totalCores > 0 ? Math.round((summary.assignedCores / summary.totalCores) * 100) : 0}%</Card>
          <Card title="Tube Utilization (%)" childrenClassName="flex justify-center items-center text-xl font-semibold min-h-[2.5rem]">{summary.totalTubes > 0 ? Math.round((summary.usedTubes / summary.totalTubes) * 100) : 0}%</Card>
          <Card title="ODP Utilization (%)" childrenClassName="flex justify-center items-center text-xl font-semibold min-h-[2.5rem]">{summary.totalOdps > 0 ? Math.round((summary.withClient / summary.totalOdps) * 100) : 0}%</Card>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <Card title="Core Utilization">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={coreUtil} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {coreUtil.map((entry, idx) => (
                    <Cell key={`cell-core-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Tube Utilization">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={tubeUtil} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {tubeUtil.map((entry, idx) => (
                    <Cell key={`cell-tube-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
          <Card title="ODP Utilization">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={odpUtil} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {odpUtil.map((entry, idx) => (
                    <Cell key={`cell-odp-${idx}`} fill={COLORS[idx % COLORS.length]} />
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
