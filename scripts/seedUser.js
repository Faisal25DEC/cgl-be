// scripts/seedUser.js
import 'dotenv/config.js';
import mongoose from 'mongoose';
import User from '../models/User.js';

function pickEnum(pathName, fallback) {
  const p = User.schema.path(pathName);
  const allowed = p?.enumValues || [];
  const envKey = `SEED_${pathName.toUpperCase()}`;
  const fromEnv = process.env[envKey];

  if (allowed.length) {
    if (fromEnv && allowed.includes(fromEnv)) return fromEnv;
    return allowed[0]; // pick the first allowed value
  }
  // no enum constraint; use fallback if provided
  return fromEnv || fallback;
}

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.DB_NAME || undefined,
    });
    console.log('Connected. Seeding user...');

    // Show what the schema expects (helps debugging)
    const userTypeAllowed = User.schema.path('userType')?.enumValues || [];
    if (userTypeAllowed.length) {
      console.log('Allowed userType values:', userTypeAllowed);
    }

    const email = process.env.SEED_EMAIL || 'test@example.com';
    const password = process.env.SEED_PASSWORD || 'Passw0rd!';

    const payload = {
      email,
      password, // will be hashed by pre('save')

      // Required fields in your schema:
      firstName: process.env.SEED_FIRSTNAME || 'Test',
      lastName: process.env.SEED_LASTNAME || 'User',
      phone: process.env.SEED_PHONE || '0000000000',
      country: process.env.SEED_COUNTRY || 'CA',

      // Dynamically pick a valid enum for userType
      userType: pickEnum('userType', 'user'),
    };

    let user = await User.findOne({ email });

    if (!user) {
      user = new User(payload);
      await user.save();
      console.log('✅ Created seed user:', email, '(password:', password + ')');
    } else {
      // Fill missing fields only; set RESET_SEED_PASSWORD=true to force password change
      let needsSave = false;

      for (const [k, v] of Object.entries(payload)) {
        if (k === 'password') continue; // handled separately if RESET_SEED_PASSWORD=true
        if (user[k] == null || user[k] === '') {
          user[k] = v;
          needsSave = true;
        }
      }

      if (process.env.RESET_SEED_PASSWORD === 'true') {
        user.password = password; // will hash due to pre('save')
        needsSave = true;
      }

      if (needsSave) {
        await user.save();
        console.log('ℹ️ Updated existing user:', email);
      } else {
        console.log('ℹ️ User already exists and is up-to-date:', email);
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
