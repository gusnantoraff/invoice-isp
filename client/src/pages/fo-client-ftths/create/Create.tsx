import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ValidationBag } from '$app/common/interfaces/validation-bag';
import { Default } from '$app/components/layouts/Default';
import { Container } from '$app/components/Container';
import {
    CreateFoClientFtth,
    FoClientFtthFormValues,
} from '../common/components/CreateFoClientFtth';
import { request } from '$app/common/helpers/request';
import { endpoint } from '$app/common/helpers2';
import { Spinner } from '$app/components/Spinner';

export default function Create() {
    const [t] = useTranslation();
    const navigate = useNavigate();
    const [values, setValues] = useState<FoClientFtthFormValues>({
        lokasi_id: '',
        odp_id: '',
        client_id: '',
        company_id: '',
        nama_client: '',
        alamat: '',
        status: 'active',
    });
    const [errors, setErrors] = useState<ValidationBag | undefined>();
    const [loading, setLoading] = useState(false);
    const [optionsLoading, setOptionsLoading] = useState(true);
    const [lokasis, setLokasis] = useState<any[]>([]);
    const [odps, setOdps] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);

    useEffect(() => {
        setOptionsLoading(true);
        Promise.all([
            request('GET', endpoint('/api/v1/fo-lokasis')),
            request('GET', endpoint('/api/v1/fo-odps')),
            request(
                'GET',
                endpoint('/api/v1/clients?per_page=500&status=active')
            ),
            request('GET', endpoint('/api/v1/companies')),
        ])
            .then(([lokasiRes, odpRes, clientRes, companyRes]) => {
                setLokasis(
                    lokasiRes.data.data.map((l: any) => ({
                        id: l.id,
                        nama_lokasi: l.nama_lokasi,
                    }))
                );
                setOdps(
                    odpRes.data.data.map((o: any) => ({
                        id: o.id,
                        nama_odp: o.nama_odp,
                    }))
                );
                setClients(
                    clientRes.data.data.map((c: any) => ({
                        id: c.id,
                        name: c.name,
                    }))
                );
                setCompanies(
                    companyRes.data.data.map((c: any) => ({
                        id: c.id,
                        name: c.name,
                    }))
                );
                // If only one company, set as default
                if (companyRes.data.data.length === 1) {
                    setValues((v) => ({
                        ...v,
                        company_id: companyRes.data.data[0].id.toString(),
                    }));
                }
            })
            .finally(() => setOptionsLoading(false));
    }, []);

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        setErrors(undefined);
        try {
            await request('POST', endpoint('/api/v1/fo-client-ftths'), values);
            navigate('/fo-client-ftths');
        } catch (err: any) {
            setErrors(err.response?.data || { errors: {} });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Default
            title={t('new_client_ftth')}
            breadcrumbs={[
                { name: t('Client FTTH'), href: '/fo-client-ftths' },
                { name: t('new_client_ftth'), href: '' },
            ]}
            disableSaveButton={loading || optionsLoading}
            onSaveClick={handleSave}
        >
            <Container breadcrumbs={[]}>
                <form onSubmit={handleSave}>
                    <CreateFoClientFtth
                        values={values}
                        setValues={setValues}
                        errors={errors}
                        lokasis={lokasis}
                        odps={odps}
                        clients={clients}
                        companies={companies}
                        isEdit={false}
                    />
                </form>
                {(loading || optionsLoading) && <Spinner />}
            </Container>
        </Default>
    );
}
