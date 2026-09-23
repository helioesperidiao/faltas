import { MongoClient, Db, MongoClientOptions } from "mongodb";
export declare class MongoDatabase {
    private static _client;
    private static _db;
    private _uri;
    private _databaseName;
    private _options;
    constructor(config?: {
        uri?: string;
        database?: string;
        options?: MongoClientOptions;
    });
    connect(): Promise<MongoClient>;
    getClient(): Promise<MongoClient>;
    getDb(): Promise<Db>;
    close(): Promise<void>;
}
//# sourceMappingURL=MongoDatabase.d.ts.map