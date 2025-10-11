import * as Minio from 'minio';
export interface MinIOConfig {
    host: string;
    port: number;
    accessKey: string;
    secretKey: string;
    bucket?: string;
    useSSL?: boolean;
}
export interface MinIOTestResult {
    success: boolean;
    message: string;
    responseTime: number;
    bucketExists?: boolean;
    canCreateBucket?: boolean;
    canUpload?: boolean;
    canDownload?: boolean;
    error?: string;
}
export interface MinIOObject {
    name: string;
    size: number;
    lastModified: Date;
    etag: string;
}
export declare class MinIOService {
    private client;
    private config;
    initialize(config: MinIOConfig): Minio.Client;
    testConnection(config?: MinIOConfig): Promise<MinIOTestResult>;
    downloadFile(bucketName: string, objectName: string): Promise<Buffer>;
    objectExists(bucketName: string, objectName: string): Promise<boolean>;
    uploadFile(bucketName: string, objectName: string, data: Buffer | string, contentType?: string): Promise<void>;
    uploadFileStream(bucketName: string, objectName: string, stream: NodeJS.ReadableStream, size: number, contentType?: string): Promise<void>;
    deleteFile(bucketName: string, objectName: string): Promise<void>;
    listObjects(bucketName: string, prefix?: string): Promise<MinIOObject[]>;
    createBucket(bucketName: string, region?: string): Promise<void>;
    bucketExists(bucketName: string): Promise<boolean>;
    deleteBucket(bucketName: string): Promise<void>;
    getPresignedUploadUrl(bucketName: string, objectName: string, expiry?: number): Promise<string>;
    getPresignedDownloadUrl(bucketName: string, objectName: string, expiry?: number): Promise<string>;
    copyObject(sourceBucket: string, sourceObject: string, destBucket: string, destObject: string): Promise<void>;
    getConfig(): MinIOConfig | null;
    getClient(): Minio.Client | null;
}
export declare const minioService: MinIOService;
//# sourceMappingURL=minioService.d.ts.map