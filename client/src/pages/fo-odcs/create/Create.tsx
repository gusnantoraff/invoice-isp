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
import { CreateFoOdc, FoOdcFormValues } from '../common/components/CreateFoOdc';

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

    const [values, setValues] = useState<FoOdcFormValues>({
        create_new_lokasi: false,
        lokasi_id: '',
        lokasi_name: '',
        lokasi_deskripsi: '',
        lokasi_latitude: '',
        lokasi_longitude: '',
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

    const handleSave = (e: FormEvent) => {
        e.preventDefault();
        if (isBusy) return;
        setIsBusy(true);
        toast.processing();

        const postOdc = (lokasi_id: number) => {
            request('POST', endpoint('/api/v1/fo-odcs'), {
                lokasi_id,
                nama_odc: values.nama_odc,
                tipe_splitter: values.tipe_splitter,
            })
                .then((resp: GenericSingleResourceResponse<any>) => {
                    toast.success('created_odc');
                    navigate(
                        route('/fo-odcs/:id/edit', { id: resp.data.data.id }),
                        {
                            state: { toast: 'created_odc' },
                        }
                    );
                })
                .catch((err) => {
                    if (err.response?.status === 422) {
                        setErrors(err.response.data);
                        toast.dismiss();
                    } else {
                        toast.error('error_refresh_page');
                    }
                })
                .finally(() => setIsBusy(false));
        };

        if (values.create_new_lokasi) {
            request('POST', endpoint('/api/v1/fo-lokasis'), {
                nama_lokasi: values.lokasi_name,
                deskripsi: values.lokasi_deskripsi,
                latitude: parseFloat(values.lokasi_latitude),
                longitude: parseFloat(values.lokasi_longitude),
            })
                .then((res: GenericSingleResourceResponse<any>) =>
                    postOdc(res.data.data.id)
                )
                .catch((err) => {
                    if (err.response?.status === 422) {
                        setErrors(err.response.data);
                        toast.dismiss();
                    } else {
                        toast.error('error_refresh_page');
                    }
                });
        } else {
            postOdc(parseInt(values.lokasi_id, 10));
        }
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
                        values={values}
                        setValues={setValues}
                        lokasis={lokasis}
                        errors={errors}
                    />
                </form>
                {isBusy && <Spinner />}
            </Container>
        </Default>
    );
}
