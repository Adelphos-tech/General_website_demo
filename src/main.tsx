import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './NewUIApp';
import './styles.css';
import './untitled/index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import RealEstateApp from './site/RealEstateApp';

const router = createBrowserRouter([
  { path: '/', element: <RealEstateApp /> },
  { path: '/assistant', element: <App /> },
  { path: '/real-estate', element: <RealEstateApp /> },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
