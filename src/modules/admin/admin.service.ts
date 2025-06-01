import { prisma } from '../../lib/prisma';
import { Role } from '../../../generated/prisma';

export async function checkAdmin(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
    })

    if (!user || user.role !== 'ADMIN') {
        throw new Error('Unauthorized: admin access required')
    }
}

export async function adminCreateMovie(data: any) {
    return prisma.movie.create({ data })
}

export async function adminUpdateMovie(id: string, data: any) {
    return prisma.movie.update({
        where: { id },
        data
    })
}

export async function adminDeleteMovie(id: string) {
    return prisma.movie.delete({
        where: { id }
    })
}

export async function adminGetCinemas() {
    return prisma.cinema.findMany({
        include: {
            rooms: true,
            _count: {
                select: {
                    sessions: true
                }
            }
        }
    })
}

export async function adminCreateCinema(data: any) {
    return prisma.cinema.create({ data })
}

export async function adminUpdateCinema(id: string, data: any) {
    return prisma.cinema.update({
        where: { id },
        data
    })
}

export async function adminDeleteCinema(id: string) {
    return prisma.$transaction(async (tx: any) => {
        await tx.session.deleteMany({ where: { cinemaId: id }})
        await tx.room.deleteMany({ where: { cinemaId: id }})
        await tx.cinema.delete({ where: { id }})
    })
}

export async function adminCreateRoom(data: any) {
    return prisma.room.create({ data })
}

export async function adminGetSessions() {
    return prisma.session.findMany({
        include: {
            movie: true,
            cinema: true,
            room: true,
            _count: {
                select: {
                    seats: true,
                    tickets: true
                }
            }
        },
        orderBy: {
            date: 'asc'
        }
    })
}

export async function adminCreateSession(data: any) {
    const session = await prisma.session.create({
        data: {
            movieId: data.movieId,
            cinemaId: data.cinemaId,
            roomId: data.roomId,
            data: data.date,
            time: data.time
        }
    })

    const room = await prisma.room.findUnique({
        where: { id: data.roomId }
    })

    if (!room) {
        throw new Error('Room not found')
    }

    const seats = []
    for (let row = 1; row <= room.rows; row++) {
        for (let number = 1; number <= room.seatsPerRow; number++) {
            seats.push({
                sessionId: session.id,
                row: String.fromCharCode(64 + row),
                number,
                status: 'AVAILABLE'
            })
        }
    }

    await prisma.seat.createMany({ data: seats })

    return session;
}

export async function adminDeleteSession(id: string) {
    return prisma.session.delete({
        where: { id }
    })
}