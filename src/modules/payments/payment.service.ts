import { prisma } from "../../lib/prisma";
import { PaymentMethod, PaymentStatus } from "../../../generated/prisma";
import { v4 as uuidv4 } from 'uuid';

const ticketPrices = {
    ADULT: 25.0,
    CHILD: 15.0,
    SENIOR: 20.0,
    STUDENT: 18.0
};

export async function processPayment(
    userId: string,
    data: {
        sessionId: string;
        reservationId: string;
        seats: { row: string; number: number }[];
        ticketTypes: { type: 'ADULT' | 'CHILD' | 'SENIOR' | 'STUDENT'; count: number }[];
        totalAmount: number;
        paymentMethod: PaymentMethod;
        paymentDetails?: {
            cardNumber?: string;
            cardName?: string;
            expiryDate?: string;
            cvv?: string;
            installments?: number;
        };
    }
) {
    const purchaseId = uuidv4();
    let paymentStatus: PaymentStatus = 'COMPLETED';
    let pixCode: string | undefined;
    let pixQrCode: string | undefined;
    let cardLastFour: string | undefined;
    let installments: number | undefined;

    const calculatedAmount = data.ticketTypes.reduce((sum, type) => {
        return sum + (ticketPrices[type.type] * type.count);
    }, 0);

    if (Math.abs(calculatedAmount - data.totalAmount) > 0.01) {
        throw new Error('Total amount does not match ticket prices');
    }

    if (data.paymentMethod === 'PIX') {
        paymentStatus = 'PENDING';
        pixCode = `PIX-${uuidv4()}`;
        pixQrCode = `https://api.cinexplorer.com/pix/qr/${pixCode}`;
    } else if (data.paymentMethod === 'CREDIT' || data.paymentMethod === 'DEBIT') {
        if (!data.paymentDetails?.cardNumber || !data.paymentDetails?.cardName || 
            !data.paymentDetails?.expiryDate || !data.paymentDetails?.cvv) {
            throw new Error('Card details are required for credit/debit payments');
        }

        cardLastFour = data.paymentDetails.cardNumber.slice(-4);
        
        if (data.paymentMethod === 'CREDIT') {
            installments = data.paymentDetails.installments || 1;
            if (installments < 1 || installments > 12) {
                throw new Error('Installments must be between 1 and 12');
            }
        }
    }

    const tickets: any[] = [];
    let seatIndex = 0;

    for (const ticketType of data.ticketTypes) {
        for (let i = 0; i < ticketType.count; i++) {
            if (seatIndex >= data.seats.length) break;

            tickets.push({
                sessionId: data.sessionId,
                userId,
                type: ticketType.type,
                price: ticketPrices[ticketType.type],
                qrCode: `TICKET-${uuidv4()}`,
                purchaseId,
                status: 'ACTIVE'
            });
            seatIndex++;
        }
    }

    return await prisma.$transaction(async (tx) => {
        const reservation = await tx.reservation.findUnique({
            where: { id: data.reservationId },
            include: {
                seats: {
                    where: {
                        sessionId: data.sessionId,
                        reservation: data.reservationId,
                        status: 'RESERVED'
                    }
                }
            }
        });

        if (!reservation || reservation.seats.length !== data.seats.length) {
            throw new Error('Invalid or expired reservation');
        }

        for (const seat of data.seats) {
            const reservedSeat = reservation.seats.find((s: any) => 
                s.row === seat.row && s.number === seat.number
            );
            
            if (!reservedSeat) {
                throw new Error(`Seat ${seat.row}${seat.number} is not part of this reservation`);
            }
        }

        const payment = await tx.payment.create({
            data: {
                userId,
                amount: data.totalAmount,
                method: data.paymentMethod,
                status: paymentStatus,
                installments,
                cardLastFour,
                pixCode,
                pixQrCode,
                tickets: {
                    create: tickets
                }
            },
            include: {
                tickets: true
            }
        });

        for (let i = 0; i < data.seats.length; i++) {
            if (i >= payment.tickets.length) break;

            await tx.seat.updateMany({
                where: {
                    sessionId: data.sessionId,
                    row: data.seats[i].row,
                    number: data.seats[i].number,
                    reservation: data.reservationId
                },
                data: {
                    status: 'OCCUPIED',
                    ticketId: payment.tickets[i].id,
                    reservation: null
                }
            });
        }

        await tx.reservation.update({
            where: { id: data.reservationId },
            data: {
                status: 'COMPLETED',
                paymentId: payment.id
            }
        });

        return {
            paymentId: payment.id,
            purchaseId,
            status: payment.status,
            pixCode,
            pixQrCode
        };
    });
}

export async function getPaymentStatus(paymentId: string, userId: string) {
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId, userId },
        select: { status: true }
    });

    if (!payment) {
        throw new Error('Payment not found');
    }

    return payment;
}

export async function getPaymentDetails(paymentId: string, userId: string) {
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId, userId },
        include: {
            tickets: {
                include: {
                    session: {
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
                }
            }
        }
    });

    if (!payment) {
        throw new Error('Payment not found');
    }

    return payment;
}