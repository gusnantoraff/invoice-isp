// client/src/pages/fo-odcs/edit/Edit.tsx

import React, { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTitle } from '$app/common/hooks/useTitle';
import { Default } from '$app/components/layouts/Default';
import { Container } from '$app/components/Container';
import { Spinner } from '$app/components/Spinner';
import { toast } from '$app/common/helpers/toast/toast';
import { request } from '$app/common/helpers/request';
import { endpoint } from '$app/common/helpers';
// import { route } from '$app/common/helpers/route';
import { useNavigate, useParams } from 'react-router-dom';
import { ValidationBag } from '$app/common/interfaces/validation-bag';
// import { GenericSingleResourceResponse } from '$app/common/interfaces/generic-api-response';
import { CreateFoOdc } from '../common/components/CreateFoOdc';

interface FoOdc {
    id: number;
    lokasi_id: number;
    nama_odc: string;
    tipe_splitter: string;
    status: 'active' | 'archived';
    deleted_at?: string | null;
}

interface LokasiOption {
    id: number;
    nama_lokasi: string;
}

export default function Edit() {
    const [t] = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    useTitle('edit_odc');

    const [odc, setOdc] = useState<FoOdc | null>(null);
    const [lokasis, setLokasis] = useState<LokasiOption[]>([]);
    const [errors, setErrors] = useState<ValidationBag>();
    const [isBusy, setIsBusy] = useState(false);

    // Fetch ODC and Lokasi options
    useEffect(() => {
        Promise.all([
            request('GET', endpoint(`/api/v1/fo-odcs/${id}`)),
            request('GET', endpoint('/api/v1/fo-lokasis')),
        ])
            .then(([odcRes, lokRes]: any) => {
                setOdc(odcRes.data.data);
                setLokasis(
                    lokRes.data.data.map((l: any) => ({
                        id: l.id,
                        nama_lokasi: l.nama_lokasi,
                    }))
                );
            })
            .catch(() => {
                toast.error('error_refresh_page');
                navigate('/fo-odcs');
            });
    }, [id, navigate]);

    if (!odc) {
        return <Spinner />;
    }

    const handleSave = (event: FormEvent) => {
        event.preventDefault();
        if (isBusy) return;

        setIsBusy(true);
        toast.processing();

        request('PUT', endpoint(`/api/v1/fo-odcs/${id}`), odc)
            .then(() => {
                toast.success('updated_odc');
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

    const pages = [
        { name: t('FO ODC')!, href: '/fo-odcs' },
        { name: t('edit_odc')!, href: `/fo-odcs/${id}/edit` },
    ];

    return (
        <Default
            title={t('edit_odc')!}
            breadcrumbs={pages}
            disableSaveButton={isBusy}
            onSaveClick={handleSave}
        >
            <Container breadcrumbs={[]}>
                <form onSubmit={handleSave}>
                    <CreateFoOdc
                        odc={odc}
                        setOdc={setOdc!}
                        errors={errors}
                        lokasis={lokasis}
                    />
                </form>
                {isBusy && <Spinner />}
            </Container>
        </Default>
    );
}
