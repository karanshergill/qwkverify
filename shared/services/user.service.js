import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const usersFile = path.join(__dirname, '../../data/users.json');

export async function findUserByPhone(mobileNumber) {
    const data = fs.readFileSync(usersFile, 'utf-8');
    const users = JSON.parse(data);
    return users.find(user => user.mobileNumber === mobileNumber);
}

export async function createUser(userData) {
    const data = fs.readFileSync(usersFile, 'utf-8');
    const users = JSON.parse(data);
    users.push(userData);
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    return userData;
}

/*
to be implemented later
export function findUserByEmail(email) { }
*/