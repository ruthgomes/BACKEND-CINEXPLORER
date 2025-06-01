import { prisma } from '../../lib/prisma';
import { CinemaQuery } from './cinema.schema';

function hasLocation(query: any): query is { lat: number; lng: number; sort?: string } {
  return query && typeof query.lat === 'number' && typeof query.lng === 'number'
}

export async function getCinemas(query?: CinemaQuery) {
  if (query?.sort === 'distance' && hasLocation(query)) {
    const cinemas = await prisma.cinema.findMany()
    return cinemas.sort((a: any, b: any) => {
      const aLoc = a.location as any
      const bLoc = b.location as any
      const distA = Math.sqrt(Math.pow(aLoc.lat - query.lat, 2) + Math.pow(aLoc.lng - query.lng, 2))
      const distB = Math.sqrt(Math.pow(bLoc.lat - query.lat, 2) + Math.pow(bLoc.lng - query.lng, 2))
      return distA - distB
    })
  }
  
  return prisma.cinema.findMany({
    orderBy: query?.sort === 'name' ? { name: 'asc' } : undefined
  })
}


export async function getCinemaById(id: string) {
  return prisma.cinema.findUnique({
    where: { id },
    include: {
      rooms: true,
      sessions: {
        include: {
          movie: true,
          room: true
        }
      }
    }
  })
}

export async function getCinemaRooms(cinemaId: string) {
  return prisma.room.findMany({
    where: { cinemaId }
  })
}

export async function getCinemaSessions(cinemaId: string) {
  return prisma.session.findMany({
    where: { cinemaId },
    include: {
      movie: true,
      room: true
    }
  })
}