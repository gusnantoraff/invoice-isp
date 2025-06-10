import { Route } from 'react-router-dom';
import { lazy } from 'react';
import { Guard } from '$app/common/guards/Guard';
import { permission } from '$app/common/guards/guards/permission';
import MapViewer from './mapping';

export const mappingRoutes = (
  <>
    <Route path="products">
   
    </Route>

    <Route
      path="mapping"
      element={
        <Guard
          guards={[permission('view_product')]} // Ubah permission sesuai kebijakan akses
          component={<MapViewer />}
        />
      }
    />
  </>
);