// CrossCrafted — Sample Data
// All data is seeded locally; no backend required.

export type Church = {
  id: string;
  name: string;
  description: string;
  state: string;
  city: string;
  location: string;
  service_times: string;
  languages: string[];
  followers_count: number;
  cover_gradient: number;
  status: "verified" | "pending";
  denomination: string;
};

export type EventItem = {
  id: string;
  title: string;
  description: string;
  date: string; // ISO
  end_date?: string;
  state: string;
  city: string;
  location: string;
  languages: string[];
  category: string;
  is_online: boolean;
  is_free: boolean;
  price: number;
  attendees: number;
  cover_gradient: number;
  church: string;
};

export type PrayerPost = {
  id: string;
  title: string;
  content: string;
  category: string;
  author: string;
  is_anonymous: boolean;
  pray_count: number;
  comment_count: number;
  created_at: string;
};

export type ApologeticsPost = {
  id: string;
  title: string;
  body: string;
  author: string;
  topic: string;
  date: string;
  likes: number;
  comments: number;
  cover_gradient: number;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  mrp: number;
  category: string;
  vendor: string;
  city: string;
  rating: number;
  reviews: number;
  cover_gradient: number;
  in_stock: boolean;
};

export type TriviaQuestion = {
  id: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  points: number;
  difficulty: "beginners" | "intermediate" | "skilled" | "expert";
  category: "full_bible" | "new_testament" | "old_testament" | "apologetics";
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

export const INDIAN_STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat",
  "Haryana", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha",
  "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal",
];

export const LANGUAGES = [
  "Hindi", "English", "Tamil", "Telugu", "Malayalam",
  "Kannada", "Marathi", "Gujarati", "Punjabi", "Bengali", "Odia",
];

export const CHURCH_GRADIENTS = [
  "linear-gradient(135deg, #A855F7, #3B82F6)",
  "linear-gradient(135deg, #EC4899, #A855F7)",
  "linear-gradient(135deg, #3B82F6, #6366F1)",
  "linear-gradient(135deg, #F97316, #EC4899)",
  "linear-gradient(135deg, #6366F1, #A855F7)",
  "linear-gradient(135deg, #22C55E, #3B82F6)",
  "linear-gradient(135deg, #F59E0B, #EF4444)",
  "linear-gradient(135deg, #14B8A6, #6366F1)",
];

export const EVENT_CATEGORIES = [
  { value: "worship", label: "Worship Service", color: "#EC4899" },
  { value: "bible-study", label: "Bible Study", color: "#6366F1" },
  { value: "conference", label: "Conference", color: "#F59E0B" },
  { value: "retreat", label: "Retreat", color: "#10B981" },
  { value: "youth", label: "Youth Event", color: "#3B82F6" },
  { value: "concert", label: "Concert", color: "#F43F5E" },
  { value: "prayer", label: "Prayer Meeting", color: "#A855F7" },
  { value: "outreach", label: "Outreach", color: "#8B5CF6" },
] as const;

export const QUIZ_LEVELS = [
  { id: "beginners", label: "Beginners", points: 10, color: "#22C55E", icon: "🌱", description: "New to Bible study" },
  { id: "intermediate", label: "Intermediate", points: 20, color: "#3B82F6", icon: "📖", description: "Regular Bible reader" },
  { id: "skilled", label: "Skilled", points: 30, color: "#A855F7", icon: "🎓", description: "Deep Bible knowledge" },
  { id: "expert", label: "Expert", points: 50, color: "#EF4444", icon: "🏆", description: "Theology scholar level" },
] as const;

export const QUIZ_CATEGORIES = [
  { id: "full_bible", label: "Full Bible", color: "#A855F7", icon: "BookOpen" },
  { id: "new_testament", label: "New Testament", color: "#3B82F6", icon: "Cross" },
  { id: "old_testament", label: "Old Testament", color: "#F59E0B", icon: "Scroll" },
  { id: "apologetics", label: "Apologetics", color: "#EF4444", icon: "Shield" },
] as const;

export const PRIZE_TIERS = [
  { minPoints: 0, title: "Faith Seeker", icon: "🌱", reward: "Welcome badge" },
  { minPoints: 100, title: "Bible Student", icon: "📖", reward: "Profile badge + 1 free church listing" },
  { minPoints: 500, title: "Spiritual Disciple", icon: "✝️", reward: "Featured profile + 3 church listings" },
  { minPoints: 1500, title: "Bible Teacher", icon: "🎓", reward: "Verified badge + priority event listing" },
  { minPoints: 3000, title: "Theology Scholar", icon: "🏆", reward: "Expert badge + free business listing" },
  { minPoints: 5000, title: "Word Warrior", icon: "⚔️", reward: "Champion badge + featured on homepage" },
  { minPoints: 10000, title: "Bible Master", icon: "👑", reward: "Master badge + admin recognition" },
] as const;

export const APOLOGETICS_TOPICS = [
  { id: "gods_existence", label: "God's Existence", color: "#A855F7" },
  { id: "problem_of_evil", label: "Problem of Evil", color: "#EF4444" },
  { id: "resurrection", label: "Resurrection", color: "#22C55E" },
  { id: "bible_reliability", label: "Bible Reliability", color: "#3B82F6" },
  { id: "science_faith", label: "Science & Faith", color: "#F59E0B" },
  { id: "world_religions", label: "World Religions", color: "#EC4899" },
] as const;

export const PRAYER_CATEGORIES = [
  "All", "Healing", "Family", "Guidance", "Thanksgiving", "Salvation", "Provision",
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// CHURCHES
// ─────────────────────────────────────────────────────────────────────────────

export const CHURCHES: Church[] = [
  {
    id: "c1",
    name: "Grace City Church",
    description:
      "A vibrant multi-generational community passionate about Jesus, authentic worship, and reaching the city with the gospel. We meet every Sunday with dedicated ministries for kids, youth, and young adults.",
    state: "Karnataka",
    city: "Bengaluru",
    location: "Indiranagar, 100 Feet Road",
    service_times: "Sun 9AM & 11AM · Wed 7PM",
    languages: ["English", "Kannada", "Hindi"],
    followers_count: 1240,
    cover_gradient: 0,
    status: "verified",
    denomination: "Non-denominational",
  },
  {
    id: "c2",
    name: "New Life Fellowship",
    description:
      "A Spirit-filled church family where everyone belongs. We focus on Bible teaching, Spirit-led worship, and serving the poor in our city through practical outreach every weekend.",
    state: "Maharashtra",
    city: "Mumbai",
    location: "Bandra West, Hill Road",
    service_times: "Sun 8AM, 10AM & 6PM · Fri 7:30PM",
    languages: ["English", "Hindi", "Marathi"],
    followers_count: 2180,
    cover_gradient: 1,
    status: "verified",
    denomination: "Pentecostal",
  },
  {
    id: "c3",
    name: "Bethel AG Church",
    description:
      "A historic Assemblies of God congregation with a heart for missions, healing, and discipleship. Building strong families and equipping saints for service since 1965.",
    state: "Tamil Nadu",
    city: "Chennai",
    location: "T. Nagar, Pondy Bazaar",
    service_times: "Sun 7AM, 9:30AM & 6PM · Tue 7PM",
    languages: ["English", "Tamil"],
    followers_count: 3420,
    cover_gradient: 2,
    status: "verified",
    denomination: "Assemblies of God",
  },
  {
    id: "c4",
    name: "Covenant Community Church",
    description:
      "Reformed in theology, charismatic in practice. We are a church planting church that values expository preaching, deep community, and joyful worship.",
    state: "Telangana",
    city: "Hyderabad",
    location: "Jubilee Hills, Road No. 36",
    service_times: "Sun 9AM & 11:30AM · Wed 7:15PM",
    languages: ["English", "Telugu"],
    followers_count: 980,
    cover_gradient: 3,
    status: "verified",
    denomination: "Reformed",
  },
  {
    id: "c5",
    name: "Zion Mar Thoma Church",
    description:
      "A traditional Malankara Mar Thoma congregation blending liturgical worship with Spirit-filled preaching. Active youth ministry, Sunday school, and outreach to local villages.",
    state: "Kerala",
    city: "Kochi",
    location: "Edappally, NH 66",
    service_times: "Sun 6:30AM & 9AM · Fri 7PM",
    languages: ["Malayalam", "English"],
    followers_count: 1675,
    cover_gradient: 4,
    status: "verified",
    denomination: "Mar Thoma",
  },
  {
    id: "c6",
    name: "Delhi Bible Chapel",
    description:
      "An open Brethren assembly committed to the authority of Scripture, weekly remembrance meeting, and expository Bible teaching. Warm fellowship, simple worship, no paid clergy.",
    state: "Delhi",
    city: "New Delhi",
    location: "Saket, District Centre",
    service_times: "Sun 9:30AM · Wed 7:30PM",
    languages: ["English", "Hindi"],
    followers_count: 540,
    cover_gradient: 5,
    status: "pending",
    denomination: "Brethren",
  },
  {
    id: "c7",
    name: "Calvary Baptist Church",
    description:
      "An old-school Baptist congregation holding to believer's baptism, regenerate church membership, and expositional preaching. Strong Sunday school, missions focus, and community care.",
    state: "Punjab",
    city: "Ludhiana",
    location: "Model Town, Gurmandi Road",
    service_times: "Sun 10AM & 6PM · Thu 7PM",
    languages: ["English", "Punjabi", "Hindi"],
    followers_count: 720,
    cover_gradient: 6,
    status: "verified",
    denomination: "Baptist",
  },
  {
    id: "c8",
    name: "Living Hope Church",
    description:
      "A young plant church in the heart of the city. Casual, contemporary, and gospel-centered. We exist to make disciples who make disciples — come as you are.",
    state: "Karnataka",
    city: "Bengaluru",
    location: "Koramangala, 5th Block",
    service_times: "Sun 10:30AM · Wed 7:30PM",
    languages: ["English"],
    followers_count: 410,
    cover_gradient: 7,
    status: "pending",
    denomination: "Non-denominational",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EVENTS
// ─────────────────────────────────────────────────────────────────────────────

const inDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

export const EVENTS: EventItem[] = [
  {
    id: "e1",
    title: "Awakening Night of Worship",
    description:
      "Join 1,000+ believers for an unforgettable night of Spirit-led worship, prayer, and a powerful message on revival. Featuring the Grace City Worship team and guest speaker Pastor Philip Cherian.",
    date: inDays(3),
    end_date: inDays(3),
    state: "Karnataka",
    city: "Bengaluru",
    location: "Palace Grounds, Main Hall",
    languages: ["English"],
    category: "worship",
    is_online: false,
    is_free: true,
    price: 0,
    attendees: 740,
    cover_gradient: 0,
    church: "Grace City Church",
  },
  {
    id: "e2",
    title: "Romans: A 6-Week Bible Study",
    description:
      "Deep dive into Paul's masterpiece letter to the Romans. Verse-by-verse teaching, small group discussion, and weekly reflection assignments. All materials provided.",
    date: inDays(7),
    state: "Maharashtra",
    city: "Mumbai",
    location: "New Life Fellowship, Main Auditorium",
    languages: ["English", "Hindi"],
    category: "bible-study",
    is_online: false,
    is_free: true,
    price: 0,
    attendees: 180,
    cover_gradient: 1,
    church: "New Life Fellowship",
  },
  {
    id: "e3",
    title: "Rooted Youth Conference 2025",
    description:
      "Three days of teaching, worship, sports, and friendship for ages 13–19. Theme: 'Rooted in Christ' from Colossians 2. Speaker: Pastor Samuel Thomas. Registration includes meals and accommodation.",
    date: inDays(14),
    end_date: inDays(16),
    state: "Tamil Nadu",
    city: "Chennai",
    location: "Bethel Campus, Tambaram",
    languages: ["English", "Tamil"],
    category: "conference",
    is_online: false,
    is_free: false,
    price: 1500,
    attendees: 420,
    cover_gradient: 2,
    church: "Bethel AG Church",
  },
  {
    id: "e4",
    title: "Silent Retreat: Hearing God",
    description:
      "A 2-day silent retreat focused on prayer, journaling, and listening to God. Limited to 30 participants. Meals provided. No phones in common areas — a true digital detox for the soul.",
    date: inDays(21),
    end_date: inDays(23),
    state: "Telangana",
    city: "Hyderabad",
    location: "Covenant Retreat Center, Shamirpet",
    languages: ["English"],
    category: "retreat",
    is_online: false,
    is_free: false,
    price: 2200,
    attendees: 22,
    cover_gradient: 3,
    church: "Covenant Community Church",
  },
  {
    id: "e5",
    title: "Live Stream: Sunday Worship",
    description:
      "Can't make it in person? Join us online for our weekly Sunday service — live worship, sermon, and chat-based prayer requests. Available on YouTube and our website.",
    date: inDays(2),
    state: "Kerala",
    city: "Kochi",
    location: "Online — YouTube Live",
    languages: ["Malayalam", "English"],
    category: "livestream",
    is_online: true,
    is_free: true,
    price: 0,
    attendees: 1200,
    cover_gradient: 4,
    church: "Zion Mar Thoma Church",
  },
  {
    id: "e6",
    title: "City-Wide Prayer Gathering",
    description:
      "Believers from across the city uniting in prayer for revival, the nation, and the persecuted church. Bring a friend. Worship led by a combined city worship team.",
    date: inDays(5),
    state: "Delhi",
    city: "New Delhi",
    location: "Delhi Bible Chapel Grounds",
    languages: ["English", "Hindi"],
    category: "prayer",
    is_online: false,
    is_free: true,
    price: 0,
    attendees: 290,
    cover_gradient: 5,
    church: "Delhi Bible Chapel",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PRAYER POSTS
// ─────────────────────────────────────────────────────────────────────────────

export const PRAYERS: PrayerPost[] = [
  {
    id: "p1",
    title: "Healing for my mother's cancer treatment",
    content:
      "My mother was diagnosed with stage 3 breast cancer last month. She starts chemo next week. Please pray for complete healing, strength for the journey, and peace for our family. We trust Jehovah Rapha, the Lord who heals.",
    category: "Healing",
    author: "Rebecca Thomas",
    is_anonymous: false,
    pray_count: 142,
    comment_count: 28,
    created_at: inDays(-2),
  },
  {
    id: "p2",
    title: "Job interview — guidance needed",
    content:
      "I have a final-round interview on Friday for a role I've been praying about for 6 months. Please pray for clarity, peace, and God's will to be done — whether this is the door He's opening or closing.",
    category: "Guidance",
    author: "Anonymous",
    is_anonymous: true,
    pray_count: 89,
    comment_count: 12,
    created_at: inDays(-1),
  },
  {
    id: "p3",
    title: "Salvation for my husband",
    content:
      "After 12 years of marriage, my husband still hasn't accepted Christ. He's respectful of my faith but hasn't taken the step himself. Pray that the Holy Spirit would soften his heart and that my life would be a faithful witness.",
    category: "Salvation",
    author: "Grace Sharma",
    is_anonymous: false,
    pray_count: 234,
    comment_count: 45,
    created_at: inDays(-3),
  },
  {
    id: "p4",
    title: "Thanksgiving — baby girl born safely!",
    content:
      "After two miscarriages and 4 years of waiting, God has blessed us with a healthy baby girl, Sarah! She was born yesterday at 3.2kg. Both mother and baby are doing well. Praise God for His faithfulness — He is the God who sees.",
    category: "Thanksgiving",
    author: "Daniel & Esther Kumar",
    is_anonymous: false,
    pray_count: 412,
    comment_count: 96,
    created_at: inDays(-1),
  },
  {
    id: "p5",
    title: "Provision — rent due, no income",
    content:
      "I lost my job 2 months ago. Rent is due in 5 days and I have nothing left. Praying for Jehovah Jireh, the Lord who provides. Even if He doesn't send money, I trust Him to make a way. Please pray for strength and faith.",
    category: "Provision",
    author: "Anonymous",
    is_anonymous: true,
    pray_count: 318,
    comment_count: 67,
    created_at: inDays(-2),
  },
  {
    id: "p6",
    title: "Restoration of marriage",
    content:
      "My wife and I have been separated for 4 months. There's been infidelity and a lot of hurt. I'm believing God for supernatural restoration of our marriage and healing of our hearts. Please stand with me in prayer.",
    category: "Family",
    author: "Joseph Isaac",
    is_anonymous: false,
    pray_count: 196,
    comment_count: 38,
    created_at: inDays(-4),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// APOLOGETICS POSTS
// ─────────────────────────────────────────────────────────────────────────────

export const APOLOGETICS_POSTS: ApologeticsPost[] = [
  {
    id: "a1",
    title: "How do we know God exists?",
    body: "The existence of God can be argued through multiple lines of reasoning: the cosmological argument (everything that begins to exist has a cause, therefore the universe has a cause), the teleological argument (the fine-tuning of physical constants points to a Designer), the moral argument (objective moral values require a moral lawgiver), and personal experience (millions throughout history have experienced God's presence in transformative ways). No single argument is conclusive on its own, but together they form a powerful cumulative case.",
    author: "Dr. William Craig",
    topic: "gods_existence",
    date: "2025-01-15",
    likes: 142,
    comments: 28,
    cover_gradient: 0,
  },
  {
    id: "a2",
    title: "Why does God allow suffering?",
    body: "The problem of evil is one of the most challenging questions in philosophy of religion. Several responses have been offered: (1) Free Will Defense — God allows evil because He values genuine free will; without the possibility of choosing evil, love and goodness would be meaningless. (2) Soul-Making Theodicy — Suffering produces virtues like courage, compassion, and patience that cannot exist without adversity. (3) Greater Good — Some evils may be necessary for greater goods we cannot yet see. (4) Eternal Perspective — This life is temporary; eternal justice will be served and every tear wiped away.",
    author: "Pastor Ravi Zacharias",
    topic: "problem_of_evil",
    date: "2025-01-12",
    likes: 98,
    comments: 45,
    cover_gradient: 1,
  },
  {
    id: "a3",
    title: "Evidence for the Resurrection of Jesus",
    body: "The resurrection is supported by: (1) The empty tomb — even opponents acknowledged it; they claimed the disciples stole the body, which admits the tomb was empty. (2) Post-resurrection appearances to over 500 witnesses, many still alive when the New Testament was written (1 Cor 15:6). (3) The sudden transformation of the disciples from fearful cowards (who fled at Jesus' arrest) to bold preachers willing to die for their testimony. (4) The origin of the Christian faith itself, which began in Jerusalem — the very city where Jesus was publicly executed — where it could have been easily falsified. (5) The early creeds in 1 Corinthians 15, dated within years of the event.",
    author: "Dr. Gary Habermas",
    topic: "resurrection",
    date: "2025-01-10",
    likes: 210,
    comments: 36,
    cover_gradient: 2,
  },
  {
    id: "a4",
    title: "Is the Bible historically reliable?",
    body: "The Bible's historical reliability is supported by: (1) Manuscript evidence — over 5,800 Greek manuscripts of the New Testament, far more than any other ancient text (compare: Homer's Iliad has 643). (2) Archaeological confirmation — numerous discoveries (e.g. the Pool of Bethesda, the Cyrus Cylinder, the Tel Dan Stele) validate biblical accounts. (3) Internal consistency — 66 books by 40+ authors over 1,500 years with a unified message of redemption. (4) Fulfilled prophecy — hundreds of specific prophecies fulfilled in detail, including the place of Jesus' birth (Micah 5:2), His betrayal price (Zech 11:12), and His crucifixion (Psalm 22).",
    author: "Dr. Norman Geisler",
    topic: "bible_reliability",
    date: "2025-01-08",
    likes: 167,
    comments: 22,
    cover_gradient: 3,
  },
  {
    id: "a5",
    title: "Can science and faith coexist?",
    body: "Science and faith are not inherently in conflict. Many of history's greatest scientists were people of faith — Newton (physics), Pascal (mathematics), Faraday (electromagnetism), Mendel (genetics), Kepler (astronomy). Science answers 'how' questions about the natural world (mechanism), while faith addresses 'why' questions about meaning and purpose (agency). The Big Bang theory itself was proposed by a Catholic priest, Georges Lemaître. The fine-tuning of physical constants (gravity, electromagnetism, cosmological constant) continues to point beyond mere chance to a Designer.",
    author: "Dr. John Lennox",
    topic: "science_faith",
    date: "2025-01-05",
    likes: 185,
    comments: 31,
    cover_gradient: 4,
  },
  {
    id: "a6",
    title: "What makes Christianity unique among world religions?",
    body: "Christianity is unique in several key ways: (1) Grace over works — salvation is a gift received by faith, not earned through rituals or karma. (2) God became human — the incarnation, where the Creator entered His creation, is unique to Christianity. (3) A verified resurrection — no other religion claims its founder rose from the dead with multiple eyewitness testimony. (4) A personal God — God is relational and loving, not distant or unknowable. (5) Falsifiable claims — Christianity makes historical claims that can be investigated, not just philosophical assertions.",
    author: "Dr. Tim Keller",
    topic: "world_religions",
    date: "2025-01-02",
    likes: 156,
    comments: 42,
    cover_gradient: 5,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────

export const PRODUCTS: Product[] = [
  {
    id: "pr1",
    name: "ESV Study Bible (Hardcover)",
    description:
      "The English Standard Version Study Bible with 20,000+ study notes, 50+ articles, 200+ charts, and full-color maps. The most comprehensive study Bible available.",
    price: 1299,
    mrp: 1899,
    category: "Bibles",
    vendor: "Word of Life Books",
    city: "Bengaluru",
    rating: 4.8,
    reviews: 234,
    cover_gradient: 0,
    in_stock: true,
  },
  {
    id: "pr2",
    name: "Handcrafted Olive Wood Cross",
    description:
      "Beautifully carved olive wood cross from Bethlehem, the birthplace of Jesus. Each piece is unique due to the natural grain. Comes with a certificate of authenticity.",
    price: 899,
    mrp: 1499,
    category: "Gifts",
    vendor: "Holy Land Crafts",
    city: "Mumbai",
    rating: 4.9,
    reviews: 156,
    cover_gradient: 1,
    in_stock: true,
  },
  {
    id: "pr3",
    name: "Worship Album: 'Awake My Soul'",
    description:
      "12 original worship songs by the Grace City Worship team. Recorded live. Includes chord charts and lyric sheets. Streaming + CD bundle.",
    price: 399,
    mrp: 599,
    category: "Music",
    vendor: "Grace City Music",
    city: "Bengaluru",
    rating: 4.7,
    reviews: 89,
    cover_gradient: 2,
    in_stock: true,
  },
  {
    id: "pr4",
    name: "Faith Over Fear — Christian Tee",
    description:
      "Premium 100% cotton t-shirt with 'Faith Over Fear' screen-printed design. Unisex fit. Available in black, white, and navy. Sizes S–XXL.",
    price: 599,
    mrp: 899,
    category: "Apparel",
    vendor: "CrossThread Co.",
    city: "Chennai",
    rating: 4.6,
    reviews: 178,
    cover_gradient: 3,
    in_stock: true,
  },
  {
    id: "pr5",
    name: "Devotional: 'My Utmost for His Highest'",
    description:
      "Oswald Chambers' timeless daily devotional, now in a beautiful leather-bound edition with ribbon marker. 365 days of depth and challenge.",
    price: 499,
    mrp: 799,
    category: "Books",
    vendor: "Word of Life Books",
    city: "Bengaluru",
    rating: 4.9,
    reviews: 412,
    cover_gradient: 4,
    in_stock: true,
  },
  {
    id: "pr6",
    name: "Leather Journal — His Mercies",
    description:
      "Hand-stitched genuine leather journal with 'His mercies are new every morning' embossed on the cover. 240 unlined pages. Perfect for prayer journaling.",
    price: 749,
    mrp: 1199,
    category: "Gifts",
    vendor: "Holy Land Crafts",
    city: "Mumbai",
    rating: 4.8,
    reviews: 67,
    cover_gradient: 5,
    in_stock: false,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TRIVIA QUESTIONS
// ─────────────────────────────────────────────────────────────────────────────

export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  // BEGINNERS — FULL BIBLE
  {
    id: "q1",
    question: "Who created the heavens and the earth?",
    options: ["Adam", "Noah", "God", "Moses"],
    answer: 2,
    explanation: "Genesis 1:1 — In the beginning God created the heavens and the earth.",
    points: 10,
    difficulty: "beginners",
    category: "full_bible",
  },
  {
    id: "q2",
    question: "Who was the first man?",
    options: ["Abraham", "Adam", "Noah", "David"],
    answer: 1,
    explanation: "Genesis 2:7 — The Lord God formed man from the dust of the ground.",
    points: 10,
    difficulty: "beginners",
    category: "full_bible",
  },
  {
    id: "q3",
    question: "Who built the ark?",
    options: ["Abraham", "Moses", "Noah", "David"],
    answer: 2,
    explanation: "Genesis 6:14 — Make yourself an ark of cypress wood.",
    points: 10,
    difficulty: "beginners",
    category: "full_bible",
  },
  {
    id: "q4",
    question: "How many days did God take to create the world?",
    options: ["5", "6", "7", "10"],
    answer: 1,
    explanation: "Genesis 2:2 — By the seventh day God had finished the work he had been doing.",
    points: 10,
    difficulty: "beginners",
    category: "full_bible",
  },
  {
    id: "q5",
    question: "Who was thrown into the lions' den?",
    options: ["Daniel", "David", "Elijah", "Joseph"],
    answer: 0,
    explanation: "Daniel 6:16 — Daniel was brought and thrown into the den of lions.",
    points: 10,
    difficulty: "beginners",
    category: "full_bible",
  },
  {
    id: "q6",
    question: "Who parted the Red Sea?",
    options: ["Joshua", "Aaron", "Moses", "Elijah"],
    answer: 2,
    explanation: "Exodus 14:21 — Moses stretched out his hand over the sea.",
    points: 10,
    difficulty: "beginners",
    category: "full_bible",
  },
  {
    id: "q7",
    question: "What is the first book of the Bible?",
    options: ["Exodus", "Genesis", "Leviticus", "Matthew"],
    answer: 1,
    explanation: "Genesis is the first book of the Bible.",
    points: 10,
    difficulty: "beginners",
    category: "full_bible",
  },
  {
    id: "q8",
    question: "Who killed Goliath?",
    options: ["Saul", "Jonathan", "David", "Samuel"],
    answer: 2,
    explanation: "1 Samuel 17:50 — David triumphed over the Philistine with a sling and a stone.",
    points: 10,
    difficulty: "beginners",
    category: "full_bible",
  },
  {
    id: "q9",
    question: "Where was Jesus born?",
    options: ["Nazareth", "Bethlehem", "Jerusalem", "Capernaum"],
    answer: 1,
    explanation: "Matthew 2:1 — Jesus was born in Bethlehem of Judea.",
    points: 10,
    difficulty: "beginners",
    category: "full_bible",
  },
  {
    id: "q10",
    question: "Who betrayed Jesus?",
    options: ["Peter", "Judas", "Thomas", "James"],
    answer: 1,
    explanation: "Matthew 26:14 — Judas Iscariot went to the chief priests.",
    points: 10,
    difficulty: "beginners",
    category: "full_bible",
  },

  // INTERMEDIATE — NEW TESTAMENT
  {
    id: "q11",
    question: "How many beatitudes are in the Sermon on the Mount?",
    options: ["7", "8", "9", "10"],
    answer: 1,
    explanation: "Matthew 5:3-10 lists 8 beatitudes (Blessed are the poor in spirit...).",
    points: 20,
    difficulty: "intermediate",
    category: "new_testament",
  },
  {
    id: "q12",
    question: "Who was the tax collector that climbed the sycamore tree?",
    options: ["Matthew", "Zacchaeus", "Levi", "Bartimaeus"],
    answer: 1,
    explanation: "Luke 19:4 — Zacchaeus climbed a sycamore tree to see Jesus.",
    points: 20,
    difficulty: "intermediate",
    category: "new_testament",
  },
  {
    id: "q13",
    question: "What was Paul's original name?",
    options: ["Stephen", "Saul", "Silas", "Simon"],
    answer: 1,
    explanation: "Acts 9:4 — Saul (later renamed Paul) encountered Jesus on the road to Damascus.",
    points: 20,
    difficulty: "intermediate",
    category: "new_testament",
  },
  {
    id: "q14",
    question: "Which apostle denied Jesus three times?",
    options: ["John", "Peter", "Andrew", "Judas"],
    answer: 1,
    explanation: "Luke 22:54-62 — Peter denied Jesus three times before the rooster crowed.",
    points: 20,
    difficulty: "intermediate",
    category: "new_testament",
  },
  {
    id: "q15",
    question: "Who walked on water with Jesus?",
    options: ["John", "Peter", "James", "Andrew"],
    answer: 1,
    explanation: "Matthew 14:29 — Peter stepped out of the boat and walked on water toward Jesus.",
    points: 20,
    difficulty: "intermediate",
    category: "new_testament",
  },
  {
    id: "q16",
    question: "What is the first miracle of Jesus recorded in John?",
    options: ["Healing a leper", "Turning water into wine", "Feeding 5000", "Walking on water"],
    answer: 1,
    explanation: "John 2:1-11 — Jesus turned water into wine at the wedding in Cana.",
    points: 20,
    difficulty: "intermediate",
    category: "new_testament",
  },
  {
    id: "q17",
    question: "Which gospel is the shortest?",
    options: ["Matthew", "Mark", "Luke", "John"],
    answer: 1,
    explanation: "Mark is the shortest of the four gospels, with 16 chapters.",
    points: 20,
    difficulty: "intermediate",
    category: "new_testament",
  },

  // SKILLED — OLD TESTAMENT
  {
    id: "q18",
    question: "How many sons did Jacob have?",
    options: ["10", "11", "12", "13"],
    answer: 2,
    explanation: "Genesis 35:22-26 — Jacob had 12 sons who became the 12 tribes of Israel.",
    points: 30,
    difficulty: "skilled",
    category: "old_testament",
  },
  {
    id: "q19",
    question: "Who succeeded Moses as leader of Israel?",
    options: ["Aaron", "Joshua", "Caleb", "Samuel"],
    answer: 1,
    explanation: "Deuteronomy 34:9 — Joshua son of Nun was filled with the spirit of wisdom.",
    points: 30,
    difficulty: "skilled",
    category: "old_testament",
  },
  {
    id: "q20",
    question: "What was the name of Ruth's mother-in-law?",
    options: ["Orpah", "Naomi", "Hannah", "Esther"],
    answer: 1,
    explanation: "Ruth 1:4 — Naomi was the mother-in-law of Ruth and Orpah.",
    points: 30,
    difficulty: "skilled",
    category: "old_testament",
  },
  {
    id: "q21",
    question: "Which king built the first temple in Jerusalem?",
    options: ["David", "Solomon", "Hezekiah", "Josiah"],
    answer: 1,
    explanation: "1 Kings 6 — Solomon built the temple in Jerusalem over 7 years.",
    points: 30,
    difficulty: "skilled",
    category: "old_testament",
  },
  {
    id: "q22",
    question: "How many years did the Israelites wander in the wilderness?",
    options: ["20", "30", "40", "50"],
    answer: 2,
    explanation: "Numbers 14:33 — Your children will be shepherds here for forty years.",
    points: 30,
    difficulty: "skilled",
    category: "old_testament",
  },

  // EXPERT — APOLOGETICS
  {
    id: "q23",
    question: "Which argument states that 'everything that begins to exist has a cause'?",
    options: ["Teleological", "Cosmological", "Moral", "Ontological"],
    answer: 1,
    explanation: "The Cosmological Argument (Kalam version) states: Everything that begins to exist has a cause; the universe began to exist; therefore the universe has a cause.",
    points: 50,
    difficulty: "expert",
    category: "apologetics",
  },
  {
    id: "q24",
    question: "How many Greek manuscripts of the New Testament exist (approx.)?",
    options: ["~500", "~1,500", "~5,800", "~10,000"],
    answer: 2,
    explanation: "There are approximately 5,800 Greek manuscripts of the New Testament, far more than any other ancient text.",
    points: 50,
    difficulty: "expert",
    category: "apologetics",
  },
  {
    id: "q25",
    question: "Which scientist proposed the Big Bang theory?",
    options: ["Isaac Newton", "Albert Einstein", "Georges Lemaître", "Stephen Hawking"],
    answer: 2,
    explanation: "Georges Lemaître, a Catholic priest and physicist, first proposed what became the Big Bang theory in 1927.",
    points: 50,
    difficulty: "expert",
    category: "apologetics",
  },
];

export const MOCK_LEADERBOARD = [
  { name: "Rebecca Thomas", points: 8420, rank: 1, tier: "Word Warrior" },
  { name: "Philip Cherian", points: 6150, rank: 2, tier: "Word Warrior" },
  { name: "Grace Sharma", points: 4320, rank: 3, tier: "Theology Scholar" },
  { name: "Daniel Kumar", points: 2800, rank: 4, tier: "Theology Scholar" },
  { name: "Esther Raj", points: 1650, rank: 5, tier: "Bible Teacher" },
  { name: "Samuel Mathew", points: 980, rank: 6, tier: "Bible Student" },
  { name: "Ruth Philip", points: 520, rank: 7, tier: "Spiritual Disciple" },
  { name: "Joshua Isaac", points: 280, rank: 8, tier: "Bible Student" },
];

export const DAILY_VERSES = [
  {
    verse: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.",
    reference: "Philippians 4:6",
    reflection: "No matter how big or small your request, God cares for you. Sharing your heart with Him and your brothers and sisters in Christ brings peace that transcends understanding.",
  },
  {
    verse: "Therefore confess your sins to each other and pray for each other so that you may be healed. The prayer of a righteous person is powerful and effective.",
    reference: "James 5:16",
    reflection: "Fellowship isn't just about sharing good times; it's about lifting each other's burdens. When we pray together, God moves in extraordinary ways.",
  },
  {
    verse: "For where two or three gather in my name, there am I with them.",
    reference: "Matthew 18:20",
    reflection: "We are never alone in our faith. Even online, when we unite our spirits in prayer, Jesus Christ is right here in our midst, coordinating grace.",
  },
  {
    verse: "Be joyful in hope, patient in affliction, faithful in prayer.",
    reference: "Romans 12:12",
    reflection: "Prayer is not a last resort, but our first response. Maintain steady faith and support each other through seasons of waiting and transformation.",
  },
];
