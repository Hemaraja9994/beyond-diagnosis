export const programme = {
  title: "Beyond the Diagnosis",
  subtitle: "Disability Assessment, Certification and Entitlements under the RPwD Act, 2016",
  dateLabel: "Saturday, 19 December 2026",
  day: "19",
  month: "December 2026",
  start: "10:00 IST",
  mode: "Online",
  level: "Zonal",
  language: "English",
  acknowledgement: "CRE-26111620026773",
  instituteCode: "KK048",
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
  brochurePdf: "/brochure/beyond-the-diagnosis.pdf",
  brochureImage: "/brochure/beyond-the-diagnosis.png",
  paymentUrl: "https://rzp.io/rzp/FCDoSjbc",
  // Drop the official emblem at public/brand/yenepoya-emblem.svg.
  // Use a file supplied by the university. Do not download a logo from an image site.
} as const;

export const committee = [
  { role: "Organising chairperson", names: ["Dr. Shwetha Prabhu"] },
  { role: "Organising secretary", names: ["Ms. Swathi Chinnasamy", "Ms. Rachana R Uchil"] },
] as const;

export const invitation = [
  "The Department of Audiology and Speech Language Pathology invites audiologists, speech-language pathologists, clinical psychologists, and other rehabilitation professionals to a zonal Continuing Rehabilitation Education programme.",
  "The day stays with one question: once a diagnosis is made, what does the Rights of Persons with Disabilities Act, 2016 require of assessment, certification, and the entitlements a person can claim?",
  "Sessions move from the Act as a whole, to the 21 recognised disabilities, to learning, intellectual and autism spectrum disabilities, and then to the legal work of clinicians who serve people with communication disorders.",
];

export type Profession =
  | "audiologist"
  | "speech_language_pathologist"
  | "clinical_psychologist"
  | "rehabilitation_professional"
  | "student";

export type ArrivalSource = "rci" | "site" | "join" | "direct";

export const professions: { value: Profession; label: string }[] = [
  { value: "audiologist", label: "Audiologist" },
  { value: "speech_language_pathologist", label: "Speech-language pathologist" },
  { value: "clinical_psychologist", label: "Clinical psychologist" },
  { value: "rehabilitation_professional", label: "Other rehabilitation professional" },
  { value: "student", label: "Student" },
];

export function professionLabel(profession: Profession): string {
  switch (profession) {
    case "audiologist":
      return "Audiologist";
    case "speech_language_pathologist":
      return "Speech-language pathologist";
    case "clinical_psychologist":
      return "Clinical psychologist";
    case "rehabilitation_professional":
      return "Other rehabilitation professional";
    case "student":
      return "Student";
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
    relevance:
      "Takes learning disability, intellectual disability, and autism spectrum disorder from a psychologist’s side of certification, rights, and entitlements.",
  },
  {
    time: "01:00",
    meridiem: "PM",
    title:
      "Rights and Privileges of Persons with Communication Disorders: ASLPs to Deal with Legal and Legislative Aspects",
    person: "Dr. Satyapal Puri Goswami",
    crr: "A00260",
    initials: "SG",
    photo: "/faculty/satyapal-goswami.jpg",
    relevance:
      "Turns to communication disorders and the legal and legislative work audiologists and speech-language pathologists are asked to do.",
  },
] as const;

export const facultyProfiles = {
  A85535: {
    fullName: "Vasudha Kadikadka Gangadhara",
    role: "Assistant Professor and Consultant Clinical Psychologist",
    affiliation:
      "Department of Psychiatry, Kasturba Medical College, Mangaluru (Manipal Academy of Higher Education)",
    focus:
      "Clinical psychology, mental health, social and emotional learning, stress and coping, relationship dynamics, and cognitive and psychological well-being.",
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
  "Other rehabilitation professionals",
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
