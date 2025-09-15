import axios from 'axios';
import logger from '../utilities/logger.js';
import dotenv from 'dotenv';
dotenv.config();

// SMS Gateway URL
const SMS_GATEWAY_URL = process.env.SMS_GATEWAY_URL;

// Function to send OTP SMS
export async function sendOtpSms(mobileNumber, otp) {
    const message = `Your Verification Code is ${otp}. Don't share with anyone. Team Abacus.`;
    const params = {
        username: process.env.SMS_GATEWAY_USERNAME,
        pass: process.env.SMS_GATEWAY_PASSWORD,
        senderid: process.env.SMS_GATEWAY_SENDER_ID,
        dest_mobileno: mobileNumber,
        msgtype: 'TXT',
        message: message,
        response: 'Y',
    };

    try {
        const response = await axios.get(SMS_GATEWAY_URL, { params });
        logger.info(`SMS sent to ${mobileNumber}: ${response.data}`);
        return response.data;
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            logger.error(`Error sending SMS to ${mobileNumber}: ${error.message}`);
            if (error.response?.data) {
                logger.error(`Gateway response: ${error.response.data}`);
            }
        }
        throw new Error('Failed to send OTP SMS');
    }
}

export async function sendTxnSms(mobileNumber, scanPoints) {
    const message = `Your account has been credited with Rs. ${scanPoints} cashback. - Team ABACUS DESK IT SOLUTIONS PVT. LTD.`;
    
    const params = {
        username: process.env.SMS_GATEWAY_USERNAME,
        pass: process.env.SMS_GATEWAY_PASSWORD,
        senderid: process.env.SMS_GATEWAY_SENDER_ID,
        dest_mobileno: mobileNumber,
        msgtype: 'TXT',
        message: message,
        response: 'Y',
    };

    try {
        const response = await axios.get(SMS_GATEWAY_URL, { params });
        logger.info(`SMS sent to ${mobileNumber}: ${response.data}`);
        return response.data;
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            logger.error(`Error sending SMS to ${mobileNumber}: ${error.message}`);
            if (error.response?.data) {
                logger.error(`Gateway response: ${error.response.data}`);
            }
        }
        throw new Error('Failed to send OTP SMS');
    }
}