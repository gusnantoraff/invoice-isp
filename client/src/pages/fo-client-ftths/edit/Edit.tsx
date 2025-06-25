import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ValidationBag } from '$app/common/interfaces/validation-bag';
import { Default } from '$app/components/layouts/Default';
import { CreateFoClientFtth, FoClientFtthFormValues } from '../common/components/CreateFoClientFtth';
import { Button } from '$app/components/forms';
import { request } from '$app/common/helpers/request';
import { Spinner } from '$app/components/Spinner';
import { Container } from '$app/components/Container';
import { endpoint } from '$app/common/helpers2';
import { route } from '$app/common/helpers/route';

export default function Edit() {
    const [t] = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
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
    const [loading, setLoading] = useState(true);
    const [isBusy, setIsBusy] = useState(false);
    // TODO: Fetch these from API
    const [lokasis, setLokasis] = useState<any[]>([]);
    const [odps, setOdps] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            request('GET', endpoint(`/api/v1/fo-client-ftths/${id}`)),
            request('GET', endpoint('/api/v1/fo-lokasis')),
            request('GET', endpoint('/api/v1/fo-odps')),
            request('GET', endpoint('/api/v1/clients?per_page=500&status=active')),
            request('GET', endpoint('/api/v1/companies')),
        ]).then(([ftthRes, lokasiRes, odpRes, clientRes, companyRes]) => {
            const ftth = ftthRes.data.data;
            setValues({
                lokasi_id: ftth.lokasi?.id?.toString() ?? '',
                odp_id: ftth.odp?.id?.toString() ?? '',
                client_id: ftth.client?.id?.toString() ?? '',
                company_id: ftth.company?.id?.toString() ?? '',
                nama_client: ftth.nama_client ?? '',
                alamat: ftth.alamat ?? '',
                status: ftth.status ?? 'active',
            });
            setLokasis(lokasiRes.data.data.map((l: any) => ({ id: l.id, nama_lokasi: l.nama_lokasi })));
            setOdps(odpRes.data.data.map((o: any) => ({ id: o.id, nama_odp: o.nama_odp })));
            setClients(clientRes.data.data.map((c: any) => ({ id: c.id, name: c.name })));
            setCompanies(companyRes.data.data.map((c: any) => ({ id: c.id, name: c.name })));
        }).catch(() => {
            navigate('/fo-client-ftths');
        }).finally(() => setLoading(false));
    }, [id, navigate]);

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsBusy(true);
        setErrors(undefined);
        try {
            await request('PUT', endpoint(`/api/v1/fo-client-ftths/${id}`), values);
            navigate(route('/fo-client-ftths'));
        } catch (err: any) {
            setErrors(err.response?.data || { errors: {} });
        } finally {
            setIsBusy(false);
        }
    };

    if (loading) return <Spinner />;

    return (
        <Default
            title={t('edit_client_ftth')}
            breadcrumbs={[
                { name: t('Client FTTH'), href: '/fo-client-ftths' },
                { name: t('edit_client_ftth'), href: '' }
            ]}
            disableSaveButton={isBusy}
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
                        isEdit
                    />
                </form>
                {isBusy && <Spinner />}
            </Container>
        </Default>
    );
}
