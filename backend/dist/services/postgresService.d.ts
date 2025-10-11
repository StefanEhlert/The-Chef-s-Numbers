export interface PostgresConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
}
export interface ConnectionTestResult {
    success: boolean;
    message: string;
    details?: any;
}
export interface DatabaseCheckResult {
    exists: boolean;
    message: string;
}
export interface DatabaseCreationResult {
    success: boolean;
    message: string;
}
export interface StructureCheckResult {
    hasStructure: boolean;
    tables: string[];
    message: string;
}
export interface StructureCreationResult {
    success: boolean;
    message: string;
    tablesCreated: string[];
}
export interface DataSyncResult {
    success: boolean;
    message: string;
    syncedTables: string[];
    recordsSynced: number;
}
export interface SchemaUpdateResult {
    success: boolean;
    message: string;
    columnsAdded: string[];
}
declare class PostgresService {
    private pool;
    testConnection(config: PostgresConfig): Promise<ConnectionTestResult>;
    checkDatabaseExists(config: PostgresConfig): Promise<DatabaseCheckResult>;
    createDatabase(config: PostgresConfig): Promise<DatabaseCreationResult>;
    checkStructure(config: PostgresConfig): Promise<StructureCheckResult>;
    createStructure(config: PostgresConfig): Promise<StructureCreationResult>;
    updateSchema(config: PostgresConfig): Promise<SchemaUpdateResult>;
    syncData(config: PostgresConfig, data: any): Promise<DataSyncResult>;
    private validateConfig;
    close(): Promise<void>;
    checkAndUpdateSchema(config: PostgresConfig): Promise<{
        success: boolean;
        message: string;
        changes: string[];
    }>;
    private createTable;
}
export declare const postgresService: PostgresService;
export { PostgresService };
//# sourceMappingURL=postgresService.d.ts.map