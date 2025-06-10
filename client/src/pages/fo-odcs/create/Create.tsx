// client/src/pages/fo-odcs/create/Create.tsx

import React, { FormEvent, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTitle } from '$app/common/hooks/useTitle';
import { Default } from '$app/components/layouts/Default';
import { Container } from '$app/components/Container';
import { Spinner } from '$app/components/Spinner';
import { toast } from '$app/common/helpers/toast/toast';
import { endpoint } from '$app/common/helpers';
import { request } from '$app/common/helpers/request';
import { route } from '$app/common/helpers/route';
import { useNavigate } from 'react-router-dom';
import { ValidationBag } from '$app/common/interfaces/validation-bag';
import { GenericSingleResourceResponse } from '$app/common/interfaces/generic-api-response';
import { CreateFoOdc } from '../common/components/CreateFoOdc';

interface FoOdc {
    lokasi_id: number;
    nama_odc: string;
    tipe_splitter: string;
}

interface LokasiOption {
    id: number;
    nama_lokasi: string;
}

export default function Create() {
    useTitle('New FO ODC');
    const [t] = useTranslation();
    const navigate = useNavigate();

    const pages = [
        { name: t('FO ODC')!, href: '/fo-odcs' },
        { name: t('New FO ODC')!, href: '/fo-odcs/create' },
    ];

    const [odc, setOdc] = useState<FoOdc>({
        lokasi_id: 0,
        nama_odc: '',
        tipe_splitter: '1:8',
    });
    const [lokasis, setLokasis] = useState<LokasiOption[]>([]);
    const [errors, setErrors] = useState<ValidationBag>();
    const [isBusy, setIsBusy] = useState(false);

    useEffect(() => {
        request('GET', endpoint('/api/v1/fo-lokasis')).then((res) => {
            setLokasis(
                res.data.data.map((l: any) => ({
                    id: l.id,
                    nama_lokasi: l.nama_lokasi,
                }))
            );
        });
    }, []);

    const handleSave = (event: FormEvent) => {
        event.preventDefault();
        if (isBusy) return;

        setIsBusy(true);
        request('POST', endpoint('/api/v1/fo-odcs'), odc)
            .then((response: GenericSingleResourceResponse<any>) => {
                toast.success('created_odc');
                navigate(
                    route('/fo-odcs/:id/edit', { id: response.data.data.id }),
                    { state: { toast: 'created_odc' } }
                );
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

    return (
        <Default
            title={t('New FO ODC')}
            breadcrumbs={pages}
            disableSaveButton={isBusy}
            onSaveClick={handleSave}
        >
            <Container breadcrumbs={[]}>
                <form onSubmit={handleSave}>
                    <CreateFoOdc
                        odc={odc}
                        setOdc={setOdc}
                        errors={errors}
                        lokasis={lokasis}
                    />
                </form>
                {isBusy && <Spinner />}
            </Container>
        </Default>
    );
}
