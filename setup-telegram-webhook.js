const https = require('https');

const token = process.env.TELEGRAM_BOT_TOKEN;
const webhookUrl = 'https://vibe-code-tracker.replit.app/api/telegram/webhook';

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN environment variable not found');
  process.exit(1);
}

const setWebhook = async () => {
  const data = JSON.stringify({ url: webhookUrl });
  
  const options = {
    hostname: 'api.telegram.org',
    port: 443,
    path: `/bot${token}/setWebhook`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log('Webhook setup response:', responseData);
        resolve(JSON.parse(responseData));
      });
    });

    req.on('error', (error) => {
      console.error('Error setting webhook:', error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
};

const getWebhookInfo = async () => {
  const options = {
    hostname: 'api.telegram.org',
    port: 443,
    path: `/bot${token}/getWebhookInfo`,
    method: 'GET'
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log('Webhook info:', responseData);
        resolve(JSON.parse(responseData));
      });
    });

    req.on('error', (error) => {
      console.error('Error getting webhook info:', error);
      reject(error);
    });

    req.end();
  });
};

const main = async () => {
  console.log('Setting up Telegram webhook...');
  console.log('Token:', token.substring(0, 10) + '...');
  console.log('Webhook URL:', webhookUrl);
  
  try {
    console.log('\nCurrent webhook info:');
    await getWebhookInfo();
    
    console.log('\nSetting new webhook...');
    await setWebhook();
    
    console.log('\nUpdated webhook info:');
    await getWebhookInfo();
    
    console.log('\nWebhook setup completed!');
  } catch (error) {
    console.error('Failed to setup webhook:', error);
  }
};

main();