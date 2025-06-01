import { prisma } from '../../lib/prisma';
import { MovieStatus } from './movie.schema';

export async function getMovies(status?: MovieStatus) {
    const now = new Date();

    if (status === 'current') {
        return prisma.movie.findMany({
            where: {
                isComingSoon: false,
                releaseDate: { lte: now }
            }
        })
    }

    if (status === 'coming-soon') {
        return prisma.movie.findMany({
            where: {
                isComingSoon: true,
                releaseDate: { gt: now }
            }
        })
    }

    return prisma.movie.findMany()
}

export async function getMovieById(id: string) {
    return prisma.movie.findUnique({
        where: { id },
        include: {
            sessions: {
                include: {
                    cinema: true,
                    room: true
                }
            }
        }
    })
}

export async function getSimilarMovies(movieId: string) {
    const movie = await prisma.movie.findUnique({
        where: { id: movieId }
    })

    if (!movie) {
        return []
    }

    return prisma.movie.findMany({
        where: {
            id: { not: movieId },
            genres: { hasSome: movie.genres }
        },
        take: 4
    })
}

export async function getMovieSessions(movieId: string, date?: string) {
    const where: any = { movieId }

    if (date) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        where.date = {
            gte: startDate,
            lte: endDate
        }
    }

    return prisma.session.findMany({
        where,
        include: {
            cinema: true,
            room: true
        }
    })
}