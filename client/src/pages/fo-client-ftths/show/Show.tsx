import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Default } from '$app/components/layouts/Default';
import { Card, Element } from '$app/components/cards';
import { request } from '$app/common/helpers/request';

export default function Show() {
    const [t] = useTranslation();
    const { id } = useParams();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        request('GET', `/api/v1/fo-client-ftths/${id}`)
            .then((res) => setData(res.data.data))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div>{t('loading')}...</div>;
    if (!data) return <div>{t('not_found')}</div>;

    return (
        <Default title={t('client_ftth_details')} breadcrumbs={[{ name: t('Client FTTH'), href: '/fo-client-ftths' }, { name: t('details'), href: '' }] }>
            <Card title={t('client_ftth_details')}>
                <Element leftSide={t('nama_client')}>{data.nama_client}</Element>
                <Element leftSide={t('lokasi')}>{data.lokasi?.nama_lokasi}</Element>
                <Element leftSide={t('odp')}>{data.odp?.nama_odp}</Element>
                <Element leftSide={t('client')}>{data.client?.name}</Element>
                <Element leftSide={t('company')}>{data.company?.name}</Element>
                <Element leftSide={t('alamat')}>{data.alamat}</Element>
                <Element leftSide={t('status')}>{t(data.status)}</Element>
                <Element leftSide={t('created_at')}>{data.created_at}</Element>
                <Element leftSide={t('updated_at')}>{data.updated_at}</Element>
                <Element leftSide={t('deleted_at')}>{data.deleted_at || '-'}</Element>
            </Card>
        </Default>
    );
}
