declare module "@/ziggy" {
    import { ZiggyConfig } from "ziggy-js";

    const Ziggy: ZiggyConfig;
    export { Ziggy };
}

declare module "ziggy-js" {
    export interface ZiggyConfig {
        url: string;
        port: number | null;
        defaults: Record<string, unknown>;
        routes: Record<
            string,
            {
                uri: string;
                methods: string[];
                wheres?: Record<string, string>;
                parameters?: string[];
                bindings?: Record<string, string>;
            }
        >;
    }

    export interface Route {
        (
            name: string,
            params?: Record<string, unknown>,
            absolute?: boolean,
            config?: ZiggyConfig,
        ): string;
    }

    const route: Route;
    export { route };
}
