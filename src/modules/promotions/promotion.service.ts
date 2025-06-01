import { prisma } from '../../lib/prisma'

export async function getPromotions() {
    return prisma.promotion.findMany({
        where: {
            isActive: true,
            validFrom: { lte: new Date() },
            validUntil: { gte: new Date() }
        }
    })
}

export async function createPromotion(data: any) {
    return prisma.promotion.create({ data })
}

export async function updatePromotion(id: string, data: any) {
    return prisma.promotion.update({
        where: { id },
        data
    })
}

export async function deletePromotion(id: string) {
    return prisma.promotion.delete({
        where: { id }
    })
}

export async function applyPromotion(code: string, sessionId: string) {
    const promotion = await prisma.promotion.findFirst({
        where: {
            code,
            isActive: true,
            validFrom: { lte: new Date() },
            validUntil: { gte: new Date() }
        }
    })

    if (!promotion) {
        throw new Error('Invalid or expired promotion')
    }

    if (promotion.applicableMovies && promotion.applicableMovies.length > 0) {
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            select: { movieId: true }
        })

        if (!session || !promotion.applicableMovies.includes(session.movieId)) {
            throw new Error('Promotion not applicable for this movie')
        }
    }

    return promotion
}