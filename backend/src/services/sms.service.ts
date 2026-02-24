import axios from 'axios';

const FAST2SMS_API_URL = 'https://www.fast2sms.com/dev/bulkV2';

export const sendOtpViaSms = async (phone: string, otp: string) => {
  try {
    const response = await axios.post(
      FAST2SMS_API_URL,
      {
        route: 'otp',
        variables_values: otp,
        numbers: phone,
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
        },
      }
    );

    if (response.data.return === true) {
      return { success: true };
    } else {
      throw new Error('Failed to send OTP');
    }
  } catch (error) {
    console.error('SMS Error:', error);
    throw error;
  }
};

export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
