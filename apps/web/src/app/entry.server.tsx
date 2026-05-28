import { PassThrough } from "node:stream";
import ReactDOMServer from "react-dom/server";
import { ServerRouter, type EntryContext } from "react-router";
import { isbot } from "isbot";

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext
) {
  // Detect Cloudflare / Web Worker runtime dynamically
  const isCloudflare =
    typeof globalThis.caches !== "undefined" ||
    typeof ReactDOMServer.renderToReadableStream !== "undefined";

  if (isCloudflare && typeof ReactDOMServer.renderToReadableStream === "function") {
    return handleBrowserRequest(
      request,
      responseStatusCode,
      responseHeaders,
      routerContext
    );
  } else {
    return handleNodeRequest(
      request,
      responseStatusCode,
      responseHeaders,
      routerContext
    );
  }
}

async function handleBrowserRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext
) {
  const renderStream = ReactDOMServer.renderToReadableStream;
  if (!renderStream) {
    throw new Error("renderToReadableStream is not supported in this environment");
  }

  const body = await renderStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      signal: request.signal,
      onError(error: unknown) {
        responseStatusCode = 500;
        console.error(error);
      },
    }
  );

  const userAgent = request.headers.get("user-agent");
  if (userAgent && isbot(userAgent)) {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}

function handleNodeRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const userAgent = request.headers.get("user-agent");
    const isBot = userAgent ? isbot(userAgent) : false;

    const renderStream = ReactDOMServer.renderToPipeableStream;
    if (!renderStream) {
      reject(new Error("renderToPipeableStream is not supported in this environment"));
      return;
    }

    const { pipe, abort } = renderStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        onShellReady() {
          shellRendered = true;
          const body = new PassThrough();
          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(body as any, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        },
      }
    );

    setTimeout(abort, 10000);
  });
}
