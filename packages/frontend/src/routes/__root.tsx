import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { AuthProvider } from '@/contexts/auth-context';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import '@/styles/globals.css';

const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then((module) => ({
        default: module.ReactQueryDevtools,
      })),
    )
  : () => null;

const TanStackRouterDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/router-devtools').then((module) => ({
        default: module.TanStackRouterDevtools,
      })),
    )
  : () => null;

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        name: 'description',
        content:
          'A federated platform for sharing slides and connecting with others',
      },
      { property: 'og:title', content: 'Cosmoslide' },
      {
        property: 'og:description',
        content:
          'A federated platform for sharing slides and connecting with others',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:locale', content: 'en_US' },
      { property: 'og:site_name', content: 'Cosmoslide' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Cosmoslide' },
      {
        name: 'twitter:description',
        content:
          'A federated platform for sharing slides and connecting with others',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
      },
    ],
  }),
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement;if(window.matchMedia('(prefers-color-scheme:dark)').matches)d.classList.add('dark');window.matchMedia('(prefers-color-scheme:dark)').addEventListener('change',function(e){d.classList.toggle('dark',e.matches)})}catch(e){}})()`,
          }}
        />
      </head>
      <body className="font-sans">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <Outlet />
            </TooltipProvider>
            <Toaster />
          </AuthProvider>
          {import.meta.env.DEV && (
            <Suspense fallback={null}>
              <ReactQueryDevtools buttonPosition="bottom-left" />
              <TanStackRouterDevtools position="bottom-right" />
            </Suspense>
          )}
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}
