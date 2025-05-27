import { Route } from 'react-router-dom';
import { lazy } from 'react';
import { Guard } from '$app/common/guards/Guard';
import { permission } from '$app/common/guards/guards/permission';

const WAGateway = lazy(() => import('$app/pages/wa-gateway/WaGateway'));
const WAChat = lazy(() => import('$app/pages/wa-gateway/chat/WaChat'));
const WAChatbot = lazy(() => import('$app/pages/wa-gateway/chatbot/WaChatbot'));

export const waGatewayRoutes = (
  <Route path="/wa-gateway">
    <Route
      index
      element={
        <Guard guards={[permission('view_wa_gateway')]} component={<WAGateway />} />
      }
    />
    <Route
      path="chat/:deviceId"
      element={
        <Guard guards={[permission('view_wa_gateway')]} component={<WAChat />} />
      }
    />
    <Route
      path="chatbot/:deviceId"
      element={
        <Guard guards={[permission('view_wa_gateway')]} component={<WAChatbot />} />
      }
    />
  </Route>
);
