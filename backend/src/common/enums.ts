/**
 * App-level enums. The DB stores these as strings (portable across SQLite and
 * Postgres); these values are the single source of truth and are validated at
 * the boundaries.
 */
export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum SourceType {
  UPLOAD = 'UPLOAD',
  YOUTUBE = 'YOUTUBE',
}
