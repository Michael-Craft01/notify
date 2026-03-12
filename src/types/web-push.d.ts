declare module 'web-push' {
    export interface VAPIDKeys {
        publicKey: string;
        privateKey: string;
    }

    export function generateVAPIDKeys(): VAPIDKeys;

    export function setVapidDetails(
        subject: string,
        publicKey: string,
        privateKey: string
    ): void;

    export function sendNotification(
        pushSubscription: any,
        payload?: string | Buffer,
        options?: any
    ): Promise<any>;
}
