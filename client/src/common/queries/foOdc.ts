// client/src/common/queries/foOdc.ts
import { request } from '$app/common/helpers/request';
import { endpoint } from '../helpers';

type Action = 'archive' | 'delete' | 'restore';

/**
 * Bulk action for FO ODC resources.
 * @param ids array of ODC IDs
 * @param action one of 'archive', 'delete', or 'restore'
 */
export function bulk(ids: number[] | string[], action: Action) {
    return request('POST', endpoint('/api/v1/fo-odcs/bulk'), {
        ids,
        action,
    });
}
