import React, { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { DropdownElement } from '$app/components/dropdown/DropdownElement';
import { Icon } from '$app/components/icons/Icon';
import { MdArchive, MdRestore } from 'react-icons/md';
import { getEntityState } from '$app/common/helpers2';
import { EntityState } from '$app/common/enums/entity-state';
import { bulk as bulkOdp } from '$app/common/queries/foOdp';
import { toast } from '$app/common/helpers/toast/toast';

export const useFoOdpActions = (): Array<(res: any) => ReactElement> => {
    const [t] = useTranslation();

    return [
        (res) => {
            const state = getEntityState(res);

            if (state === EntityState.Active) {
                return (
                    <DropdownElement
                        onClick={() =>
                            bulkOdp([res.id], 'archive').then(() =>
                                toast.success(t('archived_odp')!)
                            )
                        }
                        icon={<Icon element={MdArchive} />}
                    >
                        {t('archive')!}
                    </DropdownElement>
                );
            }

            if (
                state === EntityState.Archived ||
                state === EntityState.Deleted
            ) {
                return (
                    <DropdownElement
                        onClick={() =>
                            bulkOdp([res.id], 'restore').then(() =>
                                toast.success(t('restored_odp')!)
                            )
                        }
                        icon={<Icon element={MdRestore} />}
                    >
                        {t('restore')!}
                    </DropdownElement>
                );
            }

            return <></>;
        },
    ];
};
