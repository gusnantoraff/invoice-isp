// client/src/pages/FoLokasis.tsx

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTitle } from '$app/common/hooks/useTitle';
import { Page } from '$app/components/Breadcrumbs';
import { Default } from '$app/components/layouts/Default';
import { DataTable2, DataTableColumns } from '$app/components/DataTable2';

interface FoLokasi {
    id: string;
    nama_lokasi: string;
    deskripsi: string | null;
    latitude: number;
    longitude: number;
    odcs?: { id: string; nama_odc: string }[];
    odps?: { id: string; nama_odp: string }[];
    clients?: { id: string; nama_client: string }[];
    created_at: string;
    updated_at: string;
    archived_at?: number;
    is_deleted?: boolean;
}

export default function FoLokasis() {
    useTitle('FO Lokasi');

    const [t] = useTranslation();
    const pages: Page[] = [{ name: t('FO Lokasi'), href: '/fo-lokasis' }];

    const columns: DataTableColumns<FoLokasi> = [
        { id: 'id', label: 'ID' },
        { id: 'nama_lokasi', label: 'Nama Lokasi' },
        { id: 'deskripsi', label: 'Deskripsi' },
        { id: 'latitude', label: 'Latitude' },
        { id: 'longitude', label: 'Longitude' },
        {
            id: 'odcs',
            label: 'Jumlah ODC',
            format: (_f, resource) => `${resource.odcs?.length ?? 0} ODC`,
        },
        {
            id: 'odps',
            label: 'Jumlah ODP',
            format: (_f, resource) => `${resource.odps?.length ?? 0} ODP`,
        },
        {
            id: 'clients',
            label: 'Jumlah Client',
            format: (_f, resource) => `${resource.clients?.length ?? 0} Client`,
        },
        {
            id: 'created_at',
            label: 'Dibuat Pada',
            format: (field) => field,
        },
        {
            id: 'updated_at',
            label: 'Diubah Pada',
            format: (field) => field,
        },
    ];

    return (
        <Default title={t('FO Lokasi')} breadcrumbs={pages}>
            <DataTable2<FoLokasi>
                resource="fo_lokasi"
                columns={columns}
                endpoint="/api/v1/fo-lokasis"
                linkToCreate="/fo-lokasis/create"
                linkToEdit="/fo-lokasis/:id/edit"
                withResourcefulActions
                bulkRoute="/api/v1/fo-lokasis"
            />
        </Default>
    );
}
