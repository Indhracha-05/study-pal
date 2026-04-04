import { chromium } from 'playwright';
import { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType } from 'docx';
import * as fs from 'fs';

async function takeScreenshotsAndGenerateReport() {
    console.log("Launching browser...");
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    const screenshots = {};

    console.log("Navigating to Home...");
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(2000);
    screenshots['home'] = await page.screenshot({ path: 'home.png' });

    console.log("Navigating to Signup...");
    await page.goto('http://localhost:5173/signup');
    await page.waitForTimeout(1000);
    screenshots['signup'] = await page.screenshot({ path: 'signup.png' });

    // Fill signup form to get an authenticated session securely
    console.log("Signing up dummy user...");
    const randomNum = Math.floor(Math.random() * 100000);
    await page.fill('#first-name', 'Anon');
    await page.fill('#last-name', 'User');
    await page.fill('#email', `anon${randomNum}@test.com`);
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    console.log("Waiting for dashboard...");
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.waitForTimeout(3000);
    screenshots['dashboard'] = await page.screenshot({ path: 'dashboard.png' });

    console.log("Navigating to Groups...");
    await page.goto('http://localhost:5173/dashboard/groups');
    await page.waitForTimeout(2000);
    screenshots['groups'] = await page.screenshot({ path: 'groups.png' });

    console.log("Navigating to Reports...");
    await page.goto('http://localhost:5173/dashboard/reports');
    await page.waitForTimeout(2000);
    screenshots['reports'] = await page.screenshot({ path: 'reports.png' });

    console.log("Navigating to Settings...");
    await page.goto('http://localhost:5173/dashboard/settings');
    await page.waitForTimeout(2000);
    screenshots['settings'] = await page.screenshot({ path: 'settings.png' });

    await browser.close();
    console.log("Screenshots captured, generating report...");

    const doc = new Document({
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
                new Paragraph({
                    text: "Project Introduction",
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 400, after: 200 }
                }),
                new Paragraph({
                    text: "This project is a modern, gamified study and productivity tracker designed to mimic a futuristic or cyberpunk-style terminal. It provides robust tools for focus management, task tracking, community study sessions, and detailed analytics to help users optimize their productivity."
                }),
                
                // Homepage
                new Paragraph({
                    text: "1. Landing Page",
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 600, after: 200 }
                }),
                new Paragraph({
                    children: [
                        new ImageRun({
                            data: screenshots['home'],
                            transformation: { width: 600, height: 375 }
                        })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 }
                }),
                new Paragraph({
                    text: "What it does: The landing page serves as the entry point, showcasing the application's unique design and core value propositions (Study Groups, Focus Timer, Leaderboards)."
                }),
                new Paragraph({
                    text: "How it works: Built with React, Vite, and styled with Tailwind CSS, leveraging an animated particle background system for a highly dynamic visual feel."
                }),
                new Paragraph({ text: "Why it is useful: Creates an engaging first impression, directing users seamlessly into the authentication flow to start tracking." }),

                // Dashboard
                new Paragraph({
                    text: "2. Main Dashboard & Timer (Focus System)",
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 600, after: 200 }
                }),
                new Paragraph({
                    children: [
                        new ImageRun({
                            data: screenshots['dashboard'],
                            transformation: { width: 600, height: 375 }
                        })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 }
                }),
                new Paragraph({
                    text: "What it does: The central hub of the application. It includes a Pomodoro-style focus timer, an XP/leveling progression system, and a quick-access task list."
                }),
                new Paragraph({
                    text: "How it works: Utilizes React Context API to manage global timer states. Progression is synced in real-time to Firebase Firestore."
                }),
                new Paragraph({ text: "Why it is useful: Keeps users highly engaged through gamification (XP for studying) and provides immediate access to their core study tools." }),

                // Groups
                new Paragraph({
                    text: "3. Collaborative Study Groups",
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 600, after: 200 }
                }),
                new Paragraph({
                    children: [
                        new ImageRun({
                            data: screenshots['groups'],
                            transformation: { width: 600, height: 375 }
                        })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 }
                }),
                new Paragraph({
                    text: "What it does: Allows users to establish or join 'Sanctuaries' (study rooms) where they can study alongside friends or random peers in real-time."
                }),
                new Paragraph({
                    text: "How it works: Interacts with Firebase Firestore using atomic operations (arrayUnion) to safely add users to group rosters and manage real-time presence."
                }),
                new Paragraph({ text: "Why it is useful: Provides accountability and a sense of community, critical factors in maintaining long-term study habits." }),

                // Reports
                new Paragraph({
                    text: "4. Study Intel / Analytics Engine",
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 600, after: 200 }
                }),
                new Paragraph({
                    children: [
                        new ImageRun({
                            data: screenshots['reports'],
                            transformation: { width: 600, height: 375 }
                        })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 }
                }),
                new Paragraph({
                    text: "What it does: A comprehensive analytics breakdown of study sessions across days, weeks, and months."
                }),
                new Paragraph({
                    text: "How it works: Aggregates historical session data queried from Firestore and visualizes it using the Recharts library."
                }),
                new Paragraph({ text: "Why it is useful: Helps users identify productivity trends and actively adjust their study schedules based on statistical performance." }),

                // Special / UI
                 new Paragraph({
                    text: "Special Features & UI Architecture",
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 600, after: 200 }
                }),
                new Paragraph({
                    text: "• Real-time Offline Caching: Firebase is configured with persistent local cache, ensuring the application remains fast and robust even under spotty network conditions.\n• Modern UI System: Heavily utilizes Tailwind CSS, Shadcn UI components, and custom CSS variables for a dynamic, reactive 'Glow' aesthetic.\n• State Management: Employs a complex multi-context structure (AuthContext, TimerContext) to avoid prop drilling and maintain real-time sync across distant components."
                }),

                new Paragraph({
                    text: "Conclusion",
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 600, after: 200 }
                }),
                new Paragraph({
                    text: "This project successfully merges strict academic productivity mechanics (like Pomodoro styling) with modern, user-centric web design patterns. The deployment via Vite and Vercel ensures a blistering fast, scalable application ready for real-world usage."
                }),

                new Paragraph({
                    text: "⚠️ USER EDIT REQUIRED",
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 600, after: 200 }
                }),
                new Paragraph({
                    text: "- Replace [INSERT YOUR PROJECT NAME], [INSERT NAME], and [INSERT REG NO] on the Cover Page.\n- Replace [INSERT YOUR GITHUB LINK] and [INSERT YOUR VERCEL LINK].\n- Adjust any textual descriptions if your institution requires specific wording."
                })
            ],
        }],
    });

    try {
        const buffer = await Packer.toBuffer(doc);
        fs.writeFileSync("StudyPal_Project_Report.docx", buffer);
        console.log("Project_Report.docx generated successfully.");
    } catch (e) {
        console.error("Error generating docx:", e);
    }
}

takeScreenshotsAndGenerateReport();

