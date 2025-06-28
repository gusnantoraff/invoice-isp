import React, { useEffect, useState } from 'react';
import { Spinner } from '$app/components/Spinner';
import { Card } from '$app/components/cards/Card';
import { request } from '$app/common/helpers/request';
import { endpoint } from '$app/common/helpers';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ChevronDown, ChevronUp, Folder, Server, GitBranch, Layers, Grid, User, Users, MapPin, Activity } from 'react-feather';

function flattenForCSV(lokasis: any[]) {
  // Flatten nested structure for CSV export
  const rows: any[] = [];
  lokasis.forEach((lokasi) => {
    // Add Lokasi level
    rows.push({
      level: 'Lokasi',
      lokasi: lokasi.nama_lokasi,
      lokasi_deskripsi: lokasi.deskripsi,
      lokasi_lat: lokasi.latitude,
      lokasi_lng: lokasi.longitude,
      lokasi_status: lokasi.status,
      odc: '',
      odc_tipe_splitter: '',
      odc_status: '',
      kabel: '',
      kabel_tipe: '',
      kabel_panjang: '',
      kabel_status: '',
      tube: '',
      tube_warna: '',
      tube_status: '',
      core: '',
      core_warna: '',
      core_status: '',
      odp: '',
      odp_status: '',
      client: '',
      client_alamat: '',
      client_status: '',
    });

    // Add ODC level
    lokasi.odcs.forEach((odc: any) => {
      rows.push({
        level: 'ODC',
        lokasi: lokasi.nama_lokasi,
        lokasi_deskripsi: lokasi.deskripsi,
        lokasi_lat: lokasi.latitude,
        lokasi_lng: lokasi.longitude,
        lokasi_status: lokasi.status,
        odc: odc.nama_odc,
        odc_tipe_splitter: odc.tipe_splitter,
        odc_status: odc.status,
        kabel: '',
        kabel_tipe: '',
        kabel_panjang: '',
        kabel_status: '',
        tube: '',
        tube_warna: '',
        tube_status: '',
        core: '',
        core_warna: '',
        core_status: '',
        odp: '',
        odp_status: '',
        client: '',
        client_alamat: '',
        client_status: '',
      });

      // Add Kabel level
      odc.kabel_odcs.forEach((kabel: any) => {
        rows.push({
          level: 'Kabel',
          lokasi: lokasi.nama_lokasi,
          lokasi_deskripsi: lokasi.deskripsi,
          lokasi_lat: lokasi.latitude,
          lokasi_lng: lokasi.longitude,
          lokasi_status: lokasi.status,
          odc: odc.nama_odc,
          odc_tipe_splitter: odc.tipe_splitter,
          odc_status: odc.status,
          kabel: kabel.nama_kabel,
          kabel_tipe: kabel.tipe_kabel,
          kabel_panjang: kabel.panjang_kabel,
          kabel_status: kabel.status,
          tube: '',
          tube_warna: '',
          tube_status: '',
          core: '',
          core_warna: '',
          core_status: '',
          odp: '',
          odp_status: '',
          client: '',
          client_alamat: '',
          client_status: '',
        });

        // Add Tube level
        kabel.kabel_tube_odcs.forEach((tube: any) => {
          rows.push({
            level: 'Tube',
            lokasi: lokasi.nama_lokasi,
            lokasi_deskripsi: lokasi.deskripsi,
            lokasi_lat: lokasi.latitude,
            lokasi_lng: lokasi.longitude,
            lokasi_status: lokasi.status,
            odc: odc.nama_odc,
            odc_tipe_splitter: odc.tipe_splitter,
            odc_status: odc.status,
            kabel: kabel.nama_kabel,
            kabel_tipe: kabel.tipe_kabel,
            kabel_panjang: kabel.panjang_kabel,
            kabel_status: kabel.status,
            tube: tube.warna_tube,
            tube_warna: tube.warna_tube,
            tube_status: tube.status,
            core: '',
            core_warna: '',
            core_status: '',
            odp: '',
            odp_status: '',
            client: '',
            client_alamat: '',
            client_status: '',
          });

          // Add Core level
          tube.kabel_core_odcs.forEach((core: any) => {
            rows.push({
              level: 'Core',
              lokasi: lokasi.nama_lokasi,
              lokasi_deskripsi: lokasi.deskripsi,
              lokasi_lat: lokasi.latitude,
              lokasi_lng: lokasi.longitude,
              lokasi_status: lokasi.status,
              odc: odc.nama_odc,
              odc_tipe_splitter: odc.tipe_splitter,
              odc_status: odc.status,
              kabel: kabel.nama_kabel,
              kabel_tipe: kabel.tipe_kabel,
              kabel_panjang: kabel.panjang_kabel,
              kabel_status: kabel.status,
              tube: tube.warna_tube,
              tube_warna: tube.warna_tube,
              tube_status: tube.status,
              core: core.warna_core,
              core_warna: core.warna_core,
              core_status: core.status,
              odp: core.odp?.nama_odp || '',
              odp_status: core.odp?.status || '',
              client: core.odp?.client_ftth?.nama_client || '',
              client_alamat: core.odp?.client_ftth?.alamat || '',
              client_status: core.odp?.client_ftth?.status || '',
            });
          });
        });
      });
    });

    // Add standalone ODPs
    lokasi.odps.forEach((odp: any) => {
      rows.push({
        level: 'ODP',
        lokasi: lokasi.nama_lokasi,
        lokasi_deskripsi: lokasi.deskripsi,
        lokasi_lat: lokasi.latitude,
        lokasi_lng: lokasi.longitude,
        lokasi_status: lokasi.status,
        odc: '',
        odc_tipe_splitter: '',
        odc_status: '',
        kabel: '',
        kabel_tipe: '',
        kabel_panjang: '',
        kabel_status: '',
        tube: '',
        tube_warna: '',
        tube_status: '',
        core: '',
        core_warna: '',
        core_status: '',
        odp: odp.nama_odp,
        odp_status: odp.status,
        client: odp.client_ftth?.nama_client || '',
        client_alamat: odp.client_ftth?.alamat || '',
        client_status: odp.client_ftth?.status || '',
      });
    });

    // Add standalone Client FTTHs
    lokasi.client_ftths.forEach((client: any) => {
      rows.push({
        level: 'Client FTTH',
        lokasi: lokasi.nama_lokasi,
        lokasi_deskripsi: lokasi.deskripsi,
        lokasi_lat: lokasi.latitude,
        lokasi_lng: lokasi.longitude,
        lokasi_status: lokasi.status,
        odc: '',
        odc_tipe_splitter: '',
        odc_status: '',
        kabel: '',
        kabel_tipe: '',
        kabel_panjang: '',
        kabel_status: '',
        tube: '',
        tube_warna: '',
        tube_status: '',
        core: '',
        core_warna: '',
        core_status: '',
        odp: client.odp?.nama_odp || '',
        odp_status: client.odp?.status || '',
        client: client.nama_client,
        client_alamat: client.alamat,
        client_status: client.status,
      });
    });
  });
  return rows;
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'archived':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'deleted':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
      <Activity size={12} className="mr-1.5" />
      {status}
    </span>
  );
}

// Location card component
function LocationCard({ lokasi }: { lokasi: any }) {
  const [expanded, setExpanded] = useState(false);

  const handleExpandClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded((prev) => !prev);
  };

  return (
    <Card className="mb-6">
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-100 rounded-lg">
              <Folder size={22} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{lokasi.nama_lokasi}</h3>
              <p className="text-sm text-gray-600">{lokasi.deskripsi}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={lokasi.status} />
            <button
              type="button"
              onClick={handleExpandClick}
              className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{lokasi.odcs?.length || 0}</div>
            <div className="text-sm text-gray-600">ODCs</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{lokasi.odps?.length || 0}</div>
            <div className="text-sm text-gray-600">ODPs</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{lokasi.client_ftths?.length || 0}</div>
            <div className="text-sm text-gray-600">Clients</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {lokasi.odcs?.reduce((sum: number, odc: any) => sum + (odc.kabel_odcs?.length || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Kabel</div>
          </div>
        </div>

        {/* Location details */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <MapPin size={16} />
          <span>Lat: {lokasi.latitude}, Lng: {lokasi.longitude}</span>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="border-t pt-4 space-y-4">
            {/* ODCs */}
            {lokasi.odcs?.map((odc: any, idx: number) => (
              <OdcCard key={odc.id || idx} odc={odc} lokasiName={lokasi.nama_lokasi} />
            ))}

            {/* Standalone ODPs */}
            {lokasi.odps?.map((odp: any, idx: number) => (
              <OdpCard key={odp.id || idx} odp={odp} lokasiName={lokasi.nama_lokasi} />
            ))}

            {/* Standalone Clients */}
            {lokasi.client_ftths?.map((client: any, idx: number) => (
              <ClientCard key={client.id || idx} client={client} lokasiName={lokasi.nama_lokasi} />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// ODC card component
function OdcCard({ odc, lokasiName }: { odc: any; lokasiName: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="ml-6 border-l-2 border-green-200 pl-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 rounded">
            <Server size={18} className="text-green-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{odc.nama_odc}</h4>
            <p className="text-sm text-gray-600">Splitter: {odc.tipe_splitter}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={odc.status} />
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-3">
          {odc.kabel_odcs?.map((kabel: any, idx: number) => (
            <KabelCard key={kabel.id || idx} kabel={kabel} odcName={odc.nama_odc} lokasiName={lokasiName} />
          ))}
        </div>
      )}
    </div>
  );
}

// Kabel card component
function KabelCard({ kabel, odcName, lokasiName }: { kabel: any; odcName: string; lokasiName: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="ml-6 border-l-2 border-yellow-200 pl-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-yellow-100 rounded">
            <GitBranch size={18} className="text-yellow-600" />
          </div>
          <div>
            <h5 className="font-medium text-gray-900">{kabel.nama_kabel}</h5>
            <p className="text-sm text-gray-600">
              {kabel.tipe_kabel} • {kabel.panjang_kabel}m • {kabel.jumlah_total_core} cores
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={kabel.status} />
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-3">
          {kabel.kabel_tube_odcs?.map((tube: any, idx: number) => (
            <TubeCard key={tube.id || idx} tube={tube} kabelName={kabel.nama_kabel} odcName={odcName} lokasiName={lokasiName} />
          ))}
        </div>
      )}
    </div>
  );
}

// Tube card component
function TubeCard({ tube, kabelName, odcName, lokasiName }: { tube: any; kabelName: string; odcName: string; lokasiName: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="ml-6 border-l-2 border-orange-200 pl-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-100 rounded">
            <Layers size={18} className="text-orange-600" />
          </div>
          <div>
            <h6 className="font-medium text-gray-900">Tube {tube.warna_tube}</h6>
            <p className="text-sm text-gray-600">{tube.kabel_core_odcs?.length || 0} cores</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={tube.status} />
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-3">
          {tube.kabel_core_odcs?.map((core: any, idx: number) => (
            <CoreCard key={core.id || idx} core={core} tubeName={tube.warna_tube} kabelName={kabelName} odcName={odcName} lokasiName={lokasiName} />
          ))}
        </div>
      )}
    </div>
  );
}

// Core card component
function CoreCard({ core, tubeName, kabelName, odcName, lokasiName }: { core: any; tubeName: string; kabelName: string; odcName: string; lokasiName: string }) {
  return (
    <div className="ml-6 border-l-2 border-red-200 pl-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-100 rounded">
            <Grid size={18} className="text-red-600" />
          </div>
          <div>
            <h6 className="font-medium text-gray-900">Core {core.warna_core}</h6>
            {core.odp && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">ODP:</span> {core.odp.nama_odp}
                {core.odp.client_ftth && (
                  <span className="ml-2">
                    <span className="font-medium">Client:</span> {core.odp.client_ftth.nama_client}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <StatusBadge status={core.status} />
      </div>
    </div>
  );
}

// ODP card component
function OdpCard({ odp, lokasiName }: { odp: any; lokasiName: string }) {
  return (
    <div className="ml-6 border-l-2 border-purple-200 pl-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded">
            <Users size={18} className="text-purple-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{odp.nama_odp}</h4>
            {odp.client_ftth && (
              <p className="text-sm text-gray-600">Client: {odp.client_ftth.nama_client}</p>
            )}
          </div>
        </div>
        <StatusBadge status={odp.status} />
      </div>
    </div>
  );
}

// Client card component
function ClientCard({ client, lokasiName }: { client: any; lokasiName: string }) {
  return (
    <div className="ml-6 border-l-2 border-indigo-200 pl-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded">
            <User size={18} className="text-indigo-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{client.nama_client}</h4>
            <p className="text-sm text-gray-600">{client.alamat}</p>
          </div>
        </div>
        <StatusBadge status={client.status} />
      </div>
    </div>
  );
}

export default function Details() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lokasis, setLokasis] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    request('GET', endpoint('/api/v1/ftth-statistics'))
      .then((response) => {
        setLokasis(response.data.data.detailed);
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FTTH Infrastructure Details</h1>
          <p className="text-gray-600 mt-1">Complete overview of all fiber optic infrastructure components</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      <div id="ftth-details-dashboard">
        <div className="space-y-6">
          {lokasis.map((lokasi, idx) => (
            <LocationCard key={lokasi.id || idx} lokasi={lokasi} />
          ))}
        </div>
      </div>
    </div>
  );
}
