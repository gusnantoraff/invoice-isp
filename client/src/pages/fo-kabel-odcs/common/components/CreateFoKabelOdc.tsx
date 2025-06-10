// client/src/pages/fo-kabel-odcs/common/components/CreateFoKabelOdc.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Element } from '$app/components/cards';
import { ValidationBag } from '$app/common/interfaces/validation-bag';
import { InputField, SelectField } from '$app/components/forms';

interface FoKabelOdcCreate {
    odc_id: number;
    nama_kabel: string;
    tipe_kabel: 'singlecore' | 'multicore';
    panjang_kabel: number;
    jumlah_tube: number;
    jumlah_core_in_tube: number;
    // jumlah_total_core: number;
}

interface OdcOption {
    id: number;
    nama_odc: string;
}

interface Props {
    form: FoKabelOdcCreate;
    setForm: React.Dispatch<React.SetStateAction<FoKabelOdcCreate>>;
    errors?: ValidationBag;
    odcs: OdcOption[];
}

export function CreateFoKabelOdc(props: Props) {
    const [t] = useTranslation();
    const { form, setForm, errors, odcs } = props;

    const change = <K extends keyof FoKabelOdcCreate>(
        field: K,
        value: FoKabelOdcCreate[K]
    ) => {
        setForm((f) => ({ ...f, [field]: value }));
    };

    return (
        <Card title={t('new_kabel_odc')}>
            <Element leftSide={t('nama_odc')} required>
                <SelectField
                    required
                    value={form.odc_id || ''}
                    onValueChange={(v) => change('odc_id', parseInt(v))}
                    errorMessage={errors?.errors.odc_id}
                >
                    <option value="">{t('select_odc')}</option>
                    {odcs.map((o) => (
                        <option key={o.id} value={o.id}>
                            {o.nama_odc}
                        </option>
                    ))}
                </SelectField>
            </Element>

            <Element leftSide={t('nama_kabel')} required>
                <InputField
                    required
                    value={form.nama_kabel}
                    onValueChange={(v) => change('nama_kabel', v)}
                    errorMessage={errors?.errors.nama_kabel}
                />
            </Element>

            <Element leftSide={t('tipe_kabel')} required>
                <SelectField
                    required
                    value={form.tipe_kabel}
                    onValueChange={(v) => change('tipe_kabel', v as any)}
                    errorMessage={errors?.errors.tipe_kabel}
                >
                    <option value="singlecore">singlecore</option>
                    <option value="multicore">multicore</option>
                </SelectField>
            </Element>

            <Element leftSide={t('panjang_kabel')} required>
                <InputField
                    type="number"
                    required
                    value={form.panjang_kabel.toString()}
                    onValueChange={(v) =>
                        change('panjang_kabel', parseFloat(v))
                    }
                    errorMessage={errors?.errors.panjang_kabel}
                />
            </Element>

            <Element leftSide={t('jumlah_tube')} required>
                <InputField
                    type="number"
                    required
                    value={form.jumlah_tube.toString()}
                    onValueChange={(v) => change('jumlah_tube', parseInt(v))}
                    errorMessage={errors?.errors.jumlah_tube}
                />
            </Element>

            <Element leftSide={t('jumlah_core_in_tube')} required>
                <InputField
                    type="number"
                    required
                    value={form.jumlah_core_in_tube.toString()}
                    onValueChange={(v) =>
                        change('jumlah_core_in_tube', parseInt(v))
                    }
                    errorMessage={errors?.errors.jumlah_core_in_tube}
                />
            </Element>

            {/* <Element leftSide={t('jumlah_total_core')} required>
                <InputField
                    type="number"
                    required
                    value={form.jumlah_total_core.toString()}
                    onValueChange={(v) =>
                        change('jumlah_total_core', parseInt(v))
                    }
                    errorMessage={errors?.errors.jumlah_total_core}
                />
            </Element> */}
        </Card>
    );
}
