import { prisma } from '../../lib/prisma';
import { Role, SeatStatus } from '../../../generated/prisma';

export async function checkAdmin(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
        throw new Error('Unauthorized: admin access required');
    }
}

export async function adminCreateMovie(data: any) {
    if (data.duration <= 0) {
        throw new Error('Duration must be positive');
    }

    if (data.releaseDate && new Date(data.releaseDate) > new Date() && !data.isComingSoon) {
        throw new Error('Future release date must have isComingSoon=true');
    }

    return prisma.movie.create({
        data: {
            ...data,
            isComingSoon: data.isComingSoon !== undefined ? data.isComingSoon : false
        }
    });
}

export async function adminUpdateMovie(id: string, data: any) {
    if (data.duration && data.duration <= 0) {
        throw new Error('Duration must be positive');
    }

    if (data.releaseDate && new Date(data.releaseDate) > new Date() && data.isComingSoon === false) {
        throw new Error('Future release date must have isComingSoon=true');
    }

    return prisma.movie.update({
        where: { id },
        data
    });
}

export async function adminDeleteMovie(id: string) {
    const movie = await prisma.movie.findUnique({
        where: { id }
    });

    if (!movie) {
        throw new Error('Movie not found');
    }

    return prisma.movie.delete({
        where: { id }
    });
}

export async function adminGetCinemas() {
    return prisma.cinema.findMany({
        include: {
            rooms: {
                select: {
                    id: true,
                    name: true,
                    _count: {
                        select: {
                            sessions: true
                        }
                    }
                }
            },
            _count: {
                select: {
                    sessions: true
                }
            }
        },
        orderBy: {
            name: 'asc'
        }
    });
}

export async function adminCreateCinema(data: any) {
    if (!data.location || !data.location.lat || !data.location.lng) {
        throw new Error('Location with lat and lng is required');
    }

    return prisma.cinema.create({
        data: {
            ...data,
            location: {
                lat: parseFloat(data.location.lat),
                lng: parseFloat(data.location.lng)
            }
        }
    });
}

export async function adminUpdateCinema(id: string, data: any) {
    if (data.location && (!data.location.lat || !data.location.lng)) {
        throw new Error('Location must include both lat and lng');
    }

    return prisma.cinema.update({
        where: { id },
        data: {
            ...data,
            ...(data.location && {
                location: {
                    lat: parseFloat(data.location.lat),
                    lng: parseFloat(data.location.lng)
                }
            })
        }
    });
}

export async function adminDeleteCinema(id: string) {
    const cinema = await prisma.cinema.findUnique({
        where: { id }
    });

    if (!cinema) {
        throw new Error('Cinema not found');
    }

    return prisma.$transaction(async (tx) => {
        await tx.session.deleteMany({ where: { cinemaId: id }});
        await tx.room.deleteMany({ where: { cinemaId: id } });
        await tx.cinema.delete({ where: { id } });
    });
}

export async function adminCreateRoom(data: any) {
    const cinema = await prisma.cinema.findUnique({
        where: { id: data.cinemaId }
    });

    if (!cinema) {
        throw new Error('Cinema not found');
    }

    if (data.rows < 1 || data.rows > 26) {
        throw new Error('Rows must be between 1 and 26');
    }

    if (data.seatsPerRow < 1 || data.seatsPerRow > 50) {
        throw new Error('Seats per row must be between 1 and 50');
    }

    return prisma.room.create({
        data: {
            name: data.name,
            cinemaId: data.cinemaId,
            rows: data.rows,
            seatsPerRow: data.seatsPerRow
        }
    });
}

export async function adminGetSessions() {
    return prisma.session.findMany({
        include: {
            movie: {
                select: {
                    id: true,
                    title: true,
                    posterUrl: true
                }
            },
            cinema: {
                select: {
                    id: true,
                    name: true
                }
            },
            room: {
                select: {
                    id: true,
                    name: true
                }
            },
            _count: {
                select: {
                    seats: true,
                    tickets: true
                }
            }
        },
        orderBy: [
            { date: 'asc' },
            { time: 'asc' }
        ]
    });
}

export async function adminCreateSession(data: any) {
    const movie = await prisma.movie.findUnique({
        where: { id: data.movieId }
    });

    if (!movie) {
        throw new Error('Movie not found');
    }

    const cinema = await prisma.cinema.findUnique({
        where: { id: data.cinemaId }
    });

    if (!cinema) {
        throw new Error('Cinema not found');
    }

    const room = await prisma.room.findUnique({
        where: { id: data.roomId }
    });

    if (!room) {
        throw new Error('Room not found');
    }

    if (room.cinemaId !== data.cinemaId) {
        throw new Error('Room does not belon to the specified cinema');
    }

    const sessionDate = new Date(data.date);
    const now = new Date();

    if (sessionDate < now) {
        throw new Error('Session date must be in the future');
    }

    const conflictingSession = await prisma.session.findFirst({
        where: {
            roomId: data.roomId,
            date: sessionDate,
            time: data.time
        }
    });

    if (conflictingSession) {
        throw new Error('There is already a session scheduled at this time in this room');
    }

    const session = await prisma.session.create({
        data: {
            movieId: data.movieId,
            cinemaId: data.cinemaId,
            roomId: data.roomId,
            date: sessionDate,
            time: data.time
        }
    });

    const seats = [];
    for (let row = 1; row <= room.rows; row++) {
        const rowLetter = String.fromCharCode(64 + row);

        for (let number = 1; number <= room.seatsPerRow; number++) {
            seats.push({
                sessionId: session.id,
                row: rowLetter,
                number,
                status: SeatStatus.AVAILABLE
            });
        }
    }

    await prisma.seat.createMany({ data: seats });

    return session;
}

export async function adminDeleteSession(id: string) {
    const session = await prisma.session.findUnique({
        where: { id }
    });

    if (!session) {
        throw new Error('Session not found');
    }

    const ticketsCount = await prisma.ticket.count({
        where: { sessionId: id }
    });

    if (ticketsCount > 0) {
        throw new Error('Cannot delete session with sold tickets');
    }


    return prisma.session.delete({
        where: { id }
    });
}
