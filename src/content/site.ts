// ALL editable storefront content lives here (texts, links, sections). Plain data — safe to import anywhere.
export interface NavLink {
  label: string;
  href: string;
}
export interface NavMenu {
  columns: { title: string; links: NavLink[] }[];
  /** Category keyword for the 4 featured books in the dropdown. "" = newest books. */
  featured?: string;
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
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Ahlul Ilm Books",
  country: "United States",
    announcements: ["WORLDWIDE SHIPPING WITH USPS", "FAST PROCESSING GUARANTEED"],
  language: "ENGLISH",
  currencyLabel: "$ USD",

    /** Top menu. Items with `menu` open a dropdown. Edit labels and links freely. */
  nav: [
    {
      label: "NEW RELEASES",
      href: "/shop?sort=new",
      active: true,
      menu: {
        columns: [{ title: "Browse", links: [{ label: "New releases", href: "/shop?sort=new" }, { label: "All books", href: "/shop" }] }],
        featured: "",
      },
    },
    {
      label: "AUTHORS",
      href: "/shop",
      menu: {
        columns: [
          {
            title: "Top authors",
            links: [
              { label: "Ibn Taymiyyah", href: "/shop?q=Taymiyyah" },
              { label: "Ibn al-Qayyim", href: "/shop?q=Qayyim" },
              { label: "Ibn al-Jawzi", href: "/shop?q=Jawzi" },
              { label: "Al-Uthaymin", href: "/shop?q=Uthaymin" },
              { label: "Ibn Baz", href: "/shop?q=Baz" },
            ],
          },
        ],
        featured: "",
      },
    },
    {
      label: "ARABIC",
      href: "/shop?category=Arabic",
      menu: {
        columns: [
          { title: "Learn Arabic", links: [{ label: "Grammar (Nahw)", href: "/shop?q=Nahw" }, { label: "Morphology (Sarf)", href: "/shop?q=Sarf" }, { label: "Dictionaries", href: "/shop?q=Dictionary" }] },
          { title: "Literature", links: [{ label: "Poetry (Diwan)", href: "/shop?q=Diwan" }, { label: "Rhetoric (Balaghah)", href: "/shop?q=Balaghah" }] },
        ],
        featured: "Arabic",
      },
    },
    {
      label: "QURAN & TAFSIR",
      href: "/shop?category=Quran|Tafsir",
      menu: {
        columns: [
          { title: "Tafsir", links: [{ label: "Complete tafsir", href: "/shop?q=Tafsir" }, { label: "Quranic sciences", href: "/shop?q=Quranic" }] },
          { title: "Quran", links: [{ label: "Mushaf", href: "/shop?q=Mushaf" }, { label: "Tajwid & recitation", href: "/shop?q=Tajwid" }] },
        ],
        featured: "Tafsir",
      },
    },
    {
      label: "AQEEDA",
      href: "/shop?category=Aqeeda",
      menu: {
        columns: [{ title: "Aqidah", links: [{ label: "Tawhid", href: "/shop?q=Tawhid" }, { label: "Names & attributes", href: "/shop?q=Sifat" }, { label: "Explanations of texts", href: "/shop?q=Sharh" }] }],
        featured: "Aqeeda",
      },
    },
    {
      label: "FIQH",
      href: "/shop?category=Fiqh",
      menu: {
        columns: [
          { title: "Schools", links: [{ label: "Hanafi", href: "/shop?q=Hanafi" }, { label: "Maliki", href: "/shop?q=Maliki" }, { label: "Shafi'i", href: "/shop?q=Shafi" }, { label: "Hanbali", href: "/shop?q=Hanbali" }] },
          { title: "Topics", links: [{ label: "Usul al-Fiqh", href: "/shop?q=Usul" }, { label: "Fatawa", href: "/shop?q=Fatawa" }] },
        ],
        featured: "Fiqh",
      },
    },
    {
      label: "HADEETH",
      href: "/shop?category=Hadeeth|Hadith",
      menu: {
        columns: [{ title: "Hadith", links: [{ label: "Collections", href: "/shop?q=Sahih" }, { label: "Explanations (Sharh)", href: "/shop?q=Sharh" }, { label: "Hadith sciences", href: "/shop?q=Mustalah" }] }],
        featured: "Hadeeth|Hadith",
      },
    },
  ] as NavItem[],

  hero: [
    {
      image: "/assets/hero-1.jpg",
      title: "Kitab al-'Adhamah",
      subtitle: "al-Asbahani (369H)",
      text: "A 4th-century Aqidah classic on Allah's Lordship, Names and Attributes, finely authenticated.",
      href: "/shop?q=Adhamah",
      bookImage: null,
    },
  ] as HeroSlide[],

  /** Book carousels. `category` matches books whose Category contains it. Falls back to newest books if nothing matches. */
  sections: [
    { title: "SPECIALIZED TAFSIRS: FIQH, LANGUAGE, TADABBUR", category: "Tafsir", limit: 10 },
    { title: "USUL AL-FIQH FOR EVERY LEVEL", category: "Usul", limit: 10 },
  ],

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
    social: { facebook: "#", x: "#", instagram: "#" },
    /** e.g. { score: "4,8" } to show the green star rating row. Leave null unless it is a real rating you can show. */
    rating: null as null | { score: string },
    columns: [
      {
        title: "CUSTOMER SUPPORT",
        links: [
          { label: "Contact us", href: "/p/contact-us" },
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
          { label: "Login", href: "/p/login" },
          { label: "Registration", href: "/p/registration" },
          { label: "My account", href: "/p/my-account" },
          { label: "Wishlist", href: "/p/wishlist" },
          { label: "Purchase history", href: "/p/purchase-history" },
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
