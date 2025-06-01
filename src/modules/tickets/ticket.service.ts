import { prisma } from '../../lib/prisma';
import { TicketStatus } from '../../../generated/prisma';

export async function getTickets(userId: string, status?: TicketStatus) {
    return prisma.ticket.findMany({
        where: {
            userId,
            status: status ? status : undefined
        },
        include: {
            session: {
                include: {
                    movie: true,
                    cinema: true,
                    room: true
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
            createdAt: 'desc'
        }
    })
}

export async function getTicketById(id: string, userId: string) {
    return prisma.ticket.findUnique({
        where: { id, userId },
        include: {
            session: {
                include: {
                    movie: true,
                    cinema: true,
                    room: true
                }
            },
            seats: {
                select: {
                    id: true,
                    row: true,
                    number: true
                }
            }
        }
    })
}

export async function generateTicketQRCode(ticketId: string) {
    // In a real app, this would generate a proper QR code
    return `https://api.cinema.com/tickets/${ticketId}/verify`
}