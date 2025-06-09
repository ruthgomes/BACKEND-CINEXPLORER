import { prisma } from '../../lib/prisma';
import { CinemaQuery } from './cinema.schema';

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371; // Raio da terra em Km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function getCinemas(query?: CinemaQuery) {
  const cinemas = await prisma.cinema.findMany();

  if (query?.sort === 'distance' && query.lat && query.lng) {
    return cinemas.map(cinema => {
      const location = cinema.location as { lat: number; lng: number };

      return {
        ...cinema,
        distance: calculateDistance(query.lat!, query.lng!, location.lat, location.lng)
      };
    }).sort((a, b) => a.distance! - b.distance!);
  }

  if (query?.sort === 'name') {
    return cinemas.sort((a, b) => a.name.localeCompare(b.name));
  }
  return cinemas;
}

export async function getCinemaById(id: string) {
  return prisma.cinema.findUnique({
    where: { id },
    include: {
      rooms: true,
      sessions: {
        include: {
          movie: {
            select: {
              id: true,
              title: true,
              posterUrl: true,
              duration: true
            }
          },
          room: true
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

export async function getCinemaRooms(cinemaId: string) {
  return prisma.room.findMany({
    where: { cinemaId },
    orderBy: {
      name: 'asc'
    }
  });
}

export async function getCinemaSessions(cinemaId: string, date?: string, movieId?: string) {
  const where: any = { cinemaId };

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

  if (movieId) {
    where.movieId = movieId;
  }

  return prisma.session.findMany({
    where,
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
      room: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: [
      { date: 'asc' },
      { time: 'asc' }
    ]
  });
}