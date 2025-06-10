// client/src/pages/fo-odcs/common/components/CreateFoOdc.tsx

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '$app/components/cards';
import { ValidationBag } from '$app/common/interfaces/validation-bag';
import { Element } from '$app/components/cards';
import { InputField, SelectField } from '$app/components/forms';

interface FoOdc {
    lokasi_id: number;
    nama_odc: string;
    tipe_splitter: string;
}

interface LokasiOption {
    id: number;
    nama_lokasi: string;
}

interface Props {
    odc: FoOdc;
    setOdc: React.Dispatch<React.SetStateAction<FoOdc>>;
    errors?: ValidationBag;
    lokasis: LokasiOption[];
}

export function CreateFoOdc(props: Props) {
    const [t] = useTranslation();
    const { odc, setOdc, errors, lokasis } = props;

    const handleChange = <K extends keyof FoOdc>(field: K, value: FoOdc[K]) => {
        setOdc((o) => ({ ...o, [field]: value }));
    };

    return (
        <Card title={t('new_odc')}>
            <Element leftSide={t('lokasi')} required>
                <SelectField
                    required
                    value={odc.lokasi_id || ''}
                    onValueChange={(value) =>
                        handleChange('lokasi_id', parseInt(value))
                    }
                    errorMessage={errors?.errors.lokasi_id}
                >
                    <option value="">{t('select_lokasi')}</option>
                    {lokasis.map((l) => (
                        <option key={l.id} value={l.id}>
                            {l.nama_lokasi}
                        </option>
                    ))}
                </SelectField>
            </Element>

            <Element leftSide={t('nama_odc')} required>
                <InputField
                    required
                    value={odc.nama_odc}
                    onValueChange={(v) => handleChange('nama_odc', v)}
                    errorMessage={errors?.errors.nama_odc}
                />
            </Element>

            <Element leftSide={t('tipe_splitter')} required>
                <SelectField
                    required
                    value={odc.tipe_splitter}
                    onValueChange={(v) => handleChange('tipe_splitter', v)}
                    errorMessage={errors?.errors.tipe_splitter}
                >
                    {['1:2', '1:4', '1:8', '1:16', '1:32', '1:64', '1:128'].map(
                        (opt) => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        )
                    )}
                </SelectField>
            </Element>
        </Card>
    );
}
