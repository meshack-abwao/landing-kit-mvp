require('dotenv').config();
const pool = require('./database');

async function updateAddOnsCopy() {
  try {
    console.log('📝 Updating add-ons with ODI/JTBD messaging...');

    const addons = [
      {
        name: 'homepage',
        display_name: 'Central Hub Page',
        job_title: 'Help customers navigate my full product range',
        outcome: 'Minimize time customers spend finding what they want',
        benefit_1: 'Direct customers to the right collection instantly',
        benefit_2: 'Reduce confusion with clear category navigation',
        benefit_3: 'Increase average order value by 35% with cross-selling',
        description: 'Create a central homepage that organizes all your collections and guides customers to exactly what they need in seconds.',
        price: 800
      },
      {
        name: 'ad-management',
        display_name: 'Promotional Banners',
        job_title: 'Announce sales and offers without spamming customers',
        outcome: 'Minimize likelihood customers miss important promotions',
        benefit_1: 'Schedule banners to appear at optimal times',
        benefit_2: 'Update offers instantly without touching code',
        benefit_3: 'Boost promotion visibility by 60% with eye-catching designs',
        description: 'Display timely promotional banners that grab attention without annoying customers—update offers in seconds.',
        price: 500
      },
      {
        name: 'video-creator',
        display_name: 'Product Video Ads',
        job_title: 'Show products in action to boost buyer confidence',
        outcome: 'Minimize uncertainty about product quality and fit',
        benefit_1: 'Auto-generate professional videos from product photos',
        benefit_2: 'Increase purchase confidence with dynamic showcases',
        benefit_3: 'Reduce return rates by 25% with accurate previews',
        description: 'Transform product photos into engaging video ads that show items from every angle—build trust instantly.',
        price: 400
      },
      {
        name: 'mpesa-stk',
        display_name: 'Instant Payment Prompt',
        job_title: 'Get paid immediately without manual follow-up',
        outcome: 'Minimize time between order and payment confirmation',
        benefit_1: 'Auto-trigger M-Pesa prompt on customer\'s phone',
        benefit_2: 'Eliminate manual payment reminders completely',
        benefit_3: 'Reduce abandoned checkouts by 40% with one-tap pay',
        description: 'Automatically send M-Pesa STK push to customers\' phones the moment they order—get paid in 10 seconds.',
        price: 200
      },
      {
        name: 'whatsapp-ai',
        display_name: 'Smart Customer Support',
        job_title: 'Answer customer questions 24/7 without hiring staff',
        outcome: 'Minimize time customers wait for product information',
        benefit_1: 'AI answers FAQs instantly while you sleep',
        benefit_2: 'Handle 10x more inquiries with zero extra effort',
        benefit_3: 'Convert 45% more conversations into sales',
        description: 'AI-powered WhatsApp bot handles customer questions instantly—never lose a sale to slow responses again.',
        price: 500
      },
      {
        name: 'sms-notifications',
        display_name: 'Order Updates via SMS',
        job_title: 'Keep customers informed without constant check-ins',
        outcome: 'Minimize customer anxiety about order status',
        benefit_1: 'Auto-send confirmation and delivery updates',
        benefit_2: 'Reduce "Where\'s my order?" messages by 80%',
        benefit_3: 'Build trust with professional tracking notifications',
        description: 'Automatically notify customers via SMS when orders are confirmed, shipped, and delivered—zero manual work.',
        price: 150
      },
      {
        name: 'email-marketing',
        display_name: 'Customer Re-engagement',
        job_title: 'Bring back previous customers for repeat purchases',
        outcome: 'Minimize effort required to generate repeat business',
        benefit_1: 'Auto-send personalized offers to past buyers',
        benefit_2: 'Recover abandoned carts with timely reminders',
        benefit_3: 'Increase customer lifetime value by 3x',
        description: 'Send targeted emails to past customers with personalized offers—turn one-time buyers into loyal fans.',
        price: 250
      },
      {
        name: 'instagram-shopping',
        display_name: 'Shoppable Instagram Posts',
        job_title: 'Sell directly from Instagram without link friction',
        outcome: 'Minimize steps from Instagram post to purchase',
        benefit_1: 'Tag products in posts for instant shopping',
        benefit_2: 'Eliminate the "link in bio" barrier completely',
        benefit_3: 'Convert Instagram followers into buyers 5x faster',
        description: 'Tag products in Instagram posts and stories—customers buy in 2 taps without leaving the app.',
        price: 400
      }
    ];

    for (const addon of addons) {
      await pool.query(`
        UPDATE add_ons 
        SET 
          display_name = $1,
          description = $2,
          price = $3
        WHERE name = $4
      `, [addon.display_name, addon.description, addon.price, addon.name]);
      
      console.log(`✅ Updated: ${addon.display_name}`);
    }

    // Store full JTBD data in new columns
    await pool.query(`
      ALTER TABLE add_ons 
      ADD COLUMN IF NOT EXISTS job_title TEXT,
      ADD COLUMN IF NOT EXISTS outcome TEXT,
      ADD COLUMN IF NOT EXISTS benefit_1 TEXT,
      ADD COLUMN IF NOT EXISTS benefit_2 TEXT,
      ADD COLUMN IF NOT EXISTS benefit_3 TEXT
    `);

    for (const addon of addons) {
      await pool.query(`
        UPDATE add_ons 
        SET 
          job_title = $1,
          outcome = $2,
          benefit_1 = $3,
          benefit_2 = $4,
          benefit_3 = $5
        WHERE name = $6
      `, [
        addon.job_title,
        addon.outcome,
        addon.benefit_1,
        addon.benefit_2,
        addon.benefit_3,
        addon.name
      ]);
    }

    console.log('🎉 All add-ons updated with ODI/JTBD messaging!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Update failed:', error);
    process.exit(1);
  }
}

updateAddOnsCopy();
