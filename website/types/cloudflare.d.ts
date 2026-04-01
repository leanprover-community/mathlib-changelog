declare module "@cloudflare/next-on-pages" {
  interface RequestContext {
    env: {
      ASSETS: {
        fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
      };
      [key: string]: unknown;
    };
    ctx: ExecutionContext;
    cf: IncomingRequestCfProperties;
  }

  export function getRequestContext(): RequestContext;
}
