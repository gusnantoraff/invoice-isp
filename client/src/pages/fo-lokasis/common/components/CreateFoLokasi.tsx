// client/src/pages/fo-lokasis/common/components/CreateFoLokasi.tsx

import React, { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '$app/components/cards';
import { ValidationBag } from '$app/common/interfaces/validation-bag';
import { Element } from '$app/components/cards';
import { InputField } from '$app/components/forms';

interface FoLokasi {
    nama_lokasi: string;
    deskripsi?: string;
    latitude: number;
    longitude: number;
}

interface Props {
    foLokasi: FoLokasi;
    errors?: ValidationBag;
    setFoLokasi: Dispatch<SetStateAction<FoLokasi>>;
    setErrors: Dispatch<SetStateAction<ValidationBag | undefined>>;
}

export function CreateFoLokasi(props: Props) {
    const [t] = useTranslation();
    const { foLokasi, setFoLokasi, errors, setErrors } = props;

    const handleChange = <K extends keyof FoLokasi>(
        field: K,
        value: FoLokasi[K]
    ) => {
        setErrors(undefined);
        setFoLokasi((f) => ({ ...f, [field]: value }));
    };

    return (
        <Card title={t('new_lokasi')}>
            <Element leftSide={t('nama_lokasi')} required>
                <InputField
                    required
                    value={foLokasi.nama_lokasi}
                    onValueChange={(value) =>
                        handleChange('nama_lokasi', value)
                    }
                    errorMessage={errors?.errors.nama_lokasi}
                />
            </Element>

            <Element leftSide={t('deskripsi')}>
                <InputField
                    element="textarea"
                    value={foLokasi.deskripsi || ''}
                    onValueChange={(value: string) =>
                        handleChange('deskripsi', value)
                    }
                    errorMessage={errors?.errors.deskripsi}
                />
            </Element>

            <Element leftSide={t('latitude')} required>
                <InputField
                    required
                    type="number"
                    value={foLokasi.latitude}
                    onValueChange={(value) =>
                        handleChange('latitude', parseFloat(value))
                    }
                    errorMessage={errors?.errors.latitude}
                />
            </Element>

            <Element leftSide={t('longitude')} required>
                <InputField
                    required
                    type="number"
                    value={foLokasi.longitude}
                    onValueChange={(value) =>
                        handleChange('longitude', parseFloat(value))
                    }
                    errorMessage={errors?.errors.longitude}
                />
            </Element>
        </Card>
    );
}
