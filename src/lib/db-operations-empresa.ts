// Operations specific to Empresa dashboard - finding experts
import { ExpertProfile } from './db';
import { getAllProfiles } from './db-operations';

export const getExpertsForEmpresa = async (categories: string[]): Promise<ExpertProfile[]> => {
  const allProfiles = await getAllProfiles();
  
  if (categories.length === 0) {
    return allProfiles.filter(p => p.validated);
  }
  
  // Filter experts that have at least one matching category
  const filtered = allProfiles.filter(profile => 
    profile.validated && 
    profile.categories?.some(cat => categories.includes(cat))
  );
  
  return filtered;
};
