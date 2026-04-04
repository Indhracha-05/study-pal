import { chromium } from 'playwright';
import { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType } from 'docx';
import * as fs from 'fs';

async function generateComprehensiveReport() {
    console.log("Launching browser for comprehensive report...");
    const browser = await chromium.launch({ headless: true });
    // Use Dark theme preference
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
    const page = await context.newPage();

    const screenshots = {};

    console.log("1. Navigating to Home...");
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(2000);
    // Force dark mode
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    screenshots['home'] = await page.screenshot({ path: 'home_dark.png' });

    console.log("2. Navigating to Signup...");
    await page.goto('http://localhost:5173/signup');
    await page.waitForTimeout(1000);
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    screenshots['signup'] = await page.screenshot({ path: 'signup_dark.png' });

    console.log("3. Navigating to Login...");
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(1000);
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    screenshots['login'] = await page.screenshot({ path: 'login_dark.png' });

    console.log("Logging in as user...");
    await page.fill('#email', 'indhragopikannan@gmail.com');
    await page.fill('#password', 'bhavani@89');
    await page.click('button[type="submit"]');

    console.log("Waiting for dashboard...");
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.waitForTimeout(5000); // Wait for data to fetch
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    screenshots['dashboard'] = await page.screenshot({ path: 'dashboard_main.png' });

    console.log("Navigating to Calendar...");
    await page.goto('http://localhost:5173/dashboard/calendar');
    await page.waitForTimeout(3000);
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    screenshots['calendar'] = await page.screenshot({ path: 'calendar.png' });

    console.log("Navigating to Groups...");
    await page.goto('http://localhost:5173/dashboard/groups');
    await page.waitForTimeout(3000);
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    screenshots['groups'] = await page.screenshot({ path: 'groups_main.png' });

    // Try to enter the first group room we see or wait...
    // Actually we can just screenshot the groups, and the user knows we did study room. We can navigate to a generic room or first room.
    // If user is in a room:
    try {
        const link = await page.$('a[href*="/room"]');
        if (link) {
            await link.click();
            await page.waitForTimeout(3000);
            await page.evaluate(() => document.documentElement.classList.add('dark'));
            screenshots['room'] = await page.screenshot({ path: 'study_room.png' });
        }
    } catch (e) {
        console.log("Could not find a room link.");
    }

    console.log("Navigating to Leaderboard...");
    await page.goto('http://localhost:5173/dashboard/leaderboard');
    await page.waitForTimeout(3000);
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    screenshots['leaderboard'] = await page.screenshot({ path: 'leaderboard.png' });

    console.log("Navigating to Reports...");
    await page.goto('http://localhost:5173/dashboard/reports');
    await page.waitForTimeout(3000);
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    screenshots['reports'] = await page.screenshot({ path: 'intel.png' });

    console.log("Navigating to Settings...");
    await page.goto('http://localhost:5173/dashboard/settings');
    await page.waitForTimeout(2000);
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    screenshots['settings'] = await page.screenshot({ path: 'settings_dark.png' });

    await browser.close();
    console.log("Screenshots captured, assembling Comprehensive Report...");

    function createHeading(text) {
        return new Paragraph({
            text: text,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
        });
    }

    function createSubHeading(text) {
        return new Paragraph({
            text: text,
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 300, after: 100 }
        });
    }

    function createBullet(text) {
        return new Paragraph({
            text: text,
            bullet: { level: 0 }
        });
    }

    function createBody(text) {
        return new Paragraph({
            text: text,
            spacing: { after: 150 }
        });
    }

    function createImage(buffer) {
        if (!buffer) return new Paragraph({ text: "[Image Capture Failed]" });
        return new Paragraph({
            children: [
                new ImageRun({
                    data: buffer,
                    transformation: { width: 620, height: 387 }
                })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
        });
    }

    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: {
                        color: "000000",
                    },
                },
            },
        },
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    text: "[INSERT YOUR PROJECT NAME]",
                    heading: HeadingLevel.TITLE,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Student Name: ", bold: true }),
                        new TextRun("[INSERT NAME]\n"),
                        new TextRun({ text: "Registration Number: ", bold: true }),
                        new TextRun("[INSERT REG NO]\n\n"),
                        new TextRun({ text: "GitHub Link: ", bold: true }),
                        new TextRun("[INSERT YOUR GITHUB LINK]\n"),
                        new TextRun({ text: "Vercel Link: ", bold: true }),
                        new TextRun("[INSERT YOUR VERCEL LINK]\n"),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 1000 }
                }),

                new Paragraph({ text: "1. Project Introduction", heading: HeadingLevel.HEADING_1 }),
                createBody("This document presents a comprehensive Web Programming Project Report on a futuristic, cyberpunk-themed productivity and study tracking web application. The core objective of this project is to create an immersive, gamified environment that significantly reduces friction in starting study sessions and maintains user engagement through data-driven insights and real-time collaboration. The architecture leverages a modern React/Vite frontend merged with Firebase backend services, deploying highly reactive UI components styled in 'Dark Mode' to emphasize focus and aesthetics."),
                
                new Paragraph({ text: "2. Front Door Architecture", heading: HeadingLevel.HEADING_1 }),
                createHeading("2.1 Home & Landing Page"),
                createImage(screenshots['home']),
                createBody("What it does: Acts as the primary entry interface. Displays the core value propositions—Study Groups, Focus Timers, Leaderboards, and Intelligence Stats—hovering over a custom anti-gravity particle canvas."),
                createBody("How it works: Utilizes responsive Tailwind CSS grid layouts and React Router for fluid Single Page Application navigation without hard reloads."),
                createBody("Why it is useful: Provides an immediate sense of the 'cyberpunk/dark aesthetic', creating a premium and highly focused first impression."),

                createHeading("2.2 Authentication: Signup & Login"),
                createImage(screenshots['login']),
                createBody("What it does: Handles user onboarding, routing, and access control. Ensures only authenticated users can access the dashboard and their personal study data."),
                createBody("How it works: Integrates Firebase Authentication (signInWithEmailAndPassword). On failure, it provides localized toast notifications (using Sonner) for credential mismatch or network issues."),
                createBody("Why it is useful: Secures user data and enables personalized tracking. The minimal design prevents cognitive overload during onboarding."),

                new Paragraph({ text: "3. Command Center (Dashboard)", heading: HeadingLevel.HEADING_1 }),
                createImage(screenshots['dashboard']),
                createHeading("3.1 Real-Time Analytics & Top Boxes"),
                createBody("The dashboard heavily emphasizes daily progress through 'Top Boxes' tracking Total Hours, Current Streak, Rank, and XP. These aggregate data directly from Firestore and react to live state changes."),
                
                createHeading("3.2 Advanced Pomodoro Integration"),
                createBody("The central piece of the dashboard is the highly customizable Pomodoro Timer."),
                createBullet("Focus Modes: Users can dynamically toggle between Focus, Short Break, and Long Break."),
                createBullet("Task Linkage: Tasks created in the system can be linked directly to the timer session, tracking exactly how many 'Pomos' a specific task took."),
                createBullet("Feedback Loop: On session completion, the timer forces a sync, updates the XP bar, and triggers auditory feedback."),
                
                createHeading("3.3 Intelligent Task Management"),
                createBody("The task system is heavily engineered for rapid interaction."),
                createBullet("Deadline Precedence: Tasks are automatically sorted linearly—overdue tasks first, followed by today's tasks, then upcoming tasks."),
                createBullet("Strike Off & Clear: Users strike off completed tasks, visually satisfying completion. A 'Clear Active' tool gracefully sweeps completed items off the dashboard into the archive."),
                
                createHeading("3.4 Calendar Integration"),
                createImage(screenshots['calendar']),
                createBody("The built-in calendar visualizes upcoming task deadlines, allowing for high-level chronological planning directly linked to the tasks rendered in the dashboard."),

                new Paragraph({ text: "4. Multiplayer & Collaboration (Sanctuaries)", heading: HeadingLevel.HEADING_1 }),
                createImage(screenshots['groups']),
                createHeading("4.1 Global vs Private Groups"),
                createBody("What it does: Segregates collaboration into 'Global Halls' (open to everyone) and 'Private Sanctuaries' (hidden groups requiring unique invite codes)."),
                createBody("How it works: Implements complex Firestore querying and atomic array manipulations (arrayUnion) to prevent member clashing during simultaneous joins."),
                
                createHeading("4.2 Study Rooms (In-Session)"),
                (screenshots['room'] ? createImage(screenshots['room']) : createBody("[Internal Room Screenshot Linked Here]")),
                createBody("What it does: The actual collaborative space. Contains real-time text chat, an active participant roster, and shared focus energy."),
                createBody("How it works: Uses Firestore `onSnapshot` listeners to detect real-time presence, updating the UI instantly when someone enters, leaves, or sends a text transmission."),

                new Paragraph({ text: "5. Gamification & Study Intel", heading: HeadingLevel.HEADING_1 }),
                
                createHeading("5.1 Global Leaderboard"),
                createImage(screenshots['leaderboard']),
                createBody("What it does: Fosters healthy competition by ranking users globally based on their Study XP and Streaks."),
                createBody("Why it's useful: Turns solitary studying into a community sport, significantly boosting retention and consistency."),

                createHeading("5.2 Study Intel Engine"),
                createImage(screenshots['reports']),
                createBody("What it does: Consolidates study historical logs into beautifully rendered bar charts for Daily, Weekly, and Monthly trajectories."),
                createBody("How it works: Parses Firebase timestamp entries and maps them via the Recharts visualization library, reacting dynamically to standard and dark mode theming."),

                new Paragraph({ text: "6. Configuration & System Settings", heading: HeadingLevel.HEADING_1 }),
                createImage(screenshots['settings']),
                createBody("What it does: The ultimate control panel. Allows users to alter the literal fabric of the application."),
                createBullet("Duration Sliders: Custom sliders to edit Focus, Short Break, and Long Break durations."),
                createBullet("Aesthetic Controls: Dropdowns and toggles to manipulate the Particle Background Density, Adaptive HUD layout, and overall Neon Glow Intensity."),
                createBullet("Notification & Goal Matrix: Preferences to set Daily Hour goals and toggle system-wide acoustics and toast notifications."),
                createBody("How it works: Deeply integrated with `localStorage` and global React contexts (TimerContext) to ensure changes are instantly reflected without a page reload."),

                new Paragraph({ text: "7. Conclusion", heading: HeadingLevel.HEADING_1 }),
                createBody("This web programming project is a testament to the power of modern architectural engineering. By combining aggressive gamification metrics, complex state management, secure NoSQL database structuring, and a meticulously crafted presentation layer (strictly enforcing visual hierarchy via Dark Mode schemas), the result is an incredibly robust, production-ready study catalyst."),

                new Paragraph({
                    text: "⚠️ USER EDIT REQUIRED",
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 600, after: 200 }
                }),
                createBullet("Ensure [INSERT YOUR PROJECT NAME], [INSERT NAME], and [INSERT REG NO] are replaced."),
                createBullet("Insert the actual GitHub and Vercel hyperlinks on Page 1."),
                createBullet("Review all paragraphs to ensure they align perfectly with your internal academic requirements for length and tone.")
            ]
        }]
    });

    try {
        const buffer = await Packer.toBuffer(doc);
        fs.writeFileSync("Comprehensive_Project_Report.docx", buffer);
        console.log("Comprehensive_Project_Report.docx generated successfully.");
    } catch (e) {
        console.error("Error generating docx:", e);
    }
}

generateComprehensiveReport();
