import axios from 'axios';

const FAST2SMS_API_URL = 'https://www.fast2sms.com/dev/bulkV2';

export const sendOtpViaSms = async (phone: string, otp: string): Promise<{ success: boolean; requestId?: string }> => {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey || apiKey === 'your-api-key') {
    console.log('FAST2SMS_API_KEY not configured, skipping SMS');
    return { success: false };
  }

  try {
    const response = await axios.get(FAST2SMS_API_URL, {
      params: {
        authorization: apiKey,
        route: 'otp',
        variables_values: otp,
        flash: '0',
        numbers: phone,
      },
      headers: {
        'cache-control': 'no-cache',
      },
      timeout: 10000, // 10 second timeout
    });

    console.log('Fast2SMS response:', JSON.stringify(response.data));

    if (response.data && response.data.return === true) {
      return { success: true, requestId: response.data.request_id };
    } else {
      console.error('Fast2SMS failed:', response.data?.message || 'Unknown error');
      return { success: false };
    }
  } catch (error: any) {
    console.error('SMS Error:', error?.response?.data || error?.message || 'Unknown error');
    return { success: false };
  }
};

export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
