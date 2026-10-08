import SystemConfig, { DEFAULT_CONFIG, ISystemConfig } from './model';

export async function getSystemConfig(): Promise<ISystemConfig> {
  let config = await SystemConfig.findOne({ key: 'system' });
  if (!config) {
    config = await SystemConfig.create(DEFAULT_CONFIG);
  }
  return config;
}

export async function updateSystemConfig(data: Partial<ISystemConfig>): Promise<ISystemConfig> {
  const updated = await SystemConfig.findOneAndUpdate(
    { key: 'system' },
    { $set: data },
    { new: true, upsert: true, runValidators: true }
  );
  return updated;
}
