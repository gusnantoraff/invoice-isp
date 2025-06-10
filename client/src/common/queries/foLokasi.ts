// client/src/common/queries/foLokasi.ts
import { request } from '$app/common/helpers/request';
import { endpoint } from '../helpers';

export function bulk(ids: string[], action: 'archive' | 'delete' | 'restore') {
    //warp with endpoint() to using localhost:8000 instead :3000
    return request('POST', endpoint('/api/v1/fo-lokasis/bulk'), {
        ids,
        action,
    });
}
