import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" style={{ height: "100%" }}>
      <head>
        <title>OmniChat — Universal AI Workspace</title>
        <meta
          name="description"
          content="Premium AI workspace with universal model access. BYOK."
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Newsreader:ital,opsz,wght@1,6..72,300;1,6..72,400&display=swap"
          rel="stylesheet"
        />
        <style>{`html, body, #__next { height: 100%; margin: 0; padding: 0; overflow: hidden; }`}</style>
      </head>
      <body style={{ height: "100%" }}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}
