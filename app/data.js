/* Obsidia demo data. Everything here is fictional. "Today" is Thursday 19 November. */
window.OBS_DATA = {
  agency: { name: "Demo agency", manager: "Camille" },
  today: "Thursday 19 November",
  handledToday: 38,

  properties: [
    { id: "gambetta", title: "Top-floor 3-room flat with terrace", addr: "14 rue Gambetta, Paris 16e", area: 68, rooms: 3, rent: 1150, charges: 90,
      status: "open", photo: "../img/apartment.webp", applicants: 46, viewing: "Thu 19 Nov · 10:30",
      phone: "04 28 29 61 10", email: "gambetta@in.obsidia.app",
      works: [["Bathroom fully renovated", "March 2024"], ["Terrace waterproofing redone", "June 2022"], ["Boiler replaced", "October 2021"]],
      facts: "Available 1 December. Pets allowed. Lift. DPE C." },
    { id: "oberkampf", photo: "../img/oberkampf.webp", title: "Bright 2-room flat", addr: "5 rue Oberkampf, Paris 11e", area: 41, rooms: 2, rent: 1320, charges: 80,
      status: "open", applicants: 18, viewing: "Sat 21 Nov · 11:00",
      phone: "04 28 29 61 24", email: "oberkampf@in.obsidia.app",
      works: [["Kitchen renovated", "January 2025"], ["Double glazing installed", "September 2023"]],
      facts: "Available 15 December. No lift, 3rd floor. DPE D." },
    { id: "foch", photo: "../img/foch.webp", title: "2-room flat, apt 3", addr: "8 avenue Foch, Paris 16e", area: 45, rooms: 2, rent: 1150, charges: 70,
      status: "checkin", note: "Lease signed · key check-in today 14:00",
      phone: "04 28 29 61 31", email: "foch3@in.obsidia.app",
      works: [["Roof of the building redone", "May 2023"], ["Electrical rewiring", "February 2022"]],
      facts: "New tenant from 19 November. Building: 8 avenue Foch." },
    { id: "hugo", photo: "../img/hugo.webp", title: "Studio", addr: "22 rue Victor Hugo, Paris 16e", area: 28, rooms: 1, rent: 780, charges: 50,
      status: "checkout", note: "Notice given · key check-out today 17:30",
      phone: "04 28 29 61 37", email: "hugo@in.obsidia.app",
      works: [["Floors sanded and varnished", "April 2021"]],
      facts: "Inventory ready. Relisting from 1 December." },
    { id: "lumiere", photo: "../img/cler.webp", title: "4-room family flat", addr: "3 rue Cler, Paris 7e", area: 92, rooms: 4, rent: 2650, charges: 180,
      status: "let", phone: "04 28 29 61 42", email: "cler@in.obsidia.app",
      works: [["Facade cleaned", "July 2024"], ["Heating system serviced", "October 2025"]],
      facts: "Let since March 2023." }
  ],

  tenants: [
    { id: "t1", name: "Claire Durand", title: "Ms", unit: "Apt 7, 12 rue de Lévis, Paris 17e", rent: 1480, status: "late", days: 4, last: "First reminder sent Mon 16 Nov", phone: "06 41 22 18 90" },
    { id: "t2", name: "Marc Lefèvre", title: "Mr", unit: "Apt 4B, 8 avenue Foch, Paris 16e", rent: 1150, status: "late", days: 6, last: "Second reminder sent today 09:00", phone: "06 72 15 33 08" },
    { id: "t3", name: "Nadia Haddad", title: "Ms", unit: "Apt 5, 3 rue Cler, Paris 7e", rent: 2650, status: "paid", last: "€2,650 received Fri 13 Nov", phone: "06 18 90 44 21" },
    { id: "t4", name: "Paul Mercier", title: "Mr", unit: "Apt 2A, 31 rue de Charonne, Paris 11e", rent: 940, status: "paid", last: "€940 received Tue 10 Nov", phone: "06 33 51 70 12" },
    { id: "t5", name: "Julie Bernard", title: "Ms", unit: "Apt 1, 17 rue Lepic, Paris 18e", rent: 1020, status: "paid", last: "€1,020 received Mon 9 Nov", phone: "06 84 02 66 49" },
    { id: "t6", name: "Karim Saidi", title: "Mr", unit: "Apt 3C, 40 rue Saint-Maur, Paris 11e", rent: 860, status: "due", last: "Due Wed 25 Nov", phone: "06 57 39 81 03" }
  ],

  requests: [
    { id: "r1", tenant: "Paul Mercier", unit: "Apt 2A, 31 rue de Charonne", what: "Leaking kitchen tap", action: "Plumber booked · Fri 20 Nov 09:00", state: "scheduled", time: "09:12" },
    { id: "r2", tenant: "Julie Bernard", unit: "Apt 1, 17 rue Lepic", what: "Intercom not working", action: "Electrician booked · Mon 23 Nov 14:00", state: "scheduled", time: "Yesterday" },
    { id: "r3", tenant: "Nadia Haddad", unit: "Apt 5, 3 rue Cler", what: "Asked for a rent receipt for October", action: "Receipt sent by email", state: "done", time: "Tue" }
  ],

  /* Score is the agent's overall rating. Income is the multiple of rent plus charges. */
  applicants: {
    gambetta: [
      ["Sophie Laurent", 3.6, "Permanent", "Visale", 100, 94, "Email", "08:03"],
      ["Mehdi Arfaoui", 3.2, "Permanent", "Parent", 100, 91, "WhatsApp", "Yesterday"],
      ["Clara Weber", 3.1, "Civil servant", "None", 95, 88, "Email", "Yesterday"],
      ["Thomas Girard", 3.0, "Permanent", "Visale", 100, 86, "Email", "Tue"],
      ["Inès Benali", 3.0, "Permanent", "Parent", 95, 84, "Call", "Tue"],
      ["Lucas Petit", 2.9, "Permanent", "Visale", 90, 81, "Email", "Tue"],
      ["Emma Dubois", 2.8, "Civil servant", "None", 100, 79, "WhatsApp", "Mon"],
      ["Hugo Lambert", 2.8, "Permanent", "Parent", 85, 76, "Email", "Mon"],
      ["Camille Fontaine", 2.7, "Permanent", "Visale", 90, 74, "Email", "Mon"],
      ["Nathan Rossi", 2.6, "Fixed-term", "Parent", 95, 70, "Call", "Mon"],
      ["Julien Moreau", 2.4, "Fixed-term", "None", 70, 61, "Email", "Sun"],
      ["Anaïs Roux", 2.1, "Freelance", "None", 60, 55, "WhatsApp", "Sun"]
    ],
    oberkampf: [
      ["Maëlle Henry", 3.4, "Permanent", "Visale", 100, 90, "Email", "08:40"],
      ["Yanis Cherif", 3.1, "Permanent", "Parent", 100, 87, "Call", "Yesterday"],
      ["Lena Vogel", 2.9, "Civil servant", "None", 90, 80, "WhatsApp", "Yesterday"],
      ["Romain Garnier", 2.7, "Permanent", "None", 95, 75, "Email", "Tue"],
      ["Sarah Cohen", 2.6, "Fixed-term", "Parent", 90, 69, "Email", "Tue"],
      ["Adrien Lopez", 2.3, "Freelance", "Visale", 80, 62, "Call", "Mon"],
      ["Chloé Martin", 2.0, "Student", "Parent", 75, 58, "WhatsApp", "Mon"],
      ["Bastien Leroy", 1.8, "Fixed-term", "None", 60, 47, "Email", "Sun"]
    ]
  },

  /* CRM: every contact the agent has spoken to, with what it collected */
  contacts: [
    { id: "k1", name: "Léa Martin", type: "Prospect", prop: "gambetta", phone: "06 12 48 77 30", email: "lea.martin@mail.fr", income: "€3,900 net / month", contract: "Permanent", movein: "1 December", source: "Call · 02:14 today", last: "Documents list sent by text" },
    { id: "k2", name: "Jonas Keller", type: "Prospect", prop: "gambetta", phone: "+49 151 2240 8813", email: "jonas.keller@post.de", income: "Not given yet", contract: "Permanent", movein: "January", source: "WhatsApp · 07:41 today", last: "Answered in German" },
    { id: "k3", name: "Sophie Laurent", type: "Applicant", prop: "gambetta", phone: "06 55 21 09 87", email: "s.laurent@mail.fr", income: "€4,460 net / month", contract: "Permanent", movein: "1 December", source: "Email · 08:03 today", last: "File rated 94 · invited to the viewing" },
    { id: "k4", name: "Marc Lefèvre", type: "Tenant", prop: "foch", phone: "06 72 15 33 08", email: "marc.lefevre@mail.fr", income: "", contract: "", movein: "", source: "Tenant since 2022", last: "Second rent reminder today 09:00" },
    { id: "k5", name: "Paul Mercier", type: "Tenant", prop: null, phone: "06 33 51 70 12", email: "p.mercier@mail.fr", income: "", contract: "", movein: "", source: "Tenant since 2021", last: "Plumber booked Fri 09:00" },
    { id: "k6", name: "Maëlle Henry", type: "Applicant", prop: "oberkampf", phone: "06 20 74 31 55", email: "maelle.h@mail.fr", income: "€4,760 net / month", contract: "Permanent", movein: "15 December", source: "Email · 08:40 today", last: "File rated 90" }
  ],

  conversations: [
    { id: "c1", name: "Léa Martin", role: "Prospect", prop: "gambetta", chan: "call", time: "02:14", contact: "k1",
      summary: "Asked about 14 rue Gambetta. Contact details, income and move-in date collected.",
      outcomes: ["Lead created in the CRM", "Documents list sent by text"],
      msgs: [["contact", "Hello, is the flat on rue Gambetta still available?"],
             ["agent", "Yes, from 1 December. Rent is €1,150 plus €90 charges. Can I take your details?"],
             ["contact", "Léa Martin, permanent contract, €3,900 net a month. I could move in on 1 December."],
             ["agent", "Thank you, Léa. I'm texting you the list of documents. Once your file is complete you'll be considered for the viewing on Thursday at 10:30."]] },
    { id: "c2", name: "Jonas Keller", role: "Prospect", prop: "gambetta", chan: "whatsapp", time: "07:41", contact: "k2",
      summary: "Asked which documents are needed. Answered in German.",
      outcomes: ["Answered in 6 s", "Viewing slots offered"],
      msgs: [["contact", "Hallo, welche Unterlagen brauchen Sie für die Wohnung in der Rue Gambetta?", "Hello, which documents do you need for the flat on rue Gambetta?"],
             ["agent", "Hallo Jonas, bitte senden Sie Ausweis, die letzten 3 Gehaltsabrechnungen und Ihren Arbeitsvertrag. Besichtigung: Do 10:30 oder Sa 11:00.", "Hello Jonas, please send your ID, your last 3 payslips and your employment contract. Viewing: Thu 10:30 or Sat 11:00."]] },
    { id: "c3", name: "Sophie Laurent", role: "Applicant", prop: "gambetta", chan: "email", time: "08:03", contact: "k3",
      summary: "Complete file received for 14 rue Gambetta. Rated and ranked.",
      outcomes: ["File rated 94 · rank 1 of 46", "Invited to the viewing Thu 10:30"],
      msgs: [["contact", "Hello, please find attached my complete application for the flat at 14 rue Gambetta: ID, three payslips, employment contract, tax notice and Visale certificate."],
             ["agent", "Thank you, Sophie. Your file is complete and has been reviewed. You're invited to the viewing on Thursday 19 November at 10:30, 14 rue Gambetta, 6th floor."]] },
    { id: "c4", name: "Marc Lefèvre", role: "Tenant", prop: "foch", chan: "sms", time: "09:00", contact: "k4",
      summary: "€1,150 six days late. Second reminder sent to the tenant.",
      outcomes: ["Second reminder sent", "Call planned tomorrow if unpaid"],
      msgs: [["sys", "Rent of €1,150 due 13 November not received"],
             ["agent", "Hello Mr Lefèvre, this is Obsidia for your landlord. Your November rent of €1,150 is six days late. Could you tell us when you will pay it?"]] },
    { id: "c5", name: "Paul Mercier", role: "Tenant", prop: null, chan: "whatsapp", time: "09:12", contact: "k5",
      summary: "Leaking tap reported. Plumber booked for Friday 09:00.",
      outcomes: ["Plumber booked · Fri 20 Nov 09:00", "Tenant confirmed he will be home"],
      msgs: [["contact", "Hello, the kitchen tap has been leaking since last night."],
             ["agent", "Thank you for letting us know, Mr Mercier. A plumber is booked for Friday 20 November at 09:00. Will someone be home?"],
             ["contact", "Yes, I'll be there."],
             ["agent", "Perfect, I've confirmed it with the plumber. You'll get a reminder on Thursday evening."]] }
  ],

  agenda: [
    { id: "a1", time: "10:30", kind: "Viewing", icon: "cal", where: "14 rue Gambetta · top 10 applicants invited" },
    { id: "a2", time: "14:00", kind: "Key check-in", icon: "key", where: "8 avenue Foch, apt 3 · lease signed" },
    { id: "a3", time: "17:30", kind: "Key check-out", icon: "door", where: "22 rue Victor Hugo · inventory ready" }
  ]
};
