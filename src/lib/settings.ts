import db from '@/lib/db';

export async function getSystemSetting(key: string, defaultValue = ''): Promise<string> {
  try {
    const setting = await db.systemSetting.findUnique({
      where: { key },
    });
    if (setting && setting.value !== undefined && setting.value !== null) {
      return setting.value;
    }
  } catch (err) {
    console.error(`Error reading setting ${key}:`, err);
  }

  // Fallback to process.env if available
  if (process.env[key] !== undefined) {
    return process.env[key] || defaultValue;
  }

  return defaultValue;
}

export async function setSystemSetting(key: string, value: string): Promise<void> {
  await db.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function getAllSystemSettings(): Promise<Record<string, string>> {
  const defaultKeys = [
    'MERCADO_PAGO_ACCESS_TOKEN',
    'MERCADO_PAGO_PUBLIC_KEY',
    'MERCADO_PAGO_ENVIRONMENT',
    'PLATFORM_NAME',
    'TRIAL_DAYS',
    'SUPPORT_WHATSAPP',
    'SUPPORT_EMAIL',
  ];

  const result: Record<string, string> = {};

  try {
    const dbSettings = await db.systemSetting.findMany();
    dbSettings.forEach((s) => {
      result[s.key] = s.value;
    });
  } catch (err) {
    console.error('Error fetching all settings:', err);
  }

  // Populate defaults or fallback to process.env
  defaultKeys.forEach((k) => {
    if (result[k] === undefined) {
      result[k] = process.env[k] || '';
    }
  });

  return result;
}
