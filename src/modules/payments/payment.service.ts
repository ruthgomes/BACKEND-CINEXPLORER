import { prisma } from "../../lib/prisma";
import { PaymentMethod, PaymentStatus } from "../../../generated/prisma";
import { v4 as uuidv4 } from 'uuid';

export async function processPayment(
    userId: string,
    data: {
        sessionId: String
        reservationId: string
        seats: { row: string; number: number}[]
        ticketTypes: { type: 'ADULT' | 'CHILD' | 'SENIOR' | 'STUDENT'; count: number }[]
        totalAmount: number
        paymentMethod: PaymentMethod
        paymentDetails?: {
            cardNumber?: string
            cardName?: string
            expiryDate?: string
            cvv?: string
            installments?: number
        }
    }
) {
    const purchaseId = uuidv4()
    let paymentStatus: PaymentStatus = 'COMPLETED'
    let pixCode: string | undefined
    let pixQrCode: string | undefined
    let cardLastFour: string | undefined

    if (data.paymentMethod === 'PIX') {
        paymentStatus = 'PENDING'
        pixCode = `PIX-${uuidv4()}`
        pixQrCode = `https://api.cinema.com/pix/qr/${pixCode}`
    } else if (data.paymentMethod === 'CREDIT' || data.paymentMethod === 'DEBIT') {
        cardLastFour = data.paymentDetails?.cardNumber?.slice(-4) || '0000';
    }

    const ticketPrices = {
        ADULT: 25.0,
        CHILD: 15.0,
        SENIOR: 20.0,
        STUDENT: 18.0
    }

    const tickets: any = []
    let seatIndex = 0

    for (const ticketType of data.ticketTypes) {
        for (let i = 0; i < ticketType.count; i++) {
            if (seatIndex >= data.seats.length) break

            tickets.push({
                sessionId: data.sessionId,
                userId,
                type: ticketType.type,
                price: ticketPrices[ticketType.type],
                qrCode: `TICKET-${uuidv4()}`,
                purchaseId,
                status: 'ACTIVE'
            })
            seatIndex++
        }
    }

    return prisma.$transaction(async (tx: any) => {
        const payment = await tx.payment.create({
            data: {
                userId,
                amount: data.totalAmount,
                method: data.paymentMethod,
                status: paymentStatus,
                installments: data.paymentMethod === 'CREDIT' ? data.paymentDetails?.installments : undefined,
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
        })

        for (let i = 0; i < data.seats.length; i++) {
            if (i >= tickets.length) break

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
            })
        }

        return {
            paymentId: payment.id,
            purchaseId,
            status: payment.status,
            pixCode,
            pixQrCode
        }
    })
}

export async function getPaymentStatus(paymentId: string, userId: string) {
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId, userId },
        select: { status: true }
    })

    if (!payment) {
        throw new Error('Payment not found')
    }

    return payment
}