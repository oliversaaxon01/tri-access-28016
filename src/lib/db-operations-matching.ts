// Matching operations for automated matching events
import { db, Challenge, ExpertProfile, Match } from './db';
import { findBestMatches } from './matching';
import { getAllChallenges, getAllProfiles, createMatch } from './db-operations';

export interface MatchingResult {
  success: boolean;
  matchesCreated: number;
  errors: string[];
}

export const executeMatching = async (
  weights: { expertise: number; budget: number; deadline: number; availability: number },
  threshold: number = 20
): Promise<MatchingResult> => {
  const result: MatchingResult = {
    success: true,
    matchesCreated: 0,
    errors: []
  };

  try {
    // Get all active challenges
    const challenges = await getAllChallenges();
    const activeChallenges = challenges.filter(c => c.status === 'active');

    console.log('=== Starting matching ===');
    console.log('Total challenges:', challenges.length);
    console.log('Active challenges:', activeChallenges.length);

    // Get all expert profiles (only validated ones)
    const allProfiles = await getAllProfiles();
    const validatedProfiles = allProfiles.filter(p => p.validated);

    console.log('Total profiles:', allProfiles.length);
    console.log('Validated profiles:', validatedProfiles.length);
    
    // Debug: show all profiles with categories
    allProfiles.forEach(p => {
      console.log('Profile:', p.userId, 'Validated:', p.validated, 'Categories:', p.categories);
    });

    if (activeChallenges.length === 0) {
      result.errors.push('No hay retos activos para emparejar');
      return result;
    }

    if (validatedProfiles.length === 0) {
      result.errors.push('No hay expertos validados disponibles');
      return result;
    }

    // Find best matches using the matching algorithm
    const potentialMatches = findBestMatches(activeChallenges, validatedProfiles, weights, threshold);

    console.log('Threshold used:', threshold);
    console.log('Potential matches found:', potentialMatches.length);
    potentialMatches.forEach(pm => {
      console.log('Match:', pm.challengeId, '→', pm.expertId, 'Score:', pm.score);
    });

    // Create matches for top candidates
    for (const match of potentialMatches) {
      try {
        // Check if match already exists
        const existingMatches = await db.init().then(() => {
          return new Promise<Match[]>((resolve, reject) => {
            const transaction = (db as any).db!.transaction(['matches'], 'readonly');
            const store = transaction.objectStore('matches');
            const request = store.getAll();

            request.onsuccess = () => {
              const allMatches = request.result || [];
              const filtered = allMatches.filter((m: Match) => 
                m.challengeId === match.challengeId && 
                m.expertoId === match.expertId
              );
              resolve(filtered);
            };
            request.onerror = () => reject(request.error);
          });
        });

        if (existingMatches.length === 0) {
          // Get challenge to find empresaId
          const challenge = activeChallenges.find(c => c.id === match.challengeId);
          if (challenge) {
            console.log('Creating match:', {
              challenge: challenge.title,
              expert: match.expertId,
              score: match.score,
              status: 'potential'
            });
            await createMatch({
              challengeId: match.challengeId,
              empresaId: challenge.empresaId,
              expertoId: match.expertId,
              empresaInterested: false,
              expertoInterested: false,
              status: 'potential',
              matchScore: match.score,
            });
            result.matchesCreated++;
            console.log('Match created successfully');
          }
        } else {
          console.log('Match already exists, skipping');
        }
      } catch (error) {
        result.errors.push(`Error creando match: ${error}`);
      }
    }

    result.success = result.matchesCreated > 0;
    
  } catch (error) {
    result.success = false;
    result.errors.push(`Error en proceso de matching: ${error}`);
  }

  return result;
};
