import { db, users, User, NewUser } from '../db'
import { eq } from 'drizzle-orm'
import { AuthService } from './auth'

export class UserService {
  static async createUser(email: string, password: string): Promise<User> {
    const passwordHash = await AuthService.hashPassword(password)
    
    const [user] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
      })
      .returning()

    return user
  }

  static async findUserByEmail(email: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    return user || null
  }

  static async findUserById(id: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    return user || null
  }

  static async verifyUser(email: string, password: string): Promise<User | null> {
    const user = await this.findUserByEmail(email)
    if (!user) {
      return null
    }

    const isValid = await AuthService.comparePassword(password, user.passwordHash)
    return isValid ? user : null
  }
}
