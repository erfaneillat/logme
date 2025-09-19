declare module 'kavenegar' {
    interface KavenegarApiOptions {
        apikey: string;
    }

    interface VerifyLookupParams {
        receptor: string;
        token: string;
        template: string;
    }

    interface KavenegarApi {
        VerifyLookup(
            params: VerifyLookupParams,
            callback: (response: any, status: number) => void
        ): void;
    }

    export function KavenegarApi(options: KavenegarApiOptions): KavenegarApi;
}
