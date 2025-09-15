import { prisma } from "../config/database.js";
import admin from "./firebase.js";

export const sendNotification = async ({ title, body, id }) => {
    let tokens = [];

    if (userId) {
        const userTokens = await prisma.InfluencerCustomer.findMany({
            where: { id },
        });
        tokens = userTokens.map((t) => t.token);
    } else {
        const allTokens = await prisma.InfluencerCustomer.findMany();
        tokens = allTokens.map((t) => t.token);
    }

    if (tokens.length === 0) {
        throw new Error("No tokens found");
    }

    const message = {
        notification: { title, body },
        tokens,
    };

    return await admin.messaging().sendEachForMulticast(message);
};
