import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Element } from '$app/components/cards';
import { ValidationBag } from '$app/common/interfaces/validation-bag';
import { InputField, SelectField } from '$app/components/forms';

export interface FoClientFtthFormValues {
    lokasi_id: string;
    odp_id: string;
    client_id: string;
    company_id: string;
    nama_client: string;
    alamat: string;
    status: 'active' | 'archived';
}

interface Option { id: string | number; name: string; }
interface LokasiOption { id: string | number; nama_lokasi: string; }
interface OdpOption { id: string | number; nama_odp: string; }

interface Props {
    values: FoClientFtthFormValues;
    setValues: React.Dispatch<React.SetStateAction<FoClientFtthFormValues>>;
    errors?: ValidationBag;
    lokasis: LokasiOption[];
    odps: OdpOption[];
    clients: Option[];
    companies: Option[];
    isEdit?: boolean;
}

export function CreateFoClientFtth({ values, setValues, errors, lokasis, odps, clients, companies, isEdit }: Props) {
    const [t] = useTranslation();
    const onChange = <K extends keyof FoClientFtthFormValues>(field: K, value: FoClientFtthFormValues[K]) => setValues(v => ({ ...v, [field]: value }));

    return (
        <Card title={isEdit ? t('edit_client_ftth') : t('new_client_ftth')}>
            <Element leftSide={t('lokasi')} required>
                <SelectField
                    required
                    value={values.lokasi_id}
                    onValueChange={v => onChange('lokasi_id', v)}
                    errorMessage={errors?.errors.lokasi_id}
                >
                    <option value="">{t('select_lokasi')}</option>
                    {lokasis.map(l => (
                        <option key={l.id} value={l.id}>{l.nama_lokasi}</option>
                    ))}
                </SelectField>
            </Element>
            <Element leftSide={t('odp')} required>
                <SelectField
                    required
                    value={values.odp_id}
                    onValueChange={v => onChange('odp_id', v)}
                    errorMessage={errors?.errors.odp_id}
                >
                    <option value="">{t('select_odp')}</option>
                    {odps.map(o => (
                        <option key={o.id} value={o.id}>{o.nama_odp}</option>
                    ))}
                </SelectField>
            </Element>
            <Element leftSide={t('client')} required>
                <SelectField
                    required
                    value={values.client_id}
                    onValueChange={v => onChange('client_id', v)}
                    errorMessage={errors?.errors.client_id}
                >
                    <option value="">{t('select_client')}</option>
                    {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </SelectField>
            </Element>
            <Element leftSide={t('company')} required>
                <SelectField
                    required
                    value={values.company_id}
                    onValueChange={v => onChange('company_id', v)}
                    errorMessage={errors?.errors.company_id}
                >
                    <option value="">{t('select_company')}</option>
                    {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </SelectField>
            </Element>
            <Element leftSide={t('nama_client')}>
                <InputField
                    value={values.nama_client}
                    onValueChange={v => onChange('nama_client', v)}
                    errorMessage={errors?.errors.nama_client}
                />
            </Element>
            <Element leftSide={t('alamat')}>
                <InputField
                    value={values.alamat}
                    onValueChange={v => onChange('alamat', v)}
                    errorMessage={errors?.errors.alamat}
                />
            </Element>
        </Card>
    );
}
