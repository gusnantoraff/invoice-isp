import React from 'react';
import { useTranslation } from 'react-i18next';
import { date } from '$app/common/helpers';
import { useCurrentCompanyDateFormats } from '$app/common/hooks/useCurrentCompanyDateFormats';
import { useReactSettings } from '$app/common/hooks/useReactSettings';

export interface FoClientFtth {
    id: string;
    nama_client: string | null;
    lokasi: { id: string; nama_lokasi: string } | null;
    odp: { id: string; nama_odp: string } | null;
    client: { id: string; name: string } | null;
    company: { id: string; name: string } | null;
    alamat: string | null;
    status: 'active' | 'archived';
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
}

export const defaultColumns: string[] = [
    'nama_client',
    'lokasi',
    'odp',
    'client',
    'company',
    'alamat',
    'status',
    'created_at',
    'updated_at',
    'deleted_at',
];

export function useAllFoClientFtthColumns(): readonly string[] {
    return defaultColumns;
}

export function useFoClientFtthColumns() {
    const { t } = useTranslation();
    const { dateFormat } = useCurrentCompanyDateFormats();
    const reactSettings = useReactSettings();

    const columns = [
        {
            column: 'nama_client',
            id: 'nama_client',
            label: t('nama_client'),
            format: (val: string | number, ftth: FoClientFtth) => (
                <a
                    href={`/fo-client-ftths/${ftth.id}/edit`}
                    className="text-blue-600 hover:underline"
                >
                    {val ?? '-'}
                </a>
            ),
        },
        {
            column: 'lokasi',
            id: 'lokasi',
            label: t('lokasi'),
            format: (_val: string | number, ftth: FoClientFtth) => ftth.lokasi?.nama_lokasi ?? '-',
        },
        {
            column: 'odp',
            id: 'odp',
            label: t('odp'),
            format: (_val: string | number, ftth: FoClientFtth) => ftth.odp?.nama_odp ?? '-',
        },
        {
            column: 'client',
            id: 'client',
            label: t('client'),
            format: (_val: string | number, ftth: FoClientFtth) => ftth.client?.name ?? '-',
        },
        {
            column: 'company',
            id: 'company',
            label: t('company'),
            format: (_val: string | number, ftth: FoClientFtth) => ftth.company?.name ?? '-',
        },
        {
            column: 'alamat',
            id: 'alamat',
            label: t('alamat'),
            format: (val: string | number, _ftth: FoClientFtth) => val ?? '-',
        },
        {
            column: 'status',
            id: 'status',
            label: t('status'),
            format: (val: string | number, _ftth: FoClientFtth) => t(val as string),
        },
        {
            column: 'created_at',
            id: 'created_at',
            label: t('created_at'),
            format: (val: string | number, _ftth: FoClientFtth) => date(val as string, dateFormat),
        },
        {
            column: 'updated_at',
            id: 'updated_at',
            label: t('updated_at'),
            format: (val: string | number, _ftth: FoClientFtth) => date(val as string, dateFormat),
        },
        {
            column: 'deleted_at',
            id: 'deleted_at',
            label: t('deleted_at'),
            format: (val: string | number, _ftth: FoClientFtth) => (val ? date(val as string, dateFormat) : '-'),
        },
    ];

    const list: string[] =
        (reactSettings?.react_table_columns as any)?.['fo_client_ftth'] || defaultColumns;

    return columns
        .filter((col) => list.includes(col.column))
        .sort((a, b) => list.indexOf(a.column) - list.indexOf(b.column));
}
