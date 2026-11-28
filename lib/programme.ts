export const programme = {
  title: "Beyond the Diagnosis",
  subtitle: "Disability Assessment, Certification and Entitlements under the RPwD Act, 2016",
  dateLabel: "Saturday, 19 December 2026",
  /** From this moment the desk can record Webex attendance, the RCI exam and CRE points. */
  sessionsOpenAt: "2026-12-19T00:00:00+05:30",
  day: "19",
  month: "December 2026",
  start: "10:00 IST",
  mode: "Online",
  level: "Zonal",
  language: "English",
  acknowledgement: "CRE-26111620026773",
  instituteCode: "KK048",
  /** RCI approval letter, CRE Division, 24 November 2026: zonal level, 4 hours, maximum intake 50. */
  rciFileNo: "CRE-26111620026773/2026-RCI",
  rciApprovedOn: "24 November 2026",
  rciHours: 4,
  rciIntake: 50,
  rciCalendarUrl: "https://rciregistration.nic.in/rehabcouncil/CreCalendarnew.jsp",
  /** Short form printed on flyers and in messages. */
  rciPortal: "rciregistration.nic.in",
  aim: "A one-day programme on how the Rights of Persons with Disabilities Act, 2016 shapes assessment, certification, and the entitlements that follow a diagnosis.",
  organiser: "Department of Audiology and Speech Language Pathology",
  university: "Yenepoya (Deemed to be University)",
  city: "Mangaluru",
  address: "Yenepoya Medical College, University Road, Deralakatte, Mangaluru 575018, Karnataka",
  coordinator: "Ms. Swathi Chinnasamy and Ms. Rachana R Uchil",
  email: "yenepoyaaslpconference@gmail.com",
  departmentPhone: "7337798055",
  departmentEmail: "aslp@yenepoya.edu.in",
  hospital: "Yenepoya Medical College Hospital",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Yenepoya+Medical+College+Hospital+Deralakatte+Mangaluru",
  mapsEmbed:
    "https://maps.google.com/maps?q=Yenepoya+Medical+College+Hospital,+Deralakatte,+Mangaluru&z=16&output=embed",
  brochurePdf: "/brochure/beyond-the-diagnosis.pdf?v=14",
  brochureImage: "/brochure/beyond-the-diagnosis-1.png?v=14",
  brochureImageBack: "/brochure/beyond-the-diagnosis-2.png?v=14",
  saveTheDatePdf: "/brochure/block-the-date.pdf?v=14",
  saveTheDateImage: "/brochure/block-the-date.png?v=14",
  paymentUrl: "https://rzp.io/rzp/FCDoSjbc",
  /** One fee for everyone, as shown on the Razorpay page (Yenepoya Deemed to be University). */
  feeRupees: 354,
  feeLabel: "₹354",
  /** RCI CRE points: places for this many claimants, first registered, first served. */
  creSeats: 50,
  /**
   * True once RCI's 50 places are filled (25 Nov 2026): no new CRE claims on the site, whatever the site's own
   * count says. People who already claim keep their places. Set back to false to reopen.
   */
  creClosed: true,
  /**
   * True once registration has closed (25 Nov 2026: RCI is sharing the webinar links). The site takes no new
   * registrations and its Register buttons lead to the status page; people already registered keep full use of
   * their status, update and RCI pages. Set back to false to reopen (the desk's open/closed switch then applies).
   */
  registrationClosed: true,
  whatsappUrl: "https://chat.whatsapp.com/HUwQZlIs0zB90pSS3EC2r1",
  /** Public address printed on brochures and in links shared outside the site. */
  siteUrl: "https://yenepoya-cre.vercel.app",
  // Drop the official emblem at public/brand/yenepoya-emblem.svg.
  // Use a file supplied by the university. Do not download a logo from an image site.
} as const;

/**
 * The Non-RCI CRE programme for people who are not claiming RCI CRE points — ASLP students, professionals not
 * on the CRR, allied professionals, parents and caregivers. Same day and same fee as the RCI track, attended
 * either offline (hands-on, in person at Yenepoya — Yenepoya colleges only) or online on Cisco Webex (open to
 * all). Its own brochure, registration page and certificate (participation, no CRE points). Registration stays
 * open on its own switch (desk → Settings) until closesAt or until `seats` registrations, whichever comes first.
 * (Internally the track is still called "online": source = "online".)
 */
export const onlineProgramme = {
  name: "Participant registration",
  shortName: "participant registration",
  path: "/online",
  closesAt: "2026-12-10T23:59:59+05:30",
  closesLabel: "10 December 2026",
  /** Registrations taken in all, offline and online together. A rejected payment gives the seat back. */
  seats: 100,
  brochurePdf: "/brochure/online-programme.pdf?v=4",
  brochureImage: "/brochure/online-programme-1.png?v=4",
  brochureImageBack: "/brochure/online-programme-2.png?v=4",
  /** Separate number series, so no online certificate can be mistaken for a CRE one. */
  certificatePrefix: "YMC/ASLP/ONL/2026/",
  certificateLine: "has participated in the Zonal Continuing Rehabilitation Education (CRE) programme (offline hands-on and online)",
  /** One line for banners and the page: why this registration exists. */
  reasonLine: "RCI CRE places are full. Students, professionals not claiming CRE, allied professionals and parents can still take part.",
  modeLine: "Offline hands-on and online",
  noCreLine: "This programme does not carry RCI CRE points.",
  /** Where the offline hands-on runs, on the programme day. */
  venue: "4th floor, Academic Block, Yenepoya Medical College, Deralakatte, Mangaluru",
  offlineRule: "Offline hands-on is only for students and staff of Yenepoya (Deemed to be University) colleges.",
} as const;

/** How a Non-RCI CRE participant attends. "" for RCI-track rows (always online). */
export type AttendanceMode = "offline" | "online";

export const attendanceModes: { value: AttendanceMode; label: string; detail: string }[] = [
  {
    value: "offline",
    label: "Offline hands-on at Yenepoya",
    detail: "In person at the 4th floor, Academic Block, Yenepoya Medical College. Yenepoya colleges only.",
  },
  { value: "online", label: "Online on Cisco Webex", detail: "Live from anywhere. Open to all." },
];

export function attendanceLabel(mode: string): string {
  if (mode === "offline") return "Offline hands-on (Yenepoya)";
  if (mode === "online") return "Online (Cisco Webex)";
  return "";
}

/** Where and how a participant attends, for emails and the acknowledgement. */
export function attendanceWhere(row: { source: string; attendance?: string }): string {
  if (row.source === "online" && row.attendance === "offline") return `offline hands-on, in person at the ${onlineProgramme.venue}`;
  return "online on Cisco Webex";
}

/** Offline hands-on places are for Yenepoya (Deemed to be University) colleges: the college named must say Yenepoya. */
export function isYenepoyaInstitution(text: string): boolean {
  return /yenepoya/i.test(text);
}

export const onlineAudience = [
  "Offline hands-on: students and staff of Yenepoya colleges",
  "Online: open to all",
  "ASLP students (BASLP, MASLP, interns)",
  "Professionals not registered with RCI",
  "Doctors, therapists, special educators and psychologists",
  "Parents and caregivers of persons with disabilities",
] as const;

export const committee = [
  { role: "Organising chairperson", names: ["Dr. Shwetha Prabhu"] },
  { role: "Organising secretary", names: ["Ms. Swathi Chinnasamy", "Ms. Rachana R Uchil"] },
] as const;

/**
 * Sign the e-certificate of participation, left to right. To show a scanned signature, add a PNG with a
 * transparent background at public/brand/signatures/<key>.png (about 600 × 200 px); without it, the
 * signature line is printed empty above the name.
 */
export const certificateSignatories = [
  { key: "swathi", name: "Ms. Swathi Chinnasamy", role: "Organising Secretary", place: "Department of ASLP" },
  { key: "rachana", name: "Ms. Rachana R Uchil", role: "Organising Secretary", place: "Department of ASLP" },
  { key: "shwetha", name: "Dr. Shwetha Prabhu", role: "Organising Chairperson", place: "Department of ASLP" },
  { key: "dean", name: "Dr. Prakash R Saldanha", role: "Principal & Dean", place: "Yenepoya Medical College" },
] as const;

/** People who open the coordinator desk. They share programme.email and one access code. */
export const deskCoordinators = [
  "Ms. Swathi Chinnasamy",
  "Ms. Rachana R Uchil",
  "Ms. Pavana M J",
] as const;

/** Individual desk logins. Passwords are set from the desk (Coordinator accounts), never stored in code. */
export const deskAccounts = [
  { username: "rachana", name: "Ms. Rachana R Uchil" },
  { username: "swathi", name: "Ms. Swathi Chinnasamy" },
  { username: "pavana", name: "Ms. Pavana M J" },
] as const;

export type DeskUsername = (typeof deskAccounts)[number]["username"];

export function deskAccountName(username: string): string | null {
  return deskAccounts.find((account) => account.username === username)?.name ?? null;
}

/** How the day runs online, and how RCI CRE points are earned. Shown on Programme, Information, Attend and status pages. */
export const dayFormat = [
  "All four sessions run live on Cisco Webex. Questions to speakers and polls during the sessions run on Slido inside Webex — no separate app is needed.",
  "Keep your Webex display name the same as your registered name, so attendance can be matched.",
];

export const creSteps = [
  { title: "Register here and pay", text: `Pay ${programme.feeLabel} on Razorpay and register on this site with your CRR number and receipt.` },
  { title: "Register on the RCI website", text: "RCI has approved this programme and listed it on its CRE calendar for 19 December 2026. Register for it on the RCI website and upload RCI's confirmation mail here." },
  { title: "Attend on Cisco Webex", text: "Attend all sessions live. Slido inside Webex is used for questions and polls." },
  { title: "Online examination by RCI", text: "After the sessions, the online examination is conducted by RCI (RCI admin) as per its CRE guidelines." },
  { title: "Points on your RCI profile", text: "CRE points are credited by RCI to your individual profile on the RCI website. Check them there after RCI processes the programme." },
] as const;

/** RCI approval line printed on the acknowledgement, the register and the RCI page. */
export const rciApprovalLine = `Approved by RCI · F. No. ${programme.rciFileNo} · ${programme.rciHours} hours`;

/** What a CRE claimant must also do on the RCI website. Used on the site, in emails and on the flyers. */
export const rciRegisterLine = `Claiming CRE points? Also register for this programme on the RCI website (${programme.rciPortal} → CRE Calendar → 19 December 2026 → Beyond the Diagnosis, institute ${programme.instituteCode}) with your CRR login, then upload RCI's confirmation mail on this site.`;

export function deskCoordinatorLine(): string {
  const names = [...deskCoordinators];
  const last = names[names.length - 1];
  if (!last || names.length === 1) return last ?? "";
  return `${names.slice(0, -1).join(", ")}, and ${last}`;
}

export const invitation = [
  "The Department of Audiology and Speech Language Pathology invites audiologists, speech-language pathologists, clinical psychologists, and other rehabilitation professionals to a zonal Continuing Rehabilitation Education programme.",
  "The day centres on one question: once a diagnosis is made, what does the Rights of Persons with Disabilities Act, 2016 require of assessment, certification, and the entitlements a person can claim?",
  "Sessions move from the Act as a whole, to the 21 recognised disabilities, to learning, intellectual and autism spectrum disabilities, and then to the legal work of clinicians who serve people with communication disorders.",
];

export type Profession =
  | "audiologist"
  | "speech_language_pathologist"
  | "clinical_psychologist"
  | "special_educator"
  | "occupational_therapist"
  | "rehabilitation_professional"
  | "other"
  | "student"
  | "allied_health"
  | "parent_caregiver";

/** "online" marks the regular online programme (non-RCI track); every other value is the RCI CRE track. */
export type ArrivalSource = "rci" | "site" | "join" | "direct" | "desk" | "online";

export const titles = ["Dr.", "Prof.", "Mr.", "Ms.", "Mrs."] as const;
export type Title = (typeof titles)[number];

/** "yes" when the participant will claim RCI CRE points (CRR number then required). */
export type CreClaim = "yes" | "no";

export const professions: { value: Profession; label: string }[] = [
  { value: "audiologist", label: "Audiologist" },
  { value: "speech_language_pathologist", label: "Speech-language pathologist" },
  { value: "clinical_psychologist", label: "Clinical psychologist" },
  { value: "special_educator", label: "Special educator" },
  { value: "occupational_therapist", label: "Occupational therapist" },
  { value: "other", label: "Other" },
  { value: "student", label: "Student" },
];

/** Categories offered on the regular online programme form. */
export const onlineProfessions: { value: Profession; label: string }[] = [
  { value: "student", label: "ASLP student / intern" },
  { value: "audiologist", label: "Audiologist (not claiming CRE)" },
  { value: "speech_language_pathologist", label: "Speech-language pathologist (not claiming CRE)" },
  { value: "allied_health", label: "Doctor / allied health professional" },
  { value: "clinical_psychologist", label: "Psychologist" },
  { value: "special_educator", label: "Special educator" },
  { value: "occupational_therapist", label: "Occupational therapist" },
  { value: "parent_caregiver", label: "Parent / caregiver" },
  { value: "other", label: "Other" },
];

/** Every category the site accepts, from either form or the desk. */
export const allProfessions: { value: Profession; label: string }[] = [
  ...professions,
  { value: "allied_health", label: "Doctor / allied health professional" },
  { value: "parent_caregiver", label: "Parent / caregiver" },
];

export function isOnlineTrack(row: { source: string }): boolean {
  return row.source === "online";
}

export function professionLabel(profession: Profession): string {
  switch (profession) {
    case "audiologist":
      return "Audiologist";
    case "speech_language_pathologist":
      return "Speech-language pathologist";
    case "clinical_psychologist":
      return "Clinical psychologist";
    case "special_educator":
      return "Special educator";
    case "occupational_therapist":
      return "Occupational therapist";
    case "rehabilitation_professional":
      return "Other rehabilitation professional";
    case "other":
      return "Other";
    case "student":
      return "Student";
    case "allied_health":
      return "Doctor / allied health professional";
    case "parent_caregiver":
      return "Parent / caregiver";
    default: {
      const unknown: never = profession;
      return unknown;
    }
  }
}

export function sourceLabel(source: ArrivalSource): string {
  switch (source) {
    case "rci":
      return "RCI listing";
    case "site":
      return "This website";
    case "join":
      return "Webex join page";
    case "direct":
      return "Direct";
    case "desk":
      return "Added by a coordinator";
    case "online":
      return "Participant registration (no CRE points)";
    default: {
      const unknown: never = source;
      return unknown;
    }
  }
}

// Photographs: replace each monogram with a consented headshot from the
// resource person or the department. Save files in public/faculty/ and
// do not take portraits from the open web.
export function sessionTickId(time: string): string {
  return `session-${time.replace(":", "")}`;
}

export const sessions = [
  {
    time: "10:00",
    meridiem: "AM",
    title: "The RPwD Act, 2016: Rights, Responsibilities and Reach – An Overview",
    person: "Dr. Shwetha Prabhu",
    crr: "A18456",
    initials: "SP",
    photo: "/department/shwetha-prabhu.jpg",
    designation: "Professor, Department of Audiology and Speech Language Pathology, Yenepoya University",
    relevance:
      "Opens the Act: the rights it names, the duties it places on institutions, and how far those duties reach into rehabilitation practice.",
  },
  {
    time: "11:00",
    meridiem: "AM",
    title: "Know the 21: Types of Disabilities Recognised under the RPwD Act, 2016",
    person: "Ms. Swathi Chinnasamy",
    crr: "A81760",
    initials: "SC",
    photo: "/faculty/swathi-c.jpg",
    designation: "Assistant Professor, Department of Audiology and Speech Language Pathology, Yenepoya University",
    relevance:
      "Walks through the specified disabilities a certificate can name, so assessment is matched to the schedule of the Act rather than to habit.",
  },
  {
    time: "12:00",
    meridiem: "PM",
    title:
      "Learning, Intellectual and Autism Spectrum Disabilities: Rights and Entitlements under the RPwD Act, 2016 – A Psychologist’s Perspective",
    person: "Ms. Vasudha K G",
    crr: "A85535",
    initials: "VK",
    photo: "/faculty/vasudha-kg.jpg",
    designation: "Assistant Professor in Clinical Psychology, Department of Psychiatry, KMC Mangalore",
    relevance:
      "Takes learning disability, intellectual disability, and autism spectrum disorder from a psychologist’s side of certification, rights, and entitlements.",
  },
  {
    time: "01:00",
    meridiem: "PM",
    title:
      "Rights and Privileges of Persons with Communication Disorders: ASLPs to Deal with Legal and Legislative Aspects",
    person: "Dr. S P Goswami",
    crr: "A00260",
    initials: "SG",
    photo: "/faculty/satyapal-goswami.jpg",
    designation: "Professor of Speech Pathology, All India Institute of Speech and Hearing",
    relevance:
      "Turns to communication disorders and the legal and legislative work audiologists and speech-language pathologists are asked to do.",
  },
] as const;

/** Speakers in display order (not session order): Dr. S P Goswami, Dr. Shwetha Prabhu, Ms. Vasudha K G, Ms. Swathi Chinnasamy. */
const speakerOrder = ["A00260", "A18456", "A85535", "A81760"] as const;

export const speakers = speakerOrder.map((crr) => {
  const index = sessions.findIndex((session) => session.crr === crr);
  return { ...sessions[index], session: index + 1 };
});

export const facultyProfiles = {
  A85535: {
    fullName: "Vasudha Kadikadka Gangadhara",
    role: "Assistant Professor in Clinical Psychology, Department of Psychiatry",
    affiliation: "KMC Mangalore",
    focus: "Department of Psychiatry, Kasturba Medical College, Mangaluru (MAHE).",
    profileUrl: "https://www.manipal.edu/faculty/vasudha-k-g",
    profileLabel: "MAHE faculty page",
    scholarUrl: "https://scholar.google.com/citations?user=d-N4iWYAAAAJ&hl=en",
  },
} as const;

export function facultyProfile(crr: string) {
  if (crr in facultyProfiles) {
    return facultyProfiles[crr as keyof typeof facultyProfiles];
  }
  return null;
}

export const objectives = [
  "Explain the rights, responsibilities, and reach of the RPwD Act, 2016.",
  "Identify the 21 specified disabilities and why the list matters for certification.",
  "Clarify rights and entitlements for learning, intellectual, and autism spectrum disabilities.",
  "Prepare audiologists and speech-language pathologists for the legal and legislative side of communication disorders.",
];

export const audience = [
  "Audiologists",
  "Speech-language pathologists",
  "Clinical psychologists",
  "Special educators",
  "Occupational therapists",
  "Others",
];

export const states = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Outside India",
] as const;

export const officialLinks = [
  {
    title: "Department of Audiology and Speech Language Pathology, Yenepoya Medical College",
    href: "https://www.ymc.yenepoya.edu.in/audiology-speech-department.php",
    note: "The organising department: the BASLP course, clinical services, and the college staff page.",
  },
  {
    title: "Rehabilitation Council of India",
    href: "https://rehabcouncil.nic.in/",
    note: "The statutory council for rehabilitation education and the Central Rehabilitation Register.",
  },
  {
    title: "RPwD Act, 2016 on India Code",
    href: "https://www.indiacode.nic.in/handle/123456789/2155",
    note: "The official text of the Act, arranged by chapter.",
  },
  {
    title: "RPwD Act, 2016 (PDF)",
    href: "https://www.indiacode.nic.in/bitstream/123456789/15939/1/the_rights_of_persons_with_disabilities_act%2C_2016.pdf",
    note: "Full text PDF from India Code.",
  },
  {
    title: "Act, rules, and assessment guidelines",
    href: "https://depwd.gov.in/en/document-category/acts/",
    note: "Department of Empowerment of Persons with Disabilities: the Act, the 2017 rules, and notified guidelines.",
  },
  {
    title: "Guidelines for assessing specified disabilities (14 March 2024)",
    href: "https://depwd.gov.in/en/latest-notified-guidelines-for-assessing-the-extent-of-specified-disabilities-dated-14-03-2024/",
    note: "The current notified assessment guidelines, issued under section 56.",
  },
  {
    title: "Department of Empowerment of Persons with Disabilities",
    href: "https://depwd.gov.in/",
    note: "Central department for disability policy, certification, and the Unique Disability ID.",
  },
  {
    title: "Ministry of Social Justice and Empowerment",
    href: "https://socialjustice.gov.in/",
    note: "The ministry of which DEPwD is a part.",
  },
  {
    title: "National Institutes",
    href: "https://depwd.gov.in/en/national-institutes/",
    note: "Index of national institutes under the department.",
  },
  {
    title: "Swavlamban Card (Unique Disability ID)",
    href: "https://swavlambancard.gov.in/",
    note: "The government portal that issues the disability certificate and the UDID card.",
  },
  {
    title: "Indian Speech and Hearing Association",
    href: "https://www.ishaindia.org.in/",
    note: "Professional association for audiologists and speech-language pathologists.",
  },
] as const;

export const nav = [
  { href: "/programme", label: "Programme" },
  { href: "/faculty", label: "Faculty" },
  { href: "/attend", label: "Attend" },
  { href: "/participants", label: "Participants" },
  { href: "/general", label: "Information" },
  { href: "/brochure", label: "Brochure" },
  { href: "/contact", label: "Contact" },
] as const;

export const bottomNav = [
  { href: "/", label: "Home" },
  { href: "/programme", label: "Programme" },
  { href: "/registration", label: "Register" },
  { href: "/join", label: "Join" },
  { href: "/general", label: "Info" },
] as const;

/** Attendance, RCI exam results and CRE points are entered only from the programme day, usually in bulk. */
export function afterSessionsOpen(now = Date.now()): boolean {
  return now >= Date.parse(programme.sessionsOpenAt);
}
