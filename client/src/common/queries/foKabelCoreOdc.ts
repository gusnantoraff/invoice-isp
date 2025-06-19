// client/src/common/queries/foKabelCoreOdc.ts

import { request } from '$app/common/helpers/request';
import { endpoint } from '../helpers';

type Action = 'archive' | 'delete' | 'restore';

/**
 * Bulk action for FO Kabel ODC resources.
 * @param ids array of Kabel ODC IDs
 * @param action one of 'archive', 'delete', or 'restore'
 */
export function bulk(ids: number[] | string[], action: Action) {
    return request('POST', endpoint('/api/v1/fo-kabel-core-odcs/bulk'), {
        ids,
        action,
    });
}
