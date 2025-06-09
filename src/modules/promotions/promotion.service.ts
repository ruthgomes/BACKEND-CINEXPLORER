import { prisma } from '../../lib/prisma'

export async function getPromotions() {
    return prisma.promotion.findMany({
        where: {
            isActive: true,
            validFrom: { lte: new Date() },
            validUntil: { gte: new Date() }
        },
        orderBy: {
            discount: 'desc'
        }
    });
}

export async function createPromotion(data: any) {
    // Validação das datas
    if (data.validFrom >= data.validUntil) {
        throw new Error('validFrom must be before validUntil');
    }

    // Validação do desconto
    if (data.discount <= 0 || data.discount > 100) {
        throw new Error('Discount must be between 1 and 100 percent');
    }

    // Verifica se o código já existe
    const existingCode = await prisma.promotion.findUnique({
        where: { code: data.code }
    });

    if (existingCode) {
        throw new Error('Promotion code already exists');
    }

    return prisma.promotion.create({ 
        data: {
            ...data,
            isActive: data.isActive !== undefined ? data.isActive : true
        }
    });
}

export async function updatePromotion(id: string, data: any) {
    // Validação das datas
    if (data.validFrom && data.validUntil && data.validFrom >= data.validUntil) {
        throw new Error('validFrom must be before validUntil');
    }

    // Validação do desconto
    if (data.discount && (data.discount <= 0 || data.discount > 100)) {
        throw new Error('Discount must be between 1 and 100 percent');
    }

    return prisma.promotion.update({
        where: { id },
        data
    });
}

export async function deletePromotion(id: string) {
    const promotion = await prisma.promotion.findUnique({
        where: { id }
    });

    if (!promotion) {
        throw new Error('Promotion not found');
    }

    return prisma.promotion.delete({
        where: { id }
    });
}

export async function applyPromotion(code: string, sessionId: string) {
    const promotion = await prisma.promotion.findFirst({
        where: {
            code,
            isActive: true,
            validFrom: { lte: new Date() },
            validUntil: { gte: new Date() }
        }
    });

    if (!promotion) {
        throw new Error('Invalid or expired promotion');
    }

    // Verifica se a promoção é aplicável ao filme
    if (promotion.applicableMovies && promotion.applicableMovies.length > 0) {
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            select: { movieId: true }
        });

        if (!session || !promotion.applicableMovies.includes(session.movieId)) {
            throw new Error('Promotion not applicable for this movie');
        }
    }

    // Verifica se a promoção é aplicável ao cinema
    if (promotion.applicableCinemas && promotion.applicableCinemas.length > 0) {
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            select: { cinemaId: true }
        });

        if (!session || !promotion.applicableCinemas.includes(session.cinemaId)) {
            throw new Error('Promotion not applicable for this cinema');
        }
    }

    return promotion;
}