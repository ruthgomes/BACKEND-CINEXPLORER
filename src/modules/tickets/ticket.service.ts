import { prisma } from '../../lib/prisma';
import { TicketStatus } from '../../../generated/prisma';

export async function getTickets(userId: string, status?: TicketStatus) {
    return prisma.ticket.findMany({
        where: {
            userId,
            status: status ? status : undefined,
            session: {
                date: { gte: new Date() }
            }
        },
        include: {
            session: {
                include: {
                    movie: {
                        select: {
                            id: true,
                            title: true,
                            posterUrl: true,
                            duration: true
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
                            name: true
                        }
                    }
                }
            },
            seats: {
                select: {
                    id: true,
                    row: true,
                    number: true
                }
            }
        },
        orderBy: {
            session: {
                date: 'asc'
            }
        }
    });
}

export async function getTicketById(id: string, userId: string) {
    return prisma.ticket.findUnique({
        where: { id },
        include: {
            session: {
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
                            name: true
                        }
                    }
                }
            },
            seats: {
                select: {
                    id: true,
                    row: true,
                    number: true
                }
            },
            payments: {
                select: {
                    id: true,
                    method: true,
                    amount: true,
                    status: true,
                    createdAt: true
                }
            }
        }
    });
}

export async function generateTicketQRCode(ticketId: string) {
    const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { qrCode: true }
    });

    if (!ticket) {
        throw new Error('Ticket not found');
    }

    if (!ticket.qrCode) {
        const newQrCode = `https://api.cinexplorer.com/tickets/${ticketId}/verify?token=${crypto.randomUUID()}`;
        await prisma.ticket.update({
            where: { id: ticketId },
            data: { qrCode: newQrCode }
        });
        return newQrCode;
    }

    return ticket.qrCode;
}

export async function cancelTicket(ticketId: string, userId: string) {
    return await prisma.$transaction(async (tx) => {
        const ticket = await tx.ticket.findUnique({
            where: { id: ticketId },
            include: {
                session: {
                    select: {
                        date: true
                    }
                },
                seats: true
            }
        });

        if (!ticket) {
            throw new Error('Ticket not found');
        }

        if (ticket.userId !== userId) {
            throw new Error("You don't have access to this ticket");
        }

        if (ticket.status === 'USED') {
            throw new Error('Ticket has already been used and cannot be cancelled');
        }

        if (ticket.session.date < new Date()) {
            throw new Error('Session has already occurred, ticket cannot be cancelled');
        }

        const timeDiff = ticket.session.date.getTime() - new Date().getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        if (hoursDiff < 24) {
            throw new Error('Ticket can only be cancelled at least 24 hours before the session');
        }

        await tx.ticket.update({
            where: { id: ticketId },
            data: { status: 'CANCELLED' }
        });

        await tx.seat.updateMany({
            where: {
                id: { in: ticket.seats.map(seat => seat.id) }
            },
            data: {
                status: 'AVAILABLE',
                ticketId: null
            }
        });

        await tx.payment.updateMany({
            where: {
                tickets: {
                    some: { id: ticketId }
                }
            },
            data: {
                status: 'REFUNDED'
            }
        });
    });
}