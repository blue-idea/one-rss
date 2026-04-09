declare const Deno: {
  serve(handler: (req: Request) => Response | Promise<Response>): void;
  env: {
    get(key: string): string | undefined;
  };
};

declare module "https://esm.sh/*";
declare module "jsr:*";
declare module "npm:*";
