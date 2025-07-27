// Import the database schema type
import type { UserAttribute } from '../../backend/src/db/schema/user-attributes';

// Export the database schema type
export type { UserAttribute } from '../../backend/src/db/schema/user-attributes';

// Export all types from backend validation schema
export type {
  CreateUserAttribute,
  UpdateUserAttribute,
  BulkCreateUserAttributes,
  GetUserAttributesQuery,
  UserAttributeSource,
} from '../../backend/src/validation/user-attributes';

export interface UserAttributesSummary {
  summary: string | null;
}
