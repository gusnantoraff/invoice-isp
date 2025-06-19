// client/src/pages/fo-odps/common/components/CreateFoOdp.tsx

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Element } from '$app/components/cards';
import { ValidationBag } from '$app/common/interfaces/validation-bag';
import { InputField, SelectField, Checkbox } from '$app/components/forms';

export interface FoOdpFormValues {
    create_new_lokasi: boolean;
    lokasi_id: string;
    lokasi_name: string;
    lokasi_deskripsi: string;
    lokasi_latitude: string;
    lokasi_longitude: string;
    kabel_core_odc_id: string;
    nama_odp: string;
}

interface LokasiOption {
    id: number;
    nama_lokasi: string;
}

interface CoreOption {
    id: number;
    warna_tube?: string;
    warna_core: string;
}

interface Props {
    values: FoOdpFormValues;
    setValues: React.Dispatch<React.SetStateAction<FoOdpFormValues>>;
    lokasis: LokasiOption[];
    cores: CoreOption[];
    errors?: ValidationBag;
}

export function CreateFoOdp({
    values,
    setValues,
    lokasis,
    cores,
    errors,
}: Props) {
    const [t] = useTranslation();
    const onChange = <K extends keyof FoOdpFormValues>(
        field: K,
        value: FoOdpFormValues[K]
    ) => setValues((v) => ({ ...v, [field]: value }));

    return (
        <Card
            title={t(
                values.create_new_lokasi ? 'new_lokasi_and_odp' : 'new_odp'
            )}
        >
            {/* Toggle for creating new Lokasi */}
            <Element leftSide={t('create_new_lokasi')}>
                <Checkbox
                    checked={values.create_new_lokasi}
                    onChange={(e: { target: { checked: boolean } }) =>
                        onChange('create_new_lokasi', e.target.checked)
                    }
                />
            </Element>

            {/* Lokasi selection or creation */}
            {values.create_new_lokasi ? (
                <>
                    {' '}
                    {/* New Lokasi fields */}
                    <Element leftSide={t('nama_lokasi')} required>
                        <InputField
                            required
                            value={values.lokasi_name}
                            onValueChange={(v) => onChange('lokasi_name', v)}
                            errorMessage={errors?.errors.nama_lokasi}
                        />
                    </Element>
                    <Element leftSide={t('deskripsi')}>
                        <InputField
                            element="textarea"
                            value={values.lokasi_deskripsi}
                            onValueChange={(v) =>
                                onChange('lokasi_deskripsi', v)
                            }
                            errorMessage={errors?.errors.deskripsi}
                        />
                    </Element>
                    <Element leftSide={t('latitude')} required>
                        <InputField
                            required
                            type="number"
                            value={values.lokasi_latitude}
                            onValueChange={(v) =>
                                onChange('lokasi_latitude', v)
                            }
                            errorMessage={errors?.errors.latitude}
                        />
                    </Element>
                    <Element leftSide={t('longitude')} required>
                        <InputField
                            required
                            type="number"
                            value={values.lokasi_longitude}
                            onValueChange={(v) =>
                                onChange('lokasi_longitude', v)
                            }
                            errorMessage={errors?.errors.longitude}
                        />
                    </Element>
                </>
            ) : (
                <Element leftSide={t('lokasi')} required>
                    <SelectField
                        required
                        value={values.lokasi_id}
                        onValueChange={(v) => onChange('lokasi_id', v)}
                        errorMessage={errors?.errors.lokasi_id}
                    >
                        <option value="">{t('select_lokasi')}</option>
                        {lokasis.map((l) => (
                            <option key={l.id} value={l.id.toString()}>
                                {l.nama_lokasi}
                            </option>
                        ))}
                    </SelectField>
                </Element>
            )}

            {/* Core ODC selection always visible */}
            <Element leftSide={t('core_odc')} required>
                <SelectField
                    required
                    value={values.kabel_core_odc_id}
                    onValueChange={(v) => onChange('kabel_core_odc_id', v)}
                    errorMessage={errors?.errors.kabel_core_odc_id}
                >
                    <option value="">{t('select_core')}</option>
                    {cores.map((c) => (
                        <option key={c.id} value={c.id.toString()}>
                            {c.warna_tube
                                ? `${c.warna_tube} / ${c.warna_core}`
                                : c.warna_core}
                        </option>
                    ))}
                </SelectField>
            </Element>

            {/* Nama ODP */}
            <Element leftSide={t('nama_odp')} required>
                <InputField
                    required
                    value={values.nama_odp}
                    onValueChange={(v) => onChange('nama_odp', v)}
                    errorMessage={errors?.errors.nama_odp}
                />
            </Element>
        </Card>
    );
}
