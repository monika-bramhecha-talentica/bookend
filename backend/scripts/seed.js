#!/usr/bin/env node

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const books = [
  {
    isbn: '9780140449136',
    title: 'The Odyssey',
    author: 'Homer',
    publisher: 'Penguin Classics',
    publishedYear: -700,
    genre: 'Epic Poetry',
    description: 'An ancient Greek epic poem following Odysseus on his journey home after the Trojan War.',
    pageCount: 560,
    language: 'English',
  },
  {
    isbn: '9780743273565',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    publisher: 'Scribner',
    publishedYear: 1925,
    genre: 'Classic',
    description: 'A portrait of the Jazz Age in all of its decadence and excess.',
    pageCount: 180,
    language: 'English',
  },
  {
    isbn: '9780061120084',
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    publisher: 'Harper Perennial',
    publishedYear: 1960,
    genre: 'Fiction',
    description: 'A coming-of-age story that explores racial injustice and moral growth.',
    pageCount: 336,
    language: 'English',
  },
  {
    isbn: '9780451524935',
    title: '1984',
    author: 'George Orwell',
    publisher: 'Signet Classic',
    publishedYear: 1949,
    genre: 'Dystopian',
    description: 'A chilling vision of perpetual war, surveillance, and totalitarian control.',
    pageCount: 328,
    language: 'English',
  },
  {
    isbn: '9780544003415',
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    publisher: 'Mariner Books',
    publishedYear: 1937,
    genre: 'Fantasy',
    description: 'Bilbo Baggins joins a quest to reclaim treasure from the dragon Smaug.',
    pageCount: 320,
    language: 'English',
  },
  {
    isbn: '9780307277671',
    title: 'The Road',
    author: 'Cormac McCarthy',
    publisher: 'Vintage',
    publishedYear: 2006,
    genre: 'Post-Apocalyptic',
    description: 'A father and son travel through a bleak landscape after an unspecified catastrophe.',
    pageCount: 287,
    language: 'English',
  },
  {
    isbn: '9780385490818',
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    publisher: 'HarperOne',
    publishedYear: 1988,
    genre: 'Philosophical Fiction',
    description: 'A shepherd named Santiago follows his dreams in search of treasure and purpose.',
    pageCount: 208,
    language: 'English',
  },
  {
    isbn: '9781594634024',
    title: 'The Kite Runner',
    author: 'Khaled Hosseini',
    publisher: 'Riverhead Books',
    publishedYear: 2003,
    genre: 'Historical Fiction',
    description: 'A story of friendship, betrayal, and redemption set in Afghanistan.',
    pageCount: 372,
    language: 'English',
  },
  {
    isbn: '9780385537858',
    title: 'The Martian',
    author: 'Andy Weir',
    publisher: 'Crown',
    publishedYear: 2011,
    genre: 'Science Fiction',
    description: 'An astronaut stranded on Mars must use science and ingenuity to survive.',
    pageCount: 387,
    language: 'English',
  },
  {
    isbn: '9780307949486',
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    publisher: 'Harper',
    publishedYear: 2014,
    genre: 'History',
    description: 'A broad narrative of humankind from the Stone Age to modern technological society.',
    pageCount: 498,
    language: 'English',
  },
  {
    isbn: '9780590353427',
    title: 'Harry Potter and the Sorcerer\'s Stone',
    author: 'J.K. Rowling',
    publisher: 'Scholastic',
    publishedYear: 1997,
    genre: 'Young Adult',
    description: 'A young wizard discovers his magical heritage and attends Hogwarts School.',
    pageCount: 309,
    language: 'English',
  },
  {
    isbn: '9780385349949',
    title: 'Lean In',
    author: 'Sheryl Sandberg',
    publisher: 'Knopf',
    publishedYear: 2013,
    genre: 'Business',
    description: 'A book about leadership, career growth, and women in the workplace.',
    pageCount: 240,
    language: 'English',
  },
  {
    isbn: '9780307387899',
    title: 'The Girl with the Dragon Tattoo',
    author: 'Stieg Larsson',
    publisher: 'Vintage Crime/Black Lizard',
    publishedYear: 2005,
    genre: 'Mystery',
    description: 'An investigative journalist and a hacker uncover dark family secrets.',
    pageCount: 672,
    language: 'English',
  },
  {
    isbn: '9780374533557',
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    publisher: 'Farrar, Straus and Giroux',
    publishedYear: 2011,
    genre: 'Psychology',
    description: 'An exploration of cognitive biases and the two systems of human thought.',
    pageCount: 512,
    language: 'English',
  },
  {
    isbn: '9780141439518',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    publisher: 'Penguin Classics',
    publishedYear: 1813,
    genre: 'Romance',
    description: 'A classic novel of manners, marriage, and social expectations.',
    pageCount: 432,
    language: 'English',
  },
  {
    isbn: '9780812981605',
    title: 'When Breath Becomes Air',
    author: 'Paul Kalanithi',
    publisher: 'Random House',
    publishedYear: 2016,
    genre: 'Memoir',
    description: 'A neurosurgeon reflects on life, purpose, and mortality after a terminal diagnosis.',
    pageCount: 256,
    language: 'English',
  },
  {
    isbn: '9781593279509',
    title: 'Eloquent JavaScript',
    author: 'Marijn Haverbeke',
    publisher: 'No Starch Press',
    publishedYear: 2018,
    genre: 'Technology',
    description: 'A practical introduction to programming concepts using modern JavaScript.',
    pageCount: 472,
    language: 'English',
  },
  {
    isbn: '9780062316110',
    title: 'The Power of Habit',
    author: 'Charles Duhigg',
    publisher: 'Random House',
    publishedYear: 2012,
    genre: 'Self-Help',
    description: 'An examination of how habits work and how they can be changed.',
    pageCount: 371,
    language: 'English',
  },
];

const users = [
  {
    email: 'alice.reader@bookend.dev',
    username: 'alice_reader',
    fullName: 'Alice Reader',
    role: 'USER',
  },
  {
    email: 'ben.reviews@bookend.dev',
    username: 'ben_reviews',
    fullName: 'Ben Reviews',
    role: 'USER',
  },
  {
    email: 'carla.pages@bookend.dev',
    username: 'carla_pages',
    fullName: 'Carla Pages',
    role: 'USER',
  },
  {
    email: 'david.notes@bookend.dev',
    username: 'david_notes',
    fullName: 'David Notes',
    role: 'USER',
  },
  {
    email: 'eva.library@bookend.dev',
    username: 'eva_library',
    fullName: 'Eva Library',
    role: 'USER',
  },
  {
    email: 'admin@bookend.dev',
    username: 'bookend_admin',
    fullName: 'Bookend Admin',
    role: 'ADMIN',
  },
];

const reviewTemplates = [
  {
    rating: 5,
    title: 'Absolutely loved it',
    content: 'Great pacing, memorable characters, and a story that stayed with me long after finishing.',
  },
  {
    rating: 4,
    title: 'Strong read',
    content: 'Very engaging and well written. A few slower chapters, but overall a great experience.',
  },
  {
    rating: 3,
    title: 'Good but uneven',
    content: 'Interesting ideas and moments, though parts felt a bit repetitive for me personally.',
  },
];

async function seed() {
  const defaultPassword = 'Password123';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  const createdUsers = [];
  for (const user of users) {
    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
      create: {
        ...user,
        password: passwordHash,
      },
    });

    createdUsers.push(created);
  }

  const createdBooks = [];
  for (const book of books) {
    const created = await prisma.book.upsert({
      where: { isbn: book.isbn },
      update: {
        ...book,
      },
      create: {
        ...book,
      },
    });

    createdBooks.push(created);
  }

  for (let index = 0; index < createdBooks.length; index += 1) {
    const book = createdBooks[index];

    for (let userIndex = 0; userIndex < createdUsers.length; userIndex += 1) {
      const user = createdUsers[userIndex];
      const template = reviewTemplates[(index + userIndex) % reviewTemplates.length];

      await prisma.review.upsert({
        where: {
          userId_bookId: {
            userId: user.id,
            bookId: book.id,
          },
        },
        update: {
          rating: template.rating,
          title: template.title,
          content: template.content,
        },
        create: {
          userId: user.id,
          bookId: book.id,
          rating: template.rating,
          title: template.title,
          content: template.content,
        },
      });
    }
  }

  for (const book of createdBooks) {
    const stats = await prisma.review.aggregate({
      where: { bookId: book.id },
      _avg: { rating: true },
      _count: { id: true },
    });

    await prisma.book.update({
      where: { id: book.id },
      data: {
        averageRating: stats._avg.rating || 0,
        ratingsCount: stats._count.id,
      },
    });
  }

  console.log('✅ Seed complete');
  console.log(`   Users: ${createdUsers.length}`);
  console.log(`   Books: ${createdBooks.length}`);
  console.log(`   Reviews: ${createdBooks.length * createdUsers.length}`);
  console.log('   Login credentials:');
  for (const seededUser of users) {
    console.log(`   - ${seededUser.email} / ${defaultPassword} (${seededUser.role})`);
  }
}

seed()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
