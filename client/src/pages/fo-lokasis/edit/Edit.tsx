// client/src/pages/fo-lokasis/edit/Edit.tsx

import React, { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTitle } from '$app/common/hooks/useTitle';
import { Default } from '$app/components/layouts/Default';
import { Container } from '$app/components/Container';
import { Spinner } from '$app/components/Spinner';
import { toast } from '$app/common/helpers/toast/toast';
import { request } from '$app/common/helpers/request';
import { endpoint } from '$app/common/helpers2';
import { useNavigate, useParams } from 'react-router-dom';
import { ValidationBag } from '$app/common/interfaces/validation-bag';
import { GenericSingleResourceResponse } from '$app/common/interfaces/generic-api-response';
import { CreateFoLokasi } from '../common/components/CreateFoLokasi';

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

export default function Edit() {
    const [t] = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    useTitle('edit_fo_lokasi');

    const [lokasi, setLokasi] = useState<FoLokasi | null>(null);
    const [errors, setErrors] = useState<ValidationBag>();
    const [isBusy, setIsBusy] = useState(false);

    // 1) Fetch existing record once
    useEffect(() => {
        request('GET', endpoint(`/api/v1/fo-lokasis/${id}`))
            .then((res: GenericSingleResourceResponse<FoLokasi>) =>
                setLokasi(res.data.data)
            )
            .catch(() => {
                toast.error('error_refresh_page');
                navigate('/fo-lokasis');
            });
    }, [id, navigate, t]);

    // 2) Save as PUT
    const handleSave = (event: FormEvent) => {
        event.preventDefault();
        if (!lokasi || isBusy) return;

        setIsBusy(true);
        toast.processing();

        request('PUT', endpoint(`/api/v1/fo-lokasis/${id}`), lokasi)
            .then(() => {
                toast.success('updated_fo_lokasi');
            })
            .catch((error) => {
                if (error.response?.status === 422) {
                    setErrors(error.response.data);
                    toast.dismiss();
                } else {
                    toast.error('error_refresh_page');
                }
            })
            .finally(() => setIsBusy(false));
    };

    // 3) Show spinner while loading
    if (!lokasi) {
        return <Spinner />;
    }

    const pages = [
        { name: t('FO Lokasi')!, href: '/fo-lokasis' },
        { name: t('edit_fo_lokasi')!, href: `/fo-lokasis/${id}/edit` },
    ];

    return (
        <Default
            title={t('edit_fo_lokasi')!}
            breadcrumbs={pages}
            disableSaveButton={isBusy}
            onSaveClick={handleSave}
        >
            <Container breadcrumbs={[]}>
                <form onSubmit={handleSave}>
                    <CreateFoLokasi
                        foLokasi={lokasi}
                        setFoLokasi={setLokasi as any}
                        errors={errors}
                        setErrors={setErrors}
                    />
                </form>
                {isBusy && <Spinner />}
            </Container>
        </Default>
    );
}
