// client/src/pages/fo-lokasis/FoLokasi.tsx

import React, { useEffect, useState } from 'react';
import { useParams, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { endpoint } from '$app/common/helpers';
import { request } from '$app/common/helpers/request';
import { toast } from '$app/common/helpers/toast/toast';
import { Default } from '$app/components/layouts/Default';
import { Container } from '$app/components/Container';
import { Spinner } from '$app/components/Spinner';

interface FoLokasi {
    id: string;
    nama_lokasi: string;
    deskripsi?: string;
    latitude: number;
    longitude: number;
    status: 'active' | 'archived';
    archived_at?: number;
    deleted_at?: string;
}

export default function FoLokasi() {
    const [t] = useTranslation();
    const { id } = useParams<{ id: string }>();
    const [lokasi, setLokasi] = useState<FoLokasi | null>(null);

    useEffect(() => {
        request('GET', endpoint(`/api/v1/fo-lokasis/${id}`))
            .then((res) => setLokasi(res.data.data))
            .catch(() => toast.error('error_refresh_page'));
    }, [id, t]);

    const pages = [
        { name: t('FO Lokasi')!, href: '/fo-lokasis' },
        { name: t('view_fo_lokasi')!, href: `/fo-lokasis/${id}` },
    ];

    return (
        <Default
            title={lokasi ? lokasi.nama_lokasi : t('FO Lokasi')!}
            breadcrumbs={pages}
        >
            <Container breadcrumbs={[]}>
                {!lokasi ? (
                    <Spinner />
                ) : (
                    <Outlet context={{ lokasi, setLokasi }} />
                )}
            </Container>
        </Default>
    );
}
