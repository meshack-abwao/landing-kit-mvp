require('dotenv').config();
const pool = require('./database');

async function updateFonts() {
  try {
    console.log('🔤 Adding font pairings...');

    // Add font columns to themes table
    await pool.query(`
      ALTER TABLE themes 
      ADD COLUMN IF NOT EXISTS heading_font VARCHAR(100),
      ADD COLUMN IF NOT EXISTS body_font VARCHAR(100),
      DROP COLUMN IF EXISTS font_family
    `);

    const fontPairings = [
      { theme: 'warm-sunset', heading: 'Playfair Display', body: 'Inter', vibe: 'Luxury Fashion' },
      { theme: 'cool-ocean', heading: 'Space Grotesk', body: 'Inter', vibe: 'Tech Modern' },
      { theme: 'royal-purple', heading: 'Syne', body: 'DM Sans', vibe: 'Bold Contemporary' },
      { theme: 'fresh-mint', heading: 'Outfit', body: 'Inter', vibe: 'Friendly Approachable' },
      { theme: 'midnight-dark', heading: 'Inter', body: 'Inter', vibe: 'Minimal Clean' },
      { theme: 'rose-gold', heading: 'Playfair Display', body: 'Lora', vibe: 'Elegant Classic' },
      { theme: 'cosmic-purple', heading: 'Space Grotesk', body: 'Space Grotesk', vibe: 'Futuristic' }
    ];

    for (const fp of fontPairings) {
      await pool.query(`
        UPDATE themes 
        SET heading_font = $1, body_font = $2
        WHERE name = $3
      `, [fp.heading, fp.body, fp.theme]);
      
      console.log(`✅ ${fp.theme}: ${fp.heading} + ${fp.body} (${fp.vibe})`);
    }

    // Add 5 more theme options
    const newThemes = [
      {
        name: 'electric-blue',
        display_name: 'Electric Blue',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        primary_color: '#667eea',
        heading_font: 'Montserrat',
        body_font: 'Inter',
        animation_style: 'dynamic',
        is_premium: false
      },
      {
        name: 'sunset-orange',
        display_name: 'Sunset Orange',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        primary_color: '#f5576c',
        heading_font: 'Nunito',
        body_font: 'Inter',
        animation_style: 'smooth',
        is_premium: true
      },
      {
        name: 'forest-green',
        display_name: 'Forest Green',
        gradient: 'linear-gradient(135deg, #0BA360 0%, #3CBA92 100%)',
        primary_color: '#0BA360',
        heading_font: 'Raleway',
        body_font: 'Open Sans',
        animation_style: 'smooth',
        is_premium: false
      },
      {
        name: 'golden-hour',
        display_name: 'Golden Hour',
        gradient: 'linear-gradient(135deg, #FDBB2D 0%, #3A1C71 100%)',
        primary_color: '#FDBB2D',
        heading_font: 'Bebas Neue',
        body_font: 'Roboto',
        animation_style: 'bold',
        is_premium: true
      },
      {
        name: 'arctic-white',
        display_name: 'Arctic White',
        gradient: 'linear-gradient(135deg, #E0EAFC 0%, #CFDEF3 100%)',
        primary_color: '#4A90E2',
        heading_font: 'Poppins',
        body_font: 'Inter',
        animation_style: 'smooth',
        is_premium: false
      }
    ];

    for (const theme of newThemes) {
      await pool.query(`
        INSERT INTO themes (name, display_name, gradient, primary_color, heading_font, body_font, animation_style, is_premium)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (name) DO UPDATE SET
          heading_font = $5,
          body_font = $6
      `, [
        theme.name,
        theme.display_name,
        theme.gradient,
        theme.primary_color,
        theme.heading_font,
        theme.body_font,
        theme.animation_style,
        theme.is_premium
      ]);
      
      console.log(`✅ Added theme: ${theme.display_name}`);
    }

    console.log('🎉 Font pairings complete! 12 total themes with curated typography.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Font update failed:', error);
    process.exit(1);
  }
}

updateFonts();
