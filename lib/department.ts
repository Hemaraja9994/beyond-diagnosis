export const departmentUrl = "https://www.ymc.yenepoya.edu.in/audiology-speech-department.php";

export const department = {
  name: "Department of Audiology and Speech Language Pathology",
  college: "Yenepoya Medical College",
  phone: "7337798055",
  email: "aslp@yenepoya.edu.in",
  hours: "Monday to Saturday, 8:30 a.m. to 3:30 p.m.",
  outreachDay: "Thursday",
  summary:
    "The department began in 2009 as a unit of Otorhinolaryngology. It became an independent department in 2020 and is accredited by the Rehabilitation Council of India. It teaches the Bachelor of Audiology and Speech-Language Pathology and provides screening, diagnosis, and rehabilitation for hearing, speech, language, and communication disorders.",
  course:
    "The bachelor’s programme is three academic years plus a ten-month internship. The Rehabilitation Council of India approved it in 2020.",
} as const;

export const clinicalServices = {
  audiology: [
    "Pure tone and speech audiometry",
    "Newborn hearing screening",
    "Hearing-aid fitting and counselling",
    "Cochlear implant counselling",
    "Vestibular assessment and rehabilitation",
    "Tinnitus assessment and retraining",
    "Immittance, otoacoustic emissions, and electrophysiology",
  ],
  speech: [
    "Child language disorders",
    "Neuro-communication and motor speech disorders",
    "Fluency, voice, and speech-sound disorders",
    "Dysphagia and laryngectomy",
    "Cleft lip and palate",
    "Auditory verbal therapy",
  ],
} as const;

export const outreach = [
  { centre: "Chethana Special School", person: "Ms. Priyanka Nayak" },
  { centre: "Vijetha Special School", person: "Mrs. Minusha I S" },
  { centre: "Vitla Lions Club", person: "Mr. Hemaraja Nayaka S" },
  { centre: "Navajeevana", person: "Ms. Pavana M J" },
] as const;

export type DepartmentStaff = {
  name: string;
  role: string;
  email: string | null;
  photo: string | null;
  initials: string;
};

// Portraits are the photographs published on the Yenepoya Medical College
// department page. Placeholder silhouettes on that page are omitted.
// Ms. Niha Kuraisha has left. Ms. Praneetha is not on the staff.
// Ms. Ananya Shettigar has joined; the college page does not list her yet.
export const departmentStaff: DepartmentStaff[] = [
  {
    name: "Dr. Shwetha Prabhu",
    role: "Associate Professor and Head of the Department",
    email: "shwethaprabhu@yenepoya.edu.in",
    photo: "/department/shwetha-prabhu.jpg",
    initials: "SP",
  },
  {
    name: "Mr. Hemaraja Nayaka S",
    role: "Assistant Professor",
    email: "hemaraja@yenepoya.edu.in",
    photo: "/department/hemaraja-nayaka.jpg",
    initials: "HN",
  },
  {
    name: "Ms. Nimalka Maria Sequeira",
    role: "Assistant Professor",
    email: "nimalka@yenepoya.edu.in",
    photo: "/department/nimalka-sequeira.jpg",
    initials: "NS",
  },
  {
    name: "Mr. Srikanth Nayak",
    role: "Assistant Professor",
    email: "srikanthnayak@yenepoya.edu.in",
    photo: "/department/srikanth-nayak.jpg",
    initials: "SN",
  },
  {
    name: "Ms. Merin Mathews",
    role: "Assistant Professor",
    email: "merinmathews@yenepoya.edu.in",
    photo: null,
    initials: "MM",
  },
  {
    name: "Ms. Priyanka Nayak",
    role: "Assistant Professor",
    email: "priyanka@yenepoya.edu.in",
    photo: "/department/priyanka-nayak.jpg",
    initials: "PN",
  },
  {
    name: "Ms. Pavana M J",
    role: "Assistant Professor",
    email: "pavanamj@yenepoya.edu.in",
    photo: "/department/pavana-mj.jpg",
    initials: "PM",
  },
  {
    name: "Ms. Shana Mariyam Basheer",
    role: "Assistant Professor",
    email: "shana.mbasheer@yenepoya.edu.in",
    photo: null,
    initials: "SB",
  },
  {
    name: "Ms. Pratheeksha B",
    role: "Clinical Supervisor",
    email: "pratheekshab@yenepoya.edu.in",
    photo: "/department/pratheeksha-b.jpg",
    initials: "PB",
  },
  {
    name: "Mrs. Minusha I S",
    role: "Clinical Supervisor",
    email: "minushais@yenepoya.edu.in",
    photo: "/department/minusha-is.jpg",
    initials: "MI",
  },
  {
    name: "Ms. Rachana R Uchil",
    role: "Clinical Supervisor",
    email: "rachanaruchil@yenepoya.edu.in",
    photo: "/department/rachana-uchil.jpg",
    initials: "RU",
  },
  {
    name: "Ms. Ananya Shettigar",
    role: "Joined the department",
    email: null,
    photo: null,
    initials: "AS",
  },
];
