// client/src/pages/fo-lokasis/common/hooks/useFoLokasiActions.tsx
import React, { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { DropdownElement } from '$app/components/dropdown/DropdownElement';
import { Icon } from '$app/components/icons/Icon';
import {
    // MdEdit,
    MdArchive,
    MdRestore,
    // MdDelete
} from 'react-icons/md';
// import { route } from '$app/common/helpers/route';
// import { getEntityState } from '$app/common/helpers';
import { getEntityState } from '$app/common/helpers2';
import { EntityState } from '$app/common/enums/entity-state';
import { bulk } from '$app/common/queries/foLokasi';
import { toast } from '$app/common/helpers/toast/toast';

export const useFoLokasiActions = (): Array<(res: any) => ReactElement> => {
    const [t] = useTranslation();

    return [
        (res) => {
            // 2) Archive or Restore
            const state = getEntityState(res);
            // console.log(state);

            if (state === EntityState.Active) {
                return (
                    <DropdownElement
                        onClick={() =>
                            bulk([res.id], 'archive').then(() =>
                                toast.success(t('archived_lokasi')!)
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
                            bulk([res.id], 'restore').then(() =>
                                toast.success(t('restored_lokasi')!)
                            )
                        }
                        icon={<Icon element={MdRestore} />}
                    >
                        {t('restore')!}
                    </DropdownElement>
                );
            }

            // placeholder to satisfy type
            return <></>;
        },

        // (res) => {
        //     // 1) Edit action
        //     return (
        //         <DropdownElement
        //             to={route('/fo-lokasis/:id/edit', { id: res.id })}
        //             icon={<Icon element={MdEdit} />}
        //         >
        //             {t('edit')!}
        //         </DropdownElement>
        //     );
        // },

        // (res) => {
        //     // 3) Delete (soft-delete)
        //     const state = getEntityState(res);

        //     if (state !== EntityState.Deleted) {
        //         return (
        //             <DropdownElement
        //                 onClick={() =>
        //                     bulk([res.id], 'delete').then(() =>
        //                         toast.success(t('deleted_lokasi')!)
        //                     )
        //                 }
        //                 icon={<Icon element={MdDelete} />}
        //             >
        //                 {t('delete')!}
        //             </DropdownElement>
        //         );
        //     }

        //     // placeholder
        //     return <></>;
        // },
    ];
};
