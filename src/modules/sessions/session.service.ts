import { prisma } from '../../lib/prisma';
import { SeatStatus } from '../../../generated/prisma';

export async function getSessionById(id: string) {
    return prisma.session.findUnique({
        where: { id },
        include: {
            movie: {
                select: {
                    id: true,
                    title: true,
                    posterUrl: true,
                    duration: true,
                    classification: true
                }
            },
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
        }
    });
}

export async function getSessionSeats(sessionId: string) {
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
            room: {
                select: {
                    rows: true,
                    seatsPerRow: true
                }
            }
        }
    });

    if (!session) {
        throw new Error('Session not found');
    }

    const existingSeats = await prisma.seat.findMany({
        where: { sessionId },
        orderBy: [
            { row: 'asc'},
            { number: 'asc' }
        ]
    });

    const seatMap = new Map();
    existingSeats.forEach(seat => {
        seatMap.set(`${seat.row}-${seat.number}`, seat);
    });

    const allSeats = [];
    const rows = session.room.rows;
    const seatsPerRow = session.room.seatsPerRow;

    for (let row = 1; row <= rows; row++) {
        const rowLetter = String.fromCharCode(64 + row);

        for (let number = 1; number <= seatsPerRow; number++) {
            const seatKey = `${rowLetter}-${number}`;
            const existingSeat = seatMap.get(seatKey);
    
            if (existingSeat) {
                allSeats.push(existingSeats);
            } else {
                allSeats.push({
                    id: `virtual-${rowLetter}-${number}`,
                    sessionId,
                    row: rowLetter,
                    number,
                    status: 'AVAILABLE',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        }
    }
    return allSeats;
}

export async function reserveSeats(
    sessionId: string,
    userId: string,
    seats: { row: string, number: number}[],
    ticketTypes: { type: 'ADULT' | 'CHILD' | 'SENIOR' | 'STUDENT', count: number }[]
) {
    const reservationId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await prisma.$transaction(async (tx: any) => {
        const seatsToCheck = await tx.seat.findMany({
            where: {
                sessionId,
                OR: seats.map(seat => ({
                    row: seat.row,
                    number: seat.number
                })),
                NOT: { status: 'AVAILABLE' }
            }
        });

        if (seatsToCheck.length > 0) {
            throw new Error('Some seats are not available');
        }

        await Promise.all(seats.map(async seat => {
            const existingSeat = await tx.seat.findFirst({
                where: {
                    sessionId,
                    row: seat.row,
                    number: seat.number
                }
            });

            if (!existingSeat) {
                await tx.seat.create({
                    data: {
                        sessionId,
                        row: seat.row,
                        number: seat.number,
                        status: 'RESERVED',
                        reservation: reservationId
                    }
                });
            }
        }));

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
        });

        await tx.reservation.create({
            data: {
                id: reservationId,
                sessionId,
                userId,
                expiresAt,
                seats: {
                    connect: seats.map(seat => ({
                        sessionId_row_number: {
                            sessionId,
                            row: seat.row,
                            number: seat.number
                        }
                    }))
                },
                ticketTypes: {
                    create: ticketTypes.map(type => ({
                        type: type.type,
                        count: type.count
                    }))
                }
            }
        });
        return { reservationId, expiresAt };
    });
}