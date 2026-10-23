// ALL editable storefront content lives here (texts, links, sections). Plain data — safe to import anywhere.
export interface SectionDef {
  title: string;
  category?: string;
  q?: string;
  kind?: "newest" | "random";
}
export interface NavLink {
  label: string;
  href: string;
}
export interface NavMenu {
  /** Hand-written link columns (optional). */
  columns?: { title: string; links: NavLink[] }[];
  /** Category word(s) for the 4 featured books in the dropdown ("" = newest books). Leave out for no books. */
  featured?: string;
  /** Build the link sections from your book categories, e.g. "Arabic" or "Aqeeda|Aqidah". */
  auto?: string;
  /** Show the Authors menu (top authors, by century, by school). */
  authors?: boolean;
}
export interface NavItem {
  label: string;
  href: string;
  active?: boolean;
  menu?: NavMenu;
}

export interface HeroSlide {
  /** Full-bleed banner image (optional). If empty, a text slide is drawn from title/subtitle/text. */
  image: string | null;
  title: string;
  subtitle: string;
  text: string;
  href: string;
  /** Optional cover/product image shown on the right of a text slide */
  bookImage: string | null;
}

export const site = {
    /** Privacy-friendly visit statistics (Cloudflare Web Analytics). Paste your site token to switch it on; empty = no analytics at all. */
  analytics: { cloudflareToken: "" },
  /** Pop-up that offers a discount for joining the newsletter. Create the same code in Admin → Discounts (for example WELCOME10 = 10% off). */
  newsletterPopup: { enabled: true, delaySeconds: 12, percent: 10, code: "WELCOME10" },
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Ahlul Ilm Books",
  country: "United States",
    announcements: ["WORLDWIDE SHIPPING WITH USPS", "FAST PROCESSING GUARANTEED"],
  language: "ENGLISH",
  currencyLabel: "$ USD",

    /** Top menu. Items with `menu` open a dropdown. Edit labels and links freely. */
    nav: [
    { label: "NEW RELEASES", href: "/shop?sort=new", active: true, menu: { columns: [{ title: "Browse", links: [{ label: "New releases", href: "/shop?sort=new" }, { label: "All books", href: "/shop" }] }], featured: "" } },
    { label: "AUTHORS", href: "/shop", menu: { authors: true } },
    { label: "ARABIC", href: "/shop?category=Arabic", menu: { auto: "Arabic", featured: "Arabic" } },
    { label: "QURAN & TAFSIR", href: "/shop?category=Quran|Tafsir", menu: { auto: "Quran|Tafsir|Tafseer", featured: "Tafsir|Quran" } },
    { label: "AQEEDA", href: "/shop?category=Aqeeda|Aqidah", menu: { auto: "Aqeeda|Aqidah", featured: "Aqeeda|Aqidah" } },
    { label: "FIQH", href: "/shop?category=Fiqh", menu: { auto: "Fiqh", featured: "Fiqh" } },
    { label: "HADEETH", href: "/shop?category=Hadeeth|Hadith", menu: { auto: "Hadeeth|Hadith", featured: "Hadeeth|Hadith" } },
    // To add a menu: copy a line above, change the label and the category word(s) in href / auto / featured.
  ] as NavItem[],

  /** Centuries/areas offered when you edit an author (Admin → author page). Order here = order in the menu. */
  authorEras: [
    "The 1st and 2nd centuries",
    "The 3rd century",
    "4th century",
    "5th century",
    "6th century",
    "7th century",
    "8th century",
    "9th & 10th centuries",
    "From 11th to 13th centuries",
    "14th century",
    "15th century",
    "Contemporaries",
  ],
  /** Groups for the "in thematic order" part of the Authors menu. */
  authorTags: [
    { key: "hadith", label: "Scholars of Hadith" },
    { key: "tafsir", label: "Imams of Tafsir" },
    { key: "hanafi", label: "Hanafi scholars" },
    { key: "shafii", label: "Shafii scholars" },
    { key: "maliki", label: "Maliki scholars" },
    { key: "hanbali", label: "Hanbali scholars" },
  ],

    /** Home banners (the text is already inside the images). Add or remove slides freely. */
  hero: [
    { image: "/assets/hero-1.png", title: "Majmu' Fatawa Shaykh al-Islam Ibn Taymiyyah 1-37 Volume", subtitle: "", text: "", href: "/shop?q=Majmu", bookImage: null },
    { image: "/assets/hero-2.png", title: "Takhrij Majmu' Fatawa Shaykh al-Islam Ibn Taymiyyah 1-6 volume", subtitle: "", text: "", href: "/shop?q=Takhrij", bookImage: null },
    { image: "/assets/hero-3.png", title: "Majmu' Fatawa Shaykh al-Islam Ibn Taymiyyah 1-37 Volume", subtitle: "", text: "", href: "/shop?q=Majmu", bookImage: null },
    { image: "/assets/hero-4.png", title: "Shaykh al-Islam Ibn Taymiyyah is now out!", subtitle: "", text: "", href: "/shop?q=Taymiyyah", bookImage: null },
  ] as HeroSlide[],

  /** Book carousels. `category` matches books whose Category contains it. Falls back to newest books if nothing matches. */
    /** How often things change. */
  rotation: {
    sectionsHours: 24, // the two book carousels swap topics (use 30 if you prefer)
    promosHours: 12, // the two DISCOVER boxes show different books
  },

  /**
   * Pool of carousel topics. Each day the site picks two that have at least 3 books.
   *  - category: books whose Category contains this word ("a|b" = either)
   *  - q: books whose title/author contains this word
   *  - kind: "newest" or "random"
   * For a discount row: add the word Discount to those books' Category.
   */
  sectionPool: [
    { title: "SPECIALIZED TAFSIRS: FIQH, LANGUAGE, TADABBUR", category: "Tafsir" },
    { title: "USUL AL-FIQH FOR EVERY LEVEL", category: "Usul" },
    { title: "FIQH CORNERSTONES FROM EVERY MADHHAB", category: "Fiqh" },
    { title: "IBN TAYMIYYAH BOOKS", q: "Taymiyyah" },
    { title: "IBN AL-QAYYIM BOOKS", q: "Qayyim" },
    { title: "AQEEDAH ESSENTIALS", category: "Aqeeda|Aqidah" },
    { title: "HADITH COLLECTIONS & EXPLANATIONS", category: "Hadeeth|Hadith" },
    { title: "LEARN ARABIC", category: "Arabic" },
    { title: "DISCOUNT BOOKS", category: "Discount" },
    { title: "NEW ARRIVALS", kind: "newest" },
    { title: "WORTH A LOOK TODAY", kind: "random" },
  ] as SectionDef[],

  promos: [
    {
      title: "Al-Nahw al-Saghir – Sulayman al-'Uyuni",
      text: "Four layers of Nahw in one volume: Matn, Nadhm, Fath, Sharh. King Salman Award laureate in Arabic language.",
      button: "DISCOVER",
      href: "/shop?q=Nahw",
      image: "/assets/promo-1.png" as string | null,
    },
    {
      title: "Awwal Marrah Atadabbaru al-Qu-ran",
      text: "A bestseller across the Arabian Peninsula, written for first-time Tadabbur.",
      button: "DISCOVER",
      href: "/shop?q=Tadabbur",
      image: "/assets/promo-2.png" as string | null,
    },
  ],

  linkButtons: [
    // listed top-to-bottom: left column first, then right column
    { label: "Kitab at-Tawhid explanations", href: "/shop?q=Tawhid" },
    { label: "Al-Aqidah al-Wasitiyyah explanations", href: "/shop?q=Wasitiyyah" },
    { label: "Kitab at-Tawhid explanations", href: "/shop?q=Tawhid" },
    { label: "Usul ath-Thalatha explanations", href: "/shop?q=Thalatha" },
    { label: "Kitab at-Tawhid explanations", href: "/shop?q=Tawhid" },
    { label: "Usul ath-Thalatha explanations", href: "/shop?q=Thalatha" },
  ],

  contact: {
    heading: ["FOR MORE INFORMATIONS,", "CONTACT US !"],
    text: [
      "Explore our extensive collection of Arabic Islamic books, carefully curated for scholars, students, and enthusiasts.",
      "Contact us for personalized recommendations or inquiries—we’re here to support your journey in Islamic knowledge!",
    ],
    button: "CONTACT FORM",
    /** Set CONTACT_EMAIL in your environment (or edit here). */
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contact@example.com",
  },

  statsHeading: ["YOUR ARABIC ISLAMIC BOOK", "SPECIALISTS"],
  stats: [
    { icon: "/assets/icon-year.png", value: "1 Year", label: "Of Trade!" },
    { icon: "/assets/icon-books.png", value: "50+", label: "Books Sold" },
    { icon: "/assets/icon-world.png", value: "5+ Countries", label: "Already Delivered" },
    { icon: "/assets/icon-stars.png", value: "4.7", label: "Out Of 5 Rating" },
  ],

  newsletter: {
    heading: "SUBSCRIBE TO OUR NEWSLETTER",
    note: "YOU MAY UNSUBSCRIBE AT ANY MOMENT. FOR THAT PURPOSE, PLEASE FIND OUR CONTACT INFO IN THE LEGAL NOTICE.",
  },

  footer: {
    /** Leave address empty ("") to hide it. */
    address: process.env.NEXT_PUBLIC_ADDRESS ?? "",
    deliver: "WE DELIVER WORLDWIDE !",
    social: { instagram: "https://www.instagram.com/", tiktok: "https://www.tiktok.com/" } as Record<string, string>,
    /** e.g. { score: "4,8" } to show the green star rating row. Leave null unless it is a real rating you can show. */
    rating: { score: "4,8" } as null | { score: string },
    columns: [
      {
        title: "CUSTOMER SUPPORT",
        links: [
          { label: "Contact us", href: "/contact" },
          { label: "Shipping information", href: "/p/shipping-information" },
          { label: "Returns & refunds", href: "/p/returns-and-refunds" },
          { label: "FAQ", href: "/p/faq" },
        ],
      },
      {
        title: "INFORMATION",
        links: [
          { label: "About Us", href: "/p/about-us" },
          { label: "Privacy policy", href: "/p/privacy-policy" },
          { label: "Terms of Sale", href: "/p/terms-of-sale" },
          { label: "Sitemap", href: "/p/sitemap" },
        ],
      },
      {
        title: "MY ACCOUNT",
        links: [
          { label: "My account", href: "/account" },
          { label: "Wishlist", href: "/wishlist" },
          { label: "Purchase history", href: "/account#orders" },
          { label: "Track an order", href: "/account#track" },
        ],
      },
    ],
    aboutTitle: "Your Arabic Islamic book specialists, 100% online",
    aboutText:
      "We are an online Muslim bookstore specializing in Islamic books in Arabic. We offer a wide choice of titles to learn and improve your Arabic, as well as works by the early scholars and contemporary authors on Aqeedah, Tafseer, Hadith, Fiqh and the Prophet’s biography, across the four schools of thought. We deliver Arabic books worldwide to beginners, students and scholars of religious science.",
    copyright: `© ${process.env.NEXT_PUBLIC_SITE_NAME ?? "Ahlul Ilm Books"} - ${new Date().getFullYear()}. All rights reserved.`,
  },
};

/** Static info pages used by the footer links, until real designs/content exist. */
export const infoPages: Record<string, string> = {
  "contact-us": "Contact us",
  "shipping-information": "Shipping information",
  "returns-and-refunds": "Returns & refunds",
  faq: "FAQ",
  "about-us": "About Us",
  "privacy-policy": "Privacy policy",
  "terms-of-sale": "Terms of Sale",
  sitemap: "Sitemap",
  login: "Login",
  registration: "Registration",
  "my-account": "My account",
  wishlist: "Wishlist",
  "purchase-history": "Purchase history",
};
