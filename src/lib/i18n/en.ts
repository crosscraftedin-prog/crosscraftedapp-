// English (base) — all UI strings that should be translated.
//
// Naming convention:
//   section.subsection.label  (e.g. "nav.bible", "signin.title")
//
// Adding a new key here means adding it to every language file. If a key
// is missing in a translation file, the i18n hook falls back to English.
// If it's missing in English too, it returns the key itself.

export const en: Record<string, string> = {
  // ─── Branding ───
  "brand.name": "Believ",
  "brand.tagline": "Believe. Connect. Grow.",

  // ─── Landing hero ───
  "landing.badge": "Faith Community Platform",
  "landing.title": "Believ",
  "landing.titleGradient": "Grow in Faith, Together",
  "landing.subtitle":
    "Your all-in-one Christian community platform — Bible trivia, apologetics, church directory, marketplace, and more. Built to strengthen faith and connect believers across India.",
  "landing.cta.readBible": "Read the Bible",
  "landing.cta.tryTrivia": "Try Trivia",
  "landing.stats.questions": "Quiz Questions",
  "landing.stats.tiers": "Prize Tiers",
  "landing.stats.languages": "Languages",
  "landing.stats.free": "Free",
  "landing.stats.toUse": "To Use",

  // ─── Bible section ───
  "bible.badge": "The Holy Bible",
  "bible.title": "Read God's Word Daily",
  "bible.subtitle":
    "All 66 books, in KJV and WEB translations. Search any verse by keyword, bookmark favorites, and follow daily reading plans — Bible in 90 Days, Gospels in 14 Days, Psalms & Proverbs in 31 Days.",
  "bible.stat.books": "66 Books",
  "bible.stat.booksSub": "39 OT · 27 NT",
  "bible.stat.translations": "2 Translations",
  "bible.stat.translationsSub": "KJV · WEB",
  "bible.stat.plans": "4 Plans",
  "bible.stat.plansSub": "14 – 90 days",
  "bible.stat.langs": "11 Langs",
  "bible.stat.langsSub": "Indian UIs",
  "bible.cta.open": "Open the Bible",
  "bible.cta.plans": "Browse Reading Plans",
  "bible.cta.free": "Free · Works offline after first read",

  // ─── Features section ───
  "features.title": "Everything for Your Faith Journey",
  "features.subtitle":
    "From Bible quizzes to church listings, everything a Christian community needs — in one place.",
  "feature.bible.title": "Holy Bible",
  "feature.bible.desc":
    "Read the entire Bible — all 66 books — in KJV or WEB translation. Search by keyword, bookmark verses, and follow daily reading plans. Available in 11 Indian language UIs.",
  "feature.trivia.title": "Bible Trivia Challenge",
  "feature.trivia.desc":
    "Test your Bible knowledge across 4 difficulty levels — Beginners, Intermediate, Skilled, Expert. Choose Full Bible, New Testament, Old Testament, or Apologetics. Earn Faith Points for new questions, unlock rewards, and compete with other churches!",
  "feature.churches.title": "Church Directory",
  "feature.churches.desc":
    "Find churches across India filtered by state, city, and language. Follow churches, see service times, and connect with local congregations near you.",
  "feature.listChurch.title": "List Your Church",
  "feature.listChurch.desc":
    "Add your church to our directory and help believers find a community. Include service times, denomination, location, and contact details.",
  "feature.marketplace.title": "Marketplace",
  "feature.marketplace.desc":
    "List your Christian business or shop & sell items — Bibles, books, music, apparel, and more. Connect with buyers via WhatsApp. No payment gateway needed.",
  "feature.prayer.title": "Prayer Wall",
  "feature.prayer.desc":
    "Share prayer requests and encourage one another in faith. A community space for lifting up needs and praising God for answered prayers.",

  // ─── Trivia section ───
  "trivia.badge": "Bible Trivia Challenge",
  "trivia.title": "How Well Do You Know the Bible?",
  "trivia.subtitle": "4 difficulty levels, 4 categories, growing question pool, Faith Points and real rewards",
  "trivia.cta.start": "Start Challenge",
  "trivia.cta.free": "Free to play. Earn badges and recognition",

  // ─── Languages section ───
  "languages.title": "Available in Indian Languages",

  // ─── CTA section ───
  "cta.title": "\"Iron sharpens iron\"",
  "cta.subtitle":
    "Join the Believ community — explore churches, test your Bible knowledge, list your business, and grow in faith together.",
  "cta.button": "Enter Believ",

  // ─── Header nav ───
  "nav.bible": "Bible",
  "nav.churches": "Churches",
  "nav.trivia": "Trivia",
  "nav.prayer": "Prayer Wall",
  "nav.shop": "Marketplace",
  "nav.events": "Events",
  "nav.enterApp": "Enter App",
  "nav.admin": "Admin",

  // ─── Sign-in page ───
  "signin.title": "Believ",
  "signin.subtitle": "Believe. Connect. Grow. — Sign in to track your Faith Points",
  "signin.google": "Continue with Google",
  "signin.google.loading": "Redirecting...",
  "signin.divider.signin": "or sign in with email",
  "signin.divider.signup": "or sign up with email",
  "signin.email": "Email",
  "signin.emailPlaceholder": "you@example.com",
  "signin.password": "Password",
  "signin.passwordPlaceholder": "Your password",
  "signin.passwordSignupPlaceholder": "At least 6 characters",
  "signin.name": "Name (optional)",
  "signin.namePlaceholder": "Your name",
  "signin.submit.signin": "Sign in",
  "signin.submit.signup": "Create account",
  "signin.submit.signinLoading": "Signing in...",
  "signin.submit.signupLoading": "Creating account...",
  "signin.toggle.toSignup": "Don't have an account?",
  "signin.toggle.toSignupLink": "Sign up",
  "signin.toggle.toSignin": "Already have an account?",
  "signin.toggle.toSigninLink": "Sign in",
  "signin.back": "← Back to home",
  "signin.fpBanner.title": "Faith Points",
  "signin.fpBanner.desc":
    "Sign in to earn and track Faith Points securely. Your points are stored server-side — no more localStorage farming!",
  "signin.error.invalid": "Please enter your email and password.",
  "signin.error.shortPassword": "Password must be at least 6 characters.",
  "signin.error.default": "Something went wrong. Please try again.",
  "signin.info.confirmEmail":
    "Check your inbox — we sent you a confirmation link. Click it to verify your email, then sign in.",

  // ─── Header user section ───
  "user.fpoints": "FP",
  "user.signIn": "Sign In",
  "user.signOut": "Sign out",

  // ─── Admin tabs ───
  "admin.tab.dashboard": "Dashboard",
  "admin.tab.churches": "Churches",
  "admin.tab.events": "Events",
  "admin.tab.marketplace": "Marketplace",
  "admin.tab.prayers": "Prayers",
  "admin.tab.apologetics": "Apologetics",
  "admin.tab.competitions": "Competitions",
  "admin.tab.announcements": "Announcements",
  "admin.tab.redemptions": "Redemptions",
  "admin.tab.analytics": "Analytics",

  // ─── Trivia view ───
  "triviaView.title": "Bible Trivia",
  "triviaView.verified": "Verified: {points} FP",
  "triviaView.signInPrompt": "Sign in to earn Faith Points",
  "triviaView.tab.play": "Play",
  "triviaView.tab.compete": "Compete",
  "triviaView.tab.rewards": "Rewards",
  "triviaView.tab.leaderboard": "Leaderboard",
  "triviaView.tab.stats": "Stats",

  // ─── Rewards tab ───
  "rewards.header": "Real Gifts",
  "rewards.available": "Available to redeem",
  "rewards.signInPrompt": "Sign in to view your points",
  "rewards.signInRequired": "Sign in to redeem gifts. Your claims persist across devices.",
  "rewards.signInButton": "Sign In",
  "rewards.button.redeem": "Redeem",
  "rewards.button.pickAndRedeem": "Pick & Redeem",
  "rewards.button.claimed": "✓ Claimed",
  "rewards.button.claiming": "Claiming...",
  "rewards.button.signIn": "Sign in",
  "rewards.button.outOfStock": "Out of stock",
  "rewards.button.moreFP": "{points} more FP",
  "rewards.optionsBadge": "{count} options",
  "rewards.claimed.label": "Claimed",
  "rewards.orderSummary": "Order Summary",
  "rewards.orderSummary.detail": "{title} · {variations}",
  "rewards.orderSummary.disclaimer": "{points} FP will be deducted. Admin will contact you on WhatsApp.",
  "rewards.redeemButton": "Redeem for {points} FP",
  "rewards.cancel": "Cancel",
  "rewards.specifications": "Specifications",
  "rewards.claimSuccess.title": "Claimed: {title}!",
  "rewards.claimSuccess.desc": "Admin will contact you via WhatsApp. {variations} Points spent: {points} FP.",

  // ─── Marketplace ───
  "marketplace.title": "Marketplace",
  "marketplace.subtitle": "Bibles, books, music & more",
  "marketplace.cart": "Cart",
  "marketplace.listItem": "List Item",
  "marketplace.search": "Search products...",
  "marketplace.contactSeller": "Contact Seller",
  "marketplace.addToCart": "Add to Cart",
  "marketplace.wishlist": "Wishlist",
  "marketplace.empty": "No products found.",
  "marketplace.outOfStock": "Out of Stock",
  "marketplace.optionBadge": "{count} options",
  "marketplace.specifications": "Specifications",
  "marketplace.vendor": "Vendor",
  "marketplace.save": "Save ₹{amount}",
  "marketplace.discount": "-{percent}%",

  // ─── Common UI ───
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.edit": "Edit",
  "common.delete": "Delete",
  "common.add": "Add",
  "common.loading": "Loading...",
  "common.error": "Something went wrong",
  "common.retry": "Try again",
  "common.close": "Close",
  "common.confirm": "Confirm",
  "common.back": "Back",
  "common.next": "Next",
  "common.previous": "Previous",

  // ─── Language switcher ───
  "language.switch": "Switch language",
  "language.current": "Current language",
};

export default en;
