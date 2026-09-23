// Tipo ambiente para sql.js (sem @types oficial instalado)
declare module 'sql.js' {
  export class Database {
    constructor(data?: any);
    run(sql: string, params?: any[]): void;
    exec(sql: string, params?: any[]): { columns: string[]; values: any[][] }[];
    export(): Uint8Array;
    close(): void;
    [key: string]: any;
  }
  interface SqlJsStatic {
    Database: typeof Database;
    [key: string]: any;
  }
  export default function initSqlJs(config?: any): Promise<SqlJsStatic>;
}
