import { Route } from 'react-router-dom';
import { lazy } from 'react';

const FoLokasi = lazy(() => import('$app/pages/fo-lokasis/FoLokasi'));
const Import = lazy(() => import('$app/pages/fo-lokasis/import/Import'));
const FoLokasis = lazy(() => import('$app/pages/fo-lokasis/index/FoLokasis'));
const Create = lazy(() => import('$app/pages/fo-lokasis/create/Create'));
const Edit = lazy(() => import('$app/pages/fo-lokasis/edit/Edit'));
const Show = lazy(() => import('$app/pages/fo-lokasis/show/Show'));
const Documents = lazy(
    () => import('$app/pages/fo-lokasis/documents/Documents')
);
const FoLokasiFields = lazy(
    () => import('$app/pages/fo-lokasis/edit/ProductFields')
);

export const foLokasiRoutes = (
    <Route path="fo-lokasis">
        <Route path="" element={<FoLokasis />} />
        <Route path="import" element={<Import />} />
        <Route path="create" element={<Create />} />
        <Route path=":id" element={<FoLokasi />}>
            <Route path="" element={<Show />} />
            <Route path="documents" element={<Documents />} />
        </Route>
        <Route path=":id" element={<FoLokasi />}>
            <Route path="product_fields" element={<FoLokasiFields />} />
        </Route>
        {/* <Route path=":id/edit" element={<FoLokasi />}>
            <Route path="" element={<Edit />} />
        </Route> */}
        <Route path=":id/edit" element={<Edit />} />
    </Route>
);
