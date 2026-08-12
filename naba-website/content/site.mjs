/**
 * NABA NGO — single source of truth for all site content (English + Arabic).
 *
 * REVIEW NOTES FOR THE FOUNDER
 * ----------------------------
 * Every string carrying a number, a partner name, or a translated sentence is
 * marked with one of:
 *   REVIEW:   founder should confirm the wording/number before publishing.
 *   TRANSLATION: Arabic drafted by Claude — needs a native review pass.
 *   TODO:     a fact we do not have yet (see OPEN_QUESTIONS at the bottom).
 *
 * Arabic program titles that already exist in NABA's materials are used
 * verbatim and must NOT be re-translated:
 *   صحتك بالدنيا · حمايتنا أونلاين · نساء الورد · ورد جوري
 */

export const SITE = {
  domain: "naba.ngo",
  url: "https://naba.ngo",
  // Displayed in all caps everywhere, per brand direction.
  nameEn: "NABA NGO",
  nameAr: "جمعية نبا",
  foundingYear: 2023,
  // Official Lebanese registration (علم وخبر) number and the year it was granted.
  registration: { number: "217", year: 2026 },
  email: "naba.beqaa@gmail.com",
  phones: [
    // REVIEW(founder): this is the number printed on the NABA roll-up banner.
    { display: "+961 76 890 159", tel: "+96176890159", wa: "96176890159" },
    { display: "+961 71 824 884", tel: "+96171824884", wa: "96171824884" },
    { display: "+961 70 980 245", tel: "+96170980245", wa: "96170980245" },
  ],
  // Tapping a number opens a WhatsApp chat straight to NABA.
  whatsappEnabled: true,
  social: {
    instagram: "https://www.instagram.com/naba_organization/",
    linkedin: "https://www.linkedin.com/in/naba-ngo-baa0ab325/",
    // TODO(founder): the banner lists Facebook "Naba Qasarnaba" — paste the page
    // URL here and it appears in the footer and in the sameAs structured data.
    facebook: null,
  },
  location: {
    en: "Qasarnaba, Bekaa Valley, Baalbek District, Lebanon",
    ar: "قصرنبا، سهل البقاع، قضاء بعلبك، لبنان",
    // Exact coordinates of the NABA premises, supplied by the founder.
    lat: 33.898709,
    lng: 35.9958,
    coordsAreApproximate: false,
  },
  // Cloudflare Web Analytics — paste the token from the Cloudflare dashboard.
  // Leave null to omit the beacon entirely.
  cfAnalyticsToken: null,
  // Static-form backend. Replace with the real Formspree form IDs once created
  // at https://formspree.io (free tier). Until then forms render in a disabled
  // state with an explanatory note instead of silently dropping submissions.
  // REVIEW(founder): Formspree vs. a Cloudflare Pages Function — see README.
  forms: {
    provider: "formspree",
    contactEndpoint: null, // e.g. "https://formspree.io/f/xxxxxxxx"
    volunteerEndpoint: null,
  },
};

export const LANGS = {
  en: { code: "en", dir: "ltr", label: "English", other: "ar", otherLabel: "العربية" },
  ar: { code: "ar", dir: "rtl", label: "العربية", other: "en", otherLabel: "English" },
};

/** Navigation order drives the header, footer and sitemap. */
export const NAV = [
  { slug: "", en: "Home", ar: "الرئيسية" },
  { slug: "about", en: "About", ar: "من نحن" },
  { slug: "programs", en: "Programs", ar: "برامجنا" },
  { slug: "impact", en: "Impact", ar: "أثرنا" },
  { slug: "team", en: "Team", ar: "فريقنا" },
  { slug: "gallery", en: "Gallery", ar: "معرض الصور" },
  { slug: "news", en: "News", ar: "أخبارنا" },
  { slug: "get-involved", en: "Get Involved", ar: "شارك معنا" },
  { slug: "contact", en: "Contact", ar: "تواصل معنا" },
];

/* ------------------------------------------------------------------ *
 * Programs
 * ------------------------------------------------------------------ */

export const PROGRAMS = [
  {
    id: "outreach",
    status: "active",
    en: {
      title: "Digital Awareness & Community Outreach",
      tag: "Ongoing",
      summary:
        "NABA's earliest work: digital awareness campaigns, volunteer coordination, and the design work that carries community messages across Qasarnaba and the surrounding Bekaa villages.",
      body: [
        "Before NABA ran classrooms and camps, it ran campaigns. Volunteers write, design and distribute awareness material on the issues families in the Bekaa are actually living with, and coordinate the people who deliver it.",
        "This strand still underpins everything else we do: it is how programs are announced, how participants are recruited, and how findings travel back out to the wider community.",
      ],
    },
    ar: {
      // TRANSLATION: drafted, needs founder review.
      title: "التوعية الرقمية والتواصل المجتمعي",
      tag: "مستمر",
      summary:
        "أولى أنشطة جمعية نبا: حملات التوعية الرقمية، وتنسيق المتطوعين، والأعمال التصميمية التي تنقل رسائل المجتمع في قصرنبا وقرى البقاع المجاورة.",
      body: [
        "قبل أن تدير نبا الصفوف والمخيمات، كانت تدير الحملات. يكتب المتطوعون ويصممون ويوزعون موادّ توعوية حول القضايا التي تعيشها العائلات في البقاع فعلياً، وينسّقون عمل من يوصلها إلى الناس.",
        "لا يزال هذا المسار أساساً لكل ما نقوم به: به يُعلَن عن البرامج، ويُستقطب المشاركون، وتعود النتائج إلى المجتمع الأوسع.",
      ],
    },
  },
  {
    id: "sahtak",
    status: "active",
    en: {
      title: "“Your Health in Life” — صحتك بالدنيا",
      tag: "Phase 2 · 2025–2026",
      summary:
        "An awareness program on gender-based violence and mental and sexual health, delivered in sessions for women and — since Phase 2 — men as well.",
      body: [
        // REVIEW(founder): participant figures below come from the grant application. Confirm before publishing.
        "Phase 1 (2023) reached approximately 100 direct participants and around 1,000 indirect participants, all women.",
        "Phase 2 (2025–2026) widened the program to roughly 160 male and female participants, a response to the sharply increased need across the Bekaa following the 2024 conflict.",
      ],
    },
    ar: {
      title: "صحتك بالدنيا",
      tag: "المرحلة الثانية · 2025–2026",
      summary:
        "برنامج توعية حول العنف القائم على النوع الاجتماعي والصحة النفسية والجنسية، يُنفَّذ عبر جلسات للنساء، ومنذ المرحلة الثانية للرجال أيضاً.",
      body: [
        "وصلت المرحلة الأولى (2023) إلى نحو 100 مشاركة مباشرة وحوالي 1000 مشاركة غير مباشرة، جميعهنّ من النساء.",
        "ووسّعت المرحلة الثانية (2025–2026) البرنامج ليشمل نحو 160 مشاركاً ومشاركة، استجابةً للحاجة المتزايدة في البقاع بعد حرب 2024.",
      ],
    },
  },
  {
    id: "summer-camp",
    status: "active",
    en: {
      title: "NABA Summer Camp",
      tag: "Second Edition · 2026",
      summary:
        "An annual camp for children and teenagers aged 8–18, built around intellectual development and mental health in equal measure.",
      body: [
        "Sessions cover robotics and Arduino, LEGO engineering, arts, psychosocial support (PSS), and dance — a deliberate mix of technical skill-building and space to process what these children have lived through.",
        "The Second Edition is running in 2026 with an instructor team drawn from the community itself.",
      ],
    },
    ar: {
      title: "مخيم نبا الصيفي",
      tag: "النسخة الثانية · 2026",
      summary:
        "مخيم سنوي للأطفال واليافعين من عمر 8 إلى 18 سنة، يقوم على التنمية الفكرية والصحة النفسية معاً.",
      body: [
        "تشمل الجلسات الروبوتيك والأردوينو، وهندسة الليغو، والفنون، والدعم النفسي الاجتماعي، والرقص — مزيج مقصود بين بناء المهارات التقنية وإتاحة مساحة للأطفال ليعالجوا ما مرّوا به.",
        "تُنفَّذ النسخة الثانية في عام 2026 بفريق مدرّبات ومدرّبين من المجتمع المحلي نفسه.",
      ],
    },
  },
  {
    id: "himayetna-online",
    status: "active",
    // REVIEW(founder): naming Care International publicly is gated behind this flag.
    // Set `funderPublic: true` only once you confirm it is okay to name them on the site.
    funder: "Care International",
    funderPublic: false,
    en: {
      title: "“Our Protection Online” — حمايتنا أونلاين",
      tag: "Ongoing",
      summary:
        "A digital-safety awareness program teaching participants how to protect themselves and their families online.",
      body: [
        "Delivered alongside a companion project, “Colony”, as part of NABA's wider protection work.",
      ],
    },
    ar: {
      title: "حمايتنا أونلاين",
      tag: "مستمر",
      summary:
        "برنامج توعية حول السلامة الرقمية يعلّم المشاركين كيفية حماية أنفسهم وعائلاتهم على الإنترنت.",
      body: [
        "يُنفَّذ إلى جانب مشروع مرافق باسم «Colony» ضمن عمل نبا الأوسع في مجال الحماية.",
      ],
    },
  },
  {
    id: "nisaa-al-ward",
    status: "proposed",
    en: {
      title: "“Women of the Rose” — نساء الورد",
      tag: "Proposed · awaiting funding",
      summary:
        "A proposed training program in rose-soap production paired with awareness sessions, designed for 10 women and 25 farmers in Qasarnaba.",
      body: [
        "Submitted as an Expression of Interest to a consortium. Not yet confirmed as funded — listed here as part of NABA's forward pipeline, not as an active program.",
      ],
    },
    ar: {
      title: "نساء الورد",
      tag: "مقترح · بانتظار التمويل",
      summary:
        "برنامج تدريبي مقترح على إنتاج صابون الورد مع جلسات توعية، مصمَّم لعشر نساء وخمسة وعشرين مزارعاً في قصرنبا.",
      body: [
        "قُدِّم كإبداء اهتمام إلى أحد التجمّعات التمويلية، ولم يُؤكَّد تمويله بعد. يُذكر هنا ضمن خطط نبا المستقبلية لا كبرنامج قائم.",
      ],
    },
  },
  {
    id: "damascus-rose",
    status: "proposed",
    en: {
      title: "Damascus Rose Value Chain — ورد جوري",
      tag: "Proposed · application submitted",
      summary:
        "A project to revitalise the Damascus rose value chain in Qasarnaba, connecting growers to processing and market.",
      body: [
        "A grant application has been submitted to Lebanon's Ministry of Social Affairs (MoSA). Not yet confirmed as awarded.",
      ],
    },
    ar: {
      title: "سلسلة قيمة الورد الجوري",
      tag: "مقترح · طلب مقدَّم",
      summary:
        "مشروع لإحياء سلسلة قيمة الورد الجوري في قصرنبا، يربط المزارعين بالتصنيع والسوق.",
      body: [
        "قُدِّم طلب منحة إلى وزارة الشؤون الاجتماعية اللبنانية، ولم يُؤكَّد منحه بعد.",
      ],
    },
  },
];

/* ------------------------------------------------------------------ *
 * Impact figures — REVIEW(founder): all numbers below are taken from the
 * most recent grant application and should be re-verified before publishing.
 * ------------------------------------------------------------------ */

export const IMPACT = [
  { value: "3+", en: { label: "Years of operation", note: "Continuous community work in Qasarnaba." }, ar: { label: "سنوات من العمل", note: "عمل مجتمعي متواصل في قصرنبا." } },
  { value: "4", en: { label: "Completed projects", note: "Delivered end to end." }, ar: { label: "مشاريع منجزة", note: "نُفِّذت من البداية إلى النهاية." } },
  { value: "1,000+", en: { label: "People reached", note: "Across all awareness programs." }, ar: { label: "شخص وصلنا إليهم", note: "عبر جميع برامج التوعية." } },
  { value: "~4", en: { label: "Months average project length", note: "From launch to final report." }, ar: { label: "أشهر بمعدل مدة المشروع", note: "من الإطلاق حتى التقرير النهائي." } },
];

/* ------------------------------------------------------------------ *
 * Team — TODO(founder): role/title + short bio for each person, and explicit
 * consent to be named and photographed publicly. Until `consent: true` is set
 * for a person, they are rendered as an unnamed placeholder card.
 * ------------------------------------------------------------------ */

export const TEAM = [
  {
    id: "mhammad",
    consent: true, // founder — self-published
    photo: null, // TODO: drop a 400x400 square photo into /assets/img/team/
    en: { name: "Mhammad", role: "Founder", bio: "Final-year Computer and Communications Engineering student. Leads the robotics and digital-safety sessions at NABA." },
    ar: { name: "محمد", role: "المؤسس", bio: "طالب في السنة الأخيرة في هندسة الحاسوب والاتصالات. يقود جلسات الروبوتيك والسلامة الرقمية في نبا." },
  },
  // The Summer Camp 2026 instructor team — Mariam Dirani, Ranya Dirani,
  // Fatima Dirani and Samah El Hajj Hassan — is credited collectively below
  // rather than individually, because per-person consent to be named and
  // photographed publicly has not been confirmed. To publish someone, add an
  // entry here with `consent: true`, a role and a bio.
];

/* ------------------------------------------------------------------ *
 * Gallery — placeholder slots. Drop real photos into
 * static/assets/img/gallery/ and fill `src` here.
 * ------------------------------------------------------------------ */

export const GALLERY = [
  {
    id: "digital-safety-session",
    src: "/assets/img/gallery/digital-safety-session.jpg",
    w: 1600, h: 1200, ratio: "4/3",
    en: { caption: "Digital-safety session — حمايتنا أونلاين, Qasarnaba" },
    ar: { caption: "جلسة سلامة رقمية — حمايتنا أونلاين، قصرنبا" },
  },
  {
    id: "arts-session",
    src: "/assets/img/gallery/arts-session.jpg",
    w: 1200, h: 1600, ratio: "3/4",
    en: { caption: "Arts session, NABA Summer Camp" },
    ar: { caption: "جلسة فنون، مخيم نبا الصيفي" },
  },
  {
    id: "womens-awareness-session",
    src: "/assets/img/gallery/womens-awareness-session.jpg",
    w: 1600, h: 1200, ratio: "4/3",
    en: { caption: "Awareness session for women at the NABA centre" },
    ar: { caption: "جلسة توعية للنساء في مركز نبا" },
  },
  {
    id: "robotics-session",
    src: "/assets/img/gallery/robotics-session.jpg",
    w: 1600, h: 1200, ratio: "4/3",
    en: { caption: "Robotics session, NABA Summer Camp" },
    ar: { caption: "جلسة روبوتيك، مخيم نبا الصيفي" },
  },
  {
    id: "camp-day",
    src: "/assets/img/gallery/camp-day.jpg",
    w: 1600, h: 1200, ratio: "4/3",
    en: { caption: "A camp day at the NABA centre, Qasarnaba" },
    ar: { caption: "يوم من أيام المخيم في مركز نبا، قصرنبا" },
  },
  {
    id: "teens-session",
    src: "/assets/img/gallery/teens-session.jpg",
    w: 1600, h: 1200, ratio: "4/3",
    en: { caption: "Session with older participants, NABA Summer Camp" },
    ar: { caption: "جلسة مع المشاركين الأكبر سناً، مخيم نبا الصيفي" },
  },
];

/* ------------------------------------------------------------------ *
 * News — static entries, reverse-chronological. Add new items at the top.
 * REVIEW(founder): dates and wording to confirm.
 * ------------------------------------------------------------------ */

export const NEWS = [
  {
    id: "camp-2026",
    date: "2026-07-01",
    en: { title: "Summer Camp 2026 — Second Edition is underway", body: "The second edition of the NABA Summer Camp is running for children aged 8–18, with robotics and Arduino, LEGO engineering, arts, psychosocial support and dance on the schedule." },
    ar: { title: "انطلاق النسخة الثانية من مخيم نبا الصيفي 2026", body: "انطلقت النسخة الثانية من مخيم نبا الصيفي للأطفال من عمر 8 إلى 18 سنة، وتشمل الروبوتيك والأردوينو، وهندسة الليغو، والفنون، والدعم النفسي الاجتماعي، والرقص." },
  },
  {
    id: "sahtak-phase-2",
    date: "2025-10-01",
    en: { title: "“صحتك بالدنيا” enters Phase 2", body: "The second phase of our GBV and mental-health awareness program expands to roughly 160 male and female participants, responding to increased need across the Bekaa after the 2024 conflict." },
    ar: { title: "انطلاق المرحلة الثانية من «صحتك بالدنيا»", body: "توسّع المرحلة الثانية من برنامج التوعية حول العنف القائم على النوع الاجتماعي والصحة النفسية لتشمل نحو 160 مشاركاً ومشاركة، استجابةً للحاجة المتزايدة في البقاع بعد حرب 2024." },
  },
  {
    id: "rose-applications",
    date: "2025-06-01",
    en: { title: "Two rose value-chain proposals submitted", body: "NABA submitted an Expression of Interest for «نساء الورد» (rose-soap production training) and a grant application to the Ministry of Social Affairs for Damascus rose value-chain revitalisation in Qasarnaba. Both are pending." },
    ar: { title: "تقديم مقترحين حول سلسلة قيمة الورد", body: "قدّمت نبا إبداء اهتمام لبرنامج «نساء الورد» للتدريب على إنتاج صابون الورد، وطلب منحة إلى وزارة الشؤون الاجتماعية لإحياء سلسلة قيمة الورد الجوري في قصرنبا. المقترحان قيد الدراسة." },
  },
];

/* ------------------------------------------------------------------ *
 * Per-page copy
 * ------------------------------------------------------------------ */

export const COPY = {
  en: {
    skipToContent: "Skip to content",
    langSwitchLabel: "العربية",
    menu: "Menu",
    close: "Close",
    scrollHint: "Scroll",
    home: {
      metaTitle: "NABA NGO — community programs in Qasarnaba, Bekaa Valley",
      metaDescription:
        "NABA NGO (جمعية نبا) is a grassroots organisation in Qasarnaba, Bekaa Valley, Lebanon, running women's economic empowerment, GBV and mental-health awareness, children's summer camps and Damascus rose agricultural programs.",
      heroKicker: "Qasarnaba · Bekaa Valley · Lebanon",
      heroTitle: "NABA NGO",
      heroSubtitle: "جمعية نبا",
      heroLede: "A grassroots organisation building what our village needs — for the women, the children and the growers of the Bekaa.",
      heroCta: "See our programs",
      heroCtaSecondary: "Get involved",
      missionTitle: "What we do",
      missionBody: [
        "NABA is run by people from Qasarnaba, for Qasarnaba and the villages around it. We work where the gap is widest: women's economic empowerment, awareness of gender-based violence and mental health, children's development, and the agricultural value chains this valley has always lived on.",
        "Every program is designed, staffed and delivered locally. That is the whole point.",
      ],
      programsTitle: "Programs running now",
      programsLink: "All programs",
      impactTitle: "Where we've reached",
      impactLink: "Full impact",
      happeningTitle: "What's happening now",
      happeningLink: "See the gallery",
      involvedTitle: "Work with us",
      involvedBody: "Volunteer, partner, or support a program. The fastest way in is a message.",
      involvedCta: "Get involved",
    },
    about: {
      metaTitle: "About NABA NGO — Qasarnaba, Bekaa Valley",
      metaDescription:
        "The founding story, mission, vision and values of NABA NGO (جمعية نبا), a community organisation based in Qasarnaba, Baalbek District, Bekaa Valley, Lebanon.",
      title: "About NABA",
      lede: "A community organisation from Qasarnaba, in the Baalbek District of Lebanon's Bekaa Valley.",
      storyTitle: "How NABA started",
      storyBody: [
        "NABA began with campaigns — a group of volunteers from Qasarnaba writing, designing and distributing awareness material on the issues their own families were facing. There was no office and no budget line; there was a clear view of what the village needed and people willing to do the work.",
        "That outreach work grew into structured programs: awareness sessions on gender-based violence and mental health, a summer camp for children built equally around technical skills and psychosocial support, and — most recently — proposals to revive the Damascus rose value chain that the Bekaa has cultivated for generations.",
        // TODO(founder): founding year and any founding-story detail you want here.
      ],
      missionTitle: "Mission",
      missionBody:
        "To build the capacity of our own community in Qasarnaba and the surrounding Bekaa — economically, psychologically and educationally — through programs designed and delivered by the people who live here.",
      visionTitle: "Vision",
      visionBody:
        "A Bekaa where women have independent income, children grow up supported rather than merely surviving, and the valley's agricultural heritage is a livelihood again.",
      valuesTitle: "Values",
      values: [
        { title: "Local by design", body: "Programs are staffed and led by people from the community they serve." },
        { title: "Dignity first", body: "We work with participants, not on them. Nobody is a case number." },
        { title: "Honest reporting", body: "We publish the numbers we can stand behind, and label what is still a proposal." },
        { title: "Continuity", body: "Short projects, sustained presence. We are here after the funding cycle ends." },
      ],
      locationTitle: "Where we are",
      locationBody: "Qasarnaba, Bekaa Valley, Baalbek District, Lebanon.",
    },
    programs: {
      metaTitle: "Programs — NABA NGO, Qasarnaba, Bekaa Valley",
      metaDescription:
        "NABA NGO's programs in Qasarnaba, Bekaa Valley: صحتك بالدنيا GBV and mental-health awareness, the NABA Summer Camp for ages 8–18, digital-safety awareness, and Damascus rose value-chain work.",
      title: "Programs",
      lede: "What NABA runs, and what NABA has proposed. We label the difference.",
      activeTitle: "Active programs",
      proposedTitle: "Proposed — awaiting confirmation",
      proposedNote:
        "These are submitted applications, not funded programs. They are listed for transparency about where NABA is heading, and will move up the page if and when they are confirmed.",
      funderLabel: "Supported by",
    },
    impact: {
      metaTitle: "Impact — NABA NGO, Qasarnaba, Bekaa Valley",
      metaDescription:
        "NABA NGO's track record in Qasarnaba, Bekaa Valley: over three years of operation, four completed projects and more than 1,000 people reached across awareness programs.",
      title: "Impact",
      lede: "The numbers we can stand behind.",
      breakdownTitle: "Where the reach comes from",
      breakdown: [
        { title: "صحتك بالدنيا, Phase 1 (2023)", body: "~100 direct and ~1,000 indirect female participants." },
        { title: "صحتك بالدنيا, Phase 2 (2025–2026)", body: "~160 male and female participants." },
        { title: "NABA Summer Camp", body: "Annual program for children and teenagers aged 8–18, now in its second edition." },
        { title: "Digital awareness campaigns", body: "Continuous outreach across Qasarnaba and neighbouring villages." },
      ],
      caveat:
        "Figures are drawn from NABA's most recent grant application and are updated as programs close out.",
    },
    team: {
      metaTitle: "Team — NABA NGO, Qasarnaba, Bekaa Valley",
      metaDescription:
        "The founder and instructor team behind NABA NGO's community programs and Summer Camp in Qasarnaba, Bekaa Valley, Lebanon.",
      title: "Team",
      lede: "The people who design and deliver NABA's programs — all from the community they serve.",
      photoAlt: "Photo placeholder",
      instructorsTitle: "Summer Camp 2026 instructor team",
      instructorsBody:
        "The camp is delivered by an instructor team drawn from Qasarnaba itself, covering robotics and Arduino, LEGO engineering, arts, psychosocial support and dance. Individual names and photographs are published only with each person's consent.",
    },
    gallery: {
      metaTitle: "Gallery — NABA NGO activities in Qasarnaba, Bekaa Valley",
      metaDescription:
        "Photos from NABA NGO's current activities in Qasarnaba, Bekaa Valley — Summer Camp robotics and arts sessions, awareness workshops and volunteer work.",
      title: "What's happening",
      lede: "Photographs from NABA's current activities in Qasarnaba.",
      placeholderNote: "Photo coming soon",
    },
    news: {
      metaTitle: "News & updates — NABA NGO, Qasarnaba, Bekaa Valley",
      metaDescription:
        "Updates from NABA NGO in Qasarnaba, Bekaa Valley — new program phases, summer camp editions and funding applications.",
      title: "News & updates",
      lede: "Program milestones, in reverse order.",
    },
    getInvolved: {
      metaTitle: "Get involved — volunteer with NABA NGO, Qasarnaba",
      metaDescription:
        "Volunteer with NABA NGO in Qasarnaba, Bekaa Valley, or support our women's empowerment, awareness and children's programs through partnership and in-kind contributions.",
      title: "Get involved",
      lede: "Programs here run on people who show up. There is more than one way to do that.",
      volunteerTitle: "Volunteer with NABA",
      volunteerBody: "Tell us what you can offer and which program interests you. We will come back to you directly.",
      supportTitle: "Support our work",
      // REVIEW(founder): donation mechanism not yet chosen — this section deliberately
      // avoids promising a checkout. See OPEN_QUESTIONS #6.
      supportBody:
        "NABA does not run an online checkout. Support reaches us most reliably through direct contact — we will share our bank transfer details and arrange the method that works for you, and account for it properly.",
      supportWays: [
        { title: "In-kind contributions", body: "Equipment for the robotics and LEGO sessions, art supplies, printing, and materials for awareness workshops." },
        { title: "Partnership", body: "Organisations and funders working in the Bekaa — get in touch about co-delivering a program." },
        { title: "Your time", body: "Facilitators, instructors, translators, designers and photographers are always needed." },
        { title: "Bank transfer", body: "Contact us and we will send NABA's bank details directly, along with confirmation of which program your contribution supports." },
      ],
      supportCta: "Contact NABA",
      form: {
        name: "Full name",
        email: "Email",
        phone: "Phone or WhatsApp",
        availability: "Availability",
        availabilityHint: "e.g. weekends, summer months, evenings",
        interest: "Area of interest",
        interestPlaceholder: "Choose a program",
        message: "Anything else we should know",
        submit: "Send",
        disabledNote:
          "Form submissions are not connected yet. Until then, please email us at",
        success: "Thank you — we'll be in touch.",
      },
    },
    contact: {
      metaTitle: "Contact NABA NGO — Qasarnaba, Bekaa Valley, Lebanon",
      metaDescription:
        "Contact NABA NGO in Qasarnaba, Baalbek District, Bekaa Valley, Lebanon — email naba.beqaa@gmail.com, phone +961 71 824 884 or +961 70 980 245.",
      title: "Contact",
      lede: "Email, phone or WhatsApp — whichever is easiest.",
      emailLabel: "Email",
      phoneLabel: "Phone",
      whatsappLabel: "WhatsApp",
      locationLabel: "Location",
      mapTitle: "Find us",
      mapApproxNote:
        "Pin shows the approximate location of Qasarnaba. Exact coordinates to be added.",
      formTitle: "Send a message",
      form: { name: "Your name", email: "Your email", message: "Message", submit: "Send message" },
    },
    footer: {
      tagline: "Community programs in Qasarnaba, Bekaa Valley, Lebanon.",
      followTitle: "Follow",
      contactTitle: "Contact",
      exploreTitle: "Explore",
      rights: "All rights reserved.",
      established: "Established 2023 · Qasarnaba, Bekaa Valley",
      registration: "Registered Lebanese association — علم وخبر no. 217 (2026).",
    },
    notFound: {
      metaTitle: "Page not found — NABA NGO",
      metaDescription: "The page you were looking for could not be found on naba.ngo.",
      title: "Page not found",
      body: "That page doesn't exist. Try the homepage.",
      cta: "Go to homepage",
    },
  },

  /* ---------------- Arabic ----------------
   * TRANSLATION: all Arabic prose below is a Claude-drafted translation and
   * needs a native review pass before publishing. Existing Arabic program
   * titles are preserved verbatim and must not be changed.
   */
  ar: {
    skipToContent: "تخطَّ إلى المحتوى",
    langSwitchLabel: "English",
    menu: "القائمة",
    close: "إغلاق",
    scrollHint: "مرّر للأسفل",
    home: {
      metaTitle: "جمعية نبا — برامج مجتمعية في قصرنبا، سهل البقاع",
      metaDescription:
        "جمعية نبا (NABA NGO) منظمة أهلية في قصرنبا، سهل البقاع، لبنان، تعمل في التمكين الاقتصادي للنساء، والتوعية حول العنف القائم على النوع الاجتماعي والصحة النفسية، والمخيمات الصيفية للأطفال، وبرامج الورد الجوري الزراعية.",
      heroKicker: "قصرنبا · سهل البقاع · لبنان",
      heroTitle: "جمعية نبا",
      heroSubtitle: "NABA NGO",
      heroLede: "منظمة أهلية تبني ما تحتاجه قريتنا — لنساء البقاع وأطفاله ومزارعيه.",
      heroCta: "تعرّف على برامجنا",
      heroCtaSecondary: "شارك معنا",
      missionTitle: "ماذا نفعل",
      missionBody: [
        "تديرها نساء ورجال من قصرنبا، من أجل قصرنبا والقرى المحيطة بها. نعمل حيث تتّسع الفجوة: التمكين الاقتصادي للنساء، والتوعية حول العنف القائم على النوع الاجتماعي والصحة النفسية، وتنمية الأطفال، وسلاسل القيمة الزراعية التي عاش عليها هذا السهل دائماً.",
        "كل برنامج يُصمَّم ويُدار ويُنفَّذ محلياً. وهذا هو جوهر الفكرة.",
      ],
      programsTitle: "برامج قائمة الآن",
      programsLink: "كل البرامج",
      impactTitle: "أين وصلنا",
      impactLink: "الأثر كاملاً",
      happeningTitle: "ماذا يحدث الآن",
      happeningLink: "معرض الصور",
      involvedTitle: "اعمل معنا",
      involvedBody: "تطوّع، أو اشترك كشريك، أو ادعم أحد البرامج. أسرع طريق هو رسالة.",
      involvedCta: "شارك معنا",
    },
    about: {
      metaTitle: "من نحن — جمعية نبا، قصرنبا، سهل البقاع",
      metaDescription:
        "قصة التأسيس والرسالة والرؤية والقيم لجمعية نبا (NABA NGO)، منظمة مجتمعية مقرّها قصرنبا، قضاء بعلبك، سهل البقاع، لبنان.",
      title: "من نحن",
      lede: "منظمة مجتمعية من قصرنبا، في قضاء بعلبك في سهل البقاع اللبناني.",
      storyTitle: "كيف بدأت نبا",
      storyBody: [
        "بدأت نبا بالحملات — مجموعة متطوعين من قصرنبا يكتبون ويصممون ويوزّعون مواد توعوية حول القضايا التي كانت تواجه عائلاتهم. لم يكن هناك مكتب ولا بند في موازنة؛ كانت هناك رؤية واضحة لما تحتاجه القرية، وأشخاص مستعدون للعمل.",
        "تحوّل ذلك العمل التوعوي إلى برامج منظّمة: جلسات توعية حول العنف القائم على النوع الاجتماعي والصحة النفسية، ومخيم صيفي للأطفال يقوم على المهارات التقنية والدعم النفسي معاً، ومؤخّراً مقترحات لإحياء سلسلة قيمة الورد الجوري التي زرعها البقاع على مدى أجيال.",
      ],
      missionTitle: "رسالتنا",
      missionBody:
        "بناء قدرات مجتمعنا في قصرنبا والبقاع المحيط — اقتصادياً ونفسياً وتعليمياً — عبر برامج يصمّمها وينفّذها أهل المنطقة أنفسهم.",
      visionTitle: "رؤيتنا",
      visionBody:
        "بقاعٌ تملك فيه النساء دخلاً مستقلاً، وينشأ فيه الأطفال بدعم لا بمجرّد نجاة، ويعود فيه الإرث الزراعي للسهل مصدر رزق.",
      valuesTitle: "قيمنا",
      values: [
        { title: "محلّي بالتصميم", body: "يقود البرامج وينفّذها أشخاص من المجتمع نفسه الذي تخدمه." },
        { title: "الكرامة أولاً", body: "نعمل مع المشاركين لا عليهم. لا أحد رقم في ملف." },
        { title: "تقارير صادقة", body: "ننشر الأرقام التي نستطيع الدفاع عنها، ونوضّح ما لا يزال مجرّد مقترح." },
        { title: "الاستمرارية", body: "مشاريع قصيرة، وحضور دائم. نبقى هنا بعد انتهاء دورة التمويل." },
      ],
      locationTitle: "أين نحن",
      locationBody: "قصرنبا، سهل البقاع، قضاء بعلبك، لبنان.",
    },
    programs: {
      metaTitle: "برامجنا — جمعية نبا، قصرنبا، سهل البقاع",
      metaDescription:
        "برامج جمعية نبا في قصرنبا، سهل البقاع: «صحتك بالدنيا» للتوعية حول العنف القائم على النوع الاجتماعي والصحة النفسية، ومخيم نبا الصيفي لأعمار 8–18، والتوعية بالسلامة الرقمية، وعمل سلسلة قيمة الورد الجوري.",
      title: "برامجنا",
      lede: "ما تنفّذه نبا، وما اقترحته. ونوضّح الفرق.",
      activeTitle: "برامج قائمة",
      proposedTitle: "مقترحات — بانتظار التأكيد",
      proposedNote:
        "هذه طلبات مقدَّمة لا برامج مموَّلة. نذكرها شفافيةً حول وجهة نبا، وستنتقل إلى أعلى الصفحة عند تأكيدها.",
      funderLabel: "بدعم من",
    },
    impact: {
      metaTitle: "أثرنا — جمعية نبا، قصرنبا، سهل البقاع",
      metaDescription:
        "سجلّ عمل جمعية نبا في قصرنبا، سهل البقاع: أكثر من ثلاث سنوات من العمل، وأربعة مشاريع منجزة، وأكثر من ألف شخص وصلت إليهم برامج التوعية.",
      title: "أثرنا",
      lede: "الأرقام التي نستطيع الدفاع عنها.",
      breakdownTitle: "من أين يأتي هذا الوصول",
      breakdown: [
        { title: "صحتك بالدنيا، المرحلة الأولى (2023)", body: "نحو 100 مشاركة مباشرة و1000 مشاركة غير مباشرة." },
        { title: "صحتك بالدنيا، المرحلة الثانية (2025–2026)", body: "نحو 160 مشاركاً ومشاركة." },
        { title: "مخيم نبا الصيفي", body: "برنامج سنوي للأطفال واليافعين من 8 إلى 18 سنة، في نسخته الثانية." },
        { title: "حملات التوعية الرقمية", body: "تواصل مستمر في قصرنبا والقرى المجاورة." },
      ],
      caveat: "الأرقام مستمدة من أحدث طلب منحة لجمعية نبا وتُحدَّث مع انتهاء كل برنامج.",
    },
    team: {
      metaTitle: "فريقنا — جمعية نبا، قصرنبا، سهل البقاع",
      metaDescription:
        "المؤسس وفريق المدرّبين وراء برامج جمعية نبا ومخيمها الصيفي في قصرنبا، سهل البقاع، لبنان.",
      title: "فريقنا",
      lede: "من يصمّمون برامج نبا وينفّذونها — جميعهم من المجتمع الذي يخدمونه.",
      photoAlt: "مكان مخصص للصورة",
      instructorsTitle: "فريق مدرّبي مخيم صيف 2026",
      instructorsBody:
        "يُنفَّذ المخيم بفريق مدرّبات ومدرّبين من قصرنبا نفسها، يغطّي الروبوتيك والأردوينو، وهندسة الليغو، والفنون، والدعم النفسي الاجتماعي، والرقص. وتُنشر الأسماء والصور الشخصية بموافقة كل شخص فقط.",
    },
    gallery: {
      metaTitle: "معرض الصور — أنشطة جمعية نبا في قصرنبا، سهل البقاع",
      metaDescription:
        "صور من أنشطة جمعية نبا الحالية في قصرنبا، سهل البقاع — جلسات الروبوتيك والفنون في المخيم الصيفي، وورش التوعية، وعمل المتطوعين.",
      title: "ماذا يحدث الآن",
      lede: "صور من أنشطة نبا الحالية في قصرنبا.",
      placeholderNote: "الصورة قريباً",
    },
    news: {
      metaTitle: "أخبارنا — جمعية نبا، قصرنبا، سهل البقاع",
      metaDescription: "مستجدات جمعية نبا في قصرنبا، سهل البقاع — مراحل برامج جديدة، ونسخ المخيم الصيفي، وطلبات التمويل.",
      title: "أخبار ومستجدات",
      lede: "محطات البرامج، من الأحدث إلى الأقدم.",
    },
    getInvolved: {
      metaTitle: "شارك معنا — التطوع مع جمعية نبا، قصرنبا",
      metaDescription:
        "تطوّع مع جمعية نبا في قصرنبا، سهل البقاع، أو ادعم برامجنا في تمكين النساء والتوعية وتنمية الأطفال عبر الشراكة والمساهمات العينية.",
      title: "شارك معنا",
      lede: "برامجنا تقوم على من يحضرون. وهناك أكثر من طريقة للحضور.",
      volunteerTitle: "تطوّع مع نبا",
      volunteerBody: "أخبرنا بما تستطيع تقديمه وأي برنامج يهمّك، وسنعاود التواصل معك مباشرة.",
      supportTitle: "ادعم عملنا",
      supportBody:
        "لا تدير نبا نظام دفع إلكتروني. يصلنا الدعم بشكل أضمن عبر التواصل المباشر — نرسل لك تفاصيل التحويل المصرفي ونرتّب الطريقة المناسبة لك، ونوثّقها أصولاً.",
      supportWays: [
        { title: "مساهمات عينية", body: "معدات لجلسات الروبوتيك والليغو، ومستلزمات فنية، وطباعة، ومواد لورش التوعية." },
        { title: "شراكة", body: "للمنظمات والجهات المانحة العاملة في البقاع — تواصلوا معنا لتنفيذ برنامج مشترك." },
        { title: "وقتك", body: "نحتاج دائماً إلى ميسّرين ومدرّبين ومترجمين ومصممين ومصوّرين." },
        { title: "تحويل مصرفي", body: "تواصل معنا وسنرسل لك تفاصيل حساب نبا المصرفي، مع تأكيد البرنامج الذي تدعمه مساهمتك." },
      ],
      supportCta: "تواصل مع نبا",
      form: {
        name: "الاسم الكامل",
        email: "البريد الإلكتروني",
        phone: "الهاتف أو واتساب",
        availability: "أوقات التفرّغ",
        availabilityHint: "مثلاً: عطل نهاية الأسبوع، أشهر الصيف، المساء",
        interest: "مجال الاهتمام",
        interestPlaceholder: "اختر برنامجاً",
        message: "أي معلومات إضافية",
        submit: "إرسال",
        disabledNote: "لم يتم ربط نموذج الإرسال بعد. حتى ذلك الحين، راسلنا على",
        success: "شكراً لك — سنتواصل معك قريباً.",
      },
    },
    contact: {
      metaTitle: "تواصل مع جمعية نبا — قصرنبا، سهل البقاع، لبنان",
      metaDescription:
        "تواصل مع جمعية نبا في قصرنبا، قضاء بعلبك، سهل البقاع، لبنان — البريد naba.beqaa@gmail.com، الهاتف ‎+961 71 824 884‎ أو ‎+961 70 980 245‎.",
      title: "تواصل معنا",
      lede: "بريد إلكتروني أو هاتف أو واتساب — أيها أسهل.",
      emailLabel: "البريد الإلكتروني",
      phoneLabel: "الهاتف",
      whatsappLabel: "واتساب",
      locationLabel: "الموقع",
      mapTitle: "أين تجدنا",
      mapApproxNote: "تشير العلامة إلى موقع قصرنبا التقريبي. ستُضاف الإحداثيات الدقيقة لاحقاً.",
      formTitle: "أرسل رسالة",
      form: { name: "اسمك", email: "بريدك الإلكتروني", message: "الرسالة", submit: "إرسال الرسالة" },
    },
    footer: {
      tagline: "برامج مجتمعية في قصرنبا، سهل البقاع، لبنان.",
      followTitle: "تابعنا",
      contactTitle: "تواصل",
      exploreTitle: "تصفّح",
      rights: "جميع الحقوق محفوظة.",
      established: "تأسست عام 2023 · قصرنبا، سهل البقاع",
      registration: "جمعية لبنانية مسجّلة — علم وخبر رقم ٢١٧ (2026).",
    },
    notFound: {
      metaTitle: "الصفحة غير موجودة — جمعية نبا",
      metaDescription: "الصفحة المطلوبة غير موجودة على naba.ngo.",
      title: "الصفحة غير موجودة",
      body: "هذه الصفحة غير موجودة. جرّب الصفحة الرئيسية.",
      cta: "إلى الصفحة الرئيسية",
    },
  },
};

/** Surfaced in README.md and in the build log so they don't get lost. */
export const OPEN_QUESTIONS = [
  "Photos: the hero frame and the gallery still need the real image files committed to static/assets/img/ (see that folder's README for sizes).",
  "Facebook page URL for 'Naba Qasarnaba' — set SITE.social.facebook.",
  "Confirm +961 76 890 159 (from the roll-up banner) should be the primary contact number.",
  "Bank transfer details: decide whether to publish them on the site or keep them contact-only (currently contact-only).",
  "Static-form backend: create the Formspree forms and paste the endpoints, or switch to the Pages Function.",
  "Arabic prose is a draft translation and needs a native review pass.",
  "Impact figures come from the most recent grant application — reverify before publishing.",
];
