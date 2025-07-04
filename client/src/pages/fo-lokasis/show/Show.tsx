/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { route } from '$app/common/helpers/route';
import { Navigate, useParams } from 'react-router-dom';

export default function Show() {
    const { id } = useParams();

    return <Navigate to={route('/fo-lokasis/:id/edit', { id })} />;
}
