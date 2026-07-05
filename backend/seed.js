const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Clearing old data and seeding fresh NITK data...\n');

    // -------------------------------------------------------
    // CLEAR ALL EXISTING DATA
    // -------------------------------------------------------
    await prisma.event.deleteMany();
    await prisma.club.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ Cleared all existing data\n');

    const password = await bcrypt.hash('12345', 10);

    // -------------------------------------------------------
    // USERS
    // -------------------------------------------------------
    const admin = await prisma.user.create({
        data: { name: 'Mili Dholaria', email: 'mili@nitk.edu.in', password, role: 'admin' }
    });

    const students = await Promise.all([
        prisma.user.create({ data: { name: 'Arjun Sharma',    email: 'arjun@nitk.edu.in',    password, role: 'student' } }),
        prisma.user.create({ data: { name: 'Priya Nair',      email: 'priya@nitk.edu.in',     password, role: 'student' } }),
        prisma.user.create({ data: { name: 'Rohan Mehta',     email: 'rohan@nitk.edu.in',     password, role: 'student' } }),
        prisma.user.create({ data: { name: 'Sneha Kulkarni',  email: 'sneha@nitk.edu.in',     password, role: 'student' } }),
        prisma.user.create({ data: { name: 'Karan Patel',     email: 'karan@nitk.edu.in',     password, role: 'student' } }),
        prisma.user.create({ data: { name: 'Ananya Iyer',     email: 'ananya@nitk.edu.in',    password, role: 'student' } }),
        prisma.user.create({ data: { name: 'Vikram Reddy',    email: 'vikram@nitk.edu.in',    password, role: 'student' } }),
        prisma.user.create({ data: { name: 'Diya Menon',      email: 'diya@nitk.edu.in',      password, role: 'student' } }),
        prisma.user.create({ data: { name: 'Sahil Joshi',     email: 'sahil@nitk.edu.in',     password, role: 'student' } }),
        prisma.user.create({ data: { name: 'Tanvi Desai',     email: 'tanvi@nitk.edu.in',     password, role: 'student' } }),
        prisma.user.create({ data: { name: 'Aditya Kumar',    email: 'aditya@nitk.edu.in',    password, role: 'student' } }),
        prisma.user.create({ data: { name: 'Ishaan Gupta',    email: 'ishaan@nitk.edu.in',    password, role: 'student' } }),
        prisma.user.create({ data: { name: 'Meera Pillai',    email: 'meera@nitk.edu.in',     password, role: 'student' } }),
        prisma.user.create({ data: { name: 'Rahul Singh',     email: 'rahul@nitk.edu.in',     password, role: 'student' } }),
        prisma.user.create({ data: { name: 'Kavya Bhat',      email: 'kavya@nitk.edu.in',     password, role: 'student' } }),
    ]);

    console.log(`✅ Created ${students.length + 1} users (1 admin + ${students.length} students)\n`);

    // -------------------------------------------------------
    // CLUBS
    // -------------------------------------------------------
    const ieee = await prisma.club.create({
        data: { name: 'IEEE NITK', handle: 'ieee_nitk', description: 'Institute of Electrical and Electronics Engineers — NITK Student Branch. Organises workshops, hackathons, and tech talks.' }
    });
    const webclub = await prisma.club.create({
        data: { name: 'Web Enthusiasts Club', handle: 'webclub_nitk', description: 'Official Web Enthusiasts Club of NITK. Building the web, one project at a time.' }
    });
    const sigcrypt = await prisma.club.create({
        data: { name: 'SIG Crypt', handle: 'sigcrypt_nitk', description: 'Special Interest Group for Cryptography and Cybersecurity under IRIS NITK.' }
    });
    const iste = await prisma.club.create({
        data: { name: 'ISTE NITK', handle: 'iste_nitk', description: 'Indian Society for Technical Education — NITK Chapter. Promoting technical excellence and professional development.' }
    });
    const mlclub = await prisma.club.create({
        data: { name: 'ML Club NITK', handle: 'mlclub_nitk', description: 'Machine Learning and AI enthusiasts at NITK. From fundamentals to cutting-edge research.' }
    });
    const toastmasters = await prisma.club.create({
        data: { name: 'Toastmasters NITK', handle: 'toastmasters_nitk', description: 'Develop public speaking, leadership, and communication skills in a supportive environment.' }
    });
    const engineer = await prisma.club.create({
        data: { name: 'Engineer — Tech Fest', handle: 'engineer_nitk', description: 'Organising committee of NITK\'s flagship annual technical festival.' }
    });
    const incident = await prisma.club.create({
        data: { name: 'Incident — Cultural Fest', handle: 'incident_nitk', description: 'The cultural committee of NITK — organising the annual cultural extravaganza Incident.' }
    });

    console.log('✅ Created 8 clubs\n');

    // -------------------------------------------------------
    // EVENTS
    // -------------------------------------------------------
    const today = new Date();
    const daysFrom = (n) => new Date(today.getTime() + n * 24 * 60 * 60 * 1000);

    await prisma.event.create({ data: { title: 'PCB Design Workshop', date: daysFrom(4), time: '10:00 AM', venue: 'ECE Seminar Hall, AB2', description: 'Hands-on workshop on designing Printed Circuit Boards using KiCad. Covers schematic capture, PCB layout, and design rule checks.', registrationLink: 'https://forms.gle/nitkieee', eligibility: 'All years, all branches', clubId: ieee.id } });
    await prisma.event.create({ data: { title: 'Guest Talk: Embedded Systems in EVs', date: daysFrom(9), time: '05:00 PM', venue: 'LT-1, Lecture Hall Complex', description: 'Industry expert from Bosch India speaks on embedded systems in modern electric vehicles — BLDC motor controllers, BMS design, and CAN protocols.', eligibility: 'EEE, ECE, Mech preferred', clubId: ieee.id } });
    await prisma.event.create({ data: { title: 'HackVerse 5.0 — National Hackathon', date: daysFrom(12), time: '09:00 AM', venue: 'New Academic Block, NITK', description: '36-hour national-level hackathon with ₹2,00,000 in prizes. Build in HealthTech, EdTech, FinTech, or Sustainability. Teams of 2-4. Free food and swag for all.', registrationLink: 'https://hackverse.nitk.ac.in', eligibility: 'All NITK students, inter-college teams allowed', clubId: webclub.id } });
    await prisma.event.create({ data: { title: 'Full-Stack Bootcamp — Session 3: React & APIs', date: daysFrom(6), time: '06:00 PM', venue: 'CS Dept Lab, AB1', description: 'Week 3 of the 6-week full-stack bootcamp. Covers React frontends, REST API calls, state management with hooks, and deploying to Vercel.', registrationLink: 'https://forms.gle/webclubbootcamp', eligibility: 'Bootcamp batch only', clubId: webclub.id } });
    await prisma.event.create({ data: { title: 'Capture The Flag (CTF) Competition', date: daysFrom(7), time: '10:00 AM', venue: 'Online + CS Lab', description: 'Test cybersecurity skills in: Web Exploitation, Cryptography, Reverse Engineering, Binary Exploitation, and Forensics. Individual. Prizes for top 3.', registrationLink: 'https://ctf.sigcrypt.nitk.ac.in', eligibility: 'All NITK students', clubId: sigcrypt.id } });
    await prisma.event.create({ data: { title: 'Intro to Ethical Hacking — Workshop', date: daysFrom(15), time: '03:00 PM', venue: 'NTB Seminar Hall', description: 'Beginner-friendly. Linux basics, Nmap scanning, Burp Suite web testing, and OWASP Top 10. Bring your laptop.', registrationLink: 'https://forms.gle/sigcrypthack', eligibility: '1st and 2nd year students', clubId: sigcrypt.id } });
    await prisma.event.create({ data: { title: 'Paper Reading: Attention Is All You Need', date: daysFrom(3), time: '07:00 PM', venue: 'Google Meet (link on joining)', description: 'Weekly paper reading — deep dive into the Transformer paper by Vaswani et al. (2017). Multi-head attention, positional encodings, and why this changed NLP.', registrationLink: 'https://forms.gle/mlclubpaperread', eligibility: 'Some ML background recommended', clubId: mlclub.id } });
    await prisma.event.create({ data: { title: 'Kaggle Competition Prep Session', date: daysFrom(11), time: '06:30 PM', venue: 'CS Dept Conference Room, AB1', description: 'Preparing for the Kaggle Tabular Playground Series. Feature engineering, XGBoost tuning, ensemble methods, and reading top solutions.', eligibility: 'All ML Club members', clubId: mlclub.id } });
    await prisma.event.create({ data: { title: 'Resume & LinkedIn Workshop', date: daysFrom(5), time: '04:30 PM', venue: 'Seminar Hall, AB3', description: 'Industry professionals review your resume live and give feedback. Covers LinkedIn optimisation for internship and job searches. Bring a printed resume.', registrationLink: 'https://forms.gle/istenitk', eligibility: 'Pre-final and final year students', clubId: iste.id } });
    await prisma.event.create({ data: { title: 'Mock Technical Interviews — Season 4', date: daysFrom(18), time: '10:00 AM', venue: 'EC Dept Rooms (assigned on day)', description: 'Paired mock interviews with seniors who cracked placements at Google, Microsoft, Amazon. 45 min — DSA + System Design. Slots limited to 60 students.', registrationLink: 'https://forms.gle/istemock', eligibility: 'Final year (priority), Pre-final (waitlist)', clubId: iste.id } });
    await prisma.event.create({ data: { title: 'Toastmasters Weekly Meeting #112', date: daysFrom(2), time: '07:30 PM', venue: 'Room 101, New Academic Block', description: 'Weekly meeting: Word of the Day, 3 prepared speeches, Table Topics (impromptu), and evaluations. First-timers welcome — just show up!', eligibility: 'Everyone welcome', clubId: toastmasters.id } });
    await prisma.event.create({ data: { title: 'Inter-College Debate: AI in Society', date: daysFrom(21), time: '02:00 PM', venue: 'Seminar Hall, LHC', description: 'British Parliamentary debate featuring teams from NITK, NMIT, SJCE, and Manipal. Motion: "AI will do more harm than good to society." Open for audience.', registrationLink: 'https://forms.gle/toastdebate', eligibility: 'Team registration closes 10 days before', clubId: toastmasters.id } });
    await prisma.event.create({ data: { title: 'Engineer 2026 — Technical Symposium', date: daysFrom(30), time: '09:00 AM', venue: 'NITK Main Campus', description: 'NITK\'s flagship 3-day national technical festival. 50+ events including competitive programming, robotics, hardware hacking, and guest lectures. 10,000+ footfall.', registrationLink: 'https://engineer.nitk.ac.in', eligibility: 'Open to all — national level', deadline: daysFrom(25), clubId: engineer.id } });
    await prisma.event.create({ data: { title: 'Robowar — Combat Robotics', date: daysFrom(31), time: '11:00 AM', venue: 'Indoor Stadium, NITK', description: 'Build a combat robot under 15 kg and fight in our arena. Featherweight and Lightweight categories. Cash prizes of ₹30,000.', registrationLink: 'https://engineer.nitk.ac.in/robowar', eligibility: 'Teams of 2-5, inter-college allowed', deadline: daysFrom(26), clubId: engineer.id } });
    await prisma.event.create({ data: { title: 'Incident 2026 — Cultural Fest', date: daysFrom(45), time: '05:00 PM', venue: 'Open Air Theatre, NITK', description: 'NITK\'s 3-day cultural extravaganza. Pro-nights with top artists, dance competitions, band performances, fashion show, photography contest and more.', registrationLink: 'https://incident.nitk.ac.in', eligibility: 'All students — inter-college for competitions', deadline: daysFrom(40), clubId: incident.id } });
    await prisma.event.create({ data: { title: 'Nukkad Natak — Street Play Competition', date: daysFrom(46), time: '04:00 PM', venue: 'NITK Main Lawns', description: 'Street theatre on social themes as part of Incident 2026. Teams of 5-12, duration 15-20 minutes. Cash prize ₹15,000 for winner.', registrationLink: 'https://incident.nitk.ac.in/nukkad', eligibility: 'Teams of 5-12, inter-college allowed', clubId: incident.id } });

    console.log('✅ Created 16 events across 8 clubs\n');

    // -------------------------------------------------------
    // FOLLOW CLUBS
    // -------------------------------------------------------
    const allClubs = [ieee, webclub, sigcrypt, iste, mlclub, toastmasters, engineer, incident];

    // Admin follows all
    await prisma.user.update({
        where: { id: admin.id },
        data: { clubs: { connect: allClubs.map(c => ({ id: c.id })) } }
    });

    // Each student follows a different combo
    const followMap = [
        [ieee, webclub, mlclub],           // arjun
        [sigcrypt, engineer, incident],    // priya
        [iste, toastmasters],              // rohan
        [webclub, sigcrypt, mlclub],       // sneha
        [ieee, iste, engineer],            // karan
        [mlclub, toastmasters, incident],  // ananya
        [ieee, sigcrypt, webclub],         // vikram
        [incident, toastmasters, iste],    // diya
        [webclub, engineer, mlclub],       // sahil
        [sigcrypt, iste, ieee],            // tanvi
        [mlclub, webclub, toastmasters],   // aditya
        [engineer, ieee, incident],        // ishaan
        [toastmasters, sigcrypt, mlclub],  // meera
        [iste, webclub, engineer],         // rahul
        [ieee, mlclub, incident],          // kavya
    ];

    for (let i = 0; i < students.length; i++) {
        await prisma.user.update({
            where: { id: students[i].id },
            data: { clubs: { connect: followMap[i].map(c => ({ id: c.id })) } }
        });
    }

    console.log('✅ Linked all users to clubs\n');

    // -------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------
    console.log('🎉 Seeding complete!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  LOGIN CREDENTIALS (all passwords: 12345)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Admin   : mili@nitk.edu.in');
    console.log('  Students: arjun / priya / rohan / sneha / karan');
    console.log('            ananya / vikram / diya / sahil / tanvi');
    console.log('            aditya / ishaan / meera / rahul / kavya');
    console.log('            (all @nitk.edu.in)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  8 clubs  |  16 events  |  16 users (1 admin + 15 students)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
    .then(async () => { await prisma.$disconnect(); })
    .catch(async (e) => {
        console.error('Seed error:', e);
        await prisma.$disconnect();
        process.exit(1);
    });
