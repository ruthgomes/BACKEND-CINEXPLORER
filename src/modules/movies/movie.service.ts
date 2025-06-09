import { prisma } from '../../lib/prisma';
import { MovieStatus } from './movie.schema';

export async function getMovies(status?: MovieStatus, page: number = 1, limit: number = 10) {
    const now = new Date();
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status === 'current') {
        where.isComingSoon = false;
        where.releaseDate = { lte: now };
    } else if (status === 'coming-soon') {
        where.isComingSoon = true;
        where.releaseDate = { gt: now };
    }

    return prisma.movie.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
            releaseDate: 'desc'
        }
    });
}

export async function getMovieById(id: string) {
    return prisma.movie.findUnique({
        where: { id },
        include: {
            sessions: {
                include: {
                    cinema: {
                        select: {
                            id: true,
                            name: true,
                            address: true
                        }
                    },
                    room: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
                where: {
                    date: { gte: new Date() }
                },
                orderBy: {
                    date: 'asc'
                }
            }
        }
    });
}

export async function getSimilarMovies(movieId: string, limit: number = 4) {
    const movie = await prisma.movie.findUnique({
        where: { id: movieId },
        select: { genres: true }
    });

    if (!movie) {
        return []
    }

    return prisma.movie.findMany({
        where: {
            id: { not: movieId },
            genres: { hasSome: movie.genres },
            isComingSoon: false,
            releaseDate: { lte: new Date() }
        },
        take: limit,
        orderBy: {
            rating: 'desc'
        }
    });
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
        };
    } else {
        where.date = { gte: new Date() };
    }

    return prisma.session.findMany({
        where,
        include: {
            cinema: {
                select: {
                    id: true,
                    name: true,
                    address: true
                }
            },
            room: {
                select: {
                    id: true,
                    name: true,
                    rows: true,
                    seatsPerRow: true
                }
            }
        },
        orderBy: [
            { date: 'asc' },
            { time: 'asc' }
        ]
    });
}