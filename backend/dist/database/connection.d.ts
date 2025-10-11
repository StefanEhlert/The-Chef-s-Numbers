import { Pool } from 'pg';
declare function getPool(): Pool;
export declare function testConnection(): Promise<boolean>;
export declare function initializeDatabase(): Promise<void>;
export { getPool };
export declare function closeDatabase(): Promise<void>;
//# sourceMappingURL=connection.d.ts.map