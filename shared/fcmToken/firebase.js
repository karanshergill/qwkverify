import admin from "firebase-admin";
import fs from "fs";
import path from "path";

const serviceAccountPath = path.resolve("shared/fcmToken/firebase-service-account.json");
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

export default admin;
