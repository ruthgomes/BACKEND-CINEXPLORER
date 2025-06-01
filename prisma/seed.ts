import { PrismaClient, SeatStatus } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Limpar o banco de dados (opcional - cuidado em produção!)
  console.log('🧹 Limpando dados existentes...')
  await prisma.$transaction([
    prisma.seat.deleteMany(),
    prisma.ticket.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.session.deleteMany(),
    prisma.room.deleteMany(),
    prisma.cinema.deleteMany(),
    prisma.movie.deleteMany(),
    prisma.promotion.deleteMany(),
    prisma.address.deleteMany(),
    prisma.user.deleteMany(),
  ])

  // Criar usuários
  console.log('👥 Criando usuários...')
  const adminPassword = await hash('admin123', 10)
  const userPassword = await hash('user123', 10)

  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@cinema.com',
      password: adminPassword,
      role: 'ADMIN'
    }
  })

  const regularUser = await prisma.user.create({
    data: {
      name: 'Usuário Regular',
      email: 'user@cinema.com',
      password: userPassword,
      role: 'USER'
    }
  })

  // Criar endereço para o usuário
  console.log('🏠 Criando endereço do usuário...')
  await prisma.address.create({
    data: {
      userId: regularUser.id,
      cep: '01001000',
      estado: 'SP',
      cidade: 'São Paulo',
      bairro: 'Sé',
      rua: 'Praça da Sé',
      numero: '100',
      latitude: -23.5505,
      longitude: -46.6333
    }
  })

  // Criar cinemas
  console.log('🎬 Criando cinemas...')
  const cinema1 = await prisma.cinema.create({
    data: {
      name: 'CineMark Shopping Ibirapuera',
      address: 'Av. Ibirapuera, 3103 - Moema, São Paulo - SP',
      location: {
        lat: -23.6085,
        lng: -46.6653
      }
    }
  })

  const cinema2 = await prisma.cinema.create({
    data: {
      name: 'Cinépolis JK Iguatemi',
      address: 'Av. Presidente Juscelino Kubitschek, 2041 - Itaim Bibi, São Paulo - SP',
      location: {
        lat: -23.5994,
        lng: -46.6764
      }
    }
  })

  // Criar salas
  console.log('🪑 Criando salas de cinema...')
  const room1 = await prisma.room.create({
    data: {
      name: 'Sala 1',
      cinemaId: cinema1.id,
      rows: 10,
      seatsPerRow: 15
    }
  })

  const room2 = await prisma.room.create({
    data: {
      name: 'Sala VIP',
      cinemaId: cinema1.id,
      rows: 8,
      seatsPerRow: 12
    }
  })

  const room3 = await prisma.room.create({
    data: {
      name: 'Sala 3D',
      cinemaId: cinema2.id,
      rows: 12,
      seatsPerRow: 20
    }
  })

  // Criar filmes
  console.log('🎥 Criando filmes...')
  const currentDate = new Date()
  const nextWeek = new Date()
  nextWeek.setDate(currentDate.getDate() + 7)

  const movie1 = await prisma.movie.create({
    data: {
      title: 'O Poderoso Chefão',
      synopsis: 'A saga da família Corleone, liderada por Don Vito Corleone.',
      posterUrl: 'https://example.com/posters/poderoso-chefao.jpg',
      backdropUrl: 'https://example.com/backdrops/poderoso-chefao.jpg',
      trailerUrl: 'https://youtube.com/watch?v=example1',
      duration: 175,
      releaseDate: new Date('1972-09-10'),
      classification: '16 anos',
      genres: ['Drama', 'Crime'],
      rating: 9.2,
      isComingSoon: false
    }
  })

  const movie2 = await prisma.movie.create({
    data: {
      title: 'Interestelar',
      synopsis: 'Uma equipe de exploradores viaja através de um buraco de minhoca no espaço.',
      posterUrl: 'https://example.com/posters/interestelar.jpg',
      backdropUrl: 'https://example.com/backdrops/interestelar.jpg',
      trailerUrl: 'https://youtube.com/watch?v=example2',
      duration: 169,
      releaseDate: new Date('2014-11-07'),
      classification: '12 anos',
      genres: ['Ficção Científica', 'Drama', 'Aventura'],
      rating: 8.6,
      isComingSoon: false
    }
  })

  const movie3 = await prisma.movie.create({
    data: {
      title: 'Duna: Parte Dois',
      synopsis: 'Continuação da jornada de Paul Atreides no planeta Arrakis.',
      posterUrl: 'https://example.com/posters/duna2.jpg',
      backdropUrl: 'https://example.com/backdrops/duna2.jpg',
      trailerUrl: 'https://youtube.com/watch?v=example3',
      duration: 166,
      releaseDate: nextWeek,
      classification: '14 anos',
      genres: ['Ficção Científica', 'Aventura'],
      rating: 0,
      isComingSoon: true
    }
  })

  // Criar sessões
  console.log('🕒 Criando sessões...')
  const createSessions = async (movieId: string, roomId: string, dates: Date[]) => {
    for (const date of dates) {
      const session = await prisma.session.create({
        data: {
          movieId,
          cinemaId: cinema1.id,
          roomId,
          date,
          time: '20:00'
        }
      })

      // Criar assentos para a sessão
      const room = await prisma.room.findUnique({ where: { id: roomId } })
      if (!room) continue

      const seats = []
      for (let row = 1; row <= room.rows; row++) {
        for (let number = 1; number <= room.seatsPerRow; number++) {
          seats.push({
            sessionId: session.id,
            row: String.fromCharCode(64 + row), // A, B, C, etc.
            number,
            status: SeatStatus.AVAILABLE
          })
        }
      }

      await prisma.seat.createMany({ data: seats })
    }
  }

  // Sessões para hoje e amanhã
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  await createSessions(movie1.id, room1.id, [today, tomorrow])
  await createSessions(movie2.id, room2.id, [today, tomorrow])

  // Criar promoções
  console.log('🎟️ Criando promoções...')
  await prisma.promotion.create({
    data: {
      title: 'Meia Entrada Segunda',
      description: '50% de desconto todas as segundas-feiras',
      discount: 50,
      code: 'MEIASEG',
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
      isActive: true
    }
  })

  await prisma.promotion.create({
    data: {
      title: 'Lançamento Duna',
      description: '20% de desconto na pré-estreia de Duna',
      discount: 20,
      code: 'DUNA20',
      validFrom: new Date(),
      validUntil: nextWeek,
      isActive: true,
      applicableMovies: [movie3.id]
    }
  })

  console.log('✅ Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })