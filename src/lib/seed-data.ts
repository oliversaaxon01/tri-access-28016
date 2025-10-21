import { db } from './db';

export const seedTestUsers = async () => {
  try {
    // Clear existing data for fresh start
    const existingAdmin = await db.getUserByEmail('admin@test.com');
    
    // Only create if users don't exist
    if (!existingAdmin) {
      // Create Admin
      await db.createUser({
        email: 'admin@test.com',
        password: 'admin123',
        name: 'Administrador Principal',
        role: 'admin',
        status: 'approved',
      });
    }

    const existingEmpresa = await db.getUserByEmail('empresa@test.com');
    if (!existingEmpresa) {
      // Create Empresa
      await db.createUser({
        email: 'empresa@test.com',
        password: 'empresa123',
        name: 'Municipalidad de Lima',
        role: 'empresa',
        status: 'approved',
      });
    }

    const existingExperto = await db.getUserByEmail('experto@test.com');
    if (!existingExperto) {
      // Create Experto
      await db.createUser({
        email: 'experto@test.com',
        password: 'experto123',
        name: 'Dr. Carlos Rodríguez',
        role: 'experto',
        status: 'approved',
      });
    }

    return {
      success: true,
      users: [
        { role: 'admin', email: 'admin@test.com', password: 'admin123' },
        { role: 'empresa', email: 'empresa@test.com', password: 'empresa123' },
        { role: 'experto', email: 'experto@test.com', password: 'experto123' },
      ],
    };
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
};
