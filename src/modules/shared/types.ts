import { User } from "../../../generated/prisma";

export type AuthUser = Pick<User, 'id' | 'email' | 'role'>

export interface ApiResponse<T> {
    success: boolean
    data?: T
    error?: {
        message: string
        code?: string
        detail?: any
    }
}

export interface PaginatedResult<T> {
    data: T[]
    total: number
    page: number
    pageSize: number
}