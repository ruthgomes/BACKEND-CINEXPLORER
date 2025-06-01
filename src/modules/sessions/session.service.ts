import { prisma } from '../../lib/prisma';
import { SeatStatus } from '../../../generated/prisma';

export async function getSessionById(id: string) {
    return prisma.session.findUnique({
        where: { id },
        include: {
            movie: true,
            cinema: true,
            room: true
        }
    })
}

export async function getSessionSeats(sessionId: string) {
    return prisma.seat.findMany({
        where: { sessionId },
        orderBy: [
            { row: 'asc' },
            { number: 'asc' }
        ]
    })
}

export async function reserveSeats(sessionId: string, userId: string, seats: { row: string, number: number}[]) {
    const reservationId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await prisma.$transaction(async (tx: any) => {
        const seatsToReserve = await tx.seat.findMany({
            where: {
                sessionId,
                OR: seats.map(seat => ({
                    row: seat.row,
                    number: seat.number
                })),
                NOT: { status: 'AVAILABLE' }
            }
        })

        if (seatsToReserve.length > 0) {
            throw new Error('Some seats are not available')
        }

        await tx.seat.updateMany({
            where: {
                sessionId,
                OR: seats.map(seat => ({
                    row: seat.row,
                    number: seat.number
                }))
            },
            data: {
                status: 'RESERVED',
                reservation: reservationId
            }
        })
    })

    return { reservationId, expiresAt };
}