/**
 * Seed script — inserts the 25 existing trivia questions + 6 default gifts
 * into the database.
 *
 * Run with: bun run db:seed
 * Or: tsx prisma/seed-trivia.ts
 */

import { db } from "../src/lib/db";

const QUESTIONS = [
  // BEGINNERS — FULL BIBLE (10 questions)
  { q: "Who created the heavens and the earth?", opts: ["Adam", "Noah", "God", "Moses"], ans: 2, exp: "Genesis 1:1 — In the beginning God created the heavens and the earth.", diff: "beginners", cat: "full_bible", book: "Genesis", topic: "Creation" },
  { q: "Who was the first man?", opts: ["Abraham", "Adam", "Noah", "David"], ans: 1, exp: "Genesis 2:7 — The Lord God formed man from the dust of the ground.", diff: "beginners", cat: "full_bible", book: "Genesis", topic: "Creation" },
  { q: "Who built the ark?", opts: ["Abraham", "Moses", "Noah", "David"], ans: 2, exp: "Genesis 6:14 — Make yourself an ark of cypress wood.", diff: "beginners", cat: "full_bible", book: "Genesis", topic: "Flood" },
  { q: "How many days did God take to create the world?", opts: ["5", "6", "7", "10"], ans: 1, exp: "Genesis 2:2 — By the seventh day God had finished the work he had been doing.", diff: "beginners", cat: "full_bible", book: "Genesis", topic: "Creation" },
  { q: "Who was thrown into the lions' den?", opts: ["Daniel", "David", "Elijah", "Joseph"], ans: 0, exp: "Daniel 6:16 — Daniel was brought and thrown into the den of lions.", diff: "beginners", cat: "full_bible", book: "Daniel", topic: "Faith" },
  { q: "Who parted the Red Sea?", opts: ["Joshua", "Aaron", "Moses", "Elijah"], ans: 2, exp: "Exodus 14:21 — Moses stretched out his hand over the sea.", diff: "beginners", cat: "full_bible", book: "Exodus", topic: "Exodus" },
  { q: "What is the first book of the Bible?", opts: ["Exodus", "Genesis", "Leviticus", "Matthew"], ans: 1, exp: "Genesis is the first book of the Bible.", diff: "beginners", cat: "full_bible", book: null, topic: "Bible Facts" },
  { q: "Who killed Goliath?", opts: ["Saul", "Jonathan", "David", "Samuel"], ans: 2, exp: "1 Samuel 17:50 — David triumphed over the Philistine with a sling and a stone.", diff: "beginners", cat: "full_bible", book: "1 Samuel", topic: "David" },
  { q: "Where was Jesus born?", opts: ["Nazareth", "Bethlehem", "Jerusalem", "Capernaum"], ans: 1, exp: "Matthew 2:1 — Jesus was born in Bethlehem of Judea.", diff: "beginners", cat: "full_bible", book: "Matthew", topic: "Jesus Life" },
  { q: "Who betrayed Jesus?", opts: ["Peter", "Judas", "Thomas", "James"], ans: 1, exp: "Matthew 26:14 — Judas Iscariot went to the chief priests.", diff: "beginners", cat: "full_bible", book: "Matthew", topic: "Jesus Passion" },

  // INTERMEDIATE — NEW TESTAMENT (7 questions)
  { q: "How many beatitudes are in the Sermon on the Mount?", opts: ["7", "8", "9", "10"], ans: 1, exp: "Matthew 5:3-10 lists 8 beatitudes.", diff: "intermediate", cat: "new_testament", book: "Matthew", topic: "Teachings of Jesus" },
  { q: "Who was the tax collector that climbed the sycamore tree?", opts: ["Matthew", "Zacchaeus", "Levi", "Bartimaeus"], ans: 1, exp: "Luke 19:4 — Zacchaeus climbed a sycamore tree to see Jesus.", diff: "intermediate", cat: "new_testament", book: "Luke", topic: "Jesus Ministry" },
  { q: "What was Paul's original name?", opts: ["Stephen", "Saul", "Silas", "Simon"], ans: 1, exp: "Acts 9:4 — Saul (later renamed Paul) encountered Jesus on the road to Damascus.", diff: "intermediate", cat: "new_testament", book: "Acts", topic: "Paul" },
  { q: "Which apostle denied Jesus three times?", opts: ["John", "Peter", "Andrew", "Judas"], ans: 1, exp: "Luke 22:54-62 — Peter denied Jesus three times before the rooster crowed.", diff: "intermediate", cat: "new_testament", book: "Luke", topic: "Jesus Passion" },
  { q: "Who walked on water with Jesus?", opts: ["John", "Peter", "James", "Andrew"], ans: 1, exp: "Matthew 14:29 — Peter stepped out of the boat and walked on water toward Jesus.", diff: "intermediate", cat: "new_testament", book: "Matthew", topic: "Jesus Miracles" },
  { q: "What is the first miracle of Jesus recorded in John?", opts: ["Healing a leper", "Turning water into wine", "Feeding 5000", "Walking on water"], ans: 1, exp: "John 2:1-11 — Jesus turned water into wine at the wedding in Cana.", diff: "intermediate", cat: "new_testament", book: "John", topic: "Jesus Miracles" },
  { q: "Which gospel is the shortest?", opts: ["Matthew", "Mark", "Luke", "John"], ans: 1, exp: "Mark is the shortest of the four gospels, with 16 chapters.", diff: "intermediate", cat: "new_testament", book: null, topic: "Bible Facts" },

  // SKILLED — OLD TESTAMENT (5 questions)
  { q: "How many sons did Jacob have?", opts: ["10", "11", "12", "13"], ans: 2, exp: "Genesis 35:22-26 — Jacob had 12 sons who became the 12 tribes of Israel.", diff: "skilled", cat: "old_testament", book: "Genesis", topic: "Patriarchs" },
  { q: "Who succeeded Moses as leader of Israel?", opts: ["Aaron", "Joshua", "Caleb", "Samuel"], ans: 1, exp: "Deuteronomy 34:9 — Joshua son of Nun was filled with the spirit of wisdom.", diff: "skilled", cat: "old_testament", book: "Deuteronomy", topic: "Conquest" },
  { q: "What was the name of Ruth's mother-in-law?", opts: ["Orpah", "Naomi", "Hannah", "Esther"], ans: 1, exp: "Ruth 1:4 — Naomi was the mother-in-law of Ruth and Orpah.", diff: "skilled", cat: "old_testament", book: "Ruth", topic: "Ruth" },
  { q: "Which king built the first temple in Jerusalem?", opts: ["David", "Solomon", "Hezekiah", "Josiah"], ans: 1, exp: "1 Kings 6 — Solomon built the temple in Jerusalem over 7 years.", diff: "skilled", cat: "old_testament", book: "1 Kings", topic: "Temple" },
  { q: "How many years did the Israelites wander in the wilderness?", opts: ["20", "30", "40", "50"], ans: 2, exp: "Numbers 14:33 — Your children will be shepherds here for forty years.", diff: "skilled", cat: "old_testament", book: "Numbers", topic: "Exodus" },

  // EXPERT — APOLOGETICS (3 questions)
  { q: "Which argument states that 'everything that begins to exist has a cause'?", opts: ["Teleological", "Cosmological", "Moral", "Ontological"], ans: 1, exp: "The Cosmological Argument (Kalam version) states: Everything that begins to exist has a cause; the universe began to exist; therefore the universe has a cause.", diff: "expert", cat: "apologetics", book: null, topic: "God's Existence" },
  { q: "How many Greek manuscripts of the New Testament exist (approx.)?", opts: ["~500", "~1,500", "~5,800", "~10,000"], ans: 2, exp: "There are approximately 5,800 Greek manuscripts of the New Testament, far more than any other ancient text.", diff: "expert", cat: "apologetics", book: null, topic: "Bible Reliability" },
  { q: "Which scientist proposed the Big Bang theory?", opts: ["Isaac Newton", "Albert Einstein", "Georges Lemaître", "Stephen Hawking"], ans: 2, exp: "Georges Lemaître, a Catholic priest and physicist, first proposed what became the Big Bang theory in 1927.", diff: "expert", cat: "apologetics", book: null, topic: "Science & Faith" },
];

const GIFTS = [
  { giftId: "g1", title: "CrossCrafted T-Shirt", description: "Premium cotton tee with the CrossCrafted logo. Available in S, M, L, XL.", imageUrl: "https://images.unsplash.com/photo-1438032005730-c779502df39b?crop=entropy&cs=srgb&fm=jpg&w=400&q=80", pointsRequired: 3000, tier: "bronze", stock: 50 },
  { giftId: "g2", title: "Personalized Bible (ESV)", description: "English Standard Version Bible with your name embossed. Genuine leather.", imageUrl: "https://images.unsplash.com/photo-1546484959-f9a381d1330d?crop=entropy&cs=srgb&fm=jpg&w=400&q=80", pointsRequired: 5000, tier: "silver", stock: 20 },
  { giftId: "g3", title: "Olive Wood Cross from Bethlehem", description: "Hand-carved olive wood cross from Bethlehem. Certificate of authenticity.", imageUrl: "https://images.unsplash.com/photo-1565728744382-61accd4aa148?crop=entropy&cs=srgb&fm=jpg&w=400&q=80", pointsRequired: 10000, tier: "gold", stock: 10 },
  { giftId: "g4", title: "Premium T-Shirt OR Phone Cover", description: "Choose a premium CrossCrafted t-shirt OR a custom phone cover.", imageUrl: "https://images.unsplash.com/photo-1438032005730-c779502df39b?crop=entropy&cs=srgb&fm=jpg&w=400&q=80", pointsRequired: 20000, tier: "gold", stock: 30 },
  { giftId: "g5", title: "Premium T-Shirt + Phone Cover", description: "Both the premium t-shirt AND a custom phone cover — bundled together.", imageUrl: "https://images.unsplash.com/photo-1520637836862-4d197d17c91a?crop=entropy&cs=srgb&fm=jpg&w=400&q=80", pointsRequired: 30000, tier: "platinum", stock: 15 },
  { giftId: "g6", title: "Premium Merchandise Bundle", description: "Complete bundle: t-shirt, phone cover, Bible cover, and devotional book.", imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?crop=entropy&cs=srgb&fm=jpg&w=400&q=80", pointsRequired: 50000, tier: "platinum", stock: 5 },
];

async function seed() {
  console.log("🌱 Seeding trivia questions...");

  for (let i = 0; i < QUESTIONS.length; i++) {
    const q = QUESTIONS[i];
    const questionId = `q${i + 1}`;
    const basePoints = q.diff === "beginners" ? 10 : q.diff === "intermediate" ? 20 : q.diff === "skilled" ? 30 : 50;

    await db.triviaQuestion.upsert({
      where: { questionId },
      create: {
        questionId,
        question: q.q,
        options: JSON.stringify(q.opts),
        correctAnswer: q.ans,
        explanation: q.exp,
        scriptureReference: q.book ? `${q.book}` : null,
        difficulty: q.diff,
        category: q.cat,
        bibleBook: q.book,
        topic: q.topic,
        basePoints,
      },
      update: {},
    });
  }
  console.log(`✅ Seeded ${QUESTIONS.length} questions`);

  console.log("🎁 Seeding gifts...");
  for (const g of GIFTS) {
    await db.gift.upsert({
      where: { giftId: g.giftId },
      create: {
        giftId: g.giftId,
        title: g.title,
        description: g.description,
        imageUrl: g.imageUrl,
        pointsRequired: g.pointsRequired,
        tier: g.tier,
        stock: g.stock,
      },
      update: {},
    });
  }
  console.log(`✅ Seeded ${GIFTS.length} gifts`);

  console.log("\n📋 Summary:");
  console.log(`   Questions: ${QUESTIONS.length}`);
  console.log(`     - Beginners/Full Bible: 10`);
  console.log(`     - Intermediate/New Testament: 7`);
  console.log(`     - Skilled/Old Testament: 5`);
  console.log(`     - Expert/Apologetics: 3`);
  console.log(`   Gifts: ${GIFTS.length}`);
  console.log(`\n✨ Seed complete!`);
}

seed()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
