import { DatabaseSync } from 'node:sqlite';

// In-memory demo data. A real deployment would use a persistent database.
export const db = new DatabaseSync(':memory:');

const PRODUCTS = [
  ['Aurora Mechanical Keyboard', 'Hot-swappable switches, PBT keycaps and a machined aluminium case. A quiet, solid board for all-day work.', 129, 'Desk', 'DSK-1042'],
  ['Nimbus Noise-Cancelling Headphones', 'Forty hours of battery life, adaptive noise cancellation and a lightweight headband.', 249, 'Audio', 'AUD-2210'],
  ['Pulse Fitness Band', 'Heart-rate and sleep tracking with a seven-day battery and a comfortable silicone strap.', 79, 'Wellness', 'WEL-1180'],
  ['Vector USB-C Hub', 'Seven ports, 100 W pass-through charging and a compact aluminium body.', 59, 'Accessories', 'ACC-3401'],
  ['Orbit Wireless Mouse', 'Sculpted shape, silent switches and a precise 4000 dpi sensor.', 45, 'Desk', 'DSK-1051'],
  ['Halo Desk Lamp', 'Warm-to-cool dimming, a weighted base and a built-in USB charger.', 89, 'Desk', 'DSK-1077'],
  ['Cipher Security Key', 'FIDO2 and U2F support in a durable, water-resistant enclosure.', 55, 'Security', 'SEC-4102'],
  ['Stack Notebook Set', 'Three lay-flat notebooks with dot-grid paper and a cloth cover.', 18, 'Stationery', 'STA-2204']
];

export function seedDatabase() {
  db.exec(`
    DROP TABLE IF EXISTS reviews;
    DROP TABLE IF EXISTS transfers;
    DROP TABLE IF EXISTS products;
    DROP TABLE IF EXISTS users;

    CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      email TEXT NOT NULL,
      balance INTEGER NOT NULL
    );

    CREATE TABLE products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      category TEXT NOT NULL,
      sku TEXT NOT NULL
    );

    CREATE TABLE reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      author TEXT NOT NULL,
      content TEXT NOT NULL,
      rating INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user TEXT NOT NULL,
      to_user TEXT NOT NULL,
      amount INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  const insertUser = db.prepare(
    'INSERT INTO users (id, username, password, role, email, balance) VALUES (?, ?, ?, ?, ?, ?)'
  );
  insertUser.run(1, 'alice', 'alice123', 'member', 'alice@northwind.example', 5000);
  insertUser.run(2, 'bob', 'bob123', 'member', 'bob@northwind.example', 2500);
  insertUser.run(3, 'admin', 'S3cr3tAdm1n!', 'admin', 'ops@northwind.example', 99999);
  insertUser.run(4, 'auditor', 'audit2026', 'member', 'auditor@northwind.example', 7500);
  insertUser.run(5, 'mallory', 'mallory123', 'member', 'mallory@northwind.example', 800);

  const insertProduct = db.prepare(
    'INSERT INTO products (name, description, price, category, sku) VALUES (?, ?, ?, ?, ?)'
  );
  for (const product of PRODUCTS) insertProduct.run(...product);

  const insertReview = db.prepare(
    'INSERT INTO reviews (product_id, author, content, rating, created_at) VALUES (?, ?, ?, ?, ?)'
  );
  insertReview.run(1, 'Maya', 'Beautiful board. The <b>typing feel is excellent</b> and it works perfectly with Linux.', 5, new Date(Date.now() - 86400000 * 12).toISOString());
  insertReview.run(1, 'Rahul', 'Arrived quickly and the packaging was excellent.', 4, new Date(Date.now() - 86400000 * 7).toISOString());
  insertReview.run(2, 'Nina', 'The noise cancellation is very good on a busy train.', 5, new Date(Date.now() - 86400000 * 4).toISOString());
  insertReview.run(4, 'Owen', 'Does exactly what I needed. The pass-through charging is useful.', 4, new Date(Date.now() - 86400000 * 2).toISOString());

  db.prepare('INSERT INTO transfers (from_user, to_user, amount, created_at) VALUES (?, ?, ?, ?)')
    .run('alice', 'bob', 120, new Date(Date.now() - 86400000 * 9).toISOString());
}

export function resetDatabase() {
  seedDatabase();
}

seedDatabase();
