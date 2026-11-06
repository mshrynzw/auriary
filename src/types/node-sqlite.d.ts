declare module 'node:sqlite' {
  interface StatementSync {
    run(...params: Array<string | number | null>): unknown;
    get(...params: Array<string | number | null>): unknown;
    all(...params: Array<string | number | null>): unknown;
  }

  export class DatabaseSync {
    constructor(filename: string);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
