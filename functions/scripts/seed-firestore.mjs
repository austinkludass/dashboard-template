#!/usr/bin/env node
import fs from "fs";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const DEFAULT_PROMOTE_EMAIL = "big@ben.com";
const DEFAULT_USER_COLLECTION = "tutors";
const ADMIN_ROLE = "Admin";
const BLOCKED_PROJECTS = new Set(["wisemindsadmin"]);

const parseArgs = (argv) => {
  const args = {
    dryRun: false,
    help: false,
    project: "",
    only: "",
    promoteEmail: DEFAULT_PROMOTE_EMAIL,
    userCollection: DEFAULT_USER_COLLECTION,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--project") args.project = argv[i + 1] || "";
    else if (arg === "--only") args.only = argv[i + 1] || "";
    else if (arg === "--promote-email") args.promoteEmail = argv[i + 1] || "";
    else if (arg === "--user-collection") args.userCollection = argv[i + 1] || "";
  }

  return args;
};

const printUsage = () => {
  console.log(`Usage: node scripts/seed-firestore.mjs [options]

Options:
  --project <id>           Firebase project id (defaults to .firebaserc or env)
  --only <list>            Comma-separated: curriculums,subjects,subjectGroups,locations,admin
  --promote-email <email>  Email to promote (default: ${DEFAULT_PROMOTE_EMAIL})
  --user-collection <name> User meta collection (default: ${DEFAULT_USER_COLLECTION})
  --dry-run                Print actions without writing
  --help                   Show this help
`);
};

const normalizeOnlyKey = (value) =>
  value.toLowerCase().replace(/[^a-z]/g, "");

const resolveOnlySet = (onlyRaw) => {
  if (!onlyRaw) return new Set();
  const map = new Map([
    ["curriculums", "curriculums"],
    ["curriculum", "curriculums"],
    ["subjects", "subjects"],
    ["subjectgroups", "subjectGroups"],
    ["groups", "subjectGroups"],
    ["subjectgroup", "subjectGroups"],
    ["locations", "locations"],
    ["location", "locations"],
    ["admin", "admin"],
    ["promote", "admin"],
    ["tutors", "admin"],
  ]);
  const onlySet = new Set();
  onlyRaw
    .split(",")
    .map((item) => normalizeOnlyKey(item.trim()))
    .filter(Boolean)
    .forEach((key) => {
      const normalized = map.get(key);
      if (normalized) onlySet.add(normalized);
    });
  return onlySet;
};

const getProjectIdFromFirebaserc = () => {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const rootDir = path.resolve(currentDir, "..", "..");
  const rcPath = path.join(rootDir, ".firebaserc");
  if (!fs.existsSync(rcPath)) return "";
  try {
    const json = JSON.parse(fs.readFileSync(rcPath, "utf8"));
    return json?.projects?.default || "";
  } catch (error) {
    return "";
  }
};

const resolveProjectId = (argProject) => {
  if (argProject) return argProject;
  if (process.env.FIREBASE_PROJECT_ID) return process.env.FIREBASE_PROJECT_ID;
  if (process.env.GCLOUD_PROJECT) return process.env.GCLOUD_PROJECT;
  if (process.env.GOOGLE_CLOUD_PROJECT) return process.env.GOOGLE_CLOUD_PROJECT;
  return getProjectIdFromFirebaserc();
};

const seedCollections = {
  curriculums: [
    { id: "curriculum-maths", name: "Mathematics" },
    { id: "curriculum-english", name: "English" },
    { id: "curriculum-science", name: "Science" },
  ],
  subjects: [
    { id: "subject-algebra", name: "Algebra", curriculumId: "curriculum-maths" },
    { id: "subject-geometry", name: "Geometry", curriculumId: "curriculum-maths" },
    { id: "subject-reading", name: "Reading Comprehension", curriculumId: "curriculum-english" },
    { id: "subject-writing", name: "Writing", curriculumId: "curriculum-english" },
    { id: "subject-biology", name: "Biology", curriculumId: "curriculum-science" },
  ],
  subjectGroups: [
    {
      id: "group-maths-core",
      name: "Maths Core",
      subjectIds: ["subject-algebra", "subject-geometry"],
    },
    {
      id: "group-english-core",
      name: "English Core",
      subjectIds: ["subject-reading", "subject-writing"],
    },
    {
      id: "group-science-core",
      name: "Science Core",
      subjectIds: ["subject-biology"],
    },
  ],
  locations: [
    {
      id: "location-main",
      name: "Main Campus",
      address: "1 Main St, Canberra",
      tutorBays: [
        { id: "bay-1", name: "Bay 1" },
        { id: "bay-2", name: "Bay 2" },
      ],
    },
  ],
};

const ensureDoc = async (db, collectionName, docData, dryRun) => {
  const ref = db.collection(collectionName).doc(docData.id);
  const snap = await ref.get();
  if (snap.exists) {
    return { id: docData.id, action: "skipped" };
  }
  if (!dryRun) {
    const { id, ...payload } = docData;
    await ref.set(payload);
  }
  return { id: docData.id, action: dryRun ? "dry-run" : "created" };
};

const seedCollection = async (db, collectionName, docs, dryRun) => {
  const results = [];
  for (const docData of docs) {
    results.push(await ensureDoc(db, collectionName, docData, dryRun));
  }
  return results;
};

const promoteAdmin = async ({ db, auth, email, userCollection, dryRun }) => {
  const user = await auth.getUserByEmail(email);
  const userRef = db.collection(userCollection).doc(user.uid);
  const userSnap = await userRef.get();
  const displayName = user.displayName || "";
  const [firstName, ...rest] = displayName.split(" ").filter(Boolean);
  const payload = {
    wiseMindsEmail: email,
    role: ADMIN_ROLE,
  };
  if (!userSnap.exists) {
    payload.firstName = firstName || email.split("@")[0];
    payload.lastName = rest.join(" ");
    payload.tutorColor = "#6E6E6E";
    payload.capabilities = [];
    payload.blockedStudents = [];
    payload.availability = {};
    payload.unavailability = [];
  }
  if (!dryRun) {
    await userRef.set(payload, { merge: true });
  }
  return { uid: user.uid, action: dryRun ? "dry-run" : "updated" };
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    process.exit(0);
  }

  const projectId = resolveProjectId(args.project);
  if (!projectId) {
    console.error("Missing project id. Use --project or set FIREBASE_PROJECT_ID.");
    process.exit(1);
  }
  if (BLOCKED_PROJECTS.has(projectId)) {
    console.error(`Refusing to run on blocked project: ${projectId}`);
    process.exit(1);
  }

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.warn(
      "GOOGLE_APPLICATION_CREDENTIALS is not set. " +
        "Set it to a service account JSON path or use ADC via gcloud."
    );
  }

  initializeApp({
    credential: applicationDefault(),
    projectId,
  });

  const db = getFirestore();
  const auth = getAuth();
  const onlySet = resolveOnlySet(args.only);
  const shouldRun = (key) => onlySet.size === 0 || onlySet.has(key);
  const summary = {};

  if (shouldRun("curriculums")) {
    summary.curriculums = await seedCollection(
      db,
      "curriculums",
      seedCollections.curriculums,
      args.dryRun
    );
  }
  if (shouldRun("subjects")) {
    summary.subjects = await seedCollection(
      db,
      "subjects",
      seedCollections.subjects,
      args.dryRun
    );
  }
  if (shouldRun("subjectGroups")) {
    summary.subjectGroups = await seedCollection(
      db,
      "subjectGroups",
      seedCollections.subjectGroups,
      args.dryRun
    );
  }
  if (shouldRun("locations")) {
    summary.locations = await seedCollection(
      db,
      "locations",
      seedCollections.locations,
      args.dryRun
    );
  }
  if (shouldRun("admin")) {
    summary.admin = await promoteAdmin({
      db,
      auth,
      email: args.promoteEmail,
      userCollection: args.userCollection,
      dryRun: args.dryRun,
    });
  }

  console.log(JSON.stringify({ projectId, dryRun: args.dryRun, summary }, null, 2));
};

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
