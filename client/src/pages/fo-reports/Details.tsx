import React, { useEffect, useState } from 'react';
import { Spinner } from '$app/components/Spinner';
import { DataTable } from '$app/components/DataTable';
import { request } from '$app/common/helpers/request';
import { endpoint } from '$app/common/helpers';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function flattenForCSV(lokasis: any[]) {
  // Flatten nested structure for CSV export
  const rows: any[] = [];
  lokasis.forEach((lokasi) => {
    lokasi.odcs.forEach((odc: any) => {
      odc.kabel_odcs.forEach((kabel: any) => {
        kabel.kabel_tube_odcs.forEach((tube: any) => {
          tube.kabel_core_odcs.forEach((core: any) => {
            core.odps.forEach((odp: any) => {
              odp.clients.forEach((client: any) => {
                rows.push({
                  lokasi: lokasi.nama_lokasi,
                  lokasi_lat: lokasi.latitude,
                  lokasi_lng: lokasi.longitude,
                  odc: odc.nama_odc,
                  kabel: kabel.nama_kabel,
                  tube: tube.warna_tube,
                  core: core.warna_core,
                  odp: odp.nama_odp,
                  client: client.nama_client,
                  client_alamat: client.alamat,
                });
              });
              if (odp.clients.length === 0) {
                rows.push({
                  lokasi: lokasi.nama_lokasi,
                  lokasi_lat: lokasi.latitude,
                  lokasi_lng: lokasi.longitude,
                  odc: odc.nama_odc,
                  kabel: kabel.nama_kabel,
                  tube: tube.warna_tube,
                  core: core.warna_core,
                  odp: odp.nama_odp,
                  client: '',
                  client_alamat: '',
                });
              }
            });
            if (core.odps.length === 0) {
              rows.push({
                lokasi: lokasi.nama_lokasi,
                lokasi_lat: lokasi.latitude,
                lokasi_lng: lokasi.longitude,
                odc: odc.nama_odc,
                kabel: kabel.nama_kabel,
                tube: tube.warna_tube,
                core: core.warna_core,
                odp: '',
                client: '',
                client_alamat: '',
              });
            }
          });
          if (tube.kabel_core_odcs.length === 0) {
            rows.push({
              lokasi: lokasi.nama_lokasi,
              lokasi_lat: lokasi.latitude,
              lokasi_lng: lokasi.longitude,
              odc: odc.nama_odc,
              kabel: kabel.nama_kabel,
              tube: tube.warna_tube,
              core: '',
              odp: '',
              client: '',
              client_alamat: '',
            });
          }
        });
        if (kabel.kabel_tube_odcs.length === 0) {
          rows.push({
            lokasi: lokasi.nama_lokasi,
            lokasi_lat: lokasi.latitude,
            lokasi_lng: lokasi.longitude,
            odc: odc.nama_odc,
            kabel: kabel.nama_kabel,
            tube: '',
            core: '',
            odp: '',
            client: '',
            client_alamat: '',
          });
        }
      });
      if (odc.kabel_odcs.length === 0) {
        rows.push({
          lokasi: lokasi.nama_lokasi,
          lokasi_lat: lokasi.latitude,
          lokasi_lng: lokasi.longitude,
          odc: odc.nama_odc,
          kabel: '',
          tube: '',
          core: '',
          odp: '',
          client: '',
          client_alamat: '',
        });
      }
    });
    if (lokasi.odcs.length === 0) {
      rows.push({
        lokasi: lokasi.nama_lokasi,
        lokasi_lat: lokasi.latitude,
        lokasi_lng: lokasi.longitude,
        odc: '',
        kabel: '',
        tube: '',
        core: '',
        odp: '',
        client: '',
        client_alamat: '',
      });
    }
  });
  return rows;
}

export default function Details() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lokasis, setLokasis] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      request('GET', endpoint('/api/v1/fo-lokasis')),
      request('GET', endpoint('/api/v1/fo-odcs')),
      request('GET', endpoint('/api/v1/fo-kabel-odcs')),
      request('GET', endpoint('/api/v1/fo-kabel-tube-odcs')),
      request('GET', endpoint('/api/v1/fo-kabel-core-odcs')),
      request('GET', endpoint('/api/v1/fo-odps')),
      request('GET', endpoint('/api/v1/fo-client-ftths')),
    ])
      .then(([lokasiRes, odcRes, kabelOdcRes, tubeRes, coreRes, odpRes, clientRes]) => {
        // Build nested structure
        const lokasis = lokasiRes.data.data.map((lokasi: any) => ({
          ...lokasi,
          odcs: odcRes.data.data.filter((odc: any) => odc.lokasi_id === lokasi.id).map((odc: any) => ({
            ...odc,
            kabel_odcs: kabelOdcRes.data.data.filter((k: any) => k.odc_id === odc.id).map((kabel: any) => ({
              ...kabel,
              kabel_tube_odcs: tubeRes.data.data.filter((t: any) => t.kabel_odc_id === kabel.id).map((tube: any) => ({
                ...tube,
                kabel_core_odcs: coreRes.data.data.filter((c: any) => c.kabel_tube_odc_id === tube.id).map((core: any) => ({
                  ...core,
                  odps: odpRes.data.data.filter((odp: any) => odp.kabel_core_odc_id === core.id).map((odp: any) => ({
                    ...odp,
                    clients: clientRes.data.data.filter((client: any) => client.odp_id === odp.id),
                  })),
                })),
              })),
            })),
          })),
        }));
        setLokasis(lokasis);
      })
      .catch(() => setError('Failed to load FTTH details.'))
      .finally(() => setLoading(false));
  }, []);

  const handleExportCSV = () => {
    const csv = Papa.unparse(flattenForCSV(lokasis));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ftth-details.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Export
  const handleExportPDF = async () => {
    const input = document.getElementById('ftth-details-dashboard');
    if (!input) return;
    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape' });
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('ftth-details.pdf');
  };

  if (loading) return <Spinner />;
  if (error) return <div className="text-red-600">{error}</div>;

  // Table columns for Lokasi
  const columns = [
    { id: 'nama_lokasi', label: 'Lokasi' },
    { id: 'deskripsi', label: 'Deskripsi' },
    { id: 'latitude', label: 'Latitude' },
    { id: 'longitude', label: 'Longitude' },
    { id: 'status', label: 'Status' },
    { id: 'created_at', label: 'Created At' },
    { id: 'updated_at', label: 'Updated At' },
  ];

  // Render expandable rows for ODC, Kabel, etc.
  return (
    <div>
      <div className="flex justify-end gap-2 mb-2">
        <button onClick={handleExportCSV} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Export CSV</button>
        <button onClick={handleExportPDF} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">Export PDF</button>
      </div>
      <div id="ftth-details-dashboard">
        <h2 className="text-lg font-semibold mb-2">Lokasi</h2>
        <DataTable
          resource="ftth-lokasi"
          columns={columns}
          endpoint="/api/v1/fo-lokasis"
          // TODO: Use a custom expandable table for full drill-down, as DataTable does not support 'data' or 'renderExpandedRow' props.
        />
      </div>
    </div>
  );
}
